"use strict";

import { ShaderRenderer } from "../rendering/ShaderRenderer.js";

/**
 * Central registry of example shaders and helper utilities to resolve
 * language, context, paths, and display names.
 *
 * Treat this class as the source of truth for the shader tree. It keeps the
 * catalog, understands how to infer GLSL vs WGSL, and normalizes shader names.
 *
 * @example
 * const folders = ShaderCollection.groupByFolder();
 * const shader = ShaderCollection.ITEMS[0];
 * const context = ShaderCollection.getContext(shader);
 */
export class ShaderCollection
{
    static BASE_PATH = "./assets/shaders";
    static SHARED_PATH = "./assets/shaders/shared";

    /**
     * Catalog of built-in shader examples used by the editor UI.
     *
     * Each entry should include `folder`, `name`, and optionally `language`.
     * The editor uses this list to build the file tree and resolve sources.
     */
    static ITEMS = [
        // Basics
        { language: "glsl", folder: "basics", name: "hello_world" },
        { language: "glsl", folder: "basics", name: "plotter" },
        { language: "glsl", folder: "basics", name: "print_text" },
        { language: "glsl", folder: "basics", name: "shadertoy" },

        // Miscellaneous Examples from other authors
        { language: "glsl", folder: "misc", name: "bµg_moonlight_shadertoy" },
        { language: "glsl", folder: "misc", name: "bµg_moonlight" },
        { language: "glsl", folder: "misc", name: "curena_alhambra" },
        { language: "glsl", folder: "misc", name: "curena_p6mm" },
        { language: "glsl", folder: "misc", name: "iq_primitives" },

        // Model rendering
        { language: "glsl", folder: "objects", name: "obj_viewer-webgl" },

        // Procedural patterns
        { language: "glsl", folder: "patterns", name: "neon_grid" },
        { language: "glsl", folder: "patterns", name: "polar_flow" },

        // Ray Tracing in One Weekend
        { language: "glsl", folder: "raytracing", name: "rtow-one-webgl" },
        { language: "wgsl", folder: "raytracing", name: "rtow-one-webgpu" },

        // Signed Distance Field (SDF) Examples
        { language: "glsl", folder: "sdf", name: "2d_distances" },

        // Shader Art Examples
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_01" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_02" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_03" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_04" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_05" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_06" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_07" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_08" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_09" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_10" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_11" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_12" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_13" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_14" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_15" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_16" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_17" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_18" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_19" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_20" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_21" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_22" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_23" },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_24" },

        // WebGPU WGSL Examples
        { language: "wgsl", folder: "webgpu", name: "atomic_pulse" },
        { language: "wgsl", folder: "webgpu", name: "compute_waves" },
        { language: "wgsl", folder: "webgpu", name: "game_of_life_01" },
        { language: "wgsl", folder: "webgpu", name: "hello_triangle" },
        { language: "wgsl", folder: "webgpu", name: "hello_world" },
        { language: "wgsl", folder: "objects", name: "obj_viewer-webgpu" },
        { language: "wgsl", folder: "webgpu", name: "print_text" },
    ];

    /**
     * Infers shader language from definition or filename.
     *
     * @param {{language?: string, name?: string}} shader - Shader definition.
     * @returns {"glsl"|"wgsl"} Lowercase language id.
     * @example
     * ShaderCollection.getLanguage({ name: "example.wgsl" }); // "wgsl"
     */
    static getLanguage(shader)
    {
        const name = (shader?.name || "").toLowerCase();
        if (name.endsWith(".wgsl"))
        {
            return "wgsl";
        }
        if (name.endsWith(".glsl"))
        {
            return "glsl";
        }
        if (shader?.language)
        {
            return shader.language.toLowerCase();
        }
        return "glsl";
    }

    /**
     * Determines rendering context for the shader.
     *
     * @param {{language?: string, name?: string}} shader - Shader definition.
     * @returns {string} One of {@link ShaderRenderer.CONTEXTS}.
     */
    static getContext(shader)
    {
        return ShaderCollection.getLanguage(shader) === "wgsl"
            ? ShaderRenderer.CONTEXTS.WEBGPU
            : ShaderRenderer.CONTEXTS.WEBGL2;
    }

    /**
     * Strips file extension to get the base shader name.
     *
     * @param {{name?: string}} shader - Shader definition.
     * @returns {string} Base name without extension.
     */
    static getBaseName(shader)
    {
        const name = shader?.name || "";
        return name.replace(/\.(wgsl|glsl)$/i, "");
    }

    /**
     * Returns a display name with inferred extension suffix.
     *
     * @param {{language?: string, name?: string}} shader - Shader definition.
     * @returns {string} User-friendly name with extension.
     */
    static getDisplayName(shader)
    {
        const suffix = ShaderCollection.getLanguage(shader) === "wgsl" ? ".wgsl" : ".glsl";
        return `${ShaderCollection.getBaseName(shader)}${suffix}`;
    }

    /**
     * Groups shader definitions by folder for the tree UI.
     *
     * @param {Array<object>} collection - Optional list override.
     * @returns {Array<{folder: string, shaders: object[]}>} Sorted folders with entries.
     * @example
     * const folders = ShaderCollection.groupByFolder();
     */
    static groupByFolder(collection = ShaderCollection.ITEMS)
    {
        const folders = new Map();

        for (const shader of collection)
        {
            const folderName = shader.folder || "misc";
            if (!folders.has(folderName))
            {
                folders.set(folderName, []);
            }
            folders.get(folderName).push(shader);
        }

        return Array.from(folders.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([folder, shaders]) => ({
                folder,
                shaders: shaders.slice().sort((a, b) => ShaderCollection.getDisplayName(a).localeCompare(ShaderCollection.getDisplayName(b)))
            }));
    }

    /**
     * Checks if a shader exists in the collection.
     *
     * @param {{folder?: string, name?: string}} shader - Shader definition.
     * @returns {boolean} True when the shader is registered.
     */
    static isKnown(shader)
    {
        if (!shader)
        {
            return false;
        }

        return ShaderCollection.ITEMS.some(
            (s) => s.folder === shader.folder && s.name === shader.name
        );
    }
}
