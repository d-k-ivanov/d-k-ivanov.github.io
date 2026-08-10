#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouseL;

// Output
out vec4 fragColor;

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 @YoheiNishitsuji
// [LICENSE] https://opensource.org/licenses/MIT
// [SOURCE]  https://fragcoord.xyz/s/glzs27pc

vec3 hsv(float h, float s, float v)
{
    vec4 t = vec4(1.f, 2.f / 3.f, 1.f / 3.f, 3.f);
    vec3 p = abs(fract(vec3(h) + t.xyz) * 6.f - vec3(t.w));
    return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.f, 1.f), s);
}

// 2D rotation matrix
mat2 rotate2D(float a)
{
    return mat2(cos(a), -sin(a), sin(a), cos(a));
}

void main()
{
    vec2 r = iResolution.xy;
    vec2 FC = gl_FragCoord.xy;
    float t = iTime;
    vec4 o = vec4(0, 0, 0, 1);

    // Center-origin mouse
    vec2 m = (iMouseL.xy - .5f * r) / r;

    // Volumetric raymarch
    float i = 0.f, g = 0.f, e = 0.f, s = 0.f;
    for(; ++i < 99.f; o.rgb += hsv(.09f, .5f, i * s / 2e4f))
    {

        // Ray sample point
        vec3 p = vec3((FC.xy - .5f * r) / r.x * (.3f - m.y * .4f), g - .05f * sin(t));

        // Spin around vertical axis
        p.zx *= rotate2D(t * .5f + m.x * 6.283f);

        // Kaleidoscopic IFS
        s = 1.5f;
        for(int j = 0; j++ < 9; p = vec3(2) - abs(p * e - .4f / e) - sin(t) * .1f) s *= e = max(1.07f, 4.5f / max(dot(p * (3.f - sin(t * .5f) * .4f), p * 2.f), 5e-4f));

        // Distance estimator
        g += distance(p.xz, p.yx) / s;

        // Soft brightness
        s = log(s) / g * .1f;
    }

    fragColor = o;
}
