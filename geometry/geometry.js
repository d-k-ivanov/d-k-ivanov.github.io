"use strict";
// Entry point for the Computational Geometry Studio.
//
// This module is fully self-contained: it builds its own UI (no markup required
// in the host page) so it can be embedded anywhere. It mounts into the first
// available host: the shared `#embedded-container` wrapper (used by the site's embedded
// layout) or otherwise `document.body`, in which case it fills the page.
import { Studio } from './src/core/Studio.js';

const target = document.getElementById('embedded-container') || document.body;
const studio = new Studio().mount(target);

// Optional handle for host-page integration and debugging.
globalThis.cgStudio = studio;
