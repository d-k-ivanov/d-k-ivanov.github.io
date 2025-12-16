"use strict";

import { CanvasControls } from "./canvas-controls.js";
import { PanelResizer } from "./panel-resizer.js";
import { ShaderEditor } from "./shader-editor.js";
import { ShaderRenderer } from "./shader-renderer.js";
import { ThemeManager } from "./theme-manager.js";

class ShaderApp
{
    constructor()
    {
        this.canvas = document.getElementById("canvas");
        this.renderer = new ShaderRenderer(this.canvas);
        this.editor = new ShaderEditor(this.renderer);
        this.resizer = new PanelResizer();
        this.themeManager = new ThemeManager();

        this.canvasControls = new CanvasControls(this.canvas, {
            onResolutionChange: () => this.renderer.handleResize()
        });

        this.renderer.setCanvasChangeHandler((newCanvas) => this.handleCanvasChanged(newCanvas));

        this.bindHotkeys();
        this.bindNoteToggle();
    }

    handleCanvasChanged(newCanvas)
    {
        this.canvas = newCanvas;
        if (this.canvasControls)
        {
            this.canvasControls.setCanvas(newCanvas);
        }
    }

    recreateCanvas()
    {
        const newCanvas = this.renderer.recreateCanvas();
        if (newCanvas && this.canvasControls)
        {
            this.canvasControls.setCanvas(newCanvas);
        }
        return newCanvas;
    }

    bindHotkeys()
    {
        document.addEventListener("keydown", (e) =>
        {
            if ((e.key === "F5" && e.ctrlKey) || (e.key === "R" && e.ctrlKey && e.shiftKey))
            {
                e.preventDefault();
                this.editor.clearSavedShader();
                this.themeManager.resetThemes();
                location.reload();
            }
        });
    }

    bindNoteToggle()
    {
        const note = document.querySelector(".shaders-note");
        if (!note)
        {
            return;
        }

        note.classList.add("collapsed");

        const toggle = () => note.classList.toggle("collapsed");
        const title = note.querySelector(".shaders-note-title");
        if (title)
        {
            title.style.cursor = "pointer";
            title.addEventListener("click", (e) =>
            {
                e.stopPropagation();
                toggle();
            });
        }
        note.addEventListener("click", (e) =>
        {
            if (e.target === note)
            {
                toggle();
            }
        });
    }

    async start()
    {
        this.recreateCanvas();
        const savedShader = this.editor.getSavedShader();
        await this.editor.loadShader(savedShader || { folder: "basics", name: "hello_world" });
    }
}

const app = new ShaderApp();
app.start().catch((error) =>
{
    app.editor.setStatus(`Init error: ${error.message}`, true);
});
