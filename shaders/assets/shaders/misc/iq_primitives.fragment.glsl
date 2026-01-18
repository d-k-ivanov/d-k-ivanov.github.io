#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// Uniforms
uniform vec3 iResolution;   // viewport resolution (in pixels)
uniform float iTime;        // shader playback time (in seconds)
uniform vec4 iMouseL;        // mouse pixel coords. xy: current (if MLB down), zw: click
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

// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// The license is here only not because I want to (can one
// license pieces of math?), but because people get upset
// if I don't add one...

// A list of useful distance function to simple primitives. All
// these functions (except for ellipsoid) return an exact
// euclidean distance, meaning they produce a better SDF than
// what you'd get if you were constructing them from boolean
// operations (such as cutting an infinite cylinder with two planes).

// List of other 3D SDFs:
//    https://www.shadertoy.com/playlist/43cXRl
// and
//    https://iquilezles.org/articles/distfunctions

// Antialiasing: adjust for your needs(2 or 3)
#define AA 1

//------------------------------------------------------------------
float dot2(in vec2 v)
{
    return dot(v, v);
}

float dot2(in vec3 v)
{
    return dot(v, v);
}

float ndot(in vec2 a, in vec2 b)
{
    return a.x * b.x - a.y * b.y;
}

float sdPlane(vec3 p)
{
    return p.y;
}

float sdSphere(vec3 p, float s)
{
    return length(p) - s;
}

float sdBox(vec3 p, vec3 b)
{
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0f) + length(max(d, 0.0f));
}

float sdBoxFrame(vec3 p, vec3 b, float e)
{
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;

    return min(min(length(max(vec3(p.x, q.y, q.z), 0.0f)) + min(max(p.x, max(q.y, q.z)), 0.0f), length(max(vec3(q.x, p.y, q.z), 0.0f)) + min(max(q.x, max(p.y, q.z)), 0.0f)), length(max(vec3(q.x, q.y, p.z), 0.0f)) + min(max(q.x, max(q.y, p.z)), 0.0f));
}
float sdEllipsoid(in vec3 p, in vec3 r) // approximated
{
    float k0 = length(p / r);
    float k1 = length(p / (r * r));
    return k0 * (k0 - 1.0f) / k1;
}

float sdTorus(vec3 p, vec2 t)
{
    return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}

float sdCappedTorus(in vec3 p, in vec2 sc, in float ra, in float rb)
{
    p.x = abs(p.x);
    float k = (sc.y * p.x > sc.x * p.y) ? dot(p.xy, sc) : length(p.xy);
    return sqrt(dot(p, p) + ra * ra - 2.0f * ra * k) - rb;
}

float sdHexPrism(vec3 p, vec2 h)
{
    vec3 q = abs(p);

    const vec3 k = vec3(-0.8660254f, 0.5f, 0.57735f);
    p = abs(p);
    p.xy -= 2.0f * min(dot(k.xy, p.xy), 0.0f) * k.xy;
    vec2 d = vec2(length(p.xy - vec2(clamp(p.x, -k.z * h.x, k.z * h.x), h.x)) * sign(p.y - h.x), p.z - h.y);
    return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

float sdOctogonPrism(in vec3 p, in float r, float h)
{
    // vec3(sqrt(2+sqrt(2))/2, sqrt(2-sqrt(2))/2, sqrt(2)-1)
    const vec3 k = vec3(-0.9238795325f, 0.3826834323f, 0.4142135623f);
    // reflections
    p = abs(p);
    p.xy -= 2.0f * min(dot(vec2(k.x, k.y), p.xy), 0.0f) * vec2(k.x, k.y);
    p.xy -= 2.0f * min(dot(vec2(-k.x, k.y), p.xy), 0.0f) * vec2(-k.x, k.y);
    // polygon side
    p.xy -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    vec2 d = vec2(length(p.xy) * sign(p.y), p.z - h);
    return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0f, 1.0f);
    return length(pa - ba * h) - r;
}

float sdRoundCone(in vec3 p, in float r1, float r2, float h)
{
    vec2 q = vec2(length(p.xz), p.y);

    float b = (r1 - r2) / h;
    float a = sqrt(1.0f - b * b);
    float k = dot(q, vec2(-b, a));

    if(k < 0.0f)
    {
        return length(q) - r1;
    }
    if(k > a * h)
    {
        return length(q - vec2(0.0f, h)) - r2;
    }

    return dot(q, vec2(a, b)) - r1;
}

float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2)
{
    // sampling independent computations (only depend on shape)
    vec3 ba = b - a;
    float l2 = dot(ba, ba);
    float rr = r1 - r2;
    float a2 = l2 - rr * rr;
    float il2 = 1.0f / l2;

    // sampling dependant computations
    vec3 pa = p - a;
    float y = dot(pa, ba);
    float z = y - l2;
    float x2 = dot2(pa * l2 - ba * y);
    float y2 = y * y * l2;
    float z2 = z * z * l2;

    // single square root!
    float k = sign(rr) * rr * rr * x2;

    if(sign(z) * a2 * z2 > k)
    {
        return sqrt(x2 + z2) * il2 - r2;
    }
    if(sign(y) * a2 * y2 < k)
    {
        return sqrt(x2 + y2) * il2 - r1;
    }

    return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

float sdTriPrism(vec3 p, vec2 h)
{
    const float k = sqrt(3.0f);
    h.x *= 0.5f * k;
    p.xy /= h.x;
    p.x = abs(p.x) - 1.0f;
    p.y = p.y + 1.0f / k;
    if(p.x + k * p.y > 0.0f)
    {
        p.xy = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0f;
    }
    p.x -= clamp(p.x, -2.0f, 0.0f);
    float d1 = length(p.xy) * sign(-p.y) * h.x;
    float d2 = abs(p.z) - h.y;
    return length(max(vec2(d1, d2), 0.0f)) + min(max(d1, d2), 0.f);
}

// vertical
float sdCylinder(vec3 p, vec2 h)
{
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

// arbitrary orientation
float sdCylinder(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a;
    vec3 ba = b - a;
    float baba = dot(ba, ba);
    float paba = dot(pa, ba);

    float x = length(pa * baba - ba * paba) - r * baba;
    float y = abs(paba - baba * 0.5f) - baba * 0.5f;
    float x2 = x * x;
    float y2 = y * y * baba;
    float d = (max(x, y) < 0.0f) ? -min(x2, y2) : (((x > 0.0f) ? x2 : 0.0f) + ((y > 0.0f) ? y2 : 0.0f));
    return sign(d) * sqrt(abs(d)) / baba;
}

// vertical
float sdCone(in vec3 p, in vec2 c, float h)
{
    vec2 q = h * vec2(c.x, -c.y) / c.y;
    vec2 w = vec2(length(p.xz), p.y);

    vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0f, 1.0f);
    vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0f, 1.0f), 1.0f);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
    return sqrt(d) * sign(s);
}

float sdCappedCone(in vec3 p, in float h, in float r1, in float r2)
{
    vec2 q = vec2(length(p.xz), p.y);

    vec2 k1 = vec2(r2, h);
    vec2 k2 = vec2(r2 - r1, 2.0f * h);
    vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0f) ? r1 : r2), abs(q.y) - h);
    vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot2(k2), 0.0f, 1.0f);
    float s = (cb.x < 0.0f && ca.y < 0.0f) ? -1.0f : 1.0f;
    return s * sqrt(min(dot2(ca), dot2(cb)));
}

float sdCappedCone(vec3 p, vec3 a, vec3 b, float ra, float rb)
{
    float rba = rb - ra;
    float baba = dot(b - a, b - a);
    float papa = dot(p - a, p - a);
    float paba = dot(p - a, b - a) / baba;

    float x = sqrt(papa - paba * paba * baba);

    float cax = max(0.0f, x - ((paba < 0.5f) ? ra : rb));
    float cay = abs(paba - 0.5f) - 0.5f;

    float k = rba * rba + baba;
    float f = clamp((rba * (x - ra) + paba * baba) / k, 0.0f, 1.0f);

    float cbx = x - ra - f * rba;
    float cby = paba - f;

    float s = (cbx < 0.0f && cay < 0.0f) ? -1.0f : 1.0f;

    return s * sqrt(min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
}

// c is the sin/cos of the desired cone angle
float sdSolidAngle(vec3 pos, vec2 c, float ra)
{
    vec2 p = vec2(length(pos.xz), pos.y);
    float l = length(p) - ra;
    float m = length(p - c * clamp(dot(p, c), 0.0f, ra));
    return max(l, m * sign(c.y * p.x - c.x * p.y));
}

float sdOctahedron(vec3 p, float s)
{
    p = abs(p);
    float m = p.x + p.y + p.z - s;

    // exact distance
    #if 0
        vec3 o = min(3.0f * p - m, 0.0f);
        o = max(6.0f * p - m * 2.0f - o * 3.0f + (o.x + o.y + o.z), 0.0f);
        return length(p - s * o / (o.x + o.y + o.z));
    #endif

    // exact distance
    #if 1
        vec3 q;
        if(3.0f * p.x < m)
        {
            q = p.xyz;
        }
        else if(3.0f * p.y < m)
        {
            q = p.yzx;
        }
        else if(3.0f * p.z < m)
        {
            q = p.zxy;
        }
        else
        {
            return m * 0.57735027f;
        }
        float k = clamp(0.5f * (q.z - q.y + s), 0.0f, s);
        return length(vec3(q.x, q.y - s + k, q.z - k));
    #endif

    // bound, not exact
    #if 0
        return m * 0.57735027f;
    #endif
}

float sdPyramid(in vec3 p, in float h)
{
    float m2 = h * h + 0.25f;

    // symmetry
    p.xz = abs(p.xz);
    p.xz = (p.z > p.x) ? p.zx : p.xz;
    p.xz -= 0.5f;

    // project into face plane (2D)
    vec3 q = vec3(p.z, h * p.y - 0.5f * p.x, h * p.x + 0.5f * p.y);

    float s = max(-q.x, 0.0f);
    float t = clamp((q.y - 0.5f * p.z) / (m2 + 0.25f), 0.0f, 1.0f);

    float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
    float b = m2 * (q.x + 0.5f * t) * (q.x + 0.5f * t) + (q.y - m2 * t) * (q.y - m2 * t);

    float d2 = min(q.y, -q.x * m2 - q.y * 0.5f) > 0.0f ? 0.0f : min(a, b);

    // recover 3D and scale, and add sign
    return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

// la,lb=semi axis, h=height, ra=corner
float sdRhombus(vec3 p, float la, float lb, float h, float ra)
{
    p = abs(p);
    vec2 b = vec2(la, lb);
    float f = clamp((ndot(b, b - 2.0f * p.xz)) / dot(b, b), -1.0f, 1.0f);
    vec2 q = vec2(length(p.xz - 0.5f * b * vec2(1.0f - f, 1.0f + f)) * sign(p.x * b.y + p.z * b.x - b.x * b.y) - ra, p.y - h);
    return min(max(q.x, q.y), 0.0f) + length(max(q, 0.0f));
}

float sdHorseshoe(in vec3 p, in vec2 c, in float r, in float le, vec2 w)
{
    p.x = abs(p.x);
    float l = length(p.xy);
    p.xy = mat2(-c.x, c.y, c.y, c.x) * p.xy;
    p.xy = vec2((p.y > 0.0f || p.x > 0.0f) ? p.x : l * sign(-c.x), (p.x > 0.0f) ? p.y : l);
    p.xy = vec2(p.x, abs(p.y - r)) - vec2(le, 0.0f);

    vec2 q = vec2(length(max(p.xy, 0.0f)) + min(0.0f, max(p.x, p.y)), p.z);
    vec2 d = abs(q) - w;
    return min(max(d.x, d.y), 0.0f) + length(max(d, 0.0f));
}

float sdU(in vec3 p, in float r, in float le, vec2 w)
{
    p.x = (p.y > 0.0f) ? abs(p.x) : length(p.xy);
    p.x = abs(p.x - r);
    p.y = p.y - le;
    float k = max(p.x, p.y);
    vec2 q = vec2((k < 0.0f) ? -k : length(max(p.xy, 0.0f)), abs(p.z)) - w;
    return length(max(q, 0.0f)) + min(max(q.x, q.y), 0.0f);
}

//------------------------------------------------------------------

vec2 opU(vec2 d1, vec2 d2)
{
    return (d1.x < d2.x) ? d1 : d2;
}

//------------------------------------------------------------------

#define ZERO (min(iFrame,0))

//------------------------------------------------------------------

vec2 map(in vec3 pos)
{
    vec2 res = vec2(pos.y, 0.0f);

    // bounding box
    if(sdBox(pos - vec3(-2.0f, 0.3f, 0.25f), vec3(0.3f, 0.3f, 1.0f)) < res.x)
    {
        res = opU(res, vec2(sdSphere(pos - vec3(-2.0f, 0.25f, 0.0f), 0.25f), 26.9f));
        res = opU(res, vec2(sdRhombus((pos - vec3(-2.0f, 0.25f, 1.0f)).xzy, 0.15f, 0.25f, 0.04f, 0.08f), 17.0f));
    }

    // bounding box
    if(sdBox(pos - vec3(0.0f, 0.3f, -1.0f), vec3(0.35f, 0.3f, 2.5f)) < res.x)
    {
        res = opU(res, vec2(sdCappedTorus((pos - vec3(0.0f, 0.30f, 1.0f)) * vec3(1, -1, 1), vec2(0.866025f, -0.5f), 0.25f, 0.05f), 25.0f));
        res = opU(res, vec2(sdBoxFrame(pos - vec3(0.0f, 0.25f, 0.0f), vec3(0.3f, 0.25f, 0.2f), 0.025f), 16.9f));
        res = opU(res, vec2(sdCone(pos - vec3(0.0f, 0.45f, -1.0f), vec2(0.6f, 0.8f), 0.45f), 55.0f));
        res = opU(res, vec2(sdCappedCone(pos - vec3(0.0f, 0.25f, -2.0f), 0.25f, 0.25f, 0.1f), 13.67f));
        res = opU(res, vec2(sdSolidAngle(pos - vec3(0.0f, 0.00f, -3.0f), vec2(3, 4) / 5.0f, 0.4f), 49.13f));
    }

    // bounding box
    if(sdBox(pos - vec3(1.0f, 0.3f, -1.0f), vec3(0.35f, 0.3f, 2.5f)) < res.x)
    {
        res = opU(res, vec2(sdTorus((pos - vec3(1.0f, 0.30f, 1.0f)).xzy, vec2(0.25f, 0.05f)), 7.1f));
        res = opU(res, vec2(sdBox(pos - vec3(1.0f, 0.25f, 0.0f), vec3(0.3f, 0.25f, 0.1f)), 3.0f));
        res = opU(res, vec2(sdCapsule(pos - vec3(1.0f, 0.00f, -1.0f), vec3(-0.1f, 0.1f, -0.1f), vec3(0.2f, 0.4f, 0.2f), 0.1f), 31.9f));
        res = opU(res, vec2(sdCylinder(pos - vec3(1.0f, 0.25f, -2.0f), vec2(0.15f, 0.25f)), 8.0f));
        res = opU(res, vec2(sdHexPrism(pos - vec3(1.0f, 0.2f, -3.0f), vec2(0.2f, 0.05f)), 18.4f));
    }

    // bounding box
    if(sdBox(pos - vec3(-1.0f, 0.35f, -1.0f), vec3(0.35f, 0.35f, 2.5f)) < res.x)
    {
        res = opU(res, vec2(sdPyramid(pos - vec3(-1.0f, -0.6f, -3.0f), 1.0f), 13.56f));
        res = opU(res, vec2(sdOctahedron(pos - vec3(-1.0f, 0.15f, -2.0f), 0.35f), 23.56f));
        res = opU(res, vec2(sdTriPrism(pos - vec3(-1.0f, 0.15f, -1.0f), vec2(0.3f, 0.05f)), 43.5f));
        res = opU(res, vec2(sdEllipsoid(pos - vec3(-1.0f, 0.25f, 0.0f), vec3(0.2f, 0.25f, 0.05f)), 43.17f));
        res = opU(res, vec2(sdHorseshoe(pos - vec3(-1.0f, 0.25f, 1.0f), vec2(cos(1.3f), sin(1.3f)), 0.2f, 0.3f, vec2(0.03f, 0.08f)), 11.5f));
    }

    // bounding box
    if(sdBox(pos - vec3(2.0f, 0.3f, -1.0f), vec3(0.35f, 0.3f, 2.5f)) < res.x)
    {
        res = opU(res, vec2(sdOctogonPrism(pos - vec3(2.0f, 0.2f, -3.0f), 0.2f, 0.05f), 51.8f));
        res = opU(res, vec2(sdCylinder(pos - vec3(2.0f, 0.14f, -2.0f), vec3(0.1f, -0.1f, 0.0f), vec3(-0.2f, 0.35f, 0.1f), 0.08f), 31.2f));
        res = opU(res, vec2(sdCappedCone(pos - vec3(2.0f, 0.09f, -1.0f), vec3(0.1f, 0.0f, 0.0f), vec3(-0.2f, 0.40f, 0.1f), 0.15f, 0.05f), 46.1f));
        res = opU(res, vec2(sdRoundCone(pos - vec3(2.0f, 0.15f, 0.0f), vec3(0.1f, 0.0f, 0.0f), vec3(-0.1f, 0.35f, 0.1f), 0.15f, 0.05f), 51.7f));
        res = opU(res, vec2(sdRoundCone(pos - vec3(2.0f, 0.20f, 1.0f), 0.2f, 0.1f, 0.3f), 37.0f));
    }

    return res;
}

// https://iquilezles.org/articles/boxfunctions
vec2 iBox(in vec3 ro, in vec3 rd, in vec3 rad)
{
    vec3 m = 1.0f / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * rad;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
    return vec2(max(max(t1.x, t1.y), t1.z), min(min(t2.x, t2.y), t2.z));
}

vec2 raycast(in vec3 ro, in vec3 rd)
{
    vec2 res = vec2(-1.0f, -1.0f);

    float tmin = 1.0f;
    float tmax = 20.0f;

    // raytrace floor plane
    float tp1 = (0.0f - ro.y) / rd.y;
    if(tp1 > 0.0f)
    {
        tmax = min(tmax, tp1);
        res = vec2(tp1, 1.0f);
    }
    //else return res;

    // raymarch primitives
    vec2 tb = iBox(ro - vec3(0.0f, 0.4f, -0.5f), rd, vec3(2.5f, 0.41f, 3.0f));
    if(tb.x < tb.y && tb.y > 0.0f && tb.x < tmax)
    {
        //return vec2(tb.x,2.0);
        tmin = max(tb.x, tmin);
        tmax = min(tb.y, tmax);

        float t = tmin;
        for(int i = 0; i < 70 && t < tmax; i++)
        {
            vec2 h = map(ro + rd * t);
            if(abs(h.x) < (0.0001f * t))
            {
                res = vec2(t, h.y);
                break;
            }
            t += h.x;
        }
    }

    return res;
}

// https://iquilezles.org/articles/rmshadows
float calcSoftshadow(in vec3 ro, in vec3 rd, in float mint, in float tmax)
{
    // bounding volume
    float tp = (0.8f - ro.y) / rd.y;
    if(tp > 0.0f)
        tmax = min(tmax, tp);

    float res = 1.0f;
    float t = mint;
    for(int i = ZERO; i < 24; i++)
    {
        float h = map(ro + rd * t).x;
        float s = clamp(8.0f * h / t, 0.0f, 1.0f);
        res = min(res, s);
        t += clamp(h, 0.01f, 0.2f);
        if(res < 0.004f || t > tmax)
            break;
    }
    res = clamp(res, 0.0f, 1.0f);
    return res * res * (3.0f - 2.0f * res);
}

// https://iquilezles.org/articles/normalsSDF
vec3 calcNormal(in vec3 pos)
{
#if 0
    // do NOT call map() many times inside calcNormal()
    vec2 e = vec2(1.0f, -1.0f) * 0.5773f * 0.0005f;
    return normalize(e.xyy * map(pos + e.xyy).x +
        e.yyx * map(pos + e.yyx).x +
        e.yxy * map(pos + e.yxy).x +
        e.xxx * map(pos + e.xxx).x);
#else
    // instead put it only once and in a loop to prevet
    // code expansion - inspired by tdhooper and klems - a way to prevent the compiler from inlining map() 4 times
    vec3 n = vec3(0.0f);
    for(int i = ZERO; i < 4; i++)
    {
        vec3 e = 0.5773f * (2.0f * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0f);
        n += e * map(pos + 0.0005f * e).x;
      //if( n.x+n.y+n.z>100.0 ) break;
    }
    return normalize(n);
#endif
}

// https://iquilezles.org/articles/nvscene2008/rwwtt.pdf
float calcAO(in vec3 pos, in vec3 nor)
{
    float occ = 0.0f;
    float sca = 1.0f;
    for(int i = ZERO; i < 5; i++)
    {
        float h = 0.01f + 0.12f * float(i) / 4.0f;
        float d = map(pos + h * nor).x;
        occ += (h - d) * sca;
        sca *= 0.95f;
        if(occ > 0.35f)
            break;
    }
    return clamp(1.0f - 3.0f * occ, 0.0f, 1.0f) * (0.5f + 0.5f * nor.y);
}

// https://iquilezles.org/articles/checkerfiltering
float checkersGradBox(in vec2 p, in vec2 dpdx, in vec2 dpdy)
{
    // filter kernel
    vec2 w = abs(dpdx) + abs(dpdy) + 0.001f;
    // analytical integral (box filter)
    vec2 i = 2.0f * (abs(fract((p - 0.5f * w) * 0.5f) - 0.5f) - abs(fract((p + 0.5f * w) * 0.5f) - 0.5f)) / w;
    // xor pattern
    return 0.5f - 0.5f * i.x * i.y;
}

vec3 render(in vec3 ro, in vec3 rd, in vec3 rdx, in vec3 rdy)
{
    // background
    vec3 col = vec3(0.7f, 0.7f, 0.9f) - max(rd.y, 0.0f) * 0.3f;

    // raycast scene
    vec2 res = raycast(ro, rd);
    float t = res.x;
    float m = res.y;
    if(m > -0.5f)
    {
        vec3 pos = ro + t * rd;
        vec3 nor = (m < 1.5f) ? vec3(0.0f, 1.0f, 0.0f) : calcNormal(pos);
        vec3 ref = reflect(rd, nor);

        // material
        col = 0.2f + 0.2f * sin(m * 2.0f + vec3(0.0f, 1.0f, 2.0f));
        float ks = 1.0f;

        if(m < 1.5f)
        {
            // project pixel footprint into the plane
            vec3 dpdx = ro.y * (rd / rd.y - rdx / rdx.y);
            vec3 dpdy = ro.y * (rd / rd.y - rdy / rdy.y);

            float f = checkersGradBox(3.0f * pos.xz, 3.0f * dpdx.xz, 3.0f * dpdy.xz);
            col = 0.15f + f * vec3(0.05f);
            ks = 0.4f;
        }

        // lighting
        float occ = calcAO(pos, nor);

        vec3 lin = vec3(0.0f);

        // sun
        {
            vec3 lig = normalize(vec3(-0.5f, 0.4f, -0.6f));
            vec3 hal = normalize(lig - rd);
            float dif = clamp(dot(nor, lig), 0.0f, 1.0f);
            // if( dif>0.0001 )
            dif *= calcSoftshadow(pos, lig, 0.02f, 2.5f);
            float spe = pow(clamp(dot(nor, hal), 0.0f, 1.0f), 16.0f);
            spe *= dif;
            spe *= 0.04f + 0.96f * pow(clamp(1.0f - dot(hal, lig), 0.0f, 1.0f), 5.0f);
            // spe *= 0.04+0.96*pow(clamp(1.0-sqrt(0.5*(1.0-dot(rd,lig))),0.0,1.0),5.0);
            lin += col * 2.20f * dif * vec3(1.30f, 1.00f, 0.70f);
            lin += 5.00f * spe * vec3(1.30f, 1.00f, 0.70f) * ks;
        }
        // sky
        {
            float dif = sqrt(clamp(0.5f + 0.5f * nor.y, 0.0f, 1.0f));
            dif *= occ;
            float spe = smoothstep(-0.2f, 0.2f, ref.y);
            spe *= dif;
            spe *= 0.04f + 0.96f * pow(clamp(1.0f + dot(nor, rd), 0.0f, 1.0f), 5.0f);
          //if( spe>0.001 )
            spe *= calcSoftshadow(pos, ref, 0.02f, 2.5f);
            lin += col * 0.60f * dif * vec3(0.40f, 0.60f, 1.15f);
            lin += 2.00f * spe * vec3(0.40f, 0.60f, 1.30f) * ks;
        }
        // back
        {
            float dif = clamp(dot(nor, normalize(vec3(0.5f, 0.0f, 0.6f))), 0.0f, 1.0f) * clamp(1.0f - pos.y, 0.0f, 1.0f);
            dif *= occ;
            lin += col * 0.55f * dif * vec3(0.25f, 0.25f, 0.25f);
        }
        // sss
        {
            float dif = pow(clamp(1.0f + dot(nor, rd), 0.0f, 1.0f), 2.0f);
            dif *= occ;
            lin += col * 0.25f * dif * vec3(1.00f, 1.00f, 1.00f);
        }

        col = lin;

        col = mix(col, vec3(0.7f, 0.7f, 0.9f), 1.0f - exp(-0.0001f * t * t * t));
    }

    return vec3(clamp(col, 0.0f, 1.0f));
}

mat3 setCamera(in vec3 ro, in vec3 ta, float cr)
{
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0f);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = (cross(cu, cw));
    return mat3(cu, cv, cw);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 mo = iMouseL.xy / iResolution.xy;
    float time = 32.0f + iTime * 1.5f;

    // camera
    vec3 ta = vec3(0.25f, -0.75f, -0.75f);
    vec3 ro = ta + vec3(4.5f * cos(0.1f * time + 7.0f * mo.x), 2.2f, 4.5f * sin(0.1f * time + 7.0f * mo.x));

    // camera-to-world transformation
    mat3 ca = setCamera(ro, ta, 0.0f);

    vec3 tot = vec3(0.0f);
#if AA>1
    for(int m = ZERO; m < AA; m++) for(int n = ZERO; n < AA; n++)
        {
            // pixel coordinates
            vec2 o = vec2(float(m), float(n)) / float(AA) - 0.5f;
            vec2 p = (2.0f * (fragCoord + o) - iResolution.xy) / iResolution.y;
#else
            vec2 p = (2.0f * fragCoord - iResolution.xy) / iResolution.y;
#endif
            // focal length
            const float fl = 2.5f;

            // ray direction
            vec3 rd = ca * normalize(vec3(p, fl));

            // ray differentials
            vec2 px = (2.0f * (fragCoord + vec2(1.0f, 0.0f)) - iResolution.xy) / iResolution.y;
            vec2 py = (2.0f * (fragCoord + vec2(0.0f, 1.0f)) - iResolution.xy) / iResolution.y;
            vec3 rdx = ca * normalize(vec3(px, fl));
            vec3 rdy = ca * normalize(vec3(py, fl));

            // render
            vec3 col = render(ro, rd, rdx, rdy);

            // gain
            // col = col*3.0/(2.5+col);

            // gamma
            col = pow(col, vec3(0.4545f));

            tot += col;
#if AA>1
        }
    tot /= float(AA * AA);
#endif

    fragColor = vec4(tot, 1.0f);
}