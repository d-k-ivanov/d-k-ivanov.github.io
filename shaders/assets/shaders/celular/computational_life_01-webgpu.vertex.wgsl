const GRID_SIZE : vec3u = vec3u(640u, 360u, 1u);
const TAPE_SIDE : u32 = 8u;
const VERTEX_COUNT : u32 = 6u;

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
@group(0) @binding(1) var<storage, read> cellState : array<u32>;
@group(0) @binding(3) var<storage, read> scoreState : array<f32>;

struct VertexInput
{
    @builtin(vertex_index) vertexIndex : u32,
    @builtin(instance_index) instanceIndex : u32,
};

struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) @interpolate(flat) byteValue : u32,
    @location(1) @interpolate(flat) localCell : vec2u,
    @location(2) score : f32,
};

fn byteCellIndex(cell: vec2u) -> u32
{
    return cell.y * shaderUniforms.iGridSize.x + cell.x;
}

@vertex
fn vert(input : VertexInput) -> VertexOutput
{
    let quad = array<vec2f, VERTEX_COUNT>(
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 0.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 1.0)
    );

    let grid = shaderUniforms.iGridSize.xy;
    let gridF = vec2f(f32(grid.x), f32(grid.y));
    let cell = vec2u(input.instanceIndex % grid.x, input.instanceIndex / grid.x);
    let localCell = cell % vec2u(TAPE_SIDE, TAPE_SIDE);
    let programCell = cell / vec2u(TAPE_SIDE, TAPE_SIDE);
    let topLeft = programCell * vec2u(TAPE_SIDE, TAPE_SIDE);
    let score = scoreState[byteCellIndex(topLeft)];

    let cellMin = vec2f(cell) / gridF;
    let cellMax = vec2f(cell + vec2u(1u, 1u)) / gridF;
    let uv = quad[input.vertexIndex];
    let gridPos = mix(cellMin, cellMax, uv);

    var clip = vec2f(gridPos.x * 2.0 - 1.0, 1.0 - gridPos.y * 2.0);
    let gridAspect = gridF.x / gridF.y;
    let canvasAspect = shaderUniforms.iResolution.x / max(shaderUniforms.iResolution.y, 1.0);
    if (canvasAspect > gridAspect)
    {
        clip.x = clip.x * (gridAspect / canvasAspect);
    }
    else
    {
        clip.y = clip.y * (canvasAspect / gridAspect);
    }

    var out : VertexOutput;
    out.position = vec4f(clip, 0.0, 1.0);
    out.byteValue = cellState[input.instanceIndex] & 255u;
    out.localCell = localCell;
    out.score = score;
    return out;
}
