"use strict";

import { ShaderCollection } from "./ShaderCollection.js";

const STORAGE_KEY = "shaders-selected-shader";
const STORAGE_KEY_MODEL = "shaders-selected-model";

/**
 * Persists and restores the user's last shader and model selections.
 *
 * All access is wrapped in try/catch so private-mode or disabled storage
 * degrades gracefully (reads return null, writes are ignored). Restored
 * shaders are validated against {@link ShaderCollection} before use.
 *
 * @example
 * ShaderStorage.saveShader({ folder: "basics", name: "plotter" });
 * const last = ShaderStorage.getShader();
 */
export class ShaderStorage
{
    /**
     * Persists the last selected shader.
     *
     * @param {object} shader - Shader definition to store.
     * @returns {void}
     */
    static saveShader(shader)
    {
        try
        {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(shader));
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    /**
     * Persists the last selected model id.
     *
     * @param {{id?: string}|null} model - Model metadata with id.
     * @returns {void}
     */
    static saveModelId(model)
    {
        try
        {
            if (!model || !model.id)
            {
                localStorage.removeItem(STORAGE_KEY_MODEL);
                return;
            }
            localStorage.setItem(STORAGE_KEY_MODEL, model.id);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    /**
     * Restores the last saved shader if present in the collection.
     *
     * @returns {object|null} Saved shader definition or null.
     */
    static getShader()
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved)
            {
                const shader = JSON.parse(saved);
                if (ShaderCollection.isKnown(shader))
                {
                    return shader;
                }
            }
        }
        catch (e)
        {
            // Ignore storage errors
        }
        return null;
    }

    /**
     * Restores the last saved model id if present.
     *
     * @returns {string|null} Saved model id or null.
     */
    static getModelId()
    {
        try
        {
            const saved = localStorage.getItem(STORAGE_KEY_MODEL);
            return saved || null;
        }
        catch (e)
        {
            // Ignore storage errors
        }
        return null;
    }

    /**
     * Clears any saved shader selection.
     *
     * @returns {void}
     */
    static clearShader()
    {
        try
        {
            localStorage.removeItem(STORAGE_KEY);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }

    /**
     * Clears any saved model selection.
     *
     * @returns {void}
     */
    static clearModel()
    {
        try
        {
            localStorage.removeItem(STORAGE_KEY_MODEL);
        }
        catch (e)
        {
            // Ignore storage errors
        }
    }
}
