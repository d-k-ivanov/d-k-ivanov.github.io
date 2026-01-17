const MAX_H : u32 = 15u;
const MAX_DEGREE : u32 = 14u;
const MAX_COEFFS : u32 = 15u;
const RNG_SEED : u32 = 0x1f2e3d4cu;
const MAX_ITERS : u32 = 5000u;
const RESTART_ITERS : u32 = 500u;
const CONVERGENCE_EPS : f32 = 1e-12;
const DATA_OFFSET : u32 = 8u;
const HEADER_COUNT_IDX : u32 = 0u;
const HEADER_H_IDX : u32 = 1u;
const HEADER_I_IDX : u32 = 2u;
const HEADER_SIGN_IDX : u32 = 3u;
const HEADER_STATE_IDX : u32 = 4u;
const HEADER_RNG_IDX : u32 = 5u;
const HEADER_STATE_INIT : u32 = 0u;
const HEADER_STATE_ACTIVE : u32 = 1u;
const HEADER_STATE_DONE : u32 = 2u;
const SIGN_SENTINEL : u32 = 65535u;
const MAX_SIGNS_PER_DISPATCH : u32 = 8u;

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
@group(0) @binding(1) var<storage, read_write> packedXY : array<u32>;
@group(0) @binding(3) var<storage, read_write> packedMeta : array<f32>;

fn rand01(state : ptr<function, u32>) -> f32
{
    *state = (*state * 1664525u) + 1013904223u;
    return f32(*state) / 4294967296.0;
}

fn randSigned(state : ptr<function, u32>) -> f32
{
    return rand01(state) * 2.0 - 1.0;
}

fn cMul(a : vec2f, b : vec2f) -> vec2f
{
    return vec2f(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

fn cDiv(a : vec2f, b : vec2f) -> vec2f
{
    let denom = dot(b, b);
    return vec2f((a.x * b.x + a.y * b.y) / denom, (a.y * b.x - a.x * b.y) / denom);
}

fn findRoots(
    coeffs : ptr<function, array<vec2f, MAX_COEFFS>>,
    order : u32,
    rng : ptr<function, u32>,
    roots : ptr<function, array<vec2f, MAX_DEGREE>>
) -> u32
{
    var o = order;
    var rootCount : u32 = 0u;

    loop
    {
        if (o == 0u)
        {
            break;
        }

        if (o == 1u)
        {
            let c0 = (*coeffs)[0];
            let c1 = (*coeffs)[1];
            let denom = dot(c1, c1);
            if (denom == 0.0)
            {
                return 0u;
            }
            let root = cDiv(vec2f(-c0.x, -c0.y), c1);
            (*roots)[rootCount] = root;
            rootCount += 1u;
            break;
        }

        var r = vec2f(randSigned(rng), randSigned(rng));
        var iter : u32 = 0u;
        var restart : u32 = 0u;

        loop
        {
            if (restart == RESTART_ITERS)
            {
                r = vec2f(randSigned(rng), randSigned(rng));
                restart = 0u;
            }
            else
            {
                restart += 1u;
            }

            if (iter >= MAX_ITERS)
            {
                return 0u;
            }
            iter += 1u;

            let prev = r;
            var f = vec2f(0.0, 0.0);
            var d = vec2f(0.0, 0.0);
            var p = vec2f(1.0, 0.0);

            for (var n : u32 = 0u; n < o; n++)
            {
                let c = (*coeffs)[n];
                f = f + cMul(p, c);

                let c1 = (*coeffs)[n + 1u];
                let factor = f32(n + 1u);
                d = d + cMul(p, c1) * factor;

                p = cMul(p, r);
            }

            f = f + cMul(p, (*coeffs)[o]);

            let denom = dot(d, d);
            if (denom == 0.0)
            {
                return 0u;
            }

            let step = cDiv(f, d);
            r = r - step;

            let diff = r - prev;
            if (dot(diff, diff) <= CONVERGENCE_EPS)
            {
                break;
            }
        }

        (*roots)[rootCount] = r;
        rootCount += 1u;

        var n = o;
        loop
        {
            if (n == 0u)
            {
                break;
            }
            let idx = n - 1u;
            (*coeffs)[idx] = (*coeffs)[idx] + cMul(r, (*coeffs)[n]);
            n = idx;
        }

        for (var n2 : u32 = 0u; n2 < o; n2++)
        {
            (*coeffs)[n2] = (*coeffs)[n2 + 1u];
        }

        o -= 1u;
    }

    return rootCount;
}

fn advanceCursor(h : ptr<function, u32>, i : ptr<function, u32>, sign : ptr<function, u32>) -> bool
{
    if (*i < 2u)
    {
        *h = *h + 1u;
        if (*h > MAX_H)
        {
            return true;
        }
        *i = (1u << (*h - 1u)) - 1u;
    }
    else
    {
        *i = *i - 2u;
    }

    *sign = SIGN_SENTINEL;
    return false;
}

@compute @workgroup_size(64)
fn comp(@builtin(global_invocation_id) gid : vec3u)
{
    if (gid.x != 0u)
    {
        return;
    }

    let capacity = shaderUniforms.iGridSize.x * shaderUniforms.iGridSize.y * shaderUniforms.iGridSize.z;
    if (capacity <= DATA_OFFSET)
    {
        return;
    }

    var count = u32(packedMeta[HEADER_COUNT_IDX]);
    var h = u32(packedMeta[HEADER_H_IDX]);
    var i = u32(packedMeta[HEADER_I_IDX]);
    var sign = u32(packedMeta[HEADER_SIGN_IDX]);
    var state = u32(packedMeta[HEADER_STATE_IDX]);
    var rngState = u32(packedMeta[HEADER_RNG_IDX]);

    if (state == HEADER_STATE_INIT)
    {
        count = 0u;
        h = 2u;
        i = (1u << (h - 1u)) - 1u;
        sign = SIGN_SENTINEL;
        state = HEADER_STATE_ACTIVE;
        rngState = RNG_SEED;
    }

    if (state == HEADER_STATE_DONE)
    {
        return;
    }

    var t : array<i32, MAX_H>;
    var coeffs : array<vec2f, MAX_COEFFS>;
    var roots : array<vec2f, MAX_DEGREE>;
    var steps : u32 = 0u;
    var complete = false;

    loop
    {
        if (steps >= MAX_SIGNS_PER_DISPATCH || complete)
        {
            break;
        }

        if (h > MAX_H)
        {
            complete = true;
            break;
        }

        for (var idx : u32 = 0u; idx < MAX_H; idx++)
        {
            t[idx] = 0;
        }

        var k : u32 = 0u;
        var j : i32 = i32(h) - 2;
        loop
        {
            if (j < 0)
            {
                break;
            }

            let bit = (i >> u32(j)) & 1u;
            if (bit == 1u)
            {
                t[k] = t[k] + 1;
            }
            else
            {
                k += 1u;
                t[k] = 0;
            }

            j -= 1;
        }

        if (k == 0u)
        {
            complete = advanceCursor(&h, &i, &sign);
            continue;
        }

        var nz : u32 = 0u;
        for (var idx : u32 = 0u; idx <= k; idx++)
        {
            if (t[idx] != 0)
            {
                nz += 1u;
            }
        }

        if (nz == 0u)
        {
            complete = advanceCursor(&h, &i, &sign);
            continue;
        }

        let signCount = 1u << (nz - 1u);
        var currentSign = sign;
        if (currentSign == SIGN_SENTINEL || currentSign >= signCount)
        {
            currentSign = signCount - 1u;
        }

        var sp : u32 = 1u;
        var l : i32 = i32(k);
        loop
        {
            let idx = u32(l);
            var value : i32 = t[idx];
            if (value != 0 && idx != k)
            {
                if ((currentSign & sp) == 0u)
                {
                    value = -value;
                }
                sp = sp << 1u;
            }
            coeffs[idx] = vec2f(f32(value), 0.0);

            if (l == 0)
            {
                break;
            }
            l -= 1;
        }

        let rootCount = findRoots(&coeffs, k, &rngState, &roots);
        if (rootCount != 0u)
        {
            var rIndex = rootCount;
            loop
            {
                if (rIndex == 0u)
                {
                    break;
                }
                rIndex -= 1u;

                let writeIndex = count + DATA_OFFSET;
                if (writeIndex >= capacity)
                {
                    complete = true;
                    break;
                }

                packedXY[writeIndex] = pack2x16float(roots[rIndex]);
                packedMeta[writeIndex] = f32((k << 16u) | (h & 0xffffu));
                count += 1u;
            }
        }

        if (complete)
        {
            break;
        }

        steps += 1u;
        if (currentSign == 0u)
        {
            complete = advanceCursor(&h, &i, &sign);
        }
        else
        {
            sign = currentSign - 1u;
        }
    }

    var nextState = HEADER_STATE_ACTIVE;
    if (complete)
    {
        nextState = HEADER_STATE_DONE;
    }

    packedMeta[HEADER_COUNT_IDX] = f32(count);
    packedMeta[HEADER_H_IDX] = f32(h);
    packedMeta[HEADER_I_IDX] = f32(i);
    packedMeta[HEADER_SIGN_IDX] = f32(sign);
    packedMeta[HEADER_STATE_IDX] = f32(nextState);
    packedMeta[HEADER_RNG_IDX] = f32(rngState);
}
