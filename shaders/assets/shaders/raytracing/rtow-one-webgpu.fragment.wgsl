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
    let res = shaderUniforms.iResolution.xy;
    var uv = input.uv;
    uv.y = 1.0 - uv.y;
    let unusedUniforms = shaderUniforms.iTime * 0.0 + shaderUniforms.iTimeDelta * 0.0 + f32(shaderUniforms.iFrame) * 0.0 + shaderUniforms.iFrameRate * 0.0 + shaderUniforms.iMouseL.x * 0.0 + shaderUniforms.iMouseL.y * 0.0 + shaderUniforms.iMouseL.z * 0.0 + shaderUniforms.iMouseL.w * 0.0;

    var color = textureSampleLevel(computeTexture, computeSampler, uv, 0.0).rgb;
    let frameNoise = fract(sin((f32(shaderUniforms.iFrame) * 0.0 + 12.9898 + res.x * 0.001 + res.y * 0.002)) * 43758.5453);
    let rateBoost = 1.0;
    let mouseGlow = 0.0;

    let pulse = 0.6 + 0.4 * rateBoost + unusedUniforms;
    color = mix(color, color * vec3f(pulse), vec3f(0.35));
    color += vec3f(frameNoise * 0.01 + 0.02 * mouseGlow);

    return vec4f(color, 1.0);
}
