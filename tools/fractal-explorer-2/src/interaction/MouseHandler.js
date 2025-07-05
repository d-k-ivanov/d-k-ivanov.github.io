/**
 * Mouse Interaction Handler
 * Manages all mouse-based interactions with the fractal display
 */
export class MouseHandler
{
    constructor(canvas, stateManager)
    {
        this.canvas = canvas;
        this.stateManager = stateManager;

        this.mouseState = {
            x: 0,
            y: 0,
            pressed: false,
            lastX: 0,
            lastY: 0,
            button: -1
        };

        // Bind methods to preserve context
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

    /**
     * Initialize mouse event listeners
     */
    initialize()
    {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);

        console.log('✅ Mouse handler initialized');
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseDown(event)
    {
        if (event.button === 0 || event.button === 1)
        { // Left or middle button
            this.mouseState.pressed = true;
            this.mouseState.button = event.button;

            this.updateMousePosition(event);
            this.mouseState.lastX = this.mouseState.x;
            this.mouseState.lastY = this.mouseState.y;

            // Set active view based on mouse position in dual mode
            const state = this.stateManager.getState();
            if (state.renderMode === 'dual')
            {
                const activeView = this.getViewFromMousePosition(this.mouseState.x, this.mouseState.y);
                this.stateManager.setActiveView(activeView);
            }

            // Change cursor for middle button (pan mode)
            if (event.button === 1)
            {
                this.canvas.style.cursor = 'grabbing';
            }
        }
        event.preventDefault();
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseUp(event)
    {
        if (event.button === this.mouseState.button)
        {
            this.mouseState.pressed = false;
            this.mouseState.button = -1;
            this.canvas.style.cursor = 'crosshair';
        }
        event.preventDefault();
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event)
    {
        this.updateMousePosition(event);

        if (this.mouseState.pressed)
        {
            if (this.mouseState.button === 0)
            {
                // Left button: Update Julia parameter or interact with fractal
                this.handleLeftButtonDrag(event);
            } else if (this.mouseState.button === 1)
            {
                // Middle button: Pan the view
                this.handlePanDrag(event);
            }
        }

        // Update complex coordinates for display
        this.updateComplexCoordinates();
        event.preventDefault();
    }

    /**
     * Handle left button drag (Julia parameter setting)
     * @param {MouseEvent} event - Mouse event
     */
    handleLeftButtonDrag(event)
    {
        const state = this.stateManager.getState();
        const rect = this.canvas.getBoundingClientRect();

        if (state.renderMode === 'julia' ||
            (state.renderMode === 'dual' && state.activeView === 'julia'))
        {
            // Change Julia parameter c in Julia view
            let normalizedX, normalizedY;

            if (state.renderMode === 'dual')
            {
                // Right half of screen for Julia in dual mode
                normalizedX = (this.mouseState.x / rect.width - 0.5) * 2.0;
                normalizedY = this.mouseState.y / rect.height - 0.5;
            } else
            {
                // Full screen for Julia in single mode
                normalizedX = this.mouseState.x / rect.width - 0.5;
                normalizedY = this.mouseState.y / rect.height - 0.5;
            }

            this.stateManager.updateJuliaParams({
                c_real: normalizedX * 2.0,
                c_imag: normalizedY * 2.0
            });
        } else if (state.renderMode === 'dual' && state.activeView === 'mandelbrot')
        {
            // In dual mode, clicking Mandelbrot view updates Julia parameter
            const aspect = (this.canvas.width / 2) / this.canvas.height; // Half width for dual view

            // Convert mouse position to Mandelbrot coordinates
            const mouseX = (this.mouseState.x / rect.width - 0.25) * 2.0; // Adjust for left half
            const mouseY = this.mouseState.y / rect.height - 0.5;

            const mandelbrotParams = state.mandelbrotParams;
            const juliaC_real = mouseX * 4.0 * aspect / mandelbrotParams.zoom + mandelbrotParams.offsetX;
            const juliaC_imag = mouseY * 4.0 / mandelbrotParams.zoom + mandelbrotParams.offsetY;

            this.stateManager.updateJuliaParams({
                c_real: juliaC_real,
                c_imag: juliaC_imag
            });
        }
    }

    /**
     * Handle pan drag (middle button) - now with infinite precision support
     * @param {MouseEvent} event - Mouse event
     */
    handlePanDrag(event)
    {
        const deltaX = this.mouseState.x - this.mouseState.lastX;
        const deltaY = this.mouseState.y - this.mouseState.lastY;

        const state = this.stateManager.getState();
        const rect = this.canvas.getBoundingClientRect();

        let aspect;
        if (state.renderMode === 'dual')
        {
            aspect = (this.canvas.width / 2) / this.canvas.height;
        } else
        {
            aspect = this.canvas.width / this.canvas.height;
        }

        // Use infinite precision pan if enabled
        if (state.infiniteZoomEnabled)
        {
            const normalizedDeltaX = -(deltaX / rect.width);
            const normalizedDeltaY = -(deltaY / rect.height);

            // Determine target view for panning
            let targetView = state.activeView;
            if (state.renderMode === 'dual')
            {
                targetView = this.getViewFromMousePosition(this.mouseState.x, this.mouseState.y);
            } else if (state.renderMode === 'julia')
            {
                targetView = 'julia';
            } else
            {
                targetView = 'mandelbrot';
            }

            this.stateManager.applyInfinitePan(normalizedDeltaX, normalizedDeltaY, aspect, targetView);
        }
        else
        {
            // Legacy pan handling
            this.handleLegacyPan(deltaX, deltaY, aspect);
        }
    }

    /**
     * Legacy pan handling for compatibility
     * @param {number} deltaX - Delta X in pixels
     * @param {number} deltaY - Delta Y in pixels
     * @param {number} aspect - Aspect ratio
     */
    handleLegacyPan(deltaX, deltaY, aspect)
    {
        const state = this.stateManager.getState();
        const rect = this.canvas.getBoundingClientRect();

        const currentParams = this.stateManager.getCurrentParams();
        const currentZoom = currentParams.zoom;
        const panSensitivity = 4.0 / currentZoom;
        const complexDeltaX = -(deltaX / rect.width) * panSensitivity * aspect;
        const complexDeltaY = -(deltaY / rect.height) * panSensitivity;

        // Update offset for the active view
        const newOffsetX = currentParams.offsetX + complexDeltaX;
        const newOffsetY = currentParams.offsetY + complexDeltaY;

        if (state.activeView === 'julia' || state.renderMode === 'julia')
        {
            this.stateManager.updateJuliaParams({
                offsetX: newOffsetX,
                offsetY: newOffsetY
            });

            // Update precision tracking
            const precision = state.zoomPrecision;
            precision.centerX = newOffsetX;
            precision.centerY = newOffsetY;
        } else
        {
            this.stateManager.updateMandelbrotParams({
                offsetX: newOffsetX,
                offsetY: newOffsetY
            });

            // Update precision tracking
            const precision = state.mandelbrotPrecision;
            precision.centerX = newOffsetX;
            precision.centerY = newOffsetY;
        }

        this.mouseState.lastX = this.mouseState.x;
        this.mouseState.lastY = this.mouseState.y;
    }

    /**
     * Handle wheel events (zooming) - now with infinite zoom support
     * @param {WheelEvent} event - Wheel event
     */
    handleWheel(event)
    {
        event.preventDefault();

        const state = this.stateManager.getState();

        // Determine which view to zoom based on mouse position
        let targetView = state.activeView;
        if (state.renderMode === 'dual')
        {
            targetView = this.getViewFromMousePosition(
                event.clientX - this.canvas.getBoundingClientRect().left,
                event.clientY - this.canvas.getBoundingClientRect().top
            );
        }

        const rect = this.canvas.getBoundingClientRect();
        let mouseX, mouseY, aspect;

        if (state.renderMode === 'dual')
        {
            aspect = (this.canvas.width / 2) / this.canvas.height;
            if (targetView === 'mandelbrot')
            {
                mouseX = ((event.clientX - rect.left) / rect.width - 0.25) * 2.0;
            } else
            {
                mouseX = ((event.clientX - rect.left) / rect.width - 0.75) * 2.0;
            }
        } else
        {
            aspect = this.canvas.width / this.canvas.height;
            mouseX = (event.clientX - rect.left) / rect.width - 0.5;
        }

        mouseY = (event.clientY - rect.top) / rect.height - 0.5;

        // Use infinite zoom if enabled
        if (state.infiniteZoomEnabled)
        {
            const zoomDirection = event.deltaY > 0 ? -1 : 1;
            const zoomSensitivity = 0.2;
            const zoomFactor = Math.exp(zoomDirection * zoomSensitivity);

            this.stateManager.applyInfiniteZoom(mouseX, mouseY, zoomFactor, aspect, targetView);
        }
        else
        {
            // Fallback to legacy zoom for compatibility
            this.handleLegacyZoom(event, targetView, mouseX, mouseY, aspect);
        }
    }

    /**
     * Legacy zoom handling for compatibility
     * @param {WheelEvent} event - Wheel event
     * @param {string} targetView - Target view
     * @param {number} mouseX - Normalized mouse X
     * @param {number} mouseY - Normalized mouse Y
     * @param {number} aspect - Aspect ratio
     */
    handleLegacyZoom(event, targetView, mouseX, mouseY, aspect)
    {
        const state = this.stateManager.getState();

        // Get parameters for target view
        let currentParams, precision;
        if (targetView === 'julia')
        {
            currentParams = state.juliaParams;
            precision = state.zoomPrecision;
        } else
        {
            currentParams = state.mandelbrotParams;
            precision = state.mandelbrotPrecision;
        }

        // Calculate zoom coordinates
        const preZoomX = mouseX * 4.0 * aspect / currentParams.zoom + currentParams.offsetX;
        const preZoomY = mouseY * 4.0 / currentParams.zoom + currentParams.offsetY;

        // Apply zoom
        const zoomStep = event.deltaY > 0 ? -0.2 : 0.2;
        precision.logZoom += zoomStep;
        precision.logZoom = Math.max(-10, Math.min(precision.maxLogZoom, precision.logZoom));

        const newZoom = Math.exp(precision.logZoom);
        const postZoomX = mouseX * 4.0 * aspect / newZoom + currentParams.offsetX;
        const postZoomY = mouseY * 4.0 / newZoom + currentParams.offsetY;

        // Update parameters for target view
        const updates = {
            zoom: newZoom,
            offsetX: currentParams.offsetX + (preZoomX - postZoomX),
            offsetY: currentParams.offsetY + (preZoomY - postZoomY)
        };

        // Dynamic iteration adjustment based on zoom
        const baseIterations = 256;
        const zoomFactor = Math.max(1.0, precision.logZoom / 10.0);
        const newIterations = Math.min(2048, baseIterations * Math.sqrt(zoomFactor));
        updates.maxIterations = newIterations;

        if (targetView === 'julia')
        {
            this.stateManager.updateJuliaParams(updates);
            precision.centerX = updates.offsetX;
            precision.centerY = updates.offsetY;
        } else
        {
            this.stateManager.updateMandelbrotParams(updates);
            state.mandelbrotPrecision.centerX = updates.offsetX;
            state.mandelbrotPrecision.centerY = updates.offsetY;
        }
    }

    /**
     * Handle mouse leave events
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseLeave(event)
    {
        if (this.mouseState.pressed)
        {
            this.mouseState.pressed = false;
            this.mouseState.button = -1;
            this.canvas.style.cursor = 'crosshair';
        }
    }

    /**
     * Handle context menu events (prevent right-click menu)
     * @param {MouseEvent} event - Mouse event
     */
    handleContextMenu(event)
    {
        event.preventDefault();
    }

    /**
     * Update mouse position from event
     * @param {MouseEvent} event - Mouse event
     */
    updateMousePosition(event)
    {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseState.x = event.clientX - rect.left;
        this.mouseState.y = event.clientY - rect.top;

        // Update state manager
        this.stateManager.updateMouseState(this.mouseState);
    }

    /**
     * Update complex coordinates based on mouse position
     */
    updateComplexCoordinates()
    {
        // Use the StateManager's comprehensive coordinate calculation
        // which includes zoom info and precision handling
        this.stateManager.updateComplexCoordinates(
            this.mouseState.x,
            this.mouseState.y,
            this.canvas.width,
            this.canvas.height
        );
    }

    /**
     * Determine which view the mouse is in (for dual mode)
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @returns {string} View name ('mandelbrot' or 'julia')
     */
    getViewFromMousePosition(mouseX, mouseY)
    {
        const state = this.stateManager.getState();
        if (state.renderMode !== 'dual') return state.renderMode;

        const rect = this.canvas.getBoundingClientRect();
        const relativeX = mouseX / rect.width;

        // Left half is Mandelbrot, right half is Julia
        return relativeX < 0.5 ? 'mandelbrot' : 'julia';
    }

    /**
     * Clean up mouse event listeners
     */
    destroy()
    {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);

        console.log('🗑️ Mouse handler destroyed');
    }
}
