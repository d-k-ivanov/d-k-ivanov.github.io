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
@group(0) @binding(10) var computeTexture : texture_2d<f32>;
@group(0) @binding(14) var computeSampler : sampler;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let uv = input.uv;
    let t = shaderUniforms.iTime;
    let wave = 0.5 + 0.5 * sin(t);
    var color = vec3f(uv.x + sin(t), uv.y + cos(t), wave);

    // Texture sampling from compute output
    let texel = textureSampleLevel(computeTexture, computeSampler, uv, 0.0).rgb;
    color *= texel * 0.5;

    return vec4f(color, 1.0);
}