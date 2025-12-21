#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vLocalPos;
in vec2 vUV;

uniform float iTime;
uniform float uHasModel;
uniform vec3 uModelBoundsMin;
uniform vec3 uModelBoundsMax;
uniform vec3 uModelCenter;
uniform float uModelScale;

out vec4 outColor;

float saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

void main()
{
    if (uHasModel < 0.5)
    {
        vec2 uv = vUV;
        vec2 p = uv * 2.0 - 1.0;
        float ring = smoothstep(0.035, 0.0, abs(length(p) - 0.35));
        float scan = 0.5 + 0.5 * sin(uv.y * 24.0 + iTime * 2.0);
        vec3 base = mix(vec3(0.06, 0.07, 0.09), vec3(0.12, 0.13, 0.16), scan * 0.4);
        vec3 glow = vec3(0.2, 0.5, 0.9) * ring;
        outColor = vec4(base + glow, 1.0);
        return;
    }

    vec3 boundsMin = (uModelBoundsMin - uModelCenter) * uModelScale;
    vec3 boundsMax = (uModelBoundsMax - uModelCenter) * uModelScale;
    vec3 span = max(boundsMax - boundsMin, vec3(0.0001));
    vec3 normalized = (vLocalPos - boundsMin) / span;

    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.35));
    vec3 normal = normalize(vNormal);
    float diffuse = saturate(dot(normal, lightDir));

    vec3 cool = vec3(0.15, 0.3, 0.6);
    vec3 warm = vec3(0.85, 0.6, 0.35);
    vec3 gradient = mix(cool, warm, normalized.y);
    vec3 base = gradient * (0.25 + 0.75 * diffuse);

    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float rim = pow(1.0 - saturate(dot(normal, viewDir)), 2.0);
    vec3 color = base + rim * vec3(0.25, 0.4, 0.6);

    outColor = vec4(color, 1.0);
}
