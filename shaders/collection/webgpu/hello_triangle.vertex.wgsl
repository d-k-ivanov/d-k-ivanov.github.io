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
    var positions = array<vec2f, 3>(
        vec2f(0.0, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, -0.5)
    );

    // Calculate aspect ratio (width / height)
    let aspect = shaderUniforms.iResolution.x / shaderUniforms.iResolution.y;

    // Scale x coordinate by 1/aspect to maintain proportions
    let pos = vec2f(positions[idx].x / aspect, positions[idx].y);

    var out : VSOut;
    out.Position = vec4f(pos, 0.0, 1.0);
    return out;
}
