"use strict";

import { ShaderEditor } from "./shader-editor.js";

class ShaderRenderer
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

        this.program = newProgram;

        // Update uniform locations
        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime")
        };

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

            if (this.uniforms.iResolution)
            {
                gl.uniform3f(this.uniforms.iResolution, canvas.width, canvas.height, 1.0);
            }
            if (this.uniforms.iTime)
            {
                gl.uniform1f(this.uniforms.iTime, time * 0.001);
            }

            gl.drawArrays(gl.TRIANGLES, 0, 3);
            this.animationId = requestAnimationFrame(render);
        };

        this.animationId = requestAnimationFrame(render);
    }

    stopRenderLoop()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

function initResolutionSelector(canvas)
{
    const selector = document.getElementById("resolution-select");
    if (!selector) return;

    function applyResolution()
    {
        const [width, height] = selector.value.split("x").map(Number);
        canvas.width = width;
        canvas.height = height;
    }

    selector.addEventListener("change", applyResolution);
    applyResolution();
}

// Initialize application
const canvas = document.getElementById("canvas");
initResolutionSelector(canvas);

const renderer = new ShaderRenderer(canvas);
const editor = new ShaderEditor(renderer);

// Load first shader by default
editor.loadShader({ folder: "curena", name: "p6mm" });
