/**
 * Complex number operations and utilities
 * Provides mathematical operations for complex numbers used in fractal calculations
 */

/**
 * Complex number class for mathematical operations
 */
export class Complex
{
    constructor(real = 0, imag = 0)
    {
        this.real = real;
        this.imag = imag;
    }

    /**
     * Create complex number from polar coordinates
     * @param {number} magnitude - Magnitude (r)
     * @param {number} angle - Angle in radians (θ)
     * @returns {Complex} Complex number
     */
    static fromPolar(magnitude, angle)
    {
        return new Complex(
            magnitude * Math.cos(angle),
            magnitude * Math.sin(angle)
        );
    }

    /**
     * Add two complex numbers
     * @param {Complex} other - Other complex number
     * @returns {Complex} Sum
     */
    add(other)
    {
        return new Complex(
            this.real + other.real,
            this.imag + other.imag
        );
    }

    /**
     * Subtract two complex numbers
     * @param {Complex} other - Other complex number
     * @returns {Complex} Difference
     */
    subtract(other)
    {
        return new Complex(
            this.real - other.real,
            this.imag - other.imag
        );
    }

    /**
     * Multiply two complex numbers
     * @param {Complex} other - Other complex number
     * @returns {Complex} Product
     */
    multiply(other)
    {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    /**
     * Divide two complex numbers
     * @param {Complex} other - Other complex number
     * @returns {Complex} Quotient
     */
    divide(other)
    {
        const denominator = other.real * other.real + other.imag * other.imag;
        if (denominator === 0)
        {
            throw new Error('Division by zero');
        }

        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denominator,
            (this.imag * other.real - this.real * other.imag) / denominator
        );
    }

    /**
     * Square the complex number
     * @returns {Complex} Square
     */
    square()
    {
        return new Complex(
            this.real * this.real - this.imag * this.imag,
            2 * this.real * this.imag
        );
    }

    /**
     * Calculate magnitude (absolute value)
     * @returns {number} Magnitude
     */
    magnitude()
    {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    /**
     * Calculate magnitude squared (more efficient)
     * @returns {number} Magnitude squared
     */
    magnitudeSquared()
    {
        return this.real * this.real + this.imag * this.imag;
    }

    /**
     * Calculate argument (angle in radians)
     * @returns {number} Angle in radians
     */
    argument()
    {
        return Math.atan2(this.imag, this.real);
    }

    /**
     * Calculate complex conjugate
     * @returns {Complex} Conjugate
     */
    conjugate()
    {
        return new Complex(this.real, -this.imag);
    }

    /**
     * Scale by a real number
     * @param {number} scalar - Real scalar
     * @returns {Complex} Scaled complex number
     */
    scale(scalar)
    {
        return new Complex(this.real * scalar, this.imag * scalar);
    }

    /**
     * Check if complex number is finite
     * @returns {boolean} True if finite
     */
    isFinite()
    {
        return Number.isFinite(this.real) && Number.isFinite(this.imag);
    }

    /**
     * Convert to string representation
     * @returns {string} String representation
     */
    toString()
    {
        const sign = this.imag >= 0 ? '+' : '';
        return `${this.real}${sign}${this.imag}i`;
    }

    /**
     * Create a copy of the complex number
     * @returns {Complex} Copy
     */
    clone()
    {
        return new Complex(this.real, this.imag);
    }
}

/**
 * Complex number utility functions
 */
export const ComplexUtils = {
    /**
     * Create complex number from coordinates
     * @param {number} x - Real part
     * @param {number} y - Imaginary part
     * @returns {Complex} Complex number
     */
    fromCoordinates(x, y)
    {
        return new Complex(x, y);
    },

    /**
     * Distance between two complex numbers
     * @param {Complex} a - First complex number
     * @param {Complex} b - Second complex number
     * @returns {number} Distance
     */
    distance(a, b)
    {
        return a.subtract(b).magnitude();
    },

    /**
     * Linear interpolation between two complex numbers
     * @param {Complex} a - Start complex number
     * @param {Complex} b - End complex number
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Complex} Interpolated complex number
     */
    lerp(a, b, t)
    {
        return new Complex(
            a.real + (b.real - a.real) * t,
            a.imag + (b.imag - a.imag) * t
        );
    },

    /**
     * Check if complex number is in the main cardioid of Mandelbrot set
     * @param {Complex} c - Complex number to test
     * @returns {boolean} True if in main cardioid
     */
    isInMainCardioid(c)
    {
        const q = (c.real - 0.25) * (c.real - 0.25) + c.imag * c.imag;
        return q * (q + (c.real - 0.25)) < 0.25 * c.imag * c.imag;
    },

    /**
     * Check if complex number is in the period-2 bulb of Mandelbrot set
     * @param {Complex} c - Complex number to test
     * @returns {boolean} True if in period-2 bulb
     */
    isInPeriod2Bulb(c)
    {
        return (c.real + 1) * (c.real + 1) + c.imag * c.imag < 0.0625;
    },

    /**
     * Quick check for obvious Mandelbrot set membership
     * @param {Complex} c - Complex number to test
     * @returns {boolean} True if obviously in the set
     */
    isObviouslyInMandelbrotSet(c)
    {
        return this.isInMainCardioid(c) || this.isInPeriod2Bulb(c);
    }
};
