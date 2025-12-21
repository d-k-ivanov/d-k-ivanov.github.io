"use strict";

import { ModelCollection } from "./ModelCollection.js";
import { StlFormat } from "./StlFormat.js";
import { WavefrontObjFormat } from "./WavefrontObjFormat.js";

/**
 * Loads model assets by delegating to format-specific parsers.
 */
export class ModelLoader
{
    constructor({ basePath = ModelCollection.BASE_PATH, formats = null } = {})
    {
        this.basePath = (basePath || "./models").replace(/\/$/, "");
        this.formats = Array.isArray(formats) && formats.length
            ? formats
            : [new WavefrontObjFormat(), new StlFormat()];
        this.cache = new Map();
    }

    /**
     * Resolves a model URL and name from input.
     */
    resolveSource(source)
    {
        if (!source)
        {
            return { url: null, name: null };
        }

        if (typeof source === "string")
        {
            return { url: source, name: this.getNameFromUrl(source) };
        }

        const name = source.name || source.label || source.id || source.file || null;
        if (source.url)
        {
            return { url: source.url, name };
        }

        if (source.file)
        {
            return { url: `${this.basePath}/${source.file}`, name };
        }

        throw new Error("Unsupported model source.");
    }

    /**
     * Loads a model by URL or collection item.
     */
    async load(source, options = {})
    {
        const { url, name } = this.resolveSource(source);
        if (!url)
        {
            return null;
        }

        if (this.cache.has(url))
        {
            return this.cache.get(url);
        }

        const format = this.getFormatForUrl(url);
        if (!format)
        {
            throw new Error(`Unsupported model format: ${url}`);
        }

        const loadPromise = format.load(url, { ...options, name }).catch((error) =>
        {
            this.cache.delete(url);
            throw error;
        });
        this.cache.set(url, loadPromise);
        return loadPromise;
    }

    /**
     * Returns the first format that supports the given URL extension.
     */
    getFormatForUrl(url)
    {
        const extension = this.getExtension(url);
        if (!extension)
        {
            return null;
        }
        return this.formats.find((format) => format.supportsExtension(extension)) || null;
    }

    getExtension(url)
    {
        if (!url)
        {
            return null;
        }
        const fragment = url.split("?")[0];
        const parts = fragment.split(".");
        return parts.length > 1 ? parts.pop().toLowerCase() : null;
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
