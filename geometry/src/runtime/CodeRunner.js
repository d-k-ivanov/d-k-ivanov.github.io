"use strict";
// Compiles and executes user-authored JavaScript. The studio API is injected as
// individual local variables (so scripts can call `box(...)`, `print(...)`, etc.
// directly) and an async function wrapper allows top-level `await` (e.g. for
// `await loadMesh(url)`).

export class CodeRunner
{
    constructor(api)
    {
        this.api = api;
        this.keys = Object.keys(api);
        // The AsyncFunction constructor is not a global; obtain it via a prototype.
        this.AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    }

    /**
     * Compile and run `code`. Resolves when the script finishes, rejects with the
     * thrown error (including syntax errors raised during compilation).
     */
    async run(code)
    {
        const fn = new this.AsyncFunction(...this.keys, `"use strict";\n${code}\n`);
        return fn(...this.keys.map((key) => this.api[key]));
    }
}
