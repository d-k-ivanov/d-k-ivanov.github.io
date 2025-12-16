#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

uniform vec3 iResolution;
uniform float iTime;

// Texture with font atlas: textures/iChannel0.png
uniform sampler2D iChannel0;

out vec4 fragColor;

// **********************************************************************
// Text Utilities
// **********************************************************************
const float ATLAS_SIDE = 16.0f; // 16x16 grid of 256 glyphs

const int HELLO_LEN = 12;
const int HELLO_WORLD[HELLO_LEN] = int[](72, 69, 76, 76, 79, 32, 87, 79, 82, 76, 68, 33); // "HELLO WORLD!"

const int DIGITS_LEN = 12;
const int DIGITS[DIGITS_LEN] = int[](48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 48); // "012345678900"

vec2 atlasCell(int code)
{
    return vec2(mod(float(code), ATLAS_SIDE), floor(float(code) / ATLAS_SIDE));
}

// Returns the glyph coverage for a character code at a local UV inside the cell (0-1 range).
// Flips V so atlases stored top-left first sample correctly in GL's bottom-left space.
float sampleChar(int code, vec2 localUV)
{
    if(code < 0 || code > 255)
    {
        return 0.0f;
    }

    vec2 clamped = clamp(localUV, 0.0f, 1.0f);
    vec2 flipped = vec2(clamped.x, 1.0f - clamped.y);
    vec2 cell = atlasCell(code);
    return texture(iChannel0, (cell + flipped) / ATLAS_SIDE).r;
}

// Simple helper to preview the full atlas: maps screen space to grid + glyph UVs
float previewAtlas(vec2 uv)
{
    vec2 gridUV = uv * ATLAS_SIDE;         // scale so we see a 16x16 grid
    vec2 wrapped = mod(gridUV, ATLAS_SIDE);
    ivec2 cell = ivec2(floor(wrapped));
    int code = cell.x + cell.y * int(ATLAS_SIDE);
    vec2 glyphUV = fract(wrapped);
    return sampleChar(code, glyphUV);
}

// Renders a single-line string defined by a fixed-size array of character codes.
// origin is bottom-left in normalized screen coordinates, scale controls glyph size in NDC.
float renderString(vec2 uv, vec2 origin, float scale, const int text[HELLO_LEN], int len)
{
    // Transform into string-local coordinates
    vec2 local = (uv - origin) / scale;
    int charIndex = int(floor(local.x));
    int line = int(floor(local.y));

    if(line != 0 || charIndex < 0 || charIndex >= len)
    {
        return 0.0f;
    }

    vec2 glyphUV = fract(local);
    return sampleChar(text[charIndex], glyphUV);
}

void main()
{
    // Clipspace coordinates
    // Between 0.0f and 1.0f
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    // Center UV coordinates around (0,0)
    // uv = uv - 0.5f;

    // Scale UV coordinates to maintain -1.0f to 1.0f range
    // uv = uv * 2.0f;

    // Or combined:
    // uv = uv * 2.0f - 1.0f;

    // Centered UV: combined version
    // vec2 uv = gl_FragCoord.xy / iResolution.xy * 2.0f - 1.0f;

    // Correct aspect ratio to avoid stretching
    // uv *= iResolution.x / iResolution.y;

    // Alternative aspect ratio correction approaches:
    // Scale one axis by aspect ratio
    // uv.x *= iResolution.x / iResolution.y;
    // uv.y *= iResolution.x / iResolution.y;

    // Scale one axis by inverse aspect ratio
    // uv.x *= iResolution.y / iResolution.x;
    // uv.y *= iResolution.y / iResolution.x;

    // Corrected aspect ratio: combined version
    // vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;

    // Scroll through the atlas over time
    float scrollSpeed = 0.3f;
    // Scroll the atlas up and down sinusoidally
    // float glyph = previewAtlas(uv + vec2(0.0f, 0.25f * sin(iTime * scrollSpeed)));
    // Scroll the atlas preview continuously downward
    float glyph = previewAtlas(uv + vec2(0.0f, mod(iTime * scrollSpeed, 1.0f)));

    // float text = renderString(uv, vec2(0.1f, 0.3f), 0.03f, HELLO_WORLD, HELLO_LEN);
    float text1 = renderString(uv, vec2(0.0f, 0.0f), 0.03f, HELLO_WORLD, HELLO_LEN);
    float text2 = renderString(uv, vec2(0.1f, 0.16f), 0.04f, HELLO_WORLD, HELLO_LEN);
    float text3 = renderString(uv, vec2(0.2f, 0.32f), 0.06f, HELLO_WORLD, HELLO_LEN);
    float text4 = renderString(uv, vec2(0.3f, 0.48f), 0.05f, DIGITS, DIGITS_LEN);
    float text5 = renderString(uv, vec2(0.4f, 0.64f), 0.05f, HELLO_WORLD, HELLO_LEN);
    float text6 = renderString(uv, vec2(0.5f, 0.80f), 0.04f, HELLO_WORLD, HELLO_LEN);
    float text7 = renderString(uv, vec2(0.6f, 0.96f), 0.03f, HELLO_WORLD, HELLO_LEN);

    vec3 col = vec3(glyph * 0.15f);
    col += vec3(2.0f, 0.0f, 0.0f) * text1;
    col += vec3(0.0f, 2.0f, 0.0f) * text2;
    col += vec3(0.0f, 0.0f, 4.0f) * text3;
    col += vec3(2.0f, 0.0f, 2.0f) * text4;
    col += vec3(0.0f, 2.0f, 2.0f) * text5;
    col += vec3(2.0f, 2.0f, 0.0f) * text6;
    col += vec3(3.0f, 1.0f, 0.0f) * text7;
    fragColor = vec4(col, 1.0f);
}
