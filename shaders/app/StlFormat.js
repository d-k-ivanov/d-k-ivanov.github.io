"use strict";

import { ModelFormat } from "./ModelFormat.js";

/**
 * Parses ASCII or binary STL files into flat vertex buffers.
 */
export class StlFormat extends ModelFormat
{
    /**
     * Initializes STL format metadata.
     */
    constructor()
    {
        super({ id: "stl", extensions: ["stl"] });
    }

    /**
     * Loads STL data as binary to support both ASCII and binary encodings.
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
     * @param {ArrayBuffer|string} source - STL contents.
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
     */
    parseBinary(buffer, options)
    {
        const view = new DataView(buffer);
        const faceCount = view.getUint32(80, true);
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
            const normal = [
                view.getFloat32(base + 0, true),
                view.getFloat32(base + 4, true),
                view.getFloat32(base + 8, true)
            ];

            const vertices = [];
            for (let v = 0; v < 3; v++)
            {
                const offset = base + 12 + v * 12;
                const pos = [
                    view.getFloat32(offset + 0, true),
                    view.getFloat32(offset + 4, true),
                    view.getFloat32(offset + 8, true)
                ];
                vertices.push(pos);
                updateBounds(pos);
            }

            const faceNormal = this.normalizeNormal(normal, vertices);
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
                const faceNormal = this.normalizeNormal(facetNormal || [0, 0, 0], tri);
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
                facetNormal = [
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                    parseFloat(parts[4])
                ];
                continue;
            }

            if (parts[0] === "vertex")
            {
                const pos = [
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                ];
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
     */
    normalizeNormal(normal, vertices)
    {
        let nx = normal[0];
        let ny = normal[1];
        let nz = normal[2];
        const length = Math.hypot(nx, ny, nz);
        if (length < 1e-6)
        {
            const [a, b, c] = vertices;
            const abx = b[0] - a[0];
            const aby = b[1] - a[1];
            const abz = b[2] - a[2];
            const acx = c[0] - a[0];
            const acy = c[1] - a[1];
            const acz = c[2] - a[2];
            nx = aby * acz - abz * acy;
            ny = abz * acx - abx * acz;
            nz = abx * acy - aby * acx;
        }

        const norm = Math.hypot(nx, ny, nz);
        if (norm < 1e-6)
        {
            return [0, 0, 1];
        }
        return [nx / norm, ny / norm, nz / norm];
    }

    /**
     * Builds a standardized model payload from STL arrays.
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
