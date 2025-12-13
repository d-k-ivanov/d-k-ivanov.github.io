"use strict";

export class CanvasControls
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.savedResolution = null;

        this.elements = {
            resolutionSelect: document.getElementById("resolution-select"),
            fullscreenBtn: document.getElementById("fullscreen-toggle")
        };

        this.initResolutionSelector();
        this.initFullscreenToggle();
    }

    initResolutionSelector()
    {
        const selector = this.elements.resolutionSelect;
        if (!selector) return;

        const applyResolution = () =>
        {
            const [width, height] = selector.value.split("x").map(Number);
            this.canvas.width = width;
            this.canvas.height = height;
        };

        selector.addEventListener("change", applyResolution);
        applyResolution();
    }

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
}
