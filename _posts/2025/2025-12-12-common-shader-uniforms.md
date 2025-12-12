---
layout: post
description: common shader uniforms used
date: 2025-12-12
---
# Common Shader Uniforms

## ShaderToy Vertex Shader Structure

I don't know exactly if ShaderToy uses this vertex shader, because users only write fragment shaders there.

```glsl
#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

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

## ShaderToy Fragment Shader Structure

```glsl
#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

uniform vec3 iResolution;           // viewport resolution (in pixels)

uniform float iTime;                 // shader playback time (in seconds)
uniform float iTimeDelta;            // render time (in seconds)

uniform int iFrame;                // shader playback frame
uniform float iFrameRate;            // shader frame rate

uniform float iChannelTime[4];       // channel playback time (in seconds)
uniform vec3 iChannelResolution[4]; // channel resolution (in pixels)

// uniform samplerXX iChannel0..3;       // input channel. XX = 2D/Cube
uniform sampler2D iChannel0;           // input channel 0
uniform sampler2D iChannel1;           // input channel 1
uniform sampler2D iChannel2;           // input channel 2
uniform sampler2D iChannel3;           // input channel 3
// uniform samplerCube iChannel0;        // input channel 0
// uniform samplerCube iChannel1;        // input channel 1
// uniform samplerCube iChannel2;        // input channel 2
// uniform samplerCube iChannel3;        // input channel 3

uniform vec4 iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4 iDate;                 // (year, month, day, time in seconds)
uniform float iSampleRate;           // sound sample rate (i.e., 44100)

out vec4 fragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord);
{
}

void main()
{
    mainImage(fragColor, gl_FragCoord.xy);
}
```

## ThreeJS Vertex Shader Structure

```glsl
#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

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
