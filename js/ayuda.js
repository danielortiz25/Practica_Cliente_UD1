"use strict";
console.log("ayuda.js cargado");

function rellenar(id, valor) {
  const el = document.getElementById(id);
  if (el !== null) el.textContent = valor;
}
rellenar("idioma", navigator.language);
rellenar("origen", location.origin);
rellenar("pantalla", screen.width + " x " + screen.height + " píxeles");
