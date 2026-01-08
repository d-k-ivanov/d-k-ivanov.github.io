// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 129u;
const PATTERN_HEIGHT : u32 = 92u;
const PATTERN_RUN_COUNT : u32 = 339u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from srlatchb.lif (y, x, len).
const PATTERN_RUNS : array<Run, 339> = array<Run, 339>(
    Run(0u, 92u, 2u),
    Run(1u, 91u, 1u),
    Run(1u, 93u, 1u),
    Run(2u, 93u, 1u),
    Run(7u, 76u, 2u),
    Run(8u, 76u, 1u),
    Run(8u, 84u, 3u),
    Run(9u, 69u, 1u),
    Run(9u, 74u, 1u),
    Run(9u, 76u, 1u),
    Run(9u, 86u, 1u),
    Run(10u, 68u, 1u),
    Run(10u, 70u, 1u),
    Run(10u, 74u, 2u),
    Run(10u, 85u, 1u),
    Run(11u, 51u, 2u),
    Run(11u, 67u, 1u),
    Run(11u, 71u, 2u),
    Run(12u, 51u, 1u),
    Run(12u, 53u, 1u),
    Run(12u, 67u, 1u),
    Run(12u, 71u, 2u),
    Run(13u, 52u, 3u),
    Run(13u, 67u, 1u),
    Run(13u, 71u, 2u),
    Run(14u, 53u, 3u),
    Run(14u, 68u, 1u),
    Run(14u, 70u, 1u),
    Run(15u, 52u, 3u),
    Run(15u, 62u, 1u),
    Run(15u, 69u, 1u),
    Run(15u, 77u, 2u),
    Run(16u, 44u, 2u),
    Run(16u, 51u, 1u),
    Run(16u, 53u, 1u),
    Run(16u, 63u, 2u),
    Run(16u, 76u, 1u),
    Run(16u, 78u, 1u),
    Run(17u, 43u, 1u),
    Run(17u, 45u, 1u),
    Run(17u, 51u, 2u),
    Run(17u, 62u, 2u),
    Run(17u, 78u, 1u),
    Run(18u, 43u, 1u),
    Run(19u, 42u, 2u),
    Run(20u, 57u, 2u),
    Run(21u, 58u, 1u),
    Run(21u, 77u, 2u),
    Run(22u, 58u, 1u),
    Run(22u, 60u, 1u),
    Run(22u, 77u, 1u),
    Run(22u, 79u, 1u),
    Run(23u, 59u, 2u),
    Run(23u, 70u, 1u),
    Run(23u, 72u, 1u),
    Run(23u, 80u, 1u),
    Run(24u, 69u, 1u),
    Run(24u, 71u, 1u),
    Run(24u, 73u, 2u),
    Run(24u, 77u, 1u),
    Run(24u, 80u, 1u),
    Run(25u, 66u, 1u),
    Run(25u, 69u, 1u),
    Run(25u, 71u, 1u),
    Run(25u, 80u, 1u),
    Run(26u, 66u, 2u),
    Run(26u, 77u, 1u),
    Run(26u, 79u, 1u),
    Run(26u, 86u, 2u),
    Run(27u, 65u, 1u),
    Run(27u, 67u, 1u),
    Run(27u, 77u, 2u),
    Run(27u, 86u, 1u),
    Run(27u, 88u, 1u),
    Run(28u, 88u, 1u),
    Run(29u, 67u, 2u),
    Run(29u, 88u, 2u),
    Run(30u, 67u, 2u),
    Run(31u, 67u, 1u),
    Run(31u, 69u, 1u),
    Run(33u, 58u, 2u),
    Run(34u, 59u, 2u),
    Run(35u, 58u, 1u),
    Run(37u, 61u, 2u),
    Run(37u, 75u, 2u),
    Run(37u, 86u, 2u),
    Run(37u, 95u, 2u),
    Run(38u, 62u, 1u),
    Run(38u, 74u, 2u),
    Run(38u, 85u, 1u),
    Run(38u, 87u, 1u),
    Run(38u, 96u, 1u),
    Run(39u, 40u, 1u),
    Run(39u, 50u, 2u),
    Run(39u, 62u, 1u),
    Run(39u, 64u, 1u),
    Run(39u, 69u, 1u),
    Run(39u, 76u, 1u),
    Run(39u, 84u, 3u),
    Run(39u, 96u, 1u),
    Run(39u, 98u, 1u),
    Run(40u, 39u, 1u),
    Run(40u, 41u, 1u),
    Run(40u, 49u, 4u),
    Run(40u, 63u, 2u),
    Run(40u, 68u, 1u),
    Run(40u, 70u, 1u),
    Run(40u, 83u, 3u),
    Run(40u, 97u, 2u),
    Run(41u, 38u, 1u),
    Run(41u, 40u, 2u),
    Run(41u, 47u, 3u),
    Run(41u, 52u, 1u),
    Run(41u, 55u, 1u),
    Run(41u, 57u, 1u),
    Run(41u, 66u, 2u),
    Run(41u, 71u, 1u),
    Run(41u, 84u, 3u),
    Run(42u, 37u, 2u),
    Run(42u, 40u, 2u),
    Run(42u, 51u, 2u),
    Run(42u, 55u, 1u),
    Run(42u, 58u, 1u),
    Run(42u, 66u, 2u),
    Run(42u, 71u, 1u),
    Run(42u, 85u, 1u),
    Run(42u, 87u, 1u),
    Run(42u, 93u, 2u),
    Run(43u, 38u, 1u),
    Run(43u, 40u, 2u),
    Run(43u, 48u, 1u),
    Run(43u, 58u, 2u),
    Run(43u, 66u, 2u),
    Run(43u, 71u, 1u),
    Run(43u, 86u, 2u),
    Run(43u, 93u, 1u),
    Run(43u, 95u, 1u),
    Run(44u, 34u, 2u),
    Run(44u, 39u, 1u),
    Run(44u, 41u, 1u),
    Run(44u, 47u, 1u),
    Run(44u, 56u, 1u),
    Run(44u, 60u, 2u),
    Run(44u, 68u, 1u),
    Run(44u, 70u, 1u),
    Run(44u, 95u, 1u),
    Run(45u, 33u, 1u),
    Run(45u, 35u, 1u),
    Run(45u, 40u, 1u),
    Run(45u, 47u, 1u),
    Run(45u, 58u, 2u),
    Run(45u, 69u, 1u),
    Run(45u, 95u, 2u),
    Run(46u, 33u, 1u),
    Run(46u, 55u, 1u),
    Run(46u, 58u, 1u),
    Run(46u, 64u, 2u),
    Run(47u, 32u, 2u),
    Run(47u, 55u, 1u),
    Run(47u, 57u, 1u),
    Run(47u, 64u, 1u),
    Run(47u, 66u, 1u),
    Run(48u, 66u, 1u),
    Run(49u, 66u, 2u),
    Run(65u, 82u, 1u),
    Run(66u, 80u, 1u),
    Run(66u, 82u, 1u),
    Run(67u, 44u, 2u),
    Run(67u, 78u, 2u),
    Run(68u, 28u, 2u),
    Run(68u, 44u, 1u),
    Run(68u, 47u, 1u),
    Run(68u, 78u, 2u),
    Run(69u, 29u, 2u),
    Run(69u, 48u, 1u),
    Run(69u, 78u, 2u),
    Run(70u, 28u, 1u),
    Run(70u, 48u, 1u),
    Run(70u, 80u, 1u),
    Run(70u, 82u, 1u),
    Run(71u, 38u, 1u),
    Run(71u, 48u, 1u),
    Run(71u, 82u, 1u),
    Run(71u, 98u, 3u),
    Run(71u, 111u, 1u),
    Run(71u, 116u, 1u),
    Run(72u, 38u, 1u),
    Run(72u, 44u, 1u),
    Run(72u, 47u, 1u),
    Run(72u, 97u, 1u),
    Run(72u, 100u, 1u),
    Run(72u, 109u, 2u),
    Run(72u, 112u, 4u),
    Run(72u, 117u, 2u),
    Run(73u, 9u, 1u),
    Run(73u, 12u, 1u),
    Run(73u, 17u, 1u),
    Run(73u, 20u, 1u),
    Run(73u, 44u, 2u),
    Run(73u, 96u, 1u),
    Run(73u, 100u, 1u),
    Run(73u, 111u, 1u),
    Run(73u, 116u, 1u),
    Run(74u, 7u, 3u),
    Run(74u, 12u, 6u),
    Run(74u, 20u, 3u),
    Run(74u, 37u, 1u),
    Run(74u, 96u, 3u),
    Run(75u, 9u, 1u),
    Run(75u, 12u, 1u),
    Run(75u, 17u, 1u),
    Run(75u, 20u, 1u),
    Run(75u, 38u, 1u),
    Run(75u, 76u, 3u),
    Run(76u, 27u, 3u),
    Run(76u, 38u, 1u),
    Run(76u, 96u, 1u),
    Run(76u, 99u, 1u),
    Run(77u, 29u, 1u),
    Run(77u, 76u, 1u),
    Run(77u, 78u, 1u),
    Run(77u, 96u, 1u),
    Run(78u, 28u, 1u),
    Run(78u, 75u, 5u),
    Run(78u, 89u, 1u),
    Run(78u, 97u, 3u),
    Run(79u, 74u, 2u),
    Run(79u, 79u, 2u),
    Run(79u, 88u, 3u),
    Run(80u, 36u, 2u),
    Run(80u, 41u, 2u),
    Run(80u, 50u, 3u),
    Run(80u, 74u, 2u),
    Run(80u, 79u, 2u),
    Run(80u, 87u, 5u),
    Run(80u, 105u, 3u),
    Run(81u, 37u, 5u),
    Run(81u, 49u, 1u),
    Run(81u, 53u, 1u),
    Run(81u, 86u, 2u),
    Run(81u, 91u, 2u),
    Run(81u, 105u, 1u),
    Run(81u, 118u, 1u),
    Run(82u, 37u, 2u),
    Run(82u, 40u, 2u),
    Run(82u, 48u, 1u),
    Run(82u, 54u, 1u),
    Run(82u, 87u, 5u),
    Run(82u, 106u, 1u),
    Run(82u, 115u, 4u),
    Run(83u, 9u, 2u),
    Run(83u, 20u, 2u),
    Run(83u, 37u, 2u),
    Run(83u, 40u, 2u),
    Run(83u, 48u, 1u),
    Run(83u, 54u, 1u),
    Run(83u, 77u, 1u),
    Run(83u, 87u, 1u),
    Run(83u, 91u, 1u),
    Run(83u, 102u, 2u),
    Run(83u, 114u, 4u),
    Run(83u, 127u, 2u),
    Run(84u, 9u, 1u),
    Run(84u, 11u, 1u),
    Run(84u, 19u, 1u),
    Run(84u, 21u, 1u),
    Run(84u, 38u, 3u),
    Run(84u, 51u, 1u),
    Run(84u, 75u, 2u),
    Run(84u, 88u, 1u),
    Run(84u, 90u, 1u),
    Run(84u, 102u, 1u),
    Run(84u, 104u, 1u),
    Run(84u, 114u, 1u),
    Run(84u, 117u, 1u),
    Run(84u, 127u, 2u),
    Run(85u, 0u, 2u),
    Run(85u, 4u, 2u),
    Run(85u, 12u, 1u),
    Run(85u, 21u, 1u),
    Run(85u, 27u, 1u),
    Run(85u, 49u, 1u),
    Run(85u, 53u, 1u),
    Run(85u, 87u, 3u),
    Run(85u, 93u, 3u),
    Run(85u, 97u, 2u),
    Run(85u, 103u, 3u),
    Run(85u, 114u, 4u),
    Run(85u, 123u, 1u),
    Run(86u, 0u, 2u),
    Run(86u, 3u, 1u),
    Run(86u, 6u, 1u),
    Run(86u, 9u, 1u),
    Run(86u, 12u, 1u),
    Run(86u, 26u, 1u),
    Run(86u, 28u, 1u),
    Run(86u, 50u, 3u),
    Run(86u, 74u, 1u),
    Run(86u, 86u, 2u),
    Run(86u, 93u, 4u),
    Run(86u, 99u, 1u),
    Run(86u, 104u, 3u),
    Run(86u, 115u, 4u),
    Run(86u, 123u, 1u),
    Run(87u, 4u, 2u),
    Run(87u, 12u, 1u),
    Run(87u, 26u, 2u),
    Run(87u, 29u, 1u),
    Run(87u, 34u, 2u),
    Run(87u, 51u, 1u),
    Run(87u, 87u, 1u),
    Run(87u, 97u, 2u),
    Run(87u, 103u, 3u),
    Run(87u, 118u, 1u),
    Run(88u, 9u, 1u),
    Run(88u, 11u, 1u),
    Run(88u, 26u, 2u),
    Run(88u, 29u, 2u),
    Run(88u, 34u, 2u),
    Run(88u, 41u, 2u),
    Run(88u, 75u, 1u),
    Run(88u, 78u, 1u),
    Run(88u, 84u, 3u),
    Run(88u, 102u, 1u),
    Run(88u, 104u, 1u),
    Run(89u, 9u, 2u),
    Run(89u, 26u, 2u),
    Run(89u, 29u, 1u),
    Run(89u, 41u, 1u),
    Run(89u, 77u, 2u),
    Run(89u, 84u, 1u),
    Run(89u, 102u, 2u),
    Run(90u, 26u, 1u),
    Run(90u, 28u, 1u),
    Run(90u, 42u, 3u),
    Run(90u, 50u, 2u),
    Run(91u, 27u, 1u),
    Run(91u, 44u, 1u),
    Run(91u, 50u, 2u)
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
