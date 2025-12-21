"use strict";

/**
 * Abstract base class for text-based 3D model formats.
 */
export class ModelFormat
{
    /**
     * @param {{id?: string, extensions?: string[]}} param0 - format metadata.
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
     * @param {string} extension - file extension without leading dot.
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
     */
    parse()
    {
        throw new Error("ModelFormat.parse must be implemented by subclasses.");
    }
}
