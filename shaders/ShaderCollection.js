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
        { language: "glsl", folder: "basics", vertex: true, fragment: true, name: "hello_world" },
        { language: "glsl", folder: "basics", vertex: false, fragment: true, name: "plotter" },
        { language: "glsl", folder: "basics", vertex: false, fragment: true, name: "print_text" },

        // Procedural patterns
        { language: "glsl", folder: "patterns", vertex: false, fragment: true, name: "polar_flow" },
        { language: "glsl", folder: "patterns", vertex: false, fragment: true, name: "neon_grid" },

        // Miscellaneous Examples from other authors
        { language: "glsl", folder: "misc", vertex: true, fragment: true, name: "bµg_moonlight_shadertoy" },
        { language: "glsl", folder: "misc", vertex: true, fragment: true, name: "bµg_moonlight" },
        { language: "glsl", folder: "misc", vertex: true, fragment: true, name: "curena_alhambra" },
        { language: "glsl", folder: "misc", vertex: true, fragment: true, name: "curena_p6mm" },
        { language: "glsl", folder: "misc", vertex: true, fragment: true, name: "iq_primitives" },

        // Shader Art Examples
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_01" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_02" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_03" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_04" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_05" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_06" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_07" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_08" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_09" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_10" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_11" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_12" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_13" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_14" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_15" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_16" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_17" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_18" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_19" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_20" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_21" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_22" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_23" },
        { language: "glsl", folder: "tutorials", vertex: false, fragment: true, name: "kishimisu_introduction_24" },

        // Signed Distance Field (SDF) Examples
        { language: "glsl", folder: "sdf", vertex: true, fragment: true, name: "2d_distances" },

        // Ray Tracing in One Weekend
        { language: "glsl", folder: "raytracing", vertex: true, fragment: true, name: "rtow-one-webgl" },
        { language: "wgsl", folder: "raytracing", vertex: true, fragment: true, compute: true, name: "rtow-one-webgpu" },

        // WebGPU WGSL Examples
        { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: true, name: "hello_world" },
        { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "hello_triangle" },
        { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "atomic_pulse" },
        { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: true, name: "compute_waves" },
        { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "print_text" }
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
