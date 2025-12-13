"use strict";

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

        this.program = newProgram;

        // Update uniform locations
        this.uniforms = {
            iResolution: gl.getUniformLocation(newProgram, "iResolution"),
            iTime: gl.getUniformLocation(newProgram, "iTime"),
            iMouse: gl.getUniformLocation(newProgram, "iMouse"),
            iFrame: gl.getUniformLocation(newProgram, "iFrame")
        };

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
            if (this.uniforms.iMouse)
            {
                const m = this.mouse;
                // Shadertoy convention: xy = current pos, zw = click pos (negative z if not pressed)
                const zSign = m.isDown ? 1 : -1;
                gl.uniform4f(this.uniforms.iMouse, m.x, m.y, m.clickX * zSign, m.clickY);
            }
            if (this.uniforms.iFrame)
            {
                gl.uniform1i(this.uniforms.iFrame, this.frameCount);
            }

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
}
