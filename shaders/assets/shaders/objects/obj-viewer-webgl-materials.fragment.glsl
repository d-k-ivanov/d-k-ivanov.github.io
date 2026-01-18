#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vLocalPos;
in vec2 vUV;
in vec2 vScreenUV;
in float vIsBackground;

uniform float iTime;
uniform vec3 uModelBoundsMin;
uniform vec3 uModelBoundsMax;
uniform vec3 uModelCenter;
uniform float uModelScale;

out vec4 outColor;

// 0: solid color, 1: grid, 2: aurora, 3: stripes, 4: checkerboard
const int BACKGROUND_STYLE = 1;
// 0: stylized, 1: glass, 2: diffuse, 3: mirror, 4: bone, 5: stone,
// 6: metal, 7: normal, 8: showInverted, 9: showBroken
const int MATERIAL_STYLE = 9;
const float DIFFUSE_AMBIENT = 0.2f;
const float MATERIAL_IOR = 1.35f;
const float TRANSPARENT_MATERIAL = 1.0f;
const float REFRACTION_STRENGTH = 0.12f;
const float REFLECTION_STRENGTH = 0.08f;
const float GLASS_TINT = 0.25f;

float saturate(float value)
{
    return clamp(value, 0.0f, 1.0f);
}

float hash12(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1f, 311.7f))) * 43758.5453f);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0f, 0.0f));
    float c = hash12(i + vec2(0.0f, 1.0f));
    float d = hash12(i + vec2(1.0f, 1.0f));
    vec2 u = f * f * (3.0f - 2.0f * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0f - u.x) + (d - b) * u.x * u.y;
}

float gridLines(vec2 uv, float scale, float thickness)
{
    vec2 grid = abs(fract(uv * scale) - 0.5f);
    return smoothstep(0.5f - thickness, 0.5f, max(grid.x, grid.y));
}

vec3 backgroundColor(vec2 uv, float time)
{
    vec2 p = uv * 2.0f - 1.0f;
    vec3 color = vec3(0.0f);

    if(BACKGROUND_STYLE == 0)
    {
        color = vec3(0.0f);
    }
    else if(BACKGROUND_STYLE == 1)
    {
        vec3 top = vec3(0.05f, 0.08f, 0.13f);
        vec3 bottom = vec3(0.12f, 0.15f, 0.2f);
        vec3 gradient = mix(top, bottom, uv.y);

        float fine = gridLines(uv + vec2(0.0f, time * 0.015f), 12.0f, 0.015f);
        float coarse = gridLines(uv, 4.0f, 0.02f);
        float grid = max(fine, coarse);
        vec3 gridColor = vec3(0.18f, 0.35f, 0.55f) * grid * 0.6f;

        float vignette = 1.0f - smoothstep(0.25f, 1.1f, length(p));
        color = (gradient + gridColor) * (0.75f + 0.25f * vignette);
    }
    else if(BACKGROUND_STYLE == 2)
    {
        float bands = 0.5f + 0.5f * sin((uv.x * 1.2f + uv.y * 0.9f) * 12.0f + time * 1.5f);
        vec3 sky = mix(vec3(0.06f, 0.07f, 0.1f), vec3(0.2f, 0.12f, 0.18f), uv.y);
        vec3 aurora = mix(vec3(0.2f, 0.45f, 0.35f), vec3(0.5f, 0.35f, 0.65f), bands);
        float halo = 1.0f - smoothstep(0.2f, 0.9f, length(p - vec2(-0.2f, 0.1f)));
        color = mix(sky, aurora, 0.35f) + halo * 0.15f;
    }
    else if(BACKGROUND_STYLE == 3)
    {
        float bands = step(0.5f, fract((uv.x * 0.9f + uv.y * 0.6f + time * 0.05f) * 12.0f));
        vec3 dark = vec3(0.02f, 0.02f, 0.03f);
        vec3 light = vec3(0.95f, 0.85f, 0.2f);
        vec3 stripe = mix(dark, light, bands);
        float horizon = smoothstep(0.0f, 0.6f, uv.y);
        vec3 sky = mix(vec3(0.05f, 0.05f, 0.08f), vec3(0.6f, 0.1f, 0.2f), horizon);
        float vignette = smoothstep(1.1f, 0.2f, length(p));
        color = mix(sky, stripe, 0.55f) * (0.7f + 0.3f * vignette);
    }
    else if(BACKGROUND_STYLE == 4)
    {
        float scale = 10.0f;
        float cx = step(0.5f, fract(uv.x * scale));
        float cy = step(0.5f, fract(uv.y * scale));
        float checker = abs(cx - cy);
        vec3 dark = vec3(0.02f, 0.02f, 0.04f);
        vec3 light = vec3(0.98f, 0.98f, 0.98f);
        float radial = smoothstep(0.0f, 1.0f, length(p));
        vec3 burst = mix(vec3(1.0f, 0.2f, 0.1f), vec3(0.1f, 0.3f, 0.9f), smoothstep(-0.4f, 0.6f, p.y));
        color = mix(dark, light, checker) * 0.8f + burst * (1.0f - radial) * 0.35f;
    }
    else if(BACKGROUND_STYLE == 5)
    {
        float ring = smoothstep(0.035f, 0.0f, abs(length(p) - 0.35f));
        float scan = 0.5f + 0.5f * sin(uv.y * 24.0f + time * 2.0f);
        vec3 base = mix(vec3(0.06f, 0.07f, 0.09f), vec3(0.12f, 0.13f, 0.16f), scan * 0.4f);
        vec3 glow = vec3(0.2f, 0.5f, 0.9f) * ring;
        color = base + glow;
    }

    return color;
}

vec3 diffuseMaterial(vec3 albedo, float diffuse)
{
    return albedo * (DIFFUSE_AMBIENT + (1.0f - DIFFUSE_AMBIENT) * diffuse);
}

float fresnelTerm(float cosTheta, float ior)
{
    float f0 = pow((ior - 1.0f) / (ior + 1.0f), 2.0f);
    return f0 + (1.0f - f0) * pow(1.0f - cosTheta, 5.0f);
}

vec3 transparentMaterial(vec3 baseColor, vec3 normal, vec3 viewDir, vec2 screenUV, float time)
{
    float cosTheta = saturate(dot(normal, viewDir));
    float fresnel = fresnelTerm(cosTheta, MATERIAL_IOR);
    vec3 refractDir = refract(-viewDir, normal, 1.0f / MATERIAL_IOR);
    vec3 reflectDir = reflect(-viewDir, normal);
    vec2 refractUV = clamp(screenUV + refractDir.xy * REFRACTION_STRENGTH, 0.0f, 1.0f);
    vec2 reflectUV = clamp(screenUV + reflectDir.xy * REFLECTION_STRENGTH, 0.0f, 1.0f);
    vec3 refracted = backgroundColor(refractUV, time);
    vec3 reflected = backgroundColor(reflectUV, time);
    vec3 glass = mix(refracted, reflected, fresnel);
    vec3 tint = mix(vec3(1.0f), baseColor, GLASS_TINT);

    return glass * tint;
}

vec3 mirrorMaterial(vec3 normal, vec3 viewDir, vec2 screenUV, float time)
{
    vec3 reflectDir = reflect(-viewDir, normal);
    vec2 reflectUV = clamp(screenUV + reflectDir.xy * 0.25f, 0.0f, 1.0f);
    vec3 reflected = backgroundColor(reflectUV, time);

    return mix(reflected, vec3(1.0f), 0.02f);
}

vec3 boneMaterial(vec3 albedo, vec3 localPos, float diffuse)
{
    float ring = length(localPos.xz) * 2.5f + noise(localPos.xz * 3.0f) * 0.6f;
    float grain = smoothstep(0.2f, 0.8f, fract(ring));
    vec3 woodLight = mix(albedo, vec3(0.75f, 0.55f, 0.3f), 0.6f);
    vec3 woodDark = mix(albedo, vec3(0.3f, 0.18f, 0.1f), 0.6f);
    vec3 wood = mix(woodDark, woodLight, grain);
    float streak = smoothstep(0.6f, 0.9f, noise(localPos.xz * 12.0f));
    wood = mix(wood, woodDark, streak * 0.3f);

    return diffuseMaterial(wood, diffuse);
}

vec3 stoneMaterial(vec3 albedo, vec3 localPos, float diffuse)
{
    float n1 = noise(localPos.xz * 4.0f);
    float n2 = noise(localPos.xy * 12.0f);
    float n = n1 * 0.6f + n2 * 0.4f;
    vec3 stoneBase = mix(albedo, vec3(0.5f, 0.5f, 0.55f), 0.7f);
    vec3 stone = mix(vec3(0.25f, 0.25f, 0.28f), vec3(0.6f, 0.6f, 0.65f), n);
    stone = mix(stone, stoneBase, 0.5f);

    return diffuseMaterial(stone, diffuse);
}

vec3 metalMaterial(vec3 albedo, vec3 normal, vec3 viewDir, float diffuse)
{
    vec3 tangent = abs(normal.y) > 0.8f ? vec3(1.0f, 0.0f, 0.0f) : vec3(0.0f, 1.0f, 0.0f);
    vec3 bitangent = normalize(cross(normal, tangent));
    float stretch = pow(1.0f - abs(dot(viewDir, bitangent)), 8.0f);
    vec3 spec = vec3(0.9f) * stretch;
    vec3 base = diffuseMaterial(albedo, diffuse);

    return base + spec * 0.6f;
}

vec3 normalMaterial(vec3 normal)
{
    return normal * 0.5f + 0.5f;
}

vec3 invertedTrianglesMaterial(vec3 albedo, vec3 normal, vec3 viewDir, float diffuse, float time)
{
    float facing = dot(normal, viewDir);
    bool isInverted = facing < 0.0f;
    float pulse = 0.5f + 0.5f * sin(time * 15.0f);
    vec3 warningColor = vec3(1.0f, 0.0f, 0.0f) * (0.7f + 0.3f * pulse);
    vec3 correctColor = diffuseMaterial(albedo, diffuse);

    return isInverted ? warningColor : correctColor;
}

vec3 brokenGeometryMaterial(vec3 albedo, vec3 normal, vec2 uv, float diffuse, float time)
{
    int issues = 0;
    float pulse = 0.5f + 0.5f * sin(time * 20.0f);

    float normalLen = length(normal);
    bool hasInvalidNormal = normalLen < 0.01f || normalLen > 100.0f || any(isnan(normal)) || any(isinf(normal));
    if(hasInvalidNormal)
    {
        issues++;
    }

    bool hasDegenerateNormal = normalLen > 0.01f && normalLen < 0.9f;
    if(hasDegenerateNormal)
    {
        issues++;
    }

    bool hasInvalidUV = any(isnan(uv)) || any(isinf(uv)) || any(greaterThan(abs(uv), vec2(1000.0f)));
    if(hasInvalidUV)
    {
        issues++;
    }

    if(issues > 0)
    {
        float errorIntensity = float(issues) / 3.0f;
        vec3 red = vec3(1.0f, 0.0f, 0.0f) * pulse;
        vec3 yellow = vec3(1.0f, 1.0f, 0.0f) * pulse;
        vec3 errorColor = mix(red, yellow, errorIntensity);
        return errorColor * (0.6f + 0.4f * pulse);
    }

    return diffuseMaterial(albedo, diffuse) * 0.7f;
}

void main()
{
    vec3 background = backgroundColor(vScreenUV, iTime);

    if(vIsBackground > 0.5f)
    {
        outColor = vec4(background, 1.0f);
        return;
    }

    vec3 boundsMin = (uModelBoundsMin - uModelCenter) * uModelScale;
    vec3 boundsMax = (uModelBoundsMax - uModelCenter) * uModelScale;
    vec3 span = max(boundsMax - boundsMin, vec3(0.0001f));
    vec3 normalized = (vLocalPos - boundsMin) / span;

    vec3 lightDir = normalize(vec3(0.6f, 0.8f, 0.35f));
    vec3 normal = normalize(vNormal);
    float diffuse = saturate(dot(normal, lightDir));

    vec3 cool = vec3(0.15f, 0.3f, 0.6f);
    vec3 warm = vec3(0.85f, 0.6f, 0.35f);
    vec3 albedo = mix(cool, warm, normalized.y);
    vec3 base = albedo * (0.25f + 0.75f * diffuse);

    vec3 viewDir = normalize(vec3(0.0f, 0.0f, 1.0f));
    float rim = pow(1.0f - saturate(dot(normal, viewDir)), 2.0f);
    vec3 surface = base + rim * vec3(0.25f, 0.4f, 0.6f);
    vec3 color = surface;

    if(MATERIAL_STYLE == 1)
    {
        vec3 glass = transparentMaterial(surface, normal, viewDir, vScreenUV, iTime);
        color = mix(surface, glass, TRANSPARENT_MATERIAL);
    }
    else if(MATERIAL_STYLE == 2)
    {
        color = diffuseMaterial(albedo, diffuse);
    }
    else if(MATERIAL_STYLE == 3)
    {
        color = mirrorMaterial(normal, viewDir, vScreenUV, iTime);
    }
    else if(MATERIAL_STYLE == 4)
    {
        color = boneMaterial(albedo, vLocalPos, diffuse);
    }
    else if(MATERIAL_STYLE == 5)
    {
        color = stoneMaterial(albedo, vLocalPos, diffuse);
    }
    else if(MATERIAL_STYLE == 6)
    {
        color = metalMaterial(albedo, normal, viewDir, diffuse);
    }
    else if(MATERIAL_STYLE == 7)
    {
        color = normalMaterial(normal);
    }
    else if(MATERIAL_STYLE == 8)
    {
        color = invertedTrianglesMaterial(albedo, normal, viewDir, diffuse, iTime);
    }
    else if(MATERIAL_STYLE == 9)
    {
        color = brokenGeometryMaterial(albedo, vNormal, vUV, diffuse, iTime);
    }

    outColor = vec4(color, 1.0f);
}
