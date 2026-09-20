import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { VOXLoader, buildMesh } from 'three/addons/loaders/VOXLoader.js';

const THREE_CDN_ROOT = 'https://cdn.jsdelivr.net/npm/three@0.186.0';
const SUPPORTED_EXTENSIONS = new Set(['stl', 'drc', 'draco', 'ply', 'vox', 'obj']);
const DEFAULT_MODEL_COLOR = 0xc95a3b;
const MIN_VISIBLE_COLOR = 0.03;
const MAX_ATTRIBUTE_SAMPLES = 4096;

export class ModelLoaderFactory
{
    constructor()
    {
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath(`${THREE_CDN_ROOT}/examples/jsm/libs/draco/`);

        this.stlLoader = new STLLoader();
        this.plyLoader = new PLYLoader();
        this.voxLoader = new VOXLoader();
        this.objLoader = new OBJLoader();

        this.loaders = new Map([
            ['stl', async (file) => this.createSurface(this.stlLoader.parse(await file.arrayBuffer()))],
            ['drc', async (file) => this.createDracoObject(await this.loadFromObjectUrl(file, this.dracoLoader))],
            ['draco', async (file) => this.createDracoObject(await this.loadFromObjectUrl(file, this.dracoLoader))],
            ['ply', async (file) => this.createPlyObject(this.plyLoader.parse(await file.arrayBuffer()))],
            ['vox', async (file) => this.createVoxObject(this.voxLoader.parse(await file.arrayBuffer()))],
            ['obj', async (file) => this.objLoader.parse(await file.text())]
        ]);
    }

    static extensionOf(file)
    {
        return file.name.split('.').pop()?.toLowerCase() ?? '';
    }

    static isSupported(file)
    {
        return SUPPORTED_EXTENSIONS.has(ModelLoaderFactory.extensionOf(file));
    }

    async load(file)
    {
        const extension = ModelLoaderFactory.extensionOf(file);
        const loadModel = this.loaders.get(extension);

        if (!loadModel)
        {
            throw new Error(`Unsupported model format: .${extension}`);
        }

        const object = await loadModel(file);
        ensureVisibleAppearance(object);
        return object;
    }

    async loadFromObjectUrl(file, loader)
    {
        const objectUrl = URL.createObjectURL(file);

        try
        {
            return await loader.loadAsync(objectUrl);
        }
        finally
        {
            URL.revokeObjectURL(objectUrl);
        }
    }

    createSurface(geometry)
    {
        ensureUsableNormals(geometry);

        const vertexColors = hasVisibleVertexColors(geometry);

        if (!vertexColors)
        {
            geometry.deleteAttribute('color');
        }

        const material = new THREE.MeshStandardMaterial({
            color: vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR,
            metalness: 0.05,
            roughness: 0.68,
            side: THREE.DoubleSide,
            vertexColors
        });

        return new THREE.Mesh(geometry, material);
    }

    createPointCloud(geometry)
    {
        const vertexColors = hasVisibleVertexColors(geometry);

        if (!vertexColors)
        {
            geometry.deleteAttribute('color');
        }

        const material = new THREE.PointsMaterial({
            color: vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR,
            size: 0.035,
            sizeAttenuation: true,
            vertexColors
        });

        return new THREE.Points(geometry, material);
    }

    createDracoObject(geometry)
    {
        return geometry.index ? this.createSurface(geometry) : this.createPointCloud(geometry);
    }

    createPlyObject(geometry)
    {
        return geometry.index ? this.createSurface(geometry) : this.createPointCloud(geometry);
    }

    createVoxObject(result)
    {
        if (result.scene)
        {
            return result.scene;
        }

        const group = new THREE.Group();

        for (const chunk of result.chunks)
        {
            group.add(buildMesh(chunk));
        }

        return group;
    }

    dispose()
    {
        this.dracoLoader.dispose();
    }
}

function hasVisibleVertexColors(geometry)
{
    const colors = geometry?.getAttribute('color');

    if (!colors || colors.itemSize < 3)
    {
        return false;
    }

    const step = Math.max(1, Math.floor(colors.count / MAX_ATTRIBUTE_SAMPLES));

    for (let index = 0; index < colors.count; index += step)
    {
        const brightestChannel = Math.max(colors.getX(index), colors.getY(index), colors.getZ(index));

        if (Number.isFinite(brightestChannel) && brightestChannel >= MIN_VISIBLE_COLOR)
        {
            return true;
        }
    }

    return false;
}

function ensureUsableNormals(geometry)
{
    const positions = geometry?.getAttribute('position');
    const normals = geometry?.getAttribute('normal');

    if (!positions)
    {
        return;
    }

    if (normals)
    {
        const step = Math.max(1, Math.floor(normals.count / MAX_ATTRIBUTE_SAMPLES));

        for (let index = 0; index < normals.count; index += step)
        {
            const x = normals.getX(index);
            const y = normals.getY(index);
            const z = normals.getZ(index);

            if (Number.isFinite(x + y + z) && x * x + y * y + z * z > Number.EPSILON)
            {
                return;
            }
        }

        geometry.deleteAttribute('normal');
    }

    geometry.computeVertexNormals();
}

function ensureVisibleAppearance(object)
{
    object.traverse((child) =>
    {
        if ((!child.isMesh && !child.isPoints) || !child.material)
        {
            return;
        }

        const colorAttribute = child.geometry?.getAttribute('color');
        const vertexColors = hasVisibleVertexColors(child.geometry);

        if (child.isMesh)
        {
            ensureUsableNormals(child.geometry);
        }

        if (colorAttribute && !vertexColors)
        {
            child.geometry.deleteAttribute('color');
        }

        const materials = Array.isArray(child.material) ? child.material : [child.material];

        for (const material of materials)
        {
            material.vertexColors = vertexColors;

            if (material.color)
            {
                const isBlack = Math.max(material.color.r, material.color.g, material.color.b) < MIN_VISIBLE_COLOR;

                if (isBlack || (colorAttribute && !vertexColors))
                {
                    material.color.set(vertexColors ? 0xffffff : DEFAULT_MODEL_COLOR);
                }
            }

            if (child.isMesh)
            {
                material.side = THREE.DoubleSide;
            }

            material.needsUpdate = true;
        }
    });
}