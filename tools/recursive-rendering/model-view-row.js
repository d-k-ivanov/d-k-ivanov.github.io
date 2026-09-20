import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CAMERA_ZOOM_LIMITS } from './camera-controller.js';
import { disposeObject, normalizeModel } from './model-geometry.js';

const CAMERA_FRAME = 1.3;

export class ModelViewRow
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
        this.handlePointerMove = () => this.controls?.update();
        this.handlePointerUp = () => this.finishPointerInteraction();
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

        this.controls = new TrackballControls(this.camera, this.viewport);
        this.controls.staticMoving = true;
        this.controls.noZoom = true;
        this.controls.minZoom = CAMERA_ZOOM_LIMITS.min;
        this.controls.maxZoom = CAMERA_ZOOM_LIMITS.max;
        this.controls.multiTouchRoll = true;

        this.handleControlStart = () => this.viewport.classList.add('is-interacting');
        this.handleControlEnd = () => this.viewport.classList.remove('is-interacting');
        this.handlePointerDown = () =>
        {
            this.viewport.focus({ preventScroll: true });
            document.addEventListener('pointermove', this.handlePointerMove);
            document.addEventListener('pointerup', this.handlePointerUp);
            document.addEventListener('pointercancel', this.handlePointerUp);
        };
        this.controls.addEventListener('start', this.handleControlStart);
        this.controls.addEventListener('end', this.handleControlEnd);
        this.viewport.addEventListener('pointerdown', this.handlePointerDown);

        this.unregisterCamera = cameraController.register(this.camera, this.controls);

        if (this.modelRoot)
        {
            this.scene.add(this.modelRoot);
        }
    }

    finishPointerInteraction()
    {
        this.controls?.update();
        document.removeEventListener('pointermove', this.handlePointerMove);
        document.removeEventListener('pointerup', this.handlePointerUp);
        document.removeEventListener('pointercancel', this.handlePointerUp);
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
        this.controls?.handleResize();
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
        this.viewport.removeEventListener('pointerdown', this.handlePointerDown);
        this.finishPointerInteraction();
        this.controls.dispose();
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

export class CompositeModelViewRow extends ModelViewRow
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