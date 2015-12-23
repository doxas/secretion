/* ----------------------------------------------------------------------------
 * gaussian shader
 * ---------------------------------------------------------------------------- */

// (function(){
//     var t = 0.0;
//     var d = 150.0;
//     for(var i = 0; i < 30; i++){
//         var r = 1.0 + 2.0 * i;
//         var w = Math.exp(-0.5 * (r * r) / d);
//         weight[i] = w;
//         if(i > 0){w *= 2.0;}
//         t += w;
//     }
//     for(i = 0; i < weight.length; i++){
//         weight[i] /= t;
//     }
// })();

precision mediump float;

uniform vec2 resolution;
uniform bool horizontal;
uniform float weight[30];
uniform sampler2D texture;

void main(){
    vec2 tFrag = 1.0 / resolution;
    vec2 fc = gl_FragCoord.st;
    vec4 destColor = texture2D(texture, fc) * weight[0];
    if(horizontal){
        for(int i = 1; i < 30; ++i){
            destColor += texture2D(texture, (fc + vec2( float(i), 0.0)) * tFrag) * weight[i];
            destColor += texture2D(texture, (fc + vec2(-float(i), 0.0)) * tFrag) * weight[i];
        }
    }else{
        for(int i = 1; i < 30; ++i){
            destColor += texture2D(texture, (fc + vec2(0.0,  float(i))) * tFrag) * weight[i];
            destColor += texture2D(texture, (fc + vec2(0.0, -float(i))) * tFrag) * weight[i];
        }
    }
    gl_FragColor = destColor;
}
