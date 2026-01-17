// Additive blending sums overlapping blob intensities (glBlendFunc(GL_ONE, GL_ONE)).
const BLEND_ADD : bool = true;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) local : vec2f,
    @location(1) color : vec3f,
};

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    // Radial falloff replicates the blurred texture used in OpenGL.
    // f = R^2 / (1 + |x|^2), then scaled into [0, 1].
    let texCoord = input.local * 128.0;
    let f = (128.0 * 128.0) / (1.0 + dot(texCoord, texCoord));
    let intensity = min(1.0, f / 255.0);
    return vec4f(input.color * intensity, 1.0);
}
