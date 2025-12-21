"use strict";

import { ShaderApp } from "./app/ShaderApp.js";

/**
 * Bootstraps the Shader Editor experience after the DOM is ready.
 * Keeps the entry file minimal while the app logic lives in ShaderApp.
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
