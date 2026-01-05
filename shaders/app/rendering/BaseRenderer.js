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
     * Locks the frame counter to a fixed value.
     *
     * @param {number|null} frame - Frame value to lock, or null to clear.
     * @returns {void}
     */
    setFrameOverride(frame)
    {
        this.uniformState.setFrameOverride(frame);
    }

    /**
     * Clears the frame override.
     *
     * @returns {void}
     */
    clearFrameOverride()
    {
        this.uniformState.clearFrameOverride();
    }

    /**
     * Locks the time counter to a fixed value.
     *
     * @param {number|null} timeSeconds - Time value to lock, or null to clear.
     * @returns {void}
     */
    setTimeOverride(timeSeconds)
    {
        this.uniformState.setTimeOverride(timeSeconds);
    }

    /**
     * Clears the time override.
     *
     * @returns {void}
     */
    clearTimeOverride()
    {
        this.uniformState.clearTimeOverride();
    }

    /**
     * Returns the current frame counter value.
     *
     * @returns {number} Frame counter.
     */
    getFrameCount()
    {
        return this.uniformState.getFrameCount();
    }

    /**
     * Returns the last computed time in seconds.
     *
     * @returns {number} Current time in seconds.
     */
    getTimeSeconds()
    {
        return this.uniformState.getTimeSeconds();
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
