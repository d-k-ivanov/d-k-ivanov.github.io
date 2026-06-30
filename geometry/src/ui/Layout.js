"use strict";
import { STYLES } from './Styles.js';

// Builds the scoped two-pane DOM — editor | splitter | viewer — and injects the
// stylesheet once. A draggable splitter lets the user rebalance the two sides.

export class Layout
{
    constructor()
    {
        Layout._injectStylesOnce();

        this.root = document.createElement('div');
        this.root.className = 'cgs-root';

        this.editorPane = document.createElement('div');
        this.editorPane.className = 'cgs-pane cgs-editor-pane';

        this.splitter = document.createElement('div');
        this.splitter.className = 'cgs-splitter';

        this.viewerPane = document.createElement('div');
        this.viewerPane.className = 'cgs-pane cgs-viewer-pane';

        this.root.append(this.editorPane, this.splitter, this.viewerPane);
        this._initSplitter();
    }

    mount(target)
    {
        // Fill the viewport only when attached directly to the page body/root.
        if (target === document.body || target === document.documentElement)
        {
            this.root.classList.add('cgs-fill');
        }
        target.appendChild(this.root);
        return this;
    }

    _initSplitter()
    {
        let dragging = false;

        const onMove = (event) =>
        {
            if (!dragging) return;
            const rect = this.root.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const ratio = Math.min(0.8, Math.max(0.2, (clientX - rect.left) / rect.width));
            this.editorPane.style.width = `${ratio * 100}%`;
        };
        const stop = () => { dragging = false; document.body.style.userSelect = ''; };
        const start = (event) =>
        {
            dragging = true;
            document.body.style.userSelect = 'none';
            event.preventDefault();
        };

        this.splitter.addEventListener('mousedown', start);
        this.splitter.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
    }

    static _injectStylesOnce()
    {
        if (document.getElementById('cgs-styles')) return;
        const style = document.createElement('style');
        style.id = 'cgs-styles';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }
}
