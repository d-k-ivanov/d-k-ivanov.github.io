"use strict";

import { BaseRenderer } from "./BaseRenderer.js";
import { WebGLTextureLoader } from "./WebGLTextureLoader.js";

const MODEL_GEOMETRY_MARKER = /\bMODEL_GEOMETRY\b/;

/**
 * WebGL2 renderer backend for the shader editor.
 */
export class WebGLRenderer extends BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - render target.
     * @param {object} mouse - shared mouse state.
     */
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
        this.channels = [];
        this.programVersion = 0;
        this.textureLoader = new WebGLTextureLoader(this.gl);
        this.modelBuffers = null;
        this.modelInfo = null;
        this.useModelGeometry = false;
    }

    /**
     * Compiles a shader source into a WebGL shader object.
     */
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

    /**
     * Links a new program from vertex/fragment sources and starts rendering.
     */
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
        this.useModelGeometry = this.detectModelGeometry(vertSrc, fragSrc);

        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iTimeDelta: gl.getUniformLocation(newProgram, "iTimeDelta"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame"),
            iFrameRate: gl.getUniformLocation(newProgram, "iFrameRate"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse"),
            uHasModel: gl.getUniformLocation(newProgram, "uHasModel"),
            uModelCenter: gl.getUniformLocation(newProgram, "uModelCenter"),
            uModelScale: gl.getUniformLocation(newProgram, "uModelScale"),
            uModelBoundsMin: gl.getUniformLocation(newProgram, "uModelBoundsMin"),
            uModelBoundsMax: gl.getUniformLocation(newProgram, "uModelBoundsMax")
        };

        this.detectChannels(newProgram);
        await this.prepareChannelTextures(version);
        this.resetFrameState();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    /**
     * Begins the requestAnimationFrame loop for WebGL rendering.
     */
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
            const hasModel = this.useModelGeometry && this.modelBuffers && this.modelBuffers.vertexCount > 0;
            gl.viewport(0, 0, canvas.width, canvas.height);
            if (hasModel)
            {
                gl.enable(gl.DEPTH_TEST);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            }
            else
            {
                gl.disable(gl.DEPTH_TEST);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }

            gl.useProgram(this.program);

            this.applyUniforms(frameData);
            this.bindChannelTextures();

            if (this.useModelGeometry)
            {
                if (hasModel && this.modelBuffers)
                {
                    gl.bindVertexArray(this.modelBuffers.vao);
                }
                const vertexCount = hasModel ? this.modelBuffers.vertexCount : 3;
                gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
                if (hasModel)
                {
                    gl.bindVertexArray(null);
                }
            }
            else
            {
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }

    /**
     * Uploads standard uniforms for the current frame.
     */
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

        this.applyModelUniforms();
    }

    /**
     * Scans a program for iChannel uniforms and prepares sampler state.
     */
    detectChannels(program)
    {
        const gl = this.gl;
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        this.channels = [null, null, null, null];

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

            this.channels[index] = {
                index,
                name: baseName,
                type,
                location,
                texture: this.textureLoader.getFallback(type)
            };
        }
    }

    /**
     * Loads textures for detected iChannel uniforms with version safety.
     */
    async prepareChannelTextures(version)
    {
        const loaders = [];
        for (const channel of this.channels)
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

    /**
     * Binds channel textures to the correct texture units.
     */
    bindChannelTextures()
    {
        const gl = this.gl;

        for (const channel of this.channels)
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

    /**
     * Accepts model data and uploads vertex buffers.
     */
    setModel(model)
    {
        super.setModel(model);
        this.modelInfo = model ? this.buildModelInfo(model) : null;
        this.updateModelBuffers();
    }

    /**
     * Parses sources for model-geometry markers.
     */
    detectModelGeometry(vertexSource, fragmentSource)
    {
        const combined = `${vertexSource || ""}\n${fragmentSource || ""}`;
        return MODEL_GEOMETRY_MARKER.test(combined);
    }

    /**
     * Computes derived model info (center/scale/bounds).
     */
    buildModelInfo(model)
    {
        const bounds = model?.bounds || {};
        const min = bounds.min || [0, 0, 0];
        const max = bounds.max || [0, 0, 0];
        const center = [
            (min[0] + max[0]) * 0.5,
            (min[1] + max[1]) * 0.5,
            (min[2] + max[2]) * 0.5
        ];
        const size = [
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2]
        ];
        const maxAxis = Math.max(size[0], size[1], size[2], 0.0001);
        const scale = 1.6 / maxAxis;

        return {
            center,
            scale,
            boundsMin: min,
            boundsMax: max
        };
    }

    /**
     * Uploads model buffers into a VAO for rendering.
     */
    updateModelBuffers()
    {
        const gl = this.gl;

        if (!this.model || !this.model.positions || !this.model.normals)
        {
            this.disposeModelBuffers();
            return;
        }

        const positions = this.model.positions;
        const normals = this.model.normals;
        const vertexCount = positions.length / 3;
        const uvs = this.model.uvs || new Float32Array(vertexCount * 2);

        if (!this.modelBuffers)
        {
            this.modelBuffers = {
                vao: gl.createVertexArray(),
                position: gl.createBuffer(),
                normal: gl.createBuffer(),
                uv: gl.createBuffer(),
                vertexCount: 0
            };
        }

        gl.bindVertexArray(this.modelBuffers.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelBuffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelBuffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelBuffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.modelBuffers.vertexCount = vertexCount;
    }

    /**
     * Releases model buffers from GPU memory.
     */
    disposeModelBuffers()
    {
        const gl = this.gl;
        if (!this.modelBuffers)
        {
            return;
        }

        gl.deleteBuffer(this.modelBuffers.position);
        gl.deleteBuffer(this.modelBuffers.normal);
        gl.deleteBuffer(this.modelBuffers.uv);
        gl.deleteVertexArray(this.modelBuffers.vao);
        this.modelBuffers = null;
    }

    /**
     * Sends model-related uniforms when available.
     */
    applyModelUniforms()
    {
        const gl = this.gl;
        const u = this.uniforms || {};
        const info = this.modelInfo;
        const hasModel = !!info;

        if (u.uHasModel)
        {
            gl.uniform1f(u.uHasModel, hasModel ? 1.0 : 0.0);
        }
        if (u.uModelCenter)
        {
            const center = info ? info.center : [0, 0, 0];
            gl.uniform3f(u.uModelCenter, center[0], center[1], center[2]);
        }
        if (u.uModelScale)
        {
            const scale = info ? info.scale : 1.0;
            gl.uniform1f(u.uModelScale, scale);
        }
        if (u.uModelBoundsMin)
        {
            const min = info ? info.boundsMin : [0, 0, 0];
            gl.uniform3f(u.uModelBoundsMin, min[0], min[1], min[2]);
        }
        if (u.uModelBoundsMax)
        {
            const max = info ? info.boundsMax : [0, 0, 0];
            gl.uniform3f(u.uModelBoundsMax, max[0], max[1], max[2]);
        }
    }
}
