#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
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
//
// Evaluating and Sampling Glinty NDFs in Constant Time
// https://perso.telecom-paristech.0fr/boubek/papers/Glinty/
//
// *******************************************************************

// you can change the parameters by clicking on the output:
// x-axis maps to glint density (left: less particles, right: more particles)
// y-axis maps to roughness (up: rougher, bottom: smoother)

// the microfacet roughness and pixel filter size also have an effect on the appearance:
const float microfacet_roughness = 0.01f; // good values are roughly in [0.001, 0.1]
const float pixel_filter_size = 0.7f; // good values are roughly in [0.5, 1.2]

const float pi = 3.14159265358979f;

vec2 lambert(vec3 v)
{
    return v.xy / sqrt(1.0f + v.z);
}

vec3 ndf_to_disk_ggx(vec3 v, float alpha)
{
    vec3 hemi = vec3(v.xy / alpha, v.z);
    float denom = dot(hemi, hemi);
    vec2 v_disk = lambert(normalize(hemi)) * 0.5f + 0.5f;
    float jacobian_determinant = 1.0f / (alpha * alpha * denom * denom);
    return vec3(v_disk, jacobian_determinant);
}

mat2 inv_quadratic(mat2 M)
{
    float D = determinant(M);
    float A = dot(M[0] / D, M[0] / D);
    float B = -dot(M[0] / D, M[1] / D);
    float C = dot(M[1] / D, M[1] / D);
    return mat2(C, B, B, A);
}

mat2 uv_ellipsoid(mat2 uv_J)
{
    mat2 Q = inv_quadratic(transpose(uv_J));
    float tr = 0.5f * (Q[0][0] + Q[1][1]);
    float D = sqrt(max(.0f, tr * tr - determinant(Q)));
    float l1 = tr - D;
    float l2 = tr + D;
    vec2 v1 = vec2(l1 - Q[1][1], Q[0][1]);
    vec2 v2 = vec2(Q[1][0], l2 - Q[0][0]);
    vec2 n = 1.0f / sqrt(vec2(l1, l2));
    return mat2(normalize(v1) * n.x, normalize(v2) * n.y);
}

float QueryLod(mat2 uv_J, float filter_size)
{
    float s0 = length(uv_J[0]), s1 = length(uv_J[1]);
    return log2(max(s0, s1) * filter_size) + pow(2.0f, filter_size);
}

uvec2 shuffle(uvec2 v)
{
    v = v * 1664525u + 1013904223u;
    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;

    v = v ^ (v >> uvec2(16u));

    v.x += v.y * 1664525u;
    v.y += v.x * 1664525u;
    v = v ^ (v >> uvec2(16u));
    return v;
}

vec2 rand(uvec2 v)
{
    return vec2(shuffle(v)) * pow(.5f, 32.0f);
}

float normal(mat2 cov, vec2 x)
{
    return exp(-.5f * dot(x, inverse(cov) * x)) / (sqrt(determinant(cov)) * 2.0f * pi);
}

vec2 Rand2D(vec2 x, vec2 y, float l, uint i)
{
    uvec2 ux = floatBitsToUint(x), uy = floatBitsToUint(y);
    uint ul = floatBitsToUint(l);
    return rand((ux >> 16u | ux << 16u) ^ uy ^ ul ^ (i * 0x124u));
}

float Rand1D(vec2 x, vec2 y, float l, uint i)
{
    return Rand2D(x, y, l, i).x;
}

// Bürmann series, see https://en.wikipedia.org/wiki/Error_function
float erf(float x)
{
    float e = exp(-x * x);
    return sign(x) * 2.0f * sqrt((1.0f - e) / pi) * (sqrt(pi) * 0.5f + 31.0f / 200.0f * e - 341.0f / 8000.0f * e * e);
}

float cdf(float x, float mu, float sigma)
{
    return 0.5f + 0.5f * erf((x - mu) / (sigma * sqrt(2.0f)));
}

float integrate_interval(float x, float size, float mu, float stdev, float lower_limit, float upper_limit)
{
    return cdf(min(x + size, upper_limit), mu, stdev) - cdf(max(x - size, lower_limit), mu, stdev);
}

float integrate_box(vec2 x, vec2 size, vec2 mu, mat2 sigma, vec2 lower_limit, vec2 upper_limit)
{
    return integrate_interval(x.x, size.x, mu.x, sqrt(sigma[0][0]), lower_limit.x, upper_limit.x) *
        integrate_interval(x.y, size.y, mu.y, sqrt(sigma[1][1]), lower_limit.y, upper_limit.y);
}

float compensation(vec2 x_a, mat2 sigma_a, float res_a)
{
    float containing = integrate_box(vec2(.5f), vec2(.5f), x_a, sigma_a, vec2(.0f), vec2(1.0f));
    float explicitly_evaluated = integrate_box(round(x_a * res_a) / res_a, vec2(1.0f / res_a), x_a, sigma_a, vec2(.0f), vec2(1.0f));
    return containing - explicitly_evaluated;
}

float ndf(vec3 h, float alpha, float glint_alpha, vec2 uv, mat2 uv_J, float N, float filter_size)
{

    float res = sqrt(N);
    vec2 x_s = uv;
    vec3 x_a_and_d = ndf_to_disk_ggx(h, alpha);
    vec2 x_a = x_a_and_d.xy;
    float d = x_a_and_d.z;

    float lambda = QueryLod(res * uv_J, filter_size);

    float D_filter = 0.0f;

    for(float m = 0.0f; m < 2.0f; m += 1.0f)
    {
        float l = floor(lambda) + m;

        float w_lambda = 1.0f - abs(lambda - l);
        float res_s = res * pow(2.0f, -l);
        float res_a = pow(2.0f, l);

        mat2 uv_J2 = filter_size * uv_J;
        mat2 sigma_s = uv_J2 * transpose(uv_J2);

        mat2 sigma_a = d * pow(glint_alpha, 2.0f) * mat2(1.0f, 0.0f, 0.0f, 1.0f);

        vec2 base_i_a = clamp(round(x_a * res_a), 1.0f, res_a - 1.0f);
        for(int j_a = 0; j_a < 4; ++j_a)
        {
            vec2 i_a = base_i_a + vec2(ivec2(j_a, j_a / 2) % 2) - 0.5f;

            vec2 base_i_s = round(x_s * res_s);
            for(int j_s = 0; j_s < 4; ++j_s)
            {
                vec2 i_s = base_i_s + vec2(ivec2(j_s, j_s / 2) % 2) - 0.5f;

                vec2 g_s = (i_s + Rand2D(i_s, i_a, l, 1u) - 0.5f) / res_s;
                vec2 g_a = (i_a + Rand2D(i_s, i_a, l, 2u) - 0.5f) / res_a;

                float r = Rand1D(i_s, i_a, l, 4u);
                float roulette = smoothstep(max(.0f, r - 0.1f), min(1.0f, r + 0.1f), w_lambda);

                D_filter += roulette * normal(sigma_a, x_a - g_a) * normal(sigma_s, x_s - g_s) / N;
            }
        }
        D_filter += w_lambda * compensation(x_a, sigma_a, res_a);
    }

    return D_filter * d / pi;
}

// torus intersection and normal evaluation from Inigo Quilez (https://www.shadertoy.com/view/4sBGDy)
float iTorus(in vec3 ro, in vec3 rd, in vec2 tor)
{
    float po = 1.0f;

    float Ra2 = tor.x * tor.x;
    float ra2 = tor.y * tor.y;

    float m = dot(ro, ro);
    float n = dot(ro, rd);

    // bounding sphere
    {
        float h = n * n - m + (tor.x + tor.y) * (tor.x + tor.y);
        if(h < 0.0f)
        {
            return -1.0f;
        }
    //float t = -n-sqrt(h); // could use this to compute intersections from ro+t*rd
    }

    // find quartic equation
    float k = (m - ra2 - Ra2) / 2.0f;
    float k3 = n;
    float k2 = n * n + Ra2 * rd.z * rd.z + k;
    float k1 = k * n + Ra2 * ro.z * rd.z;
    float k0 = k * k + Ra2 * ro.z * ro.z - Ra2 * ra2;

    #if 1
    // prevent |c1| from being too close to zero
    if(abs(k3 * (k3 * k3 - k2) + k1) < 0.01f)
    {
        po = -1.0f;
        float tmp = k1;
        k1 = k3;
        k3 = tmp;
        k0 = 1.0f / k0;
        k1 = k1 * k0;
        k2 = k2 * k0;
        k3 = k3 * k0;
    }
    #endif

    float c2 = 2.0f * k2 - 3.0f * k3 * k3;
    float c1 = k3 * (k3 * k3 - k2) + k1;
    float c0 = k3 * (k3 * (-3.0f * k3 * k3 + 4.0f * k2) - 8.0f * k1) + 4.0f * k0;

    c2 /= 3.0f;
    c1 *= 2.0f;
    c0 /= 3.0f;

    float Q = c2 * c2 + c0;
    float R = 3.0f * c0 * c2 - c2 * c2 * c2 - c1 * c1;

    float h = R * R - Q * Q * Q;
    float z = 0.0f;
    if(h < 0.0f)
    {
        // 4 intersections
        float sQ = sqrt(Q);
        z = 2.0f * sQ * cos(acos(R / (sQ * Q)) / 3.0f);
    }
    else
    {
        // 2 intersections
        float sQ = pow(sqrt(h) + abs(R), 1.0f / 3.0f);
        z = sign(R) * abs(sQ + Q / sQ);
    }
    z = c2 - z;

    float d1 = z - 3.0f * c2;
    float d2 = z * z - 3.0f * c0;
    if(abs(d1) < 1.0e-4f)
    {
        if(d2 < 0.0f)
        {
            return -1.0f;
        }
        d2 = sqrt(d2);
    }
    else
    {
        if(d1 < 0.0f)
        {
            return -1.0f;
        }
        d1 = sqrt(d1 / 2.0f);
        d2 = c1 / d1;
    }

    //----------------------------------

    float result = 1e20f;

    h = d1 * d1 - z + d2;
    if(h > 0.0f)
    {
        h = sqrt(h);
        float t1 = -d1 - h - k3;
        t1 = (po < 0.0f) ? 2.0f / t1 : t1;
        float t2 = -d1 + h - k3;
        t2 = (po < 0.0f) ? 2.0f / t2 : t2;

        if(t1 > 0.0f)
        {
            result = t1;
        }

        if(t2 > 0.0f)
        {
            result = min(result, t2);
        }
    }

    h = d1 * d1 - z - d2;
    if(h > 0.0f)
    {
        h = sqrt(h);
        float t1 = d1 - h - k3;
        t1 = (po < 0.0f) ? 2.0f / t1 : t1;
        float t2 = d1 + h - k3;
        t2 = (po < 0.0f) ? 2.0f / t2 : t2;

        if(t1 > 0.0f)
        {
            result = min(result, t1);
        }

        if(t2 > 0.0f)
        {
            result = min(result, t2);
        }
    }

    return result;
}

vec3 nTorus(in vec3 pos, vec2 tor)
{
    return normalize(pos * (dot(pos, pos) - tor.y * tor.y - tor.x * tor.x * vec3(1.0f, 1.0f, -1.0f)));
}
mat3 torusFrame(in vec3 pos, vec2 tor)
{
    vec3 n = nTorus(pos.xzy, tor).xzy;
    vec3 t1 = normalize(vec3(pos.z, 0.0f, -pos.x));
    vec3 t2 = normalize(cross(n, t1));
    return mat3(t1, t2, n);
}

float G1_GGX(vec3 n, vec3 h, vec3 v, float alpha)
{
    float ndotv = dot(n, v);
    if(ndotv < 0.0f)
    {
        return 0.0f;
    }
    float ndotv_sq = ndotv * ndotv;
    float tan_theta_sq = (1.0f - ndotv_sq) / ndotv_sq;
    float Gamma = -.5f + 0.5f * sqrt(1.0f + alpha * alpha * tan_theta_sq);
    return 1.0f / (1.0f + Gamma);
}

float G_GGX(vec3 n, vec3 h, vec3 light_in, vec3 light_out, float alpha)
{
    return G1_GGX(n, h, light_in, alpha) * G1_GGX(n, h, light_out, alpha);
}

float brdf(float alpha, vec3 view, vec3 light, mat3 base, vec2 uv, mat2 uv_J)
{

    vec3 h_world = normalize(view + light);
    vec3 h_local = transpose(base) * h_world;
    float mouse = iMouse.x / iResolution.x;
    if(mouse == 0.0f)
    {
        mouse = 0.7f;
    }
    float D = ndf(h_local, alpha, microfacet_roughness, uv, uv_J, 8e5f * pow(10.0f, mouse * 6.0f - 2.0f), pixel_filter_size);
    float F = mix(pow(1.0f - dot(h_world, light), 5.0f), 1.0f, 0.96f);
    float G = G_GGX(base[2], h_world, light, view, alpha);

    return D * F * G / (4.0f * dot(base[2], view) * dot(base[2], light));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (vec2(fragCoord / iResolution.xy) - 0.5f) * vec2(1.0f, iResolution.y / iResolution.x);

    vec3 light = normalize(vec3(1.0f, 1.0f, 1.0f));
    vec3 col = vec3(.1f);

    vec2 torus = vec2(1.0f, 0.4f);

    float tilt = 0.8f;
    mat3 M = mat3(1.0f, 0.0f, 0.0f, 0.0f, cos(tilt), sin(tilt), 0.0f, -sin(tilt), cos(tilt));

    vec3 ro = M * (2.5f * vec3(cos(iTime * 0.2f), 0.0f, -sin(iTime * 0.2f)));
    vec3 eye = normalize(-ro);
    vec3 up = M[1];//vec3(.0, 1., 0.0);
    vec3 right = normalize(cross(eye, up));
    mat3 lookat = mat3(right, cross(right, eye), eye);

    vec3 rd = normalize(lookat * vec3(uv, 0.4f));

    float t = iTorus(ro.xzy, rd.xzy, torus);
    if(t > 0.0f)
    {
        vec3 pos = ro + rd * t;
        vec2 texcoord = vec2(atan(pos.x, pos.z), atan(pos.y, length(pos.xz) - torus.x)) / (2.0f * pi) + 0.5f;
        vec2 uv = fract(texcoord);
        mat3 base = torusFrame(pos, torus);
        mat2 uv_J = mat2(dFdx(uv), dFdy(uv));
        uv_J = uv_ellipsoid(uv_J);

        float mouse = iMouse.y / iResolution.y;
        if(mouse == 0.0f)
        {
            mouse = 0.3f;
        }

        float alpha = 0.2f + mouse * 0.8f;
        vec3 lcolor = vec3(.9f, 0.6f, 0.4f) * 5.0f;

        float ndotl = dot(base[2], light);
        if(ndotl < 0.0f)
        {
            ndotl = -ndotl;
            light = -light;
            lcolor = vec3(.1f, 0.15f, 0.2f) * 3.0f;
        }
        col = vec3(brdf(alpha, -eye, light, base, uv, uv_J)) * ndotl * lcolor;
    }
    fragColor = vec4(col, 1.0f);
}
