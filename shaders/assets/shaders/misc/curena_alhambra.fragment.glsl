#version 300 es

#ifdef GL_ES
    precision highp float;
    precision highp int;
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
// ISLAMIC STAR PATTERNS
// Alhambra, Boat Hall (Sala de la Barca).
//
// Carlos Ureña, Sep. 2021
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// *******************************************************************

// ------------------------------------------------------------------------------------
// configurable constants (visualization)

// root of the number of samples per pixel
const int nspp_root = 7;

// visible region in world coordinates, size in X
const float vis_wcc_sx = 5.2f;

bool schematic_view = false;

// ------------------------------------------------------------------------------------
// configurable constants (tiling shape)

// measured aproximatelly from the tiling photo ...
const float stars_outer_rad = 0.220f;

// just guessing ...
const float ribbons_width = 0.070f;
const float ribbons_edge_width = 0.007f;

// ------------------------------------------------------------------------------------
// computed or fixed constants

// number of samples per pixel
const int nspp = nspp_root * nspp_root;

// root of number of samples per pixel (as a float)
const float nspp_root_f = float(nspp_root);

const float pi = 3.14159265359f;
const float root_of_2 = 1.41421356237f;
const float root_of_2_inv = 1.0f / root_of_2;

// normalized diagonal (upwards, main diag)
const vec2 norm_diag_1 = vec2(root_of_2_inv, root_of_2_inv);

// normalized diagonal (downwards, perp. to main diag)
const vec2 norm_diag_2 = vec2(root_of_2_inv, -root_of_2_inv);

// -------------------------------------------------------------------------------
// mirror reflection of 'p' around and axis through two points 'q1' and 'q2'
// (only for points in the halfplane to the right of the line from p1 to p2)
// 'mirror_count' is increased only when 'p' is in the right halfplane
vec2 MirrorPP(vec2 p, vec2 q1, vec2 q2, inout int mirror_count)
{
    vec2 s = q2 - q1, n = normalize(vec2(s.y, -s.x));
    float d = dot(p - q1, n);

    if(0.0f <= d)
    {
        mirror_count = mirror_count + 1;
        return p - 2.0f * d * n;
    }
    else
    {
        return p;
    }
}

// -------------------------------------------------------------------------------
// mirror reflection of 'p' around and axis through point 'q' and parallel to normalized vector 'v'
// (only for points in the halfplane to the right of the axis)
// 'mirror_count' is increased only when 'p' is in the right halfplane
vec2 MirrorPN(vec2 p, vec2 q, vec2 v, inout int mirror_count)
{
    vec2 n = vec2(v.y, -v.x);
    float d = dot(p - q, n);

    if(0.0f <= d)
    {
        mirror_count = mirror_count + 1;
        return p - 2.0f * d * n;
    }
    else
    {
        return p;
    }
}

// -------------------------------------------------------------------
// computes (closest) distance from point 'p' to segment from 'a' to 'b'
// see Iñigo Quilez derivation at: https://www.youtube.com/watch?v=PMltMdi1Wzg
// (particularized here for R=0)
float PointToSegmentDist(vec2 p, vec2 a, vec2 b)
{
    float h = min(1.0f, max(0.0f, dot(p - a, b - a) / dot(b - a, b - a)));
    return length(p - a - (b - a) * h);
}
//-------------------------------------------------------------------------------------
// distance from 'p' to (extended) segment through three points

float Point1SegmentDistance(vec2 p, vec2 a, vec2 b)
{
    return PointToSegmentDist(p, a + 3.0f * (a - b), b + 3.0f * (b - a));

}

// distance from 'p' to (extended) polyline through three points
float Point2SegmentDistance(vec2 p, vec2 a, vec2 b, vec2 c)
{
    float d1 = PointToSegmentDist(p, a + 3.0f * (a - b), b);
    float d2 = PointToSegmentDist(p, b, c + 3.0f * (c - b));

    return min(d1, d2);
}

// distance from 'p' to (extended) polyline through four points
float Point3SegmentDistance(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d)
{
    float d1 = PointToSegmentDist(p, a + 3.0f * (a - b), b);
    float d2 = PointToSegmentDist(p, b, c);
    float d3 = PointToSegmentDist(p, c, d + 3.0f * (d - c));

    return min(d1, min(d2, d3));
}

//-------------------------------------------------------------------------------------
// returns true iif 'p' is on the left side of the line through 'a' towards 'b'
// returns false for the right side
bool IsOnLeftSide(vec2 p, vec2 a, vec2 b)
{
   // use dot product of b-a and vector to the left direction
    return 0.0f <= dot(p - a, vec2(a.y - b.y, b.x - a.x));
}

//-------------------------------------------------------------------------------------
// Compute pattern color at a point given in WCC
vec4 PatternWCC(in vec2 point_wcc)
{
    //float split_x  = sin( iTime*0.5 )*0.5*vis_wcc_sx ;
    //schematic_view = ( split_x <= point_wcc.x  ) ;

    vec2 intp_f = floor(point_wcc);     // integral part of point coordinates (as floats)
    ivec2 intp_i = ivec2(intp_f);       // integral part of point coordinates (as integers)
    vec2 fracp = point_wcc - intp_f;    // fractional part of point coordinates
    int ham_cnt = 0;                    // horizontal axis mirror count
    int vam_cnt = 0;                    // vertical   axis mirror count
    int da1m_cnt = 0;                   // diagonal  axis 1 mirror count (axis from (0,0) to (1,1))
    int da2m_cnt = 0;                   // diagonal  axis 2 mirror count (axis from (0,1) to (1,0))

    // take 'fracp' to the 'basic' region, track numbers of mirror reflections needed

    vec2 p1 = MirrorPN(fracp, vec2(0.5f, 0.0f), vec2(0.0f, 1.0f), vam_cnt);  // p1.x <= 0.5
    vec2 p2 = MirrorPN(p1, vec2(1.0f, 0.5f), vec2(-1.0f, 0.0f), ham_cnt);  // p2.y <= 0.5
    vec2 p3 = MirrorPN(p2, vec2(0.0f, 0.0f), -norm_diag_1, da1m_cnt); // p3.y <= p3.x
    vec2 p4 = MirrorPN(p3, vec2(0.5f, 0.0f), -norm_diag_2, da2m_cnt); // p4.x+p4.y <= 0.5

    // on schematic view, if on mirror edge axes, return an edge color
    if(schematic_view)
    {
       // compute minimun distance to mirror edge axes
        float d1 = p4.y;
        float d2 = dot(p4, vec2(root_of_2_inv, -root_of_2_inv));
        float d3 = dot(p4 - vec2(0.5f, 0.0f), vec2(-root_of_2_inv, -root_of_2_inv));
        float d = min(d1, min(d2, d3));

       // if on edge, return edge color
        if(d < 0.0015f)
        {
            return vec4(0.5f, 0.0f, 0.0f, 1.0f);
        }
    }

    int cnt = vam_cnt + ham_cnt + da1m_cnt + da2m_cnt;

    // true if point is in fundamental region
    bool in_fundm = (cnt == 0) && (intp_i.x == 0) && (intp_i.y == 0);

    // define vertexes of the polyline through the center of the ribbon

    const float R = stars_outer_rad;
    const float s = root_of_2_inv;
    const float t = tan(pi / 8.0f);
    const float u = 1.0f - 2.0f * t;
    const float w = 0.5f * ribbons_width;
    const float e = 0.5f * ribbons_edge_width;

    vec2 a1 = R * vec2(1.0f, 0.0f);
    vec2 a2 = R * vec2(1.0f - s * t, s * t);
    vec2 a3 = R * vec2(1.0f - s * t, s);
    vec2 a4 = R * vec2(1.0f + s * u, s);

    float h = 0.5f * length(a4 - a2);

    vec2 a5 = vec2(a4.x + (a4.y - h), h);
    vec2 a6 = vec2(0.5f - a5.y, a5.y);
    vec2 a7 = vec2(a6.x, 0.0f);

    // compute distances from 'p4' to ribbons (extended on their edges)

    float d1 = Point2SegmentDistance(p4, a1, a2, a3);     // ribbon 1
    float d2 = Point3SegmentDistance(p4, a3, a4, a5, a6); // ribbon 2
    float d3 = Point1SegmentDistance(p4, a6, a7);         // ribbon 3

    // compute ribbons inclusion flags

    bool in1 = (d1 <= w + e);
    bool in2 = (d2 <= w + e);
    bool in3 = (d3 <= w + e);

    // if in any ribbon, compute and return color
    if(in1 || in2 || in3)
    {
        float d;

        if(schematic_view)
        {
            if(in1 && in2)
            {
                d = min(d1, d2);
            }
            else if(in2 && in3)
            {
                d = min(d2, d3);
            }
            else if(in1)
            {
                d = d1;
            }
            else if(in2)
            {
                d = d2;
            }
            else if(in3)
            {
                d = d3;
            }

            vec4 col;
            if(w - e <= d && d <= w + e)
            {
                col = vec4(0.4f, 0.4f, 0.4f, 1.0f); // ribbon edges (gray)
            }
            else if(d <= w)
            {
                col = vec4(1.0f, 1.0f, 1.0f, 1.0f);   // ribbon interior (white)
            }

            if(in_fundm)
            {
                col = vec4(col.r, 0.0f, 0.0f, 1.0f);
            }
            return col;
        }
        else
        {
            if(in1 && in2)
            {
                if((cnt & 1) == 1)
                {
                    d = d1;
                }
                else
                {
                    d = d2;
                }
            }
            else if(in2 && in3)
            {
                if((cnt & 1) == 1)
                {
                    d = d2;
                }
                else
                {
                    d = d3;
                }
            }
            else
            {
                d = min(d1, min(d2, d3));
            }
        }

        if(w - e <= d && d <= w + e)
        {
            return vec4(0.5f, 0.5f, 0.5f, 1.0f); // ribbon edges (gray)
        }
        else if(d <= w)
        {
            return vec4(1.0f, 1.0f, 1.0f, 1.0f);   // ribbon interior (white)
        }
    }

    // compute point inclusion into the three regions beetween ribbons
    // then compute color based on region

    bool in_star = IsOnLeftSide(p4, a1, a2) || IsOnLeftSide(p4, a2, a3);
    bool in_green = IsOnLeftSide(p4, a3, a4) || (IsOnLeftSide(p4, a4, a5) && IsOnLeftSide(p4, a5, a6));

    if(schematic_view)
    {
        vec4 c;
        if(in_star)
        {
            c = vec4(0.8f, 0.8f, 0.8f, 1.0f);
        }
        else if(in_green)
        {
            c = vec4(0.7f, 0.7f, 0.7f, 1.0f);
        }
        else
        {
            c = vec4(0.6f, 0.6f, 0.6f, 1.0f);
        }

        if(in_fundm)
            c = vec4(c.r, 0.4f, 0.4f, 1.0f);

        return c;
    }

    if(in_star)
    {
        if(0 < da2m_cnt)
        {
            return vec4(0.6f, 0.4f, 0.0f, 1.0f); // brown stars
        }
        else
        {
            return vec4(0.3f, 0.4f, 0.9f, 1.0f); // blue stars
        }
    }

    if(in_green)
    {
        return vec4(0.0f, 0.4f, 0.0f, 1.0f);
    }

    // otherwise point is in black region:
    return vec4(0.0f, 0.0f, 0.0f, 1.0f);
}

//-------------------------------------------------------------------------------------
// Compute anti-aliased pixel colors for a point given in device coordinates
// point_dcc = integer pixel coordinates, starting at zero (device coordinates)
vec4 AAPixelColor(in vec2 point_dcc)
{
    vec4 sum = vec4(0.0f, 0.0f, 0.0f, 1.0f); // sum of samples colours

    for(int i = 0; i < nspp_root; i++) for(int j = 0; j < nspp_root; j++)
    {
        // compute sample position in device coordinates, then in world coordinates
        vec2 sample_dcc = point_dcc + (vec2(float(i) + 0.5f, float(j) + 0.5f) / nspp_root_f);
        vec2 sample_wcc = vis_wcc_sx * (sample_dcc - 0.5f * iResolution.xy) / iResolution.xx;

        // add this sample color to 'sum' and subtract 0.5,0.5 in WCC to center unit square
        sum = sum + PatternWCC(sample_wcc + vec2(0.0f, 0.0f));
    }
    return sum / float(nspp_root * nspp_root);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    fragColor = AAPixelColor(fragCoord);
}
