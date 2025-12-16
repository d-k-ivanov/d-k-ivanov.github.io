"use strict";

import { CanvasControls } from "./CanvasControls.js";
import { PanelResizer } from "./PanelResizer.js";
import { ShaderEditor } from "./ShaderEditor.js";
import { ShaderRenderer } from "./ShaderRenderer.js";
import { ThemeManager } from "./ThemeManager.js";

/**
 * Static HTML scaffold for the editor layout. Injected on startup.
 */
const SHADER_UI_TEMPLATE = `
<div class="shaders-main-container">
    <div class="shaders-canvas-panel theme-dark" id="canvas-panel">
        <div class="shaders-canvas-toolbar">
            <div class="shaders-toolbar-group">
                <label for="resolution-select">Resolution:</label>
                <select id="resolution-select">
                    <option value="64x64">64×64</option>
                    <option value="128x128">128×128</option>
                    <option value="160x120">160×120 (QQVGA)</option>
                    <option value="256x256">256×256</option>
                    <option value="320x200">320×200 (CGA)</option>
                    <option value="320x240">320×240 (QVGA)</option>
                    <option value="400x300">400×300</option>
                    <option value="480x320">480×320 (HVGA)</option>
                    <option value="512x512" selected>512×512</option>
                    <option value="576x384">576×384 (PAL)</option>
                    <option value="640x480">640×480 (VGA)</option>
                    <option value="800x600">800×600 (SVGA)</option>
                    <option value="960x600">960×600 (WSVGA)</option>
                    <option value="1024x768">1024×768 (XGA)</option>
                    <option value="1024x1024">1024×1024</option>
                    <option value="1280x720">1280×720 (HD)</option>
                    <option value="1280x800">1280×800 (WXGA)</option>
                    <option value="1920x1080">1920×1080 (Full HD)</option>
                    <option value="1920x1280">1920×1280 (UXGA)</option>
                    <option value="2048x2048">2048×2048</option>
                    <option value="2560x1440">2560×1440 (QHD)</option>
                    <option value="2560x1600">2560×1600 (WQXGA)</option>
                    <option value="3840x2160">3840×2160 (4K UHD)</option>
                    <option value="3840x2400">3840×2400 (WQUXGA)</option>
                    <option value="4096x4096">4096×4096</option>
                </select>
            </div>
            <button class="shaders-toolbar-btn" id="fullscreen-toggle" title="Toggle fullscreen">⛶</button>
            <button class="shaders-theme-toggle" id="canvas-theme-toggle" title="Toggle theme">☀</button>
        </div>
        <div class="shaders-canvas-wrapper">
            <canvas id="canvas"></canvas>
        </div>
    </div>
    <div class="shaders-resize-handle shaders-resize-handle-h" id="resize-main"></div>
    <div class="shaders-control-panel theme-light" id="control-panel">
        <div class="shaders-file-tree" id="file-tree-panel">
            <div class="shaders-file-tree-header">
                <span>Shaders</span>
                <button class="shaders-theme-toggle" id="control-theme-toggle" title="Toggle theme">☾</button>
            </div>
            <div class="shaders-file-tree-content" id="file-tree">
                <!-- File tree items will be populated by JS -->
            </div>
            <div class="shaders-note">
                <div class="shaders-note-title">Inputs:</div>
                <p>
                        vec3 iResolution<br>
                        float iTime<br>
                        float iTimeDelta<br>
                        int iFrame<br>
                        float iFrameRate<br>
                        vec4 iMouse<br>
                        sampler{2D,Cube} iChannel0<br>
                        sampler{2D,Cube} iChannel1<br>
                        sampler{2D,Cube} iChannel2<br>
                        sampler{2D,Cube} iChannel3<br>
                </p>
            </div>
        </div>
        <div class="shaders-resize-handle shaders-resize-handle-h" id="resize-tree"></div>
        <div class="shaders-editor-area">
            <div class="shaders-tab-bar" id="tab-bar">
                <!-- Tabs will be populated by JS -->
            </div>
            <div class="shaders-editor-content" id="editor-content">
                <div class="shaders-editor-empty" id="editor-empty">
                    Select a shader from the file tree
                </div>
                <div class="shaders-editor-panes" id="editor-panes"></div>
            </div>
            <div class="shaders-status-bar" id="status-bar">
                <div class="shaders-status-left">
                    <span id="status-message">Ready</span>
                </div>
                <div class="shaders-status-right">
                    <span id="status-shader">No shader loaded</span>
                </div>
            </div>
        </div>
    </div>
</div>
`;

/**
 * High-level coordinator that wires UI, editor, renderer, and controls together.
 */
export class ShaderApp
{
    constructor()
    {
        this.linkStyles();
        this.createUI();

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

    /**
     * Ensures the shader stylesheet is loaded once.
     */
    linkStyles()
    {
        if (document.querySelector('link[href="./shaders.css"]'))
        {
            return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./shaders.css";
        document.head.appendChild(link);
    }

    /**
     * Injects the shader editor DOM structure if it does not already exist.
     */
    createUI()
    {
        if (document.querySelector(".shaders-main-container"))
        {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = SHADER_UI_TEMPLATE.trim();

        const root = wrapper.firstElementChild;
        const host = document.querySelector("main") || document.body;
        host.appendChild(root);
    }

    /**
     * Re-connects canvas-aware helpers when the renderer recreates the canvas.
     */
    handleCanvasChanged(newCanvas)
    {
        this.canvas = newCanvas;
        if (this.canvasControls)
        {
            this.canvasControls.setCanvas(newCanvas);
        }
    }

    /**
     * Asks the renderer to recreate the canvas (useful when switching contexts).
     */
    recreateCanvas()
    {
        const newCanvas = this.renderer.recreateCanvas();
        if (newCanvas && this.canvasControls)
        {
            this.canvasControls.setCanvas(newCanvas);
        }
        return newCanvas;
    }

    /**
     * Binds application-wide hotkeys (reset and reload).
     */
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

    /**
     * Makes the input note collapsible for quick reference.
     */
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

    /**
     * Entry point after construction: sync canvas, restore or load default shader.
     */
    async start()
    {
        this.recreateCanvas();
        const savedShader = this.editor.getSavedShader();
        await this.editor.loadShader(savedShader || { folder: "basics", name: "hello_world" });
    }
}
