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
    @location(0) uv : vec2f,
};

@fragment
fn frag(input : VSOut) -> @location(0) vec4f {
    let uv = input.uv;
    let t = shaderUniforms.iTime;
    let wave = 0.5 + 0.5 * sin(t);
    let color = vec3f(uv.x + sin(t), uv.y + cos(t), wave);
    return vec4f(color, 1.0);
}
