#version 300 es

// License: CC BY-NC-SA 4.0

void main() {
    vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
    gl_Position = vec4(pos, 0.0, 1.0);
}