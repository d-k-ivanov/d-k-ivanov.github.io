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

@group(0) @binding(1) var<storage, read_write> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

const GRID_SIZE : u32 = 256u;

// fn cellIndex(cell: vec2u) -> u32
// {
//     return cell.y * GRID_SIZE + cell.x;
// }

fn cellIndex(cell: vec2u) -> u32
{
    return (cell.y % GRID_SIZE) * GRID_SIZE + (cell.x % GRID_SIZE);
}

fn cellActive(x: u32, y: u32) -> u32
{
    return cellStateIn[cellIndex(vec2(x, y))];
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) cell : vec3u)
{
    // Empty compute shader that does nothing but can access frame count
    let frame = shaderUniforms.iFrame;

    // if (cellStateIn[cellIndex(cell.xy)] == 1)
    // {
    //     cellStateOut[cellIndex(cell.xy)] = 0;
    // }
    // else
    // {
    //     cellStateOut[cellIndex(cell.xy)] = 1;
    // }
    // Determine how many active neighbors this cell has.
    let activeNeighbors = cellActive(cell.x+1, cell.y+1)
                        + cellActive(cell.x+1, cell.y  )
                        + cellActive(cell.x+1, cell.y-1)
                        + cellActive(cell.x  , cell.y-1)
                        + cellActive(cell.x-1, cell.y-1)
                        + cellActive(cell.x-1, cell.y  )
                        + cellActive(cell.x-1, cell.y+1)
                        + cellActive(cell.x  , cell.y+1);

    let i = cellIndex(cell.xy);

    // Conway's game of life rules:
    switch activeNeighbors {
      case 2: { // Active cells with 2 neighbors stay active.
        cellStateOut[i] = cellStateIn[i];
      }
      case 3: { // Cells with 3 neighbors become or stay active.
        cellStateIn[i] = 1;
      }
      default: { // Cells with < 2 or > 3 neighbors become inactive.
        cellStateIn[i] = 0;
      }
    }
}
