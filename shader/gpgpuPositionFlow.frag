/* ----------------------------------------------------------------------------
 * gpgpu position flowing update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D velocityTexture;
varying vec2 vTexCoord;
const float speed = 0.05;
const float rad = 100.0;
const float PI = 3.1415926;
const float PI2 = PI * 2.0;
void main(){
    /* vec4 n = texture2D(noiseTexture, vec2(mod(vTexCoord.s + time * 0.05, 1.0), vTexCoord.t)); */
    vec4 n = texture2D(noiseTexture, vTexCoord);
    vec4 p = texture2D(previousTexture, vTexCoord);
    vec4 v = texture2D(velocityTexture, vTexCoord);
    float r = vTexCoord.s * PI2;
    float s = sin(r - time * 0.005) * rad;
    float c = cos(r - time * 0.005) * rad;
    float y = cos(vTexCoord.t * PI) * rad * 2.0;
    vec3 w = vec3(c, y, s);
    gl_FragColor = vec4(w, 1.0);
}
