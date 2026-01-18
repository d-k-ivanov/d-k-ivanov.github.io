const MAX_ITERS : u32 = 300u;                           // Iteration cap (higher = sharper boundary).
const ESCAPE_RADIUS_SQ : f32 = 4.0;                     // Escape radius squared (|z|^2 > 4 means divergence).
const BASE_ZOOM_DIVISOR : f32 = 3.0;                    // Base zoom: screen height divided by this value.
const BASE_CENTER : vec2f = vec2f(0.0, 0.0);            // View center in the complex plane.
const JULIA_STEP_FRAMES : f32 = 240.0;                  // Frames per keyframe when JULIA_SPEED = 1.0.
const JULIA_SPEED : f32 = 0.25;                         // Speed multiplier for advancing the c-parameter.
const JULIA_STEPS_COUNT : u32 = 6u;                     // Number of key points in the c-parameter cycle.
const JULIA_STEPS : array<vec2f, 6> = array<vec2f, 6>(  // Key c values for the Julia set animation.
    vec2f(-0.8, 0.156),
    vec2f(-0.4, 0.6),
    vec2f(0.285, 0.01),
    vec2f(-0.70176, -0.3842),
    vec2f(0.355, 0.355),
    vec2f(-0.54, 0.54)
);

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouse : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;

struct FragmentInput
{
    @builtin(position) Position : vec4f,
};

fn juliaConstant() -> vec2f
{
    let step = (f32(shaderUniforms.iFrame) * JULIA_SPEED) / JULIA_STEP_FRAMES;
    let idx0 = u32(step) % JULIA_STEPS_COUNT;
    let idx1 = (idx0 + 1u) % JULIA_STEPS_COUNT;
    let t = fract(step);
    let smoothT = t * t * (3.0 - 2.0 * t);
    return mix(JULIA_STEPS[idx0], JULIA_STEPS[idx1], smoothT);
}

fn juliaColor(z0 : vec2f) -> vec3f
{
    var z = z0;
    var iter : u32 = 0u;
    let c = juliaConstant();

    loop
    {
        if (iter >= MAX_ITERS)
        {
            break;
        }

        if (dot(z, z) > ESCAPE_RADIUS_SQ)
        {
            break;
        }

        z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter += 1u;
    }

    if (iter >= MAX_ITERS)
    {
        return vec3f(0.5);
    }

    let mag = max(dot(z, z), 1e-12);
    let smoothIter = (f32(iter) + 1.0 - log2(log2(mag))) / f32(MAX_ITERS);
    let t = clamp(smoothIter, 0.0, 1.0);
    let intensity = sqrt(t);
    let palette = 0.5 + 0.5 * cos(6.2831853 * (t + vec3f(0.0, 0.33, 0.67)));
    return palette * intensity;
}

@fragment
fn frag(input : FragmentInput) -> @location(0) vec4f
{
    let res = shaderUniforms.iResolution.xy;
    let fragCoord = input.Position.xy;
    let baseZoom = res.y / BASE_ZOOM_DIVISOR;
    let c = (fragCoord - res * 0.5) / baseZoom + BASE_CENTER;
    let color = juliaColor(c);
    return vec4f(color, 1.0);
}
