/**
 * Default settings and initial parameters for the fractal explorer
 * Centralizes all default configurations
 */
import { RenderModes, ViewTypes, QualityLevels } from './RenderModes.js';

/**
 * Default Julia set parameters
 */
export const DefaultJuliaParams = {
    c_real: -0.7,
    c_imag: 0.27015,
    zoom: 1.0,
    offsetX: 0.0,
    offsetY: 0.0,
    maxIterations: 256,
    colorOffset: 0.0
};

/**
 * Default Mandelbrot set parameters
 */
export const DefaultMandelbrotParams = {
    zoom: 1.0,
    offsetX: -0.5,
    offsetY: 0.0,
    maxIterations: 256,
    colorOffset: 0.0
};

/**
 * Default precision tracking parameters
 */
export const DefaultPrecisionParams = {
    logZoom: 0.0,
    centerX: 0.0,
    centerY: 0.0,
    maxLogZoom: 50.0
};

/**
 * Default Mandelbrot precision parameters
 */
export const DefaultMandelbrotPrecision = {
    logZoom: 0.0,
    centerX: -0.5,
    centerY: 0.0,
    maxLogZoom: 50.0
};

/**
 * Default application settings
 */
export const DefaultAppSettings = {
    renderMode: RenderModes.DUAL,
    activeView: ViewTypes.MANDELBROT,
    quality: QualityLevels.HIGH,
    enablePerformanceMonitoring: true,
    logLevel: 'info'
};

/**
 * Default WebGPU settings
 */
export const DefaultWebGPUSettings = {
    powerPreference: 'high-performance',
    forceFallbackAdapter: false
};

/**
 * Default animation settings
 */
export const DefaultAnimationSettings = {
    targetFPS: 60,
    enableVSync: true,
    enableAdaptiveQuality: true
};

/**
 * Default input settings
 */
export const DefaultInputSettings = {
    zoomSensitivity: 0.2,
    panSensitivity: 0.1,
    enableKeyboardNavigation: true,
    enableMouseNavigation: true
};

/**
 * Default color settings
 */
export const DefaultColorSettings = {
    paletteSize: 16,
    smoothColoring: true,
    colorSpeed: 32.0,
    brightnessRange: { min: 0.6, max: 1.0 }
};

/**
 * Zoom and navigation limits
 */
export const NavigationLimits = {
    minLogZoom: -10.0,
    maxLogZoom: 50.0,
    baseStep: 0.1,
    zoomStep: 0.2,
    maxIterations: 2048,
    baseIterations: 256
};
