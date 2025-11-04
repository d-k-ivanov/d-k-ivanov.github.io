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

    // Enhanced infinite zoom parameters
    precision_level: f32,      // Current precision level (0-5)
    color_scale: f32,          // Color scaling factor for deep zooms
    detail_level: f32,         // Detail level for quality adjustments
    reference_real: f32,       // Reference point for perturbation (high precision)
    reference_imag: f32,       // Reference point for perturbation (high precision)
    perturbation_scale: f32,   // Scale for perturbation calculations
    adaptive_iterations: f32,  // Adaptive iteration count based on zoom
    fractal_power: f32,        // Fractal power parameter
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

/**
 * Optimized complex number iteration with escape time algorithm
 * Uses efficient squared magnitude check and smooth iteration counting
 * Enhanced with adaptive precision and iteration count based on zoom level
 *
 * @param z - Initial complex value (starting point)
 * @param c - Complex parameter (determines the specific fractal)
 * @param base_max_iter - Base maximum iterations (will be enhanced based on precision level)
 * @returns Smooth iteration count (for continuous coloring)
 */
fn complex_iteration(z: vec2<f32>, c: vec2<f32>, base_max_iter: f32) -> f32 {
    // Get the fractal type from the render mode
    let fractal_type = floor(uniforms.render_mode);

    // Use adaptive iterations based on zoom level and precision
    let max_iter = max(base_max_iter, uniforms.adaptive_iterations);

    // Enhanced escape radius for higher precision levels
    let escape_radius_sq = ESCAPE_RADIUS_SQUARED * (1.0 + uniforms.precision_level * 0.5);

    // Standard Mandelbrot/Julia iteration if fractal_type < 3
    if fractal_type < 3.0 {
        var z_current = z;
        var iterations = 0.0;
        let max_i = i32(max_iter);

        // Enhanced iteration loop with precision-aware computations
        for (var i = 0; i < max_i; i++) {
            let z_magnitude_sq = dot(z_current, z_current);

            // Early escape check for performance with enhanced radius
            if z_magnitude_sq > escape_radius_sq {
                break;
            }

            // Enhanced complex multiplication with precision consideration
            // For high precision levels, use more careful arithmetic
            if uniforms.precision_level >= 2.0 {
                // Higher precision computation path
                let real_part = z_current.x * z_current.x - z_current.y * z_current.y + c.x;
                let imag_part = 2.0 * z_current.x * z_current.y + c.y;
                z_current = vec2<f32>(real_part, imag_part);
            } else {
                // Standard precision path for performance
                z_current = vec2<f32>(
                    z_current.x * z_current.x - z_current.y * z_current.y + c.x,
                    2.0 * z_current.x * z_current.y + c.y
                );
            }
            iterations += 1.0;
        }

        // Enhanced smooth iteration count with precision-aware computation
        if iterations < max_iter {
            let z_magnitude = length(z_current);
            if z_magnitude > 1.0 {
                // Enhanced smoothing factor based on precision level with more aggressive adjustments
                let smoothing_factor = 1.0 + uniforms.precision_level * 0.25; // Increased factor for better detail

                // Precision-aware logarithm calculation with enhanced detail preservation
                var log_factor = log2(log2(z_magnitude + uniforms.precision_level * 0.005));

                // Apply additional detail enhancement for Level 1 precision
                if uniforms.precision_level >= 1.0 && uniforms.precision_level < 2.0 {
                    // Fine detail enhancement specifically for Level 1 precision
                    log_factor *= (1.0 - uniforms.precision_level * 0.1);
                }

                return iterations + smoothing_factor - log_factor;
            }
        }

        return iterations;
    } else if fractal_type == 3.0 {
        // Burning Ship fractal with adaptive iterations
        return burning_ship_iteration(z, c, max_iter);
    } else if fractal_type == 4.0 {
        // Tricorn fractal with adaptive iterations
        return tricorn_iteration(z, c, max_iter);
    } else if fractal_type == 5.0 {
        // Phoenix fractal with adaptive iterations
        return phoenix_iteration(z, c, max_iter);
    } else if fractal_type == 6.0 {
        // Newton fractal with adaptive iterations
        let newton_result = newton_iteration(z, c, max_iter);
        // Return just the iteration count for now (we'll handle root coloring later)
        return newton_result.x;
    }

    // Default implementation with enhanced precision
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    for (var i = 0; i < max_i; i++) {
        let z_magnitude_sq = dot(z_current, z_current);
        if z_magnitude_sq > escape_radius_sq {
            break;
        }

        // Enhanced complex number squaring with precision consideration
        if uniforms.precision_level >= 2.0 {
            let real_part = z_current.x * z_current.x - z_current.y * z_current.y + c.x;
            let imag_part = 2.0 * z_current.x * z_current.y + c.y;
            z_current = vec2<f32>(real_part, imag_part);
        } else {
            z_current = vec2<f32>(
                z_current.x * z_current.x - z_current.y * z_current.y + c.x,
                2.0 * z_current.x * z_current.y + c.y
            );
        }
        iterations += 1.0;
    }

    // Enhanced smooth coloring with precision-aware computation
    if iterations < max_iter {
        let z_magnitude = length(z_current);
        if z_magnitude > 1.0 {
            let smoothing_factor = 1.0 + uniforms.precision_level * 0.1;
            return iterations + smoothing_factor - log2(log2(z_magnitude + uniforms.precision_level * 0.01));
        }
    }

    return iterations;
}

/**
 * Professional color palette with mathematical aesthetics
 * 16-color palette designed for fractal visualization
 * Enhanced with adaptive color scaling for deep zoom levels
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

    // Enhanced color mapping with adaptive scaling based on precision level
    let enhanced_t = t * uniforms.color_scale;

    // Smooth interpolation between palette colors with precision enhancement
    let index = enhanced_t * 15.0;
    let i = i32(floor(index));
    let frac = fract(index);
    let i0 = clamp(i, 0, 15);
    let i1 = clamp(i + 1, 0, 15);

    let base_color = mix(palette[i0], palette[i1], frac);

    // Apply detail enhancement for high precision levels
    if uniforms.precision_level >= 1.0 {
        // Add more aggressive detail enhancement for better visualization at deep zoom
        // Specifically target Level 1 precision for dramatic improvement
        let frequency = 50.0 + uniforms.precision_level * 10.0; // Higher frequency = more detail bands
        let amplitude = 0.05 + uniforms.precision_level * 0.04; // Higher amplitude = stronger contrast

        // More sophisticated detail enhancement with multiple harmonics for Level 1
        if uniforms.precision_level >= 1.0 && uniforms.precision_level < 2.0 {
            // Multi-frequency enhancement specifically for Level 1
            let detail_factor1 = sin(enhanced_t * frequency + uniforms.precision_level) * amplitude;
            let detail_factor2 = sin(enhanced_t * frequency * 1.5 + uniforms.precision_level * 2.0) * (amplitude * 0.7);
            let combined_factor = detail_factor1 + detail_factor2 + 1.0;

            // Apply additional contrast enhancement for better visibility
            return base_color * combined_factor + vec3<f32>(0.02, 0.02, 0.03) * sin(enhanced_t * 30.0);
        } else {
            // Standard enhancement for higher precision levels
            let detail_factor = sin(enhanced_t * frequency + uniforms.precision_level) * amplitude + 1.0;
            return base_color * detail_factor;
        }
    }

    return base_color;
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
    if dist_to_julia < indicator_size {
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
    if root_index >= 0 && root_index < 3 {
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

        // Distance-based brightness with improved brightness for consistency
        // Use similar brightness range as other fractals (0.6 to 1.0)
        let brightness_base = 0.6 + 0.4 * (1.0 - convergence_speed); // Match other fractals
        let brightness_variation = sin(iterations * 0.6 + distance_factor * 20.0) * 0.2 + 0.9; // Higher base, less variation
        let distance_brightness = smoothstep(0.0, 0.01, distance_factor) * 0.3 + 0.7; // Less dimming
        let detail_factor = fract(distance_factor * 50.0 + iterations * 0.1);
        let brightness = brightness_base * brightness_variation * distance_brightness * (0.9 + 0.1 * detail_factor); // Higher multipliers

        // Create metallic-like highlights based on convergence - enhanced brightness
        let highlight = pow(max(0.0, 1.0 - convergence_speed), 1.5) * 0.5; // Increased strength and adjusted power
        let highlight_strength = smoothstep(0.0, 0.002, distance_factor);
        let highlight_color = vec3<f32>(1.0, 1.0, 0.9); // Warm white highlight

        // Root boundary enhancement
        let boundary_effect = smoothstep(0.0, 0.005, distance_factor) * smoothstep(0.02, 0.01, distance_factor);
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

    // Enhanced background for non-converged points with better brightness
    let background_pattern = sin(length(z) * 12.0 + atan2(z.y, z.x) * 3.0) * 0.5 + 0.5;
    let background_color = vec3<f32>(0.1, 0.05, 0.2) * background_pattern * 0.8; // Brighter background
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
    if render_mode > 1.5 && render_mode < 2.5 {
        // Adjust aspect ratio for half-screen width
        let aspect_ratio = (uniforms.canvas_width * 0.5) / uniforms.canvas_height;

        if uv.x < 0.5 {
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
            // Use adaptive iterations for better precision
            let max_iter_mandelbrot = max(uniforms.mandelbrot_max_iterations, uniforms.adaptive_iterations);
            let iterations = complex_iteration(
                vec2<f32>(0.0, 0.0),  // z₀ = 0
                coord,                // c = coordinate in complex plane
                max_iter_mandelbrot
            );

            // Black for points in the set (reached max iterations)
            if iterations >= max_iter_mandelbrot {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + uniforms.mandelbrot_color_offset);
            var rgb = get_color_from_palette(t);

            // Apply brightness based on escape speed
            let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter_mandelbrot);
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
            // Use adaptive iterations for better precision
            let max_iter_julia = max(uniforms.julia_max_iterations, uniforms.adaptive_iterations);
            let iterations = complex_iteration(coord, c, max_iter_julia);

            // Black for points in the set
            if iterations >= max_iter_julia {
                return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }

            // Generate color for escaped points
            let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + uniforms.julia_color_offset);
            let rgb = get_color_from_palette(t);

            // Apply brightness based on escape speed
            let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter_julia);

            return vec4<f32>(rgb * brightness, 1.0);
        }
    }

    // ====================================================================
    // SINGLE VIEW MODE - Full screen Julia or Mandelbrot
    // ====================================================================

    // Full screen aspect ratio
    let aspect_ratio = uniforms.canvas_width / uniforms.canvas_height;

    // Calculate complex plane coordinates based on active mode
    // Enhanced coordinate calculation with precision preservation for infinite zoom
    let zoom_level = select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5);
    let offset_x = select(uniforms.julia_offset_x, uniforms.mandelbrot_offset_x, render_mode > 0.5);
    let offset_y = select(uniforms.julia_offset_y, uniforms.mandelbrot_offset_y, render_mode > 0.5);

    // Enhanced coordinate calculation that works for all precision levels
    let normalized_x = (uv.x - 0.5) * aspect_ratio;
    let normalized_y = (uv.y - 0.5);

    // Use different coordinate calculation strategies based on precision level
    var coord: vec2<f32>;

    if uniforms.precision_level >= 2.0 && uniforms.perturbation_scale > 0.0 {
        // Ultra-high precision mode: use perturbation theory with reference point
        let ref_real = uniforms.reference_real;
        let ref_imag = uniforms.reference_imag;
        let scale = uniforms.perturbation_scale;

        coord = vec2<f32>(
            ref_real + normalized_x * scale,
            ref_imag + normalized_y * scale
        );
    } else if uniforms.precision_level >= 1.0 {
        // Enhanced precision mode (Level 1): use optimized direct calculation
        // Scale constant makes a significant difference in avoiding precision issues
        let scale_factor = 3.2; // Smaller number = more detail preservation
        coord = vec2<f32>(
            normalized_x * scale_factor / zoom_level + offset_x,
            normalized_y * scale_factor / zoom_level + offset_y
        );
    } else {
        // Standard precision mode: use traditional calculation
        // This works well for zoom levels up to ~10^6
        coord = vec2<f32>(
            normalized_x * 4.0 / zoom_level + offset_x,
            normalized_y * 4.0 / zoom_level + offset_y
        );
    }

    // Select parameters based on render mode
    let julia_c = vec2<f32>(uniforms.julia_c_real, uniforms.julia_c_imag);
    let base_max_iter = select(uniforms.julia_max_iterations, uniforms.mandelbrot_max_iterations, render_mode > 0.5);
    // Use adaptive iterations for enhanced precision at deep zoom levels
    let max_iter = max(base_max_iter, uniforms.adaptive_iterations);
    let color_offset = select(uniforms.julia_color_offset, uniforms.mandelbrot_color_offset, render_mode > 0.5);
    let current_zoom = select(uniforms.julia_zoom, uniforms.mandelbrot_zoom, render_mode > 0.5);

    // Calculate iterations based on the fractal type
    var iterations: f32;

    if render_mode >= 3.0 {
        // For special fractal types (Burning Ship, Tricorn, Phoenix, Newton)
        if render_mode >= 3.0 && render_mode <= 6.0 {
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
    if render_mode == 6.0 {
        return newton_color(coord, julia_c, max_iter);
    }

    // Black for points in the set (non-escaping points)
    if iterations >= max_iter {
        return vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }

    // Generate color for escaped points
    let t = fract((iterations / SMOOTH_ITERATION_FACTOR) + color_offset);
    var rgb = get_color_from_palette(t);
    let brightness = 0.6 + 0.4 * (1.0 - iterations / max_iter);

    // Apply the brightness adjustment
    rgb = rgb * brightness;

    // Apply Julia parameter indicator in standard Mandelbrot mode
    if render_mode == 1.0 { // Standard Mandelbrot mode
        rgb = apply_julia_indicator(coord, rgb, current_zoom);
    }

    // Return final color with full opacity
    return vec4<f32>(rgb, 1.0);
}
