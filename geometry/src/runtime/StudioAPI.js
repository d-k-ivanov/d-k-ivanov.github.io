"use strict";
import { THREE } from '../vendor/Three.js';
import { geom } from '../geometry/library/Library.js';
import { OBJECT_FACTORIES, MeshObject } from '../geometry/objects/Registry.js';
import { GeometryObject } from '../geometry/objects/GeometryObject.js';

// Builds the sandbox API object injected into user scripts. The drawing helpers are
// derived directly from the object registry, so every geometry object is exposed as
// a factory that draws into the scene and returns the created GeometryObject
// (Mathematica / Jupyter style: describe it and it appears).

export function createStudioContext({ viewer, sceneManager, loader, console })
{
    // Wrap each registered object factory so calling it adds the result to the scene
    // and returns the wrapper (allowing fluent tweaks like `box(1).setColor(...)`).
    const drawables = {};
    for (const [name, factory] of Object.entries(OBJECT_FACTORIES))
    {
        drawables[name] = (...args) => sceneManager.add(factory(...args));
    }

    // Mesh loading is special: it is asynchronous and needs the loader.
    const loadMesh = async (source, opts = {}) =>
    {
        const object3D = await loader.load(source, opts);
        const mesh = sceneManager.add(new MeshObject(object3D, opts));
        if (opts.fit !== false)
        {
            viewer.fit();
        }
        return mesh;
    };

    const print = (...args) => console.log(...args);

    return {
        // Power-user handles.
        THREE, geom, viewer, sceneManager, scene: viewer.contentGroup,
        // Output + scene control.
        console, print, log: print,
        clear: () => sceneManager.clear(),
        add: (item) => sceneManager.add(item),
        remove: (item) => sceneManager.remove(item),
        fit: () => viewer.fit(),
        // Math / construction helpers.
        color: (c) => new THREE.Color(c),
        vec3: (x, y, z) => new THREE.Vector3(x, y, z),
        toVec3: (p) => GeometryObject.toVec3(p),
        // Every drawable geometry object (box, sphere, plotFunction, plotGraph, …).
        ...drawables,
        // Mesh loading.
        loadMesh,
    };
}
