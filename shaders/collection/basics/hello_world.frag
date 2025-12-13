#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

out vec4 fragColor;

void main() {
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    // Animated gradient: time-varying colors
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0.0, 2.0, 4.0));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
