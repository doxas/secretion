/* ----------------------------------------------------------------------------
 * gradation shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 globalColor;
uniform sampler2D texture;
uniform float time;
uniform vec2 resolution;
varying vec2 vTexCoord;
void main(){
    vec2 p = gl_FragCoord.xy / resolution * 2.0 - 1.0;
    float l = 0.1 / (p.y + 1.75);
    vec4 smp = texture2D(texture, vTexCoord);
    gl_FragColor = vec4(vec3(l), 1.0) * globalColor;
}
