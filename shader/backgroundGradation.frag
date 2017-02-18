/* ----------------------------------------------------------------------------
 * gradation shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec4 globalColor;
uniform sampler2D texture;
uniform float time;
uniform int mode;
uniform vec2 resolution;
varying vec2 vTexCoord;
void main(){
    vec2 p = gl_FragCoord.xy / resolution * 2.0 - 1.0;
    float l = (0.2 + sin(time * 0.25) * 0.05) / (p.y + 1.5);
    vec4 smp = texture2D(texture, vTexCoord);
    if(mode == 0){
        gl_FragColor = vec4(vec3(l), 1.0) * globalColor;
    }else if(mode == 1){
        float f = sin(p.y * 500.0 - time * 20.0);
        gl_FragColor = vec4(vec3(l), 1.0) * globalColor * vec4(vec3(f), 1.0);
    }else if(mode == 2){
        vec2 v = vec2(cos((time + 1.0) * 0.5) * 0.85, sin((time + 2.0) * 0.2) * 0.55);
        vec2 w = vec2(cos((time + 2.0) * 0.3) * 0.75, sin((time + 1.0) * 0.4) * 0.45);
        vec2 x = vec2(cos((time + 4.0) * 0.2) * 1.25, sin((time + 3.0) * 0.2) * 0.55);
        vec2 y = vec2(cos((time + 3.0) * 0.4) * 0.65, sin((time + 4.0) * 0.8) * 0.85);
        vec2 z = vec2(cos((time + 1.0) * 0.7) * 0.75, sin((time + 1.0) * 0.5) * 0.35);
        float g = 0.06 / length(p + v);
        float h = 0.12 / length(p + w);
        float i = 0.24 / length(p + x);
        float j = 0.12 / length(p + y);
        float k = 0.06 / length(p + z);
        float o = min(1.0, g + h + i + j + k) * 0.15;
        gl_FragColor = vec4(vec3(l), 1.0) * globalColor + vec4(o, 0.0, 0.0 * 0.1, 0.0);
    }
}
