struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct VSOut
{
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

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

    let wobble = shaderUniforms.iTime * 0.0;
    let scale = normalize(shaderUniforms.iResolution.xy + vec2f(1.0));

    var out : VSOut;
    out.Position = vec4f(positions[idx] + wobble * scale, 0.0, 1.0);
    out.uv = uvs[idx];
    return out;
}
