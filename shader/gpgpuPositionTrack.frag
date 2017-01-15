/* ----------------------------------------------------------------------------
 * gpgpu position tracking update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D velocityTexture;
uniform float sound[16];
varying vec2 vTexCoord;
const float speed = 0.01;
void main(){
    float tmp = time + sound[0];
    vec4 n = texture2D(noiseTexture, vec2(mod(vTexCoord.s + time * 0.1, 1.0), vTexCoord.t));
    vec4 p = texture2D(previousTexture, vTexCoord);
    vec4 v = texture2D(velocityTexture, vTexCoord);
    gl_FragColor = vec4(p.xyz + (speed + n.r * 0.02) * v.xyz, 1.0);
}
