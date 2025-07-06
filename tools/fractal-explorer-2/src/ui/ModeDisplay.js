/**
 * Mode Display Component
 * Shows current render mode and provides visual feedback
 */
export class ModeDisplay
{
    constructor()
    {
        this.container = null;
        this.isVisible = true;
    }

    /**
     * Initialize the mode display
     */
    initialize()
    {
        this.createContainer();
        this.setupStyles();

        console.log('✅ Mode display initialized');
    }

    /**
     * Create the container element
     */
    createContainer()
    {
        // Remove existing container
        const existing = document.getElementById('mode-display');
        if (existing)
        {
            existing.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'mode-display';
        this.container.innerHTML = `
            <div class="mode-header">Fractal Explorer</div>
            <div class="mode-content">
                <div class="mode-current" id="current-mode">Dual View</div>
                <div class="mode-controls">
                    <div class="control-hint">
                        <span class="key">M</span> Mode
                    </div>
                    <div class="control-hint">
                        <span class="key">J</span> Julia
                    </div>
                    <div class="control-hint">
                        <span class="key">D</span> Dual
                    </div>
                    <div class="control-hint">
                        <span class="key">1-6</span> Fractals
                    </div>
                    <div class="control-hint">
                        <span class="key">R</span> Reset
                    </div>
                    <div class="control-hint">
                        <span class="key">F</span> Fullscreen
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
    }

    /**
     * Setup CSS styles
     */
    setupStyles()
    {
        const style = document.createElement('style');
        style.textContent = `
            #mode-display {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 16px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                color: #fff;
                z-index: 100;
                min-width: 180px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: opacity 0.3s ease;
            }

            .mode-header {
                font-weight: bold;
                color: #64ffda;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                text-align: center;
                font-size: 14px;
            }

            .mode-content {
                text-align: center;
            }

            .mode-current {
                font-size: 16px;
                font-weight: bold;
                color: #feca57;
                margin-bottom: 16px;
                padding: 8px;
                background: rgba(254, 202, 87, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(254, 202, 87, 0.3);
            }

            .mode-controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                font-size: 10px;
            }

            .control-hint {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding: 4px 6px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .control-hint .key {
                display: inline-block;
                min-width: 12px;
                padding: 2px 4px;
                margin-right: 6px;
                background: rgba(100, 255, 218, 0.2);
                color: #64ffda;
                border-radius: 3px;
                font-weight: bold;
                text-align: center;
                font-size: 9px;
                border: 1px solid rgba(100, 255, 218, 0.3);
            }

            .mode-julia {
                color: #ff6b6b !important;
                background: rgba(255, 107, 107, 0.1) !important;
                border-color: rgba(255, 107, 107, 0.3) !important;
            }

            .mode-mandelbrot {
                color: #4ecdc4 !important;
                background: rgba(78, 205, 196, 0.1) !important;
                border-color: rgba(78, 205, 196, 0.3) !important;
            }

            .mode-dual {
                color: #feca57 !important;
                background: rgba(254, 202, 87, 0.1) !important;
                border-color: rgba(254, 202, 87, 0.3) !important;
            }
            
            .mode-other {
                color: #a29bfe !important;
                background: rgba(162, 155, 254, 0.1) !important;
                border-color: rgba(162, 155, 254, 0.3) !important;
            }

            #mode-display.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .mode-active-view {
                font-size: 10px;
                margin-top: 8px;
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                color: #64ffda;
            }

            @media (max-width: 768px) {
                #mode-display {
                    top: 10px;
                    right: 10px;
                    padding: 12px;
                    min-width: 150px;
                }

                .mode-header {
                    font-size: 12px;
                }

                .mode-current {
                    font-size: 14px;
                }

                .mode-controls {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Update mode display with new mode information
     * @param {Object} modeData - Mode information
     */
    updateMode(modeData)
    {
        if (!this.container || !this.isVisible) return;

        const { renderMode, activeView } = modeData;
        const currentModeElement = document.getElementById('current-mode');

        if (!currentModeElement) return;

        // Clear existing mode classes
        currentModeElement.classList.remove('mode-julia', 'mode-mandelbrot', 'mode-dual', 'mode-other');

        let modeText = '';
        let modeClass = '';

        switch (renderMode)
        {
            case 'julia':
                modeText = 'Julia Set';
                modeClass = 'mode-julia';
                break;
            case 'mandelbrot':
                modeText = 'Mandelbrot Set';
                modeClass = 'mode-mandelbrot';
                break;
            case 'dual':
                modeText = 'Dual View';
                modeClass = 'mode-dual';
                break;
            case 'burning_ship':
                modeText = 'Burning Ship';
                modeClass = 'mode-other';
                break;
            case 'tricorn':
                modeText = 'Tricorn';
                modeClass = 'mode-other';
                break;
            case 'phoenix':
                modeText = 'Phoenix';
                modeClass = 'mode-other';
                break;
            case 'newton':
                modeText = 'Newton';
                modeClass = 'mode-other';
                break;
            default:
                modeText = 'Unknown Mode';
                modeClass = 'mode-unknown';
                break;
        }

        // Update mode text and styling
        currentModeElement.textContent = modeText;
        if (modeClass)
        {
            currentModeElement.classList.add(modeClass);
        }

        // Add active view indicator for dual mode
        this.updateActiveViewIndicator(renderMode, activeView);
    }

    /**
     * Update active view indicator for dual mode
     * @param {string} renderMode - Current render mode
     * @param {string} activeView - Active view in dual mode
     */
    updateActiveViewIndicator(renderMode, activeView)
    {
        // Remove existing active view indicator
        const existingIndicator = this.container.querySelector('.mode-active-view');
        if (existingIndicator)
        {
            existingIndicator.remove();
        }

        // Add active view indicator only for dual mode
        if (renderMode === 'dual' && activeView)
        {
            const indicator = document.createElement('div');
            indicator.className = 'mode-active-view';
            indicator.textContent = `Active: ${activeView === 'julia' ? 'Julia (Right)' : 'Mandelbrot (Left)'}`;

            const modeContent = this.container.querySelector('.mode-content');
            if (modeContent)
            {
                modeContent.appendChild(indicator);
            }
        }
    }

    /**
     * Show a temporary status message
     * @param {string} message - Message to show
     * @param {number} duration - Duration in milliseconds
     */
    showStatusMessage(message, duration = 2000)
    {
        // Remove existing status message
        const existingStatus = this.container.querySelector('.status-message');
        if (existingStatus)
        {
            existingStatus.remove();
        }

        // Create status message element
        const statusElement = document.createElement('div');
        statusElement.className = 'status-message';
        statusElement.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(100, 255, 218, 0.9);
            color: #000;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            animation: statusFadeIn 0.3s ease;
        `;
        statusElement.textContent = message;

        // Add CSS animation
        if (!document.getElementById('status-animation-style'))
        {
            const style = document.createElement('style');
            style.id = 'status-animation-style';
            style.textContent = `
                @keyframes statusFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes statusFadeOut {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.appendChild(statusElement);

        // Remove after duration
        setTimeout(() =>
        {
            if (statusElement.parentNode)
            {
                statusElement.style.animation = 'statusFadeOut 0.3s ease';
                setTimeout(() =>
                {
                    if (statusElement.parentNode)
                    {
                        statusElement.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Show the mode display
     */
    show()
    {
        this.isVisible = true;
        if (this.container)
        {
            this.container.classList.remove('hidden');
        }
    }

    /**
     * Hide the mode display
     */
    hide()
    {
        this.isVisible = false;
        if (this.container)
        {
            this.container.classList.add('hidden');
        }
    }

    /**
     * Toggle mode display visibility
     */
    toggle()
    {
        if (this.isVisible)
        {
            this.hide();
        } else
        {
            this.show();
        }
    }

    /**
     * Clean up the mode display
     */
    destroy()
    {
        if (this.container && this.container.parentNode)
        {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        console.log('🗑️ Mode display destroyed');
    }
}
