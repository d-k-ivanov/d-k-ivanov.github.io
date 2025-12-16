"use strict";

import { TextureLoader } from "./texture-loader.js";

export const RENDER_CONTEXTS = {
    WEBGL2: "webgl2",
    WEBGPU: "webgpu"
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
        this.pipeline = null;
        this.uniformBuffer = null;
        this.uniformBindGroup = null;
        this.animationId = null;
        this.frameCount = 0;
        this.lastRenderTime = null;

        this.uniformBufferSize = 64;
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
    }

    isLikelyGLSL(source)
    {
        const glslMarkers = [
            /^\s*#version/m,
            /\bprecision\s+(?:lowp|mediump|highp)\b/,
            /\blayout\s*\(/,
            /\bvoid\s+main\s*\(/,
            /\bsampler2D\b/,
            /\buniform\s+\w+/
        ];
        return glslMarkers.some((rx) => rx.test(source));
    }

    validateWGSLSource(source, label)
    {
        if (this.isLikelyGLSL(source))
        {
            throw new Error(`${label} looks like GLSL. WebGPU expects WGSL with @vertex/@fragment entry points. Switch to WebGL2 or update the shader to WGSL.`);
        }
    }

    getEntryPoint(source, stage)
    {
        const regex = stage === "vertex"
            ? /@vertex\s+fn\s+(\w+)/m
            : /@fragment\s+fn\s+(\w+)/m;
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

    async compileExtras(sources)
    {
        const entries = Object.entries(sources).filter(([key]) => key !== "vertex" && key !== "fragment");
        for (const [key, code] of entries)
        {
            if (!code || !code.trim())
            {
                continue;
            }

            const module = this.device.createShaderModule({ code });
            await this.validateModule(module, `${key} shader`);
        }
    }

    async updateShaders(sources)
    {
        await this.init();
        this.stop();

        const vertSource = sources.vertex || "";
        const fragSource = sources.fragment || "";
        if (!vertSource.trim() || !fragSource.trim())
        {
            throw new Error("WebGPU requires WGSL vertex and fragment shaders");
        }

        this.validateWGSLSource(vertSource, "Vertex shader");
        this.validateWGSLSource(fragSource, "Fragment shader");

        const vertexModule = this.device.createShaderModule({ code: vertSource });
        const fragmentModule = this.device.createShaderModule({ code: fragSource });

        await Promise.all([
            this.validateModule(vertexModule, "Vertex shader"),
            this.validateModule(fragmentModule, "Fragment shader"),
            this.compileExtras(sources)
        ]);

        const vertexEntry = this.getEntryPoint(vertSource, "vertex");
        const fragmentEntry = this.getEntryPoint(fragSource, "fragment");
        if (!vertexEntry || !fragmentEntry)
        {
            throw new Error("WGSL shaders must declare @vertex and @fragment entry points");
        }

        this.pipeline = this.device.createRenderPipeline({
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

        this.uniformBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.uniformBuffer }
                }
            ]
        });

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

        this.uniformFloatView[0] = canvas.width;
        this.uniformFloatView[1] = canvas.height;
        this.uniformFloatView[2] = 1.0;
        this.uniformFloatView[3] = 0.0; // padding after vec3<f32>

        this.uniformFloatView[4] = timeSeconds;     // iTime
        this.uniformFloatView[5] = deltaSeconds;    // iTimeDelta
        this.uniformUintView[6] = this.frameCount;  // iFrame

        const frameRate = deltaSeconds > 0 ? 1.0 / deltaSeconds : 0.0;
        this.uniformFloatView[7] = frameRate;       // iFrameRate

        // _padding1 (vec2f) starts at offset 32 (float indices 8-9)
        this.uniformFloatView[8] = 0.0;
        this.uniformFloatView[9] = 0.0;
        // Padding between vec2f and vec4f (float indices 10-11)
        this.uniformFloatView[10] = 0.0;
        this.uniformFloatView[11] = 0.0;

        this.uniformFloatView[12] = m.x;                   // iMouse.x (offset 48)
        this.uniformFloatView[13] = m.y;                   // iMouse.y (offset 52)
        this.uniformFloatView[14] = m.clickX * zSign;      // iMouse.z (offset 56)
        this.uniformFloatView[15] = m.clickY;              // iMouse.w (offset 60)

        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformBufferData);
    }

    startRenderLoop()
    {
        const render = (time) =>
        {
            if (!this.pipeline || !this.context)
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

            pass.setPipeline(this.pipeline);
            if (this.uniformBindGroup)
            {
                pass.setBindGroup(0, this.uniformBindGroup);
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
