"use strict";
import { Console } from './Console.js';
import { EXAMPLES, DEFAULT_CODE } from '../runtime/examples.js';

const STORAGE_KEY = 'cgs:code';

// The left-hand coding pane: a toolbar, a code area with a line-number gutter, and
// an output console. Persists the current script to localStorage and supports
// loading/saving scripts as files.

export class CodeEditor
{
    constructor(container, { onRun, onClear, onFit } = {})
    {
        this.container = container;
        this.onRun = onRun || (() => { });
        this.onClear = onClear || (() => { });
        this.onFit = onFit || (() => { });

        this._build();
        this._wire();
        this.setValue(this._loadSaved() ?? DEFAULT_CODE);
    }

    _build()
    {
        // Toolbar with primary actions.
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'cgs-toolbar';
        this.toolbar.innerHTML = `
      <span class="cgs-title">GEOMETRY STUDIO</span>
      <button class="cgs-btn cgs-primary" data-act="run" title="Run (Ctrl+Enter)">Run</button>
      <button class="cgs-btn" data-act="clear" title="Clear scene & console">Reset</button>
      <button class="cgs-btn" data-act="fit" title="Frame content">Fit</button>
      <span class="cgs-spacer"></span>
      <select class="cgs-select" data-act="examples" title="Load an example"></select>
      <button class="cgs-btn" data-act="load" title="Open a .js file from disk">Load</button>
      <button class="cgs-btn" data-act="save" title="Download current code">Save</button>
    `;
        const select = this.toolbar.querySelector('[data-act="examples"]');
        select.innerHTML = '<option value="">Examples…</option>'
            + Object.keys(EXAMPLES).map((k) => `<option value="${k}">${k}</option>`).join('');

        // Code area: line-number gutter + textarea.
        this.editorWrap = document.createElement('div');
        this.editorWrap.className = 'cgs-editor-wrap';
        this.gutter = document.createElement('div');
        this.gutter.className = 'cgs-gutter';
        this.textarea = document.createElement('textarea');
        this.textarea.className = 'cgs-textarea';
        this.textarea.spellcheck = false;
        this.textarea.wrap = 'off';
        this.editorWrap.append(this.gutter, this.textarea);

        // Output console.
        this.consoleEl = document.createElement('div');
        this.consoleEl.className = 'cgs-console';
        this.console = new Console(this.consoleEl);

        // Hidden file input backing the "Load" button.
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.js,.txt';
        this.fileInput.style.display = 'none';

        this.container.append(this.toolbar, this.editorWrap, this.consoleEl, this.fileInput);
    }

    _wire()
    {
        this.toolbar.addEventListener('click', (event) =>
        {
            const action = event.target?.dataset?.act;
            if (action === 'run')
            {
                this.run();
            }
            else if (action === 'clear')
            {
                this.onClear();
            }
            else if (action === 'fit')
            {
                this.onFit();
            }
            else if (action === 'load')
            {
                this.fileInput.click();
            }
            else if (action === 'save')
            {
                this.save();
            }
        });

        this.toolbar.querySelector('[data-act="examples"]').addEventListener('change', (event) =>
        {
            const key = event.target.value;
            if (key && EXAMPLES[key])
            {
                this.setValue(EXAMPLES[key]); this.run();
            }
            event.target.value = '';
        });

        this.textarea.addEventListener('input', () => { this._updateGutter(); this._save(); });
        this.textarea.addEventListener('scroll', () => { this.gutter.scrollTop = this.textarea.scrollTop; });
        this.textarea.addEventListener('keydown', (event) => this._onKey(event));

        this.fileInput.addEventListener('change', async (event) =>
        {
            const file = event.target.files?.[0];
            if (file)
            {
                this.setValue(await file.text()); this.run();
            }
            this.fileInput.value = '';
        });
    }

    _onKey(event)
    {
        // Ctrl/Cmd+Enter runs the script; Tab inserts two spaces.
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter')
        {
            event.preventDefault();
            this.run();
            return;
        }
        if (event.key === 'Tab')
        {
            event.preventDefault();
            const { selectionStart, selectionEnd, value } = this.textarea;
            this.textarea.value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
            this.textarea.selectionStart = this.textarea.selectionEnd = selectionStart + 2;
            this._updateGutter();
        }
    }

    _updateGutter()
    {
        const lineCount = this.textarea.value.split('\n').length;
        this.gutter.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    }

    getValue() { return this.textarea.value; }

    setValue(code)
    {
        this.textarea.value = code;
        this._updateGutter();
        this._save();
    }

    run() { this.onRun(this.getValue()); }

    save()
    {
        const blob = new Blob([this.getValue()], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'geometry-script.js';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    _save() { try { localStorage.setItem(STORAGE_KEY, this.getValue()); } catch { /* storage unavailable */ } }
    _loadSaved() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } }
}
