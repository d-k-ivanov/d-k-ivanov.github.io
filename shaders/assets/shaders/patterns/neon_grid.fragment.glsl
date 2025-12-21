#version 300 es

precision highp float;

uniform vec3 iResolution;
uniform float iTime;

out vec4 fragColor;

float gridLine(vec2 p, float thickness)
{
    vec2 g = abs(fract(p) - 0.5);
    float dist = min(g.x, g.y);
    return 1.0 - smoothstep(thickness, thickness + 0.02, dist);
}

void main()
{
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime * 0.45;

    float perspective = 1.0 / (0.7 + uv.y * 0.5 + 0.6);
    vec2 warped = uv * perspective * 6.0;
    warped.y += t * 1.4;
    warped.x += sin(t * 0.7) * 0.6;

    float line = gridLine(warped, 0.04);
    float glow = gridLine(warped * 2.0, 0.06);

    vec3 base = vec3(0.015, 0.02, 0.05);
    vec3 neonA = vec3(0.14, 0.72, 0.95);
    vec3 neonB = vec3(0.92, 0.25, 0.82);
    vec3 neon = mix(neonA, neonB, 0.5 + 0.5 * sin(t * 1.6 + uv.x * 2.0));

    float horizon = smoothstep(-0.15, 0.25, uv.y);
    vec3 color = base;
    color += neon * glow * 1.6;
    color += neon * line * (1.2 + 0.2 * sin(t * 2.0));
    color = mix(color, vec3(0.02, 0.03, 0.08), horizon * 0.35);
    fragColor = vec4(color, 1.0);
}
