---
layout: post
description: Using R in C++
date: 2023-12-22
---
# Shader: Key-Fill-Rim Light Sources

I've taken models from here:

- [Keenan's 3D Model Repository](https://www.cs.cmu.edu/~kmcrane/Projects/ModelRepository/)
- [Principia Mathematica](https://www.prinmath.com/csci5229/OBJ/index.html)
- [OpenGameArt](http://opengameart.org/)

## Demo

| Spot 1                      | Blub                        | Spot 2            | Space Cruiser               |
|-----------------------------|-----------------------------|-------------------|-----------------------------|
| ![Spot](/assets/blog/2023/spotRFL.png)    | ![cruiser](/assets/blog/2023/blubRFL.png) | ![shroom](/assets/blog/2023/spotRFL2.png)   | ![oozey](/assets/blog/2023/cruiserRFL.png) |
| ![3L-even](/assets/blog/2023/3L-even.png) | ![3L-even](/assets/blog/2023/3L-even.png) | ![3L-green](/assets/blog/2023/3L-green.png) | ![3L-even](/assets/blog/2023/3L-even.png)  |

## Vertex Shader

The Vertex shader is straightforward. We compute the relative vertex position and a normal for the current view to pass it to the Fragment shader. Additionally, we pass the Texture coordinates through the shader pipeline.

```glsl
#version 400

layout(location = 0) in vec3 vPosition;
layout(location = 1) in vec3 vNormal;
layout(location = 2) in vec2 vTexCoord;

uniform mat4 mViewProjection;
uniform mat4 mModel;

out vec3 position;
out vec3 normal;
out vec2 texCoord;

void main() {
    normal = vec3(mModel * vec4(vNormal, 0.0));
    position = vec3(mModel * vec4(vPosition, 1.0));
    texCoord = vTexCoord;
    gl_Position = (mViewProjection * mModel) * vec4(vPosition, 1.0);
}
```

## Fragment Shader

**The complete illumination equation:**

$$I=I_{a}K_{d}+\sum_{i=1}^{L}\Bigl(I_{d_{i}}K_{d}(\vec{L}_{i} \cdot\vec{N})+I_{s_{i}}K_{s}(\vec{R}_{i} \cdot\vec{V})^{\alpha_{s}}\Bigr)$$

Where:

- $I$ - resultant colour
- $I_{a}$ - ambient light
- $K_{d}$ - material diffuse colour component
- $K_{s}$ - material specular colour component
- $i$ - light source index
- $I_{d_{i}}$ - diffuse component of the light source $i$
- $I_{s_{i}}$ - specular component of the light source $i$
- $\vec{L}_{i}$ - direction vector of the light source $i$
- $\vec{N}$ - surface normal for vertex
- $\vec{R}_{i}$ - reflection vector of the light source $i$
- $\vec{V}$ - view direction vector
- $\alpha_{s}$ - shininess constant for the material

**Shader Code:**

```glsl
#version 400

in vec3 position;
in vec3 normal;
in vec2 texCoord;

uniform vec3 Kd;
uniform vec3 Ks;
uniform float shininess;

uniform vec3 Ia;

struct LightSource {
    bool Enabled;
    vec3 Position;
    vec3 Id;
    vec3 Is;
};
#define NR_LIGHTS 3
uniform LightSource lights[NR_LIGHTS];

uniform vec3 cameraPosition;

uniform bool useTexture;
uniform sampler2D texSampler;

layout(location = 0) out vec4 fragColor;

vec3 directLightColor(LightSource light, vec3 diffuseColor) {
    vec3 n = normalize(normal);
    vec3 l = normalize(light.Position - position);
    vec3 v = normalize(cameraPosition - position);
    vec3 r = reflect(-l, n);

    float diff = max(dot(n, l), 0.0);
    vec3 diffuse = diff * light.Id;

    float spec = pow(max(dot(v, r), 0.0), shininess);
    vec3 specular = Ks * spec * light.Is;

    return diffuse * diffuseColor + specular;;
}

vec3 ads(vec3 diffuseColor) {
    vec3 color = Ia * diffuseColor;
    for(int i = 0; i < NR_LIGHTS; i++)
        if(lights[i].Enabled)
            color += directLightColor(lights[i], diffuseColor);
    return color;
}

void main() {
    if(useTexture) {
        vec4 texColor = texture(texSampler, texCoord);
        fragColor = vec4(ads(texColor.rgb), 1.0);
    } else {
        fragColor = vec4(ads(Kd), 1.0);
    }
}
```

## Real Life Demo

![Hemispheric Demo](/assets/blog/2023/key_fill_rim_demo.png)


<script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<script type="text/x-mathjax-config">
    MathJax.Hub.Config({ tex2jax: {inlineMath: [['$', '$']]}, messageStyle: "none" });
</script>
