/**
 * Keyboard Interaction Handler
 * Manages all keyboard-based interactions and shortcuts
 */
import { RenderModes, KeyboardShortcuts, NavigationKeys } from '../config/RenderModes.js';

export class KeyboardHandler
{
    constructor(stateManager)
    {
        this.stateManager = stateManager;

        // Bind methods to preserve context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    /**
     * Initialize keyboard event listeners
     */
    initialize()
    {
        // Ensure document can receive focus for keyboard events
        if (document.body.tabIndex === undefined || document.body.tabIndex < 0)
        {
            document.body.tabIndex = 0;
        }

        // Focus the document to ensure keyboard events are received
        document.body.focus();

        // Add click handler to maintain focus
        document.addEventListener('click', () =>
        {
            document.body.focus();
        });

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        console.log('✅ Keyboard handler initialized');
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event)
    {
        // Handle Ctrl+R for browser reload (takes precedence)
        if (event.ctrlKey && (event.key === 'r' || event.key === 'R'))
        {
            return; // Allow browser default behavior
        }

        const state = this.stateManager.getState();

        // Calculate zoom-adaptive navigation step
        const baseStep = 0.1;
        const currentParams = this.stateManager.getCurrentParams();
        const currentZoom = currentParams.zoom;
        const zoomAdjustedStep = baseStep / Math.sqrt(currentZoom);

        switch (event.key)
        {
            // Arrow key navigation
            case 'ArrowLeft':
                this.handleNavigation('left', zoomAdjustedStep);
                break;
            case 'ArrowRight':
                this.handleNavigation('right', zoomAdjustedStep);
                break;
            case 'ArrowUp':
                this.handleNavigation('up', zoomAdjustedStep);
                break;
            case 'ArrowDown':
                this.handleNavigation('down', zoomAdjustedStep);
                break;

            // Zoom controls
            case '+':
            case '=':
                this.handleZoom(0.2);
                break;
            case '-':
            case '_':
                this.handleZoom(-0.2);
                break;

            // Mode controls
            case 'Tab':
                this.handleTabSwitch();
                break;
            case 'm':
            case 'M':
                this.handleModeToggle();
                break;
            case 'j':
            case 'J':
                this.handleJuliaToggle();
                break;
            case 'd':
            case 'D':
                this.handleDualToggle();
                break;

            // Utility controls
            case 'r':
            case 'R':
                if (!event.ctrlKey)
                {
                    this.handleReset();
                }
                break;
            case 'f':
            case 'F':
                this.handleFullscreen();
                break;
            case 'Escape':
                this.handleEscape();
                break;
        }

        // Prevent default browser behavior for handled keys
        if (this.shouldPreventDefault(event.key, event.ctrlKey))
        {
            event.preventDefault();
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event)
    {
        // Currently no keyup handling needed
        // This can be extended for modifier key tracking
    }

    /**
     * Handle navigation with arrow keys
     * @param {string} direction - Navigation direction
     * @param {number} step - Movement step size
     */
    handleNavigation(direction, step)
    {
        const state = this.stateManager.getState();
        const currentParams = this.stateManager.getCurrentParams();
        const precision = this.stateManager.getCurrentPrecision();

        let offsetX = currentParams.offsetX;
        let offsetY = currentParams.offsetY;

        switch (direction)
        {
            case 'left':
                offsetX -= step;
                break;
            case 'right':
                offsetX += step;
                break;
            case 'up':
                offsetY -= step;
                break;
            case 'down':
                offsetY += step;
                break;
        }

        // Update parameters for active view
        this.stateManager.updateCurrentParams({
            offsetX,
            offsetY
        });

        // Update precision tracking
        precision.centerX = offsetX;
        precision.centerY = offsetY;
    }

    /**
     * Handle zoom in/out
     * @param {number} zoomStep - Zoom step (positive for zoom in, negative for zoom out)
     */
    handleZoom(zoomStep)
    {
        const state = this.stateManager.getState();
        const precision = this.stateManager.getCurrentPrecision();

        // Update log zoom with limits
        precision.logZoom += zoomStep;
        precision.logZoom = Math.max(-10, Math.min(precision.maxLogZoom, precision.logZoom));

        const newZoom = Math.exp(precision.logZoom);

        // Update current parameters
        this.stateManager.updateCurrentParams({
            zoom: newZoom
        });

        console.log(`${state.activeView || state.renderMode} zoom: ${newZoom.toFixed(2)}`);
    }

    /**
     * Handle Tab key for view switching in dual mode
     */
    handleTabSwitch()
    {
        const state = this.stateManager.getState();

        if (state.renderMode === RenderModes.DUAL)
        {
            const newActiveView = state.activeView === RenderModes.MANDELBROT ?
                RenderModes.JULIA : RenderModes.MANDELBROT;
            this.stateManager.setActiveView(newActiveView);

            console.log(`Switched to ${newActiveView} view`);
        }
    }

    /**
     * Handle mode cycling (M key)
     */
    handleModeToggle()
    {
        this.stateManager.cycleFractalMode();
    }

    /**
     * Handle Julia mode toggle (J key) - toggles between Julia and Mandelbrot modes
     */
    handleJuliaToggle()
    {
        const state = this.stateManager.getState();

        if (state.renderMode === RenderModes.DUAL)
        {
            // In dual mode: Switch to isolated Julia exploration
            this.stateManager.setRenderMode(RenderModes.JULIA);
            console.log('Switched to isolated Julia exploration mode');
        } else if (state.renderMode === RenderModes.MANDELBROT)
        {
            // From Mandelbrot: Create Julia set using current coordinates
            const complexCoords = state.complexCoordinates;
            this.stateManager.updateJuliaParams({
                c_real: complexCoords.x,
                c_imag: complexCoords.y,
                zoom: 1.0,
                offsetX: 0.0,
                offsetY: 0.0,
                maxIterations: 256
            });
            this.stateManager.setRenderMode(RenderModes.JULIA);
            console.log('Created Julia set from current coordinates');
        } else if (state.renderMode === RenderModes.JULIA)
        {
            // From Julia: Return to Mandelbrot mode
            this.stateManager.setRenderMode(RenderModes.MANDELBROT);
            console.log('Switched back to Mandelbrot mode');
        }
    }

    /**
     * Handle dual mode toggle (D key)
     */
    handleDualToggle()
    {
        const state = this.stateManager.getState();

        if (state.renderMode !== RenderModes.DUAL)
        {
            this.stateManager.setRenderMode(RenderModes.DUAL);
            console.log('Switched to dual view mode');
        } else
        {
            // If already in dual mode, cycle the active view
            this.handleTabSwitch();
        }
    }

    /**
     * Handle reset (R key)
     */
    handleReset()
    {
        this.stateManager.resetParameters();
        console.log('Parameters reset to defaults');
    }

    /**
     * Handle fullscreen toggle (F key)
     */
    handleFullscreen()
    {
        const canvas = document.getElementById('fractal-canvas');
        if (!canvas) return;

        if (!document.fullscreenElement)
        {
            canvas.requestFullscreen().catch(err =>
            {
                console.warn('Fullscreen request failed:', err);
            });
        } else
        {
            document.exitFullscreen().catch(err =>
            {
                console.warn('Exit fullscreen failed:', err);
            });
        }
    }

    /**
     * Handle escape key
     */
    handleEscape()
    {
        if (document.fullscreenElement)
        {
            document.exitFullscreen().catch(err =>
            {
                console.warn('Exit fullscreen failed:', err);
            });
        }
    }

    /**
     * Determine if default behavior should be prevented
     * @param {string} key - Key pressed
     * @param {boolean} ctrlKey - Whether Ctrl key is pressed
     * @returns {boolean} Whether to prevent default
     */
    shouldPreventDefault(key, ctrlKey)
    {
        const handledKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Tab', '+', '=', '-', '_', 'm', 'M', 'j', 'J', 'd', 'D',
            'f', 'F', 'Escape'
        ];

        // Allow Ctrl+R for browser reload
        if (ctrlKey && (key === 'r' || key === 'R'))
        {
            return false;
        }

        // Prevent default for handled keys, including R without Ctrl
        return handledKeys.includes(key) || ((key === 'r' || key === 'R') && !ctrlKey);
    }

    /**
     * Get keyboard shortcuts help text
     * @returns {Array} Array of shortcut descriptions
     */
    getKeyboardShortcuts()
    {
        return [
            { keys: ['M'], description: 'Cycle render modes (Mandelbrot → Julia → Dual)' },
            { keys: ['J'], description: 'Toggle between Julia and Mandelbrot modes' },
            { keys: ['D'], description: 'Toggle dual view mode' },
            { keys: ['Tab'], description: 'Switch active view in dual mode' },
            { keys: ['R'], description: 'Reset parameters' },
            { keys: ['F'], description: 'Toggle fullscreen' },
            { keys: ['↑↓←→'], description: 'Navigate fractal' },
            { keys: ['+', '-'], description: 'Zoom in/out' },
            { keys: ['Mouse'], description: 'Left: Set Julia param, Middle: Pan, Wheel: Zoom' },
            { keys: ['Esc'], description: 'Exit fullscreen' }
        ];
    }

    /**
     * Clean up keyboard event listeners
     */
    destroy()
    {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        console.log('🗑️ Keyboard handler destroyed');
    }
}
