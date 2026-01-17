const VERTEX_COUNT : u32 = 6u;
const DATA_OFFSET : u32 = 8u;
const GRID_SIZE : vec3u = vec3u(847618u, 1u, 1u);

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
@group(0) @binding(1) var<storage, read> packedXY : array<u32>;
@group(0) @binding(3) var<storage, read> packedMeta : array<f32>;

struct VertexInput
{
    @builtin(vertex_index) vertex_index : u32,
    @builtin(instance_index) instance_index : u32,
};

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) local : vec2f,
    @location(1) color : vec3f,
};

fn degreeColor(degree : u32) -> vec3f
{
    if (degree == 1u)
    {
        return vec3f(1.0, 0.0, 0.0);
    }
    if (degree == 2u)
    {
        return vec3f(0.0, 1.0, 0.0);
    }
    if (degree == 3u)
    {
        return vec3f(0.0, 0.0, 1.0);
    }
    if (degree == 4u)
    {
        return vec3f(0.7, 0.7, 0.0);
    }
    if (degree == 5u)
    {
        return vec3f(1.0, 0.6, 0.0);
    }
    if (degree == 6u)
    {
        return vec3f(0.0, 1.0, 1.0);
    }
    if (degree == 7u)
    {
        return vec3f(1.0, 0.0, 1.0);
    }
    if (degree == 8u)
    {
        return vec3f(0.6, 0.6, 0.6);
    }
    return vec3f(1.0);
}

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    var positions = array<vec2f, VERTEX_COUNT>(
        vec2f(-1.0, -1.0),
        vec2f( 1.0, -1.0),
        vec2f( 1.0,  1.0),
        vec2f(-1.0, -1.0),
        vec2f( 1.0,  1.0),
        vec2f(-1.0,  1.0)
    );

    var out : VertexOutput;
    let local = positions[input.vertex_index];
    out.local = local;

    let count = u32(packedMeta[0]);
    if (input.instance_index == 0u || input.instance_index > count)
    {
        out.Position = vec4f(2.0, 2.0, 0.0, 1.0);
        out.color = vec3f(0.0);
        return out;
    }

    let dataIndex = input.instance_index + DATA_OFFSET - 1u;
    let packed = packedXY[dataIndex];
    let pos = unpack2x16float(packed);
    let packedInfo = u32(packedMeta[dataIndex]);
    let h = packedInfo & 0xffffu;
    let degree = (packedInfo >> 16u) & 0xffffu;

    let r = 0.125 * pow(0.5, f32(h) - 3.0);
    let blobSize = r * 16.0;

    let zoom = shaderUniforms.iResolution.y / 5.0;
    let worldPos = pos + local * blobSize;
    let screen = vec2f(shaderUniforms.iResolution.x * 0.5, shaderUniforms.iResolution.y * 0.5) + worldPos * zoom;
    let ndc = (screen / shaderUniforms.iResolution.xy) * 2.0 - vec2f(1.0, 1.0);

    out.Position = vec4f(ndc, 0.0, 1.0);
    out.color = degreeColor(degree);
    return out;
}
