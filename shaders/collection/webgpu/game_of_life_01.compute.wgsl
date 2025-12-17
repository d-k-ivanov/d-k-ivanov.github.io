struct ShaderUniforms
{
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

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3u)
{
    let dims = textureDimensions(outputTex);
    if (gid.x >= dims.x || gid.y >= dims.y)
    {
        return;
    }

    // Empty compute shader that does nothing but can access frame count
    let frame = shaderUniforms.iFrame;
}
