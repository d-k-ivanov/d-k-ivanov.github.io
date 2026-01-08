// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 55u;
const PATTERN_HEIGHT : u32 = 26u;
const PATTERN_RUN_COUNT : u32 = 83u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from p240.lif (y, x, len).
const PATTERN_RUNS : array<Run, 83> = array<Run, 83>(
    Run(0u, 30u, 3u),
    Run(1u, 32u, 1u),
    Run(1u, 48u, 1u),
    Run(2u, 31u, 1u),
    Run(2u, 47u, 1u),
    Run(2u, 49u, 1u),
    Run(3u, 46u, 1u),
    Run(3u, 50u, 2u),
    Run(4u, 46u, 1u),
    Run(4u, 50u, 2u),
    Run(5u, 13u, 4u),
    Run(5u, 46u, 1u),
    Run(5u, 50u, 2u),
    Run(6u, 12u, 6u),
    Run(6u, 47u, 1u),
    Run(6u, 49u, 1u),
    Run(7u, 11u, 8u),
    Run(7u, 30u, 1u),
    Run(7u, 48u, 1u),
    Run(8u, 10u, 2u),
    Run(8u, 18u, 2u),
    Run(8u, 30u, 2u),
    Run(9u, 11u, 8u),
    Run(9u, 29u, 1u),
    Run(9u, 31u, 1u),
    Run(10u, 12u, 6u),
    Run(10u, 51u, 1u),
    Run(11u, 13u, 4u),
    Run(11u, 49u, 2u),
    Run(11u, 52u, 2u),
    Run(13u, 38u, 3u),
    Run(13u, 48u, 1u),
    Run(13u, 54u, 1u),
    Run(14u, 37u, 1u),
    Run(14u, 41u, 1u),
    Run(15u, 22u, 2u),
    Run(15u, 36u, 1u),
    Run(15u, 42u, 1u),
    Run(15u, 48u, 2u),
    Run(15u, 51u, 1u),
    Run(15u, 53u, 2u),
    Run(16u, 23u, 2u),
    Run(16u, 36u, 2u),
    Run(16u, 39u, 1u),
    Run(16u, 41u, 2u),
    Run(17u, 12u, 1u),
    Run(17u, 22u, 1u),
    Run(18u, 12u, 1u),
    Run(18u, 14u, 1u),
    Run(19u, 0u, 2u),
    Run(19u, 13u, 1u),
    Run(19u, 15u, 1u),
    Run(19u, 25u, 2u),
    Run(20u, 0u, 2u),
    Run(20u, 13u, 1u),
    Run(20u, 16u, 1u),
    Run(20u, 24u, 3u),
    Run(21u, 13u, 1u),
    Run(21u, 15u, 1u),
    Run(21u, 21u, 1u),
    Run(21u, 23u, 2u),
    Run(21u, 34u, 2u),
    Run(22u, 12u, 1u),
    Run(22u, 14u, 1u),
    Run(22u, 21u, 1u),
    Run(22u, 24u, 1u),
    Run(22u, 29u, 1u),
    Run(22u, 35u, 1u),
    Run(22u, 41u, 2u),
    Run(23u, 12u, 1u),
    Run(23u, 21u, 1u),
    Run(23u, 23u, 2u),
    Run(23u, 30u, 1u),
    Run(23u, 41u, 1u),
    Run(24u, 24u, 3u),
    Run(24u, 30u, 1u),
    Run(24u, 34u, 1u),
    Run(24u, 42u, 3u),
    Run(24u, 50u, 2u),
    Run(25u, 25u, 2u),
    Run(25u, 32u, 1u),
    Run(25u, 44u, 1u),
    Run(25u, 50u, 2u)
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
    if (x >= shaderUniforms.iGridSize.x || y >= shaderUniforms.iGridSize.y)
    {
        return 0u;
    }

    return cellStateIn[cellIndex(vec2(x, y))];
}

fn getCellState(x: u32, y: u32) -> u32
{
    return cellActive(x, y);
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
        setCellState(cell.x, cell.y, getCellState(cell.x, cell.y));
        return;
    }

    let activeNeighbors = countActiveNeighbors(cell.xy);
    applyGameOfLifeRules(cell.xy, activeNeighbors);
}
