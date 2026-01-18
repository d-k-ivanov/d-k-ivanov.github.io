struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouseL : vec4f,
    iMouseR : vec4f,
    iMouseW : vec4f,
    iMouseZoom : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) grid: vec2f,
    @location(1) cell: vec2f,
};

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    // Reference the frame count to prevent error about unused uniform
    let pulse = shaderUniforms.iFrame;
    // var  color = vec3f(1.0, 0.0, 0.0);
    // return vec4f(color, 1.0);

    let cellColor = input.cell / input.grid;
    return vec4f(cellColor, 1.0 - cellColor.x, 1.0);
}
