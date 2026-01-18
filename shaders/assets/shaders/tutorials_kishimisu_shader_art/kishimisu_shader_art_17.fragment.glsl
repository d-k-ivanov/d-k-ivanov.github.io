#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouseL;

// Forward declarations
void mainImage(out vec4 color, in vec2 coordinates);

// Output
out vec4 fragColor;

void main(void)
{
    fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);

    vec4 color = vec4(1e20f);
    mainImage(color, gl_FragCoord.xy);

    if(fragColor.x < 0.0f)
    {
        color = vec4(1.0f, 0.0f, 0.0f, 1.0f);
    }
    if(fragColor.y < 0.0f)
    {
        color = vec4(0.0f, 1.0f, 0.0f, 1.0f);
    }
    if(fragColor.z < 0.0f)
    {
        color = vec4(0.0f, 0.0f, 1.0f, 1.0f);
    }
    if(fragColor.w < 0.0f)
    {
        color = vec4(1.0f, 1.0f, 0.0f, 1.0f);
    }

    fragColor = vec4(color.xyz, 1.0f);
}

// **********************************************************************
// Support functions
// **********************************************************************
// Palette:
// https://iquilezles.org/articles/palettes/
// https://dev.thi.ng/gradients/
vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d)
{
    return a + b * cos(6.28318f * (c * t + d));
}

vec3 palette(in float t)
{
    vec3 a = vec3(0.5f, 0.5f, 0.5f);
    vec3 b = vec3(0.5f, 0.5f, 0.5f);
    vec3 c = vec3(1.0f, 1.0f, 1.0f);
    vec3 d = vec3(0.263f, 0.416f, 0.557f);
    return a + b * cos(6.28318f * (c * t + d));
}

// **********************************************************************
// Main image function
// **********************************************************************
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Clipspace coordinates between -1 and 1
    vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;
    uv *= 2.0f;
    uv = fract(uv);

    float distance = length(uv);

    // Resulting color
    vec3 color = palette(distance + iTime);

    distance = sin(distance * 8.0f + iTime) / 8.0f;
    distance = abs(distance);

    distance = 0.02f / distance;

    // Coloring based on distance
    color *= distance;
    fragColor = vec4(color, 1.0f);
}
