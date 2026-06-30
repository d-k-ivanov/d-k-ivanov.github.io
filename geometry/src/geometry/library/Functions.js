"use strict";
// Pure, framework-independent computational geometry functions.
//
// Points may be supplied either as arrays ([x, y] / [x, y, z]) or as objects
// ({ x, y, z }). Keeping this module free of any Three.js dependency makes it a
// clean, reusable math library that can be unit tested in isolation. The public
// `geom` namespace and the documentation catalogue are assembled in Library.js.

/** Normalize a 2D point input to `{ x, y }`. */
export function toXY(p)
{
    return Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };
}

/** Normalize a 3D point input to `{ x, y, z }` (missing z defaults to 0). */
export function toXYZ(p)
{
    return Array.isArray(p)
        ? { x: p[0], y: p[1], z: p[2] ?? 0 }
        : { x: p.x, y: p.y, z: p.z ?? 0 };
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const deg2rad = (d) => (d * Math.PI) / 180;
export const rad2deg = (r) => (r * 180) / Math.PI;

/** Evenly spaced numbers over the inclusive interval [start, end]. */
export function linspace(start, end, n = 50)
{
    if (n < 2)
    {
        return [start];
    }
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
}

export function distance2D(a, b)
{
    const p = toXY(a), q = toXY(b);
    return Math.hypot(p.x - q.x, p.y - q.y);
}

export function distance3D(a, b)
{
    const p = toXYZ(a), q = toXYZ(b);
    return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}

/** Z component of (A-O) x (B-O). > 0 means O->A->B turns counter-clockwise. */
export function cross2D(o, a, b)
{
    const O = toXY(o), A = toXY(a), B = toXY(b);
    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

/**
 * Convex hull of a set of 2D points using Andrew's monotone chain — O(n log n).
 * Returns the hull vertices in counter-clockwise order as `{ x, y }`.
 */
export function convexHull2D(points)
{
    const pts = points
        .map(toXY)
        .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    if (pts.length < 3)
    {
        return pts.slice();
    }

    const buildHalf = (source) =>
    {
        const half = [];
        for (const p of source)
        {
            while (half.length >= 2 && cross2D(half[half.length - 2], half[half.length - 1], p) <= 0)
            {
                half.pop();
            }
            half.push(p);
        }
        half.pop(); // drop the last point; it is the first point of the other half
        return half;
    };

    const lower = buildHalf(pts);
    const upper = buildHalf(pts.slice().reverse());
    return lower.concat(upper);
}

/** Signed polygon area via the shoelace formula (positive when CCW). */
export function polygonArea(points)
{
    const p = points.map(toXY);
    let area = 0;
    for (let i = 0, n = p.length; i < n; i++)
    {
        const j = (i + 1) % n;
        area += p[i].x * p[j].y - p[j].x * p[i].y;
    }
    return area / 2;
}

/** Area-weighted centroid of a simple polygon. */
export function polygonCentroid(points)
{
    const p = points.map(toXY);
    let cx = 0, cy = 0, a = 0;
    for (let i = 0, n = p.length; i < n; i++)
    {
        const j = (i + 1) % n;
        const f = p[i].x * p[j].y - p[j].x * p[i].y;
        cx += (p[i].x + p[j].x) * f;
        cy += (p[i].y + p[j].y) * f;
        a += f;
    }
    a *= 0.5;
    return a === 0 ? { x: 0, y: 0 } : { x: cx / (6 * a), y: cy / (6 * a) };
}

/** Axis-aligned bounding box of a set of 3D points. */
export function boundingBox(points)
{
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const raw of points)
    {
        const p = toXYZ(raw);
        min.x = Math.min(min.x, p.x); min.y = Math.min(min.y, p.y); min.z = Math.min(min.z, p.z);
        max.x = Math.max(max.x, p.x); max.y = Math.max(max.y, p.y); max.z = Math.max(max.z, p.z);
    }
    return {
        min, max,
        size: { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z },
    };
}
