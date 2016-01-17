attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 texCoord;
uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform vec3 eyePosition;
uniform vec3 centerPoint;
uniform vec4 ambient;
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vec3 invLight = (invMatrix * vec4(normalize(lightDirection), 0.0)).xyz;
    vec3 invEye   = (invMatrix * vec4(normalize(eyePosition - centerPoint), 0.0)).xyz;
    vec3 halfVec  = normalize(invLight + invEye);
    float diff = clamp(dot(invLight, normal), 0.2, 1.0);
    float spec = clamp(dot(halfVec, normal), 0.0, 1.0);
    vColor = vec4(color.rgb * diff, 1.0) + vec4(vec3(pow(spec, 20.0)), 1.0) + ambient;
    vTexCoord = texCoord;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
