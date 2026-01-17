struct VertexInput
{
    @builtin(vertex_index) vertex_index : u32,
    @builtin(instance_index) instance_index : u32,
};

struct VertexOutput
{
    @builtin(position) Position : vec4f,
};

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    var out : VertexOutput;
    if (input.instance_index > 0u)
    {
        out.Position = vec4f(2.0, 2.0, 0.0, 1.0);
        return out;
    }

    let positions = array<vec2f, 3u>(
        vec2f(-1.0, -1.0),
        vec2f( 3.0, -1.0),
        vec2f(-1.0,  3.0)
    );
    out.Position = vec4f(positions[input.vertex_index], 0.0, 1.0);
    return out;
}
