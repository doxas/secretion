/* ----------------------------------------------------------------------------
 * gpgpu velocity tracking update shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform float time;
uniform sampler2D noiseTexture;
uniform sampler2D previousTexture;
uniform sampler2D positionTexture;
varying vec2 vTexCoord;
const float speed = 0.05;
void main(){
    vec4 n = texture2D(noiseTexture, vec2(mod(time * 0.1, 1.0)));
    vec4 m = texture2D(previousTexture, vTexCoord);
    vec4 p = texture2D(positionTexture, vTexCoord);
    vec3 v = m.xyz + normalize(normalize(n.xyz * 2.0 - 1.0) - p.xyz) * 0.05;
    gl_FragColor = vec4(normalize(v), 0.0);
}
