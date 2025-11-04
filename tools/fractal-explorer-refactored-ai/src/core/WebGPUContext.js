/**
 * WebGPU Context Manager
 * Handles WebGPU device initialization and context management
 */
import { BrowserSupport } from '../utils/BrowserSupport.js';

export class WebGPUContext
{
    constructor()
    {
        this.adapter = null;
        this.device = null;
        this.context = null;
        this.canvas = null;
        this.canvasFormat = null;
    }

    /**
     * Initialize WebGPU adapter and device
     */
    async initialize()
    {
        try
        {
            // Request WebGPU adapter with optimal settings for fractal computation
            this.adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance',
                forceFallbackAdapter: false
            });

            if (!this.adapter)
            {
                throw new Error('No WebGPU adapter found. Please ensure your GPU drivers are up to date.');
            }

            // Validate adapter capabilities
            const featureCheck = BrowserSupport.checkRequiredFeatures(this.adapter);
            if (!featureCheck.supported)
            {
                console.warn('Some WebGPU features not supported:', featureCheck.missing);
            }

            const limitsCheck = BrowserSupport.validateComputeLimits(this.adapter);
            if (!limitsCheck.adequate)
            {
                console.warn('WebGPU limits may be insufficient:', limitsCheck.issues);
            }

            // Request device with optimal configuration
            this.device = await this.adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {
                    maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize,
                    maxUniformBufferBindingSize: Math.min(65536, this.adapter.limits.maxUniformBufferBindingSize)
                }
            });

            // Setup device error handling
            this.device.lost.then((info) =>
            {
                console.error('WebGPU device lost:', info.message);
                if (info.reason !== 'destroyed')
                {
                    // Attempt to reinitialize on unexpected device loss
                    setTimeout(() =>
                    {
                        console.log('Attempting to recover WebGPU device...');
                        this.initialize().catch(console.error);
                    }, 1000);
                }
            });

            // Store preferred canvas format
            this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            console.log('WebGPU Device Info:', {
                vendor: this.adapter.info?.vendor || 'Unknown',
                architecture: this.adapter.info?.architecture || 'Unknown',
                device: this.adapter.info?.device || 'Unknown',
                limits: {
                    maxUniformBufferBindingSize: this.adapter.limits.maxUniformBufferBindingSize,
                    maxTextureDimension2D: this.adapter.limits.maxTextureDimension2D
                }
            });

        } catch (error)
        {
            console.error('WebGPU initialization failed:', error);
            throw error;
        }
    }

    /**
     * Configure canvas for WebGPU rendering
     * @param {HTMLCanvasElement} canvas - The canvas element
     */
    configureCanvas(canvas)
    {
        this.canvas = canvas;
        this.context = canvas.getContext('webgpu');

        if (!this.context)
        {
            throw new Error('Failed to get WebGPU context from canvas');
        }

        this.context.configure({
            device: this.device,
            format: this.canvasFormat,
            alphaMode: 'premultiplied',
            colorSpace: 'srgb'
        });
    }

    /**
     * Get current texture view for rendering
     * @returns {GPUTextureView} Current texture view
     */
    getCurrentTextureView()
    {
        return this.context.getCurrentTexture().createView();
    }

    /**
     * Create a shader module
     * @param {string} code - WGSL shader code
     * @param {string} label - Debug label for the shader
     * @returns {GPUShaderModule} Compiled shader module
     */
    createShaderModule(code, label = 'Shader Module')
    {
        return this.device.createShaderModule({
            label,
            code
        });
    }

    /**
     * Create a uniform buffer
     * @param {ArrayBuffer} data - Initial buffer data
     * @param {string} label - Debug label for the buffer
     * @returns {GPUBuffer} Created buffer
     */
    createUniformBuffer(data, label = 'Uniform Buffer')
    {
        const buffer = this.device.createBuffer({
            label,
            size: Math.max(data.byteLength, 256), // Ensure minimum size for alignment
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(buffer, 0, data);
        return buffer;
    }

    /**
     * Update buffer data
     * @param {GPUBuffer} buffer - Buffer to update
     * @param {ArrayBuffer} data - New buffer data
     */
    updateBuffer(buffer, data)
    {
        this.device.queue.writeBuffer(buffer, 0, data);
    }

    /**
     * Create a bind group layout
     * @param {Array} entries - Bind group layout entries
     * @param {string} label - Debug label
     * @returns {GPUBindGroupLayout} Created bind group layout
     */
    createBindGroupLayout(entries, label = 'Bind Group Layout')
    {
        return this.device.createBindGroupLayout({
            label,
            entries
        });
    }

    /**
     * Create a bind group
     * @param {GPUBindGroupLayout} layout - Bind group layout
     * @param {Array} entries - Bind group entries
     * @param {string} label - Debug label
     * @returns {GPUBindGroup} Created bind group
     */
    createBindGroup(layout, entries, label = 'Bind Group')
    {
        return this.device.createBindGroup({
            label,
            layout,
            entries
        });
    }

    /**
     * Create a render pipeline
     * @param {Object} descriptor - Pipeline descriptor
     * @returns {GPURenderPipeline} Created render pipeline
     */
    createRenderPipeline(descriptor)
    {
        return this.device.createRenderPipeline(descriptor);
    }

    /**
     * Create a command encoder
     * @param {string} label - Debug label
     * @returns {GPUCommandEncoder} Command encoder
     */
    createCommandEncoder(label = 'Command Encoder')
    {
        return this.device.createCommandEncoder({ label });
    }

    /**
     * Submit commands to the GPU queue
     * @param {Array<GPUCommandBuffer>} commands - Command buffers to submit
     */
    submitCommands(commands)
    {
        this.device.queue.submit(commands);
    }

    /**
     * Clean up WebGPU resources
     */
    destroy()
    {
        if (this.device)
        {
            this.device.destroy();
            this.device = null;
        }

        this.adapter = null;
        this.context = null;
        this.canvas = null;
    }

    /**
     * Get device information for debugging
     * @returns {Object} Device information
     */
    getDeviceInfo()
    {
        return {
            adapter: this.adapter ? {
                vendor: this.adapter.info?.vendor,
                architecture: this.adapter.info?.architecture,
                device: this.adapter.info?.device,
                description: this.adapter.info?.description
            } : null,
            limits: this.adapter?.limits,
            features: this.adapter ? Array.from(this.adapter.features) : [],
            canvasFormat: this.canvasFormat
        };
    }
}
