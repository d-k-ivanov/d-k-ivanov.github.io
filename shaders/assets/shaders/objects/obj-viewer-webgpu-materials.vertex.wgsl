const VERTEX_COUNT : u32 = 3u;

// MODEL_GEOMETRY

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
};

struct ModelInfo
{
    boundsMin : vec4f,
    boundsMax : vec4f,
    center : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(20) var<storage, read> modelPositions : array<vec4f>;
@group(0) @binding(21) var<storage, read> modelNormals : array<vec4f>;
@group(0) @binding(22) var<storage, read> modelUVs : array<vec4f>;
@group(0) @binding(23) var<storage, read> modelInfo : ModelInfo;

struct VertexOutput
{
    @builtin(position) Position : vec4f,
    @location(0) normal : vec3f,
    @location(1) localPos : vec3f,
    @location(2) uv : vec2f,
};

fn rotationX(angle : f32) -> mat3x3<f32>
{
    let c = cos(angle);
    let s = sin(angle);
    return mat3x3<f32>(
        vec3f(1.0, 0.0, 0.0),
        vec3f(0.0, c, s),
        vec3f(0.0, -s, c)
    );
}

fn rotationY(angle : f32) -> mat3x3<f32>
{
    let c = cos(angle);
    let s = sin(angle);
    return mat3x3<f32>(
        vec3f(c, 0.0, s),
        vec3f(0.0, 1.0, 0.0),
        vec3f(-s, 0.0, c)
    );
}

fn rotationZ(angle : f32) -> mat3x3<f32>
{
    let c = cos(angle);
    let s = sin(angle);
    return mat3x3<f32>(
        vec3f(c, -s, 0.0),
        vec3f(s, c, 0.0),
        vec3f(0.0, 0.0, 1.0)
    );
}

@vertex
fn vert(@builtin(vertex_index) idx : u32) -> VertexOutput
{
    let hasModel = modelInfo.boundsMin.w;
    var out : VertexOutput;

    if (hasModel < 0.5)
    {
        let positions = array<vec2f, 3>(
            vec2f(-1.0, -1.0),
            vec2f(3.0, -1.0),
            vec2f(-1.0, 3.0)
        );
        let uvs = array<vec2f, 3>(
            vec2f(0.0, 0.0),
            vec2f(2.0, 0.0),
            vec2f(0.0, 2.0)
        );

        out.Position = vec4f(positions[idx], 0.0, 1.0);
        out.normal = vec3f(0.0, 0.0, 1.0);
        out.localPos = vec3f(positions[idx], 0.0);
        out.uv = uvs[idx];
        return out;
    }

    let position = modelPositions[idx].xyz;
    let normal = modelNormals[idx].xyz;
    let uv = modelUVs[idx].xy;

    let localPos = (position - modelInfo.center.xyz) * modelInfo.boundsMax.w;
    let rot = rotationY(shaderUniforms.iTime * 0.6) * rotationX(0.0) * rotationZ(0.0);
    let world = rot * localPos;
    let normalRot = normalize(rot * normal);

    let camPos = vec3f(0.0, 0.0, 3.0);
    let view = world - camPos;
    let aspect = shaderUniforms.iResolution.x / max(1.0, shaderUniforms.iResolution.y);
    let z = max(0.1, -view.z);
    let f = 2.0;
    var clip = (view.xy / z) * f;
    clip.x = clip.x / aspect;

    let nearPlane = 0.1;
    let farPlane = 10.0;
    let zNdc = (z - nearPlane) / (farPlane - nearPlane);

    out.Position = vec4f(clip, zNdc, 1.0);
    out.normal = normalRot;
    out.localPos = localPos;
    out.uv = uv;
    return out;
}
