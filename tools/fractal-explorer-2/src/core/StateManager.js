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

        // Color stability tracking
        this.colorStabilityBuffer = {
            lastIterationUpdate: 0,
            iterationUpdateCooldown: 500, // ms before allowing iteration changes
            stabilizerActive: false,
            targetIterations: {
                julia: DefaultJuliaParams.maxIterations,
                mandelbrot: DefaultMandelbrotParams.maxIterations
            },
            smoothTransitionActive: false
        };
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
     * Set render mode (mandelbrot, julia, dual, and other fractal types)
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
        }
        else if (mode === RenderModes.JULIA)
        {
            this.activeView = RenderModes.JULIA; // Julia-based fractals
        }
        else if (mode === RenderModes.BURNING_SHIP || mode === RenderModes.TRICORN ||
            mode === RenderModes.PHOENIX || mode === RenderModes.NEWTON)
        {
            // Set the active view to MANDELBROT for all Mandelbrot-derived fractals
            this.activeView = RenderModes.MANDELBROT;
        }
        else
        {
            this.activeView = mode; // Single view matches render mode (default case)
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
     * Cycle through all render modes
     */
    cycleFractalMode()
    {
        const modes = [
            RenderModes.MANDELBROT,
            RenderModes.JULIA,
            RenderModes.BURNING_SHIP,
            RenderModes.TRICORN,
            RenderModes.PHOENIX,
            RenderModes.NEWTON,
            RenderModes.DUAL
        ];
        const currentIndex = modes.indexOf(this.renderMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        this.setRenderMode(nextMode);

        console.log(`Cycled to ${RenderModeUtils.getModeName(nextMode)} mode`);
    }

    /**
     * Update mouse state and complex coordinates
     * @param {Object} mouseData - Mouse position and state
     */
    updateMouseState(mouseData)
    {
        Object.assign(this.mouseState, mouseData);
        this.emit('mouseStateChange', this.mouseState);
    }

    /**
     * Set complex coordinates directly
     * @param {number} x - Real component
     * @param {number} y - Imaginary component
     */
    setComplexCoordinates(x, y)
    {
        // Update internal coordinates
        this.complexCoordinates.x = x;
        this.complexCoordinates.y = y;

        // Enhanced coordinate update with zoom information for infinite zoom display
        const zoomInfo = this.getZoomInfo();
        const currentParams = this.getCurrentParams();

        // Calculate magnitude for display
        const magnitude = Math.sqrt(x * x + y * y);

        // Debug logging to help diagnose coordinate issues
        console.log('Setting coordinates:', { x, y, magnitude });

        this.emit('mousePositionChange', {
            real: x,
            imag: y,
            magnitude: magnitude,
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
        // For dual mode, use the active view to determine parameters
        if (this.renderMode === RenderModes.DUAL)
        {
            return this.activeView === RenderModes.JULIA ? this.juliaParams : this.mandelbrotParams;
        }

        // Julia-based fractal modes use Julia parameters
        else if (this.renderMode === RenderModes.JULIA)
        {
            return this.juliaParams;
        }
        // All other modes use Mandelbrot parameters for navigation
        else
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
        // For dual mode, use the active view to determine precision
        if (this.renderMode === RenderModes.DUAL)
        {
            return this.activeView === RenderModes.JULIA ? this.zoomPrecision : this.mandelbrotPrecision;
        }

        // Julia-based fractal modes use Julia precision
        else if (this.renderMode === RenderModes.JULIA)
        {
            return this.zoomPrecision;
        }
        // All other modes (including new fractal types) use Mandelbrot precision for zoom tracking
        else
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

        // Enable color stabilizer during zoom operations
        this.enableColorStabilizer();

        if (view === 'julia')
        {
            this.juliaZoomController.zoomAt(mouseX, mouseY, zoomFactor, aspect);
            const shaderParams = this.juliaZoomController.getShaderParams(aspect);

            // Update legacy parameters for compatibility
            this.juliaParams.zoom = shaderParams.zoom;
            this.juliaParams.offsetX = shaderParams.offsetX;
            this.juliaParams.offsetY = shaderParams.offsetY;

            // Update iterations based on zoom level with color continuity
            if (this.dynamicIterations)
            {
                const newIterations = this.juliaZoomController.getRecommendedIterations();
                this.updateIterationsWithStability('julia', newIterations);
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

            // Update iterations based on zoom level with color continuity
            if (this.dynamicIterations)
            {
                const newIterations = this.mandelbrotZoomController.getRecommendedIterations();
                this.updateIterationsWithStability('mandelbrot', newIterations);
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
     * Update application settings including infinite zoom preferences
     * @param {Object} updates - Settings updates
     */
    updateSettings(updates)
    {
        const oldSettings = {
            infiniteZoomEnabled: this.infiniteZoomEnabled,
            dynamicIterations: this.dynamicIterations,
            qualityLevel: this.qualityLevel,
            performanceMode: this.performanceMode
        };

        if (updates.infiniteZoomEnabled !== undefined)
        {
            this.infiniteZoomEnabled = updates.infiniteZoomEnabled;
        }

        if (updates.dynamicIterations !== undefined)
        {
            this.dynamicIterations = updates.dynamicIterations;
        }

        if (updates.qualityLevel !== undefined)
        {
            this.qualityLevel = updates.qualityLevel;
        }

        if (updates.performanceMode !== undefined)
        {
            this.performanceMode = updates.performanceMode;
        }

        this.emit('settingsChanged', {
            oldSettings,
            newSettings: {
                infiniteZoomEnabled: this.infiniteZoomEnabled,
                dynamicIterations: this.dynamicIterations,
                qualityLevel: this.qualityLevel,
                performanceMode: this.performanceMode
            }
        });
    }

    /**
     * Update complex coordinates for display with enhanced precision information
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    updateComplexCoordinates(mouseX, mouseY, canvasWidth, canvasHeight)
    {
        const state = this.getState();
        let targetView = state.activeView;
        let aspectRatio = canvasWidth / canvasHeight;

        // Adjust for dual mode
        if (state.renderMode === 'dual')
        {
            aspectRatio = (canvasWidth / 2) / canvasHeight;
            if (mouseX < canvasWidth / 2)
            {
                targetView = 'mandelbrot';
                mouseX = mouseX / (canvasWidth / 2);
            } else
            {
                targetView = 'julia';
                mouseX = (mouseX - canvasWidth / 2) / (canvasWidth / 2);
            }
        } else
        {
            mouseX = mouseX / canvasWidth;
        }

        mouseY = mouseY / canvasHeight;

        // Get parameters for target view
        const params = targetView === 'julia' ? state.juliaParams : state.mandelbrotParams;
        const zoomInfo = this.getZoomInfo(targetView);

        // Calculate complex coordinates
        const normalizedX = mouseX - 0.5;
        const normalizedY = mouseY - 0.5;

        const complexReal = normalizedX * 4.0 * aspectRatio / params.zoom + params.offsetX;
        const complexImag = normalizedY * 4.0 / params.zoom + params.offsetY;
        const complexMagnitude = Math.sqrt(complexReal * complexReal + complexImag * complexImag);

        // Determine precision based on zoom level
        let precision = 6;
        if (zoomInfo.zoom > 1e12) precision = 12;
        else if (zoomInfo.zoom > 1e6) precision = 9;

        // Create enhanced coordinate data
        const coordinateData = {
            real: complexReal,
            imag: complexImag,
            magnitude: complexMagnitude,
            zoom: params.zoom,
            precision: precision,
            activeView: targetView,
            zoomInfo: zoomInfo,
            juliaC: {
                real: state.juliaParams.c_real,
                imag: state.juliaParams.c_imag
            }
        };

        // Update internal coordinates (simple format for internal use)
        this.complexCoordinates = { x: complexReal, y: complexImag };

        // Emit enhanced coordinate data for UI display
        this.emit('mousePositionChange', coordinateData);
    }

    /**
     * Get enhanced state with infinite zoom information
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

            // Infinite zoom controllers
            juliaZoomController: this.juliaZoomController,
            mandelbrotZoomController: this.mandelbrotZoomController,

            // UI state
            renderMode: this.renderMode,
            activeView: this.activeView,
            mouseState: { ...this.mouseState },
            complexCoordinates: { ...this.complexCoordinates },

            // Settings
            qualityLevel: this.qualityLevel,
            performanceMode: this.performanceMode,
            infiniteZoomEnabled: this.infiniteZoomEnabled,
            dynamicIterations: this.dynamicIterations
        };
    }

    /**
     * Get enhanced zoom information for both views
     * @param {string} view - View to get info for ('julia' or 'mandelbrot')
     * @returns {Object} Enhanced zoom information
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
     * Get performance metrics for infinite zoom
     * @returns {Object} Performance information
     */
    getPerformanceInfo()
    {
        const juliaZoomInfo = this.getZoomInfo('julia');
        const mandelbrotZoomInfo = this.getZoomInfo('mandelbrot');

        return {
            maxZoomLevel: Math.max(juliaZoomInfo.zoom, mandelbrotZoomInfo.zoom),
            maxPrecisionLevel: Math.max(juliaZoomInfo.precisionLevel, mandelbrotZoomInfo.precisionLevel),
            estimatedComplexity: this.getEstimatedComplexity(),
            recommendedIterations: Math.max(
                this.juliaZoomController.getRecommendedIterations(),
                this.mandelbrotZoomController.getRecommendedIterations()
            ),
            performanceMode: this.performanceMode,
            qualityLevel: this.qualityLevel
        };
    }

    /**
     * Get estimated computational complexity
     * @returns {string} Complexity description
     */
    getEstimatedComplexity()
    {
        const perfInfo = this.getPerformanceInfo();

        if (perfInfo.maxPrecisionLevel === 0) return 'Low';
        if (perfInfo.maxPrecisionLevel <= 2) return 'Medium';
        if (perfInfo.maxPrecisionLevel <= 4) return 'High';
        return 'Extreme';
    }

    /**
     * Enable color stabilizer during active zoom operations
     */
    enableColorStabilizer()
    {
        this.colorStabilityBuffer.stabilizerActive = true;
        this.colorStabilityBuffer.iterationUpdateCooldown = 1000; // Increase cooldown during zoom

        // Reset after a delay if no further zoom operations
        clearTimeout(this.colorStabilityBuffer.stabilizerTimeout);
        this.colorStabilityBuffer.stabilizerTimeout = setTimeout(() =>
        {
            this.disableColorStabilizer();
        }, 2000);
    }

    /**
     * Disable color stabilizer when zoom operations are complete
     */
    disableColorStabilizer()
    {
        this.colorStabilityBuffer.stabilizerActive = false;
        this.colorStabilityBuffer.iterationUpdateCooldown = 500; // Normal cooldown
        this.colorStabilityBuffer.smoothTransitionActive = false;
    }

    /**
     * Update iterations with color stability mechanisms
     * @param {string} fractalType - 'julia' or 'mandelbrot'
     * @param {number} targetIterations - Target iteration count
     */
    updateIterationsWithStability(fractalType, targetIterations)
    {
        const now = Date.now();
        const params = fractalType === 'julia' ? this.juliaParams : this.mandelbrotParams;
        const currentIterations = params.maxIterations;

        // Store target iterations for gradual transition
        this.colorStabilityBuffer.targetIterations[fractalType] = targetIterations;

        // Check if we're in cooldown period to prevent rapid changes
        if (now - this.colorStabilityBuffer.lastIterationUpdate < this.colorStabilityBuffer.iterationUpdateCooldown)
        {
            return; // Skip update during cooldown
        }

        // Calculate iteration change magnitude
        const iterationDelta = Math.abs(targetIterations - currentIterations);
        const relativeChange = iterationDelta / currentIterations;

        // Only update if change is significant but not too dramatic
        if (relativeChange < 0.1)
        {
            return; // Change too small to matter
        }

        let newIterations = targetIterations;

        // Apply gradual transition for large changes
        if (relativeChange > 0.3)
        {
            // Large change - step gradually
            const maxStep = currentIterations * 0.3;
            const stepDirection = targetIterations > currentIterations ? 1 : -1;
            newIterations = currentIterations + (stepDirection * maxStep);

            // Round to stable values to reduce flickering
            if (newIterations >= 1024)
            {
                newIterations = Math.round(newIterations / 128) * 128;
            }
            else if (newIterations >= 512)
            {
                newIterations = Math.round(newIterations / 64) * 64;
            }
            else
            {
                newIterations = Math.round(newIterations / 32) * 32;
            }

            this.colorStabilityBuffer.smoothTransitionActive = true;
        }
        else
        {
            // Moderate change - apply smoothing
            newIterations = Math.round(newIterations / 32) * 32; // Round to multiples of 32
            this.colorStabilityBuffer.smoothTransitionActive = false;
        }

        // Apply color offset continuity adjustment
        if (Math.abs(newIterations - currentIterations) > currentIterations * 0.2)
        {
            const iterationRatio = newIterations / currentIterations;
            // More sophisticated color offset adjustment
            const offsetAdjustment = (iterationRatio - 1.0) * 0.1; // Smaller adjustment
            params.colorOffset = (params.colorOffset + offsetAdjustment) % 1.0;

            // Ensure color offset stays positive
            if (params.colorOffset < 0) params.colorOffset += 1.0;
        }

        // Update iterations
        params.maxIterations = newIterations;
        this.colorStabilityBuffer.lastIterationUpdate = now;

        console.log(`Updated ${fractalType} iterations: ${currentIterations} → ${newIterations} (target: ${targetIterations})`);
    }
}
