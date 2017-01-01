/* ----------------------------------------------------------------------------
 * gpgpu reset shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform sampler2D noiseTexture;
varying vec2 vTexCoord;
void main(){
    vec4 n = texture2D(noiseTexture, vTexCoord);
    gl_FragColor = vec4(vec3(0.0), 1.0);
}
