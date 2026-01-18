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

vec3 drawAxis(vec2 uv, vec3 background)
{
    // Draw X axis (horizontal line at y=0)
    float xAxis = smoothstep(0.01, 0.0, abs(uv.y));

    // Draw Y axis (vertical line at x=0)
    float yAxis = smoothstep(0.01, 0.0, abs(uv.x));

    // Axis color: white
    vec3 axisColor = vec3(1.0);

    // Blend axis lines over background
    return mix(background, axisColor, max(xAxis, yAxis));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Clipspace coordinates between -1 and 1
    // vec2 uv = fragCoord / iResolution.xy * 2.0f - 1.0f;

    // Correct aspect ratio to avoid stretching
    // uv *= iResolution.x / iResolution.y;

    // Combined version
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;

    float distance = length(uv);

    int numberOfVariants = 2;
    int variant = int(mod(floor(iTime / 2.0f), float(numberOfVariants)));
    vec3 color = vec3(0.0f);
    switch(variant)
    {
        case 0:
            color = vec3(distance, 0.0f, 0.0f);
            break;
        case 1:
            color = vec3(distance, distance, distance);
            break;
        default:
            color = vec3(0.0f, 0.0f, 0.0f);
            break;
    }

    color = drawAxis(uv, color);
    fragColor = vec4(color, 1.0f);
}
