"use strict";

import { WebGLRenderer } from "./rendering/WebGLRenderer.js";
import { WebGPURenderer } from "./rendering/WebGPURenderer.js";

/**
 * Facade that owns the active renderer implementation (WebGL2 or WebGPU),
 * keeps mouse state, and exposes a consistent API to the editor.
 */
export class ShaderRenderer
{
    static CONTEXTS = {
        WEBGL2: "webgl2",
        WEBGPU: "webgpu"
    };

    /**
     * @param {HTMLCanvasElement} canvas - Target canvas for rendering.
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

        this.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
        this.removeMouseListeners = null;
        this.setupMouseEvents();
    }

    /**
     * @returns {HTMLCanvasElement} the current canvas in use.
     */
    getCanvas()
    {
        return this.canvas;
    }

    /**
     * Switches the canvas instance (e.g., after recreation) and resets state.
     */
    setCanvas(canvas)
    {
        this.stop();
        this.canvas = canvas;
        this.mouse.isDown = false;
        this.mouse.x = 0;
        this.mouse.y = 0;
        this.mouse.clickX = 0;
        this.mouse.clickY = 0;
        this.setupMouseEvents();
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.activeRenderer = null;
    }

    /**
     * Registers a callback invoked when the renderer recreates the canvas.
     */
    setCanvasChangeHandler(handler)
    {
        this.canvasChangeHandler = handler;
    }

    /**
     * Clones and replaces the canvas element, keeping dimensions and id.
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
     * @param {string} contextType - one of ShaderRenderer.CONTEXTS values.
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
     * @returns {string} current active context type.
     */
    getContextType()
    {
        return this.contextType;
    }

    /**
     * Sets the active model payload for renderers that consume geometry.
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
     * @returns {object|null} the last loaded model payload.
     */
    getModel()
    {
        return this.model;
    }

    /**
     * Compiles/uploads new shader sources on the active renderer.
     */
    async updateShaders(sources)
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
    }

    /**
     * Notifies the active renderer about canvas size changes.
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
     */
    stop()
    {
        if (this.activeRenderer && typeof this.activeRenderer.stop === "function")
        {
            this.activeRenderer.stop();
        }
    }

    /**
     * Tracks mouse interactions over the canvas for iMouse uniform.
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

        const onMouseDown = (e) =>
        {
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
            this.mouse.clickX = pos.x;
            this.mouse.clickY = pos.y;
            this.mouse.isDown = true;
        };

        const onMouseMove = (e) =>
        {
            if (this.mouse.isDown)
            {
                const pos = getMousePos(e);
                this.mouse.x = pos.x;
                this.mouse.y = pos.y;
            }
        };

        const onMouseUp = () =>
        {
            this.mouse.isDown = false;
        };

        const onMouseLeave = () =>
        {
            this.mouse.isDown = false;
        };

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave);

        this.removeMouseListeners = () =>
        {
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseleave", onMouseLeave);
        };
    }
}
