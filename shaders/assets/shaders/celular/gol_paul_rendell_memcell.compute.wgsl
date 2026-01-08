// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 79u;
const PATTERN_HEIGHT : u32 = 107u;
const PATTERN_RUN_COUNT : u32 = 214u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from memcell.lif (y, x, len).
const PATTERN_RUNS : array<Run, 214> = array<Run, 214>(
    Run(0u, 68u, 1u),
    Run(1u, 68u, 1u),
    Run(3u, 68u, 1u),
    Run(4u, 67u, 1u),
    Run(4u, 69u, 1u),
    Run(6u, 67u, 3u),
    Run(9u, 67u, 3u),
    Run(11u, 67u, 1u),
    Run(11u, 69u, 1u),
    Run(12u, 68u, 1u),
    Run(14u, 68u, 1u),
    Run(15u, 68u, 1u),
    Run(19u, 1u, 5u),
    Run(20u, 0u, 1u),
    Run(20u, 5u, 1u),
    Run(21u, 5u, 1u),
    Run(22u, 0u, 1u),
    Run(22u, 4u, 1u),
    Run(23u, 2u, 1u),
    Run(26u, 33u, 1u),
    Run(27u, 32u, 1u),
    Run(27u, 34u, 1u),
    Run(28u, 15u, 2u),
    Run(28u, 31u, 1u),
    Run(28u, 35u, 2u),
    Run(29u, 15u, 1u),
    Run(29u, 17u, 1u),
    Run(29u, 31u, 1u),
    Run(29u, 35u, 2u),
    Run(29u, 40u, 2u),
    Run(30u, 10u, 2u),
    Run(30u, 16u, 3u),
    Run(30u, 31u, 1u),
    Run(30u, 35u, 2u),
    Run(30u, 40u, 2u),
    Run(31u, 6u, 4u),
    Run(31u, 12u, 1u),
    Run(31u, 17u, 3u),
    Run(31u, 32u, 1u),
    Run(31u, 34u, 1u),
    Run(32u, 6u, 3u),
    Run(32u, 10u, 2u),
    Run(32u, 16u, 3u),
    Run(32u, 26u, 1u),
    Run(32u, 33u, 1u),
    Run(33u, 15u, 1u),
    Run(33u, 17u, 1u),
    Run(33u, 27u, 2u),
    Run(34u, 15u, 2u),
    Run(34u, 26u, 2u),
    Run(40u, 33u, 1u),
    Run(40u, 35u, 1u),
    Run(41u, 34u, 2u),
    Run(42u, 15u, 1u),
    Run(42u, 34u, 1u),
    Run(43u, 15u, 3u),
    Run(44u, 18u, 1u),
    Run(44u, 46u, 2u),
    Run(45u, 17u, 2u),
    Run(45u, 46u, 1u),
    Run(45u, 48u, 1u),
    Run(46u, 48u, 1u),
    Run(47u, 41u, 1u),
    Run(47u, 48u, 2u),
    Run(48u, 42u, 2u),
    Run(49u, 41u, 2u),
    Run(51u, 17u, 2u),
    Run(51u, 22u, 2u),
    Run(51u, 27u, 1u),
    Run(52u, 17u, 1u),
    Run(52u, 19u, 1u),
    Run(52u, 21u, 1u),
    Run(52u, 23u, 1u),
    Run(52u, 27u, 3u),
    Run(53u, 18u, 5u),
    Run(53u, 30u, 1u),
    Run(54u, 19u, 3u),
    Run(54u, 29u, 2u),
    Run(55u, 20u, 1u),
    Run(57u, 44u, 2u),
    Run(58u, 43u, 1u),
    Run(58u, 45u, 1u),
    Run(58u, 51u, 2u),
    Run(59u, 45u, 1u),
    Run(59u, 51u, 1u),
    Run(60u, 29u, 2u),
    Run(60u, 34u, 2u),
    Run(60u, 52u, 3u),
    Run(61u, 29u, 2u),
    Run(61u, 34u, 2u),
    Run(61u, 54u, 1u),
    Run(62u, 21u, 1u),
    Run(62u, 23u, 1u),
    Run(63u, 22u, 2u),
    Run(63u, 31u, 3u),
    Run(64u, 22u, 1u),
    Run(64u, 31u, 3u),
    Run(65u, 32u, 1u),
    Run(65u, 36u, 3u),
    Run(66u, 38u, 1u),
    Run(66u, 54u, 1u),
    Run(67u, 17u, 3u),
    Run(67u, 37u, 1u),
    Run(67u, 52u, 3u),
    Run(68u, 16u, 1u),
    Run(68u, 20u, 1u),
    Run(68u, 51u, 1u),
    Run(69u, 15u, 1u),
    Run(69u, 21u, 1u),
    Run(69u, 27u, 1u),
    Run(69u, 29u, 1u),
    Run(69u, 51u, 2u),
    Run(70u, 16u, 1u),
    Run(70u, 20u, 1u),
    Run(70u, 26u, 1u),
    Run(70u, 29u, 1u),
    Run(71u, 17u, 3u),
    Run(71u, 27u, 1u),
    Run(72u, 17u, 3u),
    Run(72u, 28u, 1u),
    Run(72u, 35u, 2u),
    Run(73u, 34u, 2u),
    Run(74u, 15u, 2u),
    Run(74u, 36u, 1u),
    Run(75u, 16u, 1u),
    Run(76u, 13u, 3u),
    Run(76u, 20u, 1u),
    Run(76u, 26u, 2u),
    Run(76u, 31u, 2u),
    Run(77u, 13u, 1u),
    Run(77u, 19u, 1u),
    Run(77u, 26u, 2u),
    Run(77u, 31u, 2u),
    Run(77u, 46u, 2u),
    Run(77u, 49u, 1u),
    Run(77u, 51u, 2u),
    Run(78u, 9u, 1u),
    Run(78u, 19u, 3u),
    Run(78u, 27u, 5u),
    Run(79u, 9u, 3u),
    Run(79u, 28u, 1u),
    Run(79u, 30u, 1u),
    Run(79u, 43u, 1u),
    Run(79u, 46u, 1u),
    Run(79u, 52u, 1u),
    Run(80u, 12u, 1u),
    Run(80u, 42u, 2u),
    Run(81u, 11u, 2u),
    Run(81u, 28u, 3u),
    Run(81u, 42u, 1u),
    Run(81u, 44u, 1u),
    Run(81u, 47u, 2u),
    Run(81u, 50u, 2u),
    Run(82u, 49u, 1u),
    Run(85u, 14u, 1u),
    Run(85u, 19u, 1u),
    Run(85u, 31u, 2u),
    Run(86u, 14u, 1u),
    Run(86u, 20u, 2u),
    Run(86u, 31u, 1u),
    Run(86u, 51u, 2u),
    Run(87u, 13u, 1u),
    Run(87u, 15u, 1u),
    Run(87u, 19u, 2u),
    Run(87u, 32u, 3u),
    Run(87u, 51u, 1u),
    Run(88u, 12u, 2u),
    Run(88u, 15u, 2u),
    Run(88u, 34u, 1u),
    Run(88u, 43u, 2u),
    Run(88u, 52u, 3u),
    Run(89u, 11u, 1u),
    Run(89u, 17u, 1u),
    Run(89u, 42u, 1u),
    Run(89u, 44u, 1u),
    Run(89u, 54u, 1u),
    Run(90u, 14u, 1u),
    Run(90u, 44u, 1u),
    Run(91u, 11u, 2u),
    Run(91u, 16u, 2u),
    Run(93u, 26u, 1u),
    Run(93u, 28u, 1u),
    Run(94u, 27u, 2u),
    Run(95u, 27u, 1u),
    Run(96u, 50u, 2u),
    Run(97u, 50u, 1u),
    Run(98u, 16u, 2u),
    Run(98u, 41u, 2u),
    Run(98u, 48u, 1u),
    Run(98u, 50u, 1u),
    Run(98u, 77u, 1u),
    Run(99u, 16u, 1u),
    Run(99u, 40u, 1u),
    Run(99u, 42u, 1u),
    Run(99u, 48u, 2u),
    Run(99u, 76u, 3u),
    Run(100u, 17u, 3u),
    Run(100u, 39u, 1u),
    Run(100u, 75u, 2u),
    Run(100u, 78u, 1u),
    Run(101u, 19u, 1u),
    Run(101u, 39u, 1u),
    Run(101u, 42u, 1u),
    Run(101u, 75u, 3u),
    Run(102u, 39u, 1u),
    Run(102u, 76u, 2u),
    Run(103u, 31u, 2u),
    Run(103u, 40u, 1u),
    Run(103u, 42u, 1u),
    Run(104u, 30u, 1u),
    Run(104u, 32u, 1u),
    Run(104u, 41u, 2u),
    Run(105u, 30u, 1u),
    Run(106u, 29u, 2u)
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
