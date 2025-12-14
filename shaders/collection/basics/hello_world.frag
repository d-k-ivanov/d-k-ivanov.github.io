#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform vec3 iResolution;
uniform float iTime;

out vec4 fragColor;

void main()
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    // Animated gradient: time-varying colors
    vec3 col = 0.5f + 0.5f * cos(iTime + uv.xyx + vec3(0.0f, 2.0f, 4.0f));

    // Output to screen
    fragColor = vec4(col, 1.0f);
}
