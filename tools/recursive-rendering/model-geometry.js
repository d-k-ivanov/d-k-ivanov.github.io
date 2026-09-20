import * as THREE from 'three';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const MODEL_SIZE = 2;
const MIN_UP_COHERENCE = 0.05;

export function normalizeModel(object)
{
    object.updateMatrixWorld(true);
    const modelUp = estimateModelUp(object);
    const normalized = new THREE.Group();
    normalized.add(object);

    if (modelUp)
    {
        normalized.quaternion.setFromUnitVectors(modelUp, WORLD_UP);
    }

    normalized.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(normalized);

    if (bounds.isEmpty())
    {
        throw new Error('The model contains no renderable geometry.');
    }

    const size = bounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(largestDimension) || largestDimension <= Number.EPSILON)
    {
        throw new Error('The model has invalid or zero-sized bounds.');
    }

    const center = bounds.getCenter(new THREE.Vector3());
    const scale = MODEL_SIZE / largestDimension;
    normalized.position.copy(center).multiplyScalar(-scale);
    normalized.scale.setScalar(scale);
    normalized.updateMatrixWorld(true);

    return normalized;
}

function estimateModelUp(object)
{
    const normalSum = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const vertexA = new THREE.Vector3();
    const vertexB = new THREE.Vector3();
    const vertexC = new THREE.Vector3();
    const edgeA = new THREE.Vector3();
    const edgeB = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();
    let faceCount = 0;

    // Each non-degenerate triangle gets one vote toward the model's natural up.
    object.traverse((child) =>
    {
        if (!child.isMesh)
        {
            return;
        }

        const positions = child.geometry?.getAttribute('position');

        if (!positions)
        {
            return;
        }

        const indices = child.geometry.index;
        const normals = child.geometry.getAttribute('normal');
        const elementCount = indices?.count ?? positions.count;
        normalMatrix.getNormalMatrix(child.matrixWorld);

        for (let offset = 0; offset + 2 < elementCount; offset += 3)
        {
            if (!indices && normals)
            {
                normal.fromBufferAttribute(normals, offset);
            }
            else
            {
                const indexA = indices ? indices.getX(offset) : offset;
                const indexB = indices ? indices.getX(offset + 1) : offset + 1;
                const indexC = indices ? indices.getX(offset + 2) : offset + 2;
                vertexA.fromBufferAttribute(positions, indexA);
                vertexB.fromBufferAttribute(positions, indexB);
                vertexC.fromBufferAttribute(positions, indexC);
                edgeA.subVectors(vertexB, vertexA);
                edgeB.subVectors(vertexC, vertexA);
                normal.crossVectors(edgeA, edgeB);
            }

            if (normal.lengthSq() <= Number.EPSILON)
            {
                continue;
            }

            normal.applyNormalMatrix(normalMatrix);
            normalSum.add(normal);
            faceCount++;
        }
    });

    if (faceCount === 0 || normalSum.length() / faceCount < MIN_UP_COHERENCE)
    {
        return null;
    }

    return normalSum.normalize();
}

export function disposeObject(object)
{
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    object.traverse((child) =>
    {
        if (child.geometry)
        {
            geometries.add(child.geometry);
        }

        const childMaterials = Array.isArray(child.material) ? child.material : [child.material];

        for (const material of childMaterials)
        {
            if (!material)
            {
                continue;
            }

            materials.add(material);

            for (const value of Object.values(material))
            {
                if (value?.isTexture)
                {
                    textures.add(value);
                }
            }
        }
    });

    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    geometries.forEach((geometry) => geometry.dispose());
}