/**
 * Render mode definitions and constants
 * Centralizes all rendering mode configurations
 */
export const RenderModes = {
    JULIA: 'julia',
    MANDELBROT: 'mandelbrot',
    DUAL: 'dual',
    BURNING_SHIP: 'burning_ship',
    TRICORN: 'tricorn',
    PHOENIX: 'phoenix',
    NEWTON: 'newton',
    BURNING_SHIP_JULIA: 'burning_ship_julia',
    MULTIBROT: 'multibrot'
};

/**
 * WebGPU shader constants for render modes
 */
export const ShaderModes = {
    [RenderModes.JULIA]: 0.0,
    [RenderModes.MANDELBROT]: 1.0,
    [RenderModes.DUAL]: 2.0,
    [RenderModes.BURNING_SHIP]: 3.0,
    [RenderModes.TRICORN]: 4.0,
    [RenderModes.PHOENIX]: 5.0,
    [RenderModes.NEWTON]: 6.0,
    [RenderModes.BURNING_SHIP_JULIA]: 7.0,
    [RenderModes.MULTIBROT]: 8.0
};

/**
 * View types for dual mode
 */
export const ViewTypes = {
    MANDELBROT: 'mandelbrot',
    JULIA: 'julia'
};

/**
 * Render mode utility functions
 */
export const RenderModeUtils = {
    /**
     * Check if a mode is valid
     * @param {string} mode - Mode to validate
     * @returns {boolean} True if valid
     */
    isValid(mode)
    {
        return Object.values(RenderModes).includes(mode);
    },

    /**
     * Get all available modes
     * @returns {string[]} Array of mode names
     */
    getAllModes()
    {
        return Object.values(RenderModes);
    },

    /**
     * Get the next render mode in sequence
     * @param {string} currentMode - Current render mode
     * @returns {string} Next render mode
     */
    getNextMode(currentMode)
    {
        const modes = [
            RenderModes.MANDELBROT,
            RenderModes.JULIA,
            RenderModes.BURNING_SHIP,
            RenderModes.BURNING_SHIP_JULIA,
            RenderModes.TRICORN,
            RenderModes.PHOENIX,
            RenderModes.NEWTON,
            RenderModes.MULTIBROT,
            RenderModes.DUAL
        ];

        const currentIndex = modes.indexOf(currentMode);
        if (currentIndex === -1) return RenderModes.MANDELBROT;

        const nextIndex = (currentIndex + 1) % modes.length;
        return modes[nextIndex];
    },

    /**
     * Get a user-friendly name for a render mode
     * @param {string} mode - Render mode
     * @returns {string} User-friendly name
     */
    getModeName(mode)
    {
        switch (mode)
        {
            case RenderModes.MANDELBROT: return 'Mandelbrot Set';
            case RenderModes.JULIA: return 'Julia Set';
            case RenderModes.BURNING_SHIP: return 'Burning Ship';
            case RenderModes.BURNING_SHIP_JULIA: return 'Burning Ship Julia';
            case RenderModes.TRICORN: return 'Tricorn (Mandelbar)';
            case RenderModes.PHOENIX: return 'Phoenix';
            case RenderModes.NEWTON: return 'Newton';
            case RenderModes.MULTIBROT: return 'Multibrot';
            case RenderModes.DUAL: return 'Dual View';
            default: return 'Unknown Mode';
        }
    },

    /**
     * Check if a mode is a single fractal view (not dual)
     * @param {string} mode - Render mode
     * @returns {boolean} True if single view mode
     */
    isSingleViewMode(mode)
    {
        return mode !== RenderModes.DUAL;
    }
};

/**
 * Keyboard shortcuts mapping
 */
export const KeyboardShortcuts = {
    TOGGLE_MODE: ['m', 'M'],
    JULIA_MODE: ['j', 'J'],
    MANDELBROT_MODE: ['1'],
    BURNING_SHIP_MODE: ['2'],
    BURNING_SHIP_JULIA_MODE: ['b', 'B'],
    TRICORN_MODE: ['3'],
    PHOENIX_MODE: ['4'],
    NEWTON_MODE: ['5'],
    MULTIBROT_MODE: ['6'],
    DUAL_MODE: ['d', 'D'],
    SWITCH_VIEW: ['Tab'],
    FULLSCREEN: ['f', 'F'],
    RESET: ['r', 'R'],
    ZOOM_IN: ['+', '='],
    ZOOM_OUT: ['-', '_'],
    ESCAPE: ['Escape']
};

/**
 * Navigation keys
 */
export const NavigationKeys = {
    LEFT: ['ArrowLeft'],
    RIGHT: ['ArrowRight'],
    UP: ['ArrowUp'],
    DOWN: ['ArrowDown']
};

/**
 * Mouse button constants
 */
export const MouseButtons = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

/**
 * Performance quality levels
 */
export const QualityLevels = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

/**
 * Canvas configuration constants
 */
export const CanvasConfig = {
    MAX_DEVICE_PIXEL_RATIO: 2, // Cap DPR for performance
    MIN_CANVAS_SIZE: { width: 320, height: 240 },
    MAX_CANVAS_SIZE: { width: 3840, height: 2160 }
};
