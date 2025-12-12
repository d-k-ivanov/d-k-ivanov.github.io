"use strict";

async function loadShader(url)
{
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Failed to load shader: ${url}`);
    return response.text();
}

function compileShader(gl, source, type)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader));
    return shader;
}

async function initCanvas(canvas)
{
    const gl = canvas.getContext("webgl2");
    if (!gl)
        throw new Error("No WebGL2 context available");

    const [vsSrc, fsSrc] = await Promise.all([
        loadShader("/shaders/collection/bµg_moonlight/bµg_moonlight.vert"),
        loadShader("/shaders/collection/bµg_moonlight/bµg_moonlight.frag")
    ]);

    const vs = compileShader(gl, vsSrc, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSrc, gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(shaderProgram));

    const iResolution = gl.getUniformLocation(shaderProgram, "iResolution");
    const iTime = gl.getUniformLocation(shaderProgram, "iTime");

    function render(time)
    {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(shaderProgram);
        gl.uniform2f(iResolution, canvas.width, canvas.height);
        gl.uniform1f(iTime, time * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function setCanvasResolution(canvas, width, height)
{
    canvas.width = width;
    canvas.height = height;
}

function initResolutionSelector(canvas)
{
    const selector = document.getElementById("resolution-select");
    if (!selector) return;

    function applyResolution()
    {
        const [width, height] = selector.value.split("x").map(Number);
        setCanvasResolution(canvas, width, height);
    }

    selector.addEventListener("change", applyResolution);
    applyResolution();
}

const canvas = document.getElementById("canvas");
initResolutionSelector(canvas);
initCanvas(canvas);
