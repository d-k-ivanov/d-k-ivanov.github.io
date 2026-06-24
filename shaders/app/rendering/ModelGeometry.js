"use strict";

/**
 * Shared model-geometry helpers used by both the WebGL2 and WebGPU backends.
 *
 * Keeping these markers and the bounding-box math in one place guarantees that
 * the two renderers detect the same opt-in markers and derive identical model
 * transforms, which is essential for visual parity across the backends.
 */

/**
 * Marker that opts a shader into drawing the loaded model geometry.
 *
 * @type {RegExp}
 */
export const MODEL_GEOMETRY_MARKER = /\bMODEL_GEOMETRY\b/;

/**
 * Marker that requests reserved padding before the model vertices.
 *
 * @type {RegExp}
 */
export const MODEL_PADDING_MARKER = /\bMODEL_GEOMETRY_WITH_PADDING\b/;

/**
 * Normalizes one or more shader sources into a single searchable string.
 *
 * @param {string|Array<string>} sources - A single source or array of sources.
 * @returns {string} Concatenated, newline-joined source text.
 */
function joinSources(sources)
{
    if (Array.isArray(sources))
    {
        return sources.map((source) => source || "").join("\n");
    }
    return sources || "";
}

/**
 * Detects the model-geometry marker across one or more shader sources.
 *
 * @param {string|Array<string>} sources - Shader source(s) to scan.
 * @returns {boolean} True when model geometry should be drawn.
 * @example
 * hasModelGeometry([vertexSource, fragmentSource]);
 */
export function hasModelGeometry(sources)
{
    return MODEL_GEOMETRY_MARKER.test(joinSources(sources));
}

/**
 * Detects the model-padding marker across one or more shader sources.
 *
 * @param {string|Array<string>} sources - Shader source(s) to scan.
 * @returns {boolean} True when model buffers should reserve leading padding.
 */
export function hasModelPadding(sources)
{
    return MODEL_PADDING_MARKER.test(joinSources(sources));
}

/**
 * Computes derived model info (center, fit scale, and bounds).
 *
 * The fit scale normalizes the model's largest axis to roughly 1.6 world units
 * so loaded geometry appears at a consistent size regardless of source scale.
 *
 * @param {object} model - Model payload with an optional `bounds` field.
 * @returns {{center: number[], scale: number, boundsMin: number[], boundsMax: number[]}}
 * Derived model info shared by both backends.
 */
export function buildModelInfo(model)
{
    const bounds = model?.bounds || {};
    const min = bounds.min || [0, 0, 0];
    const max = bounds.max || [0, 0, 0];
    const center = [
        (min[0] + max[0]) * 0.5,
        (min[1] + max[1]) * 0.5,
        (min[2] + max[2]) * 0.5
    ];
    const size = [
        max[0] - min[0],
        max[1] - min[1],
        max[2] - min[2]
    ];
    const maxAxis = Math.max(size[0], size[1], size[2], 0.0001);
    const scale = 1.6 / maxAxis;

    return {
        center,
        scale,
        boundsMin: min,
        boundsMax: max
    };
}
