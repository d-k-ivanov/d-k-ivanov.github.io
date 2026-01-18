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

// sphere SDF
float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

// box SDF
float sdBox(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.0f)) + min(max(q.x, max(q.y, q.z)), 0.0f);
}

// Operations
float opUnion(float d1, float d2)
{
    return min(d1, d2);
}

float opSubtraction(float d1, float d2)
{
    return max(-d1, d2);
}

float opIntersection(float d1, float d2)
{
    return max(d1, d2);
}

// Smooth operations
float opSmoothUnion(float d1, float d2, float k)
{
    float h = clamp(0.5f + 0.5f * (d2 - d1) / k, 0.0f, 1.0f);
    return mix(d2, d1, h) - k * h * (1.0f - h);
}

float opSmoothSubtraction(float d1, float d2, float k)
{
    float h = clamp(0.5f - 0.5f * (d2 + d1) / k, 0.0f, 1.0f);
    return mix(d2, -d1, h) + k * h * (1.0f - h);
}

float opSmoothIntersection(float d1, float d2, float k)
{
    float h = clamp(0.5f - 0.5f * (d2 - d1) / k, 0.0f, 1.0f);
    return mix(d2, d1, h) + k * h * (1.0f - h);
}

float smin(float a, float b, float k)
{
    float h = max(k - abs(a - b), 0.0f) / k;
    return min(a, b) - h * h * h * k * (1.0f / 6.0f);
}

mat2 rot2D(float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

mat3 rot3DMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0f - c;

    return mat3(//
    oc * axis.x * axis.x + c,           //
    oc * axis.x * axis.y - axis.z * s,  //
    oc * axis.z * axis.x + axis.y * s,  //
    oc * axis.x * axis.y + axis.z * s,  //
    oc * axis.y * axis.y + c,           //
    oc * axis.y * axis.z - axis.x * s,  //
    oc * axis.z * axis.x - axis.y * s,  //
    oc * axis.y * axis.z + axis.x * s,  //
    oc * axis.z * axis.z + c);
}

vec3 rot3DRodrigues(vec3 p, vec3 axis, float angle)
{
    // Rodrigues' rotation formula
    return mix(dot(p, axis) * axis, p, cos(angle)) + cross(axis, p) * sin(angle);
}

// Distance to the scene:
float map(vec3 p)
{
    vec3 spherePos = vec3(sin(iTime) * 3.0f, 0.0f, 0.0f);   // Sphere position
    float sphere = sdSphere(p - spherePos, 1.0f);           // Sphere SDF

    vec3 q = p; // copy of input position
    q.xy *= rot2D(iTime); // rotate around Z axis

    // float box = sdBox(p, vec3(0.75f));  // Cube SDF
    float box = sdBox(q, vec3(0.75f));  // Cube SDF after rotation
    float ground = p.y + 0.75f;         // Ground SDF

    // Closest distance to the scene
    // return min(ground, smin(sphere, box, 2.0f));
    return smin(ground, smin(sphere, box, 2.0f), 1.0f);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (fragCoord * 2.0f - iResolution.xy) / iResolution.y;

    // Initialization:
    vec3 rayOrigin = vec3(0.0f, 0.0f, -3.0f);
    // vec3 rayDirection = vec3(0.0f, 0.0f, 1.0f);
    // vec3 rayDirection = vec3(uv, 1.0f);
    // vec3 rayDirection = normalize(vec3(uv * 1.5f, 1.0f));
    vec3 rayDirection = normalize(vec3(uv, 1.0f));

    vec3 finalPixelColor = vec3(0.0f);

    // total distance traveled along the ray
    float totalDistance = 0.0f;

    // Raymarching
    int maxSteps = 100;
    float thresholdNear = 0.001f;
    float thresholdFar = 100.0f;
    for(int i = 0; i < maxSteps; i++)
    {
        // position along the ray
        vec3 position = rayOrigin + rayDirection * totalDistance;

        // Current distance to the scene
        float distanceToScene = map(position);

        // "march" the ray
        totalDistance += distanceToScene;

        // early stop
        if(distanceToScene < thresholdNear || totalDistance > thresholdFar)
        {
            break;
        }
    }

    finalPixelColor = vec3(totalDistance * 0.2f);

    fragColor = vec4(finalPixelColor, 1.0f);
}
