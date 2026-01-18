// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 157u;
const PATTERN_HEIGHT : u32 = 139u;
const PATTERN_RUN_COUNT : u32 = 223u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from notxor.lif (y, x, len).
const PATTERN_RUNS : array<Run, 223> = array<Run, 223>(
    Run(0u, 26u, 2u),
    Run(1u, 25u, 1u),
    Run(1u, 27u, 1u),
    Run(2u, 10u, 1u),
    Run(2u, 12u, 1u),
    Run(2u, 24u, 1u),
    Run(3u, 10u, 1u),
    Run(3u, 13u, 1u),
    Run(3u, 24u, 1u),
    Run(3u, 27u, 1u),
    Run(4u, 13u, 2u),
    Run(4u, 24u, 1u),
    Run(5u, 11u, 1u),
    Run(5u, 15u, 2u),
    Run(5u, 25u, 1u),
    Run(5u, 27u, 1u),
    Run(5u, 33u, 2u),
    Run(6u, 13u, 2u),
    Run(6u, 26u, 2u),
    Run(6u, 33u, 1u),
    Run(6u, 35u, 1u),
    Run(7u, 3u, 2u),
    Run(7u, 10u, 1u),
    Run(7u, 13u, 1u),
    Run(7u, 22u, 1u),
    Run(7u, 35u, 1u),
    Run(8u, 2u, 1u),
    Run(8u, 4u, 1u),
    Run(8u, 10u, 1u),
    Run(8u, 12u, 1u),
    Run(8u, 23u, 2u),
    Run(8u, 35u, 2u),
    Run(9u, 2u, 1u),
    Run(9u, 22u, 2u),
    Run(10u, 1u, 2u),
    Run(11u, 17u, 2u),
    Run(12u, 16u, 1u),
    Run(12u, 18u, 1u),
    Run(13u, 6u, 2u),
    Run(13u, 15u, 1u),
    Run(13u, 22u, 2u),
    Run(14u, 6u, 2u),
    Run(14u, 15u, 1u),
    Run(14u, 18u, 1u),
    Run(14u, 21u, 1u),
    Run(14u, 24u, 1u),
    Run(15u, 15u, 1u),
    Run(15u, 22u, 2u),
    Run(15u, 29u, 1u),
    Run(15u, 31u, 1u),
    Run(16u, 16u, 1u),
    Run(16u, 18u, 1u),
    Run(16u, 30u, 2u),
    Run(17u, 17u, 2u),
    Run(17u, 30u, 1u),
    Run(18u, 55u, 1u),
    Run(19u, 0u, 2u),
    Run(19u, 53u, 3u),
    Run(20u, 1u, 1u),
    Run(20u, 52u, 1u),
    Run(21u, 1u, 1u),
    Run(21u, 3u, 1u),
    Run(21u, 13u, 1u),
    Run(21u, 52u, 2u),
    Run(22u, 2u, 2u),
    Run(22u, 12u, 1u),
    Run(22u, 14u, 1u),
    Run(23u, 11u, 1u),
    Run(23u, 15u, 2u),
    Run(23u, 25u, 1u),
    Run(24u, 11u, 1u),
    Run(24u, 15u, 2u),
    Run(24u, 22u, 4u),
    Run(25u, 11u, 1u),
    Run(25u, 15u, 2u),
    Run(25u, 21u, 4u),
    Run(26u, 12u, 1u),
    Run(26u, 14u, 1u),
    Run(26u, 21u, 1u),
    Run(26u, 24u, 1u),
    Run(27u, 13u, 1u),
    Run(27u, 21u, 4u),
    Run(28u, 22u, 4u),
    Run(28u, 32u, 2u),
    Run(29u, 25u, 1u),
    Run(29u, 32u, 1u),
    Run(29u, 34u, 1u),
    Run(30u, 34u, 1u),
    Run(31u, 34u, 2u),
    Run(37u, 52u, 1u),
    Run(38u, 53u, 2u),
    Run(39u, 52u, 2u),
    Run(60u, 74u, 1u),
    Run(60u, 76u, 1u),
    Run(60u, 102u, 2u),
    Run(61u, 75u, 2u),
    Run(61u, 101u, 1u),
    Run(61u, 103u, 1u),
    Run(62u, 75u, 1u),
    Run(62u, 103u, 1u),
    Run(68u, 94u, 3u),
    Run(69u, 96u, 1u),
    Run(70u, 95u, 1u),
    Run(75u, 87u, 2u),
    Run(76u, 86u, 1u),
    Run(76u, 88u, 1u),
    Run(77u, 88u, 1u),
    Run(80u, 60u, 2u),
    Run(81u, 61u, 1u),
    Run(81u, 96u, 2u),
    Run(82u, 61u, 1u),
    Run(82u, 63u, 2u),
    Run(82u, 68u, 2u),
    Run(82u, 95u, 2u),
    Run(83u, 62u, 1u),
    Run(83u, 66u, 1u),
    Run(83u, 70u, 1u),
    Run(83u, 76u, 1u),
    Run(83u, 79u, 3u),
    Run(83u, 97u, 1u),
    Run(84u, 71u, 1u),
    Run(84u, 81u, 1u),
    Run(84u, 85u, 1u),
    Run(85u, 64u, 1u),
    Run(85u, 67u, 1u),
    Run(85u, 71u, 1u),
    Run(85u, 80u, 1u),
    Run(85u, 85u, 1u),
    Run(85u, 87u, 1u),
    Run(86u, 65u, 1u),
    Run(86u, 71u, 1u),
    Run(86u, 88u, 2u),
    Run(87u, 66u, 1u),
    Run(87u, 70u, 1u),
    Run(87u, 88u, 2u),
    Run(88u, 68u, 2u),
    Run(88u, 88u, 2u),
    Run(89u, 85u, 1u),
    Run(89u, 87u, 1u),
    Run(89u, 92u, 2u),
    Run(90u, 85u, 1u),
    Run(90u, 92u, 1u),
    Run(90u, 94u, 1u),
    Run(91u, 94u, 1u),
    Run(92u, 94u, 2u),
    Run(96u, 111u, 2u),
    Run(97u, 110u, 2u),
    Run(98u, 112u, 1u),
    Run(111u, 126u, 2u),
    Run(112u, 125u, 2u),
    Run(113u, 127u, 1u),
    Run(115u, 144u, 2u),
    Run(116u, 135u, 2u),
    Run(116u, 144u, 1u),
    Run(116u, 146u, 1u),
    Run(117u, 134u, 1u),
    Run(117u, 136u, 1u),
    Run(117u, 147u, 1u),
    Run(118u, 136u, 2u),
    Run(118u, 139u, 1u),
    Run(118u, 144u, 1u),
    Run(118u, 147u, 1u),
    Run(119u, 137u, 1u),
    Run(119u, 139u, 1u),
    Run(119u, 147u, 1u),
    Run(120u, 137u, 2u),
    Run(120u, 144u, 1u),
    Run(120u, 146u, 1u),
    Run(120u, 153u, 2u),
    Run(121u, 137u, 2u),
    Run(121u, 144u, 2u),
    Run(121u, 153u, 1u),
    Run(121u, 155u, 1u),
    Run(122u, 138u, 2u),
    Run(122u, 155u, 1u),
    Run(123u, 138u, 2u),
    Run(123u, 155u, 2u),
    Run(124u, 127u, 3u),
    Run(125u, 129u, 1u),
    Run(126u, 128u, 1u),
    Run(126u, 136u, 2u),
    Run(126u, 141u, 2u),
    Run(127u, 136u, 1u),
    Run(127u, 138u, 1u),
    Run(127u, 140u, 1u),
    Run(127u, 142u, 1u),
    Run(128u, 114u, 2u),
    Run(128u, 137u, 5u),
    Run(129u, 114u, 2u),
    Run(129u, 120u, 1u),
    Run(129u, 138u, 3u),
    Run(130u, 111u, 2u),
    Run(130u, 119u, 5u),
    Run(130u, 125u, 2u),
    Run(130u, 139u, 1u),
    Run(131u, 110u, 3u),
    Run(131u, 118u, 1u),
    Run(131u, 121u, 2u),
    Run(131u, 127u, 1u),
    Run(132u, 111u, 2u),
    Run(132u, 118u, 2u),
    Run(132u, 128u, 1u),
    Run(133u, 105u, 2u),
    Run(133u, 114u, 2u),
    Run(133u, 120u, 1u),
    Run(133u, 128u, 1u),
    Run(134u, 104u, 1u),
    Run(134u, 106u, 1u),
    Run(134u, 114u, 2u),
    Run(134u, 128u, 1u),
    Run(135u, 104u, 1u),
    Run(135u, 127u, 1u),
    Run(135u, 135u, 2u),
    Run(135u, 141u, 2u),
    Run(136u, 103u, 2u),
    Run(136u, 125u, 2u),
    Run(136u, 135u, 1u),
    Run(136u, 137u, 1u),
    Run(136u, 141u, 1u),
    Run(137u, 137u, 1u),
    Run(137u, 142u, 3u),
    Run(138u, 137u, 2u),
    Run(138u, 144u, 1u)
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
