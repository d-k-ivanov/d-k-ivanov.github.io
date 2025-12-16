"use strict";

import { RENDER_CONTEXTS } from "./shader-renderer.js";

export const COLLECTION_BASE_PATH = "./collection";
export const SHARED_BASE_PATH = "./collection/shared";

export const SHADER_COLLECTION = [
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
    // { folder: "sdf", name: "3d_distances" }

    // WebGPU WGSL Examples
    { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: true, name: "hello_world" },
    { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "hello_triangle" },
    { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "atomic_pulse" },
    { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: true, name: "compute_waves" },
    { language: "wgsl", folder: "webgpu", vertex: true, fragment: true, compute: false, name: "print_text" },
];

export const getShaderLanguage = (shader) =>
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
};

export const getShaderContext = (shader) =>
{
    return getShaderLanguage(shader) === "wgsl"
        ? RENDER_CONTEXTS.WEBGPU
        : RENDER_CONTEXTS.WEBGL2;
};

export const getShaderBaseName = (shader) =>
{
    const name = shader?.name || "";
    return name.replace(/\.(wgsl|glsl)$/i, "");
};

export const getShaderDisplayName = (shader) =>
{
    const suffix = getShaderLanguage(shader) === "wgsl" ? ".wgsl" : ".glsl";
    return `${getShaderBaseName(shader)}${suffix}`;
};

export const groupShadersByFolder = (collection = SHADER_COLLECTION) =>
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
            shaders: shaders.slice().sort((a, b) => getShaderDisplayName(a).localeCompare(getShaderDisplayName(b)))
        }));
};

export const isKnownShader = (shader) =>
{
    if (!shader)
    {
        return false;
    }

    return SHADER_COLLECTION.some(
        (s) => s.folder === shader.folder && s.name === shader.name
    );
};
