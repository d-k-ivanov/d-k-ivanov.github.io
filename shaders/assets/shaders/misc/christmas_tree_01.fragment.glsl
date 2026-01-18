#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouseL;

// Forward declarations
void mainImage(out vec4 c, in vec2 f);

// Output
out vec4 fragColor;

void main(void)
{
    fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
    vec4 color = vec4(1e20f);
    mainImage(color, gl_FragCoord.xy);
    if(fragColor.x < 0.0f)
        color = vec4(1.0f, 0.0f, 0.0f, 1.0f);
    if(fragColor.y < 0.0f)
        color = vec4(0.0f, 1.0f, 0.0f, 1.0f);
    if(fragColor.z < 0.0f)
        color = vec4(0.0f, 0.0f, 1.0f, 1.0f);
    if(fragColor.w < 0.0f)
        color = vec4(1.0f, 1.0f, 0.0f, 1.0f);
    fragColor = vec4(color.xyz, 1.0f);
}

// *******************************************************************
// Creative Commons CC0 1.0 Universal (CC-0)
// A simple christmas tree made from 2D points.
// https://www.shadertoy.com/view/tf3fWS
// *******************************************************************

#define PI 3.1415926535
#define TAU 6.2831853071
#define ROTATE(v, x) mat2(cos(x), sin(x), -sin(x), cos(x)) * v
#define REMAP_HALF_NDC(x, c, d) (((x + 0.5) * (d - c)) + c) // Remap from [-0.5, 0.5] domain to [c, d]

#define N 1024.0
#define N_ONE_QUARTER N * 0.25
// This is mostly to cull any points at the bottom that are too close to the "camera".
#define N_OFFSET 1.0
#define STAR_N 5.0
#define STAR_BEAM_THICKNESS 3.0

const vec3 LIGHT_COLORS[3] = vec3[3](vec3(1.0f, 0.05f, 0.05f), vec3(0.05f, 1.0f, 0.05f), vec3(1.0f, 0.25f, 0.05f));

// https://www.shadertoy.com/view/4djSRW
float Hash12(vec2 p)
{
    vec3 p3 = fract(vec3(p.xyx) * .1031f);
    p3 += dot(p3, p3.yzx + 33.33f);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 Hash21(float p)
{
    vec3 p3 = fract(vec3(p) * vec3(.1031f, .1030f, .0973f));
    p3 += dot(p3, p3.yzx + 33.33f);
    return fract((p3.xx + p3.yz) * p3.zy);

}

// Signed distance to an n-star polygon with external angle en by iq: https://www.shadertoy.com/view/3tSGDy
float SignedDistanceNStar2D(in vec2 p, in float r, in float an, in float bn, in vec2 acs, in float m) // m=[2,n]
{
    float en = PI / m;
    vec2 ecs = vec2(cos(en), sin(en));
    p = length(p) * vec2(cos(bn), abs(sin(bn)));

    p -= r * acs;
    p += ecs * clamp(-dot(p, ecs), 0.0f, r * acs.y / ecs.y);
    return length(p) * sign(p.x);
}

void DrawStar(in vec2 uv, in float time, inout vec3 outColor)
{
    uv -= vec2(0.001f, 0.225f);
    uv = ROTATE(uv, time * 0.75f);
    // Some common pre-calculation in order to avoid duplication
    float an = PI / STAR_N;
    float bn = mod(atan(uv.x, uv.y), 2.0f * an) - an;
    vec2 acs = vec2(cos(an), sin(an));
    // Top star
    outColor += 5e-4f / pow(abs(SignedDistanceNStar2D(uv, 0.01f, an, bn, acs, STAR_N * 0.5f)), 1.23f) * LIGHT_COLORS[2];
    // Star beams
    outColor += smoothstep(STAR_BEAM_THICKNESS / max(iResolution.x, iResolution.y), 0.0f, SignedDistanceNStar2D(uv, 1.5f, an, bn, acs, STAR_N)) * LIGHT_COLORS[2] * smoothstep(0.75f, -5.0f, length(uv));
}

void DrawTree(in vec2 uv, in float time, inout vec3 outColor)
{
    float u, theta, pointHeight, invN = 1.0f / N;
    vec2 st, hash, layer;
    vec3 pointOnCone, pointColor = vec3(1.0f);
    const vec2 radius = vec2(1.5f, 3.2f);
    uvec3 colorThreshold;
    for(float i = N_OFFSET; i < N; ++i)
    {
        // Modify this to change the tree pattern
        hash = Hash21(2.0f * TAU * i);

        float blinkSpeed = (hash.y + 0.5f) * 10.0f;
        float blinkOffset = hash.x * 6.28f; // 随机相位
        float blink = 0.5f + 0.5f * sin(time * blinkSpeed + blinkOffset);

        // Some basic light color based on hash
        //colorThreshold.x = uint(hash.x < 0.45); // red;
        //colorThreshold.y = 1u - colorThreshold.x; // green
        //colorThreshold.z = uint(hash.x > 0.9); // white;
        //pointColor = vec3(colorThreshold | colorThreshold.z);
        pointColor = mix(vec3(1.0f, 0.05f, 0.05f), vec3(0.05f, 1.0f, 0.05f), step(0.45f, hash.x));
        pointColor = mix(pointColor, vec3(1.0f), step(0.9f, hash.x));
        pointColor *= blink + 0.5f;

        // Calculate point on cone based on: https://mathworld.wolfram.com/Cone.html
        u = i * invN;
        theta = 1609.0f * hash.x + time * 0.5f;
        pointHeight = 1.0f - u;

        // Split the cone into layers to make it look more like a christmas tree
        layer = vec2(3.2f * mod(i, N_ONE_QUARTER) * invN, 0.0f);
        pointOnCone = 0.5f * (radius.xyx - layer.xyx) * vec3(pointHeight * cos(theta), u - 0.5f, pointHeight * sin(theta)); // [-0.5, 0.5]

        // Scale uv based on depth of the point
        st = uv * (REMAP_HALF_NDC(pointOnCone.z, 0.5f, 1.0f) + hash.y) * 4.5f;

        // outColor += smoothstep(0.01, 0.0, length(st - pointOnCone.xy));
        // Slightly adjust the size of the point based on distance to "camera"
        outColor += REMAP_HALF_NDC(pointOnCone.z, 3.0f, 0.6f) * 2e-5f / pow(length(st - pointOnCone.xy), 1.7f) * pointColor;
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord - iResolution.xy * 0.5f) / iResolution.y; // [-0.5, 0.5] adjusted for aspect ratio
    vec3 outColor = vec3(0.0f); // Background color
    vec4 m = iMouseL / iResolution.yyyy;
    float t = 0.0f;

    if(m.z > 0.0f)
    {
        t = m.x * TAU;
    }
    else
    {
        t = iTime * 0.5f;
    }

    DrawTree(uv, t, outColor);
    DrawStar(uv, t, outColor);

    float vignette = dot(uv, uv);
    vignette *= vignette;
    vignette = 1.0f / (vignette * vignette + 1.0f);

    fragColor = vec4(pow(outColor * vignette, vec3(0.4545f)), 1.0f) - Hash12(fragCoord.xy + t * 100.0f) * 0.04f;
}