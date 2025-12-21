"use strict";

/**
 * Registry of bundled 3D models available to the shader editor.
 */
export class ModelCollection
{
    static BASE_PATH = "./models";

    static ITEMS = [
        { id: "blub", name: "blub.obj", file: "blub.obj" },
        { id: "box", name: "box.stl", file: "box.stl" },
        { id: "bunny_res3", name: "bunny_res3.ply", file: "bunny_res3.ply" },
        { id: "bunny_res4", name: "bunny_res4.ply", file: "bunny_res4.ply" },
        { id: "dragon_res4", name: "dragon_res4.ply", file: "dragon_res4.ply" },
        { id: "magnolia", name: "magnolia.stl", file: "magnolia.stl" },
        { id: "pig", name: "pig.obj", file: "pig.obj" },
        { id: "skull", name: "skull.obj", file: "skull.obj" },
        { id: "spot", name: "spot.obj", file: "spot.obj" },
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
