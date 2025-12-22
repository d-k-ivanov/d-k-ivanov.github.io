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
};

fn saturate(value : f32) -> f32
{
    return clamp(value, 0.0, 1.0);
}

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let hasModel = modelInfo.boundsMin.w;
    if (hasModel < 0.5)
    {
        let uv = input.uv;
        let p = uv * 2.0 - 1.0;
        let ring = smoothstep(0.035, 0.0, abs(length(p) - 0.35));
        let scan = 0.5 + 0.5 * sin(uv.y * 24.0 + shaderUniforms.iTime * 2.0);
        let base = mix(vec3f(0.06, 0.07, 0.09), vec3f(0.12, 0.13, 0.16), scan * 0.4);
        let glow = vec3f(0.2, 0.5, 0.9) * ring;
        return vec4f(base + glow, 1.0);
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
    let color = base + rim * vec3f(0.25, 0.4, 0.6);

    return vec4f(color, 1.0);
}
