// ============================================================================
// The Minskytron - Vertex Shader
//
// Reads precomputed dot positions from the storage buffer (written by compute
// shader). Uses instancing: each instance draws one dot as a small billboard
// triangle. The fragment shader renders the dot shape.
//
// Buffer layout (u32, binding 1):
//   [0]          = total dot count
//   [1..count]   = packed f16x2 positions
//
// Instance 0 is skipped (header). Instances 1..count map to dots.
// Oscillator index = (instance - 1) % 3  →  A=0, B=1, C=2
// Step index       = (instance - 1) / 3
// ============================================================================

const VERTEX_COUNT : u32 = 3u;
const GRID_SIZE : vec3u = vec3u(24576u, 1u, 1u);

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
@group(0) @binding(1) var<storage, read> packedXY : array<u32>;

struct VertexInput
{
    @builtin(vertex_index) vertex_index : u32,
    @builtin(instance_index) instance_index : u32,
};

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) local : vec2f,
    @location(1) color : vec3f,
};

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    var positions = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f(3.0, -1.0),
        vec2f(-1.0, 3.0)
    );

    var out : VertexOutput;
    let tri = positions[input.vertex_index];

    // Read dot count from buffer header
    let count = packedXY[0u];

    // Instance 0 = header slot, skip it. Also skip beyond count.
    if (input.instance_index == 0u || input.instance_index > count)
    {
        out.Position = vec4f(2.0, 2.0, 0.0, 1.0);
        out.local = vec2f(0.0);
        out.color = vec3f(0.0);
        return out;
    }

    // Unpack position
    let packed = packedXY[input.instance_index];
    let pos = unpack2x16float(packed);

    // Derive oscillator and step indices
    let dot_idx = input.instance_index - 1u;
    let osc_idx = dot_idx % 3u;
    let step_idx = dot_idx / 3u;
    let total_steps = count / 3u;

    // Size and aspect ratio for rendering dots
    let dotSize = 4.0 / shaderUniforms.iResolution.y;
    let aspect = shaderUniforms.iResolution.x / shaderUniforms.iResolution.y;

    // Position triangle in clip space
    let center = vec2f(pos.x / aspect, pos.y);
    let offset = vec2f(tri.x * dotSize / aspect, tri.y * dotSize);
    out.Position = vec4f(center + offset, 0.0, 1.0);
    out.local = tri;

    // Per-oscillator color
    var col : vec3f;
    switch osc_idx {
        case 0u: { col = vec3f(1.0, 0.0, 0.0); }  // A: red
        case 1u: { col = vec3f(0.0, 0.0, 1.0); }  // B: blue
        default: { col = vec3f(0.0, 1.0, 0.0); }  // C: green
    }

    // Phosphor persistence: newer dots brighter
    let age = f32(step_idx) / f32(max(total_steps, 1u));
    col *= 0.3 + 0.7 * age;

    out.color = col;
    return out;
}
