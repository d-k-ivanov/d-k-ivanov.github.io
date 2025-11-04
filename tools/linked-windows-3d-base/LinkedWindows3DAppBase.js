import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';

import WindowManager from './WindowManager.js';

/**
 * Main application class for the Linked Windows 3D visualization.
 * Encapsulates scene setup, rendering, and window management.
 */
class LinkedWindows3DAppBase
{
    constructor()
    {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.world = null;
        this.cubes = [];
        this.windowManager = null;
        this.initialized = false;
        this.sceneOffset = { x: 0, y: 0 };
        this.sceneOffsetTarget = { x: 0, y: 0 };
        this.pixR = Math.min(window.devicePixelRatio || 1, 2);
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);
        this.today = this.today.getTime();
    }

    /**
     * Returns time in seconds since the start of the day.
     */
    getTime()
    {
        return (Date.now() - this.today) / 1000.0;
    }

    /**
     * Initializes the application.
     */
    init()
    {
        if (this.initialized) return;
        this.initialized = true;
        setTimeout(() =>
        {
            this.setupScene();
            this.setupWindowManager();
            this.resize();
            this.updateWindowShape(false);
            this.render();
            window.addEventListener('resize', () => this.resize());
        }, 500);
    }

    /**
     * Sets up the Three.js scene, camera, renderer, and static objects.
     */
    setupScene()
    {
        this.camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10000, 10000);
        this.camera.position.z = 2.5;
        this.near = this.camera.position.z - 0.5;
        this.far = this.camera.position.z + 0.5;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0.0);

        this.scene.add(this.camera);

        // Star field using BufferGeometry
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++)
        {
            const x = Math.random() * 5000 - 2000;
            const y = Math.random() * 5000 - 2000;
            const z = Math.random() * 5000 - 2000;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const color = new THREE.Color();
            if (Math.random() < 0.5)
            {
                color.setHSL(0.16, 0.5, Math.random() * 0.5 + 0.25);
            } else
            {
                color.setHSL(0.0, 0.0, Math.random() * 0.5 + 0.5);
            }
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(starField);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, depth: true });
        this.renderer.setPixelRatio(this.pixR);

        this.world = new THREE.Object3D();
        this.scene.add(this.world);

        this.renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(this.renderer.domElement);

        // Lights
        const light = new THREE.AmbientLight(0x404040);
        this.scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, -1, -1);
        this.scene.add(directionalLight);
    }

    /**
     * Sets up the window manager and callbacks.
     */
    setupWindowManager()
    {
        this.windowManager = new WindowManager();
        this.windowManager.setWinShapeChangeCallback(this.updateWindowShape.bind(this));
        this.windowManager.setWinChangeCallback(this.windowsUpdated.bind(this));

        // here you can add your custom metadata to each windows instance
        let metaData = { foo: "bar" };

        // this will init the windowmanager and add this window to the centralised pool of windows
        this.windowManager.init(metaData);

        // call update windows initially (it will later be called by the win change callback)
        this.windowsUpdated();
    }

    /**
     * Updates the number of cubes based on the current windows.
     */
    windowsUpdated()
    {
        this.updateNumberOfCubes();
    }

    /**
     * Updates the number of cubes in the scene to match the number of windows.
     */
    updateNumberOfCubes()
    {
        let wins = this.windowManager.getWindows();

        this.cubes.forEach((c) =>
        {
            this.world.remove(c);
        })

        this.cubes = [];

        for (let i = 0; i < wins.length; i++)
        {
            let win = wins[i];

            let c;
            if (i == 0)
            {
                c = new THREE.Color('hsl(30, 100%, 40%)');
            } else if (i == 1)
            {
                c = new THREE.Color('hsl(350, 60%, 65%)');
            } else
            {
                let idBasedHueValue = (win.id % 10) / 10;
                let hue;
                if (idBasedHueValue < 0.5)
                {
                    hue = 240 - (idBasedHueValue * 2 * 60);
                } else
                {
                    hue = 360 - ((idBasedHueValue - 0.5) * 2 * 60);
                }
                c = new THREE.Color(`hsl(${hue}, 50%, 70%)`);
            }

            let s = 200 + i * 50;
            let radius = s / 2;

            let sphere = this.createComplexSphere(radius, c);
            sphere.position.x = win.shape.x + (win.shape.w * 0.5);
            sphere.position.y = win.shape.y + (win.shape.h * 0.5);

            this.world.add(sphere);
            this.cubes.push(sphere);
        }
    }

    /**
     * Creates a complex sphere mesh with multiple layers of particles and wireframe.
     * @param {number} radius - The radius of the outer sphere.
     * @param {THREE.Color} color - The color of the sphere.
     * @returns {THREE.Group} The complex sphere object.
     */
    createComplexSphere(radius, color)
    {
        let outerSize = radius;
        let outerColor = color;

        let complexSphere = new THREE.Group();

        let sphereWireframeOuter = new THREE.Mesh(
            new THREE.OctahedronGeometry(outerSize, 6),
            new THREE.MeshLambertMaterial({
                color: color,
                wireframe: true,
            })
        );
        complexSphere.add(sphereWireframeOuter);

        // main color inner dots
        let particlesOuter = this.createParticles(outerSize / .7, outerColor, 10000);
        complexSphere.add(particlesOuter);

        // second color inner dots
        let particlesOuter2 = this.createParticles(outerSize / 5, outerColor, 1500);
        complexSphere.add(particlesOuter2);

        // second color second inner dots
        let particlesOuter3 = this.createParticles(outerSize / 0.85, outerColor);
        complexSphere.add(particlesOuter3);

        // second color outer dots
        let particlesOuter4 = this.createSecondParticles(outerSize, outerColor, 20000)
        complexSphere.add(particlesOuter4);

        // main color outer dots
        let particlesOuter5 = this.createSecondParticles(outerSize, outerColor, 10000)
        complexSphere.add(particlesOuter5);

        return complexSphere;
    }

    /**
     * Creates a particle system using BufferGeometry for performance.
     * @param {number} size - The size factor for the particles.
     * @param {THREE.Color} color - The color of the particles.
     * @param {number} [n=6000] - The number of particles to create.
     * @returns {THREE.Points} The particle system object.
     */
    createParticles(size, color, n = 6000)
    {
        // Use BufferGeometry instead of deprecated Geometry
        const positions = new Float32Array(n * 3);
        for (let i = 0; i < n; i++)
        {
            let x = -1 + Math.random() * 2;
            let y = -1 + Math.random() * 2;
            let z = -1 + Math.random() * 2;
            let d = 1 / Math.sqrt(x * x + y * y + z * z);
            x *= d * (size + .8 * d / 1.5);
            y *= d * (size + .8 * d / 1.5);
            z *= d * (size + .8 * d / 1.5);
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 1.6,
            color: color,
            transparent: true
        });
        return new THREE.Points(geometry, material);
    }

    /**
     * Creates a second layer of particles with a different distribution and size.
     * @param {number} size - The size factor for the particles.
     * @param {THREE.Color} color - The color of the particles.
     * @param {number} [n=5000] - The number of particles to create.
     * @returns {THREE.Points} The particle system object.
     */
    createSecondParticles(size, color, n = 5000)
    {
        // Use BufferGeometry instead of deprecated Geometry
        const positions = new Float32Array(n * 3);
        for (let i = 0; i < n; i++)
        {
            let x = -1 + Math.random() * 2;
            let y = -1 + Math.random() * 2;
            let z = -1 + Math.random() * 2;
            let d = 1 / Math.sqrt(x * x + y * y + z * z);
            x *= (d + (size / 0.8 + d / 0.5)) * 1.3;
            y *= (d + (size / 0.8 + d / 0.5)) * 1.3;
            z *= (d + (size / 0.8 + d / 0.5)) * 1.3;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            size: 1.4,
            color: color,
            transparent: true
        });
        return new THREE.Points(geometry, material);
    }

    /**
     * Updates the window shape and position based on the current window state.
     * @param {boolean} [easing=true] - Whether to apply easing to the position update.
     */
    updateWindowShape(easing = true)
    {
        // storing the actual offset in a proxy that we update against in the render function
        this.sceneOffsetTarget = {
            x: -window.screenX,
            y: -window.screenY
        };

        if (!easing)
        {
            this.sceneOffset = this.sceneOffsetTarget;
        }
    }

    /**
     * Main render loop.
     */
    render()
    {
        let t = this.getTime();

        this.windowManager.update();

        // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
        let falloff = .05;
        this.sceneOffset.x = this.sceneOffset.x + ((this.sceneOffsetTarget.x - this.sceneOffset.x) * falloff);
        this.sceneOffset.y = this.sceneOffset.y + ((this.sceneOffsetTarget.y - this.sceneOffset.y) * falloff);

        // set the world position to the offset
        this.world.position.x = this.sceneOffset.x;
        this.world.position.y = this.sceneOffset.y;

        let wins = this.windowManager.getWindows();

        // loop through all our cubes and update their positions based on current window positions
        for (let i = 0; i < this.cubes.length; i++)
        {
            let complexSphere = this.cubes[i];
            let win = wins[i];

            // Skip if win or win.shape is undefined
            if (!win || !win.shape) continue;

            let _t = t;

            let posTarget = {
                x: win.shape.x + (win.shape.w * 0.5),
                y: win.shape.y + (win.shape.h * 0.5)
            }

            complexSphere.position.x = complexSphere.position.x + (posTarget.x - complexSphere.position.x) * falloff;
            complexSphere.position.y = complexSphere.position.y + (posTarget.y - complexSphere.position.y) * falloff;

            complexSphere.rotation.x = _t * 1.1;
            complexSphere.rotation.y = _t * 1.1;
            this.updateComplexSphere(complexSphere, t, i);
        };

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.render());
    }

    /**
     * Updates the complex sphere's rotation and color based on time and index.
     * @param {THREE.Group} complexSphere - The complex sphere object to update.
     * @param {number} elapsedTime - The elapsed time since the start of the animation.
     * @param {number} index - The index of the sphere in the cubes array.
     */
    updateComplexSphere(complexSphere, elapsedTime, index)
    {
        let sphereWireframeOuter = complexSphere.children[0];
        let particlesOuter = complexSphere.children[1];
        let particlesOuter5 = complexSphere.children[5];

        sphereWireframeOuter.rotation.x += 0.001;
        sphereWireframeOuter.rotation.z += 0.001;

        particlesOuter.rotation.y += 0.0005;

        index += 2
        let r = index * .31;

        sphereWireframeOuter.material.color.setHSL(r, 1, 0.5);
        particlesOuter.material.color.setHSL(r, 1.0, 0.5);
        particlesOuter5.material.color.setHSL(r, 1.0, 0.5);
    }

    // resize the renderer to fit the window size
    /**
     * Resizes the renderer and camera to fit the current window size.
     */
    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight

        this.camera = new THREE.OrthographicCamera(0, width, 0, height, -10000, 10000);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// Entry point
const app = new LinkedWindows3DAppBase();
window.onload = () => app.init();
document.addEventListener("visibilitychange", () =>
{
    if (document.visibilityState !== 'hidden') app.init();
});
