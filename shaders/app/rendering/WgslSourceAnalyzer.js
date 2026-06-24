"use strict";

/**
 * Default compute workgroup size used when a shader omits `@workgroup_size`.
 *
 * @type {{x: number, y: number, z: number}}
 */
export const DEFAULT_WORKGROUP_SIZE = { x: 8, y: 8, z: 1 };

/**
 * Default vertex count used when a shader omits a `VERTEX_COUNT` constant.
 *
 * @type {number}
 */
export const DEFAULT_VERTEX_COUNT = 3;

/**
 * Default per-axis grid size used when a shader omits a `GRID_SIZE` constant.
 *
 * @type {number}
 */
export const DEFAULT_GRID_SIZE = 1;

/**
 * Stateless analyzer for WGSL shader sources.
 *
 * All methods are pure string parsers: they read shader text and return derived
 * configuration (entry points, bindings, grid/workgroup sizes, texture URLs)
 * without touching GPU resources. Keeping this logic isolated keeps
 * {@link WebGPURenderer} focused on pipeline and resource management.
 *
 * @example
 * const entry = WgslSourceAnalyzer.getEntryPoint(src, "fragment");
 * const bindings = WgslSourceAnalyzer.extractBindings([vertexSrc, fragmentSrc]);
 */
export class WgslSourceAnalyzer
{
    /**
     * Detects GLSL markers to guard against misusing the WGSL path.
     *
     * @param {string} source - Shader source to inspect.
     * @returns {boolean} True when the source appears to be GLSL.
     */
    static isLikelyGLSL(source)
    {
        const glslMarkers = [
            /^\s*#version/m,
            /\bprecision\s+(?:lowp|mediump|highp)\b/,
            // /\blayout\s*\(/,
            /\bgl_(FragCoord|Position|VertexID|InstanceID)\b/,
            /\bsampler2D\b/
        ];
        return glslMarkers.some((rx) => rx.test(source));
    }

    /**
     * Throws if the WGSL source appears to be GLSL.
     *
     * @param {string} source - Shader source to validate.
     * @param {string} label - Stage label for error messages.
     * @returns {void}
     */
    static validateWGSLSource(source, label)
    {
        if (WgslSourceAnalyzer.isLikelyGLSL(source))
        {
            throw new Error(`${label} looks like GLSL. WebGPU expects WGSL with @vertex/@fragment/@compute entry points. Switch to WebGL2 or update the shader to WGSL.`);
        }
    }

    /**
     * Extracts an entry point name for the given shader stage.
     *
     * @param {string} source - WGSL source to scan.
     * @param {"vertex"|"fragment"|"compute"} stage - Shader stage.
     * @returns {string|null} Entry point function name.
     */
    static getEntryPoint(source, stage)
    {
        const allowedStages = ["vertex", "fragment", "compute"];
        if (!allowedStages.includes(stage))
        {
            throw new Error(`Invalid shader stage: ${stage}`);
        }

        const regex = new RegExp(`@${stage}[\\s\\S]*?fn\\s+(\\w+)`, "m");
        const match = regex.exec(source);
        return match ? match[1] : null;
    }

    /**
     * Parses all `@binding(n)` entries from one or more WGSL sources.
     *
     * @param {string|Array<string>} source - WGSL source(s) to inspect.
     * @returns {Set<number>} Set of declared binding indices.
     */
    static extractBindings(source)
    {
        const bindings = new Set();
        const sourceText = Array.isArray(source) ? source.join("\n") : (source || "");
        const regex = /@binding\s*\(\s*(\d+)\s*\)/g;
        let match;
        while ((match = regex.exec(sourceText)) !== null)
        {
            bindings.add(parseInt(match[1], 10));
        }
        return bindings;
    }

    /**
     * Extracts iChannel texture URLs from sampler declaration comments.
     *
     * Expects comments such as: `// iChannel0URL: ./path/to/texture.png`.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {Array<string|null>} Four-element list of URLs (or null) by channel.
     */
    static extractTextureURLs(sources)
    {
        const channelUrls = [null, null, null, null];
        const regex = /\/\/\s*iChannel([0-3])URL\s*:\s*(\S+)/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }
            const match = regex.exec(source);
            if (match)
            {
                const index = parseInt(match[1], 10);
                channelUrls[index] = match[2];
            }
        }
        return channelUrls;
    }

    /**
     * Parses `@workgroup_size`, falling back to {@link DEFAULT_WORKGROUP_SIZE}.
     *
     * @param {string} source - WGSL compute shader source.
     * @returns {{x: number, y: number, z: number}} Workgroup size tuple.
     */
    static extractWorkgroupSize(source)
    {
        const match = source.match(/@workgroup_size\s*\(\s*(\d+)\s*(?:,\s*(\d+))?\s*(?:,\s*(\d+))?\s*\)/i);
        if (!match)
        {
            return { ...DEFAULT_WORKGROUP_SIZE };
        }

        const [, x, y, z] = match;
        return {
            x: parseInt(x, 10) || DEFAULT_WORKGROUP_SIZE.x,
            y: parseInt(y || "1", 10) || DEFAULT_WORKGROUP_SIZE.y,
            z: parseInt(z || "1", 10) || DEFAULT_WORKGROUP_SIZE.z
        };
    }

    /**
     * Extracts the `VERTEX_COUNT` constant from any provided WGSL sources.
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {number} Vertex count to use for draw calls.
     */
    static extractVertexCount(sources)
    {
        const regex = /const\s+VERTEX_COUNT[^=]*=\s*([0-9]+)\s*u?/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }

            const match = regex.exec(source);
            if (match)
            {
                const parsed = parseInt(match[1], 10);
                if (!Number.isNaN(parsed) && parsed > 0)
                {
                    return parsed;
                }
            }
        }

        return DEFAULT_VERTEX_COUNT;
    }

    /**
     * Extracts the `GRID_SIZE` constant from any provided WGSL sources.
     *
     * Expected format: `const GRID_SIZE : vec3u = vec3u(256u, 256u, 1u);`
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {{x: number, y: number, z: number}} Grid size used for dispatches.
     */
    static extractGridSize(sources)
    {
        const fallback = {
            x: DEFAULT_GRID_SIZE,
            y: DEFAULT_GRID_SIZE,
            z: DEFAULT_GRID_SIZE
        };
        const regex = /const\s+GRID_SIZE\b[^=]*=\s*vec3u?\s*\(\s*([0-9]+)\s*u?\s*,\s*([0-9]+)\s*u?\s*,\s*([0-9]+)\s*u?\s*\)/i;

        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }

            const match = regex.exec(source);
            if (!match)
            {
                continue;
            }

            const x = parseInt(match[1], 10);
            const y = parseInt(match[2], 10);
            const z = parseInt(match[3], 10);
            if ([x, y, z].every(value => Number.isFinite(value) && value > 0))
            {
                return { x, y, z };
            }
        }

        return fallback;
    }

    /**
     * Extracts the `GRID_SIZE_RESOLUTION` flag from any provided WGSL sources.
     *
     * Expected format: `const GRID_SIZE_RESOLUTION : bool = true;`
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {boolean} True when grid size should follow canvas resolution.
     */
    static extractGridSizeResolution(sources)
    {
        const regex = /const\s+GRID_SIZE_RESOLUTION\b[^=]*=\s*(true|false)\b/i;
        for (const source of sources)
        {
            if (!source)
            {
                continue;
            }

            const match = regex.exec(source);
            if (match)
            {
                return match[1].toLowerCase() === "true";
            }
        }

        return false;
    }

    /**
     * Detects the additive-blending marker from WGSL sources.
     *
     * Expected format: `const BLEND_ADD : bool = true;`
     *
     * @param {Array<string>} sources - Shader sources to scan.
     * @returns {boolean} True when additive blending is requested.
     */
    static extractAdditiveBlend(sources)
    {
        const regex = /const\s+BLEND_ADD\b[^=]*=\s*true\b/i;
        return sources.some(source => source && regex.test(source));
    }
}
