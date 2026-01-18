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
@group(0) @binding(10) var computeTexture : texture_storage_2d<rgba8unorm, write>;

// Minimal compute shader used when a specific compute shader is not provided.

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3u)
{
    let dims = textureDimensions(computeTexture);
    if (gid.x >= dims.x || gid.y >= dims.y)
    {
        return;
    }

    let uv = (vec2f(gid.xy) + 0.5) / vec2f(dims);
    let t = shaderUniforms.iTime * 10.0;
    let band = 0.5 + 0.2 * sin((uv.x + uv.y) / 2.0 * 35.0 + t);

    textureStore(computeTexture, vec2u(gid.xy), vec4f(vec3f(band), 1.0));
}
