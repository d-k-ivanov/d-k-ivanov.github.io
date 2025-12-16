"use strict";

import { CanvasControls } from "./canvas-controls.js";
import { PanelResizer } from "./panel-resizer.js";
import { ShaderEditor } from "./shader-editor.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { ThemeManager } from "./theme-manager.js";

// Initialize application
const canvasWrapper = document.querySelector(".shaders-canvas-wrapper");
let canvas = document.getElementById("canvas");
let canvasControls = null;

const renderer = new ShaderRenderer(canvas);
const editor = new ShaderEditor(renderer);
const resizer = new PanelResizer();
const themeManager = new ThemeManager();

renderer.setCanvasChangeHandler((newCanvas) =>
{
    canvas = newCanvas;
    if (canvasControls)
    {
        canvasControls.setCanvas(newCanvas);
    }
});

const recreateCanvas = () =>
{
    if (!canvasWrapper || !canvas)
    {
        return canvas;
    }

    const newCanvas = canvas.cloneNode(false);
    newCanvas.id = canvas.id;
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    canvasWrapper.replaceChild(newCanvas, canvas);
    canvas = newCanvas;

    if (canvasControls)
    {
        canvasControls.setCanvas(newCanvas);
    }

    renderer.setCanvas(newCanvas);
    return newCanvas;
};

canvasControls = new CanvasControls(canvas, {
    onResolutionChange: () => renderer.handleResize()
});

// Handle Ctrl+F5 to reset to initial state
document.addEventListener("keydown", (e) =>
{
    if ((e.key === "F5" && e.ctrlKey) || (e.key === "R" && e.ctrlKey && e.shiftKey))
    {
        e.preventDefault();
        editor.clearSavedShader();
        themeManager.resetThemes();
        location.reload();
    }
});

const init = async () =>
{
    recreateCanvas();
    const savedShader = editor.getSavedShader();
    await editor.loadShader(savedShader || { folder: "basics", name: "hello_world" });
};

init().catch((error) =>
{
    editor.setStatus(`Init error: ${error.message}`, true);
});
