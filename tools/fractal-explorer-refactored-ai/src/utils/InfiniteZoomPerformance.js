/**
 * Infinite Zoom Performance Monitor
 * Monitors and optimizes performance for extreme zoom levels
 */
export class InfiniteZoomPerformanceMonitor
{
    constructor()
    {
        this.frameTime = 0;
        this.avgFrameTime = 16.67; // Target 60 FPS
        this.frameTimeHistory = [];
        this.maxHistorySize = 30;

        this.performanceThresholds = {
            excellent: 16.67,   // 60+ FPS
            good: 33.33,        // 30+ FPS
            poor: 66.67,        // 15+ FPS
            critical: 100       // 10+ FPS
        };

        this.autoOptimization = true;
        this.lastOptimizationTime = 0;
        this.optimizationCooldown = 2000; // 2 seconds

        this.metrics = {
            iterationCount: 0,
            zoomLevel: 1,
            precisionLevel: 0,
            renderTime: 0,
            gpuUtilization: 0
        };
    }

    /**
     * Update performance metrics
     * @param {number} frameTime - Current frame time in ms
     * @param {Object} zoomInfo - Current zoom information
     * @param {number} iterationCount - Current iteration count
     */
    update(frameTime, zoomInfo, iterationCount)
    {
        this.frameTime = frameTime;
        this.frameTimeHistory.push(frameTime);

        // Maintain history size
        if (this.frameTimeHistory.length > this.maxHistorySize)
        {
            this.frameTimeHistory.shift();
        }

        // Calculate average
        this.avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;

        // Update metrics
        this.metrics.iterationCount = iterationCount;
        this.metrics.zoomLevel = zoomInfo.zoom;
        this.metrics.precisionLevel = zoomInfo.precisionLevel;
        this.metrics.renderTime = frameTime;

        // Check if optimization is needed
        if (this.autoOptimization && this.shouldOptimize())
        {
            this.performOptimization(zoomInfo);
        }
    }

    /**
     * Check if performance optimization is needed
     * @returns {boolean} True if optimization should be performed
     */
    shouldOptimize()
    {
        const now = Date.now();

        // Respect cooldown period
        if (now - this.lastOptimizationTime < this.optimizationCooldown)
        {
            return false;
        }

        // Check if performance is below threshold
        return this.avgFrameTime > this.performanceThresholds.poor;
    }

    /**
     * Perform automatic performance optimization
     * @param {Object} zoomInfo - Current zoom information
     */
    performOptimization(zoomInfo)
    {
        const perfLevel = this.getPerformanceLevel();
        const recommendations = this.getOptimizationRecommendations(perfLevel, zoomInfo);

        console.log(`🔧 Auto-optimization triggered (${perfLevel} performance)`);
        console.log('Recommendations:', recommendations);

        this.lastOptimizationTime = Date.now();

        // Emit optimization event
        this.emit('performanceOptimization', {
            performanceLevel: perfLevel,
            recommendations: recommendations,
            metrics: { ...this.metrics }
        });
    }

    /**
     * Get current performance level description
     * @returns {string} Performance level
     */
    getPerformanceLevel()
    {
        if (this.avgFrameTime <= this.performanceThresholds.excellent)
        {
            return 'excellent';
        }
        else if (this.avgFrameTime <= this.performanceThresholds.good)
        {
            return 'good';
        }
        else if (this.avgFrameTime <= this.performanceThresholds.poor)
        {
            return 'poor';
        }
        else
        {
            return 'critical';
        }
    }

    /**
     * Get optimization recommendations based on performance and zoom level
     * @param {string} perfLevel - Current performance level
     * @param {Object} zoomInfo - Current zoom information
     * @returns {Array} Optimization recommendations
     */
    getOptimizationRecommendations(perfLevel, zoomInfo)
    {
        const recommendations = [];

        // Performance-based recommendations
        switch (perfLevel)
        {
            case 'critical':
                recommendations.push('Reduce iteration count by 50%');
                recommendations.push('Lower precision level if possible');
                recommendations.push('Consider switching to performance mode');
                break;

            case 'poor':
                recommendations.push('Reduce iteration count by 25%');
                if (zoomInfo.precisionLevel > 2)
                {
                    recommendations.push('Consider reducing precision level');
                }
                break;

            case 'good':
                if (this.metrics.iterationCount > 4096)
                {
                    recommendations.push('Iteration count may be too high for current zoom');
                }
                break;
        }

        // Zoom-level specific recommendations
        if (zoomInfo.zoom > 1e30)
        {
            recommendations.push('At extreme zoom levels, consider using perturbation theory');
            recommendations.push('High iteration counts (8192+) may be necessary');
        }
        else if (zoomInfo.zoom > 1e15)
        {
            recommendations.push('High-precision mode is optimal at this zoom level');
            recommendations.push('Adaptive iteration scaling recommended');
        }
        else if (zoomInfo.zoom > 1e6)
        {
            recommendations.push('Enhanced precision mode provides good quality/performance balance');
        }

        return recommendations;
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getStatistics()
    {
        const fps = 1000 / this.avgFrameTime;
        const minFrameTime = Math.min(...this.frameTimeHistory);
        const maxFrameTime = Math.max(...this.frameTimeHistory);

        return {
            averageFPS: Math.round(fps * 10) / 10,
            averageFrameTime: Math.round(this.avgFrameTime * 100) / 100,
            minFrameTime: Math.round(minFrameTime * 100) / 100,
            maxFrameTime: Math.round(maxFrameTime * 100) / 100,
            performanceLevel: this.getPerformanceLevel(),
            frameCount: this.frameTimeHistory.length,
            metrics: { ...this.metrics }
        };
    }

    /**
     * Get performance recommendations for current state
     * @param {Object} zoomInfo - Current zoom information
     * @returns {Object} Recommendations
     */
    getRecommendations(zoomInfo)
    {
        const perfLevel = this.getPerformanceLevel();
        const recommendations = this.getOptimizationRecommendations(perfLevel, zoomInfo);

        return {
            performanceLevel: perfLevel,
            recommendations: recommendations,
            autoOptimizationEnabled: this.autoOptimization,
            statistics: this.getStatistics()
        };
    }

    /**
     * Enable or disable auto-optimization
     * @param {boolean} enabled - Whether to enable auto-optimization
     */
    setAutoOptimization(enabled)
    {
        this.autoOptimization = enabled;
        console.log(`🔧 Auto-optimization ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reset performance metrics
     */
    reset()
    {
        this.frameTimeHistory = [];
        this.avgFrameTime = 16.67;
        this.lastOptimizationTime = 0;
        this.metrics = {
            iterationCount: 0,
            zoomLevel: 1,
            precisionLevel: 0,
            renderTime: 0,
            gpuUtilization: 0
        };
    }

    /**
     * Simple event emitter implementation
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data)
    {
        // For now, just log events. Could be extended with proper event system.
        console.log(`Performance Event: ${event}`, data);
    }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer
{
    /**
     * Calculate optimal iteration count based on zoom level and performance target
     * @param {number} zoomLevel - Current zoom level
     * @param {number} precisionLevel - Current precision level
     * @param {string} performanceTarget - Target performance level
     * @returns {number} Recommended iteration count
     */
    static calculateOptimalIterations(zoomLevel, precisionLevel, performanceTarget = 'good')
    {
        const baseIterations = 256;

        // Base scaling factor based on zoom
        let zoomFactor = Math.log10(Math.max(1, zoomLevel)) * 40;

        // Precision level adjustments
        const precisionMultipliers = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0];
        const precisionMultiplier = precisionMultipliers[Math.min(precisionLevel, 5)] || 3.0;

        // Performance target adjustments
        const performanceMultipliers = {
            excellent: 0.7,
            good: 1.0,
            poor: 1.3,
            critical: 1.6
        };
        const performanceMultiplier = performanceMultipliers[performanceTarget] || 1.0;

        // Calculate final iteration count
        const iterationCount = baseIterations + (zoomFactor * precisionMultiplier * performanceMultiplier);

        // Apply reasonable bounds
        return Math.min(8192, Math.max(128, Math.round(iterationCount)));
    }

    /**
     * Get performance-optimized shader parameters
     * @param {Object} zoomInfo - Current zoom information
     * @param {string} performanceLevel - Current performance level
     * @returns {Object} Optimized parameters
     */
    static getOptimizedShaderParams(zoomInfo, performanceLevel)
    {
        const params = {
            useEnhancedPrecision: true,
            usePerturbation: false,
            colorScale: 1.0,
            detailLevel: zoomInfo.precisionLevel
        };

        // Adjust based on performance level
        switch (performanceLevel)
        {
            case 'critical':
                params.useEnhancedPrecision = zoomInfo.precisionLevel > 2;
                params.usePerturbation = false;
                params.detailLevel = Math.max(0, zoomInfo.precisionLevel - 1);
                break;

            case 'poor':
                params.usePerturbation = zoomInfo.precisionLevel > 3;
                params.detailLevel = Math.max(0, zoomInfo.precisionLevel - 1);
                break;

            case 'good':
            case 'excellent':
                params.usePerturbation = zoomInfo.precisionLevel > 2;
                break;
        }

        return params;
    }
}
