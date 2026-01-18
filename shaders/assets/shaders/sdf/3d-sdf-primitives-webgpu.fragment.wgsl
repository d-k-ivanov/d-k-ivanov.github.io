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
    let canvasSize = max(shaderUniforms.iResolution.xy, vec2f(1.0));
    let textureSize = max(vec2f(textureDimensions(computeTexture)), vec2f(1.0));
    let scale = min(canvasSize.x / textureSize.x, canvasSize.y / textureSize.y);
    let displaySize = textureSize * scale;
    let offset = (canvasSize - displaySize) * 0.5;

    let uv = clamp(input.uv, vec2f(0.0), vec2f(1.0));
    let pixelPos = uv * canvasSize;
    let texCoords = (pixelPos - offset) / displaySize;

    if (texCoords.x < 0.0 || texCoords.y < 0.0 || texCoords.x > 1.0 || texCoords.y > 1.0)
    {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let texel = textureSampleLevel(computeTexture, computeSampler, texCoords, 0.0).rgb;
    let color = clamp(texel, vec3f(0.0), vec3f(1.0));
    return vec4f(color, 1.0);
}
