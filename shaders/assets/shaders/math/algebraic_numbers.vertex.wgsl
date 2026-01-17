// Vertices per point sprite (two triangles forming a quad).
const VERTEX_COUNT : u32 = 6u;

// Header skip in packed buffers written by compute.
const DATA_OFFSET : u32 = 8u;

// Storage capacity and instance count (max points stored).
const GRID_SIZE : vec3u = vec3u(1024u, 1024u, 1u);

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
    // The palette: degree -> primary color (low degrees are brightest). The palette cycles every 8 degrees.
    if (degree == 0u)
    {
        return vec3f(1.0);
    }

    let idx = ((degree - 1u) % 8u) + 1u;
    if (idx == 1u)
    {
        return vec3f(1.0, 0.0, 0.0); // Red
    }
    if (idx == 2u)
    {
        return vec3f(0.0, 1.0, 0.0); // Green
    }
    if (idx == 3u)
    {
        return vec3f(0.0, 0.0, 1.0); // Blue
    }
    if (idx == 4u)
    {
        return vec3f(0.7, 0.7, 0.0); // Yellow
    }
    if (idx == 5u)
    {
        return vec3f(1.0, 0.6, 0.0); // Orange
    }
    if (idx == 6u)
    {
        return vec3f(0.0, 1.0, 1.0); // Cyan
    }
    if (idx == 7u)
    {
        return vec3f(1.0, 0.0, 1.0); // Magenta
    }
    if (idx == 8u)
    {
        return vec3f(0.6, 0.6, 0.6); // Light gray
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

    // packedMeta[0] stores the current number of generated points.
    let count = u32(packedMeta[0]);
    if (input.instance_index == 0u || input.instance_index > count)
    {
        out.Position = vec4f(2.0, 2.0, 0.0, 1.0);
        out.color = vec3f(0.0);
        return out;
    }

    // Data entries start after the header; instance_index maps to dataIndex.
    let dataIndex = input.instance_index + DATA_OFFSET - 1u;

    // packedXY stores (x,y) roots as half-floats; unpack returns complex plane coordinates.
    let packed = packedXY[dataIndex];
    let pos = unpack2x16float(packed);

    // packedInfo encodes degree in the upper 16 bits and complexity h in the lower 16 bits.
    let packedInfo = u32(packedMeta[dataIndex]);
    let h = packedInfo & 0xffffu;
    let degree = (packedInfo >> 16u) & 0xffffu;

    // Blob radius shrinks with complexity: r = k1 * k2^(h-3) (k1=0.125, k2=0.5).
    let r = 0.125 * pow(0.5, f32(h) - 3.0);
    let blobSize = r * 16.0;

    // Map complex plane to screen using orthographic zoom (yres / 5).
    let zoom = shaderUniforms.iResolution.y / 5.0;
    let worldPos = pos + local * blobSize;
    let screen = vec2f(shaderUniforms.iResolution.x * 0.5, shaderUniforms.iResolution.y * 0.5) + worldPos * zoom;
    let ndc = (screen / shaderUniforms.iResolution.xy) * 2.0 - vec2f(1.0, 1.0);

    out.Position = vec4f(ndc, 0.0, 1.0);
    out.color = degreeColor(degree);
    return out;
}
