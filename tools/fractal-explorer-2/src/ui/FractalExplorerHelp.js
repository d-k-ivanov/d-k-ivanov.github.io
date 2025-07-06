/**
 * Fractal Explorer Help System
 * Comprehensive guide and tutorial for fractal exploration features
 */
export class FractalExplorerHelp
{
    constructor()
    {
        this.helpVisible = false;
        this.helpContainer = null;
    }

    /**
     * Initialize the help system
     */
    initialize()
    {
        this.createHelpOverlay();
        this.setupEventListeners();
        console.log('🔍 Fractal explorer help system initialized - Press H for help');
    }

    /**
     * Create the help overlay
     */
    createHelpOverlay()
    {
        this.helpContainer = document.createElement('div');
        this.helpContainer.id = 'fractal-explorer-help';
        this.helpContainer.innerHTML = `
            <div class="help-backdrop"></div>
            <div class="help-panel">
                <div class="help-header">
                    <h2>🌀 Fractal Explorer Guide</h2>
                    <button class="help-close" id="help-close">×</button>
                </div>
                <div class="help-content">
                    ${this.getHelpContent()}
                </div>
            </div>
        `;

        this.setupHelpStyles();
        document.body.appendChild(this.helpContainer);
    }

    /**
     * Get comprehensive help content
     * @returns {string} HTML help content
     */
    getHelpContent()
    {
        return `
            <div class="help-section">
                <h3>✨ Welcome to Fractal Explorer</h3>
                <p>Explore the infinite complexity of mathematical fractals with high-precision rendering and intuitive controls. This application supports multiple fractal types with advanced zoom capabilities and beautiful color palettes.</p>
            </div>

            <div class="help-section">
                <h3>🎨 Available Fractals</h3>
                <div class="fractals-grid">
                    <div class="fractal-item">
                        <h4>0️⃣ Dual Mode</h4>
                        <p><strong>Mandelbrot + Julia:</strong> Split screen showing both sets simultaneously. Left click on Mandelbrot to set Julia parameter.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>1️⃣ Mandelbrot Set</h4>
                        <p><strong>z² + c:</strong> The classic fractal. Points that don't escape when iterating z² + c starting from z=0.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>2️⃣ Julia Set</h4>
                        <p><strong>z² + c (fixed c):</strong> Related to Mandelbrot but starts from each point. Try different c values for varied patterns.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>3️⃣ Burning Ship</h4>
                        <p><strong>|z|² + c:</strong> Uses absolute values creating ship-like structures with unique asymmetric patterns.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>4️⃣ Tricorn</h4>
                        <p><strong>z̄² + c:</strong> Uses complex conjugate creating distinctive three-pointed structures.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>5️⃣ Phoenix</h4>
                        <p><strong>z² + c + p*z₋₁:</strong> Adds a feedback term from previous iteration for unique dynamics.</p>
                    </div>
                    <div class="fractal-item">
                        <h4>6️⃣ Newton Fractal</h4>
                        <p><strong>Newton's method:</strong> Root-finding visualization with beautiful multi-colored basins showing convergence to roots.</p>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🎮 Controls & Navigation</h3>
                <div class="controls-grid">
                    <div class="control-group">
                        <h4>Fractal Selection</h4>
                        <div class="control-item">
                            <kbd>0</kbd><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd><kbd>5</kbd><kbd>6</kbd>
                            <span>Direct fractal selection</span>
                        </div>
                        <div class="control-item">
                            <kbd>M</kbd>
                            <span>Cycle through all fractal types</span>
                        </div>
                        <div class="control-item">
                            <kbd>D</kbd>
                            <span>Toggle dual mode (Mandelbrot/Julia only)</span>
                        </div>
                        <div class="control-item">
                            <kbd>Tab</kbd>
                            <span>Switch active view in dual mode</span>
                        </div>
                    </div>

                    <div class="control-group">
                        <h4>Zoom & Navigation</h4>
                        <div class="control-item">
                            <kbd>Mouse Wheel</kbd>
                            <span>Zoom to cursor position with high precision</span>
                        </div>
                        <div class="control-item">
                            <kbd>+</kbd><kbd>-</kbd>
                            <span>Zoom in/out at center</span>
                        </div>
                        <div class="control-item">
                            <kbd>[</kbd><kbd>]</kbd>
                            <span>Fine zoom controls</span>
                        </div>
                        <div class="control-item">
                            <kbd>{</kbd><kbd>}</kbd>
                            <span>Fast zoom controls</span>
                        </div>
                        <div class="control-item">
                            <kbd>Middle Click + Drag</kbd>
                            <span>Pan the view with precision</span>
                        </div>
                        <div class="control-item">
                            <kbd>Arrow Keys</kbd>
                            <span>Keyboard navigation</span>
                        </div>
                    </div>

                    <div class="control-group">
                        <h4>Advanced Features</h4>
                        <div class="control-item">
                            <kbd>Left Click</kbd>
                            <span>Set Julia parameter (in Mandelbrot or dual mode)</span>
                        </div>
                        <div class="control-item">
                            <kbd>P</kbd>
                            <span>Toggle dynamic iteration adjustment</span>
                        </div>
                        <div class="control-item">
                            <kbd>R</kbd>
                            <span>Reset to default view</span>
                        </div>
                        <div class="control-item">
                            <kbd>F</kbd>
                            <span>Toggle fullscreen mode</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🔬 Mathematical Concepts</h3>
                <div class="math-info">
                    <p><strong>Escape Time Algorithms:</strong> Most fractals use iterative formulas. Points that "escape" to infinity are colored based on how quickly they escape, creating the beautiful patterns you see.</p>
                    <p><strong>Complex Plane:</strong> Fractals exist in the complex number plane where each pixel represents a complex number (real + imaginary components).</p>
                    <p><strong>Self-Similarity:</strong> Fractals exhibit infinite detail - zooming in reveals similar patterns at different scales, creating endless exploration opportunities.</p>
                    <p><strong>Julia and Mandelbrot Relationship:</strong> The Mandelbrot set serves as a "map" of all possible Julia sets. Each point in the Mandelbrot set corresponds to a unique Julia set pattern.</p>
                    <p><strong>Convergence Basins:</strong> In Newton fractals, different colors represent different mathematical roots that points converge to when using Newton's method.</p>
                </div>
            </div>

            <div class="help-section">
                <h3>🎨 Understanding Fractal Colors</h3>
                <div class="color-guide">
                    <div class="color-item">
                        <strong>Black Regions:</strong>
                        <span>Points that belong to the fractal set (never escape)</span>
                    </div>
                    <div class="color-item">
                        <strong>Colored Regions:</strong>
                        <span>Points that escape - color indicates how quickly they escape</span>
                    </div>
                    <div class="color-item">
                        <strong>Smooth Gradients:</strong>
                        <span>Advanced coloring creates smooth transitions without banding</span>
                    </div>
                    <div class="color-item">
                        <strong>Newton Fractal Colors:</strong>
                        <span>Different colors represent convergence to different mathematical roots</span>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🚀 Exploration Tips</h3>
                <div class="tips-grid">
                    <div class="tip-item">
                        <h4>🎯 Start with Classics</h4>
                        <p>Begin with the Mandelbrot set (key 1) to understand basic navigation. Look for the main bulb, spirals, and interesting boundary regions.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🔍 Target Boundaries</h4>
                        <p>The most intricate detail lies at the boundary between the fractal set (black) and escape regions (colored). Zoom toward these edges.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🌈 Experiment with Julia Sets</h4>
                        <p>Use dual mode (key 0) to click on different points in the Mandelbrot set and see the corresponding Julia sets. Each point creates unique patterns.</p>
                    </div>
                    <div class="tip-item">
                        <h4>⚡ Use Mouse Wheel Zoom</h4>
                        <p>Mouse wheel zooming toward interesting features is the most intuitive way to explore. The precision automatically adapts to your zoom level for smooth navigation.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🔄 Try Different Fractals</h4>
                        <p>Each fractal type (keys 1-6) has unique characteristics. The Burning Ship and Newton fractals offer very different visual experiences.</p>
                    </div>
                    <div class="tip-item">
                        <h4>📊 Enable Dynamic Iterations</h4>
                        <p>Press P to enable automatic iteration adjustment. This optimizes detail and performance as you zoom deeper.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🎯 Deep Zoom Capabilities</h4>
                        <p>This explorer supports extremely deep zooms with automatic precision scaling. Feel free to zoom as far as you want - the mathematics adapt seamlessly!</p>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>📊 Interface Elements</h3>
                <div class="interface-guide">
                    <div class="interface-item">
                        <strong>Status Messages:</strong>
                        <span>Appear at the top center showing current mode and information</span>
                    </div>
                    <div class="interface-item">
                        <strong>Coordinate Display:</strong>
                        <span>Shows real-time complex coordinates under the mouse cursor</span>
                    </div>
                    <div class="interface-item">
                        <strong>Zoom Indicators:</strong>
                        <span>Console displays zoom level milestones and precision information</span>
                    </div>
                    <div class="interface-item">
                        <strong>Julia Parameter Indicator:</strong>
                        <span>White dot in Mandelbrot view shows current Julia set parameter</span>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>⚠️ Performance & Troubleshooting</h3>
                <div class="troubleshooting">
                    <div class="trouble-item">
                        <strong>Slow Rendering:</strong>
                        <ul>
                            <li>Disable dynamic iterations (P key) for consistent performance</li>
                            <li>Try different fractal types - some render faster than others</li>
                            <li>Reset (R key) if you're at extreme zoom levels</li>
                        </ul>
                    </div>
                    <div class="trouble-item">
                        <strong>Lost or Confused:</strong>
                        <ul>
                            <li>Press R to reset to the default view</li>
                            <li>Use number keys (1-6) to switch to different fractals</li>
                            <li>Try dual mode (key 0) for a broader perspective</li>
                        </ul>
                    </div>
                    <div class="trouble-item">
                        <strong>Navigation Issues:</strong>
                        <ul>
                            <li>Use middle mouse button for precise panning</li>
                            <li>Mouse wheel zoom is more intuitive than keyboard zoom</li>
                            <li>Arrow keys provide consistent movement at all zoom levels</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="help-footer">
                <p>🌀 <strong>Mathematical Beauty:</strong> Each fractal reveals infinite complexity from simple mathematical rules!</p>
                <p>Press <kbd>H</kbd> anytime to toggle this help, or <kbd>Esc</kbd> to close.</p>
            </div>
        `;
    }

    /**
     * Setup help overlay styles
     */
    setupHelpStyles()
    {
        const style = document.createElement('style');
        style.textContent = `
            #fractal-explorer-help {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
            }

            .help-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .help-panel {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1000px;
                max-height: 90%;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }

            .help-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 30px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .help-header h2 {
                margin: 0;
                color: #64ffda;
                font-size: 1.8rem;
                font-weight: 600;
            }

            .help-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: background 0.2s;
            }

            .help-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .help-content {
                padding: 30px;
                max-height: calc(90vh - 120px);
                overflow-y: auto;
                color: #fff;
                line-height: 1.6;
            }

            .help-section {
                margin-bottom: 30px;
            }

            .help-section h3 {
                color: #64ffda;
                margin-bottom: 15px;
                font-size: 1.3rem;
                border-bottom: 1px solid rgba(100, 255, 218, 0.3);
                padding-bottom: 8px;
            }

            .controls-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-top: 15px;
            }

            .fractals-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .fractal-item {
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-left: 4px solid #64ffda;
            }

            .fractal-item h4 {
                color: #64ffda;
                margin: 0 0 8px 0;
                font-size: 1rem;
            }

            .fractal-item strong {
                color: #ffab40;
                font-size: 0.9rem;
            }

            .fractal-item p {
                margin: 8px 0 0 0;
                font-size: 0.9rem;
                opacity: 0.9;
                line-height: 1.4;
            }

            .control-group h4 {
                color: #ffab40;
                margin-bottom: 10px;
                font-size: 1.1rem;
            }

            .control-item {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                gap: 10px;
            }

            .control-item kbd {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 0.85rem;
                color: #64ffda;
                min-width: 30px;
                text-align: center;
            }

            .color-guide, .interface-guide {
                display: grid;
                gap: 15px;
                margin-top: 15px;
            }

            .color-item, .interface-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .color-item strong, .interface-item strong {
                color: #ffab40;
                min-width: 140px;
                font-size: 0.9rem;
            }

            .color-item span, .interface-item span {
                flex: 1;
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .tips-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }

            .tip-item {
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .tip-item h4 {
                color: #ffab40;
                margin: 0 0 8px 0;
                font-size: 1rem;
            }

            .tip-item p {
                margin: 0;
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .troubleshooting {
                display: grid;
                gap: 20px;
                margin-top: 15px;
            }

            .trouble-item {
                padding: 15px;
                background: rgba(255, 152, 0, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(255, 152, 0, 0.3);
            }

            .trouble-item strong {
                color: #ffab40;
                display: block;
                margin-bottom: 8px;
            }

            .trouble-item ul {
                margin: 0;
                padding-left: 20px;
            }

            .trouble-item li {
                margin-bottom: 5px;
                font-size: 0.9rem;
            }

            .math-info {
                background: rgba(100, 255, 218, 0.05);
                padding: 20px;
                border-radius: 8px;
                border: 1px solid rgba(100, 255, 218, 0.2);
                margin-top: 15px;
            }

            .math-info p {
                margin-bottom: 12px;
                font-size: 0.95rem;
            }

            .math-info strong {
                color: #64ffda;
            }

            .help-footer {
                text-align: center;
                padding: 20px;
                margin-top: 30px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .help-footer p {
                margin: 8px 0;
                font-size: 0.9rem;
            }

            @media (max-width: 768px) {
                .help-panel {
                    width: 95%;
                    margin: 20px;
                }

                .help-content {
                    padding: 20px;
                }

                .controls-grid {
                    grid-template-columns: 1fr;
                }

                .tips-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners()
    {
        // Keyboard shortcut to toggle help
        document.addEventListener('keydown', (event) =>
        {
            if (event.key === 'h' || event.key === 'H')
            {
                if (!event.ctrlKey && !event.altKey)
                {
                    this.toggleHelp();
                    event.preventDefault();
                }
            }
            if (event.key === 'Escape' && this.helpVisible)
            {
                this.hideHelp();
                event.preventDefault();
            }
        });

        // Close button
        document.addEventListener('click', (event) =>
        {
            if (event.target.id === 'help-close')
            {
                this.hideHelp();
            }
            if (event.target.classList.contains('help-backdrop'))
            {
                this.hideHelp();
            }
        });
    }

    /**
     * Toggle help visibility
     */
    toggleHelp()
    {
        if (this.helpVisible)
        {
            this.hideHelp();
        } else
        {
            this.showHelp();
        }
    }

    /**
     * Show help overlay
     */
    showHelp()
    {
        if (this.helpContainer)
        {
            this.helpContainer.style.display = 'block';
            this.helpVisible = true;
            console.log('📖 Fractal explorer help displayed');
        }
    }

    /**
     * Hide help overlay
     */
    hideHelp()
    {
        if (this.helpContainer)
        {
            this.helpContainer.style.display = 'none';
            this.helpVisible = false;
        }
    }

    /**
     * Cleanup resources
     */
    destroy()
    {
        if (this.helpContainer)
        {
            this.helpContainer.remove();
            this.helpContainer = null;
        }
        this.helpVisible = false;
    }
}
