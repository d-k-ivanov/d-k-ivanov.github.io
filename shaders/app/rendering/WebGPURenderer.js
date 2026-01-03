"use strict";

import { BaseRenderer } from "./BaseRenderer.js";
import { ShaderUniformState } from "./ShaderUniformState.js";

const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };
const DEFAULT_VERTEX_COUNT = 3;
const DEFAULT_GRID_SIZE = 1;
const MODEL_GEOMETRY_MARKER = /\bMODEL_GEOMETRY\b/;
const MODEL_PADDING_MARKER = /\bMODEL_GEOMETRY_WITH_PADDING\b/;
const MODEL_BINDINGS = {
    positions: 20,
    normals: 21,
    uvs: 22,
    info: 23
};
const MODEL_INFO_FLOATS = 12;

/**
 * WebGPU renderer backend supporting render and optional compute pipelines.
 *
 * This backend compiles WGSL shaders, builds render/compute pipelines,
 * and manages uniform/storage buffers used by the Shader Editor.
 *
 * @example
 * const renderer = new WebGPURenderer(canvas, mouseState);
 * await renderer.updateShaders({ vertex: "...", fragment: "...", compute: "" });
 */
export class WebGPURenderer extends BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - Render target.
     * @param {object} mouse - Shared mouse state.
     */
    constructor(canvas, mouse)
    {
        super(canvas, mouse);
        this.device = null;
        this.adapter = null;
        this.context = null;
        this.format = null;

        // Vertex number extracted from VERTEX_COUNT constant in WGSL.
        this.vertexCount = DEFAULT_VERTEX_COUNT;

        // Bindings. Extracted from @binding() attributes in WGSL.
        this.bindingsRender = new Set();
        this.bindingsCompute = new Set();

        // Pipelines and bind groups
        this.renderPipeline = null;
        this.renderBindGroup = null;
        this.computePipeline = null;
        this.computeBindGroup = null;

        // Buffers
        this.uniformBuffer = null;
        this.uniformBufferSize = ShaderUniformState.BUFFER_SIZE;
        this.uniformViews = this.uniformState.getViews();

        // Storage buffers
        this.storageBuffers = {
            buffer1: null,
            buffer2: null,
            buffer3: null,
            buffer4: null,
            currentIndex: 0,  // 0 or 1, determines which buffer is input vs output
            bindGroupA: null, // Bind group when buffer1=input, buffer2=output, buffer3=input, buffer4=output
            bindGroupB: null  // Bind group when buffer2=input, buffer1=output, buffer4=input, buffer3=output
        };

        // Channels. Extracted from iChannelURL comments in WGSL.
        this.channelUrls = [null, null, null, null];

        // Model data buffers.
        this.modelBuffers = null;
        this.modelInfo = null;
        this.modelVertexCount = 0;
        this.modelPayload = null;
        this.useModelGeometry = false;
        this.modelPadding = 0;

        // Compute target

        // Grid size extracted from GRID_SIZE_N constants, canvas or texture resolution.
        // Used for allocating storage buffers and compute workgroups.
        this.gridSize = {
            x: DEFAULT_GRID_SIZE,
            y: DEFAULT_GRID_SIZE,
            z: DEFAULT_GRID_SIZE
        };
        this.workgroupSize = { ...DEFAULT_WORKGROUP_SIZE };

        // Depth target for model rendering.
        this.depthTexture = null;
        this.depthTextureSize = { width: 0, height: 0 };
        this.depthFormat = "depth24plus";
    }

    /**
     * Requests adapter/device, configures context, and allocates uniform buffer.
     *
     * @returns {Promise<void>} Resolves when the device is ready.
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
     *
     * @returns {void}
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

    /**
     * Stops the render loop.
     *
     * @returns {void}
     */
    stop()
    {
        super.stop();
    }

    /**
     * Accepts model payload and prepares buffers for GPU consumption.
     *
     * @param {object|null} model - Model payload or null to clear.
     * @returns {void}
     */
    setModel(model)
    {
        super.setModel(model);
        this.modelInfo = model ? this.buildModelInfo(model) : null;
        const baseVertexCount = model?.vertexCount || 0;
        const padding = model ? this.modelPadding : 0;
        this.modelVertexCount = baseVertexCount > 0 ? baseVertexCount + padding : 0;
        this.modelPayload = this.buildModelPayload(model);

        if (!this.device)
        {
            return;
        }

        const needsRebind = this.updateModelBuffers();
        if (this.useModelGeometry)
        {
            this.vertexCount = this.modelVertexCount > 0 ? this.modelVertexCount : DEFAULT_VERTEX_COUNT;
        }

        if (needsRebind && this.renderPipeline)
        {
            this.buildBindGroups().catch((error) =>
            {
                console.error("Failed to rebuild model bind group:", error);
            });
        }
    }

    /**
     * Detects GLSL markers to guard against misusing WGSL path.
     *
     * @param {string} source - Shader source to inspect.
     * @returns {boolean} True when the source appears to be GLSL.
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
     *
     * @param {string} source - Shader source to validate.
     * @param {string} label - Stage label for error messages.
     * @returns {void}
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
     *
     * @param {string} source - WGSL source to scan.
     * @param {"vertex"|"fragment"|"compute"} stage - Shader stage.
     * @returns {string|null} Entry point function name.
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
     *
     * @param {GPUShaderModule} module - Shader module to validate.
     * @param {string} label - Stage label for error messages.
     * @returns {Promise<void>} Resolves when validation completes.
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
     *
     * @param {string} code - WGSL shader source.
     * @param {string} label - Label for debug output.
     * @returns {Promise<GPUShaderModule>} Compiled shader module.
     */
    async createShaderModule(code, label)
    {
        const module = this.device.createShaderModule({ code, label });
        await this.validateModule(module, label);
        return module;
    }

    /**
     * Parses all @binding entries and populates this.bindingsRender set.
     *
     * @param {string|Array<string>} source - WGSL source(s) to inspect.
     * @returns {void}
     */
    extractBindingsRender(source)
    {
        this.bindingsRender.clear();
        const sourceText = Array.isArray(source) ? source.join("\n") : (source || "");
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(sourceText)) !== null)
        {
            const bindingIndex = parseInt(match[1], 10);
            this.bindingsRender.add(bindingIndex);
        }
    }

    /**
     * Parses all @binding entries and populates this.bindingsCompute set.
     *
     * @param {string|Array<string>} source - WGSL source(s) to inspect.
     * @returns {void}
     */
    extractBindingsCompute(source)
    {
        this.bindingsCompute.clear();
        const sourceText = Array.isArray(source) ? source.join("\n") : (source || "");
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(sourceText)) !== null)
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
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {void}
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
     *
     * @param {string} source - WGSL compute shader source.
     * @returns {{x: number, y: number, z: number}} Workgroup size tuple.
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
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {number} Vertex count to use for draw calls.
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
     * Extracts GRID_SIZE_X constant from any provided WGSL sources.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {number} Grid size used for compute dispatches.
     */
    extractGridSizeX(sources)
    {
        const regex = /const\s+GRID_SIZE_X[^=]*=\s*([0-9]+)\s*u?/i;
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

        return Math.max(DEFAULT_GRID_SIZE, Math.floor(this.canvas.width));
    }

    /**
     * Extracts GRID_SIZE_Y constant from any provided WGSL sources.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {number} Grid size used for compute dispatches.
     */
    extractGridSizeY(sources)
    {
        const regex = /const\s+GRID_SIZE_Y[^=]*=\s*([0-9]+)\s*u?/i;
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

        return Math.max(DEFAULT_GRID_SIZE, Math.floor(this.canvas.height));
    }

    /**
     * Extracts GRID_SIZE_Z constant from any provided WGSL sources.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {number} Grid size used for compute dispatches.
     */
    extractGridSizeZ(sources)
    {
        const regex = /const\s+GRID_SIZE_Z[^=]*=\s*([0-9]+)\s*u?/i;
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
     * Checks WGSL sources for model-geometry markers.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {boolean} True when model geometry should be used.
     */
    detectModelGeometry(sources)
    {
        return sources.some((source) => MODEL_GEOMETRY_MARKER.test(source || ""));
    }

    /**
     * Checks WGSL sources for model padding markers.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {boolean} True when model buffers should be padded.
     */
    detectModelPadding(sources)
    {
        return sources.some((source) => MODEL_PADDING_MARKER.test(source || ""));
    }

    /**
     * Returns true when shader bindings include model buffers.
     *
     * @returns {boolean} True when model bindings are present.
     */
    usesModelBindings()
    {
        return Object.values(MODEL_BINDINGS).some((binding) => this.bindingsRender.has(binding));
    }

    /**
     * Computes model center/scale/bounds for shader use.
     *
     * @param {object} model - Model payload with bounds.
     * @returns {{center: number[], scale: number, boundsMin: number[], boundsMax: number[]}}
     * Derived model info.
     */
    buildModelInfo(model)
    {
        const bounds = model?.bounds || {};
        const min = bounds.min || [0, 0, 0];
        const max = bounds.max || [0, 0, 0];
        const center = [
            (min[0] + max[0]) * 0.5,
            (min[1] + max[1]) * 0.5,
            (min[2] + max[2]) * 0.5
        ];
        const size = [
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2]
        ];
        const maxAxis = Math.max(size[0], size[1], size[2], 0.0001);
        const scale = 1.6 / maxAxis;

        return {
            center,
            scale,
            boundsMin: min,
            boundsMax: max
        };
    }

    /**
     * Builds CPU-side payloads for model storage buffers.
     *
     * @param {object|null} model - Model payload or null.
     * @returns {{positions: Float32Array, normals: Float32Array, uvs: Float32Array, info: Float32Array}}
     * Packed model data for GPU buffers.
     */
    buildModelPayload(model)
    {
        const baseVertexCount = model?.vertexCount || 0;
        const padding = model ? this.modelPadding : 0;
        const totalVertexCount = baseVertexCount + padding;
        const count = Math.max(totalVertexCount, DEFAULT_VERTEX_COUNT);
        const positions = new Float32Array(count * 4);
        const normals = new Float32Array(count * 4);
        const uvs = new Float32Array(count * 4);
        const readValue = (array, index, fallback) =>
        {
            const value = array[index];
            return Number.isFinite(value) ? value : fallback;
        };

        if (model?.positions)
        {
            const srcPos = model.positions;
            const srcNorm = model.normals || [];
            const srcUv = model.uvs || [];

            for (let i = 0; i < baseVertexCount; i++)
            {
                const pIndex = i * 3;
                const oIndex = (i + padding) * 4;
                const uvIndex = i * 2;

                positions[oIndex + 0] = readValue(srcPos, pIndex + 0, 0);
                positions[oIndex + 1] = readValue(srcPos, pIndex + 1, 0);
                positions[oIndex + 2] = readValue(srcPos, pIndex + 2, 0);
                positions[oIndex + 3] = 1.0;

                normals[oIndex + 0] = readValue(srcNorm, pIndex + 0, 0);
                normals[oIndex + 1] = readValue(srcNorm, pIndex + 1, 0);
                normals[oIndex + 2] = readValue(srcNorm, pIndex + 2, 1.0);
                normals[oIndex + 3] = 0.0;

                uvs[oIndex + 0] = readValue(srcUv, uvIndex + 0, 0);
                uvs[oIndex + 1] = readValue(srcUv, uvIndex + 1, 0);
                uvs[oIndex + 2] = 0.0;
                uvs[oIndex + 3] = 0.0;
            }
        }

        const info = model ? this.buildModelInfo(model) : null;
        const hasModel = baseVertexCount > 0 ? 1.0 : 0.0;
        const boundsMin = info ? info.boundsMin : [0, 0, 0];
        const boundsMax = info ? info.boundsMax : [0, 0, 0];
        const center = info ? info.center : [0, 0, 0];
        const scale = info ? info.scale : 1.0;

        const infoData = new Float32Array(MODEL_INFO_FLOATS);
        infoData[0] = boundsMin[0];
        infoData[1] = boundsMin[1];
        infoData[2] = boundsMin[2];
        infoData[3] = hasModel;
        infoData[4] = boundsMax[0];
        infoData[5] = boundsMax[1];
        infoData[6] = boundsMax[2];
        infoData[7] = scale;
        infoData[8] = center[0];
        infoData[9] = center[1];
        infoData[10] = center[2];
        infoData[11] = 0.0;

        return {
            positions,
            normals,
            uvs,
            info: infoData
        };
    }

    /**
     * Creates or updates GPU buffers with current model payload.
     *
     * @returns {boolean} True when bind groups must be rebuilt.
     */
    updateModelBuffers()
    {
        if (!this.device)
        {
            return false;
        }

        const payload = this.modelPayload || this.buildModelPayload(this.model);
        this.modelPayload = payload;

        if (!this.modelBuffers)
        {
            this.modelBuffers = {};
        }

        const needsRebind = [
            this.ensureModelBuffer("positions", payload.positions, "Model Positions"),
            this.ensureModelBuffer("normals", payload.normals, "Model Normals"),
            this.ensureModelBuffer("uvs", payload.uvs, "Model UVs"),
            this.ensureModelBuffer("info", payload.info, "Model Info")
        ].some(Boolean);

        this.device.queue.writeBuffer(this.modelBuffers.positions.buffer, 0, payload.positions);
        this.device.queue.writeBuffer(this.modelBuffers.normals.buffer, 0, payload.normals);
        this.device.queue.writeBuffer(this.modelBuffers.uvs.buffer, 0, payload.uvs);
        this.device.queue.writeBuffer(this.modelBuffers.info.buffer, 0, payload.info);

        return needsRebind;
    }

    /**
     * Allocates a model buffer if missing or too small.
     *
     * @param {string} key - Buffer key identifier.
     * @param {TypedArray} data - Source data to size the buffer.
     * @param {string} label - Debug label for the buffer.
     * @returns {boolean} True if a new buffer was allocated.
     */
    ensureModelBuffer(key, data, label)
    {
        const size = Math.max(4, data.byteLength || 0);
        const existing = this.modelBuffers[key];
        if (!existing || existing.size < size)
        {
            this.modelBuffers[key] = {
                buffer: this.device.createBuffer({
                    label,
                    size,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                }),
                size
            };
            return true;
        }

        return false;
    }

    /**
     * Releases compute-texture resources.
     *
     * @returns {void}
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
     * Ensures depth texture matches the current canvas size.
     *
     * @returns {void}
     */
    ensureDepthTexture()
    {
        if (!this.device || !this.useModelGeometry)
        {
            return;
        }

        const width = Math.max(1, Math.floor(this.canvas.width));
        const height = Math.max(1, Math.floor(this.canvas.height));
        if (this.depthTexture && this.depthTextureSize.width === width && this.depthTextureSize.height === height)
        {
            return;
        }

        this.releaseDepthTexture();

        this.depthTexture = this.device.createTexture({
            label: `Depth Texture ${width}x${height}`,
            size: { width, height },
            format: this.depthFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthTextureSize = { width, height };
    }

    /**
     * Releases depth texture resources.
     *
     * @returns {void}
     */
    releaseDepthTexture()
    {
        if (this.depthTexture)
        {
            this.depthTexture.destroy();
        }
        this.depthTexture = null;
        this.depthTextureSize = { width: 0, height: 0 };
    }

    /**
     * Creates bind groups for render and compute pipelines.
     *
     * @returns {Promise<void>} Resolves once bind groups are rebuilt.
     */
    async buildBindGroups()
    {
        // Reset storage buffers
        this.storageBuffers.buffer1 = null;
        this.storageBuffers.buffer2 = null;
        this.storageBuffers.buffer3 = null;
        this.storageBuffers.buffer4 = null;
        this.storageBuffers.currentIndex = 0;
        this.storageBuffers.bindGroupA = null;
        this.storageBuffers.bindGroupB = null;

        const bindingEntriesRendering = [];
        const bindingEntriesCompute = [];

        // Binding 0: Uniform Buffer
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

        // Binding 1 and 2: Storage Ping-Pong Buffers Uint32Array
        if (this.bindingsRender.has(1) || this.bindingsCompute.has(1) || this.bindingsRender.has(2) || this.bindingsCompute.has(2))
        {
            const bufferArray = new Uint32Array(this.gridSize.x * this.gridSize.y * this.gridSize.z);
            const bufferSize = bufferArray.byteLength;

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

            // Create or reuse buffers
            if ((this.bindingsRender.has(1) || this.bindingsCompute.has(1)))
            {
                this.storageBuffers.buffer1 = this.device.createBuffer({
                    label: "Storage Buffer 1 (Uint32Array)",
                    size: bufferSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                });

                this.device.queue.writeBuffer(this.storageBuffers.buffer1, 0, bufferArray);
            }

            if ((this.bindingsRender.has(2) || this.bindingsCompute.has(2)))
            {

                this.storageBuffers.buffer2 = this.device.createBuffer({
                    label: "Storage Buffer 2 (Uint32Array)",
                    size: bufferSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                });

                this.device.queue.writeBuffer(this.storageBuffers.buffer2, 0, bufferArray);
            }

            // Binding 1: Input buffer
            if (this.bindingsRender.has(1) && this.storageBuffers.buffer1)
            {
                bindingEntriesRendering.push({
                    label: "Storage Buffer Binding 1 (Input)",
                    binding: 1,
                    resource: { buffer: this.storageBuffers.buffer1 }
                });
            }

            if (this.bindingsCompute.has(1) && this.storageBuffers.buffer1)
            {
                bindingEntriesCompute.push({
                    label: "Storage Buffer Binding 1 (Input)",
                    binding: 1,
                    resource: { buffer: this.storageBuffers.buffer1 }
                });
            }

            // Binding 2: Output buffer
            if (this.bindingsRender.has(2) && this.storageBuffers.buffer2)
            {
                bindingEntriesRendering.push({
                    label: "Storage Buffer Binding 2 (Output)",
                    binding: 2,
                    resource: { buffer: this.storageBuffers.buffer2 }
                });
            }

            if (this.bindingsCompute.has(2) && this.storageBuffers.buffer2)
            {
                bindingEntriesCompute.push({
                    label: "Storage Buffer Binding 2 (Output)",
                    binding: 2,
                    resource: { buffer: this.storageBuffers.buffer2 }
                });
            }
        }

        // Binding 3 and 4: Storage Ping-Pong Buffers Float32Array
        if (this.bindingsRender.has(3) || this.bindingsCompute.has(3) || this.bindingsRender.has(4) || this.bindingsCompute.has(4))
        {
            const bufferArray = new Float32Array(this.gridSize.x * this.gridSize.y * this.gridSize.z);
            const bufferSize = bufferArray.byteLength;

            // Create or reuse buffers
            if ((this.bindingsRender.has(3) || this.bindingsCompute.has(3)))
            {
                this.storageBuffers.buffer3 = this.device.createBuffer({
                    label: "Storage Buffer 1 (Float32Array)",
                    size: bufferSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                });

                this.device.queue.writeBuffer(this.storageBuffers.buffer3, 0, bufferArray);
            }

            if ((this.bindingsRender.has(4) || this.bindingsCompute.has(4)))
            {

                this.storageBuffers.buffer4 = this.device.createBuffer({
                    label: "Storage Buffer 2 (Float32Array)",
                    size: bufferSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                });

                this.device.queue.writeBuffer(this.storageBuffers.buffer4, 0, bufferArray);
            }

            // Binding 3: Input buffer
            if (this.bindingsRender.has(3) && this.storageBuffers.buffer3)
            {
                bindingEntriesRendering.push({
                    label: "Storage Buffer Binding 3 (Input)",
                    binding: 3,
                    resource: { buffer: this.storageBuffers.buffer3 }
                });
            }

            if (this.bindingsCompute.has(3) && this.storageBuffers.buffer3)
            {
                bindingEntriesCompute.push({
                    label: "Storage Buffer Binding 3 (Input)",
                    binding: 3,
                    resource: { buffer: this.storageBuffers.buffer3 }
                });
            }

            // Binding 4: Output buffer
            if (this.bindingsRender.has(4) && this.storageBuffers.buffer4)
            {
                bindingEntriesRendering.push({
                    label: "Storage Buffer Binding 4 (Output)",
                    binding: 4,
                    resource: { buffer: this.storageBuffers.buffer4 }
                });
            }

            if (this.bindingsCompute.has(4) && this.storageBuffers.buffer4)
            {
                bindingEntriesCompute.push({
                    label: "Storage Buffer Binding 4 (Output)",
                    binding: 4,
                    resource: { buffer: this.storageBuffers.buffer4 }
                });
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

                this.gridSize.x = texture.width;
                this.gridSize.y = texture.height;
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

        // Model Buffers (20, 21, 22, 23)
        if (this.usesModelBindings())
        {
            this.updateModelBuffers();

            if (this.bindingsRender.has(MODEL_BINDINGS.positions))
            {
                bindingEntriesRendering.push({
                    label: "Model Positions",
                    binding: MODEL_BINDINGS.positions,
                    resource: { buffer: this.modelBuffers.positions.buffer }
                });
            }

            if (this.bindingsRender.has(MODEL_BINDINGS.normals))
            {
                bindingEntriesRendering.push({
                    label: "Model Normals",
                    binding: MODEL_BINDINGS.normals,
                    resource: { buffer: this.modelBuffers.normals.buffer }
                });
            }

            if (this.bindingsRender.has(MODEL_BINDINGS.uvs))
            {
                bindingEntriesRendering.push({
                    label: "Model UVs",
                    binding: MODEL_BINDINGS.uvs,
                    resource: { buffer: this.modelBuffers.uvs.buffer }
                });
            }

            if (this.bindingsRender.has(MODEL_BINDINGS.info))
            {
                bindingEntriesRendering.push({
                    label: "Model Info",
                    binding: MODEL_BINDINGS.info,
                    resource: { buffer: this.modelBuffers.info.buffer }
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

        // If we have double buffering, create a second set of bind groups for ping-pong swap
        if ((this.storageBuffers.buffer1 && this.storageBuffers.buffer2) || (this.storageBuffers.buffer3 && this.storageBuffers.buffer4))
        {
            // Create alternate bind groups with swapped buffers
            const bindingEntriesRenderingAlt = bindingEntriesRendering.map(entry =>
            {
                if (this.storageBuffers.buffer1 && this.storageBuffers.buffer2)
                {
                    if ((entry.binding === 1 || entry.binding === 2) && entry.resource.buffer)
                    {
                        // Swap: buffer1 -> buffer2
                        const swappedBuffer = entry.resource.buffer === this.storageBuffers.buffer1 ? this.storageBuffers.buffer2 : this.storageBuffers.buffer1;
                        return { ...entry, resource: { buffer: swappedBuffer } };
                    }
                }

                if (this.storageBuffers.buffer3 && this.storageBuffers.buffer4)
                {
                    if ((entry.binding === 3 || entry.binding === 4) && entry.resource.buffer)
                    {
                        // Swap: buffer3 -> buffer4
                        const swappedBuffer = entry.resource.buffer === this.storageBuffers.buffer3 ? this.storageBuffers.buffer4 : this.storageBuffers.buffer3;
                        return { ...entry, resource: { buffer: swappedBuffer } };
                    }
                }

                return entry;
            });

            const bindingEntriesComputeAlt = this.computeBindGroup ? bindingEntriesCompute.map(entry =>
            {

                if (this.storageBuffers.buffer1 && this.storageBuffers.buffer2)
                {
                    if ((entry.binding === 1 || entry.binding === 2) && entry.resource.buffer)
                    {
                        // Swap: buffer1 <-> buffer2
                        const swappedBuffer = entry.resource.buffer === this.storageBuffers.buffer1 ? this.storageBuffers.buffer2 : this.storageBuffers.buffer1;
                        return { ...entry, resource: { buffer: swappedBuffer } };
                    }
                }

                if (this.storageBuffers.buffer3 && this.storageBuffers.buffer4)
                {
                    if ((entry.binding === 3 || entry.binding === 4) && entry.resource.buffer)
                    {
                        // Swap: buffer3 <-> buffer4
                        const swappedBuffer = entry.resource.buffer === this.storageBuffers.buffer3 ? this.storageBuffers.buffer4 : this.storageBuffers.buffer3;
                        return { ...entry, resource: { buffer: swappedBuffer } };
                    }
                }

                return entry;
            }) : null;

            this.storageBuffers.bindGroupA = {
                render: this.renderBindGroup,
                compute: this.computeBindGroup
            };

            this.storageBuffers.bindGroupB = {
                render: this.device.createBindGroup({
                    label: "Render Bind Group (Swapped)",
                    layout: this.renderPipeline.getBindGroupLayout(0),
                    entries: bindingEntriesRenderingAlt
                }),

                compute: bindingEntriesComputeAlt ? this.device.createBindGroup({
                    label: "Compute Bind Group (Swapped)",
                    layout: this.computePipeline.getBindGroupLayout(0),
                    entries: bindingEntriesComputeAlt
                }) : null
            };
        }

    }

    /**
     * Loads and uploads the font atlas texture/sampler.
     *
     * When no URL is provided, a storage texture matching the canvas size is created.
     *
     * @param {string|null} url - Optional texture URL.
     * @returns {Promise<GPUTexture>} Allocated GPU texture.
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
     *
     * @param {{vertex: string, fragment: string, compute: string}} sources - WGSL sources.
     * @returns {Promise<void>} Resolves when pipelines are ready and loop starts.
     */
    async updateShaders(sources)
    {
        await this.init();
        this.stop();

        const vertexSource = (sources.vertex || "").trim();
        const fragmentSource = (sources.fragment || "").trim();
        const computeSource = (sources.compute || "").trim();
        const shaderSources = [vertexSource, fragmentSource, computeSource];

        this.useModelGeometry = this.detectModelGeometry(shaderSources);
        const nextPadding = this.useModelGeometry && this.detectModelPadding(shaderSources) ? 3 : 0;
        const paddingChanged = nextPadding !== this.modelPadding;
        this.modelPadding = nextPadding;
        if (paddingChanged)
        {
            this.setModel(this.model);
        }
        if (!this.useModelGeometry)
        {
            this.releaseDepthTexture();
        }

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

        const pipelineDescriptor = {
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
        };

        if (this.useModelGeometry)
        {
            pipelineDescriptor.depthStencil = {
                format: this.depthFormat,
                depthWriteEnabled: true,
                depthCompare: "less"
            };
        }

        this.renderPipeline = this.device.createRenderPipeline(pipelineDescriptor);

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
        this.extractTextureURLs(shaderSources);

        this.vertexCount = this.extractVertexCount(shaderSources);
        if (this.useModelGeometry && this.modelVertexCount > 0)
        {
            this.vertexCount = this.modelVertexCount;
        }

        this.gridSize.x = this.extractGridSizeX(shaderSources);
        this.gridSize.y = this.extractGridSizeY(shaderSources);
        this.gridSize.z = 1;

        this.buildBindGroups();
        this.resetFrameState();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    /**
     * Begins the WebGPU render loop with optional compute pass.
     *
     * @returns {void}
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

            // Ping-Pong storage buffers:
            if (this.storageBuffers.bindGroupA && this.storageBuffers.bindGroupB)
            {
                this.storageBuffers.currentIndex = 1 - this.storageBuffers.currentIndex;
                const currentBindGroups = this.storageBuffers.currentIndex === 0 ? this.storageBuffers.bindGroupA : this.storageBuffers.bindGroupB;
                this.renderBindGroup = currentBindGroups.render;
                this.computeBindGroup = currentBindGroups.compute;
            }

            const encoder = this.device.createCommandEncoder();

            if (this.computePipeline && this.computeBindGroup)
            {
                const computePass = encoder.beginComputePass();
                computePass.setPipeline(this.computePipeline);
                computePass.setBindGroup(0, this.computeBindGroup);
                const groupsX = Math.max(1, Math.ceil(this.gridSize.x / this.workgroupSize.x));
                const groupsY = Math.max(1, Math.ceil(this.gridSize.y / this.workgroupSize.y));
                const groupsZ = Math.max(1, Math.ceil(this.gridSize.z / this.workgroupSize.z));
                computePass.dispatchWorkgroups(groupsX, groupsY, groupsZ);
                computePass.end();
            }

            if (this.useModelGeometry)
            {
                this.ensureDepthTexture();
            }

            const passDescriptor = {
                label: "Render Pass",
                colorAttachments: [
                    {
                        view: this.context.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ]
            };

            if (this.useModelGeometry && this.depthTexture)
            {
                passDescriptor.depthStencilAttachment = {
                    view: this.depthTexture.createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: "clear",
                    depthStoreOp: "store"
                };
            }

            const pass = encoder.beginRenderPass(passDescriptor);

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
            const instances = Math.max(1, (this.gridSize.x * this.gridSize.y * this.gridSize.z) || DEFAULT_GRID_SIZE);
            pass.draw(this.vertexCount, instances, 0, 0);
            pass.end();

            this.device.queue.submit([encoder.finish()]);
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }
}
