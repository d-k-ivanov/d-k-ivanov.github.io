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
const MODEL_SIZE = 2;
const CAMERA_FRAME = 1.3;

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
            ['stl', async (url) => this.createSurface(await this.stlLoader.loadAsync(url))],
            ['drc', async (url) => this.createDracoObject(await this.dracoLoader.loadAsync(url))],
            ['draco', async (url) => this.createDracoObject(await this.dracoLoader.loadAsync(url))],
            ['ply', async (url) => this.createPlyObject(await this.plyLoader.loadAsync(url))],
            ['vox', async (url) => this.createVoxObject(await this.voxLoader.loadAsync(url))],
            ['obj', async (url) => this.objLoader.loadAsync(url)]
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

        const objectUrl = URL.createObjectURL(file);

        try
        {
            return await loadModel(objectUrl);
        }
        finally
        {
            URL.revokeObjectURL(objectUrl);
        }
    }

    createSurface(geometry)
    {
        if (!geometry.hasAttribute('normal'))
        {
            geometry.computeVertexNormals();
        }

        const vertexColors = geometry.hasAttribute('color');
        const material = new THREE.MeshStandardMaterial({
            color: vertexColors ? 0xffffff : 0xc95a3b,
            metalness: 0.05,
            roughness: 0.68,
            side: THREE.DoubleSide,
            vertexColors
        });

        return new THREE.Mesh(geometry, material);
    }

    createPointCloud(geometry)
    {
        const vertexColors = geometry.hasAttribute('color');
        const material = new THREE.PointsMaterial({
            color: vertexColors ? 0xffffff : 0xc95a3b,
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

    reset()
    {
        this.state = null;
    }
}

class ModelViewRow
{
    constructor(modelPath, cameraController)
    {
        this.modelPath = modelPath;
        this.modelRoot = null;
        this.ready = false;
        this.scene = this.createScene();
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
        this.state.textContent = 'Loading';

        header.append(title, this.state);

        this.viewport = document.createElement('div');
        this.viewport.className = 'model-viewport';
        this.viewport.tabIndex = 0;
        this.viewport.setAttribute('role', 'region');
        this.viewport.setAttribute('aria-label', `${modelPath}, interactive 3D viewport`);

        this.camera = new THREE.OrthographicCamera(-CAMERA_FRAME, CAMERA_FRAME, CAMERA_FRAME, -CAMERA_FRAME, 0.1, 100);
        this.camera.position.set(0, 0, 4);
        this.camera.lookAt(0, 0, 0);
        this.addCameraLights();
        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, this.viewport);
        this.controls.enableDamping = false;
        this.controls.minZoom = 0.25;
        this.controls.maxZoom = 8;
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
        this.element.append(header, this.viewport);
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
        this.scene.add(this.modelRoot);
        this.ready = true;
        this.element.classList.add('is-ready');
        this.state.textContent = 'Ready';
    }

    setError(error)
    {
        this.element.classList.add('is-error');
        this.state.textContent = 'Failed';
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

    dispose()
    {
        this.unregisterCamera();
        this.controls.removeEventListener('start', this.handleControlStart);
        this.controls.removeEventListener('end', this.handleControlEnd);
        this.controls.stopListenToKeyEvents();
        this.controls.dispose();
        this.viewport.removeEventListener('pointerdown', this.handlePointerDown);

        if (this.modelRoot)
        {
            disposeObject(this.modelRoot);
            this.scene.remove(this.modelRoot);
            this.modelRoot = null;
        }
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

        this.requestRender = this.requestRender.bind(this);
        this.modelLoader = new ModelLoaderFactory();
        this.cameraController = new SynchronizedCameraController(this.requestRender);
        this.rows = [];
        this.loadRequest = 0;
        this.frameRequest = null;
        this.renderWidth = 0;
        this.renderHeight = 0;
        this.pixelRatio = 0;

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
        window.addEventListener('resize', this.requestRender);
        window.addEventListener('scroll', this.requestRender, { capture: true, passive: true });
        this.requestRender();
    }

    async loadFolder(fileList)
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
        let loadedCount = 0;
        let failedCount = 0;

        for (const [index, file] of modelFiles.entries())
        {
            if (request !== this.loadRequest)
            {
                return;
            }

            this.statusElement.textContent = `Loading ${index + 1} of ${modelFiles.length}`;
            const row = new ModelViewRow(this.pathOf(file), this.cameraController);
            this.rows.push(row);
            this.modelsElement.append(row.element);
            this.requestRender();

            try
            {
                const object = await this.modelLoader.load(file);

                if (request !== this.loadRequest)
                {
                    disposeObject(object);
                    return;
                }

                row.setModel(object);
                loadedCount++;
            }
            catch (error)
            {
                row.setError(error);
                failedCount++;
                console.error(`Could not load ${this.pathOf(file)}`, error);
            }

            this.requestRender();
        }

        const ignoredCount = allFiles.length - modelFiles.length;
        const parts = [`${loadedCount} ${loadedCount === 1 ? 'model' : 'models'}`];

        if (failedCount > 0)
        {
            parts.push(`${failedCount} failed`);
        }

        if (ignoredCount > 0)
        {
            parts.push(`${ignoredCount} other ${ignoredCount === 1 ? 'file' : 'files'} ignored`);
        }

        this.statusElement.textContent = parts.join(' / ');
    }

    pathOf(file)
    {
        return file.webkitRelativePath || file.name;
    }

    clearRows()
    {
        for (const row of this.rows)
        {
            row.dispose();
        }

        this.rows = [];
        this.cameraController.reset();
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
    const bounds = new THREE.Box3().setFromObject(object);

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
    const normalized = new THREE.Group();
    object.position.sub(center);
    normalized.add(object);
    normalized.scale.setScalar(MODEL_SIZE / largestDimension);
    normalized.updateMatrixWorld(true);

    return normalized;
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
