"use strict";

import { TextureLoader } from "./texture-loader.js";

export class ShaderRenderer
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2");
        if (!this.gl)
        {
            throw new Error("No WebGL2 context available");
        }

        this.program = null;
        this.animationId = null;
        this.uniforms = {};
        this.frameCount = 0;
        this.channelUniforms = [];
        this.programVersion = 0;
        this.textureLoader = new TextureLoader(this.gl);

        // Mouse state: (x, y, click x, click y)
        // xy = current position if mouse down, else last position
        // zw = click position (positive if pressed, negative if released)
        this.mouse = { x: 0, y: 0, clickX: 0, clickY: 0, isDown: false };
        this.setupMouseEvents();
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

    async updateShaders(vertSrc, fragSrc)
    {
        const gl = this.gl;

        // Compile new shaders
        const vs = this.compileShader(vertSrc, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragSrc, gl.FRAGMENT_SHADER);

        // Create and link program
        const newProgram = gl.createProgram();
        gl.attachShader(newProgram, vs);
        gl.attachShader(newProgram, fs);
        gl.linkProgram(newProgram);

        // Clean up shaders (they're now attached to program)
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS))
        {
            const error = gl.getProgramInfoLog(newProgram);
            gl.deleteProgram(newProgram);
            throw new Error(error);
        }

        // Delete old program if exists
        if (this.program)
        {
            gl.deleteProgram(this.program);
        }

        this.programVersion++;
        const version = this.programVersion;
        this.program = newProgram;

        // Update uniform locations
        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iTimeDelta: gl.getUniformLocation(newProgram, "iTimeDelta"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame"),
            iFrameRate: gl.getUniformLocation(newProgram, "iFrameRate"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse"),
        };

        this.detectChannelUniforms(newProgram);
        await this.prepareChannelTextures(version);

        // Reset frame counter when shaders change
        this.frameCount = 0;

        // Start render loop if not already running
        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    startRenderLoop()
    {
        const gl = this.gl;
        const canvas = this.canvas;

        let lastRenderTime = null;
        const render = (time) =>
        {
            if (!this.program)
            {
                this.animationId = requestAnimationFrame(render);
                return;
            }

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.program);

            // Calculate time in seconds
            const t = time * 0.001;
            let delta = 0.0;
            let frameRate = 0.0;
            if (lastRenderTime !== null)
            {
                delta = t - lastRenderTime;
                frameRate = delta > 0 ? 1.0 / delta : 0.0;
            }
            lastRenderTime = t;

            if (this.uniforms.iResolution)
            {
                gl.uniform3f(this.uniforms.iResolution, canvas.width, canvas.height, 1.0);
            }

            if (this.uniforms.iTime)
            {
                gl.uniform1f(this.uniforms.iTime, t);
            }
            if (this.uniforms.iTimeDelta)
            {
                gl.uniform1f(this.uniforms.iTimeDelta, delta);
            }

            if (this.uniforms.iFrame)
            {
                gl.uniform1i(this.uniforms.iFrame, this.frameCount);
            }
            if (this.uniforms.iFrameRate)
            {
                gl.uniform1f(this.uniforms.iFrameRate, frameRate);
            }

            if (this.uniforms.iMouse)
            {
                const m = this.mouse;
                // Shadertoy convention: xy = current pos, zw = click pos (negative z if not pressed)
                const zSign = m.isDown ? 1 : -1;
                gl.uniform4f(this.uniforms.iMouse, m.x, m.y, m.clickX * zSign, m.clickY);
            }

            this.bindChannelTextures();
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            this.frameCount++;
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    setupMouseEvents()
    {
        const canvas = this.canvas;

        const getMousePos = (e) =>
        {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                // Flip Y to match Shadertoy (origin at bottom-left)
                y: canvas.height - (e.clientY - rect.top) * scaleY
            };
        };

        canvas.addEventListener("mousedown", (e) =>
        {
            const pos = getMousePos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
            this.mouse.clickX = pos.x;
            this.mouse.clickY = pos.y;
            this.mouse.isDown = true;
        });

        canvas.addEventListener("mousemove", (e) =>
        {
            if (this.mouse.isDown)
            {
                const pos = getMousePos(e);
                this.mouse.x = pos.x;
                this.mouse.y = pos.y;
            }
        });

        canvas.addEventListener("mouseup", () =>
        {
            this.mouse.isDown = false;
        });

        canvas.addEventListener("mouseleave", () =>
        {
            this.mouse.isDown = false;
        });
    }

    stopRenderLoop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    detectChannelUniforms(program)
    {
        const gl = this.gl;
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        const channels = [null, null, null, null];

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

            channels[index] = {
                index,
                name: baseName,
                type,
                location,
                texture: this.textureLoader.getFallback(type)
            };
        }

        this.channelUniforms = channels;
    }

    async prepareChannelTextures(version)
    {
        const loaders = [];
        for (const channel of this.channelUniforms)
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

        for (const channel of this.channelUniforms)
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
