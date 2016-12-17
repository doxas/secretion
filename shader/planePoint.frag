/* ----------------------------------------------------------------------------
 * plane point draw shader
 * ---------------------------------------------------------------------------- */
precision mediump float;

uniform sampler2D texture;
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vec4 smp = texture2D(texture, vTexCoord);
    gl_FragColor = vec4(smp.rgb, 1.0) * vec4(1.0);
}
