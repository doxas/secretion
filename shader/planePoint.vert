attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;
attribute vec4 type;
attribute vec4 random;
uniform mat4 mvpMatrix;
uniform sampler2D noiseTexture;
uniform float time;
varying vec4 vColor;
varying vec2 vTexCoord;
void main(){
    vColor = color;
    vTexCoord = texCoord;
    vec4 dummy = type + random;
    float t = smoothstep(5.0, 10.0, time);
    float u = max(time - 10.0, 0.0);
    float v = sin(max(time * 0.1 - 3.0, 0.0));
    float w = smoothstep(20.0, 30.0, time);
    vec4 b = texture2D(noiseTexture, texCoord);
    vec4 c = texture2D(noiseTexture, vec2(mod(time * 0.1, 1.0), mod(time * 0.05, 1.0)));
    vec4 d = texture2D(noiseTexture, vec2(mod(u * 0.1 * c.b, 1.0), 0.0));
    vec2 o = (b.rg - 0.5) * c.r * 2.0 * (length(position.xy) + 0.5);
    vec3 p = vec3(o * t * d.r + w, 1.0);
    // gl_Position = mvpMatrix * vec4(position * p + vec3(0.0, 0.0, v * v * v * 3.5), 1.0);
    gl_Position = mvpMatrix * vec4(position, 1.0);
    gl_PointSize = 10.0;
}
