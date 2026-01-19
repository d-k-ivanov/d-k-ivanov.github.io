"use strict";

import { BaseRenderer } from "./BaseRenderer.js";
import { WebGLTextureLoader } from "./WebGLTextureLoader.js";

const MODEL_GEOMETRY_MARKER = /\bMODEL_GEOMETRY\b/;
const MODEL_PADDING_MARKER = /\bMODEL_GEOMETRY_WITH_PADDING\b/;

/**
 * WebGL2 renderer backend for the shader editor.
 *
 * This backend compiles GLSL vertex/fragment shaders, binds standard
 * Shadertoy-style uniforms, and optionally draws model geometry when
 * the shader opts into it.
 *
 * @example
 * const renderer = new WebGLRenderer(canvas, mouseState);
 * await renderer.updateShaders({ vertex: "...", fragment: "..." });
 */
export class WebGLRenderer extends BaseRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas - Render target.
     * @param {object} mouse - Shared mouse state.
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
        this.modelPadding = 0;
        this.backbuffer = null;
        this.backbufferSize = { width: 0, height: 0 };
        this.backbufferUnit = 4;
        this.backbufferUniform = null;
        this.useBackbuffer = false;
    }

    /**
     * Compiles a shader source into a WebGL shader object.
     *
     * @param {string} source - GLSL source code.
     * @param {number} type - WebGL shader type constant.
     * @returns {WebGLShader} Compiled shader object.
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
     *
     * @param {{vertex: string, fragment: string}} sources - GLSL sources.
     * @returns {Promise<void>} Resolves when textures are ready and loop starts.
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
        const nextPadding = this.useModelGeometry && this.detectModelPadding(vertSrc, fragSrc) ? 3 : 0;
        const paddingChanged = nextPadding !== this.modelPadding;
        this.modelPadding = nextPadding;
        if (paddingChanged)
        {
            this.updateModelBuffers();
        }

        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iTimeDelta: gl.getUniformLocation(newProgram, "iTimeDelta"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame"),
            iFrameRate: gl.getUniformLocation(newProgram, "iFrameRate"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse"),
            iMouseL: gl.getUniformLocation(newProgram, "iMouseL"),
            iMouseR: gl.getUniformLocation(newProgram, "iMouseR"),
            iMouseW: gl.getUniformLocation(newProgram, "iMouseW"),
            iMouseZoom: gl.getUniformLocation(newProgram, "iMouseZoom"),
            uHasModel: gl.getUniformLocation(newProgram, "uHasModel"),
            uModelCenter: gl.getUniformLocation(newProgram, "uModelCenter"),
            uModelScale: gl.getUniformLocation(newProgram, "uModelScale"),
            uModelBoundsMin: gl.getUniformLocation(newProgram, "uModelBoundsMin"),
            uModelBoundsMax: gl.getUniformLocation(newProgram, "uModelBoundsMax"),
            uBackbuffer: gl.getUniformLocation(newProgram, "uBackbuffer")
        };

        this.backbufferUniform = this.uniforms.uBackbuffer;
        this.useBackbuffer = Boolean(this.backbufferUniform);
        if (!this.useBackbuffer)
        {
            this.disposeBackbuffer();
        }

        this.detectChannels(newProgram);
        await this.prepareChannelTextures(version);
        this.resetFrameState();
        this.ensureBackbuffer();

        if (!this.animationId)
        {
            this.startRenderLoop();
        }
    }

    /**
     * Begins the requestAnimationFrame loop for WebGL rendering.
     *
     * @returns {void}
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
            this.ensureBackbuffer();
            this.bindBackbuffer();

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
            this.updateBackbuffer();
            this.requestFrame(render);
        };

        this.requestFrame(render);
    }

    /**
     * Handles canvas resize events for backbuffer shaders.
     *
     * @returns {void}
     */
    handleResize()
    {
        this.ensureBackbuffer();
    }

    /**
     * Uploads standard uniforms for the current frame.
     *
     * @param {object} frameData - Data returned by {@link ShaderUniformState}.
     * @returns {void}
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
            const mouse = frameData.mouseL;
            gl.uniform4f(u.iMouse, mouse.downX, mouse.downY, mouse.clickX * mouse.downSign, mouse.clickY * mouse.clickSign);
        }
        if (u.iMouseL)
        {
            const mouse = frameData.mouseL;
            gl.uniform4f(u.iMouseL, mouse.downX, mouse.downY, mouse.clickX * mouse.downSign, mouse.clickY * mouse.clickSign);
        }
        if (u.iMouseR)
        {
            const mouse = frameData.mouseR;
            gl.uniform4f(u.iMouseR, mouse.downX, mouse.downY, mouse.clickX * mouse.downSign, mouse.clickY * mouse.clickSign);
        }
        if (u.iMouseW)
        {
            const mouse = frameData.mouseW;
            gl.uniform4f(u.iMouseW, mouse.downX, mouse.downY, mouse.clickX * mouse.downSign, mouse.clickY * mouse.clickSign);
        }
        if (u.iMouseZoom)
        {
            const zoom = frameData.mouseZoom;
            gl.uniform4f(u.iMouseZoom, zoom.x, zoom.y, zoom.z, zoom.w);
        }

        this.applyModelUniforms();
    }

    /**
     * Scans a program for iChannel uniforms and prepares sampler state.
     *
     * @param {WebGLProgram} program - Linked program to inspect.
     * @returns {void}
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
     *
     * @param {number} version - Program version used to avoid stale loads.
     * @returns {Promise<void>} Resolves once textures are loaded.
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
     *
     * @returns {void}
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
     * Ensures the backbuffer texture matches the current canvas size.
     *
     * @returns {void}
     */
    ensureBackbuffer()
    {
        if (!this.useBackbuffer)
        {
            return;
        }

        const gl = this.gl;
        const width = Math.max(1, Math.floor(this.canvas?.width || 0));
        const height = Math.max(1, Math.floor(this.canvas?.height || 0));
        if (this.backbuffer && this.backbufferSize.width === width && this.backbufferSize.height === height)
        {
            return;
        }

        this.disposeBackbuffer();

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this.backbufferUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.backbuffer = texture;
        this.backbufferSize = { width, height };
    }

    /**
     * Binds the backbuffer texture to the shader uniform.
     *
     * @returns {void}
     */
    bindBackbuffer()
    {
        if (!this.useBackbuffer || !this.backbuffer || !this.backbufferUniform)
        {
            return;
        }

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + this.backbufferUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.backbuffer);
        gl.uniform1i(this.backbufferUniform, this.backbufferUnit);
    }

    /**
     * Updates the backbuffer by copying the current frame.
     *
     * @returns {void}
     */
    updateBackbuffer()
    {
        if (!this.useBackbuffer || !this.backbuffer)
        {
            return;
        }

        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0 + this.backbufferUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.backbuffer);
        gl.copyTexSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            0,
            0,
            this.backbufferSize.width,
            this.backbufferSize.height
        );
    }

    /**
     * Releases the backbuffer texture.
     *
     * @returns {void}
     */
    disposeBackbuffer()
    {
        if (this.backbuffer)
        {
            this.gl.deleteTexture(this.backbuffer);
        }
        this.backbuffer = null;
        this.backbufferSize = { width: 0, height: 0 };
    }

    /**
     * Accepts model data and uploads vertex buffers.
     *
     * @param {object|null} model - Model payload or null to clear.
     * @returns {void}
     */
    setModel(model)
    {
        super.setModel(model);
        this.modelInfo = model ? this.buildModelInfo(model) : null;
        this.updateModelBuffers();
    }

    /**
     * Parses sources for model-geometry markers.
     *
     * @param {string} vertexSource - Vertex shader source.
     * @param {string} fragmentSource - Fragment shader source.
     * @returns {boolean} True when model geometry should be used.
     */
    detectModelGeometry(vertexSource, fragmentSource)
    {
        const combined = `${vertexSource || ""}\n${fragmentSource || ""}`;
        return MODEL_GEOMETRY_MARKER.test(combined);
    }

    /**
     * Detects markers that reserve padding before model vertices.
     *
     * @param {string} vertexSource - Vertex shader source.
     * @param {string} fragmentSource - Fragment shader source.
     * @returns {boolean} True when the shader expects padded model buffers.
     */
    detectModelPadding(vertexSource, fragmentSource)
    {
        const combined = `${vertexSource || ""}\n${fragmentSource || ""}`;
        return MODEL_PADDING_MARKER.test(combined);
    }

    /**
     * Computes derived model info (center/scale/bounds).
     *
     * @param {object} model - Model payload with bounds.
     * @returns {{center: number[], scale: number, boundsMin: number[], boundsMax: number[]}}
     * Derived model info.
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
     *
     * @returns {void}
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
        const baseVertexCount = positions.length / 3;
        const padding = this.modelPadding || 0;
        const vertexCount = baseVertexCount + padding;
        const uvs = this.model.uvs || new Float32Array(baseVertexCount * 2);
        let uploadPositions = positions;
        let uploadNormals = normals;
        let uploadUVs = uvs;

        if (padding > 0)
        {
            uploadPositions = new Float32Array(vertexCount * 3);
            uploadNormals = new Float32Array(vertexCount * 3);
            uploadUVs = new Float32Array(vertexCount * 2);

            uploadPositions.set(positions, padding * 3);
            uploadNormals.set(normals, padding * 3);
            uploadUVs.set(uvs, padding * 2);
        }

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
        gl.bufferData(gl.ARRAY_BUFFER, uploadPositions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelBuffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, uploadNormals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.modelBuffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, uploadUVs, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.modelBuffers.vertexCount = vertexCount;
    }

    /**
     * Releases model buffers from GPU memory.
     *
     * @returns {void}
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
     *
     * @returns {void}
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

    /**
     * Releases GPU resources and stops rendering.
     *
     * @returns {void}
     */
    dispose()
    {
        this.stop();

        if (this.program)
        {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }

        this.disposeModelBuffers();

        if (this.textureLoader)
        {
            this.textureLoader.dispose();
            this.textureLoader = null;
        }

        this.channels = [];
        this.uniforms = {};
    }
}
