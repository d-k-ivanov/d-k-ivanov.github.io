"use strict";

import { BaseRenderer } from "./BaseRenderer.js";
import { SamplerState } from "./SamplerState.js";
import { ShaderUniformState } from "./ShaderUniformState.js";

const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };
const DEFAULT_VERTEX_COUNT = 3;
const DEFAULT_GRID_SIZE = 1;

// Binting indices:
const BINDING_INDEX_UNIFORM = 0;
const BINDING_INDEX_STORAGE = 1;

const BINDING_INDEX_ICHANNEL_0 = 10;
const BINDING_INDEX_ICHANNEL_0_SAMPLER = 11;
const BINDING_INDEX_ICHANNEL_1 = 12;
const BINDING_INDEX_ICHANNEL_1_SAMPLER = 13;
const BINDING_INDEX_ICHANNEL_2 = 14;
const BINDING_INDEX_ICHANNEL_2_SAMPLER = 15;
const BINDING_INDEX_ICHANNEL_3 = 16;
const BINDING_INDEX_ICHANNEL_4_SAMPLER = 17;


const COMPUTE_TEXTURE_FORMATS = ["rgba8unorm"];
const FONT_TEXTURE_URL = "./textures/iChannel0.png";
const FONT_TEXTURE_BINDING = 4;
const FONT_SAMPLER_BINDING = 5;

/**
 * WebGPU renderer backend supporting render and optional compute pipelines.
 */
export class WebGPURenderer extends BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - render target.
     * @param {object} mouse - shared mouse state.
     */
    constructor(canvas, mouse)
    {
        super(canvas, mouse);
        this.device = null;
        this.adapter = null;
        this.context = null;
        this.format = null;

        this.bindings = new Set();
        this.vertexCount = DEFAULT_VERTEX_COUNT;

        // Buffers
        this.uniformBuffer = null;
        this.uniformBufferSize = ShaderUniformState.BUFFER_SIZE;
        this.uniformViews = this.uniformState.getViews();

        this.renderPipeline = null;
        this.computePipeline = null;

        this.renderBindGroup = null;
        this.computeBindGroup = null;

        this.computeTexture = null;
        this.computeTextureSampleView = null;
        this.computeTextureStorageView = null;
        this.computeTextureFormat = null;
        this.computeTextureSize = { width: 0, height: 0 };

        this.samplers = new SamplerState();

        this.computeSampler = null;
        this.fontSampler = null;

        this.useComputeTextureSampling = false;
        this.fontTexture = null;
        this.fontTextureView = null;
        this.needsFontTexture = false;

        this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };
        this.gridSize = DEFAULT_GRID_SIZE;
    }

    /**
     * Requests adapter/device, configures context, and allocates uniform buffer.
     */
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

    /**
     * Configures the WebGPU canvas context.
     */
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

    /**
     * Reconfigures context and compute targets on resize.
     */
    handleResize()
    {
        this.configureContext();
        if (this.computePipeline)
        {
            const targetChanged = this.ensureComputeTarget();
            if (targetChanged)
            {
                this.buildBindGroups();
            }
        }
    }

    /**
     * Detects GLSL markers to guard against misusing WGSL path.
     */
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

    /**
     * Throws if the WGSL source appears to be GLSL.
     */
    validateWGSLSource(source, label)
    {
        if (this.isLikelyGLSL(source))
        {
            throw new Error(`${label} looks like GLSL. WebGPU expects WGSL with @vertex/@fragment/@compute entry points. Switch to WebGL2 or update the shader to WGSL.`);
        }
    }

    /**
     * Extracts an entry point name for the given shader stage.
     */
    getEntryPoint(source, stage)
    {
        const attr = stage === "vertex" ? "@vertex"
            : stage === "fragment" ? "@fragment"
                : "@compute";
        const regex = new RegExp(`${attr}[\\s\\S]*?fn\\s+(\\w+)`, "m");
        const match = regex.exec(source);
        return match ? match[1] : null;
    }

    /**
     * Validates compiled shader module and reports errors.
     */
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

    /**
     * Creates and validates a GPUShaderModule from WGSL code.
     */
    async createShaderModule(code, label)
    {
        const module = this.device.createShaderModule({ code, label });
        await this.validateModule(module, label);
        return module;
    }

    /**
     * Parses all @binding entries and populates this.bindings set.
     */
    extractBindings(source)
    {
        this.bindings.clear();
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(source)) !== null)
        {
            const bindingIndex = parseInt(match[1], 10);
            console.log(`Detected binding index: ${bindingIndex}`);
            this.bindings.add(bindingIndex);
        }
    }

    /**
     * Parses @workgroup_size, falling back to defaults.
     */
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

    /**
     * Extracts VERTEX_COUNT constant from any provided WGSL sources.
     */
    extractVertexCount(sources)
    {
        const regex = /const\s+VERTEX_COUNT[^=]*=\s*([0-9]+)\s*u?/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }

            const match = regex.exec(source);
            if (match)
            {
                const parsed = parseInt(match[1], 10);
                if (!Number.isNaN(parsed) && parsed > 0)
                {
                    return parsed;
                }
            }
        }

        return DEFAULT_VERTEX_COUNT;
    }

    /**
     * Extracts GRID_SIZE constant from any provided WGSL sources.
     */
    extractGridSize(sources)
    {
        const regex = /const\s+GRID_SIZE[^=]*=\s*([0-9]+)\s*u?/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }

            const match = regex.exec(source);
            if (match)
            {
                const parsed = parseInt(match[1], 10);
                if (!Number.isNaN(parsed) && parsed > 0)
                {
                    return parsed;
                }
            }
        }

        return DEFAULT_GRID_SIZE;
    }

    /**
     * Releases compute-texture resources.
     */
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

    /**
     * Allocates or reuses a compute texture matching canvas size.
     */
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

    /**
     * Resets sampler state for compute/font bindings prior to bind-group creation.
     */
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

    /**
     * Creates bind groups for render and compute pipelines.
     */
    buildBindGroups()
    {
        this.refreshSamplerBindings(/*includeCompute*/ true);

        const renderLayout = this.renderPipeline.getBindGroupLayout(0);
        const baseRenderEntries = [
            {
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            }
        ];

        this.ensureComputeTarget();

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
            console.warn("Render pipeline does not consume compute texture; using uniform-only bind group.", err);
            this.renderBindGroup = createRenderGroup(baseRenderEntries);
        }

        if (this.computePipeline)
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

    /**
     * Checks if the fragment shader expects the compute texture.
     */
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

    /**
     * Checks if the fragment shader requests the font atlas bindings.
     */
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

    /**
     * Loads and uploads the font atlas texture/sampler.
     */
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

    /**
     * Builds render/compute pipelines from WGSL sources and starts rendering.
     */
    async updateShaders(sources)
    {
        await this.init();
        this.stop();

        const vertexSource = (sources.vertex || "").trim();
        const fragmentSource = (sources.fragment || "").trim();
        const computeSource = (sources.compute || "").trim();

        this.extractBindings([vertexSource, fragmentSource, computeSource]);

        this.vertexCount = this.extractVertexCount([vertexSource, fragmentSource, computeSource]);

        this.gridSize = this.extractGridSize([vertexSource, fragmentSource, computeSource]);

        this.useComputeTextureSampling = this.fragmentUsesComputeTexture(fragmentSource);
        this.needsFontTexture = this.fragmentUsesFontTexture(fragmentSource);

        if (!vertexSource || !fragmentSource)
        {
            throw new Error("WebGPU requires WGSL vertex and fragment shaders");
        }

        this.validateWGSLSource(vertexSource, "Vertex shader");
        this.validateWGSLSource(fragmentSource, "Fragment shader");
        this.validateWGSLSource(computeSource, "Compute shader");

        const [vertexModule, fragmentModule, computeModule] = await Promise.all([
            this.createShaderModule(vertexSource, "Vertex shader"),
            this.createShaderModule(fragmentSource, "Fragment shader"),
            this.createShaderModule(computeSource, "Compute shader")
        ]);

        const vertexEntry = this.getEntryPoint(vertexSource, "vertex");
        const fragmentEntry = this.getEntryPoint(fragmentSource, "fragment");
        const computeEntry = this.getEntryPoint(computeSource, "compute");
        if (!vertexEntry || !fragmentEntry)
        {
            throw new Error("WGSL shaders must declare @vertex and @fragment entry points");
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

        if (computeModule && computeEntry)
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

        this.buildBindGroups();
        this.resetFrameState();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    /**
     * Begins the WebGPU render loop with optional compute pass.
     */
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

            this.uniformState.nextFrame(time);
            this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformViews.buffer);

            const encoder = this.device.createCommandEncoder();

            if (this.computePipeline && this.computeBindGroup)
            {
                const computeChanged = this.ensureComputeTarget();
                if (computeChanged)
                {
                    this.buildBindGroups();
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
            // The number of vertices is shader-dependent
            // For a full-screen triangle, use 3 vertices
            // For a full-screen quad, use 6 vertices
            // Adjust as needed based on the vertex shader implementation
            // Shaders like game_of_life_01 may require 6 vertices
            const instances = Math.max(1, this.gridSize || DEFAULT_GRID_SIZE);
            pass.draw(this.vertexCount, instances * instances, 0, 0);
            pass.end();

            this.device.queue.submit([encoder.finish()]);
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }
}
