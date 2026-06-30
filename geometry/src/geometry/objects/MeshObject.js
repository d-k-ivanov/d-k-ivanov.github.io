"use strict";
import { GeometryObject } from './GeometryObject.js';

// Wraps a mesh loaded from a file/URL (STL, PLY, OBJ, DRC, VOX) so that loaded
// content behaves like any other geometry object. The actual decoding is done by
// MeshLoader; this class only adopts the resulting Object3D and applies options.

export class MeshObject extends GeometryObject
{
    static doc = {
        name: 'loadMesh',
        category: 'Meshes',
        signature: 'await loadMesh(urlOrFile, { color, scale, position, fit } = {})',
        summary: 'Load a mesh (STL, PLY, OBJ, DRC, VOX) from a URL or local File.',
        example: `await loadMesh('model.stl', { color: 0x9cdcfe, fit: true });`,
    };

    constructor(object3D, opts = {})
    {
        super(object3D, opts);
        if (opts.color != null)
        {
            this.setColor(opts.color);
        }
    }
}
