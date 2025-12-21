#version 300 es
precision highp float;

// MODEL_GEOMETRY

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUV;

uniform vec3 iResolution;
uniform float iTime;
uniform vec3 uModelCenter;
uniform float uModelScale;
uniform float uHasModel;

out vec3 vNormal;
out vec3 vLocalPos;
out vec2 vUV;

mat3 rotationX(float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
    );
}

mat3 rotationY(float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
    );
}

void main()
{
    if (uHasModel < 0.5)
    {
        vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
        gl_Position = vec4(pos, 0.0, 1.0);
        vNormal = vec3(0.0, 0.0, 1.0);
        vLocalPos = vec3(pos, 0.0);
        vUV = pos * 0.5 + 0.5;
        return;
    }

    vec3 localPos = (aPosition - uModelCenter) * uModelScale;
    mat3 rot = rotationY(iTime * 0.6) * rotationX(0.);
    vec3 world = rot * localPos;
    vec3 normal = normalize(rot * aNormal);

    vec3 camPos = vec3(0.0, 0.0, 3.0);
    vec3 view = world - camPos;
    float aspect = iResolution.x / max(1.0, iResolution.y);
    float z = max(0.1, -view.z);
    float f = 2.0;
    vec2 clip = (view.xy / z) * f;
    clip.x /= aspect;

    float nearPlane = 0.1;
    float farPlane = 10.0;
    float zNdc = ((z - nearPlane) / (farPlane - nearPlane)) * 2.0 - 1.0;

    gl_Position = vec4(clip, zNdc, 1.0);
    vNormal = normal;
    vLocalPos = localPos;
    vUV = aUV;
}
