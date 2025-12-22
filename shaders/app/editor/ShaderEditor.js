"use strict";

import { GLSLHighlighter } from "./GLSLHighlighter.js";
import { ShaderCollection } from "./ShaderCollection.js";
import { ShaderRenderer } from "../rendering/ShaderRenderer.js";

const SHADER_TYPES = [
    { id: "vertex", label: "Vertex", extension: "vertex", icon: "vertex", context: null, placeholder: "Vertex shader source..." },
    { id: "fragment", label: "Fragment", extension: "fragment", icon: "fragment", context: null, placeholder: "Fragment shader source..." },
    { id: "compute", label: "Compute", extension: "compute", icon: "compute", context: ShaderRenderer.CONTEXTS.WEBGPU, placeholder: "Compute shader source..." }
];

const STORAGE_KEY = "shaders-selected-shader";
const STORAGE_KEY_MODEL = "shaders-selected-model";

/**
 * Manages shader source editing, tree navigation, tab handling, and compilation.
 *
 * The editor is responsible for loading shader sources from disk, presenting
 * them in textareas with syntax highlighting, and delegating compilation to
 * the rendering layer. It also persists the user's last selection.
 *
 * @example
 * const editor = new ShaderEditor(renderer);
 * await editor.loadShader({ folder: "basics", name: "hello_world" });
 */
export class ShaderEditor
{
    /**
     * @param {ShaderRenderer} renderer - Renderer facade that compiles sources.
     * @example
     * const editor = new ShaderEditor(renderer);
     */
    constructor(renderer)
    {
        this.renderer = renderer;
        this.highlighter = new GLSLHighlighter();

        this.currentShader = null;
        this.currentContext = ShaderRenderer.CONTEXTS.WEBGL2;
        this.sources = {};
        this.originalSources = {};
        this.activeTab = null;
        this.compileTimeout = null;
        this.compileDelay = 100;
        this.editors = new Map();
        this.loadToken = 0;
        this.highlightQueue = new Map();

        this.elements = {
            fileTree: document.getElementById("file-tree"),
            tabBar: document.getElementById("tab-bar"),
            editorContent: document.getElementById("editor-content"),
            editorEmpty: document.getElementById("editor-empty"),
            editorPanes: document.getElementById("editor-panes"),
            statusBar: document.getElementById("status-bar"),
            statusMessage: document.getElementById("status-message"),
            statusShader: document.getElementById("status-shader")
        };

        this.init();
    }

    /**
     * Initializes editor panes and builds the shader tree.
     *
     * This should be called once during construction to populate the UI.
     *
     * @returns {void}
     */
    init()
    {
        this.createEditorPanes();
        this.buildFileTree();
    }

    /**
     * Creates code panes and highlights for each shader stage.
     *
     * Each shader stage receives its own textarea and overlayed highlight
     * element. The method wires input handlers for syncing and formatting.
     *
     * @returns {void}
     */
    createEditorPanes()
    {
        const container = this.elements.editorPanes;
        if (!container)
        {
            return;
        }

        for (const type of SHADER_TYPES)
        {
            const pane = document.createElement("div");
            pane.className = "shaders-editor-pane";
            pane.dataset.type = type.id;

            const wrapper = document.createElement("div");
            wrapper.className = "shaders-editor-wrapper";

            const highlight = document.createElement("pre");
            highlight.className = "shaders-editor-highlight";
            highlight.id = `${type.id}-highlight`;

            const textarea = document.createElement("textarea");
            textarea.id = `${type.id}-source`;
            textarea.placeholder = type.placeholder;
            textarea.spellcheck = false;
            textarea.autocomplete = "off";
            textarea.setAttribute("data-gramm", "false");
            textarea.setAttribute("data-lt-active", "false");

            textarea.addEventListener("input", () => this.handleSourceInput(type.id));
            textarea.addEventListener("scroll", () =>
            {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
            });
            textarea.addEventListener("keydown", (e) => this.handleTabKey(e, textarea));

            wrapper.appendChild(highlight);
            wrapper.appendChild(textarea);
            pane.appendChild(wrapper);
            container.appendChild(pane);

            this.editors.set(type.id, {
                type,
                pane,
                textarea,
                highlight,
                tab: null
            });
        }
    }

    /**
     * Returns shader stages relevant to the current context config.
     *
     * @param {string} context - Optional context override.
     * @returns {Array<object>} Shader stage descriptors for the context.
     */
    getVisibleShaderTypes(context = this.currentContext)
    {
        return SHADER_TYPES.filter((type) => (!type.context || type.context === context));
    }

    /**
     * Populates the file tree UI from the shader collection.
     *
     * @returns {void}
     */
    buildFileTree()
    {
        const tree = this.elements.fileTree;
        if (!tree)
        {
            return;
        }

        tree.innerHTML = "";
        const folders = ShaderCollection.groupByFolder();
        for (const { folder, shaders } of folders)
        {
            tree.appendChild(this.createFolderElement(folder, shaders));
        }
    }

    /**
     * Builds a folder entry with its shader children.
     *
     * @param {string} folderName - Folder display name.
     * @param {Array<object>} shaders - Shader definitions in this folder.
     * @returns {HTMLElement} DOM element for the folder.
     */
    createFolderElement(folderName, shaders)
    {
        const folderEl = document.createElement("div");
        folderEl.className = "shaders-tree-folder collapsed";

        const header = document.createElement("div");
        header.className = "shaders-tree-folder-header";
        header.innerHTML = `
            <span class="shaders-tree-folder-icon">▼</span>
            <span>${folderName}</span>
        `;
        header.addEventListener("click", () =>
        {
            folderEl.classList.toggle("collapsed");
        });

        const itemsContainer = document.createElement("div");
        itemsContainer.className = "shaders-tree-folder-items";
        for (const shader of shaders)
        {
            itemsContainer.appendChild(this.createTreeItem(shader));
        }

        folderEl.appendChild(header);
        folderEl.appendChild(itemsContainer);
        return folderEl;
    }

    /**
     * Builds a clickable shader item for the tree.
     *
     * @param {object} shader - Shader definition from {@link ShaderCollection}.
     * @returns {HTMLElement} DOM element for the shader entry.
     */
    createTreeItem(shader)
    {
        const context = ShaderCollection.getContext(shader);
        const displayName = ShaderCollection.getDisplayName(shader);

        const itemEl = document.createElement("div");
        itemEl.className = "shaders-tree-item";
        itemEl.dataset.folder = shader.folder;
        itemEl.dataset.name = shader.name;
        itemEl.dataset.context = context;
        itemEl.innerHTML = `
            <span class="shaders-tree-item-icon">✦</span>
            <span class="shaders-tree-item-label">${displayName}</span>
        `;

        itemEl.addEventListener("click", () => this.loadShader(shader));
        return itemEl;
    }

    /**
     * Loads a shader definition, fetches sources, updates UI, and compiles.
     *
     * The load process switches the renderer context as needed, populates
     * editor panes with source content, updates the file tree selection,
     * and triggers compilation.
     *
     * @param {{folder: string, name: string}} shader - Shader descriptor.
     * @returns {Promise<void>} Resolves once the shader has been compiled.
     * @example
     * await editor.loadShader({ folder: "basics", name: "plotter" });
     */
    async loadShader(shader)
    {
        if (!shader)
        {
            return;
        }

        const token = ++this.loadToken;

        try
        {
            this.setStatus("Loading shader...", false);

            const context = ShaderCollection.getContext(shader);
            await this.renderer.setContext(context);
            this.currentContext = context;

            const { sources, originals } = await this.loadSourcesForShader(shader, context);
            if (token !== this.loadToken)
            {
                return;
            }

            this.currentShader = shader;
            this.sources = sources;
            this.originalSources = originals;
            this.saveShaderSelection(shader);

            this.populateEditors();
            this.updateFileTreeSelection(shader);
            this.updateTabs();
            this.showTab(this.resolveDefaultTab());

            await this.recompileShader();

            if (token === this.loadToken && this.elements.statusShader)
            {
                this.elements.statusShader.textContent = `${shader.folder}/${ShaderCollection.getDisplayName(shader)}`;
            }
            this.setStatus("Ready", false);
        }
        catch (error)
        {
            if (token !== this.loadToken)
            {
                return;
            }
            this.setStatus(`Error: ${error.message}`, true);
            console.error("Failed to load shader:", error);
        }
    }

    /**
     * Retrieves all stage sources for the given shader/context pair.
     *
     * @param {object} shader - Shader definition.
     * @param {string} context - Rendering context identifier.
     * @returns {Promise<{sources: object, originals: object}>} Loaded sources and originals.
     */
    async loadSourcesForShader(shader, context)
    {
        const visibleTypes = this.getVisibleShaderTypes(context);
        const sources = {};
        const originals = {};

        for (const type of SHADER_TYPES)
        {
            if (visibleTypes.find((t) => t.id === type.id))
            {
                const src = await this.loadSourceForType(shader, type, context);
                sources[type.id] = src;
                originals[type.id] = src;
            }
            else
            {
                sources[type.id] = "";
                originals[type.id] = "";
            }
        }

        return { sources, originals };
    }

    /**
     * Picks the best-matching source file for a specific shader stage.
     *
     * The method tries stage-specific filenames, then falls back to shared
     * defaults when optional sources are missing.
     *
     * @param {object} shader - Shader definition.
     * @param {object} type - Stage metadata from SHADER_TYPES.
     * @param {string} context - Rendering context identifier.
     * @returns {Promise<string>} Shader source text.
     */
    async loadSourceForType(shader, type, context)
    {
        if (type.context && type.context !== context)
        {
            return "";
        }

        const candidates = [];
        const added = new Map();
        const addCandidate = (url, optional) =>
        {
            if (!url)
            {
                return;
            }

            if (added.has(url))
            {
                if (added.get(url) === true && optional === false)
                {
                    const idx = candidates.findIndex(c => c.url === url);
                    if (idx !== -1)
                    {
                        candidates[idx].optional = false;
                    }
                    added.set(url, false);
                }
                return;
            }

            added.set(url, optional);
            candidates.push({ url, optional });
        };

        const baseName = ShaderCollection.getBaseName(shader);
        const basePath = `${ShaderCollection.BASE_PATH}/${shader.folder}/${baseName}`;
        const isWebGPU = context === ShaderRenderer.CONTEXTS.WEBGPU;

        if (type.id === "vertex")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.vertex.wgsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.vertex.wgsl`, /*optional*/ false);
            }
            else
            {
                addCandidate(`${basePath}.vertex.glsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.vertex.glsl`, /*optional*/ false);
            }
        }

        if (type.id === "fragment")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.fragment.wgsl`, /*optional*/ false);
            }
            else
            {
                addCandidate(`${basePath}.fragment.glsl`, /*optional*/ false);
            }
        }

        if (type.id === "compute")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.compute.wgsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.compute.wgsl`, /*optional*/ false);
            }
            else
            {
                return "";
            }
        }

        for (const candidate of candidates)
        {
            try
            {
                const content = await this.fetchShaderSource(candidate.url, candidate.optional);
                if (content)
                {
                    return content;
                }
            }
            catch (err)
            {
                if (candidate.optional)
                {
                    continue;
                }
                throw err;
            }
        }

        return "";
    }

    /**
     * Fetches shader text; returns empty string when optional and missing.
     *
     * @param {string} url - URL to fetch.
     * @param {boolean} optional - When true, missing files return empty string.
     * @returns {Promise<string>} Shader source or empty string.
     */
    async fetchShaderSource(url, optional = false)
    {
        try
        {
            const response = await fetch(url);
            if (!response.ok)
            {
                if (optional)
                {
                    return "";
                }
                throw new Error(`Failed to load: ${url}`);
            }
            return response.text();
        }
        catch (err)
        {
            if (optional)
            {
                return "";
            }
            throw err;
        }
    }

    /**
     * Persists the last selected shader to storage.
     *
     * @param {object} shader - Shader definition to store.
     * @returns {void}
     */
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

    /**
     * Persists the last selected model id to storage.
     *
     * @param {{id?: string}|null} model - Model metadata with id.
     * @returns {void}
     */
    saveModelSelection(model)
    {
        try
        {
            if (!model || !model.id)
            {
                localStorage.removeItem(STORAGE_KEY_MODEL);
                return;
            }
            localStorage.setItem(STORAGE_KEY_MODEL, model.id);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    /**
     * Restores the last saved shader if present in the collection.
     *
     * @returns {object|null} Saved shader definition or null.
     */
    getSavedShader()
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved)
            {
                const shader = JSON.parse(saved);
                if (ShaderCollection.isKnown(shader))
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

    /**
     * Restores the last saved model id if present.
     *
     * @returns {string|null} Saved model id or null.
     */
    getSavedModelId()
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY_MODEL);
            return saved || null;
        }
        catch (e)
        {
            // Ignore storage errors
        }
        return null;
    }

    /**
     * Clears any saved shader selection.
     *
     * @returns {void}
     */
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

    /**
     * Clears any saved model selection.
     *
     * @returns {void}
     */
    clearSavedModel()
    {
        try
        {
            localStorage.removeItem(STORAGE_KEY_MODEL);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    /**
     * Writes loaded sources into editors and syncs highlighting.
     *
     * @returns {void}
     */
    populateEditors()
    {
        for (const [id, editor] of this.editors)
        {
            editor.textarea.value = this.sources[id] || "";
            this.updateHighlight(id);
            this.markTabModified(id, false);
        }
    }

    /**
     * Highlights the active shader in the tree.
     *
     * @param {{folder: string, name: string}} shader - Shader definition.
     * @returns {void}
     */
    updateFileTreeSelection(shader)
    {
        const tree = this.elements.fileTree;
        if (!tree)
        {
            return;
        }

        const prevActive = tree.querySelector(".shaders-tree-item.active");
        if (prevActive)
        {
            prevActive.classList.remove("active");
        }

        const items = tree.querySelectorAll(".shaders-tree-item");
        for (const item of items)
        {
            if (item.dataset.folder === shader.folder && item.dataset.name === shader.name)
            {
                item.classList.add("active");

                const parentFolder = item.closest(".shaders-tree-folder");
                if (parentFolder)
                {
                    parentFolder.classList.remove("collapsed");
                }

                item.scrollIntoView({ block: "nearest", behavior: "smooth" });
                break;
            }
        }
    }

    /**
     * Builds tab buttons for visible shader stages.
     *
     * @returns {void}
     */
    updateTabs()
    {
        const tabBar = this.elements.tabBar;
        if (!tabBar)
        {
            return;
        }

        tabBar.innerHTML = "";

        const visibleTypes = this.getVisibleShaderTypes(this.currentContext);
        if (!visibleTypes.some(t => t.id === this.activeTab))
        {
            this.activeTab = this.resolveDefaultTab();
        }

        for (const type of visibleTypes)
        {
            const tab = document.createElement("div");
            tab.className = `shaders-tab${type.id === this.activeTab ? " active" : ""}`;
            tab.dataset.tab = type.id;
            tab.innerHTML = `
                <span class="shaders-tab-icon ${type.icon || ""}">▣</span>
                <span class="shaders-tab-label">${this.getTabLabel(type)}</span>
                <span class="shaders-tab-modified"></span>
            `;

            tab.addEventListener("click", () => this.showTab(type.id));
            tabBar.appendChild(tab);

            const editor = this.editors.get(type.id);
            if (editor)
            {
                editor.tab = tab;
            }
        }

        this.refreshPaneVisibility();
    }

    /**
     * Returns tab label for a shader stage.
     *
     * @param {{label: string}} type - Shader stage metadata.
     * @returns {string} Label to display in the tab bar.
     */
    getTabLabel(type)
    {
        return type.label;
    }

    /**
     * Synchronizes pane visibility and tab display with current filter.
     *
     * @returns {void}
     */
    refreshPaneVisibility()
    {
        const visibleTypes = this.getVisibleShaderTypes(this.currentContext).map(t => t.id);

        for (const [id, editor] of this.editors)
        {
            const shouldShow = visibleTypes.includes(id);
            if (shouldShow)
            {
                editor.pane.style.display = "";
                editor.pane.classList.toggle("active", id === this.activeTab);
            }
            else
            {
                editor.pane.classList.remove("active");
                editor.pane.style.display = "none";
            }

            if (editor.tab)
            {
                editor.tab.style.display = shouldShow ? "flex" : "none";
            }
        }
    }

    /**
     * Activates a tab and its corresponding editor pane.
     *
     * @param {string} tabName - Stage id to activate.
     * @returns {void}
     */
    showTab(tabName)
    {
        this.activeTab = tabName;
        if (this.elements.editorEmpty)
        {
            this.elements.editorEmpty.style.display = "none";
        }

        const tabs = this.elements.tabBar ? this.elements.tabBar.querySelectorAll(".shaders-tab") : [];
        for (const tab of tabs)
        {
            tab.classList.toggle("active", tab.dataset.tab === tabName);
        }

        for (const [id, editor] of this.editors)
        {
            const isActive = id === tabName && editor.pane.style.display !== "none";
            editor.pane.classList.toggle("active", isActive);
        }
    }

    /**
     * Handles user edits and schedules recompilation.
     *
     * @param {string} typeId - Shader stage id.
     * @returns {void}
     */
    handleSourceInput(typeId)
    {
        const editor = this.editors.get(typeId);
        if (!editor)
        {
            return;
        }

        this.sources[typeId] = editor.textarea.value;
        this.updateHighlight(typeId);
        this.markTabModified(typeId, this.sources[typeId] !== this.originalSources[typeId]);
        this.scheduleRecompile();
    }

    /**
     * Refreshes syntax highlighting for a given editor.
     *
     * @param {string} typeId - Shader stage id.
     * @returns {void}
     */
    updateHighlight(typeId)
    {
        const editor = this.editors.get(typeId);
        if (!editor)
        {
            return;
        }

        if (this.highlightQueue.has(typeId))
        {
            return;
        }

        const rafId = requestAnimationFrame(() =>
        {
            this.highlightQueue.delete(typeId);
            const code = editor.textarea.value;
            editor.highlight.innerHTML = `${this.highlighter.highlight(code)}\n`;
        });

        this.highlightQueue.set(typeId, rafId);
    }

    /**
     * Implements Tab-to-spaces behavior inside shader editors.
     *
     * @param {KeyboardEvent} e - Keydown event.
     * @param {HTMLTextAreaElement} textarea - Target editor textarea.
     * @returns {void}
     */
    handleTabKey(e, textarea)
    {
        if (e.key !== "Tab")
        {
            return;
        }

        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        if (start !== end)
        {
            const before = value.substring(0, start);
            const selected = value.substring(start, end);
            const after = value.substring(end);

            const lines = selected.split("\n");
            const indented = lines.map(line => "    " + line).join("\n");

            textarea.value = before + indented + after;

            const lineCount = lines.length;
            textarea.selectionStart = start;
            textarea.selectionEnd = end + (4 * lineCount);
        }
        else
        {
            textarea.value = value.substring(0, start) + "    " + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        }

        textarea.dispatchEvent(new Event("input"));
    }

    /**
     * Flags a tab as modified when its contents diverge from loaded sources.
     *
     * @param {string} tabName - Stage id.
     * @param {boolean} isModified - True when content diverges from original.
     * @returns {void}
     */
    markTabModified(tabName, isModified)
    {
        const editor = this.editors.get(tabName);
        const tab = editor ? editor.tab : null;
        if (tab)
        {
            tab.classList.toggle("modified", isModified);
        }
    }

    /**
     * Debounces shader recompilation calls.
     *
     * @returns {void}
     */
    scheduleRecompile()
    {
        if (this.compileTimeout)
        {
            clearTimeout(this.compileTimeout);
        }

        this.compileTimeout = setTimeout(() =>
        {
            this.compileTimeout = null;
            this.recompileShader();
        }, this.compileDelay);
    }

    /**
     * Gathers currently visible shader sources for compilation.
     *
     * @returns {object} Stage source map keyed by stage id.
     */
    collectSourcesForContext()
    {
        const visibleTypes = this.getVisibleShaderTypes();
        const result = {};
        for (const type of visibleTypes)
        {
            result[type.id] = this.sources[type.id] || "";
        }
        return result;
    }

    /**
     * Sends current sources to the renderer and updates status messages.
     *
     * @returns {Promise<void>} Resolves once compilation finishes.
     */
    async recompileShader()
    {
        if (!this.currentShader)
        {
            return;
        }

        try
        {
            this.setStatus("Compiling...", false);
            await this.renderer.updateShaders(this.collectSourcesForContext());
            this.setStatus("Compiled successfully", false);
        }
        catch (error)
        {
            this.setStatus(`Compile error: ${error.message}`, true);
            console.error("Shader compile error:", error);
        }
    }

    /**
     * Chooses the tab to show after loading a shader.
     *
     * @returns {string|null} Stage id to activate.
     */
    resolveDefaultTab()
    {
        const visible = this.getVisibleShaderTypes(this.currentContext);
        const preferred = visible.find(t => t.id === "fragment") || visible.find(t => t.id === "vertex");
        return preferred ? preferred.id : (visible[0] ? visible[0].id : null);
    }

    /**
     * Updates status bar text and error styling.
     *
     * @param {string} message - Message to display.
     * @param {boolean} isError - Whether to toggle error styling.
     * @returns {void}
     */
    setStatus(message, isError)
    {
        if (this.elements.statusMessage)
        {
            this.elements.statusMessage.textContent = message;
        }
        if (this.elements.statusBar)
        {
            this.elements.statusBar.classList.toggle("error", isError);
        }
    }

    /**
     * Indicates whether a shader is currently loaded.
     *
     * @returns {boolean} True when a shader is active.
     */
    hasShaderLoaded()
    {
        return !!this.currentShader;
    }
}
