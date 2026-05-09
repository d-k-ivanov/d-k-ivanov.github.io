// ============================================================================
// The Minskytron - Compute Shader
//
// Runs the Minskytron algorithm (3 interconnected oscillators) sequentially
// in a single thread and writes all dot positions to a storage buffer.
// The vertex shader reads from this buffer — no per-vertex recomputation.
//
// Algorithm (per iteration):
//   ya += (xa + xb) >> sh0;  xa -= (ya - yb) >> sh1;  store(xa, ya)
//   yb += (xb - xc) >> sh2;  xb -= (yb - yc) >> sh3;  store(xb, yb)
//   yc += (xc - xa) >> sh4;  xc -= (yc - ya) >> sh5;  store(xc, yc)
//
// Buffer layout (u32, binding 1):
//   [0]          = total dot count (visible_steps * 3)
//   [1 + i*3+0] = packed f16x2 position of oscillator A at step i
//   [1 + i*3+1] = packed f16x2 position of oscillator B at step i
//   [1 + i*3+2] = packed f16x2 position of oscillator C at step i
// ============================================================================

const GRID_SIZE : vec3u = vec3u(102400u, 1u, 1u);
const MAX_STEPS : u32 = 30000u;
const STEPS_PER_FRAME : u32 = 10u;

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
@group(0) @binding(1) var<storage, read_write> packedXY : array<u32>;

// Simulate PDP-1 18-bit signed integer arithmetic.
fn wrap18(v : i32) -> i32
{
    return (v << 14) >> 14;
}

@compute @workgroup_size(64)
fn comp(@builtin(global_invocation_id) gid : vec3u)
{
    // Only thread 0 runs the sequential algorithm
    if (gid.x != 0u) { return; }

    // Classic Minskytron: TW 6,7,7,7,2,1 → shifts 7,8,8,8,3,2
    let sh0 = 7u;
    let sh1 = 8u;
    let sh2 = 8u;
    let sh3 = 8u;
    let sh4 = 3u;
    let sh5 = 2u;

    // Accumulate dots over time, looping after full cycle
    let frames_per_cycle = MAX_STEPS / STEPS_PER_FRAME;
    let local_frame = shaderUniforms.iFrame % frames_per_cycle;
    let visible_steps = min(local_frame * STEPS_PER_FRAME, MAX_STEPS);

    // Initial oscillator coordinates (upright triangle)
    var xa : i32 = -8192;   // octal -020000
    var ya : i32 = 0;
    var xb : i32 = 0;
    var yb : i32 = 16384;   // octal  040000
    var xc : i32 = 8192;    // octal  020000
    var yc : i32 = 0;

    for (var i = 0u; i < visible_steps; i++)
    {
        // Store current positions before update
        let base = 1u + i * 3u;
        packedXY[base + 0u] = pack2x16float(vec2f(f32(xa) / 131072.0, f32(-ya) / 131072.0));
        packedXY[base + 1u] = pack2x16float(vec2f(f32(xb) / 131072.0, f32(-yb) / 131072.0));
        packedXY[base + 2u] = pack2x16float(vec2f(f32(xc) / 131072.0, f32(-yc) / 131072.0));

        // Oscillator A: ya += (xa + xb) >> sh0;  xa -= (ya - yb) >> sh1
        ya = wrap18(ya + (wrap18(xa + xb) >> sh0));
        xa = wrap18(xa - (wrap18(ya - yb) >> sh1));

        // Oscillator B: yb += (xb - xc) >> sh2;  xb -= (yb - yc) >> sh3
        yb = wrap18(yb + (wrap18(xb - xc) >> sh2));
        xb = wrap18(xb - (wrap18(yb - yc) >> sh3));

        // Oscillator C: yc += (xc - xa) >> sh4;  xc -= (yc - ya) >> sh5
        yc = wrap18(yc + (wrap18(xc - xa) >> sh4));
        xc = wrap18(xc - (wrap18(yc - ya) >> sh5));
    }

    // Store total dot count in header
    packedXY[0u] = visible_steps * 3u;
}
