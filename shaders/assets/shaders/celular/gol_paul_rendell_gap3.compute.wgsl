// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 53u;
const PATTERN_HEIGHT : u32 = 58u;
const PATTERN_RUN_COUNT : u32 = 85u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from gap3.lif (y, x, len).
const PATTERN_RUNS : array<Run, 85> = array<Run, 85>(
    Run(0u, 11u, 1u),
    Run(0u, 42u, 1u),
    Run(1u, 9u, 2u),
    Run(1u, 43u, 2u),
    Run(2u, 10u, 2u),
    Run(2u, 42u, 2u),
    Run(19u, 1u, 1u),
    Run(20u, 0u, 2u),
    Run(21u, 0u, 1u),
    Run(21u, 2u, 1u),
    Run(21u, 50u, 3u),
    Run(22u, 21u, 2u),
    Run(22u, 31u, 2u),
    Run(22u, 52u, 1u),
    Run(23u, 21u, 2u),
    Run(23u, 31u, 2u),
    Run(23u, 51u, 1u),
    Run(25u, 21u, 1u),
    Run(26u, 20u, 1u),
    Run(26u, 22u, 1u),
    Run(27u, 8u, 2u),
    Run(27u, 20u, 1u),
    Run(27u, 22u, 1u),
    Run(27u, 32u, 1u),
    Run(28u, 7u, 2u),
    Run(28u, 21u, 1u),
    Run(28u, 31u, 3u),
    Run(28u, 43u, 2u),
    Run(29u, 9u, 1u),
    Run(29u, 30u, 1u),
    Run(29u, 34u, 1u),
    Run(29u, 42u, 1u),
    Run(29u, 44u, 1u),
    Run(30u, 29u, 1u),
    Run(30u, 31u, 3u),
    Run(30u, 35u, 1u),
    Run(30u, 44u, 1u),
    Run(31u, 18u, 2u),
    Run(31u, 21u, 1u),
    Run(31u, 23u, 2u),
    Run(31u, 30u, 5u),
    Run(32u, 18u, 1u),
    Run(32u, 24u, 1u),
    Run(33u, 19u, 1u),
    Run(33u, 23u, 1u),
    Run(34u, 16u, 1u),
    Run(34u, 20u, 3u),
    Run(35u, 15u, 2u),
    Run(36u, 15u, 1u),
    Run(36u, 17u, 1u),
    Run(36u, 35u, 3u),
    Run(37u, 37u, 1u),
    Run(38u, 36u, 1u),
    Run(42u, 19u, 1u),
    Run(43u, 19u, 1u),
    Run(44u, 18u, 1u),
    Run(44u, 20u, 1u),
    Run(45u, 17u, 2u),
    Run(45u, 20u, 2u),
    Run(45u, 33u, 3u),
    Run(46u, 16u, 1u),
    Run(46u, 22u, 1u),
    Run(46u, 32u, 1u),
    Run(46u, 36u, 1u),
    Run(47u, 19u, 1u),
    Run(47u, 31u, 1u),
    Run(47u, 37u, 1u),
    Run(48u, 16u, 2u),
    Run(48u, 21u, 2u),
    Run(48u, 31u, 2u),
    Run(48u, 34u, 1u),
    Run(48u, 36u, 2u),
    Run(51u, 18u, 1u),
    Run(51u, 34u, 1u),
    Run(52u, 18u, 1u),
    Run(52u, 33u, 1u),
    Run(52u, 35u, 1u),
    Run(53u, 17u, 1u),
    Run(53u, 33u, 1u),
    Run(53u, 35u, 1u),
    Run(54u, 34u, 1u),
    Run(56u, 19u, 2u),
    Run(56u, 33u, 2u),
    Run(57u, 19u, 2u),
    Run(57u, 33u, 2u)
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
