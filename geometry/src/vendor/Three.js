"use strict";
// Vendored Three.js entrypoint.
//
// A single, version-pinned module that re-exports the Three.js core plus every
// addon the app uses. Loading everything through one module guarantees the whole
// application shares ONE Three.js instance (essential for `instanceof` checks and
// for addons that internally `import 'three'`).
//
// Delivered via esm.sh so no bundler or package manager is required: esm.sh
// rewrites the addons' bare `three` imports to the same pinned core below.

import * as THREE from 'https://esm.sh/three@0.160.0';

export { THREE };

// Camera controls.
export { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// Mesh format loaders.
export { STLLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader.js';
export { PLYLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/PLYLoader.js';
export { OBJLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js';
export { DRACOLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
export { VOXLoader, VOXMesh } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/VOXLoader.js';

// Geometry helpers used by the studio API.
export { ConvexGeometry } from 'https://esm.sh/three@0.160.0/examples/jsm/geometries/ConvexGeometry.js';
