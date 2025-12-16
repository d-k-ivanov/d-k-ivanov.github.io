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

@fragment
fn frag() -> @location(0) vec4f {
    let pulse = 0.5 + 0.5 * sin(shaderUniforms.iTime * 0.5);
    return vec4f(vec3f(1.0, 0.0, 0.0) * pulse, 1.0);
}
