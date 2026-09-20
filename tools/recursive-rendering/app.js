import * as THREE from 'three';
import { CameraController } from './camera-controller.js';
import { ModelLoaderFactory } from './model-loader.js';
import { CompositeModelViewRow, ModelViewRow } from './model-view-row.js';

const VIEW_BACKGROUND = new THREE.Color(0xf8f7f2);
const DEFAULT_GRID_ROWS = 2;
const DEFAULT_GRID_COLUMNS = 4;
const MAX_GRID_SIZE = 4;
const MODEL_LOAD_IDLE_MS = 300;

class RecursiveRenderingApp
{
    constructor()
    {
        this.canvas = document.getElementById('render-canvas');
        this.folderButton = document.getElementById('folder-button');
        this.folderInput = document.getElementById('folder-input');
        this.modelsElement = document.getElementById('models');
        this.statusElement = document.getElementById('status');
        this.rowCountSelect = document.getElementById('row-count');
        this.columnCountSelect = document.getElementById('column-count');
        this.compositeModeInput = document.getElementById('composite-mode');

        this.requestRender = this.requestRender.bind(this);
        this.handleGridChange = this.handleGridChange.bind(this);
        this.handleCompositeModeChange = this.handleCompositeModeChange.bind(this);
        this.modelLoader = new ModelLoaderFactory();
        this.cameraController = new CameraController(this.requestRender);
        this.modelFiles = [];
        this.modelGroups = [];
        this.rows = [];
        this.loadQueue = [];
        this.processingQueue = false;
        this.currentIndex = -1;
        this.loadTimer = null;
        this.wheelDelta = 0;
        this.totalModelCount = 0;
        this.ignoredFileCount = 0;
        this.loadRequest = 0;
        this.frameRequest = null;
        this.renderWidth = 0;
        this.renderHeight = 0;
        this.pixelRatio = 0;
        this.gridRows = DEFAULT_GRID_ROWS;
        this.gridColumns = DEFAULT_GRID_COLUMNS;

        this.handleModelWheel = this.handleModelWheel.bind(this);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.autoClear = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
    }

    start()
    {
        this.folderButton.addEventListener('click', () => this.folderInput.click());
        this.folderInput.addEventListener('change', () => this.loadFolder(this.folderInput.files));
        this.rowCountSelect.addEventListener('change', this.handleGridChange);
        this.columnCountSelect.addEventListener('change', this.handleGridChange);
        this.compositeModeInput.addEventListener('change', this.handleCompositeModeChange);
        window.addEventListener('wheel', this.handleModelWheel, { capture: true, passive: false });
        window.addEventListener('resize', this.requestRender);
        window.addEventListener('scroll', this.requestRender, { capture: true, passive: true });
        this.applyGridSize();
        this.requestRender();
    }

    get activeViewCount()
    {
        return this.gridRows * this.gridColumns;
    }

    get viewItemCount()
    {
        return this.compositeModeInput.checked ? this.modelGroups.length : this.modelFiles.length;
    }

    get lastPageStartIndex()
    {
        return Math.max(0, Math.floor((this.viewItemCount - 1) / this.activeViewCount) * this.activeViewCount);
    }

    handleGridChange()
    {
        this.gridRows = this.readGridSize(this.rowCountSelect, DEFAULT_GRID_ROWS);
        this.gridColumns = this.readGridSize(this.columnCountSelect, DEFAULT_GRID_COLUMNS);
        this.applyGridSize();

        if (this.currentIndex >= 0)
        {
            this.currentIndex = Math.min(
                Math.floor(this.currentIndex / this.activeViewCount) * this.activeViewCount,
                this.lastPageStartIndex
            );
            this.updateActiveRows();
        }
    }

    readGridSize(select, defaultSize)
    {
        const size = Number.parseInt(select.value, 10);
        return THREE.MathUtils.clamp(size || defaultSize, 1, MAX_GRID_SIZE);
    }

    applyGridSize()
    {
        this.rowCountSelect.value = String(this.gridRows);
        this.columnCountSelect.value = String(this.gridColumns);
        this.modelsElement.style.setProperty('--view-rows', String(this.gridRows));
        this.modelsElement.style.setProperty('--view-columns', String(this.gridColumns));
    }

    handleCompositeModeChange()
    {
        this.applyGridSize();

        if (this.modelFiles.length === 0)
        {
            return;
        }

        const request = ++this.loadRequest;
        this.clearViewRows();
        this.currentIndex = 0;
        this.updateActiveRows(request);
    }

    loadFolder(fileList)
    {
        const request = ++this.loadRequest;
        const allFiles = Array.from(fileList ?? []);
        const modelFiles = allFiles
            .filter(ModelLoaderFactory.isSupported)
            .sort((left, right) => this.pathOf(left).localeCompare(this.pathOf(right), undefined, {
                numeric: true,
                sensitivity: 'base'
            }));

        this.folderInput.value = '';
        this.clearRows();

        if (modelFiles.length === 0)
        {
            this.modelsElement.innerHTML = '<p class="empty-state">No supported models found</p>';
            this.statusElement.textContent = '0 models';
            return;
        }

        this.modelsElement.replaceChildren();
        this.modelFiles = modelFiles;
        this.modelGroups = this.groupModelsByFolder(modelFiles);
        this.currentIndex = 0;
        this.totalModelCount = modelFiles.length;
        this.ignoredFileCount = allFiles.length - modelFiles.length;
        this.statusElement.textContent = `Preparing ${modelFiles.length} models`;
        this.updateActiveRows(request);
    }

    updateActiveRows(request = this.loadRequest)
    {
        if (request !== this.loadRequest)
        {
            return;
        }

        const desiredIndices = Array.from({ length: this.activeViewCount }, (_, offset) =>
            this.currentIndex + offset).filter((index) => index < this.viewItemCount);
        const desiredIndexSet = new Set(desiredIndices);
        const existingRows = new Map(this.rows.map((row) => [row.modelIndex, row]));

        for (const row of this.rows)
        {
            if (!desiredIndexSet.has(row.modelIndex))
            {
                row.dispose();
            }
        }

        this.rows = desiredIndices.map((index) =>
        {
            if (this.compositeModeInput.checked)
            {
                const group = this.modelGroups[index];
                return existingRows.get(index) ?? new CompositeModelViewRow(
                    `${group.path} (${group.files.length} ${group.files.length === 1 ? 'model' : 'models'})`,
                    group.files,
                    index
                );
            }

            const file = this.modelFiles[index];
            return existingRows.get(index) ?? new ModelViewRow(this.pathOf(file), file, index);
        });

        for (const { row } of this.loadQueue)
        {
            row.queued = false;
        }

        this.loadQueue = [];
        this.modelsElement.replaceChildren(...this.rows.map((row) => row.element));

        this.renderer.renderLists.dispose();
        this.updateStatus();
        this.requestRender();
        this.scheduleVisibleLoads(request);
    }

    groupModelsByFolder(files)
    {
        const groups = new Map();

        for (const file of files)
        {
            const relativePath = (file.webkitRelativePath || file.name).replaceAll('\\', '/');
            const separatorIndex = relativePath.lastIndexOf('/');
            const folderPath = separatorIndex >= 0 ? relativePath.slice(0, separatorIndex) : 'Selected models';

            if (!groups.has(folderPath))
            {
                groups.set(folderPath, []);
            }

            groups.get(folderPath).push(file);
        }

        return Array.from(groups, ([path, groupFiles]) => ({ path, files: groupFiles }));
    }

    scheduleVisibleLoads(request = this.loadRequest)
    {
        clearTimeout(this.loadTimer);
        this.loadTimer = setTimeout(() =>
        {
            this.loadTimer = null;
            this.wheelDelta = 0;

            if (request !== this.loadRequest)
            {
                return;
            }

            for (const row of this.rows)
            {
                this.enqueueRow(row, request);
            }
        }, MODEL_LOAD_IDLE_MS);
    }

    handleModelWheel(event)
    {
        if (this.currentIndex < 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX))
        {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
            event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? this.modelsElement.clientHeight : 1;
        const delta = event.deltaY * deltaScale;
        const overViewport = event.target instanceof Element && event.target.closest('.model-viewport');

        if (!event.ctrlKey && overViewport)
        {
            this.cameraController.zoomByWheel(delta);
            this.wheelDelta = 0;
            return;
        }

        this.wheelDelta += delta;
        this.scheduleVisibleLoads();

        if (Math.abs(this.wheelDelta) < 24)
        {
            return;
        }

        this.navigateTo(this.currentIndex + Math.sign(this.wheelDelta) * this.activeViewCount);
        this.wheelDelta = 0;
    }

    navigateTo(index)
    {
        const nextIndex = THREE.MathUtils.clamp(index, 0, this.lastPageStartIndex);

        if (nextIndex === this.currentIndex)
        {
            return;
        }

        this.currentIndex = nextIndex;
        this.updateActiveRows();
    }

    enqueueRow(row, request)
    {
        row.requested = true;

        if (row.ready || row.loading || row.queued || row.failed)
        {
            return;
        }

        row.queued = true;
        row.setLoadState('Queued');
        this.loadQueue.push({ row, request });
        this.processLoadQueue();
    }

    async processLoadQueue()
    {
        if (this.processingQueue)
        {
            return;
        }

        this.processingQueue = true;

        try
        {
            while (this.loadQueue.length > 0)
            {
                const { row, request } = this.loadQueue.shift();
                row.queued = false;

                if (request !== this.loadRequest || !row.requested || row.ready || row.failed)
                {
                    continue;
                }

                try
                {
                    await row.load(this.modelLoader, this.cameraController);
                }
                catch (error)
                {
                    if (row.requested && request === this.loadRequest)
                    {
                        row.setError(error);
                        console.error(`Could not load ${row.modelPath}`, error);
                    }
                }

                this.updateStatus();
                this.requestRender();
            }
        }
        finally
        {
            this.processingQueue = false;

            if (this.loadQueue.length > 0)
            {
                this.processLoadQueue();
            }
        }
    }

    updateStatus()
    {
        const loadingCount = this.rows.filter((row) => row.loading || row.queued).length;
        const failedCount = this.rows.reduce((count, row) =>
            count + Math.max(row.failureCount ?? 0, Number(row.failed)), 0);
        const firstNumber = this.currentIndex >= 0 ? this.currentIndex + 1 : 0;
        const lastNumber = Math.min(this.currentIndex + this.activeViewCount, this.viewItemCount);
        const range = firstNumber === lastNumber ? `${firstNumber}` : `${firstNumber}-${lastNumber}`;
        const parts = [this.compositeModeInput.checked ?
            `${range} of ${this.modelGroups.length} folders / ${this.totalModelCount} models` :
            `${range} of ${this.totalModelCount}`];

        if (loadingCount > 0)
        {
            parts.push(`${loadingCount} loading`);
        }

        if (failedCount > 0)
        {
            parts.push(`${failedCount} failed`);
        }

        if (this.ignoredFileCount > 0)
        {
            parts.push(`${this.ignoredFileCount} other ${this.ignoredFileCount === 1 ? 'file' : 'files'} ignored`);
        }

        this.statusElement.textContent = parts.join(' / ');
    }

    pathOf(file)
    {
        return file.webkitRelativePath || file.name;
    }

    clearRows()
    {
        this.clearViewRows();
        this.modelFiles = [];
        this.modelGroups = [];
        this.currentIndex = -1;
        this.totalModelCount = 0;
        this.ignoredFileCount = 0;
    }

    clearViewRows()
    {
        clearTimeout(this.loadTimer);
        this.loadTimer = null;
        this.wheelDelta = 0;
        this.loadQueue = [];

        for (const row of this.rows)
        {
            row.dispose();
        }

        this.rows = [];
        this.cameraController.reset();
        this.renderer.renderLists.dispose();
        this.modelsElement.replaceChildren();
        this.requestRender();
    }

    requestRender()
    {
        if (this.frameRequest !== null)
        {
            return;
        }

        this.frameRequest = window.requestAnimationFrame(() =>
        {
            this.frameRequest = null;
            this.render();
        });
    }

    resizeRenderer()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        if (width !== this.renderWidth || height !== this.renderHeight || pixelRatio !== this.pixelRatio)
        {
            this.renderWidth = width;
            this.renderHeight = height;
            this.pixelRatio = pixelRatio;
            this.renderer.setPixelRatio(pixelRatio);
            this.renderer.setSize(width, height, false);
        }
    }

    render()
    {
        this.resizeRenderer();

        const width = this.renderWidth;
        const height = this.renderHeight;
        this.renderer.setScissorTest(false);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.clear(true, true, true);
        this.renderer.setScissorTest(true);

        for (const row of this.rows)
        {
            if (!row.ready)
            {
                continue;
            }

            const rect = row.viewport.getBoundingClientRect();
            const left = Math.max(0, rect.left);
            const right = Math.min(width, rect.right);
            const top = Math.max(0, rect.top);
            const bottom = Math.min(height, rect.bottom);

            if (right <= left || bottom <= top || rect.width <= 0 || rect.height <= 0)
            {
                continue;
            }

            row.configureCamera(rect.width / rect.height);
            this.renderer.setViewport(rect.left, height - rect.bottom, rect.width, rect.height);
            this.renderer.setScissor(left, height - bottom, right - left, bottom - top);
            this.renderer.setClearColor(VIEW_BACKGROUND, 1);
            this.renderer.clear(true, true, true);
            this.renderer.render(row.scene, row.camera);
        }

        this.renderer.setScissorTest(false);
    }
}

try
{
    new RecursiveRenderingApp().start();
}
catch (error)
{
    const status = document.getElementById('status');
    status.textContent = 'WebGL is unavailable';
    console.error('Could not start the recursive model renderer.', error);
}