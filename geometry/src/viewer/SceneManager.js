"use strict";
import { THREE } from '../vendor/Three.js';

// Manages the user-content sub-tree of the scene: adding/removing objects,
// disposing GPU resources on removal, and framing the camera to fit everything.
// Keeping user content in a dedicated group lets us clear it without disturbing
// the viewer's lights, grid and axes.
//
// Items may be GeometryObject wrappers (with an `.object3D`) or raw THREE objects;
// both are accepted and tracked, and the wrapper is returned for fluent chaining.

export class SceneManager
{
    constructor(contentGroup)
    {
        this.group = contentGroup;
        this.objects = [];
    }

    add(item)
    {
        if (!item)
        {
            return item;
        }

        this.group.add(SceneManager._node(item));
        this.objects.push(item);
        return item;
    }

    remove(item)
    {
        this.group.remove(SceneManager._node(item));
        this.objects = this.objects.filter((o) => o !== item);
        SceneManager._dispose(item);
    }

    clear()
    {
        for (const item of this.objects)
        {
            this.group.remove(SceneManager._node(item));
            SceneManager._dispose(item);
        }
        this.objects = [];
    }

    count() { return this.objects.length; }

    /** Resolve the underlying THREE.Object3D for a wrapper or raw object. */
    static _node(item) { return item.object3D ?? item; }

    /** Release geometry and material GPU memory for an object and its descendants. */
    static _dispose(item)
    {
        SceneManager._node(item).traverse?.((child) =>
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

    /** Position the camera and orbit target so all content is comfortably in view. */
    fit(camera, controls, offset = 1.4)
    {
        const box = new THREE.Box3().setFromObject(this.group);
        if (box.isEmpty())
        {
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        const fitDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));

        const direction = new THREE.Vector3(1, 0.7, 1).normalize();
        camera.position.copy(center).add(direction.multiplyScalar(fitDistance * offset));
        camera.near = Math.max(maxSize / 1000, 0.01);
        camera.far = maxSize * 1000;
        camera.updateProjectionMatrix();

        if (controls)
        {
            controls.target.copy(center);
            controls.update();
        }
    }
}
