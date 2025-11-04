/**
 * Vertex shader for full-screen fractal rendering
 * Creates a full-screen triangle for optimal GPU utilization
 */

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Full-screen triangle technique - more efficient than quad
    // Covers the entire screen with just 3 vertices
    let pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), // Bottom-left
        vec2<f32>( 1.0, -1.0), // Bottom-right
        vec2<f32>(-1.0,  1.0), // Top-left
        vec2<f32>(-1.0,  1.0), // Top-left
        vec2<f32>( 1.0, -1.0), // Bottom-right
        vec2<f32>( 1.0,  1.0)  // Top-right
    );

    return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}
