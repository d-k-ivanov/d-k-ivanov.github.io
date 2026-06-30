"use strict";
import { THREE } from '../vendor/Three.js';

// Manages the user-content sub-tree of the scene: adding/removing objects,
// disposing GPU resources on removal, and framing the camera to fit everything.
// Keeping user content in a dedicated group lets us clear it without disturbing
// the viewer's lights, grid and axes.

export class SceneManager
{
    constructor(contentGroup)
    {
        this.group = contentGroup;
        this.objects = [];
    }

    add(object)
    {
        if (!object)
        {
            return object;
        }

        this.group.add(object);
        this.objects.push(object);
        return object;
    }

    remove(object)
    {
        this.group.remove(object);
        this.objects = this.objects.filter((o) => o !== object);
        SceneManager._dispose(object);
    }

    clear()
    {
        for (const object of this.objects)
        {
            this.group.remove(object);
            SceneManager._dispose(object);
        }
        this.objects = [];
    }

    count() { return this.objects.length; }

    /** Release geometry and material GPU memory for an object and its descendants. */
    static _dispose(object)
    {
        object.traverse?.((child) =>
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
