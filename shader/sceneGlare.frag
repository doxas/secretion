/* ----------------------------------------------------------------------------
 * glare shader of point
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
void main(){
    vec4 n = texture2D(noiseTexture, vTexCoord);
    vec4 p = texture2D(pointTexture, gl_PointCoord.st);
    float r = vRandom.x * time;
    float s = sin(r);
    float c = cos(r);
    mat2 m = mat2(c, -s, s, c);
    vec2 q = m * (gl_PointCoord.st * 2.0 - 1.0);
    float f = min(vRandom.z * 0.1 / abs(q.x * q.y), 5.0) - (0.2 / abs(length(q) - 1.1));
    gl_FragColor = vec4(vec3(f * vRandom.y), 1.0) * globalColor;
    // gl_FragColor = vec4(vec3(p.rgb * f), p.a) * globalColor;
}
