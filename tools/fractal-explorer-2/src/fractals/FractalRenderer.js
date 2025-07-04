/**
 * Fractal Renderer
 * Main rendering coordinator for fractal visualization
 */
export class FractalRenderer
{
    constructor(webgpuContext, canvasManager, stateManager)
    {
        this.webgpuContext = webgpuContext;
        this.canvasManager = canvasManager;
        this.stateManager = stateManager;

        this.renderPipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.bindGroupLayout = null;

        this.isInitialized = false;
    }

    /**
     * Initialize the fractal renderer
     */
    async initialize()
    {
        try
        {
            await this.createRenderPipeline();
            this.createBuffers();
            this.setupResizeHandler();

            this.isInitialized = true;
            console.log('✅ Fractal renderer initialized');
        } catch (error)
        {
            console.error('❌ Failed to initialize fractal renderer:', error);
            throw error;
        }
    }

    /**
     * Create the WebGPU render pipeline
     */
    async createRenderPipeline()
    {
        // Vertex shader for full-screen quad
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

        // Fragment shader for fractal computation
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

        // Create shader modules
        const vertexShader = this.webgpuContext.createShaderModule(vertexShaderCode, 'Vertex Shader');
        const fragmentShader = this.webgpuContext.createShaderModule(fragmentShaderCode, 'Fragment Shader');

        // Create bind group layout
        this.bindGroupLayout = this.webgpuContext.createBindGroupLayout([
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            }
        ], 'Fractal Bind Group Layout');

        // Create pipeline layout
        const pipelineLayout = this.webgpuContext.device.createPipelineLayout({
            label: 'Fractal Pipeline Layout',
            bindGroupLayouts: [this.bindGroupLayout]
        });

        // Create render pipeline
        this.renderPipeline = this.webgpuContext.createRenderPipeline({
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
                    format: this.webgpuContext.canvasFormat,
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
    }

    /**
     * Create uniform buffers
     */
    createBuffers()
    {
        this.updateUniforms();
    }

    /**
     * Update uniform buffer with current parameters
     */
    updateUniforms()
    {
        const state = this.stateManager.getState();
        const dimensions = this.canvasManager.getDimensions();

        // Convert render mode to shader value
        let renderModeValue = 0.0; // Julia
        if (state.renderMode === 'mandelbrot')
        {
            renderModeValue = 1.0;
        } else if (state.renderMode === 'dual')
        {
            renderModeValue = 2.0;
        }

        // Create uniform data array
        const uniformData = new Float32Array([
            state.juliaParams.c_real,            // 0
            state.juliaParams.c_imag,            // 1
            state.juliaParams.zoom,              // 2
            state.juliaParams.offsetX,           // 3
            state.juliaParams.offsetY,           // 4
            state.juliaParams.maxIterations,     // 5
            state.juliaParams.colorOffset,       // 6
            state.mandelbrotParams.zoom,         // 7
            state.mandelbrotParams.offsetX,      // 8
            state.mandelbrotParams.offsetY,      // 9
            state.mandelbrotParams.maxIterations,// 10
            state.mandelbrotParams.colorOffset,  // 11
            dimensions.width,                    // 12
            dimensions.height,                   // 13
            renderModeValue,                     // 14
            0 // 15 - padding for alignment
        ]);

        // Create or update uniform buffer
        if (!this.uniformBuffer)
        {
            this.uniformBuffer = this.webgpuContext.createUniformBuffer(uniformData, 'Fractal Uniform Buffer');

            // Create bind group
            this.bindGroup = this.webgpuContext.createBindGroup(
                this.bindGroupLayout,
                [{
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    },
                }],
                'Fractal Bind Group'
            );
        } else
        {
            this.webgpuContext.updateBuffer(this.uniformBuffer, uniformData);
        }
    }

    /**
     * Setup resize handler
     */
    setupResizeHandler()
    {
        this.canvasManager.onResize(() =>
        {
            this.updateUniforms();
        });
    }

    /**
     * Render the current frame
     */
    render()
    {
        if (!this.isInitialized) return;

        // Ensure uniform buffer is up to date
        this.updateUniforms();

        const commandEncoder = this.webgpuContext.createCommandEncoder('Fractal Render');

        const renderPassDescriptor = {
            label: 'Fractal Render Pass',
            colorAttachments: [{
                view: this.webgpuContext.getCurrentTextureView(),
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.renderPipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(6, 1, 0, 0); // Draw full-screen triangle pair
        passEncoder.end();

        this.webgpuContext.submitCommands([commandEncoder.finish()]);
    }

    /**
     * Clean up renderer resources
     */
    destroy()
    {
        if (this.uniformBuffer)
        {
            this.uniformBuffer.destroy();
            this.uniformBuffer = null;
        }

        this.renderPipeline = null;
        this.bindGroup = null;
        this.bindGroupLayout = null;
        this.isInitialized = false;

        console.log('🗑️ Fractal renderer destroyed');
    }
}
