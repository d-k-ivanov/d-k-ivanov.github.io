const GRID_SIZE : u32 = 256u;
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
@group(0) @binding(1) var<storage, read_write> cellState: array<u32>;

fn cellIndex(cell: vec2u) -> u32
{
    return (cell.y % GRID_SIZE) * GRID_SIZE + (cell.x % GRID_SIZE);
}

fn cellActive(x: u32, y: u32) -> u32
{
    return cellState[cellIndex(vec2(x, y))];
}

// Returns the random 0 or 1 value for the given cell index.
fn randomCellValue1(x: u32, y: u32) -> u32
{
    // fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
    let randomValue = fract(sin(dot(vec2f(f32(x), f32(y)), vec2f(12.9898,78.233))) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iResolution, iTime, and iMouse.
fn randomCellValue2(x: u32, y: u32) -> u32
{
    let px = f32(x) / shaderUniforms.iResolution.x;
    let py = f32(y) / shaderUniforms.iResolution.y;
    let mouseInfluence = shaderUniforms.iMouse.x * px + shaderUniforms.iMouse.y * py;
    let timeInfluence = shaderUniforms.iTime * 0.1234;
    let seed = px * 12.9898 + py * 78.233 + mouseInfluence * 31.4159 + timeInfluence;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iResolution
fn randomCellValue3(x: u32, y: u32) -> u32
{
    let px = f32(x) / shaderUniforms.iResolution.x;
    let py = f32(y) / shaderUniforms.iResolution.y;
    let seed = px * 12.9898 + py * 78.233 + 31.4159;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iMouse.
fn randomCellValue4(x: u32, y: u32) -> u32
{
    let px = f32(x) / shaderUniforms.iResolution.x;
    let py = f32(y) / shaderUniforms.iResolution.y;
    let mouseInfluence = shaderUniforms.iMouse.x * px + shaderUniforms.iMouse.y * py;
    let seed = mouseInfluence * 12.9898 + mouseInfluence * 78.233 + mouseInfluence * 31.4159;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}


// Initialize cellState with random values
fn initCellState1(x: u32, y: u32)
{
    let i = cellIndex(vec2(x, y));
    cellState[i] = randomCellValue1(x, y);
}

// Initi every Z cell to 1, others to 0
fn initCellState2(x: u32, y: u32, z: u32)
{
    let i = cellIndex(vec2(x, y));
    if (i % z == 0u)
    {
        cellState[i] = 1u;
    }
    else
    {
        cellState[i] = 0u;
    }
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) cell : vec3u)
{
    // if (shaderUniforms.iFrame == 0u)
    if (shaderUniforms.iFrame < 512u) // Delay animation start with the first 512 frames
    {
        // initCellState1(cell.x, cell.y);
        // initCellState2(cell.x, cell.y, 2u);
        // initCellState2(cell.x, cell.y, 3u);
        // initCellState2(cell.x, cell.y, 5u); // cool square (256x256)
        initCellState2(cell.x, cell.y, 15u); // cool square (256x256)
        // initCellState2(cell.x, cell.y, 8u); // cool face (128x128)
        // initCellState2(cell.x, cell.y, 16u); // cool face (128x128)
        return;
    }

    // Determine how many active neighbors this cell has.
    let activeNeighbors = cellActive(cell.x + 1u, cell.y + 1u)
                        + cellActive(cell.x + 1u, cell.y     )
                        + cellActive(cell.x + 1u, cell.y - 1u)
                        + cellActive(cell.x     , cell.y - 1u)
                        + cellActive(cell.x - 1u, cell.y - 1u)
                        + cellActive(cell.x - 1u, cell.y     )
                        + cellActive(cell.x - 1u, cell.y + 1u)
                        + cellActive(cell.x     , cell.y + 1u);

    let i = cellIndex(cell.xy);

    // Delay computation:
    if (shaderUniforms.iFrame % 5u != 0u)
    {
        return;
    }

    // Conway's game of life rules:
    switch activeNeighbors
    {
        // Cells with 2 neighbors preserve their state.
        case 2:
        {
            cellState[i] = cellState[i];
            break;
        }

        // Cells with 3 neighbors become or stay active.
        case 3:
        {
            cellState[i] = 1;
            break;
        }

        // Cells with less than 2 or more then 3 neighbors become inactive.
        default:
        {
            cellState[i] = 0;
            break;
        }
    }
}
