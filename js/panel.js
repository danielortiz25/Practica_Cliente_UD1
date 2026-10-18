"use strict";
console.log("panel.js cargado");

const origenPrincipal = location.origin;

function esEnteroNoNegativo(n) {
  return typeof n === "number" && Number.isInteger(n) && n >= 0;
}

function resumenValido(d) {
  if (d === null || typeof d !== "object") return false;
  if (d.tipo !== "resumen") return false;
  if (!esEnteroNoNegativo(d.total) || !esEnteroNoNegativo(d.presencial) || !esEnteroNoNegativo(d.online)) return false;
  if (d.presencial + d.online !== d.total) return false;
  if (d.ultimo === null) return d.total === 0;
  if (d.total === 0) return false;
  if (typeof d.ultimo !== "object") return false;
  if (typeof d.ultimo.nombre !== "string" || d.ultimo.nombre.length === 0 || d.ultimo.nombre.length > 60) return false;
  if (typeof d.ultimo.fecha !== "string" || Number.isNaN(new Date(d.ultimo.fecha).getTime())) return false;
  return true;
}

function pintarResumen(d) {
  const contenedor = document.getElementById("contenido");
  if (contenedor === null) return;
  contenedor.replaceChildren();
  if (d.total === 0) {
    const p = document.createElement("p");
    p.textContent = "Sin inscripciones";
    contenedor.append(p);
    return;
  }
  const dl = document.createElement("dl");
  const filas = [
    ["Total de inscritos", String(d.total)],
    ["Presenciales", String(d.presencial)],
    ["Online", String(d.online)],
    ["Última inscripción", d.ultimo.nombre + " (" + new Date(d.ultimo.fecha).toLocaleString("es-ES") + ")"]
  ];
  for (const fila of filas) {
    const dt = document.createElement("dt");
    dt.textContent = fila[0];
    const dd = document.createElement("dd");
    dd.textContent = fila[1];
    dl.append(dt, dd);
  }
  contenedor.append(dl);
}

window.addEventListener("message", function (evento) {
  if (evento.origin !== origenPrincipal) return;
  if (evento.source !== window.parent) return;
  const datos = evento.data;
  if (datos === null || typeof datos !== "object") return;
  switch (datos.tipo) {
    case "resumen":
      if (resumenValido(datos)) pintarResumen(datos);
      break;
    default:
      break; // mensaje inesperado: se ignora
  }
});

// Aviso de "preparado" después de instalar el receptor.
window.parent.postMessage({ tipo: "listo" }, origenPrincipal);
