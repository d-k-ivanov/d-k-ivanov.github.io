"use strict";

import { DracoFormat } from "./DracoFormat.js";
import { ModelCollection } from "./ModelCollection.js";
import { PlyFormat } from "./PlyFormat.js";
import { StlFormat } from "./StlFormat.js";
import { WavefrontObjFormat } from "./WavefrontObjFormat.js";

/**
 * Loads model assets by delegating to format-specific parsers.
 */
export class ModelLoader
{
    constructor({ basePath = ModelCollection.BASE_PATH, formats = null } = {})
    {
        this.basePath = (basePath || "./assets/models").replace(/\/$/, "");
        this.formats = Array.isArray(formats) && formats.length
            ? formats
            : [new WavefrontObjFormat(), new StlFormat(), new PlyFormat(), new DracoFormat()];
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

        const format = this.getFormatForUrl(url, name);
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
    getFormatForUrl(url, name = null)
    {
        const extension = this.getExtension(url, name);
        if (!extension)
        {
            return null;
        }
        return this.formats.find((format) => format.supportsExtension(extension)) || null;
    }

    getExtension(url, name = null)
    {
        const extensionFromValue = (value) =>
        {
            if (!value)
            {
                return null;
            }

            let decoded = value;
            try
            {
                decoded = decodeURIComponent(value);
            }
            catch (e)
            {
                decoded = value;
            }

            const base = decoded.split("?")[0];
            const file = base.split("/").pop();
            if (!file)
            {
                return null;
            }

            const dotIndex = file.lastIndexOf(".");
            if (dotIndex <= 0)
            {
                return null;
            }
            return file.slice(dotIndex + 1).toLowerCase();
        };

        if (url)
        {
            const trimmed = url.trim();
            const hashIndex = trimmed.lastIndexOf("#");
            if (hashIndex !== -1)
            {
                const hashPart = trimmed.slice(hashIndex + 1);
                const hashExt = extensionFromValue(hashPart);
                if (hashExt)
                {
                    return hashExt;
                }
            }

            const baseExt = extensionFromValue(trimmed);
            if (baseExt)
            {
                return baseExt;
            }
        }

        return extensionFromValue(name);
    }

    getNameFromUrl(url)
    {
        if (!url)
        {
            return null;
        }
        const trimmed = url.trim();
        const hashIndex = trimmed.lastIndexOf("#");
        if (hashIndex !== -1)
        {
            try
            {
                const hashPart = decodeURIComponent(trimmed.slice(hashIndex + 1));
                if (hashPart)
                {
                    return hashPart.replace(/\.[^/.]+$/, "");
                }
            }
            catch (e)
            {
                // Ignore decode errors.
            }
        }

        const base = trimmed.split("?")[0];
        const file = base.split("/").pop();
        if (!file)
        {
            return null;
        }
        return file.replace(/\.[^/.]+$/, "");
    }
}
