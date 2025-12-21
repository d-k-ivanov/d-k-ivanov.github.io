"use strict";

import { ShaderUniformState } from "./ShaderUniformState.js";

/**
 * Abstract base renderer that owns animation loop plumbing and uniform state.
 */
export class BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - render target.
     * @param {object} mouse - shared mouse state.
     */
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.animationId = null;
        this.uniformState = new ShaderUniformState(canvas, mouse);
        this.model = null;
    }

    /**
     * Updates the canvas reference and propagates to uniform state.
     */
    setCanvas(canvas)
    {
        this.canvas = canvas;
        this.uniformState.setCanvas(canvas);
    }

    /**
     * Stores model data for renderers that support geometry input.
     */
    setModel(model)
    {
        this.model = model;
    }

    /**
     * Resets uniform frame counters and time tracking.
     */
    resetFrameState()
    {
        this.uniformState.reset();
    }

    handleResize()
    {
        // Optional override in subclasses.
    }

    /**
     * Cancels the active animation frame.
     */
    stop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Stores the requestAnimationFrame id for cleanup.
     */
    requestFrame(callback)
    {
        this.animationId = requestAnimationFrame(callback);
    }
}
