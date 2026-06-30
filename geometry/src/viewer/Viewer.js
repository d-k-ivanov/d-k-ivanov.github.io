"use strict";
import { THREE, OrbitControls } from '../vendor/Three.js';
import { SceneManager } from './SceneManager.js';

// Owns the Three.js rendering stack: renderer, scene, camera, controls, lighting,
// reference helpers (grid/axes) and the animation loop. User-authored content is
// kept in a separate group exposed through `sceneManager`.

export class Viewer
{
    constructor(container)
    {
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x15151a);

        this.camera = new THREE.PerspectiveCamera(55, 1, 0.01, 10000);
        this.camera.position.set(6, 5, 8);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.domElement.className = 'cgs-canvas';
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;

        this._buildInfrastructure();

        // User content lives in its own group so it can be cleared independently of
        // the lights/grid/axes added above.
        this.contentGroup = new THREE.Group();
        this.scene.add(this.contentGroup);
        this.sceneManager = new SceneManager(this.contentGroup);

        // Keep the canvas in sync with its container size (robust when embedded).
        this._resizeObserver = new ResizeObserver(() => this.resize());
        this._resizeObserver.observe(container);
        this.resize();

        this._running = true;
        this._animate = this._animate.bind(this);
        this._animate();
    }

    _buildInfrastructure()
    {
        const hemisphere = new THREE.HemisphereLight(0xffffff, 0x303040, 1.2);
        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(5, 10, 7);
        this.scene.add(hemisphere, key);

        this.grid = new THREE.GridHelper(20, 20, 0x444455, 0x2a2a33);
        this.axes = new THREE.AxesHelper(2.5);
        this.scene.add(this.grid, this.axes);
    }

    /** Toggle the reference grid + axes. */
    setHelpers(visible)
    {
        this.grid.visible = visible;
        this.axes.visible = visible;
    }

    resize()
    {
        const width = this.container.clientWidth || 1;
        const height = this.container.clientHeight || 1;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    /** Frame the camera so all user content fits in view. */
    fit() { this.sceneManager.fit(this.camera, this.controls); }

    _animate()
    {
        if (!this._running)
        {
            return;
        }

        requestAnimationFrame(this._animate);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose()
    {
        this._running = false;
        this._resizeObserver.disconnect();
        this.controls.dispose();
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
