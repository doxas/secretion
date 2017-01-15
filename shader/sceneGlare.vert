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
varying vec4 vType;
varying vec4 vRandom;
void main(){
    vColor = color;
    vTexCoord = texCoord;
    vType = type;
    vRandom = random;
    float tmp = sound[0];
    vec4 p = texture2D(positionTexture, texCoord);
    gl_Position = mvpMatrix * vec4(position * delegate + p.xyz, 1.0);
    gl_PointSize = pointSize;
}
