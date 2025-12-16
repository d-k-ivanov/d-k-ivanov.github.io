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
uniform vec4 iMouse;

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
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0f);

    for(float i = 0.0f; i < 4.0f; i++)
    {
        // Tile the space with centered repetitions of the orriginal pattern
        uv = fract(uv * 1.5f) - 0.5f;

        // https://graphtoy.com/
        // float distance = length(uv) * exp(-length(uv) * 3.0f);
        // https://graphtoy.com/?f1(x,t)=x&v1=true&f2(x,t)=x*exp(-x)&v2=true&f3(x,t)=&v3=false&f4(x,t)=&v4=false&f5(x,t)=&v5=false&f6(x,t)=&v6=false&grid=1&coords=0,0,12
        float distance = length(uv) * exp(-length(uv0));

        // Resulting color
        vec3 color = palette(length(uv0) + i * 0.4f +iTime * 0.4f);

        distance = sin(distance * 8.0f + iTime) / 8.0f;
        distance = abs(distance);

        // distance = 0.02f / distance;
        distance = 0.01f / distance;

        finalColor += color * distance;
    }
    fragColor = vec4(finalColor, 1.0f);
}
