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

        // Add atmospheric rim lighting for depth
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
     * Fixed to ensure planet centers remain properly positioned relative to windows.
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
            // Increased base radius for bigger spheres
            let radius = 120 + i * 25; // Increased from 80 + i * 20

            let planet = this.createParticlePlanet(radius, planetColor, i);

            // Fix: Use absolute window center coordinates without scene offset
            // This ensures planets stay centered in their respective windows
            planet.group.position.x = win.shape.x + (win.shape.w * 0.5);
            planet.group.position.y = win.shape.y + (win.shape.h * 0.5);
            planet.group.position.z = 0; // Ensure Z is consistent

            // Store the target position for stable positioning
            planet.targetPosition = {
                x: win.shape.x + (win.shape.w * 0.5),
                y: win.shape.y + (win.shape.h * 0.5),
                z: 0
            };

            this.world.add(planet.group);
            this.planets.push(planet);
        }

        // Reinitialize global particles for inter-planetary bridges
        this.initializeGlobalParticles();
    }

    /**
     * Creates a particle planet with dense core and flowing atmosphere.
     * Increased size for better visibility and bridge formation.
     */
    createParticlePlanet(radius, color, planetIndex)
    {
        // Increased scale for bigger spheres
        const scaledRadius = radius * 1.6; // Increased from 1.4
        let planetGroup = new THREE.Group();
        planetGroup.name = `Planet_${planetIndex}`;

        // Create denser, larger particles for more realistic appearance
        let coreParticles = this.createPlanetCore(scaledRadius * 0.4, color, 2500); // Increased from 0.35 and 2000
        planetGroup.add(coreParticles);

        // Multi-layered atmosphere with enhanced density for bridge formation
        let innerAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.7, color, 3500, 0.8); // Increased
        planetGroup.add(innerAtmosphere);

        let middleAtmosphere = this.createAtmosphereLayer(scaledRadius * 0.9, color, 2800, 0.6); // Increased
        planetGroup.add(middleAtmosphere);

        let outerAtmosphere = this.createAtmosphereLayer(scaledRadius * 1.2, color, 2000, 0.4); // Increased
        planetGroup.add(outerAtmosphere);

        // Enhanced particle data structure for physics simulation
        let particleData = {
            group: planetGroup,
            radius: scaledRadius,
            atmosphereRadius: scaledRadius * 1.5, // Increased for better bridge formation
            color: color,
            center: new THREE.Vector3(),
            mass: 1500, // Increased mass for stronger gravitational pull
            targetPosition: { x: 0, y: 0, z: 0 }, // Will be set in updatePlanets
            coreParticles: this.extractParticleData(coreParticles),
            atmosphereParticles: [
                this.extractParticleData(innerAtmosphere),
                this.extractParticleData(middleAtmosphere),
                this.extractParticleData(outerAtmosphere)
            ],
            velocities: this.initializeConstrainedVelocities(coreParticles, [innerAtmosphere, middleAtmosphere, outerAtmosphere]),
            lastPositions: []
        };

        return particleData;
    }

    /**
     * Enhanced bridge particle initialization with improved distribution.
     * Creates particles that naturally flow between planets.
     */
    initializeGlobalParticles()
    {
        // Remove existing global particles with proper WebGL resource cleanup
        this.globalParticles.forEach(particle =>
        {
            this.world.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        this.globalParticles = [];

        if (this.planets.length < 2) return;

        // Increased particle count for better bridge effects
        const enhancedBridgeCount = this.bridgeParticleCount * 1.5;
        const bridgeGeometry = new THREE.BufferGeometry();
        const bridgePositions = new Float32Array(enhancedBridgeCount * 3);
        const bridgeColors = new Float32Array(enhancedBridgeCount * 3);
        const bridgeVelocities = [];

        // Enhanced inter-planetary particle distribution
        for (let i = 0; i < enhancedBridgeCount; i++)
        {
            let distributionType = Math.random();

            if (distributionType < 0.6 && this.planets.length >= 2)
            {
                // 60% of particles distributed along potential bridge paths
                let planetA = this.planets[Math.floor(Math.random() * this.planets.length)];
                let planetB = this.planets[Math.floor(Math.random() * this.planets.length)];

                if (planetA !== planetB)
                {
                    let posA = planetA.targetPosition || planetA.group.position;
                    let posB = planetB.targetPosition || planetB.group.position;

                    // Create particles along the path between planets
                    let interpolation = Math.random();
                    let bridgePoint = {
                        x: posA.x + (posB.x - posA.x) * interpolation,
                        y: posA.y + (posB.y - posA.y) * interpolation,
                        z: posA.z + (posB.z - posA.z) * interpolation
                    };

                    // Add some spread around the bridge path
                    let spread = 200;
                    bridgePositions[i * 3] = bridgePoint.x + (Math.random() - 0.5) * spread;
                    bridgePositions[i * 3 + 1] = bridgePoint.y + (Math.random() - 0.5) * spread;
                    bridgePositions[i * 3 + 2] = bridgePoint.z + (Math.random() - 0.5) * 50;

                    // Initialize with velocity toward the destination planet
                    let direction = {
                        x: posB.x - bridgePoint.x,
                        y: posB.y - bridgePoint.y,
                        z: posB.z - bridgePoint.z
                    };
                    let distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
                    if (distance > 0)
                    {
                        direction.x /= distance;
                        direction.y /= distance;
                        direction.z /= distance;
                    }

                    bridgeVelocities.push(new THREE.Vector3(
                        direction.x * 0.3 + (Math.random() - 0.5) * 0.1,
                        direction.y * 0.3 + (Math.random() - 0.5) * 0.1,
                        direction.z * 0.3 + (Math.random() - 0.5) * 0.1
                    ));
                }
                else
                {
                    // Fallback to random distribution
                    bridgePositions[i * 3] = (Math.random() - 0.5) * 2000;
                    bridgePositions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
                    bridgePositions[i * 3 + 2] = (Math.random() - 0.5) * 200;

                    bridgeVelocities.push(new THREE.Vector3(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    ));
                }
            }
            else
            {
                // 40% random distribution for ambient particles
                bridgePositions[i * 3] = (Math.random() - 0.5) * 3000;
                bridgePositions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
                bridgePositions[i * 3 + 2] = (Math.random() - 0.5) * 300;

                bridgeVelocities.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ));
            }

            // Enhanced quantum field appearance
            let bridgeColor = new THREE.Color();
            bridgeColor.setHSL(0.55 + Math.random() * 0.3, 0.9, 0.6 + Math.random() * 0.3);
            bridgeColors[i * 3] = bridgeColor.r;
            bridgeColors[i * 3 + 1] = bridgeColor.g;
            bridgeColors[i * 3 + 2] = bridgeColor.b;
        }

        bridgeGeometry.setAttribute('position', new THREE.BufferAttribute(bridgePositions, 3));
        bridgeGeometry.setAttribute('color', new THREE.BufferAttribute(bridgeColors, 3));

        // Enhanced material for better bridge visibility
        const bridgeMaterial = new THREE.PointsMaterial({
            size: 1.2, // Slightly larger for better visibility
            vertexColors: true,
            transparent: true,
            opacity: 0.8, // Increased opacity
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
     * Enhanced bridge particle physics with bidirectional flow.
     * Creates realistic particle streams flowing between planets.
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
                let closestPlanet = null;

                // Enhanced gravitational calculation with atmospheric attraction
                this.planets.forEach(planet =>
                {
                    let planetCenter = planet.group.position;
                    let direction = planetCenter.clone().sub(particlePos);
                    let distance = direction.length();

                    if (distance > 0)
                    {
                        // Enhanced force calculation for better bridge formation
                        let atmosphereDistance = distance - planet.atmosphereRadius;
                        let force;

                        if (atmosphereDistance < 0)
                        {
                            // Inside atmosphere - gentle circulation force
                            force = (this.gravitationalConstant * planet.mass * 0.3) / (distance * distance + 25);
                        }
                        else if (atmosphereDistance < this.bridgeActivationDistance)
                        {
                            // Bridge formation zone - strong attraction
                            force = (this.gravitationalConstant * planet.mass * 1.5) / (distance * distance + 50);
                        }
                        else
                        {
                            // Distant particles - weak attraction
                            force = (this.gravitationalConstant * planet.mass * 0.5) / (distance * distance + 100);
                        }

                        direction.normalize().multiplyScalar(force);
                        totalForce.add(direction);

                        if (distance < minDistance)
                        {
                            minDistance = distance;
                            nearestPlanetColor = planet.color;
                            closestPlanet = planet;
                        }
                    }
                });

                // Enhanced bidirectional flow mechanics
                if (closestPlanet && this.planets.length >= 2)
                {
                    // Find the second closest planet for bridge flow
                    let secondClosest = null;
                    let secondMinDistance = Infinity;

                    this.planets.forEach(planet =>
                    {
                        if (planet !== closestPlanet)
                        {
                            let distance = particlePos.distanceTo(planet.group.position);
                            if (distance < secondMinDistance)
                            {
                                secondMinDistance = distance;
                                secondClosest = planet;
                            }
                        }
                    });

                    if (secondClosest)
                    {
                        // Create flow direction based on particle position
                        let bridgeVector = secondClosest.group.position.clone().sub(closestPlanet.group.position);
                        let bridgeProgress = particlePos.clone().sub(closestPlanet.group.position).dot(bridgeVector) / bridgeVector.lengthSq();

                        // Oscillating flow pattern for back-and-forth movement
                        let flowDirection = Math.sin(this.getTime() * 0.5 + bridgeProgress * Math.PI * 4);
                        let targetPlanet = flowDirection > 0 ? secondClosest : closestPlanet;

                        let flowForce = targetPlanet.group.position.clone().sub(particlePos);
                        let flowDistance = flowForce.length();
                        if (flowDistance > 0)
                        {
                            flowForce.normalize().multiplyScalar(50 / (flowDistance + 10));
                            totalForce.add(flowForce);
                        }
                    }
                }

                // Apply Einstein-Rosen bridge curvature effect
                this.applyBridgeCurvature(particlePos, totalForce, deltaTime);

                // Update velocity with enhanced damping
                velocities[i].add(totalForce.multiplyScalar(deltaTime));
                velocities[i].multiplyScalar(this.dampingFactor * 0.98); // Slightly less damping for better flow
                velocities[i].clampLength(0, this.maxVelocity * 1.5); // Allow higher velocity for bridge particles

                particlePos.add(velocities[i].clone().multiplyScalar(deltaTime));

                // Particle recycling when too far from any planet
                let minPlanetDistance = Math.min(...this.planets.map(p => particlePos.distanceTo(p.group.position)));
                if (minPlanetDistance > this.bridgeActivationDistance * 3)
                {
                    // Respawn particle near a random planet's atmosphere
                    let randomPlanet = this.planets[Math.floor(Math.random() * this.planets.length)];
                    let spawnRadius = randomPlanet.atmosphereRadius * 1.1;
                    let spawnAngle = Math.random() * Math.PI * 2;

                    particlePos.x = randomPlanet.group.position.x + Math.cos(spawnAngle) * spawnRadius;
                    particlePos.y = randomPlanet.group.position.y + Math.sin(spawnAngle) * spawnRadius;
                    particlePos.z = randomPlanet.group.position.z + (Math.random() - 0.5) * 50;

                    // Reset velocity toward bridge formation
                    velocities[i].set(
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    );
                }

                // Update position and color
                positions[i * 3] = particlePos.x;
                positions[i * 3 + 1] = particlePos.y;
                positions[i * 3 + 2] = particlePos.z;

                // Enhanced dynamic color blending
                let colorInfluence = Math.max(0, 1 - minDistance / (this.bridgeActivationDistance * 2));
                let currentColor = new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
                currentColor.lerp(nearestPlanetColor, colorInfluence * 0.3);

                colors[i * 3] = currentColor.r;
                colors[i * 3 + 1] = currentColor.g;
                colors[i * 3 + 2] = currentColor.b;
            }

            bridgeSystem.geometry.attributes.position.needsUpdate = true;
            bridgeSystem.geometry.attributes.color.needsUpdate = true;
        });
    }

    /**
     * Main render loop with enhanced planet positioning.
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

        // Enhanced planet position synchronization
        for (let i = 0; i < this.planets.length; i++)
        {
            let planet = this.planets[i];
            let win = wins[i];
            if (!win || !win.shape) continue;

            // Calculate absolute target position
            let posTarget = {
                x: win.shape.x + (win.shape.w * 0.5),
                y: win.shape.y + (win.shape.h * 0.5),
                z: 0
            };

            // Update target position for consistent referencing
            planet.targetPosition = posTarget;

            // Immediate position update for better synchronization
            planet.group.position.x = posTarget.x;
            planet.group.position.y = posTarget.y;
            planet.group.position.z = posTarget.z;

            // Update planet center for physics calculations
            planet.center.copy(planet.group.position);

            // Gentle rotation for visual appeal
            planet.group.rotation.y += deltaTime * 0.08;
            planet.group.rotation.x += deltaTime * 0.04;
        }

        // Run enhanced particle physics simulation
        this.updateParticlePhysics(Math.min(deltaTime, 0.016));

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
        this.globalParticles = [];
        this.spatialGrid.clear();

        console.log('LinkedWindows3DApp: Resources disposed successfully');
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
            this.initializeGlobalParticles();
            this.render();

            // Bind resize handler with proper context
            window.addEventListener('resize', this.resizeHandler);
        }, 500);
    }

    /**
     * Updates window shape when window geometry changes.
     * @param {boolean} [resize=true] - Whether to trigger a resize update
     */
    updateWindowShape(resize = true)
    {
        if (resize)
        {
            this.resize();
        }

        // Update scene offset based on window manager state
        if (this.windowManager)
        {
            const windows = this.windowManager.getWindows();
            if (windows.length > 0)
            {
                // Calculate optimal scene offset to center the view
                let totalX = 0, totalY = 0;
                windows.forEach(win =>
                {
                    totalX += win.shape.x + win.shape.w * 0.5;
                    totalY += win.shape.y + win.shape.h * 0.5;
                });

                this.sceneOffsetTarget.x = -totalX / windows.length + window.innerWidth * 0.5;
                this.sceneOffsetTarget.y = -totalY / windows.length + window.innerHeight * 0.5;
            }
        }
    }

    /**
     * Generates deterministic planet colors based on index and window ID.
     * @param {number} index - Planet index
     * @param {string} windowId - Window identifier
     * @returns {THREE.Color} Generated planet color
     */
    generatePlanetColor(index, windowId)
    {
        // Create deterministic color based on window ID and index
        let hash = 0;
        const str = windowId + index.toString();
        for (let i = 0; i < str.length; i++)
        {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        // Generate pleasant color variations
        const hue = (Math.abs(hash) % 360) / 360;
        const saturation = 0.7 + (Math.abs(hash >> 8) % 30) / 100; // 0.7 - 1.0
        const lightness = 0.5 + (Math.abs(hash >> 16) % 30) / 100;  // 0.5 - 0.8

        return new THREE.Color().setHSL(hue, saturation, lightness);
    }

    /**
     * Creates the dense particle core of a planet.
     * @param {number} radius - Core radius
     * @param {THREE.Color} color - Core color
     * @param {number} particleCount - Number of particles
     * @returns {THREE.Points} Core particle system
     */
    createPlanetCore(radius, color, particleCount)
    {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++)
        {
            // Spherical distribution with bias toward center
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = radius * Math.pow(Math.random(), 0.7); // Bias toward center

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Color variation
            const colorVariation = new THREE.Color(color);
            colorVariation.multiplyScalar(0.8 + Math.random() * 0.4);

            colors[i * 3] = colorVariation.r;
            colors[i * 3 + 1] = colorVariation.g;
            colors[i * 3 + 2] = colorVariation.b;

            sizes[i] = 1.5 + Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Creates an atmospheric layer with flowing particles.
     * @param {number} radius - Layer radius
     * @param {THREE.Color} baseColor - Base color
     * @param {number} particleCount - Number of particles
     * @param {number} opacity - Layer opacity
     * @returns {THREE.Points} Atmosphere particle system
     */
    createAtmosphereLayer(radius, baseColor, particleCount, opacity)
    {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++)
        {
            // Spherical shell distribution
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = 2 * Math.PI * Math.random();
            const r = radius * (0.8 + Math.random() * 0.4); // Shell thickness

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Atmospheric color with transparency gradient
            const atmosphereColor = new THREE.Color(baseColor);
            atmosphereColor.lerp(new THREE.Color(0.8, 0.9, 1.0), 0.3);
            atmosphereColor.multiplyScalar(0.6 + Math.random() * 0.6);

            colors[i * 3] = atmosphereColor.r;
            colors[i * 3 + 1] = atmosphereColor.g;
            colors[i * 3 + 2] = atmosphereColor.b;

            sizes[i] = 0.8 + Math.random() * 1.2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        return new THREE.Points(geometry, material);
    }

    /**
     * Extracts particle data for physics simulation.
     * @param {THREE.Points} particleSystem - Particle system
     * @returns {Object} Extracted particle data
     */
    extractParticleData(particleSystem)
    {
        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = [];

        for (let i = 0; i < positions.length / 3; i++)
        {
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ));
        }

        return {
            positions: positions,
            velocities: velocities,
            particleSystem: particleSystem
        };
    }

    /**
     * Initializes constrained velocities for planet particles.
     * @param {THREE.Points} core - Core particle system
     * @param {Array<THREE.Points>} atmosphereLayers - Atmosphere layers
     * @returns {Array<THREE.Vector3>} Velocity arrays
     */
    initializeConstrainedVelocities(core, atmosphereLayers)
    {
        const allVelocities = [];

        // Core velocities - minimal movement
        const coreCount = core.geometry.attributes.position.count;
        for (let i = 0; i < coreCount; i++)
        {
            allVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ));
        }

        // Atmosphere velocities - orbital motion
        atmosphereLayers.forEach(layer =>
        {
            const layerCount = layer.geometry.attributes.position.count;
            for (let i = 0; i < layerCount; i++)
            {
                allVelocities.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2
                ));
            }
        });

        return allVelocities;
    }

    /**
     * Applies Einstein-Rosen bridge curvature effects to particles.
     * @param {THREE.Vector3} particlePos - Particle position
     * @param {THREE.Vector3} force - Current force vector
     * @param {number} deltaTime - Frame time delta
     */
    applyBridgeCurvature(particlePos, force, deltaTime)
    {
        if (this.planets.length < 2) return;

        // Find nearest two planets for bridge curvature
        const distances = this.planets.map(planet => ({
            planet: planet,
            distance: particlePos.distanceTo(planet.group.position)
        })).sort((a, b) => a.distance - b.distance);

        if (distances.length >= 2)
        {
            const planet1 = distances[0].planet;
            const planet2 = distances[1].planet;

            // Calculate bridge midpoint
            const bridgeMidpoint = planet1.group.position.clone()
                .add(planet2.group.position)
                .multiplyScalar(0.5);

            // Apply curvature force toward bridge path
            const toBridge = bridgeMidpoint.clone().sub(particlePos);
            const bridgeDistance = toBridge.length();

            if (bridgeDistance > 0 && bridgeDistance < this.bridgeActivationDistance)
            {
                const curvatureStrength = 20 / (bridgeDistance + 10);
                toBridge.normalize().multiplyScalar(curvatureStrength);
                force.add(toBridge);
            }
        }
    }

    /**
     * Updates particle physics simulation.
     * @param {number} deltaTime - Frame time delta
     */
    updateParticlePhysics(deltaTime)
    {
        // Calculate planet distances for optimization
        const planetDistances = new Map();
        for (let i = 0; i < this.planets.length; i++)
        {
            for (let j = i + 1; j < this.planets.length; j++)
            {
                const distance = this.planets[i].group.position.distanceTo(this.planets[j].group.position);
                planetDistances.set(`${i}-${j}`, distance);
            }
        }

        // Update bridge particles
        this.updateBridgeParticles(deltaTime, planetDistances);

        // Update planet internal particles (simplified for performance)
        this.planets.forEach(planet =>
        {
            // Gentle rotation and internal motion
            planet.group.children.forEach(particleSystem =>
            {
                if (particleSystem.geometry && particleSystem.geometry.attributes.position)
                {
                    const positions = particleSystem.geometry.attributes.position.array;
                    for (let i = 0; i < positions.length; i += 3)
                    {
                        // Subtle internal motion
                        positions[i] += (Math.random() - 0.5) * 0.1 * deltaTime;
                        positions[i + 1] += (Math.random() - 0.5) * 0.1 * deltaTime;
                        positions[i + 2] += (Math.random() - 0.5) * 0.1 * deltaTime;
                    }
                    particleSystem.geometry.attributes.position.needsUpdate = true;
                }
            });
        });
    }

    /**
     * Handles WebGL context loss for graceful recovery.
     */
    handleContextLoss()
    {
        console.warn('LinkedWindows3DApp: WebGL context lost, attempting recovery...');

        // Clear existing resources
        this.planets = [];
        this.globalParticles = [];

        // Attempt to reinitialize after a delay
        setTimeout(() =>
        {
            try
            {
                this.setupScene();
                this.initializeGlobalParticles();
                console.log('LinkedWindows3DApp: WebGL context recovered successfully');
            } catch (error)
            {
                console.error('LinkedWindows3DApp: Context recovery failed:', error);
            }
        }, 1000);
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
