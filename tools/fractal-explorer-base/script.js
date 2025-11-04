class JuliaSetRenderer
{
    constructor()
    {
        this.canvas = null;
        this.device = null;
        this.context = null;
        this.renderPipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.mouseState = {
            x: 0,
            y: 0,
            pressed: false,
            lastX: 0,
            lastY: 0,
            button: -1
        };

        // Unified parameters for both sets with proper separation
        this.juliaParams = {
            c_real: -0.7,
            c_imag: 0.27015,
            zoom: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            maxIterations: 256,
            colorOffset: 0.0
        };

        // Mandelbrot view parameters (left side)
        this.mandelbrotParams = {
            zoom: 1.0,
            offsetX: -0.5,
            offsetY: 0.0,
            maxIterations: 256,
            colorOffset: 0.0
        };

        // Precision tracking for both views
        this.zoomPrecision = {
            logZoom: 0.0,
            centerX: 0.0,
            centerY: 0.0,
            maxLogZoom: 50.0
        };

        this.mandelbrotPrecision = {
            logZoom: 0.0,
            centerX: -0.5,
            centerY: 0.0,
            maxLogZoom: 50.0
        };

        this.renderMode = 'dual'; // Launch directly into educational dual-view mode
        this.activeView = 'mandelbrot'; // Begin with Mandelbrot as primary exploration surface

        this.animationId = null;
        this.resizeObserver = null;
        this.complexCoordinates = { x: 0, y: 0 };
        this.coordDisplay = null;
        this.modeDisplay = null;
    }

    async init()
    {
        try
        {
            if (!navigator.gpu)
            {
                throw new Error('WebGPU not supported. Please use Chrome 113+, Firefox Nightly, or Safari Technology Preview.');
            }

            // Request adapter with optimal power preference for fractal computation
            const adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance',
                forceFallbackAdapter: false
            });

            if (!adapter)
            {
                throw new Error('No WebGPU adapter found. Please ensure your GPU drivers are up to date.');
            }

            this.device = await adapter.requestDevice({
                requiredFeatures: [],
                requiredLimits: {
                    maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
                    maxUniformBufferBindingSize: Math.min(65536, adapter.limits.maxUniformBufferBindingSize)
                }
            });

            this.device.lost.then((info) =>
            {
                console.error('WebGPU device lost:', info.message);
                if (info.reason !== 'destroyed')
                {
                    setTimeout(() => this.init(), 1000);
                }
            });

            this.setupFullScreenCanvas();
            this.createRenderPipeline();
            this.createBuffers();
            this.setupEventListeners();
            this.startRenderLoop();
        } catch (error)
        {
            console.error('WebGPU initialization failed:', error);
            throw error;
        }
    }

    setupFullScreenCanvas()
    {
        if (!this.canvas)
        {
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                display: block;
                cursor: crosshair;
                background: #000;
                z-index: 0;
            `;
            document.body.appendChild(this.canvas);
        }

        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = Math.floor(window.innerWidth);
        const displayHeight = Math.floor(window.innerHeight);

        this.canvas.width = displayWidth * devicePixelRatio;
        this.canvas.height = displayHeight * devicePixelRatio;
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        if (!this.context)
        {
            this.context = this.canvas.getContext('webgpu');
            if (!this.context)
            {
                throw new Error('Failed to get WebGPU context');
            }
        }

        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: canvasFormat,
            alphaMode: 'premultiplied',
            colorSpace: 'srgb'
        });

        if (!this.resizeObserver)
        {
            this.resizeObserver = new ResizeObserver(() =>
            {
                this.setupFullScreenCanvas();
                if (this.uniformBuffer)
                {
                    this.updateUniforms();
                }
            });
            this.resizeObserver.observe(this.canvas);
        }
    }

    createRenderPipeline()
    {
        const vertexShaderCode = `
            @vertex
            fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
                // Full-screen triangle technique for optimal GPU utilization
                let pos = array<vec2<f32>, 6>(
                    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
                    vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
                );
                return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
            }
        `;

        const fragmentShaderCode = `
            struct Uniforms {
                julia_c_real: f32,
                julia_c_imag: f32,
                julia_zoom: f32,
                julia_offset_x: f32,
                julia_offset_y: f32,
                julia_max_iterations: f32,
                julia_color_offset: f32,
                mandelbrot_zoom: f32,
                mandelbrot_offset_x: f32,
                mandelbrot_offset_y: f32,
                mandelbrot_max_iterations: f32,
                mandelbrot_color_offset: f32,
                canvas_width: f32,
                canvas_height: f32,
                render_mode: f32, // 0.0=Julia, 1.0=Mandelbrot, 2.0=Dual
                padding: f32,
            }

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;

            // Optimized complex iteration with escape time algorithm
            fn complex_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
                var z_current = z;
                var iterations = 0.0;
                let max_i = i32(max_iter);

                for (var i = 0; i < max_i; i++) {
                    let z_magnitude_sq = dot(z_current, z_current);
                    if (z_magnitude_sq > 4.0) {
                        break;
                    }

                    // Optimized complex multiplication: (a+bi)² + c
                    z_current = vec2<f32>(
                        z_current.x * z_current.x - z_current.y * z_current.y + c.x,
                        2.0 * z_current.x * z_current.y + c.y
                    );
                    iterations += 1.0;
                }

                // Smooth iteration count for continuous coloring
                if (iterations < max_iter) {
                    let z_magnitude = length(z_current);
                    return iterations + 1.0 - log2(log2(z_magnitude));
                }

                return iterations;
            }

            // Professional color palette with mathematical aesthetics
            fn get_color_from_palette(t: f32) -> vec3<f32> {
                let palette = array<vec3<f32>, 16>(
                    vec3<f32>(0.0, 0.0, 0.1),   vec3<f32>(0.0, 0.0, 0.3),
                    vec3<f32>(0.0, 0.1, 0.5),   vec3<f32>(0.0, 0.3, 0.7),
                    vec3<f32>(0.0, 0.5, 0.9),   vec3<f32>(0.1, 0.6, 0.8),
                    vec3<f32>(0.3, 0.7, 0.7),   vec3<f32>(0.5, 0.8, 0.6),
                    vec3<f32>(0.7, 0.9, 0.4),   vec3<f32>(0.9, 0.9, 0.2),
                    vec3<f32>(1.0, 0.8, 0.1),   vec3<f32>(1.0, 0.6, 0.0),
                    vec3<f32>(1.0, 0.4, 0.1),   vec3<f32>(0.9, 0.2, 0.2),
                    vec3<f32>(0.7, 0.1, 0.3),   vec3<f32>(0.5, 0.0, 0.4)
                );

                let index = t * 15.0;
                let i = i32(floor(index));
                let frac = fract(index);
                let i0 = clamp(i, 0, 15);
                let i1 = clamp(i + 1, 0, 15);

                return mix(palette[i0], palette[i1], frac);
            }

            @fragment
            fn main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
                let uv = position.xy / vec2<f32>(uniforms.canvas_width, uniforms.canvas_height);
                let render_mode = uniforms.render_mode;

                // Dual view mode (2.0) - split-screen rendering
                if (render_mode > 1.5) {
                    let aspect_ratio = (uniforms.canvas_width * 0.5) / uniforms.canvas_height;

                    if (uv.x < 0.5) {
                        // Left half: Mandelbrot set
                        let coord = vec2<f32>(
                            (uv.x * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_x,
                            (uv.y - 0.5) * 4.0 / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_y
                        );

                        let iterations = complex_iteration(vec2<f32>(0.0, 0.0), coord, uniforms.mandelbrot_max_iterations);

                        if (iterations >= uniforms.mandelbrot_max_iterations) {
                            return vec4<f32>(0.0, 0.0, 0.0, 1.0);
                        }

                        let t = fract((iterations / 32.0) + uniforms.mandelbrot_color_offset);
                        var rgb = get_color_from_palette(t);
                        let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.mandelbrot_max_iterations);

                        // Visual indicator for current Julia parameter
                        let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
                        let dist_to_julia = length(coord - julia_c);
                        let indicator_size = 0.02 / uniforms.mandelbrot_zoom;
                        if (dist_to_julia < indicator_size) {
                            let indicator_strength = 1.0 - (dist_to_julia / indicator_size);
                            rgb = mix(rgb, vec3<f32>(1.0, 1.0, 1.0), indicator_strength * 0.8);
                        }

                        return vec4<f32>(rgb * brightness, 1.0);
                    } else {
                        // Right half: Julia set
                        let coord = vec2<f32>(
                            ((uv.x - 0.5) * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.julia_zoom + uniforms.julia_offset_x,
                            (uv.y - 0.5) * 4.0 / uniforms.julia_zoom + uniforms.julia_offset_y
                        );

                        let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
                        let iterations = complex_iteration(coord, c, uniforms.julia_max_iterations);

                        if (iterations >= uniforms.julia_max_iterations) {
                            return vec4<f32>(0.0, 0.0, 0.0, 1.0);
                        }

                        let t = fract((iterations / 32.0) + uniforms.julia_color_offset);
                        let rgb = get_color_from_palette(t);
                        let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.julia_max_iterations);

                        return vec4<f32>(rgb * brightness, 1.0);
                    }
                }

                // Single view modes - existing logic with optimizations
                let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;
                let coord = vec2<f32>(
                    (uv.x - 0.5) * 4.0 * aspect_ratio / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
                    select(uniforms.julia_offset_x, uniforms.mandelbrot_offset_x, render_mode > 0.5),
                    (uv.y - 0.5) * 4.0 / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
                    select(uniforms.julia_offset_y, uniforms.mandelbrot_offset_y, render_mode > 0.5)
                );

                let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
                let max_iter = select(uniforms.julia_max_iterations, uniforms.mandelbrot_max_iterations, render_mode > 0.5);
                let color_offset = select(uniforms.julia_color_offset, uniforms.mandelbrot_color_offset, render_mode > 0.5);

                let iterations = select(
                    complex_iteration(coord, c, max_iter),
                    complex_iteration(vec2<f32>(0.0, 0.0), coord, max_iter),
                    render_mode > 0.5
                );

                if (iterations >= max_iter) {
                    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
                }

                let t = fract((iterations / 32.0) + color_offset);
                let rgb = get_color_from_palette(t);
                let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter);

                return vec4<f32>(rgb * brightness, 1.0);
            }
        `;

        const vertexShader = this.device.createShaderModule({
            label: 'Fractal Vertex Shader',
            code: vertexShaderCode,
        });

        const fragmentShader = this.device.createShaderModule({
            label: 'Fractal Fragment Shader',
            code: fragmentShaderCode,
        });

        const bindGroupLayout = this.device.createBindGroupLayout({
            label: 'Fractal Bind Group Layout',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    type: 'uniform',
                    minBindingSize: 64
                }
            }]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            label: 'Fractal Pipeline Layout',
            bindGroupLayouts: [bindGroupLayout]
        });

        this.renderPipeline = this.device.createRenderPipeline({
            label: 'Fractal Render Pipeline',
            layout: pipelineLayout,
            vertex: {
                module: vertexShader,
                entryPoint: 'main',
            },
            fragment: {
                module: fragmentShader,
                entryPoint: 'main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                    blend: {
                        color: {
                            srcFactor: 'one',
                            dstFactor: 'zero',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'zero',
                            operation: 'add',
                        },
                    },
                }],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
        });

        this.bindGroupLayout = bindGroupLayout;
    }

    createBuffers()
    {
        // Aligned uniform buffer
        const uniformData = new Float32Array([
            this.juliaParams.c_real,            // 0
            this.juliaParams.c_imag,            // 1
            this.juliaParams.zoom,              // 2
            this.juliaParams.offsetX,           // 3
            this.juliaParams.offsetY,           // 4
            this.juliaParams.maxIterations,     // 5
            this.juliaParams.colorOffset,       // 6
            this.mandelbrotParams.zoom,         // 7
            this.mandelbrotParams.offsetX,      // 8
            this.mandelbrotParams.offsetY,      // 9
            this.mandelbrotParams.maxIterations,// 10
            this.mandelbrotParams.colorOffset,  // 11
            this.canvas.width,                  // 12
            this.canvas.height,                 // 13
            this.renderMode === 'mandelbrot' ? 1.0 : this.renderMode === 'julia' ? 0.0 : 2.0, // 14
            0                                   // 15 - padding for alignment
        ]);

        this.uniformBuffer = this.device.createBuffer({
            label: 'Fractal Uniform Buffer',
            size: Math.max(uniformData.byteLength, 256), // Ensure minimum size
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

        this.bindGroup = this.device.createBindGroup({
            label: 'Fractal Bind Group',
            layout: this.bindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this.uniformBuffer,
                },
            }],
        });
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
            this.mandelbrotParams.zoom,
            this.mandelbrotParams.offsetX,
            this.mandelbrotParams.offsetY,
            this.mandelbrotParams.maxIterations,
            this.mandelbrotParams.colorOffset,
            this.canvas.width,
            this.canvas.height,
            this.renderMode === 'mandelbrot' ? 1.0 :
                this.renderMode === 'julia' ? 0.0 : 2.0,
            0
        ]);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    render()
    {
        if (!this.device || !this.renderPipeline || !this.bindGroup)
        {
            return;
        }

        this.updateUniforms();

        const commandEncoder = this.device.createCommandEncoder({
            label: 'Fractal Render Command Encoder'
        });

        const textureView = this.context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            label: 'Fractal Render Pass',
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
        passEncoder.draw(6, 1, 0, 0);
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    startRenderLoop()
    {
        let lastFrameTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const animate = (currentTime) =>
        {
            if (currentTime - lastFrameTime >= frameInterval)
            {
                this.render();
                lastFrameTime = currentTime;
            }

            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
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
            this.resizeObserver = null;
        }

        if (this.uniformBuffer)
        {
            this.uniformBuffer.destroy();
            this.uniformBuffer = null;
        }

        if (this.device)
        {
            this.device.destroy();
            this.device = null;
        }

        if (this.canvas && this.canvas.parentNode)
        {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
        }
    }

    toggleFractalType(useCurrentCoordinates = false)
    {
        if (this.renderMode === 'dual')
        {
            this.activeView = this.activeView === 'mandelbrot' ? 'julia' : 'mandelbrot';
            this.updateModeDisplay();
            return;
        }

        this.saveCurrentParameters();
        this.renderMode = this.renderMode === 'julia' ? 'mandelbrot' : 'julia';

        this.activeView = this.renderMode;

        if (this.renderMode === 'julia' && useCurrentCoordinates)
        {
            this.juliaParams.c_real = this.complexCoordinates.x;
            this.juliaParams.c_imag = this.complexCoordinates.y;
            this.juliaParams.zoom = 1.0;
            this.juliaParams.offsetX = 0.0;
            this.juliaParams.offsetY = 0.0;
            this.juliaParams.maxIterations = 256;

            this.zoomPrecision.logZoom = 0.0;
            this.zoomPrecision.centerX = 0.0;
            this.zoomPrecision.centerY = 0.0;
        }
        else
        {
            this.loadParametersForCurrentMode();
        }

        this.updateModeDisplay();
    }

    cycleFractalMode()
    {
        const modes = ['mandelbrot', 'julia', 'dual'];
        const currentIndex = modes.indexOf(this.renderMode);
        this.renderMode = modes[(currentIndex + 1) % modes.length];

        if (this.renderMode === 'dual')
        {
            this.activeView = 'mandelbrot';
        }
        else
        {
            this.activeView = this.renderMode;
        }

        this.updateModeDisplay();
    }

    getViewFromMousePosition(mouseX, mouseY)
    {
        if (this.renderMode !== 'dual') return this.renderMode;

        const rect = this.canvas.getBoundingClientRect();
        const relativeX = mouseX / rect.width;

        return relativeX < 0.5 ? 'mandelbrot' : 'julia';
    }

    saveCurrentParameters()
    {
        if (this.renderMode !== 'julia' || this.activeView !== 'julia')
        {
            this.mandelbrotParams.zoom = this.getCurrentZoom();
            this.mandelbrotParams.offsetX = this.getCurrentOffsetX();
            this.mandelbrotParams.offsetY = this.getCurrentOffsetY();
            this.mandelbrotParams.maxIterations = this.getCurrentMaxIterations();
            this.mandelbrotPrecision = { ...this.getCurrentPrecision() };
        }
    }

    loadParametersForCurrentMode()
    {
        if (this.renderMode !== 'julia' || this.activeView !== 'julia')
        {
            this.setCurrentZoom(this.mandelbrotParams.zoom);
            this.setCurrentOffset(this.mandelbrotParams.offsetX, this.mandelbrotParams.offsetY);
            this.setCurrentMaxIterations(this.mandelbrotParams.maxIterations);
            this.setCurrentPrecision(this.mandelbrotPrecision);
        }
    }

    getCurrentZoom()
    {
        if (this.renderMode === 'dual')
        {
            return this.activeView === 'julia' ? this.juliaParams.zoom : this.mandelbrotParams.zoom;
        }
        else if (this.renderMode === 'julia')
        {
            return this.juliaParams.zoom;
        }
        else // mandelbrot mode
        {
            return this.mandelbrotParams.zoom;
        }
    }

    getCurrentOffsetX()
    {
        if (this.renderMode === 'dual')
        {
            return this.activeView === 'julia' ? this.juliaParams.offsetX : this.mandelbrotParams.offsetX;
        }
        else if (this.renderMode === 'julia')
        {
            return this.juliaParams.offsetX;
        }
        else // mandelbrot mode
        {
            return this.mandelbrotParams.offsetX;
        }
    }

    getCurrentOffsetY()
    {
        if (this.renderMode === 'dual')
        {
            return this.activeView === 'julia' ? this.juliaParams.offsetY : this.mandelbrotParams.offsetY;
        }
        else if (this.renderMode === 'julia')
        {
            return this.juliaParams.offsetY;
        }
        else // mandelbrot mode
        {
            return this.mandelbrotParams.offsetY;
        }
    }

    getCurrentMaxIterations()
    {
        if (this.renderMode === 'dual')
        {
            return this.activeView === 'julia' ? this.juliaParams.maxIterations : this.mandelbrotParams.maxIterations;
        }
        else if (this.renderMode === 'julia')
        {
            return this.juliaParams.maxIterations;
        }
        else // mandelbrot mode
        {
            return this.mandelbrotParams.maxIterations;
        }
    }

    getCurrentPrecision()
    {
        if (this.renderMode === 'dual')
        {
            return this.activeView === 'julia' ? this.zoomPrecision : this.mandelbrotPrecision;
        }
        else if (this.renderMode === 'julia')
        {
            return this.zoomPrecision;
        }
        else // mandelbrot mode
        {
            return this.mandelbrotPrecision;
        }
    }

    setCurrentZoom(zoom)
    {
        if (this.renderMode === 'dual')
        {
            if (this.activeView === 'julia') this.juliaParams.zoom = zoom;
            else this.mandelbrotParams.zoom = zoom;
        }
        else if (this.renderMode === 'julia')
        {
            this.juliaParams.zoom = zoom;
        }
        else // mandelbrot mode
        {
            this.mandelbrotParams.zoom = zoom;
        }
    }

    setCurrentOffset(x, y)
    {
        if (this.renderMode === 'dual')
        {
            if (this.activeView === 'julia')
            {
                this.juliaParams.offsetX = x;
                this.juliaParams.offsetY = y;
            } else
            {
                this.mandelbrotParams.offsetX = x;
                this.mandelbrotParams.offsetY = y;
            }
        }
        else if (this.renderMode === 'julia')
        {
            this.juliaParams.offsetX = x;
            this.juliaParams.offsetY = y;
        }
        else // mandelbrot mode
        {
            this.mandelbrotParams.offsetX = x;
            this.mandelbrotParams.offsetY = y;
        }
    }

    setCurrentMaxIterations(iterations)
    {
        if (this.renderMode === 'dual')
        {
            if (this.activeView === 'julia') this.juliaParams.maxIterations = iterations;
            else this.mandelbrotParams.maxIterations = iterations;
        }
        else if (this.renderMode === 'julia')
        {
            this.juliaParams.maxIterations = iterations;
        }
        else // mandelbrot mode
        {
            this.mandelbrotParams.maxIterations = iterations;
        }
    }

    setCurrentPrecision(precision)
    {
        if (this.renderMode === 'dual')
        {
            if (this.activeView === 'julia') this.zoomPrecision = { ...precision };
            else this.mandelbrotPrecision = { ...precision };
        }
        else if (this.renderMode === 'julia')
        {
            this.zoomPrecision = { ...precision };
        }
        else // mandelbrot mode
        {
            this.mandelbrotPrecision = { ...precision };
        }
    }

    updateModeDisplay()
    {
        if (!this.modeDisplay) return;

        let modeName;
        switch (this.renderMode)
        {
            case 'julia':
                modeName = 'Julia Set';
                break;
            case 'mandelbrot':
                modeName = 'Mandelbrot Set';
                break;
            case 'dual':
                modeName = `Dual View (${this.activeView === 'mandelbrot' ? 'M' : 'J'} active)`;
                break;
        }

        this.modeDisplay.textContent = modeName;
    }

    setupEventListeners()
    {
        this.canvas.addEventListener('mousedown', (e) =>
        {
            if (e.button === 0 || e.button === 1)
            {
                this.mouseState.pressed = true;
                this.mouseState.button = e.button;
                this.updateMousePosition(e);
                this.mouseState.lastX = this.mouseState.x;
                this.mouseState.lastY = this.mouseState.y;

                // Set active view based on mouse position in dual mode
                if (this.renderMode === 'dual')
                {
                    this.activeView = this.getViewFromMousePosition(this.mouseState.x, this.mouseState.y);
                    this.updateModeDisplay();
                }

                if (e.button === 1)
                {
                    this.canvas.style.cursor = 'grabbing';
                }
            }
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) =>
        {
            if (e.button === this.mouseState.button)
            {
                this.mouseState.pressed = false;
                this.mouseState.button = -1;
                this.canvas.style.cursor = 'crosshair';
            }
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) =>
        {
            this.updateMousePosition(e);

            if (this.mouseState.pressed)
            {
                if (this.mouseState.button === 0)
                {
                    if (this.renderMode === 'julia' ||
                        (this.renderMode === 'dual' && this.activeView === 'julia'))
                    {
                        const rect = this.canvas.getBoundingClientRect();
                        let normalizedX, normalizedY;

                        if (this.renderMode === 'dual')
                        {
                            normalizedX = (this.mouseState.x / rect.width - 0.5) * 2.0;
                            normalizedY = this.mouseState.y / rect.height - 0.5;
                        }
                        else
                        {
                            normalizedX = this.mouseState.x / rect.width - 0.5;
                            normalizedY = this.mouseState.y / rect.height - 0.5;
                        }

                        this.juliaParams.c_real = normalizedX * 2.0;
                        this.juliaParams.c_imag = normalizedY * 2.0;
                    }
                    else if (this.renderMode === 'dual' && this.activeView === 'mandelbrot')
                    {
                        const rect = this.canvas.getBoundingClientRect();
                        const aspect = (this.canvas.width / 2) / this.canvas.height; // Half width for dual view

                        const mouseX = (this.mouseState.x / rect.width - 0.25) * 2.0; // Adjust for left half
                        const mouseY = this.mouseState.y / rect.height - 0.5;

                        this.juliaParams.c_real = mouseX * 4.0 * aspect / this.mandelbrotParams.zoom + this.mandelbrotParams.offsetX;
                        this.juliaParams.c_imag = mouseY * 4.0 / this.mandelbrotParams.zoom + this.mandelbrotParams.offsetY;
                    }
                }
                else if (this.mouseState.button === 1)
                {
                    const deltaX = this.mouseState.x - this.mouseState.lastX;
                    const deltaY = this.mouseState.y - this.mouseState.lastY;

                    const rect = this.canvas.getBoundingClientRect();
                    let aspect;

                    if (this.renderMode === 'dual')
                    {
                        aspect = (this.canvas.width / 2) / this.canvas.height;
                    }
                    else
                    {
                        aspect = this.canvas.width / this.canvas.height;
                    }

                    const currentZoom = this.getCurrentZoom();
                    const panSensitivity = 4.0 / currentZoom;
                    const complexDeltaX = -(deltaX / rect.width) * panSensitivity * aspect;
                    const complexDeltaY = -(deltaY / rect.height) * panSensitivity;

                    if (this.activeView === 'julia')
                    {
                        this.juliaParams.offsetX += complexDeltaX;
                        this.juliaParams.offsetY += complexDeltaY;
                        this.zoomPrecision.centerX = this.juliaParams.offsetX;
                        this.zoomPrecision.centerY = this.juliaParams.offsetY;
                    }
                    else
                    {
                        this.mandelbrotParams.offsetX += complexDeltaX;
                        this.mandelbrotParams.offsetY += complexDeltaY;
                        this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                        this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
                    }

                    this.mouseState.lastX = this.mouseState.x;
                    this.mouseState.lastY = this.mouseState.y;
                }
            }
            e.preventDefault();
        });

        this.canvas.addEventListener('wheel', (e) =>
        {
            e.preventDefault();

            let targetView = this.activeView;
            if (this.renderMode === 'dual')
            {
                targetView = this.getViewFromMousePosition(e.clientX - this.canvas.getBoundingClientRect().left,
                    e.clientY - this.canvas.getBoundingClientRect().top);
            }

            const rect = this.canvas.getBoundingClientRect();
            let mouseX, mouseY, aspect;

            if (this.renderMode === 'dual')
            {
                aspect = (this.canvas.width / 2) / this.canvas.height;
                if (targetView === 'mandelbrot')
                {
                    mouseX = ((e.clientX - rect.left) / rect.width - 0.25) * 2.0;
                }
                else
                {
                    mouseX = ((e.clientX - rect.left) / rect.width - 0.75) * 2.0;
                }
            }
            else
            {
                aspect = this.canvas.width / this.canvas.height;
                mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            }

            mouseY = (e.clientY - rect.top) / rect.height - 0.5;

            let currentZoom, offsetX, offsetY, precision;
            if (targetView === 'julia')
            {
                currentZoom = this.juliaParams.zoom;
                offsetX = this.juliaParams.offsetX;
                offsetY = this.juliaParams.offsetY;
                precision = this.zoomPrecision;
            }
            else
            {
                currentZoom = this.mandelbrotParams.zoom;
                offsetX = this.mandelbrotParams.offsetX;
                offsetY = this.mandelbrotParams.offsetY;
                precision = this.mandelbrotPrecision;
            }

            const preZoomX = mouseX * 4.0 * aspect / currentZoom + offsetX;
            const preZoomY = mouseY * 4.0 / currentZoom + offsetY;

            const zoomStep = e.deltaY > 0 ? -0.2 : 0.2;
            precision.logZoom += zoomStep;
            precision.logZoom = Math.max(-10, Math.min(precision.maxLogZoom, precision.logZoom));

            const newZoom = Math.exp(precision.logZoom);
            const postZoomX = mouseX * 4.0 * aspect / newZoom + offsetX;
            const postZoomY = mouseY * 4.0 / newZoom + offsetY;

            if (targetView === 'julia')
            {
                this.juliaParams.zoom = newZoom;
                this.juliaParams.offsetX += preZoomX - postZoomX;
                this.juliaParams.offsetY += preZoomY - postZoomY;
                this.zoomPrecision.centerX = this.juliaParams.offsetX;
                this.zoomPrecision.centerY = this.juliaParams.offsetY;
            }
            else
            {
                this.mandelbrotParams.zoom = newZoom;
                this.mandelbrotParams.offsetX += preZoomX - postZoomX;
                this.mandelbrotParams.offsetY += preZoomY - postZoomY;
                this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
            }

            const baseIterations = 256;
            const zoomFactor = Math.max(1.0, precision.logZoom / 10.0);
            const newIterations = Math.min(2048, baseIterations * Math.sqrt(zoomFactor));

            if (targetView === 'julia')
            {
                this.juliaParams.maxIterations = newIterations;
            }
            else
            {
                this.mandelbrotParams.maxIterations = newIterations;
            }

            this.updateCoordinateDisplay();

        }, { passive: false });

        document.addEventListener('keydown', (e) =>
        {
            if (e.ctrlKey && (e.key === 'r' || e.key === 'R'))
            {
                return;
            }

            const baseStep = 0.1;
            const currentZoom = this.getCurrentZoom();
            const zoomAdjustedStep = baseStep / Math.sqrt(currentZoom);

            switch (e.key)
            {
                case 'ArrowLeft':
                    if (this.renderMode === 'julia')
                    {
                        this.juliaParams.offsetX -= zoomAdjustedStep;
                        this.zoomPrecision.centerX = this.juliaParams.offsetX;
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotParams.offsetX -= zoomAdjustedStep;
                        this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.juliaParams.offsetX -= zoomAdjustedStep;
                            this.zoomPrecision.centerX = this.juliaParams.offsetX;
                        }
                        else
                        {
                            this.mandelbrotParams.offsetX -= zoomAdjustedStep;
                            this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (this.renderMode === 'julia')
                    {
                        this.juliaParams.offsetX += zoomAdjustedStep;
                        this.zoomPrecision.centerX = this.juliaParams.offsetX;
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotParams.offsetX += zoomAdjustedStep;
                        this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.juliaParams.offsetX += zoomAdjustedStep;
                            this.zoomPrecision.centerX = this.juliaParams.offsetX;
                        }
                        else
                        {
                            this.mandelbrotParams.offsetX += zoomAdjustedStep;
                            this.mandelbrotPrecision.centerX = this.mandelbrotParams.offsetX;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (this.renderMode === 'julia')
                    {
                        this.juliaParams.offsetY -= zoomAdjustedStep;
                        this.zoomPrecision.centerY = this.juliaParams.offsetY;
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotParams.offsetY -= zoomAdjustedStep;
                        this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.juliaParams.offsetY -= zoomAdjustedStep;
                            this.zoomPrecision.centerY = this.juliaParams.offsetY;
                        }
                        else
                        {
                            this.mandelbrotParams.offsetY -= zoomAdjustedStep;
                            this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
                        }
                    }
                    break;
                case 'ArrowDown':
                    if (this.renderMode === 'julia')
                    {
                        this.juliaParams.offsetY += zoomAdjustedStep;
                        this.zoomPrecision.centerY = this.juliaParams.offsetY;
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotParams.offsetY += zoomAdjustedStep;
                        this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.juliaParams.offsetY += zoomAdjustedStep;
                            this.zoomPrecision.centerY = this.juliaParams.offsetY;
                        }
                        else
                        {
                            this.mandelbrotParams.offsetY += zoomAdjustedStep;
                            this.mandelbrotPrecision.centerY = this.mandelbrotParams.offsetY;
                        }
                    }
                    break;

                case '+':
                case '=':
                    if (this.renderMode === 'julia')
                    {
                        this.zoomPrecision.logZoom += 0.2;
                        this.zoomPrecision.logZoom = Math.min(this.zoomPrecision.maxLogZoom, this.zoomPrecision.logZoom);
                        this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotPrecision.logZoom += 0.2;
                        this.mandelbrotPrecision.logZoom = Math.min(this.mandelbrotPrecision.maxLogZoom, this.mandelbrotPrecision.logZoom);
                        this.mandelbrotParams.zoom = Math.exp(this.mandelbrotPrecision.logZoom);
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.zoomPrecision.logZoom += 0.2;
                            this.zoomPrecision.logZoom = Math.min(this.zoomPrecision.maxLogZoom, this.zoomPrecision.logZoom);
                            this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                        }
                        else
                        {
                            this.mandelbrotPrecision.logZoom += 0.2;
                            this.mandelbrotPrecision.logZoom = Math.min(this.mandelbrotPrecision.maxLogZoom, this.mandelbrotPrecision.logZoom);
                            this.mandelbrotParams.zoom = Math.exp(this.mandelbrotPrecision.logZoom);
                        }
                    }
                    break;
                case '-':
                case '_':
                    if (this.renderMode === 'julia')
                    {
                        this.zoomPrecision.logZoom -= 0.2;
                        this.zoomPrecision.logZoom = Math.max(-10, this.zoomPrecision.logZoom);
                        this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.mandelbrotPrecision.logZoom -= 0.2;
                        this.mandelbrotPrecision.logZoom = Math.max(-10, this.mandelbrotPrecision.logZoom);
                        this.mandelbrotParams.zoom = Math.exp(this.mandelbrotPrecision.logZoom);
                    }
                    else if (this.renderMode === 'dual')
                    {
                        if (this.activeView === 'julia')
                        {
                            this.zoomPrecision.logZoom -= 0.2;
                            this.zoomPrecision.logZoom = Math.max(-10, this.zoomPrecision.logZoom);
                            this.juliaParams.zoom = Math.exp(this.zoomPrecision.logZoom);
                        }
                        else
                        {
                            this.mandelbrotPrecision.logZoom -= 0.2;
                            this.mandelbrotPrecision.logZoom = Math.max(-10, this.mandelbrotPrecision.logZoom);
                            this.mandelbrotParams.zoom = Math.exp(this.mandelbrotPrecision.logZoom);
                        }
                    }
                    break;

                case 'r':
                case 'R':
                    if (!e.ctrlKey)
                    {
                        this.resetParameters();
                    }
                    break;

                case 'Tab':
                    if (this.renderMode === 'dual')
                    {
                        this.activeView = this.activeView === 'mandelbrot' ? 'julia' : 'mandelbrot';
                        this.updateModeDisplay();
                    }
                    break;

                case 'm':
                case 'M':
                    this.cycleFractalMode();
                    break;

                case 'j':
                case 'J':
                    if (this.renderMode === 'dual')
                    {
                        this.renderMode = 'julia';
                        this.activeView = 'julia';
                    }
                    else if (this.renderMode === 'mandelbrot')
                    {
                        this.toggleFractalType(true);
                    }
                    else if (this.renderMode === 'julia')
                    {
                        this.renderMode = 'dual';
                        this.activeView = 'mandelbrot';
                    }

                    this.updateModeDisplay();
                    break;

                case 'd':
                case 'D':
                    if (this.renderMode !== 'dual')
                    {
                        this.renderMode = 'dual';
                        this.activeView = 'mandelbrot';
                        this.updateModeDisplay();
                    }
                    else
                    {
                        this.activeView = this.activeView === 'mandelbrot' ? 'julia' : 'mandelbrot';
                        this.updateModeDisplay();
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
            }
            const all_active_keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'f', 'F', '+', '=', '-', '_', 'm', 'M', 'j', 'J', 'd', 'D'];
            if (all_active_keys.includes(e.key) || ((e.key === 'r' || e.key === 'R') && !e.ctrlKey))
            {
                e.preventDefault();
            }
        });

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

        // Handle mouse leave to reset interaction state
        this.canvas.addEventListener('mouseleave', (e) =>
        {
            if (this.mouseState.pressed)
            {
                this.mouseState.pressed = false;
                this.mouseState.button = -1;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) =>
        {
            e.preventDefault();
        });
    }

    updateMousePosition(e)
    {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseState.x = e.clientX - rect.left;
        this.mouseState.y = e.clientY - rect.top;

        // Calculate complex coordinates based on current view with precision handling
        let mouseX, mouseY, aspect, zoom, offsetX, offsetY;

        if (this.renderMode === 'dual')
        {
            const viewType = this.getViewFromMousePosition(this.mouseState.x, this.mouseState.y);
            aspect = (this.canvas.width / 2) / this.canvas.height;

            if (viewType === 'mandelbrot')
            {
                // Left half: normalize to [-0.5, 0.5] range for Mandelbrot coordinates
                mouseX = (this.mouseState.x / rect.width - 0.25) * 2.0;
                zoom = this.mandelbrotParams.zoom;
                offsetX = this.mandelbrotParams.offsetX;
                offsetY = this.mandelbrotParams.offsetY;
            }
            else
            {
                // Right half: normalize to [-0.5, 0.5] range for Julia coordinates
                mouseX = (this.mouseState.x / rect.width - 0.75) * 2.0;
                zoom = this.juliaParams.zoom;
                offsetX = this.juliaParams.offsetX;
                offsetY = this.juliaParams.offsetY;
            }
        }
        else
        {
            // Single view mode: full screen coordinate mapping
            mouseX = this.mouseState.x / rect.width - 0.5;
            aspect = this.canvas.width / this.canvas.height;

            if (this.renderMode === 'julia')
            {
                zoom = this.juliaParams.zoom;
                offsetX = this.juliaParams.offsetX;
                offsetY = this.juliaParams.offsetY;
            }
            else
            {
                zoom = this.mandelbrotParams.zoom;
                offsetX = this.mandelbrotParams.offsetX;
                offsetY = this.mandelbrotParams.offsetY;
            }
        }

        mouseY = this.mouseState.y / rect.height - 0.5;

        // Transform screen coordinates to complex plane with mathematical precision
        this.complexCoordinates.x = mouseX * 4.0 * aspect / zoom + offsetX;
        this.complexCoordinates.y = mouseY * 4.0 / zoom + offsetY;

        // Update coordinate display in real-time for smooth UX
        this.updateCoordinateDisplay();
    }

    updateCoordinateDisplay()
    {
        if (!this.coordDisplay) return;

        const currentZoom = this.getCurrentZoom();
        const zoomFactor = Math.max(0, Math.log10(currentZoom));
        const precision = Math.min(15, Math.max(4, Math.floor(zoomFactor) + 3));

        let viewInfo = '';
        let activeViewIndicator = '';

        if (this.renderMode === 'dual')
        {
            const currentView = this.getViewFromMousePosition(this.mouseState.x, this.mouseState.y);
            viewInfo = `<div style="margin-bottom: 4px; font-size: 10px; opacity: 0.8; color: #64ffda;">
                ${currentView === 'mandelbrot' ? 'Mandelbrot' : 'Julia'} View
            </div>`;

            activeViewIndicator = `<div style="margin-top: 4px; font-size: 10px; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                Active: ${this.activeView === 'mandelbrot' ? 'Mandelbrot' : 'Julia'} (${this.activeView === 'mandelbrot' ? 'M' : 'J'})
            </div>`;
        }

        const magnitude = Math.sqrt(
            this.complexCoordinates.x * this.complexCoordinates.x +
            this.complexCoordinates.y * this.complexCoordinates.y
        );

        // Professional mathematical display with enhanced readability
        this.coordDisplay.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px;">
                Complex Plane
            </div>
            ${viewInfo}
            <div style="font-size: 11px; line-height: 1.5; font-family: 'Consolas', 'Monaco', monospace;">
                <div><strong style="color: #ff6b6b;">Re(z):</strong> <span style="color: #4ecdc4;">${this.complexCoordinates.x.toFixed(precision)}</span></div>
                <div><strong style="color: #45b7d1;">Im(z):</strong> <span style="color: #4ecdc4;">${this.complexCoordinates.y.toFixed(precision)}i</span></div>
                <div><strong style="color: #96ceb4;">|z|:</strong> <span style="color: #4ecdc4;">${magnitude.toFixed(precision)}</span></div>
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 2px;">Zoom: ${currentZoom.toExponential(2)}</div>
                </div>
            </div>
            ${this.renderMode === 'dual' ?
                `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 10px;">
                    <div style="opacity: 0.8; margin-bottom: 2px; color: #feca57;">Julia Parameter:</div>
                    <div style="font-family: 'Consolas', 'Monaco', monospace; color: #4ecdc4;">
                        c = ${this.juliaParams.c_real.toFixed(4)} + ${this.juliaParams.c_imag.toFixed(4)}i
                    </div>
                </div>` : ''}
            ${activeViewIndicator}
        `;
    }

    resetParameters()
    {
        if (this.renderMode === 'dual')
        {
            // Reset Julia set parameters
            this.juliaParams = {
                c_real: -0.7,
                c_imag: 0.27015,
                zoom: 1.0,
                offsetX: 0.0,
                offsetY: 0.0,
                maxIterations: 256,
                colorOffset: 0.0
            };

            // Reset Julia precision tracking
            this.zoomPrecision = {
                logZoom: 0.0,
                centerX: 0.0,
                centerY: 0.0,
                maxLogZoom: 50.0
            };

            // Reset Mandelbrot parameters
            this.mandelbrotParams = {
                zoom: 1.0,
                offsetX: -0.5, // Center the classic Mandelbrot bulb
                offsetY: 0.0,
                maxIterations: 256,
                colorOffset: 0.0
            };

            // Reset Mandelbrot precision tracking
            this.mandelbrotPrecision = {
                logZoom: 0.0,
                centerX: -0.5,
                centerY: 0.0,
                maxLogZoom: 50.0
            };

            this.activeView = 'mandelbrot';
        }
        else if (this.renderMode === 'julia')
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

            this.zoomPrecision = {
                logZoom: 0.0,
                centerX: 0.0,
                centerY: 0.0,
                maxLogZoom: 50.0
            };
        }
        else // Mandelbrot mode
        {
            this.mandelbrotParams = {
                zoom: 1.0,
                offsetX: -0.5,
                offsetY: 0.0,
                maxIterations: 256,
                colorOffset: 0.0
            };

            this.mandelbrotPrecision = {
                logZoom: 0.0,
                centerX: -0.5,
                centerY: 0.0,
                maxLogZoom: 50.0
            };
        }

        this.updateModeDisplay();
        this.updateCoordinateDisplay();
    }

    toggleFullscreen()
    {
        if (!document.fullscreenElement)
        {
            this.canvas.requestFullscreen().catch(err =>
            {
                console.warn('Fullscreen request failed:', err);

                if (this.canvas.webkitRequestFullscreen)
                {
                    this.canvas.webkitRequestFullscreen();
                }
                else if (this.canvas.mozRequestFullScreen)
                {
                    this.canvas.mozRequestFullScreen();
                }
                else if (this.canvas.msRequestFullscreen)
                {
                    this.canvas.msRequestFullscreen();
                }
            });
        }
        else
        {
            if (document.exitFullscreen)
            {
                document.exitFullscreen();
            }
            else if (document.webkitExitFullscreen)
            {
                document.webkitExitFullscreen();
            }
            else if (document.mozCancelFullScreen)
            {
                document.mozCancelFullScreen();
            }
            else if (document.msExitFullscreen)
            {
                document.msExitFullscreen();
            }
        }
    }

    debugState()
    {
        console.group('Fractal Explorer State Debug');
        console.log(`Render Mode: ${this.renderMode}`);
        console.log(`Active View: ${this.activeView}`);
        console.log(`Julia Parameters:`, {
            c: `${this.juliaParams.c_real} + ${this.juliaParams.c_imag}i`,
            zoom: this.juliaParams.zoom,
            offset: `${this.juliaParams.offsetX}, ${this.juliaParams.offsetY}`,
            iterations: this.juliaParams.maxIterations
        });
        console.log(`Mandelbrot Parameters:`, {
            zoom: this.mandelbrotParams.zoom,
            offset: `${this.mandelbrotParams.offsetX}, ${this.mandelbrotParams.offsetY}`,
            iterations: this.mandelbrotParams.maxIterations
        });
        console.log(`Current Active Zoom: ${this.getCurrentZoom()}`);
        console.log(`Complex Coordinates: ${this.complexCoordinates.x} + ${this.complexCoordinates.y}i`);
        console.groupEnd();
    }
}

async function main()
{
    try
    {
        const renderer = new JuliaSetRenderer();
        await renderer.init();

        // Create UI container
        const createUIPanel = (position) =>
        {
            const panel = document.createElement('div');
            panel.style.cssText = `
                position: fixed;
                top: 20px;
                ${position}: 20px;
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
            return panel;
        };

        const instructions = createUIPanel('left');
        instructions.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: bold; color: #fff;">Fractal Explorer</div>
                <div id="mode-display" style="font-size: 10px; background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px;">Dual View</div>
            </div>
            <div style="font-size: 11px; line-height: 1.4;">
                <div><strong>Dual Mode:</strong> Mandelbrot (left) + Julia (right)</div>
                <div><strong>Left Click:</strong> Select Julia parameter • <strong>Middle Drag:</strong> Pan</div>
                <div><strong>Wheel:</strong> Zoom view • <strong>Arrows/+/-:</strong> Navigate active</div>
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <div><strong>D:</strong> Dual mode • <strong>M:</strong> Cycle modes • <strong>Tab:</strong> Switch view</div>
                    <div><strong>J:</strong> Smart Julia • <strong>R:</strong> Reset all • <strong>F:</strong> Fullscreen</div>
                </div>
            </div>
        `;
        document.body.appendChild(instructions);

        // Store mode display element reference
        renderer.modeDisplay = document.getElementById('mode-display');

        // Coordinate display
        const coordDisplay = createUIPanel('right');
        document.body.appendChild(coordDisplay);
        renderer.coordDisplay = coordDisplay;

        // Auto-hide UI elements after a delay
        setTimeout(() =>
        {
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

        // Initial updates
        renderer.updateCoordinateDisplay();
        renderer.updateModeDisplay();

        // Cleanup on page unload
        window.addEventListener('beforeunload', () =>
        {
            renderer.destroy();
        });

    } catch (error)
    {
        console.error('Failed to initialize Julia Set renderer:', error);

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

if (document.readyState === 'loading')
{
    document.addEventListener('DOMContentLoaded', main);
} else
{
    main();
}