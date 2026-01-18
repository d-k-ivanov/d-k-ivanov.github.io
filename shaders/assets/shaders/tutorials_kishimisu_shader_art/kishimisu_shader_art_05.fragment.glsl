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

float drawLine(in vec2 p1, in vec2 p2, in vec2 uv, in float thickness)
{
    float a = abs(distance(p1, uv));
    float b = abs(distance(p2, uv));
    float c = abs(distance(p1, p2));

    if(a >= c || b >= c)
        return 0.0f;

    float p = (a + b + c) * 0.5f;

    // median to (p1, p2) vector
    float h = 2.0f / c * sqrt(p * (p - a) * (p - b) * (p - c));

    return mix(1.0f, 0.0f, smoothstep(0.5f * thickness, 1.5f * thickness, h));
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

    // float distance = length(uv);
    // distance -= 0.5f; // Circle radius
    float distance = sdCircle(uv, 0.5f);

    // Coloring based on distance
    color = vec3(distance, distance, distance);

    // highlight circle edge
    color = mix(color, vec3(0.6f), 1.0f - smoothstep(0.0f, 0.01f, abs(distance)));

    // Draw axis lines
    color = drawAxis(uv, color);

    // Draw a distance line from the mouse position to the distance field
    if(iMouseL.z > 0.001f)
    {
        // Mouse position in NDC
        vec2 mousePos = (iMouseL.xy * 2.0f - iResolution.xy) / iResolution.y;

        // Colors
        vec3 ousideOfTheCircleColor = vec3(0.0f, 0.5f, 0.0f);
        vec3 insideOfTheCircleColor = vec3(1.0f, 0.0f, 0.0f);
        vec3 markerColor = vec3(1.0f, 1.0f, 0.0f);

        // Draw line from mouse position to the circle edge
        float distToCircle = sdCircle(mousePos, 0.5f);
        float lineIntensity = smoothstep(0.01f, 0.005f, abs(distance - distToCircle));
        vec3 lineColor = (distance > 0.0f) ? ousideOfTheCircleColor : insideOfTheCircleColor;
        color = mix(color, lineColor, lineIntensity);

        // Draw a marker at the mouse position
        float markerIntensity = smoothstep(0.0f, 0.005f, length(uv - mousePos) - 0.01f);
        color = mix(color, markerColor, 1.0f - markerIntensity);
    }

    fragColor = vec4(color, 1.0f);
}
