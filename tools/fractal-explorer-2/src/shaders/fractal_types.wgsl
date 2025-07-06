/**
 * Additional Fractal Types
 * Collection of various fractal iteration functions for exploration and education
 */

// Common mathematical constants
const NEWTON_EPSILON = 1e-6;
const NEWTON_MAX_ITER = 10;

/**
 * Burning Ship fractal iteration function
 * Similar to the Mandelbrot set but uses the absolute values of real and imaginary parts
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param max_iter - Maximum iterations
 * @returns Iteration count with smooth coloring
 */
fn burning_ship_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    for (var i = 0; i < max_i; i++) {
        // Check escape condition
        let z_magnitude_sq = dot(z_current, z_current);
        if (z_magnitude_sq > 4.0) {
            break;
        }

        // Take the absolute value of components before squaring - key burning ship feature
        let abs_z = vec2<f32>(abs(z_current.x), abs(z_current.y));

        // Complex square with absolute values
        z_current = vec2<f32>(
            abs_z.x * abs_z.x - abs_z.y * abs_z.y + c.x,
            2.0 * abs_z.x * abs_z.y + c.y
        );

        iterations += 1.0;
    }

    // Smooth coloring
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            return iterations + 1.0 - log2(log2(z_magnitude));
        }
    }

    return iterations;
}

/**
 * Tricorn (Mandelbar) fractal iteration function
 * Similar to Mandelbrot but uses the complex conjugate
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param max_iter - Maximum iterations
 * @returns Iteration count with smooth coloring
 */
fn tricorn_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    for (var i = 0; i < max_i; i++) {
        // Check escape condition
        let z_magnitude_sq = dot(z_current, z_current);
        if (z_magnitude_sq > 4.0) {
            break;
        }

        // Take complex conjugate (negate imaginary part)
        z_current = vec2<f32>(z_current.x, -z_current.y);

        // Complex square
        z_current = vec2<f32>(
            z_current.x * z_current.x - z_current.y * z_current.y + c.x,
            2.0 * z_current.x * z_current.y + c.y
        );

        iterations += 1.0;
    }

    // Smooth coloring
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            return iterations + 1.0 - log2(log2(z_magnitude));
        }
    }

    return iterations;
}

/**
 * Phoenix fractal iteration function
 * A more complex fractal with memory of previous iteration
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param max_iter - Maximum iterations
 * @returns Iteration count with smooth coloring
 */
fn phoenix_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> f32 {
    var z_current = z;
    var z_previous = vec2<f32>(0.0, 0.0);
    var temp: vec2<f32>;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    // Phoenix fractal parameters
    let p = vec2<f32>(0.56667, 0.0); // Additional parameter

    for (var i = 0; i < max_i; i++) {
        // Check escape condition
        if (dot(z_current, z_current) > 4.0) {
            break;
        }

        // Phoenix iteration: z_n+1 = z_n^2 + c + p*z_n-1
        temp = z_current;
        z_current = vec2<f32>(
            z_current.x * z_current.x - z_current.y * z_current.y + c.x + p.x * z_previous.x - p.y * z_previous.y,
            2.0 * z_current.x * z_current.y + c.y + p.x * z_previous.y + p.y * z_previous.x
        );
        z_previous = temp;

        iterations += 1.0;
    }

    // Smooth coloring
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            return iterations + 1.0 - log2(log2(z_magnitude));
        }
    }

    return iterations;
}

/**
 * Newton fractal iteration function
 * Based on Newton's method for finding roots of complex polynomials
 *
 * @param z - Initial complex value
 * @param c - Complex parameter (used for variations)
 * @param max_iter - Maximum iterations
 * @returns Iteration count and root information for coloring
 */
fn newton_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32) -> vec3<f32> {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);

    // Newton roots for z^3 - 1 = 0
    let root1 = vec2<f32>(1.0, 0.0);
    let root2 = vec2<f32>(-0.5, 0.866025); // -0.5 + 0.866i
    let root3 = vec2<f32>(-0.5, -0.866025); // -0.5 - 0.866i

    // Parameters for Newton's method
    let tolerance = NEWTON_EPSILON; // Convergence threshold
    var root_index = -1.0;

    // Main iteration loop with early escape
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

        // Calculate reciprocal of df_z
        let df_z_sq = df_z.x * df_z.x + df_z.y * df_z.y;
        let df_z_recip = vec2<f32>(df_z.x, -df_z.y) / df_z_sq;

        // z = z - f(z)/f'(z)
        let term = vec2<f32>(
            f_z.x * df_z_recip.x - f_z.y * df_z_recip.y,
            f_z.x * df_z_recip.y + f_z.y * df_z_recip.x
        );

        z_current = vec2<f32>(z_current.x - term.x, z_current.y - term.y);

        // Check convergence to any root
        let dist1 = length(z_current - root1);
        let dist2 = length(z_current - root2);
        let dist3 = length(z_current - root3);

        if (dist1 < tolerance) {
            root_index = 0.0;
            break;
        } else if (dist2 < tolerance) {
            root_index = 1.0;
            break;
        } else if (dist3 < tolerance) {
            root_index = 2.0;
            break;
        }

        iterations += 1.0;
    }

    // Return both iteration count and root information
    return vec3<f32>(iterations, root_index, 0.0);
}

/**
 * Multibrot set iteration function
 * Generalization of the Mandelbrot set using higher powers: z^power + c
 *
 * @param z - Initial complex value
 * @param c - Complex parameter
 * @param max_iter - Maximum iterations
 * @param power - Power to raise z to (default is 3 for cubic)
 * @returns Iteration count with smooth coloring
 */
fn multibrot_iteration(z: vec2<f32>, c: vec2<f32>, max_iter: f32, power: f32) -> f32 {
    var z_current = z;
    var iterations = 0.0;
    let max_i = i32(max_iter);
    let p = max(2.0, power); // Ensure minimum power of 2

    for (var i = 0; i < max_i; i++) {
        // Check escape condition
        let z_magnitude_sq = dot(z_current, z_current);
        if (z_magnitude_sq > 4.0) {
            break;
        }

        // Calculate z^p using polar form
        let r = sqrt(z_magnitude_sq);
        let theta = atan2(z_current.y, z_current.x);

        // r^p and p*theta
        let r_pow = pow(r, p);
        let new_theta = theta * p;

        // Convert back to Cartesian form and add c
        z_current = vec2<f32>(
            r_pow * cos(new_theta) + c.x,
            r_pow * sin(new_theta) + c.y
        );

        iterations += 1.0;
    }

    // Smooth coloring
    if (iterations < max_iter) {
        let z_magnitude = length(z_current);
        if (z_magnitude > 1.0) {
            // Adjust the smoothing for different powers
            return iterations + 1.0 - log2(log2(z_magnitude)) / log2(p);
        }
    }

    return iterations;
}
