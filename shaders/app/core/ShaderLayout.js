"use strict";

/**
 * Static HTML scaffold for the editor layout.
 *
 * This template defines the main canvas panel, the file tree, editor panes,
 * and status bar used by the Shader Editor module. It is injected exactly
 * once when the app boots, allowing the JS layer to remain the source of
 * truth for UI wiring without relying on hardcoded HTML in the layout.
 *
 * Keeping the markup in its own module keeps {@link ShaderApp} focused on
 * lifecycle orchestration instead of a large inline string literal.
 */
export const SHADER_UI_TEMPLATE = `
<div class="shaders-main-container">
    <div class="shaders-canvas-panel theme-dark" id="canvas-panel">
        <div class="shaders-canvas-toolbar">
            <div class="shaders-toolbar-group">
                <label for="resolution-select">Resolution:</label>
                <select id="resolution-select">
                    <option value="64x64">64×64 (1:1)</option>
                    <option value="128x128">128×128 (1:1)</option>
                    <option value="256x256">256×256 (1:1)</option>
                    <option value="512x512">512×512 (1:1)</option>
                    <option value="1024x1024">1024×1024 (1:1)</option>
                    <option value="2048x2048">2048×2048 (1:1)</option>
                    <option value="4096x4096">4096×4096 (1:1)</option>

                    <option value="320x200">320×200 (16:10)</option>
                    <option value="480x300">480×300 (16:10)</option>
                    <option value="640x400">640×400 (16:10)</option>
                    <option value="800x500">800×500 (16:10)</option>
                    <option value="960x600">960×600 (16:10)</option>
                    <option value="1024x640" selected>1024×640 (16:10)</option>
                    <option value="1280x800">1280×800 (16:10)</option>
                    <option value="1440x900">1440×900 (16:10)</option>
                    <option value="1680x1050">1680×1050 (16:10)</option>
                    <option value="1920x1200">1920×1200 (16:10)</option>
                    <option value="2560x1600">2560×1600 (16:10)</option>
                    <option value="3840x2400">3840×2400 (16:10)</option>
                    <option value="4096x2560">4096×2560 (16:10)</option>

                    <option value="320x180">320×180 (16:9)</option>
                    <option value="426x240">426×240 (16:9)</option>
                    <option value="480x270">480×270 (16:9)</option>
                    <option value="640x360">640×360 (16:9)</option>
                    <option value="854x480">854×480 (16:9)</option>
                    <option value="960x540">960×540 (16:9)</option>
                    <option value="1024x576">1024×576 (16:9)</option>
                    <option value="1280x720">1280×720 (16:9)</option>
                    <option value="1366x768">1366×768 (16:9)</option>
                    <option value="1600x900">1600×900 (16:9)</option>
                    <option value="1920x1080">1920×1080 (16:9)</option>
                    <option value="2560x1440">2560×1440 (16:9)</option>
                    <option value="3840x2160">3840×2160 (16:9)</option>
                    <option value="5120x2880">5120×2880 (16:9)</option>

                    <option value="160x120">160×120 (4:3)</option>
                    <option value="320x240">320×240 (4:3)</option>
                    <option value="400x300">400×300 (4:3)</option>
                    <option value="640x480">640×480 (4:3)</option>
                    <option value="800x600">800×600 (4:3)</option>
                    <option value="1024x768">1024×768 (4:3)</option>
                    <option value="1280x960">1280×960 (4:3)</option>
                    <option value="1400x1050">1400×1050 (4:3)</option>
                    <option value="1600x1200">1600×1200 (4:3)</option>
                    <option value="1920x1440">1920×1440 (4:3)</option>
                    <option value="2048x1536">2048×1536 (4:3)</option>
                    <option value="2560x1920">2560×1920 (4:3)</option>
                    <option value="3200x2400">3200×2400 (4:3)</option>
                    <option value="3840x2880">3840×2880 (4:3)</option>
                    <option value="4096x3072">4096×3072 (4:3)</option>
                </select>
                <button class="shaders-toolbar-btn" id="fullscreen-toggle" title="Toggle fullscreen">⛶</button>
                <button class="shaders-toolbar-btn shaders-toolbar-toggle" id="fullscreen-resolution-toggle" title="Fullscreen keeps resolution" aria-label="Fullscreen keeps resolution" aria-pressed="false">
                    <i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i>
                </button>
            </div>
            <div class="shaders-toolbar-group">
                <label for="model-select">Model:</label>
                <select id="model-select">
                    <option value="" selected>None</option>
                </select>
            </div>
            <div class="shaders-toolbar-group">
                <button class="shaders-toolbar-action" id="model-load-btn" type="button" title="Load a model from URL or file">
                    Load Model…
                </button>
                <input class="shaders-file-input" id="model-file-input" type="file" accept=".obj,.stl,.ply,.drc,.vox">
            </div>
            <div class="shaders-toolbar-group shaders-sim-controls" id="simulation-controls">
                <button class="shaders-toolbar-action shaders-toolbar-icon" id="shader-compile" type="button" title="Compile shader" aria-label="Compile shader">
                    <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                </button>
                <button class="shaders-toolbar-action shaders-toolbar-icon" id="simulation-pause" type="button" title="Pause shader animation" aria-label="Pause shader animation">
                    <i class="fa-solid fa-pause" aria-hidden="true"></i>
                </button>
            </div>
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
            <div class="shaders-shortcuts">
                <div class="shaders-shortcuts-title">Shortcuts</div>
                <div class="shaders-shortcuts-list">
                    <div class="shaders-shortcut">
                        <span>Compile shader</span>
                        <span class="shaders-shortcut-keys">
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">S</span></span>
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">Shift</span>+<span class="shaders-shortcut-key">B</span></span>
                        </span>
                    </div>
                    <div class="shaders-shortcut">
                        <span>Play/Pause</span>
                        <span class="shaders-shortcut-keys"><span class="shaders-shortcut-key">Space</span></span>
                    </div>
                    <div class="shaders-shortcut">
                        <span>Reload app</span>
                        <span class="shaders-shortcut-keys">
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">F5</span></span>
                            <span class="shaders-shortcut-keys-line"><span class="shaders-shortcut-key">Ctrl</span>+<span class="shaders-shortcut-key">Shift</span>+<span class="shaders-shortcut-key">R</span></span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="shaders-resize-handle shaders-resize-handle-h" id="resize-tree"></div>
        <div class="shaders-editor-area">
            <div class="shaders-tab-bar" id="tab-bar">
                <!-- Tabs will be populated by JS -->
            </div>
            <div class="shaders-note">
                <div class="shaders-note-title">Inputs:</div>
                <div class="shaders-note-body">
                    <div class="shaders-note-section">
                        <div class="shaders-note-section-title">GLSL</div>
                        <div class="shaders-note-grid">
                            <span class="shaders-note-key">vec3 iResolution</span>
                            <span class="shaders-note-desc">viewport resolution in pixels (z is pixel aspect, usually 1.0)</span>
                            <span class="shaders-note-key">float iTime</span>
                            <span class="shaders-note-desc">elapsed time in seconds since the shader started</span>
                            <span class="shaders-note-key">float iTimeDelta</span>
                            <span class="shaders-note-desc">time between the current and previous frame in seconds</span>
                            <span class="shaders-note-key">int iFrame</span>
                            <span class="shaders-note-desc">frame counter incremented every render pass</span>
                            <span class="shaders-note-key">float iFrameRate</span>
                            <span class="shaders-note-desc">estimated frames per second for the current run</span>
                            <span class="shaders-note-key">vec4 iMouse(L)</span>
                            <span class="shaders-note-desc">left button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseR</span>
                            <span class="shaders-note-desc">right button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseW</span>
                            <span class="shaders-note-desc">wheel button: xy = last down position, zw = last click position with sign for down/click</span>
                            <span class="shaders-note-key">vec4 iMouseZoom</span>
                            <span class="shaders-note-desc">view center xy in world space, zoom scale z (1.0 = default), w reserved</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel0</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel1</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel2</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler{2D,Cube} iChannel3</span>
                            <span class="shaders-note-desc">optional texture or cubemap input bound by the editor</span>
                            <span class="shaders-note-key">sampler2D uBackbuffer</span>
                            <span class="shaders-note-desc">previous frame color buffer for feedback effects</span>
                            <span class="shaders-note-key">float uHasModel</span>
                            <span class="shaders-note-desc">1.0 when a model is loaded, otherwise 0.0</span>
                            <span class="shaders-note-key">vec3 uModelCenter</span>
                            <span class="shaders-note-desc">center of the loaded model's bounding box</span>
                            <span class="shaders-note-key">float uModelScale</span>
                            <span class="shaders-note-desc">scale factor applied to fit the model into view</span>
                            <span class="shaders-note-key">vec3 uModelBoundsMin</span>
                            <span class="shaders-note-desc">minimum corner of the model bounding box</span>
                            <span class="shaders-note-key">vec3 uModelBoundsMax</span>
                            <span class="shaders-note-desc">maximum corner of the model bounding box</span>
                        </div>
                    </div>
                    <div class="shaders-note-section">
                        <div class="shaders-note-section-title">WebGPU bindings</div>
                        <div class="shaders-note-grid shaders-note-grid-compact">
                            <span class="shaders-note-key">00: Uniforms</span>
                            <span class="shaders-note-desc">uniform buffer (iResolution/iTime/iMouse/etc.) shared by all shaders</span>
                            <span class="shaders-note-key">01: storage in u32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage input u32 grid (ping-pong source for integer simulations)</span>
                            <span class="shaders-note-key">02: storage out u32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage output u32 grid (ping-pong destination for integer sims)</span>
                            <span class="shaders-note-key">03: storage in f32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage input f32 grid (ping-pong source for float simulations)</span>
                            <span class="shaders-note-key">04: storage out f32[2xGRID_SIZE]</span>
                            <span class="shaders-note-desc">storage output f32 grid (ping-pong destination for float sims)</span>
                            <span class="shaders-note-key">10: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel0</span>
                            <span class="shaders-note-key">11: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel1</span>
                            <span class="shaders-note-key">12: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel2</span>
                            <span class="shaders-note-key">13: texture_2d f32</span>
                            <span class="shaders-note-desc">texture_2d f32 bound as iChannel3</span>
                            <span class="shaders-note-key">14: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel0</span>
                            <span class="shaders-note-key">15: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel1</span>
                            <span class="shaders-note-key">16: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel2</span>
                            <span class="shaders-note-key">17: sampler</span>
                            <span class="shaders-note-desc">sampler for iChannel3</span>
                            <span class="shaders-note-key">20: storage vec4 positions</span>
                            <span class="shaders-note-desc">storage vec4 positions (model vertex positions in object space)</span>
                            <span class="shaders-note-key">21: storage vec4 normals</span>
                            <span class="shaders-note-desc">storage vec4 normals (model vertex normals)</span>
                            <span class="shaders-note-key">22: storage vec4 uvs</span>
                            <span class="shaders-note-desc">storage vec4 uvs (model texture coordinates)</span>
                            <span class="shaders-note-key">23: storage vec4 modelInfo</span>
                            <span class="shaders-note-desc">storage vec4 modelInfo (bounds, scale, and metadata)</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="shaders-editor-content" id="editor-content">
                <div class="shaders-editor-empty" id="editor-empty">
                    Select a shader from the file tree
                </div>
                <div class="shaders-editor-panes" id="editor-panes"></div>
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
`;
