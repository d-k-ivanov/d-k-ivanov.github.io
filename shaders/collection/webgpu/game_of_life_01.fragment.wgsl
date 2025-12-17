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

struct VSOut
{
    @builtin(position) Position : vec4f,
};

@fragment
fn frag(input : VSOut) -> @location(0) vec4f
{
    var  color = vec3f(1.0, 0.0, 0.0);
    // Reference the frame count to prevent error about unused uniform
    let pulse = shaderUniforms.iFrame;
    return vec4f(color, 1.0);
}
