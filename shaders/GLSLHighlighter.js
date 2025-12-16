"use strict";

// GLSL syntax highlighting patterns
const GLSL_PATTERNS = [
    // Comments - must be first to avoid conflicts
    { pattern: /(\/\/.*$)/gm, class: "glsl-comment" },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, class: "glsl-comment" },

    // Preprocessor directives
    { pattern: /(#\s*(?:version|define|undef|if|ifdef|ifndef|else|elif|endif|error|pragma|extension|line)\b.*$)/gm, class: "glsl-preprocessor" },

    // Strings (rare in GLSL but possible in some extensions)
    { pattern: /("(?:[^"\\]|\\.)*")/g, class: "glsl-string" },

    // Numbers (floats, ints, hex)
    { pattern: /\b(\d+\.\d*(?:[eE][+-]?\d+)?[fF]?|\.\d+(?:[eE][+-]?\d+)?[fF]?|\d+[eE][+-]?\d+[fF]?|\d+[fF])\b/g, class: "glsl-number" },
    { pattern: /\b(0[xX][0-9a-fA-F]+[uU]?|\d+[uU]?)\b/g, class: "glsl-number" },

    // Keywords
    { pattern: /\b(attribute|const|uniform|varying|buffer|shared|coherent|volatile|restrict|readonly|writeonly|layout|centroid|flat|smooth|noperspective|patch|sample|break|continue|do|for|while|switch|case|default|if|else|subroutine|in|out|inout|true|false|invariant|precise|discard|return|struct|void)\b/g, class: "glsl-keyword" },

    // Storage qualifiers
    { pattern: /\b(lowp|mediump|highp|precision)\b/g, class: "glsl-qualifier" },

    // Types
    { pattern: /\b(float|double|int|uint|bool|vec2|vec3|vec4|dvec2|dvec3|dvec4|bvec2|bvec3|bvec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|mat2|mat3|mat4|mat2x2|mat2x3|mat2x4|mat3x2|mat3x3|mat3x4|mat4x2|mat4x3|mat4x4|dmat2|dmat3|dmat4|dmat2x2|dmat2x3|dmat2x4|dmat3x2|dmat3x3|dmat3x4|dmat4x2|dmat4x3|dmat4x4|sampler1D|sampler2D|sampler3D|samplerCube|sampler1DShadow|sampler2DShadow|samplerCubeShadow|sampler1DArray|sampler2DArray|sampler1DArrayShadow|sampler2DArrayShadow|isampler1D|isampler2D|isampler3D|isamplerCube|isampler1DArray|isampler2DArray|usampler1D|usampler2D|usampler3D|usamplerCube|usampler1DArray|usampler2DArray|sampler2DRect|sampler2DRectShadow|isampler2DRect|usampler2DRect|samplerBuffer|isamplerBuffer|usamplerBuffer|sampler2DMS|isampler2DMS|usampler2DMS|sampler2DMSArray|isampler2DMSArray|usampler2DMSArray|samplerCubeArray|samplerCubeArrayShadow|isamplerCubeArray|usamplerCubeArray|image1D|iimage1D|uimage1D|image2D|iimage2D|uimage2D|image3D|iimage3D|uimage3D|image2DRect|iimage2DRect|uimage2DRect|imageCube|iimageCube|uimageCube|imageBuffer|iimageBuffer|uimageBuffer|image1DArray|iimage1DArray|uimage1DArray|image2DArray|iimage2DArray|uimage2DArray|imageCubeArray|iimageCubeArray|uimageCubeArray|image2DMS|iimage2DMS|uimage2DMS|image2DMSArray|iimage2DMSArray|uimage2DMSArray|atomic_uint)\b/g, class: "glsl-type" },

    // Built-in variables
    { pattern: /\b(gl_Position|gl_PointSize|gl_ClipDistance|gl_CullDistance|gl_VertexID|gl_InstanceID|gl_PrimitiveID|gl_InvocationID|gl_Layer|gl_ViewportIndex|gl_FragCoord|gl_FrontFacing|gl_PointCoord|gl_SampleID|gl_SamplePosition|gl_SampleMaskIn|gl_FragDepth|gl_SampleMask|gl_NumWorkGroups|gl_WorkGroupSize|gl_WorkGroupID|gl_LocalInvocationID|gl_GlobalInvocationID|gl_LocalInvocationIndex)\b/g, class: "glsl-builtin-var" },

    // Built-in functions
    { pattern: /\b(radians|degrees|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|pow|exp|log|exp2|log2|sqrt|inversesqrt|abs|sign|floor|trunc|round|roundEven|ceil|fract|mod|modf|min|max|clamp|mix|step|smoothstep|isnan|isinf|floatBitsToInt|floatBitsToUint|intBitsToFloat|uintBitsToFloat|fma|frexp|ldexp|packUnorm2x16|packSnorm2x16|packUnorm4x8|packSnorm4x8|unpackUnorm2x16|unpackSnorm2x16|unpackUnorm4x8|unpackSnorm4x8|packHalf2x16|unpackHalf2x16|packDouble2x32|unpackDouble2x32|length|distance|dot|cross|normalize|faceforward|reflect|refract|matrixCompMult|outerProduct|transpose|determinant|inverse|lessThan|lessThanEqual|greaterThan|greaterThanEqual|equal|notEqual|any|all|not|uaddCarry|usubBorrow|umulExtended|imulExtended|bitfieldExtract|bitfieldInsert|bitfieldReverse|bitCount|findLSB|findMSB|textureSize|textureQueryLod|textureQueryLevels|textureSamples|texture|textureProj|textureLod|textureOffset|texelFetch|texelFetchOffset|textureProjOffset|textureLodOffset|textureProjLod|textureProjLodOffset|textureGrad|textureGradOffset|textureProjGrad|textureProjGradOffset|textureGather|textureGatherOffset|textureGatherOffsets|atomicCounterIncrement|atomicCounterDecrement|atomicCounter|atomicCounterAdd|atomicCounterSubtract|atomicCounterMin|atomicCounterMax|atomicCounterAnd|atomicCounterOr|atomicCounterXor|atomicCounterExchange|atomicCounterCompSwap|atomicAdd|atomicMin|atomicMax|atomicAnd|atomicOr|atomicXor|atomicExchange|atomicCompSwap|imageSize|imageSamples|imageLoad|imageStore|imageAtomicAdd|imageAtomicMin|imageAtomicMax|imageAtomicAnd|imageAtomicOr|imageAtomicXor|imageAtomicExchange|imageAtomicCompSwap|dFdx|dFdy|dFdxFine|dFdyFine|dFdxCoarse|dFdyCoarse|fwidth|fwidthFine|fwidthCoarse|interpolateAtCentroid|interpolateAtSample|interpolateAtOffset|barrier|memoryBarrier|memoryBarrierAtomicCounter|memoryBarrierBuffer|memoryBarrierShared|memoryBarrierImage|groupMemoryBarrier|EmitStreamVertex|EndStreamPrimitive|EmitVertex|EndPrimitive|noise1|noise2|noise3|noise4)\b/g, class: "glsl-function" }
];

// WGSL syntax highlighting patterns
const WGSL_PATTERNS = [
    // Comments - same as GLSL
    { pattern: /(\/\/.*$)/gm, class: "glsl-comment" },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, class: "glsl-comment" },

    // Attributes (@vertex, @binding, etc)
    { pattern: /(@[a-zA-Z_][\w:]*)/g, class: "glsl-qualifier" },

    // Strings
    { pattern: /("(?:[^"\\]|\\.)*")/g, class: "glsl-string" },

    // Numbers (floats/ints)
    { pattern: /\b(\d+\.\d*(?:[eE][+-]?\d+)?[fF]?|\.\d+(?:[eE][+-]?\d+)?[fF]?|\d+[eE][+-]?\d+[fF]?|\d+[fF])\b/g, class: "glsl-number" },
    { pattern: /\b(0[xX][0-9a-fA-F]+|0b[01]+|\d+)(u|i)?\b/g, class: "glsl-number" },

    // Keywords
    { pattern: /\b(fn|let|var|const|override|struct|return|if|else|break|continue|loop|while|for|switch|case|default|fallthrough|discard|true|false|workgroup|uniform|storage|private|function)\b/g, class: "glsl-keyword" },

    // Types
    { pattern: /\b(f32|f16|i32|u32|bool|vec2|vec3|vec4|mat2x2|mat2x3|mat2x4|mat3x2|mat3x3|mat3x4|mat4x2|mat4x3|mat4x4|array|texture_\w+|sampler|sampler_comparison|ptr|atomic|vec2f|vec3f|vec4f)\b/g, class: "glsl-type" },

    // Built-in variables/functions (basic)
    { pattern: /\b(global_invocation_id|local_invocation_id|workgroup_id|num_workgroups|workgroup_size|dpdx|dpdy|dpdxCoarse|dpdyCoarse|dpdxFine|dpdyFine|fwidth|textureSample|textureSampleLevel|textureLoad|textureDimensions)\b/g, class: "glsl-builtin-var" }
];

/**
 * Simple regex-based highlighter for GLSL and WGSL used in the editor previews.
 */
export class GLSLHighlighter
{
    constructor()
    {
        this.cache = new Map();
    }

    /**
     * Heuristically determines if code is WGSL or GLSL.
     */
    detectLanguage(code)
    {
        const lower = code.toLowerCase();
        if (lower.includes("@vertex") || lower.includes("@fragment") || lower.includes("@compute") || /@group\s*\(\d+\)/i.test(code))
        {
            return "wgsl";
        }
        if (/^\s*#version/m.test(code) || /\bprecision\s+(lowp|mediump|highp)\b/.test(code))
        {
            return "glsl";
        }
        return "glsl";
    }

    /**
     * Returns HTML-highlighted code, cached for performance.
     */
    highlight(code)
    {
        const makePlaceholder = (prefix, index) => `\x00${prefix}${"X".repeat(index + 1)}\x00`;
        let placeholderIndex = 0;

        // Check cache
        if (this.cache.has(code))
        {
            return this.cache.get(code);
        }

        const language = this.detectLanguage(code);
        const patterns = language === "wgsl" ? WGSL_PATTERNS : GLSL_PATTERNS;

        // Escape HTML
        let highlighted = this.escapeHtml(code);

        // Track regions that shouldn't be re-highlighted (comments, strings)
        const protectedRegions = [];
        const addProtected = (html) =>
        {
            const placeholder = makePlaceholder("P", placeholderIndex++);
            protectedRegions.push({ placeholder, html });
            return placeholder;
        };

        // First pass: protect comments and strings
        highlighted = highlighted.replace(/(\/\/.*$)/gm, (match, p1, offset) =>
        {
            return addProtected(`<span class="glsl-comment">${p1}</span>`);
        });

        highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, (match, p1) =>
        {
            return addProtected(`<span class="glsl-comment">${p1}</span>`);
        });

        if (language === "glsl")
        {
            highlighted = highlighted.replace(/(#\s*(?:version|define|undef|if|ifdef|ifndef|else|elif|endif|error|pragma|extension|line)\b.*$)/gm, (match, p1) =>
            {
                return addProtected(`<span class="glsl-preprocessor">${p1}</span>`);
            });
        }

        // Protect strings so inner tokens do not get highlighted
        highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, (match, p1) =>
        {
            return addProtected(`<span class="glsl-string">${p1}</span>`);
        });

        // Apply remaining patterns
        const skipIndices = language === "glsl"
            ? new Set([0, 1, 2, 3]) // comments, block comments, preprocessor, strings handled
            : new Set([0, 1, 3]);   // comments, block comments, strings handled (keep attributes)

        patterns.forEach(({ pattern, class: className }, idx) =>
        {
            if (skipIndices.has(idx))
            {
                return;
            }
            highlighted = highlighted.replace(pattern, `<span class="${className}">$1</span>`);
        });

        // Restore protected regions
        for (const { placeholder, html } of protectedRegions)
        {
            highlighted = highlighted.replace(placeholder, html);
        }

        // Cache result (limit cache size)
        if (this.cache.size > 100)
        {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(code, highlighted);

        return highlighted;
    }

    /**
     * Escapes HTML entities inside shader source.
     */
    escapeHtml(text)
    {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /**
     * Drops cached highlight results.
     */
    clearCache()
    {
        this.cache.clear();
    }
}
