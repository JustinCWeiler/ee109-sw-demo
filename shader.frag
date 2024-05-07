const float PI = 3.1415926535;
const float FOV = 45.0;
const float INF = 1e10;
const float EPS = 1e-10;

const int SAMPLE = 2;
const float OFF1 = 1.0 / float(SAMPLE);
const float OFF2 = OFF1 / 2.0;

struct Sphere {
    vec3 pos;
    float radius;
    vec3 color;
};

struct Ray {
    vec3 pos;
    vec3 dir;
};

struct HitInfo {
    vec3 color;
    vec3 normal;
    Ray ray;
    float t;
};

Sphere spheres[] = Sphere[](
    Sphere(vec3(-1.0, -0.75, -5.0), 0.8, vec3(1.0, 0.0, 0.0)),
    Sphere(vec3(1.0, -0.75, -5.0), 0.8, vec3(0.0, 1.0, 0.0)),
    Sphere(vec3(0.0, 0.75, -5.0), 0.8, vec3(0.0, 0.0, 1.0))
);

bool rayHitSphere(Ray r, Sphere s, out HitInfo info) {
    vec3 p = s.pos - r.pos;
    vec3 d = r.dir;
    
    float dp = dot(d, p);
    float dd = dot(d, d);
    float pp = dot(p, p);
    
    float inner = dp*dp - dd*(pp - s.radius*s.radius);
    if (inner < 0.0) return false;
    
    float t = (dp - sqrt(inner)) / dd;
    
    if (t < 0.0) return false;
    
    info.color = s.color;
    info.normal = normalize(r.pos + t*r.dir - s.pos);
    info.ray = r;
    info.t = t;
    
    return true;
}

bool shootRay(Ray r, inout HitInfo info) {
    bool updated = false;
    for (int i = 0; i < spheres.length(); i++) {
        HitInfo sphere_info;
        if (rayHitSphere(r, spheres[i], sphere_info) && sphere_info.t < info.t) {
            info = sphere_info;
            updated = true;
        }
    }
    return updated;
}

vec4 traceRay(Ray r) {
    HitInfo closest_info;
    closest_info.t = INF;
    shootRay(r, closest_info);
    
    if (closest_info.t == INF) {
        return vec4(0.5);
    }
    
    vec3 light_pos = vec3(cos(iTime), 2.0, -5.0 + sin(iTime));
    
    vec3 hit_pos = r.pos + r.dir*closest_info.t;
    vec3 light_dir = normalize(light_pos - hit_pos);
    closest_info.color *= max(dot(closest_info.normal, light_dir), 0.0);
    
    Ray light_ray = Ray(hit_pos + light_dir*EPS, light_dir);
    HitInfo light_info;
    light_info.t = INF;
    
    if (shootRay(light_ray, light_info)) {
        return vec4(0.0);
    }
    
    return vec4(closest_info.color, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec4 color = vec4(0.0);
    for (int x = 0; x < SAMPLE; x++) {
        for (int y = 0; y < SAMPLE; y++) {
            vec2 uv = (fragCoord + OFF2 + OFF1*vec2(x, y))/iResolution.xy;
            uv -= 0.5;
            uv.x *= iResolution.x / iResolution.y;
            uv *= 2.0 * tan(FOV * PI / 360.0);

            vec3 rayDir = normalize(vec3(uv.x, uv.y, -1.0));

            color += traceRay(Ray(vec3(0.0), rayDir));
        }
    }
    
    fragColor = color / float(SAMPLE * SAMPLE);
}
