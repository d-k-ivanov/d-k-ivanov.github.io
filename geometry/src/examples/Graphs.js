"use strict";
// "Graphs" example group: node/edge graph visualisation in 3D.
// Each entry: { name, group, description, code }.

export const GRAPHS = [
    {
        name: 'Graph visualization',
        group: 'Graphs',
        description: 'A small graph defined by node positions and index-pair edges.',
        code: `// Visualize a small graph (nodes + edges) in 3D.
const nodes = [
  [0, 0, 0], [3, 1, 0], [1, 3, 1], [-2, 2, -1], [-3, -1, 1],
];
const edges = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [3, 4]];

plotGraph({ nodes, edges }, {
  nodeColor: 0xffd166, edgeColor: 0x4f9dff, nodeSize: 0.28,
});
fit();
`,
    },
    {
        name: 'Ring lattice',
        group: 'Graphs',
        description: 'A procedurally generated ring graph connecting nearby nodes.',
        code: `// A ring lattice: N nodes on a circle, each joined to its k nearest neighbours.
const N = 16, k = 2, radius = 4;
const nodes = Array.from({ length: N }, (_, i) =>
{
  const a = (i / N) * Math.PI * 2;
  return [Math.cos(a) * radius, Math.sin(a) * radius, 0];
});
const edges = [];
for (let i = 0; i < N; i++)
{
  for (let j = 1; j <= k; j++)
  {
    edges.push([i, (i + j) % N]);
  }
}
plotGraph({ nodes, edges }, { nodeColor: 0x2ecc71, edgeColor: 0x9cdcfe, nodeSize: 0.3 });
fit();
`,
    },
];
