attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;
attribute vec4 type;
attribute vec4 random;
uniform mat4 mvpMatrix;
uniform sampler2D positionTexture;
uniform float time;
uniform float delegate;
uniform float pointSize;
uniform float sound[16];
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vec4 dummy = type + random + time + color.a +  sound[0];
    vec4 p = texture2D(positionTexture, texCoord);
    gl_Position = mvpMatrix * vec4(position * delegate + p.xyz, 1.0);
    float z = 1.0 - smoothstep(0.0, 1.0, abs(p.z) / 3.0);
    float w = smoothstep(0.0, 1.0, (p.z + 5.0) / 10.0);
    gl_PointSize = pointSize * w;
    vColor = vec4(vec3(1.0), z * 0.25);
    vTexCoord = texCoord;
}
