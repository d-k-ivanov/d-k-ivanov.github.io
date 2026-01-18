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

// **********************************************************************
// Support functions
// **********************************************************************
vec3 drawAxis(in vec2 uv, in vec3 background)
{
    // Draw X axis (horizontal line at y=0)
    float xAxis = smoothstep(0.01f, 0.0f, abs(uv.y));

    // Draw Y axis (vertical line at x=0)
    float yAxis = smoothstep(0.01f, 0.0f, abs(uv.x));

    // Axis color: white
    vec3 axisColor = vec3(1.0f);

    // Blend axis lines over background
    return mix(background, axisColor, max(xAxis, yAxis));
}

// **********************************************************************
// SDF functions
// **********************************************************************
float sdCircle(in vec2 point, in float radius)
{
    return length(point) - radius;
}

float sdSegment(in vec2 p, in vec2 a, in vec2 b)
{
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0f, 1.0f);
    return length(pa - ba * h);
}

// **********************************************************************
// Main image function
// **********************************************************************
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Clipspace coordinates between -1 and 1
    // vec2 uv = fragCoord / iResolution.xy * 2.0f - 1.0f;

    // Correct aspect ratio to avoid stretching
    // uv *= iResolution.x / iResolution.y;

    // Combined version
    vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;

    // Resulting color
    vec3 color = vec3(0.0f);

    float distance = sdCircle(uv, 0.5f);
    distance = abs(distance);

    // Smooth Thresholding
    // Hermite interpolation between two values
    //  type t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    //  return t * t * (3.0 - 2.0 * t);
    // distance = clamp((distance - 0.0f) / (0.1f - 0.0f), 0.0f, 1.0f);
    // distance = distance * distance * (3.0f - 2.0f * distance);
    distance = smoothstep(0.0f, 0.1f, distance);

    // Coloring based on distance
    color = vec3(distance, distance, distance);
    fragColor = vec4(color, 1.0f);
}
