#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform float iFrameRate;
uniform int iFrame;
uniform vec4 iMouseL;

// Forward declarations
void mainImage(out vec4 c, in vec2 f);

// Output
out vec4 fragColor;

void main(void)
{
    fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
    vec4 color = vec4(1e20f);
    mainImage(color, gl_FragCoord.xy);
    if(fragColor.x < 0.0f)
        color = vec4(1.0f, 0.0f, 0.0f, 1.0f);
    if(fragColor.y < 0.0f)
        color = vec4(0.0f, 1.0f, 0.0f, 1.0f);
    if(fragColor.z < 0.0f)
        color = vec4(0.0f, 0.0f, 1.0f, 1.0f);
    if(fragColor.w < 0.0f)
        color = vec4(1.0f, 1.0f, 0.0f, 1.0f);
    fragColor = vec4(color.xyz, 1.0f);
}

// *******************************************************************
// ShaderToy Template. Empty shader, you can paste your ShaderToy code below.
// *******************************************************************

void mainImage(out vec4 color, in vec2 coords)
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = coords / iResolution.xy;
    // Time varying pixel color
    color = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}