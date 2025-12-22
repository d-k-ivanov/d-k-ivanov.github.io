"use strict";

import { ModelCollection } from "../models/ModelCollection.js";

/**
 * Manages canvas resolution selection, fullscreen toggling,
 * and model selection/loading interactions.
 *
 * This class owns the toolbar widgets in the canvas panel and forwards
 * changes via callbacks so the app can update render state without
 * tightly coupling UI and rendering logic.
 *
 * @example
 * const controls = new CanvasControls(canvas, {
 *   onResolutionChange: () => renderer.handleResize(),
 *   onModelChange: (model) => app.handleModelSelected(model)
 * });
 */
export class CanvasControls
{
    /**
     * @param {HTMLCanvasElement} canvas - Target canvas for resolution and fullscreen actions.
     * @param {{onResolutionChange?: Function, onModelChange?: Function, onModelLoad?: Function}} param1
     * Callback hooks for toolbar actions.
     * @param {Function} param1.onResolutionChange - Called after a resolution change.
     * @param {Function} param1.onModelChange - Called when the model dropdown changes.
     * @param {Function} param1.onModelLoad - Called when a URL or file is provided.
     */
    constructor(canvas, { onResolutionChange = null, onModelChange = null, onModelLoad = null } = {})
    {
        this.canvas = canvas;
        this.savedResolution = null;
        this.onResolutionChange = onResolutionChange;
        this.onModelChange = onModelChange;
        this.onModelLoad = onModelLoad;
        this.currentResolutionValue = null;
        this.currentModelId = "";
        this.boundResolutionHandler = null;
        this.boundModelHandler = null;
        this.boundModelLoadHandler = null;
        this.boundModelFileHandler = null;

        this.elements = {
            resolutionSelect: document.getElementById("resolution-select"),
            fullscreenBtn: document.getElementById("fullscreen-toggle"),
            modelSelect: document.getElementById("model-select"),
            modelLoadBtn: document.getElementById("model-load-btn"),
            modelFileInput: document.getElementById("model-file-input")
        };

        this.initResolutionSelector();
        this.initFullscreenToggle();
        this.initModelSelector();
        this.initModelLoader();
    }

    /**
     * Sets up the resolution dropdown and applies initial resolution.
     *
     * The current selection is applied immediately so the renderer
     * starts with the expected resolution.
     *
     * @returns {void}
     */
    initResolutionSelector()
    {
        const selector = this.elements.resolutionSelect;
        if (!selector) return;

        if (this.boundResolutionHandler)
        {
            selector.removeEventListener("change", this.boundResolutionHandler);
        }

        const applyResolution = () =>
        {
            const [width, height] = selector.value.split("x").map(Number);
            this.currentResolutionValue = selector.value;
            this.canvas.width = width;
            this.canvas.height = height;
            if (this.onResolutionChange)
            {
                this.onResolutionChange(width, height);
            }
        };

        selector.addEventListener("change", applyResolution);
        this.boundResolutionHandler = applyResolution;
        applyResolution();
    }

    /**
     * Configures fullscreen toggle button and resolution handling.
     *
     * When entering fullscreen, the canvas is resized to match the screen
     * and restored when exiting to the previous resolution.
     *
     * @returns {void}
     */
    initFullscreenToggle()
    {
        const btn = this.elements.fullscreenBtn;
        if (!btn) return;

        const updateIcon = () =>
        {
            const isFullscreen = !!document.fullscreenElement;
            btn.textContent = isFullscreen ? "⛶" : "⛶";
            btn.title = isFullscreen ? "Exit fullscreen" : "Toggle fullscreen";

            if (isFullscreen)
            {
                // Save current resolution and apply screen resolution
                this.savedResolution = { width: this.canvas.width, height: this.canvas.height };
                this.canvas.width = screen.width * window.devicePixelRatio;
                this.canvas.height = screen.height * window.devicePixelRatio;
            }
            else if (this.savedResolution)
            {
                // Restore previous resolution
                this.canvas.width = this.savedResolution.width;
                this.canvas.height = this.savedResolution.height;
                this.savedResolution = null;
            }

            if (this.onResolutionChange)
            {
                this.onResolutionChange(this.canvas.width, this.canvas.height);
            }
        };

        btn.addEventListener("click", () =>
        {
            if (document.fullscreenElement)
            {
                document.exitFullscreen();
            }
            else
            {
                this.canvas.requestFullscreen();
            }
        });

        document.addEventListener("fullscreenchange", updateIcon);
    }

    /**
     * Sets up the model dropdown and sends selection changes.
     *
     * The dropdown is populated using {@link ModelCollection} and
     * the selection is forwarded through `onModelChange`.
     *
     * @returns {void}
     */
    initModelSelector()
    {
        const selector = this.elements.modelSelect;
        if (!selector)
        {
            return;
        }

        if (this.boundModelHandler)
        {
            selector.removeEventListener("change", this.boundModelHandler);
        }

        selector.innerHTML = "";

        const noneOption = document.createElement("option");
        noneOption.value = "";
        noneOption.textContent = "None";
        selector.appendChild(noneOption);

        for (const model of ModelCollection.ITEMS)
        {
            const option = document.createElement("option");
            option.value = model.id;
            option.textContent = ModelCollection.getDisplayName(model);
            selector.appendChild(option);
        }

        selector.value = this.currentModelId || "";

        const applyModel = () =>
        {
            this.currentModelId = selector.value;
            const model = ModelCollection.getById(this.currentModelId);
            if (this.onModelChange)
            {
                this.onModelChange(model);
            }
        };

        selector.addEventListener("change", applyModel);
        this.boundModelHandler = applyModel;
    }

    /**
     * Sets up the model load button and file input handlers.
     *
     * Users can provide a remote URL or pick a local file.
     * File selections are wrapped in an object URL so the loader
     * can treat them as a normal fetch.
     *
     * @returns {void}
     */
    initModelLoader()
    {
        const btn = this.elements.modelLoadBtn;
        const input = this.elements.modelFileInput;

        if (btn)
        {
            if (this.boundModelLoadHandler)
            {
                btn.removeEventListener("click", this.boundModelLoadHandler);
            }

            const handleClick = () =>
            {
                const message = "Enter model URL (OBJ/STL/PLY/DRC/VOX). Leave empty to choose a local file.";
                const url = window.prompt(message, "");
                if (url === null)
                {
                    return;
                }

                const trimmed = url.trim();
                if (trimmed)
                {
                    this.triggerModelLoad({ url: trimmed, name: this.getNameFromUrl(trimmed), revokeUrl: null });
                }
                else if (input)
                {
                    input.click();
                }
            };

            btn.addEventListener("click", handleClick);
            this.boundModelLoadHandler = handleClick;
        }

        if (input)
        {
            if (this.boundModelFileHandler)
            {
                input.removeEventListener("change", this.boundModelFileHandler);
            }

            const handleFile = () =>
            {
                const file = input.files && input.files[0];
                if (!file)
                {
                    return;
                }

                const objectUrl = URL.createObjectURL(file);
                const namedUrl = `${objectUrl}#${encodeURIComponent(file.name)}`;
                this.triggerModelLoad({ url: namedUrl, name: file.name, revokeUrl: objectUrl });
                input.value = "";
            };

            input.addEventListener("change", handleFile);
            this.boundModelFileHandler = handleFile;
        }
    }

    /**
     * Forwards a custom model source payload to the configured handler.
     *
     * @param {{url: string, name?: string, revokeUrl?: string}} source - Model source metadata.
     * @returns {void}
     * @example
     * controls.triggerModelLoad({ url: "https://example.com/mesh.obj", name: "mesh" });
     */
    triggerModelLoad(source)
    {
        if (this.onModelLoad)
        {
            this.onModelLoad(source);
        }
    }

    /**
     * Extracts a model name from a URL or hash-suffixed filename.
     *
     * @param {string} url - URL or object URL with optional `#filename`.
     * @returns {string|null} Base name without extension.
     */
    getNameFromUrl(url)
    {
        if (!url)
        {
            return null;
        }
        const trimmed = url.trim();
        const hashIndex = trimmed.lastIndexOf("#");
        if (hashIndex !== -1)
        {
            const hashPart = decodeURIComponent(trimmed.slice(hashIndex + 1));
            if (hashPart)
            {
                return hashPart.replace(/\.[^/.]+$/, "");
            }
        }
        const base = trimmed.split("?")[0];
        const file = base.split("/").pop();
        if (!file)
        {
            return null;
        }
        return file.replace(/\.[^/.]+$/, "");
    }

    /**
     * Updates the model selector and optionally notifies listeners.
     *
     * @param {string} modelId - Model id to select.
     * @param {{notify?: boolean}} options - Notification options.
     * @param {boolean} options.notify - Whether to trigger `onModelChange`.
     * @returns {void}
     */
    setModelSelection(modelId, { notify = true } = {})
    {
        this.currentModelId = modelId || "";
        const selector = this.elements.modelSelect;
        if (selector)
        {
            selector.value = this.currentModelId;
        }

        if (notify && this.onModelChange)
        {
            const model = ModelCollection.getById(this.currentModelId);
            this.onModelChange(model);
        }
    }

    /**
     * Rebinds controls to a new canvas element.
     *
     * This is required after the renderer recreates the canvas
     * to maintain correct sizing and fullscreen behavior.
     *
     * @param {HTMLCanvasElement} canvas - New canvas element.
     * @returns {void}
     */
    setCanvas(canvas)
    {
        this.canvas = canvas;
        if (this.currentResolutionValue)
        {
            const [width, height] = this.currentResolutionValue.split("x").map(Number);
            this.canvas.width = width;
            this.canvas.height = height;
            if (this.onResolutionChange)
            {
                this.onResolutionChange(width, height);
            }
        }
        else
        {
            this.initResolutionSelector();
        }
    }
}
