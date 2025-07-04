/**
 * Browser compatibility detection for WebGPU
 * Provides detailed support information and recommendations
 */
export class BrowserSupport
{
    /**
     * Check WebGPU support and provide detailed status
     * @returns {Object} Support status and recommendations
     */
    static checkWebGPUSupport()
    {
        const isWebGPUAvailable = 'gpu' in navigator;

        const recommendations = [
            {
                browser: 'Chrome 113+',
                instruction: 'Enable chrome://flags/#enable-unsafe-webgpu'
            },
            {
                browser: 'Firefox Nightly',
                instruction: 'Enable dom.webgpu.enabled in about:config'
            },
            {
                browser: 'Safari Technology Preview 163+',
                instruction: 'WebGPU enabled by default'
            },
            {
                browser: 'Edge 113+',
                instruction: 'Enable edge://flags/#enable-unsafe-webgpu'
            }
        ];

        return {
            isSupported: isWebGPUAvailable,
            recommendations,
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }

    /**
     * Get browser-specific WebGPU implementation details
     * @returns {Object} Implementation details
     */
    static getWebGPUImplementationInfo()
    {
        if (!('gpu' in navigator))
        {
            return { available: false };
        }

        return {
            available: true,
            vendor: navigator.gpu.requestAdapter ? 'Available' : 'Unknown',
            timestamp: Date.now()
        };
    }

    /**
     * Check for required WebGPU features
     * @param {GPUAdapter} adapter - WebGPU adapter
     * @returns {Object} Feature support status
     */
    static checkRequiredFeatures(adapter)
    {
        if (!adapter)
        {
            return { supported: false, missing: ['adapter'] };
        }

        const requiredFeatures = [];
        const supportedFeatures = Array.from(adapter.features);
        const missingFeatures = requiredFeatures.filter(
            feature => !supportedFeatures.includes(feature)
        );

        return {
            supported: missingFeatures.length === 0,
            missing: missingFeatures,
            available: supportedFeatures
        };
    }

    /**
     * Validate WebGPU limits for fractal computation
     * @param {GPUAdapter} adapter - WebGPU adapter
     * @returns {Object} Limits validation
     */
    static validateComputeLimits(adapter)
    {
        if (!adapter)
        {
            return { adequate: false, reason: 'No adapter available' };
        }

        const limits = adapter.limits;
        const requirements = {
            maxUniformBufferBindingSize: 256,  // Minimum for fractal uniforms
            maxStorageBufferBindingSize: 1024, // For potential future features
            maxTextureDimension2D: 2048        // For reasonable canvas sizes
        };

        const inadequate = [];
        for (const [limit, required] of Object.entries(requirements))
        {
            if (limits[limit] < required)
            {
                inadequate.push({ limit, required, actual: limits[limit] });
            }
        }

        return {
            adequate: inadequate.length === 0,
            issues: inadequate,
            limits: {
                maxUniformBufferBindingSize: limits.maxUniformBufferBindingSize,
                maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
                maxTextureDimension2D: limits.maxTextureDimension2D
            }
        };
    }
}
