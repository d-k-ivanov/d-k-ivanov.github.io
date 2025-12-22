"use strict";

import { ModelFormat } from "../ModelFormat.js";

/**
 * Parses Draco-compressed meshes (.drc) into flat vertex buffers.
 *
 * Requires the Draco decoder script/wasm to be available at runtime.
 * The decoder is loaded lazily on first use and cached globally.
 *
 * @example
 * const format = new DracoFormat();
 * const model = await format.load("./assets/models/bunny.drc");
 */
export class DracoFormat extends ModelFormat
{
    /**
     * @param {{decoderPath?: string}} param0 - Decoder script/wasm base URL.
     */
    constructor({ decoderPath = "https://www.gstatic.com/draco/versioned/decoders/1.5.7" } = {})
    {
        super({ id: "draco", extensions: ["drc"] });
        this.decoderPath = decoderPath.replace(/\/$/, "");
    }

    /**
     * Loads Draco data as binary.
     *
     * @param {string} url - Draco URL.
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
     * Parses Draco binary payload into the standard model format.
     *
     * @param {ArrayBuffer} source - Draco binary payload.
     * @param {object} options - Parser options.
     * @returns {Promise<object>} Standardized model payload.
     */
    async parse(source, options = {})
    {
        if (!(source instanceof ArrayBuffer))
        {
            throw new Error("Draco source must be an ArrayBuffer.");
        }

        const module = await this.getDecoderModule(options);
        const decoder = new module.Decoder();
        const buffer = new module.DecoderBuffer();
        const data = new Int8Array(source);
        buffer.Init(data, data.length);

        let mesh = null;
        try
        {
            const geometryType = decoder.GetEncodedGeometryType(buffer);
            if (geometryType !== module.TRIANGULAR_MESH)
            {
                throw new Error("Draco geometry is not a triangular mesh.");
            }

            mesh = new module.Mesh();
            const status = decoder.DecodeBufferToMesh(buffer, mesh);
            if (status && typeof status.ok === "function" && !status.ok())
            {
                throw new Error(status.error_msg ? status.error_msg() : "Failed to decode Draco mesh.");
            }

            const payload = this.buildMeshPayload(module, decoder, mesh, options);
            if (!payload)
            {
                throw new Error("Draco file contained no drawable geometry.");
            }
            return payload;
        }
        finally
        {
            module.destroy(buffer);
            if (mesh)
            {
                module.destroy(mesh);
            }
            module.destroy(decoder);
        }
    }

    /**
     * Builds a flat payload from Draco mesh attributes.
     *
     * @param {object} module - Draco decoder module.
     * @param {object} decoder - Draco decoder instance.
     * @param {object} mesh - Draco mesh.
     * @param {object} options - Parser options.
     * @returns {object|null} Standardized model payload or null.
     */
    buildMeshPayload(module, decoder, mesh, options)
    {
        const numFaces = mesh.num_faces();
        const numPoints = mesh.num_points();
        if (!numFaces || !numPoints)
        {
            return null;
        }

        const posAttrId = decoder.GetAttributeId(mesh, module.POSITION);
        if (posAttrId < 0)
        {
            throw new Error("Draco mesh missing position attribute.");
        }

        const posAttr = decoder.GetAttribute(mesh, posAttrId);
        const positions = this.extractAttribute(module, decoder, mesh, posAttr, 3);

        const normalAttrId = decoder.GetAttributeId(mesh, module.NORMAL);
        const normals = normalAttrId >= 0
            ? this.extractAttribute(module, decoder, mesh, decoder.GetAttribute(mesh, normalAttrId), 3)
            : null;

        const uvAttrId = decoder.GetAttributeId(mesh, module.TEX_COORD);
        const uvs = uvAttrId >= 0
            ? this.extractAttribute(module, decoder, mesh, decoder.GetAttribute(mesh, uvAttrId), 2)
            : null;

        const outPositions = [];
        const outNormals = [];
        const outUVs = [];
        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        const faceIndices = new module.DracoInt32Array();
        try
        {
            for (let i = 0; i < numFaces; i++)
            {
                decoder.GetFaceFromMesh(mesh, i, faceIndices);
                const indices = [
                    faceIndices.GetValue(0),
                    faceIndices.GetValue(1),
                    faceIndices.GetValue(2)
                ];

                const p0 = this.readVec3(positions, indices[0], 3);
                const p1 = this.readVec3(positions, indices[1], 3);
                const p2 = this.readVec3(positions, indices[2], 3);
                const faceNormal = normals ? null : this.computeFaceNormal(p0, p1, p2);

                const pushVertex = (idx, position, normal) =>
                {
                    outPositions.push(position[0], position[1], position[2]);
                    outNormals.push(normal[0], normal[1], normal[2]);

                    boundsMin[0] = Math.min(boundsMin[0], position[0]);
                    boundsMin[1] = Math.min(boundsMin[1], position[1]);
                    boundsMin[2] = Math.min(boundsMin[2], position[2]);

                    boundsMax[0] = Math.max(boundsMax[0], position[0]);
                    boundsMax[1] = Math.max(boundsMax[1], position[1]);
                    boundsMax[2] = Math.max(boundsMax[2], position[2]);

                    if (uvs)
                    {
                        const uv = this.readVec2(uvs, idx, 2);
                        outUVs.push(uv[0], uv[1]);
                    }
                };

                const normal0 = normals ? this.readVec3(normals, indices[0], 3) : faceNormal;
                const normal1 = normals ? this.readVec3(normals, indices[1], 3) : faceNormal;
                const normal2 = normals ? this.readVec3(normals, indices[2], 3) : faceNormal;

                pushVertex(indices[0], p0, normal0);
                pushVertex(indices[1], p1, normal1);
                pushVertex(indices[2], p2, normal2);
            }
        }
        finally
        {
            module.destroy(faceIndices);
        }

        if (!outPositions.length)
        {
            return null;
        }

        const name = options?.name || this.getNameFromUrl(options?.url) || "model";
        return {
            name,
            format: this.id,
            positions: new Float32Array(outPositions),
            normals: new Float32Array(outNormals),
            uvs: outUVs.length ? new Float32Array(outUVs) : null,
            vertexCount: outPositions.length / 3,
            bounds: {
                min: boundsMin,
                max: boundsMax
            }
        };
    }

    /**
     * Extracts a typed attribute into a packed Float32Array.
     *
     * @param {object} module - Draco decoder module.
     * @param {object} decoder - Draco decoder instance.
     * @param {object} mesh - Draco mesh instance.
     * @param {object} attribute - Draco attribute handle.
     * @param {number} targetComponents - Components per vertex to output.
     * @returns {Float32Array} Packed attribute data.
     */
    extractAttribute(module, decoder, mesh, attribute, targetComponents)
    {
        const numPoints = mesh.num_points();
        const dataArray = new module.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints(mesh, attribute, dataArray);

        const sourceComponents = attribute.num_components();
        const array = new Float32Array(numPoints * targetComponents);
        const total = dataArray.size();
        for (let i = 0; i < numPoints; i++)
        {
            const base = i * sourceComponents;
            for (let c = 0; c < targetComponents; c++)
            {
                const idx = base + c;
                array[i * targetComponents + c] = idx < total ? dataArray.GetValue(idx) : 0;
            }
        }
        module.destroy(dataArray);
        return array;
    }

    /**
     * Reads a vec3 from a packed array with stride.
     *
     * @param {Float32Array} array - Packed attribute data.
     * @param {number} index - Vertex index.
     * @param {number} stride - Components per vertex.
     * @returns {number[]} Vector components.
     */
    readVec3(array, index, stride)
    {
        const base = index * stride;
        return [
            array[base] || 0,
            array[base + 1] || 0,
            array[base + 2] || 0
        ];
    }

    /**
     * Reads a vec2 from a packed array with stride.
     *
     * @param {Float32Array} array - Packed attribute data.
     * @param {number} index - Vertex index.
     * @param {number} stride - Components per vertex.
     * @returns {number[]} Vector components.
     */
    readVec2(array, index, stride)
    {
        const base = index * stride;
        return [
            array[base] || 0,
            array[base + 1] || 0
        ];
    }

    /**
     * Computes a normalized face normal for three positions.
     *
     * @param {number[]} a - First position.
     * @param {number[]} b - Second position.
     * @param {number[]} c - Third position.
     * @returns {number[]} Normalized normal vector.
     */
    computeFaceNormal(a, b, c)
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

        const length = Math.hypot(nx, ny, nz);
        if (length < 1e-6)
        {
            return [0, 0, 1];
        }
        return [nx / length, ny / length, nz / length];
    }

    /**
     * Loads or reuses the Draco decoder module.
     *
     * @param {object} options - Decoder options.
     * @returns {Promise<object>} Draco decoder module.
     */
    async getDecoderModule(options = {})
    {
        if (DracoFormat.decoderModule)
        {
            return DracoFormat.decoderModule;
        }

        if (DracoFormat.decoderPromise)
        {
            return DracoFormat.decoderPromise;
        }

        const decoderPath = (options.decoderPath || this.decoderPath || "./draco").replace(/\/$/, "");
        const decoderScriptUrl = options.decoderScriptUrl || `${decoderPath}/draco_decoder.js`;

        DracoFormat.decoderPromise = (async () =>
        {
            if (!globalThis.DracoDecoderModule)
            {
                await this.loadDecoderScript(decoderScriptUrl);
            }

            const factory = globalThis.DracoDecoderModule;
            if (!factory)
            {
                throw new Error(`Draco decoder not found. Expected ${decoderScriptUrl}.`);
            }

            const module = await factory({
                locateFile: (file) =>
                {
                    if (file.endsWith(".wasm"))
                    {
                        return `${decoderPath}/${file}`;
                    }
                    return file;
                }
            });

            DracoFormat.decoderModule = module;
            return module;
        })();

        return DracoFormat.decoderPromise;
    }

    /**
     * Injects the Draco decoder script into the document.
     *
     * @param {string} url - Script URL to load.
     * @returns {Promise<void>} Resolves when the script is loaded.
     */
    async loadDecoderScript(url)
    {
        if (DracoFormat.decoderScriptPromise)
        {
            return DracoFormat.decoderScriptPromise;
        }

        if (typeof document === "undefined")
        {
            throw new Error("Draco decoder requires a browser environment.");
        }

        DracoFormat.decoderScriptPromise = new Promise((resolve, reject) =>
        {
            if (globalThis.DracoDecoderModule)
            {
                resolve();
                return;
            }

            const existing = document.querySelector(`script[src="${url}"]`);
            if (existing)
            {
                existing.addEventListener("load", () => resolve());
                existing.addEventListener("error", () => reject(new Error(`Failed to load Draco decoder script: ${url}`)));
                return;
            }

            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load Draco decoder script: ${url}`));
            document.head.appendChild(script);
        });

        return DracoFormat.decoderScriptPromise;
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

DracoFormat.decoderPromise = null;
DracoFormat.decoderModule = null;
DracoFormat.decoderScriptPromise = null;
