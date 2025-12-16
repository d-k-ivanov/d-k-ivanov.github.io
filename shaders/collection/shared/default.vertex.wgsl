struct VSOut
{
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

// Common vertex shader used when specific vertex shader is not provided.

@vertex
fn vert(@builtin(vertex_index) idx : u32) -> VSOut
{
    var positions = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f(3.0, -1.0),
        vec2f(-1.0, 3.0)
    );
    var uvs = array<vec2f, 3>(
        vec2f(0.0, 0.0),
        vec2f(2.0, 0.0),
        vec2f(0.0, 2.0)
    );

    var out : VSOut;
    out.Position = vec4f(positions[idx], 0.0, 1.0);
    out.uv = uvs[idx];
    return out;
}
