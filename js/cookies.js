"use strict";
console.log("cookies.js cargado");

function leerCookie(nombre) {
  const prefijo = nombre + "=";
  const partes = document.cookie.split(";");
  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i].trim();
    if (parte.startsWith(prefijo)) {
      try {
        return decodeURIComponent(parte.slice(prefijo.length));
      } catch (error) {
        return null;
      }
    }
  }
  return null;
}

function guardarCookie(nombre, valor, dias) {
  const segundos = Math.floor(dias * 24 * 60 * 60);
  let atributos = "; Path=/; Max-Age=" + segundos + "; SameSite=Lax";
  if (location.protocol === "https:") atributos += "; Secure";
  document.cookie = nombre + "=" + encodeURIComponent(valor) + atributos;
}

function borrarCookie(nombre) {
  let atributos = "; Path=/; Max-Age=0; SameSite=Lax";
  if (location.protocol === "https:") atributos += "; Secure";
  document.cookie = nombre + "=" + atributos;
}
