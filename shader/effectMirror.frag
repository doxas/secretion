/* ----------------------------------------------------------------------------
 * effect mirror shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 coefs;
uniform vec2 resolution;
uniform sampler2D texture;
varying vec2 vTexCoord;
void main(){
    vec2 p = gl_FragCoord.xy / resolution;
    vec2 t = abs(p * 2.0 - 1.0) * 0.5;
    vec4 samplerColor = texture2D(texture, vec2(t));
    gl_FragColor = vec4(samplerColor.rgb, samplerColor.a + coefs.a);
}
