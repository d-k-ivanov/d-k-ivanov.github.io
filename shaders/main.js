"use strict";

import { CanvasControls } from "./canvas-controls.js";
import { PanelResizer } from "./panel-resizer.js";
import { ShaderEditor } from "./shader-editor.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { ThemeManager } from "./theme-manager.js";

// Initialize application
const canvas = document.getElementById("canvas");
const canvasControls = new CanvasControls(canvas);

const renderer = new ShaderRenderer(canvas);
const editor = new ShaderEditor(renderer);
const resizer = new PanelResizer();
const themeManager = new ThemeManager();

// Handle Ctrl+F5 to reset to initial state
document.addEventListener("keydown", (e) =>
{
    if (e.key === "F5" && e.ctrlKey)
    {
        e.preventDefault();
        editor.clearSavedShader();
        themeManager.resetThemes();
        location.reload();
    }
});

// Load saved shader or default to Hello World
const savedShader = editor.getSavedShader();
editor.loadShader(savedShader || { folder: "basics", name: "hello_world" });
