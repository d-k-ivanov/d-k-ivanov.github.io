// Constants
const PI : f32 = 3.14159265358979323846264338327;
// Large number of vertices to allow many circles to accumulate over time
const VERTEX_COUNT : u32 = 1000000u;

const NUM_SEGMENTS : u32 = 32u;
const VERTS_PER_CIRCLE : u32 = 96u; // NUM_SEGMENTS * 3

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouseL : vec4f,
    iMouseR : vec4f,
    iMouseW : vec4f,
    iMouseZoom : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
};

fn circle(idx : u32, radius : f32, cx : f32, cy : f32) -> vec2f
{
    let verts_per_triangle = 3u;
    let triangle_idx = idx / verts_per_triangle;
    let corner = idx % verts_per_triangle;

    let angle0 = (f32(triangle_idx) / f32(NUM_SEGMENTS)) * 2.0 * PI;
    let angle1 = (f32(triangle_idx + 1u) / f32(NUM_SEGMENTS)) * 2.0 * PI;

    switch corner {
        case 0u: {
            return vec2f(cx, cy);
        }
        case 1u: {
            return vec2f(cx + radius * cos(angle0), cy + radius * sin(angle0));
        }
        default: {
            return vec2f(cx + radius * cos(angle1), cy + radius * sin(angle1));
        }
    }
}

// https://www.cl.cam.ac.uk/~am21/hakmemc.html#item153
//
// Marvin Minsky, 1972
// ITEM 149 (Minsky): CIRCLE ALGORITHM
//   Here is an elegant way to draw almost circles on a point-plotting display:
//   NEW X = OLD X - epsilon * OLD Y
//   NEW Y = OLD Y + epsilon * NEW(!) X
//
//   This makes a very round ellipse centered at the origin with its size determined by the initial point.
//   epsilon determines the angular velocity of the circulating point, and slightly affects the eccentricity.
//   If epsilon is a power of 2, then we don't even need multiplication, let alone square roots, sines, and cosines!
//   The "circle" will be perfectly stable because the points soon become periodic.
//
//   The circle algorithm was invented by mistake when I tried to save one register in a display hack!
//   Ben Gurley had an amazing display hack using only about six or seven instructions, and it was a great wonder.
//   But it was basically line-oriented. It occurred to me that it would be exciting to have curves,
//   and I was trying to get a curve display hack with minimal instructions.

// Negative powers of 2:
// Selecting epsilon to control speed of rotation.
// 2^-1 = 0.5 (1/2)
// 2^-2 = 0.25 (1/4)
// 2^-3 = 0.125 (1/8)
// 2^-4 = 0.0625 (1/16)
// 2^-5 = 0.03125 (1/32)
// 2^-6 = 0.015625 (1/64)
// 2^-7 = 0.0078125 (1/128)
// 2^-8 = 0.00390625 (1/256)
// 2^-9 = 0.001953125 (1/512)
// 2^-10 = 0.0009765625 (1/1024)

@vertex
fn vert(@builtin(vertex_index) idx : u32) -> VertexOutput
{
    let aspect = shaderUniforms.iResolution.x / shaderUniforms.iResolution.y;

    let epsilon = 0.0078125;
    // Approximate orbit length. It doesn't close perfectly.
    // Around 1256 points with epsilon 0.0050000 to form a full orbit.
    // Around  804 points with epsilon 0.0078125 to form a full orbit.
    // Around  100 points with epsilon 0.0625000 to form a full orbit.
    // Around  125 points with epsilon 0.0500000 to form a full orbit.
    // Around   60 points with epsilon 0.1000000 to form a full orbit.
    let num_of_cirlces_to_form_orbit = u32(2.0 * PI / epsilon);

    // Each circle uses VERTS_PER_CIRCLE vertices.
    // Determine which circle this vertex belongs to and the local vertex index.
    let circle_idx = idx / VERTS_PER_CIRCLE;
    let local_idx = idx % VERTS_PER_CIRCLE;

    // Accumulate circles over time: one new circle per frame, reset after full orbit
    // Number of circles to keep on screen at once
    // let overlap = 0.25; // 25% overlap arc
    let overlap = 1.1; // Number of circles to keep on screen at once
    let num_circles = overlap * f32((shaderUniforms.iFrame / 1u) % num_of_cirlces_to_form_orbit + 2u);

    // Push vertices that exceed the current number of circles off-screen
    if (circle_idx >= u32(num_circles)) {
        var out : VertexOutput;
        out.Position = vec4f(0.0, 0.0, 2.0, 1.0);
        return out;
    }

    // Run Minsky circle algorithm for circle_idx steps
    var cx = 0.0;
    var cy = 0.8;
    // for (var i = 0u; i < u32(num_circles); i++) {
    for (var i = 0u; i < circle_idx; i++) {
        // Change sign of epsilon to change direction of rotation
        let new_x = cx + epsilon * cy;
        let new_y = cy - epsilon * new_x;
        cx = new_x;
        cy = new_y;
    }

    var pos : vec2f;
    pos = circle(local_idx, 0.01, cx, cy);

    var out : VertexOutput;
    out.Position = vec4f(pos.x / aspect, pos.y, 0.0, 1.0);
    return out;
}
