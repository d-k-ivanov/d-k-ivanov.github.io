"use strict";

export const WEBGPU_UNIFORM_BUFFER_SIZE = 64;

export const UNIFORM_OFFSETS = {
    resolution: 0,
    time: 4,
    timeDelta: 5,
    frame: 6,
    frameRate: 7,
    mouse: 12
};

export function createUniformViews(size = WEBGPU_UNIFORM_BUFFER_SIZE)
{
    const buffer = new ArrayBuffer(size);
    return {
        buffer,
        floatView: new Float32Array(buffer),
        uintView: new Uint32Array(buffer)
    };
}

export class ShaderUniformState
{
    constructor(canvas, mouse)
    {
        this.canvas = canvas;
        this.mouse = mouse;
        this.frameCount = 0;
        this.lastTime = null;
        this.current = null;
    }

    setCanvas(canvas)
    {
        this.canvas = canvas;
    }

    reset()
    {
        this.frameCount = 0;
        this.lastTime = null;
        this.current = null;
    }

    nextFrame(timeMs)
    {
        const timeSeconds = timeMs * 0.001;
        const deltaSeconds = this.lastTime === null ? 0.0 : timeSeconds - this.lastTime;
        this.lastTime = timeSeconds;

        const frame = this.frameCount;
        this.frameCount++;

        const frameRate = deltaSeconds > 0 ? 1.0 / deltaSeconds : 0.0;

        const m = this.mouse || { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
        const mouseState = {
            x: m.x,
            y: m.y,
            clickX: m.clickX,
            clickY: m.clickY,
            zSign: m.isDown ? 1 : -1
        };

        const resolution = {
            x: this.canvas?.width || 0,
            y: this.canvas?.height || 0,
            z: 1.0
        };

        this.current = {
            resolution,
            timeSeconds,
            deltaSeconds,
            frame,
            frameRate,
            mouse: mouseState
        };

        return this.current;
    }

    writeToViews(floatView, uintView, data = this.current)
    {
        if (!data || !floatView || !uintView)
        {
            return;
        }

        floatView[UNIFORM_OFFSETS.resolution + 0] = data.resolution.x;
        floatView[UNIFORM_OFFSETS.resolution + 1] = data.resolution.y;
        floatView[UNIFORM_OFFSETS.resolution + 2] = data.resolution.z;
        floatView[UNIFORM_OFFSETS.resolution + 3] = 0.0;

        floatView[UNIFORM_OFFSETS.time] = data.timeSeconds;
        floatView[UNIFORM_OFFSETS.timeDelta] = data.deltaSeconds;
        uintView[UNIFORM_OFFSETS.frame] = data.frame;
        floatView[UNIFORM_OFFSETS.frameRate] = data.frameRate;

        floatView[8] = 0.0;
        floatView[9] = 0.0;
        floatView[10] = 0.0;
        floatView[11] = 0.0;

        floatView[UNIFORM_OFFSETS.mouse + 0] = data.mouse.x;
        floatView[UNIFORM_OFFSETS.mouse + 1] = data.mouse.y;
        floatView[UNIFORM_OFFSETS.mouse + 2] = data.mouse.clickX * data.mouse.zSign;
        floatView[UNIFORM_OFFSETS.mouse + 3] = data.mouse.clickY;
    }
}
