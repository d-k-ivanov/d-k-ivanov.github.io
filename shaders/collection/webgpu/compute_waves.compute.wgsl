// Compute pass writes a swirling wave field into the storage texture at @binding(1).
struct ShaderUniforms {
    iResolution : vec3f,
    _padding0 : f32,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    _padding1 : vec2f,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;

fn palette(t : f32) -> vec3f {
    let a = vec3f(0.12, 0.18, 0.28);
    let b = vec3f(0.22, 0.32, 0.48);
    let c = vec3f(0.22, 0.16, 0.12);
    let d = vec3f(0.01, 0.15, 0.38);
    return a + b * cos(6.28318 * (c * t + d));
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3u) {
    let dims = textureDimensions(outputTex);
    if (gid.x >= dims.x || gid.y >= dims.y) {
        return;
    }

    let uv = (vec2f(gid.xy) + 0.5) / vec2f(dims);
    let centered = uv - 0.5;
    let time = shaderUniforms.iTime * 0.75;

    let swirl = atan2(centered.y, centered.x);
    let radius = length(centered);
    let waves = sin(radius * 28.0 - time * 6.0) + cos((swirl + time) * 3.0);
    let ringPulse = 0.5 + 0.5 * sin(time * 2.0 + radius * 10.0);
    let baseColor = palette(0.5 + 0.25 * waves + 0.25 * ringPulse);

    let mouse = shaderUniforms.iMouse;
    var glow = 0.0;
    if (mouse.z > 0.0)
    {
        let mousePos = mouse.xy / shaderUniforms.iResolution.xy;
        let distToMouse = length(uv - mousePos);
        glow = smoothstep(0.2, 0.0, distToMouse) * (1.0 + 0.5 * sin(time));
        // glow = exp(-140.0 * distToMouse);
    }

    let color = clamp(baseColor + vec3f(glow, glow * 0.5, 0.0), vec3f(0.0), vec3f(1.0));
    textureStore(outputTex, vec2u(gid.xy), vec4f(color, 1.0));
}
