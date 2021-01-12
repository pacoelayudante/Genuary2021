precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D textura, textFondo, textTrue, textFalse;
//uniform vec4 colFondo,colTrue,colFalse;

void main() {

    // render to screen
  vec3 col = texture2D(textura, vTexCoord).rgb;
  float valorTrue = smoothstep( 0.21 , 0.215, mod(col.g,0.3));
  float valorFalse =  smoothstep(  0.10 , 0.105, mod(col.r,0.2));
  
  vec4 colFondo = texture2D(textFondo,vTexCoord*0.2+vec2(0.4,0.4));
  vec4 colTrue = texture2D(textTrue,vTexCoord);
  vec4 colFalse = texture2D(textFalse,vTexCoord);
  
  vec4 mezclaColor = mix(colFondo,colFalse,valorFalse);
  mezclaColor = mix(mezclaColor,colTrue,valorTrue);
  
   gl_FragColor = mezclaColor;
}
