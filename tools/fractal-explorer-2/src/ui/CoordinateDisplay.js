/**
 * Coordinate Display Component
 * Shows real-time complex coordinate information
 */
export class CoordinateDisplay
{
    constructor()
    {
        this.container = null;
        this.isVisible = true;
    }

    /**
     * Initialize the coordinate display
     */
    initialize()
    {
        this.createContainer();
        this.setupStyles();

        console.log('✅ Coordinate display initialized');
    }

    /**
     * Create the container element
     */
    createContainer()
    {
        // Remove existing container
        const existing = document.getElementById('coordinate-display');
        if (existing)
        {
            existing.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'coordinate-display';
        this.container.innerHTML = `
            <div class="coord-header">Complex Plane</div>
            <div class="coord-content">
                <div class="coord-line">
                    <span class="coord-label">Re(z):</span>
                    <span class="coord-value" id="coord-real">0.000000</span>
                </div>
                <div class="coord-line">
                    <span class="coord-label">Im(z):</span>
                    <span class="coord-value" id="coord-imag">0.000000i</span>
                </div>
                <div class="coord-line">
                    <span class="coord-label">|z|:</span>
                    <span class="coord-value" id="coord-magnitude">0.000000</span>
                </div>
                <div class="coord-line">
                    <span class="coord-label">Zoom:</span>
                    <span class="coord-value" id="coord-zoom">1.00e+0</span>
                </div>
                <div class="coord-line infinite-zoom-info">
                    <span class="coord-label">Precision:</span>
                    <span class="coord-value" id="coord-precision">Standard</span>
                </div>
                <div class="coord-line infinite-zoom-info">
                    <span class="coord-label">Depth:</span>
                    <span class="coord-value" id="coord-zoom-depth">Level 0</span>
                </div>
                <div class="coord-separator"></div>
                <div class="coord-view-info" id="coord-view">
                    <span class="coord-label">View:</span>
                    <span class="coord-value" id="coord-current-view">Julia</span>
                </div>
                <div class="coord-julia-info" id="coord-julia-display">
                    <span class="coord-label">Julia c:</span>
                    <span class="coord-value" id="coord-julia-param">-0.7 + 0.27i</span>
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
            #coordinate-display {
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                color: #fff;
                z-index: 100;
                min-width: 200px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: opacity 0.3s ease;
            }

            .coord-header {
                font-weight: bold;
                color: #64ffda;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                text-align: center;
                font-size: 13px;
            }

            .coord-content {
                line-height: 1.6;
            }

            .coord-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .coord-label {
                color: #ff6b6b;
                font-weight: bold;
                min-width: 50px;
            }

            .coord-value {
                color: #4ecdc4;
                text-align: right;
                font-family: inherit;
            }

            .coord-separator {
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
                margin: 8px 0;
            }

            .infinite-zoom-info {
                opacity: 0.9;
                font-size: 11px;
            }

            .infinite-zoom-info .coord-label {
                color: #ffa726;
            }

            .infinite-zoom-info .coord-value {
                color: #81c784;
            }

            /* Enhanced precision level indicators */
            .precision-0 { color: #90a4ae; } /* Standard */
            .precision-1 { color: #81c784; font-weight: bold; } /* Enhanced */
            .precision-2 { color: #ffb74d; font-weight: bold; } /* High */
            .precision-3 { color: #ff8a65; font-weight: bold; text-shadow: 0 0 2px rgba(255, 138, 101, 0.4); } /* Ultra */
            .precision-4 { color: #f44336; font-weight: bold; text-shadow: 0 0 3px rgba(244, 67, 54, 0.5); } /* Extreme */
            .precision-5 { color: #e91e63; font-weight: bold; text-shadow: 0 0 4px rgba(233, 30, 99, 0.6); } /* Maximum */

            /* Enhanced depth level indicators */
            .depth-0 { color: #90a4ae; }
            .depth-1 { color: #64b5f6; }
            .depth-2 { color: #4fc3f7; }
            .depth-3 { color: #26c6da; }
            .depth-4 { color: #26a69a; }
            .depth-5 { color: #66bb6a; animation: pulse-glow 2s infinite; }

            @keyframes pulse-glow {
                0%, 100% { text-shadow: 0 0 2px currentColor; }
                50% { text-shadow: 0 0 8px currentColor, 0 0 12px currentColor; }
            }

            .precision-high {
                color: #ff9800 !important;
                font-weight: bold;
            }

            .precision-ultra {
                color: #f44336 !important;
                font-weight: bold;
                text-shadow: 0 0 3px rgba(244, 67, 54, 0.3);
            }

            .view-info {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 10px;
                opacity: 0.8;
                color: #64ffda;
            }

            .julia-info {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 10px;
            }

            .julia-info .julia-label {
                color: #feca57;
                font-weight: bold;
            }

            .julia-info .julia-value {
                color: #4ecdc4;
                font-family: inherit;
            }

            #coordinate-display.hidden {
                opacity: 0;
                pointer-events: none;
            }

            /* Tooltip for extreme zoom levels */
            .coord-value.extreme-zoom::after {
                content: " ⚡";
                color: #ffd700;
                animation: sparkle 1.5s infinite;
            }

            @keyframes sparkle {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Update coordinate display with new values
     * @param {Object} coords - Coordinate data
     */
    updateCoordinates(coords)
    {
        if (!this.container || !this.isVisible) return;

        // Add defensive check for coords object
        if (!coords || typeof coords !== 'object') {
            console.warn('Invalid coordinates data received:', coords);
            return;
        }

        const realEl = document.getElementById('coord-real');
        const imagEl = document.getElementById('coord-imag');
        const magnitudeEl = document.getElementById('coord-magnitude');
        const zoomEl = document.getElementById('coord-zoom');
        const precisionEl = document.getElementById('coord-precision');
        const depthEl = document.getElementById('coord-zoom-depth');
        const viewEl = document.getElementById('coord-current-view');
        const juliaEl = document.getElementById('coord-julia-param');

        if (realEl && coords.real !== undefined)
        {
            realEl.textContent = this.formatNumber(coords.real, coords.precision || 6);
        }

        if (imagEl && coords.imag !== undefined)
        {
            const imagValue = this.formatNumber(Math.abs(coords.imag), coords.precision || 6);
            const sign = coords.imag >= 0 ? '+' : '-';
            imagEl.textContent = `${sign}${imagValue}i`;
        }

        if (magnitudeEl && coords.magnitude !== undefined)
        {
            magnitudeEl.textContent = this.formatNumber(coords.magnitude, coords.precision || 6);
        }

        // Enhanced zoom information
        if (zoomEl && coords.zoom !== undefined)
        {
            if (coords.zoom > 1e6)
            {
                zoomEl.textContent = coords.zoom.toExponential(2);
            }
            else
            {
                zoomEl.textContent = this.formatNumber(coords.zoom, 2);
            }
        }

        // Enhanced precision information
        if (precisionEl && coords.zoomInfo)
        {
            const zoomInfo = coords.zoomInfo;
            let precisionText = zoomInfo.qualityLevel || 'Standard';

            if (zoomInfo.isHighPrecision)
            {
                precisionText += ` (${zoomInfo.estimatedPrecisionBits}bit)`;
            }

            precisionEl.textContent = precisionText;

            // Color coding for precision levels
            precisionEl.className = 'coord-value precision-' + (zoomInfo.precisionLevel || 0);
        }

        // Enhanced zoom depth information
        if (depthEl && coords.zoomInfo)
        {
            const zoomInfo = coords.zoomInfo;
            const zoomPower = zoomInfo.zoomPower || 0;

            let depthText = `Level ${zoomInfo.precisionLevel || 0}`;
            if (zoomPower > 6)
            {
                depthText += ` (10^${Math.floor(zoomPower)})`;
            }

            depthEl.textContent = depthText;

            // Color coding for depth levels
            depthEl.className = 'coord-value depth-' + Math.min(5, zoomInfo.precisionLevel || 0);
        }

        // View information
        if (viewEl && coords.activeView)
        {
            viewEl.textContent = coords.activeView.charAt(0).toUpperCase() + coords.activeView.slice(1);
        }

        // Julia parameter information
        if (juliaEl && coords.juliaC)
        {
            const realPart = this.formatNumber(coords.juliaC.real, 3);
            const imagPart = this.formatNumber(Math.abs(coords.juliaC.imag), 3);
            const sign = coords.juliaC.imag >= 0 ? '+' : '-';
            juliaEl.textContent = `${realPart} ${sign} ${imagPart}i`;
        }

        // Show/hide infinite zoom specific information
        const infiniteZoomElements = this.container.querySelectorAll('.infinite-zoom-info');
        const showInfiniteInfo = coords.zoomInfo && (coords.zoomInfo.precisionLevel > 0 || coords.zoomInfo.zoom > 1e6);

        infiniteZoomElements.forEach(el =>
        {
            el.style.display = showInfiniteInfo ? 'flex' : 'none';
        });
    }

    /**
     * Enhanced number formatting with adaptive precision
     * @param {number} num - Number to format
     * @param {number} precision - Decimal places
     * @returns {string} Formatted number
     */
    formatNumber(num, precision = 6)
    {
        // Handle invalid numbers
        if (num === undefined || num === null || isNaN(num))
        {
            return 'NaN';
        }

        if (num === 0) return '0.000000';

        const absNum = Math.abs(num);

        // For very large numbers, use exponential notation
        if (absNum >= 1e6 || absNum <= 1e-6)
        {
            return num.toExponential(precision - 1);
        }

        // For normal range numbers, use fixed precision
        if (absNum >= 1)
        {
            return num.toFixed(Math.max(0, precision - Math.floor(Math.log10(absNum)) - 1));
        }

        // For small numbers, maintain precision
        return num.toFixed(precision);
    }

    /**
     * Get the precision label based on the precision value
     * @param {number} precision - The precision value
     * @returns {string} - The label for the precision level
     */
    getPrecisionLabel(precision)
    {
        if (precision < 6) return 'Standard';
        if (precision < 10) return 'High';
        return 'Ultra';
    }

    /**
     * Update view information display
     * @param {string} renderMode - Current render mode
     * @param {string} activeView - Active view in dual mode
     */
    updateViewInfo(renderMode, activeView)
    {
        const viewInfoElement = document.getElementById('view-info');
        if (!viewInfoElement) return;

        if (renderMode === 'dual')
        {
            const currentView = activeView === 'julia' ? 'Julia' : 'Mandelbrot';
            viewInfoElement.innerHTML = `
                <div style="margin-bottom: 2px;">${currentView} View</div>
                <div style="opacity: 0.7;">Active: ${activeView === 'julia' ? 'J' : 'M'}</div>
            `;
            viewInfoElement.style.display = 'block';
        } else
        {
            viewInfoElement.style.display = 'none';
        }
    }

    /**
     * Update Julia parameter information
     * @param {string} renderMode - Current render mode
     * @param {Object} juliaParams - Julia set parameters
     */
    updateJuliaInfo(renderMode, juliaParams)
    {
        const juliaInfoElement = document.getElementById('julia-info');
        if (!juliaInfoElement) return;

        if (renderMode === 'dual' && juliaParams.c_real !== undefined && juliaParams.c_imag !== undefined)
        {
            juliaInfoElement.innerHTML = `
                <div class="julia-label">Julia Parameter:</div>
                <div class="julia-value">
                    c = ${juliaParams.c_real.toFixed(4)} + ${juliaParams.c_imag.toFixed(4)}i
                </div>
            `;
            juliaInfoElement.style.display = 'block';
        } else
        {
            juliaInfoElement.style.display = 'none';
        }
    }

    /**
     * Update infinite zoom information display
     * @param {Object} zoomInfo - Zoom information from InfiniteZoomController
     * @param {HTMLElement} precisionElement - Precision display element
     * @param {HTMLElement} depthElement - Depth display element
     * @param {number} zoomFactor - Current zoom factor
     */
    updateInfiniteZoomInfo(zoomInfo, precisionElement, depthElement, zoomFactor)
    {
        if (!precisionElement || !depthElement) return;

        // Enhanced precision display based on infinite zoom controller data
        if (zoomInfo && zoomInfo.precisionLevel !== undefined)
        {
            const { precisionLevel, isHighPrecision, magnification } = zoomInfo;

            let precisionLabel;
            let precisionClass = '';

            if (precisionLevel === 0)
            {
                precisionLabel = 'Standard';
            }
            else if (precisionLevel === 1)
            {
                precisionLabel = 'High';
                precisionClass = 'precision-high';
            }
            else if (precisionLevel >= 2)
            {
                precisionLabel = 'Ultra';
                precisionClass = 'precision-ultra';
            }

            if (isHighPrecision)
            {
                precisionLabel += ' (HP)';
            }

            precisionElement.textContent = precisionLabel;
            precisionElement.className = `coord-value ${precisionClass}`;

            // Enhanced depth display
            const depthLevel = Math.max(0, Math.floor(zoomFactor));
            depthElement.textContent = `Level ${depthLevel}`;

            if (depthLevel > 10)
            {
                depthElement.className = 'coord-value precision-high';
            }
            else if (depthLevel > 20)
            {
                depthElement.className = 'coord-value precision-ultra';
            }
            else
            {
                depthElement.className = 'coord-value';
            }
        }
        else
        {
            // Fallback to basic precision calculation
            const precision = Math.min(15, Math.max(4, Math.floor(zoomFactor) + 3));
            precisionElement.textContent = this.getPrecisionLabel(precision);
            depthElement.textContent = `Level ${Math.floor(zoomFactor)}`;
        }
    }

    /**
     * Show the coordinate display
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
     * Hide the coordinate display
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
     * Toggle coordinate display visibility
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
     * Set the position of the coordinate display
     * @param {string} position - Position ('top-left', 'top-right', 'bottom-left', 'bottom-right')
     */
    setPosition(position)
    {
        if (!this.container) return;

        // Reset all position styles
        this.container.style.top = 'auto';
        this.container.style.bottom = 'auto';
        this.container.style.left = 'auto';
        this.container.style.right = 'auto';

        switch (position)
        {
            case 'top-left':
                this.container.style.top = '20px';
                this.container.style.left = '20px';
                break;
            case 'top-right':
                this.container.style.top = '20px';
                this.container.style.right = '20px';
                break;
            case 'bottom-left':
                this.container.style.bottom = '20px';
                this.container.style.left = '20px';
                break;
            case 'bottom-right':
                this.container.style.bottom = '20px';
                this.container.style.right = '20px';
                break;
        }
    }

    /**
     * Clean up the coordinate display
     */
    destroy()
    {
        if (this.container && this.container.parentNode)
        {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        console.log('🗑️ Coordinate display destroyed');
    }
}
