// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 73u;
const PATTERN_HEIGHT : u32 = 52u;
const PATTERN_RUN_COUNT : u32 = 78u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from tmp/gol-components/meta2.lif (y, x, len).
const PATTERN_RUNS : array<Run, 78> = array<Run, 78>(
    Run(0u, 29u, 2u),
    Run(0u, 50u, 2u),
    Run(1u, 30u, 1u),
    Run(1u, 50u, 1u),
    Run(2u, 30u, 1u),
    Run(2u, 32u, 1u),
    Run(2u, 41u, 2u),
    Run(2u, 48u, 1u),
    Run(2u, 50u, 1u),
    Run(3u, 31u, 2u),
    Run(3u, 39u, 1u),
    Run(3u, 42u, 1u),
    Run(3u, 48u, 2u),
    Run(4u, 38u, 1u),
    Run(5u, 38u, 1u),
    Run(6u, 38u, 1u),
    Run(7u, 39u, 1u),
    Run(7u, 42u, 1u),
    Run(8u, 41u, 2u),
    Run(11u, 27u, 2u),
    Run(12u, 28u, 2u),
    Run(13u, 27u, 1u),
    Run(16u, 44u, 1u),
    Run(17u, 45u, 1u),
    Run(18u, 43u, 3u),
    Run(25u, 2u, 1u),
    Run(25u, 7u, 1u),
    Run(26u, 0u, 2u),
    Run(26u, 3u, 4u),
    Run(26u, 8u, 2u),
    Run(26u, 12u, 3u),
    Run(26u, 43u, 1u),
    Run(26u, 46u, 1u),
    Run(27u, 2u, 1u),
    Run(27u, 7u, 1u),
    Run(27u, 12u, 2u),
    Run(27u, 15u, 1u),
    Run(27u, 42u, 1u),
    Run(27u, 59u, 1u),
    Run(28u, 13u, 1u),
    Run(28u, 15u, 1u),
    Run(28u, 42u, 1u),
    Run(28u, 46u, 1u),
    Run(28u, 58u, 1u),
    Run(28u, 60u, 1u),
    Run(29u, 42u, 4u),
    Run(29u, 56u, 2u),
    Run(29u, 61u, 1u),
    Run(30u, 56u, 2u),
    Run(30u, 61u, 1u),
    Run(31u, 56u, 2u),
    Run(31u, 61u, 1u),
    Run(32u, 58u, 1u),
    Run(32u, 60u, 1u),
    Run(32u, 69u, 2u),
    Run(33u, 16u, 1u),
    Run(33u, 59u, 1u),
    Run(33u, 69u, 1u),
    Run(33u, 71u, 1u),
    Run(34u, 15u, 3u),
    Run(34u, 71u, 1u),
    Run(35u, 14u, 5u),
    Run(35u, 71u, 2u),
    Run(36u, 56u, 1u),
    Run(37u, 54u, 2u),
    Run(37u, 57u, 2u),
    Run(39u, 53u, 1u),
    Run(39u, 59u, 1u),
    Run(41u, 53u, 2u),
    Run(41u, 56u, 1u),
    Run(41u, 58u, 2u),
    Run(42u, 14u, 5u),
    Run(43u, 15u, 3u),
    Run(44u, 16u, 1u),
    Run(48u, 58u, 2u),
    Run(49u, 58u, 1u),
    Run(50u, 59u, 3u),
    Run(51u, 61u, 1u)
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
