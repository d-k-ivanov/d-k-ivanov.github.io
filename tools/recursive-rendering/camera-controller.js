import * as THREE from 'three';

export const CAMERA_ZOOM_LIMITS = Object.freeze({ min: 0.25, max: 8 });

const WHEEL_ZOOM_SENSITIVITY = 0.002;

export class CameraController
{
    constructor(requestRender)
    {
        this.requestRender = requestRender;
        this.entries = new Set();
        this.state = null;
        this.synchronizing = false;
    }

    register(camera, controls)
    {
        const entry = {
            camera,
            controls,
            handleChange: () => this.synchronizeFrom(camera, controls)
        };

        this.entries.add(entry);

        if (this.state)
        {
            this.applyState(entry);
        }
        else
        {
            this.captureState(camera, controls);
        }

        controls.addEventListener('change', entry.handleChange);
        this.requestRender();

        return () =>
        {
            controls.removeEventListener('change', entry.handleChange);
            this.entries.delete(entry);
        };
    }

    synchronizeFrom(camera, controls)
    {
        if (this.synchronizing)
        {
            return;
        }

        this.synchronizing = true;

        try
        {
            this.captureState(camera, controls);

            for (const entry of this.entries)
            {
                if (entry.camera !== camera)
                {
                    this.applyState(entry);
                }
            }
        }
        finally
        {
            this.synchronizing = false;
        }

        this.requestRender();
    }

    captureState(camera, controls)
    {
        this.state = {
            position: camera.position.clone(),
            quaternion: camera.quaternion.clone(),
            up: camera.up.clone(),
            target: controls.target.clone(),
            zoom: camera.zoom
        };
    }

    applyState({ camera, controls })
    {
        camera.position.copy(this.state.position);
        camera.quaternion.copy(this.state.quaternion);
        camera.up.copy(this.state.up);
        camera.zoom = this.state.zoom;
        controls.target.copy(this.state.target);
        camera.updateProjectionMatrix();
    }

    zoomByWheel(delta)
    {
        if (!this.state || delta === 0)
        {
            return;
        }

        const zoom = THREE.MathUtils.clamp(
            this.state.zoom * Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY),
            CAMERA_ZOOM_LIMITS.min,
            CAMERA_ZOOM_LIMITS.max
        );

        if (zoom === this.state.zoom)
        {
            return;
        }

        this.state.zoom = zoom;

        for (const { camera } of this.entries)
        {
            camera.zoom = zoom;
            camera.updateProjectionMatrix();
        }

        this.requestRender();
    }

    reset()
    {
        this.state = null;
    }
}