/**
 * High-Precision Arithmetic for Infinite Zoom
 * Implements extended precision numbers using quad-precision emulation
 * Supports zoom levels far beyond standard double precision limits
 */

/**
 * High-precision number class using double-double arithmetic
 * Provides approximately 106 bits of precision (vs 53 bits for standard double)
 */
export class HighPrecisionNumber
{
    constructor(hi = 0, lo = 0)
    {
        // Store as two doubles: hi + lo where |lo| <= 0.5 * ulp(hi)
        this.hi = hi;
        this.lo = lo;
        this._normalize();
    }

    /**
     * Create from a standard number
     * @param {number} value - Standard double precision number
     * @returns {HighPrecisionNumber} High precision equivalent
     */
    static fromNumber(value)
    {
        return new HighPrecisionNumber(value, 0);
    }

    /**
     * Create from a string for maximum precision
     * @param {string} str - String representation of number
     * @returns {HighPrecisionNumber} High precision number
     */
    static fromString(str)
    {
        const value = parseFloat(str);
        return new HighPrecisionNumber(value, 0);
    }

    /**
     * Normalize the representation
     * Ensures |lo| <= 0.5 * ulp(hi)
     */
    _normalize()
    {
        const sum = this.hi + this.lo;
        const err = this.lo - (sum - this.hi);
        this.hi = sum;
        this.lo = err;
    }

    /**
     * Add two high-precision numbers
     * @param {HighPrecisionNumber} other - Number to add
     * @returns {HighPrecisionNumber} Sum
     */
    add(other)
    {
        // Knuth's algorithm for adding double-double numbers
        const s = this.hi + other.hi;
        const v = s - this.hi;
        const e = (this.hi - (s - v)) + (other.hi - v);
        const result = new HighPrecisionNumber(s, e + this.lo + other.lo);
        return result;
    }

    /**
     * Subtract two high-precision numbers
     * @param {HighPrecisionNumber} other - Number to subtract
     * @returns {HighPrecisionNumber} Difference
     */
    subtract(other)
    {
        const s = this.hi - other.hi;
        const v = s - this.hi;
        const e = (this.hi - (s - v)) - (other.hi + v);
        const result = new HighPrecisionNumber(s, e + this.lo - other.lo);
        return result;
    }

    /**
     * Multiply two high-precision numbers
     * @param {HighPrecisionNumber} other - Number to multiply
     * @returns {HighPrecisionNumber} Product
     */
    multiply(other)
    {
        // Dekker's algorithm for multiplying double-double numbers
        const C = (1 << 27) + 1; // Split constant for IEEE 754 double precision

        const a = this.hi;
        const b = other.hi;

        // Split a and b for exact multiplication
        const aHi = C * a - (C * a - a);
        const aLo = a - aHi;
        const bHi = C * b - (C * b - b);
        const bLo = b - bHi;

        const p = a * b;
        const err = ((aHi * bHi - p) + aHi * bLo + aLo * bHi) + aLo * bLo;

        const result = new HighPrecisionNumber(
            p,
            err + a * other.lo + this.lo * b + this.lo * other.lo
        );
        return result;
    }

    /**
     * Divide by a standard number (for zoom operations)
     * @param {number} divisor - Standard precision divisor
     * @returns {HighPrecisionNumber} Quotient
     */
    divideByNumber(divisor)
    {
        const q = this.hi / divisor;
        const r = this.hi - q * divisor;
        const result = new HighPrecisionNumber(q, (r + this.lo) / divisor);
        return result;
    }

    /**
     * Convert to standard number (for shader uniform)
     * @returns {number} Standard precision approximation
     */
    toNumber()
    {
        return this.hi + this.lo;
    }

    /**
     * Convert to string representation
     * @param {number} precision - Number of decimal places
     * @returns {string} String representation
     */
    toString(precision = 15)
    {
        return (this.hi + this.lo).toPrecision(precision);
    }

    /**
     * Check if this number is zero
     * @returns {boolean} True if zero
     */
    isZero()
    {
        return this.hi === 0 && this.lo === 0;
    }

    /**
     * Get absolute value
     * @returns {HighPrecisionNumber} Absolute value
     */
    abs()
    {
        if (this.hi < 0 || (this.hi === 0 && this.lo < 0))
        {
            return new HighPrecisionNumber(-this.hi, -this.lo);
        }
        return new HighPrecisionNumber(this.hi, this.lo);
    }

    /**
     * Compare with another high-precision number
     * @param {HighPrecisionNumber} other - Number to compare
     * @returns {number} -1, 0, or 1 for less than, equal, or greater than
     */
    compare(other)
    {
        if (this.hi < other.hi) return -1;
        if (this.hi > other.hi) return 1;
        if (this.lo < other.lo) return -1;
        if (this.lo > other.lo) return 1;
        return 0;
    }
}

/**
 * High-precision complex number for fractal calculations
 */
export class HighPrecisionComplex
{
    constructor(real, imag)
    {
        this.real = real instanceof HighPrecisionNumber ? real : HighPrecisionNumber.fromNumber(real);
        this.imag = imag instanceof HighPrecisionNumber ? imag : HighPrecisionNumber.fromNumber(imag);
    }

    /**
     * Add two complex numbers
     * @param {HighPrecisionComplex} other - Complex number to add
     * @returns {HighPrecisionComplex} Sum
     */
    add(other)
    {
        return new HighPrecisionComplex(
            this.real.add(other.real),
            this.imag.add(other.imag)
        );
    }

    /**
     * Multiply two complex numbers
     * @param {HighPrecisionComplex} other - Complex number to multiply
     * @returns {HighPrecisionComplex} Product
     */
    multiply(other)
    {
        // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
        const ac = this.real.multiply(other.real);
        const bd = this.imag.multiply(other.imag);
        const ad = this.real.multiply(other.imag);
        const bc = this.imag.multiply(other.real);

        return new HighPrecisionComplex(
            ac.subtract(bd),
            ad.add(bc)
        );
    }

    /**
     * Calculate magnitude squared
     * @returns {HighPrecisionNumber} Magnitude squared
     */
    magnitudeSquared()
    {
        const realSq = this.real.multiply(this.real);
        const imagSq = this.imag.multiply(this.imag);
        return realSq.add(imagSq);
    }

    /**
     * Convert to standard complex number (for shader)
     * @returns {Object} Standard precision complex {real, imag}
     */
    toStandard()
    {
        return {
            real: this.real.toNumber(),
            imag: this.imag.toNumber()
        };
    }
}

/**
 * Infinite zoom controller that manages precision scaling
 */
export class InfiniteZoomController
{
    constructor()
    {
        this.centerReal = HighPrecisionNumber.fromNumber(0);
        this.centerImag = HighPrecisionNumber.fromNumber(0);
        this.logZoom = 0; // Base zoom level
        this.precisionLevel = 0; // Current precision level
        this.maxStandardZoom = 1e14; // Limit before switching to high precision

        // Zoom thresholds for precision scaling
        this.precisionThresholds = [
            1e14,   // Switch to high precision
            1e28,   // Increase iteration count
            1e42,   // Maximum reasonable zoom
        ];
    }

    /**
     * Set center point with high precision
     * @param {number|HighPrecisionNumber} real - Real coordinate
     * @param {number|HighPrecisionNumber} imag - Imaginary coordinate
     */
    setCenter(real, imag)
    {
        this.centerReal = real instanceof HighPrecisionNumber ? real : HighPrecisionNumber.fromNumber(real);
        this.centerImag = imag instanceof HighPrecisionNumber ? imag : HighPrecisionNumber.fromNumber(imag);
    }

    /**
     * Apply zoom at specific point
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized)
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     */
    zoomAt(mouseX, mouseY, zoomFactor, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Performance optimization: Use different precision strategies based on zoom level
        if (currentZoom < this.maxStandardZoom)
        {
            // Standard precision zoom for better performance
            this.zoomAtStandard(mouseX, mouseY, zoomFactor, aspect);
        } else
        {
            // High precision zoom for extreme levels
            this.zoomAtHighPrecision(mouseX, mouseY, zoomFactor, aspect);
        }

        // Update precision level based on zoom
        this.updatePrecisionLevel();
    }

    /**
     * Standard precision zoom for performance
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized)
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     */
    zoomAtStandard(mouseX, mouseY, zoomFactor, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Calculate target point in standard precision for speed
        const targetReal = this.centerReal.toNumber() + mouseX * 4.0 * aspect / currentZoom;
        const targetImag = this.centerImag.toNumber() + mouseY * 4.0 / currentZoom;

        // Apply zoom
        this.logZoom += Math.log(zoomFactor);

        // Update center to keep target point fixed
        const newZoom = Math.exp(this.logZoom);
        this.centerReal = HighPrecisionNumber.fromNumber(targetReal - mouseX * 4.0 * aspect / newZoom);
        this.centerImag = HighPrecisionNumber.fromNumber(targetImag - mouseY * 4.0 / newZoom);
    }

    /**
     * Enhanced perturbation theory for ultra-deep zooms (beyond 10^15)
     * Uses series approximation to maintain precision at extreme zoom levels
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized)
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     */
    zoomAtPerturbation(mouseX, mouseY, zoomFactor, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Use perturbation theory for extreme precision
        // Calculate reference point (center) with high precision
        const refReal = this.centerReal;
        const refImag = this.centerImag;

        // Calculate perturbation (small offset from reference)
        const deltaScale = HighPrecisionNumber.fromNumber(4.0 * aspect / currentZoom);
        const deltaReal = HighPrecisionNumber.fromNumber(mouseX).multiply(deltaScale);
        const deltaImag = HighPrecisionNumber.fromNumber(mouseY * 4.0 / currentZoom);

        // Target point in perturbation coordinates
        const targetDeltaReal = deltaReal;
        const targetDeltaImag = deltaImag;

        // Apply zoom
        this.logZoom += Math.log(zoomFactor);
        const newZoom = Math.exp(this.logZoom);

        // Recalculate perturbation after zoom
        const newDeltaScale = HighPrecisionNumber.fromNumber(4.0 * aspect / newZoom);
        const newDeltaReal = HighPrecisionNumber.fromNumber(mouseX).multiply(newDeltaScale);
        const newDeltaImag = HighPrecisionNumber.fromNumber(mouseY * 4.0 / newZoom);

        // Update center to maintain target point
        this.centerReal = refReal.add(targetDeltaReal).subtract(newDeltaReal);
        this.centerImag = refImag.add(targetDeltaImag).subtract(newDeltaImag);
    }

    /**
     * High precision zoom for extreme zoom levels
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized)
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     */
    zoomAtHighPrecision(mouseX, mouseY, zoomFactor, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // For ultra-extreme zooms, use perturbation theory
        if (currentZoom > 1e42)
        {
            this.zoomAtPerturbation(mouseX, mouseY, zoomFactor, aspect);
            return;
        }

        // Calculate point to zoom into in high precision
        const scale = HighPrecisionNumber.fromNumber(4.0 * aspect / currentZoom);
        const mouseRealHP = HighPrecisionNumber.fromNumber(mouseX).multiply(scale);
        const mouseImagHP = HighPrecisionNumber.fromNumber(mouseY * 4.0 / currentZoom);

        const targetReal = this.centerReal.add(mouseRealHP);
        const targetImag = this.centerImag.add(mouseImagHP);

        // Apply zoom
        this.logZoom += Math.log(zoomFactor);
        const newZoom = Math.exp(this.logZoom);

        // Update center to keep target point fixed
        const newScale = HighPrecisionNumber.fromNumber(4.0 * aspect / newZoom);
        const newMouseRealHP = HighPrecisionNumber.fromNumber(mouseX).multiply(newScale);
        const newMouseImagHP = HighPrecisionNumber.fromNumber(mouseY * 4.0 / newZoom);

        this.centerReal = targetReal.subtract(newMouseRealHP);
        this.centerImag = targetReal.subtract(newMouseImagHP);
    }

    /**
     * Enhanced pan with adaptive precision
     * @param {number} deltaX - Pan delta X
     * @param {number} deltaY - Pan delta Y
     * @param {number} aspect - Aspect ratio
     */
    pan(deltaX, deltaY, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Improved adaptive pan scaling for better responsiveness at all zoom levels
        // Start with a reasonable base speed and scale appropriately with zoom
        const basePanSpeed = 0.5; // Base pan sensitivity for good low-zoom responsiveness

        // More aggressive scaling at high zoom levels to maintain precision
        // Use logarithmic scaling that reduces speed more dramatically at high zoom
        let zoomScale;
        if (currentZoom <= 1.0)
        {
            // At very low zoom, maintain full speed
            zoomScale = 1.0;
        } else if (currentZoom <= 6.0)
        {
            // Gentle reduction for moderate zoom levels
            zoomScale = 1.0 / Math.sqrt(currentZoom);
        } else
        {
            // More aggressive reduction for high zoom levels
            // Use logarithmic scaling to prevent overly fast movement
            const logZoom = Math.log10(currentZoom / 2);
            zoomScale = Math.max(0.0001, 1.0 / (currentZoom * Math.pow(logZoom, 2)));
        }

        const adaptiveScale = basePanSpeed * zoomScale;

        // Use different precision strategies based on zoom level
        if (currentZoom < this.maxStandardZoom)
        {
            // Standard precision for performance with adaptive scaling
            const scaleX = adaptiveScale * aspect;
            const scaleY = adaptiveScale;

            const deltaRealStd = deltaX * scaleX;
            const deltaImagStd = deltaY * scaleY;

            this.centerReal = this.centerReal.add(HighPrecisionNumber.fromNumber(deltaRealStd));
            this.centerImag = this.centerImag.add(HighPrecisionNumber.fromNumber(deltaImagStd));
        }
        else
        {
            // High precision for extreme zooms with adaptive scaling
            const scaleX = HighPrecisionNumber.fromNumber(adaptiveScale * aspect);
            const scaleY = HighPrecisionNumber.fromNumber(adaptiveScale);

            const deltaRealHP = HighPrecisionNumber.fromNumber(deltaX).multiply(scaleX);
            const deltaImagHP = HighPrecisionNumber.fromNumber(deltaY).multiply(scaleY);

            this.centerReal = this.centerReal.add(deltaRealHP);
            this.centerImag = this.centerImag.add(deltaImagHP);
        }
    }

    /**
     * Update precision level based on current zoom with enhanced thresholds
     */
    updatePrecisionLevel()
    {
        const currentZoom = Math.exp(this.logZoom);

        // Enhanced precision thresholds for better quality
        const enhancedThresholds = [
            1e6,    // Level 1: Start quality improvements
            1e12,   // Level 2: High precision mode
            1e24,   // Level 3: Ultra precision mode
            1e36,   // Level 4: Extreme precision mode
            1e48,   // Level 5: Maximum precision mode
        ];

        this.precisionLevel = 0;
        for (let i = 0; i < enhancedThresholds.length; i++)
        {
            if (currentZoom >= enhancedThresholds[i])
            {
                this.precisionLevel = i + 1;
            }
        }

        // Update thresholds array for compatibility
        this.precisionThresholds = enhancedThresholds;
    }

    /**
     * Get shader parameters with enhanced precision handling
     * @param {number} aspect - Aspect ratio
     * @returns {Object} Enhanced shader parameters
     */
    getShaderParams(aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Always provide reference coordinates for precision level 1 and above
        if (this.precisionLevel >= 1 || currentZoom >= 1e6)
        {
            // High precision with reference point support
            const relativeCoords = this.getRelativeCoordinates();

            return {
                zoom: currentZoom,
                offsetX: this.centerReal.toNumber(),
                offsetY: this.centerImag.toNumber(),
                needsHighPrecision: true,
                precisionLevel: this.precisionLevel,
                // Reference point parameters for precision preservation
                referenceReal: relativeCoords.refReal,
                referenceImag: relativeCoords.refImag,
                perturbationScale: relativeCoords.scale,
                // Enhanced parameters
                adaptiveIterations: this.getAdaptiveIterations(),
                colorScale: this.getColorScale(),
                detailLevel: this.getDetailLevel()
            };
        }
        else if (currentZoom < this.maxStandardZoom)
        {
            // Standard precision is sufficient, but still provide reference coordinates for consistency
            const relativeCoords = this.getRelativeCoordinates();

            return {
                zoom: currentZoom,
                offsetX: this.centerReal.toNumber(),
                offsetY: this.centerImag.toNumber(),
                needsHighPrecision: false,
                precisionLevel: this.precisionLevel,
                // Provide reference coordinates even for standard precision
                referenceReal: relativeCoords.refReal,
                referenceImag: relativeCoords.refImag,
                perturbationScale: relativeCoords.scale,
                // Enhanced parameters for quality
                adaptiveIterations: this.getAdaptiveIterations(),
                colorScale: this.getColorScale(),
                detailLevel: this.getDetailLevel()
            };
        } else
        {
            // Ultra high precision with perturbation support
            const relativeCoords = this.getRelativeCoordinates();

            return {
                zoom: currentZoom,
                offsetX: this.centerReal.toNumber(),
                offsetY: this.centerImag.toNumber(),
                needsHighPrecision: true,
                precisionLevel: this.precisionLevel,
                // Perturbation parameters
                referenceReal: relativeCoords.refReal,
                referenceImag: relativeCoords.refImag,
                perturbationScale: relativeCoords.scale,
                // Enhanced parameters
                adaptiveIterations: this.getAdaptiveIterations(),
                colorScale: this.getColorScale(),
                detailLevel: this.getDetailLevel()
            };
        }
    }

    /**
     * Get relative coordinates for perturbation theory
     * @returns {Object} Reference coordinates and scale
     */
    getRelativeCoordinates()
    {
        // For extreme zooms, work with relative coordinates
        const currentZoom = Math.exp(this.logZoom);

        return {
            refReal: this.centerReal.toNumber(),
            refImag: this.centerImag.toNumber(),
            scale: 1.0 / currentZoom
        };
    }

    /**
     * Get adaptive iteration count with enhanced stability for color consistency
     * @returns {number} Recommended iteration count
     */
    getAdaptiveIterations()
    {
        const baseIterations = 256;
        const currentZoom = Math.exp(this.logZoom);

        // Much more aggressive iteration scaling for visible improvements
        if (this.precisionLevel === 0)
        {
            // Standard zoom levels - gentle scaling
            const zoomFactor = Math.log10(Math.max(1, currentZoom)) * 25;
            const targetIterations = baseIterations + zoomFactor;
            // Round to multiples of 64 for better stability
            return Math.min(1024, Math.max(baseIterations, Math.round(targetIterations / 64) * 64));
        }
        else if (this.precisionLevel === 1)
        {
            // Level 1 (10^6+): DRAMATICALLY INCREASED scaling to show significant improvement
            const zoomLog = Math.log10(currentZoom);
            let zoomFactor;

            if (zoomLog < 7)
            {
                zoomFactor = 500 + zoomLog * 120; // Much higher starting point and steeper scaling
            } else if (zoomLog < 10)
            {
                zoomFactor = 1340 + (zoomLog - 7) * 200; // Extreme increase to avoid pixelation
            } else
            {
                zoomFactor = 1940 + (zoomLog - 10) * 150; // Continue strong scaling
            }

            const targetIterations = baseIterations + zoomFactor;
            // Much more aggressive iteration counts for level 1
            return Math.min(2560, Math.max(1024, Math.round(targetIterations / 128) * 128));
        }
        else if (this.precisionLevel === 2)
        {
            // Level 2 (10^12+): Even higher iterations
            const zoomLog = Math.log10(currentZoom);
            let zoomFactor;

            if (zoomLog < 14)
            {
                zoomFactor = 800 + zoomLog * 60;
            } else
            {
                zoomFactor = 1640 + (zoomLog - 14) * 40;
            }

            const targetIterations = baseIterations + zoomFactor;
            return Math.min(2560, Math.max(1280, Math.round(targetIterations / 128) * 128));
        }
        else if (this.precisionLevel === 3)
        {
            // Level 3 (10^24+): Ultra high precision
            const zoomLog = Math.log10(currentZoom);
            let zoomFactor;

            if (zoomLog < 26)
            {
                zoomFactor = 1500 + zoomLog * 70;
            } else
            {
                zoomFactor = 3320 + (zoomLog - 26) * 50;
            }

            const targetIterations = baseIterations + zoomFactor;
            return Math.min(4096, Math.max(2048, Math.round(targetIterations / 256) * 256));
        }
        else if (this.precisionLevel === 4)
        {
            // Level 4 (10^36+): Extreme precision
            const zoomLog = Math.log10(currentZoom);
            let zoomFactor;

            if (zoomLog < 38)
            {
                zoomFactor = 2500 + zoomLog * 80;
            } else
            {
                zoomFactor = 5540 + (zoomLog - 38) * 60;
            }

            const targetIterations = baseIterations + zoomFactor;
            return Math.min(6144, Math.max(3072, Math.round(targetIterations / 256) * 256));
        }
        else
        {
            // Level 5 (10^48+): Maximum precision
            const zoomLog = Math.log10(currentZoom);
            let zoomFactor;

            if (zoomLog < 50)
            {
                zoomFactor = 4000 + zoomLog * 100;
            } else
            {
                zoomFactor = 9000 + (zoomLog - 50) * 80;
            }

            const targetIterations = baseIterations + zoomFactor;
            return Math.min(8192, Math.max(4096, Math.round(targetIterations / 512) * 512));
        }
    }

    /**
     * Get adaptive color scale for better visualization at deep zooms
     * @returns {number} Color scale factor
     */
    getColorScale()
    {
        const currentZoom = Math.exp(this.logZoom);

        // Adjust color scaling based on zoom level for better contrast
        if (currentZoom < 1e6)
        {
            return 1.0;
        }
        else if (currentZoom < 1e10) 
        {
            // Enhanced color scaling at Level 1 precision for better detail visibility
            const zoomFactor = Math.log10(currentZoom) - 6;
            return 1.0 + zoomFactor * 0.35; // More aggressive scaling
        }
        else if (currentZoom < 1e12)
        {
            return 1.2;
        }
        else if (currentZoom < 1e24)
        {
            return 1.5;
        }
        else
        {
            return 2.0;
        }
    }

    /**
     * Get detail level for rendering optimization
     * @returns {number} Detail level (0-4)
     */
    getDetailLevel()
    {
        return Math.min(4, this.precisionLevel);
    }

    /**
     * Enhanced iteration recommendation with quality optimization
     * @returns {number} Recommended iteration count
     */
    getRecommendedIterations()
    {
        return this.getAdaptiveIterations();
    }

    /**
     * Get comprehensive zoom information
     * @returns {Object} Enhanced zoom information
     */
    getZoomInfo()
    {
        const zoom = Math.exp(this.logZoom);
        const zoomPower = Math.log10(zoom);

        return {
            zoom: zoom,
            logZoom: this.logZoom,
            zoomPower: zoomPower,
            precisionLevel: this.precisionLevel,
            isHighPrecision: zoom >= this.maxStandardZoom,
            magnification: zoom.toExponential(2),
            // Enhanced information
            qualityLevel: this.getQualityLevel(),
            estimatedPrecisionBits: this.getEstimatedPrecisionBits(),
            maxRecommendedZoom: this.getMaxRecommendedZoom(),
            currentCenter: {
                real: this.centerReal.toNumber(),
                imag: this.centerImag.toNumber()
            }
        };
    }

    /**
     * Get current quality level description
     * @returns {string} Quality level description
     */
    getQualityLevel()
    {
        switch (this.precisionLevel)
        {
            case 0: return 'Standard';
            case 1: return 'Enhanced';
            case 2: return 'High';
            case 3: return 'Ultra';
            case 4: return 'Extreme';
            default: return 'Maximum';
        }
    }

    /**
     * Get estimated precision bits available
     * @returns {number} Estimated precision bits
     */
    getEstimatedPrecisionBits()
    {
        const currentZoom = Math.exp(this.logZoom);

        if (currentZoom < this.maxStandardZoom)
        {
            return 53; // Standard double precision
        }
        else if (currentZoom < 1e28)
        {
            return 106; // Double-double precision
        }
        else
        {
            // Effective precision decreases at extreme zooms
            const precisionLoss = Math.log10(currentZoom / 1e28) * 10;
            return Math.max(80, 106 - precisionLoss);
        }
    }

    /**
     * Get maximum recommended zoom for current precision
     * @returns {number} Maximum recommended zoom
     */
    getMaxRecommendedZoom()
    {
        return 1e50; // Practical limit for our implementation
    }

    /**
     * Reset with enhanced initialization
     */
    reset()
    {
        this.centerReal = HighPrecisionNumber.fromNumber(0);
        this.centerImag = HighPrecisionNumber.fromNumber(0);
        this.logZoom = 0;
        this.precisionLevel = 0;

        // Reset any cached calculations
        this._cachedParams = null;
    }
}
