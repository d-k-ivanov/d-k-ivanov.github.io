/**
 * Fractal Renderer
 * Main rendering coordinator for fractal visualization
 */
import { shaderLoader } from '../shaders/shaderLoader.js';
import { logger } from '../utils/Logger.js';
import { UniformBufferManager } from '../rendering/UniformBufferManager.js';

export class FractalRenderer
{
    constructor(webgpuContext, canvasManager, stateManager)
    {
        this.webgpuContext = webgpuContext;
        this.canvasManager = canvasManager;
        this.stateManager = stateManager;

        this.renderPipeline = null;
        this.uniformBufferManager = null;
        this.bindGroupLayout = null;

        this.isInitialized = false;
        this.lastPrecisionLevel = 0;
    }

    /**
     * Initialize the fractal renderer
     */
    async initialize()
    {
        try
        {
            await this.createRenderPipeline();
            this.createBuffers();
            this.setupResizeHandler();

            this.isInitialized = true;
            logger.info('✅ Fractal renderer initialized');
        } catch (error)
        {
            logger.error('❌ Failed to initialize fractal renderer:', error);
            throw error;
        }
    }

    /**
     * Create the WebGPU render pipeline
     */
    async createRenderPipeline()
    {
        // Load shaders from external files
        logger.info('Loading shaders for fractal renderer...');

        // Get current state to determine shader precision needs
        const state = this.stateManager.getState();
        const mandelbrotZoomInfo = this.stateManager.getZoomInfo('mandelbrot');
        const juliaZoomInfo = this.stateManager.getZoomInfo('julia');
        const precisionLevel = Math.max(
            mandelbrotZoomInfo.precisionLevel || 0,
            juliaZoomInfo.precisionLevel || 0
        );
        this.lastPrecisionLevel = precisionLevel;

        // Select appropriate fragment shader based on precision needs
        let fragmentShaderName = 'fractal.wgsl';
        let shaderDefines = null;

        if (precisionLevel > 2.0)
        {
            // Ultra-high precision needed
            fragmentShaderName = 'fractal_enhanced.wgsl';
            shaderDefines = {
                ENABLE_ULTRA_PRECISION: true,
                PRECISION_LEVEL: precisionLevel.toFixed(1)
            };
            logger.info('Using ultra precision shader for deep zoom');
        } else if (precisionLevel > 0)
        {
            // Enhanced precision
            fragmentShaderName = 'fractal_enhanced.wgsl';
            shaderDefines = {
                ENABLE_ULTRA_PRECISION: false,
                PRECISION_LEVEL: precisionLevel.toFixed(1)
            };
            logger.info('Using enhanced precision shader');
        }

        // Load shaders using the enhanced shader loader
        try
        {
            const shaders = await shaderLoader.loadShaders(fragmentShaderName, shaderDefines);

            // Create shader modules
            const vertexShader = this.webgpuContext.createShaderModule(shaders.vertex, 'Vertex Shader');
            const fragmentShader = this.webgpuContext.createShaderModule(shaders.fragment, 'Fragment Shader');

            // Create bind group layout
            this.bindGroupLayout = this.webgpuContext.createBindGroupLayout([
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                }
            ], 'Fractal Bind Group Layout');

            // Create pipeline layout
            const pipelineLayout = this.webgpuContext.device.createPipelineLayout({
                label: 'Fractal Pipeline Layout',
                bindGroupLayouts: [this.bindGroupLayout]
            });

            // Create render pipeline
            this.renderPipeline = this.webgpuContext.createRenderPipeline({
                label: 'Fractal Render Pipeline',
                layout: pipelineLayout,
                vertex: {
                    module: vertexShader,
                    entryPoint: 'main',
                },
                fragment: {
                    module: fragmentShader,
                    entryPoint: 'main',
                    targets: [{
                        format: this.webgpuContext.canvasFormat,
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'zero',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'zero',
                                operation: 'add',
                            },
                        },
                    }],
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'none',
                },
            });

            logger.debug('Render pipeline created successfully');
        } catch (error)
        {
            logger.error('Failed to create render pipeline:', error);
            throw error;
        }
    }

    /**
     * Create uniform buffers
     */
    createBuffers()
    {
        // Create uniform buffer manager
        this.uniformBufferManager = new UniformBufferManager(this.webgpuContext);
        this.uniformBufferManager.initialize(this.bindGroupLayout);

        logger.debug('Fractal buffers created');
    }

    /**
     * Update uniform buffer with enhanced parameters for infinite zoom
     */
    updateUniforms()
    {
        // Check precision level to see if we need to recreate the pipeline
        const juliaZoomInfo = this.stateManager.getZoomInfo('julia');
        const mandelbrotZoomInfo = this.stateManager.getZoomInfo('mandelbrot');
        const precisionLevel = Math.max(juliaZoomInfo.precisionLevel || 0, mandelbrotZoomInfo.precisionLevel || 0);

        // Handle shader switching based on precision requirements
        const needsShaderSwitch =
            (precisionLevel > 2.0 && this.lastPrecisionLevel <= 2.0) || // Upgrade to ultra precision
            (precisionLevel <= 2.0 && this.lastPrecisionLevel > 2.0) || // Downgrade from ultra
            (precisionLevel > 0 && this.lastPrecisionLevel === 0) ||    // Upgrade to enhanced
            (precisionLevel === 0 && this.lastPrecisionLevel > 0);      // Downgrade to standard

        if (needsShaderSwitch)
        {
            const direction = precisionLevel > this.lastPrecisionLevel ? 'Upgrading' : 'Downgrading';
            logger.info(`${direction} shader precision (level: ${precisionLevel.toFixed(2)})`);

            this.lastPrecisionLevel = precisionLevel;

            // Recreate pipeline with appropriate shader
            this.createRenderPipeline().then(() =>
            {
                // Re-initialize buffer manager with the new bind group layout
                this.createBuffers();
            });
            return;
        }

        // Update uniforms using the buffer manager
        this.uniformBufferManager.updateUniforms(this.stateManager, this.canvasManager);
    }

    /**
     * Setup resize handler
     */
    setupResizeHandler()
    {
        this.canvasManager.onResize(() =>
        {
            if (!this.isInitialized) return;
            if (this.uniformBufferManager)
            {
                this.uniformBufferManager.markDirty(); // Force update on resize
                this.updateUniforms();
            }
        });
    }

    /**
     * Render the current frame
     */
    render()
    {
        if (!this.isInitialized || !this.uniformBufferManager) return;

        // Ensure uniform buffer is up to date
        this.updateUniforms();

        const commandEncoder = this.webgpuContext.createCommandEncoder('Fractal Render');

        const renderPassDescriptor = {
            label: 'Fractal Render Pass',
            colorAttachments: [{
                view: this.webgpuContext.getCurrentTextureView(),
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.renderPipeline);
        passEncoder.setBindGroup(0, this.uniformBufferManager.getBindGroup());
        passEncoder.draw(6, 1, 0, 0); // Draw full-screen triangle pair
        passEncoder.end();

        this.webgpuContext.submitCommands([commandEncoder.finish()]);
    }

    /**
     * Clean up renderer resources
     */
    destroy()
    {
        if (this.uniformBufferManager)
        {
            this.uniformBufferManager.destroy();
            this.uniformBufferManager = null;
        }

        this.renderPipeline = null;
        this.bindGroupLayout = null;
        this.isInitialized = false;

        logger.info('🗑️ Fractal renderer destroyed');
    }
}
