/* ----------------------------------------------------------------------------
 * gpgpu position cylinder update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D velocityTexture;
uniform float sound[16];
varying vec2 vTexCoord;
const float orad = 2.0;
const float irad = 1.5;
const float PI = 3.1415926;
const float PI2 = PI * 2.0;
const float coef = 1.0 / 1024.0;
void main(){
    float tmp = time + sound[0];
    vec4 n = texture2D(noiseTexture, vec2(mod(vTexCoord.s + time * 0.1, 1.0), vTexCoord.t));
    vec4 p = texture2D(previousTexture, vTexCoord);
    vec4 v = texture2D(velocityTexture, vTexCoord);
    vec2 r = vTexCoord * PI2;
    float s = sin(r.y) * irad + n.r * 0.2;
    float c = cos(r.y) * irad + n.g * 0.2 + orad;
    float rs = sin(r.x);
    float rc = cos(r.x);
    mat2 m = mat2(rc, rs, -rs, rc);
    vec2 w = m * vec2(c, 0.0);
    gl_FragColor = vec4(w.x, s, w.y, 1.0);
}
