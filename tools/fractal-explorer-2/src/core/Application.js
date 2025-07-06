/**
 * Main Application Controller
 * Coordinates all subsystems of the Fractal Explorer
 */
import { WebGPUContext } from './WebGPUContext.js';
import { StateManager } from './StateManager.js';
import { FractalRenderer } from '../fractals/FractalRenderer.js';
import { CanvasManager } from '../rendering/CanvasManager.js';
import { MouseHandler } from '../interaction/MouseHandler.js';
import { KeyboardHandler } from '../interaction/KeyboardHandler.js';
import { CoordinateDisplay } from '../ui/CoordinateDisplay.js';
import { ModeDisplay } from '../ui/ModeDisplay.js';
import { Performance } from '../utils/Performance.js';
import { InfiniteZoomPerformanceMonitor } from '../utils/InfiniteZoomPerformance.js';
import { InfiniteZoomHelp } from '../ui/InfiniteZoomHelp.js';

export class Application
{
    constructor()
    {
        this.webgpuContext = new WebGPUContext();
        this.stateManager = new StateManager();
        this.canvasManager = new CanvasManager();
        this.fractalRenderer = null;
        this.mouseHandler = null;
        this.keyboardHandler = null;
        this.coordinateDisplay = null;
        this.modeDisplay = null;
        this.performance = new Performance();
        this.infiniteZoomPerformance = new InfiniteZoomPerformanceMonitor();
        this.infiniteZoomHelp = new InfiniteZoomHelp();

        this.isInitialized = false;
        this.animationId = null;
    }

    /**
     * Initialize the complete application
     */
    async initialize()
    {
        try
        {
            console.log('🚀 Initializing Fractal Explorer...');

            // Initialize WebGPU context
            await this.webgpuContext.initialize();
            console.log('✅ WebGPU context initialized');

            // Setup canvas and rendering surface
            this.canvasManager.initialize();
            this.webgpuContext.configureCanvas(this.canvasManager.canvas);
            console.log('✅ Canvas configured');

            // Initialize fractal renderer
            this.fractalRenderer = new FractalRenderer(
                this.webgpuContext,
                this.canvasManager,
                this.stateManager
            );
            await this.fractalRenderer.initialize();
            console.log('✅ Fractal renderer initialized');

            // Setup user interface
            this.initializeUI();
            console.log('✅ User interface initialized');

            // Setup interaction handlers
            this.initializeInteraction();
            console.log('✅ Interaction handlers initialized');

            // Start render loop
            this.startRenderLoop();
            console.log('✅ Render loop started');

            // Setup performance monitoring
            this.performance.start();
            console.log('✅ Performance monitoring active');

            this.isInitialized = true;
            console.log('🎉 Fractal Explorer ready!');

        } catch (error)
        {
            console.error('❌ Application initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize user interface components
     */
    initializeUI()
    {
        // Create coordinate display
        this.coordinateDisplay = new CoordinateDisplay();
        this.coordinateDisplay.initialize();

        // Create mode display
        this.modeDisplay = new ModeDisplay();
        this.modeDisplay.initialize();

        // Initialize infinite zoom help system
        this.infiniteZoomHelp.initialize();

        // Connect UI to state changes
        this.stateManager.on('stateChange', (state) =>
        {
            this.updateUI(state);
        });

        // Connect UI to mouse position updates
        this.stateManager.on('mousePositionChange', (coordinates) =>
        {
            this.coordinateDisplay.updateCoordinates(coordinates);
        });
    }

    /**
     * Initialize interaction handlers
     */
    initializeInteraction()
    {
        // Mouse interaction
        this.mouseHandler = new MouseHandler(
            this.canvasManager.canvas,
            this.stateManager
        );
        this.mouseHandler.initialize();

        // Keyboard interaction
        this.keyboardHandler = new KeyboardHandler(this.stateManager, this.modeDisplay);
        this.keyboardHandler.initialize();

        // Connect interaction events to rendering
        this.stateManager.on('parameterChange', () =>
        {
            this.fractalRenderer.updateUniforms();
        });

        this.stateManager.on('modeChange', (modeData) =>
        {
            this.modeDisplay.updateMode(modeData);
            this.fractalRenderer.updateUniforms();
        });
    }

    /**
     * Update UI components based on state changes
     * @param {Object} stateData - Current application state
     */
    updateUI(stateData)
    {
        this.modeDisplay.updateMode({
            renderMode: stateData.renderMode,
            activeView: stateData.activeView
        });
    }

    /**
     * Start the main render loop
     */
    startRenderLoop()
    {
        let lastFrameTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const animate = (currentTime) =>
        {
            if (!this.isInitialized) return;

            // Throttle to target FPS
            if (currentTime - lastFrameTime >= frameInterval)
            {
                const frameStartTime = performance.now();

                // Update performance metrics
                this.performance.update();

                // Render the current frame
                this.fractalRenderer.render();

                // Monitor infinite zoom performance
                const frameEndTime = performance.now();
                const frameTime = frameEndTime - frameStartTime;
                const currentState = this.stateManager.getState();
                const zoomInfo = {
                    zoom: currentState.mandelbrotZoom || 1,
                    precisionLevel: currentState.precisionLevel || 0
                };
                this.infiniteZoomPerformance.update(frameTime, zoomInfo, currentState.mandelbrotMaxIterations || 256);

                lastFrameTime = currentTime;
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    /**
     * Handle application shutdown and cleanup
     */
    async shutdown()
    {
        console.log('🔄 Shutting down Fractal Explorer...');

        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.performance.stop();

        if (this.mouseHandler)
        {
            this.mouseHandler.destroy();
        }

        if (this.keyboardHandler)
        {
            this.keyboardHandler.destroy();
        }

        if (this.fractalRenderer)
        {
            this.fractalRenderer.destroy();
        }

        if (this.coordinateDisplay)
        {
            this.coordinateDisplay.destroy();
        }

        if (this.modeDisplay)
        {
            this.modeDisplay.destroy();
        }

        this.webgpuContext.destroy();
        this.canvasManager.destroy();

        this.isInitialized = false;
        console.log('✅ Fractal Explorer shutdown complete');
    }

    /**
     * Handle window visibility changes for performance optimization
     */
    handleVisibilityChange()
    {
        if (document.hidden)
        {
            // Pause rendering when tab is hidden
            if (this.animationId)
            {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            this.performance.pause();
        } else
        {
            // Resume rendering when tab becomes visible
            if (!this.animationId && this.isInitialized)
            {
                this.startRenderLoop();
            }
            this.performance.resume();
        }
    }
}

// Handle page visibility changes for performance optimization
document.addEventListener('visibilitychange', () =>
{
    // This will be connected to the application instance when available
    window.fractalApp?.handleVisibilityChange();
});
