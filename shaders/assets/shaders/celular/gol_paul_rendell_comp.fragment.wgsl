struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) grid: vec2f,
    @location(1) cell: vec2f,
};

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let cellColor = input.cell / input.grid;
    return vec4f(cellColor, 1.0 - cellColor.x, 1.0);
}
