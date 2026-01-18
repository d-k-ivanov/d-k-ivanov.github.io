"use strict";

import { CanvasControls } from "../ui/CanvasControls.js";
import { PanelResizer } from "../ui/PanelResizer.js";
import { ShaderEditor } from "../editor/ShaderEditor.js";
import { ShaderRenderer } from "../rendering/ShaderRenderer.js";
import { ThemeManager } from "../ui/ThemeManager.js";
import { ModelLoader } from "../models/ModelLoader.js";

/**
 * Static HTML scaffold for the editor layout.
 *
 * This template defines the main canvas panel, the file tree, editor panes,
 * and status bar used by the Shader Editor module. It is injected exactly
 * once when the app boots, allowing the JS layer to remain the source of
 * truth for UI wiring without relying on hardcoded HTML in the layout.
 */
const SHADER_UI_TEMPLATE = `
<div class="shaders-main-container">
    <div class="shaders-canvas-panel theme-dark" id="canvas-panel">
        <div class="shaders-canvas-toolbar">
            <div class="shaders-toolbar-group">
                <label for="resolution-select">Resolution:</label>
                <select id="resolution-select">
                    <option value="64x64">64×64 (1:1)</option>
                    <option value="128x128">128×128 (1:1)</option>
                    <option value="256x256">256×256 (1:1)</option>
                    <option value="512x512">512×512 (1:1)</option>
                    <option value="1024x1024">1024×1024 (1:1)</option>
                    <option value="2048x2048">2048×2048 (1:1)</option>
                    <option value="4096x4096">4096×4096 (1:1)</option>

                    <option value="320x200">320×200 (16:10)</option>
                    <option value="480x300">480×300 (16:10)</option>
                    <option value="640x400">640×400 (16:10)</option>
                    <option value="800x500">800×500 (16:10)</option>
                    <option value="960x600">960×600 (16:10)</option>
                    <option value="1024x640" selected>1024×640 (16:10)</option>
                    <option value="1280x800">1280×800 (16:10)</option>
                    <option value="1440x900">1440×900 (16:10)</option>
                    <option value="1680x1050">1680×1050 (16:10)</option>
                    <option value="1920x1200">1920×1200 (16:10)</option>
                    <option value="2560x1600">2560×1600 (16:10)</option>
                    <option value="3840x2400">3840×2400 (16:10)</option>
                    <option value="4096x2560">4096×2560 (16:10)</option>

                    <option value="320x180">320×180 (16:9)</option>
                    <option value="426x240">426×240 (16:9)</option>
                    <option value="480x270">480×270 (16:9)</option>
                    <option value="640x360">640×360 (16:9)</option>
                    <option value="854x480">854×480 (16:9)</option>
                    <option value="960x540">960×540 (16:9)</option>
                    <option value="1024x576">1024×576 (16:9)</option>
                    <option value="1280x720">1280×720 (16:9)</option>
                    <option value="1366x768">1366×768 (16:9)</option>
                    <option value="1600x900">1600×900 (16:9)</option>
                    <option value="1920x1080">1920×1080 (16:9)</option>
                    <option value="2560x1440">2560×1440 (16:9)</option>
                    <option value="3840x2160">3840×2160 (16:9)</option>
                    <option value="5120x2880">5120×2880 (16:9)</option>

                    <option value="160x120">160×120 (4:3)</option>
                    <option value="320x240">320×240 (4:3)</option>
                    <option value="400x300">400×300 (4:3)</option>
                    <option value="640x480">640×480 (4:3)</option>
                    <option value="800x600">800×600 (4:3)</option>
                    <option value="1024x768">1024×768 (4:3)</option>
                    <option value="1280x960">1280×960 (4:3)</option>
                    <option value="1400x1050">1400×1050 (4:3)</option>
                    <option value="1600x1200">1600×1200 (4:3)</option>
                    <option value="1920x1440">1920×1440 (4:3)</option>
                    <option value="2048x1536">2048×1536 (4:3)</option>
                    <option value="2560x1920">2560×1920 (4:3)</option>
                    <option value="3200x2400">3200×2400 (4:3)</option>
                    <option value="3840x2880">3840×2880 (4:3)</option>
                    <option value="4096x3072">4096×3072 (4:3)</option>
                </select>
                <button class="shaders-toolbar-btn" id="fullscreen-toggle" title="Toggle fullscreen">⛶</button>
                <button class="shaders-toolbar-btn shaders-toolbar-toggle" id="fullscreen-resolution-toggle" title="Fullscreen keeps resolution" aria-label="Fullscreen keeps resolution" aria-pressed="false">
                    <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
                </button>
            </div>
            <div class="shaders-toolbar-group">
                <label for="model-select">Model:</label>
                <select id="model-select">
                    <option value="" selected>None</option>
                </select>
            </div>
            <div class="shaders-toolbar-group">
                <button class="shaders-toolbar-action" id="model-load-btn" type="button" title="Load a model from URL or file">
                    Load Model…
                </button>
                <input class="shaders-file-input" id="model-file-input" type="file" accept=".obj,.stl,.ply,.drc,.vox">
            </div>
            <div class="shaders-toolbar-group shaders-sim-controls" id="simulation-controls">
                <button class="shaders-toolbar-action shaders-toolbar-icon" id="shader-compile" type="button" title="Compile shader" aria-label="Compile shader">
                    <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                </button>
                <button class="shaders-toolbar-action shaders-toolbar-icon" id="simulation-pause" type="button" title="Pause shader animation" aria-label="Pause shader animation">
                    <i class="fa-solid fa-pause" aria-hidden="true"></i>
                </button>
            </div>
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
            <div class="shaders-shortcuts">
                <div class="shaders-shortcuts-title">Shortcuts</div>
                <div class="shaders-shortcuts-list">
                    <div class="shaders-shortcut">
                        <span>Compile shader</span>
                        <span class="shaders-shortcut-keys">
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">S</span></span>
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">Shift</span>+<span class="shaders-shortcut-key">B</span></span>
                        </span>
                    </div>
                    <div class="shaders-shortcut">
                        <span>Play/Pause</span>
                        <span class="shaders-shortcut-keys"><span class="shaders-shortcut-key">Space</span></span>
                    </div>
                    <div class="shaders-shortcut">
                        <span>Reload app</span>
                        <span class="shaders-shortcut-keys">
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">F5</span></span>
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">Shift</span>+<span class="shaders-shortcut-key">R</span></span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="shaders-resize-handle shaders-resize-handle-h" id="resize-tree"></div>
        <div class="shaders-editor-area">
            <div class="shaders-tab-bar" id="tab-bar">
                <!-- Tabs will be populated by JS -->
            </div>
            <div class="shaders-note">
                <div class="shaders-note-title">Inputs:</div>
                <div class="shaders-note-body">
                    <div class="shaders-note-section">
                        <div class="shaders-note-section-title">GLSL</div>
                        <div class="shaders-note-grid">
                            <span class="shaders-note-key">vec3 iResolution</span>
                            <span class="shaders-note-desc">viewport resolution in pixels (z is pixel aspect, usually 1.0)</span>
                            <span class="shaders-note-key">float iTime</span>
                            <span class="shaders-note-desc">elapsed time in seconds since the shader started</span>
                            <span class="shaders-note-key">float iTimeDelta</span>
                            <span class="shaders-note-desc">time between the current and previous frame in seconds</span>
                            <span class="shaders-note-key">int iFrame</span>
                            <span class="shaders-note-desc">frame counter incremented every render pass</span>
                            <span class="shaders-note-key">float iFrameRate</span>
                            <span class="shaders-note-desc">estimated frames per second for the current run</span>
                            <span class="shaders-note-key">vec4 iMouseL</span>
                            <span class="shaders-note-desc">left button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseR</span>
                            <span class="shaders-note-desc">right button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseW</span>
                            <span class="shaders-note-desc">wheel button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseZoom</span>
                            <span class="shaders-note-desc">view center xy in world space, zoom scale z (1.0 = default), w reserved</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel0</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel1</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel2</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel3</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler2D uBackbuffer</span>
                            <span class="shaders-note-desc">previous frame color buffer for feedback effects</span>
                            <span class="shaders-note-key">float uHasModel</span>
                            <span class="shaders-note-desc">1.0 when a model is loaded, otherwise 0.0</span>
                            <span class="shaders-note-key">vec3 uModelCenter</span>
                            <span class="shaders-note-desc">center of the loaded model's bounding box</span>
                            <span class="shaders-note-key">float uModelScale</span>
                            <span class="shaders-note-desc">scale factor applied to fit the model into view</span>
                            <span class="shaders-note-key">vec3 uModelBoundsMin</span>
                            <span class="shaders-note-desc">minimum corner of the model bounding box</span>
                            <span class="shaders-note-key">vec3 uModelBoundsMax</span>
                            <span class="shaders-note-desc">maximum corner of the model bounding box</span>
                        </div>
                    </div>
                    <div class="shaders-note-section">
                        <div class="shaders-note-section-title">WebGPU bindings</div>
                        <div class="shaders-note-grid shaders-note-grid-compact">
                            <span class="shaders-note-key">00: Uniforms</span>
                            <span class="shaders-note-desc">uniform buffer (iResolution/iTime/iMouse/etc.) shared by all shaders</span>
                            <span class="shaders-note-key">01: storage in u32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage input u32 grid (ping-pong source for integer simulations)</span>
                            <span class="shaders-note-key">02: storage out u32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage output u32 grid (ping-pong destination for integer sims)</span>
                            <span class="shaders-note-key">03: storage in f32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage input f32 grid (ping-pong source for float simulations)</span>
                            <span class="shaders-note-key">04: storage out f32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage output f32 grid (ping-pong destination for float sims)</span>
                            <span class="shaders-note-key">10: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel0</span>
                            <span class="shaders-note-key">11: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel1</span>
                            <span class="shaders-note-key">12: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel2</span>
                            <span class="shaders-note-key">13: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel3</span>
                            <span class="shaders-note-key">14: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel0</span>
                            <span class="shaders-note-key">15: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel1</span>
                            <span class="shaders-note-key">16: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel2</span>
                            <span class="shaders-note-key">17: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel3</span>
                            <span class="shaders-note-key">20: storage vec4 positions</span>
                            <span class="shaders-note-desc">storage vec4 positions (model vertex positions in object space)</span>
                            <span class="shaders-note-key">21: storage vec4 normals</span>
                            <span class="shaders-note-desc">storage vec4 normals (model vertex normals)</span>
                            <span class="shaders-note-key">22: storage vec4 uvs</span>
                            <span class="shaders-note-desc">storage vec4 uvs (model texture coordinates)</span>
                            <span class="shaders-note-key">23: storage vec4 modelInfo</span>
                            <span class="shaders-note-desc">storage vec4 modelInfo (bounds, scale, and metadata)</span>
                        </div>
                    </div>
                </div>
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
 *
 * The app owns lifecycle orchestration (UI scaffold, theme state, model loading,
 * shader editing, and rendering context switches) while delegating the actual
 * rendering or parsing work to specialized classes.
 *
 * @example
 * const app = new ShaderApp();
 * await app.start();
 */
export class ShaderApp
{
    /**
     * Initializes the editor UI, renderer, and controls.
     *
     * This constructor performs DOM injection, builds the renderer/editor
     * wiring, and installs UI event handlers. Call {@link start} afterward
     * to restore state and load the default shader.
     */
    constructor()
    {
        this.linkStyles();
        this.createUI();

        this.canvas = document.getElementById("canvas");
        this.renderer = new ShaderRenderer(this.canvas);
        this.editor = new ShaderEditor(this.renderer);
        this.resizer = new PanelResizer();
        this.themeManager = new ThemeManager();
        this.modelLoader = new ModelLoader();
        this.modelLoadToken = 0;
        this.simulationPaused = false;

        this.canvasControls = new CanvasControls(this.canvas, {
            onResolutionChange: () => this.handleResolutionChange(),
            onModelChange: (model) => this.handleModelSelected(model),
            onModelLoad: (source) => this.handleCustomModelLoad(source),
            onShaderCompile: () => this.handleShaderCompile(),
            onSimulationPause: () => this.handleSimulationPause()
        });

        this.renderer.setCanvasChangeHandler((newCanvas) => this.handleCanvasChanged(newCanvas));

        this.editor.setShaderLoadedHandler(() => this.handleShaderLoaded());

        this.bindHotkeys();
        this.bindNoteToggle();
        this.bindShortcutsToggle();
    }

    /**
     * Handles canvas resolution changes by updating renderer dimensions.
     *
     * When the user changes the canvas resolution from the dropdown, this method
     * ensures that the renderer viewport is updated to reflect the new resolution.
     *
     * @returns {void}
     * @example
     * // Called automatically when resolution dropdown changes
     * this.handleResolutionChange();
     */
    handleResolutionChange()
    {
        // Update renderer viewport dimensions
        this.renderer.handleResize();

        if (this.editor && this.editor.hasShaderLoaded())
        {
            this.editor.recompileShader();
        }
    }

    /**
     * Handles shader selection changes for simulation controls.
     *
     * @returns {void}
     */
    handleShaderLoaded()
    {
        this.simulationPaused = false;
        this.renderer.clearFrameOverride();
        this.renderer.clearTimeOverride();
        this.canvasControls.setSimulationControlsVisible(true);
        this.canvasControls.setSimulationPaused(false);
    }

    /**
     * Recompiles the current shader sources on demand.
     *
     * @returns {void}
     */
    handleShaderCompile()
    {
        if (this.editor)
        {
            this.editor.recompileShader();
        }
    }

    /**
     * Pauses shader animation and counters.
     *
     * @returns {void}
     */
    handleSimulationPause()
    {
        this.setSimulationPaused(!this.simulationPaused);
    }

    /**
     * Toggles simulation pause state.
     *
     * @param {boolean} isPaused - True when paused.
     * @returns {void}
     */
    setSimulationPaused(isPaused)
    {
        this.simulationPaused = isPaused;

        if (isPaused)
        {
            const currentFrame = this.renderer.getFrameCount();
            const currentTime = this.renderer.getTimeSeconds();
            this.renderer.setFrameOverride(currentFrame);
            this.renderer.setTimeOverride(currentTime);
        }
        else
        {
            this.renderer.clearFrameOverride();
            this.renderer.clearTimeOverride();
        }

        this.canvasControls.setSimulationPaused(isPaused);
    }

    /**
     * Loads a selected model and forwards it to the renderer.
     *
     * The method is idempotent and tokenized to guard against stale async
     * resolutions when users select multiple models in quick succession.
     *
     * @param {object|null} model - Entry from {@link ModelCollection} or null to clear.
     * @returns {Promise<void>} Resolves once the model is loaded or cleared.
     * @example
     * await app.handleModelSelected(ModelCollection.getById("bunny_drc"));
     */
    async handleModelSelected(model)
    {
        const token = ++this.modelLoadToken;

        if (!model)
        {
            this.editor.clearSavedModel();
            this.renderer.setModel(null);
            return;
        }

        try
        {
            this.editor.saveModelSelection(model);
            const payload = await this.modelLoader.load(model);
            if (token !== this.modelLoadToken)
            {
                return;
            }
            this.renderer.setModel(payload);
        }
        catch (error)
        {
            if (token !== this.modelLoadToken)
            {
                return;
            }
            this.editor.setStatus(`Model error: ${error.message}`, true);
            console.error("Failed to load model:", error);
        }
    }

    /**
     * Loads a custom model from a URL or file selection.
     *
     * This is invoked by {@link CanvasControls} when the user provides a
     * URL or selects a local file. The model is loaded through the
     * {@link ModelLoader} and then sent to the renderer.
     *
     * @param {{url: string, name?: string, revokeUrl?: string}} source - Model source metadata.
     * @returns {Promise<void>} Resolves when the model is loaded or rejected.
     * @example
     * await app.handleCustomModelLoad({ url: "https://example.com/model.obj" });
     */
    async handleCustomModelLoad(source)
    {
        if (!source || !source.url)
        {
            return;
        }

        const token = ++this.modelLoadToken;
        const revokeUrl = source.revokeUrl;
        const url = source.url;
        const name = source.name || null;

        this.editor.clearSavedModel();
        if (this.canvasControls)
        {
            this.canvasControls.setModelSelection("", { notify: false });
        }

        try
        {
            const payload = await this.modelLoader.load({ url, name });
            if (token !== this.modelLoadToken)
            {
                return;
            }
            this.renderer.setModel(payload);
        }
        catch (error)
        {
            if (token !== this.modelLoadToken)
            {
                return;
            }
            this.editor.setStatus(`Model error: ${error.message}`, true);
            console.error("Failed to load custom model:", error);
        }
        finally
        {
            if (revokeUrl)
            {
                URL.revokeObjectURL(revokeUrl);
            }
        }
    }

    /**
     * Ensures the shader stylesheet is loaded once.
     *
     * The styles live in `shaders.css` and are injected dynamically to keep
     * the Jekyll layout minimal and avoid duplicate `<link>` tags.
     *
     * @returns {void}
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
     *
     * This keeps the shader UI encapsulated within the module while still
     * allowing the static markdown entrypoint to remain lightweight.
     *
     * @returns {void}
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
     *
     * WebGPU/WebGL switching can replace the underlying `<canvas>`; this
     * method updates any components that keep a canvas reference.
     *
     * @param {HTMLCanvasElement} newCanvas - The freshly created canvas.
     * @returns {void}
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
     *
     * @returns {HTMLCanvasElement|null} The new canvas or null if none exists.
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
     *
     * Supported shortcuts:
     * - Ctrl + S: Compile shader.
     * - Ctrl + Shift + B: Compile shader.
     * - Ctrl + F5: Clear shader state and reload.
     * - Ctrl + Shift + R: Clear shader state and reload.
     *
     * @returns {void}
     */
    bindHotkeys()
    {
        document.addEventListener("keydown", (e) =>
        {
            if (this.isCompileShortcut(e))
            {
                e.preventDefault();
                this.handleShaderCompile();
                return;
            }

            if (this.shouldIgnoreHotkeyEvent(e))
            {
                return;
            }

            if (this.isSpaceKey(e))
            {
                e.preventDefault();
                this.handleSimulationPause();
                return;
            }

            if ((e.key === "F5" && e.ctrlKey) || (e.key === "R" && e.ctrlKey && e.shiftKey))
            {
                e.preventDefault();
                this.editor.clearSavedShader();
                this.editor.clearSavedModel();
                this.themeManager.resetThemes();
                location.reload();
            }
        });
    }

    /**
     * Checks if the keyboard event triggers a shader compile shortcut.
     *
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean} True when a compile shortcut is pressed.
     */
    isCompileShortcut(event)
    {
        if (!event.ctrlKey || event.altKey)
        {
            return false;
        }

        const key = (event.key || "").toLowerCase();
        if (event.shiftKey)
        {
            return key === "b";
        }
        return key === "s";
    }

    /**
     * Checks if the hotkey should be ignored for input elements.
     *
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean} True when hotkey should be ignored.
     */
    shouldIgnoreHotkeyEvent(event)
    {
        const target = event.target;
        if (!(target instanceof HTMLElement))
        {
            return false;
        }

        const tagName = target.tagName;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT")
        {
            return true;
        }

        return target.isContentEditable;
    }

    /**
     * Checks if the keyboard event represents a space key press.
     *
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {boolean} True when space is pressed.
     */
    isSpaceKey(event)
    {
        return event.code === "Space" || event.key === " " || event.key === "Spacebar";
    }

    /**
     * Makes the input note collapsible for quick reference.
     *
     * @returns {void}
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
     * Makes the shortcuts panel collapsible.
     *
     * @returns {void}
     */
    bindShortcutsToggle()
    {
        const shortcuts = document.querySelector(".shaders-shortcuts");
        if (!shortcuts)
        {
            return;
        }

        shortcuts.classList.add("collapsed");

        const toggle = () => shortcuts.classList.toggle("collapsed");
        const title = shortcuts.querySelector(".shaders-shortcuts-title");
        if (title)
        {
            title.style.cursor = "pointer";
            title.addEventListener("click", (e) =>
            {
                e.stopPropagation();
                toggle();
            });
        }

        shortcuts.addEventListener("click", (e) =>
        {
            if (e.target === shortcuts)
            {
                toggle();
            }
        });
    }

    /**
     * Entry point after construction: sync canvas, restore or load default shader.
     *
     * This method restores persisted editor state, synchronizes the canvas
     * with the renderer, and loads the initial shader example.
     *
     * @returns {Promise<void>} Resolves once the initial shader is loaded.
     * @example
     * const app = new ShaderApp();
     * app.start();
     */
    async start()
    {
        this.recreateCanvas();
        const savedModelId = this.editor.getSavedModelId();
        if (savedModelId && this.canvasControls)
        {
            this.canvasControls.setModelSelection(savedModelId, { notify: true });
        }
        const savedShader = this.editor.getSavedShader();
        await this.editor.loadShader(savedShader || { folder: "basics", name: "hello_world" });
    }
}
