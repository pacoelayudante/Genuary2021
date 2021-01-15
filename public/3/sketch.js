let cartaDiv;
let textoCarta;
let textoRta;
let grammar;

function setup() {
  noCanvas();

  let avatar = select("#cabezera .avatar").elt;
  let hashpete = Math.random().toString(36).slice(2);
  avatar.style.backgroundImage = "url('https://robohash.org/"+hashpete+"')";
  /*cartaDiv = select("#carta");
  cartaDiv.child(textoCarta = createP())*/
  textoCarta = select("#carta");
  textoRta = select("#respuesta");

  grammar = tracery.createGrammar(grammarSrc);
  grammar.addModifiers(baseEngModifiers);

  select("#entrada").mousePressed(generarCarta);
  generarCarta(false);
}

function generarCarta(responder = true) {
  if (responder) {
    let rta = createDiv(textoRta.html())
    rta.class("texto yo");
    textoCarta.child(rta);
  }
  grammar = tracery.createGrammar(grammarSrc);
  grammar.addModifiers(baseEngModifiers);
  let mensaje = createDiv(grammar.flatten("#inicio#"))
  mensaje.class("texto bot");
  textoCarta.child(mensaje);

  textoRta.html(respuesta[floor(random(respuesta.length))]);

  textoCarta.elt.scrollTop = textoCarta.elt.scrollHeight;
}

const respuesta = [
  "anda a cagar", "todo bien", "que?", "?", "no pasa nada", "olvidate",
  "no, cualquiera", "esto es cualquiera", "no te creo nada", "tranqui",
  "morite", "anda a la mierda", "???", "no se de que me estas hablando"
];

const grammarSrc = {
  hola: ["[br?:</br>]#comoestas?#", "Hola #comoestas?#</br>", "Che #comoestas?#</br>", "Ey #comoestas?#</br>"],
  "comoestas?": ["¿Estas?#br?#", "¿Como va?#br?#", "¿Como andas?#br?#", "", "", ""],
  "br?": [""],

  chau: [
    "adiós", "chau", "abrazo", "besos", "que mierda", "hasta la próxima", "nos vemos", "hasta pronto", "llamame", "no me llames", "adiós para siempre", "hasta nunca", "nada... eso", "buscame", "no me busques", "veámonos", "saludos a ya sabes quien"
  ],

  intro: [
    "No se ni como empezar.",
    "No te pude hablar antes[conectorNoPude:porque]#introNoPude#",
    "Se que no queres saber nada de mí",
    "Te iba a hablar antes[conectorNoPude:pero]#introNoPude#",
  ],
  introNoPude: [
    " #conectorNoPude# me faltó el coraje.",
    " #conectorNoPude# anduve a mil.",
    " #conectorNoPude# me quede sin batería.",
    "."
  ],
  postIntro: [
    "No paro de pensar en #aquelCuando##introQue#.",
    "No paro de darle vueltas a #aquelCuando##introQue#.",
    "Estuve pensando en #aquelCuando##introQue#.",
    "Es por lo de #aquelCuando##introQue#.",
    "#aquelCuando.capitalize##introQue# me quede #comoQuede#."
  ],
  comoQuede: ["con una sensación rara", "mal", "pensando", "preocupado",
    "confundido", "sintiendome para la chota", "que se yo"],
  introQue: [
    ".",
    " que nos vimos",
    " que te vi",
    " que hablamos",
    " que #nos?# peleamos"
  ],
  "nos?": ["", "nos"],

  cuerpo: ["#perdoname#<br/>#cuerpoExcusa#", "#cuerpoExcusa#<br/>#perdoname#",
    "#perdoname#", "#cuerpoExcusa#", "#perdoname#", "#cuerpoExcusa#"],
  perdoname: [
    "Perdón#quefue?#",
    "Perdoname#quefue?#",
    "Disculpame#quefue?#",
    "Te pido que me disculpes#quefue?#",
    "No se como disculparme#quefue?#",
    "No se como pedirte #perdisculpas##quefue?#",
    "Se que te tengo que pedir #perdisculpas##quefue?#",
  ],
  "quefue?": [
    "",
    " por lo que #queFue#. #comoEstuvo.capitalize#",
    ", lo que #queFue# #comoEstuvo#"
  ],
  comoEstuvo: [
    "estuvo mal.", "estuvo muy mal.", "fue cualquiera.",
    "no estuvo bien.", "salio mal.", "no salio bien.", "...",
  ],
  perdisculpas: ["perdón", "disculpas"],

  aquelCuando: ["aquella vez", "la ultima vez", "#aquelGen# #cuando#"],

  cuerpoExcusa: ["#excusa# #cuesta#", "#cuesta#", "#cuesta# #excusa#", "#excusa#", "#excusa#", "#excusa#"],
  cuesta: [
    "Esto me cuesta mucho.",
    "Pedir #perdisculpas# me cuesta mucho.",
    "Me cuesta mucho esto.",
    "Me cuesta mucho pedir #perdisculpas#."
  ],
  excusa: ["#excusa1#<br/>#excusa2#", "#excusa2#<br/>#excusa1#", "#excusa1#", "#excusa2#", "#excusa1#", "#excusa2#"],
  excusa1: [
    "#noEsEs?.capitalize# la primera vez que #queFueSimple# #algoAsiVariante#.",
    "Aunque creas que siempre #queFueSimple# #algoAsiVariante#, pues #noEsEs?# así.",
    "#algoAsiVariante.capitalize#, la verdad, #noEsEs?# común en mí.",
    "#penseCrei.capitalize# que #yaNo?# no #queFueIria# #algoAsiVariante#.",
    "Lo cierto es que #noEsEs?# normal lo que #queFue#."
  ],
  algoAsiVariante: ["algo asi", "cosas asi", "algo como eso", "cosas como esa"],

  "noEsEs?": ["es", "no es"],
  "yaNo?": [" ya", ""],
  "penseCrei": ["pensé", "pensaba", "crei", "creia", "flashie", "flashaba"],

  excusa2: [
    "Estaba #afectado#, era un mal momento.",
    "Justo #aquelCuando# andaba #afectado#.",
    "Realmente me arrepiento de lo que #queFue#."
  ],
  afectado: ["con unos nervios", "en un mal momento", "con tremendo dolor de cabeza",
    "como el orto", "mega bajón", "hasta las manos", "para atras", "con el culo sucio"],

  final: ["#espero.capitalize# #puedasPerdonarme#."],
  espero: ["espero", "solo me queda esperar que", "solo espero que", "lo unico que quiero es que",
    "solo quiero que", "no pido mas que", "solo pido que", "no espero que"],
  puedasPerdonarme: ["me perdones", "sepas perdonarme", "me disculpes", "sepas disculparme",
    "aceptes esta disculpa", "me puedas perdonar", "me sigas queriendo", "me sigas aceptando",
    "no me odies", "no le digas a nadie", "te olvides", "lo dejes pasar"],

  recordarQueFue: [
    "[queFue:#dijeVariante#][queFueSimple:digo][queFueIria:diría]",
    "[queFue:#hiceVariante#][queFueSimple:hago][queFueIria:haría]"],
  dijeVariante: ["dije", "te dije"],
  hiceVariante: ["hice", "te hice"],
  recordarCuandoFue: [
    "[cuando:noche][aquelGen:aquella]",
    "[cuando:día][aquelGen:aquel]",
    "[cuando:tarde][aquelGen:aquella]"],
  texto: ["#hola##intro#<br/>#postIntro#<br/>#cuerpo#<br/>#final#<br/>#chau.capitalize#"],
  inicio: ["#[#recordarQueFue#][#recordarCuandoFue#]texto#"]
}