/* ----------------------------------------------------------------------------
 * final anaglyph shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 globalColor;
uniform sampler2D texture;
uniform vec2 resolution;
varying vec2 vTexCoord;
void main(){
    vec2 p = (mod(gl_FragCoord.st, 10.0) / 5.0) - 1.0;
    vec2 r = resolution * 0.5 - gl_FragCoord.st;
    vec2 q = normalize(r) * length(r) / length(resolution);
    float f = 0.5 / length(p - q);
    vec2 w = resolution / 10.0;
    vec2 v = floor(vTexCoord * w) / w;
    gl_FragColor = vec4(vec3(f * f), 1.0) * texture2D(texture, v) * globalColor;
}
