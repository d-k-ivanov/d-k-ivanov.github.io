"use strict";
// "Meshes" example group: loading 3D meshes from URLs (or local files via the
// "Load" button / drag-and-drop). Each entry: { name, group, description, code }.

export const MESHES = [
    {
        name: 'Load mesh from URL',
        group: 'Meshes',
        description: 'Fetch and display a PLY mesh from a remote URL.',
        code: `// Load a mesh from a URL. You can also drag & drop mesh files from your PC
// onto the 3D view, or open a saved script with the "Load" button.
await loadMesh(
  'https://raw.githubusercontent.com/mrdoob/three.js/r185/examples/models/ply/ascii/dolphins.ply',
  { color: 0x9cdcfe, scale: 0.05, fit: true },
);
print('Mesh loaded — drag to orbit, scroll to zoom.');
`,
    },
    {
        name: 'Mesh on a pedestal',
        group: 'Meshes',
        description: 'Combine a loaded mesh with primitives in one scene.',
        code: `// Loaded meshes coexist with generated geometry in a single scene.
plane(8, 8, { color: 0x2a2a33, rotation: [-Math.PI / 2, 0, 0] });
cylinder(1.6, 0.4, { color: 0x3a3a44, position: [0, 0.2, 0] });

await loadMesh(
  'https://raw.githubusercontent.com/mrdoob/three.js/r185/examples/models/ply/ascii/dolphins.ply',
  { color: 0xff9f43, scale: 0.04, position: [0, 0.4, 0], fit: false },
);

fit();
`,
    },
];
