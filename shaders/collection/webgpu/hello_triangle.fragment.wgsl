struct ShaderUniforms
{
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
fn frag() -> @location(0) vec4f
{
    let pulse = sin(f32(shaderUniforms.iFrame) / 128);
    return vec4f(1.0, pulse, 0.0, 1.0);
}
