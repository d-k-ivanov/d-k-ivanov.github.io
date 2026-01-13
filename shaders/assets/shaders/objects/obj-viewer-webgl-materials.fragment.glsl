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

const int BACKGROUND_STYLE = 1;
const int MATERIAL_STYLE = 7; // 0: stylized, 1: glass, 2: diffuse, 3: mirror, 4: bone, 5: stone, 6: metal, 7: normal
const float DIFFUSE_AMBIENT = 0.2;
const float MATERIAL_IOR = 1.35;
const float TRANSPARENT_MATERIAL = 1.0;
const float REFRACTION_STRENGTH = 0.12;
const float REFLECTION_STRENGTH = 0.08;
const float GLASS_TINT = 0.25;

float saturate(float value)
{
    return clamp(value, 0.0, 1.0);
}

float hash12(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
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
        color = vec3(0.0);
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
    else if (BACKGROUND_STYLE == 2)
    {
        float bands = 0.5 + 0.5 * sin((uv.x * 1.2 + uv.y * 0.9) * 12.0 + time * 1.5);
        vec3 sky = mix(vec3(0.06, 0.07, 0.1), vec3(0.2, 0.12, 0.18), uv.y);
        vec3 aurora = mix(vec3(0.2, 0.45, 0.35), vec3(0.5, 0.35, 0.65), bands);
        float halo = 1.0 - smoothstep(0.2, 0.9, length(p - vec2(-0.2, 0.1)));
        color = mix(sky, aurora, 0.35) + halo * 0.15;
    }
    else if (BACKGROUND_STYLE == 3)
    {
        float bands = step(0.5, fract((uv.x * 0.9 + uv.y * 0.6 + time * 0.05) * 12.0));
        vec3 dark = vec3(0.02, 0.02, 0.03);
        vec3 light = vec3(0.95, 0.85, 0.2);
        vec3 stripe = mix(dark, light, bands);
        float horizon = smoothstep(0.0, 0.6, uv.y);
        vec3 sky = mix(vec3(0.05, 0.05, 0.08), vec3(0.6, 0.1, 0.2), horizon);
        float vignette = smoothstep(1.1, 0.2, length(p));
        color = mix(sky, stripe, 0.55) * (0.7 + 0.3 * vignette);
    }
    else if (BACKGROUND_STYLE == 4)
    {
        float scale = 10.0;
        float cx = step(0.5, fract(uv.x * scale));
        float cy = step(0.5, fract(uv.y * scale));
        float checker = abs(cx - cy);
        vec3 dark = vec3(0.02, 0.02, 0.04);
        vec3 light = vec3(0.98, 0.98, 0.98);
        float radial = smoothstep(0.0, 1.0, length(p));
        vec3 burst = mix(vec3(1.0, 0.2, 0.1), vec3(0.1, 0.3, 0.9), smoothstep(-0.4, 0.6, p.y));
        color = mix(dark, light, checker) * 0.8 + burst * (1.0 - radial) * 0.35;
    }
    else if (BACKGROUND_STYLE == 5)
    {
        float ring = smoothstep(0.035, 0.0, abs(length(p) - 0.35));
        float scan = 0.5 + 0.5 * sin(uv.y * 24.0 + time * 2.0);
        vec3 base = mix(vec3(0.06, 0.07, 0.09), vec3(0.12, 0.13, 0.16), scan * 0.4);
        vec3 glow = vec3(0.2, 0.5, 0.9) * ring;
        color = base + glow;
    }

    return color;
}

vec3 diffuseMaterial(vec3 albedo, float diffuse)
{
    return albedo * (DIFFUSE_AMBIENT + (1.0 - DIFFUSE_AMBIENT) * diffuse);
}

float fresnelTerm(float cosTheta, float ior)
{
    float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

vec3 transparentMaterial(vec3 baseColor, vec3 normal, vec3 viewDir, vec2 screenUV, float time)
{
    float cosTheta = saturate(dot(normal, viewDir));
    float fresnel = fresnelTerm(cosTheta, MATERIAL_IOR);
    vec3 refractDir = refract(-viewDir, normal, 1.0 / MATERIAL_IOR);
    vec3 reflectDir = reflect(-viewDir, normal);
    vec2 refractUV = clamp(screenUV + refractDir.xy * REFRACTION_STRENGTH, 0.0, 1.0);
    vec2 reflectUV = clamp(screenUV + reflectDir.xy * REFLECTION_STRENGTH, 0.0, 1.0);
    vec3 refracted = backgroundColor(refractUV, time);
    vec3 reflected = backgroundColor(reflectUV, time);
    vec3 glass = mix(refracted, reflected, fresnel);
    vec3 tint = mix(vec3(1.0), baseColor, GLASS_TINT);

    return glass * tint;
}

vec3 mirrorMaterial(vec3 normal, vec3 viewDir, vec2 screenUV, float time)
{
    vec3 reflectDir = reflect(-viewDir, normal);
    vec2 reflectUV = clamp(screenUV + reflectDir.xy * 0.25, 0.0, 1.0);
    vec3 reflected = backgroundColor(reflectUV, time);

    return mix(reflected, vec3(1.0), 0.02);
}

vec3 boneMaterial(vec3 albedo, vec3 localPos, float diffuse)
{
    float ring = length(localPos.xz) * 2.5 + noise(localPos.xz * 3.0) * 0.6;
    float grain = smoothstep(0.2, 0.8, fract(ring));
    vec3 woodLight = mix(albedo, vec3(0.75, 0.55, 0.3), 0.6);
    vec3 woodDark = mix(albedo, vec3(0.3, 0.18, 0.1), 0.6);
    vec3 wood = mix(woodDark, woodLight, grain);
    float streak = smoothstep(0.6, 0.9, noise(localPos.xz * 12.0));
    wood = mix(wood, woodDark, streak * 0.3);

    return diffuseMaterial(wood, diffuse);
}

vec3 stoneMaterial(vec3 albedo, vec3 localPos, float diffuse)
{
    float n1 = noise(localPos.xz * 4.0);
    float n2 = noise(localPos.xy * 12.0);
    float n = n1 * 0.6 + n2 * 0.4;
    vec3 stoneBase = mix(albedo, vec3(0.5, 0.5, 0.55), 0.7);
    vec3 stone = mix(vec3(0.25, 0.25, 0.28), vec3(0.6, 0.6, 0.65), n);
    stone = mix(stone, stoneBase, 0.5);

    return diffuseMaterial(stone, diffuse);
}

vec3 metalMaterial(vec3 albedo, vec3 normal, vec3 viewDir, float diffuse)
{
    vec3 tangent = abs(normal.y) > 0.8 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 bitangent = normalize(cross(normal, tangent));
    float stretch = pow(1.0 - abs(dot(viewDir, bitangent)), 8.0);
    vec3 spec = vec3(0.9) * stretch;
    vec3 base = diffuseMaterial(albedo, diffuse);

    return base + spec * 0.6;
}

vec3 normalMaterial(vec3 normal)
{
    return normal * 0.5 + 0.5;
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
    vec3 albedo = mix(cool, warm, normalized.y);
    vec3 base = albedo * (0.25 + 0.75 * diffuse);

    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float rim = pow(1.0 - saturate(dot(normal, viewDir)), 2.0);
    vec3 surface = base + rim * vec3(0.25, 0.4, 0.6);
    vec3 color = surface;

    if (MATERIAL_STYLE == 1)
    {
        vec3 glass = transparentMaterial(surface, normal, viewDir, vScreenUV, iTime);
        color = mix(surface, glass, TRANSPARENT_MATERIAL);
    }
    else if (MATERIAL_STYLE == 2)
    {
        color = diffuseMaterial(albedo, diffuse);
    }
    else if (MATERIAL_STYLE == 3)
    {
        color = mirrorMaterial(normal, viewDir, vScreenUV, iTime);
    }
    else if (MATERIAL_STYLE == 4)
    {
        color = boneMaterial(albedo, vLocalPos, diffuse);
    }
    else if (MATERIAL_STYLE == 5)
    {
        color = stoneMaterial(albedo, vLocalPos, diffuse);
    }
    else if (MATERIAL_STYLE == 6)
    {
        color = metalMaterial(albedo, normal, viewDir, diffuse);
    }
    else if (MATERIAL_STYLE == 7)
    {
        color = normalMaterial(normal);
    }

    outColor = vec4(color, 1.0);
}
