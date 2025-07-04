/**
 * Canvas Manager
 * Handles canvas creation, sizing, and responsive behavior
 */
export class CanvasManager
{
    constructor()
    {
        this.canvas = null;
        this.resizeObserver = null;
        this.resizeCallbacks = [];
    }

    /**
     * Initialize canvas and setup responsive behavior
     */
    initialize()
    {
        this.createCanvas();
        this.setupFullScreenCanvas();
        this.setupResizeObserver();

        console.log('✅ Canvas manager initialized');
    }

    /**
     * Create the main canvas element
     */
    createCanvas()
    {
        // Remove any existing canvas
        const existingCanvas = document.querySelector('#fractal-canvas');
        if (existingCanvas)
        {
            existingCanvas.remove();
        }

        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'fractal-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            cursor: crosshair;
            z-index: 1;
            background: #000;
        `;

        // Add to document
        document.body.appendChild(this.canvas);

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Setup full-screen canvas with proper pixel ratio handling
     */
    setupFullScreenCanvas()
    {
        if (!this.canvas) return;

        const devicePixelRatio = window.devicePixelRatio || 1;

        // Get actual display size
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        // Calculate canvas size with device pixel ratio
        const canvasWidth = Math.floor(displayWidth * devicePixelRatio);
        const canvasHeight = Math.floor(displayHeight * devicePixelRatio);

        // Set canvas internal dimensions
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Set canvas display size
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        console.log(`📐 Canvas resized: ${canvasWidth}x${canvasHeight} (${devicePixelRatio}x DPR)`);

        // Notify resize callbacks
        this.resizeCallbacks.forEach(callback =>
        {
            callback({
                width: canvasWidth,
                height: canvasHeight,
                displayWidth,
                displayHeight,
                devicePixelRatio
            });
        });
    }

    /**
     * Setup resize observer for responsive behavior
     */
    setupResizeObserver()
    {
        if (!this.canvas) return;

        // Modern ResizeObserver approach
        if ('ResizeObserver' in window)
        {
            this.resizeObserver = new ResizeObserver(() =>
            {
                this.setupFullScreenCanvas();
            });
            this.resizeObserver.observe(this.canvas);
        }

        // Fallback for older browsers
        window.addEventListener('resize', () =>
        {
            this.setupFullScreenCanvas();
        });

        // Handle orientation changes on mobile
        window.addEventListener('orientationchange', () =>
        {
            // Delay to allow browser to update dimensions
            setTimeout(() =>
            {
                this.setupFullScreenCanvas();
            }, 100);
        });
    }

    /**
     * Add a callback for resize events
     * @param {Function} callback - Function to call on resize
     */
    onResize(callback)
    {
        this.resizeCallbacks.push(callback);
    }

    /**
     * Remove a resize callback
     * @param {Function} callback - Function to remove
     */
    offResize(callback)
    {
        const index = this.resizeCallbacks.indexOf(callback);
        if (index !== -1)
        {
            this.resizeCallbacks.splice(index, 1);
        }
    }

    /**
     * Get canvas dimensions
     * @returns {Object} Canvas dimensions
     */
    getDimensions()
    {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            displayWidth: this.canvas.clientWidth,
            displayHeight: this.canvas.clientHeight,
            aspectRatio: this.canvas.width / this.canvas.height
        };
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} Canvas coordinates
     */
    screenToCanvas(screenX, screenY)
    {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     * @param {number} canvasX - Canvas X coordinate
     * @param {number} canvasY - Canvas Y coordinate
     * @returns {Object} Screen coordinates
     */
    canvasToScreen(canvasX, canvasY)
    {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / this.canvas.width;
        const scaleY = rect.height / this.canvas.height;

        return {
            x: canvasX * scaleX + rect.left,
            y: canvasY * scaleY + rect.top
        };
    }

    /**
     * Get canvas bounding rectangle
     * @returns {DOMRect} Canvas bounding rectangle
     */
    getBoundingRect()
    {
        return this.canvas.getBoundingClientRect();
    }

    /**
     * Set canvas cursor style
     * @param {string} cursor - CSS cursor value
     */
    setCursor(cursor)
    {
        if (this.canvas)
        {
            this.canvas.style.cursor = cursor;
        }
    }

    /**
     * Request fullscreen mode
     */
    async requestFullscreen()
    {
        if (!this.canvas) return;

        try
        {
            if (this.canvas.requestFullscreen)
            {
                await this.canvas.requestFullscreen();
            } else if (this.canvas.webkitRequestFullscreen)
            {
                await this.canvas.webkitRequestFullscreen();
            } else if (this.canvas.msRequestFullscreen)
            {
                await this.canvas.msRequestFullscreen();
            }
        } catch (error)
        {
            console.warn('Fullscreen request failed:', error);
        }
    }

    /**
     * Exit fullscreen mode
     */
    async exitFullscreen()
    {
        try
        {
            if (document.exitFullscreen)
            {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen)
            {
                await document.webkitExitFullscreen();
            } else if (document.msExitFullscreen)
            {
                await document.msExitFullscreen();
            }
        } catch (error)
        {
            console.warn('Exit fullscreen failed:', error);
        }
    }

    /**
     * Check if currently in fullscreen
     * @returns {boolean} Whether in fullscreen mode
     */
    isFullscreen()
    {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement
        );
    }

    /**
     * Clean up canvas and resources
     */
    destroy()
    {
        if (this.resizeObserver)
        {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.canvas && this.canvas.parentNode)
        {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        this.canvas = null;
        this.resizeCallbacks = [];

        console.log('🗑️ Canvas manager destroyed');
    }
}
