// Author: Paul Rendell
// Author's Website: http://rendell-attic.org/gol/tm.htm
// LIF archive: https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip

const COMPUTE_FRAME_INTERVAL : u32 = 3u;

const PATTERN_WIDTH : u32 = 107u;
const PATTERN_HEIGHT : u32 = 70u;
const PATTERN_RUN_COUNT : u32 = 185u;

struct Run
{
    y : u32,
    x : u32,
    len : u32,
};

// Run-length encoded live cell spans from tmp/gol-components/gap4.lif (y, x, len).
const PATTERN_RUNS : array<Run, 185> = array<Run, 185>(
    Run(0u, 7u, 2u),
    Run(0u, 97u, 1u),
    Run(1u, 6u, 2u),
    Run(1u, 97u, 2u),
    Run(2u, 8u, 1u),
    Run(2u, 96u, 1u),
    Run(2u, 98u, 1u),
    Run(7u, 0u, 3u),
    Run(7u, 15u, 1u),
    Run(7u, 103u, 3u),
    Run(8u, 2u, 1u),
    Run(8u, 14u, 2u),
    Run(8u, 89u, 2u),
    Run(8u, 103u, 1u),
    Run(9u, 1u, 1u),
    Run(9u, 14u, 1u),
    Run(9u, 16u, 1u),
    Run(9u, 90u, 2u),
    Run(9u, 104u, 1u),
    Run(10u, 89u, 1u),
    Run(15u, 22u, 2u),
    Run(15u, 82u, 1u),
    Run(16u, 21u, 2u),
    Run(16u, 82u, 2u),
    Run(17u, 23u, 1u),
    Run(17u, 81u, 1u),
    Run(17u, 83u, 1u),
    Run(21u, 30u, 2u),
    Run(21u, 41u, 1u),
    Run(21u, 66u, 1u),
    Run(21u, 74u, 1u),
    Run(22u, 29u, 4u),
    Run(22u, 40u, 1u),
    Run(22u, 42u, 1u),
    Run(22u, 64u, 1u),
    Run(22u, 66u, 1u),
    Run(22u, 72u, 4u),
    Run(23u, 24u, 1u),
    Run(23u, 26u, 1u),
    Run(23u, 29u, 1u),
    Run(23u, 32u, 3u),
    Run(23u, 40u, 2u),
    Run(23u, 43u, 1u),
    Run(23u, 62u, 2u),
    Run(23u, 72u, 2u),
    Run(23u, 76u, 1u),
    Run(23u, 79u, 2u),
    Run(24u, 23u, 1u),
    Run(24u, 26u, 1u),
    Run(24u, 29u, 2u),
    Run(24u, 40u, 2u),
    Run(24u, 43u, 2u),
    Run(24u, 48u, 2u),
    Run(24u, 56u, 2u),
    Run(24u, 62u, 2u),
    Run(24u, 75u, 2u),
    Run(24u, 79u, 2u),
    Run(25u, 22u, 2u),
    Run(25u, 33u, 1u),
    Run(25u, 40u, 2u),
    Run(25u, 43u, 1u),
    Run(25u, 48u, 2u),
    Run(25u, 56u, 2u),
    Run(25u, 62u, 2u),
    Run(25u, 71u, 1u),
    Run(25u, 82u, 2u),
    Run(26u, 14u, 2u),
    Run(26u, 20u, 2u),
    Run(26u, 25u, 1u),
    Run(26u, 34u, 1u),
    Run(26u, 40u, 1u),
    Run(26u, 42u, 1u),
    Run(26u, 64u, 1u),
    Run(26u, 66u, 1u),
    Run(26u, 71u, 1u),
    Run(26u, 82u, 3u),
    Run(26u, 90u, 2u),
    Run(27u, 14u, 2u),
    Run(27u, 22u, 2u),
    Run(27u, 34u, 1u),
    Run(27u, 41u, 1u),
    Run(27u, 66u, 1u),
    Run(27u, 71u, 1u),
    Run(27u, 82u, 2u),
    Run(27u, 90u, 2u),
    Run(28u, 23u, 1u),
    Run(28u, 26u, 1u),
    Run(28u, 79u, 2u),
    Run(29u, 24u, 1u),
    Run(29u, 26u, 1u),
    Run(29u, 79u, 2u),
    Run(35u, 24u, 1u),
    Run(35u, 79u, 1u),
    Run(36u, 23u, 1u),
    Run(36u, 25u, 1u),
    Run(36u, 78u, 1u),
    Run(36u, 80u, 1u),
    Run(37u, 16u, 2u),
    Run(37u, 22u, 1u),
    Run(37u, 24u, 2u),
    Run(37u, 41u, 2u),
    Run(37u, 68u, 2u),
    Run(37u, 77u, 1u),
    Run(37u, 79u, 2u),
    Run(37u, 91u, 2u),
    Run(38u, 16u, 2u),
    Run(38u, 21u, 2u),
    Run(38u, 24u, 2u),
    Run(38u, 40u, 1u),
    Run(38u, 42u, 1u),
    Run(38u, 67u, 1u),
    Run(38u, 69u, 1u),
    Run(38u, 76u, 2u),
    Run(38u, 79u, 2u),
    Run(38u, 91u, 2u),
    Run(39u, 22u, 1u),
    Run(39u, 24u, 2u),
    Run(39u, 39u, 1u),
    Run(39u, 46u, 2u),
    Run(39u, 50u, 2u),
    Run(39u, 57u, 2u),
    Run(39u, 66u, 1u),
    Run(39u, 73u, 3u),
    Run(39u, 77u, 1u),
    Run(39u, 79u, 2u),
    Run(40u, 23u, 1u),
    Run(40u, 25u, 1u),
    Run(40u, 39u, 1u),
    Run(40u, 42u, 1u),
    Run(40u, 45u, 1u),
    Run(40u, 48u, 1u),
    Run(40u, 50u, 2u),
    Run(40u, 57u, 2u),
    Run(40u, 66u, 1u),
    Run(40u, 69u, 1u),
    Run(40u, 72u, 1u),
    Run(40u, 75u, 1u),
    Run(40u, 78u, 1u),
    Run(40u, 80u, 1u),
    Run(41u, 24u, 1u),
    Run(41u, 30u, 1u),
    Run(41u, 39u, 1u),
    Run(41u, 46u, 2u),
    Run(41u, 66u, 1u),
    Run(41u, 73u, 2u),
    Run(41u, 79u, 1u),
    Run(42u, 30u, 1u),
    Run(42u, 32u, 1u),
    Run(42u, 40u, 1u),
    Run(42u, 42u, 1u),
    Run(42u, 67u, 1u),
    Run(42u, 69u, 1u),
    Run(43u, 30u, 2u),
    Run(43u, 41u, 2u),
    Run(43u, 68u, 2u),
    Run(45u, 80u, 1u),
    Run(45u, 82u, 1u),
    Run(46u, 81u, 2u),
    Run(47u, 81u, 1u),
    Run(48u, 23u, 1u),
    Run(49u, 22u, 1u),
    Run(50u, 22u, 3u),
    Run(52u, 88u, 1u),
    Run(53u, 89u, 2u),
    Run(54u, 88u, 2u),
    Run(55u, 105u, 1u),
    Run(56u, 3u, 1u),
    Run(56u, 15u, 1u),
    Run(56u, 104u, 1u),
    Run(57u, 4u, 1u),
    Run(57u, 15u, 1u),
    Run(57u, 17u, 1u),
    Run(57u, 104u, 3u),
    Run(58u, 2u, 3u),
    Run(58u, 15u, 2u),
    Run(60u, 95u, 1u),
    Run(60u, 97u, 1u),
    Run(61u, 96u, 2u),
    Run(62u, 96u, 1u),
    Run(63u, 8u, 1u),
    Run(64u, 7u, 1u),
    Run(65u, 7u, 3u),
    Run(67u, 103u, 1u),
    Run(68u, 104u, 2u),
    Run(69u, 103u, 2u)
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
