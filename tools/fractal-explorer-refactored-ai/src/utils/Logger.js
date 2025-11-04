/**
 * Logging utility with different log levels and formatting
 * Provides structured logging for debugging and development
 */
export class Logger
{
    constructor(level = 'info')
    {
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        this.currentLevel = this.levels[level] || this.levels.info;
        this.prefix = '[FractalExplorer]';
    }

    /**
     * Set logging level
     * @param {string} level - Log level: 'error', 'warn', 'info', 'debug'
     */
    setLevel(level)
    {
        this.currentLevel = this.levels[level] || this.levels.info;
    }

    /**
     * Format log message with timestamp
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @returns {string} Formatted message
     */
    formatMessage(level, message)
    {
        const timestamp = new Date().toTimeString().split(' ')[0];
        return `${this.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {...any} args - Additional arguments
     */
    error(message, ...args)
    {
        if (this.currentLevel >= this.levels.error)
        {
            console.error(this.formatMessage('error', message), ...args);
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {...any} args - Additional arguments
     */
    warn(message, ...args)
    {
        if (this.currentLevel >= this.levels.warn)
        {
            console.warn(this.formatMessage('warn', message), ...args);
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {...any} args - Additional arguments
     */
    info(message, ...args)
    {
        if (this.currentLevel >= this.levels.info)
        {
            console.log(this.formatMessage('info', message), ...args);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {...any} args - Additional arguments
     */
    debug(message, ...args)
    {
        if (this.currentLevel >= this.levels.debug)
        {
            console.log(this.formatMessage('debug', message), ...args);
        }
    }

    /**
     * Log WebGPU specific information
     * @param {string} operation - WebGPU operation name
     * @param {Object} details - Operation details
     */
    webgpu(operation, details = {})
    {
        this.debug(`WebGPU ${operation}`, details);
    }

    /**
     * Log performance information
     * @param {string} metric - Performance metric name
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement
     */
    performance(metric, value, unit = '')
    {
        this.debug(`Performance: ${metric} = ${value}${unit}`);
    }

    /**
     * Log fractal computation information
     * @param {string} type - Fractal type (julia, mandelbrot)
     * @param {Object} params - Fractal parameters
     */
    fractal(type, params)
    {
        this.debug(`Fractal ${type}:`, params);
    }
}

// Create default logger instance
export const logger = new Logger('info');
