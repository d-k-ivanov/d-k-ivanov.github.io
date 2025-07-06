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
        this.includedFiles = new Set(); // Track files that have been included to prevent circular includes
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

                let shaderSource = await response.text();

                // Process #include directives
                this.includedFiles.clear(); // Reset included files tracking
                shaderSource = await this.processIncludes(shaderSource, filename);

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
     * Process and inline #include directives in shader code
     * @param {string} source - Shader source code
     * @param {string} currentFile - Current file being processed (to prevent circular includes)
     * @returns {Promise<string>} Processed shader source with includes inlined
     */
    async processIncludes(source, currentFile)
    {
        // Regular expression to match #include directives
        const includeRegex = /^\s*#include\s+"([^"]+)"\s*$/gm;

        // Track this file as being processed to detect circular includes
        this.includedFiles.add(currentFile);

        let result = source;
        let match;
        let matches = [];

        // Find all includes first
        while ((match = includeRegex.exec(source)) !== null)
        {
            const includePath = match[1];
            matches.push({
                fullMatch: match[0],
                includePath
            });
        }

        // Process includes one by one
        for (const { fullMatch, includePath } of matches)
        {
            // Check for circular includes
            if (this.includedFiles.has(includePath))
            {
                logger.warn(`Circular include detected: ${includePath} in ${currentFile}`);
                // Replace with a comment instead of the actual include
                result = result.replace(fullMatch, `// Circular include skipped: ${includePath}`);
                continue;
            }

            try
            {
                // Load the included file
                const includeUrl = `${this.baseUrl}${includePath}`;
                logger.debug(`Loading included shader: ${includeUrl} from ${currentFile}`);

                const response = await fetch(includeUrl);
                if (!response.ok)
                {
                    throw new Error(`Failed to load included shader: ${response.status} ${response.statusText}`);
                }

                let includedSource = await response.text();

                // Process nested includes recursively
                includedSource = await this.processIncludes(includedSource, includePath);

                // Replace the include directive with the included content
                // Add comments to indicate the included file for easier debugging
                const replacement = `
// BEGIN INCLUDED FILE: ${includePath}
${includedSource}
// END INCLUDED FILE: ${includePath}
`;
                result = result.replace(fullMatch, replacement);

            } catch (error)
            {
                logger.error(`Failed to process include ${includePath}:`, error);
                // Replace with error comment
                result = result.replace(
                    fullMatch,
                    `// ERROR: Failed to include "${includePath}": ${error.message}`
                );
            }
        }

        // Remove this file from the tracking set after processing is complete
        this.includedFiles.delete(currentFile);

        return result;
    }

    /**
     * Apply preprocessor definitions to shader code
     * @param {string} source - Shader source code
     * @param {Object} defines - Object with key-value pairs of definitions
     * @returns {string} Processed shader with defines applied
     */
    preprocessShader(source, defines)
    {
        let result = source;

        // Add define declarations at the top of the shader
        if (defines)
        {
            let defineText = "// Auto-generated defines\n";
            for (const [key, value] of Object.entries(defines))
            {
                defineText += `const ${key} = ${value};\n`;
            }
            result = defineText + result;
        }

        return result;
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
