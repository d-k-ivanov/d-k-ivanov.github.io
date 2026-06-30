"use strict";
import { BASICS } from './Basics.js';
import { FUNCTIONS } from './Functions.js';
import { GEOMETRY } from './Geometry.js';
import { GRAPHS } from './Graphs.js';
import { MESHES } from './Meshes.js';

// Central registry for every example. Examples live one-per-entry in grouped files;
// this module aggregates them and exposes the shapes the UI needs: a flat lookup,
// an ordered grouped list (for <optgroup> menus) and the default startup script.

/** All examples in display order. Each: { name, group, description, code }. */
export const ALL_EXAMPLES = [
    ...BASICS,
    ...FUNCTIONS,
    ...GEOMETRY,
    ...GRAPHS,
    ...MESHES,
];

/** Flat lookup by example name. */
export const EXAMPLES = Object.fromEntries(ALL_EXAMPLES.map((ex) => [ex.name, ex]));

/** Examples grouped by `group`, preserving first-seen order. */
export const EXAMPLE_GROUPS = (() =>
{
    const groups = new Map();
    for (const ex of ALL_EXAMPLES)
    {
        if (!groups.has(ex.group))
        {
            groups.set(ex.group, []);
        }
        groups.get(ex.group).push(ex);
    }
    return [...groups].map(([group, items]) => ({ group, items }));
})();

/** Script shown the first time the studio opens (no saved code yet). */
export const DEFAULT_CODE = EXAMPLES['Welcome'].code;
