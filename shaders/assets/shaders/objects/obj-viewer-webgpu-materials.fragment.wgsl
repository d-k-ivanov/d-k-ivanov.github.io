struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
};

struct ModelInfo
{
    boundsMin : vec4f,
    boundsMax : vec4f,
    center : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(23) var<storage, read> modelInfo : ModelInfo;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) normal : vec3f,
    @location(1) localPos : vec3f,
    @location(2) uv : vec2f,
    @location(3) screenUV : vec2f,
    @location(4) isBackground : f32,
};

const BACKGROUND_STYLE : i32 = 4;
const MATERIAL_IOR : f32 = 1.35;
const TRANSPARENT_MATERIAL : f32 = 1.0;
const REFRACTION_STRENGTH : f32 = 0.12;
const REFLECTION_STRENGTH : f32 = 0.08;
const GLASS_TINT : f32 = 0.25;

fn saturate(value : f32) -> f32
{
    return clamp(value, 0.0, 1.0);
}

fn gridLines(uv : vec2f, scale : f32, thickness : f32) -> f32
{
    let grid = abs(fract(uv * scale) - vec2f(0.5));
    return smoothstep(0.5 - thickness, 0.5, max(grid.x, grid.y));
}

fn backgroundColor(uv : vec2f, time : f32) -> vec3f
{
    let p = uv * 2.0 - 1.0;
    var color = vec3f(0.0);

    if (BACKGROUND_STYLE == 0)
    {
        let ring = smoothstep(0.035, 0.0, abs(length(p) - 0.35));
        let scan = 0.5 + 0.5 * sin(uv.y * 24.0 + time * 2.0);
        let base = mix(vec3f(0.06, 0.07, 0.09), vec3f(0.12, 0.13, 0.16), scan * 0.4);
        let glow = vec3f(0.2, 0.5, 0.9) * ring;
        color = base + glow;
    }
    else if (BACKGROUND_STYLE == 1)
    {
        let top = vec3f(0.05, 0.08, 0.13);
        let bottom = vec3f(0.12, 0.15, 0.2);
        let gradient = mix(top, bottom, uv.y);

        let fine = gridLines(uv + vec2f(0.0, time * 0.015), 12.0, 0.015);
        let coarse = gridLines(uv, 4.0, 0.02);
        let grid = max(fine, coarse);
        let gridColor = vec3f(0.18, 0.35, 0.55) * grid * 0.6;

        let vignette = 1.0 - smoothstep(0.25, 1.1, length(p));
        color = (gradient + gridColor) * (0.75 + 0.25 * vignette);
    }
    else if (BACKGROUND_STYLE == 2)
    {
        let bands = 0.5 + 0.5 * sin((uv.x * 1.2 + uv.y * 0.9) * 12.0 + time * 1.5);
        let sky = mix(vec3f(0.06, 0.07, 0.1), vec3f(0.2, 0.12, 0.18), uv.y);
        let aurora = mix(vec3f(0.2, 0.45, 0.35), vec3f(0.5, 0.35, 0.65), bands);
        let halo = 1.0 - smoothstep(0.2, 0.9, length(p - vec2f(-0.2, 0.1)));
        color = mix(sky, aurora, 0.35) + halo * 0.15;
    }
    else if (BACKGROUND_STYLE == 3)
    {
        let bands = step(0.5, fract((uv.x * 0.9 + uv.y * 0.6 + time * 0.05) * 12.0));
        let dark = vec3f(0.02, 0.02, 0.03);
        let light = vec3f(0.95, 0.85, 0.2);
        let stripe = mix(dark, light, bands);
        let horizon = smoothstep(0.0, 0.6, uv.y);
        let sky = mix(vec3f(0.05, 0.05, 0.08), vec3f(0.6, 0.1, 0.2), horizon);
        let vignette = smoothstep(1.1, 0.2, length(p));
        color = mix(sky, stripe, 0.55) * (0.7 + 0.3 * vignette);
    }
    else if (BACKGROUND_STYLE == 4)
    {
        let scale = 10.0;
        let cx = step(0.5, fract(uv.x * scale));
        let cy = step(0.5, fract(uv.y * scale));
        let checker = abs(cx - cy);
        let dark = vec3f(0.02, 0.02, 0.04);
        let light = vec3f(0.98, 0.98, 0.98);
        let radial = smoothstep(0.0, 1.0, length(p));
        let burst = mix(vec3f(1.0, 0.2, 0.1), vec3f(0.1, 0.3, 0.9), smoothstep(-0.4, 0.6, p.y));
        color = mix(dark, light, checker) * 0.8 + burst * (1.0 - radial) * 0.35;
    }

    return color;
}

fn fresnelTerm(cosTheta : f32, ior : f32) -> f32
{
    let f0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

fn transparentMaterial(baseColor : vec3f, normal : vec3f, viewDir : vec3f, screenUV : vec2f, time : f32) -> vec3f
{
    let cosTheta = saturate(dot(normal, viewDir));
    let fresnel = fresnelTerm(cosTheta, MATERIAL_IOR);
    let refractDir = refract(-viewDir, normal, 1.0 / MATERIAL_IOR);
    let reflectDir = reflect(-viewDir, normal);
    let refractUV = clamp(screenUV + refractDir.xy * REFRACTION_STRENGTH, vec2f(0.0), vec2f(1.0));
    let reflectUV = clamp(screenUV + reflectDir.xy * REFLECTION_STRENGTH, vec2f(0.0), vec2f(1.0));
    let refracted = backgroundColor(refractUV, time);
    let reflected = backgroundColor(reflectUV, time);
    let glass = mix(refracted, reflected, fresnel);
    let tint = mix(vec3f(1.0), baseColor, GLASS_TINT);

    return glass * tint;
}

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let background = backgroundColor(input.screenUV, shaderUniforms.iTime);
    if (input.isBackground > 0.5)
    {
        return vec4f(background, 1.0);
    }

    let boundsMin = (modelInfo.boundsMin.xyz - modelInfo.center.xyz) * modelInfo.boundsMax.w;
    let boundsMax = (modelInfo.boundsMax.xyz - modelInfo.center.xyz) * modelInfo.boundsMax.w;
    let span = max(boundsMax - boundsMin, vec3f(0.0001));
    let normalized = (input.localPos - boundsMin) / span;

    let lightDir = normalize(vec3f(0.6, 0.8, 0.35));
    let normal = normalize(input.normal);
    let diffuse = saturate(dot(normal, lightDir));

    let cool = vec3f(0.15, 0.3, 0.6);
    let warm = vec3f(0.85, 0.6, 0.35);
    let gradient = mix(cool, warm, normalized.y);
    let base = gradient * (0.25 + 0.75 * diffuse);

    let viewDir = normalize(vec3f(0.0, 0.0, 1.0));
    let rim = pow(1.0 - saturate(dot(normal, viewDir)), 2.0);
    let surface = base + rim * vec3f(0.25, 0.4, 0.6);
    let glass = transparentMaterial(surface, normal, viewDir, input.screenUV, shaderUniforms.iTime);
    let color = mix(surface, glass, TRANSPARENT_MATERIAL);

    return vec4f(color, 1.0);
}
