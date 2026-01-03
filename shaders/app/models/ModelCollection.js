"use strict";

/**
 * Registry of bundled 3D models available to the shader editor.
 *
 * Use this class to populate UI dropdowns and resolve URLs for bundled
 * model assets in `shaders/assets/models`.
 *
 * @example
 * const model = ModelCollection.getById("bunny_drc");
 * const url = ModelCollection.getUrl(model);
 */
export class ModelCollection
{
    static BASE_PATH = "./assets/models";

    static ITEMS = [
        { id: "blub_obj", name: "blub.obj", file: "blub.obj" },
        { id: "box_stl", name: "box.stl", file: "box.stl" },
        { id: "bunny_drc", name: "bunny.drc", file: "bunny.drc" },
        { id: "bunny_ply_res3", name: "bunny_res3.ply", file: "bunny_res3.ply" },
        { id: "bunny_ply_res4", name: "bunny_res4.ply", file: "bunny_res4.ply" },
        { id: "cube_ascii_stl", name: "cube-ascii.stl", file: "cube-ascii.stl" },
        { id: "dragon_ply_res4", name: "dragon_res4.ply", file: "dragon_res4.ply" },
        { id: "dragon_vox", name: "dragon.vox", file: "dragon.vox" },
        { id: "magnolia_bin_stl", name: "magnolia-bin.stl", file: "magnolia-bin.stl" },
        { id: "maze_vox", name: "maze.vox", file: "maze.vox" },
        { id: "menger_vox", name: "menger.vox", file: "menger.vox" },
        { id: "pig_obj", name: "pig.obj", file: "pig.obj" },
        { id: "skull_obj", name: "skull.obj", file: "skull.obj" },
        { id: "sphere_ascii_32_stl", name: "sphere-ascii-32.stl", file: "sphere-ascii-32.stl" },
        { id: "sphere_bin_4_stl", name: "sphere-bin-4.stl", file: "sphere-bin-4.stl" },
        { id: "sphere_bin_5_stl", name: "sphere-bin-5.stl", file: "sphere-bin-5.stl" },
        { id: "sphere_bin_8_stl", name: "sphere-bin-8.stl", file: "sphere-bin-8.stl" },
        { id: "sphere_bin_10_stl", name: "sphere-bin-10.stl", file: "sphere-bin-10.stl" },
        { id: "sphere_bin_12_stl", name: "sphere-bin-12.stl", file: "sphere-bin-12.stl" },
        { id: "sphere_bin_16_stl", name: "sphere-bin-16.stl", file: "sphere-bin-16.stl" },
        { id: "sphere_bin_24_stl", name: "sphere-bin-24.stl", file: "sphere-bin-24.stl" },
        { id: "sphere_bin_32_stl", name: "sphere-bin-32.stl", file: "sphere-bin-32.stl" },
        { id: "sphere_bin_48_stl", name: "sphere-bin-48.stl", file: "sphere-bin-48.stl" },
        { id: "sphere_bin_64_stl", name: "sphere-bin-64.stl", file: "sphere-bin-64.stl" },
        { id: "spot_obj", name: "spot.obj", file: "spot.obj" },
        { id: "teapot_bin_stl", name: "teapot-bin.stl", file: "teapot-bin.stl" },
        { id: "teapot_vox", name: "teapot.vox", file: "teapot.vox" },
    ];

    /**
     * Returns a model entry by id.
     *
     * @param {string} id - Model id.
     * @returns {object|null} Model entry or null.
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
     *
     * @param {object} model - Model entry.
     * @returns {string} Display name for UI.
     */
    static getDisplayName(model)
    {
        return model?.name || model?.label || model?.file || "Unknown";
    }

    /**
     * Resolves the fetch URL for a model entry.
     *
     * @param {object} model - Model entry with a `file` field.
     * @returns {string|null} Asset URL or null.
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
