#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// Uniforms
uniform vec3 iResolution;   // viewport resolution (in pixels)
uniform float iTime;        // shader playback time (in seconds)
uniform int iFrame;         // shader playback frame

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

// Copyright Inigo Quilez, 2026 - https://iquilezles.org/
// You cannot use this Work to train AI models. I share this Work for
// educational purposes.

// Improv session for somebody who needed advice. Full recording:
//
// https://www.youtube.com/watch?v=DAMiS2PGTEE

// #define SUPERSAMPLING 1

vec2 cylIntersect(in vec3 ro, in vec3 rd, in float rad)
{
    float a = dot(rd.xz, rd.xz);
    float b = dot(ro.xz, rd.xz);
    float c = dot(ro.xz, ro.xz) - rad * rad;
    float h = b * b - a * c;
    if(h < 0.0f)
        return vec2(-1.0f);
    h = sqrt(h);
    return vec2(-b - h, -b + h) / a;
}

float sdBox(in vec3 p, in vec3 b)
{
    vec3 q = abs(p) - b;
    float g = max(q.x, max(q.y, q.z));
    return g < 0.0f ? g : length(max(q, 0.0f));
}

float sdBox(in vec2 p, in vec2 b)
{
    vec2 q = abs(p) - b;
    float g = max(q.x, q.y);
    return g < 0.0f ? g : length(max(q, 0.0f));
}

float sdTube(vec3 p, float r, float h, float w)
{
    vec2 q = vec2(length(p.xz) - r, p.y);
    return sdBox(q, vec2(w, h));
}

vec2 smin(float a, float b, float k)
{
    k *= 4.0f;
    float h = max(k - abs(a - b), 0.0f) / k;
    return vec2(min(a, b) - h * h * k / 4.0f, a < b ? h * 0.5f : 1.0f - h * 0.5f);
}

float hash(in vec3 p)
{
    p += 1000.0f;
    return fract(123.0f * sin(p.x * 21.6f) * sin(p.y * 43.4f) * sin(p.z * 14.5f));
}

float cnoise(vec3 p)
{
    vec3 ip = floor(p);
    vec3 fp = fract(p);

    fp = fp * fp * (3.0f - 2.0f * fp);

    float a = hash(ip + vec3(0, 0, 0));
    float b = hash(ip + vec3(1, 0, 0));
    float c = hash(ip + vec3(0, 1, 0));
    float d = hash(ip + vec3(1, 1, 0));
    float e = hash(ip + vec3(0, 0, 1));
    float f = hash(ip + vec3(1, 0, 1));
    float g = hash(ip + vec3(0, 1, 1));
    float h = hash(ip + vec3(1, 1, 1));

    float ab = mix(a, b, fp.x);
    float cd = mix(c, d, fp.x);
    float ef = mix(e, f, fp.x);
    float gh = mix(g, h, fp.x);

    float abcd = mix(ab, cd, fp.y);
    float efgh = mix(ef, gh, fp.y);

    return mix(abcd, efgh, fp.z);
}

float fbm(in vec3 p)
{
    float f = 0.0f;
    float a = 0.5f;
    for(int i = 0; i < 6; i++)
    {
        f += a * cnoise(p);
        p = p.yxz * 1.99f + 0.1f;
        a *= 0.56f;
    }
    return f;
}

vec4 map(in vec3 p)
{
    {
        float an = 6.2831f * iTime / 40.0f;
        p.xz = mat2(cos(an), -sin(an), sin(an), cos(an)) * p.xz;
    }

    vec3 op = p;

    float sp = 0.40f;
    float layerID = clamp(round(p.y / sp), -10.0f, 1.0f);
    p.y = p.y - sp * layerID;

    {
        float rb = 123.0f * sin(layerID * 1.3f);
        p.xz = mat2(cos(rb), -sin(rb), sin(rb), cos(rb)) * p.xz;
    }

    float an = 6.283185f / 12.0f;
    float a = atan(p.z, p.x);
    float sectorID = round(a / an);
    float ra = sectorID * an;
    p.xz = mat2(cos(ra), -sin(ra), sin(ra), cos(ra)) * p.xz;

    float h1 = sin(ra * 123.0f + layerID * 924.0f);
    float h2 = sin(ra * 462.0f + layerID * 214.9f);
    float h3 = sin(ra * 754.0f + layerID * 534.2f);
    float h4 = sin(ra * 445.0f + layerID * 736.6f);

    p.x -= 1.5f + 0.05f * abs(h1);
    float d1 = sdBox(p, vec3(0.05f, 0.12f + 0.05f * h3, 0.3f + 0.10f * h2)) - 0.1f;

    float f = fbm(op / 0.15f);
    d1 += 0.07f * f;

    float objectID = 0.0f;

    float d2 = sdTube(op - vec3(0.0f, -1.0f, 0.0f), 1.45f, 1.5f, 0.15f);
    d2 += 0.02f * f;

    vec2 re = smin(d1, d2, 0.01f);

    return vec4(re.x, re.y, h4, 0.0f);
}

#define ZERO min(iFrame,0) // prevents compiler loop unrolling

vec3 calcNormal(in vec3 pos)
{
    vec3 n = vec3(0.0f);
    for(int i = ZERO; i < 4; i++)
    {
        vec3 e = 0.5773f * (2.0f * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0f);
        n += e * map(pos + 0.0025f * e).x;
    }
    return normalize(n);
}

float calcAO(in vec3 pos, in vec3 nor, in float time)
{
    float occ = 0.0f;
    float sca = 1.0f;
    for(int i = 0; i < 8; i++)
    {
        float h = 0.005f + 0.2f * float(i) / 8.0f;
        vec3 dir = normalize(nor + 0.85f * sin(h * 31.31f + vec3(0, 2, 4)));
        dir *= sign(dot(dir, nor));
        float d = map(pos + h * dir).x;
        occ += max(h - d, 0.0f) * sca;
        sca *= 0.95f;
        if(occ > 1.0f / 1.5f)
            break;
    }
    return clamp(1.0f - 1.5f * occ, 0.0f, 1.0f);
}

float calcSoftshadow(in vec3 ro, in vec3 rd, in float k)
{
    float res = 1.0f;
    float tmax = cylIntersect(ro, rd, 1.75f).y;
    float t = 0.001f;
    for(int i = 0; i < 128; i++)
    {
        float h = map(ro + rd * t).x;
        res = min(res, k * h / t);
        t += clamp(h * 0.5f, 0.02f, 0.25f);
        if(res < 0.01f || t > tmax)
            break;
    }
    return clamp(res, 0.0f, 1.0f);
}

vec4 intersect(in vec3 ro, in vec3 rd)
{
    vec4 res = vec4(-1.0f);
    vec2 bb = cylIntersect(ro, rd, 1.73f);
    if(bb.y > 0.0f)
    {
        float t = max(bb.x, 0.0f);
        float tmax = bb.y;
        for(int i = 0; i < 256 && t < tmax; i++)
        {
            vec4 h = map(ro + t * rd);
            if(h.x < 0.002f)
            {
                res = vec4(t, h.yzw);
                break;
            }
            t += h.x * 0.35f;
        }
    }
    return res;
}

mat3 setCamera(in vec3 ro, in vec3 ta, float cr)
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0f);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = (cross(cu, cw));
    return mat3(cu, cv, cw);
}

void mainImageSingleSample(out vec3 color, in vec2 fragCoord)
{
    vec2 p = (2.0f * fragCoord - iResolution.xy) / iResolution.y;
    float time = iTime;

    // camera
    vec3 ta = vec3(0.0f, 0.0f, 0.0f);
    vec3 ro = vec3(4.0f, 1.2f, 0.0f);

        // camera-to-world transformation
    mat3 ca = setCamera(ro, ta, 0.0f);

    // ray direction
    float fl = 2.0f;
    vec3 rd = ca * normalize(vec3(p, fl));

        // background
    vec3 col = vec3(1.0f + rd.y) * 0.03f;

    // raymarch geometry
    vec4 tuvw = intersect(ro, rd);
    if(tuvw.x > 0.0f)
    {
        // shading/lighting
        vec3 pos = ro + tuvw.x * rd;
        vec3 nor = calcNormal(pos);

        // color
        vec3 brickColor = vec3(0.2f, 0.04f, 0.02f);
        brickColor *= 1.0f + 0.4f * tuvw.z;
        brickColor *= 1.0f + 0.2f * sin(3.1415927f * tuvw.z + vec3(0, 2, 4));

        vec3 mortarColor = vec3(0.2f, 0.15f, 0.13f);

        vec3 mate = mix(brickColor, mortarColor, tuvw.y);

        // key light
        vec3 lig = normalize(vec3(0.3f, 0.4f, -0.9f));
        float dif = max(0.0f, dot(nor, lig));
        float sha = calcSoftshadow(pos + nor * 0.001f, lig, 32.0f);
        vec3 hal = normalize(lig - rd);
        float spe = pow(clamp(dot(nor, hal), 0.0f, 1.0f), 8.0f);
        spe *= dif * sha;
        spe *= 0.04f + 0.96f * pow(clamp(1.0f - dot(hal, lig), 0.0f, 1.0f), 5.0f);
        col = dif * sha * mate * vec3(4.0f, 2.0f, 1.0f);
        col += spe * vec3(5.0f);

            // done light
        float occ = calcAO(pos, nor, time) * (1.0f + 0.4f * nor.y);
        col += mate * occ * vec3(0.5f, 0.7f, 1.5f) * 1.3f;
        //col = vec3(occ); // debug fake ambient occlusion
    }

    // gain
    col = col * 2.5f / (2.0f + col);

    // gamma
    color += pow(col, vec3(0.45f));

    // cheap dithering
    color += sin(fragCoord.x * 114.0f) * sin(fragCoord.y * 211.1f) / 512.0f;
}

void mainImageSuperSample(out vec3 color, in vec2 fragCoord)
{
    for(int m = ZERO; m < 2; m++)
    {
        for(int n = ZERO; n < 2; n++)
        {
            // pixel coordinates
            vec2 o = vec2(float(m), float(n)) / 2.0f - 0.5f;
            vec2 p = (2.0f * (fragCoord + o) - iResolution.xy) / iResolution.y;
            float d = 0.5f * sin(fragCoord.x * 147.0f) * sin(fragCoord.y * 131.0f);
            float time = iTime;

            // camera
            vec3 ta = vec3(0.0f, 0.0f, 0.0f);
            vec3 ro = vec3(4.0f, 1.2f, 0.0f);

            // camera-to-world transformation
            mat3 ca = setCamera(ro, ta, 0.0f);

            // ray direction
            float fl = 2.0f;
            vec3 rd = ca * normalize(vec3(p, fl));

            // background
            vec3 col = vec3(1.0f + rd.y) * 0.03f;

            // raymarch geometry
            vec4 tuvw = intersect(ro, rd);
            if(tuvw.x > 0.0f)
            {
                // shading/lighting
                vec3 pos = ro + tuvw.x * rd;
                vec3 nor = calcNormal(pos);

                // color
                vec3 brickColor = vec3(0.2f, 0.04f, 0.02f);
                brickColor *= 1.0f + 0.4f * tuvw.z;
                brickColor *= 1.0f + 0.2f * sin(3.1415927f * tuvw.z + vec3(0, 2, 4));

                vec3 mortarColor = vec3(0.2f, 0.15f, 0.13f);

                vec3 mate = mix(brickColor, mortarColor, tuvw.y);

                // key light
                vec3 lig = normalize(vec3(0.3f, 0.4f, -0.9f));
                float dif = max(0.0f, dot(nor, lig));
                float sha = calcSoftshadow(pos + nor * 0.001f, lig, 32.0f);
                vec3 hal = normalize(lig - rd);
                float spe = pow(clamp(dot(nor, hal), 0.0f, 1.0f), 8.0f);
                spe *= dif * sha;
                spe *= 0.04f + 0.96f * pow(clamp(1.0f - dot(hal, lig), 0.0f, 1.0f), 5.0f);
                col = dif * sha * mate * vec3(4.0f, 2.0f, 1.0f);
                col += spe * vec3(5.0f);

                // done light
                float occ = calcAO(pos, nor, time) * (1.0f + 0.4f * nor.y);
                col += mate * occ * vec3(0.5f, 0.7f, 1.5f) * 1.3f;
                // col = vec3(occ); // debug fake ambient occlusion
            }

            // gain
            col = col * 2.5f / (2.0f + col);

            // gamma
            color += pow(col, vec3(0.45f));
        }
    }
    color /= float(4);

    // cheap dithering
    color += sin(fragCoord.x * 114.0f) * sin(fragCoord.y * 211.1f) / 512.0f;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 color = vec3(0.0f);

    #ifdef SUPERSAMPLING
    mainImageSuperSample(color, fragCoord);
    #else
    mainImageSingleSample(color, fragCoord);
    #endif

    fragColor = vec4(color, 1.0f);
}