"use strict";

import { PanelResizer } from "./panel-resizer.js";
import { ShaderEditor } from "./shader-editor.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { ThemeManager } from "./theme-manager.js";

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
const resizer = new PanelResizer();
const themeManager = new ThemeManager();

// Load first shader by default
editor.loadShader({ folder: "curena", name: "p6mm" });
