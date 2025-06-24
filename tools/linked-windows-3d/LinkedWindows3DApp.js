import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';
import WindowManager from './WindowManager.js';

/**
 * Main application class for the Linked Windows 3D visualization.
 * Features gravitational particle planets with constrained atmospheric physics.
 *
 * @class LinkedWindows3DApp
 * @implements {WebGL Performance Best Practices}
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
        this.windowManager = null;
        this.initialized = false;
        this.sceneOffset = { x: 0, y: 0 };
        this.sceneOffsetTarget = { x: 0, y: 0 };
        this.pixR = Math.min(window.devicePixelRatio || 1, 2);
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);

        this.atmosphereConstraintStrength = 5.0;   // New: atmospheric boundary force
        this.lastFrameTime = 0;

        // Spatial optimization for performance
        this.spatialGrid = new Map();              // For spatial partitioning
        this.gridCellSize = 100;                   // Grid cell size for optimization
    }

    /**
     * Returns time in seconds since the start of the day.
     */
    getTime()
    {
        return (Date.now() - this.today) / 1000.0;
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
     * Updates the window shape and position for multi-window synchronization.
     * Critical for maintaining proper viewport coordination across browser windows.
     *
     * @param {boolean} easing - Whether to apply smooth interpolation to position changes
     */
    updateWindowShape(easing = true)
    {
        // Calculate scene offset based on window screen position
        // Essential for multi-window 3D coordinate system alignment
        this.sceneOffsetTarget = {
            x: -window.screenX,
            y: -window.screenY
        };

        // Immediate update for initialization or when easing is disabled
        if (!easing)
        {
            this.sceneOffset = { ...this.sceneOffsetTarget };
        }

        // Performance optimization: only resize if dimensions actually changed
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        if (this.renderer &&
            (this.renderer.domElement.width !== currentWidth ||
                this.renderer.domElement.height !== currentHeight))
        {
            this.resize();
        }
    }

    /**
     * Enhanced resize method with WebGL context validation.
     * Implements responsive design patterns for 3D applications.
     */
    resize()
    {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Validate dimensions to prevent WebGL errors
        if (width <= 0 || height <= 0)
        {
            console.warn('LinkedWindows3DApp: Invalid viewport dimensions', { width, height });
            return;
        }

        // Update orthographic camera projection matrix
        if (this.camera)
        {
            this.camera.left = 0;
            this.camera.right = width;
            this.camera.top = height;
            this.camera.bottom = 0;
            this.camera.updateProjectionMatrix();
        }

        // Update renderer with pixel ratio optimization
        if (this.renderer)
        {
            // Dynamic pixel ratio adjustment for multi-monitor setups
            const newPixR = Math.min(window.devicePixelRatio || 1, 2);
            if (newPixR !== this.pixR)
            {
                this.pixR = newPixR;
                this.renderer.setPixelRatio(this.pixR);
            }

            this.renderer.setSize(width, height);
        }

        // Update planet viewport scaling for responsive design
        this.planets.forEach(planet =>
        {
            if (planet.atmosphereRadius)
            {
                const scaleFactor = Math.min(width, height) / 1000;
                planet.viewportScale = Math.max(0.5, Math.min(2.0, scaleFactor));
            }
        });
    }

    /**
     * WebGL context loss recovery handler.
     * Implements graceful degradation and automatic recovery.
     */
    handleContextLoss()
    {
        console.warn('LinkedWindows3DApp: WebGL context lost, attempting recovery...');

        // Mark for reinitialization
        this.initialized = false;

        // Clean up current resources
        this.dispose();

        // Attempt recovery after brief delay
        setTimeout(() =>
        {
            this.init();
        }, 1000);
    }

    /**
     * Enhanced setup method with proper event handler binding.
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
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
        });

        this.renderer.setPixelRatio(this.pixR);
        this.renderer.sortObjects = false; // Optimize for particle rendering

        // Bind event handlers with proper context
        this.contextLossHandler = (event) =>
        {
            event.preventDefault();
            this.handleContextLoss();
        };

        this.resizeHandler = () => this.resize();

        // Add WebGL context loss handling
        this.renderer.domElement.addEventListener('webglcontextlost', this.contextLossHandler, false);

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

        // Add atmospheric rim lighting for depth
        const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.4);
        rimLight.position.set(-100, -100, -50);
        this.scene.add(rimLight);
    }

    /**
     * Enhanced initialization with proper event binding.
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

            // Bind resize handler with proper context
            window.addEventListener('resize', this.resizeHandler);
        }, 500);
    }

    /**
     * Missing noise generation methods for atmospheric simulation.
     */
    generateTurbulence(x, y, z, time)
    {
        // Multi-octave noise implementation for atmospheric turbulence
        let noise = 0;
        let amplitude = 1;
        let frequency = 1;

        // Multiple octaves for natural-looking turbulence
        for (let octave = 0; octave < 4; octave++)
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
     * Simplified 3D noise function for atmospheric simulation.
     */
    simplexNoise(x, y, z)
    {
        // Value noise implementation with smooth interpolation
        let xi = Math.floor(x);
        let yi = Math.floor(y);
        let zi = Math.floor(z);

        let xf = x - xi;
        let yf = y - yi;
        let zf = z - zi;

        // Smooth interpolation curves
        let u = this.fade(xf);
        let v = this.fade(yf);
        let w = this.fade(zf);

        // Hash coordinates for deterministic randomness
        let aaa = this.hash(xi, yi, zi);
        let aba = this.hash(xi, yi + 1, zi);
        let aab = this.hash(xi, yi, zi + 1);
        let abb = this.hash(xi, yi + 1, zi + 1);
        let baa = this.hash(xi + 1, yi, zi);
        let bba = this.hash(xi + 1, yi + 1, zi);
        let bab = this.hash(xi + 1, yi, zi + 1);
        let bbb = this.hash(xi + 1, yi + 1, zi + 1);

        // Trilinear interpolation
        let x1 = this.lerp(aaa, baa, u);
        let x2 = this.lerp(aba, bba, u);
        let y1 = this.lerp(x1, x2, v);

        let x3 = this.lerp(aab, bab, u);
        let x4 = this.lerp(abb, bbb, u);
        let y2 = this.lerp(x3, x4, v);

        return this.lerp(y1, y2, w);
    }

    /**
     * Utility functions for noise generation.
     */
    fade(t)
    {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t)
    {
        return a + t * (b - a);
    }

    hash(x, y, z)
    {
        // Simple hash function for noise generation
        let n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
        return 2 * (n - Math.floor(n)) - 1;
    }

    /**
     * Enhanced particle creation with higher density for cloud-like appearance
     */
    createAtmosphereLayer(radius, color, particleCount, opacity)
    {
        // Increase particle count for denser clouds
        const enhancedParticleCount = Math.floor(particleCount * 1.8);
        const positions = new Float32Array(enhancedParticleCount * 3);
        const colors = new Float32Array(enhancedParticleCount * 3);

        for (let i = 0; i < enhancedParticleCount; i++)
        {
            let u = Math.random();
            let v = Math.random();
            let w = Math.random();

            // Cluster particles more toward specific regions for cloud-like distribution
            let clusterBias = 0.7; // Bias toward certain regions
            if (Math.random() < clusterBias)
            {
                // Create clusters
                let clusterCenterTheta = Math.random() * Math.PI * 2;
                let clusterCenterPhi = Math.random() * Math.PI;
                let clusterSpread = 0.3;

                u = Math.max(0, Math.min(1, u + (Math.random() - 0.5) * clusterSpread));
                v = (clusterCenterTheta / (2 * Math.PI)) + (Math.random() - 0.5) * clusterSpread;
                w = (clusterCenterPhi / Math.PI) + (Math.random() - 0.5) * clusterSpread;

                v = Math.max(0, Math.min(1, v));
                w = Math.max(0, Math.min(1, w));
            }

            // Modified shell distribution for more natural clustering
            let shellThickness = 0.4; // Thicker shells for more volume
            let r = radius * (0.6 + u * shellThickness); // Start further from center
            let theta = 2 * Math.PI * v;
            let phi = Math.acos(2 * w - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Enhanced color variation for cloud appearance
            let atmosphereColor = color.clone();
            let distanceFactor = r / radius;
            let randomVariation = 0.8 + Math.random() * 0.4;

            // Add cloud-like color variation
            atmosphereColor.multiplyScalar(randomVariation * (0.6 + distanceFactor * 0.4));

            colors[i * 3] = atmosphereColor.r;
            colors[i * 3 + 1] = atmosphereColor.g;
            colors[i * 3 + 2] = atmosphereColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.6,  // Smaller particles for denser appearance
            vertexColors: true,
            transparent: true,
            opacity: opacity * 0.8, // Slightly more transparent for cloud effect
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        return new THREE.Points(geometry, material);
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
            let s = 300 + i * 50;
            let radius = s / 2;

            let planet = this.createParticlePlanet(radius, planetColor, i);
            planet.group.position.x = win.shape.x + (win.shape.w * 0.5);
            planet.group.position.y = win.shape.y + (win.shape.h * 0.5);

            this.world.add(planet.group);
            this.planets.push(planet);
        }
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
        // Scale up planet size by 40% while maintaining density
        const scaledRadius = radius * 1.4;
        let planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Create denser, smaller particles for more realistic appearance
        let coreParticles = this.createPlanetCore(scaledRadius * 0.15, color, 1000);
        planetGroup.add(coreParticles);

        // Multi-layered atmosphere with progressive density falloff
        let innerAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.6, color, 3000, 0.7);
        planetGroup.add(innerAtmosphere);

        let middleAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.85, color, 2200, 0.5);
        planetGroup.add(middleAtmosphere);

        let outerAtmosphere = this.createAtmosphereLayer(scaledRadius * 1.0, color, 1200, 0.3);
        planetGroup.add(outerAtmosphere);

        // Enhanced particle data structure for physics simulation
        let particleData = {
            group: planetGroup,
            radius: scaledRadius,
            atmosphereRadius: scaledRadius * 1.2,     // Atmospheric boundary
            color: color,
            center: new THREE.Vector3(),
            mass: 1000,                               // Gravitational mass
            coreParticles: this.extractParticleData(coreParticles),
            atmosphereParticles: [
                this.extractParticleData(innerAtmosphere),
                this.extractParticleData(middleAtmosphere),
                this.extractParticleData(outerAtmosphere)
            ],
            velocities: this.initializeConstrainedVelocities(coreParticles, [innerAtmosphere, middleAtmosphere, outerAtmosphere]),
            lastPositions: []  // For Verlet integration stability
        };

        return particleData;
    }

    /**
     * Creates dense planetary core with smaller, more numerous particles.
     * Uses advanced particle distribution algorithms for realistic density gradients.
     */
    createPlanetCore(radius, color, particleCount)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            // Enhanced spherical distribution with density bias toward center
            let u = Math.random();
            let v = Math.random();
            let w = Math.random();

            // Power law distribution for realistic planetary density
            let r = radius * Math.pow(u, 0.4);  // Stronger bias toward center
            let theta = 2 * Math.PI * v;
            let phi = Math.acos(2 * w - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Enhanced color variation with metallic reflectance simulation
            let coreColor = color.clone();
            let intensity = 0.9 + Math.random() * 0.3;
            coreColor.multiplyScalar(intensity);

            colors[i * 3] = coreColor.r;
            colors[i * 3 + 1] = coreColor.g;
            colors[i * 3 + 2] = coreColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Optimized material settings for smaller, denser particles
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
     * Creates atmosphere layers with enhanced particle physics constraints.
     * Implements shell-based distribution with proper boundary enforcement.
     */
    createAtmosphereLayer(radius, color, particleCount, opacity)
    {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++)
        {
            let u = Math.random();
            let v = Math.random();
            let w = Math.random();

            // Shell distribution with controlled thickness
            let shellThickness = 0.25;
            let r = radius * (1 - shellThickness + u * shellThickness);
            let theta = 2 * Math.PI * v;
            let phi = Math.acos(2 * w - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Atmospheric color gradients with distance-based variation
            let atmosphereColor = color.clone();
            let distanceFactor = r / radius;
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
     * Enhanced particle data extraction with physics metadata.
     */
    extractParticleData(pointsObject)
    {
        let positions = pointsObject.geometry.attributes.position.array;
        let colors = pointsObject.geometry.attributes.color.array;
        let particles = [];

        for (let i = 0; i < positions.length; i += 3)
        {
            particles.push({
                position: new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]),
                originalPosition: new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]),
                color: new THREE.Color(colors[i], colors[i + 1], colors[i + 2]),
                mass: 1.0,
                isCore: pointsObject.material.size > 1.4  // Distinguish core vs atmosphere
            });
        }

        return particles;
    }

    /**
     * Initializes particle velocities with atmospheric constraints.
     * Implements orbital mechanics for stable atmospheric circulation.
     */
    initializeConstrainedVelocities(coreParticles, atmosphereLayers)
    {
        let velocities = [];

        // Core particles: minimal velocities for stability
        let coreCount = coreParticles.geometry.attributes.position.count;
        for (let i = 0; i < coreCount; i++)
        {
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,  // Reduced initial velocity
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ));
        }

        // Atmosphere particles: orbital-biased velocities
        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            let count = layer.geometry.attributes.position.count;
            let positions = layer.geometry.attributes.position.array;

            for (let i = 0; i < count; i++)
            {
                let x = positions[i * 3];
                let y = positions[i * 3 + 1];
                let z = positions[i * 3 + 2];

                // Calculate orbital velocity for stable circulation
                let distance = Math.sqrt(x * x + y * y + z * z);
                let orbitalSpeed = 0.1 + layerIndex * 0.05;

                // Perpendicular velocity for orbital motion
                let orbitalVelocity = new THREE.Vector3(-y, x, 0).normalize().multiplyScalar(orbitalSpeed);

                // Add small random component
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
     * Advanced particle physics simulation with atmospheric constraints.
     * Implements spatial partitioning and distance-based interaction culling.
     */
    updateParticlePhysics(deltaTime)
    {
        if (this.planets.length === 0) return;

        // Atmospheric containment
        this.constrainAtmosphericParticles(deltaTime);

        // Always update planet atmosphere circulation
        this.planets.forEach(planet =>
        {
            this.updateConstrainedAtmosphere(planet, deltaTime);
        });
    }

    /**
     * Constrains atmospheric particles to remain within planetary boundaries.
     * Implements soft boundary constraints with spring-like restoration forces.
     */
    constrainAtmosphericParticles(deltaTime)
    {
        this.planets.forEach(planet =>
        {
            let atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];

            atmosphereLayers.forEach((layer, layerIndex) =>
            {
                let positions = layer.geometry.attributes.position.array;
                let maxRadius = planet.atmosphereRadius * (0.7 + layerIndex * 0.15);

                for (let i = 0; i < positions.length; i += 3)
                {
                    let x = positions[i];
                    let y = positions[i + 1];
                    let z = positions[i + 2];

                    let distance = Math.sqrt(x * x + y * y + z * z);

                    // Apply soft boundary constraint
                    if (distance > maxRadius)
                    {
                        let constraintForce = (distance - maxRadius) / maxRadius;
                        let constraintFactor = 1.0 - (constraintForce * this.atmosphereConstraintStrength * deltaTime);

                        positions[i] *= constraintFactor;
                        positions[i + 1] *= constraintFactor;
                        positions[i + 2] *= constraintFactor;
                    }
                }

                layer.geometry.attributes.position.needsUpdate = true;
            });
        });
    }

    /**
     * Enhanced atmospheric circulation with volumetric cloud simulation.
     * Implements Perlin noise turbulence, density clustering, and fluid dynamics
     * for realistic cloud-like particle behavior around planetary bodies.
     */
    updateConstrainedAtmosphere(planet, deltaTime)
    {
        let atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];

        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            let positions = layer.geometry.attributes.position.array;
            let colors = layer.geometry.attributes.color.array;
            let velocities = planet.velocities || [];

            // Enhanced parameters for cloud-like behavior
            let baseFlowSpeed = 0.1 + layerIndex * 0.05;  // Reduced base speed
            let maxRadius = planet.atmosphereRadius * (0.7 + layerIndex * 0.15);
            let densityTarget = 0.6 + layerIndex * 0.2;  // Higher density for inner layers
            let turbulenceStrength = 0.8 - layerIndex * 0.2;  // More turbulence in outer layers

            // Cloud formation parameters
            let cloudCohesion = 0.3;  // Particle attraction to nearby particles
            let cloudSeparation = 0.2;  // Particle repulsion when too close
            let noiseScale = 0.008;  // Scale for Perlin-like noise
            let time = this.getTime();

            for (let i = 0; i < positions.length; i += 3)
            {
                let particleIndex = i / 3;
                let x = positions[i];
                let y = positions[i + 1];
                let z = positions[i + 2];

                let currentPos = new THREE.Vector3(x, y, z);
                let distance = currentPos.length();

                // Initialize velocity if not exists
                if (!velocities[particleIndex])
                {
                    velocities[particleIndex] = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.1,
                        (Math.random() - 0.5) * 0.1,
                        (Math.random() - 0.5) * 0.1
                    );
                }

                let velocity = velocities[particleIndex];
                let totalForce = new THREE.Vector3();

                // 1. GRAVITATIONAL ATTRACTION TO PLANET CENTER
                let gravitationalForce = currentPos.clone().normalize().multiplyScalar(-0.5 * densityTarget);
                totalForce.add(gravitationalForce);

                // 2. VOLUMETRIC NOISE-BASED TURBULENCE (Perlin-like)
                let noiseX = this.generateTurbulence(x * noiseScale, y * noiseScale, z * noiseScale, time * 0.1);
                let noiseY = this.generateTurbulence((x + 1000) * noiseScale, (y + 1000) * noiseScale, (z + 2000) * noiseScale, time * 0.1);
                let noiseZ = this.generateTurbulence((x + 2000) * noiseScale, (y + 2000) * noiseScale, (z + 3000) * noiseScale, time * 0.1);

                let turbulenceForce = new THREE.Vector3(noiseX, noiseY, noiseZ).multiplyScalar(turbulenceStrength);
                totalForce.add(turbulenceForce);

                // 3. PARTICLE DENSITY CLUSTERING (Flocking behavior)
                let neighborhoodRadius = 15 + layerIndex * 5;
                let cohesionForce = new THREE.Vector3();
                let separationForce = new THREE.Vector3();
                let neighborCount = 0;

                // Sample nearby particles for clustering
                let sampleStep = Math.max(1, Math.floor(positions.length / (300 * 3))); // Optimize by sampling
                for (let j = 0; j < positions.length; j += sampleStep * 3)
                {
                    if (j === i) continue;

                    let neighborPos = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
                    let distance = currentPos.distanceTo(neighborPos);

                    if (distance < neighborhoodRadius)
                    {
                        neighborCount++;


                        // Cohesion: move toward average position of neighbors
                        cohesionForce.add(neighborPos);

                        // Separation: avoid crowding
                        if (distance < 8)
                        {
                            let separationVector = currentPos.clone().sub(neighborPos);
                            separationVector.normalize().multiplyScalar(cloudSeparation / distance);
                            separationForce.add(separationVector);
                        }
                    }
                }

                if (neighborCount > 0)
                {
                    cohesionForce.divideScalar(neighborCount);
                    cohesionForce.sub(currentPos);
                    cohesionForce.multiplyScalar(cloudCohesion);
                    totalForce.add(cohesionForce);
                    totalForce.add(separationForce);
                }

                // 4. CONVECTION CURRENTS (Vertical circulation)
                let convectionStrength = 0.3 * Math.sin(time * 0.5 + distance * 0.01);
                let convectionForce = new THREE.Vector3(0, 0, convectionStrength);
                totalForce.add(convectionForce);

                // 5. ATMOSPHERIC DENSITY GRADIENT
                let densityGradient = Math.max(0, 1 - distance / maxRadius);
                let densityForce = currentPos.clone().normalize().multiplyScalar(-densityGradient * 0.4);
                totalForce.add(densityForce);

                // 6. WIND PATTERNS (Horizontal circulation with varying speeds)
                let windAngle = time * baseFlowSpeed + Math.sin(distance * 0.02 + time) * 0.5;
                let windStrength = 0.2 * Math.sin(time * 0.3 + distance * 0.015) * densityGradient;
                let windForce = new THREE.Vector3(
                    Math.cos(windAngle) * windStrength,
                    Math.sin(windAngle) * windStrength,
                    0
                );
                totalForce.add(windForce);

                // Apply forces to velocity with realistic damping
                velocity.add(totalForce.multiplyScalar(deltaTime));
                velocity.multiplyScalar(0.92); // Natural damping
                velocity.clampLength(0, 1.5); // Limit maximum velocity

                // Update position with enhanced integration
                currentPos.add(velocity.clone().multiplyScalar(deltaTime * 60)); // Scale for frame rate independence

                // SOFT BOUNDARY CONSTRAINTS with realistic compression
                let finalDistance = currentPos.length();
                if (finalDistance > maxRadius)
                {
                    let compressionFactor = maxRadius / finalDistance;
                    currentPos.multiplyScalar(compressionFactor);

                    // Add inward velocity when hitting boundary
                    velocity.add(currentPos.clone().normalize().multiplyScalar(-0.3));
                }

                // Prevent particles from getting too close to planet core
                let minRadius = planet.radius * 0.4;
                if (finalDistance < minRadius)
                {
                    currentPos.normalize().multiplyScalar(minRadius);
                    velocity.add(currentPos.clone().normalize().multiplyScalar(0.2));
                }

                // Update positions
                positions[i] = currentPos.x;
                positions[i + 1] = currentPos.y;
                positions[i + 2] = currentPos.z;

                // DYNAMIC COLOR BASED ON DENSITY AND MOVEMENT
                let speedFactor = velocity.length() / 1.5;
                let densityFactor = Math.max(0, 1 - finalDistance / maxRadius);

                // Enhanced color calculation for cloud appearance
                let baseColor = planet.color.clone();
                let intensity = 0.4 + densityFactor * 0.6 + speedFactor * 0.3;

                // Add atmospheric scattering effect
                let scatteringBlue = Math.min(1, densityFactor * 0.3);
                baseColor.r = Math.min(1, baseColor.r * intensity + scatteringBlue * 0.2);
                baseColor.g = Math.min(1, baseColor.g * intensity + scatteringBlue * 0.3);
                baseColor.b = Math.min(1, baseColor.b * intensity + scatteringBlue * 0.5);

                colors[i] = baseColor.r;
                colors[i + 1] = baseColor.g;
                colors[i + 2] = baseColor.b;
            }

            // Store velocities back to planet data
            if (!planet.velocities) planet.velocities = [];
            planet.velocities = velocities;

            layer.geometry.attributes.position.needsUpdate = true;
            layer.geometry.attributes.color.needsUpdate = true;
        });
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

            // Skip if win or win.shape is undefined
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
            planet.group.rotation.y += deltaTime * 0.2;
            planet.group.rotation.x += deltaTime * 0.1;
        }

        // Run particle physics simulation
        this.updateParticlePhysics(Math.min(deltaTime, 0.016)); // Cap delta time for stability

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.render());
    }

    /**
     * Cleanup method for proper resource disposal.
     */
    dispose()
    {
        // Remove event listeners to prevent memory leaks
        window.removeEventListener('resize', this.resizeHandler);

        // Cleanup WebGL context event handlers
        if (this.renderer && this.renderer.domElement)
        {
            this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLossHandler);
        }

        // Recursive disposal of all scene resources
        if (this.scene)
        {
            this.scene.traverse((child) =>
            {
                if (child.geometry)
                {
                    child.geometry.dispose();
                }
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
                if (child.texture)
                {
                    child.texture.dispose();
                }
            });
        }

        // Dispose renderer and free WebGL context
        if (this.renderer)
        {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode)
            {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // Clear data structures
        this.planets = [];
        this.spatialGrid.clear();

        console.log('LinkedWindows3DApp: Resources disposed successfully');
    }
}

// Entry point with proper error handling
const app = new LinkedWindows3DApp();

window.onload = () =>
{
    try
    {
        app.init();
    } catch (error)
    {
        console.error('LinkedWindows3DApp initialization failed:', error);
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
            console.error('LinkedWindows3DApp visibility init failed:', error);
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () =>
{
    app.dispose();
});

export default LinkedWindows3DApp;
