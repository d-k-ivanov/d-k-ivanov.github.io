// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 82u;
const PATTERN_HEIGHT : u32 = 51u;
const PATTERN_RUN_COUNT : u32 = 234u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from P30mwss.lif (y, x, len).
const PATTERN_RUNS : array<Run, 234> = array<Run, 234>(
    Run(0u, 5u, 2u),
    Run(0u, 57u, 1u),
    Run(0u, 59u, 1u),
    Run(1u, 5u, 2u),
    Run(1u, 55u, 1u),
    Run(1u, 59u, 1u),
    Run(2u, 47u, 1u),
    Run(2u, 55u, 1u),
    Run(3u, 46u, 4u),
    Run(3u, 54u, 1u),
    Run(3u, 59u, 1u),
    Run(3u, 68u, 2u),
    Run(4u, 45u, 2u),
    Run(4u, 48u, 1u),
    Run(4u, 50u, 1u),
    Run(4u, 55u, 1u),
    Run(4u, 68u, 2u),
    Run(5u, 34u, 2u),
    Run(5u, 44u, 3u),
    Run(5u, 48u, 1u),
    Run(5u, 51u, 1u),
    Run(5u, 55u, 1u),
    Run(5u, 59u, 1u),
    Run(6u, 34u, 2u),
    Run(6u, 45u, 2u),
    Run(6u, 48u, 1u),
    Run(6u, 50u, 1u),
    Run(6u, 57u, 1u),
    Run(6u, 59u, 1u),
    Run(7u, 46u, 4u),
    Run(8u, 5u, 1u),
    Run(8u, 47u, 1u),
    Run(9u, 4u, 3u),
    Run(9u, 58u, 1u),
    Run(10u, 3u, 5u),
    Run(10u, 36u, 1u),
    Run(10u, 38u, 1u),
    Run(10u, 56u, 1u),
    Run(10u, 58u, 1u),
    Run(11u, 2u, 1u),
    Run(11u, 4u, 1u),
    Run(11u, 6u, 1u),
    Run(11u, 8u, 1u),
    Run(11u, 34u, 1u),
    Run(11u, 38u, 1u),
    Run(11u, 57u, 2u),
    Run(11u, 69u, 1u),
    Run(12u, 2u, 2u),
    Run(12u, 7u, 2u),
    Run(12u, 34u, 1u),
    Run(12u, 67u, 3u),
    Run(13u, 27u, 2u),
    Run(13u, 33u, 1u),
    Run(13u, 38u, 1u),
    Run(13u, 66u, 1u),
    Run(14u, 27u, 2u),
    Run(14u, 34u, 1u),
    Run(14u, 66u, 2u),
    Run(15u, 5u, 1u),
    Run(15u, 34u, 1u),
    Run(15u, 38u, 1u),
    Run(16u, 4u, 1u),
    Run(16u, 6u, 1u),
    Run(16u, 10u, 2u),
    Run(16u, 36u, 1u),
    Run(16u, 38u, 1u),
    Run(17u, 3u, 2u),
    Run(17u, 6u, 1u),
    Run(17u, 11u, 1u),
    Run(18u, 3u, 3u),
    Run(18u, 11u, 1u),
    Run(18u, 13u, 1u),
    Run(18u, 20u, 1u),
    Run(18u, 22u, 1u),
    Run(18u, 58u, 1u),
    Run(18u, 60u, 1u),
    Run(19u, 2u, 1u),
    Run(19u, 5u, 1u),
    Run(19u, 12u, 2u),
    Run(19u, 20u, 1u),
    Run(19u, 24u, 1u),
    Run(19u, 47u, 3u),
    Run(19u, 58u, 2u),
    Run(19u, 64u, 1u),
    Run(20u, 2u, 3u),
    Run(20u, 24u, 1u),
    Run(20u, 32u, 1u),
    Run(20u, 46u, 1u),
    Run(20u, 50u, 1u),
    Run(20u, 59u, 1u),
    Run(20u, 63u, 3u),
    Run(21u, 1u, 1u),
    Run(21u, 5u, 1u),
    Run(21u, 20u, 1u),
    Run(21u, 25u, 1u),
    Run(21u, 30u, 4u),
    Run(21u, 45u, 1u),
    Run(21u, 51u, 1u),
    Run(21u, 63u, 3u),
    Run(22u, 0u, 1u),
    Run(22u, 6u, 1u),
    Run(22u, 24u, 1u),
    Run(22u, 29u, 1u),
    Run(22u, 31u, 1u),
    Run(22u, 33u, 2u),
    Run(22u, 46u, 1u),
    Run(22u, 50u, 1u),
    Run(23u, 1u, 1u),
    Run(23u, 5u, 1u),
    Run(23u, 11u, 1u),
    Run(23u, 20u, 1u),
    Run(23u, 24u, 1u),
    Run(23u, 28u, 1u),
    Run(23u, 31u, 1u),
    Run(23u, 33u, 3u),
    Run(23u, 47u, 3u),
    Run(23u, 61u, 2u),
    Run(23u, 66u, 2u),
    Run(24u, 2u, 3u),
    Run(24u, 12u, 1u),
    Run(24u, 20u, 1u),
    Run(24u, 22u, 1u),
    Run(24u, 29u, 1u),
    Run(24u, 31u, 1u),
    Run(24u, 33u, 2u),
    Run(24u, 47u, 3u),
    Run(24u, 61u, 2u),
    Run(24u, 66u, 2u),
    Run(25u, 10u, 3u),
    Run(25u, 30u, 4u),
    Run(25u, 42u, 2u),
    Run(25u, 52u, 1u),
    Run(26u, 32u, 1u),
    Run(26u, 42u, 1u),
    Run(26u, 44u, 1u),
    Run(26u, 50u, 2u),
    Run(27u, 21u, 1u),
    Run(27u, 44u, 1u),
    Run(27u, 51u, 2u),
    Run(28u, 21u, 1u),
    Run(28u, 23u, 1u),
    Run(28u, 44u, 2u),
    Run(28u, 64u, 2u),
    Run(29u, 21u, 2u),
    Run(31u, 19u, 1u),
    Run(31u, 33u, 2u),
    Run(31u, 62u, 3u),
    Run(32u, 17u, 1u),
    Run(32u, 19u, 1u),
    Run(32u, 32u, 4u),
    Run(32u, 49u, 2u),
    Run(32u, 61u, 5u),
    Run(32u, 79u, 2u),
    Run(33u, 18u, 2u),
    Run(33u, 32u, 2u),
    Run(33u, 35u, 2u),
    Run(33u, 47u, 2u),
    Run(33u, 50u, 2u),
    Run(33u, 61u, 3u),
    Run(33u, 65u, 2u),
    Run(33u, 76u, 3u),
    Run(33u, 80u, 2u),
    Run(34u, 3u, 2u),
    Run(34u, 22u, 2u),
    Run(34u, 34u, 2u),
    Run(34u, 47u, 4u),
    Run(34u, 64u, 2u),
    Run(34u, 76u, 5u),
    Run(35u, 3u, 2u),
    Run(35u, 23u, 2u),
    Run(35u, 48u, 2u),
    Run(35u, 77u, 3u),
    Run(36u, 12u, 1u),
    Run(36u, 22u, 1u),
    Run(36u, 55u, 1u),
    Run(37u, 12u, 1u),
    Run(37u, 14u, 1u),
    Run(37u, 55u, 1u),
    Run(38u, 0u, 2u),
    Run(38u, 13u, 1u),
    Run(38u, 15u, 1u),
    Run(38u, 25u, 2u),
    Run(38u, 46u, 1u),
    Run(38u, 56u, 1u),
    Run(38u, 61u, 1u),
    Run(39u, 0u, 2u),
    Run(39u, 13u, 1u),
    Run(39u, 16u, 1u),
    Run(39u, 24u, 3u),
    Run(39u, 45u, 1u),
    Run(39u, 47u, 1u),
    Run(39u, 52u, 1u),
    Run(39u, 60u, 1u),
    Run(39u, 62u, 1u),
    Run(40u, 13u, 1u),
    Run(40u, 15u, 1u),
    Run(40u, 21u, 1u),
    Run(40u, 23u, 2u),
    Run(40u, 34u, 2u),
    Run(40u, 46u, 1u),
    Run(40u, 52u, 3u),
    Run(40u, 61u, 1u),
    Run(41u, 12u, 1u),
    Run(41u, 14u, 1u),
    Run(41u, 21u, 1u),
    Run(41u, 24u, 1u),
    Run(41u, 29u, 1u),
    Run(41u, 35u, 1u),
    Run(41u, 52u, 1u),
    Run(42u, 12u, 1u),
    Run(42u, 21u, 1u),
    Run(42u, 23u, 2u),
    Run(42u, 30u, 1u),
    Run(43u, 24u, 3u),
    Run(43u, 30u, 1u),
    Run(43u, 34u, 1u),
    Run(43u, 55u, 1u),
    Run(44u, 25u, 2u),
    Run(44u, 32u, 1u),
    Run(44u, 55u, 1u),
    Run(45u, 50u, 1u),
    Run(46u, 44u, 1u),
    Run(46u, 50u, 3u),
    Run(46u, 59u, 1u),
    Run(47u, 43u, 1u),
    Run(47u, 45u, 1u),
    Run(47u, 50u, 1u),
    Run(47u, 58u, 1u),
    Run(47u, 60u, 1u),
    Run(48u, 44u, 1u),
    Run(48u, 54u, 1u),
    Run(48u, 59u, 1u),
    Run(49u, 53u, 1u),
    Run(50u, 53u, 1u)
);

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouseL : vec4f,
    iMouseR : vec4f,
    iMouseW : vec4f,
    iMouseZoom : vec4f,
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
    if (shaderUniforms.iMouseL.z <= 0.0)
    {
        return false;
    }

    let grid = vec2f(f32(shaderUniforms.iGridSize.x), f32(shaderUniforms.iGridSize.y));
    let cellSize = shaderUniforms.iResolution.xy / grid;
    let mousePos = clamp(shaderUniforms.iMouseL.xy, vec2f(0.0), shaderUniforms.iResolution.xy - vec2f(1.0));
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
