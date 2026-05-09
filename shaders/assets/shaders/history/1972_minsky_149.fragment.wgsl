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

fn palette(t : f32) -> vec3f
{
    let a = vec3f(0.5, 0.5, 0.5);
    let b = vec3f(0.5, 0.5, 0.5);
    let c = vec3f(1.0, 1.0, 1.0);
    let d = vec3f(0.0,0.33,0.67);
    // let d = vec3f(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}


@fragment
fn frag() -> @location(0) vec4f
{
    let uv = shaderUniforms.iResolution.x / shaderUniforms.iResolution.y;
    let color = palette(length(uv) + shaderUniforms.iTime * 0.2);
    return vec4f(color, 1.0);
}
