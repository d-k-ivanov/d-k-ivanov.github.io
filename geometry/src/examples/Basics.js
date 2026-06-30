"use strict";
// "Basics" example group: a friendly welcome and a tour of the primitives.
// Each entry: { name, group, description, code }.

export const BASICS = [
    {
        name: 'Welcome',
        group: 'Basics',
        description: 'A few primitives and camera framing to get started.',
        code: `// Computational Geometry Studio — welcome!
// Press Ctrl+Enter (or click "Run") to evaluate this script.
// Open the "Docs" panel (top toolbar) to browse objects & library methods.

print('Hello from the Geometry Studio');

// Primitives: each call draws into the scene AND returns the created object.
sphere(1, { color: 0x4f9dff, position: [-3, 1, 0] });
box(1.5, 1.5, 1.5, { color: 0xff9f43, position: [0, 0.75, 0] });
torus(1, 0.35, { color: 0x2ecc71, position: [3, 1, 0] });

fit(); // frame the camera on all content
`,
    },
    {
        name: 'Primitive gallery',
        group: 'Basics',
        description: 'Every built-in primitive lined up side by side.',
        code: `// Every built-in primitive in a row.
box(1.2, 1.2, 1.2, { color: 0xff9f43, position: [-6, 0.6, 0] });
sphere(0.8, { color: 0x4f9dff, position: [-3, 0.8, 0] });
cylinder(0.7, 1.6, { color: 0x2ecc71, position: [0, 0.8, 0] });
cone(0.8, 1.6, { color: 0xff6b6b, position: [3, 0.8, 0] });
torus(0.7, 0.28, { color: 0x8e7dff, position: [6, 0.7, 0] });
plane(4, 4, { color: 0x3a3a44, position: [0, 0, -3], rotation: [-Math.PI / 2, 0, 0] });

fit();
`,
    },
];
