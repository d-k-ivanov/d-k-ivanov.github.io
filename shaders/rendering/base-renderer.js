"use strict";

import { ShaderUniformState } from "./uniform-state.js";

export class BaseRenderer
{
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.animationId = null;
        this.uniformState = new ShaderUniformState(canvas, mouse);
    }

    setCanvas(canvas)
    {
        this.canvas = canvas;
        this.uniformState.setCanvas(canvas);
    }

    resetFrameState()
    {
        this.uniformState.reset();
    }

    handleResize()
    {
        // Optional override in subclasses.
    }

    stop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    requestFrame(callback)
    {
        this.animationId = requestAnimationFrame(callback);
    }
}
