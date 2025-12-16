"use strict";

import { WebGLRenderer } from "./rendering/webgl-renderer.js";
import { WebGPURenderer } from "./rendering/webgpu-renderer.js";

export const RENDER_CONTEXTS = {
    WEBGL2: "webgl2",
    WEBGPU: "webgpu"
};

export class ShaderRenderer
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.contextType = RENDER_CONTEXTS.WEBGL2;
        this.activeRenderer = null;
        this.webglRenderer = null;
        this.webgpuRenderer = null;
        this.canvasChangeHandler = null;

        this.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
        this.removeMouseListeners = null;
        this.setupMouseEvents();
    }

    getCanvas()
    {
        return this.canvas;
    }

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

    setCanvasChangeHandler(handler)
    {
        this.canvasChangeHandler = handler;
    }

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

            if (contextType === RENDER_CONTEXTS.WEBGPU)
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
        }
        catch (err)
        {
            this.activeRenderer = null;
            this.contextType = previousContext;
            throw err;
        }
    }

    getContextType()
    {
        return this.contextType;
    }

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

    handleResize()
    {
        if (this.activeRenderer && typeof this.activeRenderer.handleResize === "function")
        {
            this.activeRenderer.handleResize();
        }
    }

    stop()
    {
        if (this.activeRenderer && typeof this.activeRenderer.stop === "function")
        {
            this.activeRenderer.stop();
        }
    }

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
