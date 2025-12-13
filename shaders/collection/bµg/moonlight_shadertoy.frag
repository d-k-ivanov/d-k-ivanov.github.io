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

//
// Moonlight by bµg
// License: CC BY-NC-SA 4.0
//
// Portage of: https://b.pkh.me/2025-11-09-moonlight.htm (460 chars)
//

void mainImage(out vec4 O, vec2 P)
{
    vec3 o, p,
         R = iResolution,
         u = vec3((P+P-R.xy)/R.y, 1);

    for (
       float d,a,m,i,t,
             T = iTime

     ; i++<1e2
     ; d = abs(d)*.15+.1,

       // bland twilight version
       //o += 1./m + (t>9. ? d=9.,1. : 1./d),

       // orange/reddish version
       p = t<7.2 ? R/R : vec3(2,1,0), o += p/m + (t>9. ? d=9.,R/R : p/d),


       t += min(m, d)
    )
        for (
           p = normalize(u)*t,
           p.z -= 5e1,
           m = max(length(p)-1e1,.01),
           p.z += T,
           d = 5.-length(p.xy*=mat2(cos(t*.2+vec4(0,33,11,0)))),
           a = .01
         ; a < 1.
         ; a += a)
             p.xz *= mat2(8,6,-6,8)*.1,
             d -= abs(dot(sin(p/a*.6 - T*.3), p-p+a)),
             m += abs(dot(sin(p/a/5.), p-p+a/5.));

    o /= 4e2;
    O.rgb = tanh(mix(
        vec3(-35, -15,  8),
        vec3(118,  95, 60),
        o-o*length(u.xy*.5)
    )*.01);
}
