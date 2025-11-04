/**
 * Additional Fractal Types
 * Collection of various fractal iteration functions for exploration and education
 */

// Common mathematical constants
const NEWTON_EPSILON = 1e-8;
const NEWTON_MAX_ITER = 20;

/**
 * Burning Ship fractal iteration function
 * Similar to the Mandelbrot set but uses the absolute values of real and imaginary parts
 * Enhanced with adaptive iterations and precision awareness
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param base_max_iter - Base maximum iterations (enhanced based on precision)
 * @returns Iteration count with smooth coloring
 */
fn burning_ship_iteration(z: vec2<f32>, c: vec2<f32>, base_max_iter: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;

    // Use adaptive iterations from uniforms
    let max_iter = max(base_max_iter, uniforms.adaptive_iterations);
    let max_i = i32(max_iter);

    // Enhanced escape radius for higher precision
    let escape_radius_sq = 4.0 * (1.0 + uniforms.precision_level * 0.5);

    for (var i = 0; i < max_i; i++) {
        // Check escape condition with enhanced radius
        let z_magnitude_sq = dot(z_current, z_current);
        if z_magnitude_sq > escape_radius_sq {
            break;
        }

        // Take the absolute value of components before squaring - key burning ship feature
        let abs_z = vec2<f32>(abs(z_current.x), abs(z_current.y));

        // Enhanced complex square with precision consideration
        if uniforms.precision_level >= 2.0 {
            let real_part = abs_z.x * abs_z.x - abs_z.y * abs_z.y + c.x;
            let imag_part = 2.0 * abs_z.x * abs_z.y + c.y;
            z_current = vec2<f32>(real_part, imag_part);
        } else {
            z_current = vec2<f32>(
                abs_z.x * abs_z.x - abs_z.y * abs_z.y + c.x,
                2.0 * abs_z.x * abs_z.y + c.y
            );
        }

        iterations += 1.0;
    }

    // Enhanced smooth coloring with precision awareness
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
 * Tricorn (Mandelbar) fractal iteration function
 * Similar to Mandelbrot but uses the complex conjugate
 * Enhanced with adaptive iterations and precision awareness
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param base_max_iter - Base maximum iterations (enhanced based on precision)
 * @returns Iteration count with smooth coloring
 */
fn tricorn_iteration(z: vec2<f32>, c: vec2<f32>, base_max_iter: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;

    // Use adaptive iterations from uniforms
    let max_iter = max(base_max_iter, uniforms.adaptive_iterations);
    let max_i = i32(max_iter);

    // Enhanced escape radius for higher precision
    let escape_radius_sq = 4.0 * (1.0 + uniforms.precision_level * 0.5);

    for (var i = 0; i < max_i; i++) {
        // Check escape condition with enhanced radius
        let z_magnitude_sq = dot(z_current, z_current);
        if z_magnitude_sq > escape_radius_sq {
            break;
        }

        // Take complex conjugate (negate imaginary part)
        z_current = vec2<f32>(z_current.x, -z_current.y);

        // Enhanced complex square with precision consideration
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

    // Enhanced smooth coloring with precision awareness
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
 * Phoenix fractal iteration function
 * A more complex fractal with memory of previous iteration
 * Enhanced with adaptive iterations and precision awareness
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param base_max_iter - Base maximum iterations (enhanced based on precision)
 * @returns Iteration count with smooth coloring
 */
fn phoenix_iteration(z: vec2<f32>, c: vec2<f32>, base_max_iter: f32) -> f32 {
    var z_current = z;
    var z_previous = vec2<f32>(0.0, 0.0);
    var temp: vec2<f32>;
    var iterations = 0.0;

    // Use adaptive iterations from uniforms
    let max_iter = max(base_max_iter, uniforms.adaptive_iterations);
    let max_i = i32(max_iter);

    // Enhanced escape radius for higher precision
    let escape_radius_sq = 4.0 * (1.0 + uniforms.precision_level * 0.5);

    // Phoenix fractal parameters
    let p = vec2<f32>(0.56667, 0.0); // Additional parameter

    for (var i = 0; i < max_i; i++) {
        // Check escape condition with enhanced radius
        if dot(z_current, z_current) > escape_radius_sq {
            break;
        }

        // Phoenix iteration: z_n+1 = z_n^2 + c + p*z_n-1
        temp = z_current;

        // Enhanced computation with precision consideration
        if uniforms.precision_level >= 2.0 {
            let real_part = z_current.x * z_current.x - z_current.y * z_current.y + c.x + p.x * z_previous.x - p.y * z_previous.y;
            let imag_part = 2.0 * z_current.x * z_current.y + c.y + p.x * z_previous.y + p.y * z_previous.x;
            z_current = vec2<f32>(real_part, imag_part);
        } else {
            z_current = vec2<f32>(
                z_current.x * z_current.x - z_current.y * z_current.y + c.x + p.x * z_previous.x - p.y * z_previous.y,
                2.0 * z_current.x * z_current.y + c.y + p.x * z_previous.y + p.y * z_previous.x
            );
        }
        z_previous = temp;

        iterations += 1.0;
    }

    // Enhanced smooth coloring with precision awareness
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
 * Enhanced Newton fractal iteration function
 * Based on Newton's method for finding roots of complex polynomials
 * Returns detailed information for advanced coloring
 *
 * @param z - Initial complex value
 * @param c - Complex parameter (used for variations)
 * @param max_iter - Maximum iterations
 * @returns vec3(iteration_count, root_index, final_distance)
 */
fn newton_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> vec3<f32> {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    // Newton roots for z^3 - 1 = 0
    let root1 = vec2<f32>(1.0, 0.0);
    let root2 = vec2<f32>(-0.5, 0.866025); // -0.5 + 0.866i
    let root3 = vec2<f32>(-0.5, -0.866025); // -0.5 - 0.866i

    // Enhanced parameters for Newton's method with variation support
    let tolerance = NEWTON_EPSILON * 0.1; // Tighter tolerance for better precision
    var root_index = -1.0;
    var final_distance = 1.0;
    var previous_distance = 10.0;

    // Add slight variation using the c parameter for interesting effects
    let variation_factor = length(c) * 0.1;
    let modified_tolerance = tolerance * (1.0 + variation_factor);

    // Main iteration loop with enhanced convergence detection
    for (var i = 0; i < NEWTON_MAX_ITER && i < max_i; i++) {
        // f(z) = z^3 - 1
        let z_squared = vec2<f32>(
            z_current.x * z_current.x - z_current.y * z_current.y,
            2.0 * z_current.x * z_current.y
        );

        let z_cubed = vec2<f32>(
            z_squared.x * z_current.x - z_squared.y * z_current.y,
            z_squared.x * z_current.y + z_squared.y * z_current.x
        );

        let f_z = vec2<f32>(z_cubed.x - 1.0, z_cubed.y);

        // f'(z) = 3z^2
        let df_z = vec2<f32>(3.0 * z_squared.x, 3.0 * z_squared.y);

        // Calculate reciprocal of df_z with better numerical stability
        let df_z_sq = df_z.x * df_z.x + df_z.y * df_z.y;
        if df_z_sq < 1e-10 {
            break; // Avoid division by very small numbers
        }

        let df_z_recip = vec2<f32>(df_z.x, -df_z.y) / df_z_sq;

        // z = z - f(z)/f'(z)
        let term = vec2<f32>(
            f_z.x * df_z_recip.x - f_z.y * df_z_recip.y,
            f_z.x * df_z_recip.y + f_z.y * df_z_recip.x
        );

        z_current = vec2<f32>(z_current.x - term.x, z_current.y - term.y);

        // Check convergence to any root with distance tracking
        let dist1 = length(z_current - root1);
        let dist2 = length(z_current - root2);
        let dist3 = length(z_current - root3);

        let min_distance = min(min(dist1, dist2), dist3);
        final_distance = min_distance;

        // Enhanced convergence detection with variation
        if dist1 < modified_tolerance {
            root_index = 0.0;
            final_distance = dist1;
            break;
        } else if dist2 < modified_tolerance {
            root_index = 1.0;
            final_distance = dist2;
            break;
        } else if dist3 < modified_tolerance {
            root_index = 2.0;
            final_distance = dist3;
            break;
        }

        // Check for convergence stalling
        if abs(min_distance - previous_distance) < modified_tolerance * 0.01 {
            // Assign to closest root even if not fully converged
            if dist1 <= dist2 && dist1 <= dist3 {
                root_index = 0.0;
            } else if dist2 <= dist3 {
                root_index = 1.0;
            } else {
                root_index = 2.0;
            }
            break;
        }

        previous_distance = min_distance;
        iterations += 1.0;
    }

    // If no convergence, assign to nearest root
    if root_index < 0.0 {
        let dist1 = length(z_current - root1);
        let dist2 = length(z_current - root2);
        let dist3 = length(z_current - root3);

        if dist1 <= dist2 && dist1 <= dist3 {
            root_index = 0.0;
            final_distance = dist1;
        } else if dist2 <= dist3 {
            root_index = 1.0;
            final_distance = dist2;
        } else {
            root_index = 2.0;
            final_distance = dist3;
        }
    }

    // Return iteration count, root index, and final distance for advanced coloring
    return vec3<f32>(iterations, root_index, final_distance);
}
