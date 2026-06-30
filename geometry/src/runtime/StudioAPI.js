"use strict";
import { THREE, ConvexGeometry } from '../vendor/Three.js';
import { geom } from '../geometry/GeometryLib.js';

// Builds the sandbox API object that is injected into user scripts. Every drawing
// helper both adds its result to the scene AND returns the created Object3D, so
// scripts read declaratively (Mathematica / Jupyter style) while still allowing
// further tweaking of the returned object.

export function createStudioContext({ viewer, sceneManager, loader, console })
{
    // ---- Internal helpers -------------------------------------------------
    const toVec3 = (p) =>
    {
        if (p instanceof THREE.Vector3) return p.clone();
        if (Array.isArray(p)) return new THREE.Vector3(p[0] || 0, p[1] || 0, p[2] || 0);
        return new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0);
    };

    const applyTransform = (object, opts = {}) =>
    {
        if (opts.position) object.position.copy(toVec3(opts.position));
        if (opts.rotation) object.rotation.set(opts.rotation[0] || 0, opts.rotation[1] || 0, opts.rotation[2] || 0);
        if (opts.scale != null)
        {
            if (typeof opts.scale === 'number') object.scale.setScalar(opts.scale);
            else object.scale.copy(toVec3(opts.scale));
        }
        if (opts.name) object.name = opts.name;
        return object;
    };

    const standardMaterial = (opts = {}) => new THREE.MeshStandardMaterial({
        color: opts.color ?? 0x6b8cff,
        metalness: opts.metalness ?? 0.1,
        roughness: opts.roughness ?? 0.7,
        wireframe: !!opts.wireframe,
        side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
        flatShading: !!opts.flatShading,
    });

    const add = (object) => sceneManager.add(object);
    const meshFrom = (geometry, opts) =>
        add(applyTransform(new THREE.Mesh(geometry, standardMaterial(opts)), opts));

    // ---- Primitives -------------------------------------------------------
    const box = (w = 1, h = 1, d = 1, opts = {}) =>
        meshFrom(new THREE.BoxGeometry(w, h, d), opts);

    const sphere = (r = 1, opts = {}) =>
        meshFrom(new THREE.SphereGeometry(r, opts.segments ?? 32, opts.segments ?? 24), opts);

    const cylinder = (r = 1, h = 2, opts = {}) =>
        meshFrom(new THREE.CylinderGeometry(r, opts.r2 ?? r, h, opts.segments ?? 32), opts);

    const cone = (r = 1, h = 2, opts = {}) =>
        meshFrom(new THREE.ConeGeometry(r, h, opts.segments ?? 32), opts);

    const torus = (r = 1, tube = 0.35, opts = {}) =>
        meshFrom(new THREE.TorusGeometry(r, tube, opts.radialSegments ?? 16, opts.tubularSegments ?? 64), opts);

    const plane = (w = 5, h = 5, opts = {}) =>
        meshFrom(new THREE.PlaneGeometry(w, h), { doubleSide: true, ...opts });

    // ---- Lines & points ---------------------------------------------------
    const polyline = (points, opts = {}) =>
    {
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(toVec3));
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: opts.color ?? 0xffffff }));
        return add(applyTransform(line, opts));
    };

    const plotPoints = (points, opts = {}) =>
    {
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(toVec3));
        const material = new THREE.PointsMaterial({
            color: opts.color ?? 0xffd166, size: opts.size ?? 0.1, sizeAttenuation: true,
        });
        return add(applyTransform(new THREE.Points(geometry, material), opts));
    };

    // ---- Function / surface plots ----------------------------------------
    const plotFunction = (f, opts = {}) =>
    {
        const { start = -5, end = 5, steps = 200 } = opts;
        const pts = geom.linspace(start, end, steps).map((x) => new THREE.Vector3(x, f(x), 0));
        return polyline(pts, opts);
    };

    const plotParametric = (f, opts = {}) =>
    {
        const { tMin = 0, tMax = Math.PI * 2, steps = 300 } = opts;
        const pts = geom.linspace(tMin, tMax, steps).map((t) => toVec3(f(t)));
        return polyline(pts, opts);
    };

    const plotSurface = (f, opts = {}) =>
    {
        const { xMin = -5, xMax = 5, yMin = -5, yMax = 5, nx = 60, ny = 60 } = opts;
        const positions = [];
        const indices = [];
        // Sample a regular grid; map function height to world-up (Y), domain to XZ.
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
        return meshFrom(geometry, { doubleSide: true, color: 0x4f9dff, ...opts });
    };

    // ---- Graphs & hulls ---------------------------------------------------
    const plotGraph = ({ nodes = [], edges = [] }, opts = {}) =>
    {
        const group = new THREE.Group();
        const vertices = nodes.map(toVec3);

        if (edges.length)
        {
            const segments = [];
            for (const [i, j] of edges) segments.push(vertices[i], vertices[j]);
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints(segments);
            group.add(new THREE.LineSegments(
                edgeGeometry, new THREE.LineBasicMaterial({ color: opts.edgeColor ?? 0x4f9dff }),
            ));
        }

        const nodeGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
        group.add(new THREE.Points(nodeGeometry, new THREE.PointsMaterial({
            color: opts.nodeColor ?? 0xffd166, size: opts.nodeSize ?? 0.2, sizeAttenuation: true,
        })));

        return add(applyTransform(group, opts));
    };

    const convexHull3D = (points, opts = {}) =>
        meshFrom(new ConvexGeometry(points.map(toVec3)), {
            doubleSide: true, flatShading: true, color: 0x8e7dff, ...opts,
        });

    // ---- Mesh loading -----------------------------------------------------
    const loadMesh = async (source, opts = {}) =>
    {
        const object = await loader.load(source, opts);
        if (opts.color != null)
        {
            const tint = new THREE.Color(opts.color);
            object.traverse((child) => { if (child.material) child.material.color = tint; });
        }
        applyTransform(object, opts);
        add(object);
        if (opts.fit !== false) viewer.fit();
        return object;
    };

    // ---- Misc helpers -----------------------------------------------------
    const print = (...args) => console.log(...args);

    return {
        // Power-user handles.
        THREE, geom, viewer, sceneManager, scene: viewer.contentGroup,
        // Output + scene control.
        console, print, log: print, clear: () => sceneManager.clear(),
        add, remove: (object) => sceneManager.remove(object), fit: () => viewer.fit(),
        // Math/util constructors.
        color: (c) => new THREE.Color(c), vec3: (x, y, z) => new THREE.Vector3(x, y, z), toVec3,
        // Primitives.
        box, sphere, cylinder, cone, torus, plane,
        // Lines, points, plots & loading.
        polyline, plotPoints, plotFunction, plotParametric, plotSurface,
        plotGraph, convexHull3D, loadMesh,
    };
}
