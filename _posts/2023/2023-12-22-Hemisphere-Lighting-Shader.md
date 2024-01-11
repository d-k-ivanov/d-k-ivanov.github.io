---
layout: post
description: Using R in C++
date: 2023-12-22
---
# Shader: Hemispheric Lighting

## Demo

| Spot | Blub | Mushroom | Oozey the Slime |
|------|------|----------|-----------------|
| ![Spot](/assets/blog/2023/spotH.png) | ![cruiser](/assets/blog/2023/blubH.png) | ![shroom](/assets/blog/2023/shroomH.png) | ![oozey](/assets/blog/2023/oozeyH.png) |

## Vertex Shader

The Vertex shader is straightforward. We compute the relative vertex position and a normal for the current view to pass it to the Fragment shader.

**Shader Code:**

```glsl
#version 400

layout(location = 0) in vec3 vPosition;
layout(location = 1) in vec3 vNormal;

uniform mat4 mViewProjection;
uniform mat4 mModel;

out vec3 position;
out vec3 normal;

void main() {
    normal = vec3(mModel * vec4(vNormal, 0.0));
    position = vec3(mModel * vec4(vPosition, 1.0));
    gl_Position = (mViewProjection * mModel) * vec4(vPosition, 1.0);
}
```

## Fragment Shader

In the Fragment shader, we're mixing Sky colour and ground colour using a linear interpolation function (mix) and weight equation for hemisphere illumination:

$$weight = \frac{1}{2}(1 + \cos(\theta)) = \frac{1}{2}(1 + \vec{U}\cdot\vec{N})$$

Where:

- $\vec{U}$ - direction of the light source (or up-vector, if you don't want follow-the-sun shading).
- $\vec{N}$ - the surface normal direction.
- $\theta$ - the angle between the surface normal and light direction (up-vector, in case no light source is used)

The weighted linear interpolation function for two colours:

$$ Color =  (1 - weight) \times GroundColor +  weight \times SkyColor $$

**Shader Code:**

```glsl
#version 400

in vec3 position;
in vec3 normal;

uniform vec3 lightPosition;
uniform vec3 skyColor;
uniform vec3 groundColor;

layout(location = 0) out vec4 fragColor;

void main() {
    vec3 normalDirection = normalize(normal);
    vec3 lightDirection = normalize(lightPosition - position);
    float cosTheta = dot(lightDirection, normalDirection);
    float w = 0.5 * (1.0 + cosTheta);
    vec3 color = mix(groundColor, skyColor, w);
    // Alternatively, we may avoid using the mix function:
    // vec3 color = groundColor * (1.0 - w) + skyColor * w;
    fragColor = vec4(color, 1.0);
}
```

## Real Life Demo

![Hemispheric Demo](/assets/blog/2023/hemisphere_demo.png)

<script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<script type="text/x-mathjax-config">
    MathJax.Hub.Config({ tex2jax: {inlineMath: [['$', '$']]}, messageStyle: "none" });
</script>
