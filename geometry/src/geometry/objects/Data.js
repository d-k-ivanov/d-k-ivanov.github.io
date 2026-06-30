"use strict";
import { THREE, ConvexGeometry } from '../../vendor/Three.js';
import { GeometryObject } from './GeometryObject.js';

// Data-driven and computational-geometry objects: raw point sets, polylines,
// node/edge graphs and 3D convex hulls.

export class Polyline extends GeometryObject
{
    static doc = {
        name: 'polyline',
        category: 'Data & computational',
        signature: 'polyline(points, { color } = {})',
        summary: 'Connect an ordered list of points with a line.',
        example: `polyline([[0, 0, 0], [1, 2, 0], [3, 1, 0]], { color: 0x2ecc71 });`,
    };

    constructor(points, opts = {})
    {
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(GeometryObject.toVec3));
        super(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: opts.color ?? 0xffffff })), opts);
    }
}

export class PointCloud extends GeometryObject
{
    static doc = {
        name: 'plotPoints',
        category: 'Data & computational',
        signature: 'plotPoints(points, { color, size = 0.1 } = {})',
        summary: 'Render a set of points as a point cloud.',
        example: `plotPoints([[0, 0, 0], [1, 1, 0], [2, 0, 1]], { color: 0xffd166, size: 0.15 });`,
    };

    constructor(points, opts = {})
    {
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(GeometryObject.toVec3));
        const material = new THREE.PointsMaterial({ color: opts.color ?? 0xffd166, size: opts.size ?? 0.1, sizeAttenuation: true });
        super(new THREE.Points(geometry, material), opts);
    }
}

export class Graph extends GeometryObject
{
    static doc = {
        name: 'plotGraph',
        category: 'Data & computational',
        signature: 'plotGraph({ nodes, edges }, { nodeColor, edgeColor, nodeSize } = {})',
        summary: 'Render a graph: node positions plus index-pair edges.',
        example: `plotGraph({ nodes: [[0, 0, 0], [2, 1, 0]], edges: [[0, 1]] }, { nodeSize: 0.25 });`,
    };

    constructor({ nodes = [], edges = [] } = {}, opts = {})
    {
        super(Graph._build(nodes, edges, opts), opts);
    }

    static _build(nodes, edges, opts)
    {
        const group = new THREE.Group();
        const vertices = nodes.map(GeometryObject.toVec3);

        if (edges.length)
        {
            const segments = [];
            for (const [i, j] of edges)
            {
                segments.push(vertices[i], vertices[j]);
            }
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints(segments);
            group.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: opts.edgeColor ?? 0x4f9dff })));
        }

        const nodeGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
        group.add(new THREE.Points(nodeGeometry, new THREE.PointsMaterial({
            color: opts.nodeColor ?? 0xffd166, size: opts.nodeSize ?? 0.2, sizeAttenuation: true,
        })));

        return group;
    }
}

export class ConvexHull3D extends GeometryObject
{
    static doc = {
        name: 'convexHull3D',
        category: 'Data & computational',
        signature: 'convexHull3D(points, { color, wireframe } = {})',
        summary: '3D convex hull mesh enclosing the given points.',
        example: `convexHull3D(pts, { color: 0x8e7dff });`,
    };

    constructor(points, opts = {})
    {
        const geometry = new ConvexGeometry(points.map(GeometryObject.toVec3));
        super(new THREE.Mesh(geometry, GeometryObject.standardMaterial({ doubleSide: true, flatShading: true, color: 0x8e7dff, ...opts })), opts);
    }
}
