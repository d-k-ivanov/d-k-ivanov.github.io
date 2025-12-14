"use strict";

import { GLSLHighlighter } from "./glsl-highlighter.js";

// Shader collection registry - add new shaders here
const SHADER_COLLECTION = [
    { folder: "basics", name: "hello_world", vertex: true, fragment: true },

    // Miscellaneous Examples from other authors
    { folder: "misc", name: "bµg_moonlight_shadertoy", vertex: true, fragment: true },
    { folder: "misc", name: "bµg_moonlight", vertex: true, fragment: true },
    { folder: "misc", name: "curena_alhambra", vertex: true, fragment: true },
    { folder: "misc", name: "curena_p6mm", vertex: true, fragment: true },
    { folder: "misc", name: "iq_primitives", vertex: true, fragment: true },

    // Shader Art Examples
    { folder: "tutorials", name: "kishimisu_introduction_01", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_02", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_03", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_04", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_05", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_06", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_07", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_08", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_09", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_10", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_11", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_12", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_13", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_14", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_15", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_16", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_17", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_18", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_19", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_20", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_21", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_22", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_23", vertex: false, fragment: true },
    { folder: "tutorials", name: "kishimisu_introduction_24", vertex: false, fragment: true },

    // Signed Distance Field (SDF) Examples
    { folder: "sdf", name: "2d_distances", vertex: true, fragment: true },
    // { folder: "sdf", name: "3d_distances" }
];

const COLLECTION_BASE_PATH = "/shaders/collection";
const SHARED_BASE_PATH = "/shaders/collection/shared";
const STORAGE_KEY = "shaders-selected-shader";

export class ShaderEditor
{
    constructor(renderer)
    {
        this.renderer = renderer;
        this.highlighter = new GLSLHighlighter();
        this.currentShader = null;
        this.originalVertSource = "";
        this.originalFragSource = "";
        this.activeTab = null;
        this.compileTimeout = null;
        this.compileDelay = 500; // ms delay before recompiling

        this.elements = {
            fileTree: document.getElementById("file-tree"),
            tabBar: document.getElementById("tab-bar"),
            editorContent: document.getElementById("editor-content"),
            editorEmpty: document.getElementById("editor-empty"),
            editorVert: document.getElementById("editor-vert"),
            editorFrag: document.getElementById("editor-frag"),
            vertSource: document.getElementById("vert-source"),
            fragSource: document.getElementById("frag-source"),
            vertHighlight: document.getElementById("vert-highlight"),
            fragHighlight: document.getElementById("frag-highlight"),
            statusBar: document.getElementById("status-bar"),
            statusMessage: document.getElementById("status-message"),
            statusShader: document.getElementById("status-shader")
        };

        this.init();
    }

    init()
    {
        // Block browser extensions from interfering with shader code
        this.elements.vertSource.setAttribute("data-gramm", "false");
        this.elements.vertSource.setAttribute("data-lt-active", "false");
        this.elements.vertSource.spellcheck = false;
        this.elements.vertSource.autocomplete = "off";

        this.elements.fragSource.setAttribute("data-gramm", "false");
        this.elements.fragSource.setAttribute("data-lt-active", "false");
        this.elements.fragSource.spellcheck = false;
        this.elements.fragSource.autocomplete = "off";

        this.buildFileTree();
        this.setupEditorEvents();
        this.setupScrollSync();
    }

    setupScrollSync()
    {
        // Sync scroll between textarea and highlight overlay
        this.elements.vertSource.addEventListener("scroll", () =>
        {
            this.elements.vertHighlight.scrollTop = this.elements.vertSource.scrollTop;
            this.elements.vertHighlight.scrollLeft = this.elements.vertSource.scrollLeft;
        });

        this.elements.fragSource.addEventListener("scroll", () =>
        {
            this.elements.fragHighlight.scrollTop = this.elements.fragSource.scrollTop;
            this.elements.fragHighlight.scrollLeft = this.elements.fragSource.scrollLeft;
        });
    }

    updateHighlight(type)
    {
        const textarea = type === "vert" ? this.elements.vertSource : this.elements.fragSource;
        const highlight = type === "vert" ? this.elements.vertHighlight : this.elements.fragHighlight;
        const code = textarea.value;

        // Add extra newline to ensure highlight matches textarea height
        highlight.innerHTML = this.highlighter.highlight(code) + "\n";
    }

    buildFileTree()
    {
        const tree = this.elements.fileTree;
        tree.innerHTML = "";

        // Group shaders by folder
        const folders = new Map();
        for (const shader of SHADER_COLLECTION)
        {
            if (!folders.has(shader.folder))
            {
                folders.set(shader.folder, []);
            }
            folders.get(shader.folder).push(shader);
        }

        // Build tree structure
        for (const [folderName, shaders] of folders)
        {
            const folderEl = document.createElement("div");
            folderEl.className = "shaders-tree-folder collapsed";
            folderEl.innerHTML = `
                <div class="shaders-tree-folder-header">
                    <span class="shaders-tree-folder-icon">▼</span>
                    <span>${folderName}</span>
                </div>
                <div class="shaders-tree-folder-items"></div>
            `;

            const itemsContainer = folderEl.querySelector(".shaders-tree-folder-items");
            const folderHeader = folderEl.querySelector(".shaders-tree-folder-header");

            // Toggle folder
            folderHeader.addEventListener("click", () =>
            {
                folderEl.classList.toggle("collapsed");
            });

            // Add shader items
            for (const shader of shaders)
            {
                const itemEl = document.createElement("div");
                itemEl.className = "shaders-tree-item";
                itemEl.dataset.folder = shader.folder;
                itemEl.dataset.name = shader.name;
                itemEl.innerHTML = `
                    <span class="shaders-tree-item-icon">✦</span>
                    <span>${shader.name}</span>
                `;

                itemEl.addEventListener("click", () => this.loadShader(shader));
                itemsContainer.appendChild(itemEl);
            }

            tree.appendChild(folderEl);
        }
    }

    async loadShader(shader)
    {
        const basePath = `${COLLECTION_BASE_PATH}/${shader.folder}/${shader.name}`;

        try
        {
            this.setStatus("Loading shader...", false);

            const [vertSrc, fragSrc] = await Promise.all([
                this.fetchShaderSource(shader.vertex ? `${basePath}.vert` : `${SHARED_BASE_PATH}/default.vert`),
                this.fetchShaderSource(`${basePath}.frag`)
            ]);

            this.currentShader = shader;
            this.originalVertSource = vertSrc;
            this.originalFragSource = fragSrc;

            // Save selection to localStorage
            this.saveShaderSelection(shader);

            // Update editors
            this.elements.vertSource.value = vertSrc;
            this.elements.fragSource.value = fragSrc;

            // Update syntax highlighting
            this.updateHighlight("vert");
            this.updateHighlight("frag");

            // Update UI
            this.updateFileTreeSelection(shader);
            this.updateTabs(shader);
            this.showTab("frag");

            // Compile and render
            await this.recompileShader();

            this.setStatus("Ready", false);
            this.elements.statusShader.textContent = `${shader.folder}/${shader.name}`;
        }
        catch (error)
        {
            this.setStatus(`Error: ${error.message}`, true);
            console.error("Failed to load shader:", error);
        }
    }

    async fetchShaderSource(url)
    {
        const response = await fetch(url);
        if (!response.ok)
        {
            throw new Error(`Failed to load: ${url}`);
        }
        return response.text();
    }

    saveShaderSelection(shader)
    {
        try
        {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(shader));
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    getSavedShader()
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved)
            {
                const shader = JSON.parse(saved);
                // Validate that the shader exists in the collection
                const exists = SHADER_COLLECTION.some(
                    s => s.folder === shader.folder && s.name === shader.name
                );
                if (exists)
                {
                    return shader;
                }
            }
        }
        catch (e)
        {
            // Ignore storage errors
        }
        return null;
    }

    clearSavedShader()
    {
        try
        {
            localStorage.removeItem(STORAGE_KEY);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    updateFileTreeSelection(shader)
    {
        // Remove previous selection
        const prevActive = this.elements.fileTree.querySelector(".shaders-tree-item.active");
        if (prevActive)
        {
            prevActive.classList.remove("active");
        }

        // Set new selection and expand parent folder
        const items = this.elements.fileTree.querySelectorAll(".shaders-tree-item");
        for (const item of items)
        {
            if (item.dataset.folder === shader.folder && item.dataset.name === shader.name)
            {
                item.classList.add("active");

                // Expand the parent folder
                const parentFolder = item.closest(".shaders-tree-folder");
                if (parentFolder)
                {
                    parentFolder.classList.remove("collapsed");
                }

                // Scroll item into view
                item.scrollIntoView({ block: "nearest", behavior: "smooth" });
                break;
            }
        }
    }

    updateTabs(shader)
    {
        this.elements.tabBar.innerHTML = `
            <div class="shaders-tab active" data-tab="vert">
                <span class="shaders-tab-icon vert">▣</span>
                <span class="shaders-tab-label">${shader.name}.vert</span>
                <span class="shaders-tab-modified"></span>
            </div>
            <div class="shaders-tab" data-tab="frag">
                <span class="shaders-tab-icon frag">▣</span>
                <span class="shaders-tab-label">${shader.name}.frag</span>
                <span class="shaders-tab-modified"></span>
            </div>
        `;

        // Add tab click handlers
        const tabs = this.elements.tabBar.querySelectorAll(".shaders-tab");
        for (const tab of tabs)
        {
            tab.addEventListener("click", () => this.showTab(tab.dataset.tab));
        }
    }

    showTab(tabName)
    {
        this.activeTab = tabName;

        // Hide empty state
        this.elements.editorEmpty.style.display = "none";

        // Update tab active state
        const tabs = this.elements.tabBar.querySelectorAll(".shaders-tab");
        for (const tab of tabs)
        {
            tab.classList.toggle("active", tab.dataset.tab === tabName);
        }

        // Show/hide editor panes
        this.elements.editorVert.classList.toggle("active", tabName === "vert");
        this.elements.editorFrag.classList.toggle("active", tabName === "frag");
    }

    setupEditorEvents()
    {
        // Vertex shader editing
        this.elements.vertSource.addEventListener("input", () =>
        {
            this.updateHighlight("vert");
            this.markTabModified("vert", this.elements.vertSource.value !== this.originalVertSource);
            this.scheduleRecompile();
        });

        // Fragment shader editing
        this.elements.fragSource.addEventListener("input", () =>
        {
            this.updateHighlight("frag");
            this.markTabModified("frag", this.elements.fragSource.value !== this.originalFragSource);
            this.scheduleRecompile();
        });

        // Tab key support for textareas
        this.elements.vertSource.addEventListener("keydown", (e) => this.handleTabKey(e));
        this.elements.fragSource.addEventListener("keydown", (e) => this.handleTabKey(e));
    }

    handleTabKey(e)
    {
        if (e.key === "Tab")
        {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;

            // Check if there is a selection (multiline or partial line)
            if (start !== end)
            {
                // Get selected text
                const before = value.substring(0, start);
                const selected = value.substring(start, end);
                const after = value.substring(end);

                // Split selection into lines
                const lines = selected.split('\n');
                // Insert 4 spaces at the start of each line
                const indented = lines.map(line => "    " + line).join('\n');

                // Replace selection with indented text
                textarea.value = before + indented + after;

                // Calculate new selection range
                // Start stays the same, end increases by 4 chars per line
                const lineCount = lines.length;
                textarea.selectionStart = start;
                textarea.selectionEnd = end + (4 * lineCount);

                // Trigger input event for recompile
                textarea.dispatchEvent(new Event("input"));
            } else
            {
                // No selection, insert 4 spaces at cursor
                textarea.value = value.substring(0, start) + "    " + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;

                // Trigger input event for recompile
                textarea.dispatchEvent(new Event("input"));
            }
        }
    }

    markTabModified(tabName, isModified)
    {
        const tab = this.elements.tabBar.querySelector(`.shaders-tab[data-tab="${tabName}"]`);
        if (tab)
        {
            tab.classList.toggle("modified", isModified);
        }
    }

    scheduleRecompile()
    {
        if (this.compileTimeout)
        {
            clearTimeout(this.compileTimeout);
        }

        this.compileTimeout = setTimeout(() =>
        {
            this.recompileShader();
        }, this.compileDelay);
    }

    async recompileShader()
    {
        if (!this.currentShader)
        {
            return;
        }

        const vertSrc = this.elements.vertSource.value;
        const fragSrc = this.elements.fragSource.value;

        try
        {
            this.setStatus("Compiling...", false);
            await this.renderer.updateShaders(vertSrc, fragSrc);
            this.setStatus("Compiled successfully", false);
        }
        catch (error)
        {
            this.setStatus(`Compile error: ${error.message}`, true);
            console.error("Shader compile error:", error);
        }
    }

    setStatus(message, isError)
    {
        this.elements.statusMessage.textContent = message;
        this.elements.statusBar.classList.toggle("error", isError);
    }

    getVertexSource()
    {
        return this.elements.vertSource.value;
    }

    getFragmentSource()
    {
        return this.elements.fragSource.value;
    }
}
