#version 300 es
precision highp float;

out vec2 vUv;

uniform vec3 iResolution;

void main()
{
    vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    vUv = corner * 0.5;

    vec2 pos = corner * 2.0 - 1.0;
    vec2 scale = normalize(iResolution.xy + 1.0);

    gl_Position = vec4(pos + scale * 0.0, 0.0, 1.0);
}
