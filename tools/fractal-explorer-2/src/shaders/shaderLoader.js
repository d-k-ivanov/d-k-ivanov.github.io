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
        this.pendingLoads = new Map(); // Track in-progress loads to avoid duplicate requests
    }

    /**
     * Load a shader file from the shaders directory
     * @param {string} filename - Shader filename (e.g., 'vertex.wgsl')
     * @param {Object} [defines] - Optional preprocessor defines
     * @returns {Promise<string>} Shader source code
     */
    async loadShader(filename, defines = null)
    {
        // Create a cache key that includes both the filename and any defines
        const cacheKey = defines ? `${filename}_${JSON.stringify(defines)}` : filename;

        // Check cache first
        if (this.shaderCache.has(cacheKey))
        {
            logger.debug(`Shader ${filename} loaded from cache`);
            return this.shaderCache.get(cacheKey);
        }

        // Check if this shader is already being loaded
        if (this.pendingLoads.has(cacheKey))
        {
            logger.debug(`Reusing pending shader load for ${filename}`);
            return this.pendingLoads.get(cacheKey);
        }

        try
        {
            const url = `${this.baseUrl}${filename}`;
            logger.debug(`Loading shader from ${url}`);

            // Create a new pending load promise
            const loadPromise = (async () =>
            {
                const response = await fetch(url);
                if (!response.ok)
                {
                    throw new Error(`Failed to load shader: ${response.status} ${response.statusText}`);
                }

                const shaderSource = await response.text();

                // Process the shader source with any defines
                const processedSource = defines ?
                    this.preprocessShader(shaderSource, defines) :
                    shaderSource;

                // Cache the shader
                this.shaderCache.set(cacheKey, processedSource);

                logger.info(`Shader ${filename} loaded successfully (${processedSource.length} characters)`);
                return processedSource;
            })();

            // Store the pending promise
            this.pendingLoads.set(cacheKey, loadPromise);

            // Remove from pending when done (regardless of success/failure)
            loadPromise.finally(() =>
            {
                this.pendingLoads.delete(cacheKey);
            });

            return loadPromise;
        } catch (error)
        {
            logger.error(`Failed to load shader ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Load the vertex shader
     * @param {Object} [defines] - Optional preprocessor defines
     * @returns {Promise<string>} Vertex shader source
     */
    async loadVertexShader(defines = null)
    {
        return this.loadShader('vertex.wgsl', defines);
    }

    /**
     * Load the standard fractal fragment shader
     * @param {Object} [defines] - Optional preprocessor defines
     * @returns {Promise<string>} Fragment shader source
     */
    async loadFragmentShader(defines = null)
    {
        return this.loadShader('fractal.wgsl', defines);
    }

    /**
     * Load the enhanced precision fractal shader
     * @param {Object} [defines] - Optional preprocessor defines
     * @returns {Promise<string>} Enhanced fragment shader source
     */
    async loadEnhancedFragmentShader(defines = null)
    {
        return this.loadShader('fractal_enhanced.wgsl', defines);
    }

    /**
     * Load both vertex and fragment shaders
     * @param {string} [fragmentShaderName='fractal.wgsl'] - Fragment shader filename
     * @param {Object} [defines] - Optional preprocessor defines
     * @returns {Promise<Object>} Object with vertex and fragment shader sources
     */
    async loadShaders(fragmentShaderName = 'fractal.wgsl', defines = null)
    {
        try
        {
            const [vertexSource, fragmentSource] = await Promise.all([
                this.loadVertexShader(defines),
                this.loadShader(fragmentShaderName, defines)
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
        if (!defines || Object.keys(defines).length === 0)
        {
            return source;
        }

        let processedSource = source;

        // Replace defines in the form of ${DEFINE_NAME}
        for (const [key, value] of Object.entries(defines))
        {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            processedSource = processedSource.replace(regex, value);
        }

        // Handle conditional compilation with /*#ifdef DEFINE_NAME */ sections
        for (const [key, value] of Object.entries(defines))
        {
            if (value)
            {
                // Remove the ifdef/endif for enabled defines (keep the content)
                const ifdefRegex = new RegExp(`\\/\\*#ifdef ${key}\\s*\\*\\/([\\s\\S]*?)\\/\\*#endif\\s*\\*\\/`, 'g');
                processedSource = processedSource.replace(ifdefRegex, '$1');
            } else
            {
                // Remove the entire ifdef/endif section for disabled defines
                const ifdefRegex = new RegExp(`\\/\\*#ifdef ${key}\\s*\\*\\/[\\s\\S]*?\\/\\*#endif\\s*\\*\\/`, 'g');
                processedSource = processedSource.replace(ifdefRegex, '');
            }
        }

        return processedSource;
    }

    /**
     * Clear the shader cache
     */
    clearCache()
    {
        this.shaderCache.clear();
        logger.debug('Shader cache cleared');
    }
}

// Create and export default shader loader instance
export const shaderLoader = new ShaderLoader();
