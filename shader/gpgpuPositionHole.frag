/* ----------------------------------------------------------------------------
 * gpgpu position hole update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D velocityTexture;
uniform float sound[16];
varying vec2 vTexCoord;
const float rad = 0.5;
const float PI = 3.1415926;
const float PI2 = PI * 2.0;
void main(){
    float tmp = sound[0];
    vec4 n = texture2D(noiseTexture, vec2(mod(vTexCoord.s - (time * 0.1), 1.0), vTexCoord.t));
    vec4 p = texture2D(previousTexture, vTexCoord);
    vec4 v = texture2D(velocityTexture, vTexCoord);
    vec2 r = vTexCoord * PI2;
    float s = sin(r.y + n.x * time * 0.25) * rad;
    float c = cos(r.y + n.x * time * 0.25) * rad;
    gl_FragColor = vec4(c, s, 1.0 - vTexCoord.s * 2.0, 1.0);
}
