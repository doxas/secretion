/* ----------------------------------------------------------------------------
 * star shader of point
 * ---------------------------------------------------------------------------- */
precision highp float;

uniform float time;
uniform vec4 globalColor;
uniform sampler2D noiseTexture;
uniform sampler2D pointTexture;
varying vec4 vColor;
varying vec2 vTexCoord;
varying vec4 vType;
varying vec4 vRandom;
const float PI = 3.1415926;
const float PI2 = PI * 2.0;
void main(){
    vec2 q = gl_PointCoord.st * 2.0 - 1.0;
    float t = (atan(q.y, q.x) + PI) / PI2;
    float l = mod(vRandom.x * vRandom.w * time * 2.0, 1.0);
    vec4 n = texture2D(noiseTexture, vec2(t, l));
    vec4 p = texture2D(pointTexture, gl_PointCoord.st);
    float o = n.r * 0.125;
    float r = vRandom.y * 0.1 + 0.05;
    float f = min(r / max(length(q) - o, 0.0), 1.0) - 0.2 / abs(length(q) - 1.1);
    gl_FragColor = vec4(vec3(f), 1.0) * globalColor;
}
