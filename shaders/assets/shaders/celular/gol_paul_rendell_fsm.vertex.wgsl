// These variables also controls the number of instances drawn in the WebGPURenderer.
// Use data type notation to allow WebGPURenderer to extract it.
const VERTEX_COUNT : u32 = 6u;
const GRID_SIZE : vec3u = vec3u(1328u, 830u, 1u);

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(1) var<storage> cellState: array<u32>;

struct VertexInput
{
    @builtin(vertex_index) vertex_index : u32,
    @builtin(instance_index) instance_index: u32,
};

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) grid: vec2f,
    @location(1) cell: vec2f,
};

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    // Define two triangles forming a square
    var positions = array<vec2f, VERTEX_COUNT>(
        vec2f(-0.8, -0.8),
        vec2f( 0.8, -0.8),
        vec2f( 0.8,  0.8),

        vec2f(-0.8, -0.8),
        vec2f( 0.8,  0.8),
        vec2f(-0.8,  0.8)
    );
    var out : VertexOutput;

    // Grid
    let grid = vec2f(f32(shaderUniforms.iGridSize.x), f32(shaderUniforms.iGridSize.y));
    let index = f32(input.instance_index);
    var state = f32(cellState[input.instance_index]);
    let cell = vec2f(index % grid.x, floor(index / grid.x));
    let cellOffset = cell / grid * 2;
    let gridPos = (positions[input.vertex_index] * state + 1.0) / grid - 1.0 + cellOffset;

    // Outputs
    out.grid = grid;
    out.cell = cell;
    out.Position = vec4f(gridPos, 0.0, 1.0);
    return out;
}
