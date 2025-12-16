"use strict";

import { TextureLoader } from "./texture-loader.js";

export const RENDER_CONTEXTS = {
    WEBGL2: "webgl2",
    WEBGPU: "webgpu"
};

const WEBGPU_UNIFORM_SIZE = 64;
const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };
const COMPUTE_TEXTURE_FORMATS = ["rgba8unorm"];
const UNIFORM_OFFSETS = {
    resolution: 0,
    time: 4,
    timeDelta: 5,
    frame: 6,
    frameRate: 7,
    mouse: 12
};

class WebGLRendererBackend
{
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.gl = canvas.getContext("webgl2");
        if (!this.gl)
        {
            throw new Error("No WebGL2 context available");
        }

        this.program = null;
        this.animationId = null;
        this.uniforms = {};
        this.frameCount = 0;
        this.channelUniforms = [];
        this.programVersion = 0;
        this.textureLoader = new TextureLoader(this.gl);
    }

    compileShader(source, type)
    {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(error);
        }
        return shader;
    }

    async updateShaders(sources)
    {
        const gl = this.gl;
        const vertSrc = sources.vertex;
        const fragSrc = sources.fragment;

        if (!vertSrc || !fragSrc)
        {
            throw new Error("Vertex and fragment shaders are required for WebGL");
        }

        const vs = this.compileShader(vertSrc, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);

        const newProgram = gl.createProgram();
        gl.attachShader(newProgram, vs);
        gl.attachShader(newProgram, fs);
        gl.linkProgram(newProgram);

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS))
        {
            const error = gl.getProgramInfoLog(newProgram);
            gl.deleteProgram(newProgram);
            throw new Error(error);
        }

        if (this.program)
        {
            gl.deleteProgram(this.program);
        }

        this.programVersion++;
        const version = this.programVersion;
        this.program = newProgram;

        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iTimeDelta: gl.getUniformLocation(newProgram, "iTimeDelta"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame"),
            iFrameRate: gl.getUniformLocation(newProgram, "iFrameRate"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse"),
        };

        this.detectChannelUniforms(newProgram);
        await this.prepareChannelTextures(version);

        this.frameCount = 0;

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    startRenderLoop()
    {
        const gl = this.gl;
        const canvas = this.canvas;

        let lastRenderTime = null;
        const render = (time) =>
        {
            if (!this.program)
            {
                this.animationId = requestAnimationFrame(render);
                return;
            }

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.program);

            const t = time * 0.001;
            let delta = 0.0;
            let frameRate = 0.0;
            if (lastRenderTime !== null)
            {
                delta = t - lastRenderTime;
                frameRate = delta > 0 ? 1.0 / delta : 0.0;
            }
            lastRenderTime = t;

            if (this.uniforms.iResolution)
            {
                gl.uniform3f(this.uniforms.iResolution, canvas.width, canvas.height, 1.0);
            }

            if (this.uniforms.iTime)
            {
                gl.uniform1f(this.uniforms.iTime, t);
            }
            if (this.uniforms.iTimeDelta)
            {
                gl.uniform1f(this.uniforms.iTimeDelta, delta);
            }

            if (this.uniforms.iFrame)
            {
                gl.uniform1i(this.uniforms.iFrame, this.frameCount);
            }
            if (this.uniforms.iFrameRate)
            {
                gl.uniform1f(this.uniforms.iFrameRate, frameRate);
            }

            if (this.uniforms.iMouse)
            {
                const m = this.mouse;
                const zSign = m.isDown ? 1 : -1;
                gl.uniform4f(this.uniforms.iMouse, m.x, m.y, m.clickX * zSign, m.clickY);
            }

            this.bindChannelTextures();
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            this.frameCount++;
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    stop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    detectChannelUniforms(program)
    {
        const gl = this.gl;
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        const channels = [null, null, null, null];

        for (let i = 0; i < uniformCount; i++)
        {
            const info = gl.getActiveUniform(program, i);
            if (!info)
            {
                continue;
            }

            const baseName = info.name.replace(/\[0\]$/, "");
            const match = baseName.match(/^iChannel([0-3])$/);
            if (!match)
            {
                continue;
            }

            const index = parseInt(match[1], 10);
            const type = info.type === gl.SAMPLER_CUBE ? "cube" : "2d";
            const location = gl.getUniformLocation(program, baseName);

            channels[index] = {
                index,
                name: baseName,
                type,
                location,
                texture: this.textureLoader.getFallback(type)
            };
        }

        this.channelUniforms = channels;
    }

    async prepareChannelTextures(version)
    {
        const loaders = [];
        for (const channel of this.channelUniforms)
        {
            if (!channel || !channel.location)
            {
                continue;
            }

            const loader = this.textureLoader.loadChannelTexture(channel.index, channel.type)
                .then((texture) =>
                {
                    if (version !== this.programVersion)
                    {
                        return;
                    }

                    channel.texture = texture || this.textureLoader.getFallback(channel.type);
                })
                .catch(() =>
                {
                    channel.texture = this.textureLoader.getFallback(channel.type);
                });

            loaders.push(loader);
        }

        await Promise.all(loaders);
    }

    bindChannelTextures()
    {
        const gl = this.gl;

        for (const channel of this.channelUniforms)
        {
            if (!channel || !channel.location)
            {
                continue;
            }

            const textureUnit = channel.index;
            const isCube = channel.type === "cube";
            const target = isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
            const texture = channel.texture || this.textureLoader.getFallback(channel.type);

            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(target, texture);
            gl.uniform1i(channel.location, textureUnit);
        }
    }

    handleResize()
    {
        // WebGL viewport is set every frame; no-op here.
    }
}

class WebGPURendererBackend
{
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;

        this.device = null;
        this.adapter = null;
        this.context = null;
        this.format = null;
        this.renderPipeline = null;
        this.computePipeline = null;
        this.renderBindGroup = null;
        this.computeBindGroup = null;
        this.computeTexture = null;
        this.computeTextureView = null;
        this.computeSampler = null;
        this.computeTextureFormat = null;
        this.computeTextureSize = { width: 0, height: 0 };
        this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };

        this.uniformBuffer = null;
        this.animationId = null;
        this.frameCount = 0;
        this.lastRenderTime = null;

        this.uniformBufferSize = WEBGPU_UNIFORM_SIZE;
        this.uniformBufferData = new ArrayBuffer(this.uniformBufferSize);
        this.uniformFloatView = new Float32Array(this.uniformBufferData);
        this.uniformUintView = new Uint32Array(this.uniformBufferData);
    }

    async init()
    {
        if (typeof navigator === "undefined" || !navigator.gpu)
        {
            throw new Error("WebGPU is not supported in this browser");
        }

        this.adapter = this.adapter || await navigator.gpu.requestAdapter();
        if (!this.adapter)
        {
            throw new Error("WebGPU adapter unavailable");
        }

        this.device = this.device || await this.adapter.requestDevice();
        this.context = this.canvas.getContext("webgpu");
        if (!this.context)
        {
            throw new Error("Unable to create WebGPU context");
        }

        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.configureContext();

        if (!this.uniformBuffer)
        {
            this.uniformBuffer = this.device.createBuffer({
                size: this.uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }
    }

    configureContext()
    {
        if (!this.context || !this.device || !this.format)
        {
            return;
        }

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });
    }

    stop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleResize()
    {
        this.configureContext();
        if (this.computePipeline)
        {
            const targetChanged = this.ensureComputeTarget();
            if (targetChanged)
            {
                this.buildBindGroups(true);
            }
        }
    }

    isLikelyGLSL(source)
    {
        const glslMarkers = [
            /^\s*#version/m,
            /\bprecision\s+(?:lowp|mediump|highp)\b/,
            /\blayout\s*\(/,
            /\bgl_(FragCoord|Position|VertexID|InstanceID)\b/,
            /\bsampler2D\b/
        ];
        return glslMarkers.some((rx) => rx.test(source));
    }

    validateWGSLSource(source, label)
    {
        if (this.isLikelyGLSL(source))
        {
            throw new Error(`${label} looks like GLSL. WebGPU expects WGSL with @vertex/@fragment/@compute entry points. Switch to WebGL2 or update the shader to WGSL.`);
        }
    }

    getEntryPoint(source, stage)
    {
        const regex = stage === "vertex"
            ? /@vertex\s+fn\s+(\w+)/m
            : stage === "fragment"
                ? /@fragment\s+fn\s+(\w+)/m
                : /@compute\s+fn\s+(\w+)/m;
        const match = source.match(regex);
        return match ? match[1] : null;
    }

    async validateModule(module, label)
    {
        const getInfo = module.compilationInfo || module.getCompilationInfo;
        if (!getInfo)
        {
            // Older implementations might not expose compilation info; skip validation.
            return;
        }

        const info = await getInfo.call(module);
        const errors = info.messages.filter(m => m.type === "error");
        if (errors.length > 0)
        {
            const messages = errors.map(m => `${label}: ${m.message}`).join("\n");
            throw new Error(messages);
        }
    }

    async createShaderModule(code, label)
    {
        const module = this.device.createShaderModule({ code, label });
        await this.validateModule(module, label);
        return module;
    }

    extractWorkgroupSize(source)
    {
        const match = source.match(/@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+))?\s*(?:,\s*(\d+))?\s*\)/i);
        if (!match)
        {
            return { ...DEFAULT_WORKGROUP_SIZE };
        }

        const [, x, y, z] = match;
        return {
            x: parseInt(x, 10) || DEFAULT_WORKGROUP_SIZE.x,
            y: parseInt(y || "1", 10) || DEFAULT_WORKGROUP_SIZE.y,
            z: parseInt(z || "1", 10) || DEFAULT_WORKGROUP_SIZE.z
        };
    }

    destroyComputeTarget()
    {
        if (this.computeTexture)
        {
            this.computeTexture.destroy();
        }
        this.computeTexture = null;
        this.computeTextureView = null;
        this.computeSampler = null;
        this.computeTextureSize = { width: 0, height: 0 };
    }

    ensureComputeTarget()
    {
        const width = Math.max(1, Math.floor(this.canvas.width));
        const height = Math.max(1, Math.floor(this.canvas.height));

        if (this.computeTexture &&
            this.computeTextureSize.width === width &&
            this.computeTextureSize.height === height)
        {
            return false;
        }

        this.destroyComputeTarget();

        let texture = null;
        let formatInUse = this.computeTextureFormat || COMPUTE_TEXTURE_FORMATS[0];
        const formats = this.computeTextureFormat
            ? [this.computeTextureFormat, ...COMPUTE_TEXTURE_FORMATS.filter(f => f !== this.computeTextureFormat)]
            : COMPUTE_TEXTURE_FORMATS;

        for (const format of formats)
        {
            try
            {
                texture = this.device.createTexture({
                    size: { width, height },
                    format,
                    usage: GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.STORAGE_BINDING
                });
                formatInUse = format;
                break;
            }
            catch (err)
            {
                console.warn(`Failed to allocate compute texture (${format}):`, err);
            }
        }

        if (!texture)
        {
            throw new Error("Unable to allocate storage texture for compute pass");
        }

        this.computeTexture = texture;
        this.computeTextureView = texture.createView();
        this.computeSampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear"
        });
        this.computeTextureFormat = formatInUse;
        this.computeTextureSize = { width, height };
        return true;
    }

    buildBindGroups(includeCompute)
    {
        // Bind group 0 is shared: binding 0 = uniforms, binding 1 = compute storage texture,
        // binding 2 = sampled compute texture view, binding 3 = sampler (when the fragment shader opts in).
        const renderLayout = this.renderPipeline.getBindGroupLayout(0);
        const baseRenderEntries = [
            {
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            }
        ];

        const renderEntries = [...baseRenderEntries];

        if (includeCompute)
        {
            this.ensureComputeTarget();
            renderEntries.push(
                { binding: 2, resource: this.computeTextureView },
                { binding: 3, resource: this.computeSampler }
            );
        }

        const createRenderGroup = (entries) => this.device.createBindGroup({
            layout: renderLayout,
            entries
        });

        try
        {
            this.renderBindGroup = createRenderGroup(renderEntries);
        }
        catch (err)
        {
            if (includeCompute)
            {
                console.warn("Render pipeline does not consume compute texture; using uniform-only bind group.", err);
                this.renderBindGroup = createRenderGroup(baseRenderEntries);
            }
            else
            {
                throw err;
            }
        }

        if (includeCompute && this.computePipeline)
        {
            const computeLayout = this.computePipeline.getBindGroupLayout(0);
            this.computeBindGroup = this.device.createBindGroup({
                layout: computeLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: this.computeTextureView }
                ]
            });
        }
        else
        {
            this.computeBindGroup = null;
        }
    }

    async updateShaders(sources)
    {
        await this.init();
        this.stop();

        const vertexSource = (sources.vertex || "").trim();
        const fragmentSource = (sources.fragment || "").trim();
        const computeSource = (sources.compute || "").trim();
        const includeCompute = computeSource.length > 0;

        if (!vertexSource || !fragmentSource)
        {
            throw new Error("WebGPU requires WGSL vertex and fragment shaders");
        }

        this.validateWGSLSource(vertexSource, "Vertex shader");
        this.validateWGSLSource(fragmentSource, "Fragment shader");
        if (includeCompute)
        {
            this.validateWGSLSource(computeSource, "Compute shader");
        }

        const [vertexModule, fragmentModule, computeModule] = await Promise.all([
            this.createShaderModule(vertexSource, "Vertex shader"),
            this.createShaderModule(fragmentSource, "Fragment shader"),
            includeCompute ? this.createShaderModule(computeSource, "Compute shader") : Promise.resolve(null)
        ]);

        const vertexEntry = this.getEntryPoint(vertexSource, "vertex");
        const fragmentEntry = this.getEntryPoint(fragmentSource, "fragment");
        const computeEntry = includeCompute ? this.getEntryPoint(computeSource, "compute") : null;
        if (!vertexEntry || !fragmentEntry)
        {
            throw new Error("WGSL shaders must declare @vertex and @fragment entry points");
        }
        if (includeCompute && !computeEntry)
        {
            throw new Error("Compute shader must declare @compute entry point");
        }

        this.renderPipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: vertexModule,
                entryPoint: vertexEntry
            },
            fragment: {
                module: fragmentModule,
                entryPoint: fragmentEntry,
                targets: [{ format: this.format }]
            },
            primitive: { topology: "triangle-list" }
        });

        if (includeCompute && computeModule)
        {
            this.computePipeline = this.device.createComputePipeline({
                layout: "auto",
                compute: { module: computeModule, entryPoint: computeEntry }
            });
            this.workgroupSize = this.extractWorkgroupSize(computeSource);
            this.ensureComputeTarget();
        }
        else
        {
            this.computePipeline = null;
            this.destroyComputeTarget();
            this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };
        }

        this.buildBindGroups(includeCompute);

        this.frameCount = 0;
        this.lastRenderTime = null;

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    updateUniforms(timeSeconds, deltaSeconds)
    {
        const canvas = this.canvas;
        const m = this.mouse;
        const zSign = m.isDown ? 1 : -1;

        this.uniformFloatView[UNIFORM_OFFSETS.resolution + 0] = canvas.width;
        this.uniformFloatView[UNIFORM_OFFSETS.resolution + 1] = canvas.height;
        this.uniformFloatView[UNIFORM_OFFSETS.resolution + 2] = 1.0;
        this.uniformFloatView[UNIFORM_OFFSETS.resolution + 3] = 0.0;

        this.uniformFloatView[UNIFORM_OFFSETS.time] = timeSeconds;
        this.uniformFloatView[UNIFORM_OFFSETS.timeDelta] = deltaSeconds;
        this.uniformUintView[UNIFORM_OFFSETS.frame] = this.frameCount;

        const frameRate = deltaSeconds > 0 ? 1.0 / deltaSeconds : 0.0;
        this.uniformFloatView[UNIFORM_OFFSETS.frameRate] = frameRate;

        this.uniformFloatView[8] = 0.0;
        this.uniformFloatView[9] = 0.0;
        this.uniformFloatView[10] = 0.0;
        this.uniformFloatView[11] = 0.0;

        this.uniformFloatView[UNIFORM_OFFSETS.mouse + 0] = m.x;
        this.uniformFloatView[UNIFORM_OFFSETS.mouse + 1] = m.y;
        this.uniformFloatView[UNIFORM_OFFSETS.mouse + 2] = m.clickX * zSign;
        this.uniformFloatView[UNIFORM_OFFSETS.mouse + 3] = m.clickY;

        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformBufferData);
    }

    startRenderLoop()
    {
        const render = (time) =>
        {
            if (!this.renderPipeline || !this.context)
            {
                this.animationId = requestAnimationFrame(render);
                return;
            }

            const t = time * 0.001;
            let delta = 0.0;
            if (this.lastRenderTime !== null)
            {
                delta = t - this.lastRenderTime;
            }
            this.lastRenderTime = t;

            this.updateUniforms(t, delta);

            const encoder = this.device.createCommandEncoder();

            if (this.computePipeline && this.computeBindGroup)
            {
                const computeChanged = this.ensureComputeTarget();
                if (computeChanged)
                {
                    this.buildBindGroups(true);
                }

                const computePass = encoder.beginComputePass();
                computePass.setPipeline(this.computePipeline);
                computePass.setBindGroup(0, this.computeBindGroup);

                const groupsX = Math.max(1, Math.ceil(this.computeTextureSize.width / this.workgroupSize.x));
                const groupsY = Math.max(1, Math.ceil(this.computeTextureSize.height / this.workgroupSize.y));

                computePass.dispatchWorkgroups(groupsX, groupsY, this.workgroupSize.z || 1);
                computePass.end();
            }

            const textureView = this.context.getCurrentTexture().createView();

            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: textureView,
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ]
            });

            pass.setPipeline(this.renderPipeline);
            if (this.renderBindGroup)
            {
                pass.setBindGroup(0, this.renderBindGroup);
            }
            pass.draw(3, 1, 0, 0);
            pass.end();

            this.device.queue.submit([encoder.finish()]);
            this.frameCount++;
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }
}

export class ShaderRenderer
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.contextType = RENDER_CONTEXTS.WEBGL2;
        this.activeRenderer = null;
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.canvasChangeHandler = null;

        this.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
        this.removeMouseListeners = null;
        this.setupMouseEvents();
    }

    getCanvas()
    {
        return this.canvas;
    }

    setCanvas(canvas)
    {
        this.stop();
        this.canvas = canvas;
        this.mouse.isDown = false;
        this.mouse.x = 0;
        this.mouse.y = 0;
        this.mouse.clickX = 0;
        this.mouse.clickY = 0;
        this.setupMouseEvents();
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.activeRenderer = null;
    }

    setCanvasChangeHandler(handler)
    {
        this.canvasChangeHandler = handler;
    }

    recreateCanvas()
    {
        const oldCanvas = this.canvas;
        if (!oldCanvas || !oldCanvas.parentNode)
        {
            return oldCanvas;
        }

        const newCanvas = oldCanvas.cloneNode(false);
        newCanvas.id = oldCanvas.id;
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
        this.setCanvas(newCanvas);

        if (typeof this.canvasChangeHandler === "function")
        {
            this.canvasChangeHandler(newCanvas);
        }

        return newCanvas;
    }

    async setContext(contextType)
    {
        if (!contextType)
        {
            return;
        }

        const switchingType = this.contextType !== contextType;
        if (!switchingType && this.activeRenderer)
        {
            return;
        }

        this.stop();
        const previousContext = this.contextType;
        this.contextType = contextType;

        try
        {
            if (switchingType)
            {
                this.recreateCanvas();
            }

            if (contextType === RENDER_CONTEXTS.WEBGPU)
            {
                const renderer = new WebGPURendererBackend(this.canvas, this.mouse);
                await renderer.init();
                this.webgpuRenderer = renderer;
                this.activeRenderer = renderer;
            }
            else
            {
                const renderer = new WebGLRendererBackend(this.canvas, this.mouse);
                this.webglRenderer = renderer;
                this.activeRenderer = renderer;
            }
        }
        catch (err)
        {
            this.activeRenderer = null;
            this.contextType = previousContext;
            throw err;
        }
    }

    getContextType()
    {
        return this.contextType;
    }

    async updateShaders(sources)
    {
        if (!this.activeRenderer)
        {
            await this.setContext(this.contextType);
        }

        if (!this.activeRenderer)
        {
            throw new Error("Renderer not ready");
        }

        await this.activeRenderer.updateShaders(sources);
    }

    handleResize()
    {
        if (this.activeRenderer && typeof this.activeRenderer.handleResize === "function")
        {
            this.activeRenderer.handleResize();
        }
    }

    stop()
    {
        if (this.activeRenderer && typeof this.activeRenderer.stop === "function")
        {
            this.activeRenderer.stop();
        }
    }

    setupMouseEvents()
    {
        if (this.removeMouseListeners)
        {
            this.removeMouseListeners();
        }

        const canvas = this.canvas;

        const getMousePos = (e) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: canvas.height - (e.clientY - rect.top) * scaleY
            };
        };

        const onMouseDown = (e) =>
        {
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
            this.mouse.clickX = pos.x;
            this.mouse.clickY = pos.y;
            this.mouse.isDown = true;
        };

        const onMouseMove = (e) =>
        {
            if (this.mouse.isDown)
            {
                const pos = getMousePos(e);
                this.mouse.x = pos.x;
                this.mouse.y = pos.y;
            }
        };

        const onMouseUp = () =>
        {
            this.mouse.isDown = false;
        };

        const onMouseLeave = () =>
        {
            this.mouse.isDown = false;
        };

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave);

        this.removeMouseListeners = () =>
        {
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseleave", onMouseLeave);
        };
    }
}
