/**
 * Fractal parameter management and state handling
 * Manages Julia and Mandelbrot set parameters with validation
 */
import { EventEmitter } from '../utils/EventEmitter.js';
import { logger } from '../utils/Logger.js';
import
    {
        DefaultJuliaParams,
        DefaultMandelbrotParams,
        DefaultPrecisionParams,
        DefaultMandelbrotPrecision,
        NavigationLimits
    } from './DefaultSettings.js';

export class FractalParams extends EventEmitter
{
    constructor()
    {
        super();
        this.reset();
    }

    /**
     * Reset all parameters to defaults
     */
    reset()
    {
        this.juliaParams = { ...DefaultJuliaParams };
        this.mandelbrotParams = { ...DefaultMandelbrotParams };
        this.zoomPrecision = { ...DefaultPrecisionParams };
        this.mandelbrotPrecision = { ...DefaultMandelbrotPrecision };

        logger.info('Parameters reset to defaults');
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Get all parameters as a single object
     * @returns {Object} All fractal parameters
     */
    getAllParams()
    {
        return {
            julia: { ...this.juliaParams },
            mandelbrot: { ...this.mandelbrotParams },
            juliaZoom: { ...this.zoomPrecision },
            mandelbrotZoom: { ...this.mandelbrotPrecision }
        };
    }

    /**
     * Get Julia set parameters
     * @returns {Object} Julia parameters
     */
    getJuliaParams()
    {
        return { ...this.juliaParams };
    }

    /**
     * Get Mandelbrot set parameters
     * @returns {Object} Mandelbrot parameters
     */
    getMandelbrotParams()
    {
        return { ...this.mandelbrotParams };
    }

    /**
     * Update Julia set complex constant
     * @param {number} real - Real part of c
     * @param {number} imag - Imaginary part of c
     */
    setJuliaConstant(real, imag)
    {
        this.juliaParams.c_real = real;
        this.juliaParams.c_imag = imag;

        logger.debug(`Julia constant updated: c = ${real} + ${imag}i`);
        this.emit('juliaConstantChanged', { real, imag });
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Julia set zoom and position
     * @param {number} zoom - Zoom level
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     */
    setJuliaView(zoom, offsetX, offsetY)
    {
        this.juliaParams.zoom = Math.max(0.001, zoom);
        this.juliaParams.offsetX = offsetX;
        this.juliaParams.offsetY = offsetY;

        // Update precision tracking
        this.zoomPrecision.logZoom = Math.log(this.juliaParams.zoom);
        this.zoomPrecision.centerX = offsetX;
        this.zoomPrecision.centerY = offsetY;

        this.emit('juliaViewChanged', { zoom, offsetX, offsetY });
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Mandelbrot set zoom and position
     * @param {number} zoom - Zoom level
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     */
    setMandelbrotView(zoom, offsetX, offsetY)
    {
        this.mandelbrotParams.zoom = Math.max(0.001, zoom);
        this.mandelbrotParams.offsetX = offsetX;
        this.mandelbrotParams.offsetY = offsetY;

        // Update precision tracking
        this.mandelbrotPrecision.logZoom = Math.log(this.mandelbrotParams.zoom);
        this.mandelbrotPrecision.centerX = offsetX;
        this.mandelbrotPrecision.centerY = offsetY;

        this.emit('mandelbrotViewChanged', { zoom, offsetX, offsetY });
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Julia set iterations
     * @param {number} iterations - Maximum iterations
     */
    setJuliaIterations(iterations)
    {
        this.juliaParams.maxIterations = Math.max(1, Math.min(NavigationLimits.maxIterations, iterations));

        this.emit('juliaIterationsChanged', this.juliaParams.maxIterations);
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Mandelbrot set iterations
     * @param {number} iterations - Maximum iterations
     */
    setMandelbrotIterations(iterations)
    {
        this.mandelbrotParams.maxIterations = Math.max(1, Math.min(NavigationLimits.maxIterations, iterations));

        this.emit('mandelbrotIterationsChanged', this.mandelbrotParams.maxIterations);
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Julia color offset
     * @param {number} offset - Color offset value
     */
    setJuliaColorOffset(offset)
    {
        this.juliaParams.colorOffset = offset;
        this.emit('juliaColorChanged', offset);
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Update Mandelbrot color offset
     * @param {number} offset - Color offset value
     */
    setMandelbrotColorOffset(offset)
    {
        this.mandelbrotParams.colorOffset = offset;
        this.emit('mandelbrotColorChanged', offset);
        this.emit('parametersChanged', this.getAllParams());
    }

    /**
     * Get zoom-adjusted navigation step
     * @param {string} fractalType - 'julia' or 'mandelbrot'
     * @returns {number} Zoom-adjusted step size
     */
    getZoomAdjustedStep(fractalType)
    {
        const zoom = fractalType === 'julia' ? this.juliaParams.zoom : this.mandelbrotParams.zoom;
        return NavigationLimits.baseStep / Math.sqrt(zoom);
    }

    /**
     * Calculate adaptive iterations based on zoom level
     * @param {string} fractalType - 'julia' or 'mandelbrot'
     * @returns {number} Adaptive iteration count
     */
    getAdaptiveIterations(fractalType)
    {
        const precision = fractalType === 'julia' ? this.zoomPrecision : this.mandelbrotPrecision;
        const baseIterations = NavigationLimits.baseIterations;
        const zoomFactor = Math.max(1.0, precision.logZoom / 10.0);

        return Math.min(NavigationLimits.maxIterations, baseIterations * Math.sqrt(zoomFactor));
    }

    /**
     * Validate and clamp parameter values
     * @param {Object} params - Parameters to validate
     * @returns {Object} Validated parameters
     */
    validateParams(params)
    {
        const validated = { ...params };

        // Clamp zoom values
        if (validated.zoom !== undefined)
        {
            validated.zoom = Math.max(0.001, validated.zoom);
        }

        // Clamp iterations
        if (validated.maxIterations !== undefined)
        {
            validated.maxIterations = Math.max(1, Math.min(NavigationLimits.maxIterations, validated.maxIterations));
        }

        return validated;
    }

    /**
     * Export parameters for saving/loading
     * @returns {Object} Serializable parameters
     */
    export()
    {
        return {
            julia: this.juliaParams,
            mandelbrot: this.mandelbrotParams,
            juliaZoom: this.zoomPrecision,
            mandelbrotZoom: this.mandelbrotPrecision,
            timestamp: Date.now()
        };
    }

    /**
     * Import parameters from saved data
     * @param {Object} data - Imported parameter data
     */
    import(data)
    {
        if (data.julia)
        {
            this.juliaParams = this.validateParams(data.julia);
        }
        if (data.mandelbrot)
        {
            this.mandelbrotParams = this.validateParams(data.mandelbrot);
        }
        if (data.juliaZoom)
        {
            this.zoomPrecision = { ...data.juliaZoom };
        }
        if (data.mandelbrotZoom)
        {
            this.mandelbrotPrecision = { ...data.mandelbrotZoom };
        }

        logger.info('Parameters imported successfully');
        this.emit('parametersChanged', this.getAllParams());
    }
}
