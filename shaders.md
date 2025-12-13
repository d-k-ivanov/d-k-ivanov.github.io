---
layout: shaders
title : Shaders
permalink: /shaders/
---
<style>
/* Theme Variables - Dark */
.theme-dark {
    --sh-bg-primary: #1a1a1a;
    --sh-bg-secondary: #1e1e1e;
    --sh-bg-tertiary: #252526;
    --sh-bg-toolbar: #2a2a2a;
    --sh-bg-input: #333;
    --sh-bg-hover: #2a2d2e;
    --sh-bg-tab: #2d2d2d;
    --sh-bg-tab-hover: #323232;
    --sh-bg-active: #094771;
    --sh-bg-selection: #264f78;
    --sh-border: #333;
    --sh-border-light: #444;
    --sh-text-primary: #dadbdf;
    --sh-text-secondary: #cccccc;
    --sh-text-muted: #969696;
    --sh-text-disabled: #6e6e6e;
    --sh-text-header: #bbbbbb;
    --sh-accent: #39c;
    --sh-accent-bg: #007acc;
    --sh-error-bg: #c72e2e;
    --sh-icon-shader: #e8ab53;
    --sh-icon-vert: #6a9955;
    --sh-icon-frag: #ce9178;
    --sh-modified-dot: #c5c5c5;
    --sh-canvas-bg: #000;
}

/* Theme Variables - Light */
.theme-light {
    --sh-bg-primary: #f3f3f3;
    --sh-bg-secondary: #ffffff;
    --sh-bg-tertiary: #f0f0f0;
    --sh-bg-toolbar: #e8e8e8;
    --sh-bg-input: #ffffff;
    --sh-bg-hover: #e4e6e8;
    --sh-bg-tab: #ececec;
    --sh-bg-tab-hover: #e0e0e0;
    --sh-bg-active: #cce5ff;
    --sh-bg-selection: #add6ff;
    --sh-border: #d4d4d4;
    --sh-border-light: #c8c8c8;
    --sh-text-primary: #333333;
    --sh-text-secondary: #444444;
    --sh-text-muted: #666666;
    --sh-text-disabled: #999999;
    --sh-text-header: #555555;
    --sh-accent: #0066cc;
    --sh-accent-bg: #0078d4;
    --sh-error-bg: #d32f2f;
    --sh-icon-shader: #bf8803;
    --sh-icon-vert: #4e8a3e;
    --sh-icon-frag: #a45a28;
    --sh-modified-dot: #666666;
    --sh-canvas-bg: #1a1a1a;
}

/* Theme Toggle Button */
.shaders-theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--sh-border-light);
    border-radius: 4px;
    background: var(--sh-bg-input);
    color: var(--sh-text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

.shaders-theme-toggle:hover {
    border-color: var(--sh-accent);
    background: var(--sh-bg-hover);
}

.shaders-theme-toggle:focus {
    outline: none;
    border-color: var(--sh-accent);
    box-shadow: 0 0 0 2px rgba(51, 153, 204, 0.3);
}

.shaders-main-container {
    position: absolute;
    top: 46px;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    overflow: hidden;
}

.shaders-canvas-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--sh-bg-primary);
    position: relative;
}

.shaders-canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--sh-bg-toolbar);
    border-bottom: 1px solid var(--sh-border-light);
}

.shaders-canvas-toolbar label {
    color: var(--sh-text-primary);
    font-size: 14px;
    font-weight: 500;
}

.shaders-canvas-toolbar select {
    padding: 6px 10px;
    font-size: 14px;
    border: 1px solid var(--sh-border-light);
    border-radius: 4px;
    background: var(--sh-bg-input);
    color: var(--sh-text-primary);
    cursor: pointer;
}

.shaders-canvas-toolbar select:hover {
    border-color: var(--sh-accent);
}

.shaders-canvas-toolbar select:focus {
    outline: none;
    border-color: var(--sh-accent);
    box-shadow: 0 0 0 2px rgba(51, 153, 204, 0.3);
}

.shaders-canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 10px;
}

.shaders-canvas-panel canvas {
    display: block;
    background: var(--sh-canvas-bg);
    max-width: 100%;
    max-height: 100%;
}

/* Control Panel - IDE Layout */
.shaders-control-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    background: var(--sh-bg-secondary);
    border-left: 1px solid var(--sh-border);
    overflow: hidden;
}

/* File Tree Sidebar */
.shaders-file-tree {
    width: 200px;
    min-width: 150px;
    background: var(--sh-bg-tertiary);
    border-right: 1px solid var(--sh-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.shaders-file-tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--sh-text-header);
    background: var(--sh-bg-tertiary);
    border-bottom: 1px solid var(--sh-border);
}

.shaders-file-tree-header .shaders-theme-toggle {
    width: 22px;
    height: 22px;
    font-size: 12px;
}

.shaders-file-tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
}

.shaders-tree-folder {
    user-select: none;
}

.shaders-tree-folder-header {
    display: flex;
    align-items: center;
    padding: 4px 8px 4px 12px;
    cursor: pointer;
    color: var(--sh-text-secondary);
    font-size: 13px;
}

.shaders-tree-folder-header:hover {
    background: var(--sh-bg-hover);
}

.shaders-tree-folder-icon {
    margin-right: 6px;
    font-size: 12px;
    width: 16px;
    text-align: center;
    transition: transform 0.15s ease;
}

.shaders-tree-folder.collapsed .shaders-tree-folder-icon {
    transform: rotate(-90deg);
}

.shaders-tree-folder-items {
    display: block;
}

.shaders-tree-folder.collapsed .shaders-tree-folder-items {
    display: none;
}

.shaders-tree-item {
    display: flex;
    align-items: center;
    padding: 4px 8px 4px 32px;
    cursor: pointer;
    color: var(--sh-text-secondary);
    font-size: 13px;
}

.shaders-tree-item:hover {
    background: var(--sh-bg-hover);
}

.shaders-tree-item.active {
    background: var(--sh-bg-active);
}

.shaders-tree-item-icon {
    margin-right: 6px;
    font-size: 12px;
    color: var(--sh-icon-shader);
}

/* Editor Area */
.shaders-editor-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--sh-bg-secondary);
}

/* Tab Bar */
.shaders-tab-bar {
    display: flex;
    background: var(--sh-bg-tertiary);
    border-bottom: 1px solid var(--sh-border);
    min-height: 35px;
    overflow-x: auto;
}

.shaders-tab {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 13px;
    color: var(--sh-text-muted);
    background: var(--sh-bg-tab);
    border-right: 1px solid var(--sh-bg-tertiary);
    cursor: pointer;
    white-space: nowrap;
    min-width: 0;
}

.shaders-tab:hover {
    background: var(--sh-bg-tab-hover);
}

.shaders-tab.active {
    background: var(--sh-bg-secondary);
    color: var(--sh-text-primary);
    border-bottom: 1px solid var(--sh-bg-secondary);
    margin-bottom: -1px;
}

.shaders-tab-icon {
    margin-right: 6px;
    font-size: 12px;
}

.shaders-tab-icon.vert {
    color: var(--sh-icon-vert);
}

.shaders-tab-icon.frag {
    color: var(--sh-icon-frag);
}

.shaders-tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
}

.shaders-tab-modified {
    margin-left: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sh-modified-dot);
    display: none;
}

.shaders-tab.modified .shaders-tab-modified {
    display: block;
}

/* Editor Content */
.shaders-editor-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.shaders-editor-pane {
    flex: 1;
    display: none;
    flex-direction: column;
    overflow: hidden;
}

.shaders-editor-pane.active {
    display: flex;
}

.shaders-editor-pane textarea {
    flex: 1;
    width: 100%;
    padding: 12px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: var(--sh-text-primary);
    background: var(--sh-bg-secondary);
    border: none;
    resize: none;
    outline: none;
    tab-size: 4;
    white-space: pre;
    overflow: auto;
}

.shaders-editor-pane textarea::selection {
    background: var(--sh-bg-selection);
}

/* Status Bar */
.shaders-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px;
    font-size: 12px;
    color: #ffffff;
    background: var(--sh-accent-bg);
}

.shaders-status-bar.error {
    background: var(--sh-error-bg);
}

.shaders-status-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.shaders-status-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* Empty State */
.shaders-editor-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sh-text-disabled);
    font-size: 14px;
}

/* Resize Handles */
.shaders-resize-handle {
    background: transparent;
    position: relative;
    flex-shrink: 0;
    z-index: 10;
}

.shaders-resize-handle::after {
    content: '';
    position: absolute;
    background: var(--sh-accent-bg);
    opacity: 0;
    transition: opacity 0.15s ease;
}

.shaders-resize-handle:hover::after,
.shaders-resize-handle.dragging::after {
    opacity: 1;
}

.shaders-resize-handle-h {
    width: 5px;
    cursor: col-resize;
    margin: 0 -2px;
}

.shaders-resize-handle-h::after {
    top: 0;
    bottom: 0;
    left: 2px;
    width: 1px;
}

.shaders-resize-handle-v {
    height: 5px;
    cursor: row-resize;
    margin: -2px 0;
}

.shaders-resize-handle-v::after {
    left: 0;
    right: 0;
    top: 2px;
    height: 1px;
}

/* Prevent text selection during resize */
.shaders-resizing {
    user-select: none;
    cursor: col-resize;
}

.shaders-resizing-v {
    user-select: none;
    cursor: row-resize;
}

.shaders-resizing iframe,
.shaders-resizing-v iframe {
    pointer-events: none;
}

/* Responsive layout */
@media (max-width: 1024px) {
    .shaders-file-tree {
        width: 160px;
        min-width: 120px;
    }
}

@media (max-width: 768px) {
    .shaders-main-container {
        flex-direction: column;
    }

    .shaders-canvas-panel {
        flex: none;
        height: 40vh;
        min-height: 250px;
    }

    #resize-main {
        display: none;
    }

    .shaders-control-panel {
        flex: none;
        height: 60vh;
        border-left: none;
        border-top: 1px solid var(--sh-border);
    }

    .shaders-file-tree {
        width: 140px;
        min-width: 100px;
    }
}
</style>

<div class="shaders-main-container">
    <div class="shaders-canvas-panel theme-dark" id="canvas-panel">
        <div class="shaders-canvas-toolbar">
            <label for="resolution-select">Resolution:</label>
            <select id="resolution-select">
                <option value="64x64">64×64</option>
                <option value="128x128">128×128</option>
                <option value="160x120">160×120 (QQVGA)</option>
                <option value="256x256">256×256</option>
                <option value="320x200">320×200 (CGA)</option>
                <option value="320x240">320×240 (QVGA)</option>
                <option value="400x300">400×300</option>
                <option value="480x320" selected>480×320 (HVGA)</option>
                <option value="512x512">512×512</option>
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
                <div class="shaders-editor-pane" id="editor-vert">
                    <textarea id="vert-source" spellcheck="false" placeholder="Vertex shader source..."></textarea>
                </div>
                <div class="shaders-editor-pane" id="editor-frag">
                    <textarea id="frag-source" spellcheck="false" placeholder="Fragment shader source..."></textarea>
                </div>
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
<script type="module" src="/shaders/main.js"></script>
