/* ----------------------------------------------------------------------------
 * gpgpu position update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D velocityTexture;
varying vec2 vTexCoord;
const float speed = 0.05;
void main(){
    float tmp = time;
    vec4 n = texture2D(noiseTexture, vec2(mod(vTexCoord.s + time * 0.001, 1.0), vTexCoord.t));
    vec4 p = texture2D(previousTexture, vTexCoord);
    vec4 v = texture2D(velocityTexture, vTexCoord);
    gl_FragColor = vec4(n.xyz - 0.5, 1.0);
}
