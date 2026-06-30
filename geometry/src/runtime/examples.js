"use strict";
// Built-in example snippets. Shown in the editor on first launch and selectable
// from the "Examples" dropdown. Each is a self-contained script demonstrating one
// area of the studio API.

export const EXAMPLES = {
    'Welcome': `// Computational Geometry Studio — welcome!
// Press Ctrl+Enter (or click "Run") to evaluate this script.
// The scene & console are cleared on every run, so compose everything here.

print('Hello from the Geometry Studio');

// Primitives: each call draws into the scene AND returns the created object.
sphere(1, { color: 0x4f9dff, position: [-3, 1, 0] });
box(1.5, 1.5, 1.5, { color: 0xff9f43, position: [0, 0.75, 0] });
torus(1, 0.35, { color: 0x2ecc71, position: [3, 1, 0] });

fit(); // frame the camera on all content
`,

    'Function & surface': `// Plot a 1D curve y = f(x) and a 2D surface z = f(x, y).
plotFunction((x) => 2 * Math.sin(x), { start: -6, end: 6, color: 0xffd166 });

plotSurface((x, y) => Math.sin(Math.sqrt(x * x + y * y)), {
  xMin: -6, xMax: 6, yMin: -6, yMax: 6, nx: 90, ny: 90, color: 0x4f9dff,
});

fit();
`,

    'Convex hull (2D)': `// Random points and their 2D convex hull using the geometry library.
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

    'Graph visualization': `// Visualize a small graph (nodes + edges) in 3D.
const nodes = [
  [0, 0, 0], [3, 1, 0], [1, 3, 1], [-2, 2, -1], [-3, -1, 1],
];
const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [3, 4]];

plotGraph({ nodes, edges }, {
  nodeColor: 0xffd166, edgeColor: 0x4f9dff, nodeSize: 0.28,
});
fit();
`,

    'Load mesh from URL': `// Load a mesh from a URL. You can also drag & drop mesh files from your PC
// onto the 3D view, or open a saved script with the "Load" button.
await loadMesh(
  'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/ply/ascii/dolphins.ply',
  { color: 0x9cdcfe, scale: 0.05, fit: true },
);
print('Mesh loaded — drag to orbit, scroll to zoom.');
`,
};

/** Code shown the first time the studio is opened (no saved script yet). */
export const DEFAULT_CODE = EXAMPLES['Welcome'];
