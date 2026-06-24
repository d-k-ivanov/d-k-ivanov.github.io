"use strict";

import { CanvasControls } from "../ui/CanvasControls.js";
import { PanelResizer } from "../ui/PanelResizer.js";
import { ShaderEditor } from "../editor/ShaderEditor.js";
import { ShaderRenderer } from "../rendering/ShaderRenderer.js";
import { ThemeManager } from "../ui/ThemeManager.js";
import { ModelLoader } from "../models/ModelLoader.js";
import { SHADER_UI_TEMPLATE } from "./ShaderLayout.js";

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
        this.renderer.resetMouseState();
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
            this.renderer.resetMouseState();
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
