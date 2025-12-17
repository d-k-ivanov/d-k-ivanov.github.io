"use strict";

import { ShaderRenderer } from "./ShaderRenderer.js";

/**
 * Central registry of example shaders and helper utilities to resolve
 * language, context, paths, and display names.
 */
export class ShaderCollection
{
    static BASE_PATH = "./collection";
    static SHARED_PATH = "./collection/shared";

    /** Catalog of built-in shader examples used by the editor UI. */
    static ITEMS = [
        // Basics
        { language: "glsl", folder: "basics", name: "hello_world", vertex:  true, fragment: true },
        { language: "glsl", folder: "basics", name: "plotter"    , vertex: false, fragment: true },
        { language: "glsl", folder: "basics", name: "print_text" , vertex: false, fragment: true },

        // Miscellaneous Examples from other authors
        { language: "glsl", folder: "misc", name: "bµg_moonlight_shadertoy", vertex: true, fragment: true },
        { language: "glsl", folder: "misc", name: "bµg_moonlight", vertex: true, fragment: true },
        { language: "glsl", folder: "misc", name: "curena_alhambra", vertex: true, fragment: true },
        { language: "glsl", folder: "misc", name: "curena_p6mm", vertex: true, fragment: true },
        { language: "glsl", folder: "misc", name: "iq_primitives", vertex: true, fragment: true },

        // Procedural patterns
        { language: "glsl", folder: "patterns", name: "neon_grid", vertex: false, fragment: true },
        { language: "glsl", folder: "patterns", name: "polar_flow", vertex: false, fragment: true },

        // Ray Tracing in One Weekend
        { language: "glsl", folder: "raytracing", name: "rtow-one-webgl", vertex: true, fragment: true },
        { language: "wgsl", folder: "raytracing", name: "rtow-one-webgpu", vertex: true, fragment: true, compute: true },

        // Signed Distance Field (SDF) Examples
        { language: "glsl", folder: "sdf", vertex: true, fragment: true, name: "2d_distances" },

        // Shader Art Examples
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_01", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_02", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_03", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_04", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_05", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_06", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_07", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_08", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_09", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_10", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_11", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_12", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_13", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_14", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_15", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_16", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_17", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_18", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_19", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_20", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_21", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_22", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_23", vertex: false, fragment: true },
        { language: "glsl", folder: "tutorials", name: "kishimisu_introduction_24", vertex: false, fragment: true },

        // WebGPU WGSL Examples
        { language: "wgsl", folder: "webgpu", name: "atomic_pulse", vertex: true, fragment: true, compute: false },
        { language: "wgsl", folder: "webgpu", name: "compute_waves", vertex: true, fragment: true, compute: true },
        { language: "wgsl", folder: "webgpu", name: "game_of_life_01", vertex: true, fragment: true, compute: true },
        { language: "wgsl", folder: "webgpu", name: "hello_triangle", vertex: true, fragment: true, compute: false },
        { language: "wgsl", folder: "webgpu", name: "hello_world", vertex: true, fragment: true, compute: true },
        { language: "wgsl", folder: "webgpu", name: "print_text", vertex: true, fragment: true, compute: false },
    ];

    /**
     * Infers shader language from definition or filename.
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
     */
    static getContext(shader)
    {
        return ShaderCollection.getLanguage(shader) === "wgsl"
            ? ShaderRenderer.CONTEXTS.WEBGPU
            : ShaderRenderer.CONTEXTS.WEBGL2;
    }

    /**
     * Strips file extension to get the base shader name.
     */
    static getBaseName(shader)
    {
        const name = shader?.name || "";
        return name.replace(/\.(wgsl|glsl)$/i, "");
    }

    /**
     * Returns a display name with inferred extension suffix.
     */
    static getDisplayName(shader)
    {
        const suffix = ShaderCollection.getLanguage(shader) === "wgsl" ? ".wgsl" : ".glsl";
        return `${ShaderCollection.getBaseName(shader)}${suffix}`;
    }

    /**
     * Groups shader definitions by folder for the tree UI.
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
