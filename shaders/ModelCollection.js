"use strict";

/**
 * Registry of bundled 3D models available to the shader editor.
 */
export class ModelCollection
{
    static BASE_PATH = "./models";

    static ITEMS = [
        { id: "blub", name: "Blub", file: "blub.obj" },
        { id: "spot", name: "Spot", file: "spot.obj" }
    ];

    /**
     * Returns a model entry by id.
     */
    static getById(id)
    {
        if (!id)
        {
            return null;
        }
        return ModelCollection.ITEMS.find((model) => model.id === id) || null;
    }

    /**
     * Returns a display label for a model.
     */
    static getDisplayName(model)
    {
        return model?.name || model?.label || model?.file || "Unknown";
    }

    /**
     * Resolves the fetch URL for a model entry.
     */
    static getUrl(model)
    {
        if (!model?.file)
        {
            return null;
        }
        return `${ModelCollection.BASE_PATH}/${model.file}`;
    }
}
