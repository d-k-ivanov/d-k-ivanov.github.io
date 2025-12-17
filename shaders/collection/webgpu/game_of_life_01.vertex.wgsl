struct ShaderUniforms
{
    iResolution : vec3f,
    _padding0 : f32,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    _padding1 : vec2f,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

const GRID_SIZE : u32 = 4u;
const GRID : vec2f = vec2f(f32(GRID_SIZE), f32(GRID_SIZE));

struct VSOut
{
    @builtin(position) Position : vec4f,
};

@vertex
fn vert(@builtin(vertex_index) idx : u32) -> VSOut
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
    var positions = array<vec2f, 6>(
        vec2f(-0.8, -0.8),
        vec2f( 0.8, -0.8),
        vec2f( 0.8,  0.8),

        vec2f(-0.8, -0.8),
        vec2f( 0.8,  0.8),
        vec2f(-0.8,  0.8)
    );
    var out : VSOut;

    // 4: Draw geometry
    // out.Position = vec4f(positions[idx], 0.0, 1.0);

    // 5: Draw grid
    // out.Position = vec4f(positions[idx] / GRID, 0.0, 1.0);

    // Add 1 to the position before dividing by the grid size.
    // let gridPos = (positions[idx] + 1.0) / GRID;

    // Subtract 1 after dividing by the grid size.
    // let gridPos = (positions[idx] + 1.0) / GRID - 1.0;

    // Offset each cell to its position in the grid
    let cell = vec2f(0.0, 0.0);
    let cellOffset = cell / GRID * 2;
    let gridPos = (positions[idx] + 1.0) / GRID - 1.0 + cellOffset;
    out.Position = vec4f(gridPos, 0.0, 1.0);

    return out;
}
