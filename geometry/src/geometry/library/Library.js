"use strict";
// Public face of the geometry library. Bundles the pure functions into the shared
// `geom` namespace (injected into user scripts) and provides `LIBRARY_DOCS` — the
// grouped documentation catalogue consumed by the reference panel. Keeping the
// metadata here, next to the namespace, keeps the docs in sync with the API.
import * as Fn from './Functions.js';

export * from './Functions.js';

/** The shared geometry namespace exposed to scripts as `geom`. */
export const geom = {
    toXY: Fn.toXY,
    toXYZ: Fn.toXYZ,
    clamp: Fn.clamp,
    lerp: Fn.lerp,
    deg2rad: Fn.deg2rad,
    rad2deg: Fn.rad2deg,
    linspace: Fn.linspace,
    distance2D: Fn.distance2D,
    distance3D: Fn.distance3D,
    cross2D: Fn.cross2D,
    convexHull2D: Fn.convexHull2D,
    polygonArea: Fn.polygonArea,
    polygonCentroid: Fn.polygonCentroid,
    boundingBox: Fn.boundingBox,
};

/** Grouped documentation for every shared library function. */
export const LIBRARY_DOCS = [
    {
        category: 'Points & vectors',
        items: [
            { name: 'toXY', signature: 'geom.toXY(p) → {x, y}', summary: 'Normalize a 2D point (array or object).', example: 'geom.toXY([1, 2])' },
            { name: 'toXYZ', signature: 'geom.toXYZ(p) → {x, y, z}', summary: 'Normalize a 3D point (z defaults to 0).', example: 'geom.toXYZ([1, 2])' },
            { name: 'distance2D', signature: 'geom.distance2D(a, b)', summary: 'Euclidean distance between two 2D points.', example: 'geom.distance2D([0, 0], [3, 4])' },
            { name: 'distance3D', signature: 'geom.distance3D(a, b)', summary: 'Euclidean distance between two 3D points.', example: 'geom.distance3D([0, 0, 0], [1, 2, 2])' },
            { name: 'cross2D', signature: 'geom.cross2D(o, a, b)', summary: 'Z of (A−O)×(B−O); its sign is the turn direction.', example: 'geom.cross2D([0, 0], [1, 0], [1, 1])' },
        ],
    },
    {
        category: 'Sampling',
        items: [
            { name: 'linspace', signature: 'geom.linspace(start, end, n = 50)', summary: 'n evenly spaced samples over [start, end].', example: 'geom.linspace(0, 1, 5)' },
        ],
    },
    {
        category: 'Scalars',
        items: [
            { name: 'clamp', signature: 'geom.clamp(v, lo, hi)', summary: 'Clamp v into the range [lo, hi].', example: 'geom.clamp(5, 0, 1)' },
            { name: 'lerp', signature: 'geom.lerp(a, b, t)', summary: 'Linear interpolation between a and b.', example: 'geom.lerp(0, 10, 0.5)' },
            { name: 'deg2rad', signature: 'geom.deg2rad(d)', summary: 'Convert degrees to radians.', example: 'geom.deg2rad(180)' },
            { name: 'rad2deg', signature: 'geom.rad2deg(r)', summary: 'Convert radians to degrees.', example: 'geom.rad2deg(Math.PI)' },
        ],
    },
    {
        category: 'Hull & polygons',
        items: [
            { name: 'convexHull2D', signature: 'geom.convexHull2D(points) → [{x, y}]', summary: '2D convex hull via Andrew’s monotone chain.', example: 'geom.convexHull2D(pts)' },
            { name: 'polygonArea', signature: 'geom.polygonArea(points)', summary: 'Signed polygon area (shoelace formula).', example: 'geom.polygonArea(poly)' },
            { name: 'polygonCentroid', signature: 'geom.polygonCentroid(points) → {x, y}', summary: 'Area-weighted polygon centroid.', example: 'geom.polygonCentroid(poly)' },
            { name: 'boundingBox', signature: 'geom.boundingBox(points) → {min, max, size}', summary: 'Axis-aligned bounds of 3D points.', example: 'geom.boundingBox(pts)' },
        ],
    },
];
