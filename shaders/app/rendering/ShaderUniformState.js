"use strict";

/**
 * Tracks per-frame uniform values and packs them into shared buffers.
 *
 * The packed buffer is used for both WebGL uniform updates and WebGPU
 * uniform buffers, ensuring a consistent data layout across backends.
 *
 * @example
 * const state = new ShaderUniformState(canvas, mouse);
 * const frame = state.nextFrame(performance.now());
 */
export class ShaderUniformState
{
    static BUFFER_SIZE = 64;

    static OFFSETS = {
        resolution: 0,
        time: 3,
        timeDelta: 4,
        frame: 5,
        frameRate: 6,
        mouse: 7
    };

    /**
     * @param {HTMLCanvasElement} canvas - Render target.
     * @param {object} mouse - Shared mouse state.
     */
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.buffer = new ArrayBuffer(ShaderUniformState.BUFFER_SIZE);
        this.floatView = new Float32Array(this.buffer);
        this.uintView = new Uint32Array(this.buffer);
        this.reset();
    }

    /**
     * Updates tracked canvas reference.
     *
     * @param {HTMLCanvasElement} canvas - New canvas reference.
     * @returns {void}
     */
    setCanvas(canvas)
    {
        this.canvas = canvas;
    }

    /**
     * Resets frame counters and clears uniform buffers.
     *
     * @returns {void}
     */
    reset()
    {
        this.frameCount = 0;
        this.lastTime = null;
        this.current = null;
        this.clearViews();
    }

    /**
     * Fills uniform views with zeros.
     *
     * @returns {void}
     */
    clearViews()
    {
        this.floatView.fill(0);
        this.uintView.fill(0);
    }

    /**
     * Advances to the next frame, computing timing and mouse data.
     *
     * @param {number} timeMs - Timestamp in milliseconds.
     * @returns {object} Snapshot of the computed uniform data.
     */
    nextFrame(timeMs)
    {
        const data = this.buildFrameData(timeMs);
        this.current = data;
        this.writeToViews(data);
        return data;
    }

    /**
     * Builds uniform data snapshot for the given timestamp.
     *
     * @param {number} timeMs - Timestamp in milliseconds.
     * @returns {object} Computed uniform payload.
     */
    buildFrameData(timeMs)
    {
        const timeSeconds = timeMs * 0.001;
        const deltaSeconds = this.lastTime === null ? 0.0 : timeSeconds - this.lastTime;
        this.lastTime = timeSeconds;

        const resolution = {
            x: this.canvas?.width || 0,
            y: this.canvas?.height || 0,
            z: 1.0
        };

        const mouse = this.mouse || {};
        const mouseState = {
            x: mouse.x || 0,
            y: mouse.y || 0,
            clickX: mouse.clickX || 0,
            clickY: mouse.clickY || 0,
            zSign: mouse.isDown ? 1 : -1
        };

        const frame = this.frameCount++;
        const frameRate = deltaSeconds > 0 ? 1.0 / deltaSeconds : 0.0;

        return {
            resolution,
            timeSeconds,
            deltaSeconds,
            frame,
            frameRate,
            mouse: mouseState
        };
    }

    /**
     * Writes the provided uniform data into the underlying views.
     *
     * @param {object} data - Frame data snapshot.
     * @returns {void}
     */
    writeToViews(data = this.current)
    {
        if (!data)
        {
            return;
        }

        const offsets = ShaderUniformState.OFFSETS;
        const f = this.floatView;
        const u = this.uintView;

        f[offsets.resolution + 0] = data.resolution.x;
        f[offsets.resolution + 1] = data.resolution.y;
        f[offsets.resolution + 2] = data.resolution.z;

        f[offsets.time] = data.timeSeconds;
        f[offsets.timeDelta] = data.deltaSeconds;
        u[offsets.frame] = data.frame;
        f[offsets.frameRate] = data.frameRate;

        f[offsets.mouse + 0] = data.mouse.x;
        f[offsets.mouse + 1] = data.mouse.y;
        f[offsets.mouse + 2] = data.mouse.clickX * data.mouse.zSign;
        f[offsets.mouse + 3] = data.mouse.clickY;
    }

    /**
     * Returns references to the underlying uniform buffer and views.
     *
     * @returns {{buffer: ArrayBuffer, floatView: Float32Array, uintView: Uint32Array}}
     * Buffer and typed views.
     */
    getViews()
    {
        return {
            buffer: this.buffer,
            floatView: this.floatView,
            uintView: this.uintView
        };
    }

    /**
     * Returns the last computed uniform snapshot.
     *
     * @returns {object|null} Last computed frame data.
     */
    getCurrent()
    {
        return this.current;
    }
}
