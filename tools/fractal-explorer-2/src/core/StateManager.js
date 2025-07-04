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

        this.emit('mousePositionChange', this.complexCoordinates);
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
        if (this.renderMode === RenderModes.DUAL)
        {
            // Reset both sets in dual mode
            this.juliaParams = { ...DefaultJuliaParams };
            this.mandelbrotParams = { ...DefaultMandelbrotParams };
            this.zoomPrecision = { ...DefaultPrecisionParams };
            this.mandelbrotPrecision = { ...DefaultMandelbrotPrecision };
            this.activeView = RenderModes.MANDELBROT;

            this.emit('parameterChange', { type: 'reset-dual' });
        } else if (this.renderMode === RenderModes.JULIA)
        {
            this.juliaParams = { ...DefaultJuliaParams };
            this.zoomPrecision = { ...DefaultPrecisionParams };

            this.emit('parameterChange', { type: 'reset-julia' });
        } else
        {
            this.mandelbrotParams = { ...DefaultMandelbrotParams };
            this.mandelbrotPrecision = { ...DefaultMandelbrotPrecision };

            this.emit('parameterChange', { type: 'reset-mandelbrot' });
        }

        this.emit('stateChange', this.getState());
    }

    /**
     * Set performance mode
     * @param {boolean} enabled - Whether to enable performance mode
     */
    setPerformanceMode(enabled)
    {
        this.performanceMode = enabled;

        if (enabled)
        {
            // Reduce quality for better performance
            this.qualityLevel = Math.max(1, this.qualityLevel - 1);
        }

        this.emit('performanceModeChange', enabled);
        this.emit('stateChange', this.getState());
    }

    /**
     * Get complete application state
     * @returns {Object} Complete state object
     */
    getState()
    {
        return {
            renderMode: this.renderMode,
            activeView: this.activeView,
            juliaParams: { ...this.juliaParams },
            mandelbrotParams: { ...this.mandelbrotParams },
            zoomPrecision: { ...this.zoomPrecision },
            mandelbrotPrecision: { ...this.mandelbrotPrecision },
            mouseState: { ...this.mouseState },
            complexCoordinates: { ...this.complexCoordinates },
            qualityLevel: this.qualityLevel,
            performanceMode: this.performanceMode
        };
    }

    /**
     * Load state from object
     * @param {Object} state - State to load
     */
    loadState(state)
    {
        this.renderMode = state.renderMode || this.renderMode;
        this.activeView = state.activeView || this.activeView;

        if (state.juliaParams) this.juliaParams = { ...state.juliaParams };
        if (state.mandelbrotParams) this.mandelbrotParams = { ...state.mandelbrotParams };
        if (state.zoomPrecision) this.zoomPrecision = { ...state.zoomPrecision };
        if (state.mandelbrotPrecision) this.mandelbrotPrecision = { ...state.mandelbrotPrecision };

        this.qualityLevel = state.qualityLevel || this.qualityLevel;
        this.performanceMode = state.performanceMode || false;

        this.emit('stateChange', this.getState());
    }
}
