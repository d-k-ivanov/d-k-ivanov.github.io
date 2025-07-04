class JuliaSetRenderer
{
    constructor()
    {
        this.canvas = null;
        this.device = null;
        this.context = null;
        this.renderPipeline = null;
        this.computePipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.mouseState = {
            x: 0,
            y: 0,
            pressed: false,
            lastX: 0,
            lastY: 0,
            button: -1 // Track which button is pressed
        };
        this.juliaParams = {
            c_real: -0.7,
            c_imag: 0.27015,
            zoom: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            maxIterations: 256,
            colorOffset: 0.0
        };
        // Add precision tracking for infinite zoom
        this.zoomPrecision = {
            logZoom: 0.0, // Natural log of zoom for higher precision
            centerX: 0.0, // High-precision center coordinates
            centerY: 0.0,
            maxLogZoom: 50.0 // Theoretical limit (zoom factor ~10^21)
        };
        this.animationId = null;
        this.resizeObserver = null;
        this.complexCoordinates = {
            x: 0,
            y: 0
        };
        this.coordDisplay = null;
    }

    async init()
    {
        await this.setupWebGPU();
        this.setupFullScreenCanvas();
        this.createBuffers();
        this.createPipelines();
        this.setupEventListeners();
        this.startRenderLoop();
    }

    async setupWebGPU()
    {
        // Check WebGPU support
        if (!navigator.gpu)
        {
            throw new Error('WebGPU not supported on this browser.');
        }

        // Request adapter and device with optimal settings
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance'
        });
        if (!adapter)
        {
            throw new Error('No appropriate GPUAdapter found.');
        }

        this.device = await adapter.requestDevice({
            requiredFeatures: [],
            requiredLimits: {}
        });

        // Setup canvas and context
        this.canvas = document.getElementById('juliaCanvas') || this.createFullScreenCanvas();
        this.context = this.canvas.getContext('webgpu');

        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: canvasFormat,
            alphaMode: 'premultiplied'
        });

        this.canvasFormat = canvasFormat;
    }

    createFullScreenCanvas()
    {
        const canvas = document.createElement('canvas');
        canvas.id = 'juliaCanvas';

        // Full-screen styling with CSS
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: block;
            cursor: crosshair;
            background: #000;
            z-index: 1;
        `;

        // Ensure body and html don't interfere
        document.body.style.cssText = `
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
        `;

        document.documentElement.style.cssText = `
            margin: 0;
            padding: 0;
            height: 100%;
        `;

        document.body.appendChild(canvas);
        return canvas;
    }

    setupFullScreenCanvas()
    {
        // High-DPI aware canvas sizing
        const updateCanvasSize = () =>
        {
            const rect = this.canvas.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;

            // Set actual canvas resolution (considering device pixel ratio)
            this.canvas.width = rect.width * pixelRatio;
            this.canvas.height = rect.height * pixelRatio;

            // Ensure CSS size matches viewport
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
        };

        updateCanvasSize();

        // Modern ResizeObserver for efficient resize handling
        if (window.ResizeObserver)
        {
            this.resizeObserver = new ResizeObserver((entries) =>
            {
                for (const entry of entries)
                {
                    if (entry.target === this.canvas)
                    {
                        updateCanvasSize();
                        this.updateUniforms();
                    }
                }
            });
            this.resizeObserver.observe(this.canvas);
        }
    }

    createBuffers()
    {
        // Create uniform buffer for Julia set parameters with proper alignment
        const uniformData = new Float32Array([
            this.juliaParams.c_real,        // c.x (real part)
            this.juliaParams.c_imag,        // c.y (imaginary part)
            this.juliaParams.zoom,          // zoom level
            this.juliaParams.offsetX,       // pan offset X
            this.juliaParams.offsetY,       // pan offset Y
            this.juliaParams.maxIterations, // max iterations
            this.juliaParams.colorOffset,   // color animation offset
            this.canvas.width,              // canvas width
            this.canvas.height,             // canvas height
            0, 0, 0                         // padding for 16-byte alignment
        ]);

        this.uniformBuffer = this.device.createBuffer({
            size: Math.max(uniformData.byteLength, 256), // Ensure minimum buffer size
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    createPipelines()
    {
        // Optimized vertex shader for full-screen rendering
        const vertexShaderCode = `
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) uv: vec2<f32>,
            }

            @vertex
            fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                // Full-screen triangle strip for optimal rasterization
                var pos = array<vec2<f32>, 6>(
                    vec2<f32>(-1.0, -1.0), // Bottom-left
                    vec2<f32>( 1.0, -1.0), // Bottom-right
                    vec2<f32>(-1.0,  1.0), // Top-left
                    vec2<f32>( 1.0, -1.0), // Bottom-right
                    vec2<f32>( 1.0,  1.0), // Top-right
                    vec2<f32>(-1.0,  1.0)  // Top-left
                );

                var uv = array<vec2<f32>, 6>(
                    vec2<f32>(0.0, 1.0), // UV coordinates flipped for proper orientation
                    vec2<f32>(1.0, 1.0),
                    vec2<f32>(0.0, 0.0),
                    vec2<f32>(1.0, 1.0),
                    vec2<f32>(1.0, 0.0),
                    vec2<f32>(0.0, 0.0)
                );

                var output: VertexOutput;
                output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                output.uv = uv[vertexIndex];
                return output;
            }
        `;

        // High-quality fragment shader with optimized Julia set computation
        const fragmentShaderCode = `
            struct Uniforms {
                c_real: f32,
                c_imag: f32,
                zoom: f32,
                offset_x: f32,
                offset_y: f32,
                max_iterations: f32,
                color_offset: f32,
                canvas_width: f32,
                canvas_height: f32,
            }

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;

            fn julia_set(z: vec2<f32>, c: vec2<f32>) -> f32 {
                var z_current = z;
                var iterations = 0.0;
                let max_iter = i32(uniforms.max_iterations);

                for (var i = 0; i < max_iter; i++) {
                    let z_magnitude_sq = dot(z_current, z_current);
                    if (z_magnitude_sq > 4.0) { // Optimized escape condition
                        break;
                    }

                    // Complex multiplication: z = z^2 + c
                    z_current = vec2<f32>(
                        z_current.x * z_current.x - z_current.y * z_current.y + c.x,
                        2.0 * z_current.x * z_current.y + c.y
                    );
                    iterations += 1.0;
                }

                // Smooth iteration count for anti-aliased coloring
                if (iterations < uniforms.max_iterations) {
                    let z_magnitude = length(z_current);
                    return iterations + 1.0 - log2(log2(z_magnitude));
                }

                return iterations;
            }

            fn get_color_from_palette(t: f32) -> vec3<f32> {
                // Carefully chosen color palette for mathematical visualization
                let palette = array<vec3<f32>, 16>(
                    vec3<f32>(0.0, 0.0, 0.1),      // Deep space blue
                    vec3<f32>(0.0, 0.0, 0.3),      // Dark blue
                    vec3<f32>(0.0, 0.1, 0.5),      // Medium blue
                    vec3<f32>(0.0, 0.3, 0.7),      // Blue
                    vec3<f32>(0.0, 0.5, 0.9),      // Light blue
                    vec3<f32>(0.1, 0.6, 0.8),      // Cyan-blue
                    vec3<f32>(0.3, 0.7, 0.7),      // Teal
                    vec3<f32>(0.5, 0.8, 0.6),      // Green-teal
                    vec3<f32>(0.7, 0.9, 0.4),      // Yellow-green
                    vec3<f32>(0.9, 0.9, 0.2),      // Yellow
                    vec3<f32>(1.0, 0.8, 0.1),      // Orange-yellow
                    vec3<f32>(1.0, 0.6, 0.0),      // Orange
                    vec3<f32>(1.0, 0.4, 0.1),      // Red-orange
                    vec3<f32>(0.9, 0.2, 0.2),      // Red
                    vec3<f32>(0.7, 0.1, 0.3),      // Dark red
                    vec3<f32>(0.5, 0.0, 0.4)       // Purple-red
                );

                let index = t * 15.0;
                let i = i32(floor(index));
                let frac = fract(index);

                // Safe array indexing with clamping
                let i0 = clamp(i, 0, 15);
                let i1 = clamp(i + 1, 0, 15);

                // Smooth color interpolation
                return mix(palette[i0], palette[i1], frac);
            }

            @fragment
            fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
                // Convert UV to complex plane with proper aspect ratio handling
                let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;
                let z = vec2<f32>(
                    (uv.x - 0.5) * 4.0 * aspect_ratio / uniforms.zoom + uniforms.offset_x,
                    (uv.y - 0.5) * 4.0 / uniforms.zoom + uniforms.offset_y
                );

                let c = vec2<f32>(uniforms.c_real, uniforms.c_imag);
                let iterations = julia_set(z, c);

                // High-contrast rendering for mathematical clarity
                if (iterations >= uniforms.max_iterations) {
                    return vec4<f32>(0.0, 0.0, 0.0, 1.0); // Pure black for the set
                }

                // Dynamic color mapping with smooth transitions
                let t = fract(iterations / 32.0);
                let rgb = get_color_from_palette(t);

                // Depth-based brightness for visual hierarchy
                let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.max_iterations);

                return vec4<f32>(rgb * brightness, 1.0);
            }
        `;

        // Create shader modules with error handling
        const vertexShader = this.device.createShaderModule({
            code: vertexShaderCode,
            label: 'Julia Set Vertex Shader'
        });

        const fragmentShader = this.device.createShaderModule({
            code: fragmentShaderCode,
            label: 'Julia Set Fragment Shader'
        });

        // Optimized bind group layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            label: 'Julia Set Bind Group Layout',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: 'uniform',
                    minBindingSize: 48 // Explicit size for validation
                }
            }]
        });

        // Create pipeline layout
        const pipelineLayout = this.device.createPipelineLayout({
            label: 'Julia Set Pipeline Layout',
            bindGroupLayouts: [bindGroupLayout]
        });

        // High-performance render pipeline
        this.renderPipeline = this.device.createRenderPipeline({
            label: 'Julia Set Render Pipeline',
            layout: pipelineLayout,
            vertex: {
                module: vertexShader,
                entryPoint: 'main',
            },
            fragment: {
                module: fragmentShader,
                entryPoint: 'main',
                targets: [{
                    format: this.canvasFormat,
                    blend: undefined // No blending for maximum performance
                }],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none' // Full-screen rendering
            },
        });

        // Create bind group
        this.bindGroup = this.device.createBindGroup({
            label: 'Julia Set Bind Group',
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer }
            }]
        });
    }

    setupEventListeners()
    {
        // Enhanced mouse interaction - only left button changes Julia parameters
        this.canvas.addEventListener('mousedown', (e) =>
        {
            // Only respond to left mouse button (button 0)
            if (e.button === 0)
            {
                this.mouseState.pressed = true;
                this.mouseState.button = e.button;
                this.updateMousePosition(e);
                this.mouseState.lastX = this.mouseState.x;
                this.mouseState.lastY = this.mouseState.y;
            }
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) =>
        {
            if (e.button === this.mouseState.button)
            {
                this.mouseState.pressed = false;
                this.mouseState.button = -1;
            }
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) =>
        {
            this.updateMousePosition(e);

            // Only update Julia parameters with left mouse button
            if (this.mouseState.pressed && this.mouseState.button === 0)
            {
                const rect = this.canvas.getBoundingClientRect();
                this.juliaParams.c_real = (this.mouseState.x / rect.width - 0.5) * 2.0;
                this.juliaParams.c_imag = (this.mouseState.y / rect.height - 0.5) * 2.0;
            }
            e.preventDefault();
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) =>
        {
            e.preventDefault();
        });

        // Enhanced wheel handling with infinite zoom precision
        this.canvas.addEventListener('wheel', (e) =>
        {
            e.preventDefault();

            // Get mouse position in complex plane for zoom center
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

            // Convert to complex coordinates before zoom
            const aspect = this.canvas.width / this.canvas.height;
            const preZoomX = mouseX * 4.0 * aspect / this.juliaParams.zoom + this.juliaParams.offsetX;
            const preZoomY = mouseY * 4.0 / this.juliaParams.zoom + this.juliaParams.offsetY;

            // Smooth zoom with logarithmic precision
            const zoomStep = e.deltaY > 0 ? -0.2 : 0.2; // Smooth zoom steps in log space
            this.zoomPrecision.logZoom += zoomStep;

            // Clamp to prevent extreme values
            this.zoomPrecision.logZoom = Math.max(-10, Math.min(this.zoomPrecision.maxLogZoom, this.zoomPrecision.logZoom));

            // Update zoom with exponential precision
            this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);

            // Adjust offset to zoom towards mouse position
            const postZoomX = mouseX * 4.0 * aspect / this.juliaParams.zoom + this.juliaParams.offsetX;
            const postZoomY = mouseY * 4.0 / this.juliaParams.zoom + this.juliaParams.offsetY;

            this.juliaParams.offsetX += preZoomX - postZoomX;
            this.juliaParams.offsetY += preZoomY - postZoomY;

            // Update high-precision center tracking
            this.zoomPrecision.centerX = this.juliaParams.offsetX;
            this.zoomPrecision.centerY = this.juliaParams.offsetY;

            // Dynamically adjust iteration count for extreme zoom levels
            const baseIterations = 256;
            const zoomFactor = Math.max(1.0, this.zoomPrecision.logZoom / 10.0);
            this.juliaParams.maxIterations = Math.min(2048, baseIterations * Math.sqrt(zoomFactor));

            // Update coordinate display after zoom
            this.updateCoordinateDisplay();

        }, { passive: false });

        // Enhanced keyboard controls with zoom-adjusted movement
        document.addEventListener('keydown', (e) =>
        {
            // Handle Ctrl+R for page reload (takes precedence over regular R)
            if (e.ctrlKey && (e.key === 'r' || e.key === 'R'))
            {
                // Allow default browser behavior for Ctrl+R (page reload)
                return;
            }

            // Zoom-adaptive step size for smooth navigation at any zoom level
            const baseStep = 0.1;
            const zoomAdjustedStep = baseStep / Math.sqrt(this.juliaParams.zoom);

            switch (e.key)
            {
                case 'ArrowLeft':
                    this.juliaParams.offsetX -= zoomAdjustedStep;
                    this.zoomPrecision.centerX = this.juliaParams.offsetX;
                    break;
                case 'ArrowRight':
                    this.juliaParams.offsetX += zoomAdjustedStep;
                    this.zoomPrecision.centerX = this.juliaParams.offsetX;
                    break;
                case 'ArrowUp':
                    this.juliaParams.offsetY -= zoomAdjustedStep;
                    this.zoomPrecision.centerY = this.juliaParams.offsetY;
                    break;
                case 'ArrowDown':
                    this.juliaParams.offsetY += zoomAdjustedStep;
                    this.zoomPrecision.centerY = this.juliaParams.offsetY;
                    break;
                case 'r':
                case 'R':
                    // Only reset parameters if Ctrl is not pressed
                    if (!e.ctrlKey)
                    {
                        this.resetParameters();
                    }
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    if (document.fullscreenElement)
                    {
                        document.exitFullscreen();
                    }
                    break;
                case '+':
                case '=':
                    // Zoom in with keyboard
                    this.zoomPrecision.logZoom += 0.2;
                    this.zoomPrecision.logZoom = Math.min(this.zoomPrecision.maxLogZoom, this.zoomPrecision.logZoom);
                    this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                    break;
                case '-':
                case '_':
                    // Zoom out with keyboard
                    this.zoomPrecision.logZoom -= 0.2;
                    this.zoomPrecision.logZoom = Math.max(-10, this.zoomPrecision.logZoom);
                    this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                    break;
            }

            // Prevent default for handled keys (but not Ctrl+R)
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', '+', '=', '-', '_'].includes(e.key) || (e.key === 'r' || e.key === 'R') && !e.ctrlKey)
            {
                e.preventDefault();
            }
        });

        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () =>
        {
            if (document.hidden)
            {
                // Pause rendering when tab is hidden
                if (this.animationId)
                {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            } else
            {
                // Resume rendering when tab becomes visible
                if (!this.animationId)
                {
                    this.startRenderLoop();
                }
            }
        });

        // Fallback resize handler for older browsers
        window.addEventListener('resize', () =>
        {
            if (!this.resizeObserver)
            {
                this.setupFullScreenCanvas();
                this.updateUniforms();
            }
        });
    }

    toggleFullscreen()
    {
        if (!document.fullscreenElement)
        {
            this.canvas.requestFullscreen().catch(err =>
            {
                console.warn('Fullscreen request failed:', err);
            });
        } else
        {
            document.exitFullscreen();
        }
    }

    updateMousePosition(e)
    {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseState.x = e.clientX - rect.left;
        this.mouseState.y = e.clientY - rect.top;

        // Calculate complex plane coordinates
        const mouseX = this.mouseState.x / rect.width - 0.5;
        const mouseY = this.mouseState.y / rect.height - 0.5;
        const aspect = this.canvas.width / this.canvas.height;

        // Update complex coordinates with proper aspect ratio handling
        this.complexCoordinates.x = mouseX * 4.0 * aspect / this.juliaParams.zoom + this.juliaParams.offsetX;
        this.complexCoordinates.y = mouseY * 4.0 / this.juliaParams.zoom + this.juliaParams.offsetY;

        // Update coordinate display if it exists
        this.updateCoordinateDisplay();
    }

    updateCoordinateDisplay()
    {
        if (!this.coordDisplay) return;

        // Adjust precision based on zoom level for meaningful display
        const zoomFactor = Math.max(0, Math.log10(this.juliaParams.zoom));
        const precision = Math.min(15, Math.max(4, Math.floor(zoomFactor) + 3));

        this.coordDisplay.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #fff;">Complex Plane</div>
            <div style="font-size: 11px; line-height: 1.4;">
                <div><strong>Re(z):</strong> ${this.complexCoordinates.x.toFixed(precision)}</div>
                <div><strong>Im(z):</strong> ${this.complexCoordinates.y.toFixed(precision)}i</div>
                <div><strong>|z|:</strong> ${Math.sqrt(this.complexCoordinates.x * this.complexCoordinates.x +
            this.complexCoordinates.y * this.complexCoordinates.y).toFixed(precision)}</div>
            </div>
        `;
    }

    resetParameters()
    {
        this.juliaParams = {
            c_real: -0.7,
            c_imag: 0.27015,
            zoom: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            maxIterations: 256,
            colorOffset: 0.0
        };

        // Reset precision tracking
        this.zoomPrecision = {
            logZoom: 0.0,
            centerX: 0.0,
            centerY: 0.0,
            maxLogZoom: 50.0
        };
    }

    updateUniforms()
    {
        const uniformData = new Float32Array([
            this.juliaParams.c_real,
            this.juliaParams.c_imag,
            this.juliaParams.zoom,
            this.juliaParams.offsetX,
            this.juliaParams.offsetY,
            this.juliaParams.maxIterations,
            this.juliaParams.colorOffset,
            this.canvas.width,
            this.canvas.height,
            0, 0, 0 // padding
        ]);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    render()
    {
        this.updateUniforms();

        const commandEncoder = this.device.createCommandEncoder({
            label: 'Julia Set Command Encoder'
        });

        const textureView = this.context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            label: 'Julia Set Render Pass',
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.renderPipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(6, 1, 0, 0); // Draw full-screen quad
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    startRenderLoop()
    {
        const animate = () =>
        {
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    destroy()
    {
        if (this.animationId)
        {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.resizeObserver)
        {
            this.resizeObserver.disconnect();
        }
        if (this.device)
        {
            this.device.destroy();
        }
    }
}

// Initialize the full-screen application
async function main()
{
    try
    {
        const renderer = new JuliaSetRenderer();
        await renderer.init();

        // Minimal, unobtrusive UI overlay for instructions
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #fff;">Julia Set Explorer</div>
            <div style="font-size: 11px; line-height: 1.4;">
                <div><strong>Mouse + Drag:</strong> Change parameter c</div>
                <div><strong>Wheel:</strong> Zoom • <strong>Arrows:</strong> Pan</div>
                <div><strong>R:</strong> Reset • <strong>F:</strong> Fullscreen • <strong>Esc:</strong> Exit</div>
            </div>
        `;
        instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            max-width: 280px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(instructions);

        // Create coordinate display with matching style
        const coordDisplay = document.createElement('div');
        coordDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.75);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            max-width: 280px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: opacity 0.5s ease-out;
        `;
        document.body.appendChild(coordDisplay);

        // Store reference to coordinate display in renderer
        renderer.coordDisplay = coordDisplay;

        // Auto-hide UI elements after a delay
        setTimeout(() =>
        {
            instructions.style.transition = 'opacity 0.5s ease-out';
            instructions.style.opacity = '0.3';
            coordDisplay.style.opacity = '0.3';
        }, 5000);

        // Show UI elements on mouse activity
        let hideTimeout;
        document.addEventListener('mousemove', () =>
        {
            instructions.style.opacity = '1';
            coordDisplay.style.opacity = '1';
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() =>
            {
                instructions.style.opacity = '0.3';
                coordDisplay.style.opacity = '0.3';
            }, 3000);
        });

        // Initial update of coordinate display
        renderer.updateCoordinateDisplay();

        // Cleanup on page unload
        window.addEventListener('beforeunload', () =>
        {
            renderer.destroy();
        });

    } catch (error)
    {
        console.error('Failed to initialize Julia Set renderer:', error);

        // Comprehensive fallback for unsupported browsers
        const fallbackMessage = document.createElement('div');
        fallbackMessage.innerHTML = `
            <h1 style="margin-top: 0; color: #fff;">WebGPU Not Available</h1>
            <p>This interactive Julia Set explorer requires WebGPU support:</p>
            <ul style="text-align: left; max-width: 400px;">
                <li><strong>Chrome 113+</strong> (enable chrome://flags/#enable-unsafe-webgpu)</li>
                <li><strong>Firefox Nightly</strong> (enable dom.webgpu.enabled)</li>
                <li><strong>Safari Technology Preview 163+</strong></li>
                <li><strong>Edge 113+</strong> (enable edge://flags/#enable-unsafe-webgpu)</li>
            </ul>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">Error: ${error.message}</p>
        `;
        fallbackMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            box-sizing: border-box;
        `;
        document.body.appendChild(fallbackMessage);
    }
}

// Optimized initialization
if (document.readyState === 'loading')
{
    document.addEventListener('DOMContentLoaded', main);
} else
{
    main();
}