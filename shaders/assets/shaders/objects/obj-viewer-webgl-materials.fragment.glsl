#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vLocalPos;
in vec2 vUV;
in vec2 vScreenUV;
in float vIsBackground;

uniform float iTime;
uniform float uHasModel;
uniform vec3 uModelBoundsMin;
uniform vec3 uModelBoundsMax;
uniform vec3 uModelCenter;
uniform float uModelScale;

out vec4 outColor;

const int BACKGROUND_STYLE = 0;
float saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

float gridLines(vec2 uv, float scale, float thickness)
{
    vec2 grid = abs(fract(uv * scale) - 0.5);
    return smoothstep(0.5 - thickness, 0.5, max(grid.x, grid.y));
}

vec3 backgroundColor(vec2 uv, float time)
{
    vec2 p = uv * 2.0 - 1.0;
    vec3 color = vec3(0.0);

    if (BACKGROUND_STYLE == 0)
    {
        float ring = smoothstep(0.035, 0.0, abs(length(p) - 0.35));
        float scan = 0.5 + 0.5 * sin(uv.y * 24.0 + time * 2.0);
        vec3 base = mix(vec3(0.06, 0.07, 0.09), vec3(0.12, 0.13, 0.16), scan * 0.4);
        vec3 glow = vec3(0.2, 0.5, 0.9) * ring;
        color = base + glow;
    }
    else if (BACKGROUND_STYLE == 1)
    {
        vec3 top = vec3(0.05, 0.08, 0.13);
        vec3 bottom = vec3(0.12, 0.15, 0.2);
        vec3 gradient = mix(top, bottom, uv.y);

        float fine = gridLines(uv + vec2(0.0, time * 0.015), 12.0, 0.015);
        float coarse = gridLines(uv, 4.0, 0.02);
        float grid = max(fine, coarse);
        vec3 gridColor = vec3(0.18, 0.35, 0.55) * grid * 0.6;

        float vignette = 1.0 - smoothstep(0.25, 1.1, length(p));
        color = (gradient + gridColor) * (0.75 + 0.25 * vignette);
    }
    else
    {
        float bands = 0.5 + 0.5 * sin((uv.x * 1.2 + uv.y * 0.9) * 12.0 + time * 1.5);
        vec3 sky = mix(vec3(0.06, 0.07, 0.1), vec3(0.2, 0.12, 0.18), uv.y);
        vec3 aurora = mix(vec3(0.2, 0.45, 0.35), vec3(0.5, 0.35, 0.65), bands);
        float halo = 1.0 - smoothstep(0.2, 0.9, length(p - vec2(-0.2, 0.1)));
        color = mix(sky, aurora, 0.35) + halo * 0.15;
    }

    return color;
}

void main()
{
    vec3 background = backgroundColor(vScreenUV, iTime);

    if (vIsBackground > 0.5)
    {
        outColor = vec4(background, 1.0);
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
