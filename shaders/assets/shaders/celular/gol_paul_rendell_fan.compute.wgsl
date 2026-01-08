// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 92u;
const PATTERN_HEIGHT : u32 = 96u;
const PATTERN_RUN_COUNT : u32 = 168u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from fan.lif (y, x, len).
const PATTERN_RUNS : array<Run, 168> = array<Run, 168>(
    Run(0u, 34u, 1u),
    Run(1u, 33u, 2u),
    Run(2u, 33u, 1u),
    Run(2u, 35u, 1u),
    Run(15u, 49u, 1u),
    Run(16u, 48u, 2u),
    Run(16u, 56u, 2u),
    Run(17u, 48u, 1u),
    Run(17u, 50u, 1u),
    Run(17u, 57u, 1u),
    Run(18u, 57u, 1u),
    Run(18u, 59u, 1u),
    Run(18u, 66u, 1u),
    Run(18u, 90u, 2u),
    Run(19u, 58u, 2u),
    Run(19u, 64u, 1u),
    Run(19u, 66u, 1u),
    Run(19u, 90u, 1u),
    Run(20u, 62u, 2u),
    Run(20u, 82u, 2u),
    Run(20u, 87u, 2u),
    Run(20u, 90u, 1u),
    Run(21u, 62u, 2u),
    Run(21u, 81u, 1u),
    Run(21u, 85u, 1u),
    Run(21u, 89u, 1u),
    Run(22u, 62u, 2u),
    Run(22u, 80u, 1u),
    Run(23u, 64u, 1u),
    Run(23u, 66u, 1u),
    Run(23u, 71u, 1u),
    Run(23u, 80u, 1u),
    Run(23u, 84u, 1u),
    Run(23u, 87u, 1u),
    Run(24u, 66u, 1u),
    Run(24u, 70u, 1u),
    Run(24u, 80u, 1u),
    Run(24u, 86u, 1u),
    Run(25u, 70u, 3u),
    Run(25u, 75u, 1u),
    Run(25u, 81u, 1u),
    Run(25u, 85u, 1u),
    Run(26u, 82u, 2u),
    Run(28u, 87u, 2u),
    Run(29u, 56u, 2u),
    Run(29u, 86u, 1u),
    Run(29u, 88u, 1u),
    Run(30u, 55u, 1u),
    Run(30u, 57u, 1u),
    Run(30u, 81u, 2u),
    Run(30u, 86u, 1u),
    Run(31u, 54u, 3u),
    Run(31u, 61u, 4u),
    Run(31u, 81u, 1u),
    Run(31u, 85u, 2u),
    Run(32u, 53u, 3u),
    Run(32u, 61u, 1u),
    Run(32u, 63u, 1u),
    Run(32u, 65u, 1u),
    Run(32u, 72u, 2u),
    Run(32u, 79u, 1u),
    Run(32u, 81u, 1u),
    Run(33u, 54u, 3u),
    Run(33u, 62u, 1u),
    Run(33u, 71u, 1u),
    Run(33u, 73u, 1u),
    Run(33u, 79u, 2u),
    Run(34u, 47u, 2u),
    Run(34u, 55u, 1u),
    Run(34u, 57u, 1u),
    Run(34u, 70u, 1u),
    Run(35u, 46u, 1u),
    Run(35u, 48u, 1u),
    Run(35u, 56u, 2u),
    Run(35u, 70u, 1u),
    Run(35u, 73u, 1u),
    Run(36u, 46u, 1u),
    Run(36u, 70u, 1u),
    Run(37u, 45u, 2u),
    Run(37u, 71u, 1u),
    Run(37u, 73u, 1u),
    Run(38u, 66u, 1u),
    Run(38u, 72u, 2u),
    Run(39u, 67u, 2u),
    Run(40u, 66u, 2u),
    Run(46u, 51u, 3u),
    Run(47u, 53u, 1u),
    Run(48u, 52u, 1u),
    Run(53u, 81u, 1u),
    Run(54u, 82u, 2u),
    Run(55u, 81u, 2u),
    Run(61u, 36u, 3u),
    Run(62u, 38u, 1u),
    Run(63u, 37u, 1u),
    Run(72u, 12u, 1u),
    Run(73u, 11u, 2u),
    Run(74u, 10u, 2u),
    Run(74u, 16u, 2u),
    Run(74u, 21u, 1u),
    Run(75u, 9u, 3u),
    Run(75u, 16u, 2u),
    Run(75u, 20u, 1u),
    Run(75u, 22u, 1u),
    Run(76u, 10u, 2u),
    Run(76u, 16u, 1u),
    Run(76u, 22u, 2u),
    Run(77u, 2u, 2u),
    Run(77u, 11u, 2u),
    Run(78u, 1u, 1u),
    Run(78u, 3u, 1u),
    Run(78u, 12u, 1u),
    Run(78u, 21u, 1u),
    Run(78u, 24u, 1u),
    Run(79u, 1u, 1u),
    Run(79u, 23u, 1u),
    Run(80u, 0u, 2u),
    Run(81u, 28u, 2u),
    Run(82u, 27u, 2u),
    Run(83u, 14u, 2u),
    Run(83u, 17u, 1u),
    Run(83u, 19u, 2u),
    Run(83u, 29u, 1u),
    Run(84u, 14u, 1u),
    Run(84u, 20u, 1u),
    Run(85u, 15u, 1u),
    Run(85u, 19u, 1u),
    Run(85u, 41u, 2u),
    Run(86u, 16u, 3u),
    Run(86u, 41u, 1u),
    Run(86u, 44u, 1u),
    Run(87u, 31u, 1u),
    Run(87u, 35u, 3u),
    Run(87u, 45u, 1u),
    Run(88u, 30u, 5u),
    Run(88u, 38u, 1u),
    Run(88u, 45u, 1u),
    Run(89u, 29u, 2u),
    Run(89u, 32u, 2u),
    Run(89u, 37u, 1u),
    Run(89u, 45u, 1u),
    Run(90u, 28u, 3u),
    Run(90u, 32u, 2u),
    Run(90u, 37u, 1u),
    Run(90u, 41u, 1u),
    Run(90u, 44u, 1u),
    Run(90u, 50u, 2u),
    Run(91u, 29u, 2u),
    Run(91u, 32u, 4u),
    Run(91u, 41u, 2u),
    Run(91u, 50u, 1u),
    Run(91u, 52u, 1u),
    Run(91u, 58u, 2u),
    Run(92u, 14u, 2u),
    Run(92u, 20u, 2u),
    Run(92u, 30u, 4u),
    Run(92u, 52u, 1u),
    Run(92u, 58u, 1u),
    Run(93u, 15u, 1u),
    Run(93u, 19u, 1u),
    Run(93u, 21u, 1u),
    Run(93u, 31u, 1u),
    Run(93u, 52u, 2u),
    Run(93u, 59u, 3u),
    Run(94u, 12u, 3u),
    Run(94u, 19u, 1u),
    Run(94u, 61u, 1u),
    Run(95u, 12u, 1u),
    Run(95u, 18u, 2u)
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
        return;
    }

    let activeNeighbors = countActiveNeighbors(cell.xy);
    applyGameOfLifeRules(cell.xy, activeNeighbors);
}
