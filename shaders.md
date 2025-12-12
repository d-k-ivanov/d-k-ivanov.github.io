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

.shaders-control-panel {
    flex: 1;
    min-width: 0;
    background: #f5f5f5;
    border-left: 1px solid #ccc;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
}

@media (prefers-color-scheme: dark) {
    .shaders-control-panel {
        background: #20212b;
        border-left-color: #444;
        color: #dadbdf;
    }
}

/* Responsive layout */
@media (max-width: 768px) {
    .shaders-main-container {
        flex-direction: column;
    }

    .shaders-canvas-panel {
        flex: none;
        height: 50vh;
        min-height: 300px;
    }

    .shaders-control-panel {
        flex: none;
        height: 50vh;
        border-left: none;
        border-top: 1px solid #ccc;
    }

    @media (prefers-color-scheme: dark) {
        .shaders-control-panel {
            border-top-color: #444;
        }
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
                <option value="320x240" selected>320×240 (QVGA)</option>
                <option value="512x512">512×512</option>
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
        <!-- Control panel content will go here -->
    </div>
</div>
<script type="module" src="/shaders/main.js"></script>
