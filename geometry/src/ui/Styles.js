"use strict";
// All studio styles, scoped under `.cgs-root` so the widget can be embedded in
// any host page without leaking styles or being affected by the host's CSS.

export const STYLES = `
.cgs-root, .cgs-root * { box-sizing: border-box; }

.cgs-root {
  position: relative;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 480px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #e6e6e6;
  background: #1e1e1e;
  overflow: hidden;
}
.cgs-root.cgs-fill { position: fixed; inset: 0; min-height: 100vh; }

.cgs-pane { position: relative; height: 100%; min-width: 0; overflow: hidden; }
.cgs-editor-pane { display: flex; flex-direction: column; width: 44%; background: #1e1e1e; }
.cgs-viewer-pane { flex: 1 1 auto; background: #15151a; }

.cgs-splitter {
  flex: 0 0 6px; cursor: col-resize; background: #2a2a2a;
  border-left: 1px solid #000; border-right: 1px solid #000;
}
.cgs-splitter:hover { background: #3a78d8; }

.cgs-toolbar {
  display: flex; align-items: center; gap: 6px; padding: 6px 8px;
  background: #252526; border-bottom: 1px solid #111; flex: 0 0 auto; flex-wrap: wrap;
}
.cgs-title {
  font-weight: 600; font-size: 12px; letter-spacing: .04em;
  color: #9cdcfe; margin-right: 6px; white-space: nowrap;
}
.cgs-btn {
  font: inherit; font-size: 12px; color: #e6e6e6; background: #3a3a3d;
  border: 1px solid #1b1b1b; border-radius: 4px; padding: 4px 10px; cursor: pointer;
}
.cgs-btn:hover { background: #4a4a4e; }
.cgs-btn.cgs-primary { background: #2d6cdf; }
.cgs-btn.cgs-primary:hover { background: #3a78ef; }
.cgs-select {
  font: inherit; font-size: 12px; color: #e6e6e6; background: #3a3a3d;
  border: 1px solid #1b1b1b; border-radius: 4px; padding: 3px 6px;
}
.cgs-spacer { flex: 1 1 auto; }

.cgs-editor-wrap { position: relative; flex: 1 1 auto; display: flex; overflow: hidden; }
.cgs-gutter {
  flex: 0 0 auto; padding: 8px 6px 8px 8px; text-align: right; user-select: none;
  color: #6b6b6b; background: #1b1b1b; overflow: hidden; white-space: pre;
  font-family: "Cascadia Code", Consolas, "Courier New", monospace; font-size: 13px; line-height: 1.5;
}
.cgs-textarea {
  flex: 1 1 auto; resize: none; border: 0; outline: none; padding: 8px 10px;
  color: #d4d4d4; background: #1e1e1e; tab-size: 2; white-space: pre; overflow: auto;
  font-family: "Cascadia Code", Consolas, "Courier New", monospace; font-size: 13px; line-height: 1.5;
}

.cgs-console {
  flex: 0 0 30%; min-height: 90px; overflow: auto; border-top: 1px solid #111;
  background: #141414; padding: 6px 8px;
  font-family: "Cascadia Code", Consolas, "Courier New", monospace; font-size: 12px;
}
.cgs-line { white-space: pre-wrap; word-break: break-word; padding: 1px 0; }
.cgs-line.cgs-error { color: #f48771; }
.cgs-line.cgs-warn { color: #e2c08d; }
.cgs-line.cgs-info { color: #9cdcfe; }
.cgs-line.cgs-result { color: #b5cea8; }

.cgs-canvas { display: block; width: 100%; height: 100%; }
.cgs-overlay {
  position: absolute; left: 10px; bottom: 8px; font-size: 11px; color: #9aa0a6;
  background: rgba(0,0,0,.35); padding: 3px 7px; border-radius: 4px; pointer-events: none;
}
.cgs-drop {
  position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
  background: rgba(45,108,223,.18); border: 2px dashed #3a78ef; color: #cfe2ff; font-size: 16px; z-index: 5;
}
.cgs-drop.cgs-active { display: flex; }
`;
