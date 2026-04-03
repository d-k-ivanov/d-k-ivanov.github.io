// Adapted from
// * https://github.com/Rabrg/artificial-life
// * https://github.com/paradigms-of-intelligence/cubff.git

// Paper: https://arxiv.org/abs/2406.19108

const OP_LT : u32 = 60u;            // <
const OP_GT : u32 = 62u;            // >
const OP_LB : u32 = 123u;           // {
const OP_RB : u32 = 125u;           // }
const OP_MINUS : u32 = 45u;         // -
const OP_PLUS : u32 = 43u;          // +
const OP_DOT : u32 = 46u;           // .
const OP_COMMA : u32 = 44u;         // ,
const OP_LBRACK : u32 = 91u;        // [
const OP_RBRACK : u32 = 93u;        // ]
const OP_NORMALIZED : u32 = 255u;   // Any

struct VertexOutput
{
    @builtin(position) position : vec4f,
    @location(0) @interpolate(flat) byteValue : u32,
};

fn normalizeByte(byteValue: u32) -> u32
{
    switch (byteValue & 255u)
    {
        case OP_LT, OP_GT, OP_LB, OP_RB, OP_MINUS, OP_PLUS, OP_DOT, OP_COMMA, OP_LBRACK, OP_RBRACK:
        {
            return byteValue & 255u;
        }
        default:
        {
            return OP_NORMALIZED;
        }
    }
}

fn colorForByte(byteValue: u32) -> vec3f
{
    switch (normalizeByte(byteValue))
    {
        case OP_LT:
        {
            return vec3f(239.0, 71.0, 111.0) / 255.0;
        }
        case OP_GT:
        {
            return vec3f(255.0, 209.0, 102.0) / 255.0;
        }
        case OP_LB:
        {
            return vec3f(6.0, 214.0, 160.0) / 255.0;
        }
        case OP_RB:
        {
            return vec3f(17.0, 138.0, 178.0) / 255.0;
        }
        case OP_MINUS:
        {
            return vec3f(255.0, 127.0, 80.0) / 255.0;
        }
        case OP_PLUS:
        {
            return vec3f(131.0, 56.0, 236.0) / 255.0;
        }
        case OP_DOT:
        {
            return vec3f(58.0, 134.0, 255.0) / 255.0;
        }
        case OP_COMMA:
        {
            return vec3f(255.0, 190.0, 11.0) / 255.0;
        }
        case OP_LBRACK:
        {
            return vec3f(139.0, 201.0, 38.0) / 255.0;
        }
        case OP_RBRACK:
        {
            return vec3f(255.0, 89.0, 94.0) / 255.0;
        }
        default:
        {
            return vec3f(20.0, 20.0, 20.0) / 255.0;
        }
    }
}

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4f
{
    return vec4f(colorForByte(input.byteValue), 1.0);
}
