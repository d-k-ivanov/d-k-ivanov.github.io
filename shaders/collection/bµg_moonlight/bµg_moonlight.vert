#version 300 es

// Moonlight [460] by bµg
// License: CC BY-NC-SA 4.0

// const vec2 pos[] = vec2[](vec2(-1.0f, -1.0f), vec2(-1.0f, 3.0f), vec2(3.0f, -1.0f));
const vec2 pos[] = vec2[](vec2(-1.0f, -1.0f), vec2(3.0f, -1.0f), vec2(-1.0f, 3.0f));

void main()
{
    gl_Position = vec4(pos[gl_VertexID], 0.0f, 1.0f);
}
