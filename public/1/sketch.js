let cambiaSiempre = true;
let verPaleta = !true;
let animar = true, darFrame;

const primos = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]
let circulos = new Array(30).fill(1);
let factorMaxRadio = 0.1;
let planetas = [];

let cargandoNuevo = false;
let mostrarPlaneta = 17;
let chquearFrameRateTrasCargar = -1;

let botCambiar, botAutoCambiar, botVerPlaneta, botVerTodo, botVerPaleta, botAnimar;

let cantOrbitas = 29,
  cantRadios = 72;

let paleta, colorMasOscuro, colorMasClaro, orbitaMayor, orbitaMayorAceptable, distOrbitas;

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameCount = 10000;
  strokeCap(SQUARE)
  
  let panel = select('#panel');
    
  panel.child(botAnimar = createButton("Animar"));
  panel.child(createP());
  panel.child(botCambiar = createButton("Generar Nuevo"));
  panel.child(botAutoCambiar = createButton("Generar Automáticamente"));
  panel.child(createP());
  panel.child(botVerPlaneta = createButton("Seguir un planeta"));
  panel.child(botVerTodo = createButton("Ver Todo"));
  panel.child(createP());
  panel.child(botVerPaleta = createButton("Ver Paleta"));
  
  botCambiar.mousePressed(()=>generar());
  botAutoCambiar.mousePressed(()=>{
    cambiaSiempre = !cambiaSiempre;
    if (cambiaSiempre && !cargandoNuevo) generar();
    if (cambiaSiempre) botAutoCambiar.class('marcado');
    else botAutoCambiar.removeClass('marcado');
  });
  botVerPlaneta.mousePressed(()=>{mostrarPlaneta++;darFrame=true})
  botVerTodo.mousePressed(()=>{mostrarPlaneta=-1;darFrame=true})
  botVerPaleta.mousePressed(()=>{
    verPaleta=!verPaleta;
    darFrame=true;
    if (verPaleta) botVerPaleta.class('marcado');
    else botVerPaleta.removeClass('marcado');
  })
  botAnimar.mousePressed(cambiarSiAnimar)

  if (animar) botAnimar.class('marcado');
    if (verPaleta) botVerPaleta.class('marcado');
    if (cambiaSiempre) botAutoCambiar.class('marcado');
  
  colorMasOscuro = color(0, 0, 0)
  colorMasClaro = color(255, 255, 255)
  paleta = [colorMasOscuro, colorMasClaro];
  generar()
}

function cambiarSiAnimar() {
  animar = !animar;
  if (animar) botAnimar.class('marcado');
  else botAnimar.removeClass('marcado');
}

function generar() {
  if (cargandoNuevo) return;
  cargandoNuevo = true;
  botCambiar.attribute("disabled","1");
  cargarPaleta(() => {
    botCambiar.removeAttribute("disabled");
    cargandoNuevo = false;
    genPlanetas()
    darFrame = true;
    if (chquearFrameRateTrasCargar<0) chquearFrameRateTrasCargar = frameCount+40;
    setTimeout(()=>{
      if (cambiaSiempre) generar()
    }, 6000);
  });
}

function genPlanetas() {
  cantOrbitas = primos[floor(random(0.25,1.0)*primos.length)];
  cantRadios = primos[floor(random(0.5,1.0)*primos.length)];
  
  planetas = [];
  orbitaMayor = dist(0, 0, width, height) //la diagonal de la ventana, esta orbita no se ve pero esta justo tocando la ventana
  distOrbitas = 0.5 * orbitaMayor / cantOrbitas;
  orbitaMayorAceptable = floor(0.5 * cantOrbitas * min(height, width) / orbitaMayor);

  let orbitaMenor = lerp(orbitaMayor, 0, (cantOrbitas - 1) / cantOrbitas);
  let espacioTotal = (width - distOrbitas - orbitaMenor) / 2.0;
  let ultimoBorde = width / 2;

  while (espacioTotal > orbitaMenor) {
    let diamCirculo = random(distOrbitas, min(espacioTotal * 1.2, orbitaMayor * 0.1));
    let estaOrbita = ultimoBorde - diamCirculo / 2;
    ultimoBorde -= diamCirculo + distOrbitas * 2;
    let estaOrbitaIndex = floor(cantOrbitas * estaOrbita / orbitaMayor);
    planetas.push({
      diam: diamCirculo,
      orbita: estaOrbitaIndex,
      colIndex: random(0.1, 0.8),
      vel: random(-0.001, 0.001),
    });
    espacioTotal -= diamCirculo + distOrbitas * 2;
  }
}

function cargarPaleta(alCargar) {
  loadImage("https://source.unsplash.com/random/50x50",
    imagenCargada => { //funcion tras cargar la imagen pedida
      imagenCargada.loadPixels(); // un array con cada componente separado,
      //es decir [r1,g1,b1,a1, r2,g2,b2,a2, r3,g3... etc]
      const pixeles = imagenCargada.pixels;
      paleta = pixeles.reduce(reducerArrayPixelesEnArrayColores, []); //mas abajo ta la func
      paleta = paleta.sort((p, pB) => lightness(p) - lightness(pB));
      colorMasOscuro = paleta[0] || color(0); // {||negro} por si el array esta vacio?
      colorMasClaro = paleta[paleta.length - 1] || color(255);
    
colorMasOscuro.setAlpha(100);    
    select('#menu').elt.style.backgroundColor = colorMasOscuro.toString('#rrggbbaa');    
colorMasOscuro.setAlpha(255);
    
      if (alCargar) alCargar();
    });
}

function draw() {
  if (frameCount == chquearFrameRateTrasCargar && frameRate()<20) animar = false;
  
  if(animar || darFrame)background(colorMasOscuro);
  let escala = 1;
  

  if (verPaleta) {
    for (let i = 0; i < paleta.length; i++) {
      noStroke();
      fill(paleta[i]);
      rect(i * 5 % width, floor(5 * i / width) * 5, 5, 5);
    }
  }

  stroke(lerpColor(colorMasOscuro, colorMasClaro, 0.25));
  
  if (cargandoNuevo) {
    strokeWeight(1);
    push();
    translate(width-30,height-30);
    rotate(frameCount*0.1);
    line(-30,0,30,0);
    rotate(TWO_PI/3);
    line(-20,0,20,0);
    rotate(TWO_PI/3);    
    line(-10,0,10,0);
    pop();
  }
  
  if (!animar && !darFrame) return;
  darFrame = false;
  translate(width / 2, height / 2);
  
  if (mostrarPlaneta != -1) {
    //push();
    let conta = 0;
    let rotAcumulada = 0;
    for (let planeta of planetas) {
      rotAcumulada += (frameCount * planeta.vel);
      if (conta == mostrarPlaneta%planetas.length) {
        const orbita = lerp(orbitaMayor, 0, 1.0 - planeta.orbita / cantOrbitas)
        rotate(rotAcumulada)
        escala = lerp(2,200/planeta.diam,0.25);
         translate(-orbita*escala, 0)
        scale(escala);
        rotate(-rotAcumulada)
        break;
      }
      conta++;
    }
    //pop();
  }

  //noStroke();
  noFill();


  for (let i = 1.0; i < cantOrbitas; i++) {
    strokeWeight(primos.includes(i) ? 3/escala : 1/escala);
    const diam = lerp(orbitaMayor, 0, i / cantOrbitas)
    //if (orbitaMayorAceptable == i) strokeWeight(6);//chequeando
    circle(0, 0, diam);
  }

  strokeWeight(0.25);
  for (let i = 0; i < cantRadios; i++) {
    rotate(TWO_PI * 1.0 / cantRadios);
    line(lerp(0, orbitaMayor, (0.5 + (i + floor(frameCount / 75)) % 7) / cantOrbitas), 0, width * height, 0);
  }

  noStroke();
  for (let planeta of planetas) {
    const orbita = lerp(orbitaMayor, 0, 1.0 - planeta.orbita / cantOrbitas)
    let colIndexReal = floor(paleta.length * planeta.colIndex);

    noFill();
    stroke(paleta[colIndexReal]);
    strokeWeight(5);
    arc(0, 0, orbita*2, orbita*2,0,frameCount * planeta.vel);
    noStroke();

    rotate(frameCount * planeta.vel);
    push();
    translate(orbita, 0)

    fill(colorMasOscuro);
    circle(0, 0, planeta.diam + 4/escala);
    fill(paleta[colIndexReal]);
    circle(0, 0, planeta.diam);

    noFill();
    // let colLinea = planeta.colIndex>0.75?colorMasOscuro:colorMasClaro;
    let colLinea = colorMasClaro;
    stroke(colLinea);
    strokeWeight(0.1);
    let prevTam = planeta.diam / 0.65;
    for (let i = 0; i < planeta.orbita; i++) {
      let rectTam = prevTam * 0.65;
      rotate(frameCount * planeta.vel);
      rect(-rectTam / 2, -rectTam / 2, rectTam, rectTam);
      const cantLineas = floor(planeta.diam / 15); //floor( (cantOrbitas- planeta.orbita*1.8)/5 );
      for (let j = 0; j < cantLineas + 1.0; j++) {
        line(-rectTam / 2, -rectTam / 2, lerp(-rectTam / 2, rectTam / 2, j / cantLineas), rectTam / 2);
      }
      prevTam = rectTam;
    }

    pop();
  }
}

function reducerArrayPixelesEnArrayColores(acumulador, valorActual, indice, elArray) {
  if (indice % 4 == 0) { //ejecutar solo una vez cada 4 elementos (pues, r,g,b,a = 4 elementos)
    acumulador.push(color(
      elArray[indice + 0], elArray[indice + 1], elArray[indice + 2], elArray[indice + 3]));
  }
  return acumulador;

}