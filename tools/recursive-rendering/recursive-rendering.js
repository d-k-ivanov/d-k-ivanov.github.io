import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { VOXLoader, buildMesh } from 'three/addons/loaders/VOXLoader.js';

const THREE_CDN_ROOT = 'https://cdn.jsdelivr.net/npm/three@0.186.0';
const SUPPORTED_EXTENSIONS = new Set(['stl', 'drc', 'draco', 'ply', 'vox', 'obj']);
const VIEW_BACKGROUND = new THREE.Color(0xf8f7f2);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_MODEL_COLOR = 0xc95a3b;
const DEFAULT_GRID_ROWS = 2;
const DEFAULT_GRID_COLUMNS = 4;
const MAX_GRID_SIZE = 4;
const MODEL_SIZE = 2;
const CAMERA_FRAME = 1.3;
const MODEL_LOAD_IDLE_MS = 300;
const MIN_CAMERA_ZOOM = 0.25;
const MAX_CAMERA_ZOOM = 8;
const WHEEL_ZOOM_SENSITIVITY = 0.002;
const MIN_UP_COHERENCE = 0.05;
const MIN_VISIBLE_COLOR = 0.03;
const MAX_COLOR_SAMPLES = 4096;

class ModelLoaderFactory
{
    constructor()
    {
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath(`${THREE_CDN_ROOT}/examples/jsm/libs/draco/`);

        this.stlLoader = new STLLoader();
        this.plyLoader = new PLYLoader();
        this.voxLoader = new VOXLoader();
        this.objLoader = new OBJLoader();

        this.loaders = new Map([
            ['stl', async (file) => this.createSurface(this.stlLoader.parse(await file.arrayBuffer()))],
            ['drc', async (file) => this.createDracoObject(await this.loadFromObjectUrl(file, this.dracoLoader))],
            ['draco', async (file) => this.createDracoObject(await this.loadFromObjectUrl(file, this.dracoLoader))],
            ['ply', async (file) => this.createPlyObject(this.plyLoader.parse(await file.arrayBuffer()))],
            ['vox', async (file) => this.createVoxObject(this.voxLoader.parse(await file.arrayBuffer()))],
            ['obj', async (file) => this.objLoader.parse(await file.text())]
        ]);
    }

    static extensionOf(file)
    {
        return file.name.split('.').pop()?.toLowerCase() ?? '';
    }

    static isSupported(file)
    {
        return SUPPORTED_EXTENSIONS.has(ModelLoaderFactory.extensionOf(file));
    }

    async load(file)
    {
        const extension = ModelLoaderFactory.extensionOf(file);
        const loadModel = this.loaders.get(extension);

        if (!loadModel)
        {
            throw new Error(`Unsupported model format: .${extension}`);
        }

        const object = await loadModel(file);
        ensureVisibleAppearance(object);
        return object;
    }

    async loadFromObjectUrl(file, loader)
    {
        const objectUrl = URL.createObjectURL(file);

        try
        {
            return await loader.loadAsync(objectUrl);
        }
        finally
        {
            URL.revokeObjectURL(objectUrl);
        }
    }

    createSurface(geometry)
    {
        ensureUsableNormals(geometry);

        const vertexColors = hasVisibleVertexColors(geometry);

        if (!vertexColors)
        {
            geometry.deleteAttribute('color');
        }

        const material = new THREE.MeshStandardMaterial({
            color: vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR,
            metalness: 0.05,
            roughness: 0.68,
            side: THREE.DoubleSide,
            vertexColors
        });

        return new THREE.Mesh(geometry, material);
    }

    createPointCloud(geometry)
    {
        const vertexColors = hasVisibleVertexColors(geometry);

        if (!vertexColors)
        {
            geometry.deleteAttribute('color');
        }

        const material = new THREE.PointsMaterial({
            color: vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR,
            size: 0.035,
            sizeAttenuation: true,
            vertexColors
        });

        return new THREE.Points(geometry, material);
    }

    createDracoObject(geometry)
    {
        return geometry.index ? this.createSurface(geometry) : this.createPointCloud(geometry);
    }

    createPlyObject(geometry)
    {
        return geometry.index ? this.createSurface(geometry) : this.createPointCloud(geometry);
    }

    createVoxObject(result)
    {
        if (result.scene)
        {
            return result.scene;
        }

        const group = new THREE.Group();

        for (const chunk of result.chunks)
        {
            group.add(buildMesh(chunk));
        }

        return group;
    }

    dispose()
    {
        this.dracoLoader.dispose();
    }
}

class SynchronizedCameraController
{
    constructor(requestRender)
    {
        this.requestRender = requestRender;
        this.entries = new Set();
        this.state = null;
        this.synchronizing = false;
    }

    register(camera, controls)
    {
        const entry = {
            camera,
            controls,
            handleChange: () => this.synchronizeFrom(camera, controls)
        };

        this.entries.add(entry);

        if (this.state)
        {
            this.applyState(entry);
        }
        else
        {
            this.captureState(camera, controls);
        }

        controls.addEventListener('change', entry.handleChange);
        this.requestRender();

        return () =>
        {
            controls.removeEventListener('change', entry.handleChange);
            this.entries.delete(entry);
        };
    }

    synchronizeFrom(camera, controls)
    {
        if (this.synchronizing)
        {
            return;
        }

        this.synchronizing = true;

        try
        {
            this.captureState(camera, controls);

            for (const entry of this.entries)
            {
                if (entry.camera !== camera)
                {
                    this.applyState(entry);
                }
            }
        }
        finally
        {
            this.synchronizing = false;
        }

        this.requestRender();
    }

    captureState(camera, controls)
    {
        this.state = {
            position: camera.position.clone(),
            quaternion: camera.quaternion.clone(),
            up: camera.up.clone(),
            target: controls.target.clone(),
            zoom: camera.zoom
        };
    }

    applyState({ camera, controls })
    {
        camera.position.copy(this.state.position);
        camera.quaternion.copy(this.state.quaternion);
        camera.up.copy(this.state.up);
        camera.zoom = this.state.zoom;
        controls.target.copy(this.state.target);
        camera.updateProjectionMatrix();
        controls.update();
    }

    zoomByWheel(delta)
    {
        if (!this.state || delta === 0)
        {
            return;
        }

        const zoom = THREE.MathUtils.clamp(
            this.state.zoom * Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY),
            MIN_CAMERA_ZOOM,
            MAX_CAMERA_ZOOM
        );

        if (zoom === this.state.zoom)
        {
            return;
        }

        this.state.zoom = zoom;

        for (const { camera } of this.entries)
        {
            camera.zoom = zoom;
            camera.updateProjectionMatrix();
        }

        this.requestRender();
    }

    reset()
    {
        this.state = null;
    }
}

class ModelViewRow
{
    constructor(modelPath, file, modelIndex)
    {
        this.modelPath = modelPath;
        this.file = file;
        this.modelIndex = modelIndex;
        this.loadState = 'Waiting';
        this.modelRoot = null;
        this.ready = false;
        this.loading = false;
        this.queued = false;
        this.requested = false;
        this.failed = false;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.unregisterCamera = null;
        this.element = document.createElement('article');
        this.element.className = 'model-row';

        const header = document.createElement('header');
        header.className = 'model-header';

        const title = document.createElement('h2');
        title.className = 'model-title';
        title.textContent = modelPath;
        title.title = modelPath;

        this.state = document.createElement('span');
        this.state.className = 'model-state';
        this.state.textContent = this.loadState;

        header.append(title, this.state);

        this.viewport = document.createElement('div');
        this.viewport.className = 'model-viewport';
        this.viewport.tabIndex = 0;
        this.viewport.setAttribute('role', 'region');
        this.viewport.setAttribute('aria-label', `${modelPath}, interactive 3D viewport`);

        this.element.append(header, this.viewport);
    }

    setLoadState(loadState)
    {
        this.loadState = loadState;
        this.state.textContent = loadState;
    }

    initializeViewport(cameraController)
    {
        if (this.controls)
        {
            return;
        }

        this.scene = this.createScene();

        this.camera = new THREE.OrthographicCamera(-CAMERA_FRAME, CAMERA_FRAME, CAMERA_FRAME, -CAMERA_FRAME, 0.1, 100);
        this.camera.position.set(0, 0, 4);
        this.camera.lookAt(0, 0, 0);
        this.addCameraLights();
        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, this.viewport);
        this.controls.enableDamping = false;
        this.controls.enableZoom = false;
        this.controls.minZoom = MIN_CAMERA_ZOOM;
        this.controls.maxZoom = MAX_CAMERA_ZOOM;
        this.controls.screenSpacePanning = true;
        this.controls.zoomToCursor = true;
        this.controls.listenToKeyEvents(this.viewport);

        this.handleControlStart = () => this.viewport.classList.add('is-interacting');
        this.handleControlEnd = () => this.viewport.classList.remove('is-interacting');
        this.handlePointerDown = () => this.viewport.focus({ preventScroll: true });
        this.controls.addEventListener('start', this.handleControlStart);
        this.controls.addEventListener('end', this.handleControlEnd);
        this.viewport.addEventListener('pointerdown', this.handlePointerDown);

        this.unregisterCamera = cameraController.register(this.camera, this.controls);

        if (this.modelRoot)
        {
            this.scene.add(this.modelRoot);
        }
    }

    createScene()
    {
        const scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xfffbec, 0x53665f, 2.1));

        return scene;
    }

    addCameraLights()
    {
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
        keyLight.position.set(3, 4, 5);
        keyLight.target.position.set(0, 0, -1);
        this.camera.add(keyLight, keyLight.target);

        const fillLight = new THREE.DirectionalLight(0x8db7b0, 1.2);
        fillLight.position.set(-4, -1, -3);
        fillLight.target.position.set(0, 0, -1);
        this.camera.add(fillLight, fillLight.target);
    }

    setModel(object)
    {
        this.modelRoot = normalizeModel(object);
        this.ready = true;
        this.element.classList.add('is-ready');
        this.setLoadState('Ready');
    }

    async load(modelLoader, cameraController)
    {
        if (this.ready || this.loading || this.failed)
        {
            return false;
        }

        this.loading = true;
        this.setLoadState('Loading');
        let object = null;

        try
        {
            object = await this.loadObject(modelLoader);

            if (!this.requested)
            {
                disposeObject(object);
                this.setLoadState('Waiting');
                return false;
            }

            this.setModel(object);
            this.initializeViewport(cameraController);
            return true;
        }
        catch (error)
        {
            if (object && !this.modelRoot)
            {
                disposeObject(object);
            }

            this.releaseRuntime();

            if (!this.requested)
            {
                this.setLoadState('Waiting');
            }

            throw error;
        }
        finally
        {
            this.loading = false;
        }
    }

    loadObject(modelLoader)
    {
        return modelLoader.load(this.file);
    }

    setError(error)
    {
        this.failed = true;
        this.element.classList.add('is-error');
        this.setLoadState('Failed');
        this.viewport.hidden = true;

        const message = document.createElement('p');
        message.className = 'model-error';
        message.textContent = error instanceof Error ? error.message : String(error);
        this.element.append(message);
    }

    configureCamera(aspect)
    {
        if (aspect >= 1)
        {
            this.camera.left = -CAMERA_FRAME * aspect;
            this.camera.right = CAMERA_FRAME * aspect;
            this.camera.top = CAMERA_FRAME;
            this.camera.bottom = -CAMERA_FRAME;
        }
        else
        {
            this.camera.left = -CAMERA_FRAME;
            this.camera.right = CAMERA_FRAME;
            this.camera.top = CAMERA_FRAME / aspect;
            this.camera.bottom = -CAMERA_FRAME / aspect;
        }

        this.camera.updateProjectionMatrix();
    }

    release()
    {
        this.requested = false;
        this.queued = false;

        if (this.modelRoot)
        {
            disposeObject(this.modelRoot);
            this.modelRoot.parent?.remove(this.modelRoot);
            this.modelRoot = null;
        }

        this.releaseRuntime();
        this.ready = false;
        this.element.classList.remove('is-ready');

        if (!this.loading && !this.failed)
        {
            this.setLoadState('Waiting');
        }
    }

    releaseRuntime()
    {
        if (!this.controls)
        {
            return;
        }

        this.unregisterCamera?.();
        this.controls.removeEventListener('start', this.handleControlStart);
        this.controls.removeEventListener('end', this.handleControlEnd);
        this.controls.stopListenToKeyEvents();
        this.controls.dispose();
        this.viewport.removeEventListener('pointerdown', this.handlePointerDown);
        this.modelRoot?.parent?.remove(this.modelRoot);
        this.scene.remove(this.camera);

        this.unregisterCamera = null;
        this.controls = null;
        this.camera = null;
        this.scene = null;
    }

    dispose()
    {
        this.release();
        this.file = null;
    }
}

class CompositeModelViewRow extends ModelViewRow
{
    constructor(modelPath, files, modelIndex)
    {
        super(modelPath, null, modelIndex);
        this.files = [...files];
        this.failureCount = 0;
    }

    async loadObject(modelLoader)
    {
        const group = new THREE.Group();

        for (const [index, file] of this.files.entries())
        {
            if (!this.requested)
            {
                break;
            }

            this.setLoadState(`Loading ${index + 1} of ${this.files.length}`);

            try
            {
                const object = await modelLoader.load(file);

                if (!this.requested)
                {
                    disposeObject(object);
                    break;
                }

                group.add(object);
            }
            catch (error)
            {
                this.failureCount++;
                console.error(`Could not load ${file.webkitRelativePath || file.name}`, error);
            }
        }

        if (this.requested && group.children.length === 0)
        {
            throw new Error('None of the selected models could be loaded.');
        }

        return group;
    }

    setModel(object)
    {
        super.setModel(object);

        if (this.failureCount > 0)
        {
            this.setLoadState(`Ready / ${this.failureCount} failed`);
        }
    }

    dispose()
    {
        super.dispose();
        this.files = [];
    }
}

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
        this.cameraController = new SynchronizedCameraController(this.requestRender);
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

function normalizeModel(object)
{
    object.updateMatrixWorld(true);
    const modelUp = estimateModelUp(object);
    const normalized = new THREE.Group();
    normalized.add(object);

    if (modelUp)
    {
        normalized.quaternion.setFromUnitVectors(modelUp, WORLD_UP);
    }

    normalized.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(normalized);

    if (bounds.isEmpty())
    {
        throw new Error('The model contains no renderable geometry.');
    }

    const size = bounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(largestDimension) || largestDimension <= Number.EPSILON)
    {
        throw new Error('The model has invalid or zero-sized bounds.');
    }

    const center = bounds.getCenter(new THREE.Vector3());
    const scale = MODEL_SIZE / largestDimension;
    normalized.position.copy(center).multiplyScalar(-scale);
    normalized.scale.setScalar(scale);
    normalized.updateMatrixWorld(true);

    return normalized;
}

function estimateModelUp(object)
{
    const normalSum = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const vertexA = new THREE.Vector3();
    const vertexB = new THREE.Vector3();
    const vertexC = new THREE.Vector3();
    const edgeA = new THREE.Vector3();
    const edgeB = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();
    let faceCount = 0;

    // Each non-degenerate triangle gets one vote toward the model's natural up.
    object.traverse((child) =>
    {
        if (!child.isMesh)
        {
            return;
        }

        const positions = child.geometry?.getAttribute('position');

        if (!positions)
        {
            return;
        }

        const indices = child.geometry.index;
        const normals = child.geometry.getAttribute('normal');
        const elementCount = indices?.count ?? positions.count;
        normalMatrix.getNormalMatrix(child.matrixWorld);

        for (let offset = 0; offset + 2 < elementCount; offset += 3)
        {
            if (!indices && normals)
            {
                normal.fromBufferAttribute(normals, offset);
            }
            else
            {
                const indexA = indices ? indices.getX(offset) : offset;
                const indexB = indices ? indices.getX(offset + 1) : offset + 1;
                const indexC = indices ? indices.getX(offset + 2) : offset + 2;
                vertexA.fromBufferAttribute(positions, indexA);
                vertexB.fromBufferAttribute(positions, indexB);
                vertexC.fromBufferAttribute(positions, indexC);
                edgeA.subVectors(vertexB, vertexA);
                edgeB.subVectors(vertexC, vertexA);
                normal.crossVectors(edgeA, edgeB);
            }

            if (normal.lengthSq() <= Number.EPSILON)
            {
                continue;
            }

            normal.applyNormalMatrix(normalMatrix);
            normalSum.add(normal);
            faceCount++;
        }
    });

    if (faceCount === 0 || normalSum.length() / faceCount < MIN_UP_COHERENCE)
    {
        return null;
    }

    return normalSum.normalize();
}

function hasVisibleVertexColors(geometry)
{
    const colors = geometry?.getAttribute('color');

    if (!colors || colors.itemSize < 3)
    {
        return false;
    }

    const step = Math.max(1, Math.floor(colors.count / MAX_COLOR_SAMPLES));

    for (let index = 0; index < colors.count; index += step)
    {
        const brightestChannel = Math.max(colors.getX(index), colors.getY(index), colors.getZ(index));

        if (Number.isFinite(brightestChannel) && brightestChannel >= MIN_VISIBLE_COLOR)
        {
            return true;
        }
    }

    return false;
}

function ensureUsableNormals(geometry)
{
    const positions = geometry?.getAttribute('position');
    const normals = geometry?.getAttribute('normal');

    if (!positions)
    {
        return;
    }

    if (normals)
    {
        const step = Math.max(1, Math.floor(normals.count / MAX_COLOR_SAMPLES));

        for (let index = 0; index < normals.count; index += step)
        {
            const x = normals.getX(index);
            const y = normals.getY(index);
            const z = normals.getZ(index);

            if (Number.isFinite(x + y + z) && x * x + y * y + z * z > Number.EPSILON)
            {
                return;
            }
        }

        geometry.deleteAttribute('normal');
    }

    geometry.computeVertexNormals();
}

function ensureVisibleAppearance(object)
{
    object.traverse((child) =>
    {
        if ((!child.isMesh && !child.isPoints) || !child.material)
        {
            return;
        }

        const colorAttribute = child.geometry?.getAttribute('color');
        const vertexColors = hasVisibleVertexColors(child.geometry);

        if (child.isMesh)
        {
            ensureUsableNormals(child.geometry);
        }

        if (colorAttribute && !vertexColors)
        {
            child.geometry.deleteAttribute('color');
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];

        for (const material of materials)
        {
            material.vertexColors = vertexColors;

            if (material.color)
            {
                const isBlack = Math.max(material.color.r, material.color.g, material.color.b) < MIN_VISIBLE_COLOR;

                if (isBlack || (colorAttribute && !vertexColors))
                {
                    material.color.set(vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR);
                }
            }

            if (child.isMesh)
            {
                material.side = THREE.DoubleSide;
            }

            material.needsUpdate = true;
        }
    });
}

function disposeObject(object)
{
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    object.traverse((child) =>
    {
        if (child.geometry)
        {
            geometries.add(child.geometry);
        }

        const childMaterials = Array.isArray(child.material) ? child.material : [child.material];

        for (const material of childMaterials)
        {
            if (!material)
            {
                continue;
            }

            materials.add(material);

            for (const value of Object.values(material))
            {
                if (value?.isTexture)
                {
                    textures.add(value);
                }
            }
        }
    });

    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
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
