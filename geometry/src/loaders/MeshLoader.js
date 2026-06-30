"use strict";
import
{
    THREE,
    STLLoader,
    PLYLoader,
    OBJLoader,
    DRACOLoader,
    VOXLoader,
    VOXMesh,
} from '../vendor/Three.js';

// Loads meshes from a URL or a local File and returns a ready-to-add Three.js
// Object3D. A uniform strategy is used for every format: local files are turned
// into temporary object URLs so the same loader.load(url) path handles both
// remote and local sources.

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

export class MeshLoader
{
    constructor()
    {
        this._draco = null; // lazily created (pulls in WASM decoders)
    }

    /** Lowercase file extension parsed from a filename or URL. */
    static extensionOf(name)
    {
        const clean = String(name).split(/[?#]/)[0];
        const dot = clean.lastIndexOf('.');
        return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
    }

    static get supported() { return ['stl', 'ply', 'obj', 'drc', 'vox']; }

    /**
     * Load a mesh.
     * @param {string|File} source URL string or a File from an <input>/drag-drop.
     * @param {{ format?: string }} [options] Force a format when it can't be inferred.
     * @returns {Promise<THREE.Object3D>}
     */
    async load(source, options = {})
    {
        const isFile = typeof File !== 'undefined' && source instanceof File;
        const name = isFile ? source.name : source;
        const ext = (options.format || MeshLoader.extensionOf(name)).toLowerCase();
        const url = isFile ? URL.createObjectURL(source) : source;

        try
        {
            const object = await this._loadByExtension(ext, url);
            object.name = object.name || name;
            return object;
        } finally
        {
            if (isFile)
            {
                URL.revokeObjectURL(url);
            }
        }
    }

    _loadByExtension(ext, url)
    {
        switch (ext)
        {
            case 'stl': return this._loadGeometry(new STLLoader(), url);
            case 'ply': return this._loadGeometry(new PLYLoader(), url, true);
            case 'obj': return this._loadObject(new OBJLoader(), url);
            case 'drc': return this._loadGeometry(this._dracoLoader(), url);
            case 'vox': return this._loadVox(url);
            default:
                return Promise.reject(new Error(
                    `Unsupported mesh format ".${ext}". Supported: ${MeshLoader.supported.join(', ')}.`,
                ));
        }
    }

    _dracoLoader()
    {
        if (!this._draco)
        {
            this._draco = new DRACOLoader();
            this._draco.setDecoderPath(DRACO_DECODER_PATH);
        }
        return this._draco;
    }

    /** For loaders that resolve to a BufferGeometry: wrap it in a shaded Mesh. */
    _loadGeometry(loader, url, allowVertexColors = false)
    {
        return new Promise((resolve, reject) =>
        {
            loader.load(url, (geometry) =>
            {
                geometry.computeVertexNormals?.();
                const hasColor = allowVertexColors && !!geometry.getAttribute('color');
                const material = new THREE.MeshStandardMaterial({
                    color: hasColor ? 0xffffff : 0xb0b6c0,
                    vertexColors: hasColor,
                    metalness: 0.1,
                    roughness: 0.75,
                });
                resolve(new THREE.Mesh(geometry, material));
            }, undefined, reject);
        });
    }

    /** For loaders that already resolve to an Object3D/Group. */
    _loadObject(loader, url)
    {
        return new Promise((resolve, reject) =>
        {
            loader.load(url, resolve, undefined, reject);
        });
    }

    /** VOX resolves to an array of chunks; build a group of VOXMesh instances. */
    _loadVox(url)
    {
        return new Promise((resolve, reject) =>
        {
            new VOXLoader().load(url, (chunks) =>
            {
                const group = new THREE.Group();
                for (const chunk of chunks) group.add(new VOXMesh(chunk));
                resolve(group);
            }, undefined, reject);
        });
    }
}
