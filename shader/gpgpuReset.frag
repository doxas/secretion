/* ----------------------------------------------------------------------------
 * gpgpu reset shader
 * ---------------------------------------------------------------------------- */
precision highp float;
uniform sampler2D noiseTexture;
uniform bool isVelocity;
varying vec2 vTexCoord;
void main(){
    vec4 n = texture2D(noiseTexture, vTexCoord);
    vec2 v = vTexCoord * 2.0 - 1.0;
    if(isVelocity){v = vec2(v.x, -v.y);}
    gl_FragColor = vec4(v, 0.0, 0.0);
}
