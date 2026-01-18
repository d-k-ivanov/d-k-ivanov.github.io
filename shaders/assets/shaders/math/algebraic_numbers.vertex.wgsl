const DATA_OFFSET : u32 = 6u;                       // Header skip in packed buffers (count/h/i/sign/state/rng).
const GRID_SIZE : vec3u = vec3u(1024u, 1024u, 1u);  // Storage capacity and instance count (max points stored).

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
    iGridSize : vec3u,
    iViewCenter : vec2f,
    iViewZoom : f32,
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
    if (degree == 0u)
    {
        return vec3f(1.0);
    }

    let paletteCommon = array<vec3f, 16>(
        vec3f(1.0, 0.0, 0.0),    // Red
        vec3f(0.0, 1.0, 0.0),    // Green
        vec3f(0.0, 0.0, 1.0),    // Blue
        vec3f(0.7, 0.7, 0.0),    // Yellow
        vec3f(1.0, 0.6, 0.0),    // Orange
        vec3f(0.0, 1.0, 1.0),    // Cyan
        vec3f(1.0, 0.0, 1.0),    // Magenta
        vec3f(0.6, 0.6, 0.6),    // Light gray
        vec3f(0.6, 0.0, 0.0),    // Dark red
        vec3f(0.5, 1.0, 0.0),    // Lime
        vec3f(0.0, 0.0, 0.5),    // Navy blue
        vec3f(1.0, 0.84, 0.0),   // Gold
        vec3f(0.8, 0.4, 0.0),    // Dark orange
        vec3f(0.0, 0.5, 0.5),    // Teal
        vec3f(0.5, 0.0, 0.5),    // Purple
        vec3f(1.0, 0.75, 0.8)    // Pink
    );

    let paletteDataSciece = array<vec3f, 16>(
        vec3f(0.12, 0.47, 0.71), // Blue
        vec3f(1.0, 0.5, 0.05),   // Orange
        vec3f(0.17, 0.63, 0.17), // Green
        vec3f(0.84, 0.15, 0.16), // Red
        vec3f(0.58, 0.4, 0.74),  // Purple
        vec3f(0.55, 0.34, 0.29), // Brown
        vec3f(0.89, 0.47, 0.76), // Pink
        vec3f(0.5, 0.5, 0.5),    // Gray
        vec3f(0.74, 0.74, 0.13), // Yellow
        vec3f(0.09, 0.75, 0.81), // Cyan
        vec3f(0.0, 0.27, 0.68),  // Dark blue
        vec3f(0.9, 0.33, 0.05),  // Dark orange
        vec3f(0.0, 0.5, 0.5),    // Teal
        vec3f(0.8, 0.0, 0.6),    // Magenta
        vec3f(0.13, 0.54, 0.13), // Dark green
        vec3f(0.2, 0.2, 0.58)    // Navy
    );

    let paletteEuroStat = array<vec3f, 16>(
        vec3f(0.91, 0.3, 0.24),  // Red
        vec3f(0.18, 0.8, 0.44),  // Green
        vec3f(0.2, 0.6, 0.86),   // Blue
        vec3f(1.0, 0.5, 0.0),    // Orange
        vec3f(0.61, 0.35, 0.71), // Purple
        vec3f(0.4, 0.76, 0.65),  // Teal
        vec3f(0.99, 0.75, 0.44), // Light orange
        vec3f(0.55, 0.34, 0.29), // Brown
        vec3f(0.9, 0.49, 0.13),  // Dark orange
        vec3f(0.17, 0.63, 0.17), // Dark green
        vec3f(0.58, 0.4, 0.74),  // Dark purple
        vec3f(0.2, 0.6, 0.86),   // Dark blue
        vec3f(1.0, 0.84, 0.0),   // Gold
        vec3f(0.13, 0.54, 0.13), // Forest green
        vec3f(0.89, 0.47, 0.76), // Pink
        vec3f(0.5, 0.5, 0.5)     // Gray
    );

    let idx = (degree - 1u) % 16u;
    return paletteCommon[idx];
}

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    var positions = array<vec2f, 3>(
        vec2f(-1.0, -1.0),
        vec2f(3.0, -1.0),
        vec2f(-1.0, 3.0)
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

    // Camera state comes from uniforms (center + zoom scale).
    let viewCenter = shaderUniforms.iViewCenter;
    var zoomScale = shaderUniforms.iViewZoom;
    if (zoomScale <= 0.0)
    {
        zoomScale = 1.0;
    }

    // Map complex plane to screen using orthographic base zoom (yres / 5).
    let baseZoom = shaderUniforms.iResolution.y / 5.0;
    let zoom = baseZoom * zoomScale;
    let worldPos = pos + local * blobSize;
    let screenCenter = vec2f(shaderUniforms.iResolution.x * 0.5, shaderUniforms.iResolution.y * 0.5);
    let screen = screenCenter + (worldPos - viewCenter) * zoom;
    let ndc = (screen / shaderUniforms.iResolution.xy) * 2.0 - vec2f(1.0, 1.0);

    out.Position = vec4f(ndc, 0.0, 1.0);
    out.color = degreeColor(degree);
    return out;
}
