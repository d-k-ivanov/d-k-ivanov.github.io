/**
 * Main fractal fragment shader with dual-view support
 * Renders Julia and Mandelbrot sets with optimized mathematics and professional coloring
 *
 * This shader supports three rendering modes:
 * - Julia set (render_mode = 0.0)
 * - Mandelbrot set (render_mode = 1.0)
 * - Dual view showing both sets (render_mode = 2.0)
 * - Additional fractal types (render_mode >= 3.0)
 */

// Mathematical constants
const ESCAPE_RADIUS_SQUARED = 4.0;
const SMOOTH_ITERATION_FACTOR = 32.0;

// Import additional fractal types
#include "fractal_types.wgsl"

// Uniform data structure matching the JavaScript buffer layout
struct Uniforms {
    // Julia set parameters
    julia_c_real: f32,
    julia_c_imag: f32,
    julia_zoom: f32,
    julia_offset_x: f32,
    julia_offset_y: f32,
    julia_max_iterations: f32,
    julia_color_offset: f32,

    // Mandelbrot set parameters
    mandelbrot_zoom: f32,
    mandelbrot_offset_x: f32,
    mandelbrot_offset_y: f32,
    mandelbrot_max_iterations: f32,
    mandelbrot_color_offset: f32,

    // Canvas dimensions
    canvas_width: f32,
    canvas_height: f32,

    // Rendering mode:
    // 0.0=Julia, 1.0=Mandelbrot, 2.0=Dual
    // 3.0=Burning Ship, 4.0=Tricorn, 5.0=Phoenix, 6.0=Newton
    render_mode: f32,

    // Unused fractal power parameter (kept for buffer compatibility)
    fractal_power: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

/**
 * Optimized complex number iteration with escape time algorithm
 * Uses efficient squared magnitude check and smooth iteration counting
 *
 * @param z - Initial complex value (starting point)
 * @param c - Complex parameter (determines the specific fractal)
 * @param max_iter - Maximum number of iterations before assuming point is in the set
 * @returns Smooth iteration count (for continuous coloring)
 */
fn complex_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    // Get the fractal type from the render mode
    let fractal_type = floor(uniforms.render_mode);

    // Standard Mandelbrot/Julia iteration if fractal_type < 3
    if (fractal_type < 3.0) {
        var z_current = z;
        var iterations = 0.0;
        let max_i = i32(max_iter);

        for (var i = 0; i < max_i; i++) {
            let z_magnitude_sq = dot(z_current, z_current);

            // Early escape check for performance
            if (z_magnitude_sq > ESCAPE_RADIUS_SQUARED) {
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
    // Alternative fractal types
    else if (fractal_type == 3.0) {
        // Burning Ship fractal
        return burning_ship_iteration(z, c, max_iter);
    }
    else if (fractal_type == 4.0) {
        // Tricorn fractal
        return tricorn_iteration(z, c, max_iter);
    }
    else if (fractal_type == 5.0) {
        // Phoenix fractal
        return phoenix_iteration(z, c, max_iter);
    }
    else if (fractal_type == 6.0) {
        // Newton fractal
        let newton_result = newton_iteration(z, c, max_iter);
        // Return just the iteration count for now (we'll handle root coloring later)
        return newton_result.x;
    }

    // Default to standard Mandelbrot-style iteration instead of recursion
    // Avoid cyclic dependency by implementing the default case directly
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    for (var i = 0; i < max_i; i++) {
        let z_magnitude_sq = dot(z_current, z_current);
        if (z_magnitude_sq > ESCAPE_RADIUS_SQUARED) {
            break;
        }

        // Standard complex number squaring: (a+bi)² + c
        z_current = vec2<f32>(
            z_current.x * z_current.x - z_current.y * z_current.y + c.x,
            2.0 * z_current.x * z_current.y + c.y
        );
        iterations += 1.0;
    }

    // Smooth coloring for continuous gradient
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
 * Shows where the current Julia constant is located in the Mandelbrot set
 *
 * @param coord - The current complex coordinate in the Mandelbrot set
 * @param base_color - The original color at this point
 * @param zoom - Current zoom level (used to scale the indicator)
 * @returns Modified color with indicator highlighting
 */
fn apply_julia_indicator(coord: vec2<f32>, base_color: vec3<f32>, zoom: f32) -> vec3<f32> {
    // Get Julia set parameter
    let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);

    // Calculate distance to the Julia parameter point
    let dist_to_julia = length(coord - julia_c);

    // Dynamic sizing based on zoom level
    let indicator_size = 0.02 / zoom;

    // Apply highlight if we're near the Julia parameter point
    if (dist_to_julia < indicator_size) {
        // Fade strength based on distance
        let indicator_strength = 1.0 - (dist_to_julia / indicator_size);

        // Blend with white to create a bright indicator
        return mix(base_color, vec3<f32>(1.0, 1.0, 1.0), indicator_strength * 0.8);
    }

    return base_color;
}

/**
 * Enhanced coloring function for Newton fractal
 * Uses iteration count, root information, and distance for rich visualization
 */
fn newton_color(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> vec4<f32> {
    let result = newton_iteration(z, c, max_iter);
    let iterations = result.x;
    let root = result.y; // Which root was found
    let distance_to_root = result.z; // Distance to nearest root

    // Enhanced color palette for each root with multiple hues
    let root_colors_primary = array<vec3<f32>, 3>(
        vec3<f32>(1.0, 0.2, 0.1),  // Bright red-orange
        vec3<f32>(0.1, 0.9, 0.3),  // Bright green
        vec3<f32>(0.2, 0.3, 1.0)   // Bright blue
    );

    let root_colors_secondary = array<vec3<f32>, 3>(
        vec3<f32>(1.0, 0.6, 0.0),  // Orange
        vec3<f32>(0.0, 0.7, 0.9),  // Cyan
        vec3<f32>(0.8, 0.1, 0.9)   // Purple
    );

    let root_colors_tertiary = array<vec3<f32>, 3>(
        vec3<f32>(0.9, 0.9, 0.2),  // Yellow
        vec3<f32>(0.9, 0.2, 0.6),  // Magenta
        vec3<f32>(0.2, 0.8, 0.8)   // Turquoise
    );

    // Get the base color based on which root was found
    let root_index = i32(root);
    if (root_index >= 0 && root_index < 3) {
        // Calculate convergence speed factor
        let convergence_speed = iterations / max_iter;

        // Use distance information for finer detail
        let distance_factor = clamp(distance_to_root * 1000.0, 0.0, 1.0);

        // Create multiple color layers based on iteration bands
        let iter_bands = fract(iterations * 0.25 + distance_factor * 2.0); // Enhanced banding
        let smooth_iter = iterations + 1.0 - log2(log2(max(distance_to_root * 100.0, 1.0)));
        let color_phase = fract(smooth_iter * 0.08 + distance_factor); // Phase for color cycling

        // Primary color based on root
        let primary_color = root_colors_primary[root_index];
        let secondary_color = root_colors_secondary[root_index];
        let tertiary_color = root_colors_tertiary[root_index];

        // Enhanced blending with distance-based modulation
        let blend_factor1 = sin(iterations * 0.4 + distance_factor * 10.0) * 0.5 + 0.5;
        let blend_factor2 = cos(iterations * 0.25 + distance_factor * 15.0) * 0.5 + 0.5;

        var base_color = mix(primary_color, secondary_color, blend_factor1);
        base_color = mix(base_color, tertiary_color, blend_factor2 * 0.4);

        // Distance-based brightness with fine detail
        let brightness_base = 0.2 + 0.8 * (1.0 - convergence_speed);
        let brightness_variation = sin(iterations * 0.6 + distance_factor * 20.0) * 0.3 + 0.7;
        let distance_brightness = smoothstep(0.0, 0.01, distance_factor) * 0.5 + 0.5;
        let detail_factor = fract(distance_factor * 50.0 + iterations * 0.1);
        let brightness = brightness_base * brightness_variation * distance_brightness * (0.8 + 0.2 * detail_factor);

        // Create metallic-like highlights based on convergence
        let highlight = pow(max(0.0, 1.0 - convergence_speed), 2.0) * 0.3;
        let highlight_strength = smoothstep(0.0, 0.002, distance_factor);
        let highlight_color = vec3<f32>(1.0, 1.0, 0.9); // Warm white highlight

        // Root boundary enhancement
        let boundary_effect = smoothstep(0.0, 0.005, distance_factor) *
                             smoothstep(0.02, 0.01, distance_factor);
        let boundary_color = vec3<f32>(1.0, 1.0, 1.0); // White boundaries

        // Final color composition with enhanced layering
        var final_color = base_color * brightness;
        final_color = mix(final_color, highlight_color, highlight * highlight_strength);
        final_color = mix(final_color, boundary_color, boundary_effect * 0.3);

        // Add chromatic enhancement
        let saturation_boost = 1.3 + distance_factor * 0.5;
        let luminance = dot(final_color, vec3<f32>(0.299, 0.587, 0.114));
        let saturated_color = mix(vec3<f32>(luminance), final_color, saturation_boost);

        return vec4<f32>(saturated_color, 1.0);
    }

    // Enhanced background for non-converged points
    let background_pattern = sin(length(z) * 12.0 + atan2(z.y, z.x) * 3.0) * 0.5 + 0.5;
    let background_color = vec3<f32>(0.05, 0.02, 0.15) * background_pattern * 0.5;
    return vec4<f32>(background_color, 1.0);
}

/**
 * Main fragment shader entry point
 * Handles all rendering modes (Julia, Mandelbrot, Dual)
 *
 * This is the entry point for the fragment shader which determines
 * the color of each pixel based on the fractal calculations
 */
@fragment
fn main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
    // Normalize coordinates to [0,1] range
    let uv = position.xy / vec2<f32>(uniforms.canvas_width, uniforms.canvas_height);
    let render_mode = uniforms.render_mode;

    // ====================================================================
    // DUAL VIEW MODE - Split screen with Mandelbrot (left) and Julia (right)
    // ====================================================================
    if (render_mode > 1.5 && render_mode < 2.5) {
        // Adjust aspect ratio for half-screen width
        let aspect_ratio = (uniforms.canvas_width * 0.5) / uniforms.canvas_height;

        if (uv.x < 0.5) {
            // ----------------------------------------
            // LEFT HALF: MANDELBROT SET
            // ----------------------------------------

            // Map screen coordinates to complex plane
            let coord = vec2<f32>(
                // x coordinate: map [0,0.5] to centered view based on zoom and offset
                (uv.x * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_x,
                // y coordinate: map [0,1] to centered view based on zoom and offset
                (uv.y - 0.5) * 4.0 / uniforms.mandelbrot_zoom + uniforms.mandelbrot_offset_y
            );

            // Calculate iterations for Mandelbrot set (z₀ = 0, c = coord)
            let iterations = complex_iteration(
                vec2<f32>(0.0, 0.0),  // z₀ = 0
                coord,                // c = coordinate in complex plane
                uniforms.mandelbrot_max_iterations
            );

            // Black for points in the set (reached max iterations)
            if (iterations >= uniforms.mandelbrot_max_iterations) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + uniforms.mandelbrot_color_offset);
            var rgb = get_color_from_palette(t);

            // Apply brightness based on escape speed
            let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.mandelbrot_max_iterations);
            rgb = rgb * brightness;

            // Add visual indicator for current Julia parameter
            rgb = apply_julia_indicator(coord, rgb, uniforms.mandelbrot_zoom);

            return vec4<f32>(rgb, 1.0);
        } else {
            // ----------------------------------------
            // RIGHT HALF: JULIA SET
            // ----------------------------------------

            // Map screen coordinates to complex plane
            let coord = vec2<f32>(
                // x coordinate: map [0.5,1.0] to centered view based on zoom and offset
                ((uv.x - 0.5) * 2.0 - 0.5) * 4.0 * aspect_ratio / uniforms.julia_zoom + uniforms.julia_offset_x,
                // y coordinate: map [0,1] to centered view based on zoom and offset
                (uv.y - 0.5) * 4.0 / uniforms.julia_zoom + uniforms.julia_offset_y
            );

            // Get Julia set constant parameter
            let c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);

            // Calculate iterations for Julia set (z₀ = coord, c = constant)
            let iterations = complex_iteration(coord, c, uniforms.julia_max_iterations);

            // Black for points in the set
            if (iterations >= uniforms.julia_max_iterations) {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + uniforms.julia_color_offset);
            let rgb = get_color_from_palette(t);

            // Apply brightness based on escape speed
            let brightness = 0.6 + 0.4 * (1.0 - iterations / uniforms.julia_max_iterations);

            return vec4<f32>(rgb * brightness, 1.0);
        }
    }

    // ====================================================================
    // SINGLE VIEW MODE - Full screen Julia or Mandelbrot
    // ====================================================================

    // Full screen aspect ratio
    let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;

    // Calculate complex plane coordinates based on active mode
    // Uses select() to choose between Julia and Mandelbrot parameters
    let coord = vec2<f32>(
        // X coordinate mapping with proper zoom and offset
        (uv.x - 0.5) * 4.0 * aspect_ratio / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_x, uniforms.mandelbrot_offset_x, render_mode > 0.5),

        // Y coordinate mapping with proper zoom and offset
        (uv.y - 0.5) * 4.0 / select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5) +
        select(uniforms.julia_offset_y, uniforms.mandelbrot_offset_y, render_mode > 0.5)
    );

    // Select parameters based on render mode
    let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let max_iter = select(uniforms.julia_max_iterations, uniforms.mandelbrot_max_iterations, render_mode > 0.5);
    let color_offset = select(uniforms.julia_color_offset, uniforms.mandelbrot_color_offset, render_mode > 0.5);
    let current_zoom = select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5);

    // Calculate iterations based on the fractal type
    var iterations: f32;

    if (render_mode >= 3.0) {
        // For special fractal types (Burning Ship, Tricorn, Phoenix, Newton)
        if (render_mode >= 3.0 && render_mode <= 6.0) {
            // For these fractals, use Mandelbrot-style iteration (z₀ = 0, c = coord)
            iterations = complex_iteration(vec2<f32>(0.0, 0.0), coord, max_iter);
        } else {
            // Default to standard Mandelbrot
            iterations = complex_iteration(vec2<f32>(0.0, 0.0), coord, max_iter);
        }
    } else {
        // Standard Julia/Mandelbrot handling
        iterations = select(
            // For Julia (render_mode = 0.0): z₀ = coord, c = constant parameter
            complex_iteration(coord, julia_c, max_iter),

            // For Mandelbrot (render_mode = 1.0): z₀ = 0, c = coord
            complex_iteration(vec2<f32>(0.0, 0.0), coord, max_iter),

            // Selection based on render_mode
            render_mode > 0.5
        );
    }

    // Special handling for Newton fractal
    if (render_mode == 6.0) {
        return newton_color(coord, julia_c, max_iter);
    }

    // Black for points in the set (non-escaping points)
    if (iterations >= max_iter) {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    // Generate color for escaped points
    let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + color_offset);
    var rgb = get_color_from_palette(t);
    let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter);

    // Apply the brightness adjustment
    rgb = rgb * brightness;

    // Apply Julia parameter indicator in standard Mandelbrot mode
    if (render_mode == 1.0) { // Standard Mandelbrot mode
        rgb = apply_julia_indicator(coord, rgb, current_zoom);
    }

    // Return final color with full opacity
    return vec4<f32>(rgb, 1.0);
}
