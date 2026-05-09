struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouseL : vec4f,
    iMouseR : vec4f,
    iMouseW : vec4f,
    iMouseZoom : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

const BLEND_ADD : bool = true;

struct FragInput
{
    @location(0) local : vec2f,
    @location(1) color : vec3f,
};

@fragment
fn frag(input : FragInput) -> @location(0) vec4f
{
    // Soft circular dot via distance from center
    let d2 = dot(input.local, input.local);
    if (d2 > 1.0) {
        discard;
    }

    let intensity = 1.0 - d2;
    return vec4f(input.color * intensity, 1.0);
}
