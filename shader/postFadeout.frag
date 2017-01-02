/* ----------------------------------------------------------------------------
 * fadeout shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 globalColor;
uniform vec2 resolution;
void main(){
    vec2 dummy = resolution;
    gl_FragColor = globalColor;
}
