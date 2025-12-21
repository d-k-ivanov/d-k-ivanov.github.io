#version 300 es

precision highp float;

uniform vec3 iResolution;
uniform float iTime;

out vec4 fragColor;

void main()
{
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    float t = iTime;

    float radius = length(uv) - 0.2;
    float angle = atan(uv.y, uv.x);

    float swirl = sin(5.0 * angle - t * 6.0);
    float bands = sin(radius * 100.0 - t * 10.0 + swirl * 1.0);
    float rings = smoothstep(-1.0, 1.0, bands);

    vec3 base = mix(vec3(0.0, 2.0, 1.0), vec3(1.0, 0.5, 0.3), rings);
    vec3 accent = vec3(0.0, 1.0, 0.0) * (0.1 + 0.1 * cos(angle * 3.0 - t * 0.5));
    vec3 glow = vec3(0.0, 2.0, 0.0) * smoothstep(0.1, 0.01, abs(radius - 0.2 - 0.4 * sin(2.0 * t)));

    vec3 color = (base * 0.3 + accent * 1.0 + glow * 0.2);

    fragColor = vec4(color, 1.0);
}
