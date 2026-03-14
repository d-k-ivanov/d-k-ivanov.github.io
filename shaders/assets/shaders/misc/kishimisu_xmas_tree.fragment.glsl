#version 300 es

#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;
uniform float iTime;

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

void mainImage( out vec4 E, vec2 F ) {

    vec2   X         = iResolution.xy,
             M       = (F+F-X) / X.y / .45,
               A     ; float
                 S   = length(M),

           T         = iTime * .5,
             R       ;
    for (      E     *= R, M.x = abs(M.x); R++ < 8.;
                 E   += .004/abs(sin(length( A = fract((M-vec2(0,1))*(1.5 + R*.1)
                     * mat2(cos(vec4(0,33,11,0) - T*.05))) -.5 )
                     * exp(length(A)*1.5 - S) * 7. + sin(T)*.05) / 8.
                     - .3 * smoothstep(.3, 1., M.y*.6 + M.x + 1.4 + sin(M.y*13.+3.)*.1 - 2.*smoothstep(.3, 1., M.y + 2.2)))
                     * (1. + cos(R*.5 + S*5. -T*4. + vec4(0,1,2,0))));
}
