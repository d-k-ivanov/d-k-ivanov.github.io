"use strict";

import { TextureLoader } from "../TextureLoader.js";
import { BaseRenderer } from "./BaseRenderer.js";
import { SamplerState } from "./SamplerState.js";

export class WebGLRenderer extends BaseRenderer
{
    constructor(canvas, mouse)
    {
        super(canvas, mouse);
        this.gl = canvas.getContext("webgl2");
        if (!this.gl)
        {
            throw new Error("No WebGL2 context available");
        }

        this.program = null;
        this.uniforms = {};
        this.samplers = new SamplerState();
        this.programVersion = 0;
        this.textureLoader = new TextureLoader(this.gl);
    }

    compileShader(source, type)
    {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(error);
        }
        return shader;
    }

    async updateShaders(sources)
    {
        const gl = this.gl;
        const vertSrc = sources.vertex;
        const fragSrc = sources.fragment;

        if (!vertSrc || !fragSrc)
        {
            throw new Error("Vertex and fragment shaders are required for WebGL");
        }

        const vs = this.compileShader(vertSrc, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);

        const newProgram = gl.createProgram();
        gl.attachShader(newProgram, vs);
        gl.attachShader(newProgram, fs);
        gl.linkProgram(newProgram);

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS))
        {
            const error = gl.getProgramInfoLog(newProgram);
            gl.deleteProgram(newProgram);
            throw new Error(error);
        }

        if (this.program)
        {
            gl.deleteProgram(this.program);
        }

        this.programVersion++;
        const version = this.programVersion;
        this.program = newProgram;

        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iTimeDelta: gl.getUniformLocation(newProgram, "iTimeDelta"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame"),
            iFrameRate: gl.getUniformLocation(newProgram, "iFrameRate"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse")
        };

        this.detectChannelUniforms(newProgram);
        await this.prepareChannelTextures(version);
        this.resetFrameState();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    startRenderLoop()
    {
        if (this.animationId)
        {
            return;
        }

        const gl = this.gl;
        const canvas = this.canvas;

        const render = (time) =>
        {
            if (!this.program)
            {
                this.requestFrame(render);
                return;
            }

            const frameData = this.uniformState.nextFrame(time);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.program);

            this.applyUniforms(frameData);
            this.bindChannelTextures();
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }

    applyUniforms(frameData)
    {
        const gl = this.gl;
        const u = this.uniforms;

        if (u.iResolution)
        {
            gl.uniform3f(u.iResolution, frameData.resolution.x, frameData.resolution.y, frameData.resolution.z);
        }
        if (u.iTime)
        {
            gl.uniform1f(u.iTime, frameData.timeSeconds);
        }
        if (u.iTimeDelta)
        {
            gl.uniform1f(u.iTimeDelta, frameData.deltaSeconds);
        }
        if (u.iFrame)
        {
            gl.uniform1i(u.iFrame, frameData.frame);
        }
        if (u.iFrameRate)
        {
            gl.uniform1f(u.iFrameRate, frameData.frameRate);
        }
        if (u.iMouse)
        {
            const mouse = frameData.mouse;
            gl.uniform4f(u.iMouse, mouse.x, mouse.y, mouse.clickX * mouse.zSign, mouse.clickY);
        }
    }

    detectChannelUniforms(program)
    {
        const gl = this.gl;
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        this.samplers.reset();

        for (let i = 0; i < uniformCount; i++)
        {
            const info = gl.getActiveUniform(program, i);
            if (!info)
            {
                continue;
            }

            const baseName = info.name.replace(/\[0\]$/, "");
            const match = baseName.match(/^iChannel([0-3])$/);
            if (!match)
            {
                continue;
            }

            const index = parseInt(match[1], 10);
            const type = info.type === gl.SAMPLER_CUBE ? "cube" : "2d";
            const location = gl.getUniformLocation(program, baseName);

            this.samplers.setChannel(index, {
                index,
                name: baseName,
                type,
                location,
                texture: this.textureLoader.getFallback(type)
            });
        }
    }

    async prepareChannelTextures(version)
    {
        const loaders = [];
        for (const channel of this.samplers.getChannels())
        {
            if (!channel || !channel.location)
            {
                continue;
            }

            const loader = this.textureLoader.loadChannelTexture(channel.index, channel.type)
                .then((texture) =>
                {
                    if (version !== this.programVersion)
                    {
                        return;
                    }

                    channel.texture = texture || this.textureLoader.getFallback(channel.type);
                })
                .catch(() =>
                {
                    channel.texture = this.textureLoader.getFallback(channel.type);
                });

            loaders.push(loader);
        }

        await Promise.all(loaders);
    }

    bindChannelTextures()
    {
        const gl = this.gl;

        for (const channel of this.samplers.getChannels())
        {
            if (!channel || !channel.location)
            {
                continue;
            }

            const textureUnit = channel.index;
            const isCube = channel.type === "cube";
            const target = isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
            const texture = channel.texture || this.textureLoader.getFallback(channel.type);

            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.bindTexture(target, texture);
            gl.uniform1i(channel.location, textureUnit);
        }
    }
}
