/* ----------------------------------------------------------------------------
 * plane point draw shader
 * ---------------------------------------------------------------------------- */
precision highp float;

uniform sampler2D noiseTexture;
uniform sampler2D bitmapTexture;
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vec4 n = texture2D(noiseTexture, vTexCoord);
    vec4 b = texture2D(bitmapTexture, vTexCoord);
    gl_FragColor = vec4(vec3(b.r), min(n.r + 0.5, 1.0));
}
