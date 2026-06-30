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
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  font-weight: 700; font-size: 12px; letter-spacing: .1em;
  color: #e9c46a; margin-right: 6px; white-space: nowrap; text-shadow: 1px 1px 0 #000;
}
/* Square, beveled "vintage" controls (classic 90s raised-button look). */
.cgs-btn {
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: #2b2417; background: #cdbb94;
  border-style: solid; border-width: 2px;
  border-color: #f1e8d0 #8a7747 #8a7747 #f1e8d0;
  border-radius: 0; padding: 4px 11px; cursor: pointer;
}
.cgs-btn:hover { background: #dccba2; }
.cgs-btn:active {
  border-color: #8a7747 #f1e8d0 #f1e8d0 #8a7747;
  transform: translateY(1px);
}
.cgs-btn.cgs-primary { color: #2a1607; background: #d79a4e; }
.cgs-btn.cgs-primary:hover { background: #e3a85b; }
.cgs-select {
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  font-size: 11px; color: #2b2417; background: #cdbb94;
  border-style: solid; border-width: 2px;
  border-color: #f1e8d0 #8a7747 #8a7747 #f1e8d0;
  border-radius: 0; padding: 3px 6px;
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

/* Reference documentation panel (vintage parchment drawer sliding in from the right). */
.cgs-docs {
  position: absolute; top: 0; right: 0; bottom: 0; width: 340px; max-width: 85%;
  transform: translateX(105%); transition: transform .18s ease; z-index: 8;
  display: flex; flex-direction: column;
  background: #e9dfc4; color: #2b2417; border-left: 3px solid #8a7747;
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  box-shadow: -4px 0 14px rgba(0, 0, 0, .45);
}
.cgs-docs.cgs-open { transform: translateX(0); }
.cgs-docs-header {
  display: flex; align-items: center; gap: 6px; padding: 6px 8px;
  background: #cdbb94; border-bottom: 2px solid #8a7747;
}
.cgs-docs-title { font-weight: 700; font-size: 12px; letter-spacing: .12em; color: #5a4a22; }
.cgs-docs-search {
  flex: 1 1 auto; min-width: 0; font: inherit; font-size: 11px; padding: 3px 6px;
  border: 2px solid; border-color: #8a7747 #f1e8d0 #f1e8d0 #8a7747;
  background: #fbf6e7; color: #2b2417; border-radius: 0;
}
.cgs-docs-body { flex: 1 1 auto; overflow: auto; padding: 2px 0 8px; }
.cgs-docs-group {
  padding: 7px 10px 3px; font-weight: 700; font-size: 10px; text-transform: uppercase;
  letter-spacing: .1em; color: #7a6a3e; background: #e2d6b6; border-top: 1px solid #c9bd98;
}
.cgs-docs-item { border-bottom: 1px solid #d8cda9; }
.cgs-docs-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; padding: 5px 10px; cursor: pointer; }
.cgs-docs-row:hover { background: #f3ecd7; }
.cgs-docs-name { color: #8a3e1d; font-weight: 700; font-size: 12px; }
.cgs-docs-sig { color: #5f5640; font-size: 11px; }
.cgs-docs-detail { display: none; padding: 0 10px 9px; }
.cgs-docs-item.cgs-open .cgs-docs-detail { display: block; }
.cgs-docs-summary { font-size: 11px; color: #4a432f; margin: 2px 0 6px; }
.cgs-docs-example {
  margin: 0 0 6px; padding: 6px 8px; background: #fbf6e7; border: 1px solid #c9bd98;
  white-space: pre-wrap; word-break: break-word; font-size: 11px; color: #2b2417;
}
.cgs-docs-empty { padding: 14px 10px; color: #7a6a3e; font-size: 12px; }
`;
