/**
 * Performance monitoring and frame rate management utility
 * Provides FPS tracking and performance metrics for the fractal renderer
 */
export class Performance
{
    constructor()
    {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameTime = 0;
        this.updateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = this.lastTime;

        this.isMonitoring = false;
        this.stats = {
            averageFps: 0,
            minFps: Infinity,
            maxFps: 0,
            totalFrames: 0
        };
    }

    /**
     * Start performance monitoring
     */
    start()
    {
        this.isMonitoring = true;
        this.lastTime = performance.now();
        this.lastFpsUpdate = this.lastTime;
        this.frameCount = 0;
        this.stats.totalFrames = 0;
    }

    /**
     * Stop performance monitoring
     */
    stop()
    {
        this.isMonitoring = false;
    }

    /**
     * Update performance metrics (call once per frame)
     */
    update()
    {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        this.frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.frameCount++;
        this.stats.totalFrames++;

        // Update FPS calculation
        if (currentTime - this.lastFpsUpdate >= this.updateInterval)
        {
            this.fps = (this.frameCount * 1000) / (currentTime - this.lastFpsUpdate);

            // Update statistics
            this.stats.averageFps = (this.stats.averageFps + this.fps) / 2;
            this.stats.minFps = Math.min(this.stats.minFps, this.fps);
            this.stats.maxFps = Math.max(this.stats.maxFps, this.fps);

            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance data
     */
    getMetrics()
    {
        return {
            fps: Math.round(this.fps * 10) / 10,
            frameTime: Math.round(this.frameTime * 100) / 100,
            averageFps: Math.round(this.stats.averageFps * 10) / 10,
            minFps: this.stats.minFps === Infinity ? 0 : Math.round(this.stats.minFps * 10) / 10,
            maxFps: Math.round(this.stats.maxFps * 10) / 10,
            totalFrames: this.stats.totalFrames
        };
    }

    /**
     * Reset statistics
     */
    reset()
    {
        this.stats = {
            averageFps: 0,
            minFps: Infinity,
            maxFps: 0,
            totalFrames: 0
        };
    }

    /**
     * Check if performance is good (for adaptive quality)
     * @returns {boolean} True if performance is acceptable
     */
    isPerformanceGood()
    {
        return this.fps > 30; // Consider 30+ FPS as good performance
    }

    /**
     * Get performance level for adaptive rendering
     * @returns {string} Performance level: 'high', 'medium', 'low'
     */
    getPerformanceLevel()
    {
        if (this.fps >= 50) return 'high';
        if (this.fps >= 30) return 'medium';
        return 'low';
    }
}
