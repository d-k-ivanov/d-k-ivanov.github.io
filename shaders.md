---
layout: shaders
title : Shaders
permalink: /shaders/
---
<style>
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
    background: #1a1a1a;
    position: relative;
}

.shaders-canvas-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #2a2a2a;
    border-bottom: 1px solid #444;
}

.shaders-canvas-toolbar label {
    color: #dadbdf;
    font-size: 14px;
    font-weight: 500;
}

.shaders-canvas-toolbar select {
    padding: 6px 10px;
    font-size: 14px;
    border: 1px solid #444;
    border-radius: 4px;
    background: #333;
    color: #dadbdf;
    cursor: pointer;
}

.shaders-canvas-toolbar select:hover {
    border-color: #39c;
}

.shaders-canvas-toolbar select:focus {
    outline: none;
    border-color: #39c;
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
    background: #000;
    max-width: 100%;
    max-height: 100%;
}

/* Control Panel - IDE Layout */
.shaders-control-panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    background: #1e1e1e;
    border-left: 1px solid #333;
    overflow: hidden;
}

/* File Tree Sidebar */
.shaders-file-tree {
    width: 200px;
    min-width: 150px;
    background: #252526;
    border-right: 1px solid #333;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.shaders-file-tree-header {
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #bbbbbb;
    background: #252526;
    border-bottom: 1px solid #333;
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
    color: #cccccc;
    font-size: 13px;
}

.shaders-tree-folder-header:hover {
    background: #2a2d2e;
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
    color: #cccccc;
    font-size: 13px;
}

.shaders-tree-item:hover {
    background: #2a2d2e;
}

.shaders-tree-item.active {
    background: #094771;
}

.shaders-tree-item-icon {
    margin-right: 6px;
    font-size: 12px;
    color: #e8ab53;
}

/* Editor Area */
.shaders-editor-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
}

/* Tab Bar */
.shaders-tab-bar {
    display: flex;
    background: #252526;
    border-bottom: 1px solid #333;
    min-height: 35px;
    overflow-x: auto;
}

.shaders-tab {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 13px;
    color: #969696;
    background: #2d2d2d;
    border-right: 1px solid #252526;
    cursor: pointer;
    white-space: nowrap;
    min-width: 0;
}

.shaders-tab:hover {
    background: #323232;
}

.shaders-tab.active {
    background: #1e1e1e;
    color: #ffffff;
    border-bottom: 1px solid #1e1e1e;
    margin-bottom: -1px;
}

.shaders-tab-icon {
    margin-right: 6px;
    font-size: 12px;
}

.shaders-tab-icon.vert {
    color: #6a9955;
}

.shaders-tab-icon.frag {
    color: #ce9178;
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
    background: #c5c5c5;
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
    color: #d4d4d4;
    background: #1e1e1e;
    border: none;
    resize: none;
    outline: none;
    tab-size: 4;
    white-space: pre;
    overflow: auto;
}

.shaders-editor-pane textarea::selection {
    background: #264f78;
}

/* Status Bar */
.shaders-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 12px;
    font-size: 12px;
    color: #cccccc;
    background: #007acc;
}

.shaders-status-bar.error {
    background: #c72e2e;
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
    color: #6e6e6e;
    font-size: 14px;
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

    .shaders-control-panel {
        flex: none;
        height: 60vh;
        border-left: none;
        border-top: 1px solid #333;
    }

    .shaders-file-tree {
        width: 140px;
        min-width: 100px;
    }
}
</style>

<div class="shaders-main-container">
    <div class="shaders-canvas-panel">
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
        </div>
        <div class="shaders-canvas-wrapper">
            <canvas id="canvas"></canvas>
        </div>
    </div>
    <div class="shaders-control-panel">
        <div class="shaders-file-tree">
            <div class="shaders-file-tree-header">Shaders</div>
            <div class="shaders-file-tree-content" id="file-tree">
                <!-- File tree items will be populated by JS -->
            </div>
        </div>
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
