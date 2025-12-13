---
layout: post
description: common shader uniforms used
date: 2025-12-12
---
# Common Shader Uniforms

## ShaderToy Vertex Shader Structure WebGL 2.0

With input attribute location specified.

```glsl
#version 300 es

layout(location = 0) in vec2 pos;

void main()
{
    gl_Position = vec4(pos.xy, 0.0f, 1.0f);
}
```

Without input attribute location specified.

```glsl
#version 300 es

out vec2 vUv;

void main()
{
    vec2 pos;
    if(gl_VertexID == 0)
    {
        pos = vec2(-1.0f, -1.0f);
    }
    else if(gl_VertexID == 1)
    {
        pos = vec2(3.0f, -1.0f);
    }
    else
    {
        pos = vec2(-1.0f, 3.0f);
    }

    vUv = 0.5f * (pos + 1.0f);
    gl_Position = vec4(pos, 0.0f, 1.0f);
}
```

Alternative without UV output.

```glsl
#version 300 es

void main() {
    // Generate fullscreen triangle from gl_VertexID (0, 1, 2)
    // Vertex 0: (-1, -1), Vertex 1: (3, -1), Vertex 2: (-1, 3)
    vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
    gl_Position = vec4(pos, 0.0, 1.0);
}
```

## ShaderToy Fragment Shader Structure WebGL 2.0

Simplified version.

```glsl
#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform vec3 iResolution;               // viewport resolution (in pixels)

uniform float iTime;                    // shader playback time (in seconds)
uniform float iTimeDelta;               // render time (in seconds)

uniform int iFrame;                     // shader playback frame
uniform float iFrameRate;               // shader frame rate

uniform float iChannelTime[4];          // channel playback time (in seconds)
uniform vec3 iChannelResolution[4];     // channel resolution (in pixels)

uniform vec4 iMouse;                    // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4 iDate;                     // (year, month, day, time in seconds)
uniform float iSampleRate;              // sound sample rate (i.e., 44100)

// uniform samplerXX iChannel0..3;      // input channel. XX = 2D/Cube
uniform sampler2D iChannel0;            // input channel 0
uniform sampler2D iChannel1;            // input channel 1
uniform sampler2D iChannel2;            // input channel 2
uniform sampler2D iChannel3;            // input channel 3
// uniform samplerCube iChannel0;       // input channel 0
// uniform samplerCube iChannel1;       // input channel 1
// uniform samplerCube iChannel2;       // input channel 2
// uniform samplerCube iChannel3;       // input channel 3

out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord);
{
}

void main()
{
    mainImage(fragColor, gl_FragCoord.xy);
}
```

Full version with asserts.

```glsl
#version 300 es

#ifdef GL_ES
    precision highp float;
    precision highp int;
    precision mediump sampler3D;
#endif

// Uniforms
uniform vec3 iResolution;               // viewport resolution (in pixels)

uniform float iTime;                    // shader playback time (in seconds)
uniform float iTimeDelta;               // render time (in seconds)

uniform int iFrame;                     // shader playback frame
uniform float iFrameRate;               // shader frame rate

uniform float iChannelTime[4];          // channel playback time (in seconds)
uniform vec3 iChannelResolution[4];     // channel resolution (in pixels)

uniform vec4 iMouse;                    // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4 iDate;                     // (year, month, day, time in seconds)
uniform float iSampleRate;              // sound sample rate (i.e., 44100)

// Channel samplers
// uniform samplerXX iChannel0..3;      // input channel. XX = 2D/Cube
uniform sampler2D iChannel0;            // input channel 0
uniform sampler2D iChannel1;            // input channel 1
uniform sampler2D iChannel2;            // input channel 2
uniform sampler2D iChannel3;            // input channel 3
// uniform samplerCube iChannel0;       // input channel 0
// uniform samplerCube iChannel1;       // input channel 1
// uniform samplerCube iChannel2;       // input channel 2
// uniform samplerCube iChannel3;       // input channel 3

// New API channel structs
uniform struct
{
    sampler2D sampler;
    vec3 size;
    float time;
    int loaded;
}
iCh0;

uniform struct
{
    sampler2D sampler;
    vec3 size;
    float time;
    int loaded;
}
iCh1;

uniform struct
{
    sampler2D sampler;
    vec3 size;
    float time;
    int loaded;
}
iCh2;

uniform struct
{
    sampler2D sampler;
    vec3 size;
    float time;
    int loaded;
}
iCh3;

// Forward declarations
void mainImage(out vec4 c, in vec2 f);
void st_assert(bool cond);
void st_assert(bool cond, int v);

// Output
out vec4 fragColor;

// Assert implementations
void st_assert(bool cond, int v)
{
    if(!cond)
    {
        if(v == 0)
        {
            fragColor.x = -1.0f;
        }
        else if(v == 1)
        {
            fragColor.y = -1.0f;
        }
        else if(v == 2)
        {
            fragColor.z = -1.0f;
        }
        else
        {
            fragColor.w = -1.0f;
        }
    }
}

void st_assert(bool cond)
{
    if(!cond)
    {
        fragColor.x = -1.0f;
    }
}

void main(void)
{
    fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);

    vec4 color = vec4(1e20f);
    mainImage(color, gl_FragCoord.xy);

    if(fragColor.x < 0.0f)
    {
        color = vec4(1.0f, 0.0f, 0.0f, 1.0f);
    }
    if(fragColor.y < 0.0f)
    {
        color = vec4(0.0f, 1.0f, 0.0f, 1.0f);
    }
    if(fragColor.z < 0.0f)
    {
        color = vec4(0.0f, 0.0f, 1.0f, 1.0f);
    }
    if(fragColor.w < 0.0f)
    {
        color = vec4(1.0f, 1.0f, 0.0f, 1.0f);
    }

    fragColor = vec4(color.xyz, 1.0f);
}

```

## ShaderToy Vertex Shader Structure WebGL 1.0

```glsl
attribute vec2 pos;

void main()
{
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
```

## ShaderToy Fragment Shader Structure WebGL 1.0

```glsl
// Optional extensions (enabled if available)
#ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
#endif
#extension GL_EXT_shader_texture_lod : enable

#ifdef GL_ES
    precision highp float;
    precision highp int;
#endif

// Texture sampling compatibility (WebGL 1.0 polyfills)
vec4 texture(sampler2D s, vec2 c)
{
    return texture2D(s, c);
}
vec4 texture(sampler2D s, vec2 c, float b)
{
    return texture2D(s, c, b);
}
vec4 texture(samplerCube s, vec3 c)
{
    return textureCube(s, c);
}
vec4 texture(samplerCube s, vec3 c, float b)
{
    return textureCube(s, c, b);
}

// Math function polyfills (not available in WebGL 1.0)
float round(float x)
{
    return floor(x + 0.5);
}
vec2 round(vec2 x)
{
    return floor(x + 0.5);
}
vec3 round(vec3 x)
{
    return floor(x + 0.5);
}
vec4 round(vec4 x)
{
    return floor(x + 0.5);
}
float trunc(float x, float n)
{
    return floor(x * n) / n;
}

// Matrix functions
mat3 transpose(mat3 m)
{
    return mat3(m[0].x, m[1].x, m[2].x, m[0].y, m[1].y, m[2].y, m[0].z, m[1].z, m[2].z);
}

float determinant(in mat2 m)
{
    return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

float determinant(mat4 m)
{
    float b00 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    float b01 = m[0][0] * m[1][2] - m[0][2] * m[1][0];
    float b02 = m[0][0] * m[1][3] - m[0][3] * m[1][0];
    float b03 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
    float b04 = m[0][1] * m[1][3] - m[0][3] * m[1][1];
    float b05 = m[0][2] * m[1][3] - m[0][3] * m[1][2];
    float b06 = m[2][0] * m[3][1] - m[2][1] * m[3][0];
    float b07 = m[2][0] * m[3][2] - m[2][2] * m[3][0];
    float b08 = m[2][0] * m[3][3] - m[2][3] * m[3][0];
    float b09 = m[2][1] * m[3][2] - m[2][2] * m[3][1];
    float b10 = m[2][1] * m[3][3] - m[2][3] * m[3][1];
    float b11 = m[2][2] * m[3][3] - m[2][3] * m[3][2];
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

mat2 inverse(mat2 m)
{
    float det = determinant(m);
    return mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]) / det;
}

mat4 inverse(mat4 m)
{
    float inv0 = m[1].y * m[2].z * m[3].w - m[1].y * m[2].w * m[3].z - m[2].y * m[1].z * m[3].w + m[2].y * m[1].w * m[3].z + m[3].y * m[1].z * m[2].w - m[3].y * m[1].w * m[2].z;
    float inv4 = -m[1].x * m[2].z * m[3].w + m[1].x * m[2].w * m[3].z + m[2].x * m[1].z * m[3].w - m[2].x * m[1].w * m[3].z - m[3].x * m[1].z * m[2].w + m[3].x * m[1].w * m[2].z;
    float inv8 = m[1].x * m[2].y * m[3].w - m[1].x * m[2].w * m[3].y - m[2].x * m[1].y * m[3].w + m[2].x * m[1].w * m[3].y + m[3].x * m[1].y * m[2].w - m[3].x * m[1].w * m[2].y;
    float inv12 = -m[1].x * m[2].y * m[3].z + m[1].x * m[2].z * m[3].y + m[2].x * m[1].y * m[3].z - m[2].x * m[1].z * m[3].y - m[3].x * m[1].y * m[2].z + m[3].x * m[1].z * m[2].y;
    float inv1 = -m[0].y * m[2].z * m[3].w + m[0].y * m[2].w * m[3].z + m[2].y * m[0].z * m[3].w - m[2].y * m[0].w * m[3].z - m[3].y * m[0].z * m[2].w + m[3].y * m[0].w * m[2].z;
    float inv5 = m[0].x * m[2].z * m[3].w - m[0].x * m[2].w * m[3].z - m[2].x * m[0].z * m[3].w + m[2].x * m[0].w * m[3].z + m[3].x * m[0].z * m[2].w - m[3].x * m[0].w * m[2].z;
    float inv9 = -m[0].x * m[2].y * m[3].w + m[0].x * m[2].w * m[3].y + m[2].x * m[0].y * m[3].w - m[2].x * m[0].w * m[3].y - m[3].x * m[0].y * m[2].w + m[3].x * m[0].w * m[2].y;
    float inv13 = m[0].x * m[2].y * m[3].z - m[0].x * m[2].z * m[3].y - m[2].x * m[0].y * m[3].z + m[2].x * m[0].z * m[3].y + m[3].x * m[0].y * m[2].z - m[3].x * m[0].z * m[2].y;
    float inv2 = m[0].y * m[1].z * m[3].w - m[0].y * m[1].w * m[3].z - m[1].y * m[0].z * m[3].w + m[1].y * m[0].w * m[3].z + m[3].y * m[0].z * m[1].w - m[3].y * m[0].w * m[1].z;
    float inv6 = -m[0].x * m[1].z * m[3].w + m[0].x * m[1].w * m[3].z + m[1].x * m[0].z * m[3].w - m[1].x * m[0].w * m[3].z - m[3].x * m[0].z * m[1].w + m[3].x * m[0].w * m[1].z;
    float inv10 = m[0].x * m[1].y * m[3].w - m[0].x * m[1].w * m[3].y - m[1].x * m[0].y * m[3].w + m[1].x * m[0].w * m[3].y + m[3].x * m[0].y * m[1].w - m[3].x * m[0].w * m[1].y;
    float inv14 = -m[0].x * m[1].y * m[3].z + m[0].x * m[1].z * m[3].y + m[1].x * m[0].y * m[3].z - m[1].x * m[0].z * m[3].y - m[3].x * m[0].y * m[1].z + m[3].x * m[0].z * m[1].y;
    float inv3 = -m[0].y * m[1].z * m[2].w + m[0].y * m[1].w * m[2].z + m[1].y * m[0].z * m[2].w - m[1].y * m[0].w * m[2].z - m[2].y * m[0].z * m[1].w + m[2].y * m[0].w * m[1].z;
    float inv7 = m[0].x * m[1].z * m[2].w - m[0].x * m[1].w * m[2].z - m[1].x * m[0].z * m[2].w + m[1].x * m[0].w * m[2].z + m[2].x * m[0].z * m[1].w - m[2].x * m[0].w * m[1].z;
    float inv11 = -m[0].x * m[1].y * m[2].w + m[0].x * m[1].w * m[2].y + m[1].x * m[0].y * m[2].w - m[1].x * m[0].w * m[2].y - m[2].x * m[0].y * m[1].w + m[2].x * m[0].w * m[1].y;
    float inv15 = m[0].x * m[1].y * m[2].z - m[0].x * m[1].z * m[2].y - m[1].x * m[0].y * m[2].z + m[1].x * m[0].z * m[2].y + m[2].x * m[0].y * m[1].z - m[2].x * m[0].z * m[1].y;
    float det = m[0].x * inv0 + m[0].y * inv4 + m[0].z * inv8 + m[0].w * inv12;
    det = 1.0 / det;
    return det * mat4(inv0, inv1, inv2, inv3, inv4, inv5, inv6, inv7, inv8, inv9, inv10, inv11, inv12, inv13, inv14, inv15);
}

// Hyperbolic functions
float sinh(float x)
{
    return (exp(x) - exp(-x)) / 2.0;
}
float cosh(float x)
{
    return (exp(x) + exp(-x)) / 2.0;
}
float tanh(float x)
{
    return sinh(x) / cosh(x);
}
float coth(float x)
{
    return cosh(x) / sinh(x);
}
float sech(float x)
{
    return 1.0 / cosh(x);
}
float csch(float x)
{
    return 1.0 / sinh(x);
}
float asinh(float x)
{
    return log(x + sqrt(x * x + 1.0));
}
float acosh(float x)
{
    return log(x + sqrt(x * x - 1.0));
}
float atanh(float x)
{
    return 0.5 * log((1.0 + x) / (1.0 - x));
}
float acoth(float x)
{
    return 0.5 * log((x + 1.0) / (x - 1.0));
}
float asech(float x)
{
    return log((1.0 + sqrt(1.0 - x * x)) / x);
}
float acsch(float x)
{
    return log((1.0 + sqrt(1.0 + x * x)) / x);
}

// Texture LOD polyfills (when GL_EXT_shader_texture_lod is available)
vec4 textureLod(sampler2D s, vec2 c, float b)
{
    return texture2DLodEXT(s, c, b);
}
vec4 textureGrad(sampler2D s, vec2 c, vec2 dx, vec2 dy)
{
    return texture2DGradEXT(s, c, dx, dy);
}


// Uniforms
uniform vec3 iResolution;               // viewport resolution (in pixels)

uniform float iTime;                    // shader playback time (in seconds)
uniform float iTimeDelta;               // render time (in seconds)

uniform int iFrame;                     // shader playback frame
uniform float iFrameRate;               // shader frame rate

uniform float iChannelTime[4];          // channel playback time (in seconds)
uniform vec3 iChannelResolution[4];     // channel resolution (in pixels)

uniform vec4 iMouse;                    // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4 iDate;                     // (year, month, day, time in seconds)
uniform float iSampleRate;              // sound sample rate (i.e., 44100)

// Channel samplers
// uniform samplerXX iChannel0..3;       // input channel. XX = 2D/Cube
uniform sampler2D iChannel0;             // input channel 0
uniform sampler2D iChannel1;             // input channel 1
uniform sampler2D iChannel2;             // input channel 2
uniform sampler2D iChannel3;             // input channel 3
// uniform samplerCube iChannel0;        // input channel 0
// uniform samplerCube iChannel1;        // input channel 1
// uniform samplerCube iChannel2;        // input channel 2
// uniform samplerCube iChannel3;        // input channel 3

// Forward declarations
void mainImage(out vec4 c, in vec2 f);
void st_assert(bool cond);
void st_assert(bool cond, int v);

// Assert implementations
void st_assert(bool cond, int v)
{
    if(!cond)
    {
        if(v == 0)
            gl_FragColor.x = -1.0;
        else if(v == 1)
            gl_FragColor.y = -1.0;
        else if(v == 2)
            gl_FragColor.z = -1.0;
        else
            gl_FragColor.w = -1.0;
    }
}

void st_assert(bool cond)
{
    if(!cond)
        gl_FragColor.x = -1.0;
}

void main(void)
{
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

    vec4 color = vec4(1e20);
    mainImage(color, gl_FragCoord.xy);
    color.w = 1.0;

    if(gl_FragColor.w < 0.0)
    {
        color = vec4(1.0, 0.0, 0.0, 1.0);
    }
    if(gl_FragColor.x < 0.0)
    {
        color = vec4(1.0, 0.0, 0.0, 1.0);
    }
    if(gl_FragColor.y < 0.0)
    {
        color = vec4(0.0, 1.0, 0.0, 1.0);
    }
    if(gl_FragColor.z < 0.0)
    {
        color = vec4(0.0, 0.0, 1.0, 1.0);
    }
    if(gl_FragColor.w < 0.0)
    {
        color = vec4(1.0, 1.0, 0.0, 1.0);
    }

    gl_FragColor = vec4(color.xyz, 1.0);
}
```

## ThreeJS Vertex Shader Structure

```glsl
#version 300 es

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main()
{
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0f);
}
```

## ThreeJS Fragment Shader Structure

```glsl
#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform sampler2D tDiffuse;

varying vec2 vUv;

void main()
{
    gl_FragColor = texture2D(tDiffuse, vUv);
}
```
