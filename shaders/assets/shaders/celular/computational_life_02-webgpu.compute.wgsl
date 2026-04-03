// Adapted from http://github.com/Rabrg/artificial-life

// Grid and Viewport configuration
const GRID_SIZE : vec3u = vec3u(640u, 400u, 1u);
const TAPE_SIDE : u32 = 8u;
const PROGRAM_GRID_SIZE : vec2u = vec2u(GRID_SIZE.x / TAPE_SIDE, GRID_SIZE.y / TAPE_SIDE);
const TAPE_SIZE : u32 = 64u;
const DOUBLE_TAPE_SIZE : u32 = 128u;
const MAX_STEPS : u32 = 8192u;
const BACKGROUND_MUTATION_RATE : f32 = 0.00024;
const INVALID_INDEX : u32 = 0xFFFFFFFFu;

const OP_LT : u32 = 60u;      // <
const OP_GT : u32 = 62u;      // >
const OP_LB : u32 = 123u;     // {
const OP_RB : u32 = 125u;     // }
const OP_MINUS : u32 = 45u;   // -
const OP_PLUS : u32 = 43u;    // +
const OP_DOT : u32 = 46u;     // .
const OP_COMMA : u32 = 44u;   // ,
const OP_LBRACK : u32 = 91u;  // [
const OP_RBRACK : u32 = 93u;  // ]

struct ShaderUniforms
{
    iResolution : vec3f,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    iMouseL : vec4f,
    iMouseR : vec4f,
    iMouseW : vec4f,
    iMouseZoom : vec4f,
    iGridSize : vec3u,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(1) var<storage, read> cellStateIn : array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut : array<u32>;

fn hash32(value: u32) -> u32
{
    var state = value * 747796405u + 2891336453u;
    state = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (state >> 22u) ^ state;
}

fn hash3(a: u32, b: u32, c: u32) -> u32
{
    return hash32(a ^ hash32(b + 0x9E3779B9u) ^ hash32(c + 0x85EBCA6Bu));
}

fn random01(seed: u32) -> f32
{
    return f32(hash32(seed)) / 4294967295.0;
}

fn programIndex(program: vec2u) -> u32
{
    return program.y * PROGRAM_GRID_SIZE.x + program.x;
}

fn sameProgram(a: vec2i, b: vec2i) -> bool
{
    return all(a == b);
}

fn byteCellIndex(cell: vec2u) -> u32
{
    return cell.y * GRID_SIZE.x + cell.x;
}

fn programOrigin(program: vec2u) -> vec2u
{
    return program * vec2u(TAPE_SIDE, TAPE_SIDE);
}

fn programByteIndex(program: vec2u, byteOffset: u32) -> u32
{
    let local = vec2u(byteOffset % TAPE_SIDE, byteOffset / TAPE_SIDE);
    return byteCellIndex(programOrigin(program) + local);
}

fn readProgramByte(program: vec2u, byteOffset: u32) -> u32
{
    return cellStateIn[programByteIndex(program, byteOffset)] & 255u;
}

fn writeProgramByte(program: vec2u, byteOffset: u32, byteValue: u32)
{
    cellStateOut[programByteIndex(program, byteOffset)] = byteValue & 255u;
}

fn programInBounds(program: vec2i) -> bool
{
    return program.x >= 0 && program.y >= 0
        && program.x < i32(PROGRAM_GRID_SIZE.x)
        && program.y < i32(PROGRAM_GRID_SIZE.y);
}

fn neighborhoodBounds(program: vec2u) -> vec4i
{
    let x = i32(program.x);
    let y = i32(program.y);
    return vec4i(
        max(0, x - 2),
        min(i32(PROGRAM_GRID_SIZE.x), x + 3),
        max(0, y - 2),
        min(i32(PROGRAM_GRID_SIZE.y), y + 3)
    );
}

fn neighborhoodCount(program: vec2u) -> u32
{
    let bounds = neighborhoodBounds(program);
    let width = u32(bounds.y - bounds.x);
    let height = u32(bounds.w - bounds.z);
    return width * height - 1u;
}

fn proposalFor(program: vec2u, epoch: u32) -> vec2i
{
    let count = neighborhoodCount(program);
    if (count == 0u)
    {
        return vec2i(-1, -1);
    }

    let choice = hash3(programIndex(program), epoch, 0xBFF10001u) % count;
    let bounds = neighborhoodBounds(program);
    let programCoord = vec2i(program);
    var cursor = 0u;

    for (var nx = bounds.x; nx < bounds.y; nx = nx + 1)
    {
        for (var ny = bounds.z; ny < bounds.w; ny = ny + 1)
        {
            let candidate = vec2i(nx, ny);
            if (sameProgram(candidate, programCoord))
            {
                continue;
            }

            if (cursor == choice)
            {
                return candidate;
            }
            cursor = cursor + 1u;
        }
    }

    return vec2i(-1, -1);
}

fn proposalIndex(program: vec2u, epoch: u32) -> u32
{
    let proposed = proposalFor(program, epoch);
    if (!programInBounds(proposed))
    {
        return INVALID_INDEX;
    }
    return programIndex(vec2u(proposed));
}

// Hash priorities approximate the paper's random-order greedy matching without
// materializing an explicit shuffle buffer.
fn priorityFor(program: vec2u, epoch: u32) -> u32
{
    return hash3(programIndex(program), epoch, 0x91E10DA5u);
}

fn priorityLess(aPriority: u32, aIndex: u32, bPriority: u32, bIndex: u32) -> bool
{
    return aPriority < bPriority || (aPriority == bPriority && aIndex < bIndex);
}

fn winsClaims(claimant: vec2u, targetProgram: vec2u, epoch: u32) -> bool
{
    let claimantIndex = programIndex(claimant);
    let claimantPriority = priorityFor(claimant, epoch);
    let targetIndex = programIndex(targetProgram);
    let bounds = neighborhoodBounds(targetProgram);

    for (var nx = bounds.x; nx < bounds.y; nx = nx + 1)
    {
        for (var ny = bounds.z; ny < bounds.w; ny = ny + 1)
        {
            let contenderSigned = vec2i(nx, ny);
            if (!programInBounds(contenderSigned))
            {
                continue;
            }

            let contender = vec2u(contenderSigned);
            let contenderIndex = programIndex(contender);
            if (contenderIndex == claimantIndex)
            {
                continue;
            }

            if (proposalIndex(contender, epoch) != targetIndex)
            {
                continue;
            }

            let contenderPriority = priorityFor(contender, epoch);
            if (priorityLess(contenderPriority, contenderIndex, claimantPriority, claimantIndex))
            {
                return false;
            }
        }
    }

    return true;
}

fn hasWinningOutgoingClaim(program: vec2u, epoch: u32) -> bool
{
    let partnerSigned = proposalFor(program, epoch);
    if (!programInBounds(partnerSigned))
    {
        return false;
    }

    let partner = vec2u(partnerSigned);
    return winsClaims(program, program, epoch) && winsClaims(program, partner, epoch);
}

fn isSelectedLeader(program: vec2u, epoch: u32) -> bool
{
    let partnerSigned = proposalFor(program, epoch);
    if (!programInBounds(partnerSigned))
    {
        return false;
    }

    if (!hasWinningOutgoingClaim(program, epoch))
    {
        return false;
    }

    let partner = vec2u(partnerSigned);
    let selfIndex = programIndex(program);
    let partnerIndex = programIndex(partner);
    let selfPriority = priorityFor(program, epoch);
    let partnerPriority = priorityFor(partner, epoch);

    if (priorityLess(partnerPriority, partnerIndex, selfPriority, selfIndex) && hasWinningOutgoingClaim(partner, epoch))
    {
        return false;
    }

    return true;
}

fn isSelectedFollower(program: vec2u, epoch: u32) -> bool
{
    let programIndexValue = programIndex(program);
    let bounds = neighborhoodBounds(program);

    for (var nx = bounds.x; nx < bounds.y; nx = nx + 1)
    {
        for (var ny = bounds.z; ny < bounds.w; ny = ny + 1)
        {
            let contenderSigned = vec2i(nx, ny);
            if (!programInBounds(contenderSigned) || sameProgram(contenderSigned, vec2i(program)))
            {
                continue;
            }

            let contender = vec2u(contenderSigned);
            if (!isSelectedLeader(contender, epoch))
            {
                continue;
            }

            if (proposalIndex(contender, epoch) == programIndexValue)
            {
                return true;
            }
        }
    }

    return false;
}

fn maybeMutateByte(byteValue: u32, program: vec2u, byteOffset: u32, epoch: u32) -> u32
{
    let seed = hash3(programIndex(program), byteOffset, epoch * 0x9E3779B9u + 0x00C0FFEEu);
    if (random01(seed) >= BACKGROUND_MUTATION_RATE)
    {
        return byteValue & 255u;
    }
    return hash32(seed ^ 0xA511E9B3u) & 255u;
}

fn seekForward(tape: ptr<function, array<u32, DOUBLE_TAPE_SIZE>>, pc: u32) -> i32
{
    var depth = 1u;
    var scan = pc + 1u;

    loop
    {
        if (scan >= DOUBLE_TAPE_SIZE)
        {
            return -1;
        }

        let opcode = (*tape)[scan] & 255u;
        if (opcode == OP_LBRACK)
        {
            depth = depth + 1u;
        }
        else if (opcode == OP_RBRACK)
        {
            depth = depth - 1u;
            if (depth == 0u)
            {
                return i32(scan);
            }
        }

        scan = scan + 1u;
    }
}

fn seekBackward(tape: ptr<function, array<u32, DOUBLE_TAPE_SIZE>>, pc: u32) -> i32
{
    if (pc == 0u)
    {
        return -1;
    }

    var depth = 1u;
    var scan = i32(pc) - 1;

    loop
    {
        if (scan < 0)
        {
            return -1;
        }

        let opcode = (*tape)[u32(scan)] & 255u;
        if (opcode == OP_RBRACK)
        {
            depth = depth + 1u;
        }
        else if (opcode == OP_LBRACK)
        {
            depth = depth - 1u;
            if (depth == 0u)
            {
                return scan;
            }
        }

        scan = scan - 1;
    }
}

fn runTape(tape: ptr<function, array<u32, DOUBLE_TAPE_SIZE>>)
{
    var pc = 0u;
    var head0 = 0u;
    var head1 = 0u;

    for (var step = 0u; step < MAX_STEPS; step = step + 1u)
    {
        if (pc >= DOUBLE_TAPE_SIZE)
        {
            break;
        }

        let opcode = (*tape)[pc] & 255u;
        var halted = false;

        switch (opcode)
        {
            case OP_LT:
            {
                head0 = (head0 + DOUBLE_TAPE_SIZE - 1u) % DOUBLE_TAPE_SIZE;
            }
            case OP_GT:
            {
                head0 = (head0 + 1u) % DOUBLE_TAPE_SIZE;
            }
            case OP_LB:
            {
                head1 = (head1 + DOUBLE_TAPE_SIZE - 1u) % DOUBLE_TAPE_SIZE;
            }
            case OP_RB:
            {
                head1 = (head1 + 1u) % DOUBLE_TAPE_SIZE;
            }
            case OP_MINUS:
            {
                (*tape)[head0] = ((*tape)[head0] + 255u) & 255u;
            }
            case OP_PLUS:
            {
                (*tape)[head0] = ((*tape)[head0] + 1u) & 255u;
            }
            case OP_DOT:
            {
                (*tape)[head1] = (*tape)[head0] & 255u;
            }
            case OP_COMMA:
            {
                (*tape)[head0] = (*tape)[head1] & 255u;
            }
            case OP_LBRACK:
            {
                if (((*tape)[head0] & 255u) == 0u)
                {
                    let matched = seekForward(tape, pc);
                    if (matched < 0)
                    {
                        halted = true;
                    }
                    else
                    {
                        pc = u32(matched);
                    }
                }
            }
            case OP_RBRACK:
            {
                if (((*tape)[head0] & 255u) != 0u)
                {
                    let matched = seekBackward(tape, pc);
                    if (matched < 0)
                    {
                        halted = true;
                    }
                    else
                    {
                        pc = u32(matched);
                    }
                }
            }
            default:
            {
            }
        }

        if (halted)
        {
            break;
        }

        pc = pc + 1u;
    }
}

fn initRandomSoup(program: vec2u)
{
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        let byteValue = hash3(programIndex(program), i, 0x12345678u) & 255u;
        writeProgramByte(program, i, byteValue);
    }
}

fn copyProgramWithMutation(program: vec2u, epoch: u32)
{
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        let byteValue = readProgramByte(program, i);
        writeProgramByte(program, i, maybeMutateByte(byteValue, program, i, epoch));
    }
}

fn executePair(programA: vec2u, programB: vec2u, epoch: u32)
{
    var tape : array<u32, DOUBLE_TAPE_SIZE>;

    // The paper mutates every tape before execution.
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        tape[i] = maybeMutateByte(readProgramByte(programA, i), programA, i, epoch);
        tape[TAPE_SIZE + i] = maybeMutateByte(readProgramByte(programB, i), programB, i, epoch);
    }

    runTape(&tape);

    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        writeProgramByte(programA, i, tape[i]);
        writeProgramByte(programB, i, tape[TAPE_SIZE + i]);
    }
}

@compute @workgroup_size(8, 8)
fn main(
    @builtin(workgroup_id) workgroup : vec3u,
    @builtin(local_invocation_id) local : vec3u
)
{
    if (local.x != 0u || local.y != 0u)
    {
        return;
    }

    let program = workgroup.xy;
    if (program.x >= PROGRAM_GRID_SIZE.x || program.y >= PROGRAM_GRID_SIZE.y)
    {
        return;
    }

    let epoch = shaderUniforms.iFrame;

    // Initialization happens once on frame 0.
    if (epoch == 0u)
    {
        initRandomSoup(program);
        return;
    }

    if (isSelectedLeader(program, epoch))
    {
        let partnerSigned = proposalFor(program, epoch);
        executePair(program, vec2u(partnerSigned), epoch);
        return;
    }

    if (isSelectedFollower(program, epoch))
    {
        // The selected leader already wrote both tapes for this pair.
        return;
    }

    copyProgramWithMutation(program, epoch);
}
