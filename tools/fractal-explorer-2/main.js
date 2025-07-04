/**
 * Fractal Explorer - WebGPU Educational Application
 * Main entry point for the interactive fractal visualization tool
 * 
 * @fileoverview Initializes the application and handles global error management
 * @version 2.0.0
 * @author WebGPU Fractal Explorer Team
 */

import { Application } from './src/core/Application.js';
import { BrowserSupport } from './src/utils/BrowserSupport.js';

/**
 * Initialize the Fractal Explorer application
 * Handles WebGPU support detection and graceful fallbacks
 */
async function initializeFractalExplorer()
{
    try
    {
        // Check browser compatibility before proceeding
        const supportStatus = BrowserSupport.checkWebGPUSupport();

        if (!supportStatus.isSupported)
        {
            displayCompatibilityMessage(supportStatus);
            return;
        }

        // Initialize the main application
        const app = new Application();
        await app.initialize();

        console.log('🎨 Fractal Explorer initialized successfully');
        console.log('📊 WebGPU renderer active');
        console.log('🔧 Use keyboard shortcuts: M (modes), J (Julia), D (dual), R (reset)');

    } catch (error)
    {
        console.error('❌ Failed to initialize Fractal Explorer:', error);
        displayErrorMessage(error);
    }
}

/**
 * Display browser compatibility information
 * @param {Object} supportStatus - Browser support details
 */
function displayCompatibilityMessage(supportStatus)
{
    const container = document.body;
    container.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            ">
                <h1 style="margin: 0 0 20px 0; font-size: 2.5rem; color: #64ffda;">
                    🌀 Fractal Explorer
                </h1>
                <h2 style="margin: 0 0 30px 0; color: #ffab40; font-weight: 300;">
                    WebGPU Not Available
                </h2>
                
                <p style="margin-bottom: 25px; font-size: 1.1rem; line-height: 1.6;">
                    This interactive fractal explorer requires WebGPU support for high-performance mathematics visualization.
                </p>
                
                <div style="text-align: left; margin: 25px 0;">
                    <h3 style="color: #64ffda; margin-bottom: 15px;">🔧 Enable WebGPU:</h3>
                    <ul style="list-style: none; padding: 0;">
                        ${supportStatus.recommendations.map(rec => `
                            <li style="
                                margin: 8px 0;
                                padding: 10px;
                                background: rgba(255, 255, 255, 0.05);
                                border-radius: 8px;
                                border-left: 3px solid #64ffda;
                            ">
                                <strong style="color: #ffab40;">${rec.browser}:</strong> ${rec.instruction}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                    <p style="font-size: 0.9rem; opacity: 0.8;">
                        <strong>Note:</strong> WebGPU is cutting-edge technology still in development. 
                        Support varies by browser and platform.
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display application error message
 * @param {Error} error - The error that occurred
 */
function displayErrorMessage(error)
{
    const container = document.body;
    container.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #721e1e 0%, #982a2a 100%);
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                border: 1px solid rgba(255, 100, 100, 0.3);
            ">
                <h1 style="margin: 0 0 20px 0; font-size: 2.5rem; color: #ff6b6b;">
                    ⚠️ Application Error
                </h1>
                
                <p style="margin-bottom: 25px; font-size: 1.1rem; line-height: 1.6;">
                    The Fractal Explorer encountered an initialization error:
                </p>
                
                <div style="
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: left;
                    font-family: 'Consolas', 'Monaco', monospace;
                    font-size: 0.9rem;
                    border-left: 3px solid #ff6b6b;
                ">
                    ${error.message}
                </div>
                
                <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 20px;">
                    Please refresh the page to try again, or check the browser console for more details.
                </p>
            </div>
        </div>
    `;
}

/**
 * Enhanced page load detection for optimal initialization timing
 */
function initializeWhenReady()
{
    if (document.readyState === 'loading')
    {
        document.addEventListener('DOMContentLoaded', initializeFractalExplorer);
    } else
    {
        // Document already loaded
        initializeFractalExplorer();
    }
}

// Start the application
initializeWhenReady();
