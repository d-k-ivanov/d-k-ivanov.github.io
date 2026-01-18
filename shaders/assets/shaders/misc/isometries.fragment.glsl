#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;

// Texture with font atlas: assets/textures/iChannel0.png
uniform sampler2D iChannel0;

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
// Isometries in Poincare's disk.
// https://www.shadertoy.com/view/3c3fR8
// Author: neozhaolian
// *******************************************************************

/*
This shader shows the three types of isometries of 
Poincare's unit disc:

1. elliptic: one fixed point inside the disc (
the other one lies outside)
2. parabolic: one fixed point on the boundary (the two
fixed points coincide)
3. hyperbolic: both two fixed points are on the boundary
*/
#define PI 3.14159265359
#define NUM_OCTAVES 2
#define GRID_STEP 4.0
#define GRID_DENSITY 6.0
#define AA 2

const float ATLAS_SIDE = 16.0f; // 16x16 grid of 256 glyphs

const float FIXED_POINT_SIZE = 0.02f;
const vec2 ELLIPTIC_FIXED = vec2(0.45f, 0.20f);

vec2 cmul(vec2 z, vec2 w)
{
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

vec2 cdiv(vec2 z, vec2 w)
{
    return vec2(z.x * w.x + z.y * w.y, -z.x * w.y + z.y * w.x) / dot(w, w);
}

vec2 cconj(vec2 z)
{
    return vec2(z.x, -z.y);
}

vec2 diskToUHP(vec2 z)
{
    return cdiv(cmul(vec2(0, 1), vec2(1, 0) + z), vec2(1, 0) - z);
}

float e2h(float r)
{
    return 2.0f * atanh(r);
}

struct Mobius
{
    vec2 A, B, C, D;
};

Mobius su11(vec2 alpha, vec2 beta)
{
    return Mobius(alpha, beta, cconj(beta), cconj(alpha));
}

Mobius su11(vec2 a)
{
    float s = inversesqrt(max(1.0f - dot(a, a), 1e-8f));
    return su11(vec2(s, 0.0f), -a * s);
}

vec2 applyMobius(Mobius m, vec2 z)
{
    return cdiv(cmul(m.A, z) + m.B, cmul(m.C, z) + m.D);
}

Mobius composeMobius(Mobius f, Mobius g)
{
    Mobius h;
    h.A = cmul(f.A, g.A) + cmul(f.B, g.C);
    h.B = cmul(f.A, g.B) + cmul(f.B, g.D);
    h.C = cmul(f.C, g.A) + cmul(f.D, g.C);
    h.D = cmul(f.C, g.B) + cmul(f.D, g.D);
    return h;
}

Mobius su11_hyperbolic(float s)
{
    return su11(vec2(cosh(s), 0.0f), vec2(sinh(s), 0.0f));
}

vec2 atlasCell(int code)
{
    return vec2(mod(float(code), ATLAS_SIDE), floor(float(code) / ATLAS_SIDE));
}

// Returns the glyph coverage for a character code at a local UV inside the cell (0-1 range).
// Flips V so atlases stored top-left first sample correctly in GL's bottom-left space.
float sampleChar(int code, vec2 localUV)
{
    if(code < 0 || code > 255)
    {
        return 0.0f;
    }

    vec2 clamped = clamp(localUV, 0.0f, 1.0f);
    vec2 flipped = vec2(clamped.x, 1.0f - clamped.y);
    vec2 cell = atlasCell(code);
    return texture(iChannel0, (cell + flipped) / ATLAS_SIDE).r;
}

float drawTitle(int mode, vec2 uv)
{
    uv = (uv - vec2(0.27f, 0.8f)) / vec2(0.08f, 0.06f);
    float alpha = 0.0f;
    float adv = 0.6f;
    int str[10];
    int len = 0;

    if(mode == 0)
    {
        str[0] = 69;
        str[1] = 108;
        str[2] = 108;
        str[3] = 105;
        str[4] = 112;
        str[5] = 116;
        str[6] = 105;
        str[7] = 99;
        len = 8;
    }
    if(mode == 1)
    {
        str[0] = 80;
        str[1] = 97;
        str[2] = 114;
        str[3] = 97;
        str[4] = 98;
        str[5] = 111;
        str[6] = 108;
        str[7] = 105;
        str[8] = 99;
        len = 9;
    }
    if(mode == 2)
    {
        str[0] = 72;
        str[1] = 121;
        str[2] = 112;
        str[3] = 101;
        str[4] = 114;
        str[5] = 98;
        str[6] = 111;
        str[7] = 108;
        str[8] = 105;
        str[9] = 99;
        len = 10;
    }

    for(int i = 0; i < 10; i++)
    {
        if(i >= len)
            break;
        float a = sampleChar(str[i], uv - vec2(float(i) * adv, 0.0f));
        alpha = max(alpha, a);
    }

    return clamp(alpha, 0.0f, 1.0f);
}

vec3 colormap(float t)
{
    float x = 6.28f * t;
    vec3 c;
    c.r = 0.5f + 0.5f * cos(x + 0.00f);
    c.g = 0.5f + 0.5f * cos(x + 2.09f);
    c.b = 0.5f + 0.5f * cos(x + 4.18f);
    c = pow(c, vec3(0.75f));
    c = mix(vec3(0.15f), c, 0.9f);
    return clamp(c, 0.0f, 1.0f);
}

float get_checker(vec2 z)
{
    vec2 par = mod(floor(z), 2.0f);
    return (par.x == par.y) ? 1.0f : 0.0f;
}

float get_grid_line(vec2 z, float thickness)
{
    vec2 dist = abs(fract(z + 0.5f) - 0.5f);
    vec2 deriv = fwidth(z);
    vec2 gridAA = smoothstep(deriv * (thickness + 1.0f), deriv * (thickness - 1.0f), dist);
    return max(gridAA.x, gridAA.y);
}

float draw_point(vec2 p, vec2 center, float radius)
{
    return 1.0f - smoothstep(radius, radius + 0.005f, length(p - center));
}

vec3 render(vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 q = (fragCoord - 0.5f * iResolution.xy) / iResolution.y;
    float aspect = iResolution.x / iResolution.y;
    float split_x = uv.x * 3.0f;
    int mode = clamp(int(split_x), 0, 2);
    float colIndex = float(mode);
    float colWidth = aspect / 3.0f;

    float x_left = (-0.5f + colIndex / 3.f) * aspect;
    float margin = 0.025f;
    float x_inner_left = x_left + margin * colWidth;
    float x_inner_right = x_left + (1.0f - margin) * colWidth;
    float interiorWidth = (1.0f - 2.0f * margin) * colWidth;
    float cx = x_left + 0.5f * colWidth;

    float center_y = -0.05f;
    float R = min(interiorWidth * 0.5f, 0.45f);

    vec2 p_screen = vec2((q.x - cx) / R, (q.y - center_y) / R);
    vec2 uv_local_norm = vec2(fract(split_x), uv.y);

    vec3 finalColor = mix(vec3(0.15f), vec3(1), drawTitle(mode, uv_local_norm));

    float r = length(p_screen);
    float fw = fwidth(r);
    float diskMask = 1.0f - smoothstep(1.0f - fw, 1.0f + fw, r);

    vec3 diskColor = vec3(0.0f);

    if(diskMask > 0.0f)
    {
        vec2 p_disk = p_screen * min(1.0f, 0.99999f / max(r, 1e-8f));

        vec2 base_coord = vec2(0.0f);
        float color_t = 0.0f;

        if(mode == 0)
        {
            float theta = iTime * 0.8f;
            vec2 w_rot = cmul(vec2(cos(theta), sin(theta)), applyMobius(su11(ELLIPTIC_FIXED), p_disk));
            float rr = clamp(length(w_rot), 0.0f, 0.999f);
            float ang = atan(w_rot.y, w_rot.x);
            base_coord = vec2(e2h(rr), ang * (GRID_DENSITY / (2.0f * PI)));
            color_t = ang / PI * 0.5f + 0.5f;

        }
        else if(mode == 1)
        {
            vec2 w = diskToUHP(p_disk);
            w.x += iTime * 2.0f;
            float ly = log(w.y);
            base_coord = vec2(w.x, ly) * (GRID_DENSITY / 4.0f);
            color_t = fract(ly * 0.5f);

        }
        else
        {
            Mobius m = su11_hyperbolic(sin(iTime * 0.6f));
            vec2 w = diskToUHP(applyMobius(m, p_disk));
            float r_uhp = max(length(w), 1e-4f);
            float ang_uhp = atan(w.y, w.x);
            base_coord = vec2(log(r_uhp), ang_uhp) * (GRID_DENSITY / 2.0f);
            color_t = ang_uhp / PI;
        }

        float dist_to_edge = 1.0f - length(p_disk);
        float thinning = smoothstep(0.0f, 0.05f, dist_to_edge);

        float acc_shade = 0.0f;
        float acc_grid = 0.0f;
        float total_w = 0.0f;
        float current_scale = 1.0f;

        for(int i = 0; i < NUM_OCTAVES; i++)
        {
            float w_oct = 1.0f / float(i + 1);
            vec2 octave_coord = base_coord * current_scale;
            acc_shade += w_oct * get_checker(octave_coord);
            float octave_thinning = thinning / (float(i) + 6.0f);
            acc_grid += w_oct * get_grid_line(octave_coord, octave_thinning);
            total_w += w_oct;
            current_scale *= GRID_STEP;
        }

        float shade_val = acc_shade / total_w;
        float grid_val = clamp(acc_grid / (total_w * 0.6f), 0.0f, 1.0f);
        grid_val *= smoothstep(0.0f, 0.02f, dist_to_edge);

        vec3 color_base = colormap(color_t);
        if(mode == 1)
            color_base = color_base.gbr;
        if(mode == 2)
            color_base = color_base.brg;

        color_base = sqrt(color_base);
        color_base = mix(vec3(1.0f), color_base, 0.55f);
        float gamma = 0.454f;
        color_base = pow(color_base, vec3(gamma));

        float shade_factor = mix(0.92f, 1.02f, shade_val);
        vec3 shaded_color = color_base * shade_factor;

        diskColor = mix(shaded_color, vec3(0.15f), grid_val * 0.5f);
        diskColor = pow(diskColor, vec3(1.0f / gamma));
    }

    finalColor = mix(finalColor, diskColor, diskMask);
    float edge = 1.f - smoothstep(0.f, 0.005f, abs(r - 1.f) - 0.005f);
    finalColor = mix(finalColor, vec3(1.0f), edge);

    float dots_mask = 0.0f;
    vec3 dots_color = vec3(0.0f);

    if(mode == 0)
    {
        dots_mask += draw_point(p_screen, ELLIPTIC_FIXED, FIXED_POINT_SIZE);
        dots_color = vec3(1.0f, 0.3f, 0.3f);
    }
    else if(mode == 1)
    {
        vec2 fix = vec2(1.0f, 0.0f);
        dots_mask += draw_point(p_screen, fix, FIXED_POINT_SIZE);
        dots_color = vec3(0.f, 1.0f, 0.5f);
    }
    else
    {
        vec2 fix1 = vec2(1.0f, 0.0f);
        vec2 fix2 = vec2(-1.0f, 0.0f);
        dots_mask += draw_point(p_screen, fix1, FIXED_POINT_SIZE);
        dots_mask += draw_point(p_screen, fix2, FIXED_POINT_SIZE);
        dots_color = vec3(1.f, 1.f, 0.3f);
    }

    finalColor = mix(finalColor, dots_color, clamp(dots_mask, 0.0f, 1.0f));

    return finalColor;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 col = vec3(0.0f);
    for(int j = 0; j < AA; j++)
    {
        for(int i = 0; i < AA; i++)
        {
            vec2 o = (vec2(float(i) + 0.5f, float(j) + 0.5f) / float(AA) - 0.5f);
            col += render(fragCoord + o);
        }
    }
    col /= float(AA * AA);
    fragColor = vec4(col, 1.0f);
}
