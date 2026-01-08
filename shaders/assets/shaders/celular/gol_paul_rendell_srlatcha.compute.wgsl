// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 128u;
const PATTERN_HEIGHT : u32 = 72u;
const PATTERN_RUN_COUNT : u32 = 254u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from tmp/gol-components/srlatcha.lif (y, x, len).
const PATTERN_RUNS : array<Run, 254> = array<Run, 254>(
    Run(0u, 67u, 2u),
    Run(1u, 68u, 2u),
    Run(2u, 67u, 1u),
    Run(3u, 51u, 1u),
    Run(3u, 58u, 1u),
    Run(3u, 74u, 1u),
    Run(3u, 81u, 1u),
    Run(4u, 50u, 2u),
    Run(4u, 58u, 2u),
    Run(4u, 73u, 2u),
    Run(4u, 81u, 2u),
    Run(5u, 49u, 3u),
    Run(5u, 58u, 3u),
    Run(5u, 72u, 3u),
    Run(5u, 81u, 3u),
    Run(6u, 50u, 2u),
    Run(6u, 58u, 2u),
    Run(6u, 73u, 2u),
    Run(6u, 81u, 2u),
    Run(7u, 51u, 1u),
    Run(7u, 58u, 1u),
    Run(7u, 74u, 1u),
    Run(7u, 81u, 1u),
    Run(11u, 60u, 3u),
    Run(12u, 62u, 1u),
    Run(13u, 61u, 1u),
    Run(15u, 73u, 2u),
    Run(16u, 73u, 1u),
    Run(16u, 75u, 1u),
    Run(16u, 85u, 2u),
    Run(17u, 73u, 1u),
    Run(17u, 84u, 3u),
    Run(18u, 53u, 2u),
    Run(18u, 69u, 1u),
    Run(18u, 81u, 1u),
    Run(18u, 83u, 2u),
    Run(18u, 94u, 2u),
    Run(19u, 41u, 2u),
    Run(19u, 52u, 1u),
    Run(19u, 54u, 1u),
    Run(19u, 69u, 2u),
    Run(19u, 81u, 1u),
    Run(19u, 84u, 1u),
    Run(19u, 89u, 1u),
    Run(19u, 95u, 1u),
    Run(20u, 41u, 3u),
    Run(20u, 54u, 1u),
    Run(20u, 64u, 2u),
    Run(20u, 70u, 2u),
    Run(20u, 81u, 1u),
    Run(20u, 83u, 2u),
    Run(20u, 90u, 1u),
    Run(21u, 32u, 2u),
    Run(21u, 43u, 2u),
    Run(21u, 46u, 1u),
    Run(21u, 58u, 1u),
    Run(21u, 64u, 2u),
    Run(21u, 70u, 3u),
    Run(21u, 84u, 3u),
    Run(21u, 90u, 1u),
    Run(21u, 94u, 1u),
    Run(22u, 32u, 1u),
    Run(22u, 38u, 1u),
    Run(22u, 43u, 1u),
    Run(22u, 46u, 1u),
    Run(22u, 57u, 2u),
    Run(22u, 64u, 2u),
    Run(22u, 70u, 2u),
    Run(22u, 85u, 2u),
    Run(22u, 92u, 1u),
    Run(23u, 37u, 1u),
    Run(23u, 43u, 2u),
    Run(23u, 46u, 1u),
    Run(23u, 56u, 2u),
    Run(23u, 62u, 2u),
    Run(23u, 69u, 2u),
    Run(24u, 33u, 1u),
    Run(24u, 37u, 1u),
    Run(24u, 41u, 3u),
    Run(24u, 55u, 3u),
    Run(24u, 62u, 2u),
    Run(24u, 69u, 1u),
    Run(25u, 35u, 1u),
    Run(25u, 41u, 2u),
    Run(25u, 56u, 2u),
    Run(25u, 62u, 2u),
    Run(26u, 57u, 2u),
    Run(27u, 58u, 1u),
    Run(44u, 79u, 1u),
    Run(45u, 78u, 1u),
    Run(45u, 80u, 1u),
    Run(46u, 30u, 3u),
    Run(46u, 76u, 2u),
    Run(46u, 81u, 1u),
    Run(47u, 32u, 1u),
    Run(47u, 48u, 1u),
    Run(47u, 76u, 2u),
    Run(47u, 81u, 1u),
    Run(47u, 97u, 1u),
    Run(48u, 31u, 1u),
    Run(48u, 47u, 1u),
    Run(48u, 49u, 1u),
    Run(48u, 76u, 2u),
    Run(48u, 81u, 1u),
    Run(48u, 95u, 4u),
    Run(48u, 111u, 4u),
    Run(49u, 46u, 1u),
    Run(49u, 50u, 2u),
    Run(49u, 78u, 1u),
    Run(49u, 80u, 1u),
    Run(49u, 94u, 1u),
    Run(49u, 96u, 1u),
    Run(49u, 110u, 6u),
    Run(50u, 46u, 1u),
    Run(50u, 50u, 2u),
    Run(50u, 79u, 1u),
    Run(50u, 94u, 2u),
    Run(50u, 109u, 8u),
    Run(51u, 13u, 4u),
    Run(51u, 46u, 1u),
    Run(51u, 50u, 2u),
    Run(51u, 98u, 2u),
    Run(51u, 108u, 2u),
    Run(51u, 116u, 2u),
    Run(52u, 12u, 6u),
    Run(52u, 47u, 1u),
    Run(52u, 49u, 1u),
    Run(52u, 98u, 2u),
    Run(52u, 109u, 8u),
    Run(53u, 11u, 8u),
    Run(53u, 30u, 1u),
    Run(53u, 48u, 1u),
    Run(53u, 76u, 1u),
    Run(53u, 110u, 6u),
    Run(54u, 10u, 2u),
    Run(54u, 18u, 2u),
    Run(54u, 30u, 2u),
    Run(54u, 74u, 2u),
    Run(54u, 77u, 2u),
    Run(54u, 111u, 4u),
    Run(55u, 11u, 8u),
    Run(55u, 29u, 1u),
    Run(55u, 31u, 1u),
    Run(56u, 12u, 6u),
    Run(56u, 51u, 1u),
    Run(56u, 73u, 1u),
    Run(56u, 79u, 1u),
    Run(56u, 87u, 3u),
    Run(57u, 13u, 4u),
    Run(57u, 49u, 2u),
    Run(57u, 52u, 2u),
    Run(57u, 86u, 1u),
    Run(57u, 90u, 1u),
    Run(58u, 73u, 2u),
    Run(58u, 76u, 1u),
    Run(58u, 78u, 2u),
    Run(58u, 85u, 1u),
    Run(58u, 91u, 1u),
    Run(58u, 104u, 2u),
    Run(59u, 38u, 3u),
    Run(59u, 48u, 1u),
    Run(59u, 54u, 1u),
    Run(59u, 85u, 2u),
    Run(59u, 88u, 1u),
    Run(59u, 90u, 2u),
    Run(59u, 103u, 2u),
    Run(60u, 37u, 1u),
    Run(60u, 41u, 1u),
    Run(60u, 105u, 1u),
    Run(60u, 115u, 1u),
    Run(61u, 22u, 2u),
    Run(61u, 36u, 1u),
    Run(61u, 42u, 1u),
    Run(61u, 48u, 2u),
    Run(61u, 51u, 1u),
    Run(61u, 53u, 2u),
    Run(61u, 113u, 1u),
    Run(61u, 115u, 1u),
    Run(62u, 23u, 2u),
    Run(62u, 36u, 2u),
    Run(62u, 39u, 1u),
    Run(62u, 41u, 2u),
    Run(62u, 101u, 2u),
    Run(62u, 112u, 1u),
    Run(62u, 114u, 1u),
    Run(62u, 126u, 2u),
    Run(63u, 12u, 1u),
    Run(63u, 22u, 1u),
    Run(63u, 101u, 3u),
    Run(63u, 111u, 1u),
    Run(63u, 114u, 1u),
    Run(63u, 126u, 2u),
    Run(64u, 12u, 1u),
    Run(64u, 14u, 1u),
    Run(64u, 92u, 2u),
    Run(64u, 103u, 2u),
    Run(64u, 106u, 1u),
    Run(64u, 112u, 1u),
    Run(64u, 114u, 1u),
    Run(65u, 0u, 2u),
    Run(65u, 13u, 1u),
    Run(65u, 15u, 1u),
    Run(65u, 25u, 2u),
    Run(65u, 85u, 2u),
    Run(65u, 92u, 1u),
    Run(65u, 98u, 1u),
    Run(65u, 103u, 1u),
    Run(65u, 106u, 1u),
    Run(65u, 113u, 1u),
    Run(65u, 115u, 1u),
    Run(66u, 0u, 2u),
    Run(66u, 13u, 1u),
    Run(66u, 16u, 1u),
    Run(66u, 24u, 3u),
    Run(66u, 86u, 1u),
    Run(66u, 97u, 1u),
    Run(66u, 103u, 2u),
    Run(66u, 106u, 1u),
    Run(66u, 115u, 1u),
    Run(67u, 13u, 1u),
    Run(67u, 15u, 1u),
    Run(67u, 21u, 1u),
    Run(67u, 23u, 2u),
    Run(67u, 34u, 2u),
    Run(67u, 76u, 2u),
    Run(67u, 83u, 3u),
    Run(67u, 93u, 1u),
    Run(67u, 97u, 1u),
    Run(67u, 101u, 3u),
    Run(68u, 12u, 1u),
    Run(68u, 14u, 1u),
    Run(68u, 21u, 1u),
    Run(68u, 24u, 1u),
    Run(68u, 29u, 1u),
    Run(68u, 35u, 1u),
    Run(68u, 41u, 2u),
    Run(68u, 76u, 2u),
    Run(68u, 83u, 1u),
    Run(68u, 95u, 1u),
    Run(68u, 101u, 2u),
    Run(69u, 12u, 1u),
    Run(69u, 21u, 1u),
    Run(69u, 23u, 2u),
    Run(69u, 30u, 1u),
    Run(69u, 41u, 1u),
    Run(70u, 24u, 3u),
    Run(70u, 30u, 1u),
    Run(70u, 34u, 1u),
    Run(70u, 42u, 3u),
    Run(70u, 50u, 2u),
    Run(71u, 25u, 2u),
    Run(71u, 32u, 1u),
    Run(71u, 44u, 1u),
    Run(71u, 50u, 2u)
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
