"use strict";
import { THREE } from '../../vendor/Three.js';
import { GeometryObject } from './GeometryObject.js';
import { geom } from '../library/Library.js';

// Objects that visualise mathematical functions: 1D curves, 3D parametric curves
// and 2D surfaces. The sampling logic specific to each plot type is isolated in
// its own class.

export class FunctionCurve extends GeometryObject
{
    static doc = {
        name: 'plotFunction',
        category: 'Plots',
        signature: 'plotFunction(f, { start = -5, end = 5, steps = 200, color } = {})',
        summary: 'Plot y = f(x) as a curve in the XY plane.',
        example: `plotFunction((x) => 2 * Math.sin(x), { start: -6, end: 6, color: 0xffd166 });`,
    };

    constructor(f, opts = {})
    {
        const { start = -5, end = 5, steps = 200 } = opts;
        const points = geom.linspace(start, end, steps).map((x) => new THREE.Vector3(x, f(x), 0));
        super(FunctionCurve._line(points, opts), opts);
    }

    static _line(points, opts)
    {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: opts.color ?? 0xffffff }));
    }
}

export class ParametricCurve extends GeometryObject
{
    static doc = {
        name: 'plotParametric',
        category: 'Plots',
        signature: 'plotParametric(f, { tMin = 0, tMax = 2π, steps = 300, color } = {})',
        summary: 'Plot a 3D parametric curve f(t) → [x, y, z].',
        example: `plotParametric((t) => [Math.cos(t * 4), t * 0.4, Math.sin(t * 4)], { tMin: 0, tMax: 12, color: 0x2ecc71 });`,
    };

    constructor(f, opts = {})
    {
        const { tMin = 0, tMax = Math.PI * 2, steps = 300 } = opts;
        const points = geom.linspace(tMin, tMax, steps).map((t) => GeometryObject.toVec3(f(t)));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        super(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: opts.color ?? 0xffffff })), opts);
    }
}

export class Surface extends GeometryObject
{
    static doc = {
        name: 'plotSurface',
        category: 'Plots',
        signature: 'plotSurface(f, { xMin, xMax, yMin, yMax, nx = 60, ny = 60, color } = {})',
        summary: 'Plot z = f(x, y) as a surface (height along world-up Y).',
        example: `plotSurface((x, y) => Math.sin(Math.sqrt(x * x + y * y)), { xMin: -6, xMax: 6, yMin: -6, yMax: 6 });`,
    };

    constructor(f, opts = {})
    {
        super(Surface._build(f, opts), opts);
    }

    /** Sample a regular grid; map function height to Y and the domain to the XZ plane. */
    static _build(f, opts)
    {
        const { xMin = -5, xMax = 5, yMin = -5, yMax = 5, nx = 60, ny = 60 } = opts;
        const positions = [];
        const indices = [];

        for (let j = 0; j <= ny; j++)
        {
            const y = yMin + ((yMax - yMin) * j) / ny;
            for (let i = 0; i <= nx; i++)
            {
                const x = xMin + ((xMax - xMin) * i) / nx;
                positions.push(x, f(x, y), y);
            }
        }
        for (let j = 0; j < ny; j++)
        {
            for (let i = 0; i < nx; i++)
            {
                const a = j * (nx + 1) + i;
                const b = a + 1;
                const c = a + (nx + 1);
                const d = c + 1;
                indices.push(a, c, b, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry, GeometryObject.standardMaterial({ doubleSide: true, color: 0x4f9dff, ...opts }));
    }
}
