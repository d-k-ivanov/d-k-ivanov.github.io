import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';
import WindowManager from './WindowManager.js';

/**
 * Main application class for the Linked Windows 3D visualization.
 * Features gravitational particle planets with liquid-like atmospheres.
 */
class LinkedWindows3DApp
{
    constructor()
    {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.world = null;
        this.planets = [];
        this.globalParticles = [];
        this.windowManager = null;
        this.initialized = false;
        this.sceneOffset = { x: 0, y: 0 };
        this.sceneOffsetTarget = { x: 0, y: 0 };
        this.pixR = Math.min(window.devicePixelRatio || 1, 2);
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);
        this.today = this.today.getTime();

        // Gravitational simulation parameters 
        this.gravitationalConstant = 500.0;
        this.dampingFactor = 0.98;
        this.maxVelocity = 3.0;
        this.particleRepulsion = 0.5;
        this.bridgeParticleCount = 2000;
        this.lastFrameTime = 0;
    }

    /**
     * Returns time in seconds since the start of the day.
     */
    getTime()
    {
        return (Date.now() - this.today) / 1000.0;
    }

    /**
     * Initializes the application with gravitational particle system.
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
            this.initializeGlobalParticles();
            this.render();
            window.addEventListener('resize', () => this.resize());
        }, 500);
    }

    /**
     * Sets up the Three.js scene with enhanced lighting for particle visualization.
     */
    setupScene()
    {
        this.camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10000, 10000);
        this.camera.position.z = 2.5;
        this.near = this.camera.position.z - 0.5;
        this.far = this.camera.position.z + 0.5;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000a1a); // Deep space blue

        this.scene.add(this.camera);

        // Enhanced starfield for cosmic atmosphere
        this.createEnhancedStarfield();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(this.pixR);
        this.renderer.sortObjects = false; // Optimize for particle rendering

        this.world = new THREE.Object3D();
        this.scene.add(this.world);

        this.renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(this.renderer.domElement);

        // Enhanced lighting setup for particle visualization
        const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4a9eff, 0.8);
        directionalLight.position.set(100, 100, 50);
        this.scene.add(directionalLight);

        // Add atmospheric rim lighting
        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.4);
        rimLight.position.set(-100, -100, -50);
        this.scene.add(rimLight);
    }

    /**
     * Creates an enhanced starfield with nebula-like effects.
     */
    createEnhancedStarfield()
    {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 8000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++)
        {
            // More distributed star positioning
            const x = (Math.random() - 0.5) * 8000;
            const y = (Math.random() - 0.5) * 8000;
            const z = (Math.random() - 0.5) * 8000;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const color = new THREE.Color();
            const starType = Math.random();

            if (starType < 0.3)
            {
                // Blue-white stars
                color.setHSL(0.6, 0.8, Math.random() * 0.5 + 0.5);
            } else if (starType < 0.6)
            {
                // Yellow-white stars
                color.setHSL(0.1, 0.3, Math.random() * 0.4 + 0.6);
            } else
            {
                // Red giants and distant stars
                color.setHSL(0.0, 0.6, Math.random() * 0.3 + 0.3);
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 3 + 1;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(starField);
    }

    /**
     * Sets up the window manager and callbacks.
     */
    setupWindowManager()
    {
        this.windowManager = new WindowManager();
        this.windowManager.setWinShapeChangeCallback(this.updateWindowShape.bind(this));
        this.windowManager.setWinChangeCallback(this.windowsUpdated.bind(this));

        let metaData = { planetType: "liquid", atmosphereIntensity: Math.random() + 0.5 };
        this.windowManager.init(metaData);
        this.windowsUpdated();
    }

    /**
     * Updates planet configuration when windows change.
     */
    windowsUpdated()
    {
        this.updatePlanets();
    }

    /**
     * Creates and updates particle planets to match window count.
     */
    updatePlanets()
    {
        let wins = this.windowManager.getWindows();

        // Remove existing planets
        this.planets.forEach((planet) =>
        {
            this.world.remove(planet.group);
            // Dispose of geometries and materials for memory management
            planet.group.traverse((child) =>
            {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });

        this.planets = [];

        // Create new planets for each window
        for (let i = 0; i < wins.length; i++)
        {
            let win = wins[i];
            let planetColor = this.generatePlanetColor(i, win.id);
            let radius = 80 + i * 20;

            let planet = this.createParticlePlanet(radius, planetColor, i);
            planet.group.position.x = win.shape.x + (win.shape.w * 0.5);
            planet.group.position.y = win.shape.y + (win.shape.h * 0.5);

            this.world.add(planet.group);
            this.planets.push(planet);
        }

        // Reinitialize global particles for inter-planetary bridges
        this.initializeGlobalParticles();
    }

    /**
     * Generates unique liquid colors for each planet.
     */
    generatePlanetColor(index, windowId)
    {
        const liquidColors = [
            { h: 0.55, s: 0.9, l: 0.6 }, // Cyan liquid
            { h: 0.75, s: 0.8, l: 0.7 }, // Purple liquid
            { h: 0.15, s: 0.9, l: 0.6 }, // Orange liquid
            { h: 0.35, s: 0.8, l: 0.5 }, // Green liquid
            { h: 0.95, s: 0.9, l: 0.6 }, // Magenta liquid
            { h: 0.05, s: 1.0, l: 0.5 }, // Red liquid
        ];

        let colorIndex = (index + windowId) % liquidColors.length;
        let colorData = liquidColors[colorIndex];

        return new THREE.Color().setHSL(
            colorData.h + (Math.random() - 0.5) * 0.1,
            colorData.s,
            colorData.l + (Math.random() - 0.5) * 0.2
        );
    }

    /**
     * Creates a particle planet with dense core and flowing atmosphere.
     */
    createParticlePlanet(radius, color, planetIndex)
    {
        let planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Planet core particles (dense, slower moving)
        let coreParticles = this.createPlanetCore(radius * 0.4, color, 1200);
        planetGroup.add(coreParticles);

        // Atmosphere layers with different densities and velocities
        let innerAtmosphere = this.createAtmosphereLayer(radius * 0.7, color, 2000, 0.6);
        planetGroup.add(innerAtmosphere);

        let middleAtmosphere = this.createAtmosphereLayer(radius * 1.0, color, 1500, 0.4);
        planetGroup.add(middleAtmosphere);

        let outerAtmosphere = this.createAtmosphereLayer(radius * 1.4, color, 800, 0.2);
        planetGroup.add(outerAtmosphere);

        // Create particle data for physics simulation
        let particleData = {
            group: planetGroup,
            radius: radius,
            color: color,
            center: new THREE.Vector3(),
            coreParticles: this.extractParticlePositions(coreParticles),
            atmosphereParticles: [
                this.extractParticlePositions(innerAtmosphere),
                this.extractParticlePositions(middleAtmosphere),
                this.extractParticlePositions(outerAtmosphere)
            ],
            velocities: this.initializeParticleVelocities(coreParticles, [innerAtmosphere, middleAtmosphere, outerAtmosphere])
        };

        return particleData;
    }

    /**
     * Creates dense core particles for the planet center.
     */
    createPlanetCore(radius, color, particleCount)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            // Use spherical distribution with bias toward center
            let u = Math.random();
            let v = Math.random();
            let w = Math.random();

            // Bias toward center for denser core
            let r = radius * Math.pow(u, 0.3);
            let theta = 2 * Math.PI * v;
            let phi = Math.acos(2 * w - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Core particles have full color intensity
            let coreColor = color.clone();
            coreColor.multiplyScalar(0.8 + Math.random() * 0.4);

            colors[i * 3] = coreColor.r;
            colors[i * 3 + 1] = coreColor.g;
            colors[i * 3 + 2] = coreColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Creates an atmosphere layer with flowing liquid-like particles.
     */
    createAtmosphereLayer(radius, color, particleCount, opacity)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            // Spherical shell distribution for atmosphere
            let u = Math.random();
            let v = Math.random();
            let w = Math.random();

            // Create shell thickness
            let shellThickness = 0.3;
            let r = radius * (1 - shellThickness + u * shellThickness);
            let theta = 2 * Math.PI * v;
            let phi = Math.acos(2 * w - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Atmosphere particles have varied intensity
            let atmosphereColor = color.clone();
            atmosphereColor.multiplyScalar(0.6 + Math.random() * 0.6);

            colors[i * 3] = atmosphereColor.r;
            colors[i * 3 + 1] = atmosphereColor.g;
            colors[i * 3 + 2] = atmosphereColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Extracts particle positions for physics simulation.
     */
    extractParticlePositions(pointsObject)
    {
        let positions = pointsObject.geometry.attributes.position.array;
        let particles = [];

        for (let i = 0; i < positions.length; i += 3)
        {
            particles.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
        }

        return particles;
    }

    /**
     * Initializes velocity vectors for all particles.
     */
    initializeParticleVelocities(coreParticles, atmosphereLayers)
    {
        let velocities = [];

        // Core particle velocities (minimal)
        let coreCount = coreParticles.geometry.attributes.position.count;
        for (let i = 0; i < coreCount; i++)
        {
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ));
        }

        // Atmosphere particle velocities (more dynamic)
        atmosphereLayers.forEach(layer =>
        {
            let count = layer.geometry.attributes.position.count;
            for (let i = 0; i < count; i++)
            {
                velocities.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ));
            }
        });

        return velocities;
    }

    /**
     * Initializes global particles for inter-planetary bridges.
     */
    initializeGlobalParticles()
    {
        // Remove existing global particles
        this.globalParticles.forEach(particle =>
        {
            this.world.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        this.globalParticles = [];

        if (this.planets.length < 2) return;

        // Create bridge particles between planets
        const bridgeGeometry = new THREE.BufferGeometry();
        const bridgePositions = new Float32Array(this.bridgeParticleCount * 3);
        const bridgeColors = new Float32Array(this.bridgeParticleCount * 3);
        const bridgeVelocities = [];

        for (let i = 0; i < this.bridgeParticleCount; i++)
        {
            // Random position in space
            bridgePositions[i * 3] = (Math.random() - 0.5) * 2000;
            bridgePositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            bridgePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;

            // Neutral bridge color that will be influenced by nearby planets
            let bridgeColor = new THREE.Color(0.3, 0.6, 1.0);
            bridgeColors[i * 3] = bridgeColor.r;
            bridgeColors[i * 3 + 1] = bridgeColor.g;
            bridgeColors[i * 3 + 2] = bridgeColor.b;

            bridgeVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ));
        }

        bridgeGeometry.setAttribute('position', new THREE.BufferAttribute(bridgePositions, 3));
        bridgeGeometry.setAttribute('color', new THREE.BufferAttribute(bridgeColors, 3));

        const bridgeMaterial = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const bridgeParticles = new THREE.Points(bridgeGeometry, bridgeMaterial);
        bridgeParticles.userData = { velocities: bridgeVelocities };

        this.world.add(bridgeParticles);
        this.globalParticles.push(bridgeParticles);
    }

    /**
     * Updates particle physics simulation with gravitational forces.
     */
    updateParticlePhysics(deltaTime)
    {
        if (this.planets.length === 0) return;

        // Update global bridge particles
        this.globalParticles.forEach(bridgeSystem =>
        {
            let positions = bridgeSystem.geometry.attributes.position.array;
            let colors = bridgeSystem.geometry.attributes.color.array;
            let velocities = bridgeSystem.userData.velocities;

            for (let i = 0; i < velocities.length; i++)
            {
                let particlePos = new THREE.Vector3(
                    positions[i * 3],
                    positions[i * 3 + 1],
                    positions[i * 3 + 2]
                );

                let totalForce = new THREE.Vector3();
                let nearestPlanetColor = new THREE.Color(0.3, 0.6, 1.0);
                let minDistance = Infinity;

                // Calculate gravitational forces from all planets
                this.planets.forEach(planet =>
                {
                    let planetCenter = planet.group.position;
                    let direction = planetCenter.clone().sub(particlePos);
                    let distance = direction.length();

                    if (distance > 0)
                    {
                        let force = this.gravitationalConstant / (distance * distance + 100);
                        direction.normalize().multiplyScalar(force);
                        totalForce.add(direction);

                        // Color influence from nearest planet
                        if (distance < minDistance)
                        {
                            minDistance = distance;
                            nearestPlanetColor = planet.color;
                        }
                    }
                });

                // Add weak repulsion near planet centers to prevent accumulation
                this.planets.forEach(planet =>
                {
                    let planetCenter = planet.group.position;
                    let direction = particlePos.clone().sub(planetCenter);
                    let distance = direction.length();

                    if (distance < planet.radius * 0.8)
                    {
                        let repulsion = this.particleRepulsion / (distance + 10);
                        direction.normalize().multiplyScalar(repulsion);
                        totalForce.add(direction);
                    }
                });

                // Update velocity and position
                velocities[i].add(totalForce.multiplyScalar(deltaTime));
                velocities[i].multiplyScalar(this.dampingFactor);
                velocities[i].clampLength(0, this.maxVelocity);

                particlePos.add(velocities[i].clone().multiplyScalar(deltaTime));

                // Update position
                positions[i * 3] = particlePos.x;
                positions[i * 3 + 1] = particlePos.y;
                positions[i * 3 + 2] = particlePos.z;

                // Update color based on nearest planet
                let colorInfluence = Math.max(0, 1 - minDistance / 500);
                let currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                currentColor.lerp(nearestPlanetColor, colorInfluence * 0.1);

                colors[i * 3] = currentColor.r;
                colors[i * 3 + 1] = currentColor.g;
                colors[i * 3 + 2] = currentColor.b;
            }

            bridgeSystem.geometry.attributes.position.needsUpdate = true;
            bridgeSystem.geometry.attributes.color.needsUpdate = true;
        });

        // Update planet atmosphere particles
        this.planets.forEach(planet =>
        {
            this.updatePlanetAtmosphere(planet, deltaTime);
        });
    }

    /**
     * Updates atmosphere particles for liquid-like flow around planet.
     */
    updatePlanetAtmosphere(planet, deltaTime)
    {
        let atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];

        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            let positions = layer.geometry.attributes.position.array;
            let flowSpeed = 0.5 + layerIndex * 0.3;

            for (let i = 0; i < positions.length; i += 3)
            {
                let x = positions[i];
                let y = positions[i + 1];
                let z = positions[i + 2];

                // Create swirling motion for liquid-like appearance
                let distance = Math.sqrt(x * x + y * y + z * z);
                let angle = Math.atan2(y, x);
                let time = this.getTime() * flowSpeed;

                // Add orbital motion with some turbulence
                let newAngle = angle + (deltaTime * flowSpeed * 0.2) + Math.sin(time + distance * 0.01) * 0.1;
                let radius = distance + Math.sin(time * 2 + distance * 0.02) * 5;

                positions[i] = radius * Math.cos(newAngle);
                positions[i + 1] = radius * Math.sin(newAngle);
                positions[i + 2] = z + Math.sin(time + distance * 0.01) * 2;
            }

            layer.geometry.attributes.position.needsUpdate = true;
        });
    }

    /**
     * Updates the window shape and position.
     */
    updateWindowShape(easing = true)
    {
        this.sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
        if (!easing) this.sceneOffset = this.sceneOffsetTarget;
    }

    /**
     * Main render loop with physics simulation.
     */
    render()
    {
        let currentTime = this.getTime();
        let deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        this.windowManager.update();

        // Update scene offset with smoothing
        let falloff = 0.05;
        this.sceneOffset.x += (this.sceneOffsetTarget.x - this.sceneOffset.x) * falloff;
        this.sceneOffset.y += (this.sceneOffsetTarget.y - this.sceneOffset.y) * falloff;

        this.world.position.x = this.sceneOffset.x;
        this.world.position.y = this.sceneOffset.y;

        let wins = this.windowManager.getWindows();

        // Update planet positions and rotations
        for (let i = 0; i < this.planets.length; i++)
        {
            let planet = this.planets[i];
            let win = wins[i];
            if (!win || !win.shape) continue;

            let posTarget = {
                x: win.shape.x + (win.shape.w * 0.5),
                y: win.shape.y + (win.shape.h * 0.5)
            };

            // Smooth position interpolation
            planet.group.position.x += (posTarget.x - planet.group.position.x) * falloff;
            planet.group.position.y += (posTarget.y - planet.group.position.y) * falloff;

            // Update planet center for physics
            planet.center.copy(planet.group.position);

            // Gentle rotation for visual appeal
            planet.group.rotation.y += deltaTime * 0.1;
            planet.group.rotation.x += deltaTime * 0.05;
        }

        // Run particle physics simulation
        this.updateParticlePhysics(Math.min(deltaTime, 0.016)); // Cap delta time for stability

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.render());
    }

    /**
     * Resizes the renderer and camera to fit the current window size.
     */
    resize()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;

        this.camera.left = 0;
        this.camera.right = width;
        this.camera.top = height;
        this.camera.bottom = 0;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    /**
     * Cleanup method for proper resource disposal.
     */
    dispose()
    {
        // Dispose of all geometries and materials
        this.scene.traverse((child) =>
        {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });

        if (this.renderer)
        {
            this.renderer.dispose();
        }
    }
}

// Entry point
const app = new LinkedWindows3DApp();
window.onload = () => app.init();
document.addEventListener("visibilitychange", () =>
{
    if (document.visibilityState !== 'hidden') app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () =>
{
    app.dispose();
});

export default LinkedWindows3DApp;
