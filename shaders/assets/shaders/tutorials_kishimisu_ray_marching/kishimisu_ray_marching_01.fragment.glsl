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
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;
    fragColor = vec4(uv, 0.0f, 1.0f);
}
