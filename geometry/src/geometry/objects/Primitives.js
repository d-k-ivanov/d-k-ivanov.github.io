"use strict";
import { THREE } from '../../vendor/Three.js';
import { GeometryObject } from './GeometryObject.js';

// Primitive solids. Each subclass only knows how to build its own geometry; the
// shared material/transform handling lives in GeometryObject.

export class Box extends GeometryObject
{
    static doc = {
        name: 'box',
        category: 'Primitives',
        signature: 'box(width = 1, height = 1, depth = 1, opts = {})',
        summary: 'Axis-aligned rectangular box.',
        example: `box(2, 1, 1, { color: 0xff9f43, position: [0, 0.5, 0] });`,
    };

    constructor(width = 1, height = 1, depth = 1, opts = {})
    {
        super(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), GeometryObject.standardMaterial(opts)), opts);
    }
}

export class Sphere extends GeometryObject
{
    static doc = {
        name: 'sphere',
        category: 'Primitives',
        signature: 'sphere(radius = 1, opts = {})',
        summary: 'UV sphere (opts.segments controls tessellation).',
        example: `sphere(1, { color: 0x4f9dff });`,
    };

    constructor(radius = 1, opts = {})
    {
        super(new THREE.Mesh(new THREE.SphereGeometry(radius, opts.segments ?? 32, opts.segments ?? 24), GeometryObject.standardMaterial(opts)), opts);
    }
}

export class Cylinder extends GeometryObject
{
    static doc = {
        name: 'cylinder',
        category: 'Primitives',
        signature: 'cylinder(radius = 1, height = 2, opts = {})',
        summary: 'Cylinder; set opts.r2 for a tapered top radius.',
        example: `cylinder(0.7, 1.6, { color: 0x2ecc71 });`,
    };

    constructor(radius = 1, height = 2, opts = {})
    {
        super(new THREE.Mesh(new THREE.CylinderGeometry(radius, opts.r2 ?? radius, height, opts.segments ?? 32), GeometryObject.standardMaterial(opts)), opts);
    }
}

export class Cone extends GeometryObject
{
    static doc = {
        name: 'cone',
        category: 'Primitives',
        signature: 'cone(radius = 1, height = 2, opts = {})',
        summary: 'Cone with a circular base.',
        example: `cone(0.8, 1.6, { color: 0xff6b6b });`,
    };

    constructor(radius = 1, height = 2, opts = {})
    {
        super(new THREE.Mesh(new THREE.ConeGeometry(radius, height, opts.segments ?? 32), GeometryObject.standardMaterial(opts)), opts);
    }
}

export class Torus extends GeometryObject
{
    static doc = {
        name: 'torus',
        category: 'Primitives',
        signature: 'torus(radius = 1, tube = 0.35, opts = {})',
        summary: 'Torus ring.',
        example: `torus(1, 0.3, { color: 0x2ecc71 });`,
    };

    constructor(radius = 1, tube = 0.35, opts = {})
    {
        super(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, opts.radialSegments ?? 16, opts.tubularSegments ?? 64), GeometryObject.standardMaterial(opts)), opts);
    }
}

export class Plane extends GeometryObject
{
    static doc = {
        name: 'plane',
        category: 'Primitives',
        signature: 'plane(width = 5, height = 5, opts = {})',
        summary: 'Flat, double-sided plane.',
        example: `plane(4, 4, { color: 0x333344, rotation: [-Math.PI / 2, 0, 0] });`,
    };

    constructor(width = 5, height = 5, opts = {})
    {
        super(new THREE.Mesh(new THREE.PlaneGeometry(width, height), GeometryObject.standardMaterial({ doubleSide: true, ...opts })), opts);
    }
}
