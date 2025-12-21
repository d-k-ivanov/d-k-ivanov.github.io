"use strict";

/*
Add sampler2D or samplerCube uniforms named iChannel0 to iChannel3.

2D Samplers:
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

Cubemap Samplers:
uniform samplerCube iChannel0;
uniform samplerCube iChannel1;
uniform samplerCube iChannel2;
uniform samplerCube iChannel3;

Files load from ./assets/textures/

2D Samplers:
iChannel0.{png,jpg,jpeg,webp}
iChannel1.{png,jpg,jpeg,webp}
iChannel2.{png,jpg,jpeg,webp}
iChannel3.{png,jpg,jpeg,webp}

Cubemap Samplers:
iChannel0_px.{png,jpg,jpeg,webp}
iChannel0_nx.{png,jpg,jpeg,webp}
iChannel0_py.{png,jpg,jpeg,webp}
iChannel0_ny.{png,jpg,jpeg,webp}
iChannel0_pz.{png,jpg,jpeg,webp}
iChannel0_nz.{png,jpg,jpeg,webp}
*/

const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

/**
 * Loads 2D and cubemap textures for shader channels with caching and fallbacks.
 */
export class WebGLTextureLoader
{
    /**
     * @param {WebGL2RenderingContext} gl - active WebGL context.
     * @param {string} basePath - base path for texture assets.
     */
    constructor(gl, basePath = "./assets/textures")
    {
        this.gl = gl;
        this.basePath = basePath.replace(/\/$/, "");
        this.cache2D = new Map();
        this.cacheCube = new Map();

        this.fallback2D = this.createFallback2D();
        this.fallbackCube = this.createFallbackCube();
    }

    /**
     * Returns the fallback texture for 2D or cubemap channels.
     */
    getFallback(type)
    {
        return type === "cube" ? this.fallbackCube : this.fallback2D;
    }

    /**
     * Loads a channel texture (2D or cube) by index.
     */
    async loadChannelTexture(channelIndex, type)
    {
        const name = `iChannel${channelIndex}`;
        return type === "cube" ? this.loadCube(name) : this.load2D(name);
    }

    /**
     * Loads a 2D texture by base name with caching and extension probing.
     */
    async load2D(name)
    {
        if (this.cache2D.has(name))
        {
            return this.cache2D.get(name);
        }

        const gl = this.gl;
        const texturePromise = (async () =>
        {
            const image = await this.loadImageWithExtensions(name);
            if (!image)
            {
                return this.fallback2D;
            }

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            return texture;
        })().catch((err) =>
        {
            console.warn(`Failed to load 2D texture ${name}:`, err);
            return this.fallback2D;
        });

        this.cache2D.set(name, texturePromise);
        return texturePromise;
    }

    /**
     * Loads a cubemap texture by base name with caching and extension probing.
     */
    async loadCube(name)
    {
        if (this.cacheCube.has(name))
        {
            return this.cacheCube.get(name);
        }

        const gl = this.gl;
        const faces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, suffix: "px" },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, suffix: "nx" },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, suffix: "py" },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, suffix: "ny" },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, suffix: "pz" },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, suffix: "nz" }
        ];

        const texturePromise = (async () =>
        {
            const images = await Promise.all(
                faces.map(face => this.loadImageWithExtensions(`${name}_${face.suffix}`))
            );

            if (images.some(img => !img))
            {
                return this.fallbackCube;
            }

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            for (let i = 0; i < faces.length; i++)
            {
                const { target } = faces[i];
                gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
            }
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

            return texture;
        })().catch((err) =>
        {
            console.warn(`Failed to load cubemap ${name}:`, err);
            return this.fallbackCube;
        });

        this.cacheCube.set(name, texturePromise);
        return texturePromise;
    }

    /**
     * Tries supported extensions until an image is found.
     */
    async loadImageWithExtensions(name)
    {
        for (const ext of SUPPORTED_EXTENSIONS)
        {
            const url = `${this.basePath}/${name}.${ext}`;
            const image = await this.loadImage(url);
            if (image)
            {
                return image;
            }
        }

        console.warn(`Missing texture asset for ${name} (checked extensions: ${SUPPORTED_EXTENSIONS.join(", ")})`);
        return null;
    }

    /**
     * Fetches an image and converts it to ImageBitmap or HTMLImageElement.
     */
    async loadImage(url)
    {
        try
        {
            const response = await fetch(url);
            if (!response.ok)
            {
                return null;
            }

            const blob = await response.blob();
            if (globalThis.createImageBitmap)
            {
                return await createImageBitmap(blob);
            }

            return await new Promise((resolve, reject) =>
            {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () =>
                {
                    URL.revokeObjectURL(img.src);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = URL.createObjectURL(blob);
            });
        }
        catch (err)
        {
            console.warn(`Failed to fetch image ${url}:`, err);
            return null;
        }
    }

    /**
     * Generates a checkerboard fallback 2D texture.
     */
    createFallback2D()
    {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Simple 2x2 checker pattern to highlight missing textures
        const data = new Uint8Array([
            255, 0, 255, 255,     0, 0, 0, 255,
            0, 0, 0, 255,         255, 255, 0, 255
        ]);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        return texture;
    }

    /**
     * Generates a colored-face fallback cubemap.
     */
    createFallbackCube()
    {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

        const faces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, color: [255, 0, 255, 255] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, color: [0, 0, 0, 255] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, color: [255, 255, 0, 255] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, color: [0, 255, 255, 255] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, color: [0, 255, 0, 255] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, color: [0, 0, 255, 255] }
        ];

        for (const face of faces)
        {
            const data = new Uint8Array(face.color);
            gl.texImage2D(face.target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        return texture;
    }
}
