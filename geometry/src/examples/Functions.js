"use strict";
// "Functions" example group: visualising mathematical functions as curves and
// surfaces. Each entry: { name, group, description, code }.

export const FUNCTIONS = [
    {
        name: 'Function curve',
        group: 'Functions',
        description: 'Plot one or more 1D functions y = f(x).',
        code: `// Plot 1D functions y = f(x) in the XY plane.
plotFunction((x) => 2 * Math.sin(x), { start: -6, end: 6, color: 0xffd166 });
plotFunction((x) => 0.3 * x * Math.cos(x), { start: -6, end: 6, color: 0x4f9dff });

fit();
`,
    },
    {
        name: 'Parametric curve',
        group: 'Functions',
        description: 'A 3D helix traced by a parametric function f(t) → [x, y, z].',
        code: `// A 3D parametric curve (helix) using plotParametric.
plotParametric((t) => [Math.cos(t * 4), t * 0.4 - 2, Math.sin(t * 4)], {
  tMin: 0, tMax: Math.PI * 4, steps: 400, color: 0x2ecc71,
});

fit();
`,
    },
    {
        name: 'Surface',
        group: 'Functions',
        description: 'A 2D surface z = f(x, y) sampled on a grid.',
        code: `// A 2D surface z = f(x, y); the height maps to world-up (Y).
plotSurface((x, y) => Math.sin(Math.sqrt(x * x + y * y)), {
  xMin: -6, xMax: 6, yMin: -6, yMax: 6, nx: 90, ny: 90, color: 0x4f9dff,
});

fit();
`,
    },
];
