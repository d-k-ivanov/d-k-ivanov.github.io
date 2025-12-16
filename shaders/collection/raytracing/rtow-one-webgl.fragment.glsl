#version 300 es

#if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp int;
#else
    precision mediump float;
    precision mediump int;
#endif

out vec4 fragColor;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform float iFrameRate;
uniform vec4 iMouse;

const float PI = 3.14159265359;
const float FOV = radians(50.0);
const float FOCUS_DISTANCE = 1.0;
const float DEFOCUS_ANGLE = 0.0; // degrees
const int SAMPLES_PER_PIXEL = 4;
const int MAX_DEPTH = 4;
const int SPHERE_COUNT = 4;
const int MATERIAL_COUNT = 4;

struct Ray
{
    vec3 origin;
    vec3 dir;
};

struct Material
{
    int kind; // 0 lambertian, 1 metal, 2 dielectric
    vec3 albedo;
    float fuzz;
    float refIdx;
};

struct Sphere
{
    vec3 center;
    float radius;
    int material;
};

struct Hit
{
    vec3 p;
    vec3 center;
    vec3 normal;
    float t;
    int material;
    bool frontFace;
    Material mat;
};

uint hashUint(uint x)
{
    x ^= x >> 16;
    x *= 0x7feb352dU;
    x ^= x >> 15;
    x *= 0x846ca68bU;
    x ^= x >> 16;
    return x;
}

float rand(inout uint seed)
{
    seed = hashUint(seed);
    return float(seed) * (1.0 / 4294967296.0);
}

vec3 randomInUnitSphere(inout uint seed)
{
    for (int i = 0; i < 8; ++i)
    {
        vec3 p = vec3(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);
        if (dot(p, p) < 1.0)
        {
            return p;
        }
    }
    return vec3(0.0);
}

vec3 randomUnitVector(inout uint seed)
{
    vec3 p = randomInUnitSphere(seed);
    float lenSq = max(1e-6, dot(p, p));
    return p / sqrt(lenSq);
}

vec2 randomInUnitDisk(inout uint seed)
{
    for (int i = 0; i < 8; ++i)
    {
        vec2 p = vec2(rand(seed) * 2.0 - 1.0, rand(seed) * 2.0 - 1.0);
        if (dot(p, p) < 1.0)
        {
            return p;
        }
    }
    return vec2(0.0);
}

vec3 reflectVec(vec3 v, vec3 n)
{
    return v - 2.0 * dot(v, n) * n;
}

vec3 refractVec(vec3 uv, vec3 n, float etaiOverEtat)
{
    float cosTheta = min(dot(-uv, n), 1.0);
    vec3 rOutPerp = etaiOverEtat * (uv + cosTheta * n);
    vec3 rOutParallel = -sqrt(max(0.0, 1.0 - dot(rOutPerp, rOutPerp))) * n;
    return rOutPerp + rOutParallel;
}

float schlick(float cosine, float refIdx)
{
    float r0 = (1.0 - refIdx) / (1.0 + refIdx);
    r0 *= r0;
    return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

float hash_function(vec3 p)
{
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

vec3 randomColor(vec3 seed)
{
    return vec3(hash_function(seed + 1.3), hash_function(seed + 2.7), hash_function(seed + 5.1));
}

const Material MATERIALS[MATERIAL_COUNT] = Material[](
    Material(0, vec3(0.5), 0.0, 1.0),          // ground
    Material(2, vec3(1.0), 0.0, 1.5),          // glass center
    Material(0, vec3(0.4, 0.2, 0.1), 0.0, 1.0),// lambert big
    Material(1, vec3(0.7, 0.6, 0.5), 0.0, 1.0) // metal big
);

const Sphere SCENE[4] = Sphere[](
    Sphere(vec3(0.0, -1000.0, 0.0), 1000.0, 0),
    Sphere(vec3(0.0, 1.0, 0.0), 1.0, 1),
    Sphere(vec3(-4.0, 1.0, 0.0), 1.0, 2),
    Sphere(vec3(4.0, 1.0, 0.0), 1.0, 3)
);

Hit setFaceNormal(Ray r, vec3 outward)
{
    bool front = dot(r.dir, outward) < 0.0;
    Hit h;
    h.p = vec3(0.0);
    h.center = vec3(0.0);
    h.normal = front ? outward : -outward;
    h.t = 0.0;
    h.material = 0;
    h.frontFace = front;
    h.mat = MATERIALS[0];
    return h;
}

bool hitSphere(Sphere s, Ray r, float tMin, float tMax, out Hit hit)
{
    vec3 oc = r.origin - s.center;
    float a = dot(r.dir, r.dir);
    float halfB = dot(oc, r.dir);
    float c = dot(oc, oc) - s.radius * s.radius;
    float discriminant = halfB * halfB - a * c;
    if (discriminant < 0.0)
    {
        return false;
    }

    float sqrtD = sqrt(discriminant);
    float root = (-halfB - sqrtD) / a;
    if (root < tMin || root > tMax)
    {
        root = (-halfB + sqrtD) / a;
        if (root < tMin || root > tMax)
        {
            return false;
        }
    }

    hit.t = root;
    hit.p = r.origin + root * r.dir;
    Hit base = setFaceNormal(r, (hit.p - s.center) / s.radius);
    hit.normal = base.normal;
    hit.frontFace = base.frontFace;
    hit.material = s.material;
    hit.center = s.center;
    hit.mat = MATERIALS[min(s.material, MATERIAL_COUNT - 1)];
    return true;
}

bool hitWorld(Ray r, float tMin, float tMax, Sphere scn[SPHERE_COUNT], out Hit hit)
{
    float closest = tMax;
    bool found = false;

    for (int i = 0; i < SPHERE_COUNT; ++i)
    {
        Hit temp;
        if (hitSphere(scn[i], r, tMin, closest, temp))
        {
            found = true;
            closest = temp.t;
            hit = temp;
        }
    }

    // Procedural grid of spheres (-11..10)
    for (int a = -11; a < 11; ++a)
    {
        for (int b = -11; b < 11; ++b)
        {
            vec3 cell = vec3(float(a), 0.0, float(b));
            vec3 center = vec3(float(a) + 0.9 * hash_function(cell + vec3(1.0, 0.0, 0.0)),
                               0.2,
                               float(b) + 0.9 * hash_function(cell + vec3(0.0, 0.0, 1.0)));

            if (length(center - vec3(4.0, 0.2, 0.0)) <= 0.9)
            {
                continue;
            }

            float chooseMat = hash_function(cell + vec3(2.0, 2.0, 2.0));
            int matId = (chooseMat < 0.8) ? 10 : (chooseMat < 0.95 ? 11 : 12);

            Sphere s = Sphere(center, 0.2, matId);
            Hit temp;
            if (hitSphere(s, r, tMin, closest, temp))
            {
                found = true;
                closest = temp.t;
                temp.center = center;

                if (matId == 10)
                {
                    vec3 aColor = randomColor(center);
                    vec3 bColor = randomColor(center + 3.7);
                    temp.mat = Material(0, aColor * bColor, 0.0, 1.0);
                }
                else if (matId == 11)
                {
                    vec3 albedo = mix(vec3(0.5), vec3(1.0), randomColor(center));
                    float fuzz = hash_function(center + 2.1) * 0.5;
                    temp.mat = Material(1, albedo, fuzz, 1.0);
                }
                else
                {
                    temp.mat = Material(2, vec3(1.0), 0.0, 1.5);
                }

                hit = temp;
            }
        }
    }
    return found;
}

bool scatter(Material mat, Ray rIn, Hit h, inout uint seed, out Ray scattered, out vec3 attenuation)
{
    if (mat.kind == 0)
    {
        vec3 direction = h.normal + randomUnitVector(seed);
        if (length(direction) < 1e-6)
        {
            direction = h.normal;
        }
        scattered = Ray(h.p, direction);
        attenuation = mat.albedo;
        return true;
    }
    if (mat.kind == 1)
    {
        vec3 reflected = reflectVec(normalize(rIn.dir), h.normal);
        scattered = Ray(h.p, reflected + mat.fuzz * randomUnitVector(seed));
        attenuation = mat.albedo;
        return dot(scattered.dir, h.normal) > 0.0;
    }

    attenuation = vec3(1.0);
    float refractionRatio = h.frontFace ? (1.0 / mat.refIdx) : mat.refIdx;
    vec3 unitDir = normalize(rIn.dir);
    float cosTheta = min(dot(-unitDir, h.normal), 1.0);
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
    bool cannotRefract = refractionRatio * sinTheta > 1.0;
    vec3 direction;
    if (cannotRefract || schlick(cosTheta, refractionRatio) > rand(seed))
    {
        direction = reflectVec(unitDir, h.normal);
    }
    else
    {
        direction = refractVec(unitDir, h.normal, refractionRatio);
    }
    scattered = Ray(h.p, direction);
    return true;
}

vec3 skyColor(Ray r)
{
    vec3 unitDir = normalize(r.dir);
    float t = 0.5 * (unitDir.y + 1.0);
    return mix(vec3(1.0), vec3(0.5, 0.7, 1.0), t);
}

vec3 rayColor(Ray r, Sphere scn[SPHERE_COUNT], inout uint seed)
{
    vec3 attenuation = vec3(1.0);
    Ray current = r;

    for (int depth = 0; depth < MAX_DEPTH; ++depth)
    {
        Hit h;
        if (!hitWorld(current, 0.001, 1e9, scn, h))
        {
            return attenuation * skyColor(current);
        }

        Ray scattered;
        vec3 atten;
        if (!scatter(h.mat, current, h, seed, scattered, atten))
        {
            return vec3(0.0);
        }

        attenuation *= atten;
        current = scattered;
    }

    return vec3(0.0);
}

void main()
{
    vec2 res = iResolution.xy;
    float aspect = res.x / max(res.y, 1.0);
    float unused = (iTime + iTimeDelta + float(iFrame) + iFrameRate + iMouse.x + iMouse.y + iMouse.z + iMouse.w) * 0.0;

    Sphere scn[SPHERE_COUNT] = SCENE;

    vec3 lookfrom = vec3(13.0, 2.0, 3.0);
    vec3 lookat = vec3(0.0);
    vec3 vup = vec3(0.0, 1.0, 0.0);

    vec3 w = normalize(lookfrom - lookat);
    vec3 u = normalize(cross(vup, w));
    vec3 v = cross(w, u);

    float theta = FOV;
    float h = tan(theta * 0.5);
    float viewportHeight = 2.0 * h * FOCUS_DISTANCE;
    float viewportWidth = viewportHeight * aspect;

    vec3 viewportU = viewportWidth * u;
    vec3 viewportV = viewportHeight * -v;
    vec3 pixelDeltaU = viewportU / res.x;
    vec3 pixelDeltaV = viewportV / res.y;

    vec3 viewportUpperLeft = lookfrom - (FOCUS_DISTANCE * w) - viewportU * 0.5 - viewportV * 0.5;
    vec3 pixel00 = viewportUpperLeft + 0.5 * (pixelDeltaU + pixelDeltaV);

    float defocusRadius = FOCUS_DISTANCE * tan(radians(DEFOCUS_ANGLE * 0.5));
    vec3 defocusU = u * defocusRadius;
    vec3 defocusV = v * defocusRadius;

    float yIndex = (res.y - 1.0) - gl_FragCoord.y; // flip y for top-left origin
    uint seed = uint(gl_FragCoord.x) ^ (uint(yIndex) << 8) ^ 9871u ^ floatBitsToUint(unused);
    vec3 color = vec3(0.0);

    for (int s = 0; s < SAMPLES_PER_PIXEL; ++s)
    {
        vec2 jitter = vec2(rand(seed) - 0.5, rand(seed) - 0.5);
        vec3 pixelSample = pixel00 + (float(gl_FragCoord.x) + jitter.x) * pixelDeltaU + (yIndex + jitter.y) * pixelDeltaV;

        vec3 rayOrigin = lookfrom;
        if (DEFOCUS_ANGLE > 0.0)
        {
            vec2 disk = randomInUnitDisk(seed);
            rayOrigin += defocusU * disk.x + defocusV * disk.y;
        }

        vec3 rayDir = pixelSample - rayOrigin;
        color += rayColor(Ray(rayOrigin, rayDir), scn, seed);
    }

    color /= float(SAMPLES_PER_PIXEL);
    color = pow(max(color, vec3(0.0)), vec3(0.4545));

    fragColor = vec4(color, 1.0);
}
