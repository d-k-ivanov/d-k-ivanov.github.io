/**
 * Shader loading utility for WebGPU
 * Handles loading and processing of WGSL shader files
 */
import { logger } from '../utils/Logger.js';

/**
 * Shader loader class for managing WGSL files
 */
export class ShaderLoader
{
    constructor()
    {
        this.shaderCache = new Map();
        this.baseUrl = './src/shaders/';
    }

    /**
     * Load a shader file from the shaders directory
     * @param {string} filename - Shader filename (e.g., 'vertex.wgsl')
     * @returns {Promise<string>} Shader source code
     */
    async loadShader(filename)
    {
        // Check cache first
        if (this.shaderCache.has(filename))
        {
            logger.debug(`Shader ${filename} loaded from cache`);
            return this.shaderCache.get(filename);
        }

        try
        {
            const url = `${this.baseUrl}${filename}`;
            logger.debug(`Loading shader from ${url}`);

            const response = await fetch(url);
            if (!response.ok)
            {
                throw new Error(`Failed to load shader: ${response.status} ${response.statusText}`);
            }

            const shaderSource = await response.text();

            // Cache the shader
            this.shaderCache.set(filename, shaderSource);

            logger.info(`Shader ${filename} loaded successfully (${shaderSource.length} characters)`);
            return shaderSource;
        } catch (error)
        {
            logger.error(`Failed to load shader ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Load the vertex shader
     * @returns {Promise<string>} Vertex shader source
     */
    async loadVertexShader()
    {
        return this.loadShader('vertex.wgsl');
    }

    /**
     * Load the fractal fragment shader
     * @returns {Promise<string>} Fragment shader source
     */
    async loadFragmentShader()
    {
        return this.loadShader('fractal.wgsl');
    }

    /**
     * Load both vertex and fragment shaders
     * @returns {Promise<Object>} Object with vertex and fragment shader sources
     */
    async loadShaders()
    {
        try
        {
            const [vertexSource, fragmentSource] = await Promise.all([
                this.loadVertexShader(),
                this.loadFragmentShader()
            ]);

            return {
                vertex: vertexSource,
                fragment: fragmentSource
            };
        } catch (error)
        {
            logger.error('Failed to load shaders:', error);
            throw error;
        }
    }

    /**
     * Preprocess shader source with simple templating
     * @param {string} source - Shader source code
     * @param {Object} defines - Preprocessor defines
     * @returns {string} Processed shader source
     */
    preprocessShader(source, defines = {})
    {
        let processed = source;

        // Simple define replacement
        for (const [key, value] of Object.entries(defines))
        {
            const regex = new RegExp(`#define\\s+${key}\\s+.*`, 'g');
            processed = processed.replace(regex, `#define ${key} ${value}`);
        }

        return processed;
    }

    /**
     * Create a WebGPU shader module
     * @param {GPUDevice} device - WebGPU device
     * @param {string} source - Shader source code
     * @param {string} label - Shader label for debugging
     * @returns {GPUShaderModule} Created shader module
     */
    createShaderModule(device, source, label)
    {
        try
        {
            const shaderModule = device.createShaderModule({
                label,
                code: source,
            });

            logger.webgpu(`Created shader module: ${label}`);
            return shaderModule;
        } catch (error)
        {
            logger.error(`Failed to create shader module ${label}:`, error);
            throw error;
        }
    }

    /**
     * Load and create both shader modules
     * @param {GPUDevice} device - WebGPU device
     * @param {Object} defines - Optional preprocessor defines
     * @returns {Promise<Object>} Object with vertex and fragment shader modules
     */
    async createShaderModules(device, defines = {})
    {
        try
        {
            const shaders = await this.loadShaders();

            const vertexModule = this.createShaderModule(
                device,
                this.preprocessShader(shaders.vertex, defines),
                'Fractal Vertex Shader'
            );

            const fragmentModule = this.createShaderModule(
                device,
                this.preprocessShader(shaders.fragment, defines),
                'Fractal Fragment Shader'
            );

            return {
                vertex: vertexModule,
                fragment: fragmentModule
            };
        } catch (error)
        {
            logger.error('Failed to create shader modules:', error);
            throw error;
        }
    }

    /**
     * Clear the shader cache
     */
    clearCache()
    {
        this.shaderCache.clear();
        logger.debug('Shader cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats()
    {
        return {
            entries: this.shaderCache.size,
            files: Array.from(this.shaderCache.keys())
        };
    }

    /**
     * Validate WGSL shader syntax (basic check)
     * @param {string} source - Shader source code
     * @returns {Object} Validation result
     */
    validateShader(source)
    {
        const errors = [];
        const warnings = [];

        // Basic syntax checks
        if (!source.includes('@vertex') && !source.includes('@fragment'))
        {
            errors.push('No shader entry point found (@vertex or @fragment)');
        }

        // Check for common WGSL patterns
        if (source.includes('@vertex') && !source.includes('-> @builtin(position)'))
        {
            warnings.push('Vertex shader should return position builtin');
        }

        if (source.includes('@fragment') && !source.includes('-> @location(0)'))
        {
            warnings.push('Fragment shader should return color at location 0');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

// Create and export default shader loader instance
export const shaderLoader = new ShaderLoader();
