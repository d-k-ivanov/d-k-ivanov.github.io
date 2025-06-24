import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';
import WindowManager from './WindowManager.js';

/**
 * Main application class for the Linked Windows 3D visualization.
 * Features gravitational particle planets with constrained atmospheric physics.
 */
class LinkedWindows3DApp
{
    constructor()
    {
        // Core Three.js components
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.world = null;

        // Application state
        this.planets = [];
        this.windowManager = null;
        this.initialized = false;

        // Scene positioning
        this.sceneOffset = { x: 0, y: 0 };
        this.sceneOffsetTarget = { x: 0, y: 0 };

        // Performance settings
        this.pixR = Math.min(window.devicePixelRatio || 1, 2);
        this.lastFrameTime = 0;
        this.atmosphereConstraintStrength = 5.0;

        // Time reference for animations
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);

        // Bind event handlers once
        this.boundResizeHandler = this.resize.bind(this);
        this.boundContextLossHandler = this.handleContextLoss.bind(this);
    }

    /**
     * Returns time in seconds since start of day.
     */
    getTime()
    {
        return (Date.now() - this.today) / 1000.0;
    }

    /**
     * Creates optimized starfield background.
     */
    createStarfield()
    {
        const starCount = 6000; // Reduced from 8000
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++)
        {
            // Distribute stars in space
            positions[i * 3] = (Math.random() - 0.5) * 6000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 6000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6000;

            // Star color based on type
            const color = new THREE.Color();
            const starType = Math.random();

            if (starType < 0.3)
            {
                color.setHSL(0.6, 0.8, Math.random() * 0.5 + 0.5); // Blue-white
            } else if (starType < 0.6)
            {
                color.setHSL(0.1, 0.3, Math.random() * 0.4 + 0.6); // Yellow-white
            } else
            {
                color.setHSL(0.0, 0.6, Math.random() * 0.3 + 0.3); // Red
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        this.scene.add(new THREE.Points(geometry, material));
    }

    /**
     * Updates window shape and position for multi-window sync.
     */
    updateWindowShape(easing = true)
    {
        this.sceneOffsetTarget = {
            x: -window.screenX,
            y: -window.screenY
        };

        if (!easing)
        {
            this.sceneOffset = { ...this.sceneOffsetTarget };
        }

        // Only resize if dimensions changed
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (this.renderer &&
            (this.renderer.domElement.width !== width ||
                this.renderer.domElement.height !== height))
        {
            this.resize();
        }
    }

    /**
     * Optimized resize with validation.
     */
    resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (width <= 0 || height <= 0) return;

        // Update camera
        if (this.camera)
        {
            this.camera.left = 0;
            this.camera.right = width;
            this.camera.top = 0;
            this.camera.bottom = height;
            this.camera.updateProjectionMatrix();
        }

        // Update renderer
        if (this.renderer)
        {
            const newPixR = Math.min(window.devicePixelRatio || 1, 2);
            if (newPixR !== this.pixR)
            {
                this.pixR = newPixR;
                this.renderer.setPixelRatio(this.pixR);
            }
            this.renderer.setSize(width, height);
        }
    }

    /**
     * WebGL context loss recovery.
     */
    handleContextLoss()
    {
        console.warn('WebGL context lost, recovering...');
        this.initialized = false;
        this.dispose();
        setTimeout(() => this.init(), 1000);
    }

    /**
     * Setup Three.js scene.
     */
    setupScene()
    {
        // Camera setup
        this.camera = new THREE.OrthographicCamera(
            0, window.innerWidth, window.innerHeight, 0, -10000, 10000
        );
        this.camera.position.z = 2.5;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000a1a);
        this.scene.add(this.camera);

        // Enhanced starfield
        this.createStarfield();

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
        });

        this.renderer.setPixelRatio(this.pixR);
        this.renderer.sortObjects = false;

        // Event handlers
        this.renderer.domElement.addEventListener('webglcontextlost', this.boundContextLossHandler, false);

        // World container
        this.world = new THREE.Object3D();
        this.scene.add(this.world);

        // Add to DOM
        this.renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(this.renderer.domElement);

        // Lighting setup
        this.setupLighting();
    }

    /**
     * Optimized lighting setup.
     */
    setupLighting()
    {
        const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4a9eff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.4);
        rimLight.position.set(-100, -100, -50);
        this.scene.add(rimLight);
    }

    /**
     * Initialize application.
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
            window.addEventListener('resize', this.boundResizeHandler);
        }, 500);
    }

    /**
     * Optimized noise generation.
     */
    generateTurbulence(x, y, z, time)
    {
        let noise = 0;
        let amplitude = 1;
        let frequency = 1;

        // Reduced octaves from 4 to 3 for performance
        for (let i = 0; i < 3; i++)
        {
            noise += amplitude * this.simplexNoise(
                x * frequency + time,
                y * frequency + time * 0.7,
                z * frequency + time * 0.5
            );
            amplitude *= 0.5;
            frequency *= 2;
        }

        return noise;
    }

    /**
     * Simplified noise function.
     */
    simplexNoise(x, y, z)
    {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const zi = Math.floor(z);

        const xf = x - xi;
        const yf = y - yi;
        const zf = z - zi;

        const u = this.fade(xf);
        const v = this.fade(yf);
        const w = this.fade(zf);

        // Optimized hash calculations
        const aaa = this.hash(xi, yi, zi);
        const aba = this.hash(xi, yi + 1, zi);
        const aab = this.hash(xi, yi, zi + 1);
        const abb = this.hash(xi, yi + 1, zi + 1);
        const baa = this.hash(xi + 1, yi, zi);
        const bba = this.hash(xi + 1, yi + 1, zi);
        const bab = this.hash(xi + 1, yi, zi + 1);
        const bbb = this.hash(xi + 1, yi + 1, zi + 1);

        // Trilinear interpolation
        const x1 = this.lerp(aaa, baa, u);
        const x2 = this.lerp(aba, bba, u);
        const y1 = this.lerp(x1, x2, v);

        const x3 = this.lerp(aab, bab, u);
        const x4 = this.lerp(abb, bbb, u);
        const y2 = this.lerp(x3, x4, v);

        return this.lerp(y1, y2, w);
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(a, b, t) { return a + t * (b - a); }
    hash(x, y, z)
    {
        const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
        return 2 * (n - Math.floor(n)) - 1;
    }

    /**
     * Setup window manager.
     */
    setupWindowManager()
    {
        this.windowManager = new WindowManager();
        this.windowManager.setWinShapeChangeCallback(this.updateWindowShape.bind(this));
        this.windowManager.setWinChangeCallback(this.updatePlanets.bind(this));

        const metaData = {
            planetType: "liquid",
            atmosphereIntensity: Math.random() + 0.5
        };
        this.windowManager.init(metaData);
        this.updatePlanets();
    }

    /**
     * Update planets to match windows.
     */
    updatePlanets()
    {
        const wins = this.windowManager.getWindows();

        // Clean up existing planets
        this.planets.forEach(planet =>
        {
            this.world.remove(planet.group);
            this.disposePlanetResources(planet);
        });
        this.planets = [];

        // Create new planets
        wins.forEach((win, i) =>
        {
            const planetColor = this.generatePlanetColor(i, win.id);
            const radius = (300 + i * 50) / 2;
            const planet = this.createParticlePlanet(radius, planetColor, i);

            planet.group.position.x = win.shape.x + (win.shape.w * 0.5);
            planet.group.position.y = win.shape.y + (win.shape.h * 0.5);

            this.world.add(planet.group);
            this.planets.push(planet);
        });
    }

    /**
     * Generate unique planet colors.
     */
    generatePlanetColor(index, windowId)
    {
        const liquidColors = [
            { h: 0.55, s: 0.9, l: 0.6 }, // Cyan
            { h: 0.75, s: 0.8, l: 0.7 }, // Purple
            { h: 0.15, s: 0.9, l: 0.6 }, // Orange
            { h: 0.35, s: 0.8, l: 0.5 }, // Green
            { h: 0.95, s: 0.9, l: 0.6 }, // Magenta
            { h: 0.05, s: 1.0, l: 0.5 }  // Red
        ];

        const colorIndex = (index + windowId) % liquidColors.length;
        const colorData = liquidColors[colorIndex];

        return new THREE.Color().setHSL(
            colorData.h + (Math.random() - 0.5) * 0.1,
            colorData.s,
            colorData.l + (Math.random() - 0.5) * 0.2
        );
    }

    /**
     * Create optimized particle planet.
     */
    createParticlePlanet(radius, color, planetIndex)
    {
        const scaledRadius = radius * 1.4;
        const planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Reduced particle counts for better performance
        const coreParticles = this.createPlanetCore(scaledRadius * 0.15, color, 800);
        planetGroup.add(coreParticles);

        // Multi-layered atmosphere with fewer particles
        const innerAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.6, color, 2000, 0.7);
        const middleAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.85, color, 1500, 0.5);
        const outerAtmosphere = this.createAtmosphereLayer(scaledRadius * 1.0, color, 800, 0.3);

        planetGroup.add(innerAtmosphere, middleAtmosphere, outerAtmosphere);

        return {
            group: planetGroup,
            radius: scaledRadius,
            atmosphereRadius: scaledRadius * 1.2,
            color: color,
            center: new THREE.Vector3(),
            velocities: this.initializeVelocities(coreParticles, [innerAtmosphere, middleAtmosphere, outerAtmosphere])
        };
    }

    /**
     * Create optimized planet core.
     */
    createPlanetCore(radius, color, particleCount)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            // Spherical distribution with center bias
            const u = Math.random();
            const v = Math.random();
            const w = Math.random();

            const r = radius * Math.pow(u, 0.4);
            const theta = 2 * Math.PI * v;
            const phi = Math.acos(2 * w - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const coreColor = color.clone();
            coreColor.multiplyScalar(0.9 + Math.random() * 0.3);

            colors[i * 3] = coreColor.r;
            colors[i * 3 + 1] = coreColor.g;
            colors[i * 3 + 2] = coreColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Create optimized atmosphere layer.
     */
    createAtmosphereLayer(radius, color, particleCount, opacity)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            const u = Math.random();
            const v = Math.random();
            const w = Math.random();

            const shellThickness = 0.25;
            const r = radius * (1 - shellThickness + u * shellThickness);
            const theta = 2 * Math.PI * v;
            const phi = Math.acos(2 * w - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const atmosphereColor = color.clone();
            const distanceFactor = r / radius;
            atmosphereColor.multiplyScalar(0.7 + Math.random() * 0.4 * (1 - distanceFactor));

            colors[i * 3] = atmosphereColor.r;
            colors[i * 3 + 1] = atmosphereColor.g;
            colors[i * 3 + 2] = atmosphereColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Initialize particle velocities.
     */
    initializeVelocities(coreParticles, atmosphereLayers)
    {
        const velocities = [];

        // Core particles: minimal velocities
        const coreCount = coreParticles.geometry.attributes.position.count;
        for (let i = 0; i < coreCount; i++)
        {
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ));
        }

        // Atmosphere particles: orbital velocities
        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            const count = layer.geometry.attributes.position.count;
            const positions = layer.geometry.attributes.position.array;

            for (let i = 0; i < count; i++)
            {
                const x = positions[i * 3];
                const y = positions[i * 3 + 1];
                const orbitalSpeed = 0.1 + layerIndex * 0.05;

                const orbitalVelocity = new THREE.Vector3(-y, x, 0)
                    .normalize()
                    .multiplyScalar(orbitalSpeed);

                orbitalVelocity.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ));

                velocities.push(orbitalVelocity);
            }
        });

        return velocities;
    }

    /**
     * Optimized atmospheric physics simulation.
     */
    updateAtmosphere(planet, deltaTime)
    {
        const atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];
        const time = this.getTime();

        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            const positions = layer.geometry.attributes.position.array;
            const colors = layer.geometry.attributes.color.array;

            const baseFlowSpeed = 0.1 + layerIndex * 0.05;
            const maxRadius = planet.atmosphereRadius * (0.7 + layerIndex * 0.15);
            const noiseScale = 0.008;

            // Optimized loop with reduced calculations
            for (let i = 0; i < positions.length; i += 3)
            {
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];

                const currentPos = new THREE.Vector3(x, y, z);
                const distance = currentPos.length();

                // Simplified force calculation
                const totalForce = new THREE.Vector3();

                // Gravitational attraction
                totalForce.add(currentPos.clone().normalize().multiplyScalar(-0.5));

                // Simplified turbulence
                const noiseX = this.generateTurbulence(x * noiseScale, y * noiseScale, z * noiseScale, time * 0.1);
                totalForce.add(new THREE.Vector3(noiseX * 0.5, noiseX * 0.3, noiseX * 0.2));

                // Wind patterns
                const windAngle = time * baseFlowSpeed;
                const windStrength = 0.2 * Math.sin(time * 0.3);
                totalForce.add(new THREE.Vector3(
                    Math.cos(windAngle) * windStrength,
                    Math.sin(windAngle) * windStrength,
                    0
                ));

                // Update velocity
                const particleIndex = Math.floor(i / 3);
                if (!planet.velocities[particleIndex])
                {
                    planet.velocities[particleIndex] = new THREE.Vector3();
                }

                const velocity = planet.velocities[particleIndex];
                velocity.add(totalForce.multiplyScalar(deltaTime));
                velocity.multiplyScalar(0.92);
                velocity.clampLength(0, 1.5);

                // Update position
                currentPos.add(velocity.clone().multiplyScalar(deltaTime * 60));

                // Boundary constraints
                const finalDistance = currentPos.length();
                if (finalDistance > maxRadius)
                {
                    currentPos.multiplyScalar(maxRadius / finalDistance);
                }

                // Minimum distance
                const minRadius = planet.radius * 0.4;
                if (finalDistance < minRadius)
                {
                    currentPos.normalize().multiplyScalar(minRadius);
                }

                // Update arrays
                positions[i] = currentPos.x;
                positions[i + 1] = currentPos.y;
                positions[i + 2] = currentPos.z;

                // Simplified color update
                const densityFactor = Math.max(0, 1 - finalDistance / maxRadius);
                const baseColor = planet.color.clone();
                const intensity = 0.4 + densityFactor * 0.6;

                colors[i] = baseColor.r * intensity;
                colors[i + 1] = baseColor.g * intensity;
                colors[i + 2] = baseColor.b * intensity;
            }

            layer.geometry.attributes.position.needsUpdate = true;
            layer.geometry.attributes.color.needsUpdate = true;
        });
    }

    /**
     * Main render loop.
     */
    render()
    {
        const currentTime = this.getTime();
        const deltaTime = Math.min(currentTime - this.lastFrameTime, 0.016);
        this.lastFrameTime = currentTime;

        this.windowManager.update();

        // Update scene offset
        this.sceneOffset.x += (this.sceneOffsetTarget.x - this.sceneOffset.x) * 0.05;
        this.sceneOffset.y += (this.sceneOffsetTarget.y - this.sceneOffset.y) * 0.05;

        this.world.position.set(this.sceneOffset.x, this.sceneOffset.y, 0);

        const wins = this.windowManager.getWindows();

        // Update planets
        this.planets.forEach((planet, i) =>
        {
            const win = wins[i];
            if (!win?.shape) return;

            const posTarget = {
                x: win.shape.x + (win.shape.w * 0.5),
                y: win.shape.y + (win.shape.h * 0.5)
            };

            planet.group.position.x += (posTarget.x - planet.group.position.x) * 0.05;
            planet.group.position.y += (posTarget.y - planet.group.position.y) * 0.05;

            planet.center.copy(planet.group.position);
            planet.group.rotation.y += deltaTime * 0.2;

            this.updateAtmosphere(planet, deltaTime);
        });

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.render());
    }

    /**
     * Dispose planet resources.
     */
    disposePlanetResources(planet)
    {
        planet.group.traverse(child =>
        {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    /**
     * Clean up all resources.
     */
    dispose()
    {
        window.removeEventListener('resize', this.boundResizeHandler);

        if (this.renderer?.domElement)
        {
            this.renderer.domElement.removeEventListener('webglcontextlost', this.boundContextLossHandler);
        }

        if (this.scene)
        {
            this.scene.traverse(child =>
            {
                if (child.geometry) child.geometry.dispose();
                if (child.material)
                {
                    if (Array.isArray(child.material))
                    {
                        child.material.forEach(material => material.dispose());
                    } else
                    {
                        child.material.dispose();
                    }
                }
            });
        }

        if (this.renderer)
        {
            this.renderer.dispose();
            this.renderer.domElement?.parentNode?.removeChild(this.renderer.domElement);
        }

        this.planets = [];
    }
}

// Initialize application
const app = new LinkedWindows3DApp();

window.onload = () =>
{
    try
    {
        app.init();
    } catch (error)
    {
        console.error('App initialization failed:', error);
    }
};

document.addEventListener("visibilitychange", () =>
{
    if (document.visibilityState !== 'hidden' && !app.initialized)
    {
        try
        {
            app.init();
        } catch (error)
        {
            console.error('App visibility init failed:', error);
        }
    }
});

window.addEventListener('beforeunload', () => app.dispose());

export default LinkedWindows3DApp;
