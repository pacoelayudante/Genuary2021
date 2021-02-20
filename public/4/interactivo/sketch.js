p5.disableFriendlyErrors = true; // disables FES

let touchCooldownMark = 0;
let touchCooldown = 500;
const ventanaDeTiempo = 1000.0 / 60;
const tamCajaGradiente = 240;
let hTamGradienteColor = 128;
const rangoVelGradiente = 0.3,
  rangoAcelGradiente = 1;

let tamPetalo = 128 * 2;
const rangoPetaloBezier = 0.465;
const factorTamPetalo = 0.3;

let factorResolucionFlor = 1;
let tamFlor = tamPetalo * 4 * factorResolucionFlor;

let texturaRuido;
let shaderGradiente, shaderPetalo;
let simetriasPetaloGeneral = [1, 1, 1, 1, 3, 4, 5, 6, 7];

let texturaPetalo; //canvas
let gradientePetalo; //canvas
let texturaFlor; //canvas

let flores = [];

let agentes = [];
let fondoAgentes, formaFlores;
let procesosFlores = [];

function preload() {
  shaderGradiente = loadShader('./shader.vert', './shader.frag');
  shaderPetalo = loadShader('./shader.vert', './petalo.frag');
  texturaRuido = loadImage('./noiseTexture.png');
}

function arcoFlorTiempo(x) {
  return lerp(0.05, 4, x * pow(x, 2.5 * x));
}

function curvaLinda(x) {
  let s = x * pow(x, 3) * (x > 0 ? 1.0 : -1.0)
  return s;
}

function genBezierPetalo(evitarFinos) {
  let base = [
    random(-1, 1), random(-1, 1),
    random(-1, 1), random(-1, 1),
  ];
  if (!evitarFinos) return base;
  //con acomodador magico
  let umbral = 0.3
  let izq = max(0, 1 - umbral + base[0]);
  let der = max(0, 1 - umbral - base[0]);
  let val = random(-izq, der);
  if (val < 0) val -= umbral;
  else val += umbral;
  val += base[0]
  if (val > 1 || val < -1) console.log(`${base[0]},${val} _ ${izq}<>${der}`);
  base[1] = val;

  izq = max(0, 1 - umbral + base[2]);
  der = max(0, 1 - umbral - base[2]);
  val = random(-izq, der);
  if (val < 0) val -= umbral;
  else val += umbral;
  val += base[2]
  if (val > 1 || val < -1) console.log(`${base[2]},${val} _ ${izq}<>${der}`);
  base[3] = val;
  return base;
}

function parametrosDeFlor() {
  let gradiente = {
    ruidoEscDistort: [random(1), random(0.6, 1.6), random(0.25, 2)],
    ruidoOff: [random(1), random(1)],
    posIni: [random(0, 1.0), 1.0 - curvaLinda(random(0, 1.0)), random(0.8, 1.0)],
    velIni: [0, 0, 0].map(vv => lerp(0, rangoVelGradiente, curvaLinda(random(-1, 1)))),
    acelCte: [0, 0, 0].map(aa => lerp(0, rangoAcelGradiente, curvaLinda(random(-1, 1)))),
  };

  gradiente.velIni[2] *= 0.75;
  gradiente.acelCte[2] *= 0.75;

  let petalo = {
    bezier: genBezierPetalo(true).map(p => p * tamPetalo * rangoPetaloBezier),
    bezier2: genBezierPetalo(true).map(p => p * tamPetalo * rangoPetaloBezier),
    simetria: random(1.0) < 0.5,
  }

  let arco = {
    amplitud: arcoFlorTiempo(random(0, 1)),
    delta: lerp(PI / 16.0, QUARTER_PI, random(1.0)),
    espejado: random(1) < 0.5,
    escalamiento: random(0.95, 1 / 0.95),
    desplazamiento: random(-1.5, 1.5),
    simetrias: simetriasPetaloGeneral[floor(random(simetriasPetaloGeneral.length))]
  };
  arco.desplazamiento *= arco.simetrias;

  return {
    gradiente: gradiente,
    petalo: petalo,
    arco: arco,
  }
}

function lerpearFlores(florA, florB, t) {
  let gradA = florA.gradiente;
  let gradB = florB.gradiente;
  let gradiente = {
    ruidoEscDistort: gradA.ruidoEscDistort.map((v, ind) => lerp(v, gradB.ruidoEscDistort[ind], t)),
    ruidoOff: gradA.ruidoOff.map((v, ind) => lerp(v, gradB.ruidoOff[ind], t)),
    posIni: gradA.posIni.map((v, ind) => lerp(v, gradB.posIni[ind], t)),
    velIni: gradA.velIni.map((v, ind) => lerp(v, gradB.velIni[ind], t)),
    acelCte: gradA.acelCte.map((v, ind) => lerp(v, gradB.acelCte[ind], t)),
  };

  let petaloA = florA.petalo;
  let petaloB = florB.petalo;
  let petalo = {
    bezier: petaloA.bezier.map((v, ind) => lerp(v, petaloB.bezier[ind], t)),
    bezier2: petaloA.bezier2.map((v, ind) => lerp(v, petaloB.bezier2[ind], t)),
    simetria: (random(1) > t ? petaloA.simetria : petaloB.simetria),
  };

  let arcoA = florA.arco;
  let arcoB = florB.arco;
  let arco = {
    amplitud: lerp(arcoA.amplitud, arcoB.amplitud, t),
    delta: lerp(arcoA.delta, arcoB.delta, t),
    espejado: random(1) > t ? arcoA.espejado : arcoB.espejado,
    escalamiento: lerp(arcoA.escalamiento, arcoB.escalamiento, t),
    desplazamiento: lerp(arcoA.desplazamiento, arcoB.desplazamiento, t),
    simetrias: random(1) > t ? arcoA.simetrias : arcoB.simetrias
  };

  return {
    gradiente: gradiente,
    petalo: petalo,
    arco: arco,
  }
}

function* procesarGradiente(gradiente) {
  let marcaTemporal = millis() + ventanaDeTiempo;
  if (!gradiente.textura) {
    gradiente.textura = gradientePetalo = (gradientePetalo || createGraphics(hTamGradienteColor, 2, WEBGL));
    //gradiente.textura.textureWrap(MIRROR);
    gradiente.textura.colorMode(HSB, 1.0);
    gradiente.textura.background(0);
    //gradiente.textura.noFill();
    gradiente.textura.noStroke();
  }
  let pos = gradiente.posIni.slice();
  let vel = gradiente.velIni.slice();
  gradiente.recorrido = [pos.slice()];
  for (let i = 0; i <= hTamGradienteColor; i++) {
    if (millis() > marcaTemporal) {
      yield millis();
      marcaTemporal = millis() + ventanaDeTiempo;
    }

    pos.forEach((p, ind) => {
      pos[ind] = (((p + vel[ind] / tamCajaGradiente) % 1.0 + 1.0) % 1.0);
    });
    pos[2] = max(pos[2], pos[1] * 0.5) //limitador para evitar muchos negros y oscuros

    vel.forEach((v, ind) => {
      vel[ind] = v + gradiente.acelCte[ind] / tamCajaGradiente;
    });

    if (!gradiente.recorrido[i]) gradiente.recorrido.push(pos.slice());
    else gradiente.recorrido[i] = pos.slice();

    //gradiente.textura.stroke(...pos);
    //gradiente.textura.line(i-128, -1, i-128, hTamGradienteColor+1);
    gradiente.textura.fill(...pos);
    gradiente.textura.rect(i - hTamGradienteColor / 2, -hTamGradienteColor / 2, 1, hTamGradienteColor);
  }

  /*gradiente.textura.shader(shaderGradiente);
  shaderGradiente.setUniform('img', gradiente.textura);
  shaderGradiente.setUniform('noise', texturaRuido);
  shaderGradiente.setUniform('noiseOffset', [...gradiente.ruidoOff]);
  shaderGradiente.setUniform('escNoise', [...gradiente.ruidoEscDistort]);
  gradiente.textura.rect(-hTamGradienteColor / 2, -hTamGradienteColor / 2, gradiente.textura.width, hTamGradienteColor);
  gradiente.textura.resetShader();*/
  yield millis();
}

function* procesarPetalo(petalo) {
  let textura = texturaPetalo = (texturaPetalo || createGraphics(tamPetalo, tamPetalo, WEBGL));
  textura.push();
  //textura.drawingContext.clearDepth(0);
  textura.drawingContext.clear(textura.drawingContext.DEPTH_BUFFER_BIT | textura.drawingContext.COLOR_BUFFER_BIT);
  //textura.background(0, 0);
  textura.strokeWeight(1);
  textura.stroke(60, 255);
  textura.fill(0);
  //textura.noStroke();
  textura.rotate(-QUARTER_PI);
  textura.bezier(-tamPetalo * factorTamPetalo, -tamPetalo * factorTamPetalo, ...petalo.bezier, tamPetalo * factorTamPetalo, tamPetalo * factorTamPetalo);
  if (petalo.simetria) {
    textura.scale(-1, 1);
    textura.rotate(HALF_PI);
    textura.bezier(-tamPetalo * factorTamPetalo, -tamPetalo * factorTamPetalo, ...petalo.bezier, tamPetalo * factorTamPetalo, tamPetalo * factorTamPetalo);
  } else {
    textura.bezier(-tamPetalo * factorTamPetalo, -tamPetalo * factorTamPetalo, ...petalo.bezier2, tamPetalo * factorTamPetalo, tamPetalo * factorTamPetalo);
    //textura.line(-tamPetalo * factorTamPetalo, -tamPetalo * factorTamPetalo, tamPetalo * factorTamPetalo, tamPetalo * factorTamPetalo);
  }
  textura.pop();
  petalo.textura = textura;
  yield millis();
}

function* procesarFlor(flor, textura) {
  yield* procesarGradiente(flor.gradiente);
  yield* procesarPetalo(flor.petalo);
  let marcaTemporal = millis() + ventanaDeTiempo;

  let glFlores = formaFlores.drawingContext;
  glFlores.enable(glFlores.BLEND);
  glFlores.blendFunc(glFlores.ONE, glFlores.ONE_MINUS_SRC_ALPHA);
  textura.push();
  textura.translate(flor.pos[0], flor.pos[1]);
  textura.scale(3 * flor.tam / tamFlor);

  //let textura = texturaFlor = (texturaFlor || createGraphics(tamFlor, tamFlor, WEBGL));
  flor.textura = textura;
  textura.textureWrap(REPEAT)
  //textura.drawingContext.clear(textura.drawingContext.DEPTH_BUFFER_BIT | textura.drawingContext.COLOR_BUFFER_BIT);

  textura.shader(shaderPetalo);
  shaderPetalo.setUniform('colorTxt', flor.gradiente.textura);
  shaderPetalo.setUniform('formaTxt', flor.petalo.textura);

  //shaderGradiente.setUniform('img', flor.gradiente.textura);
  shaderPetalo.setUniform('noise', texturaRuido);
  shaderPetalo.setUniform('noiseOffset', [...flor.gradiente.ruidoOff]);
  shaderPetalo.setUniform('escNoise', [...flor.gradiente.ruidoEscDistort]);

  textura.push();
  textura.scale(factorResolucionFlor);
  textura.noStroke();
  textura.fill(255, 0);
  textura.rotate(-QUARTER_PI);

  let arcoDividido = flor.arco.amplitud * TWO_PI / flor.arco.simetrias;
  let saltoEntreArcos = TWO_PI / flor.arco.simetrias;

  let espejo = flor.arco.espejado ? 2 : 1;
  if (flor.arco.espejado) arcoDividido /= 2;

  let expansionDeEscalamiento = 1;
  if (flor.arco.escalamiento > 1) {
    for (let e = 0; e <= ceil(arcoDividido / flor.arco.delta); e++) {
      expansionDeEscalamiento /= flor.arco.escalamiento;
    }
  }

  textura.scale(expansionDeEscalamiento);
  textura.rotate(flor.rot);
  for (let v = 0; v < flor.arco.simetrias; v++) {
    if (millis() > marcaTemporal) {
      yield millis();
      marcaTemporal = millis() + ventanaDeTiempo;
    }

    //textura.strokeWeight(1);
    textura.push();
    textura.rotate(v * saltoEntreArcos);
    textura.line(0, 0, tamPetalo, 0);
    //if (espejo > 1) textura.circle(tamPetalo, 0, 5);

    //textura.strokeWeight(2);
    //textura.arc(0, 0, tamPetalo * 0.4, tamPetalo * 0.4, 0, arcoDividido);
    for (let i = 0; i <= arcoDividido / flor.arco.delta; i++) {
      if (millis() > marcaTemporal) {
        yield millis();
        marcaTemporal = millis() + ventanaDeTiempo;
      }

      textura.push();

      for (let s = 0; s < espejo; s++) {
        if (millis() > marcaTemporal) {
          yield millis();
          marcaTemporal = millis() + ventanaDeTiempo;
        }

        textura.push();
        if (espejo > 1) textura.rotate(flor.arco.delta / 4);
        textura.rotate(i * flor.arco.delta);
        //textura.noStroke();
        textura.fill(255, 0);
        shaderPetalo.setUniform('offUV', [random(0.1), random(1), .9, .9]);
        textura.rect(-tamPetalo * factorTamPetalo / 8, -tamPetalo / 2, tamPetalo, tamPetalo);
        //textura.stroke(0);
        textura.line(0, 0, tamPetalo * 0.5, 0);
        textura.pop();
        textura.scale(1, -1);
      }

      textura.pop();
      textura.translate(flor.arco.desplazamiento, 0);
      textura.scale(flor.arco.escalamiento);
    }

    textura.pop();
  }
  textura.pop();

  textura.pop();
  //flor.textura = textura.get();
}

function* dibujarFlorEnCentro(flor, textura) {
  yield true;
  yield* procesarGradiente(flor.gradiente);
  yield* procesarPetalo(flor.petalo);
  let marcaTemporal = millis() + ventanaDeTiempo;

  textura.shader(shaderPetalo);
  shaderPetalo.setUniform('colorTxt', flor.gradiente.textura);
  shaderPetalo.setUniform('formaTxt', flor.petalo.textura);

  //shaderGradiente.setUniform('img', flor.gradiente.textura);
  shaderPetalo.setUniform('noise', texturaRuido);
  shaderPetalo.setUniform('noiseOffset', [...flor.gradiente.ruidoOff]);
  shaderPetalo.setUniform('escNoise', [...flor.gradiente.ruidoEscDistort]);

  textura.push();
  textura.translate(width / 2, height / 2);
  textura.scale(factorResolucionFlor);
  textura.noStroke();
  textura.fill(255, 0);
  textura.rotate(-QUARTER_PI);

  let arcoDividido = flor.arco.amplitud * TWO_PI / flor.arco.simetrias;
  let saltoEntreArcos = TWO_PI / flor.arco.simetrias;

  let espejo = flor.arco.espejado ? 2 : 1;
  if (flor.arco.espejado) arcoDividido /= 2;

  let expansionDeEscalamiento = 1;
  if (flor.arco.escalamiento > 1) {
    for (let e = 0; e <= ceil(arcoDividido / flor.arco.delta); e++) {
      expansionDeEscalamiento /= flor.arco.escalamiento;
    }
  }

  textura.scale(expansionDeEscalamiento);
  textura.rotate(flor.rot);
  for (let v = 0; v < flor.arco.simetrias; v++) {
    if (millis() > marcaTemporal) {
      yield millis();
      marcaTemporal = millis() + ventanaDeTiempo;
    }

    //textura.strokeWeight(1);
    textura.push();
    textura.rotate(v * saltoEntreArcos);
    textura.line(0, 0, tamPetalo, 0);
    //if (espejo > 1) textura.circle(tamPetalo, 0, 5);

    //textura.strokeWeight(2);
    //textura.arc(0, 0, tamPetalo * 0.4, tamPetalo * 0.4, 0, arcoDividido);
    for (let i = 0; i <= arcoDividido / flor.arco.delta; i++) {
      if (millis() > marcaTemporal) {
        yield millis();
        marcaTemporal = millis() + ventanaDeTiempo;
      }

      textura.push();

      for (let s = 0; s < espejo; s++) {
        if (millis() > marcaTemporal) {
          yield millis();
          marcaTemporal = millis() + ventanaDeTiempo;
        }

        textura.push();
        if (espejo > 1) textura.rotate(flor.arco.delta / 4);
        textura.rotate(i * flor.arco.delta);
        //textura.noStroke();
        textura.fill(255, 0);
        shaderPetalo.setUniform('offUV', [random(0.1), random(1), .9, .9]);
        textura.rect(-tamPetalo * factorTamPetalo / 8, -tamPetalo / 2, tamPetalo, tamPetalo);
        //textura.stroke(0);
        textura.line(0, 0, tamPetalo * 0.5, 0);
        textura.pop();
        textura.scale(1, -1);
      }

      textura.pop();
      textura.translate(flor.arco.desplazamiento, 0);
      textura.scale(flor.arco.escalamiento);
    }

    textura.pop();
  }
  textura.pop();
}

function generarFlores() {
  let generadas = [];
  let w, h;
  let tam;
  if (width > height) {
    w = 3;
    h = 2;
  } else {
    h = 3;
    w = 2;
  }
  tam = min(height / h, width / w) * 0.6;
  let margenLibre = [(width / w - tam) / 3, (height / h - tam) / 3];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let flor = parametrosDeFlor();
      flor.pos = [(x + 0.5) * width / w, (y + 0.5) * height / h]
        .map((p, ind) => p + random(-margenLibre[ind], margenLibre[ind]));
      flor.tam = tam;
      flor.rot = random(TWO_PI);
      generadas.push(flor);
    }
  }
  return generadas;
}

function moverAgente(agente, vel, rot) {
  [x, y, dir] = agente;
  x += vel * cos(dir);
  y += vel * sin(dir);
  dir += lerp(-rot, rot, noise(x * 0.01 + 100, y * 0.01 + 100));

  let colFondo = color(...flores[0].gradiente.posIni);
  let colLinea = lerpColor(colFondo, color(0), 0.4);
  colFondo = lerpColor(colFondo, color(0), 0.6);

  let hoja = random(1) < 0.002 ? genBezierPetalo(true).map(b => b * 0.6 * 50) : null;

  fondoAgentes.strokeWeight(3.5);
  fondoAgentes.stroke(colFondo);
  fondoAgentes.noFill();
  fondoAgentes.line(x, y, agente[0], agente[1]);
  if (hoja) {
    fondoAgentes.push();
    fondoAgentes.translate(x, y);
    fondoAgentes.rotate(dir + QUARTER_PI);
    fondoAgentes.translate(-20, -20);
    fondoAgentes.bezier(-20, -20, ...hoja, 20, 20);
    fondoAgentes.rotate(HALF_PI);
    fondoAgentes.scale(1, -1);
    fondoAgentes.bezier(-20, -20, ...hoja, 20, 20);
    fondoAgentes.pop();
  }
  fondoAgentes.strokeWeight(0.5);
  fondoAgentes.stroke(colLinea);
  fondoAgentes.fill(colFondo);
  fondoAgentes.line(x, y, agente[0], agente[1]);
  if (hoja) {
    fondoAgentes.drawingContext.clear(fondoAgentes.drawingContext.DEPTH_BUFFER_BIT);
    fondoAgentes.strokeWeight(1);
    fondoAgentes.push();
    fondoAgentes.translate(x, y);
    fondoAgentes.rotate(dir + QUARTER_PI);
    fondoAgentes.translate(-20, -20);
    fondoAgentes.bezier(-20, -20, ...hoja, 20, 20);
    fondoAgentes.rotate(HALF_PI);
    fondoAgentes.scale(1, -1);
    fondoAgentes.bezier(-20, -20, ...hoja, 20, 20);
    fondoAgentes.line(-5, -5, 20, 20);
    fondoAgentes.pop();
  }

  agente[0] = x;
  agente[1] = y;
  agente[2] = dir;
}

let zoom;

function alTocar() {
  if (millis() < touchCooldownMark) return;
  touchCooldownMark = millis() + touchCooldown;
  if (procesosFlores.length == 0) {
    if (zoom) {
      formaFlores.drawingContext.clear(formaFlores.drawingContext.DEPTH_BUFFER_BIT | formaFlores.drawingContext.COLOR_BUFFER_BIT);
      zoom = null;
      procesosFlores = flores.map(f => procesarFlor(f, formaFlores));
    } else {
      let cercanas = flores.filter(f => dist(...f.pos, mouseX, mouseY) < f.tam / 2);
      if (cercanas.length > 0) {
        formaFlores.drawingContext.clear(formaFlores.drawingContext.DEPTH_BUFFER_BIT | formaFlores.drawingContext.COLOR_BUFFER_BIT);
        zoom = cercanas[0];
        procesosFlores.push(dibujarFlorEnCentro(zoom, formaFlores));
      }
    }
  }
  actualizarPanel();
}

function iniciar() {
  zoom = null;
  actualizarPanel();
  flores = generarFlores();
  procesosFlores = flores.map((flor) => procesarFlor(flor, formaFlores));
  procesosFlores[0].next();

  agentes = flores.map(f => [
    [...f.pos, random(TWO_PI)],
    [...f.pos, random(TWO_PI)],
    [...f.pos, random(TWO_PI)]
  ]).flat();

  let colFondo = color(...flores[0].gradiente.posIni);
  colFondo = lerpColor(colFondo, color(0), 0.6);
  fondoAgentes.background(colFondo);
  fondoAgentes.noFill();
  formaFlores.drawingContext.clear(formaFlores.drawingContext.DEPTH_BUFFER_BIT | formaFlores.drawingContext.COLOR_BUFFER_BIT);
}

function mutar() {
  flores = generarFlores().map(f => {
    let fmutada = lerpearFlores(zoom, f, random(0.05, 0.1));
    fmutada.pos = f.pos;
    fmutada.tam = f.tam;
    fmutada.rot = f.rot;
    return fmutada;
  });
  procesosFlores = flores.map((flor) => procesarFlor(flor, formaFlores));
  procesosFlores[0].next();

  zoom = null;
  actualizarPanel();

  agentes = flores.map(f => [
    [...f.pos, random(TWO_PI)],
    [...f.pos, random(TWO_PI)],
    [...f.pos, random(TWO_PI)]
  ]).flat();

  let colFondo = color(...flores[0].gradiente.posIni);
  colFondo = lerpColor(colFondo, color(0), 0.6);
  fondoAgentes.background(colFondo);
  fondoAgentes.noFill();
  formaFlores.drawingContext.clear(formaFlores.drawingContext.DEPTH_BUFFER_BIT | formaFlores.drawingContext.COLOR_BUFFER_BIT);
}

function actualizarPanel() {
  if (zoom) {
    let divSinZoom = select("#sin-zoom").class("oculto");
    let divConZoom = select("#con-zoom").removeClass("oculto");
  } else {
    let divSinZoom = select("#sin-zoom").removeClass("oculto");
    let divConZoom = select("#con-zoom").class("oculto");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  imageMode(CENTER);
  formaFlores = createGraphics(width, height, WEBGL);
  formaFlores.translate(-formaFlores.width / 2, -formaFlores.height / 2);
  fondoAgentes = createGraphics(width / 2, height / 2, WEBGL);
  fondoAgentes.translate(-fondoAgentes.width / 2, -fondoAgentes.height / 2);
  fondoAgentes.scale(0.5);
  colorMode(HSB, 1.0);

  canvas.onpointerup = (alTocar);

  let botGenerar = select("#generar");
  botGenerar.mousePressed(() => iniciar());
  let botMutar = select("#mutar");
  botMutar.mousePressed(() => mutar());
  let descargar = select("#descargar-con");
  descargar.mousePressed(()=>saveCanvas("flores-fondo","png"));
  descargar = select("#descargar-sin");
  descargar.mousePressed(()=>saveCanvas(formaFlores,"flores-transparente","png"));
  
  iniciar();
}

function draw() {
  image(fondoAgentes, 0, 0, width, height);
  //translate(-width / 2, -height / 2);
  agentes.forEach(a => moverAgente(a, 3, QUARTER_PI * 0.25));

  if (procesosFlores.length > 0) {
    if (procesosFlores[0].next().done) {
      procesosFlores.shift();
    }
  }
  /*
    flores.forEach(flor => {
      if (!flor.textura) return;
      //circle(flor.pos[0],flor.pos[1],flor.tam)
      push();
      translate(...flor.pos);
      rotate(flor.rot);
      image(flor.textura, 0, 0, flor.tam * 3, flor.tam * 3);
      pop();
    })*/
  image(formaFlores, 0, 0, width, height);
}