"use strict";

import { ModelCollection } from "./ModelCollection.js";

/**
 * Manages canvas resolution selection and fullscreen toggling.
 */
export class CanvasControls
{
    /**
     * @param {HTMLCanvasElement} canvas - target canvas.
     * @param {{onResolutionChange?: Function, onModelChange?: Function}} param1 - callbacks for toolbar controls.
     */
    constructor(canvas, { onResolutionChange = null, onModelChange = null } = {})
    {
        this.canvas = canvas;
        this.savedResolution = null;
        this.onResolutionChange = onResolutionChange;
        this.onModelChange = onModelChange;
        this.currentResolutionValue = null;
        this.currentModelId = "";
        this.boundResolutionHandler = null;
        this.boundModelHandler = null;

        this.elements = {
            resolutionSelect: document.getElementById("resolution-select"),
            fullscreenBtn: document.getElementById("fullscreen-toggle"),
            modelSelect: document.getElementById("model-select")
        };

        this.initResolutionSelector();
        this.initFullscreenToggle();
        this.initModelSelector();
    }

    /**
     * Sets up the resolution dropdown and applies initial resolution.
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
     * Updates the model selector and optionally notifies listeners.
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
