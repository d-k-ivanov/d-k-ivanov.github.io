struct ShaderUniforms
{
    iResolution : vec3f,
    _padding0 : f32,
    iTime : f32,
    iTimeDelta : f32,
    iFrame : u32,
    iFrameRate : f32,
    _padding1 : vec2f,
    iMouse : vec4f,
};

@group(0) @binding(0) var<uniform> shaderUniforms : ShaderUniforms;
@group(0) @binding(1) var outputTex : texture_storage_2d<rgba8unorm, write>;

const PI : f32 = 3.14159265359;
const SAMPLES_PER_PIXEL : u32 = 4u;
const MAX_DEPTH : u32 = 8u;
const SPHERE_COUNT : u32 = 4u;
const MATERIAL_COUNT : u32 = 4u;
const FOV_DEGREES : f32 = 20.0;
const FOCUS_DISTANCE : f32 = 1.0;
const DEFOCUS_ANGLE : f32 = 0.6; // degrees

struct Ray
{
    origin : vec3f,
    dir : vec3f,
};

struct Material
{
    kind : u32,   // 0 = lambert, 1 = metal, 2 = dielectric
    albedo : vec3f,
    fuzz : f32,
    refIdx : f32,
};

struct Sphere
{
    center : vec3f,
    radius : f32,
    material : u32,
};

struct Hit
{
    p : vec3f,
    center : vec3f,
    normal : vec3f,
    t : f32,
    material : u32,
    frontFace : bool,
    mat : Material,
};

const MATERIALS : array<Material, MATERIAL_COUNT> = array<Material, MATERIAL_COUNT>(
    // 0: ground
    Material(0u, vec3f(0.5, 0.5, 0.5), 0.0, 1.0),
    // 1: glass center
    Material(2u, vec3f(1.0, 1.0, 1.0), 0.0, 1.5),
    // 2: left big lambertian
    Material(0u, vec3f(0.4, 0.2, 0.1), 0.0, 1.0),
    // 3: right big metal
    Material(1u, vec3f(0.7, 0.6, 0.5), 0.0, 1.0)
);

fn hash(seed : ptr<function, u32>) -> f32
{
    // PCG-inspired hashing to generate repeatable randoms in [0,1).
    *seed = (*seed ^ 0x6C8E9CF5u) * 747796405u + 2891336453u;
    return f32(*seed) * (1.0 / 4294967296.0);
}

fn randomInUnitSphere(seed : ptr<function, u32>) -> vec3f
{
    // Limited attempts to avoid infinite loops on some drivers.
    for (var i = 0u; i < 8u; i = i + 1u)
    {
        let p = vec3f(hash(seed) * 2.0 - 1.0, hash(seed) * 2.0 - 1.0, hash(seed) * 2.0 - 1.0);
        if (dot(p, p) < 1.0)
        {
            return p;
        }
    }
    return vec3f(0.0, 0.0, 0.0);
}

fn randomUnitVector(seed : ptr<function, u32>) -> vec3f
{
    let p = randomInUnitSphere(seed);
    let lenSq = max(1e-6, dot(p, p));
    return p / sqrt(lenSq);
}

fn randomInUnitDisk(seed : ptr<function, u32>) -> vec2f
{
    for (var i = 0u; i < 8u; i = i + 1u)
    {
        let p = vec2f(hash(seed) * 2.0 - 1.0, hash(seed) * 2.0 - 1.0);
        if (dot(p, p) < 1.0)
        {
            return p;
        }
    }
    return vec2f(0.0, 0.0);
}

fn reflect(v : vec3f, n : vec3f) -> vec3f
{
    return v - 2.0 * dot(v, n) * n;
}

fn refract(uv : vec3f, n : vec3f, etaiOverEtat : f32) -> vec3f
{
    let cosTheta = min(dot(-uv, n), 1.0);
    let rOutPerp = etaiOverEtat * (uv + cosTheta * n);
    let rOutParallel = -sqrt(max(0.0, 1.0 - dot(rOutPerp, rOutPerp))) * n;
    return rOutPerp + rOutParallel;
}

fn schlick(cosine : f32, refIdx : f32) -> f32
{
    var r0 = (1.0 - refIdx) / (1.0 + refIdx);
    r0 = r0 * r0;
    return r0 + (1.0 - r0) * pow((1.0 - cosine), 5.0);
}

fn hash_function(p : vec3f) -> f32
{
    return fract(sin(dot(p, vec3f(127.1, 311.7, 74.7))) * 43758.5453);
}

fn randomColor(seed : vec3f) -> vec3f
{
    return vec3f(
        hash_function(seed + vec3f(1.3, 1.3, 1.3)),
        hash_function(seed + vec3f(2.7, 2.7, 2.7)),
        hash_function(seed + vec3f(5.1, 5.1, 5.1))
    );
}

fn makeScene() -> array<Sphere, SPHERE_COUNT>
{
    return array<Sphere, SPHERE_COUNT>(
        Sphere(vec3f(0.0, -1000.0, 0.0), 1000.0, 0u),
        Sphere(vec3f(0.0, 1.0, 0.0), 1.0, 1u),
        Sphere(vec3f(-4.0, 1.0, 0.0), 1.0, 2u),
        Sphere(vec3f(4.0, 1.0, 0.0), 1.0, 3u)
    );
}

fn setFaceNormal(r : Ray, outward : vec3f) -> Hit
{
    let front = dot(r.dir, outward) < 0.0;
    var normal = outward;
    if (!front)
    {
        normal = -outward;
    }
    return Hit(vec3f(0.0), vec3f(0.0), normal, 0.0, 0u, front, MATERIALS[0]);
}

fn hitSphere(s : Sphere, r : Ray, tMin : f32, tMax : f32, hit : ptr<function, Hit>) -> bool
{
    let oc = r.origin - s.center;
    let a = dot(r.dir, r.dir);
    let halfB = dot(oc, r.dir);
    let c = dot(oc, oc) - s.radius * s.radius;
    let discriminant = halfB * halfB - a * c;
    if (discriminant < 0.0)
    {
        return false;
    }

    let sqrtD = sqrt(discriminant);
    var root = (-halfB - sqrtD) / a;
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
    let base = setFaceNormal(r, (hit.p - s.center) / s.radius);
    hit.normal = base.normal;
    hit.frontFace = base.frontFace;
    hit.material = s.material;
    hit.center = s.center;
    hit.mat = MATERIALS[min(s.material, MATERIAL_COUNT - 1u)];
    return true;
}

fn hitWorld(r : Ray, tMin : f32, tMax : f32, scene : array<Sphere, SPHERE_COUNT>, hit : ptr<function, Hit>) -> bool
{
    var closest = tMax;
    var found = false;

    for (var i = 0u; i < SPHERE_COUNT; i = i + 1u)
    {
        var temp = Hit(vec3f(0.0), vec3f(0.0), vec3f(0.0), 0.0, 0u, false, MATERIALS[0]);
        if (hitSphere(scene[i], r, tMin, closest, &temp))
        {
            found = true;
            closest = temp.t;
            hit.p = temp.p;
            hit.center = temp.center;
            hit.normal = temp.normal;
            hit.t = temp.t;
            hit.material = temp.material;
            hit.frontFace = temp.frontFace;
            hit.mat = temp.mat;
        }
    }

    // Procedural grid of spheres (-11..10)
    for (var a = -11; a < 11; a = a + 1)
    {
        for (var b = -11; b < 11; b = b + 1)
        {
            let cell = vec3f(f32(a), 0.0, f32(b));
            let center = vec3f(
                f32(a) + 0.9 * hash_function(cell + vec3f(1.0, 0.0, 0.0)),
                0.2,
                f32(b) + 0.9 * hash_function(cell + vec3f(0.0, 0.0, 1.0))
            );

            if (length(center - vec3f(4.0, 0.2, 0.0)) <= 0.9)
            {
                continue;
            }

            let chooseMat = hash_function(cell + vec3f(2.0, 2.0, 2.0));
            var matId : u32 = 12u;
            if (chooseMat < 0.8)
            {
                matId = 10u;
            }
            else if (chooseMat < 0.95)
            {
                matId = 11u;
            }

            let s = Sphere(center, 0.2, matId);
            var temp = Hit(vec3f(0.0), vec3f(0.0), vec3f(0.0), 0.0, 0u, false, MATERIALS[0]);
            if (hitSphere(s, r, tMin, closest, &temp))
            {
                found = true;
                closest = temp.t;
                temp.center = center;

                if (matId == 10u)
                {
                    let aColor = randomColor(center);
                    let bColor = randomColor(center + vec3f(3.7, 3.7, 3.7));
                    temp.mat = Material(0u, aColor * bColor, 0.0, 1.0);
                }
                else if (matId == 11u)
                {
                    let albedo = mix(vec3f(0.5, 0.5, 0.5), vec3f(1.0, 1.0, 1.0), randomColor(center));
                    let fuzz = hash_function(center + vec3f(2.1, 2.1, 2.1)) * 0.5;
                    temp.mat = Material(1u, albedo, fuzz, 1.0);
                }
                else
                {
                    temp.mat = Material(2u, vec3f(1.0, 1.0, 1.0), 0.0, 1.5);
                }

                hit.p = temp.p;
                hit.center = temp.center;
                hit.normal = temp.normal;
                hit.t = temp.t;
                hit.material = temp.material;
                hit.frontFace = temp.frontFace;
                hit.mat = temp.mat;
            }
        }
    }

    return found;
}

fn scatter(mat : Material, rIn : Ray, hit : Hit, seed : ptr<function, u32>, scattered : ptr<function, Ray>, attenuation : ptr<function, vec3f>) -> bool
{
    if (mat.kind == 0u)
    {
        var direction = hit.normal + randomUnitVector(seed);
        if (all(abs(direction) < vec3f(1e-6)))
        {
            direction = hit.normal;
        }
        scattered.origin = hit.p;
        scattered.dir = direction;
        (*attenuation) = mat.albedo;
        return true;
    }
    if (mat.kind == 1u)
    {
        let reflected = reflect(normalize(rIn.dir), hit.normal);
        scattered.origin = hit.p;
        scattered.dir = reflected + mat.fuzz * randomUnitVector(seed);
        (*attenuation) = mat.albedo;
        return dot(scattered.dir, hit.normal) > 0.0;
    }

    // dielectric
    (*attenuation) = vec3f(1.0, 1.0, 1.0);
    var refractionRatio = mat.refIdx;
    if (hit.frontFace)
    {
        refractionRatio = 1.0 / mat.refIdx;
    }
    let unitDir = normalize(rIn.dir);
    let cosTheta = min(dot(-unitDir, hit.normal), 1.0);
    let sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
    let cannotRefract = refractionRatio * sinTheta > 1.0;
    var direction = vec3f(0.0);
    if (cannotRefract || schlick(cosTheta, refractionRatio) > hash(seed))
    {
        direction = reflect(unitDir, hit.normal);
    }
    else
    {
        direction = refract(unitDir, hit.normal, refractionRatio);
    }
    scattered.origin = hit.p;
    scattered.dir = direction;
    return true;
}

fn sky(r : Ray) -> vec3f
{
    let unitDir = normalize(r.dir);
    let t = 0.5 * (unitDir.y + 1.0);
    return mix(vec3f(1.0, 1.0, 1.0), vec3f(0.5, 0.7, 1.0), vec3f(t));
}

fn rayColor(r : Ray, scene : array<Sphere, SPHERE_COUNT>, seed : ptr<function, u32>) -> vec3f
{
    var attenuation = vec3f(1.0);
    var ray = r;

    for (var depth = 0u; depth < MAX_DEPTH; depth = depth + 1u)
    {
        var rec = Hit(vec3f(0.0), vec3f(0.0), vec3f(0.0), 0.0, 0u, false, MATERIALS[0]);
        if (!hitWorld(ray, 0.001, 1e9, scene, &rec))
        {
            return attenuation * sky(ray);
        }

        var scattered = Ray(vec3f(0.0), vec3f(0.0));
        var atten = vec3f(1.0);
        if (!scatter(rec.mat, ray, rec, seed, &scattered, &atten))
        {
            return vec3f(0.0);
        }

        attenuation = attenuation * atten;
        ray = scattered;
    }

    return vec3f(0.0);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid : vec3u)
{
    let dims = textureDimensions(outputTex);
    if (gid.x >= dims.x || gid.y >= dims.y)
    {
        return;
    }

    let res = vec2f(f32(dims.x), f32(dims.y));
    let aspect = res.x / max(res.y, 1.0);
    let unused = shaderUniforms.iTime + shaderUniforms.iTimeDelta + f32(shaderUniforms.iFrame) + shaderUniforms.iFrameRate + shaderUniforms.iMouse.x + shaderUniforms.iMouse.y + shaderUniforms.iMouse.z + shaderUniforms.iMouse.w;

    var seed = (gid.x * 1973u) ^ (gid.y * 9277u) ^ 26699u ^ u32(unused * 0.0);

    let theta = radians(FOV_DEGREES);
    let lookfrom = vec3f(13.0, 2.0, 3.0);
    let lookat = vec3f(0.0, 0.0, 0.0);
    let vup = vec3f(0.0, 1.0, 0.0);

    let w = normalize(lookfrom - lookat);
    let u = normalize(cross(vup, w));
    let v = cross(w, u);
    let forward = -w;
    let fovScale = tan(theta * 0.5);

    let defocusRadius = FOCUS_DISTANCE * tan(radians(DEFOCUS_ANGLE * 0.5));
    let defocusDiskU = u * defocusRadius;
    let defocusDiskV = v * defocusRadius;

    let scene = makeScene();

    var color = vec3f(0.0);
    for (var s = 0u; s < SAMPLES_PER_PIXEL; s = s + 1u)
    {
        let jitter = vec2f(hash(&seed) - 0.5, hash(&seed) - 0.5);
        var ndc = ((vec2f(f32(gid.x), f32(gid.y)) + jitter) / res) * vec2f(2.0, 2.0) - vec2f(1.0, 1.0);
        ndc.x *= aspect;
        ndc.y = -ndc.y;

        var rayOrigin = lookfrom;
        if (DEFOCUS_ANGLE > 0.0)
        {
            let disk = randomInUnitDisk(&seed);
            rayOrigin = rayOrigin + defocusDiskU * disk.x + defocusDiskV * disk.y;
        }

        let focusTarget = rayOrigin + forward * FOCUS_DISTANCE + ndc.x * u * (fovScale * FOCUS_DISTANCE) + ndc.y * v * (fovScale * FOCUS_DISTANCE);
        let r = Ray(rayOrigin, normalize(focusTarget - rayOrigin));
        color = color + rayColor(r, scene, &seed);
    }

    color = color / f32(SAMPLES_PER_PIXEL);
    let gamma = pow(max(color, vec3f(0.0)), vec3f(0.454545));
    textureStore(outputTex, vec2u(gid.xy), vec4f(gamma, 1.0));
}
