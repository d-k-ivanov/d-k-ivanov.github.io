"use strict";

import { ShaderUniformState } from "./ShaderUniformState.js";

/**
 * Abstract base renderer that owns animation loop plumbing and uniform state.
 *
 * Subclasses implement concrete backends (WebGL2/WebGPU) while inheriting
 * shared time/mouse uniform management and frame loop lifecycle helpers.
 *
 * @example
 * class CustomRenderer extends BaseRenderer {
 *   async updateShaders() {}
 * }
 */
export class BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - Render target.
     * @param {object} mouse - Shared mouse state for uniform tracking.
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
     *
     * @param {HTMLCanvasElement} canvas - New canvas element.
     * @returns {void}
     */
    setCanvas(canvas)
    {
        this.canvas = canvas;
        this.uniformState.setCanvas(canvas);
    }

    /**
     * Stores model data for renderers that support geometry input.
     *
     * @param {object|null} model - Model payload or null.
     * @returns {void}
     */
    setModel(model)
    {
        this.model = model;
    }

    /**
     * Resets uniform frame counters and time tracking.
     *
     * @returns {void}
     */
    resetFrameState()
    {
        this.uniformState.reset();
    }

    /**
     * Handles canvas resize events (optional override in subclasses).
     *
     * @returns {void}
     */
    handleResize()
    {
        // Optional override in subclasses.
    }

    /**
     * Cancels the active animation frame.
     *
     * @returns {void}
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
     *
     * @param {Function} callback - Frame callback.
     * @returns {void}
     */
    requestFrame(callback)
    {
        this.animationId = requestAnimationFrame(callback);
    }
}
