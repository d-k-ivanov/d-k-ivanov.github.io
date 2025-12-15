#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

#define PI 3.14159265359f

uniform vec3 iResolution;
uniform float iTime;

out vec4 fragColor;

// Helper functions:
float slopeFromT(float t, float A, float B, float C)
{
    float dtdx = 1.0f / (3.0f * A * t * t + 2.0f * B * t + C);
    return dtdx;
}

float xFromT(float t, float A, float B, float C, float D)
{
    float x = A * (t * t * t) + B * (t * t) + C * t + D;
    return x;
}

float yFromT(float t, float E, float F, float G, float H)
{
    float y = E * (t * t * t) + F * (t * t) + G * t + H;
    return y;
}

// Plot the line using a value between 0 and 1
float plot_function(vec2 uv, float y)
{
    return smoothstep(y - 0.01f, y, uv.y) - smoothstep(y, y + 0.01f, uv.y);
}

// https://www.flong.com/archive/texts/code
float doubleExponentialSigmoid(float x, float a)
{
    float epsilon = 0.00001f;
    float min_param_a = 0.0f + epsilon;
    float max_param_a = 1.0f - epsilon;
    a = min(max_param_a, max(min_param_a, a));
    a = 1.0f - a; // for sensible results

    float y = 0.0f;
    if(x <= 0.5f)
    {
        y = (pow(2.0f * x, 1.0f / a)) / 2.0f;
    }
    else
    {
        y = 1.0f - (pow(2.0f * (1.0f - x), 1.0f / a)) / 2.0f;
    }
    return y;
}

float logisticSigmoid(float x, float a)
{
    // n.b.: this Logistic Sigmoid has been normalized.
    float epsilon = 0.0001f;
    float min_param_a = 0.0f + epsilon;
    float max_param_a = 1.0f - epsilon;
    a = max(min_param_a, min(max_param_a, a));
    a = (1.0f / (1.0f - a) - 1.0f);

    float A = 1.0f / (1.0f + exp(0.0f - ((x - 0.5f) * a * 2.0f)));
    float B = 1.0f / (1.0f + exp(a));
    float C = 1.0f / (1.0f + exp(0.0f - a));
    float y = (A - B) / (C - B);
    return y;
}

float quadraticBezier(float x, float a, float b)
{
    // adapted from BEZMATH.PS (1993)
    // by Don Lancaster, SYNERGETICS Inc.
    // http://www.tinaja.com/text/bezmath.html

    float epsilon = 0.00001f;
    a = max(0.0f, min(1.0f, a));
    b = max(0.0f, min(1.0f, b));
    if(a == 0.5f)
    {
        a += epsilon;
    }

    // solve t from x (an inverse operation)
    float om2a = 1.0f - 2.0f * a;
    float t = (sqrt(a * a + om2a * x) - a) / om2a;
    float y = (1.0f - 2.0f * b) * (t * t) + (2.0f * b) * t;
    return y;
}

float cubicBezier(float x, float a, float b, float c, float d)
{

    float y0a = 0.00f; // initial y
    float x0a = 0.00f; // initial x
    float y1a = b;    // 1st influence y
    float x1a = a;    // 1st influence x
    float y2a = d;    // 2nd influence y
    float x2a = c;    // 2nd influence x
    float y3a = 1.00f; // final y
    float x3a = 1.00f; // final x

    float A = x3a - 3.0f * x2a + 3.0f * x1a - x0a;
    float B = 3.0f * x2a - 6.0f * x1a + 3.0f * x0a;
    float C = 3.0f * x1a - 3.0f * x0a;
    float D = x0a;

    float E = y3a - 3.0f * y2a + 3.0f * y1a - y0a;
    float F = 3.0f * y2a - 6.0f * y1a + 3.0f * y0a;
    float G = 3.0f * y1a - 3.0f * y0a;
    float H = y0a;

  // Solve for t given x (using Newton-Raphelson), then solve for y given t.
  // Assume for the first guess that t = x.
    float currentt = x;
    int nRefinementIterations = 5;
    for(int i = 0; i < nRefinementIterations; i++)
    {
        float currentx = xFromT(currentt, A, B, C, D);
        float currentslope = slopeFromT(currentt, A, B, C);
        currentt -= (currentx - x) * (currentslope);
        currentt = clamp(currentt, 0.0f, 1.0f);
    }

    float y = yFromT(currentt, E, F, G, H);
    return y;
}

// Functions from Iñigo Quiles
// www.iquilezles.org/www/articles/functions/functions.htm
float cubicPulse(float c, float w, float x)
{
    x = abs(x - c);
    if(x > w)
        return 0.0f;
    x /= w;
    return 1.0f - x * x * (3.0f - 2.0f * x);
}

float pcurve(float x, float a, float b)
{
    float k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
    return k * pow(x, a) * pow(1.0f - x, b);
}

void main()
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec3 color = vec3(0.0f);
    vec3 lineColor = vec3(0.0f, 1.0f, 0.0f);

    float y;
    float x = uv.x;
    float lineMask;

    int numberOfVariants = 27;
    int variant = int(mod(floor(iTime / 1.0f), float(numberOfVariants)));
    switch(variant)
    {
        case 0:
            y = x;                                  // f(x) = x
            break;
        case 1:
            y = pow(x, 5.0f);                       // f(x) = x^5
            break;
        case 2:
            y = sin(x * 2.0f * PI) * 0.5f + 0.5f;   // f(x) = sin(2πx)
            break;
        case 3:
            y = exp(x) / exp(1.0f);                 // f(x) = e^x
            break;
        case 4:
            y = log(x * (exp(1.0f) - 1.0f) + 1.0f); // f(x) = ln(x + 1)
            break;
        case 5:
            y = sqrt(x);                            // f(x) = √x
            break;
        case 6:
            y = step(0.5f, x);                      // f(x) = step function
            break;
        case 7:
            y = smoothstep(0.1f, 0.9f, x);          // f(x) = smoothstep
            break;
        case 8:
            y = smoothstep(0.2f, 0.5f, x) - smoothstep(0.5f, 0.8f, x); // f(x) = bump function
            break;
        case 9:
            y = fract(x * 5.0f);                    // f(x) = fract(5x)
            break;
        case 10:
            y = sin(x * 3.15f);                     // f(x) = sin(x)
            break;
        case 11:
            y = mod(x, 0.5f);                       // f(x) = mod(x, 0.5)
            break;
        case 12:
            y = fract(x);               // return only the fraction part of a number
            break;
        case 13:
            y = ceil(x);                // nearest integer that is greater than or equal to x
            break;
        case 14:
            y = floor(x);               // nearest integer less than or equal to x
            break;
        case 15:
            y = sign(x);                // extract the sign of x
            break;
        case 16:
            y = abs(x);                 // return the absolute value of x
            break;
        case 17:
            y = clamp(x, 0.0f, 1.0f);   // constrain x to lie between 0.0 and 1.0
            break;
        case 18:
            y = min(0.0f, x);           // return the lesser of x and 0.0
            break;
        case 19:
            y = max(0.0f, x);           // return the greater of x and 0.0
            break;
        case 20:
            y = doubleExponentialSigmoid(x, 0.7f);  // double exponential sigmoid
            break;
        case 21:
            y = logisticSigmoid(x, 0.7f);           // logistic sigmoid
            break;
        case 22:
            y = quadraticBezier(x, 0.3f, 0.7f);     // quadratic Bezier curve
            break;
        case 23:
            y = cubicBezier(x, 0.2f, 0.8f, 0.2f, 0.8f); // cubic Bezier curve
            // y = cubicBezier(x, 0.253f, 0.720f, 0.750f, 0.250f);
            break;
        case 24:
            y = 0.5f * pow(2.0f * ((x < 0.5f) ? x : 1.0f - x), 1.0f);
            break;
        case 25:
            y = cubicPulse(0.5f, 0.2f, x);
            break;
        case 26:
            y = pcurve(x, 3.0f, 1.0f);
            break;
        default:
            y = x;                                  // f(x) = x
            break;
    }

    lineMask = plot_function(uv, y);

    // Gradient visualization of the function
    color = vec3(y);
    color = (1.0f - lineMask) * color + lineMask * lineColor;

    fragColor = vec4(color, 1.0f);
}
