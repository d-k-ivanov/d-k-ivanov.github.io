/**
 * Uniform Buffer Management for Fractal Rendering
 * Optimizes buffer updates and manages uniform data efficiently
 */
import { logger } from '../utils/Logger.js';
import { WEBGPU_CONSTANTS } from '../config/Constants.js';

/**
 * Manages uniform buffers for fractal rendering with optimization
 */
export class UniformBufferManager
{
    constructor(webgpuContext)
    {
        this.webgpuContext = webgpuContext;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.lastUniformData = null;
        this.isDirty = true;
        this.previousColorOffsets = null;
    }

    /**
     * Create uniform buffer and bind group
     * @param {GPUBindGroupLayout} bindGroupLayout - Bind group layout
     */
    initialize(bindGroupLayout)
    {
        this.bindGroupLayout = bindGroupLayout;

        // Create initial buffer with placeholder data
        const initialData = new Float32Array(24); // 24 floats = 96 bytes, aligned to 16 bytes
        this.uniformBuffer = this.webgpuContext.createUniformBuffer(initialData, 'Fractal Uniform Buffer');

        // Create bind group
        this.bindGroup = this.webgpuContext.createBindGroup(
            bindGroupLayout,
            [{
                binding: 0,
                resource: {
                    buffer: this.uniformBuffer,
                },
            }],
            'Fractal Bind Group'
        );

        logger.debug('Uniform buffer manager initialized');
    }

    /**
     * Update uniform buffer with fractal parameters
     * Only updates if data has changed to optimize performance
     * @param {Object} stateManager - Application state manager
     * @param {Object} canvasManager - Canvas manager for dimensions
     * @returns {boolean} True if buffer was updated
     */
    updateUniforms(stateManager, canvasManager)
    {
        const uniformData = this.buildUniformData(stateManager, canvasManager);

        // Compare with last data to avoid unnecessary updates
        if (!this.isDirty && this.lastUniformData && this.arraysEqual(uniformData, this.lastUniformData))
        {
            return false; // No update needed
        }

        // Update buffer
        this.webgpuContext.updateBuffer(this.uniformBuffer, uniformData);
        this.lastUniformData = new Float32Array(uniformData);
        this.isDirty = false;

        return true; // Buffer was updated
    }

    /**
     * Build uniform data array from application state
     * @param {Object} stateManager - Application state manager
     * @param {Object} canvasManager - Canvas manager
     * @returns {Float32Array} Uniform data array
     */
    buildUniformData(stateManager, canvasManager)
    {
        const state = stateManager.getState();
        const dimensions = canvasManager.getDimensions();

        // Convert render mode to shader value
        const renderModeValue = this.getRenderModeValue(state.renderMode);

        // Get enhanced parameters from zoom controllers
        const juliaZoomInfo = stateManager.getZoomInfo('julia');
        const mandelbrotZoomInfo = stateManager.getZoomInfo('mandelbrot');

        // Get shader parameters with precision information
        const aspect = dimensions.width / dimensions.height;
        const juliaShaderParams = state.juliaZoomController?.getShaderParams(aspect) || {};
        const mandelbrotShaderParams = state.mandelbrotZoomController?.getShaderParams(aspect) || {};

        // Apply color stabilization during zoom operations
        const colorOffsets = this.calculateStabilizedColorOffsets(state);

        // Create enhanced uniform data array with new parameters
        return new Float32Array([
            state.juliaParams.c_real,                          // 0
            state.juliaParams.c_imag,                          // 1
            state.juliaParams.zoom,                            // 2
            state.juliaParams.offsetX,                         // 3
            state.juliaParams.offsetY,                         // 4
            state.juliaParams.maxIterations,                   // 5
            colorOffsets.julia,                                // 6 - smoothed color offset
            state.mandelbrotParams.zoom,                       // 7
            state.mandelbrotParams.offsetX,                    // 8
            state.mandelbrotParams.offsetY,                    // 9
            state.mandelbrotParams.maxIterations,              // 10
            colorOffsets.mandelbrot,                           // 11 - smoothed color offset
            dimensions.width,                                  // 12
            dimensions.height,                                 // 13
            renderModeValue,                                   // 14
            // Enhanced parameters for infinite zoom
            Math.max(juliaZoomInfo.precisionLevel || 0, mandelbrotZoomInfo.precisionLevel || 0), // 15 - precision_level
            juliaShaderParams.colorScale || mandelbrotShaderParams.colorScale || 1.0, // 16 - color_scale
            juliaShaderParams.detailLevel || mandelbrotShaderParams.detailLevel || 0.0, // 17 - detail_level
            juliaShaderParams.referenceReal || 0.0,           // 18 - reference_real
            juliaShaderParams.referenceImag || 0.0,           // 19 - reference_imag
            juliaShaderParams.perturbationScale || 0.0,       // 20 - perturbation_scale
            juliaShaderParams.adaptiveIterations || state.juliaParams.maxIterations, // 21 - adaptive_iterations
            0.0                                                // 22 - padding
        ]);
    }

    /**
     * Convert render mode string to shader numeric value
     * @param {string} renderMode - Render mode ('julia', 'mandelbrot', 'dual')
     * @returns {number} Shader render mode value
     */
    getRenderModeValue(renderMode)
    {
        switch (renderMode)
        {
            case 'julia':
                return 0.0;
            case 'mandelbrot':
                return 1.0;
            case 'dual':
                return 2.0;
            default:
                logger.warn(`Unknown render mode: ${renderMode}, defaulting to julia`);
                return 0.0;
        }
    }

    /**
     * Calculate stabilized color offsets to reduce flickering during zoom
     * @param {Object} state - Application state
     * @returns {Object} Stabilized color offsets
     */
    calculateStabilizedColorOffsets(state)
    {
        let juliaColorOffset = state.juliaParams.colorOffset;
        let mandelbrotColorOffset = state.mandelbrotParams.colorOffset;

        // Smooth color offset transitions if stabilizer is active
        if (state.colorStabilityBuffer?.stabilizerActive)
        {
            // Apply temporal smoothing to color offsets during zoom
            if (!this.previousColorOffsets)
            {
                this.previousColorOffsets = {
                    julia: juliaColorOffset,
                    mandelbrot: mandelbrotColorOffset
                };
            }

            const smoothingFactor = 0.8; // Higher = more smoothing
            juliaColorOffset = this.previousColorOffsets.julia * smoothingFactor + juliaColorOffset * (1 - smoothingFactor);
            mandelbrotColorOffset = this.previousColorOffsets.mandelbrot * smoothingFactor + mandelbrotColorOffset * (1 - smoothingFactor);

            this.previousColorOffsets.julia = juliaColorOffset;
            this.previousColorOffsets.mandelbrot = mandelbrotColorOffset;
        }
        else if (this.previousColorOffsets)
        {
            this.previousColorOffsets = null; // Reset when not stabilizing
        }

        return {
            julia: juliaColorOffset,
            mandelbrot: mandelbrotColorOffset
        };
    }

    /**
     * Compare two Float32Arrays for equality
     * @param {Float32Array} a - First array
     * @param {Float32Array} b - Second array
     * @returns {boolean} True if arrays are equal
     */
    arraysEqual(a, b)
    {
        if (!a || !b || a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++)
        {
            if (Math.abs(a[i] - b[i]) > 1e-10) return false; // Use small epsilon for float comparison
        }
        return true;
    }

    /**
     * Mark the buffer as dirty to force next update
     */
    markDirty()
    {
        this.isDirty = true;
    }

    /**
     * Get the bind group for rendering
     * @returns {GPUBindGroup}
     */
    getBindGroup()
    {
        return this.bindGroup;
    }

    /**
     * Clean up resources
     */
    destroy()
    {
        if (this.uniformBuffer)
        {
            this.uniformBuffer.destroy();
            this.uniformBuffer = null;
        }

        this.bindGroup = null;
        this.lastUniformData = null;
        this.previousColorOffsets = null;
        this.isDirty = true;

        logger.debug('Uniform buffer manager destroyed');
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getStats()
    {
        return {
            bufferSize: this.lastUniformData ? this.lastUniformData.length * 4 : 0, // bytes
            isDirty: this.isDirty,
            hasColorStabilization: !!this.previousColorOffsets
        };
    }
}
