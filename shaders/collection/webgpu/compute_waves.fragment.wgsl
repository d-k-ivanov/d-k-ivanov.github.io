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
    // Default fullscreen triangle provides UVs in 0..2 range; normalize to 0..1.
    let uv = clamp(input.uv * 0.5, vec2f(0.0), vec2f(1.0));
    let texel = textureSampleLevel(computeTexture, computeSampler, uv, 0.0).rgb;
    let vignette = smoothstep(0.9, 0.35, length(uv - 0.5));
    let highlight = 0.08 * sin(shaderUniforms.iTime * 3.0 + uv.x * 6.2831);

    let color = clamp(texel + highlight, vec3f(0.0), vec3f(1.0));
    return vec4f(color * vignette, 1.0);
}
