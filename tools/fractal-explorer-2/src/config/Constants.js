/**
 * Unified Application Constants
 * Centralizes all constants used throughout the application
 *
 * This module provides a single source of truth for application-wide constants,
 * ensuring consistency and making configuration changes easier to manage.
 */

import { ShaderModes } from './RenderModes.js';

// Application metadata
export const APP_METADATA = {
    NAME: 'Fractal Explorer',
    VERSION: '2.0.0',
    DESCRIPTION: 'WebGPU Educational Application for exploring Julia and Mandelbrot sets',
    AUTHOR: 'WebGPU Fractal Explorer Team'
};

/**
 * Mathematical constants used in fractal calculations
 * These values define the core mathematical properties of the fractal rendering
 */
export const MATH_CONSTANTS = {
    // Escape radius for fractal iteration
    ESCAPE_RADIUS: 2.0,
    ESCAPE_RADIUS_SQUARED: 4.0,
    ENHANCED_ESCAPE_RADIUS_SQUARED: 16.0,

    // Default iteration counts (referenced by DefaultSettings.js)
    DEFAULT_MAX_ITERATIONS: 256,

    // Zoom related constants
    MAX_ZOOM_LOG: 50.0,
    MIN_ZOOM: 1e-14,

    // Precision thresholds
    ULTRA_PRECISION_THRESHOLD: 1e28,

    // Complex plane constants
    MANDELBROT_CENTER_X: -0.5,
    MANDELBROT_CENTER_Y: 0.0,
    JULIA_CENTER_X: 0.0,
    JULIA_CENTER_Y: 0.0
};

/**
 * Performance optimization constants
 * These values control the performance monitoring and adaptation behavior
 */
export const PERFORMANCE_CONSTANTS = {
    TARGET_FPS: 60,
    LOW_FPS_THRESHOLD: 30,
    HIGH_FPS_THRESHOLD: 55,
    FRAME_TIME_SAMPLES: 60,
    UPDATE_INTERVAL_MS: 1000,
    ADAPTIVE_RENDERING_ENABLED: true
};

/**
 * UI display and interaction constants
 * Controls the user interface appearance and behavior
 */
export const UI_CONSTANTS = {
    // Display precision for coordinate values
    COORDINATE_PRECISION: 6,
    ZOOM_DISPLAY_PRECISION: 2,

    // UI interaction timings
    AUTO_HIDE_DELAY_MS: 10000,
    STATUS_MESSAGE_DURATION_MS: 2000,
    HELP_ANIMATION_DURATION_MS: 300,

    // Tooltips and help text delays
    TOOLTIP_DELAY_MS: 500,
    TOOLTIP_FADE_DURATION_MS: 200
};

/**
 * Input sensitivity and control constants
 * These values control how user input translates to fractal navigation
 */
export const INPUT_CONSTANTS = {
    ZOOM_SENSITIVITY: 0.2,
    PAN_SENSITIVITY: 0.1,
    FINE_ZOOM_STEP: 0.1,
    FAST_ZOOM_STEP: 0.5,
    KEYBOARD_PAN_STEP: 0.1,
    DOUBLE_CLICK_ZOOM_FACTOR: 2.0
};

/**
 * Color palette and rendering appearance constants
 * Controls the visual aesthetics of the rendered fractals
 */
export const COLOR_CONSTANTS = {
    PALETTE_SIZE: 16,
    DEFAULT_COLOR_SPEED: 32.0,
    BRIGHTNESS_MIN: 0.6,
    BRIGHTNESS_MAX: 1.0,
    COLOR_CYCLE_SPEED: 0.05
};

/**
 * WebGPU rendering specific constants
 * Technical parameters for the WebGPU pipeline
 */
export const WEBGPU_CONSTANTS = {
    UNIFORM_BUFFER_SIZE: 128, // bytes
    MAX_TEXTURE_SIZE: 8192,
    PREFERRED_FORMAT: 'bgra8unorm',
    SAMPLER_ADDRESS_MODE: 'clamp-to-edge'
};

/**
 * Shader pipeline constants
 * Controls the shader compilation and execution
 */
export const SHADER_CONSTANTS = {
    // Vertex data
    VERTEX_COUNT: 6, // Full-screen triangle pair

    // Binding points
    UNIFORM_BINDING: 0,

    // Shader stages
    FRAGMENT_SHADER_STAGE: GPUShaderStage.FRAGMENT,

    // Pipeline types for different precision needs
    PIPELINE_TYPES: {
        STANDARD: 'standard',
        ENHANCED: 'enhanced',
        INFINITE_ZOOM: 'infinite_zoom'
    },

    // Render modes (using values from ShaderModes to avoid duplication)
    RENDER_MODES: ShaderModes
};

/**
 * Rendering quality and appearance constants
 * Controls the quality vs performance tradeoffs in rendering
 */
export const RENDERING_CONSTANTS = {
    COLOR_STABILIZATION_SMOOTHING: 0.8,
    BUFFER_UPDATE_EPSILON: 1e-10,
    DEFAULT_PRECISION_LEVEL: 0.0,
    DEFAULT_COLOR_SCALE: 1.0,
    DEFAULT_DETAIL_LEVEL: 0.0,

    // Anti-aliasing settings
    SUPERSAMPLING_FACTOR: 1.0,
    MAX_SUPERSAMPLING: 2.0
};

/**
 * Logging level constants
 * Controls the verbosity of application logging
 */
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Error messages
export const ERROR_MESSAGES = {
    WEBGPU_NOT_SUPPORTED: 'WebGPU is not supported in this browser',
    INITIALIZATION_FAILED: 'Failed to initialize the application',
    SHADER_COMPILATION_FAILED: 'Shader compilation failed',
    RENDER_PIPELINE_FAILED: 'Failed to create render pipeline',
    BUFFER_CREATION_FAILED: 'Failed to create buffer'
};

// Success messages
export const SUCCESS_MESSAGES = {
    APP_INITIALIZED: '🎨 Fractal Explorer initialized successfully',
    WEBGPU_READY: '📊 WebGPU renderer active',
    CONTROLS_READY: '🔧 Use keyboard shortcuts: M (modes), J (Julia), D (dual), R (reset)',
    INFINITE_ZOOM_READY: '🔍 Infinite Zoom: Press I to enable, H for help',
    EXPLORATION_READY: '🚀 Ready for extreme mathematical exploration!'
};
