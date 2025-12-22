"use strict";

/**
 * Abstract base class for text-based 3D model formats.
 *
 * Subclasses implement {@link parse} to return a standardized payload
 * with positions, normals, uvs, and bounds. The base implementation
 * provides URL loading and extension matching.
 *
 * @example
 * class CustomFormat extends ModelFormat {
 *   parse(source) { return { positions: new Float32Array(), normals: new Float32Array(), uvs: null, vertexCount: 0, bounds: { min: [0,0,0], max: [0,0,0] } }; }
 * }
 */
export class ModelFormat
{
    /**
     * @param {{id?: string, extensions?: string[]}} param0 - Format metadata.
     */
    constructor({ id, extensions } = {})
    {
        if (new.target === ModelFormat)
        {
            throw new Error("ModelFormat is abstract and cannot be instantiated directly.");
        }

        this.id = id || "unknown";
        this.extensions = Array.isArray(extensions) ? extensions.map((ext) => ext.toLowerCase()) : [];
    }

    /**
     * Checks whether the format supports the given extension.
     *
     * @param {string} extension - File extension without leading dot.
     * @returns {boolean} True when supported.
     */
    supportsExtension(extension)
    {
        if (!extension)
        {
            return false;
        }
        return this.extensions.includes(extension.toLowerCase());
    }

    /**
     * Loads and parses a model from a URL.
     *
     * @param {string} url - Model URL to fetch.
     * @param {object} options - Parsing options passed to {@link parse}.
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

        const source = await response.text();
        return this.parse(source, { ...options, url });
    }

    /**
     * Parses model source into a standardized data payload.
     *
     * @param {string|ArrayBuffer} source - Model source contents.
     * @param {object} options - Parsing options.
     * @returns {object} Standardized model payload.
     */
    parse()
    {
        throw new Error("ModelFormat.parse must be implemented by subclasses.");
    }
}
