// Samples the compute output written by compute_waves.compute.wgsl and applies a vignette.
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
@group(0) @binding(2) var computeTexture : texture_2d<f32>;
@group(0) @binding(3) var computeSampler : sampler;

struct VSOut {
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

@fragment
fn frag(input : VSOut) -> @location(0) vec4f {
    let uv = clamp(input.uv, vec2f(0.0), vec2f(1.0));
    let texel = textureSampleLevel(computeTexture, computeSampler, uv, 0.0).rgb;
    let vignette = smoothstep(0.9, 0.35, length(uv - 0.5));
    let highlight = 0.08 * sin(shaderUniforms.iTime * 3.0 + uv.x * 6.2831);

    let color = clamp(texel + highlight, vec3f(0.0), vec3f(1.0));
    return vec4f(color * vignette, 1.0);
}
