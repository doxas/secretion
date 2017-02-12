/* ----------------------------------------------------------------------------
 * effect rgb shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 coefs; // r = offsetpower, g, b, a = globalalpha
uniform vec2 resolution;
uniform sampler2D texture;
varying vec2 vTexCoord;
void main(){
    vec2 p = gl_FragCoord.xy / resolution;
    float r = (1.0 - p.x) * coefs.r;
    float b = p.x * coefs.r;
    vec4 samplerColor = texture2D(texture, vTexCoord);
    float rColor = texture2D(texture, vTexCoord + vec2(r, 0.0)).r;
    float bColor = texture2D(texture, vTexCoord + vec2(b, 0.0)).b;
    gl_FragColor = vec4(rColor, samplerColor.g, bColor, samplerColor.a * coefs.a);
}
