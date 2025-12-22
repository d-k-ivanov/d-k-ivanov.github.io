"use strict";

import { ShaderApp } from "./app/core/ShaderApp.js";

/**
 * Bootstraps the Shader Editor experience after the DOM is ready.
 *
 * This entry point is intentionally small: it constructs {@link ShaderApp}
 * and defers all feature logic to the module tree in `shaders/app`.
 *
 * @returns {void}
 * @example
 * // The module auto-runs on DOMContentLoaded, so importing the script is enough.
 * // <script type="module" src="/shaders/main.js"></script>
 */
function initShaderApp()
{
    const app = new ShaderApp();
    app.start().catch((error) =>
    {
        app.editor.setStatus(`Init error: ${error.message}`, true);
    });
}

if (document.readyState === "loading")
{
    document.addEventListener("DOMContentLoaded", initShaderApp, { once: true });
}
else
{
    initShaderApp();
}
