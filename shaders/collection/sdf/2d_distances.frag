#version 300 es
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

out vec4 fragColor;

float sdCircle(in vec2 center, in float radius)
{
    return length(center) - radius;
}

void main()
{
    vec2 screenCenter = (2.0f * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
    vec2 m = (2.0f * iMouse.xy - iResolution.xy) / iResolution.y;

    float radius = 0.5f + 0.2f * sin(iTime);
    float disctance = sdCircle(screenCenter, radius);

    // coloring
    vec3 color;
    vec3 ousideColor = vec3(0.0f, 0.5f, 0.0f);
    vec3 insideColor = vec3(1.0f, 0.0f, 0.0f);

    // inside / outside color
    color = (disctance > 0.0f) ? ousideColor : insideColor;

    // fog effect
    color *= 1.0f - exp(-10.0f * abs(disctance));

    // repeating pattern
    color *= 0.5f + 0.5f * cos(100.0f * disctance);

    // highlight circle edge
    color = mix(color, vec3(1.0f), 1.0f - smoothstep(0.0f, 0.01f, abs(disctance)));

    fragColor = vec4(color, 1.0f);
}
