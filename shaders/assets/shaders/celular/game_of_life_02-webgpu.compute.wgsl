const COMPUTE_FRAME_INTERVAL : u32 = 5u;

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
@group(0) @binding(1) var<storage, read_write> cellStateIn: array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

fn cellIndex(cell: vec2u) -> u32
{
    // Grid side sizes taken from iGridSize
    return cell.y * shaderUniforms.iGridSize.x + cell.x;
}

fn cellActive(x: u32, y: u32) -> u32
{
    return cellStateIn[cellIndex(vec2(x, y))];
}

fn getCellState(x: u32, y: u32) -> u32
{
    return cellStateIn[cellIndex(vec2(x, y))];
}

fn setCellState(x: u32, y: u32, state: u32)
{
    cellStateOut[cellIndex(vec2(x, y))] = state;
}

// Returns the random 0 or 1 value for the given cell index.
fn randomCellValue1(x: u32, y: u32) -> u32
{
    // fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
    let randomValue = fract(sin(dot(vec2f(f32(x), f32(y)), vec2f(12.9898,78.233))) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iGridSize, iTime, and iMouse.
fn randomCellValue2(x: u32, y: u32) -> u32
{
    let px = f32(x) / f32(shaderUniforms.iGridSize.x);
    let py = f32(y) / f32(shaderUniforms.iGridSize.y);
    let mouseInfluence = shaderUniforms.iMouse.x * px + shaderUniforms.iMouse.y * py;
    let timeInfluence = shaderUniforms.iTime * 0.1234;
    let seed = px * 12.9898 + py * 78.233 + mouseInfluence * 31.4159 + timeInfluence;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iGridSize
fn randomCellValue3(x: u32, y: u32) -> u32
{
    let px = f32(x) / f32(shaderUniforms.iGridSize.x);
    let py = f32(y) / f32(shaderUniforms.iGridSize.y);
    let seed = px * 12.9898 + py * 78.233 + 31.4159;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

// Returns the random 0 or 1 value for the given cell index, influenced by iMouse.
fn randomCellValue4(x: u32, y: u32) -> u32
{
    let px = f32(x) / f32(shaderUniforms.iGridSize.x);
    let py = f32(y) / f32(shaderUniforms.iGridSize.y);
    let mouseInfluence = shaderUniforms.iMouse.x * px + shaderUniforms.iMouse.y * py;
    let seed = mouseInfluence * 12.9898 + mouseInfluence * 78.233 + mouseInfluence * 31.4159;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 2.0));
}

fn randomCellValue5(x: u32, y: u32) -> u32
{
    const COMPILE_SEED: f32 = 3; // Change this value to get different patterns

    let px = f32(x);
    let py = f32(y);
    let seed = px * px / 99999 + py * py / 99999 + COMPILE_SEED;
    let randomValue = fract(sin(seed) * 43758.5453123);
    return u32(floor(randomValue * 1.2));
}


// Generate circle pattern
fn randomCellValue6(x: u32, y: u32) -> u32
{
    let centerX = shaderUniforms.iGridSize.x / 2u;
    let centerY = shaderUniforms.iGridSize.y / 2u;
    let distX = abs(i32(x) - i32(centerX));
    let distY = abs(i32(y) - i32(centerY));
    let radius = min(shaderUniforms.iGridSize.x, shaderUniforms.iGridSize.y) / 4u;

    if (distX * distX + distY * distY < i32(radius * radius))
    {
        return 1u; // Inside circle
    }
    else
    {
        return 0u; // Outside circle
    }
}

fn randomCellValue7(x: u32, y: u32) -> u32
{
    let patternSize = 8u;
    let cellX = x % patternSize;
    let cellY = y % patternSize;

    if ((cellX == 3u || cellX == 1u) && (cellY >= 2u && cellY <= 5u)) ||
       ((cellY == 3u || cellY == 1u) && (cellX >= 2u && cellX <= 5u))
    {
        return 1u; // Part of the pattern
    }
    else
    {
        return 0u; // Outside the pattern
    }
}

fn randomCellValue8(x: u32, y: u32) -> u32
{
    let patternSizeX = 16u;
    let patternSizeY = 16u;
    let cellX = x % patternSizeX;
    let cellY = y % patternSizeY;

    if ((cellX == 7u || cellX == 8u) && (cellY >= 4u && cellY <= 11u)) ||
       ((cellY == 7u || cellY == 8u) && (cellX >= 4u && cellX <= 11u))
    {
        return 1u; // Part of the Turing machine pattern
    }
    else
    {
        return 0u; // Outside the pattern
    }
}

// Initialize cellState with random values
fn initCellState1(x: u32, y: u32)
{
    let state = randomCellValue6(x, y);
    setCellState(x, y, state);
}

// Init every Z cell to 1, others to 0
fn initCellState2(x: u32, y: u32, z: u32)
{
    let i = cellIndex(vec2(x, y));
    let state = select(0u, 1u, i % z == 0u);
    setCellState(x, y, state);
}

fn applyMouseOverride(cell: vec2u) -> bool
{
    if (shaderUniforms.iMouse.z <= 0.0)
    {
        return false;
    }

    let grid = vec2f(f32(shaderUniforms.iGridSize.x), f32(shaderUniforms.iGridSize.y));
    let cellSize = shaderUniforms.iResolution.xy / grid;
    let mousePos = clamp(shaderUniforms.iMouse.xy, vec2f(0.0), shaderUniforms.iResolution.xy - vec2f(1.0));
    let mouseCell = vec2u(mousePos / cellSize);
    let dx = abs(i32(cell.x) - i32(mouseCell.x));
    let dy = abs(i32(cell.y) - i32(mouseCell.y));

    // if (max(dx, dy) <= 2)    // 5x5 brush
    if (dx == 0 && dy == 0)     // 1x1 brush
    {
        setCellState(cell.x, cell.y, 1u);
        return true;
    }

    return false;
}

fn countActiveNeighbors(cell: vec2u) -> u32
{
    return cellActive(cell.x + 1u, cell.y + 1u)
         + cellActive(cell.x + 1u, cell.y     )
         + cellActive(cell.x + 1u, cell.y - 1u)
         + cellActive(cell.x     , cell.y - 1u)
         + cellActive(cell.x - 1u, cell.y - 1u)
         + cellActive(cell.x - 1u, cell.y     )
         + cellActive(cell.x - 1u, cell.y + 1u)
         + cellActive(cell.x     , cell.y + 1u);
}

fn applyGameOfLifeRules(cell: vec2u, activeNeighbors: u32)
{
    let currentState = getCellState(cell.x, cell.y);
    var nextState: u32;

    if (activeNeighbors == 3u)
    {
        // Rule 1: Survivals. Every counter with two or three neighboring counters survives for the next generation.
        // Rule 3: Births. Each empty cell adjacent to exactly three live neighbors becomes a live cell.
        // Cells with 3 neighbors become or stay active.
        nextState = 1u;
    }
    else if (activeNeighbors == 2u)
    {
        // Rule 1: Survivals. Every counter with two or three neighboring counters survives for the next generation.
        // Cells with 2 neighbors preserve their state.
        nextState = currentState;
    }
    else
    {
        // Rule 2: Deaths. Any live cell with fewer than two live neighbors dies, as if caused by under-population.
        // Cells with less than 2 or more then 3 neighbors become inactive.
        nextState = 0u;
    }

    setCellState(cell.x, cell.y, nextState);
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) cell : vec3u)
{
    if (applyMouseOverride(cell.xy))
    {
        return;
    }

    // Initialize cell state on the first frame with delay:
    // if (shaderUniforms.iFrame == 0u)
    if (shaderUniforms.iFrame < 200u)
    {
        initCellState1(cell.x, cell.y);
        // initCellState2(cell.x, cell.y, 2u);
        // initCellState2(cell.x, cell.y, 3u);
        // initCellState2(cell.x, cell.y, 5u);  // cool square (256x256)
        // initCellState2(cell.x, cell.y, 15u); // cool square (256x256)
        return;
    }

    // Computation speed control: update every Nth frame
    if (shaderUniforms.iFrame % COMPUTE_FRAME_INTERVAL != 0u)
    {
        return;
    }

    let activeNeighbors = countActiveNeighbors(cell.xy);
    applyGameOfLifeRules(cell.xy, activeNeighbors);
}
