// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 61u;
const PATTERN_HEIGHT : u32 = 62u;
const PATTERN_RUN_COUNT : u32 = 144u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from tackout.lif (y, x, len).
const PATTERN_RUNS : array<Run, 144> = array<Run, 144>(
    Run(0u, 3u, 2u),
    Run(0u, 24u, 2u),
    Run(1u, 4u, 1u),
    Run(1u, 24u, 1u),
    Run(2u, 4u, 1u),
    Run(2u, 6u, 1u),
    Run(2u, 11u, 1u),
    Run(2u, 22u, 1u),
    Run(2u, 24u, 1u),
    Run(3u, 5u, 2u),
    Run(3u, 10u, 1u),
    Run(3u, 12u, 1u),
    Run(3u, 22u, 2u),
    Run(4u, 8u, 2u),
    Run(4u, 13u, 1u),
    Run(5u, 8u, 2u),
    Run(5u, 13u, 1u),
    Run(6u, 8u, 2u),
    Run(6u, 13u, 1u),
    Run(7u, 10u, 1u),
    Run(7u, 12u, 1u),
    Run(8u, 11u, 1u),
    Run(15u, 11u, 1u),
    Run(16u, 11u, 1u),
    Run(16u, 13u, 1u),
    Run(17u, 0u, 1u),
    Run(17u, 11u, 2u),
    Run(18u, 0u, 3u),
    Run(19u, 3u, 1u),
    Run(19u, 20u, 3u),
    Run(20u, 2u, 2u),
    Run(20u, 20u, 1u),
    Run(20u, 22u, 1u),
    Run(21u, 20u, 3u),
    Run(21u, 28u, 3u),
    Run(22u, 20u, 3u),
    Run(22u, 28u, 3u),
    Run(23u, 20u, 3u),
    Run(23u, 29u, 1u),
    Run(24u, 20u, 3u),
    Run(24u, 29u, 1u),
    Run(24u, 56u, 2u),
    Run(25u, 5u, 1u),
    Run(25u, 20u, 1u),
    Run(25u, 22u, 1u),
    Run(25u, 29u, 1u),
    Run(25u, 56u, 2u),
    Run(26u, 4u, 3u),
    Run(26u, 20u, 3u),
    Run(26u, 28u, 1u),
    Run(26u, 30u, 1u),
    Run(27u, 4u, 3u),
    Run(29u, 2u, 2u),
    Run(29u, 7u, 2u),
    Run(29u, 28u, 1u),
    Run(29u, 30u, 1u),
    Run(29u, 58u, 2u),
    Run(30u, 2u, 2u),
    Run(30u, 7u, 2u),
    Run(30u, 29u, 1u),
    Run(31u, 29u, 1u),
    Run(32u, 29u, 1u),
    Run(33u, 28u, 3u),
    Run(34u, 28u, 3u),
    Run(34u, 54u, 2u),
    Run(34u, 59u, 2u),
    Run(35u, 55u, 5u),
    Run(36u, 2u, 2u),
    Run(36u, 55u, 2u),
    Run(36u, 58u, 2u),
    Run(37u, 3u, 1u),
    Run(37u, 35u, 1u),
    Run(37u, 37u, 1u),
    Run(37u, 40u, 1u),
    Run(37u, 42u, 1u),
    Run(37u, 55u, 2u),
    Run(37u, 58u, 2u),
    Run(38u, 0u, 3u),
    Run(38u, 31u, 2u),
    Run(38u, 34u, 1u),
    Run(38u, 37u, 1u),
    Run(38u, 40u, 1u),
    Run(38u, 43u, 1u),
    Run(38u, 45u, 2u),
    Run(38u, 56u, 3u),
    Run(39u, 0u, 1u),
    Run(39u, 35u, 1u),
    Run(39u, 37u, 1u),
    Run(39u, 40u, 1u),
    Run(39u, 42u, 1u),
    Run(43u, 54u, 3u),
    Run(44u, 44u, 2u),
    Run(44u, 54u, 3u),
    Run(45u, 43u, 1u),
    Run(45u, 45u, 1u),
    Run(45u, 53u, 1u),
    Run(45u, 57u, 1u),
    Run(46u, 45u, 1u),
    Run(46u, 52u, 1u),
    Run(46u, 58u, 1u),
    Run(47u, 53u, 1u),
    Run(47u, 57u, 1u),
    Run(48u, 54u, 3u),
    Run(52u, 25u, 2u),
    Run(52u, 36u, 3u),
    Run(53u, 25u, 1u),
    Run(53u, 28u, 1u),
    Run(53u, 38u, 1u),
    Run(54u, 29u, 1u),
    Run(54u, 37u, 1u),
    Run(54u, 43u, 1u),
    Run(55u, 29u, 1u),
    Run(55u, 42u, 4u),
    Run(56u, 29u, 1u),
    Run(56u, 41u, 2u),
    Run(56u, 44u, 1u),
    Run(56u, 46u, 1u),
    Run(56u, 50u, 2u),
    Run(56u, 57u, 2u),
    Run(57u, 18u, 2u),
    Run(57u, 25u, 1u),
    Run(57u, 28u, 1u),
    Run(57u, 40u, 3u),
    Run(57u, 44u, 1u),
    Run(57u, 47u, 1u),
    Run(57u, 50u, 2u),
    Run(57u, 57u, 1u),
    Run(58u, 6u, 2u),
    Run(58u, 17u, 1u),
    Run(58u, 19u, 1u),
    Run(58u, 25u, 2u),
    Run(58u, 41u, 2u),
    Run(58u, 44u, 1u),
    Run(58u, 46u, 1u),
    Run(58u, 58u, 3u),
    Run(59u, 5u, 1u),
    Run(59u, 7u, 1u),
    Run(59u, 17u, 1u),
    Run(59u, 42u, 4u),
    Run(59u, 60u, 1u),
    Run(60u, 5u, 1u),
    Run(60u, 16u, 2u),
    Run(60u, 43u, 1u),
    Run(61u, 4u, 2u)
);

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

fn initCellState(x: u32, y: u32)
{
    if (x != 0u || y != 0u)
    {
        return;
    }

    let grid = shaderUniforms.iGridSize;
    if (grid.x < PATTERN_WIDTH || grid.y < PATTERN_HEIGHT)
    {
        return;
    }

    let gridCount = grid.x * grid.y;
    for (var i = 0u; i < gridCount; i = i + 1u)
    {
        cellStateOut[i] = 0u;
    }

    let offset = vec2u((grid.x - PATTERN_WIDTH) / 2u, (grid.y - PATTERN_HEIGHT) / 2u);

    for (var i = 0u; i < PATTERN_RUN_COUNT; i = i + 1u)
    {
        let run = PATTERN_RUNS[i];
        let rowOffset = (run.y + offset.y) * grid.x + run.x + offset.x;

        for (var dx = 0u; dx < run.len; dx = dx + 1u)
        {
            cellStateOut[rowOffset + dx] = 1u;
        }
    }
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

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) cell : vec3u)
{
    // Initialize cell state on the first frame.
    if (shaderUniforms.iFrame == 0u)
    {
        initCellState(cell.x, cell.y);
        return;
    }

    if (applyMouseOverride(cell.xy))
    {
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
