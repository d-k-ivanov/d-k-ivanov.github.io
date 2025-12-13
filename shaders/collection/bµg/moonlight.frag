#version 300 es

// Moonlight [460] by bµg
// License: CC BY-NC-SA 4.0

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform float iTime;
uniform vec3 iResolution;

out vec4 fragColor;

/*
// Original unannotated code:
void main()
{
    vec3 o;
    vec3 p;

    vec3 u = vec3((gl_FragCoord.xy + gl_FragCoord.xy - iResolution) / iResolution.y, 1);

    vec3 Q;
    Q++;

    float d = 0.0f;
    float a = 0.0f;
    float m = 0.0f;
    float i = 0.0f;
    float t = 0.0f;

    while(i++ < 1e2f)
    {
        p = normalize(u) * t;
        p.z -= 5e1f;
        m = max(length(p) - 1e1f, 0.01f);
        p.z += iTime;
        d = 5.0f - length(p.xy *= mat2(cos(t * 0.2f + vec4(0, 33, 11, 0))));
        a = 0.01f;

        while(a < 1.0f)
        {
            p.xz *= mat2(8, 6, -6, 8) * 0.1f;
            d -= abs(dot(sin(p / a * 0.6f - iTime * 0.3f), p - p + a));
            m += abs(dot(sin(p / a / 5.0f), p - p + a / 5.0f));
            a += a;
        }

        p = t < 7.2f ? Q : vec3(2, 1, 0);
        d = abs(d) * 0.15f + 0.1f;

        // bland twilight version
        o += 1.0f / m + (t > 9.0f ? d = 9.0f, 1.0f : 1.0f / d);

        // orange / reddish version
        // o += p / m +(t > 9.0f ? (d = 9.0f, Q) : p / d);
        t += min(m, d);
    }
    o /= 4e2f;

    fragColor = vec4(tanh(mix(vec3(-35, -15, 8), vec3(118, 95, 60), o - o * length(u.xy * .5f)) * .01f), 1);
}
*/

// Annotated and reformatted code:
void main()
{
    vec3 color;                // o: accumulated color output
    vec3 rayPos;               // p: current position along the ray

    // u: ray direction (normalized screen coords)
    vec3 rayDir = vec3((gl_FragCoord.xy + gl_FragCoord.xy - iResolution.xy) / iResolution.y, 1);

    vec3 warmTint;             // Q: color tint (uninitialized, then incremented to ~(1,1,1))
    warmTint++;

    float distToSurface = 0.0f;     // d: distance field value / glow intensity
    float octaveScale = 0.0f;       // a: scale for fractal noise octaves
    float atmosphereDensity = 0.0f; // m: atmospheric/volumetric density
    float iteration = 0.0f;         // i: loop counter
    float rayDistance = 0.0f;       // t: total distance traveled along ray

    while(iteration++ < 100.0f)  // 1e2f = 100.0f raymarching steps
    {
        // Calculate ray position
        rayPos = normalize(rayDir) * rayDistance;
        rayPos.z -= 5e1f;  // offset camera back 50 units

        // Distance to a sphere of radius 10, clamped to minimum 0.01
        atmosphereDensity = max(length(rayPos) - 1e1f, 0.01f);

        rayPos.z += iTime;  // animate along Z axis

        // Rotate XY plane based on distance (creates swirling effect)
        distToSurface = 5.0f - length(rayPos.xy *= mat2(cos(rayDistance * 0.2f + vec4(0, 33, 11, 0))));

        octaveScale = 0.01f;

        // Fractal noise loop (4 octaves: 0.01, 0.02, 0.04, 0.08...)
        while(octaveScale < 1.0f)
        {
            // Rotate XZ plane (fixed rotation matrix)
            rayPos.xz *= mat2(8, 6, -6, 8) * 0.1f;

            // Accumulate sinusoidal displacement for surface detail
            distToSurface -= abs(dot(sin(rayPos / octaveScale * 0.6f - iTime * 0.3f), rayPos - rayPos + octaveScale));

            // Accumulate atmospheric density
            atmosphereDensity += abs(dot(sin(rayPos / octaveScale / 5.0f), rayPos - rayPos + octaveScale / 5.0f));

            octaveScale += octaveScale;  // double the scale each iteration
        }

        // Choose color based on distance threshold (moon vs sky)
        rayPos = rayDistance < 7.2f ? warmTint : vec3(2, 1, 0);
        distToSurface = abs(distToSurface) * 0.15f + 0.1f;

        // Accumulate color: atmospheric glow + surface/sky contribution
        // (t > 9.0f clamps far distances to prevent overflow)
        // bland twilight version
        color += 1.0f / atmosphereDensity +(rayDistance > 9.0f ? (distToSurface = 9.0f, 1.0f) : 1.0f / distToSurface);
        // orange / reddish version
        // color += rayPos / atmosphereDensity +(rayDistance > 9.0f ? (distToSurface = 9.0f, warmTint) : rayPos / distToSurface);

        rayDistance += min(atmosphereDensity, distToSurface);  // advance ray
    }
    color /= 4e2f;  // normalize by 400

    // Final color grading: mix between cool blue (-35,-15,8) and warm orange (118,95,60)
    // tanh provides soft clamping, vignette via length(rayDir.xy)
    fragColor = vec4(tanh(mix(vec3(-35, -15, 8), vec3(118, 95, 60), color - color * length(rayDir.xy * .5f)) * .01f), 1);
}
