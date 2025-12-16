#version 300 es

precision highp float;

uniform vec3 iResolution;
uniform float iTime;

out vec4 fragColor;

void main()
{
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime * 0.6;

    float radius = length(uv);
    float angle = atan(uv.y, uv.x);

    float swirl = sin(4.0 * angle - t * 2.0);
    float bands = sin(radius * 10.0 - t * 1.5 + swirl * 0.5);
    float rings = smoothstep(-0.25, 0.75, bands);

    vec3 base = mix(vec3(0.05, 0.12, 0.24), vec3(0.92, 0.55, 0.32), rings);
    vec3 accent = vec3(0.18, 0.65, 0.94) * (0.5 + 0.5 * cos(angle * 3.0 - t * 0.5));
    vec3 glow = vec3(0.9, 0.9, 1.2) * smoothstep(0.02, 0.0, abs(radius - 0.35 - 0.05 * sin(t)));

    float vignette = smoothstep(1.2, 0.9, radius);
    vec3 color = (base + accent * 0.35 + glow * 0.25) * vignette;

    fragColor = vec4(color, 1.0);
}
