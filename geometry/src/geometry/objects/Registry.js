"use strict";
import { Box, Sphere, Cylinder, Cone, Torus, Plane } from './Primitives.js';
import { FunctionCurve, ParametricCurve, Surface } from './Plots.js';
import { Polyline, PointCloud, Graph, ConvexHull3D } from './Data.js';
import { MeshObject } from './MeshObject.js';

// Single source of truth for the geometry object tree. This catalogue drives BOTH
// the scriptable API (factories) and the reference panel (docs), so the two can
// never drift apart.

export { MeshObject };

/** Every user-constructable object class, in catalogue order. */
export const OBJECT_CLASSES = [
    Box, Sphere, Cylinder, Cone, Torus, Plane,
    FunctionCurve, ParametricCurve, Surface,
    Polyline, PointCloud, Graph, ConvexHull3D,
];

/** Map of API name → factory, e.g. `box(...)` → `new Box(...)`. */
export const OBJECT_FACTORIES = Object.fromEntries(
    OBJECT_CLASSES.map((Cls) => [Cls.doc.name, (...args) => new Cls(...args)]),
);

/** Object documentation grouped by category, for the reference panel. */
export function objectDocSections()
{
    const groups = new Map();
    const push = (doc) =>
    {
        if (!groups.has(doc.category))
        {
            groups.set(doc.category, []);
        }
        groups.get(doc.category).push(doc);
    };

    for (const Cls of OBJECT_CLASSES)
    {
        push(Cls.doc);
    }
    push(MeshObject.doc); // loadMesh is constructed from a loaded Object3D, not direct args

    return [...groups].map(([category, items]) => ({ category, items }));
}
