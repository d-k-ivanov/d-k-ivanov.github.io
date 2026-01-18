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

// Distance to the scene:
float map(vec3 p)
{
    // Distance to a sphere of radius 1.0f at the origin
    return length(p) - 1.0f;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;

    // Initialization:
    vec3 rayOrigin = vec3(0.0f, 0.0f, -3.0f);
    // vec3 rayDirection = vec3(0.0f, 0.0f, 1.0f);
    // vec3 rayDirection = vec3(uv, 1.0f);
    vec3 rayDirection = normalize(vec3(uv, 1.0f));

    vec3 finalPixelColor = vec3(0.0f);

    // total distance traveled along the ray
    float totalDistance = 0.0f;

    // Raymarching
    int maxSteps = 100;
    for(int i = 0; i < maxSteps; i++)
    {
        // position along the ray
        vec3 position = rayOrigin + rayDirection * totalDistance;

        // Current distance to the scene
        float distanceToScene = map(position);

        // "march" the ray
        totalDistance += distanceToScene;
    }

    finalPixelColor = vec3(totalDistance * 0.2f);

    fragColor = vec4(finalPixelColor, 1.0f);
}
