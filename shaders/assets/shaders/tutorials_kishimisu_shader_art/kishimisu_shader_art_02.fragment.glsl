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

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Clipspace coordinates between 0 and 1
    // vec2 uv = fragCoord / iResolution.xy;

    // Center UV coordinates around (0,0)
    // uv = uv - 0.5f;

    // Scale UV coordinates to maintain -1.0f to 1.0f range
    // uv = uv * 2.0f;

    // Or
    // uv = uv * 2.0f - 1.0f;

    // Combined version
    vec2 uv = fragCoord / iResolution.xy * 2.0f - 1.0f;

    int numberOfVariants = 4;
    int variant = int(mod(floor(iTime / 2.0f), float(numberOfVariants)));
    switch(variant)
    {
        case 0:
            fragColor = vec4(uv.x, 0.0f, 0.0f, 1.0f);
            break;
        case 1:
            fragColor = vec4(0.0f, uv.y, 0.0f, 1.0f);
            break;
        case 2:
            fragColor = vec4(uv.x, uv.y, 0.0f, 1.0f);
            break;
        case 3:
            fragColor = vec4(0.0f, 0.0f, uv.x + uv.y, 1.0f);
            break;
        default:
            fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
            break;
    }
}
