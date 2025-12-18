struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

// This variables also controls the number of instances drawn in the WebGPURenderer.
// Use unsinged integer to allow WebGPURenderer to extract it.
const VERTEX_COUNT : u32 = 6u;
const GRID_SIZE : u32 = 32u;

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
    //   X,    Y,
    //-0.8, -0.8, // Triangle 1
    // 0.8, -0.8,
    // 0.8,  0.8,
    //
    //-0.8, -0.8, // Triangle 2
    // 0.8,  0.8,
    //-0.8,  0.8,
    var positions = array<vec2f, VERTEX_COUNT>(
        vec2f(-0.8, -0.8),
        vec2f( 0.8, -0.8),
        vec2f( 0.8,  0.8),

        vec2f(-0.8, -0.8),
        vec2f( 0.8,  0.8),
        vec2f(-0.8,  0.8)
    );
    var out : VertexOutput;

    // 4: Draw geometry
    // out.Position = vec4f(positions[input.vertex_index], 0.0, 1.0);

    // 5: Draw grid
    let grid = vec2f(f32(GRID_SIZE), f32(GRID_SIZE));
    // out.Position = vec4f(positions[input.vertex_index] / grid, 0.0, 1.0);

    // Add 1 to the position before dividing by the grid size.
    // let gridPos = (positions[input.vertex_index] + 1.0) / grid;

    // Subtract 1 after dividing by the grid size.
    // let gridPos = (positions[input.vertex_index] + 1.0) / grid - 1.0;

    // Offset each cell to its position in the grid
    // let cell = vec2f(0.0, 0.0);
    // let cellOffset = cell / grid * 2.0;
    // let gridPos = (positions[input.vertex_index] + 1.0)) / GRID - 1.0) + cellOffset;

    // Use instance_index to determine cell position
    let i = f32(input.instance_index); // Save the instance_index as a float

    // Compute the cell coordinate from the instance_index
    let cell = vec2f(i % grid.x, floor(i / grid.x));
    let cellOffset = cell / grid * 2;
    let gridPos = (positions[input.vertex_index] + 1.0) / grid - 1.0 + cellOffset;

    // Outputs
    out.grid = grid;
    out.cell = cell;
    out.Position = vec4f(gridPos, 0.0, 1.0);
    return out;
}
