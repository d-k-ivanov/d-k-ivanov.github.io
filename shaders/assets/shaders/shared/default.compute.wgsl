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

// Default compute shader used when specific compute shader is not provided.

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3u)
{
    let frame = shaderUniforms.iFrame;
}
