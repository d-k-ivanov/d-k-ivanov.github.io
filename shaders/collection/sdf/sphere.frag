#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

out vec4 fragColor;

float sdSphere(vec3 point, float radius)
{
    return length(point) - radius;
}

void main()
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (2.0f * gl_FragCoord.xy - iResolution.xy) / iResolution.y;

    // Camera setup
    vec3 rayOrigin = vec3(0.0f, 0.0f, 3.0f);
    vec3 rayDirection = normalize(vec3(uv, -1.5f));

    // Sphere parameters
    float sphereRadius = 1.0f;
    vec3 spherePos = vec3(0.0f);

    // Ray marching
    float marchDistance = 0.0f;
    for(int step = 0; step < 64; step++)
    {
        vec3 currentPos = rayOrigin + rayDirection * marchDistance;
        float surfaceDistance = sdSphere(currentPos - spherePos, sphereRadius);
        if(surfaceDistance < 0.001f || marchDistance > 100.0f)
            break;
        marchDistance += surfaceDistance;
    }

    // Coloring
    vec3 color = vec3(0.0f);
    if(marchDistance < 100.0f)
    {
        vec3 hitPoint = rayOrigin + rayDirection * marchDistance;
        vec3 normal = normalize(hitPoint - spherePos);
        vec3 lightDir = normalize(vec3(1.0f, 1.0f, 1.0f));
        float diffuse = max(dot(normal, lightDir), 0.0f);
        float ambient = 0.2f;
        color = vec3(0.4f, 0.6f, 0.9f) * (diffuse + ambient);
    }

    fragColor = vec4(color, 1.0f);
}
