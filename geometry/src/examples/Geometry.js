"use strict";
// "Computational geometry" example group: convex hulls and polygon metrics that
// exercise the shared geometry library. Each entry: { name, group, description, code }.

export const GEOMETRY = [
    {
        name: 'Convex hull (2D)',
        group: 'Computational geometry',
        description: 'Random points and their 2D convex hull (geom.convexHull2D).',
        code: `// Random points and their 2D convex hull.
const pts = Array.from({ length: 40 }, () => [
  (Math.random() - 0.5) * 8,
  (Math.random() - 0.5) * 8,
]);
plotPoints(pts.map(([x, y]) => [x, y, 0]), { color: 0xff6b6b, size: 0.14 });

const hull = geom.convexHull2D(pts);
polyline([...hull, hull[0]].map((p) => [p.x, p.y, 0]), { color: 0x2ecc71 });

print('Hull vertices:', hull.length, '| area:', geom.polygonArea(hull).toFixed(2));
fit();
`,
    },
    {
        name: 'Convex hull (3D)',
        group: 'Computational geometry',
        description: 'A 3D convex hull mesh wrapping a random point cloud.',
        code: `// 3D convex hull of random points (convexHull3D).
const pts = Array.from({ length: 30 }, () => [
  (Math.random() - 0.5) * 5,
  (Math.random() - 0.5) * 5,
  (Math.random() - 0.5) * 5,
]);
plotPoints(pts, { color: 0xffd166, size: 0.12 });
convexHull3D(pts, { color: 0x8e7dff });

fit();
`,
    },
    {
        name: 'Polygon metrics',
        group: 'Computational geometry',
        description: 'Area and centroid of a polygon from the shared library.',
        code: `// Polygon area & centroid using the shared geometry library.
const poly = [[-3, -2], [3, -2], [4, 1], [0, 3], [-3, 2]];
polyline([...poly, poly[0]].map(([x, y]) => [x, y, 0]), { color: 0x4f9dff });

const c = geom.polygonCentroid(poly);
plotPoints([[c.x, c.y, 0]], { color: 0xff6b6b, size: 0.3 });

print('Area:', geom.polygonArea(poly).toFixed(2), '| centroid:', c.x.toFixed(2), c.y.toFixed(2));
fit();
`,
    },
];
