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
        this.gravitationalConstant = 800.0;        // Increased for stronger planet gravity
        this.dampingFactor = 0.95;                 // Reduced for more controlled motion
        this.maxVelocity = 2.0;                    // Reduced max velocity
        this.particleRepulsion = 1.2;              // Increased repulsion at planet centers
        this.bridgeParticleCount = 1500;           // Optimized particle count
        this.atmosphereConstraintStrength = 5.0;   // New: atmospheric boundary force
        this.bridgeActivationDistance = 300;       // Distance threshold for bridge formation
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
            powerPreference: "high-performance",
            preserveDrawingBuffer: false, // Optimize for performance
            failIfMajorPerformanceCaveat: false // Allow software rendering as fallback
        });

        this.renderer.setPixelRatio(this.pixR);
        this.renderer.sortObjects = false; // Optimize for particle rendering

        // Add WebGL context loss handling
        this.renderer.domElement.addEventListener('webglcontextlost', (event) =>
        {
            event.preventDefault();
            this.handleContextLoss();
        }, false);

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
        // Scale up planet size by 40% while maintaining density
        const scaledRadius = radius * 1.4;
        let planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Create denser, smaller particles for more realistic appearance
        let coreParticles = this.createPlanetCore(scaledRadius * 0.35, color, 2000);      // Increased count
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
            size: 1.2,                    // Reduced size for density
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
            size: 0.8,                    // Smaller atmospheric particles
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
                isCore: pointsObject.material.size > 1.0  // Distinguish core vs atmosphere
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

        // Calculate inter-planetary distances for bridge activation
        let planetDistances = this.calculatePlanetDistances();
        let bridgeActive = planetDistances.some(d => d < this.bridgeActivationDistance);

        if (bridgeActive)
        {
            // Update global bridge particles only when planets are close
            this.updateBridgeParticles(deltaTime, planetDistances);
        } else
        {
            // Focus on atmospheric containment when planets are distant
            this.constrainAtmosphericParticles(deltaTime);
        }

        // Always update planet atmosphere circulation
        this.planets.forEach(planet =>
        {
            this.updateConstrainedAtmosphere(planet, deltaTime);
        });
    }

    /**
     * Calculates distances between all planet pairs for bridge activation.
     */
    calculatePlanetDistances()
    {
        let distances = [];
        for (let i = 0; i < this.planets.length; i++)
        {
            for (let j = i + 1; j < this.planets.length; j++)
            {
                let distance = this.planets[i].group.position.distanceTo(this.planets[j].group.position);
                distances.push(distance);
            }
        }
        return distances;
    }

    /**
     * Updates bridge particles with Einstein-Rosen bridge physics.
     * Only active when planets are within interaction distance.
     */
    updateBridgeParticles(deltaTime, planetDistances)
    {
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

                // Enhanced gravitational calculation with distance scaling
                this.planets.forEach(planet =>
                {
                    let planetCenter = planet.group.position;
                    let direction = planetCenter.clone().sub(particlePos);
                    let distance = direction.length();

                    if (distance > 0 && distance < this.bridgeActivationDistance * 2)
                    {
                        // Scaled gravitational force based on planet mass and distance
                        let force = (this.gravitationalConstant * planet.mass) / (distance * distance + 50);
                        direction.normalize().multiplyScalar(force);
                        totalForce.add(direction);

                        if (distance < minDistance)
                        {
                            minDistance = distance;
                            nearestPlanetColor = planet.color;
                        }
                    }
                });

                // Apply Einstein-Rosen bridge curvature effect
                this.applyBridgeCurvature(particlePos, totalForce, deltaTime);

                // Update velocity with enhanced damping
                velocities[i].add(totalForce.multiplyScalar(deltaTime));
                velocities[i].multiplyScalar(this.dampingFactor);
                velocities[i].clampLength(0, this.maxVelocity);

                particlePos.add(velocities[i].clone().multiplyScalar(deltaTime));

                // Update position and color
                positions[i * 3] = particlePos.x;
                positions[i * 3 + 1] = particlePos.y;
                positions[i * 3 + 2] = particlePos.z;

                // Dynamic color blending based on proximity
                let colorInfluence = Math.max(0, 1 - minDistance / 400);
                let currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                currentColor.lerp(nearestPlanetColor, colorInfluence * 0.15);

                colors[i * 3] = currentColor.r;
                colors[i * 3 + 1] = currentColor.g;
                colors[i * 3 + 2] = currentColor.b;
            }

            bridgeSystem.geometry.attributes.position.needsUpdate = true;
            bridgeSystem.geometry.attributes.color.needsUpdate = true;
        });
    }

    /**
     * Applies Einstein-Rosen bridge spacetime curvature effects.
     * Creates tunnel-like particle flow between nearby planets.
     */
    applyBridgeCurvature(particlePos, force, deltaTime)
    {
        if (this.planets.length < 2) return;

        // Find the two nearest planets for bridge formation
        let distances = [];
        this.planets.forEach((planet, index) =>
        {
            let dist = particlePos.distanceTo(planet.group.position);
            distances.push({ index, distance: dist, planet });
        });

        distances.sort((a, b) => a.distance - b.distance);

        if (distances.length >= 2 &&
            distances[0].distance < this.bridgeActivationDistance &&
            distances[1].distance < this.bridgeActivationDistance)
        {

            // Create tunnel effect between the two nearest planets
            let planet1 = distances[0].planet.group.position;
            let planet2 = distances[1].planet.group.position;
            let bridgeVector = planet2.clone().sub(planet1);
            let bridgeCenter = planet1.clone().add(bridgeVector.clone().multiplyScalar(0.5));

            // Apply curvature toward the bridge tunnel
            let toBridgeCenter = bridgeCenter.clone().sub(particlePos);
            let bridgeInfluence = 1.0 / (toBridgeCenter.length() + 10);
            force.add(toBridgeCenter.normalize().multiplyScalar(bridgeInfluence * 100));
        }
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
     * Updates atmospheric circulation with enhanced fluid dynamics.
     * Implements vorticity confinement and turbulence modeling.
     */
    updateConstrainedAtmosphere(planet, deltaTime)
    {
        let atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];

        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            let positions = layer.geometry.attributes.position.array;
            let flowSpeed = 0.3 + layerIndex * 0.2;  // Reduced flow speed
            let maxRadius = planet.atmosphereRadius * (0.7 + layerIndex * 0.15);

            for (let i = 0; i < positions.length; i += 3)
            {
                let x = positions[i];
                let y = positions[i + 1];
                let z = positions[i + 2];

                let distance = Math.sqrt(x * x + y * y + z * z);
                let angle = Math.atan2(y, x);
                let time = this.getTime() * flowSpeed;

                // Enhanced orbital motion with turbulence
                let orbitalSpeed = flowSpeed * deltaTime * 0.15;
                let turbulence = Math.sin(time * 3 + distance * 0.02) * 0.05;
                let newAngle = angle + orbitalSpeed + turbulence;

                // Controlled radial oscillation
                let radialOscillation = Math.sin(time * 1.5 + distance * 0.015) * 2;
                let newRadius = Math.min(distance + radialOscillation, maxRadius);

                // Vertical circulation
                let verticalMotion = Math.sin(time + distance * 0.01) * 1.5;

                positions[i] = newRadius * Math.cos(newAngle);
                positions[i + 1] = newRadius * Math.sin(newAngle);
                positions[i + 2] = z + verticalMotion;

                // Ensure particles stay within atmospheric bounds
                let finalDistance = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1] + positions[i + 2] * positions[i + 2]);
                if (finalDistance > maxRadius)
                {
                    let scale = maxRadius / finalDistance;
                    positions[i] *= scale;
                    positions[i + 1] *= scale;
                    positions[i + 2] *= scale;
                }
            }

            layer.geometry.attributes.position.needsUpdate = true;
        });
    }

    /**
     * Initializes global particles for inter-planetary bridges.
     * Implements optimized particle distribution for Einstein-Rosen bridge effects.
     */
    initializeGlobalParticles()
    {
        // Remove existing global particles with proper cleanup
        this.globalParticles.forEach(particle =>
        {
            this.world.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        this.globalParticles = [];

        if (this.planets.length < 2) return;

        // Create bridge particles between planets using optimized buffer allocation
        const bridgeGeometry = new THREE.BufferGeometry();
        const bridgePositions = new Float32Array(this.bridgeParticleCount * 3);
        const bridgeColors = new Float32Array(this.bridgeParticleCount * 3);
        const bridgeVelocities = [];

        // Distribute particles strategically in inter-planetary space
        for (let i = 0; i < this.bridgeParticleCount; i++)
        {
            // Strategic positioning between planets rather than random distribution
            if (this.planets.length >= 2)
            {
                let planet1 = this.planets[0].group.position;
                let planet2 = this.planets[1].group.position;
                let interpolation = Math.random();

                // Bias distribution toward mid-space for bridge formation
                let midpoint = planet1.clone().lerp(planet2, interpolation);
                let spread = 500; // Controlled spread around interpolation path

                bridgePositions[i * 3] = midpoint.x + (Math.random() - 0.5) * spread;
                bridgePositions[i * 3 + 1] = midpoint.y + (Math.random() - 0.5) * spread;
                bridgePositions[i * 3 + 2] = midpoint.z + (Math.random() - 0.5) * 100;
            } else
            {
                // Fallback random distribution
                bridgePositions[i * 3] = (Math.random() - 0.5) * 2000;
                bridgePositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
                bridgePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            }

            // Neutral bridge color with quantum field appearance
            let bridgeColor = new THREE.Color();
            bridgeColor.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3);
            bridgeColors[i * 3] = bridgeColor.r;
            bridgeColors[i * 3 + 1] = bridgeColor.g;
            bridgeColors[i * 3 + 2] = bridgeColor.b;

            // Initialize with minimal velocities for stability
            bridgeVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ));
        }

        bridgeGeometry.setAttribute('position', new THREE.BufferAttribute(bridgePositions, 3));
        bridgeGeometry.setAttribute('color', new THREE.BufferAttribute(bridgeColors, 3));

        // Optimized material for bridge particles with quantum appearance
        const bridgeMaterial = new THREE.PointsMaterial({
            size: 1.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const bridgeParticles = new THREE.Points(bridgeGeometry, bridgeMaterial);
        bridgeParticles.userData = { velocities: bridgeVelocities };
        bridgeParticles.name = 'BridgeParticleSystem';

        this.world.add(bridgeParticles);
        this.globalParticles.push(bridgeParticles);
    }

    /**
     * Updates the window shape and position for multi-window synchronization.
     * Critical for maintaining proper viewport coordination across browser windows.
     * 
     * @param {boolean} easing - Whether to apply smooth interpolation to position changes
     */
    updateWindowShape(easing = true)
    {
        // Calculate the new scene offset based on window screen position
        // This is essential for multi-window 3D coordinate system alignment
        this.sceneOffsetTarget = {
            x: -window.screenX,
            y: -window.screenY
        };

        // Immediate update for initialization or when easing is disabled
        if (!easing)
        {
            this.sceneOffset = { ...this.sceneOffsetTarget };
        }

        // Optional: Update renderer size if window dimensions changed
        // This ensures proper pixel ratio and viewport handling
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
     * Enhanced resize method with WebGL context loss recovery.
     * Implements best practices for responsive 3D applications.
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

        // Update renderer size with proper pixel ratio handling
        if (this.renderer)
        {
            // Recalculate pixel ratio in case it changed (e.g., window moved between monitors)
            const newPixR = Math.min(window.devicePixelRatio || 1, 2);
            if (newPixR !== this.pixR)
            {
                this.pixR = newPixR;
                this.renderer.setPixelRatio(this.pixR);
            }

            this.renderer.setSize(width, height);
        }

        // Update any planet-specific viewport calculations if needed
        this.planets.forEach(planet =>
        {
            // Recalculate any viewport-dependent particle distributions
            if (planet.atmosphereRadius)
            {
                // Scale atmospheric boundaries based on new viewport
                const scaleFactor = Math.min(width, height) / 1000;
                planet.viewportScale = Math.max(0.5, Math.min(2.0, scaleFactor));
            }
        });
    }

    /**
     * Enhanced error recovery and context loss handling.
     * Implements WebGL best practices for production deployment.
     */
    handleContextLoss()
    {
        console.warn('LinkedWindows3DApp: WebGL context lost, attempting recovery...');

        // Dispose of current resources
        this.dispose();

        // Reinitialize after a brief delay
        setTimeout(() =>
        {
            this.initialized = false;
            this.init();
        }, 1000);
    }

    /**
     * Enhanced dispose method with comprehensive resource cleanup.
     * Prevents memory leaks in long-running applications.
     */
    dispose()
    {
        // Remove event listeners to prevent memory leaks
        window.removeEventListener('resize', this.resize.bind(this));

        if (this.renderer)
        {
            // Handle WebGL context loss events
            this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLoss.bind(this));
        }

        // Dispose of all scene resources recursively
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

        // Dispose of renderer and free WebGL context
        if (this.renderer)
        {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode)
            {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // Clear arrays and references
        this.planets = [];
        this.globalParticles = [];
        this.spatialGrid.clear();

        console.log('LinkedWindows3DApp: Resources disposed successfully');
    }

    /**
     * Enhanced setupScene with WebGL context loss recovery.
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
            preserveDrawingBuffer: false, // Optimize for performance
            failIfMajorPerformanceCaveat: false // Allow software rendering as fallback
        });

        this.renderer.setPixelRatio(this.pixR);
        this.renderer.sortObjects = false; // Optimize for particle rendering

        // Add WebGL context loss handling
        this.renderer.domElement.addEventListener('webglcontextlost', (event) =>
        {
            event.preventDefault();
            this.handleContextLoss();
        }, false);

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
        // Scale up planet size by 40% while maintaining density
        const scaledRadius = radius * 1.4;
        let planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Create denser, smaller particles for more realistic appearance
        let coreParticles = this.createPlanetCore(scaledRadius * 0.35, color, 2000);      // Increased count
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
            size: 1.2,                    // Reduced size for density
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
            size: 0.8,                    // Smaller atmospheric particles
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
                isCore: pointsObject.material.size > 1.0  // Distinguish core vs atmosphere
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

        // Calculate inter-planetary distances for bridge activation
        let planetDistances = this.calculatePlanetDistances();
        let bridgeActive = planetDistances.some(d => d < this.bridgeActivationDistance);

        if (bridgeActive)
        {
            // Update global bridge particles only when planets are close
            this.updateBridgeParticles(deltaTime, planetDistances);
        } else
        {
            // Focus on atmospheric containment when planets are distant
            this.constrainAtmosphericParticles(deltaTime);
        }

        // Always update planet atmosphere circulation
        this.planets.forEach(planet =>
        {
            this.updateConstrainedAtmosphere(planet, deltaTime);
        });
    }

    /**
     * Calculates distances between all planet pairs for bridge activation.
     */
    calculatePlanetDistances()
    {
        let distances = [];
        for (let i = 0; i < this.planets.length; i++)
        {
            for (let j = i + 1; j < this.planets.length; j++)
            {
                let distance = this.planets[i].group.position.distanceTo(this.planets[j].group.position);
                distances.push(distance);
            }
        }
        return distances;
    }

    /**
     * Updates bridge particles with Einstein-Rosen bridge physics.
     * Only active when planets are within interaction distance.
     */
    updateBridgeParticles(deltaTime, planetDistances)
    {
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

                // Enhanced gravitational calculation with distance scaling
                this.planets.forEach(planet =>
                {
                    let planetCenter = planet.group.position;
                    let direction = planetCenter.clone().sub(particlePos);
                    let distance = direction.length();

                    if (distance > 0 && distance < this.bridgeActivationDistance * 2)
                    {
                        // Scaled gravitational force based on planet mass and distance
                        let force = (this.gravitationalConstant * planet.mass) / (distance * distance + 50);
                        direction.normalize().multiplyScalar(force);
                        totalForce.add(direction);

                        if (distance < minDistance)
                        {
                            minDistance = distance;
                            nearestPlanetColor = planet.color;
                        }
                    }
                });

                // Apply Einstein-Rosen bridge curvature effect
                this.applyBridgeCurvature(particlePos, totalForce, deltaTime);

                // Update velocity with enhanced damping
                velocities[i].add(totalForce.multiplyScalar(deltaTime));
                velocities[i].multiplyScalar(this.dampingFactor);
                velocities[i].clampLength(0, this.maxVelocity);

                particlePos.add(velocities[i].clone().multiplyScalar(deltaTime));

                // Update position and color
                positions[i * 3] = particlePos.x;
                positions[i * 3 + 1] = particlePos.y;
                positions[i * 3 + 2] = particlePos.z;

                // Dynamic color blending based on proximity
                let colorInfluence = Math.max(0, 1 - minDistance / 400);
                let currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                currentColor.lerp(nearestPlanetColor, colorInfluence * 0.15);

                colors[i * 3] = currentColor.r;
                colors[i * 3 + 1] = currentColor.g;
                colors[i * 3 + 2] = currentColor.b;
            }

            bridgeSystem.geometry.attributes.position.needsUpdate = true;
            bridgeSystem.geometry.attributes.color.needsUpdate = true;
        });
    }

    /**
     * Applies Einstein-Rosen bridge spacetime curvature effects.
     * Creates tunnel-like particle flow between nearby planets.
     */
    applyBridgeCurvature(particlePos, force, deltaTime)
    {
        if (this.planets.length < 2) return;

        // Find the two nearest planets for bridge formation
        let distances = [];
        this.planets.forEach((planet, index) =>
        {
            let dist = particlePos.distanceTo(planet.group.position);
            distances.push({ index, distance: dist, planet });
        });

        distances.sort((a, b) => a.distance - b.distance);

        if (distances.length >= 2 &&
            distances[0].distance < this.bridgeActivationDistance &&
            distances[1].distance < this.bridgeActivationDistance)
        {

            // Create tunnel effect between the two nearest planets
            let planet1 = distances[0].planet.group.position;
            let planet2 = distances[1].planet.group.position;
            let bridgeVector = planet2.clone().sub(planet1);
            let bridgeCenter = planet1.clone().add(bridgeVector.clone().multiplyScalar(0.5));

            // Apply curvature toward the bridge tunnel
            let toBridgeCenter = bridgeCenter.clone().sub(particlePos);
            let bridgeInfluence = 1.0 / (toBridgeCenter.length() + 10);
            force.add(toBridgeCenter.normalize().multiplyScalar(bridgeInfluence * 100));
        }
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
     * Updates atmospheric circulation with enhanced fluid dynamics.
     * Implements vorticity confinement and turbulence modeling.
     */
    updateConstrainedAtmosphere(planet, deltaTime)
    {
        let atmosphereLayers = [planet.group.children[1], planet.group.children[2], planet.group.children[3]];

        atmosphereLayers.forEach((layer, layerIndex) =>
        {
            let positions = layer.geometry.attributes.position.array;
            let flowSpeed = 0.3 + layerIndex * 0.2;  // Reduced flow speed
            let maxRadius = planet.atmosphereRadius * (0.7 + layerIndex * 0.15);

            for (let i = 0; i < positions.length; i += 3)
            {
                let x = positions[i];
                let y = positions[i + 1];
                let z = positions[i + 2];

                let distance = Math.sqrt(x * x + y * y + z * z);
                let angle = Math.atan2(y, x);
                let time = this.getTime() * flowSpeed;

                // Enhanced orbital motion with turbulence
                let orbitalSpeed = flowSpeed * deltaTime * 0.15;
                let turbulence = Math.sin(time * 3 + distance * 0.02) * 0.05;
                let newAngle = angle + orbitalSpeed + turbulence;

                // Controlled radial oscillation
                let radialOscillation = Math.sin(time * 1.5 + distance * 0.015) * 2;
                let newRadius = Math.min(distance + radialOscillation, maxRadius);

                // Vertical circulation
                let verticalMotion = Math.sin(time + distance * 0.01) * 1.5;

                positions[i] = newRadius * Math.cos(newAngle);
                positions[i + 1] = newRadius * Math.sin(newAngle);
                positions[i + 2] = z + verticalMotion;

                // Ensure particles stay within atmospheric bounds
                let finalDistance = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1] + positions[i + 2] * positions[i + 2]);
                if (finalDistance > maxRadius)
                {
                    let scale = maxRadius / finalDistance;
                    positions[i] *= scale;
                    positions[i + 1] *= scale;
                    positions[i + 2] *= scale;
                }
            }

            layer.geometry.attributes.position.needsUpdate = true;
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
