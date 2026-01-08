// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 75u;
const PATTERN_HEIGHT : u32 = 43u;
const PATTERN_RUN_COUNT : u32 = 134u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from P30lwss.lif (y, x, len).
const PATTERN_RUNS : array<Run, 134> = array<Run, 134>(
    Run(0u, 2u, 1u),
    Run(1u, 2u, 3u),
    Run(2u, 5u, 1u),
    Run(3u, 4u, 2u),
    Run(5u, 7u, 1u),
    Run(6u, 6u, 3u),
    Run(7u, 5u, 1u),
    Run(7u, 9u, 1u),
    Run(8u, 4u, 1u),
    Run(8u, 6u, 3u),
    Run(8u, 10u, 1u),
    Run(9u, 5u, 5u),
    Run(11u, 13u, 2u),
    Run(12u, 14u, 1u),
    Run(13u, 14u, 1u),
    Run(13u, 16u, 1u),
    Run(13u, 23u, 1u),
    Run(14u, 15u, 2u),
    Run(14u, 23u, 4u),
    Run(15u, 4u, 2u),
    Run(15u, 8u, 1u),
    Run(15u, 24u, 4u),
    Run(15u, 35u, 1u),
    Run(16u, 6u, 1u),
    Run(16u, 8u, 1u),
    Run(16u, 24u, 1u),
    Run(16u, 27u, 1u),
    Run(16u, 34u, 1u),
    Run(16u, 36u, 1u),
    Run(17u, 8u, 2u),
    Run(17u, 24u, 4u),
    Run(17u, 32u, 2u),
    Run(17u, 37u, 1u),
    Run(18u, 9u, 2u),
    Run(18u, 23u, 4u),
    Run(18u, 32u, 2u),
    Run(18u, 37u, 1u),
    Run(19u, 7u, 1u),
    Run(19u, 9u, 2u),
    Run(19u, 23u, 1u),
    Run(19u, 32u, 2u),
    Run(19u, 37u, 1u),
    Run(20u, 7u, 3u),
    Run(20u, 34u, 1u),
    Run(20u, 36u, 1u),
    Run(20u, 45u, 2u),
    Run(21u, 35u, 1u),
    Run(21u, 45u, 1u),
    Run(21u, 47u, 1u),
    Run(22u, 24u, 1u),
    Run(22u, 26u, 1u),
    Run(22u, 47u, 1u),
    Run(23u, 2u, 2u),
    Run(23u, 7u, 2u),
    Run(23u, 24u, 2u),
    Run(23u, 47u, 2u),
    Run(24u, 5u, 1u),
    Run(24u, 25u, 1u),
    Run(25u, 2u, 1u),
    Run(25u, 8u, 1u),
    Run(26u, 3u, 2u),
    Run(26u, 6u, 2u),
    Run(26u, 14u, 1u),
    Run(26u, 16u, 1u),
    Run(27u, 4u, 1u),
    Run(27u, 6u, 1u),
    Run(27u, 15u, 2u),
    Run(28u, 5u, 1u),
    Run(28u, 15u, 1u),
    Run(29u, 5u, 1u),
    Run(29u, 40u, 1u),
    Run(29u, 43u, 1u),
    Run(29u, 70u, 1u),
    Run(29u, 73u, 1u),
    Run(30u, 26u, 4u),
    Run(30u, 44u, 1u),
    Run(30u, 56u, 4u),
    Run(30u, 74u, 1u),
    Run(31u, 25u, 1u),
    Run(31u, 29u, 1u),
    Run(31u, 40u, 1u),
    Run(31u, 44u, 1u),
    Run(31u, 55u, 1u),
    Run(31u, 59u, 1u),
    Run(31u, 70u, 1u),
    Run(31u, 74u, 1u),
    Run(32u, 2u, 2u),
    Run(32u, 29u, 1u),
    Run(32u, 41u, 4u),
    Run(32u, 59u, 1u),
    Run(32u, 71u, 4u),
    Run(33u, 3u, 1u),
    Run(33u, 25u, 1u),
    Run(33u, 28u, 1u),
    Run(33u, 55u, 1u),
    Run(33u, 58u, 1u),
    Run(34u, 0u, 3u),
    Run(34u, 8u, 1u),
    Run(34u, 17u, 1u),
    Run(34u, 20u, 1u),
    Run(35u, 0u, 1u),
    Run(35u, 7u, 1u),
    Run(35u, 9u, 1u),
    Run(35u, 20u, 1u),
    Run(36u, 5u, 2u),
    Run(36u, 10u, 1u),
    Run(36u, 16u, 2u),
    Run(36u, 21u, 1u),
    Run(36u, 24u, 1u),
    Run(37u, 5u, 2u),
    Run(37u, 10u, 1u),
    Run(37u, 15u, 1u),
    Run(37u, 17u, 1u),
    Run(37u, 19u, 2u),
    Run(37u, 24u, 4u),
    Run(38u, 5u, 2u),
    Run(38u, 10u, 1u),
    Run(38u, 25u, 4u),
    Run(39u, 2u, 2u),
    Run(39u, 7u, 1u),
    Run(39u, 9u, 1u),
    Run(39u, 15u, 2u),
    Run(39u, 25u, 1u),
    Run(39u, 28u, 1u),
    Run(39u, 34u, 2u),
    Run(40u, 1u, 1u),
    Run(40u, 3u, 1u),
    Run(40u, 8u, 1u),
    Run(40u, 25u, 4u),
    Run(40u, 34u, 2u),
    Run(41u, 1u, 1u),
    Run(41u, 24u, 4u),
    Run(42u, 0u, 2u),
    Run(42u, 24u, 1u)
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
