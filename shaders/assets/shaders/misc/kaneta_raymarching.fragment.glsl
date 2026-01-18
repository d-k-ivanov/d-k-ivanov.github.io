#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;

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

// ******************************************************************************
//  Raymarching in Raymarching by kaneta (https://www.shadertoy.com/view/wlSGWy)
// ******************************************************************************

#define MAT_SCREEN 0.
#define MAT_SPHERE1 1.
#define MAT_FLOOR  2.
#define MAT_CORNER 3.
#define MAT_SCREENZ 4.
#define MAT_MARCHSPHERE 5.
#define MAT_MARCHROUTE 6.
#define MAT_MARCHRADIUS 7.
#define MAT_SPHERE2 8.
#define MAT_SPHERE3 9.
#define MAT_RAYDIRECTION 10.
#define MAT_HITPOINT 11.

float uvToP = 0.0f;
float colToUv = 1.0f;
float screenZ = 2.5f;

float sphereAnim = 1.0f;
float radiusAnim = 1.0f;
float routeAnim = 1.0f;

float raySphereAlpha = 0.0f;

float cornersAlpha = 0.0f;
float cornersAnim = 0.0f;

float screenZAlpha = 0.0f;

float radiusAlpha = 1.0f;

float rayDirectionAnim = 0.0f;
float rayDirectionAnim2 = 0.0f;

float screenAlpha = 0.0f;

// =====================Camera========================
vec3 cameraPos, cameraTarget;

//================================

float sum = 0.0f;

float tl(float val, float offset, float range)
{
    float im = sum + offset;
    float ix = im + range;
    sum += offset + range;
    return clamp((val - im) / (ix - im), 0.0f, 1.0f);
}

float cio(float t)
{
    return t < 0.5f ? 0.5f * (1.0f - sqrt(1.0f - 4.0f * t * t)) : 0.5f * (sqrt((3.0f - 2.0f * t) * (2.0f * t - 1.0f)) + 1.0f);
}

float eio(float t)
{
    return t == 0.0f || t == 1.0f ? t : t < 0.5f ? +0.5f * pow(2.0f, (20.0f * t) - 10.0f) : -0.5f * pow(2.0f, 10.0f - (t * 20.0f)) + 1.0f;
}

void timeLine(float time)
{
    //time += 32.;
    float t = tl(time, 1.0f, 0.5f);
    uvToP = mix(0.0f, 1.0f, eio(t));

    t = tl(time, 1.0f, 1.0f);
    cameraPos = mix(vec3(0.0f), vec3(5.f, 5.f, -2.f), eio(t));
    cameraTarget = vec3(0.0f, 0.0f, 5.f);

    t = tl(time, 0.5f, 1.0f);
    raySphereAlpha = mix(0.f, 1.f, t);
    cornersAlpha = mix(0.f, 1.f, t);

    t = tl(time, 0.5f, 1.0f);
    cornersAnim = mix(0.f, 1.f, t);

    t = tl(time, 1.0f, 1.0f);
    cameraPos = mix(cameraPos, vec3(2.f, 3.f, -3.f), eio(t));
    cameraTarget = mix(cameraTarget, vec3(0.0f, 0.0f, 3.0f), eio(t));

    t = tl(time, 0.5f, 0.5f);
    screenZAlpha = mix(0.f, 1.f, t);

    t = tl(time, 0.5f, .5f);
    colToUv = mix(colToUv, 0.0f, eio(t));

    t = tl(time, 0.5f, 1.0f);
    screenZ = mix(screenZ, 5.0f, eio(t));

    t = tl(time, 1.0f, 1.0f);
    screenZ = mix(screenZ, .75f, eio(t));

    t = tl(time, 1.0f, 1.0f);
    screenZ = mix(screenZ, 2.5f, eio(t));

    t = tl(time, 0.5f, 1.0f);
    cornersAlpha = mix(cornersAlpha, 0.f, t);
    screenZAlpha = mix(screenZAlpha, 0.f, t);
    colToUv = mix(colToUv, 1.0f, eio(t));

    t = tl(time, 0.0f, 0.0f);
    cornersAnim = mix(cornersAnim, 0.f, t);

    t = tl(time, 0.5f, 1.0f);
    cameraPos = mix(cameraPos, vec3(5.f, 15.f, 6.0f), eio(t));
    cameraTarget = mix(cameraTarget, vec3(0.0f, 0.0f, 6.f), eio(t));

    for(int i = 0; i < 6; i++)
    {
        t = tl(time, 0.25f, 0.25f);
        radiusAnim = mix(radiusAnim, float(i) + 2.f, t);
        t = tl(time, 0.25f, 0.25f);
        routeAnim = mix(routeAnim, float(i) + 2.f, t);
        t = tl(time, 0.25f, 0.25f);
        sphereAnim = mix(sphereAnim, float(i) + 2.f, t);
    }

    t = tl(time, 1.0f, 1.0f);
    cameraPos = mix(cameraPos, vec3(2.f, 3.f, -3.f), eio(t));
    cameraTarget = mix(cameraTarget, vec3(0.0f, 0.0f, 3.0f), eio(t));
    radiusAlpha = mix(radiusAlpha, 0.0f, t);
    routeAnim = mix(routeAnim, 1.0f, t);
    sphereAnim = mix(sphereAnim, 1.0f, t);
    colToUv = mix(colToUv, 1.0f, eio(t));
    screenAlpha = mix(screenAlpha, 0.0f, t);

    t = tl(time, 0.5f, 1.0f);
    rayDirectionAnim2 = mix(rayDirectionAnim2, 1.0f, eio(t));

    t = tl(time, 0.5f, 4.0f);
    rayDirectionAnim = mix(rayDirectionAnim, 1.0f, t);

    t = tl(time, 0.5f, 1.0f);
    raySphereAlpha = mix(raySphereAlpha, 0.0f, t);
    rayDirectionAnim2 = mix(rayDirectionAnim2, 0.0f, t);

    t = tl(time, 0.5f, 1.0f);
    cameraPos = mix(cameraPos, vec3(0.f), eio(t));
    cameraTarget = mix(cameraTarget, vec3(0.0f, 0.0f, 5.f), eio(t));
}

vec2 opU(vec2 a, vec2 b)
{
    return a.x < b.x ? a : b;
}

float sdLine(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0f, 1.0f);
    return length(pa - ba * h) - r;
}

float sdBox(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return length(max(d, 0.0f)) + min(max(d.x, max(d.y, d.z)), 0.0f); // remove this line for an only partially signed sdf
}

float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

vec3 sunDir = normalize(vec3(.3f, .25f, .2f));
vec3 skyColor(vec3 rd)
{
    float sundot = clamp(dot(rd, sunDir), 0.0f, 1.0f);
    // sky
    vec3 col = mix(vec3(0.2f, 0.5f, 0.85f) * 1.1f, vec3(0.0f, 0.15f, 0.7f), rd.y);
    col = mix(col, 0.85f * vec3(0.8f, 0.8f, 0.7f), pow(1.0f - max(rd.y, 0.0f), 4.0f));
    // sun
    col += 0.3f * vec3(1.0f, 0.7f, 0.4f) * pow(sundot, 5.0f);
    col += 0.5f * vec3(1.0f, 0.8f, 0.6f) * pow(sundot, 64.0f);
    col += 6.0f * vec3(1.0f, 0.8f, 0.6f) * pow(sundot, 1024.0f);
    return col * 3.0f;
}

vec3 screenPos;

vec2 sceneSpheres(vec3 p)
{
    vec2 s1 = vec2(sdSphere(p - vec3(-2.0f, 0.0f, 6.0f), 1.f), MAT_SPHERE1);
    vec2 s2 = vec2(sdSphere(p - vec3(0.0f, 0.0f, 12.0f), 1.f), MAT_SPHERE2);
    vec2 s3 = vec2(sdSphere(p - vec3(2.0f, 0.0f, 9.0f), 1.f), MAT_SPHERE3);
    return opU(opU(s1, s2), s3);
}

vec2 sceneMap(vec3 p)
{
    vec2 s = sceneSpheres(p);
    vec2 p1 = vec2(p.y + 2.0f, MAT_FLOOR);
    return opU(s, p1);
}

vec3 normal(vec3 p)
{
    vec2 e = vec2(0.001f, 0.0f);
    float d = sceneMap(p).x;
    return normalize(d - vec3(sceneMap(p - e.xyy).x, sceneMap(p - e.yxy).x, sceneMap(p - e.yyx).x));
}

void sceneTrace(inout vec3 pos, vec3 ray, out vec2 mat, inout float depth, float maxD)
{
    vec3 ro = pos;
    for(int i = 0; i < 70; i++)
    {
        if(depth > maxD)
        {
            depth = maxD;
            break;
        }
        pos = ro + ray * depth;
        mat = sceneMap(pos);
        if(mat.x < 0.001f)
        {
            break;
        }
        depth += mat.x;
    }
}

vec2 screenMap(vec3 p)
{
    vec2 screenSize = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 b1 = vec2(sdBox(p - vec3(0.f, 0.f, screenZ), vec3(screenSize, 0.01f)), MAT_SCREEN);
    return b1;
}

void screenTrace(inout vec3 pos, vec3 ray, out vec2 mat, inout float depth, float maxD)
{
    vec3 ro = pos;
    for(int i = 0; i < 20; i++)
    {
        if(depth > maxD)
        {
            depth = maxD;
            break;
        }
        pos = ro + ray * depth;
        mat = screenMap(pos);
        if(mat.x < 0.001f)
        {
            break;
        }
        depth += mat.x;
    }
}

float remap(float val, float im, float ix, float om, float ox)
{
    return clamp(om + (val - im) * (ox - om) / (ix - im), om, ox);
}

vec2 gizmoCorners(vec3 p)
{
    vec2 screenSize = iResolution.xy / min(iResolution.x, iResolution.y);

    float a1 = remap(cornersAnim, 0.0f, 0.25f, 0.0f, 1.0f);
    float a2 = remap(cornersAnim, 0.25f, 0.5f, 0.0f, 1.0f);
    float a3 = remap(cornersAnim, 0.5f, 0.75f, 0.0f, 1.0f);
    float a4 = remap(cornersAnim, 0.75f, 1.0f, 0.0f, 1.0f);

    vec2 c1 = vec2(sdLine(p, vec3(0.f), mix(vec3(0.f), vec3(screenSize, screenZ), a1), 0.02f), MAT_CORNER);
    vec2 c2 = vec2(sdLine(p, vec3(0.f), mix(vec3(0.f), vec3(screenSize * vec2(1.f, -1.f), screenZ), a2), 0.02f), MAT_CORNER);
    vec2 c3 = vec2(sdLine(p, vec3(0.f), mix(vec3(0.f), vec3(screenSize * vec2(-1.f, -1.f), screenZ), a3), 0.02f), MAT_CORNER);
    vec2 c4 = vec2(sdLine(p, vec3(0.f), mix(vec3(0.f), vec3(screenSize * vec2(-1.f, 1.f), screenZ), a4), 0.02f), MAT_CORNER);
    return opU(c1, opU(c2, opU(c3, c4)));
}

vec2 gizmoScreenZ(vec3 p)
{
    vec2 c1 = vec2(sdLine(p, vec3(0.f), vec3(0.f, 0.f, screenZ), 0.03f), MAT_SCREENZ);
    return c1;
}

float sphereID = 0.0f;
vec2 gizmoMarching(vec3 p)
{
    vec3 ray = vec3(0.f, 0.f, 1.f);
    vec2 d = vec2(10000.f);

    float t = 0.0f;
    for(int i = 0; i < 7; i++)
    {
        vec3 pos = ray * t;
        vec2 s = vec2(sdSphere(p - pos, 0.15f), MAT_MARCHSPHERE);
        if(s.x < d.x)
        {
            d = s;
            sphereID = float(i);
        }

        float dist = sceneSpheres(pos).x;

        float anim = clamp(routeAnim - float(i) - 1.f, 0.0f, 1.0f);
        vec2 c1 = vec2(sdLine(p, pos, pos + mix(vec3(0.f), ray * dist, anim), 0.03f), MAT_MARCHROUTE);

        d = opU(d, c1);
        t += dist;
    }
    return d;
}

vec2 gizmoMarchingRadius(vec3 p)
{
    vec2 d = vec2(p.y, MAT_MARCHRADIUS);
    return d;
}

vec2 gizmoRayDirection(vec3 p)
{
    float a1 = fract(rayDirectionAnim * 19.99999f);
    float a2 = floor(rayDirectionAnim * 19.99999f) / 20.f;
    vec2 screenSize = iResolution.xy / min(iResolution.x, iResolution.y);
    screenSize.y *= -1.f;
    screenSize = mix(-screenSize, screenSize, vec2(a1, a2));
    vec2 c1 = vec2(sdLine(p, vec3(0.f), mix(vec3(0.f), vec3(screenSize, screenZ) * 10.0f, rayDirectionAnim2), 0.02f), MAT_RAYDIRECTION);

    vec3 ray = normalize(vec3(screenSize, screenZ));
    vec3 pos;
    float t = 0.01f;
    for(int i = 0; i < 20; i++)
    {
        pos = ray * t;
        vec2 d = sceneMap(pos);
        t += d.x;
    }

    c1 = opU(c1, vec2(sdSphere(p - pos, 0.3f), MAT_HITPOINT));

    return c1;
}

vec2 gizmoMap(vec3 p)
{
    vec2 d = opU(gizmoCorners(p), gizmoScreenZ(p));
    d = opU(d, gizmoMarching(p));
    d = opU(d, gizmoRayDirection(p));
    return d;
}

void gizmoTrace(inout vec3 pos, vec3 ray, out vec2 mat, inout float depth, float maxD)
{
    vec3 ro = pos;
    for(int i = 0; i < 60; i++)
    {
        if(depth > maxD)
        {
            depth = maxD;
            break;
        }
        pos = ro + ray * depth;
        mat = gizmoMap(pos);
        if(mat.x < 0.001f)
        {
            break;
        }
        depth += mat.x;
    }
}

vec2 radiusMap(vec3 p)
{
    return gizmoMarchingRadius(p);
}

void radiusTrace(inout vec3 pos, vec3 ray, out vec2 mat, inout float depth, float maxD)
{
    vec3 ro = pos;
    for(int i = 0; i < 40; i++)
    {
        if(depth > maxD)
        {
            depth = maxD;
            break;
        }
        pos = ro + ray * depth;
        mat = radiusMap(pos);
        if(mat.x < 0.001f || depth > maxD)
        {
            break;
        }
        depth += mat.x;
    }
}

float shadow(in vec3 p, in vec3 l, float ma)
{
    float t = 0.1f;
    float t_max = ma;

    float res = 1.0f;
    for(int i = 0; i < 16; ++i)
    {
        if(t > t_max)
            break;
        vec3 pos = p + t * l;
        float d = opU(sceneMap(pos), screenMap(pos)).x;
        if(d < 0.001f)
        {
            return 0.0f;
        }
        t += d * 1.0f;
        res = min(res, 10.0f * d / t);
    }

    return res;
}

// checkerbord
// https://www.shadertoy.com/view/XlcSz2
float checkersTextureGradBox(in vec2 p, in vec2 ddx, in vec2 ddy)
{
    // filter kernel
    vec2 w = max(abs(ddx), abs(ddy)) + 0.01f;
    // analytical integral (box filter)
    vec2 i = 2.0f * (abs(fract((p - 0.5f * w) / 2.0f) - 0.5f) - abs(fract((p + 0.5f * w) / 2.0f) - 0.5f)) / w;
    // xor pattern
    return 0.5f - 0.5f * i.x * i.y;
}

vec3 sceneShade(vec2 mat, vec3 pos, vec3 ray, float depth, float maxD)
{
    vec3 col;
    vec3 sky = skyColor(ray);
    if(depth > maxD - 0.01f)
    {
        return sky;
    }
    float sha = shadow(pos, sunDir, 10.f);
    vec3 norm = normal(pos);
    vec3 albedo = vec3(0.f);
    if(mat.y == MAT_SPHERE1)
    {
        albedo = vec3(1.f, 0.f, 0.f);
    }
    else if(mat.y == MAT_SPHERE2)
    {
        albedo = vec3(0.f, 1.f, 0.f);
    }
    else if(mat.y == MAT_SPHERE3)
    {
        albedo = vec3(0.f, 0.f, 1.f);
    }
    else if(mat.y == MAT_FLOOR)
    {
        vec2 ddx_uvw = dFdx(pos.xz);
        vec2 ddy_uvw = dFdy(pos.xz);
        float checker = checkersTextureGradBox(pos.xz, ddy_uvw, ddy_uvw);
        albedo = vec3(max(0.2f, checker)) * vec3(.8f, 0.8f, 0.7f) * 2.0f;
    }

    float diffuse = clamp(dot(norm, sunDir), 0.0f, 1.0f) * sha * 2.0f;
    col = albedo * (diffuse + 0.05f);

    float fo = 1.0f - exp2(-0.0001f * depth * depth);
    vec3 fco = 0.65f * vec3(0.4f, 0.65f, 1.0f);
    col = mix(col, sky, fo);
    return col;
}

vec3 screenShade(vec2 mat, vec3 pos)
{
    vec3 ro = vec3(0.f, 0.f, 0.f);
    vec3 ta = vec3(0.f, 0.f, 3.f);
    vec3 fo = normalize(ta - ro);
    vec3 ri = normalize(cross(vec3(0.f, 1.f, 0.f), fo));
    vec3 up = normalize(cross(fo, ri));
    mat3 cam = mat3(ri, up, fo);
    vec3 ray = cam * normalize(pos);
    float depth = 0.01f;
    vec3 p = ro;
    sceneTrace(p, ray, mat, depth, 100.f);
    vec3 col = vec3(0.f);
    col = sceneShade(mat, p, ray, depth, 100.f);

    float a1 = fract(rayDirectionAnim * 19.99999f);
    float a2 = floor(rayDirectionAnim * 19.99999f + 1.0f) / 20.f;
    float a3 = floor(rayDirectionAnim * 19.99999f) / 20.f;

    float aspect = iResolution.y / iResolution.x;
    float halfAspect = aspect * 0.5f;

    a1 = step(pos.x * halfAspect + 0.5f, a1);
    a2 = step(-pos.y * 0.49f + 0.51f + 0.0f, a2);
    a3 = step(-pos.y * 0.49f + 0.51f + 0.0f, a3);
    //col *= min(screenAlpha + min(a2 * a1 + a3, 1.0), 1.0);

    vec3 uvCoord = vec3(pow(clamp(mix(pos.xy * 0.5f + 0.5f, pos.xy, uvToP), 0.0f, 1.0f), vec2(2.2f)), 0.0f);
    col = mix(col, uvCoord, colToUv - min(screenAlpha + min(a2 * a1 + a3, 1.0f), 1.0f));
    return col;
    //return vec3(pow(clamp(pos.xy, 0.0, 1.0), vec2(2.2)), 0.0);
}

vec4 gizmoShade(vec2 mat, vec3 p)
{
    vec4 col = vec4(0.f);

    if(mat.y == MAT_CORNER)
    {
        col = vec4(1.f, 0.f, 0.f, cornersAlpha);
    }
    else if(mat.y == MAT_SCREENZ)
    {
        col = vec4(0.05f, 0.05f, 1.f, screenZAlpha);
    }
    else if(mat.y == MAT_MARCHSPHERE)
    {
        float alpha = clamp(sphereAnim - sphereID, 0.0f, 1.0f);
        vec3 sc = mix(vec3(.0f, .1f, 3.f), vec3(.02f, 1.f, .02f), float(sphereID == 0.f || sphereID == 6.f));
        col = vec4(sc, alpha * raySphereAlpha);
    }
    else if(mat.y == MAT_MARCHROUTE)
    {
        col = vec4(1.f, 0.f, 0.f, .9f);
    }
    else if(mat.y == MAT_RAYDIRECTION)
    {
        col = vec4(1.f, 0.f, 0.f, .9f);
    }
    else if(mat.y == MAT_HITPOINT)
    {
        col = vec4(.02f, 1.f, .02f, raySphereAlpha);
    }
    return col;
}

vec4 radiusShade(vec2 mat, vec3 p)
{
    vec4 col = vec4(0.f);

    vec3 ray = vec3(0.f, 0.f, 1.f);
    vec2 d = vec2(10000.f);

    float t = 0.0f;
    for(int i = 0; i < 7; i++)
    {
        vec3 pos = ray * t;
        vec2 dd = sceneSpheres(pos);
        d = vec2(sdSphere(p - pos, dd.x), MAT_MARCHSPHERE);
        float alpha2 = step(radiusAnim, float(i) + 2.f);
        float alpha = clamp(radiusAnim - float(i) - 1.f, 0.0f, 1.0f);

        vec4 cirCol = mix(vec4(.0f, 0.05f, 0.1f, 0.9f), vec4(0.2f, 1.f, 1.4f, .6f), alpha2);
        col = mix(col, cirCol, smoothstep(0.01f, 0.f, d.x) * cirCol.a * alpha);
        col = mix(col, vec4(0.f, 0.f, 0.f, 1.f), smoothstep(0.02f, 0.f, abs(d.x) - 0.01f) * alpha);
        t += dd.x;
    }
    col *= radiusAlpha;
    return col;
}

float luminance(vec3 col)
{
    return dot(vec3(0.298912f, 0.586611f, 0.114478f), col);
}

vec3 reinhard(vec3 col, float exposure, float white)
{
    col *= exposure;
    white *= exposure;
    float lum = luminance(col);
    return (col * (lum / (white * white) + 1.0f) / (lum + 1.0f));
}

vec3 render(vec2 p)
{
    screenPos = vec3(p, 2.5f);
    vec3 ro = cameraPos;
    vec3 ta = cameraTarget;
    vec3 fo = normalize(ta - ro);
    vec3 ri = normalize(cross(vec3(0.f, 1.f, 0.f), fo));
    vec3 up = normalize(cross(fo, ri));
    mat3 cam = mat3(ri, up, fo);
    vec3 ray = cam * normalize(screenPos);
    float depth = 0.01f;
    vec2 mat;
    vec3 col = vec3(0.f);

    vec3 pos = ro;
    sceneTrace(pos, ray, mat, depth, 100.f);

    col = sceneShade(mat, pos, ray, depth, 100.f);

    float sceneDepth = depth;
    depth = 0.01f;
    pos = ro;
    screenTrace(pos, ray, mat, depth, sceneDepth);
    if(depth < sceneDepth)
    {
        col = screenShade(mat, pos);
    }

    float sceneAndScreenDepth = depth;
    depth = 0.01f;
    pos = ro;
    radiusTrace(pos, ray, mat, depth, sceneAndScreenDepth);
    if(depth < sceneAndScreenDepth)
    {
        vec4 radius = radiusShade(mat, pos);
        col = mix(col, radius.rgb, radius.a);
    }

    float sceneAndScreenAndGizmoDepth = sceneAndScreenDepth;
    depth = 0.01f;
    pos = ro;
    gizmoTrace(pos, ray, mat, depth, sceneAndScreenAndGizmoDepth);
    if(depth < sceneAndScreenAndGizmoDepth)
    {
        vec4 gizmo = gizmoShade(mat, pos);
        col = mix(col, gizmo.rgb, gizmo.a);
    }
    return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    timeLine(mod(iTime, 41.f));

    vec2 p = (fragCoord * 2.0f - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec2 dp = 1.f / iResolution.xy;

    vec3 col = vec3(0.f);

    // AA
    // https://www.shadertoy.com/view/Msl3Rr
    for(int y = 0; y < 2; y++)
    {
        for(int x = 0; x < 2; x++)
        {
            vec2 off = vec2(float(x), float(y)) / 2.f;
            vec2 xy = (-iResolution.xy + 2.0f * (fragCoord + off)) / iResolution.y;
            col += render(xy) * 0.25f;
        }
    }

    col = reinhard(col, 1.0f, 1000.0f);
    col = pow(col, vec3(1.0f / 2.2f));

    //col = mix(col, vec3(mix(uv, p, uvToP), 0.), colToUv);

    fragColor = vec4(col, 1.0f);
}