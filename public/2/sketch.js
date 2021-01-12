let autoCambiar = true;

let botCambiar, botAutoCambiar
let sliderDistField, botResetDistField;

let factorTamDist = 2.6
let brilloDist = 255
let generando = true;

let alturaGrilla = 40;
let tamCelda = () => height / alturaGrilla; //esto es hacerse el cheto innecesariemente (ver en el setup que termino haciendo)

let dibujarFondo;
let cielos = ["azul_1", "celeste_1", "celeste_naranja", "dorado_1",
  "gris_naranja", "naranja_1", "naranja_2",
  "purpura_naranja", "rosa_1"
];
let urnaPaletas = [];
let colorFondo, colorTrue, colorFalse;
let pickColorTrue, pickColorFalse;

let reglaDeCompresion = [0, 0, 0, 0, 1, 1, 1, 1, 0]
  .map(coso => coso > 0) //mas facil de escrbir como 0-1, pero quiero bools
  .reverse(); //ese reverse es para escribir el array como hacen normalmene con eso de las reglas... pero en el codigo me es mas facil si esa al revez

let grilla = [
  []
];
let generacionActual = 0;

//posicion seria 'x' y generacion seria 'y'
let posIniciales = [{
  pos: alturaGrilla - 1,
  gen: 0,
  val: true
}]; //esto es un estado inicial en que hay un solo punto en el centro y nada maslu

let graficoDeDistancia;
let mapaDeAlturas;
let generacionActualMapaDeAlturas = 0;

let shaderLineas;

function preload() {
  let panel = select('#panel');
  panel.child(botCambiar = createButton("Generar Nuevo"));
  panel.child(botAutoCambiar = createButton("Generar Automáticamente"));
  
  botCambiar.mousePressed(() => cambiar());
  botAutoCambiar.mousePressed(() => {
    autoCambiar = !autoCambiar;
    if (autoCambiar && !generando) cambiar();
    if (autoCambiar) botAutoCambiar.class('marcado');
    else botAutoCambiar.removeClass('marcado');
  });
  if (autoCambiar) botAutoCambiar.class('marcado');
  
  panel.child(createP());

  panel.child(botResetDistField = createButton("Reiniciar"));
  panel.child(sliderDistField = createSlider(1.0, 3.4, factorTamDist, 0.0))
  sliderDistField.elt.onchange = (ev) => {
    botResetDistField.removeAttribute("disabled");
    factorTamDist = ev.target.value;
    generarGraficoDeDistancia();
    cambiar(false);
  }
  botResetDistField.mousePressed(()=>{
    botResetDistField.attribute("disabled", "1");
    sliderDistField.value(factorTamDist = 2.6);
    generarGraficoDeDistancia();
    cambiar(false);
  });

  botCambiar.attribute("disabled", "1");
  botAutoCambiar.attribute("disabled", "1");
  botResetDistField.attribute("disabled", "1");
  sliderDistField.attribute("disabled", "1");

  shaderLineas = loadShader('shader.vert', 'shader.frag');
  cielos = cielos.map(x => "./cielos/" + x + ".png")
    .map(x => loadImage(x));
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  botAutoCambiar.removeAttribute("disabled");
  sliderDistField.removeAttribute("disabled");

  mapaDeAlturas = createGraphics(width, height);
  shaderLineas.setUniform('textura', mapaDeAlturas);

  tamCelda = tamCelda(); //porque? porque es javascript y puedo
  anchoGrilla = ceil(width / tamCelda) + alturaGrilla;
  if (anchoGrilla % 2 == 0) anchoGrilla++; //tiene que ser impar
  posIniciales[0].pos = floor(anchoGrilla / 2);

  generarGraficoDeDistancia();

  cambiar(false);
}

function elegirColores() {
  /*if (urnaPaletas.length === 0) {
    urnaPaletas = [...paletas].sort(()=>random(-1,1));
  }  
  let paleta = [...urnaPaletas.pop()].sort(()=>random(-1,1));
  colorFondo = paleta.pop();
  colorTrue = paleta.pop();
  colorFalse = paleta.pop();*/
  if (urnaPaletas.length < 3) {
    urnaPaletas = [...cielos].sort(() => random(-1, 1));
  }
  colorFondo = urnaPaletas.pop();
  colorTrue = urnaPaletas.pop();
  colorFalse = urnaPaletas.pop();

  pickColorTrue = colorTrue.get(colorTrue.width / 2, colorTrue.height / 2)
  pickColorFalse = colorFalse.get(colorFalse.width / 2, colorFalse.height / 2)

  select('#menu').elt.style.backgroundColor = lerpColor(color(0, 180), color(colorFondo.get(colorFondo.width / 2, colorFondo.height / 2)), 0.3).toString('#rrggbbaa');
}

function colorAUniform(col) {
  return [red(col) / 255, green(col) / 255, blue(col) / 255, 1.0];
}

function generarGraficoDeDistancia() {
  let tamLadoGrafico = ceil(tamCelda * factorTamDist);
  if (tamLadoGrafico % 2 == 1) tamLadoGrafico++;
  let maxDist = tamLadoGrafico / 2 //dist(0,0,tamLadoGrafico/2,tamLadoGrafico/2)

  graficoDeDistancia = createGraphics(tamLadoGrafico, tamLadoGrafico);
  graficoDeDistancia.noStroke();
  for (let x = 0; x < tamLadoGrafico / 2; x++) {
    for (let y = 0; y < tamLadoGrafico / 2; y++) {
      graficoDeDistancia.fill(255 - 255 * dist(0, 0, x, y) / maxDist);
      graficoDeDistancia.rect(tamLadoGrafico / 2 + x, tamLadoGrafico / 2 + y, 1, 1);
      graficoDeDistancia.rect(tamLadoGrafico / 2 + x, tamLadoGrafico / 2 - y, 1, 1);
      graficoDeDistancia.rect(tamLadoGrafico / 2 - x, tamLadoGrafico / 2 - y, 1, 1);
      graficoDeDistancia.rect(tamLadoGrafico / 2 - x, tamLadoGrafico / 2 + y, 1, 1);
    }
  }
}

function cambiar(cambiarInicio = true) {
  botCambiar.attribute("disabled", "1");
  generando = true;
  if (cambiarInicio) cambiarModoPosInicial();
  iniciarGrilla();
}

function cambiarModoPosInicial(modo) {
  if (modo === undefined) modo = floor(random(4));
  if (modo === 0) {
    posIniciales = [{
      pos: floor(anchoGrilla / 2),
      gen: 0,
      val: true
    }];
  } else if (modo === 1) {
    posIniciales = [{
      pos: floor(anchoGrilla / 2),
      gen: 0,
      val: true
    }];
    let offset = floor(random(3, 20));
    posIniciales.push({
      pos: posIniciales[0].pos + offset,
      gen: floor(random(1, offset - 2)),
      val: true
    });
    offset = floor(random(3, 20));
    posIniciales.push({
      pos: posIniciales[0].pos - offset,
      gen: floor(random(1, offset - 2)),
      val: true
    });
  } else if (modo === 2) {
    posIniciales = grilla[0].fill(0).map((v, index) => ({
      pos: index,
      gen: 0,
      val: (index % 8) < 4
    }));
  } else if (modo === 3) {
    posIniciales = grilla[0].fill(0).map((v, index) => ({
      pos: index,
      gen: 0,
      val: random(1) < 0.5
    }));
  }
}

function iniciarGrilla() {
  elegirColores();

  dibujarFondo = true;
  //background(0);  

  //image(colorFondo,-0.0*width,-0.0*height,width,height)

  //anchoGrilla = alturaGrilla*2-1;
  //ahora el ancho grilla en stup
  grilla = [new Array(anchoGrilla)];

  generacionActual = 0;
  activarPosIniciales(generacionActual);

  generacionActualMapaDeAlturas = 0;
  mapaDeAlturas.blendMode(BLEND);
  mapaDeAlturas.background(0);
  mapaDeAlturas.blendMode(ADD);

  loop();
}

function activarPosIniciales(queGen) {
  for (let posFijada of posIniciales.filter(p => p.gen === queGen)) {
    grilla[queGen][posFijada.pos] = posFijada.val;
  }
}

function pintarGeneracion(queGen) {
  noStroke();
  let desde = floor(anchoGrilla / 2 - 0.5 * width / tamCelda);
  let hasta = ceil(anchoGrilla / 2 + 0.5 * width / tamCelda);

  translate(-desde * tamCelda, tamCelda * queGen);
  for (let i = desde; i < hasta; i++) {
    //triple igual porque quiero ignorar undefined y null
    if (grilla[queGen][i] === false) {
      fill(pickColorFalse);
      //rect(i*tamCelda,0,tamCelda,tamCelda)
      circle((i + 0.5) * tamCelda, 0.5 * tamCelda, tamCelda)
    } else if (grilla[queGen][i]) { //y aca solo es true si es true posta
      fill(pickColorTrue);
      //rect(i*tamCelda,0,tamCelda,tamCelda)   
      circle((i + 0.5) * tamCelda, 0.5 * tamCelda, tamCelda)
    }
  }
}

function prepararSiguienteGeneracion(queGen) {
  if (grilla.length < queGen + 1) grilla.push(new Array(anchoGrilla));
  else if (!grilla[queGen + 1]) grilla[queGen + 1] = new Array(anchoGrilla);

  let genActual = grilla[queGen];
  let genNueva = grilla[queGen + 1];

  let valorDeCompresion = 0;
  for (let i = 0; i < anchoGrilla; i++) {
    //primero... quiero ignorar los que no tienen "generacion previa"
    if (genActual[i] === undefined &&
      genActual[i - 1] === undefined && genActual[i + 1] === undefined) {
      genNueva[i] = undefined;
      valorDeCompresion = 0;
      continue;
    }

    // voy a usar un truco que saque una vez de una tecnica que se llamaba fastblur
    //en vez de evaluar todes los vecinos de una, modifico el valor en base a los vecinos que cambiaron, los que salen restan los que entran suman... y los que cambian de posicion... tambien suman?
    if (i + 2 >= 0 && genActual[i - 2]) valorDeCompresion -= 4;
    if (i + 1 >= 0 && genActual[i - 1]) valorDeCompresion += 2;
    if (genActual[i]) valorDeCompresion += 1;
    if (i + 1 < anchoGrilla && genActual[i + 1]) valorDeCompresion += 1;

    if (i === 0 && genActual[i]) valorDeCompresion += 1; //en la primer posicion, se debe acomodar este valor 'a mano'

    genNueva[i] = reglaDeCompresion[valorDeCompresion];
  }
}

function draw() {
  push();
  if (dibujarFondo) {
    dibujarFondo = false;
    imageMode(CENTER);
    push();
    scale(1 / 0.2);
    image(colorFondo, 0, 0, width, height)
    pop();
  }
  translate(-width / 2, -height / 2);
  if (generacionActual < alturaGrilla) {
    prepararSiguienteGeneracion(generacionActual);
    pintarGeneracion(generacionActual);
    generacionActual++;
    activarPosIniciales(generacionActual);
  } else if (generacionActualMapaDeAlturas < alturaGrilla) {
    pintarMapaEnGeneracion(generacionActualMapaDeAlturas);
    generacionActualMapaDeAlturas++;
    //image(mapaDeAlturas,0,0);
    shader(shaderLineas);
    shaderLineas.setUniform('textura', mapaDeAlturas);
    /*
    shaderLineas.setUniform('colFondo',colorAUniform(colorFondo));
    shaderLineas.setUniform('colTrue',colorAUniform(colorTrue));
    shaderLineas.setUniform('colFalse',colorAUniform(colorFalse));*/
    shaderLineas.setUniform('textFondo', colorFondo);
    shaderLineas.setUniform('textTrue', colorTrue);
    shaderLineas.setUniform('textFalse', colorFalse);
    //image(mapaDeAlturas,0,0);
    rect(0, 0, width, height);
    resetShader();
  } else {
    shader(shaderLineas);
    shaderLineas.setUniform('textura', mapaDeAlturas);
    /*shaderLineas.setUniform('colFondo',colorAUniform(colorFondo));
    shaderLineas.setUniform('colTrue',colorAUniform(colorTrue));
    shaderLineas.setUniform('colFalse',colorAUniform(colorFalse));*/
    shaderLineas.setUniform('textFondo', colorFondo);
    shaderLineas.setUniform('textTrue', colorTrue);
    shaderLineas.setUniform('textFalse', colorFalse);
    //image(mapaDeAlturas,0,0);
    rect(0, 0, width, height);
    resetShader();
    generando = false;
    botCambiar.removeAttribute("disabled");
    setTimeout(() => {
      if (autoCambiar && !generando) cambiar()
    }, 6000);
    noLoop();
  }
  pop();
}

function pintarMapaEnGeneracion(queGen) {
  mapaDeAlturas.push();
  let desde = floor(anchoGrilla / 2 - 0.5 * width / tamCelda);
  let hasta = ceil(anchoGrilla / 2 + 0.5 * width / tamCelda);

  mapaDeAlturas.translate(-desde * tamCelda, tamCelda * queGen);
  mapaDeAlturas.translate(tamCelda / 2, tamCelda / 2);
  mapaDeAlturas.translate(-graficoDeDistancia.width / 2, -graficoDeDistancia.height / 2);
  for (let i = desde; i < hasta; i++) {
    //triple igual porque quiero ignorar undefined y null
    if (grilla[queGen][i] === false) {
      mapaDeAlturas.tint(brilloDist, 0, 0);
      mapaDeAlturas.image(graficoDeDistancia, i * tamCelda, 0)
    } else if (grilla[queGen][i]) { //y aca solo es true si es true posta
      mapaDeAlturas.tint(0, brilloDist, 0);
      mapaDeAlturas.image(graficoDeDistancia, i * tamCelda, 0)
    }
  }
  mapaDeAlturas.pop();
}