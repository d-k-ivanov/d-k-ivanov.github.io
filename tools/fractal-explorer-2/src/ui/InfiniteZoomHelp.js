/**
 * Infinite Zoom Help System
 * Comprehensive guide and tutorial for infinite zoom features
 */
export class InfiniteZoomHelp
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
        console.log('🔍 Infinite zoom help system initialized - Press H for help');
    }

    /**
     * Create the help overlay
     */
    createHelpOverlay()
    {
        this.helpContainer = document.createElement('div');
        this.helpContainer.id = 'infinite-zoom-help';
        this.helpContainer.innerHTML = `
            <div class="help-backdrop"></div>
            <div class="help-panel">
                <div class="help-header">
                    <h2>🌀 Infinite Zoom Guide</h2>
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
                <h3>🎯 What is Infinite Zoom?</h3>
                <p>Infinite zoom enables exploration of fractals at extreme magnification levels using high-precision arithmetic (up to 106 bits vs standard 53 bits). This allows zooming up to 10^50+ levels while maintaining mathematical accuracy.</p>
            </div>

            <div class="help-section">
                <h3>🎮 Enhanced Controls</h3>
                <div class="controls-grid">
                    <div class="control-group">
                        <h4>Infinite Zoom Controls</h4>
                        <div class="control-item">
                            <kbd>I</kbd>
                            <span>Toggle infinite zoom mode</span>
                        </div>
                        <div class="control-item">
                            <kbd>P</kbd>
                            <span>Toggle dynamic iteration adjustment</span>
                        </div>
                        <div class="control-item">
                            <kbd>[</kbd><kbd>]</kbd>
                            <span>Fine zoom controls (0.1x steps)</span>
                        </div>
                        <div class="control-item">
                            <kbd>{</kbd><kbd>}</kbd>
                            <span>Fast zoom controls (0.5x steps)</span>
                        </div>
                        <div class="control-item">
                            <kbd>+</kbd><kbd>-</kbd>
                            <span>Standard zoom controls</span>
                        </div>
                    </div>

                    <div class="control-group">
                        <h4>Precision Navigation</h4>
                        <div class="control-item">
                            <kbd>Wheel</kbd>
                            <span>Zoom to cursor position with infinite precision</span>
                        </div>
                        <div class="control-item">
                            <kbd>Middle Click + Drag</kbd>
                            <span>High-precision panning</span>
                        </div>
                        <div class="control-item">
                            <kbd>Arrow Keys</kbd>
                            <span>Precision-adaptive navigation</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🔬 Precision Levels</h3>
                <div class="precision-levels">
                    <div class="precision-item level-0">
                        <span class="level-indicator">Level 0</span>
                        <strong>Standard (1x - 10^6)</strong>
                        <p>Double precision, optimized for speed. 53-bit precision.</p>
                    </div>
                    <div class="precision-item level-1">
                        <span class="level-indicator">Level 1</span>
                        <strong>Enhanced (10^6 - 10^12)</strong>
                        <p>Improved algorithms with enhanced color palettes.</p>
                    </div>
                    <div class="precision-item level-2">
                        <span class="level-indicator">Level 2</span>
                        <strong>High (10^12 - 10^24)</strong>
                        <p>Double-double precision (~106 bits). Automatic iteration scaling.</p>
                    </div>
                    <div class="precision-item level-3">
                        <span class="level-indicator">Level 3</span>
                        <strong>Ultra (10^24 - 10^36)</strong>
                        <p>Advanced perturbation theory. Enhanced visual algorithms.</p>
                    </div>
                    <div class="precision-item level-4">
                        <span class="level-indicator">Level 4</span>
                        <strong>Extreme (10^36 - 10^48)</strong>
                        <p>Maximum precision with sophisticated error compensation.</p>
                    </div>
                    <div class="precision-item level-5">
                        <span class="level-indicator">Level 5</span>
                        <strong>Maximum (10^48+)</strong>
                        <p>Theoretical limits of our implementation.</p>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>📊 Understanding the Display</h3>
                <div class="display-guide">
                    <div class="display-item">
                        <strong>Precision Indicator:</strong>
                        <span>Shows current precision level with color coding</span>
                    </div>
                    <div class="display-item">
                        <strong>Zoom Depth:</strong>
                        <span>Displays zoom level and power of 10 magnitude</span>
                    </div>
                    <div class="display-item">
                        <strong>Coordinate Display:</strong>
                        <span>Real-time complex coordinates with adaptive precision</span>
                    </div>
                    <div class="display-item">
                        <strong>Visual Indicators:</strong>
                        <span>⚡ for extreme zoom levels, color-coded precision levels</span>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🚀 Exploration Tips</h3>
                <div class="tips-grid">
                    <div class="tip-item">
                        <h4>🎯 Start Simple</h4>
                        <p>Begin with moderate zoom levels to understand the behavior. Use the mouse wheel to zoom smoothly toward interesting features.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🔍 Target Features</h4>
                        <p>Always zoom toward mathematical features like spiral arms, self-similar structures, or boundary regions for the most interesting results.</p>
                    </div>
                    <div class="tip-item">
                        <h4>⚡ Monitor Performance</h4>
                        <p>Watch the precision indicators and frame rate. Use performance mode if needed for very deep zooms.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🎨 Experiment with Julia</h4>
                        <p>Try different Julia constants at various zoom levels. The dual view mode helps find interesting parameter combinations.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🔄 Use Iteration Scaling</h4>
                        <p>Enable dynamic iterations (P key) to automatically adjust detail based on zoom level for optimal quality.</p>
                    </div>
                    <div class="tip-item">
                        <h4>🌌 Explore Boundaries</h4>
                        <p>The most intricate detail is often found at the boundary between the set and the escape regions.</p>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>⚠️ Troubleshooting</h3>
                <div class="troubleshooting">
                    <div class="trouble-item">
                        <strong>Performance Issues:</strong>
                        <ul>
                            <li>Disable dynamic iterations (P) if rendering becomes slow</li>
                            <li>Use performance mode for extreme zoom levels</li>
                            <li>Lower iteration counts manually if needed</li>
                        </ul>
                    </div>
                    <div class="trouble-item">
                        <strong>Visual Artifacts:</strong>
                        <ul>
                            <li>Very deep zooms may show precision limits</li>
                            <li>Reset (R) and approach the area more gradually</li>
                            <li>Try different zoom paths to the same location</li>
                        </ul>
                    </div>
                    <div class="trouble-item">
                        <strong>Navigation Issues:</strong>
                        <ul>
                            <li>Use high-precision panning (middle mouse) for precise positioning</li>
                            <li>Arrow keys provide zoom-adaptive movement</li>
                            <li>Reset if you lose context of interesting regions</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="help-section">
                <h3>🧮 Mathematical Background</h3>
                <div class="math-info">
                    <p><strong>Double-Double Precision:</strong> Uses two 64-bit floating point numbers to achieve ~106 bits of precision, enabling zoom levels beyond 10^15.</p>
                    <p><strong>Perturbation Theory:</strong> For extreme zooms, we calculate a reference orbit at high precision, then compute nearby points as small perturbations for efficiency.</p>
                    <p><strong>Adaptive Iterations:</strong> The iteration count automatically scales with zoom level to maintain detail while optimizing performance.</p>
                    <p><strong>Escape Time Algorithm:</strong> Enhanced with smooth iteration counting and variable escape radius for better quality at extreme zoom levels.</p>
                </div>
            </div>

            <div class="help-footer">
                <p>🌀 <strong>Infinite Zoom enabled:</strong> Explore the mathematical universe with unprecedented precision!</p>
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
            #infinite-zoom-help {
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
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 15px;
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

            .precision-levels {
                display: grid;
                gap: 12px;
                margin-top: 15px;
            }

            .precision-item {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                padding: 15px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.03);
                border-left: 4px solid;
            }

            .precision-item.level-0 { border-left-color: #90a4ae; }
            .precision-item.level-1 { border-left-color: #81c784; }
            .precision-item.level-2 { border-left-color: #ffb74d; }
            .precision-item.level-3 { border-left-color: #ff8a65; }
            .precision-item.level-4 { border-left-color: #f44336; }
            .precision-item.level-5 { border-left-color: #e91e63; }

            .level-indicator {
                background: rgba(100, 255, 218, 0.2);
                color: #64ffda;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                white-space: nowrap;
                min-width: 60px;
                text-align: center;
            }

            .precision-item strong {
                color: #fff;
                display: block;
                margin-bottom: 5px;
            }

            .precision-item p {
                margin: 0;
                opacity: 0.8;
                font-size: 0.9rem;
                flex: 1;
            }

            .display-guide, .tips-grid {
                display: grid;
                gap: 15px;
                margin-top: 15px;
            }

            .tips-grid {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }

            .display-item, .tip-item {
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
            console.log('📖 Infinite zoom help displayed');
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
