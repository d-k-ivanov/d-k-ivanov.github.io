"use strict";

import { ShaderApp } from "./ShaderApp.js";

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
