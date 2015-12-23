precision mediump float;

uniform sampler2D texture;

varying vec4 vColor;

void main(){
//    vec4 samplerColor = texture2D(texture, uv);
	gl_FragColor = vColor;
}
