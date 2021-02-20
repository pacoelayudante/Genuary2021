precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D img, noise;
uniform vec3 escNoise;
uniform vec2 noiseOffset;

void main() {

    // render to screen
  float ruido = texture2D(noise, vTexCoord*escNoise.xy+noiseOffset).r-0.5;
  vec3 col = texture2D(img, vTexCoord+vec2(ruido*escNoise.z,0.0)).rgb;
  
   //gl_FragColor = vec4(ruido+0.5,ruido+0.5,ruido+0.5,1);
   gl_FragColor = vec4(col,1);
}
