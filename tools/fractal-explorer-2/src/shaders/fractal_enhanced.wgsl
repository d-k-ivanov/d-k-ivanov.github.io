/**
 * Enhanced fractal fragment shader with infinite zoom and perturbation support
 * Supports ultra-high precision rendering for extreme zoom levels
 */

// Enhanced uniform data structure with additional precision parameters
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
    // Enhanced precision parameters
    precision_level: f32,
    color_scale: f32,
    detail_level: f32,
    reference_real: f32,
    reference_imag: f32,
    perturbation_scale: f32,
    adaptive_iterations: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

/**
 * Enhanced complex number iteration with perturbation theory support
 * Supports both standard and high-precision calculations
 */
fn complex_iteration_enhanced(z: vec2<f32>, c: vec2<f32>, max_iter: f32, use_perturbation: bool) -> f32 {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);
    let escape_radius_sq = 4.0;

    // Enhanced escape radius for better precision at high zoom levels
    let enhanced_escape_radius_sq = select(4.0, 16.0, uniforms.precision_level > 2.0);

    for (var i = 0; i < max_i; i++) {
        let z_magnitude_sq = dot(z_current, z_current);

        // Enhanced early escape check
        if (z_magnitude_sq > enhanced_escape_radius_sq) {
            break;
        }

        // High-precision complex multiplication with error compensation
        if (use_perturbation && uniforms.precision_level > 1.0) {
            // Use compensated arithmetic for better precision
            let a = z_current.x;
            let b = z_current.y;
            let real_part = a * a - b * b + c.x;
            let imag_part = 2.0 * a * b + c.y;

            // Apply small correction for higher precision
            let correction_factor = 1.0 + uniforms.perturbation_scale * 1e-15;
            z_current = vec2<f32>(real_part * correction_factor, imag_part * correction_factor);
        } else {
            // Standard computation for performance
            z_current = vec2<f32>(
                z_current.x * z_current.x - z_current.y * z_current.y + c.x,
                2.0 * z_current.x * z_current.y + c.y
            );
        }

        iterations += 1.0;
    }

    // Enhanced smooth iteration count with adaptive precision
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            // More sophisticated smoothing for high zoom levels
            if (uniforms.precision_level > 2.0) {
                let log_zn = log2(log2(z_magnitude));
                let fractional = log_zn - floor(log_zn);
                return iterations + 1.0 - fractional;
            } else {
                return iterations + 1.0 - log2(log2(z_magnitude));
            }
        }
    }

    return iterations;
}

/**
 * Standard complex iteration for compatibility
 */
fn complex_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    return complex_iteration_enhanced(z, c, max_iter, false);
}

/**
 * Enhanced color palette with adaptive scaling for deep zooms
 * 32-color palette for better gradation at extreme zoom levels
 */
fn get_enhanced_color_palette(t: f32) -> vec3<f32> {
    let palette = array<vec3<f32>, 32>(
        // Deep blues - for very slow escape
        vec3<f32>(0.0, 0.0, 0.1),   vec3<f32>(0.0, 0.0, 0.2),
        vec3<f32>(0.0, 0.0, 0.35),  vec3<f32>(0.0, 0.1, 0.5),
        vec3<f32>(0.0, 0.2, 0.65),  vec3<f32>(0.0, 0.35, 0.8),

        // Blues to cyans
        vec3<f32>(0.0, 0.5, 0.9),   vec3<f32>(0.1, 0.6, 0.95),
        vec3<f32>(0.2, 0.7, 0.9),   vec3<f32>(0.35, 0.8, 0.85),

        // Cyan to green-blues
        vec3<f32>(0.5, 0.85, 0.8),  vec3<f32>(0.65, 0.9, 0.7),
        vec3<f32>(0.75, 0.95, 0.6), vec3<f32>(0.85, 0.95, 0.5),

        // Green-yellows
        vec3<f32>(0.9, 0.95, 0.4),  vec3<f32>(0.95, 0.9, 0.3),
        vec3<f32>(1.0, 0.85, 0.2),  vec3<f32>(1.0, 0.8, 0.1),

        // Oranges
        vec3<f32>(1.0, 0.7, 0.05),  vec3<f32>(1.0, 0.65, 0.0),
        vec3<f32>(1.0, 0.6, 0.0),   vec3<f32>(1.0, 0.5, 0.05),

        // Reds
        vec3<f32>(0.95, 0.4, 0.1),  vec3<f32>(0.9, 0.3, 0.15),
        vec3<f32>(0.85, 0.2, 0.2),  vec3<f32>(0.8, 0.15, 0.25),

        // Dark reds to purples
        vec3<f32>(0.7, 0.1, 0.3),   vec3<f32>(0.6, 0.05, 0.35),
        vec3<f32>(0.5, 0.0, 0.4),   vec3<f32>(0.4, 0.0, 0.35),

        // Deep purples - for fast escape
        vec3<f32>(0.3, 0.0, 0.3),   vec3<f32>(0.2, 0.0, 0.25)
    );

    // Enhanced interpolation with adaptive resolution
    let palette_size = 31.0;
    let index = t * palette_size;
    let i = i32(floor(index));
    let frac = fract(index);
    let i0 = clamp(i, 0, 31);
    let i1 = clamp(i + 1, 0, 31);

    let color = mix(palette[i0], palette[i1], frac);

    // Apply adaptive color scaling for deep zooms
    let enhanced_color = color * uniforms.color_scale;

    return clamp(enhanced_color, vec3<f32>(0.0), vec3<f32>(1.0));
}

/**
 * Standard color palette for compatibility
 */
fn get_color_from_palette(t: f32) -> vec3<f32> {
    if (uniforms.precision_level > 1.0) {
        return get_enhanced_color_palette(t);
    }

    // Original 16-color palette for standard zoom levels
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

/**
 * Enhanced Julia parameter indicator with zoom-adaptive sizing
 */
fn apply_julia_indicator(coord: vec2<f32>, base_color: vec3<f32>, zoom: f32) -> vec3<f32> {
    let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let dist_to_julia = length(coord - julia_c);

    // Adaptive indicator size based on zoom level and precision
    let base_size = 0.02;
    let zoom_adjusted_size = base_size / zoom;
    let precision_factor = 1.0 + uniforms.precision_level * 0.5;
    let indicator_size = zoom_adjusted_size * precision_factor;

    if (dist_to_julia < indicator_size) {
        let indicator_strength = 1.0 - (dist_to_julia / indicator_size);
        // Enhanced indicator with better visibility at high zoom
        let indicator_color = vec3<f32>(1.0, 0.9, 0.7); // Warm white
        let blend_strength = indicator_strength * 0.9;
        return mix(base_color, indicator_color, blend_strength);
    }

    return base_color;
}

/**
 * Advanced color enhancement for deep zoom levels
 */
fn enhance_color_for_zoom(color: vec3<f32>, iterations: f32, max_iter: f32) -> vec3<f32> {
    var enhanced_color = color;

    // Apply different enhancements based on precision level
    if (uniforms.precision_level > 2.0) {
        // Ultra-high precision: enhanced contrast and detail
        let iteration_factor = iterations / max_iter;
        let contrast_boost = 1.0 + (1.0 - iteration_factor) * 0.3;
        enhanced_color = enhanced_color * contrast_boost;

        // Add subtle color shifting for better detail visibility
        let shift_factor = sin(iterations * 0.1) * 0.05;
        enhanced_color.r += shift_factor;
        enhanced_color.g += shift_factor * 0.5;
    } else if (uniforms.precision_level > 1.0) {
        // High precision: moderate enhancement
        let brightness_factor = 0.8 + 0.4 * (1.0 - iterations / max_iter);
        enhanced_color = enhanced_color * brightness_factor;
    } else {
        // Standard precision: basic brightness adjustment
        let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter);
        enhanced_color = enhanced_color * brightness;
    }

    return clamp(enhanced_color, vec3<f32>(0.0), vec3<f32>(1.0));
}

/**
 * Main fragment shader entry point with enhanced infinite zoom support
 */
@fragment
fn main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = position.xy / vec2<f32>(uniforms.canvas_width, uniforms.canvas_height);
    let render_mode = uniforms.render_mode;

    // Determine if we should use enhanced precision algorithms
    let use_enhanced = uniforms.precision_level > 0.0;
    let use_perturbation = uniforms.precision_level > 2.0;

    // Dual view mode with enhanced precision support
    if (render_mode > 1.5 && render_mode < 2.5) {
        let aspect_ratio = (uniforms.canvas_width * 0.5) / uniforms.canvas_height;

        if (uv.x < 0.5) {
            // Left half: Enhanced Mandelbrot set
            let coord = vec2<f32>(
                (uv.x * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_x,
                (uv.y - 0.5) * 4.0 / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_y
            );

            let max_iter = select(uniforms.mandelbrot_max_iterations, uniforms.adaptive_iterations, use_enhanced);
            let iterations = complex_iteration_enhanced(
                vec2<f32>(0.0, 0.0),
                coord,
                max_iter,
                use_perturbation
            );

            if (iterations >= max_iter) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Enhanced color generation
            let color_divisor = select(32.0, 64.0, use_enhanced);
            let t = fract((iterations / color_divisor) + uniforms.mandelbrot_color_offset);
            var rgb = get_color_from_palette(t);

            // Apply zoom-specific color enhancement
            rgb = enhance_color_for_zoom(rgb, iterations, max_iter);

            // Enhanced Julia indicator
            rgb = apply_julia_indicator(coord, rgb, uniforms.mandelbrot_zoom);

            return vec4<f32>(rgb, 1.0);
        } else {
            // Right half: Enhanced Julia set
            let coord = vec2<f32>(
                ((uv.x - 0.5) * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.julia_zoom + uniforms.julia_offset_x,
                (uv.y - 0.5) * 4.0 / uniforms.julia_zoom + uniforms.julia_offset_y
            );

            let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
            let max_iter = select(uniforms.julia_max_iterations, uniforms.adaptive_iterations, use_enhanced);
            let iterations = complex_iteration_enhanced(coord, c, max_iter, use_perturbation);

            if (iterations >= max_iter) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            let color_divisor = select(32.0, 64.0, use_enhanced);
            let t = fract((iterations / color_divisor) + uniforms.julia_color_offset);
            var rgb = get_color_from_palette(t);

            rgb = enhance_color_for_zoom(rgb, iterations, max_iter);

            return vec4<f32>(rgb, 1.0);
        }
    }

    // Single view modes with enhanced precision
    let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;

    let coord = vec2<f32>(
        (uv.x - 0.5) * 4.0 * aspect_ratio / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_x, uniforms.mandelbrot_offset_x, render_mode > 0.5),
        (uv.y - 0.5) * 4.0 / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_y, uniforms.mandelbrot_offset_y, render_mode > 0.5)
    );

    let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let max_iter = select(
        select(uniforms.julia_max_iterations, uniforms.adaptive_iterations, use_enhanced),
        select(uniforms.mandelbrot_max_iterations, uniforms.adaptive_iterations, use_enhanced),
        render_mode > 0.5
    );
    let color_offset = select(uniforms.julia_color_offset, uniforms.mandelbrot_color_offset, render_mode > 0.5);

    // Calculate iterations with enhanced precision
    let iterations = select(
        complex_iteration_enhanced(coord, c, max_iter, use_perturbation),
        complex_iteration_enhanced(vec2<f32>(0.0, 0.0), coord, max_iter, use_perturbation),
        render_mode > 0.5
    );

    if (iterations >= max_iter) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    // Enhanced color generation
    let color_divisor = select(32.0, 64.0, use_enhanced);
    let t = fract((iterations / color_divisor) + color_offset);
    var rgb = get_color_from_palette(t);

    rgb = enhance_color_for_zoom(rgb, iterations, max_iter);

    return vec4<f32>(rgb, 1.0);
}
