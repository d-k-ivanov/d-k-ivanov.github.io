---
layout: shaders
title : Shaders
permalink: /shaders/
---
<link rel="stylesheet" href="/shaders/shaders.css">

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
            <button class="shaders-toolbar-btn" id="fullscreen-toggle" title="Toggle fullscreen">⛶</button>
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
                    <div class="shaders-editor-wrapper">
                        <pre class="shaders-editor-highlight" id="vert-highlight"></pre>
                        <textarea id="vert-source" spellcheck="false" placeholder="Vertex shader source..."></textarea>
                    </div>
                </div>
                <div class="shaders-editor-pane" id="editor-frag">
                    <div class="shaders-editor-wrapper">
                        <pre class="shaders-editor-highlight" id="frag-highlight"></pre>
                        <textarea id="frag-source" spellcheck="false" placeholder="Fragment shader source..."></textarea>
                    </div>
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
