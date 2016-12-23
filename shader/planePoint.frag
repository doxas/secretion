/* ----------------------------------------------------------------------------
 * plane point draw shader
 * ---------------------------------------------------------------------------- */
precision highp float;

uniform sampler2D noiseTexture;
uniform sampler2D bitmapTexture;
uniform sampler2D pointTexture;
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vec4 n = texture2D(noiseTexture, vTexCoord);
    vec4 b = texture2D(bitmapTexture, vTexCoord);
    vec4 p = texture2D(pointTexture, gl_PointCoord.st);
    // gl_FragColor = vec4(vec3(b.r), min(n.r + 0.1, 1.0)) * p;
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
