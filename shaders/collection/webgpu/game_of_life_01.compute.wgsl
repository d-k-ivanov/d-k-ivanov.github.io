const GRID_SIZE : u32 = 128u;

@group(0) @binding(1) var<storage, read_write> cellState: array<u32>;

fn cellIndex(cell: vec2u) -> u32
{
    return (cell.y % GRID_SIZE) * GRID_SIZE + (cell.x % GRID_SIZE);
}

fn cellActive(x: u32, y: u32) -> u32
{
    return cellState[cellIndex(vec2(x, y))];
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) cell : vec3u)
{
    // Determine how many active neighbors this cell has.
    let activeNeighbors = cellActive(cell.x + 1u, cell.y + 1u)
                        + cellActive(cell.x + 1u, cell.y     )
                        + cellActive(cell.x + 1u, cell.y - 1u)
                        + cellActive(cell.x     , cell.y - 1u)
                        + cellActive(cell.x - 1u, cell.y - 1u)
                        + cellActive(cell.x - 1u, cell.y     )
                        + cellActive(cell.x - 1u, cell.y + 1u)
                        + cellActive(cell.x     , cell.y + 1u);

    let i = cellIndex(cell.xy);

    // Conway's game of life rules:
    switch activeNeighbors
    {
        // Cells with 2 neighbors preserve their state.
        case 2:
        {
            cellState[i] = cellState[i];
            break;
        }

        // Cells with 3 neighbors become or stay active.
        case 3:
        {
            cellState[i] = 1;
            break;
        }

        // Cells with less than 2 or more then 3 neighbors become inactive.
        default:
        {
            cellState[i] = 0;
            break;
        }
    }
}
