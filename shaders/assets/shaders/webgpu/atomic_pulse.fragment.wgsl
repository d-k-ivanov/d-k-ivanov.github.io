struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) uv : vec2f,
};

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let res = shaderUniforms.iResolution.xy;
    let aspect = res.x / max(res.y, 1.0);
    let uv = (input.uv - 0.5) * vec2f(aspect, 1.0) * 2.0;
    let time = shaderUniforms.iTime;

    let angle = atan2(uv.y, uv.x);
    let radius = length(uv);

    let rings = smoothstep(1.0, 0.0, abs(radius - 2.0 * sin(time * 2.0)));
    let speed = 5.0;
    let intensity = 2.0;
    let wave = sin(angle * intensity - time * speed) + cos(radius * intensity - time * speed );
    let aurora = 0.5 + 0.5 * sin(wave);

    let base = mix(vec3f(0.0, 0.0, 0.2), vec3f(0.0, 0.8, 0.8), aurora);
    let rim = vec3f(0.8, 0.5, 0.2) * rings;
    let centerPulse = exp(-6.0 * pow(abs(radius - 0.18), 1.4));

    let mouse = shaderUniforms.iMouse.xy / res;
    let mousePos = (mouse - 0.5) * vec2f(aspect, 1.0) * 2.0;
    let mouseGlow = exp(-25.0 * length(uv - mousePos)) * step(0.0, shaderUniforms.iMouse.z);

    let color = clamp(
        base + rim + centerPulse * vec3f(0.12, 0.2, 0.4) + mouseGlow * vec3f(0.6, 0.8, 1.0),
        vec3f(0.0),
        vec3f(1.0)
    );

    return vec4f(color, 1.0);
}
