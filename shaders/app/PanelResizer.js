"use strict";

/**
 * Handles drag-to-resize behavior for canvas and tree panels.
 */
export class PanelResizer
{
    /**
     * Initializes resize state and attaches handlers.
     */
    constructor()
    {
        this.activeHandle = null;
        this.startX = 0;
        this.startY = 0;
        this.startSize = 0;

        this.init();
    }

    /**
     * Initializes resize handles.
     */
    init()
    {
        this.setupMainResize();
        this.setupTreeResize();
    }

    /**
     * Wires the main canvas/control panel splitter.
     */
    setupMainResize()
    {
        const handle = document.getElementById("resize-main");
        const canvasPanel = document.querySelector(".shaders-canvas-panel");
        const controlPanel = document.querySelector(".shaders-control-panel");

        if (!handle || !canvasPanel || !controlPanel) return;

        handle.addEventListener("mousedown", (e) =>
        {
            e.preventDefault();
            this.activeHandle = "main";
            this.startX = e.clientX;

            const container = canvasPanel.parentElement;
            const containerWidth = container.offsetWidth;
            this.startSize = canvasPanel.offsetWidth;
            this.containerSize = containerWidth;

            document.body.classList.add("shaders-resizing");
            handle.classList.add("dragging");

            const onMouseMove = (e) =>
            {
                if (this.activeHandle !== "main") return;

                const delta = e.clientX - this.startX;
                const newSize = this.startSize + delta;

                // Enforce min/max constraints (20% - 80% of container)
                const minSize = this.containerSize * 0.2;
                const maxSize = this.containerSize * 0.8;
                const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));

                // Use flex-basis for sizing
                canvasPanel.style.flex = "none";
                canvasPanel.style.width = `${clampedSize}px`;
                controlPanel.style.flex = "1";
            };

            const onMouseUp = () =>
            {
                this.activeHandle = null;
                document.body.classList.remove("shaders-resizing");
                handle.classList.remove("dragging");
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    /**
     * Wires the shader tree/editor area splitter.
     */
    setupTreeResize()
    {
        const handle = document.getElementById("resize-tree");
        const treePanel = document.getElementById("file-tree-panel");
        const editorArea = document.querySelector(".shaders-editor-area");

        if (!handle || !treePanel || !editorArea) return;

        handle.addEventListener("mousedown", (e) =>
        {
            e.preventDefault();
            this.activeHandle = "tree";
            this.startX = e.clientX;
            this.startSize = treePanel.offsetWidth;

            document.body.classList.add("shaders-resizing");
            handle.classList.add("dragging");

            const onMouseMove = (e) =>
            {
                if (this.activeHandle !== "tree") return;

                const delta = e.clientX - this.startX;
                const newSize = this.startSize + delta;

                // Enforce min/max constraints (100px - 400px)
                const minSize = 100;
                const maxSize = 400;
                const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));

                treePanel.style.width = `${clampedSize}px`;
            };

            const onMouseUp = () =>
            {
                this.activeHandle = null;
                document.body.classList.remove("shaders-resizing");
                handle.classList.remove("dragging");
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }
}
