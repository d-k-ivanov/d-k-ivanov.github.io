
// Vibecoded version of "Computational Life"
// https://arxiv.org/abs/2406.19108

const OP_LOOP_START : u32 = 91u;
const OP_LOOP_END : u32 = 93u;
const OP_PLUS : u32 = 43u;
const OP_MINUS : u32 = 45u;
const OP_COPY_01 : u32 = 46u;
const OP_COPY_10 : u32 = 44u;
const OP_DEC_0 : u32 = 60u;
const OP_INC_0 : u32 = 62u;
const OP_DEC_1 : u32 = 123u;
const OP_INC_1 : u32 = 125u;
const OP_NULL : u32 = 0u;

struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) @interpolate(flat) byteValue : u32,
    @location(1) @interpolate(flat) localCell : vec2u,
    @location(2) score : f32,
};

fn byteColor(byteValue: u32) -> vec3f
{
    switch (byteValue & 255u)
    {
        case OP_LOOP_START, OP_LOOP_END:
        {
            return vec3f(0.0, 192.0, 0.0) / 255.0;
        }
        case OP_PLUS, OP_MINUS, OP_COPY_01, OP_COPY_10:
        {
            return vec3f(200.0, 0.0, 200.0) / 255.0;
        }
        case OP_DEC_0, OP_INC_0, OP_DEC_1, OP_INC_1:
        {
            return vec3f(200.0, 128.0, 220.0) / 255.0;
        }
        case OP_NULL:
        {
            return vec3f(1.0, 0.0, 0.0);
        }
        default:
        {
            let shade = f32(192u + ((byteValue & 255u) / 4u)) / 255.0;
            return vec3f(shade);
        }
    }
}

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    let base = byteColor(input.byteValue);
    let score = clamp(input.score, 0.0, 1.0);
    let borderMask = select(0.0, 1.0,
        input.localCell.x == 0u
        || input.localCell.y == 0u
        || input.localCell.x == 7u
        || input.localCell.y == 7u
    );

    let transitionGlow = vec3f(1.0, 0.78, 0.32) * score;
    var color = mix(base * 0.92, base + transitionGlow * 0.55, score * 0.7);
    color = mix(color, color * 0.84, borderMask * 0.35);

    return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
