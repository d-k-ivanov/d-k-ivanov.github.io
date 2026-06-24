"use strict";

import { ShaderCollection } from "./ShaderCollection.js";
import { ShaderRenderer } from "../rendering/ShaderRenderer.js";

/**
 * Resolves and fetches shader stage sources for the editor.
 *
 * This loader encapsulates the file-naming convention and fallback rules:
 * stage-specific files (`<name>.<stage>.<lang>`) are preferred, with shared
 * defaults under {@link ShaderCollection.SHARED_PATH} used when an optional
 * vertex or compute stage is missing. Keeping this logic isolated keeps
 * {@link ShaderEditor} focused on editing and UI concerns.
 *
 * @example
 * const { sources, originals } =
 *     await ShaderSourceLoader.loadSources(shader, context, SHADER_TYPES);
 */
export class ShaderSourceLoader
{
    /**
     * Retrieves all stage sources for the given shader/context pair.
     *
     * @param {object} shader - Shader definition.
     * @param {string} context - Rendering context identifier.
     * @param {Array<object>} shaderTypes - Stage descriptors (id + optional context).
     * @returns {Promise<{sources: object, originals: object}>} Loaded sources and originals.
     */
    static async loadSources(shader, context, shaderTypes)
    {
        const isVisible = (type) => (!type.context || type.context === context);
        const sources = {};
        const originals = {};

        for (const type of shaderTypes)
        {
            if (isVisible(type))
            {
                const src = await ShaderSourceLoader.loadStageSource(shader, type, context);
                sources[type.id] = src;
                originals[type.id] = src;
            }
            else
            {
                sources[type.id] = "";
                originals[type.id] = "";
            }
        }

        return { sources, originals };
    }

    /**
     * Picks the best-matching source file for a specific shader stage.
     *
     * The method tries stage-specific filenames, then falls back to shared
     * defaults when optional sources are missing.
     *
     * @param {object} shader - Shader definition.
     * @param {object} type - Stage metadata (id + optional context).
     * @param {string} context - Rendering context identifier.
     * @returns {Promise<string>} Shader source text.
     */
    static async loadStageSource(shader, type, context)
    {
        if (type.context && type.context !== context)
        {
            return "";
        }

        const candidates = [];
        const added = new Map();
        const addCandidate = (url, optional) =>
        {
            if (!url)
            {
                return;
            }

            if (added.has(url))
            {
                if (added.get(url) === true && optional === false)
                {
                    const idx = candidates.findIndex(c => c.url === url);
                    if (idx !== -1)
                    {
                        candidates[idx].optional = false;
                    }
                    added.set(url, false);
                }
                return;
            }

            added.set(url, optional);
            candidates.push({ url, optional });
        };

        const baseName = ShaderCollection.getBaseName(shader);
        const basePath = `${ShaderCollection.BASE_PATH}/${shader.folder}/${baseName}`;
        const isWebGPU = context === ShaderRenderer.CONTEXTS.WEBGPU;

        if (type.id === "vertex")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.vertex.wgsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.vertex.wgsl`, /*optional*/ false);
            }
            else
            {
                addCandidate(`${basePath}.vertex.glsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.vertex.glsl`, /*optional*/ false);
            }
        }

        if (type.id === "fragment")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.fragment.wgsl`, /*optional*/ false);
            }
            else
            {
                addCandidate(`${basePath}.fragment.glsl`, /*optional*/ false);
            }
        }

        if (type.id === "compute")
        {
            if (isWebGPU)
            {
                addCandidate(`${basePath}.compute.wgsl`, /*optional*/ true);
                addCandidate(`${ShaderCollection.SHARED_PATH}/default.compute.wgsl`, /*optional*/ false);
            }
            else
            {
                return "";
            }
        }

        for (const candidate of candidates)
        {
            try
            {
                const content = await ShaderSourceLoader.fetchSource(candidate.url, candidate.optional);
                if (content)
                {
                    return content;
                }
            }
            catch (err)
            {
                if (candidate.optional)
                {
                    continue;
                }
                throw err;
            }
        }

        return "";
    }

    /**
     * Fetches shader text; returns empty string when optional and missing.
     *
     * @param {string} url - URL to fetch.
     * @param {boolean} optional - When true, missing files return empty string.
     * @returns {Promise<string>} Shader source or empty string.
     */
    static async fetchSource(url, optional = false)
    {
        try
        {
            const response = await fetch(url);
            if (!response.ok)
            {
                if (optional)
                {
                    return "";
                }
                throw new Error(`Failed to load: ${url}`);
            }
            return response.text();
        }
        catch (err)
        {
            if (optional)
            {
                return "";
            }
            throw err;
        }
    }
}
