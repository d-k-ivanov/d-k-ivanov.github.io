// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 75u;
const PATTERN_HEIGHT : u32 = 90u;
const PATTERN_RUN_COUNT : u32 = 203u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from metamwss.lif (y, x, len).
const PATTERN_RUNS : array<Run, 203> = array<Run, 203>(
    Run(0u, 68u, 2u),
    Run(1u, 68u, 2u),
    Run(4u, 69u, 1u),
    Run(5u, 68u, 3u),
    Run(6u, 67u, 1u),
    Run(6u, 71u, 1u),
    Run(7u, 69u, 1u),
    Run(8u, 57u, 1u),
    Run(8u, 66u, 1u),
    Run(8u, 72u, 1u),
    Run(9u, 56u, 3u),
    Run(9u, 66u, 1u),
    Run(9u, 72u, 1u),
    Run(10u, 55u, 1u),
    Run(10u, 57u, 1u),
    Run(10u, 59u, 1u),
    Run(10u, 67u, 1u),
    Run(10u, 71u, 1u),
    Run(11u, 55u, 1u),
    Run(11u, 57u, 1u),
    Run(11u, 59u, 1u),
    Run(11u, 68u, 3u),
    Run(12u, 56u, 3u),
    Run(13u, 57u, 1u),
    Run(16u, 57u, 1u),
    Run(16u, 67u, 1u),
    Run(17u, 56u, 3u),
    Run(18u, 55u, 1u),
    Run(18u, 57u, 1u),
    Run(18u, 59u, 1u),
    Run(19u, 55u, 1u),
    Run(19u, 57u, 1u),
    Run(19u, 59u, 1u),
    Run(19u, 67u, 1u),
    Run(20u, 56u, 3u),
    Run(20u, 67u, 1u),
    Run(20u, 69u, 1u),
    Run(21u, 57u, 1u),
    Run(21u, 67u, 2u),
    Run(25u, 68u, 2u),
    Run(25u, 73u, 2u),
    Run(26u, 60u, 1u),
    Run(27u, 59u, 1u),
    Run(27u, 69u, 1u),
    Run(27u, 73u, 1u),
    Run(28u, 59u, 3u),
    Run(28u, 70u, 3u),
    Run(29u, 70u, 3u),
    Run(33u, 51u, 2u),
    Run(34u, 51u, 2u),
    Run(34u, 70u, 2u),
    Run(35u, 70u, 2u),
    Run(36u, 62u, 2u),
    Run(37u, 8u, 2u),
    Run(37u, 55u, 3u),
    Run(37u, 62u, 3u),
    Run(38u, 8u, 2u),
    Run(38u, 55u, 4u),
    Run(38u, 64u, 2u),
    Run(38u, 67u, 1u),
    Run(39u, 8u, 2u),
    Run(39u, 53u, 1u),
    Run(39u, 55u, 1u),
    Run(39u, 59u, 1u),
    Run(39u, 64u, 1u),
    Run(39u, 67u, 1u),
    Run(40u, 8u, 1u),
    Run(40u, 58u, 1u),
    Run(40u, 64u, 2u),
    Run(40u, 67u, 1u),
    Run(41u, 7u, 1u),
    Run(41u, 9u, 1u),
    Run(41u, 62u, 3u),
    Run(41u, 71u, 2u),
    Run(42u, 7u, 1u),
    Run(42u, 9u, 1u),
    Run(42u, 62u, 2u),
    Run(42u, 71u, 1u),
    Run(42u, 73u, 1u),
    Run(43u, 8u, 1u),
    Run(43u, 73u, 1u),
    Run(44u, 50u, 2u),
    Run(44u, 53u, 1u),
    Run(44u, 55u, 2u),
    Run(44u, 73u, 2u),
    Run(45u, 50u, 1u),
    Run(45u, 56u, 1u),
    Run(46u, 5u, 2u),
    Run(46u, 10u, 2u),
    Run(46u, 51u, 1u),
    Run(46u, 55u, 1u),
    Run(47u, 5u, 1u),
    Run(47u, 7u, 1u),
    Run(47u, 9u, 1u),
    Run(47u, 11u, 1u),
    Run(47u, 52u, 3u),
    Run(48u, 6u, 5u),
    Run(48u, 66u, 1u),
    Run(49u, 7u, 3u),
    Run(49u, 65u, 1u),
    Run(49u, 67u, 1u),
    Run(50u, 8u, 1u),
    Run(50u, 29u, 1u),
    Run(50u, 31u, 1u),
    Run(50u, 64u, 1u),
    Run(50u, 68u, 2u),
    Run(50u, 73u, 2u),
    Run(51u, 29u, 2u),
    Run(51u, 37u, 1u),
    Run(51u, 64u, 1u),
    Run(51u, 68u, 2u),
    Run(51u, 73u, 2u),
    Run(52u, 14u, 2u),
    Run(52u, 30u, 1u),
    Run(52u, 35u, 3u),
    Run(52u, 64u, 1u),
    Run(52u, 68u, 2u),
    Run(53u, 15u, 1u),
    Run(53u, 34u, 1u),
    Run(53u, 65u, 1u),
    Run(53u, 67u, 1u),
    Run(54u, 15u, 1u),
    Run(54u, 17u, 1u),
    Run(54u, 34u, 2u),
    Run(54u, 66u, 1u),
    Run(55u, 16u, 2u),
    Run(57u, 9u, 1u),
    Run(57u, 11u, 1u),
    Run(58u, 10u, 2u),
    Run(58u, 31u, 3u),
    Run(59u, 10u, 1u),
    Run(60u, 31u, 1u),
    Run(60u, 33u, 1u),
    Run(61u, 30u, 5u),
    Run(62u, 5u, 3u),
    Run(62u, 29u, 2u),
    Run(62u, 34u, 2u),
    Run(63u, 4u, 1u),
    Run(63u, 8u, 1u),
    Run(63u, 29u, 2u),
    Run(63u, 34u, 2u),
    Run(64u, 3u, 1u),
    Run(64u, 9u, 1u),
    Run(64u, 17u, 1u),
    Run(65u, 4u, 1u),
    Run(65u, 8u, 1u),
    Run(65u, 18u, 2u),
    Run(66u, 5u, 3u),
    Run(66u, 17u, 2u),
    Run(66u, 29u, 2u),
    Run(67u, 5u, 3u),
    Run(67u, 27u, 2u),
    Run(67u, 30u, 1u),
    Run(68u, 27u, 1u),
    Run(69u, 9u, 2u),
    Run(69u, 19u, 2u),
    Run(70u, 2u, 3u),
    Run(70u, 9u, 2u),
    Run(70u, 19u, 2u),
    Run(70u, 28u, 3u),
    Run(70u, 32u, 1u),
    Run(71u, 1u, 5u),
    Run(71u, 12u, 2u),
    Run(71u, 32u, 1u),
    Run(72u, 0u, 1u),
    Run(72u, 2u, 1u),
    Run(72u, 6u, 1u),
    Run(72u, 12u, 3u),
    Run(72u, 32u, 1u),
    Run(73u, 0u, 2u),
    Run(73u, 5u, 1u),
    Run(73u, 12u, 2u),
    Run(74u, 9u, 2u),
    Run(75u, 9u, 2u),
    Run(76u, 19u, 3u),
    Run(77u, 18u, 1u),
    Run(77u, 22u, 1u),
    Run(77u, 27u, 2u),
    Run(77u, 32u, 2u),
    Run(78u, 29u, 3u),
    Run(79u, 17u, 1u),
    Run(79u, 23u, 1u),
    Run(79u, 28u, 1u),
    Run(79u, 32u, 1u),
    Run(80u, 17u, 2u),
    Run(80u, 22u, 2u),
    Run(80u, 29u, 1u),
    Run(80u, 31u, 1u),
    Run(81u, 30u, 1u),
    Run(83u, 20u, 1u),
    Run(83u, 27u, 2u),
    Run(84u, 19u, 1u),
    Run(84u, 21u, 1u),
    Run(84u, 28u, 1u),
    Run(85u, 19u, 1u),
    Run(85u, 21u, 1u),
    Run(85u, 25u, 3u),
    Run(86u, 19u, 1u),
    Run(86u, 25u, 1u),
    Run(87u, 19u, 1u),
    Run(88u, 19u, 1u),
    Run(88u, 22u, 1u),
    Run(89u, 20u, 2u)
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
