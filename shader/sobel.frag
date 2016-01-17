/* ----------------------------------------------------------------------------
 * sobel shader
 * ---------------------------------------------------------------------------- */
precision mediump float;

uniform vec2 resolution;
uniform float hWeight[9];
uniform float vWeight[9];
uniform sampler2D texture;
varying vec2 vTexCoord;
const float redScale   = 0.298912;
const float greenScale = 0.586611;
const float blueScale  = 0.114478;
const vec3  monochromeScale = vec3(redScale, greenScale, blueScale);
void main(){
    vec2 offset[9];
    offset[0] = vec2(-1.0, -1.0);
    offset[1] = vec2( 0.0, -1.0);
    offset[2] = vec2( 1.0, -1.0);
    offset[3] = vec2(-1.0,  0.0);
    offset[4] = vec2( 0.0,  0.0);
    offset[5] = vec2( 1.0,  0.0);
    offset[6] = vec2(-1.0,  1.0);
    offset[7] = vec2( 0.0,  1.0);
    offset[8] = vec2( 1.0,  1.0);
    vec2 p = 1.0 / resolution;
    vec3 horizonColor = vec3(0.0);
    vec3 verticalColor = vec3(0.0);
    for(int i = 0; i < 9; ++i){
        horizonColor  += texture2D(texture, (gl_FragCoord.st + offset[i]) * p).rgb * hWeight[i];
        verticalColor += texture2D(texture, (gl_FragCoord.st + offset[i]) * p).rgb * vWeight[i];
    }
    vec3 sobelColor = vec3(sqrt(horizonColor * horizonColor + verticalColor * verticalColor));
    float f = pow(dot(sobelColor, monochromeScale), 5.0);
    gl_FragColor = vec4(vec3(f), 1.0);
}
