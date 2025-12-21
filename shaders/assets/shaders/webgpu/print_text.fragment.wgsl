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

// iChannel0URL: ./assets/textures/iChannel0.png
@group(0) @binding(10) var iChannel0Texture : texture_2d<f32>;
@group(0) @binding(14) var iChannel0Sampler : sampler;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

const ATLAS_SIDE : u32 = 16u;

fn atlasCell(code : u32) -> vec2f
{
    return vec2f(f32(code % ATLAS_SIDE), f32(code / ATLAS_SIDE));
}

fn sampleChar(code : u32, local : vec2f) -> f32
{
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0)
    {
        return 0.0;
    }
    if (code > 255u)
    {
        return 0.0;
    }
    let clamped = clamp(local, vec2f(0.0), vec2f(1.0));
    let flipped = vec2f(clamped.x, 1.0 - clamped.y);
    let uv = (atlasCell(code) + flipped) / f32(ATLAS_SIDE);
    return textureSampleLevel(iChannel0Texture, iChannel0Sampler, uv, 0.0).r;
}

// Simple helper to preview the full atlas: maps screen space to grid + glyph UVs
fn previewAtlas(uv: vec2f) -> f32
{
    let gridUV = uv * f32(ATLAS_SIDE); // scale so we see a 16x16 grid
    let wrapped = gridUV % f32(ATLAS_SIDE);
    let cell = vec2u(floor(wrapped));
    let code = cell.x + cell.y * ATLAS_SIDE;
    let glyphUV = fract(wrapped);
    return sampleChar(code, glyphUV);
}

fn renderString(uv : vec2f, origin : vec2f, scale : f32, text : array<u32, 12>, len : u32) -> f32
{
    let local = (uv - origin) / scale;
    let charIndex = i32(floor(local.x));
    let line = i32(floor(local.y));
    if (line != 0 || charIndex < 0 || u32(charIndex) >= len)
    {
        return 0.0;
    }
    let glyphUV = fract(local);
    return sampleChar(text[u32(charIndex)], glyphUV);
}

const HELLO_LEN : u32 = 12u;
const HELLO_WORLD : array<u32, 12> = array<u32, 12>(72u, 69u, 76u, 76u, 79u, 32u, 87u, 79u, 82u, 76u, 68u, 33u); // "HELLO WORLD!"

const DIGITS_LEN : u32 = 12u;
const DIGITS : array<u32, 12> = array<u32, 12>(48u, 49u, 50u, 51u, 52u, 53u, 54u, 55u, 56u, 57u, 48u, 48u); // "012345678900"

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let res = shaderUniforms.iResolution.xy;
    let uv = input.uv;
    let aspect = res.x / max(res.y, 1.0);

    // Scroll through the atlas over time
    let scrollSpeed = 0.3f;
    // Scroll the atlas preview continuously downward
    let glyph = previewAtlas(uv + vec2f(0.0, f32(shaderUniforms.iTime * scrollSpeed) % 1.0));

    let text1 = renderString(uv, vec2f(0.0, 0.0),  0.03, HELLO_WORLD, HELLO_LEN);
    let text2 = renderString(uv, vec2f(0.1, 0.16), 0.04, HELLO_WORLD, HELLO_LEN);
    let text3 = renderString(uv, vec2f(0.2, 0.32), 0.06, HELLO_WORLD, HELLO_LEN);
    let text4 = renderString(uv, vec2f(0.3, 0.48), 0.05, DIGITS, DIGITS_LEN);
    let text5 = renderString(uv, vec2f(0.4, 0.64), 0.05, HELLO_WORLD, HELLO_LEN);
    let text6 = renderString(uv, vec2f(0.5, 0.80), 0.04, DIGITS, DIGITS_LEN);
    let text7 = renderString(uv, vec2f(0.6, 0.96), 0.03, HELLO_WORLD, HELLO_LEN);

    var color = vec3f(glyph * 0.15);
    color += vec3f(2.0, 0.0, 0.0) * text1;
    color += vec3f(0.0, 2.0, 0.0) * text2;
    color += vec3f(0.0, 0.0, 4.0) * text3;
    color += vec3f(2.0, 0.0, 2.0) * text4;
    color += vec3f(0.0, 2.0, 2.0) * text5;
    color += vec3f(2.0, 2.0, 0.0) * text6;
    color += vec3f(3.0, 1.0, 0.0) * text7;

    return vec4f(color, 1.0);
}
