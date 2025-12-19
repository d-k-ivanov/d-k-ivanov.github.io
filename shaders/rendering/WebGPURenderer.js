"use strict";

import { BaseRenderer } from "./BaseRenderer.js";
import { ShaderUniformState } from "./ShaderUniformState.js";

const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };
const DEFAULT_VERTEX_COUNT = 3;
const DEFAULT_GRID_SIZE = 1;

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

        this.bindingsRender = new Set();
        this.bindingsCompute = new Set();
        this.vertexCount = DEFAULT_VERTEX_COUNT;

        this.renderPipeline = null;
        this.computePipeline = null;

        // Buffers
        this.uniformBuffer = null;
        this.uniformBufferSize = ShaderUniformState.BUFFER_SIZE;
        this.uniformViews = this.uniformState.getViews();

        // Channels
        this.channelUrls = [null, null, null, null];

        this.renderBindGroup = null;
        this.computeBindGroup = null;

        this.computeWidth = 0;
        this.computeHeight = 0;
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
     * @stage "vertex" | "fragment" | "compute"
     */
    getEntryPoint(source, stage)
    {
        let allowedStages = ["vertex", "fragment", "compute"];
        if (!allowedStages.includes(stage))
        {
            throw new Error(`Invalid shader stage: ${stage}`);
        }

        const regex = new RegExp(`@${stage}[\\s\\S]*?fn\\s+(\\w+)`, "m");
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
     * Parses all @binding entries and populates this.bindingsRender set.
     */
    extractBindingsRender(source)
    {
        this.bindingsRender.clear();
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(source)) !== null)
        {
            const bindingIndex = parseInt(match[1], 10);
            this.bindingsRender.add(bindingIndex);
        }
    }

    /**
     * Parses all @binding entries and populates this.bindingsCompute set.
     */
    extractBindingsCompute(source)
    {
        this.bindingsCompute.clear();
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(source)) !== null)
        {
            const bindingIndex = parseInt(match[1], 10);
            this.bindingsCompute.add(bindingIndex);
        }
    }

    /**
     * Extracts a texture URL from sampler declaration comments.
     * Expects comments: // iChannel0URL: ./path/to/texture.png
     * Expects comments: // iChannel1URL: ./path/to/texture.png
     * Expects comments: // iChannel2URL: ./path/to/texture.png
     * Expects comments: // iChannel3URL: ./path/to/texture.png
     * Initialize: channel[index] with extracted URLs or null.
     */
    extractTextureURLs(sources)
    {
        this.channelUrls = [null, null, null, null];
        const regex = /\/\/\s*iChannel([0-3])URL\s*:\s*(\S+)/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }
            const match = regex.exec(source);
            if (match)
            {
                const index = parseInt(match[1], 10);
                const url = match[2];
                this.channelUrls[index] = url;
                // console.log(`Extracted iChannel${index} URL: ${url}`);
            }
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
     * Creates bind groups for render and compute pipelines.
     */
    async buildBindGroups()
    {
        const bindingEntriesRendering = [];
        const bindingEntriesCompute = [];
        if (this.bindingsRender.has(0))
        {
            bindingEntriesRendering.push({
                laber: "Uniform Buffer: Render",
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            });
        }

        if (this.bindingsCompute.has(0))
        {
            bindingEntriesCompute.push({
                laber: "Uniform Buffer: Compute",
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            });
        }

        // Uint32Array(this.gridSize * this.gridSize) buffers (1, 2)
        for (const index of [1, 2])
        {
            if (this.bindingsRender.has(index))
            {
                const bufferArray = new Uint32Array(this.gridSize * this.gridSize);
                const buffer = this.device.createBuffer({
                    label: `Storage Buffer Binding ${index}`,
                    size: bufferArray.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
                    mappedAtCreation: true
                });

                // Interestiing Buffer initialization pattern for game_of_life_01
                // Each even cell is active:
                // for (let i = 0; i < bufferArray.length; i++)
                // {
                //     bufferArray[i] = i % 2;
                // }

                // Each 3rd cell is active:
                // for (let i = 0; i < bufferArray.length; i += 3)
                // {
                //     bufferArray[i] = 1;
                // }

                // Each 7th cell is active: Only 512x512 grid looks good
                // for (let i = 0; i < bufferArray.length; i += 7)
                // {
                //     bufferArray[i] = 1;
                // }

                // Each 5th cell is active: Only 512x512 grid looks good
                // for (let i = 0; i < bufferArray.length; i += 5)
                // {
                //     bufferArray[i] = 1;
                // }

                // Random initialization:
                // for (let i = 0; i < bufferArray.length; ++i)
                // {
                //     bufferArray[i] = Math.random() > 0.6 ? 1 : 0;
                // }

                new Uint32Array(buffer.getMappedRange()).set(bufferArray);
                buffer.unmap();

                this.device.queue.writeBuffer(buffer, 0, bufferArray);

                bindingEntriesRendering.push({
                    label: `Storage Buffer Binding ${index}`,
                    binding: index,
                    resource: { buffer }
                });

                if (this.bindingsCompute.has(index))
                {
                    bindingEntriesCompute.push({
                        label: `Storage Buffer Binding ${index}`,
                        binding: index,
                        resource: { buffer }
                    });
                }
            }
        }

        // Channels (10, 11, 12, 14)
        for (const index of [10, 11, 12, 13])
        {
            const channelIndex = index - 10;
            const texture = await this.createTexture(this.channelUrls[channelIndex])

            if (this.bindingsRender.has(index))
            {
                bindingEntriesRendering.push({
                    label: `Texture Binding ${index}: Render`,
                    binding: index,
                    resource: texture.createView()
                });
            }
            if (this.bindingsCompute.has(index))
            {
                bindingEntriesCompute.push({
                    label: `Texture Binding ${index}: Compute`,
                    binding: index,
                    resource: texture.createView()
                });

                this.computeWidth = texture.width;
                this.computeHeight = texture.height;
            }
        }

        // Samplers (14, 15, 16, 17)
        for (const index of [14, 15, 16, 17])
        {
            if (this.bindingsRender.has(index))
            {
                bindingEntriesRendering.push({
                    label: `Sampler Binding ${index}: Render`,
                    binding: index,
                    resource: this.device.createSampler({
                        magFilter: "linear",
                        minFilter: "linear",
                        addressModeU: "clamp-to-edge",
                        addressModeV: "clamp-to-edge"
                    })
                });
            }
        }

        try
        {
            this.renderBindGroup = this.device.createBindGroup({
                label: "Render Bind Group",
                layout: this.renderPipeline.getBindGroupLayout(0),
                entries: bindingEntriesRendering
            });
        }
        catch (err)
        {
            throw new Error(`Failed to create render bind group: ${err.message}`);
        }

        if (this.computePipeline)
        {
            this.computeBindGroup = this.device.createBindGroup({
                label: "Compute Bind Group",
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: bindingEntriesCompute
            });
        }
        else
        {
            this.computeBindGroup = null;
        }
    }

    /**
     * Loads and uploads the font atlas texture/sampler.
     */
    async createTexture(url)
    {
        if (url)
        {
            const response = await fetch(url);
            if (!response.ok)
            {
                throw new Error(`Failed to load font texture: "${url}"`);
            }

            const blob = await response.blob();
            const image = await createImageBitmap(blob);

            const texture = this.device.createTexture({
                label: `Texture: ${url}`,
                size: { width: image.width, height: image.height },
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING
            });

            if (!texture)
            {
                throw new Error("Unable to allocate image texture");
            }

            this.device.queue.copyExternalImageToTexture(
                { source: image },
                { texture },
                { width: image.width, height: image.height }
            );

            return texture;
        }
        else
        {
            const width = Math.max(1, Math.floor(this.canvas.width));
            const height = Math.max(1, Math.floor(this.canvas.height));

            const texture = this.device.createTexture({
                label: `Texture: Canvas ${width}x${height}`,
                size: { width, height },
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING
            });

            if (!texture)
            {
                throw new Error("Unable to allocate storage texture");
            }

            return texture;
        }
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
            label: "Render Pipeline",
            layout: "auto",
            vertex: {
                module: vertexModule,
                entryPoint: vertexEntry
            },
            fragment: {
                module: fragmentModule,
                entryPoint: fragmentEntry,
                targets: [{
                    format: this.format
                }]
            },
            primitive: { topology: "triangle-list" }
        });

        if (computeModule && computeEntry)
        {
            this.computePipeline = this.device.createComputePipeline({
                label: "Compute Pipeline",
                layout: "auto",
                compute: {
                    module: computeModule,
                    entryPoint: computeEntry
                }
            });
            this.workgroupSize = this.extractWorkgroupSize(computeSource);
        }
        else
        {
            this.computePipeline = null;
            this.destroyComputeTarget();
            this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };
        }

        this.extractBindingsRender([vertexSource, fragmentSource]);
        this.extractBindingsCompute([computeSource]);
        this.extractTextureURLs([vertexSource, fragmentSource, computeSource]);

        this.vertexCount = this.extractVertexCount([vertexSource, fragmentSource, computeSource]);
        this.gridSize = this.extractGridSize([vertexSource, fragmentSource, computeSource]);

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
                const computePass = encoder.beginComputePass();
                computePass.setPipeline(this.computePipeline);
                computePass.setBindGroup(0, this.computeBindGroup);
                if (this.gridSize > 1)
                {
                    const gridWorkgroupCount = Math.max(1, Math.ceil(this.gridSize / this.workgroupSize.x));
                    computePass.dispatchWorkgroups(gridWorkgroupCount, gridWorkgroupCount, this.workgroupSize.z || 1);
                }
                else
                {
                    const groupsX = Math.max(1, Math.ceil(this.computeWidth / this.workgroupSize.x));
                    const groupsY = Math.max(1, Math.ceil(this.computeHeight / this.workgroupSize.y));
                    computePass.dispatchWorkgroups(groupsX, groupsY, this.workgroupSize.z || 1);
                }

                computePass.end();
            }

            const pass = encoder.beginRenderPass({
                label: "Render Pass",
                colorAttachments: [
                    {
                        view: this.context.getCurrentTexture().createView(),
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
