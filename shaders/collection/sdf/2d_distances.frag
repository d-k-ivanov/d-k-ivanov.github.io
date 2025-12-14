#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

out vec4 fragColor;

// Primitive SDFs
float sdCircle(in vec2 p, in float r)
{
    return length(p) - r;
}

float sdBox(in vec2 p, in vec2 b)
{
    vec2 d = abs(p) - b;
    return length(max(d, 0.0f)) + min(max(d.x, d.y), 0.0f);
}

float sdRhombus(in vec2 p, in vec2 b)
{
    b.y = -b.y;
    p = abs(p);
    float h = clamp((dot(b, p) + b.y * b.y) / dot(b, b), 0.0f, 1.0f);
    p -= b * vec2(h, h - 1.0f);
    return length(p) * sign(p.x);
}

float sdSegment(in vec2 p, in vec2 a, in vec2 b)
{
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0f, 1.0f);
    return length(pa - ba * h);
}

float sdEquilateralTriangle(in vec2 p, in float r)
{
    const float k = sqrt(3.0f);
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if(p.x + k * p.y > 0.0f)
    {
        p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0f;
    }
    p.x -= clamp(p.x, -2.0f * r, 0.0f);
    return -length(p) * sign(p.y);
}

float sdPentagon(in vec2 p, in float r)
{
    const vec3 k = vec3(0.809016994f, 0.587785252f, 0.726542528f);
    p.x = abs(p.x);
    p -= 2.0f * min(dot(vec2(-k.x, k.y), p), 0.0f) * vec2(-k.x, k.y);
    p -= 2.0f * min(dot(vec2(k.x, k.y), p), 0.0f) * vec2(k.x, k.y);
    p -= vec2(clamp(p.x, -r * k.z, r * k.z), r);
    return length(p) * sign(p.y);
}

float sdHexagon(in vec2 p, in float r)
{
    const vec3 k = vec3(-0.866025404f, 0.5f, 0.577350269f);
    p = abs(p);
    p -= 2.0f * min(dot(k.xy, p), 0.0f) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
}

float sdHexagram(in vec2 p, in float r)
{
    const vec4 k = vec4(-0.5f, 0.8660254038f, 0.5773502692f, 1.7320508076f);
    p = abs(p);
    p -= 2.0f * min(dot(k.xy, p), 0.0f) * k.xy;
    p -= 2.0f * min(dot(k.yx, p), 0.0f) * k.yx;
    p -= vec2(clamp(p.x, r * k.z, r * k.w), r);
    return length(p) * sign(p.y);
}

float sdStar(in vec2 p, in float r, in int n, in float m)
{
    // next 4 lines can be precomputed for a given shape
    float an = 3.141593f / float(n);
    float en = 3.141593f / m;  // m is between 2 and n
    vec2 acs = vec2(cos(an), sin(an));
    vec2 ecs = vec2(cos(en), sin(en)); // ecs=vec2(0,1) for regular polygon

    float bn = mod(atan(p.x, p.y), 2.0f * an) - an;
    p = length(p) * vec2(cos(bn), abs(sin(bn)));
    p -= r * acs;
    p += ecs * clamp(-dot(p, ecs), 0.0f, r * acs.y / ecs.y);
    return length(p) * sign(p.x);
}

float sdPentagram(in vec2 p, in float r)
{
    const float k1x = 0.809016994f; // cos(π/ 5) = ¼(√5+1)
    const float k2x = 0.309016994f; // sin(π/10) = ¼(√5-1)
    const float k1y = 0.587785252f; // sin(π/ 5) = ¼√(10-2√5)
    const float k2y = 0.951056516f; // cos(π/10) = ¼√(10+2√5)
    const float k1z = 0.726542528f; // tan(π/ 5) = √(5-2√5)
    const vec2 v1 = vec2(k1x, -k1y);
    const vec2 v2 = vec2(-k1x, -k1y);
    const vec2 v3 = vec2(k2x, -k2y);

    p.x = abs(p.x);
    p -= 2.0f * max(dot(v1, p), 0.0f) * v1;
    p -= 2.0f * max(dot(v2, p), 0.0f) * v2;
    p.x = abs(p.x);
    p.y -= r;
    return length(p - v3 * clamp(dot(p, v3), 0.0f, k1z * r)) * sign(p.y * v3.x - p.x * v3.y);
}

// Get distance based on current shape index
float getDistance(in vec2 p, in float r, in int shapeIndex)
{
    if(shapeIndex == 0)
        return sdCircle(p, r);
    if(shapeIndex == 1)
        return sdBox(p, vec2(r));
    if(shapeIndex == 2)
        return sdRhombus(p, vec2(r, r * 0.7f));
    if(shapeIndex == 3)
        return sdEquilateralTriangle(p, r);
    if(shapeIndex == 4)
        return sdPentagon(p, r);
    if(shapeIndex == 5)
        return sdHexagon(p, r);
    if(shapeIndex == 6)
        return sdHexagram(p, r * 0.6f);
    if(shapeIndex == 7)
        return sdStar(p, r, 5, 2.5f);
    if(shapeIndex == 8)
        return sdPentagram(p, r);
    return sdCircle(p, r);
}

// Main function
void main()
{
    vec2 position = (2.0f * gl_FragCoord.xy - iResolution.xy) / iResolution.y;

    // Change shape every pi seconds
    const float PI = 3.14159265f;
    const int numShapes = 9;
    int shapeIndex = int(mod(floor(iTime / PI), float(numShapes)));

    float radius = 0.5f + 0.2f * sin(iTime);
    float disctance = getDistance(position, radius, shapeIndex);

    // coloring
    vec3 color;
    vec3 ousideColor = vec3(0.0f, 0.5f, 0.0f);
    vec3 insideColor = vec3(1.0f, 0.0f, 0.0f);

    // inside / outside color
    color = (disctance > 0.0f) ? ousideColor : insideColor;

    // fog effect
    color *= 1.0f - exp(-10.0f * abs(disctance));

    // repeating pattern
    color *= 0.5f + 0.5f * cos(100.0f * disctance);

    // highlight circle edge
    color = mix(color, vec3(1.0f), 1.0f - smoothstep(0.0f, 0.01f, abs(disctance)));

    fragColor = vec4(color, 1.0f);
}
