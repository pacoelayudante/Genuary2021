precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D formaTxt, colorTxt;
uniform vec4 offUV;

uniform sampler2D noise;
uniform vec3 escNoise;
uniform vec2 noiseOffset;

void main() {
  
  float ruido = texture2D(noise, vTexCoord*escNoise.xy+noiseOffset).r-0.5;
  vec3 col = texture2D(colorTxt, (vTexCoord+vec2(ruido*escNoise.z,0.0))*offUV.zw+offUV.xy).rgb;
    // render to screen
  vec3 color = col;//texture2D(colorTxt, vTexCoord*offUV.zw+offUV.xy).rgb;
  vec4 forma = texture2D(formaTxt, vTexCoord);
  
  color += forma.r;
  color.rgb *= forma.a;
  
   gl_FragColor = vec4(color,forma.a);
  //gl_FragColor = vec4(color,1);
}
