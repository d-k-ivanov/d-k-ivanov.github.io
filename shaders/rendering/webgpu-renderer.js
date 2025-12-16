"use strict";

import { BaseRenderer } from "./base-renderer.js";
import { SamplerState } from "./sampler-state.js";
import { createUniformViews, WEBGPU_UNIFORM_BUFFER_SIZE } from "./uniform-state.js";

const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };
const COMPUTE_TEXTURE_FORMATS = ["rgba8unorm"];
const FONT_TEXTURE_URL = "./textures/iChannel0.png";
const FONT_TEXTURE_BINDING = 4;
const FONT_SAMPLER_BINDING = 5;

export class WebGPURenderer extends BaseRenderer
{
    constructor(canvas, mouse)
    {
        super(canvas, mouse);
        this.device = null;
        this.adapter = null;
        this.context = null;
        this.format = null;
        this.renderPipeline = null;
        this.computePipeline = null;
        this.renderBindGroup = null;
        this.computeBindGroup = null;
        this.computeTexture = null;
        this.computeTextureSampleView = null;
        this.computeTextureStorageView = null;
        this.computeSampler = null;
        this.computeTextureFormat = null;
        this.computeTextureSize = { width: 0, height: 0 };
        this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };
        this.useComputeTextureSampling = false;
        this.fontTexture = null;
        this.fontTextureView = null;
        this.fontSampler = null;
        this.needsFontTexture = false;

        this.samplers = new SamplerState();
        this.uniformBuffer = null;
        const views = createUniformViews(WEBGPU_UNIFORM_BUFFER_SIZE);
        this.uniformBufferSize = WEBGPU_UNIFORM_BUFFER_SIZE;
        this.uniformBufferData = views.buffer;
        this.uniformFloatView = views.floatView;
        this.uniformUintView = views.uintView;
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
        super.stop();
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
        const attr = stage === "vertex" ? "@vertex"
            : stage === "fragment" ? "@fragment"
                : "@compute";
        const regex = new RegExp(`${attr}[\\s\\S]*?fn\\s+(\\w+)`, "m");
        const match = regex.exec(source);
        return match ? match[1] : null;
    }

    async validateModule(module, label)
    {
        const getInfo = module.compilationInfo || module.getCompilationInfo;
        if (!getInfo)
        {
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
        this.computeTextureSampleView = null;
        this.computeTextureStorageView = null;
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
        this.computeTextureSampleView = texture.createView();
        this.computeTextureStorageView = texture.createView();
        this.computeSampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear"
        });
        this.computeTextureFormat = formatInUse;
        this.computeTextureSize = { width, height };
        return true;
    }

    refreshSamplerBindings(includeCompute)
    {
        this.samplers.reset();

        if (includeCompute && this.useComputeTextureSampling)
        {
            this.ensureComputeTarget();
            this.samplers.setNamed("computeSample", {
                binding: 2,
                samplerBinding: 3,
                textureView: this.computeTextureSampleView,
                sampler: this.computeSampler
            });
        }

        if (this.needsFontTexture && this.fontTextureView && this.fontSampler)
        {
            this.samplers.setNamed("fontTexture", {
                binding: FONT_TEXTURE_BINDING,
                samplerBinding: FONT_SAMPLER_BINDING,
                textureView: this.fontTextureView,
                sampler: this.fontSampler
            });
        }
    }

    buildBindGroups(includeCompute)
    {
        this.refreshSamplerBindings(includeCompute);

        const renderLayout = this.renderPipeline.getBindGroupLayout(0);
        const baseRenderEntries = [
            {
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            }
        ];

        if (includeCompute)
        {
            this.ensureComputeTarget();
        }

        const renderEntries = [...baseRenderEntries];

        for (const sampler of this.samplers.getNamedEntries())
        {
            if (sampler.binding !== undefined && sampler.textureView)
            {
                renderEntries.push({ binding: sampler.binding, resource: sampler.textureView });
            }
            if (sampler.samplerBinding !== undefined && sampler.sampler)
            {
                renderEntries.push({ binding: sampler.samplerBinding, resource: sampler.sampler });
            }
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
                    { binding: 1, resource: this.computeTextureStorageView }
                ]
            });
        }
        else
        {
            this.computeBindGroup = null;
        }
    }

    fragmentUsesComputeTexture(source)
    {
        if (!source)
        {
            return false;
        }
        const hasBinding = /@binding\s*\(\s*2\s*\)/.test(source);
        const mentionsTexture = /\bcomputeTexture\b/.test(source);
        return hasBinding || mentionsTexture;
    }

    fragmentUsesFontTexture(source)
    {
        if (!source)
        {
            return false;
        }
        const hasBinding = new RegExp(`@binding\\s*\\(\\s*${FONT_TEXTURE_BINDING}\\s*\\)`).test(source);
        const mentionsName = /\biChannel0\b/.test(source);
        return hasBinding || mentionsName;
    }

    async loadFontTexture()
    {
        if (this.fontTextureView && this.fontSampler)
        {
            return;
        }

        const response = await fetch(FONT_TEXTURE_URL);
        if (!response.ok)
        {
            throw new Error(`Failed to load font texture: ${FONT_TEXTURE_URL}`);
        }

        const blob = await response.blob();
        const image = await createImageBitmap(blob);

        const texture = this.device.createTexture({
            size: { width: image.width, height: image.height },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.device.queue.copyExternalImageToTexture(
            { source: image },
            { texture },
            { width: image.width, height: image.height }
        );

        this.fontTexture = texture;
        this.fontTextureView = texture.createView();
        this.fontSampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge"
        });
    }

    async updateShaders(sources)
    {
        await this.init();
        this.stop();

        const vertexSource = (sources.vertex || "").trim();
        const fragmentSource = (sources.fragment || "").trim();
        const computeSource = (sources.compute || "").trim();
        const includeCompute = computeSource.length > 0;
        this.useComputeTextureSampling = includeCompute && this.fragmentUsesComputeTexture(fragmentSource);
        this.needsFontTexture = this.fragmentUsesFontTexture(fragmentSource);

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

        if (this.needsFontTexture)
        {
            await this.loadFontTexture();
        }

        this.buildBindGroups(includeCompute);
        this.resetFrameState();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    startRenderLoop()
    {
        if (this.animationId)
        {
            return;
        }

        const render = (time) =>
        {
            if (!this.renderPipeline || !this.context)
            {
                this.requestFrame(render);
                return;
            }

            const frameData = this.uniformState.nextFrame(time);
            this.uniformState.writeToViews(this.uniformFloatView, this.uniformUintView, frameData);
            this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformBufferData);

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
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }
}
