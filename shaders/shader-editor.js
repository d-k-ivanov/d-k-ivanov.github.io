"use strict";

import { GLSLHighlighter } from "./glsl-highlighter.js";

import
{
    COLLECTION_BASE_PATH,
    SHADER_COLLECTION,
    SHARED_BASE_PATH,
    getShaderBaseName,
    getShaderContext,
    getShaderDisplayName,
    getShaderLanguage,
    groupShadersByFolder,
    isKnownShader
} from "./shader-collection.js";

import { RENDER_CONTEXTS } from "./shader-renderer.js";

const SHADER_TYPES = [
    { id: "vertex", label: "Vertex", extension: "vertex", icon: "vertex", context: null, placeholder: "Vertex shader source..." },
    { id: "fragment", label: "Fragment", extension: "fragment", icon: "fragment", context: null, placeholder: "Fragment shader source..." },
    { id: "compute", label: "Compute", extension: "compute", icon: "compute", context: RENDER_CONTEXTS.WEBGPU, placeholder: "Compute shader source..." }
];

const STORAGE_KEY = "shaders-selected-shader";

export class ShaderEditor
{
    constructor(renderer)
    {
        this.renderer = renderer;
        this.highlighter = new GLSLHighlighter();

        this.currentShader = null;
        this.currentContext = RENDER_CONTEXTS.WEBGL2;
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

    init()
    {
        this.createEditorPanes();
        this.buildFileTree();
    }

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

    getVisibleShaderTypes(context = this.currentContext, shader = this.currentShader)
    {
        const wantsCompute = shader?.compute === true;
        return SHADER_TYPES.filter((type) =>
            (!type.context || type.context === context) &&
            (type.id !== "compute" || wantsCompute)
        );
    }

    buildFileTree()
    {
        const tree = this.elements.fileTree;
        if (!tree)
        {
            return;
        }

        tree.innerHTML = "";
        const folders = groupShadersByFolder(SHADER_COLLECTION);
        for (const { folder, shaders } of folders)
        {
            tree.appendChild(this.createFolderElement(folder, shaders));
        }
    }

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

    createTreeItem(shader)
    {
        const context = getShaderContext(shader);
        const displayName = getShaderDisplayName(shader);

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

            const context = getShaderContext(shader);
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
                this.elements.statusShader.textContent = `${shader.folder}/${getShaderDisplayName(shader)}`;
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

    async loadSourcesForShader(shader, context)
    {
        const visibleTypes = this.getVisibleShaderTypes(context, shader);
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

    async loadSourceForType(shader, type, context)
    {
        const language = getShaderLanguage(shader);
        const computeEnabled = language === "wgsl" && shader.compute === true;

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

        const baseName = getShaderBaseName(shader);
        const basePath = `${COLLECTION_BASE_PATH}/${shader.folder}/${baseName}`;
        const isWebGPU = context === RENDER_CONTEXTS.WEBGPU;

        if (type.id === "compute")
        {
            if (isWebGPU && computeEnabled)
            {
                addCandidate(`${basePath}.compute.wgsl`, true);
                addCandidate(`${SHARED_BASE_PATH}/default.compute.wgsl`, false);
            }
            else
            {
                return "";
            }
        }
        else if (type.id === "vertex")
        {
            if (isWebGPU)
            {
                if (shader.vertex !== false)
                {
                    addCandidate(`${basePath}.vertex.wgsl`, true);
                }
                addCandidate(`${SHARED_BASE_PATH}/default.vertex.wgsl`, false);
            }
            else
            {
                if (shader.vertex !== false)
                {
                    addCandidate(`${basePath}.vertex.glsl`, true);
                }
                addCandidate(`${SHARED_BASE_PATH}/default.vertex.glsl`, false);
            }
        }
        else
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.fragment.wgsl`, false);
            }
            else
            {
                addCandidate(`${basePath}.fragment.glsl`, false);
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
                if (isKnownShader(shader))
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

    populateEditors()
    {
        for (const [id, editor] of this.editors)
        {
            editor.textarea.value = this.sources[id] || "";
            this.updateHighlight(id);
            this.markTabModified(id, false);
        }
    }

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

    updateTabs()
    {
        const tabBar = this.elements.tabBar;
        if (!tabBar)
        {
            return;
        }

        tabBar.innerHTML = "";

        const visibleTypes = this.getVisibleShaderTypes(this.currentContext, this.currentShader);
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

    getTabLabel(type)
    {
        return type.label;
    }

    refreshPaneVisibility()
    {
        const visibleTypes = this.getVisibleShaderTypes(this.currentContext, this.currentShader).map(t => t.id);

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

    markTabModified(tabName, isModified)
    {
        const editor = this.editors.get(tabName);
        const tab = editor ? editor.tab : null;
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
            this.compileTimeout = null;
            this.recompileShader();
        }, this.compileDelay);
    }

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

    resolveDefaultTab()
    {
        const visible = this.getVisibleShaderTypes(this.currentContext, this.currentShader);
        const preferred = visible.find(t => t.id === "fragment") || visible.find(t => t.id === "vertex");
        return preferred ? preferred.id : (visible[0] ? visible[0].id : null);
    }

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

    hasShaderLoaded()
    {
        return !!this.currentShader;
    }
}
