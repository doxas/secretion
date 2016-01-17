/* ----------------------------------------------------------------------------
 * final shader
 * ---------------------------------------------------------------------------- */
precision mediump float;

uniform vec4 globalColor;
uniform sampler2D texture;
varying vec2 vTexCoord;
void main(){
    vec4 smp = texture2D(texture, vTexCoord) * globalColor;
    gl_FragColor = texture2D(texture, vTexCoord) * globalColor;
}
