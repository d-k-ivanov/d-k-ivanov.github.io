// Figure-8-style reconstruction of the 2D BFF soup from:
// "Computational Life: How Well-formed, Self-replicating Programs Emerge from Simple Interaction"
//
// The paper renders 32,400 programs in a 240x135 grid, each program shown as an 8x8 tape.
// This Shader Editor adaptation keeps the 8x8 tape visualization and the BFF execution model,
// but downscales the soup to 80x50 programs so it fits a 16:10 viewport in-browser.
//
// To make the takeover phase visible on human timescales, the simulation loops through:
// 1. a short random-soup pre-life period,
// 2. a seeded "transition" frame inspired by Figure 8,
// 3. repeated local BFF interactions with paper-matched low background mutation.
// Score and cycle terms below are visualization aids, not paper metrics.

// Grid and Viewport configuration
const PROGRAM_GRID_SIZE : vec2u = vec2u(80u, 50u);
const GRID_SIZE : vec3u = vec3u(640u, 400u, 1u);

const COMPUTE_FRAME_INTERVAL : u32 = 2u;
const TAPE_SIDE : u32 = 8u;
const TAPE_SIZE : u32 = 64u;
const DOUBLE_TAPE_SIZE : u32 = 128u;
const MAX_STEPS : u32 = 8192u;
const CYCLE_LENGTH : u32 = 50000u;
const EMERGENCE_EPOCH : u32 = 88u;
const SCORE_DECAY : f32 = 0.985;
const BACKGROUND_MUTATION_RATE : f32 = 0.00024;

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

const OP_KIND_LOOP : u32 = 1u;
const OP_KIND_ARITHMETIC : u32 = 2u;
const OP_KIND_HEAD : u32 = 3u;
const OP_KIND_NULL : u32 = 4u;
const OP_KIND_NOOP : u32 = 5u;

const PROTO_PREFIX_LENGTH : u32 = 24u;
// Deterministic sweep used to approximate the paper's local random matching.
const PHASE_OFFSETS : array<vec2i, 12> = array<vec2i, 12>(
    vec2i(1, 0),
    vec2i(0, 1),
    vec2i(1, 2),
    vec2i(-1, 2),
    vec2i(2, 1),
    vec2i(-2, 1),
    vec2i(-1, 0),
    vec2i(0, -1),
    vec2i(-1, -2),
    vec2i(1, -2),
    vec2i(-2, -1),
    vec2i(2, -1)
);

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
@group(0) @binding(1) var<storage, read_write> cellStateIn : array<u32>;
@group(0) @binding(2) var<storage, read_write> cellStateOut : array<u32>;
@group(0) @binding(3) var<storage, read_write> scoreStateIn : array<f32>;
@group(0) @binding(4) var<storage, read_write> scoreStateOut : array<f32>;

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

fn getOpKind(byteValue: u32) -> u32
{
    switch (byteValue & 255u)
    {
        case OP_LOOP_START, OP_LOOP_END:
        {
            return OP_KIND_LOOP;
        }
        case OP_PLUS, OP_MINUS, OP_COPY_01, OP_COPY_10:
        {
            return OP_KIND_ARITHMETIC;
        }
        case OP_DEC_0, OP_INC_0, OP_DEC_1, OP_INC_1:
        {
            return OP_KIND_HEAD;
        }
        case OP_NULL:
        {
            return OP_KIND_NULL;
        }
        default:
        {
            return OP_KIND_NOOP;
        }
    }
}

fn commandToken(index: u32) -> u32
{
    switch (index % 10u)
    {
        case 0u:
        {
            return OP_LOOP_START;
        }
        case 1u:
        {
            return OP_LOOP_END;
        }
        case 2u:
        {
            return OP_PLUS;
        }
        case 3u:
        {
            return OP_MINUS;
        }
        case 4u:
        {
            return OP_COPY_01;
        }
        case 5u:
        {
            return OP_COPY_10;
        }
        case 6u:
        {
            return OP_DEC_0;
        }
        case 7u:
        {
            return OP_INC_0;
        }
        case 8u:
        {
            return OP_DEC_1;
        }
        default:
        {
            return OP_INC_1;
        }
    }
}

fn programIndex(program: vec2u) -> u32
{
    return program.y * PROGRAM_GRID_SIZE.x + program.x;
}

fn programOrigin(program: vec2u) -> vec2u
{
    return program * vec2u(TAPE_SIDE, TAPE_SIDE);
}

fn byteCellIndex(cell: vec2u) -> u32
{
    return cell.y * GRID_SIZE.x + cell.x;
}

fn programByteIndex(program: vec2u, byteOffset: u32) -> u32
{
    let local = vec2u(byteOffset % TAPE_SIDE, byteOffset / TAPE_SIDE);
    return byteCellIndex(programOrigin(program) + local);
}

fn scoreIndex(program: vec2u) -> u32
{
    return byteCellIndex(programOrigin(program));
}

fn programInBounds(program: vec2i) -> bool
{
    return program.x >= 0 && program.y >= 0
        && program.x < i32(PROGRAM_GRID_SIZE.x)
        && program.y < i32(PROGRAM_GRID_SIZE.y);
}

fn readProgramByte(program: vec2u, byteOffset: u32) -> u32
{
    return cellStateIn[programByteIndex(program, byteOffset)] & 255u;
}

fn writeProgramByte(program: vec2u, byteOffset: u32, byteValue: u32)
{
    cellStateOut[programByteIndex(program, byteOffset)] = byteValue & 255u;
}

fn readScore(program: vec2u) -> f32
{
    return scoreStateIn[scoreIndex(program)];
}

fn writeScore(program: vec2u, score: f32)
{
    scoreStateOut[scoreIndex(program)] = clamp(score, 0.0, 1.0);
}

fn protoReplicatorByte(byteOffset: u32) -> u32
{
    if (byteOffset == 0u)
    {
        return 0u;
    }
    if (byteOffset == 1u)
    {
        return 64u;
    }
    if (byteOffset == 62u)
    {
        return OP_LOOP_START;
    }
    if (byteOffset == 63u)
    {
        return OP_LOOP_END;
    }

    let phase = (byteOffset - 2u) % 3u;
    if (phase == 0u)
    {
        return OP_COPY_01;
    }
    if (phase == 1u)
    {
        return OP_INC_0;
    }
    return OP_INC_1;
}

fn structuredByte(program: vec2u, byteOffset: u32, cycleEpoch: u32) -> u32
{
    if (byteOffset < 2u)
    {
        return protoReplicatorByte(byteOffset);
    }

    let base = protoReplicatorByte(byteOffset);
    let seed = hash3(programIndex(program), byteOffset, cycleEpoch * 23u + 11u);

    if (seed % 31u == 0u)
    {
        return commandToken((seed >> 8u) % 10u);
    }

    if (seed % 89u == 0u)
    {
        return seed & 255u;
    }

    return base;
}

fn randomByte(program: vec2u, byteOffset: u32, cycleEpoch: u32) -> u32
{
    return hash3(programIndex(program), byteOffset, cycleEpoch * 101u + 19u) & 255u;
}

fn transitionFront(programX: u32, cycleEpoch: u32) -> u32
{
    let base = 33u + (hash32(programX * 13u + 7u) % 6u);
    let wobble = (cycleEpoch / 24u) % 3u;
    return min(PROGRAM_GRID_SIZE.y - 1u, base + wobble);
}

// Visualization-only proxy for structured tapes.
fn similarityScore(tape: ptr<function, array<u32, DOUBLE_TAPE_SIZE>>, baseOffset: u32) -> f32
{
    var commandCount = 0u;
    var prefixMatch = 0u;
    var symmetryMatch = 0u;

    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        let byteValue = (*tape)[baseOffset + i] & 255u;
        let kind = getOpKind(byteValue);

        if (kind != OP_KIND_NOOP && kind != OP_KIND_NULL)
        {
            commandCount = commandCount + 1u;
        }

        if (i < PROTO_PREFIX_LENGTH && byteValue == protoReplicatorByte(i))
        {
            prefixMatch = prefixMatch + 1u;
        }
    }

    for (var i = 0u; i < TAPE_SIZE / 2u; i = i + 1u)
    {
        let a = getOpKind((*tape)[baseOffset + i] & 255u);
        let b = getOpKind((*tape)[baseOffset + (TAPE_SIZE - 1u - i)] & 255u);
        if (a == b)
        {
            symmetryMatch = symmetryMatch + 1u;
        }
    }

    let density = f32(commandCount) / f32(TAPE_SIZE);
    let prefix = f32(prefixMatch) / f32(PROTO_PREFIX_LENGTH);
    let symmetry = f32(symmetryMatch) / f32(TAPE_SIZE / 2u);
    return clamp(density * 0.40 + prefix * 0.40 + symmetry * 0.20, 0.0, 1.0);
}

fn maybeMutateByte(byteValue: u32, seed: u32) -> u32
{
    if (random01(seed) >= BACKGROUND_MUTATION_RATE)
    {
        return byteValue & 255u;
    }
    return hash32(seed ^ 0xA511E9B3u) & 255u;
}

fn mutationSeed(program: vec2u, byteOffset: u32, epoch: u32) -> u32
{
    return hash3(programIndex(program), byteOffset, epoch * 0x9E3779B9u + 0x00C0FFEEu);
}

fn evaluateTape(tape: ptr<function, array<u32, DOUBLE_TAPE_SIZE>>)
{
    var head0 = (*tape)[0] & 127u;
    var head1 = (*tape)[1] & 127u;
    var pc = 2u;
    var steps = 0u;

    loop
    {
        if (steps >= MAX_STEPS || pc >= DOUBLE_TAPE_SIZE)
        {
            break;
        }

        let opcode = (*tape)[pc] & 255u;

        switch (opcode)
        {
            case OP_DEC_0:
            {
                head0 = (head0 + 127u) & 127u;
            }
            case OP_INC_0:
            {
                head0 = (head0 + 1u) & 127u;
            }
            case OP_DEC_1:
            {
                head1 = (head1 + 127u) & 127u;
            }
            case OP_INC_1:
            {
                head1 = (head1 + 1u) & 127u;
            }
            case OP_PLUS:
            {
                (*tape)[head0] = ((*tape)[head0] + 1u) & 255u;
            }
            case OP_MINUS:
            {
                (*tape)[head0] = ((*tape)[head0] + 255u) & 255u;
            }
            case OP_COPY_01:
            {
                (*tape)[head1] = (*tape)[head0] & 255u;
            }
            case OP_COPY_10:
            {
                (*tape)[head0] = (*tape)[head1] & 255u;
            }
            case OP_LOOP_START:
            {
                if (getOpKind((*tape)[head0] & 255u) == OP_KIND_NULL)
                {
                    var depth = 1u;
                    var scan = pc + 1u;
                    loop
                    {
                        if (scan >= DOUBLE_TAPE_SIZE || depth == 0u)
                        {
                            break;
                        }

                        let scanKind = getOpKind((*tape)[scan] & 255u);
                        if (scanKind == OP_KIND_LOOP)
                        {
                            if (((*tape)[scan] & 255u) == OP_LOOP_START)
                            {
                                depth = depth + 1u;
                            }
                            else
                            {
                                depth = depth - 1u;
                            }
                        }
                        scan = scan + 1u;
                    }

                    if (depth != 0u)
                    {
                        break;
                    }
                    pc = scan - 1u;
                }
            }
            case OP_LOOP_END:
            {
                if (getOpKind((*tape)[head0] & 255u) != OP_KIND_NULL)
                {
                    if (pc == 0u)
                    {
                        break;
                    }

                    var depth = 1u;
                    var scan = pc - 1u;
                    loop
                    {
                        let scanKind = getOpKind((*tape)[scan] & 255u);
                        if (scanKind == OP_KIND_LOOP)
                        {
                            if (((*tape)[scan] & 255u) == OP_LOOP_END)
                            {
                                depth = depth + 1u;
                            }
                            else
                            {
                                depth = depth - 1u;
                            }
                        }

                        if (depth == 0u)
                        {
                            pc = scan;
                            break;
                        }

                        if (scan == 0u)
                        {
                            pc = DOUBLE_TAPE_SIZE;
                            break;
                        }
                        scan = scan - 1u;
                    }

                    if (pc >= DOUBLE_TAPE_SIZE)
                    {
                        break;
                    }
                }
            }
            default:
            {
            }
        }

        pc = pc + 1u;
        steps = steps + 1u;
    }
}

fn copyProgram(program: vec2u)
{
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        writeProgramByte(program, i, readProgramByte(program, i));
    }
    writeScore(program, readScore(program) * SCORE_DECAY);
}

fn copyProgramWithMutation(program: vec2u, epoch: u32)
{
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        let byteValue = maybeMutateByte(readProgramByte(program, i), mutationSeed(program, i, epoch));
        writeProgramByte(program, i, byteValue);
    }
    writeScore(program, readScore(program) * SCORE_DECAY);
}

fn initRandomSoup(program: vec2u, cycleEpoch: u32)
{
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        writeProgramByte(program, i, randomByte(program, i, cycleEpoch));
    }
    writeScore(program, 0.0);
}

fn initTransitionFrame(program: vec2u, cycleEpoch: u32)
{
    let frontier = transitionFront(program.x, cycleEpoch);
    let structured = program.y < frontier;

    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        let byteValue = select(
            randomByte(program, i, cycleEpoch),
            structuredByte(program, i, cycleEpoch),
            structured
        );
        writeProgramByte(program, i, byteValue);
    }

    let baseScore = select(0.0, 0.82, structured);
    writeScore(program, baseScore);
}

fn runPair(programA: vec2u, programB: vec2u, epoch: u32)
{
    var tape : array<u32, DOUBLE_TAPE_SIZE>;

    // The paper mutates every tape before execution.
    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        tape[i] = maybeMutateByte(readProgramByte(programA, i), mutationSeed(programA, i, epoch));
        tape[TAPE_SIZE + i] = maybeMutateByte(readProgramByte(programB, i), mutationSeed(programB, i, epoch));
    }

    evaluateTape(&tape);

    let scoreA = max(readScore(programA) * SCORE_DECAY, similarityScore(&tape, 0u));
    let scoreB = max(readScore(programB) * SCORE_DECAY, similarityScore(&tape, TAPE_SIZE));

    for (var i = 0u; i < TAPE_SIZE; i = i + 1u)
    {
        writeProgramByte(programA, i, tape[i]);
        writeProgramByte(programB, i, tape[TAPE_SIZE + i]);
    }

    writeScore(programA, scoreA);
    writeScore(programB, scoreB);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(workgroup_id) workgroup : vec3u, @builtin(local_invocation_id) local : vec3u)
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

    let frame = shaderUniforms.iFrame;
    if (frame % COMPUTE_FRAME_INTERVAL != 0u)
    {
        copyProgram(program);
        return;
    }

    let epoch = frame / COMPUTE_FRAME_INTERVAL;
    let cycleEpoch = epoch % CYCLE_LENGTH;

    if (cycleEpoch == 0u)
    {
        initRandomSoup(program, epoch + 1u);
        return;
    }

    if (cycleEpoch == EMERGENCE_EPOCH)
    {
        initTransitionFrame(program, cycleEpoch);
        return;
    }

    let phase = epoch % 12u;
    let offset = PHASE_OFFSETS[phase];
    let parity = (program.x + program.y + phase) & 1u;
    let isLeader = parity == 0u;
    let signedProgram = vec2i(program);
    let partnerSigned = select(signedProgram - offset, signedProgram + offset, isLeader);

    if (!programInBounds(partnerSigned))
    {
        copyProgramWithMutation(program, epoch);
        return;
    }

    if (!isLeader)
    {
        return;
    }

    runPair(program, vec2u(partnerSigned), epoch);
}
