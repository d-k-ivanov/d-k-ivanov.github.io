"use strict";

import { ModelFormat } from "../ModelFormat.js";

/**
 * Parses ASCII or binary STL files into flat vertex buffers.
 *
 * The loader supports both STL encodings by reading the binary payload
 * first and falling back to ASCII parsing when needed.
 *
 * @example
 * const format = new StlFormat();
 * const model = await format.load("./assets/models/box.stl");
 */
export class StlFormat extends ModelFormat
{
    /**
     * Initializes STL format metadata.
     *
     * @returns {void}
     */
    constructor()
    {
        super({ id: "stl", extensions: ["stl"] });
    }

    /**
     * Loads STL data as binary to support both ASCII and binary encodings.
     *
     * @param {string} url - STL URL.
     * @param {object} options - Parser options.
     * @returns {Promise<object>} Standardized model payload.
     */
    async load(url, options = {})
    {
        if (!url)
        {
            throw new Error("Model URL is required.");
        }

        const response = await fetch(url);
        if (!response.ok)
        {
            throw new Error(`Failed to load model: ${url}`);
        }

        const buffer = await response.arrayBuffer();
        return this.parse(buffer, { ...options, url });
    }

    /**
     * Parses STL contents from ASCII or binary sources.
     *
     * @param {ArrayBuffer|string} source - STL contents.
     * @param {object} options - Parser options.
     * @returns {object} Standardized model payload.
     */
    parse(source, options = {})
    {
        if (typeof source === "string")
        {
            return this.parseASCII(source, options);
        }

        if (source instanceof ArrayBuffer)
        {
            if (this.isBinary(source))
            {
                return this.parseBinary(source, options);
            }
            const text = new TextDecoder().decode(source);
            return this.parseASCII(text, options);
        }

        throw new Error("Unsupported STL source.");
    }

    /**
     * Returns true when the STL buffer appears to be binary.
     *
     * @param {ArrayBuffer} buffer - Raw STL buffer.
     * @returns {boolean} True when the buffer is binary STL.
     */
    isBinary(buffer)
    {
        if (buffer.byteLength < 84)
        {
            return false;
        }

        const view = new DataView(buffer);
        const faceCount = view.getUint32(80, true);
        const expectedSize = 84 + faceCount * 50;
        if (expectedSize === buffer.byteLength)
        {
            return true;
        }

        const header = new TextDecoder().decode(buffer.slice(0, 512));
        const trimmed = header.trimStart();
        if (trimmed.startsWith("solid") && header.includes("facet"))
        {
            return false;
        }

        return true;
    }

    /**
     * Parses binary STL data into flat buffers.
     *
     * @param {ArrayBuffer} buffer - Binary STL contents.
     * @param {object} options - Parser options.
     * @returns {object} Standardized model payload.
     */
    parseBinary(buffer, options)
    {
        const view = new DataView(buffer);
        const declaredFaceCount = view.getUint32(80, true);
        const maxFaces = Math.max(0, Math.floor((buffer.byteLength - 84) / 50));
        const expectedSize = 84 + declaredFaceCount * 50;
        let faceCount = declaredFaceCount;

        if (!Number.isFinite(faceCount) || faceCount <= 0 || expectedSize > buffer.byteLength)
        {
            faceCount = maxFaces;
        }
        else if (expectedSize < buffer.byteLength && (buffer.byteLength - 84) % 50 === 0)
        {
            faceCount = maxFaces;
        }
        const positions = [];
        const normals = [];

        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        const updateBounds = (pos) =>
        {
            boundsMin[0] = Math.min(boundsMin[0], pos[0]);
            boundsMin[1] = Math.min(boundsMin[1], pos[1]);
            boundsMin[2] = Math.min(boundsMin[2], pos[2]);

            boundsMax[0] = Math.max(boundsMax[0], pos[0]);
            boundsMax[1] = Math.max(boundsMax[1], pos[1]);
            boundsMax[2] = Math.max(boundsMax[2], pos[2]);
        };

        for (let i = 0; i < faceCount; i++)
        {
            const base = 84 + i * 50;
            const normal = this.transformVector(
                view.getFloat32(base + 0, true),
                view.getFloat32(base + 4, true),
                view.getFloat32(base + 8, true)
            );

            const vertices = [];
            for (let v = 0; v < 3; v++)
            {
                const offset = base + 12 + v * 12;
                const pos = this.transformVector(
                    view.getFloat32(offset + 0, true),
                    view.getFloat32(offset + 4, true),
                    view.getFloat32(offset + 8, true)
                );
                vertices.push(pos);
                updateBounds(pos);
            }

            const computedNormal = this.computeFaceNormal(vertices);
            const faceNormal = this.normalizeNormal(normal, vertices);
            if (this.shouldFlipWinding(faceNormal, computedNormal))
            {
                [vertices[1], vertices[2]] = [vertices[2], vertices[1]];
            }
            for (const vertex of vertices)
            {
                positions.push(vertex[0], vertex[1], vertex[2]);
                normals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
            }
        }

        return this.buildPayload(positions, normals, boundsMin, boundsMax, options);
    }

    /**
     * Parses ASCII STL text into flat buffers.
     *
     * @param {string} text - ASCII STL contents.
     * @param {object} options - Parser options.
     * @returns {object} Standardized model payload.
     */
    parseASCII(text, options)
    {
        const positions = [];
        const normals = [];

        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        let facetNormal = null;
        let vertices = [];

        const updateBounds = (pos) =>
        {
            boundsMin[0] = Math.min(boundsMin[0], pos[0]);
            boundsMin[1] = Math.min(boundsMin[1], pos[1]);
            boundsMin[2] = Math.min(boundsMin[2], pos[2]);

            boundsMax[0] = Math.max(boundsMax[0], pos[0]);
            boundsMax[1] = Math.max(boundsMax[1], pos[1]);
            boundsMax[2] = Math.max(boundsMax[2], pos[2]);
        };

        const pushFacet = () =>
        {
            if (vertices.length < 3)
            {
                vertices = [];
                return;
            }

            for (let i = 1; i < vertices.length - 1; i++)
            {
                const tri = [vertices[0], vertices[i], vertices[i + 1]];
                const computedNormal = this.computeFaceNormal(tri);
                const faceNormal = this.normalizeNormal(facetNormal || [0, 0, 0], tri);
                if (this.shouldFlipWinding(faceNormal, computedNormal))
                {
                    [tri[1], tri[2]] = [tri[2], tri[1]];
                }
                for (const vertex of tri)
                {
                    positions.push(vertex[0], vertex[1], vertex[2]);
                    normals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
                }
            }

            vertices = [];
        };

        const lines = text.split(/\r?\n/);
        for (const line of lines)
        {
            const trimmed = line.trim();
            if (!trimmed)
            {
                continue;
            }

            const parts = trimmed.split(/\s+/);
            if (parts[0] === "facet" && parts[1] === "normal")
            {
                facetNormal = this.transformVector(
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                    parseFloat(parts[4])
                );
                continue;
            }

            if (parts[0] === "vertex")
            {
                const pos = this.transformVector(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                if (pos.every(Number.isFinite))
                {
                    vertices.push(pos);
                    updateBounds(pos);
                }
                continue;
            }

            if (parts[0] === "endfacet")
            {
                pushFacet();
                facetNormal = null;
            }
        }

        if (vertices.length >= 3)
        {
            pushFacet();
        }

        return this.buildPayload(positions, normals, boundsMin, boundsMax, options);
    }

    /**
     * Normalizes or recomputes the face normal for a triangle.
     *
     * @param {number[]} normal - Raw normal vector.
     * @param {Array<number[]>} vertices - Triangle vertices.
     * @returns {number[]} Normalized normal vector.
     */
    normalizeNormal(normal, vertices)
    {
        let nx = normal[0];
        let ny = normal[1];
        let nz = normal[2];
        const length = Math.hypot(nx, ny, nz);
        if (!Number.isFinite(length) || length < 1e-6)
        {
            return this.computeFaceNormal(vertices);
        }

        return [nx / length, ny / length, nz / length];
    }

    /**
     * Computes a normalized face normal from triangle vertices.
     *
     * @param {Array<number[]>} vertices - Triangle vertices.
     * @returns {number[]} Normalized face normal.
     */
    computeFaceNormal(vertices)
    {
        if (!vertices || vertices.length < 3)
        {
            return [0, 0, 1];
        }

        const [a, b, c] = vertices;
        const abx = b[0] - a[0];
        const aby = b[1] - a[1];
        const abz = b[2] - a[2];
        const acx = c[0] - a[0];
        const acy = c[1] - a[1];
        const acz = c[2] - a[2];
        const nx = aby * acz - abz * acy;
        const ny = abz * acx - abx * acz;
        const nz = abx * acy - aby * acx;

        const length = Math.hypot(nx, ny, nz);
        if (length < 1e-6)
        {
            return [0, 0, 1];
        }

        return [nx / length, ny / length, nz / length];
    }

    /**
     * Returns true when triangle winding should be flipped to match the normal.
     *
     * @param {number[]} expectedNormal - Normal to match.
     * @param {number[]} computedNormal - Normal from vertex order.
     * @returns {boolean} True when winding should be flipped.
     */
    shouldFlipWinding(expectedNormal, computedNormal)
    {
        const dot = expectedNormal[0] * computedNormal[0]
            + expectedNormal[1] * computedNormal[1]
            + expectedNormal[2] * computedNormal[2];
        return Number.isFinite(dot) && dot < 0;
    }

    /**
     * Rotates STL coordinates from Z-up into the renderer's Y-up space.
     *
     * @param {number} x - X component.
     * @param {number} y - Y component.
     * @param {number} z - Z component.
     * @returns {number[]} Rotated vector.
     */
    transformVector(x, y, z)
    {
        return [x, z, -y];
    }

    /**
     * Builds a standardized model payload from STL arrays.
     *
     * @param {number[]} positions - Packed positions.
     * @param {number[]} normals - Packed normals.
     * @param {number[]} boundsMin - Bounds minimum.
     * @param {number[]} boundsMax - Bounds maximum.
     * @param {object} options - Parser options.
     * @returns {object} Standardized model payload.
     */
    buildPayload(positions, normals, boundsMin, boundsMax, options)
    {
        if (positions.length === 0)
        {
            throw new Error("STL file contained no drawable geometry.");
        }

        const name = options?.name || this.getNameFromUrl(options?.url) || "model";
        return {
            name,
            format: this.id,
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: null,
            vertexCount: positions.length / 3,
            bounds: {
                min: boundsMin,
                max: boundsMax
            }
        };
    }

    /**
     * Extracts a base name from a URL for display.
     *
     * @param {string} url - URL string.
     * @returns {string|null} Base name without extension.
     */
    getNameFromUrl(url)
    {
        if (!url)
        {
            return null;
        }
        const file = url.split("/").pop();
        if (!file)
        {
            return null;
        }
        return file.replace(/\.[^/.]+$/, "");
    }
}
