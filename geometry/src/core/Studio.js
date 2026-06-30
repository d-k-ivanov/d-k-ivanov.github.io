"use strict";
import { Layout } from '../ui/Layout.js';
import { CodeEditor } from '../ui/CodeEditor.js';
import { Viewer } from '../viewer/Viewer.js';
import { MeshLoader } from '../loaders/MeshLoader.js';
import { createStudioContext } from '../runtime/StudioAPI.js';
import { CodeRunner } from '../runtime/CodeRunner.js';

// Top-level application object. Assembles the UI, the 3D viewer and the scripting
// runtime, and wires their interactions (run/reset/fit, drag-and-drop loading).

export class Studio
{
    constructor()
    {
        this.layout = new Layout();
    }

    /** Build the UI inside `target` and start the studio. */
    mount(target = document.body)
    {
        this.layout.mount(target);

        // 3D viewer + mesh loader.
        this.viewer = new Viewer(this.layout.viewerPane);
        this.loader = new MeshLoader();
        this._addViewerOverlay();

        // Coding pane (editor + console).
        this.editor = new CodeEditor(this.layout.editorPane, {
            onRun: (code) => this.run(code),
            onClear: () => this.reset(),
            onFit: () => this.viewer.fit(),
        });

        // Runtime: API context bound to this viewer/console, then the code runner.
        this.api = createStudioContext({
            viewer: this.viewer,
            sceneManager: this.viewer.sceneManager,
            loader: this.loader,
            console: this.editor.console,
        });
        this.runner = new CodeRunner(this.api);

        this._enableDragAndDrop();

        // Evaluate whatever is in the editor (restored script or default example).
        this.run(this.editor.getValue());
        return this;
    }

    /** Clear scene + console, then evaluate `code`, surfacing any error. */
    async run(code)
    {
        this.editor.console.clear();
        this.viewer.sceneManager.clear();
        try
        {
            await this.runner.run(code);
        } catch (error)
        {
            this.editor.console.error(
                error instanceof Error ? (error.stack || error.message) : String(error),
            );
        }
    }

    /** Clear scene + console without running anything. */
    reset()
    {
        this.viewer.sceneManager.clear();
        this.editor.console.clear();
    }

    _addViewerOverlay()
    {
        const tip = document.createElement('div');
        tip.className = 'cgs-overlay';
        tip.textContent = 'Orbit: drag · Zoom: wheel · Pan: right-drag · Drop mesh files here';
        this.layout.viewerPane.appendChild(tip);

        this.dropHint = document.createElement('div');
        this.dropHint.className = 'cgs-drop';
        this.dropHint.textContent = 'Drop mesh file to load (STL, PLY, OBJ, DRC, VOX)';
        this.layout.viewerPane.appendChild(this.dropHint);
    }

    /** Allow dropping mesh files from the OS straight onto the 3D view. */
    _enableDragAndDrop()
    {
        const pane = this.layout.viewerPane;
        const showHint = (on) => this.dropHint.classList.toggle('cgs-active', on);

        pane.addEventListener('dragover', (event) => { event.preventDefault(); showHint(true); });
        pane.addEventListener('dragleave', (event) => { if (event.target === pane) showHint(false); });
        pane.addEventListener('drop', async (event) =>
        {
            event.preventDefault();
            showHint(false);
            for (const file of event.dataTransfer?.files ?? [])
            {
                try
                {
                    const object = await this.loader.load(file);
                    this.viewer.sceneManager.add(object);
                    this.viewer.fit();
                    this.editor.console.info(`Loaded "${file.name}"`);
                } catch (error)
                {
                    this.editor.console.error(`Failed to load "${file.name}": ${error.message}`);
                }
            }
        });
    }
}
