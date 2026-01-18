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
    static BUFFER_SIZE = 80;

    static OFFSETS = {
        resolution: 0,
        time: 3,
        timeDelta: 4,
        frame: 5,
        frameRate: 6,
        mouse: 8,
        gridSize: 12,
        viewCenter: 16,
        viewZoom: 18
    };

    /**
     * @param {HTMLCanvasElement} canvas - Render target.
     * @param {object} mouse - Shared mouse state.
     */
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.gridSize = { x: 1, y: 1, z: 1 };
        this.frameOverride = null;
        this.timeOverride = null;
        this.timeOriginMs = null;
        this.lastTimeMs = null;
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
     * Updates the grid size sent to the uniform buffer.
     *
     * @param {{x: number, y: number, z: number}} gridSize - Grid size for shader use.
     * @returns {void}
     */
    setGridSize(gridSize)
    {
        if (!gridSize)
        {
            return;
        }

        this.gridSize = {
            x: Math.max(1, Math.floor(gridSize.x || 1)),
            y: Math.max(1, Math.floor(gridSize.y || 1)),
            z: Math.max(1, Math.floor(gridSize.z || 1))
        };
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
        this.timeOriginMs = null;
        this.lastTimeMs = null;
        this.current = null;
        this.clearViews();
    }

    /**
     * Overrides the frame counter with a fixed value.
     *
     * @param {number|null} frame - Frame value to lock, or null to clear.
     * @returns {void}
     */
    setFrameOverride(frame)
    {
        if (frame === null || frame === undefined)
        {
            this.frameOverride = null;
            return;
        }

        const nextFrame = Math.max(0, Math.floor(frame));
        this.frameOverride = nextFrame;
        this.frameCount = nextFrame;
    }

    /**
     * Clears the frame override.
     *
     * @returns {void}
     */
    clearFrameOverride()
    {
        this.frameOverride = null;
    }

    /**
     * Overrides the time counter with a fixed value.
     *
     * @param {number|null} timeSeconds - Time value to lock, or null to clear.
     * @returns {void}
     */
    setTimeOverride(timeSeconds)
    {
        if (timeSeconds === null || timeSeconds === undefined)
        {
            this.timeOverride = null;
            return;
        }

        const nextTime = Math.max(0, Number(timeSeconds));
        this.timeOverride = Number.isFinite(nextTime) ? nextTime : 0;
        this.lastTime = this.timeOverride;
    }

    /**
     * Clears the time override.
     *
     * @returns {void}
     */
    clearTimeOverride()
    {
        if (Number.isFinite(this.timeOverride) && Number.isFinite(this.lastTimeMs))
        {
            this.timeOriginMs = this.lastTimeMs - (this.timeOverride * 1000);
        }
        this.timeOverride = null;
        this.lastTime = null;
    }

    /**
     * Returns the next frame count value.
     *
     * @returns {number} Current frame counter.
     */
    getFrameCount()
    {
        return this.frameCount;
    }

    /**
     * Returns the last computed time in seconds.
     *
     * @returns {number} Current time in seconds.
     */
    getTimeSeconds()
    {
        return this.current?.timeSeconds ?? 0;
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
        this.lastTimeMs = timeMs;
        if (!Number.isFinite(this.timeOriginMs))
        {
            this.timeOriginMs = timeMs;
        }
        const rawTimeSeconds = (timeMs - this.timeOriginMs) * 0.001;
        const usingTimeOverride = Number.isFinite(this.timeOverride);
        const timeSeconds = usingTimeOverride ? this.timeOverride : rawTimeSeconds;
        const deltaSeconds = usingTimeOverride ? 0.0 : (this.lastTime === null ? 0.0 : timeSeconds - this.lastTime);
        if (!usingTimeOverride)
        {
            this.lastTime = timeSeconds;
        }

        const resolution = {
            x: this.canvas?.width || 0,
            y: this.canvas?.height || 0,
            z: 1.0
        };

        const mouse = this.mouse || {};
        const downX = Number.isFinite(mouse.clickX) ? mouse.clickX : 0;
        const downY = Number.isFinite(mouse.clickY) ? mouse.clickY : 0;
        const clickX = Number.isFinite(mouse.lastClickX) ? mouse.lastClickX : 0;
        const clickY = Number.isFinite(mouse.lastClickY) ? mouse.lastClickY : 0;
        const downSign = mouse.isDown ? 1 : -1;
        const clickSign = mouse.clicked ? 1 : -1;
        const mouseState = {
            downX,
            downY,
            clickX,
            clickY,
            downSign,
            clickSign
        };

        if (mouse.clicked)
        {
            mouse.clicked = false;
        }

        const frame = Number.isFinite(this.frameOverride) ? this.frameOverride : this.frameCount++;
        const frameRate = deltaSeconds > 0 ? 1.0 / deltaSeconds : 0.0;

        const viewCenter = {
            x: Number.isFinite(mouse.centerX) ? mouse.centerX : 0,
            y: Number.isFinite(mouse.centerY) ? mouse.centerY : 0
        };
        const viewZoom = Number.isFinite(mouse.zoom) && mouse.zoom > 0 ? mouse.zoom : 1.0;

        return {
            resolution,
            timeSeconds,
            deltaSeconds,
            frame,
            frameRate,
            mouse: mouseState,
            gridSize: this.gridSize,
            viewCenter,
            viewZoom
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

        f[offsets.mouse + 0] = data.mouse.downX;
        f[offsets.mouse + 1] = data.mouse.downY;
        f[offsets.mouse + 2] = data.mouse.clickX * data.mouse.downSign;
        f[offsets.mouse + 3] = data.mouse.clickY * data.mouse.clickSign;

        u[offsets.gridSize + 0] = data.gridSize.x;
        u[offsets.gridSize + 1] = data.gridSize.y;
        u[offsets.gridSize + 2] = data.gridSize.z;
        f[offsets.viewCenter + 0] = data.viewCenter.x;
        f[offsets.viewCenter + 1] = data.viewCenter.y;
        f[offsets.viewZoom] = data.viewZoom;
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
