#version 300 es

#ifdef GL_ES
    precision highp float;
    precision highp int;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

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

// *******************************************************************
// "p6mm inversion" by Carlos Ureña - 2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// *******************************************************************
// square root of 2
const float sqr2 = 1.4142135623730950488016887242096980785696f;

// square root of 3.0
const float sqr3 = 1.7320508075688772935274463415058723669428f;

// inverses
const float sqr2_inv = 1.0f / sqr2;
const float sqr3_inv = 1.0f / sqr3;

// length of triangle in NDC (mind --> 1.0)
const float l = 0.35f;
const float l_inv = 1.0f / l;

// 0.015
const float line_w = 0.02f;

const vec2 u = 1.0f * vec2(1.0f, 0.0f);
const vec2 v = 0.5f * vec2(1.0f, sqr3);
const vec2 u_dual = 1.0f * vec2(1.0f, -sqr3_inv);
const vec2 v_dual = 2.0f * vec2(0.0f, sqr3_inv);
const vec2 tri_cen = vec2(0.5f, 0.5f * sqr3_inv); // triangle center

vec2 center; //= 0.5*iResolution.xy ;        // viewport center in DC
float mind; // = min(iResolution.x,iResolution.y);

// mirror reflection of 'p' around and axis through 'v1' and 'v2'
// (only for points to right of the line from v1 to v2)
vec2 mirror(vec2 p, vec2 v1, vec2 v2)
{
    vec2 s = v2 - v1, n = normalize(vec2(s.y, -s.x));
    float d = dot(p - v1, n);

    return p - max(0.0f, 2.0f * d) * n;
}

float dist(vec2 p, vec2 v1, vec2 v2)
{
    vec2 s = v2 - v1, n = normalize(vec2(s.y, -s.x));
    return dot(p - v1, n);
}

vec2 p6mm_ToFundamental(vec2 p0)
{
    // p1 = fragment coords. in the grid reference frame

    vec2 p1 = p0 * mat2(u_dual, v_dual);  //=vec2( dot(p0,u_dual), dot(p0,v_dual) );

    // p2 = fragment coords in the translated grid reference frame

    vec2 p2 = fract(p1); // = vec2( fract(p1.x), fract(p1.y) ) ;

    // p3 = barycentric coords in the translated triangle
    // (mirror, using line x+y-1=0 as axis, when point is right and above axis)

    vec2 p3 = mirror(p2, vec2(1.0f, 0.0f), vec2(0.0f, 1.0f));

    // p4 = p3, but expressed back in cartesian coordinates

    vec2 p4 = p3.x * u + p3.y * v;

    // p7 = mirror around the three lines through the barycenter, perp. to edges.

    vec2 p5 = mirror(p4, vec2(0.5f, 0.0f), tri_cen);
    vec2 p6 = mirror(p5, vec2(1.0f, 0.0f), tri_cen);
    vec2 p7 = mirror(p6, tri_cen, vec2(0.0f, 0.0f));

    return p7;
}

float DistanceFunc(float d)
{
    return smoothstep(line_w * 1.15f, line_w * 0.85f, d);
}

vec4 p6mm_SimmetryLines(vec2 p_ndc)
{
    vec2 pf = p6mm_ToFundamental(p_ndc);

    float d1 = abs(pf.y), d2 = abs(pf.x - 0.5f), d3 = abs(dist(pf, tri_cen, vec2(0.0f, 0.0f)));

    vec4 res = vec4(0.0f, 0.0f, 0.0f, 1.0f);

    res.r = DistanceFunc(d2);
    res.g = DistanceFunc(d1);
    res.b = DistanceFunc(d3);

    return res;
}

vec2 DCToNDC(vec2 p_dc)
{
    return l_inv * (p_dc - center) / mind;
}
vec2 Inversion(vec2 p, vec2 cen)
{
    const float speedFactor = 5.0f;
    float secs = iTime * speedFactor;
    vec2 vr = p - cen;
    return cen + vr / dot(vr, vr) * 10.0f   //cen + normalize(vr)/(r*0.1)
    + secs / 4.0f * vec2(1.0f, 0.5f);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    const int n = 9;

    // viewport center in DC
    center = 0.5f * iResolution.xy;
    mind = min(iResolution.x, iResolution.y);

    vec4 res = vec4(0.0f, 0.0f, 0.0f, 1.0f);

    vec2 mou = DCToNDC(0.5f * iResolution.xy);
    if(iMouse.w != 0.0f)
    {
        mou = DCToNDC(iMouse.xy);
    }

    for(int ix = 0; ix < n; ix += 1) for(int iy = 0; iy < n; iy += 1)
    {
        float px = -0.5f + (0.5f + float(ix)) / float(n), py = -0.5f + (0.5f + float(iy)) / float(n);
        vec2 pNDC = DCToNDC(fragCoord + vec2(px, py));
        vec2 pinv = Inversion(pNDC, mou);
        res += p6mm_SimmetryLines(pinv);
    }

    fragColor = res / (float(n) * float(n));
}