struct ShaderUniforms {
    iResolution : vec3f,
    _padding0 : f32,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    _padding1 : vec2f,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct VSOut {
    @builtin(position) Position : vec4f,
};

@vertex
fn vert(@builtin(vertex_index) idx : u32) -> VSOut {
    // Fullscreen-sized triangle covering the center area
    var positions = array<vec2f, 3>(
        vec2f(0.0, 0.6),
        vec2f(-0.6, -0.6),
        vec2f(0.6, -0.6)
    );

    var out : VSOut;
    out.Position = vec4f(positions[idx], 0.0, 1.0);
    return out;
}
