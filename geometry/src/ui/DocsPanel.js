"use strict";
// Slide-in reference panel that lets the user navigate across every geometry object
// and library method. It is purely metadata-driven (fed from the object/library
// registries), so it always stays in sync with the actual API. Each entry can be
// expanded to reveal a summary + example, and inserted into the editor.

export class DocsPanel
{
    constructor(container, { sections = [], onInsert } = {})
    {
        this.onInsert = onInsert || (() => { });
        this._sections = sections;
        this._index = new Map(); // row key → example code
        this._build(container);
    }

    _build(container)
    {
        this.root = document.createElement('div');
        this.root.className = 'cgs-docs';

        const header = document.createElement('div');
        header.className = 'cgs-docs-header';
        header.innerHTML = `
            <span class="cgs-docs-title">REFERENCE</span>
            <input class="cgs-docs-search" type="search" placeholder="Filter…" />
            <button class="cgs-btn" data-docs="close" title="Close">✕</button>
        `;

        this.body = document.createElement('div');
        this.body.className = 'cgs-docs-body';

        this.root.append(header, this.body);
        container.appendChild(this.root);

        this._renderSections('');

        header.querySelector('[data-docs="close"]').addEventListener('click', () => this.hide());
        header.querySelector('.cgs-docs-search').addEventListener('input', (event) =>
        {
            this._renderSections(event.target.value.trim().toLowerCase());
        });
        this.body.addEventListener('click', (event) => this._onBodyClick(event));
    }

    /** Re-render the catalogue, optionally filtered by a lowercase query. */
    _renderSections(filter)
    {
        this._index.clear();
        let id = 0;
        const html = [];

        for (const section of this._sections)
        {
            const items = section.items.filter((it) =>
                !filter
                || it.name.toLowerCase().includes(filter)
                || (it.summary || '').toLowerCase().includes(filter));
            if (!items.length)
            {
                continue;
            }

            html.push(`<div class="cgs-docs-group">${esc(section.title ?? section.category)}</div>`);
            for (const it of items)
            {
                const key = `d${id++}`;
                this._index.set(key, it.example || '');
                const insert = it.example
                    ? `<button class="cgs-btn" data-docs="insert">Insert</button>`
                    : '';
                html.push(`
                    <div class="cgs-docs-item" data-key="${key}">
                        <div class="cgs-docs-row" data-docs="toggle">
                            <code class="cgs-docs-name">${esc(it.name)}</code>
                            <span class="cgs-docs-sig">${esc(it.signature || '')}</span>
                        </div>
                        <div class="cgs-docs-detail">
                            <div class="cgs-docs-summary">${esc(it.summary || '')}</div>
                            ${it.example ? `<pre class="cgs-docs-example">${esc(it.example)}</pre>${insert}` : ''}
                        </div>
                    </div>`);
            }
        }

        this.body.innerHTML = html.join('') || '<div class="cgs-docs-empty">No matches.</div>';
    }

    _onBodyClick(event)
    {
        const insertBtn = event.target.closest('[data-docs="insert"]');
        if (insertBtn)
        {
            const key = insertBtn.closest('.cgs-docs-item')?.dataset.key;
            const code = this._index.get(key);
            if (code)
            {
                this.onInsert(code);
            }
            return;
        }

        const row = event.target.closest('[data-docs="toggle"]');
        if (row)
        {
            row.parentElement.classList.toggle('cgs-open');
        }
    }

    show() { this.root.classList.add('cgs-open'); }
    hide() { this.root.classList.remove('cgs-open'); }
    toggle() { this.root.classList.toggle('cgs-open'); }
}

/** Minimal HTML escaping for text rendered via innerHTML. */
function esc(value)
{
    return String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
