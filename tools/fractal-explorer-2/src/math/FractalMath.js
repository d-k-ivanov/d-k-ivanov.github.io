/**
 * Fractal mathematical computations and algorithms
 * Provides CPU-side fractal calculations and analysis functions
 */
import { Complex, ComplexUtils } from './ComplexNumbers.js';
import { logger } from '../utils/Logger.js';

/**
 * Fractal mathematics class with various algorithms
 */
export class FractalMath
{
    constructor()
    {
        this.escapeRadius = 2.0;
        this.escapeRadiusSquared = 4.0;
    }

    /**
     * Calculate Mandelbrot set iteration count for a point
     * @param {number} real - Real part of c
     * @param {number} imag - Imaginary part of c
     * @param {number} maxIterations - Maximum iterations
     * @returns {Object} Iteration data { iterations, escaped, smoothValue }
     */
    mandelbrotIterations(real, imag, maxIterations = 256)
    {
        const c = new Complex(real, imag);

        // Quick checks for known regions
        if (ComplexUtils.isInMainCardioid(c) || ComplexUtils.isInPeriod2Bulb(c))
        {
            return { iterations: maxIterations, escaped: false, smoothValue: maxIterations };
        }

        let z = new Complex(0, 0);
        let iterations = 0;

        while (iterations < maxIterations && z.magnitudeSquared() <= this.escapeRadiusSquared)
        {
            z = z.square().add(c);
            iterations++;
        }

        const escaped = z.magnitudeSquared() > this.escapeRadiusSquared;

        // Calculate smooth iteration count for continuous coloring
        let smoothValue = iterations;
        if (escaped && iterations < maxIterations)
        {
            const magnitude = z.magnitude();
            smoothValue = iterations + 1 - Math.log2(Math.log2(magnitude));
        }

        return { iterations, escaped, smoothValue };
    }

    /**
     * Calculate Julia set iteration count for a point
     * @param {number} zReal - Real part of z
     * @param {number} zImag - Imaginary part of z
     * @param {number} cReal - Real part of c (Julia constant)
     * @param {number} cImag - Imaginary part of c (Julia constant)
     * @param {number} maxIterations - Maximum iterations
     * @returns {Object} Iteration data { iterations, escaped, smoothValue }
     */
    juliaIterations(zReal, zImag, cReal, cImag, maxIterations = 256)
    {
        const c = new Complex(cReal, cImag);
        let z = new Complex(zReal, zImag);
        let iterations = 0;

        while (iterations < maxIterations && z.magnitudeSquared() <= this.escapeRadiusSquared)
        {
            z = z.square().add(c);
            iterations++;
        }

        const escaped = z.magnitudeSquared() > this.escapeRadiusSquared;

        // Calculate smooth iteration count
        let smoothValue = iterations;
        if (escaped && iterations < maxIterations)
        {
            const magnitude = z.magnitude();
            smoothValue = iterations + 1 - Math.log2(Math.log2(magnitude));
        }

        return { iterations, escaped, smoothValue };
    }

    /**
     * Calculate the period of a point in the Mandelbrot set
     * @param {number} real - Real part of c
     * @param {number} imag - Imaginary part of c
     * @param {number} maxPeriod - Maximum period to check
     * @returns {number} Period (0 if not periodic or if escapes)
     */
    findMandelbrotPeriod(real, imag, maxPeriod = 100)
    {
        const c = new Complex(real, imag);
        let z = new Complex(0, 0);
        const history = [];

        // First, iterate to let the orbit settle
        for (let i = 0; i < 50; i++)
        {
            z = z.square().add(c);
            if (z.magnitudeSquared() > this.escapeRadiusSquared)
            {
                return 0; // Point escapes, not periodic
            }
        }

        // Then look for periodicity
        for (let i = 0; i < maxPeriod; i++)
        {
            z = z.square().add(c);
            if (z.magnitudeSquared() > this.escapeRadiusSquared)
            {
                return 0; // Point escapes
            }

            // Check if we've seen this value before (with some tolerance)
            for (let j = 0; j < history.length; j++)
            {
                const dist = ComplexUtils.distance(z, history[j]);
                if (dist < 1e-10)
                {
                    return history.length - j;
                }
            }

            history.push(z.clone());
        }

        return 0; // No period found within maxPeriod
    }

    /**
     * Estimate the area of the Mandelbrot set using Monte Carlo method
     * @param {number} samples - Number of random samples
     * @param {number} maxIterations - Maximum iterations per sample
     * @returns {Object} Area estimation data
     */
    estimateMandelbrotArea(samples = 100000, maxIterations = 100)
    {
        let inSet = 0;
        const boundingArea = 16; // Area of the region [-2, 2] x [-2, 2]

        for (let i = 0; i < samples; i++)
        {
            const real = (Math.random() - 0.5) * 4; // [-2, 2]
            const imag = (Math.random() - 0.5) * 4; // [-2, 2]

            const result = this.mandelbrotIterations(real, imag, maxIterations);
            if (result.iterations >= maxIterations)
            {
                inSet++;
            }
        }

        const estimatedArea = (inSet / samples) * boundingArea;
        const confidence = Math.sqrt((inSet * (samples - inSet)) / samples) / samples * boundingArea;

        return {
            estimatedArea,
            confidence,
            samplesInSet: inSet,
            totalSamples: samples
        };
    }

    /**
     * Calculate the escape velocity map for a region
     * @param {Object} region - Region bounds { minReal, maxReal, minImag, maxImag }
     * @param {number} width - Output width
     * @param {number} height - Output height
     * @param {number} maxIterations - Maximum iterations
     * @returns {Array} 2D array of iteration counts
     */
    calculateEscapeVelocityMap(region, width, height, maxIterations = 256)
    {
        const map = Array(height).fill().map(() => Array(width).fill(0));

        const realStep = (region.maxReal - region.minReal) / width;
        const imagStep = (region.maxImag - region.minImag) / height;

        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                const real = region.minReal + x * realStep;
                const imag = region.minImag + y * imagStep;

                const result = this.mandelbrotIterations(real, imag, maxIterations);
                map[y][x] = result.smoothValue;
            }
        }

        return map;
    }

    /**
     * Find interesting points in the Mandelbrot set
     * @param {number} numPoints - Number of points to find
     * @returns {Array} Array of interesting complex coordinates
     */
    findInterestingMandelbrotPoints(numPoints = 10)
    {
        const interestingPoints = [
            // Classic zoom locations
            { real: -0.7269, imag: 0.1889, name: 'Spiral' },
            { real: -0.8, imag: 0.156, name: 'Lightning' },
            { real: -0.16, imag: 1.0405, name: 'Feather' },
            { real: -1.25066, imag: 0.02012, name: 'Seahorse Valley' },
            { real: -0.74529, imag: 0.11307, name: 'Double Spiral' },
            { real: -1.768778833, imag: -0.001738996, name: 'Elephant Valley' },
            { real: 0.3, imag: 0.5, name: 'Julia Island' },
            { real: -1.543678, imag: 0, name: 'Cauliflower' },
            { real: -0.12256, imag: 0.74486, name: 'San Marco Dragon' }
        ];

        return interestingPoints.slice(0, numPoints);
    }

    /**
     * Generate good Julia set constants
     * @param {number} numConstants - Number of constants to generate
     * @returns {Array} Array of Julia constants
     */
    generateJuliaConstants(numConstants = 10)
    {
        const constants = [
            // Classic Julia sets
            { real: -0.7, imag: 0.27015, name: 'Dragon' },
            { real: -0.8, imag: 0.156, name: 'Lightning' },
            { real: -0.4, imag: 0.6, name: 'Spiral' },
            { real: 0.285, imag: 0.01, name: 'Almost disconnected' },
            { real: -0.038088, imag: 0.9754633, name: 'Douady Rabbit' },
            { real: -0.123, imag: 0.745, name: 'Siegel Disk' },
            { real: -0.16, imag: 1.04, name: 'Feather' },
            { real: 0.3, imag: 0.5, name: 'Coral' },
            { real: -1.476, imag: 0, name: 'Cauliflower' },
            { real: -0.12, imag: -0.77, name: 'Airplane' }
        ];

        return constants.slice(0, numConstants);
    }

    /**
     * Calculate the derivative for distance estimation
     * @param {number} real - Real part of c
     * @param {number} imag - Imaginary part of c
     * @param {number} maxIterations - Maximum iterations
     * @returns {Object} Distance estimation data
     */
    calculateDistanceEstimation(real, imag, maxIterations = 256)
    {
        const c = new Complex(real, imag);
        let z = new Complex(0, 0);
        let dz = new Complex(1, 0); // Derivative starts at 1

        let iterations = 0;

        while (iterations < maxIterations && z.magnitudeSquared() <= this.escapeRadiusSquared)
        {
            // dz = 2 * z * dz + 1 (derivative of z^2 + c)
            dz = z.multiply(dz).scale(2).add(new Complex(1, 0));
            z = z.square().add(c);
            iterations++;
        }

        if (iterations >= maxIterations)
        {
            return { distance: 0, iterations };
        }

        const magnitude = z.magnitude();
        const derivativeMagnitude = dz.magnitude();

        if (derivativeMagnitude === 0)
        {
            return { distance: 0, iterations };
        }

        // Distance estimation formula
        const distance = (magnitude * Math.log(magnitude)) / derivativeMagnitude;

        return { distance, iterations };
    }

    /**
     * Calculate buddhabrot contribution for a point
     * @param {number} real - Real part of c
     * @param {number} imag - Imaginary part of c
     * @param {number} maxIterations - Maximum iterations
     * @returns {Array} Array of complex points in the orbit
     */
    calculateBuddhabrotOrbit(real, imag, maxIterations = 1000)
    {
        const c = new Complex(real, imag);
        let z = new Complex(0, 0);
        const orbit = [];

        let iterations = 0;

        while (iterations < maxIterations && z.magnitudeSquared() <= this.escapeRadiusSquared)
        {
            orbit.push(z.clone());
            z = z.square().add(c);
            iterations++;
        }

        // Only return orbit if point escapes (for Buddhabrot)
        if (z.magnitudeSquared() > this.escapeRadiusSquared)
        {
            return orbit;
        }

        return [];
    }
}
