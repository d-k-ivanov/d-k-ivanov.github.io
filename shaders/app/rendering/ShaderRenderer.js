"use strict";

import { WebGLRenderer } from "./WebGLRenderer.js";
import { WebGPURenderer } from "./WebGPURenderer.js";

/**
 * Facade that owns the active renderer implementation (WebGL2 or WebGPU),
 * keeps mouse state, and exposes a consistent API to the editor.
 *
 * This class insulates the editor from backend details and handles
 * context switching, canvas recreation, and shared mouse uniform data.
 *
 * @example
 * const renderer = new ShaderRenderer(canvas);
 * await renderer.setContext(ShaderRenderer.CONTEXTS.WEBGL2);
 */
export class ShaderRenderer
{
    static CONTEXTS = {
        WEBGL2: "webgl2",
        WEBGPU: "webgpu"
    };

    /**
     * @param {HTMLCanvasElement} canvas - Target canvas for rendering.
     * @example
     * const renderer = new ShaderRenderer(document.getElementById("canvas"));
     */
    constructor(canvas)
    {
        this.canvas = canvas;
        this.contextType = ShaderRenderer.CONTEXTS.WEBGL2;
        this.activeRenderer = null;
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.canvasChangeHandler = null;
        this.model = null;
        this.updateQueue = Promise.resolve();

        this.mouse = {
            left: {
                clickX: 0,
                clickY: 0,
                lastClickX: 0,
                lastClickY: 0,
                isDown: false,
                clicked: false
            },
            right: {
                clickX: 0,
                clickY: 0,
                lastClickX: 0,
                lastClickY: 0,
                isDown: false,
                clicked: false
            },
            wheel: {
                clickX: 0,
                clickY: 0,
                lastClickX: 0,
                lastClickY: 0,
                isDown: false,
                clicked: false
            },
            zoom: {
                x: 0,
                y: 0,
                z: 1,
                w: 0
            }
        };
        this.removeMouseListeners = null;
        this.setupMouseEvents();
    }

    /**
     * Returns the current canvas in use.
     *
     * @returns {HTMLCanvasElement} Current canvas reference.
     */
    getCanvas()
    {
        return this.canvas;
    }

    /**
     * Switches the canvas instance (e.g., after recreation) and resets state.
     *
     * @param {HTMLCanvasElement} canvas - New canvas element.
     * @returns {void}
     */
    setCanvas(canvas)
    {
        if (this.activeRenderer && typeof this.activeRenderer.dispose === "function")
        {
            this.activeRenderer.dispose();
        }
        else
        {
            this.stop();
        }
        this.canvas = canvas;
        this.resetMouseState();
        this.setupMouseEvents();
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.activeRenderer = null;
    }

    /**
     * Registers a callback invoked when the renderer recreates the canvas.
     *
     * @param {Function} handler - Callback receiving the new canvas.
     * @returns {void}
     */
    setCanvasChangeHandler(handler)
    {
        this.canvasChangeHandler = handler;
    }

    /**
     * Clones and replaces the canvas element, keeping dimensions and id.
     *
     * @returns {HTMLCanvasElement} The new canvas instance.
     */
    recreateCanvas()
    {
        const oldCanvas = this.canvas;
        if (!oldCanvas || !oldCanvas.parentNode)
        {
            return oldCanvas;
        }

        const newCanvas = oldCanvas.cloneNode(false);
        newCanvas.id = oldCanvas.id;
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
        this.setCanvas(newCanvas);

        if (typeof this.canvasChangeHandler === "function")
        {
            this.canvasChangeHandler(newCanvas);
        }

        return newCanvas;
    }

    /**
     * Initializes the requested rendering context and backend renderer.
     *
     * @param {string} contextType - One of {@link ShaderRenderer.CONTEXTS}.
     * @returns {Promise<void>} Resolves when the backend is ready.
     */
    async setContext(contextType)
    {
        if (!contextType)
        {
            return;
        }

        const switchingType = this.contextType !== contextType;
        if (!switchingType && this.activeRenderer)
        {
            return;
        }

        this.stop();
        const previousContext = this.contextType;
        this.contextType = contextType;

        try
        {
            if (switchingType)
            {
                this.recreateCanvas();
            }

            if (contextType === ShaderRenderer.CONTEXTS.WEBGPU)
            {
                const renderer = new WebGPURenderer(this.canvas, this.mouse);
                await renderer.init();
                this.webgpuRenderer = renderer;
                this.activeRenderer = renderer;
            }
            else
            {
                const renderer = new WebGLRenderer(this.canvas, this.mouse);
                this.webglRenderer = renderer;
                this.activeRenderer = renderer;
            }

            if (this.model && typeof this.activeRenderer.setModel === "function")
            {
                this.activeRenderer.setModel(this.model);
            }
        }
        catch (err)
        {
            this.activeRenderer = null;
            this.contextType = previousContext;
            throw err;
        }
    }

    /**
     * Returns the current active context type.
     *
     * @returns {string} Active context identifier.
     */
    getContextType()
    {
        return this.contextType;
    }

    /**
     * Sets the active model payload for renderers that consume geometry.
     *
     * @param {object|null} model - Loaded model payload or null to clear.
     * @returns {void}
     */
    setModel(model)
    {
        this.model = model;
        if (this.activeRenderer && typeof this.activeRenderer.setModel === "function")
        {
            this.activeRenderer.setModel(model);
        }
    }

    /**
     * Returns the last loaded model payload.
     *
     * @returns {object|null} Current model payload or null.
     */
    getModel()
    {
        return this.model;
    }

    /**
     * Compiles/uploads new shader sources on the active renderer.
     *
     * @param {object} sources - Stage source map (vertex/fragment/compute).
     * @returns {Promise<void>} Resolves when compilation finishes.
     */
    async updateShaders(sources)
    {
        const runUpdate = async () =>
        {
            if (!this.activeRenderer)
            {
                await this.setContext(this.contextType);
            }

            if (!this.activeRenderer)
            {
                throw new Error("Renderer not ready");
            }

            await this.activeRenderer.updateShaders(sources);
        };

        const next = this.updateQueue.then(runUpdate, runUpdate);
        this.updateQueue = next.catch(() => { });
        return next;
    }

    /**
     * Notifies the active renderer about canvas size changes.
     *
     * @returns {void}
     */
    handleResize()
    {
        if (this.activeRenderer && typeof this.activeRenderer.handleResize === "function")
        {
            this.activeRenderer.handleResize();
        }
    }

    /**
     * Stops any active render loop.
     *
     * @returns {void}
     */
    stop()
    {
        if (this.activeRenderer && typeof this.activeRenderer.stop === "function")
        {
            this.activeRenderer.stop();
        }
    }

    /**
     * Locks the frame counter to a fixed value.
     *
     * @param {number|null} frame - Frame value to lock, or null to clear.
     * @returns {void}
     */
    setFrameOverride(frame)
    {
        if (this.activeRenderer && typeof this.activeRenderer.setFrameOverride === "function")
        {
            this.activeRenderer.setFrameOverride(frame);
        }
    }

    /**
     * Clears the frame override on the active renderer.
     *
     * @returns {void}
     */
    clearFrameOverride()
    {
        if (this.activeRenderer && typeof this.activeRenderer.clearFrameOverride === "function")
        {
            this.activeRenderer.clearFrameOverride();
        }
    }

    /**
     * Locks the time counter to a fixed value.
     *
     * @param {number|null} timeSeconds - Time value to lock, or null to clear.
     * @returns {void}
     */
    setTimeOverride(timeSeconds)
    {
        if (this.activeRenderer && typeof this.activeRenderer.setTimeOverride === "function")
        {
            this.activeRenderer.setTimeOverride(timeSeconds);
        }
    }

    /**
     * Clears the time override on the active renderer.
     *
     * @returns {void}
     */
    clearTimeOverride()
    {
        if (this.activeRenderer && typeof this.activeRenderer.clearTimeOverride === "function")
        {
            this.activeRenderer.clearTimeOverride();
        }
    }

    /**
     * Returns the current frame counter from the active renderer.
     *
     * @returns {number} Frame count or 0 when unavailable.
     */
    getFrameCount()
    {
        if (this.activeRenderer && typeof this.activeRenderer.getFrameCount === "function")
        {
            return this.activeRenderer.getFrameCount();
        }
        return 0;
    }

    /**
     * Returns the last computed time in seconds.
     *
     * @returns {number} Current time in seconds.
     */
    getTimeSeconds()
    {
        if (this.activeRenderer && typeof this.activeRenderer.getTimeSeconds === "function")
        {
            return this.activeRenderer.getTimeSeconds();
        }
        return 0;
    }

    /**
     * Resets mouse-derived uniform state to defaults.
     *
     * @returns {void}
     */
    resetMouseState()
    {
        const resetButton = (state) =>
        {
            if (!state)
            {
                return;
            }
            state.clickX = 0;
            state.clickY = 0;
            state.lastClickX = 0;
            state.lastClickY = 0;
            state.isDown = false;
            state.clicked = false;
        };

        resetButton(this.mouse.left);
        resetButton(this.mouse.right);
        resetButton(this.mouse.wheel);

        if (this.mouse.zoom)
        {
            this.mouse.zoom.x = 0;
            this.mouse.zoom.y = 0;
            this.mouse.zoom.z = 1;
            this.mouse.zoom.w = 0;
        }
    }

    /**
     * Tracks mouse interactions over the canvas for iMouseL/iMouseR/iMouseW.
     *
     * @returns {void}
     */
    setupMouseEvents()
    {
        if (this.removeMouseListeners)
        {
            this.removeMouseListeners();
        }

        const canvas = this.canvas;
        if (!canvas)
        {
            return;
        }

        const getMousePos = (e) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: canvas.height - (e.clientY - rect.top) * scaleY
            };
        };

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

        const getButtonState = (button) =>
        {
            if (button === 0)
            {
                return this.mouse.left;
            }
            if (button === 1)
            {
                return this.mouse.wheel;
            }
            if (button === 2)
            {
                return this.mouse.right;
            }
            return null;
        };

        const updateClickPos = (state, pos) =>
        {
            state.clickX = pos.x;
            state.clickY = pos.y;
        };

        const applyPan = (state, wasDown, pos) =>
        {
            const lastX = wasDown && Number.isFinite(state.clickX) ? state.clickX : pos.x;
            const lastY = wasDown && Number.isFinite(state.clickY) ? state.clickY : pos.y;
            const zoomState = this.mouse.zoom || {};
            const baseZoom = Math.max(1, canvas.height) / 5.0;
            const zoomScale = Number.isFinite(zoomState.z) && zoomState.z > 0 ? zoomState.z : 1.0;
            const invScale = 1.0 / (baseZoom * zoomScale);
            const dx = pos.x - lastX;
            const dy = pos.y - lastY;
            zoomState.x = (Number.isFinite(zoomState.x) ? zoomState.x : 0) - dx * invScale;
            zoomState.y = (Number.isFinite(zoomState.y) ? zoomState.y : 0) - dy * invScale;
            this.mouse.zoom = zoomState;
            updateClickPos(state, pos);
        };

        const onMouseDown = (e) =>
        {
            const pos = getMousePos(e);
            const buttonState = getButtonState(e.button);
            if (!buttonState)
            {
                return;
            }
            buttonState.clickX = pos.x;
            buttonState.clickY = pos.y;
            buttonState.isDown = true;
        };

        const onMouseMove = (e) =>
        {
            const pos = getMousePos(e);
            const buttons = Number.isFinite(e.buttons) ? e.buttons : null;
            const leftState = this.mouse.left;
            const rightState = this.mouse.right;
            const wheelState = this.mouse.wheel;
            const wasLeftDown = leftState?.isDown;
            const wasRightDown = rightState?.isDown;
            const wasWheelDown = wheelState?.isDown;
            const leftDown = buttons === null ? wasLeftDown : (buttons & 1) !== 0;
            const rightDown = buttons === null ? wasRightDown : (buttons & 2) !== 0;
            const wheelDown = buttons === null ? wasWheelDown : (buttons & 4) !== 0;
            const panWithRight = rightDown && e.shiftKey;
            const panWithWheel = wheelDown;

            if (buttons !== null)
            {
                if (leftState)
                {
                    leftState.isDown = leftDown;
                }
                if (rightState)
                {
                    rightState.isDown = rightDown;
                }
                if (wheelState)
                {
                    wheelState.isDown = wheelDown;
                }
            }

            if (leftDown && leftState)
            {
                // updateClickPos(leftState, pos);
                applyPan(leftState, leftDown, pos);
            }

            if (panWithWheel && wheelState)
            {
                applyPan(wheelState, wasWheelDown, pos);
            }
            else if (wheelDown && wheelState)
            {
                updateClickPos(wheelState, pos);
            }

            if (panWithRight && rightState)
            {
                applyPan(rightState, wasRightDown, pos);
            }
            else if (rightDown && rightState)
            {
                updateClickPos(rightState, pos);
            }
        };

        const onMouseUp = (e) =>
        {
            const buttonState = getButtonState(e.button);
            if (!buttonState)
            {
                return;
            }
            const wasDown = buttonState.isDown;
            buttonState.isDown = false;
            if (!wasDown)
            {
                return;
            }

            const pos = getMousePos(e);
            buttonState.clickX = pos.x;
            buttonState.clickY = pos.y;
            buttonState.lastClickX = pos.x;
            buttonState.lastClickY = pos.y;
            buttonState.clicked = true;
        };

        const onMouseLeave = () =>
        {
            if (this.mouse.left)
            {
                this.mouse.left.isDown = false;
            }
            if (this.mouse.right)
            {
                this.mouse.right.isDown = false;
            }
            if (this.mouse.wheel)
            {
                this.mouse.wheel.isDown = false;
            }
        };

        const onWheel = (e) =>
        {
            if (e.cancelable)
            {
                e.preventDefault();
            }

            const pos = getMousePos(e);
            const zoomState = this.mouse.zoom || {};

            const baseZoom = Math.max(1, canvas.height) / 5.0;
            const zoom = Number.isFinite(zoomState.z) && zoomState.z > 0 ? zoomState.z : 1.0;
            const centerX = Number.isFinite(zoomState.x) ? zoomState.x : 0.0;
            const centerY = Number.isFinite(zoomState.y) ? zoomState.y : 0.0;

            const zoomFactor = Math.exp(-e.deltaY * 0.002);
            const nextZoom = clamp(zoom * zoomFactor, 0.05, 50.0);
            const screenCenterX = canvas.width * 0.5;
            const screenCenterY = canvas.height * 0.5;
            const invScale = 1.0 / (baseZoom * zoom);
            const worldX = centerX + (pos.x - screenCenterX) * invScale;
            const worldY = centerY + (pos.y - screenCenterY) * invScale;
            const nextInvScale = 1.0 / (baseZoom * nextZoom);
            zoomState.x = worldX - (pos.x - screenCenterX) * nextInvScale;
            zoomState.y = worldY - (pos.y - screenCenterY) * nextInvScale;
            zoomState.z = nextZoom;
            this.mouse.zoom = zoomState;
        };

        const onContextMenu = (e) => e.preventDefault();

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("wheel", onWheel, { passive: false });
        canvas.addEventListener("contextmenu", onContextMenu);

        this.removeMouseListeners = () =>
        {
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            canvas.removeEventListener("wheel", onWheel);
            canvas.removeEventListener("contextmenu", onContextMenu);
        };
    }
}
