/**
 * Main fractal fragment shader with dual-view support
 * Renders Julia and Mandelbrot sets with optimized mathematics and professional coloring
 */

// Uniform data structure matching the JavaScript buffer layout
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

/**
 * Optimized complex number iteration with escape time algorithm
 * Uses efficient squared magnitude check and smooth iteration counting
 */
fn complex_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);
    let escape_radius_sq = 4.0;

    for (var i = 0; i < max_i; i++) {
        let z_magnitude_sq = dot(z_current, z_current);

        // Early escape check for performance
        if (z_magnitude_sq > escape_radius_sq) {
            break;
        }

        // Optimized complex multiplication: (a+bi)² + c
        // (x + yi)² = (x² - y²) + (2xy)i
        z_current = vec2<f32>(
            z_current.x * z_current.x - z_current.y * z_current.y + c.x,
            2.0 * z_current.x * z_current.y + c.y
        );
        iterations += 1.0;
    }

    // Smooth iteration count for continuous coloring
    // Reduces banding artifacts in color gradients
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            return iterations + 1.0 - log2(log2(z_magnitude));
        }
    }

    return iterations;
}

/**
 * Professional color palette with mathematical aesthetics
 * 16-color palette designed for fractal visualization
 */
fn get_color_from_palette(t: f32) -> vec3<f32> {
    let palette = array<vec3<f32>, 16>(
        vec3<f32>(0.0, 0.0, 0.1),   // Deep blue - infinite regions
        vec3<f32>(0.0, 0.0, 0.3),   // Dark blue
        vec3<f32>(0.0, 0.1, 0.5),   // Medium blue
        vec3<f32>(0.0, 0.3, 0.7),   // Light blue
        vec3<f32>(0.0, 0.5, 0.9),   // Cyan blue
        vec3<f32>(0.1, 0.6, 0.8),   // Cyan
        vec3<f32>(0.3, 0.7, 0.7),   // Teal
        vec3<f32>(0.5, 0.8, 0.6),   // Green-blue
        vec3<f32>(0.7, 0.9, 0.4),   // Yellow-green
        vec3<f32>(0.9, 0.9, 0.2),   // Yellow
        vec3<f32>(1.0, 0.8, 0.1),   // Orange-yellow
        vec3<f32>(1.0, 0.6, 0.0),   // Orange
        vec3<f32>(1.0, 0.4, 0.1),   // Red-orange
        vec3<f32>(0.9, 0.2, 0.2),   // Red
        vec3<f32>(0.7, 0.1, 0.3),   // Dark red
        vec3<f32>(0.5, 0.0, 0.4)    // Purple - fast escape
    );

    // Smooth interpolation between palette colors
    let index = t * 15.0;
    let i = i32(floor(index));
    let frac = fract(index);
    let i0 = clamp(i, 0, 15);
    let i1 = clamp(i + 1, 0, 15);

    return mix(palette[i0], palette[i1], frac);
}

/**
 * Apply visual indicator for Julia parameter in Mandelbrot view
 * Shows where the current Julia constant is located
 */
fn apply_julia_indicator(coord: vec2<f32>, base_color: vec3<f32>, zoom: f32) -> vec3<f32> {
    let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let dist_to_julia = length(coord - julia_c);
    let indicator_size = 0.02 / zoom; // Scale with zoom level

    if (dist_to_julia < indicator_size) {
        let indicator_strength = 1.0 - (dist_to_julia / indicator_size);
        // Blend with white to create a bright indicator
        return mix(base_color, vec3<f32>(1.0, 1.0, 1.0), indicator_strength * 0.8);
    }

    return base_color;
}

/**
 * Main fragment shader entry point
 * Handles single and dual view rendering modes
 */
@fragment
fn main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = position.xy / vec2<f32>(uniforms.canvas_width, uniforms.canvas_height);
    let render_mode = uniforms.render_mode;

    // Dual view mode (render_mode = 2.0) - split-screen rendering
    if (render_mode > 1.5) {
        let aspect_ratio = (uniforms.canvas_width * 0.5) / uniforms.canvas_height;

        if (uv.x < 0.5) {
            // Left half: Mandelbrot set
            let coord = vec2<f32>(
                (uv.x * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_x,
                (uv.y - 0.5) * 4.0 / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_y
            );

            let iterations = complex_iteration(
                vec2<f32>(0.0, 0.0),
                coord,
                uniforms.mandelbrot_max_iterations
            );

            // Black for points in the set (infinite iterations)
            if (iterations >= uniforms.mandelbrot_max_iterations) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / 32.0) + uniforms.mandelbrot_color_offset);
            var rgb = get_color_from_palette(t);

            // Apply brightness based on escape speed
            let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.mandelbrot_max_iterations);
            rgb = rgb * brightness;

            // Add Julia parameter indicator
            rgb = apply_julia_indicator(coord, rgb, uniforms.mandelbrot_zoom);

            return vec4<f32>(rgb, 1.0);
        } else {
            // Right half: Julia set
            let coord = vec2<f32>(
                ((uv.x - 0.5) * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.julia_zoom + uniforms.julia_offset_x,
                (uv.y - 0.5) * 4.0 / uniforms.julia_zoom + uniforms.julia_offset_y
            );

            let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
            let iterations = complex_iteration(coord, c, uniforms.julia_max_iterations);

            // Black for points in the set
            if (iterations >= uniforms.julia_max_iterations) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / 32.0) + uniforms.julia_color_offset);
            let rgb = get_color_from_palette(t);
            let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.julia_max_iterations);

            return vec4<f32>(rgb * brightness, 1.0);
        }
    }

    // Single view modes (Julia or Mandelbrot)
    let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;

    // Calculate complex plane coordinates
    let coord = vec2<f32>(
        (uv.x - 0.5) * 4.0 * aspect_ratio / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_x, uniforms.mandelbrot_offset_x, render_mode > 0.5),
        (uv.y - 0.5) * 4.0 / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_y, uniforms.mandelbrot_offset_y, render_mode > 0.5)
    );

    // Select parameters based on render mode
    let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let max_iter = select(uniforms.julia_max_iterations, uniforms.mandelbrot_max_iterations, render_mode > 0.5);
    let color_offset = select(uniforms.julia_color_offset, uniforms.mandelbrot_color_offset, render_mode > 0.5);

    // Calculate iterations (Julia vs Mandelbrot)
    let iterations = select(
        complex_iteration(coord, c, max_iter),                    // Julia: z₀ = coord, c = constant
        complex_iteration(vec2<f32>(0.0, 0.0), coord, max_iter), // Mandelbrot: z₀ = 0, c = coord
        render_mode > 0.5
    );

    // Black for points in the set
    if (iterations >= max_iter) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    // Generate color for escaped points
    let t = fract((iterations / 32.0) + color_offset);
    let rgb = get_color_from_palette(t);
    let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter);

    return vec4<f32>(rgb * brightness, 1.0);
}
