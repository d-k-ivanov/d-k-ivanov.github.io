#version 300 es

// Full-screen triangle vertex shader

void main()
{
    vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0f - 1.0f;
    gl_Position = vec4(pos, 0.0f, 1.0f);
}
