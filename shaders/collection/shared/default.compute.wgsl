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

// Minimal compute shader used when a specific compute shader is not provided.

@compute @workgroup_size(1)
fn main() {
    let _frame = shaderUniforms.iFrame;
}
