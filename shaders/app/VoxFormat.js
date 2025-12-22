"use strict";

import { ModelFormat } from "./ModelFormat.js";

const VOX_MAGIC = "VOX ";
const FACE_DEFS = [
    { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { dir: [-1, 0, 0], corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
    { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
    { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }
];
const UVS = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
];

/**
 * Parses MagicaVoxel VOX files into flat vertex buffers.
 */
export class VoxFormat extends ModelFormat
{
    /**
     * Initializes VOX format metadata.
     */
    constructor()
    {
        super({ id: "vox", extensions: ["vox"] });
    }

    /**
     * Loads VOX data as binary.
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
     * @param {ArrayBuffer} source - VOX binary payload.
     */
    parse(source, options = {})
    {
        if (!(source instanceof ArrayBuffer))
        {
            throw new Error("VOX source must be an ArrayBuffer.");
        }

        const { model } = this.parseVox(source);
        if (!model || model.voxels.length === 0)
        {
            throw new Error("VOX file contained no voxels.");
        }

        const mesh = this.buildMesh(model);
        if (!mesh.positions.length)
        {
            throw new Error("VOX file contained no drawable geometry.");
        }

        const name = options?.name || this.getNameFromUrl(options?.url) || "model";
        return {
            name,
            format: this.id,
            positions: new Float32Array(mesh.positions),
            normals: new Float32Array(mesh.normals),
            uvs: new Float32Array(mesh.uvs),
            vertexCount: mesh.positions.length / 3,
            bounds: {
                min: mesh.boundsMin,
                max: mesh.boundsMax
            }
        };
    }

    /**
     * Parses VOX chunks to extract the first model and palette.
     */
    parseVox(buffer)
    {
        const view = new DataView(buffer);
        const magic = this.readString(view, 0, 4);
        if (magic !== VOX_MAGIC)
        {
            throw new Error("Invalid VOX header.");
        }

        const mainChunk = this.readChunkHeader(view, 8);
        if (mainChunk.id !== "MAIN")
        {
            throw new Error("Invalid VOX main chunk.");
        }

        const context = {
            models: [],
            pendingSize: null
        };

        this.parseChunks(view, mainChunk.childrenStart, mainChunk.childrenStart + mainChunk.childrenSize, context);

        return {
            model: context.models[0] || null
        };
    }

    /**
     * Walks VOX chunk ranges recursively to capture SIZE/XYZI data.
     */
    parseChunks(view, start, end, context)
    {
        let offset = start;
        while (offset < end)
        {
            const header = this.readChunkHeader(view, offset);
            const contentStart = header.contentStart;
            const childrenStart = header.childrenStart;
            const childrenEnd = childrenStart + header.childrenSize;

            if (header.id === "SIZE")
            {
                const sizeX = view.getInt32(contentStart, true);
                const sizeY = view.getInt32(contentStart + 4, true);
                const sizeZ = view.getInt32(contentStart + 8, true);
                context.pendingSize = {
                    x: Math.max(1, sizeX),
                    y: Math.max(1, sizeY),
                    z: Math.max(1, sizeZ)
                };
            }
            else if (header.id === "XYZI")
            {
                const { voxels } = this.parseVoxels(view, contentStart);
                const size = context.pendingSize || this.inferSizeFromVoxels(voxels);
                context.models.push({ size, voxels });
                context.pendingSize = null;
            }

            if (header.childrenSize > 0)
            {
                this.parseChunks(view, childrenStart, childrenEnd, context);
            }

            offset = childrenEnd;
        }
    }

    /**
     * Parses XYZI voxel data.
     */
    parseVoxels(view, offset)
    {
        const count = view.getUint32(offset, true);
        const voxels = [];
        let cursor = offset + 4;
        for (let i = 0; i < count; i++)
        {
            const x = view.getUint8(cursor);
            const y = view.getUint8(cursor + 1);
            const z = view.getUint8(cursor + 2);
            const color = view.getUint8(cursor + 3);
            voxels.push({ x, y, z, color });
            cursor += 4;
        }
        return { voxels, nextOffset: cursor };
    }

    /**
     * Infers a model size from voxel positions when SIZE is missing.
     */
    inferSizeFromVoxels(voxels)
    {
        let maxX = 0;
        let maxY = 0;
        let maxZ = 0;
        for (const voxel of voxels)
        {
            maxX = Math.max(maxX, voxel.x);
            maxY = Math.max(maxY, voxel.y);
            maxZ = Math.max(maxZ, voxel.z);
        }
        return { x: maxX + 1, y: maxY + 1, z: maxZ + 1 };
    }

    /**
     * Builds a surface-only mesh by emitting faces without neighbors.
     */
    buildMesh(model)
    {
        const positions = [];
        const normals = [];
        const uvs = [];
        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        const set = new Set();
        for (const voxel of model.voxels)
        {
            set.add(this.getKey(voxel.x, voxel.y, voxel.z));
        }

        for (const voxel of model.voxels)
        {
            const vx = voxel.x;
            const vy = voxel.y;
            const vz = voxel.z;

            for (const face of FACE_DEFS)
            {
                const nx = vx + face.dir[0];
                const ny = vy + face.dir[1];
                const nz = vz + face.dir[2];

                if (this.hasVoxel(set, nx, ny, nz, model.size))
                {
                    continue;
                }

                const quad = face.corners;
                const triIndices = [0, 1, 2, 0, 2, 3];
                const normal = this.transformDirection(face.dir);
                for (let i = 0; i < triIndices.length; i++)
                {
                    const idx = triIndices[i];
                    const corner = quad[idx];
                    const px = vx + corner[0];
                    const py = vy + corner[1];
                    const pz = vz + corner[2];
                    const worldPos = this.transformPosition(px, py, pz);

                    positions.push(worldPos[0], worldPos[1], worldPos[2]);
                    normals.push(normal[0], normal[1], normal[2]);
                    const uv = UVS[idx];
                    uvs.push(uv[0], uv[1]);

                    boundsMin[0] = Math.min(boundsMin[0], worldPos[0]);
                    boundsMin[1] = Math.min(boundsMin[1], worldPos[1]);
                    boundsMin[2] = Math.min(boundsMin[2], worldPos[2]);
                    boundsMax[0] = Math.max(boundsMax[0], worldPos[0]);
                    boundsMax[1] = Math.max(boundsMax[1], worldPos[1]);
                    boundsMax[2] = Math.max(boundsMax[2], worldPos[2]);
                }
            }
        }

        return { positions, normals, uvs, boundsMin, boundsMax };
    }

    /**
     * Transforms voxel-space positions into Y-up coordinates.
     */
    transformPosition(x, y, z)
    {
        return [x, z, -y];
    }

    /**
     * Transforms voxel-space directions into Y-up coordinates.
     */
    transformDirection(dir)
    {
        return [dir[0], dir[2], -dir[1]];
    }

    /**
     * Checks if a voxel exists at the given coordinate.
     */
    hasVoxel(set, x, y, z, size)
    {
        if (x < 0 || y < 0 || z < 0)
        {
            return false;
        }
        if (size)
        {
            if (x >= size.x || y >= size.y || z >= size.z)
            {
                return false;
            }
        }
        return set.has(this.getKey(x, y, z));
    }

    /**
     * Builds a compact integer key for voxel coordinates.
     */
    getKey(x, y, z)
    {
        return (x & 0xff) | ((y & 0xff) << 8) | ((z & 0xff) << 16);
    }

    /**
     * Reads a 4-character string from the DataView.
     */
    readString(view, offset, length)
    {
        let value = "";
        for (let i = 0; i < length; i++)
        {
            value += String.fromCharCode(view.getUint8(offset + i));
        }
        return value;
    }

    /**
     * Reads a chunk header and returns offsets to its data.
     */
    readChunkHeader(view, offset)
    {
        const id = this.readString(view, offset, 4);
        const size = view.getInt32(offset + 4, true);
        const childrenSize = view.getInt32(offset + 8, true);
        const contentStart = offset + 12;
        const childrenStart = contentStart + size;

        return {
            id,
            size,
            childrenSize,
            contentStart,
            childrenStart
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
