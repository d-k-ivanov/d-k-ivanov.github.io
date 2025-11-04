/**
 * Color palette generation and management
 * Provides various color schemes for fractal visualization
 */

/**
 * Color palette generator with mathematical aesthetics
 */
export class ColorPalette
{
    constructor()
    {
        this.paletteSize = 16;
        this.currentPalette = this.generateDefaultPalette();
    }

    /**
     * Generate the default mathematical color palette
     * @returns {Array} Array of RGB color arrays
     */
    generateDefaultPalette()
    {
        return [
            [0.0, 0.0, 0.1],   // Deep blue
            [0.0, 0.0, 0.3],   // Dark blue
            [0.0, 0.1, 0.5],   // Medium blue
            [0.0, 0.3, 0.7],   // Light blue
            [0.0, 0.5, 0.9],   // Cyan blue
            [0.1, 0.6, 0.8],   // Cyan
            [0.3, 0.7, 0.7],   // Teal
            [0.5, 0.8, 0.6],   // Green-blue
            [0.7, 0.9, 0.4],   // Yellow-green
            [0.9, 0.9, 0.2],   // Yellow
            [1.0, 0.8, 0.1],   // Orange-yellow
            [1.0, 0.6, 0.0],   // Orange
            [1.0, 0.4, 0.1],   // Red-orange
            [0.9, 0.2, 0.2],   // Red
            [0.7, 0.1, 0.3],   // Dark red
            [0.5, 0.0, 0.4]    // Purple
        ];
    }

    /**
     * Generate a hot color palette (fire-like)
     * @returns {Array} Array of RGB color arrays
     */
    generateHotPalette()
    {
        const palette = [];
        for (let i = 0; i < this.paletteSize; i++)
        {
            const t = i / (this.paletteSize - 1);
            if (t < 0.33)
            {
                // Black to red
                const localT = t / 0.33;
                palette.push([localT, 0, 0]);
            } else if (t < 0.66)
            {
                // Red to yellow
                const localT = (t - 0.33) / 0.33;
                palette.push([1, localT, 0]);
            } else
            {
                // Yellow to white
                const localT = (t - 0.66) / 0.34;
                palette.push([1, 1, localT]);
            }
        }
        return palette;
    }

    /**
     * Generate a cool color palette (ice-like)
     * @returns {Array} Array of RGB color arrays
     */
    generateCoolPalette()
    {
        const palette = [];
        for (let i = 0; i < this.paletteSize; i++)
        {
            const t = i / (this.paletteSize - 1);
            if (t < 0.5)
            {
                // Black to blue
                const localT = t / 0.5;
                palette.push([0, 0, localT]);
            } else
            {
                // Blue to cyan to white
                const localT = (t - 0.5) / 0.5;
                palette.push([localT, localT, 1]);
            }
        }
        return palette;
    }

    /**
     * Generate a rainbow color palette
     * @returns {Array} Array of RGB color arrays
     */
    generateRainbowPalette()
    {
        const palette = [];
        for (let i = 0; i < this.paletteSize; i++)
        {
            const hue = (i / this.paletteSize) * 360;
            const rgb = this.hslToRgb(hue, 1.0, 0.5);
            palette.push(rgb);
        }
        return palette;
    }

    /**
     * Generate a monochrome color palette
     * @param {Array} baseColor - Base RGB color [r, g, b]
     * @returns {Array} Array of RGB color arrays
     */
    generateMonochromePalette(baseColor = [0.2, 0.6, 1.0])
    {
        const palette = [];
        for (let i = 0; i < this.paletteSize; i++)
        {
            const intensity = i / (this.paletteSize - 1);
            palette.push([
                baseColor[0] * intensity,
                baseColor[1] * intensity,
                baseColor[2] * intensity
            ]);
        }
        return palette;
    }

    /**
     * Generate a gradient between two colors
     * @param {Array} color1 - Start RGB color [r, g, b]
     * @param {Array} color2 - End RGB color [r, g, b]
     * @returns {Array} Array of RGB color arrays
     */
    generateGradientPalette(color1, color2)
    {
        const palette = [];
        for (let i = 0; i < this.paletteSize; i++)
        {
            const t = i / (this.paletteSize - 1);
            palette.push([
                color1[0] + (color2[0] - color1[0]) * t,
                color1[1] + (color2[1] - color1[1]) * t,
                color1[2] + (color2[2] - color1[2]) * t
            ]);
        }
        return palette;
    }

    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-1)
     * @param {number} l - Lightness (0-1)
     * @returns {Array} RGB color [r, g, b]
     */
    hslToRgb(h, s, l)
    {
        h = h / 360;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;

        if (h < 1 / 6)
        {
            [r, g, b] = [c, x, 0];
        } else if (h < 2 / 6)
        {
            [r, g, b] = [x, c, 0];
        } else if (h < 3 / 6)
        {
            [r, g, b] = [0, c, x];
        } else if (h < 4 / 6)
        {
            [r, g, b] = [0, x, c];
        } else if (h < 5 / 6)
        {
            [r, g, b] = [x, 0, c];
        } else
        {
            [r, g, b] = [c, 0, x];
        }

        return [r + m, g + m, b + m];
    }

    /**
     * Set the current palette
     * @param {string} type - Palette type: 'default', 'hot', 'cool', 'rainbow', 'monochrome'
     * @param {Object} options - Additional options for palette generation
     */
    setPalette(type, options = {})
    {
        switch (type)
        {
            case 'hot':
                this.currentPalette = this.generateHotPalette();
                break;
            case 'cool':
                this.currentPalette = this.generateCoolPalette();
                break;
            case 'rainbow':
                this.currentPalette = this.generateRainbowPalette();
                break;
            case 'monochrome':
                this.currentPalette = this.generateMonochromePalette(options.baseColor);
                break;
            case 'gradient':
                this.currentPalette = this.generateGradientPalette(options.color1, options.color2);
                break;
            default:
                this.currentPalette = this.generateDefaultPalette();
        }
    }

    /**
     * Get the current palette
     * @returns {Array} Current palette array
     */
    getPalette()
    {
        return this.currentPalette;
    }

    /**
     * Get a color from the palette using smooth interpolation
     * @param {number} t - Parameter (0-1)
     * @returns {Array} Interpolated RGB color [r, g, b]
     */
    getColor(t)
    {
        // Wrap t to [0, 1] range
        t = ((t % 1) + 1) % 1;

        const index = t * (this.paletteSize - 1);
        const i = Math.floor(index);
        const frac = index - i;

        const i0 = Math.max(0, Math.min(this.paletteSize - 1, i));
        const i1 = Math.max(0, Math.min(this.paletteSize - 1, i + 1));

        const color0 = this.currentPalette[i0];
        const color1 = this.currentPalette[i1];

        return [
            color0[0] + (color1[0] - color0[0]) * frac,
            color0[1] + (color1[1] - color0[1]) * frac,
            color0[2] + (color1[2] - color0[2]) * frac
        ];
    }

    /**
     * Convert RGB to hex string
     * @param {Array} rgb - RGB color [r, g, b] (0-1 range)
     * @returns {string} Hex color string
     */
    rgbToHex(rgb)
    {
        const r = Math.round(rgb[0] * 255).toString(16).padStart(2, '0');
        const g = Math.round(rgb[1] * 255).toString(16).padStart(2, '0');
        const b = Math.round(rgb[2] * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    /**
     * Get palette as WGSL shader array string
     * @returns {string} WGSL array declaration
     */
    toWGSLArray()
    {
        const colors = this.currentPalette.map(color =>
            `vec3<f32>(${color[0].toFixed(3)}, ${color[1].toFixed(3)}, ${color[2].toFixed(3)})`
        ).join(',\n        ');

        return `array<vec3<f32>, ${this.paletteSize}>(\n        ${colors}\n    )`;
    }
}
