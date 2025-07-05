/**
 * Application State Manager
 * Centralized state management with event-driven updates
 */
import { EventEmitter } from '../utils/EventEmitter.js';
import
{
    DefaultJuliaParams,
    DefaultMandelbrotParams,
    DefaultPrecisionParams,
    DefaultMandelbrotPrecision,
    DefaultAppSettings
} from '../config/DefaultSettings.js';
import { RenderModes, RenderModeUtils } from '../config/RenderModes.js';
import { InfiniteZoomController } from '../math/HighPrecision.js';

export class StateManager extends EventEmitter
{
    constructor()
    {
        super();

        // Initialize fractal parameters from defaults
        this.juliaParams = { ...DefaultJuliaParams };
        this.mandelbrotParams = { ...DefaultMandelbrotParams };

        // Initialize precision tracking
        this.zoomPrecision = { ...DefaultPrecisionParams };
        this.mandelbrotPrecision = { ...DefaultMandelbrotPrecision };

        // Initialize infinite zoom controllers
        this.juliaZoomController = new InfiniteZoomController();
        this.mandelbrotZoomController = new InfiniteZoomController();

        // Set initial centers
        this.juliaZoomController.setCenter(0, 0);
        this.mandelbrotZoomController.setCenter(-0.5, 0);

        // Application state
        this.renderMode = DefaultAppSettings.renderMode;
        this.activeView = DefaultAppSettings.activeView;

        // Mouse and interaction state
        this.mouseState = {
            x: 0,
            y: 0,
            pressed: false,
            lastX: 0,
            lastY: 0,
            button: -1
        };

        // Complex coordinates for display
        this.complexCoordinates = { x: 0, y: 0 };

        // Performance and quality settings
        this.qualityLevel = DefaultAppSettings.quality;
        this.performanceMode = false;

        // Infinite zoom state
        this.infiniteZoomEnabled = true;
        this.dynamicIterations = true;
    }

    /**
     * Update Julia set parameters
     * @param {Object} updates - Parameter updates
     */
    updateJuliaParams(updates)
    {
        const oldParams = { ...this.juliaParams };
        Object.assign(this.juliaParams, updates);

        this.emit('parameterChange', {
            type: 'julia',
            oldParams,
            newParams: this.juliaParams
        });
    }

    /**
     * Update Mandelbrot set parameters
     * @param {Object} updates - Parameter updates
     */
    updateMandelbrotParams(updates)
    {
        const oldParams = { ...this.mandelbrotParams };
        Object.assign(this.mandelbrotParams, updates);

        this.emit('parameterChange', {
            type: 'mandelbrot',
            oldParams,
            newParams: this.mandelbrotParams
        });
    }

    /**
     * Set render mode (mandelbrot, julia, dual)
     * @param {string} mode - New render mode
     */
    setRenderMode(mode)
    {
        if (!RenderModeUtils.isValid(mode))
        {
            console.warn(`Invalid render mode: ${mode}`);
            return;
        }

        const oldMode = this.renderMode;
        this.renderMode = mode;

        // Auto-adjust active view for consistency
        if (mode === RenderModes.DUAL)
        {
            this.activeView = RenderModes.MANDELBROT; // Start with Mandelbrot in dual mode
        } else
        {
            this.activeView = mode; // Single view matches render mode
        }

        this.emit('modeChange', {
            oldMode,
            newMode: mode,
            activeView: this.activeView
        });

        this.emit('stateChange', this.getState());
    }

    /**
     * Set active view in dual mode
     * @param {string} view - Active view (mandelbrot or julia)
     */
    setActiveView(view)
    {
        if (this.renderMode !== RenderModes.DUAL)
        {
            console.warn('Active view can only be set in dual mode');
            return;
        }

        const oldView = this.activeView;
        this.activeView = view;

        this.emit('activeViewChange', {
            oldView,
            newView: view
        });

        this.emit('stateChange', this.getState());
    }

    /**
     * Cycle through render modes
     */
    cycleFractalMode()
    {
        const modes = [RenderModes.MANDELBROT, RenderModes.JULIA, RenderModes.DUAL];
        const currentIndex = modes.indexOf(this.renderMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];

        this.setRenderMode(nextMode);
    }

    /**
     * Update mouse state and complex coordinates
     * @param {Object} mouseData - Mouse position and state
     */
    updateMouseState(mouseData)
    {
        Object.assign(this.mouseState, mouseData);

        // Calculate complex coordinates based on current view
        this.updateComplexCoordinates();

        this.emit('mouseStateChange', this.mouseState);
        this.emit('mousePositionChange', this.complexCoordinates);
    }

    /**
     * Calculate complex coordinates from mouse position
     */
    updateComplexCoordinates()
    {
        // This will be called by the mouse handler with proper canvas context
        // The actual coordinate calculation depends on canvas dimensions and current view
    }

    /**
     * Set complex coordinates directly
     * @param {number} x - Real component
     * @param {number} y - Imaginary component
     */
    setComplexCoordinates(x, y)
    {
        this.complexCoordinates.x = x;
        this.complexCoordinates.y = y;

        // Enhanced coordinate update with zoom information for infinite zoom display
        const zoomInfo = this.getZoomInfo();
        const currentParams = this.getCurrentParams();

        this.emit('mousePositionChange', {
            ...this.complexCoordinates,
            zoom: currentParams.zoom,
            renderMode: this.renderMode,
            activeView: this.getActiveView(),
            juliaParams: this.juliaParams,
            zoomInfo: zoomInfo
        });
    }

    /**
     * Get current parameters for the active view
     * @returns {Object} Current view parameters
     */
    getCurrentParams()
    {
        if (this.renderMode === RenderModes.DUAL)
        {
            return this.activeView === RenderModes.JULIA ? this.juliaParams : this.mandelbrotParams;
        } else if (this.renderMode === RenderModes.JULIA)
        {
            return this.juliaParams;
        } else
        {
            return this.mandelbrotParams;
        }
    }

    /**
     * Get current precision settings for the active view
     * @returns {Object} Current precision settings
     */
    getCurrentPrecision()
    {
        if (this.renderMode === RenderModes.DUAL)
        {
            return this.activeView === RenderModes.JULIA ? this.zoomPrecision : this.mandelbrotPrecision;
        } else if (this.renderMode === RenderModes.JULIA)
        {
            return this.zoomPrecision;
        } else
        {
            return this.mandelbrotPrecision;
        }
    }

    /**
     * Update parameters for the currently active view
     * @param {Object} updates - Parameter updates
     */
    updateCurrentParams(updates)
    {
        if (this.renderMode === RenderModes.DUAL)
        {
            if (this.activeView === RenderModes.JULIA)
            {
                this.updateJuliaParams(updates);
            } else
            {
                this.updateMandelbrotParams(updates);
            }
        } else if (this.renderMode === RenderModes.JULIA)
        {
            this.updateJuliaParams(updates);
        } else
        {
            this.updateMandelbrotParams(updates);
        }
    }

    /**
     * Reset parameters to defaults
     */
    resetParameters()
    {
        this.juliaParams = { ...DefaultJuliaParams };
        this.mandelbrotParams = { ...DefaultMandelbrotParams };
        this.zoomPrecision = { ...DefaultPrecisionParams };
        this.mandelbrotPrecision = { ...DefaultMandelbrotPrecision };

        // Reset infinite zoom controllers
        this.juliaZoomController.reset();
        this.mandelbrotZoomController.reset();
        this.mandelbrotZoomController.setCenter(-0.5, 0);

        this.emit('stateChange', this.getState());
    }

    /**
     * Apply infinite zoom at specific point
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized) 
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     * @param {string} targetView - Target view ('julia' or 'mandelbrot')
     */
    applyInfiniteZoom(mouseX, mouseY, zoomFactor, aspect, targetView = null)
    {
        const view = targetView || this.getActiveView();

        if (view === 'julia')
        {
            this.juliaZoomController.zoomAt(mouseX, mouseY, zoomFactor, aspect);
            const shaderParams = this.juliaZoomController.getShaderParams(aspect);

            // Update legacy parameters for compatibility
            this.juliaParams.zoom = shaderParams.zoom;
            this.juliaParams.offsetX = shaderParams.offsetX;
            this.juliaParams.offsetY = shaderParams.offsetY;

            // Update iterations based on zoom level
            if (this.dynamicIterations)
            {
                this.juliaParams.maxIterations = this.juliaZoomController.getRecommendedIterations();
            }
        }
        else
        {
            this.mandelbrotZoomController.zoomAt(mouseX, mouseY, zoomFactor, aspect);
            const shaderParams = this.mandelbrotZoomController.getShaderParams(aspect);

            // Update legacy parameters for compatibility
            this.mandelbrotParams.zoom = shaderParams.zoom;
            this.mandelbrotParams.offsetX = shaderParams.offsetX;
            this.mandelbrotParams.offsetY = shaderParams.offsetY;

            // Update iterations based on zoom level
            if (this.dynamicIterations)
            {
                this.mandelbrotParams.maxIterations = this.mandelbrotZoomController.getRecommendedIterations();
            }
        }

        this.emit('zoomChange', {
            view,
            zoomInfo: this.getZoomInfo(view)
        });

        this.emit('stateChange', this.getState());
    }

    /**
     * Apply infinite pan
     * @param {number} deltaX - Pan delta X
     * @param {number} deltaY - Pan delta Y
     * @param {number} aspect - Aspect ratio
     * @param {string} targetView - Target view ('julia' or 'mandelbrot')
     */
    applyInfinitePan(deltaX, deltaY, aspect, targetView = null)
    {
        const view = targetView || this.getActiveView();

        if (view === 'julia')
        {
            this.juliaZoomController.pan(deltaX, deltaY, aspect);
            const shaderParams = this.juliaZoomController.getShaderParams(aspect);

            this.juliaParams.offsetX = shaderParams.offsetX;
            this.juliaParams.offsetY = shaderParams.offsetY;
        }
        else
        {
            this.mandelbrotZoomController.pan(deltaX, deltaY, aspect);
            const shaderParams = this.mandelbrotZoomController.getShaderParams(aspect);

            this.mandelbrotParams.offsetX = shaderParams.offsetX;
            this.mandelbrotParams.offsetY = shaderParams.offsetY;
        }

        this.emit('stateChange', this.getState());
    }

    /**
     * Get current zoom information
     * @param {string} view - View to get info for ('julia' or 'mandelbrot')
     * @returns {Object} Zoom information
     */
    getZoomInfo(view = null)
    {
        const targetView = view || this.getActiveView();

        if (targetView === 'julia')
        {
            return this.juliaZoomController.getZoomInfo();
        }
        else
        {
            return this.mandelbrotZoomController.getZoomInfo();
        }
    }

    /**
     * Get the currently active view
     * @returns {string} Active view name
     */
    getActiveView()
    {
        if (this.renderMode === RenderModes.DUAL)
        {
            return this.activeView === RenderModes.JULIA ? 'julia' : 'mandelbrot';
        }
        else if (this.renderMode === RenderModes.JULIA)
        {
            return 'julia';
        }
        else
        {
            return 'mandelbrot';
        }
    }

    /**
     * Toggle infinite zoom feature
     * @param {boolean} enabled - Whether to enable infinite zoom
     */
    setInfiniteZoom(enabled)
    {
        this.infiniteZoomEnabled = enabled;
        this.emit('stateChange', this.getState());
    }

    /**
     * Toggle dynamic iteration adjustment
     * @param {boolean} enabled - Whether to enable dynamic iterations
     */
    setDynamicIterations(enabled)
    {
        this.dynamicIterations = enabled;
        this.emit('stateChange', this.getState());
    }

    /**
     * Get shader parameters for infinite zoom
     * @param {number} aspect - Aspect ratio
     * @returns {Object} Shader parameters with high precision support
     */
    getInfiniteZoomShaderParams(aspect)
    {
        return {
            julia: this.juliaZoomController.getShaderParams(aspect),
            mandelbrot: this.mandelbrotZoomController.getShaderParams(aspect)
        };
    }

    /**
     * Get current application state
     * @returns {Object} Complete application state
     */
    getState()
    {
        return {
            // Fractal parameters
            juliaParams: { ...this.juliaParams },
            mandelbrotParams: { ...this.mandelbrotParams },

            // Precision tracking
            zoomPrecision: { ...this.zoomPrecision },
            mandelbrotPrecision: { ...this.mandelbrotPrecision },

            // Application state
            renderMode: this.renderMode,
            activeView: this.activeView,

            // Mouse and interaction state
            mouseState: { ...this.mouseState },
            complexCoordinates: { ...this.complexCoordinates },

            // Features
            infiniteZoomEnabled: this.infiniteZoomEnabled,
            dynamicIterations: this.dynamicIterations,

            // Performance settings
            qualityLevel: this.qualityLevel,
            performanceMode: this.performanceMode
        };
    }

    // ...existing code...
}
