"use strict";
import { THREE } from '../../vendor/Three.js';

// Root of the geometry object tree. Every drawable object in the studio is a
// subclass of GeometryObject. It wraps a single THREE.Object3D and centralises the
// behaviour shared by all objects (transforms, colouring, disposal). Construction
// logic that is specific to a shape is isolated inside each subclass.

export class GeometryObject
{
    /** Documentation metadata; overridden by every concrete subclass. */
    static doc = {
        name: 'object',
        category: 'Base',
        signature: 'new GeometryObject(object3D, opts?)',
        summary: 'Abstract base wrapping a THREE.Object3D.',
        example: '',
    };

    constructor(object3D, opts = {})
    {
        this.object3D = object3D;
        this.isGeometryObject = true;
        this.applyOptions(opts);
    }

    /** Apply the shared option bag: position, rotation, scale and name. */
    applyOptions(opts = {})
    {
        if (opts.position)
        {
            this.setPosition(opts.position);
        }
        if (opts.rotation)
        {
            this.setRotation(opts.rotation);
        }
        if (opts.scale != null)
        {
            this.setScale(opts.scale);
        }
        if (opts.name)
        {
            this.setName(opts.name);
        }
        return this;
    }

    setPosition(p)
    {
        this.object3D.position.copy(GeometryObject.toVec3(p));
        return this;
    }

    setRotation(r)
    {
        this.object3D.rotation.set(r[0] || 0, r[1] || 0, r[2] || 0);
        return this;
    }

    setScale(s)
    {
        if (typeof s === 'number')
        {
            this.object3D.scale.setScalar(s);
        }
        else
        {
            this.object3D.scale.copy(GeometryObject.toVec3(s));
        }
        return this;
    }

    setName(name)
    {
        this.object3D.name = name;
        return this;
    }

    /** Tint every descendant material that exposes a colour. */
    setColor(color)
    {
        this.object3D.traverse((child) =>
        {
            if (child.material && child.material.color)
            {
                child.material.color.set(color);
            }
        });
        return this;
    }

    /** Toggle wireframe on every descendant material that supports it. */
    setWireframe(on)
    {
        this.object3D.traverse((child) =>
        {
            if (child.material && 'wireframe' in child.material)
            {
                child.material.wireframe = !!on;
            }
        });
        return this;
    }

    /** Release GPU memory held by this object's geometries and materials. */
    dispose()
    {
        this.object3D.traverse((child) =>
        {
            child.geometry?.dispose?.();
            const material = child.material;
            if (Array.isArray(material))
            {
                material.forEach((m) => m?.dispose?.());
            }
            else
            {
                material?.dispose?.();
            }
        });
    }

    /** Coerce a Vector3 / array / object input into a THREE.Vector3. */
    static toVec3(p)
    {
        if (p instanceof THREE.Vector3)
        {
            return p.clone();
        }
        if (Array.isArray(p))
        {
            return new THREE.Vector3(p[0] || 0, p[1] || 0, p[2] || 0);
        }
        return new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0);
    }

    /** Build a standard PBR material from an options bag. */
    static standardMaterial(opts = {})
    {
        return new THREE.MeshStandardMaterial({
            color: opts.color ?? 0x6b8cff,
            metalness: opts.metalness ?? 0.1,
            roughness: opts.roughness ?? 0.7,
            wireframe: !!opts.wireframe,
            side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
            flatShading: !!opts.flatShading,
        });
    }
}
