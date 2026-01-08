// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 43u;
const PATTERN_HEIGHT : u32 = 40u;
const PATTERN_RUN_COUNT : u32 = 55u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from tmp/gol-components/gap8.lif (y, x, len).
const PATTERN_RUNS : array<Run, 55> = array<Run, 55>(
    Run(0u, 16u, 1u),
    Run(1u, 14u, 1u),
    Run(1u, 16u, 1u),
    Run(2u, 15u, 2u),
    Run(8u, 34u, 1u),
    Run(9u, 32u, 3u),
    Run(9u, 40u, 2u),
    Run(10u, 31u, 1u),
    Run(10u, 41u, 2u),
    Run(11u, 31u, 2u),
    Run(11u, 40u, 1u),
    Run(16u, 33u, 1u),
    Run(17u, 33u, 2u),
    Run(18u, 32u, 1u),
    Run(18u, 34u, 1u),
    Run(24u, 25u, 2u),
    Run(25u, 26u, 2u),
    Run(26u, 25u, 1u),
    Run(29u, 11u, 1u),
    Run(30u, 8u, 4u),
    Run(30u, 15u, 1u),
    Run(30u, 17u, 2u),
    Run(31u, 7u, 4u),
    Run(31u, 15u, 1u),
    Run(31u, 17u, 1u),
    Run(31u, 19u, 2u),
    Run(31u, 23u, 2u),
    Run(32u, 7u, 1u),
    Run(32u, 10u, 1u),
    Run(32u, 14u, 2u),
    Run(32u, 17u, 1u),
    Run(32u, 19u, 2u),
    Run(32u, 23u, 1u),
    Run(32u, 25u, 1u),
    Run(33u, 7u, 4u),
    Run(33u, 14u, 2u),
    Run(33u, 24u, 3u),
    Run(34u, 2u, 2u),
    Run(34u, 8u, 4u),
    Run(34u, 15u, 2u),
    Run(34u, 25u, 3u),
    Run(35u, 1u, 1u),
    Run(35u, 3u, 1u),
    Run(35u, 11u, 1u),
    Run(35u, 24u, 3u),
    Run(36u, 1u, 1u),
    Run(36u, 23u, 1u),
    Run(36u, 25u, 1u),
    Run(36u, 32u, 2u),
    Run(37u, 0u, 2u),
    Run(37u, 23u, 2u),
    Run(37u, 32u, 1u),
    Run(37u, 34u, 1u),
    Run(38u, 34u, 1u),
    Run(39u, 34u, 2u)
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
