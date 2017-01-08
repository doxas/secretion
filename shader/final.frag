/* ----------------------------------------------------------------------------
 * final shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 globalColor;
uniform sampler2D texture;
uniform vec2 resolution;
varying vec2 vTexCoord;
void main(){
    vec2 dummy = resolution;
    gl_FragColor = texture2D(texture, vTexCoord) * globalColor;
}
