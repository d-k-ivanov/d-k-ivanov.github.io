"use strict";

import { ModelFormat } from "./ModelFormat.js";

/**
 * Parses Wavefront OBJ files into flat vertex buffers.
 */
export class WavefrontObjFormat extends ModelFormat
{
    constructor()
    {
        super({ id: "wavefront-obj", extensions: ["obj"] });
    }

    /**
     * @param {string} source - OBJ text contents.
     * @param {{name?: string, url?: string}} options - metadata for the model.
     */
    parse(source, options = {})
    {
        const positions = [];
        const normals = [];
        const texcoords = [];

        const outPositions = [];
        const outNormals = [];
        const outUVs = [];

        let hasUVs = false;

        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        const parseIndex = (value, count) =>
        {
            if (!value)
            {
                return null;
            }
            const index = parseInt(value, 10);
            if (!Number.isFinite(index))
            {
                return null;
            }
            return index < 0 ? count + index : index - 1;
        };

        const getPosition = (index) =>
        {
            const i = index * 3;
            return [positions[i], positions[i + 1], positions[i + 2]];
        };

        const getNormal = (index) =>
        {
            const i = index * 3;
            return [normals[i], normals[i + 1], normals[i + 2]];
        };

        const getUV = (index) =>
        {
            const i = index * 2;
            return [texcoords[i], texcoords[i + 1]];
        };

        const normalize = (x, y, z) =>
        {
            const length = Math.hypot(x, y, z);
            if (length > 1e-6)
            {
                return [x / length, y / length, z / length];
            }
            return [0, 0, 1];
        };

        const computeFaceNormal = (a, b, c) =>
        {
            const abx = b[0] - a[0];
            const aby = b[1] - a[1];
            const abz = b[2] - a[2];

            const acx = c[0] - a[0];
            const acy = c[1] - a[1];
            const acz = c[2] - a[2];

            const nx = aby * acz - abz * acy;
            const ny = abz * acx - abx * acz;
            const nz = abx * acy - aby * acx;

            return normalize(nx, ny, nz);
        };

        const pushVertex = (position, normal, uv) =>
        {
            outPositions.push(position[0], position[1], position[2]);
            outNormals.push(normal[0], normal[1], normal[2]);
            outUVs.push(uv[0], uv[1]);

            boundsMin[0] = Math.min(boundsMin[0], position[0]);
            boundsMin[1] = Math.min(boundsMin[1], position[1]);
            boundsMin[2] = Math.min(boundsMin[2], position[2]);

            boundsMax[0] = Math.max(boundsMax[0], position[0]);
            boundsMax[1] = Math.max(boundsMax[1], position[1]);
            boundsMax[2] = Math.max(boundsMax[2], position[2]);
        };

        const lines = source.split(/\r?\n/);
        for (const line of lines)
        {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
            {
                continue;
            }

            const parts = trimmed.split(/\s+/);
            const keyword = parts[0];

            if (keyword === "v")
            {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))
                {
                    positions.push(x, y, z);
                }
                continue;
            }

            if (keyword === "vn")
            {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z))
                {
                    normals.push(x, y, z);
                }
                continue;
            }

            if (keyword === "vt")
            {
                const u = parseFloat(parts[1]);
                const v = parseFloat(parts[2]);
                if (Number.isFinite(u) && Number.isFinite(v))
                {
                    texcoords.push(u, v);
                }
                continue;
            }

            if (keyword !== "f")
            {
                continue;
            }

            const positionCount = positions.length / 3;
            const normalCount = normals.length / 3;
            const texcoordCount = texcoords.length / 2;

            const face = parts.slice(1)
                .map((token) =>
                {
                    if (!token)
                    {
                        return null;
                    }
                    const [v, vt, vn] = token.split("/");
                    const vIndex = parseIndex(v, positionCount);
                    if (vIndex === null)
                    {
                        return null;
                    }
                    const vtIndex = parseIndex(vt, texcoordCount);
                    const vnIndex = parseIndex(vn, normalCount);
                    if (vtIndex !== null)
                    {
                        hasUVs = true;
                    }
                    return { vIndex, vtIndex, vnIndex };
                })
                .filter(Boolean);

            if (face.length < 3)
            {
                continue;
            }

            for (let i = 1; i < face.length - 1; i++)
            {
                const tri = [face[0], face[i], face[i + 1]];
                const needsFaceNormal = tri.some((v) => v.vnIndex === null);
                const faceNormal = needsFaceNormal
                    ? computeFaceNormal(
                        getPosition(tri[0].vIndex),
                        getPosition(tri[1].vIndex),
                        getPosition(tri[2].vIndex)
                    )
                    : null;

                for (const vertex of tri)
                {
                    const position = getPosition(vertex.vIndex);
                    const normal = vertex.vnIndex !== null
                        ? normalize(...getNormal(vertex.vnIndex))
                        : faceNormal;
                    const uv = vertex.vtIndex !== null ? getUV(vertex.vtIndex) : [0, 0];
                    pushVertex(position, normal, uv);
                }
            }
        }

        if (outPositions.length === 0)
        {
            throw new Error("OBJ file contained no drawable geometry.");
        }

        const resolvedName = options.name || this.getNameFromUrl(options.url) || "model";

        return {
            name: resolvedName,
            format: this.id,
            positions: new Float32Array(outPositions),
            normals: new Float32Array(outNormals),
            uvs: hasUVs ? new Float32Array(outUVs) : null,
            vertexCount: outPositions.length / 3,
            bounds: {
                min: boundsMin,
                max: boundsMax
            }
        };
    }

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
