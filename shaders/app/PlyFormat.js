"use strict";

import { ModelFormat } from "./ModelFormat.js";

const TYPE_INFO = {
    char: { size: 1, getter: (view, offset) => view.getInt8(offset) },
    uchar: { size: 1, getter: (view, offset) => view.getUint8(offset) },
    int8: { size: 1, getter: (view, offset) => view.getInt8(offset) },
    uint8: { size: 1, getter: (view, offset) => view.getUint8(offset) },
    short: { size: 2, getter: (view, offset, le) => view.getInt16(offset, le) },
    ushort: { size: 2, getter: (view, offset, le) => view.getUint16(offset, le) },
    int16: { size: 2, getter: (view, offset, le) => view.getInt16(offset, le) },
    uint16: { size: 2, getter: (view, offset, le) => view.getUint16(offset, le) },
    int: { size: 4, getter: (view, offset, le) => view.getInt32(offset, le) },
    uint: { size: 4, getter: (view, offset, le) => view.getUint32(offset, le) },
    int32: { size: 4, getter: (view, offset, le) => view.getInt32(offset, le) },
    uint32: { size: 4, getter: (view, offset, le) => view.getUint32(offset, le) },
    float: { size: 4, getter: (view, offset, le) => view.getFloat32(offset, le) },
    float32: { size: 4, getter: (view, offset, le) => view.getFloat32(offset, le) },
    double: { size: 8, getter: (view, offset, le) => view.getFloat64(offset, le) },
    float64: { size: 8, getter: (view, offset, le) => view.getFloat64(offset, le) }
};

/**
 * Parses ASCII or binary PLY files into flat vertex buffers.
 */
export class PlyFormat extends ModelFormat
{
    /**
     * Initializes PLY format metadata.
     */
    constructor()
    {
        super({ id: "ply", extensions: ["ply"] });
    }

    /**
     * Loads PLY data as binary to support both ASCII and binary encodings.
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
     * @param {ArrayBuffer|string} source - PLY contents.
     */
    parse(source, options = {})
    {
        if (typeof source === "string")
        {
            const header = this.parseHeaderFromText(source);
            if (header.format !== "ascii")
            {
                throw new Error("Binary PLY requires ArrayBuffer source.");
            }
            const body = source.slice(header.headerText.length);
            return this.parseASCII(body, header, options);
        }

        if (source instanceof ArrayBuffer)
        {
            const header = this.parseHeaderFromBuffer(source);
            if (header.format === "ascii")
            {
                const body = new TextDecoder().decode(source.slice(header.headerSize));
                return this.parseASCII(body, header, options);
            }

            return this.parseBinary(source, header, options);
        }

        throw new Error("Unsupported PLY source.");
    }

    /**
     * Extracts the PLY header from a binary buffer.
     */
    parseHeaderFromBuffer(buffer)
    {
        const bytes = new Uint8Array(buffer);
        const marker = [101, 110, 100, 95, 104, 101, 97, 100, 101, 114];
        let headerEnd = -1;

        for (let i = 0; i <= bytes.length - marker.length; i++)
        {
            let match = true;
            for (let j = 0; j < marker.length; j++)
            {
                if (bytes[i + j] !== marker[j])
                {
                    match = false;
                    break;
                }
            }

            if (match)
            {
                let end = i + marker.length;
                while (end < bytes.length && bytes[end] !== 10)
                {
                    end++;
                }
                headerEnd = end < bytes.length ? end + 1 : bytes.length;
                break;
            }
        }

        if (headerEnd === -1)
        {
            throw new Error("Invalid PLY header.");
        }

        const headerText = new TextDecoder().decode(bytes.slice(0, headerEnd));
        return this.parseHeaderText(headerText, headerEnd);
    }

    /**
     * Extracts the PLY header from ASCII text.
     */
    parseHeaderFromText(text)
    {
        const endIndex = text.indexOf("end_header");
        if (endIndex === -1)
        {
            throw new Error("Invalid PLY header.");
        }

        let headerEnd = text.indexOf("\n", endIndex);
        if (headerEnd === -1)
        {
            headerEnd = text.length;
        }
        else
        {
            headerEnd += 1;
        }

        const headerText = text.slice(0, headerEnd);
        return this.parseHeaderText(headerText, headerEnd);
    }

    /**
     * Parses header text into format and element descriptors.
     */
    parseHeaderText(headerText, headerSize)
    {
        const lines = headerText.split(/\r?\n/);
        let format = null;
        const elements = {};
        let current = null;

        for (const line of lines)
        {
            const trimmed = line.trim();
            if (!trimmed)
            {
                continue;
            }

            const parts = trimmed.split(/\s+/);
            const keyword = parts[0];

            if (keyword === "ply")
            {
                continue;
            }

            if (keyword === "format")
            {
                format = parts[1];
                continue;
            }

            if (keyword === "element")
            {
                const name = parts[1];
                const count = parseInt(parts[2], 10);
                current = {
                    name,
                    count: Number.isFinite(count) ? count : 0,
                    properties: []
                };
                elements[name] = current;
                continue;
            }

            if (keyword === "property" && current)
            {
                if (parts[1] === "list")
                {
                    current.properties.push({
                        name: parts[4],
                        isList: true,
                        countType: parts[2],
                        itemType: parts[3]
                    });
                }
                else
                {
                    current.properties.push({
                        name: parts[2],
                        isList: false,
                        type: parts[1]
                    });
                }
            }
        }

        if (!format)
        {
            throw new Error("PLY header missing format.");
        }

        if (!["ascii", "binary_little_endian", "binary_big_endian"].includes(format))
        {
            throw new Error(`Unsupported PLY format: ${format}`);
        }

        return {
            format,
            headerSize,
            headerText,
            elements
        };
    }

    /**
     * Parses ASCII PLY vertex/face data into buffers.
     */
    parseASCII(text, header, options)
    {
        const vertexElement = header.elements.vertex;
        const faceElement = header.elements.face;
        if (!vertexElement || !faceElement)
        {
            throw new Error("PLY missing vertex or face data.");
        }

        const vertexProps = vertexElement.properties;
        const faceProps = faceElement.properties;

        const xIndex = this.findPropertyIndex(vertexProps, ["x"]);
        const yIndex = this.findPropertyIndex(vertexProps, ["y"]);
        const zIndex = this.findPropertyIndex(vertexProps, ["z"]);

        if (xIndex === -1 || yIndex === -1 || zIndex === -1)
        {
            throw new Error("PLY vertex properties missing positions.");
        }

        const normalIndices = {
            x: this.findPropertyIndex(vertexProps, ["nx", "normal_x"]),
            y: this.findPropertyIndex(vertexProps, ["ny", "normal_y"]),
            z: this.findPropertyIndex(vertexProps, ["nz", "normal_z"])
        };
        const hasNormals = normalIndices.x !== -1 && normalIndices.y !== -1 && normalIndices.z !== -1;

        const uvPair = this.findUVPair(vertexProps);
        const hasUVs = !!uvPair;

        const positions = new Float32Array(vertexElement.count * 3);
        const normals = hasNormals ? new Float32Array(vertexElement.count * 3) : null;
        const uvs = hasUVs ? new Float32Array(vertexElement.count * 2) : null;

        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        const lines = text.split(/\r?\n/);
        let cursor = 0;

        const readNumber = (tokens, index, fallback = 0) =>
        {
            const value = parseFloat(tokens[index]);
            return Number.isFinite(value) ? value : fallback;
        };

        const nextTokens = () =>
        {
            while (cursor < lines.length)
            {
                const trimmed = lines[cursor++].trim();
                if (trimmed)
                {
                    return trimmed.split(/\s+/);
                }
            }
            return null;
        };

        for (let i = 0; i < vertexElement.count; i++)
        {
            const tokens = nextTokens();
            if (!tokens)
            {
                throw new Error("PLY vertex data truncated.");
            }

            const x = readNumber(tokens, xIndex, 0);
            const y = readNumber(tokens, yIndex, 0);
            const z = readNumber(tokens, zIndex, 0);

            positions[i * 3 + 0] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            boundsMin[0] = Math.min(boundsMin[0], positions[i * 3 + 0]);
            boundsMin[1] = Math.min(boundsMin[1], positions[i * 3 + 1]);
            boundsMin[2] = Math.min(boundsMin[2], positions[i * 3 + 2]);

            boundsMax[0] = Math.max(boundsMax[0], positions[i * 3 + 0]);
            boundsMax[1] = Math.max(boundsMax[1], positions[i * 3 + 1]);
            boundsMax[2] = Math.max(boundsMax[2], positions[i * 3 + 2]);

            if (hasNormals)
            {
                normals[i * 3 + 0] = readNumber(tokens, normalIndices.x, 0);
                normals[i * 3 + 1] = readNumber(tokens, normalIndices.y, 0);
                normals[i * 3 + 2] = readNumber(tokens, normalIndices.z, 1);
            }

            if (hasUVs)
            {
                uvs[i * 2 + 0] = readNumber(tokens, uvPair.u, 0);
                uvs[i * 2 + 1] = readNumber(tokens, uvPair.v, 0);
            }
        }

        const listProperty = this.findFaceListProperty(faceProps);

        const outPositions = [];
        const outNormals = [];
        const outUVs = [];

        for (let i = 0; i < faceElement.count; i++)
        {
            const tokens = nextTokens();
            if (!tokens)
            {
                break;
            }

            let tokenIndex = 0;
            let indices = null;

            for (const prop of faceProps)
            {
                if (prop.isList)
                {
                    const count = parseInt(tokens[tokenIndex], 10) || 0;
                    tokenIndex += 1;
                    const list = tokens.slice(tokenIndex, tokenIndex + count)
                        .map((value) => parseInt(value, 10))
                        .filter((value) => Number.isFinite(value));
                    tokenIndex += count;
                    if (prop === listProperty)
                    {
                        indices = list;
                    }
                }
                else
                {
                    tokenIndex += 1;
                }
            }

            if (!indices || indices.length < 3)
            {
                continue;
            }

            for (let f = 1; f < indices.length - 1; f++)
            {
                const tri = [indices[0], indices[f], indices[f + 1]];
                const faceNormal = hasNormals ? null : this.computeFaceNormal(positions, tri);

                for (const idx of tri)
                {
                    const pIndex = idx * 3;
                    outPositions.push(
                        positions[pIndex],
                        positions[pIndex + 1],
                        positions[pIndex + 2]
                    );

                    if (hasNormals)
                    {
                        outNormals.push(
                            normals[pIndex],
                            normals[pIndex + 1],
                            normals[pIndex + 2]
                        );
                    }
                    else
                    {
                        outNormals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
                    }

                    if (hasUVs)
                    {
                        const uvIndex = idx * 2;
                        outUVs.push(uvs[uvIndex], uvs[uvIndex + 1]);
                    }
                }
            }
        }

        return this.buildPayload(outPositions, outNormals, outUVs, boundsMin, boundsMax, options, hasUVs);
    }

    /**
     * Parses binary PLY vertex/face data into buffers.
     */
    parseBinary(buffer, header, options)
    {
        const vertexElement = header.elements.vertex;
        const faceElement = header.elements.face;
        if (!vertexElement || !faceElement)
        {
            throw new Error("PLY missing vertex or face data.");
        }

        const littleEndian = header.format === "binary_little_endian";
        const view = new DataView(buffer);
        let offset = header.headerSize;

        const vertexProps = vertexElement.properties;
        const faceProps = faceElement.properties;

        const xIndex = this.findPropertyIndex(vertexProps, ["x"]);
        const yIndex = this.findPropertyIndex(vertexProps, ["y"]);
        const zIndex = this.findPropertyIndex(vertexProps, ["z"]);
        if (xIndex === -1 || yIndex === -1 || zIndex === -1)
        {
            throw new Error("PLY vertex properties missing positions.");
        }

        const normalIndices = {
            x: this.findPropertyIndex(vertexProps, ["nx", "normal_x"]),
            y: this.findPropertyIndex(vertexProps, ["ny", "normal_y"]),
            z: this.findPropertyIndex(vertexProps, ["nz", "normal_z"])
        };
        const hasNormals = normalIndices.x !== -1 && normalIndices.y !== -1 && normalIndices.z !== -1;

        const uvPair = this.findUVPair(vertexProps);
        const hasUVs = !!uvPair;

        const positions = new Float32Array(vertexElement.count * 3);
        const normals = hasNormals ? new Float32Array(vertexElement.count * 3) : null;
        const uvs = hasUVs ? new Float32Array(vertexElement.count * 2) : null;

        const boundsMin = [Infinity, Infinity, Infinity];
        const boundsMax = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < vertexElement.count; i++)
        {
            for (let p = 0; p < vertexProps.length; p++)
            {
                const prop = vertexProps[p];
                if (prop.isList)
                {
                    const countInfo = this.readScalar(view, offset, prop.countType, littleEndian);
                    offset += countInfo.size;
                    for (let c = 0; c < countInfo.value; c++)
                    {
                        const itemInfo = this.readScalar(view, offset, prop.itemType, littleEndian);
                        offset += itemInfo.size;
                    }
                }
                else
                {
                    const data = this.readScalar(view, offset, prop.type, littleEndian);
                    offset += data.size;

                    if (p === xIndex)
                    {
                        positions[i * 3 + 0] = data.value;
                    }
                    else if (p === yIndex)
                    {
                        positions[i * 3 + 1] = data.value;
                    }
                    else if (p === zIndex)
                    {
                        positions[i * 3 + 2] = data.value;
                    }
                    else if (hasNormals)
                    {
                        if (p === normalIndices.x)
                        {
                            normals[i * 3 + 0] = data.value;
                        }
                        else if (p === normalIndices.y)
                        {
                            normals[i * 3 + 1] = data.value;
                        }
                        else if (p === normalIndices.z)
                        {
                            normals[i * 3 + 2] = data.value;
                        }
                    }
                    if (hasUVs)
                    {
                        if (p === uvPair.u)
                        {
                            uvs[i * 2 + 0] = data.value;
                        }
                        else if (p === uvPair.v)
                        {
                            uvs[i * 2 + 1] = data.value;
                        }
                    }
                }
            }

            boundsMin[0] = Math.min(boundsMin[0], positions[i * 3 + 0]);
            boundsMin[1] = Math.min(boundsMin[1], positions[i * 3 + 1]);
            boundsMin[2] = Math.min(boundsMin[2], positions[i * 3 + 2]);

            boundsMax[0] = Math.max(boundsMax[0], positions[i * 3 + 0]);
            boundsMax[1] = Math.max(boundsMax[1], positions[i * 3 + 1]);
            boundsMax[2] = Math.max(boundsMax[2], positions[i * 3 + 2]);
        }

        const listProperty = this.findFaceListProperty(faceProps);

        const outPositions = [];
        const outNormals = [];
        const outUVs = [];

        for (let i = 0; i < faceElement.count; i++)
        {
            let indices = null;

            for (const prop of faceProps)
            {
                if (prop.isList)
                {
                    const countInfo = this.readScalar(view, offset, prop.countType, littleEndian);
                    offset += countInfo.size;
                    const list = [];
                    for (let c = 0; c < countInfo.value; c++)
                    {
                        const itemInfo = this.readScalar(view, offset, prop.itemType, littleEndian);
                        offset += itemInfo.size;
                        list.push(itemInfo.value);
                    }
                    if (prop === listProperty)
                    {
                        indices = list;
                    }
                }
                else
                {
                    const data = this.readScalar(view, offset, prop.type, littleEndian);
                    offset += data.size;
                }
            }

            if (!indices || indices.length < 3)
            {
                continue;
            }

            for (let f = 1; f < indices.length - 1; f++)
            {
                const tri = [indices[0], indices[f], indices[f + 1]];
                const faceNormal = hasNormals ? null : this.computeFaceNormal(positions, tri);

                for (const idx of tri)
                {
                    const pIndex = idx * 3;
                    outPositions.push(
                        positions[pIndex],
                        positions[pIndex + 1],
                        positions[pIndex + 2]
                    );

                    if (hasNormals)
                    {
                        outNormals.push(
                            normals[pIndex],
                            normals[pIndex + 1],
                            normals[pIndex + 2]
                        );
                    }
                    else
                    {
                        outNormals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
                    }

                    if (hasUVs)
                    {
                        const uvIndex = idx * 2;
                        outUVs.push(uvs[uvIndex], uvs[uvIndex + 1]);
                    }
                }
            }
        }

        return this.buildPayload(outPositions, outNormals, outUVs, boundsMin, boundsMax, options, hasUVs);
    }

    /**
     * Reads a typed scalar value from a DataView.
     */
    readScalar(view, offset, type, littleEndian)
    {
        const info = TYPE_INFO[type];
        if (!info)
        {
            throw new Error(`Unsupported PLY type: ${type}`);
        }
        return {
            value: info.getter(view, offset, littleEndian),
            size: info.size
        };
    }

    /**
     * Finds the first matching property index by name.
     */
    findPropertyIndex(properties, names)
    {
        for (const name of names)
        {
            const index = properties.findIndex((prop) => prop.name === name);
            if (index !== -1)
            {
                return index;
            }
        }
        return -1;
    }

    /**
     * Finds a matching pair of UV property names.
     */
    findUVPair(properties)
    {
        const pairs = [
            ["u", "v"],
            ["s", "t"],
            ["texture_u", "texture_v"],
            ["texcoord_u", "texcoord_v"]
        ];

        for (const [uName, vName] of pairs)
        {
            const uIndex = this.findPropertyIndex(properties, [uName]);
            const vIndex = this.findPropertyIndex(properties, [vName]);
            if (uIndex !== -1 && vIndex !== -1)
            {
                return { u: uIndex, v: vIndex };
            }
        }

        return null;
    }

    /**
     * Chooses the list property that represents face indices.
     */
    findFaceListProperty(properties)
    {
        return properties.find((prop) => prop.isList && /vertex/i.test(prop.name))
            || properties.find((prop) => prop.isList)
            || null;
    }

    /**
     * Computes a normalized face normal from indexed positions.
     */
    computeFaceNormal(positions, indices)
    {
        const aIndex = indices[0] * 3;
        const bIndex = indices[1] * 3;
        const cIndex = indices[2] * 3;

        const ax = positions[aIndex];
        const ay = positions[aIndex + 1];
        const az = positions[aIndex + 2];
        const bx = positions[bIndex];
        const by = positions[bIndex + 1];
        const bz = positions[bIndex + 2];
        const cx = positions[cIndex];
        const cy = positions[cIndex + 1];
        const cz = positions[cIndex + 2];

        const abx = bx - ax;
        const aby = by - ay;
        const abz = bz - az;
        const acx = cx - ax;
        const acy = cy - ay;
        const acz = cz - az;

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
     * Builds a standardized model payload from PLY arrays.
     */
    buildPayload(positions, normals, uvs, boundsMin, boundsMax, options, hasUVs)
    {
        if (!positions.length)
        {
            throw new Error("PLY file contained no drawable geometry.");
        }

        const name = options?.name || this.getNameFromUrl(options?.url) || "model";
        return {
            name,
            format: this.id,
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: hasUVs ? new Float32Array(uvs) : null,
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
