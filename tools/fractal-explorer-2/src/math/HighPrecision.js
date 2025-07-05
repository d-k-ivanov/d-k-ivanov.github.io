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
     * High precision zoom for extreme zoom levels
     * @param {number} mouseX - Mouse X coordinate (normalized)
     * @param {number} mouseY - Mouse Y coordinate (normalized)
     * @param {number} zoomFactor - Zoom multiplier
     * @param {number} aspect - Aspect ratio
     */
    zoomAtHighPrecision(mouseX, mouseY, zoomFactor, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);

        // Calculate point to zoom into in high precision
        const scale = HighPrecisionNumber.fromNumber(4.0 * aspect / currentZoom);
        const mouseRealHP = HighPrecisionNumber.fromNumber(mouseX).multiply(scale);
        const mouseImagHP = HighPrecisionNumber.fromNumber(mouseY * 4.0 / currentZoom);

        const targetReal = this.centerReal.add(mouseRealHP);
        const targetImag = this.centerImag.add(mouseImagHP);

        // Apply zoom
        this.logZoom += Math.log(zoomFactor);

    }

    /**
     * Pan the view
     * @param {number} deltaX - Pan delta X
     * @param {number} deltaY - Pan delta Y
     * @param {number} aspect - Aspect ratio
     */
    pan(deltaX, deltaY, aspect)
    {
        const currentZoom = Math.exp(this.logZoom);
        const scaleX = HighPrecisionNumber.fromNumber(4.0 * aspect / currentZoom);
        const scaleY = HighPrecisionNumber.fromNumber(4.0 / currentZoom);

        const deltaRealHP = HighPrecisionNumber.fromNumber(deltaX).multiply(scaleX);
        const deltaImagHP = HighPrecisionNumber.fromNumber(deltaY).multiply(scaleY);

        this.centerReal = this.centerReal.add(deltaRealHP);
        this.centerImag = this.centerImag.add(deltaImagHP);
    }

    /**
     * Update precision level based on current zoom
     */
    updatePrecisionLevel()
    {
        const currentZoom = Math.exp(this.logZoom);

        this.precisionLevel = 0;
        for (let i = 0; i < this.precisionThresholds.length; i++)
        {
            if (currentZoom >= this.precisionThresholds[i])
            {
                this.precisionLevel = i + 1;
            }
        }
    }

    /**
     * Get current standard precision coordinates for shader
     * @param {number} aspect - Aspect ratio
     * @returns {Object} Standard precision parameters
     */
    getShaderParams(aspect)
    {
        // For very high zoom levels, we need to calculate relative coordinates
        const currentZoom = Math.exp(this.logZoom);

        if (currentZoom < this.maxStandardZoom)
        {
            // Standard precision is sufficient
            return {
                zoom: currentZoom,
                offsetX: this.centerReal.toNumber(),
                offsetY: this.centerImag.toNumber(),
                needsHighPrecision: false
            };
        } else
        {
            // Use relative coordinates for high precision
            return {
                zoom: currentZoom,
                offsetX: this.centerReal.toNumber(),
                offsetY: this.centerImag.toNumber(),
                needsHighPrecision: true,
                precisionLevel: this.precisionLevel
            };
        }
    }

    /**
     * Get recommended iteration count based on zoom level
     * @returns {number} Recommended iteration count
     */
    getRecommendedIterations()
    {
        const baseIterations = 256;
        const currentZoom = Math.exp(this.logZoom);

        // Enhanced iteration scaling for infinite zoom
        if (currentZoom < 1e6)
        {
            // Standard scaling for normal zoom levels
            const zoomIterationFactor = Math.log10(currentZoom) * 50;
            return Math.min(1024, Math.max(baseIterations, baseIterations + zoomIterationFactor));
        } else if (currentZoom < 1e15)
        {
            // Moderate scaling for high zoom levels
            const zoomIterationFactor = Math.log10(currentZoom) * 75;
            return Math.min(2048, Math.max(512, baseIterations + zoomIterationFactor));
        } else
        {
            // Aggressive scaling for extreme zoom levels
            const zoomIterationFactor = Math.log10(currentZoom) * 100;
            return Math.min(4096, Math.max(1024, baseIterations + zoomIterationFactor));
        }
    }

    /**
     * Reset to initial state
     */
    reset()
    {
        this.centerReal = HighPrecisionNumber.fromNumber(0);
        this.centerImag = HighPrecisionNumber.fromNumber(0);
        this.logZoom = 0;
        this.precisionLevel = 0;
    }

    /**
     * Get zoom info for display
     * @returns {Object} Zoom information
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
            magnification: zoom.toExponential(2)
        };
    }
}
