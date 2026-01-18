const MAX_ITERS : u32 = 30u;                  // Mandelbrot iteration cap (higher = sharper boundary).
const ESCAPE_RADIUS_SQ : f32 = 4.0;           // Escape radius squared (|z|^2 > 4 means divergence).
const BASE_ZOOM_DIVISOR : f32 = 3.0;          // Base zoom: screen height divided by this value.
const BASE_CENTER : vec2f = vec2f(-0.5, 0.0); // Default center of the Mandelbrot set.

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

fn palette(t : f32) -> vec3f
{
    let a = vec3f(0.500, 0.500, 0.500);
    let b = vec3f(0.500, 0.500, 0.500);
    let c = vec3f(1.000, 1.000, 1.000);
    // let d = vec3f(0.000, 0.333, 0.667);
    let d = vec3f(0.263, 0.416, 0.557);
    return a + b * cos(6.2831853 * (c * t + d));
}

fn mandelbrotColor(c : vec2f) -> vec3f
{
    var z = vec2f(0.0, 0.0);
    var iter : u32 = 0u;

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
        return vec3f(0.1);
    }

    let mag = max(dot(z, z), 1e-12);
    let smoothIter = (f32(iter) + 1.0 - log2(log2(mag))) / f32(MAX_ITERS);
    let t = clamp(smoothIter, 0.0, 1.0);
    let intensity = t;
    let palette = palette(t);
    return palette * intensity;
}

@fragment
fn frag(input : FragmentInput) -> @location(0) vec4f
{
    let res = shaderUniforms.iResolution.xy;
    let fragCoord = input.Position.xy;
    let baseZoom = res.y / BASE_ZOOM_DIVISOR;
    let zoom = baseZoom;
    let center = BASE_CENTER;
    let c = (fragCoord - res * 0.5) / zoom + center;
    let color = mandelbrotColor(c);
    return vec4f(color, 1.0);
}
