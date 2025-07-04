/**
 * Render mode definitions and constants
 * Centralizes all rendering mode configurations
 */
export const RenderModes = {
    JULIA: 'julia',
    MANDELBROT: 'mandelbrot',
    DUAL: 'dual'
};

/**
 * WebGPU shader constants for render modes
 */
export const ShaderModes = {
    [RenderModes.JULIA]: 0.0,
    [RenderModes.MANDELBROT]: 1.0,
    [RenderModes.DUAL]: 2.0
};

/**
 * View types for dual mode
 */
export const ViewTypes = {
    MANDELBROT: 'mandelbrot',
    JULIA: 'julia'
};

/**
 * Keyboard shortcuts mapping
 */
export const KeyboardShortcuts = {
    TOGGLE_MODE: ['m', 'M'],
    JULIA_MODE: ['j', 'J'],
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

/**
 * Utility functions for render modes
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
     * Get the next mode in cycle
     * @param {string} currentMode - Current mode
     * @returns {string} Next mode
     */
    getNextMode(currentMode)
    {
        const modes = this.getAllModes();
        const currentIndex = modes.indexOf(currentMode);
        return modes[(currentIndex + 1) % modes.length];
    }
};
