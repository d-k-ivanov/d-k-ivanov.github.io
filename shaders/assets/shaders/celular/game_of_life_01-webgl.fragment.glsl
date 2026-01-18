#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

uniform vec3 iResolution;
uniform int iFrame;
uniform vec4 iMouseL;
uniform sampler2D uBackbuffer;

out vec4 fragColor;

const ivec2 GRID_SIZE = ivec2(320, 200);
const int UPDATE_INTERVAL = 5;
const float CELL_PADDING = 0.1f;

float hash(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1f, 311.7f))) * 43758.5453123f);
}

int initState(ivec2 cell, vec2 grid)
{
    vec2 uv = (vec2(cell) + 0.5f) / grid;
    float seed = hash(uv * 256.0f + vec2(0.13f, 0.71f));
    return int(seed > 0.75f);
}

int readCell(ivec2 cell, vec2 grid)
{
    vec2 wrapped = mod(vec2(cell) + grid, grid);
    vec2 uv = (wrapped + 0.5f) / grid;
    return int(step(0.5f, texture(uBackbuffer, uv).a));
}

int countNeighbors(ivec2 cell, vec2 grid)
{
    int total = 0;
    total += readCell(cell + ivec2(1, 1), grid);
    total += readCell(cell + ivec2(1, 0), grid);
    total += readCell(cell + ivec2(1, -1), grid);
    total += readCell(cell + ivec2(0, -1), grid);
    total += readCell(cell + ivec2(-1, -1), grid);
    total += readCell(cell + ivec2(-1, 0), grid);
    total += readCell(cell + ivec2(-1, 1), grid);
    total += readCell(cell + ivec2(0, 1), grid);
    return total;
}

int nextState(int current, int neighbors)
{
    if(neighbors == 3)
    {
        return 1;
    }
    if(neighbors == 2)
    {
        return current;
    }
    return 0;
}

void main()
{
    vec2 grid = vec2(GRID_SIZE);
    vec2 cellSize = iResolution.xy / grid;
    ivec2 cell = ivec2(floor(gl_FragCoord.xy / cellSize));
    cell = clamp(cell, ivec2(0), GRID_SIZE - 1);

    int state = 0;
    if(iFrame < 200)
    {
        state = initState(cell, grid);
    }
    else
    {
        int current = readCell(cell, grid);
        if(UPDATE_INTERVAL > 1 && (iFrame % UPDATE_INTERVAL != 0))
        {
            state = current;
        }
        else
        {
            int neighbors = countNeighbors(cell, grid);
            state = nextState(current, neighbors);
        }
    }

    if(iMouseL.z > 0.0f)
    {
        ivec2 mouseCell = ivec2(floor(iMouseL.xy / cellSize));
        ivec2 delta = cell - mouseCell;
        // if(max(abs(delta.x), abs(delta.y)) <= 2) // 5x5 brush
        if(max(abs(delta.x), abs(delta.y)) == 0)    // 1x1 brush
        {
            state = 1;
        }
    }

    float alive = float(state);
    vec2 cellUv = vec2(cell) / grid;
    vec2 localUv = fract(gl_FragCoord.xy / cellSize);
    float cellMask = step(CELL_PADDING, localUv.x)
        * step(CELL_PADDING, localUv.y)
        * step(localUv.x, 1.0f - CELL_PADDING)
        * step(localUv.y, 1.0f - CELL_PADDING);
    vec3 gradient = vec3(cellUv.x, cellUv.y, 1.0f - cellUv.x);
    fragColor = vec4(gradient * alive * cellMask, alive);
}
