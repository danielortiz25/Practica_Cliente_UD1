"use strict";
console.log("app.js cargado");

const participantes = [
  { id: 483721, nombre: "Ana García", edad: 17, tipo: "estudiante", modalidad: "presencial", experiencia: 4, fechaInscripcion: "2026-10-08T08:30:00.000Z" },
  { id: 215904, nombre: "Luis Pérez", edad: 34, tipo: "profesional", modalidad: "online", experiencia: 8.5, fechaInscripcion: "2026-10-09T10:15:00.000Z" },
  { id: 739056, nombre: "Carmen Soto", edad: 62, tipo: "invitado", modalidad: "presencial", experiencia: 1, fechaInscripcion: "2026-10-10T16:45:00.000Z" }
];
const CAMPOS = ["nombre", "edad", "tipo", "modalidad", "experiencia"];
const TEMAS = ["claro", "oscuro"];
const TAMANOS = ["normal", "grande"];
const origenPropio = location.origin;
let panelListo = false;
let ventanaAyuda = null;

function texto(id, contenido, esError) {
  const el = document.getElementById(id);
  if (el === null) return;
  el.textContent = contenido;
  if (typeof esError === "boolean") {
    el.classList.toggle("error", esError);
    el.classList.toggle("ok", !esError);
  }
}

/* ---------- Alta ---------- */
function mostrarErrores(errores) {
  for (const span of document.querySelectorAll(".error-campo")) span.textContent = "";
  for (const campo of Object.keys(errores)) {
    const span = document.getElementById("error-" + campo);
    if (span !== null) span.textContent = errores[campo];
  }
}

function altaParticipante(evento) {
  evento.preventDefault();
  const entrada = {};
  for (const campo of CAMPOS) entrada[campo] = document.getElementById(campo).value;
  const r = validarParticipante(entrada);
  mostrarErrores(r.errores);
  if (!r.valido) {
    texto("mensaje", "Hay errores en el formulario: no se ha añadido el participante.", true);
    return;
  }
  const id = generarId(participantes);
  if (id === null) {
    texto("mensaje", "No se ha podido generar un identificador libre.", true);
    return;
  }
  participantes.push({
    id: id, nombre: r.datos.nombre, edad: r.datos.edad, tipo: r.datos.tipo,
    modalidad: r.datos.modalidad, experiencia: r.datos.experiencia,
    fechaInscripcion: new Date().toISOString()
  });
  document.getElementById("formulario").reset();
  document.getElementById("nombre").focus();
  texto("mensaje", "Participante añadido.", false);
  refrescarTodo();
}

/* ---------- Listado ---------- */
function crearTarjeta(participante) {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarjeta", participante.edad < 18 ? "menor" : "mayor");
  tarjeta.classList.add("exp-" + clasificarExperiencia(participante.experiencia));
  tarjeta.setAttribute("data-id", String(participante.id));
  tarjeta.setAttribute("data-modalidad", participante.modalidad);

  const titulo = document.createElement("h3");
  titulo.textContent = participante.nombre;
  tarjeta.append(titulo);

  const filas = [
    "ID: " + participante.id,
    "Edad: " + participante.edad + " (" + clasificarEdad(participante.edad) + ")",
    "Tipo: " + etiquetaTipo(participante.tipo),
    "Modalidad: " + participante.modalidad,
    "Experiencia: " + participante.experiencia + " (" + clasificarExperiencia(participante.experiencia) + ")",
    "Inscrito el: " + formatearFecha(participante.fechaInscripcion)
  ];
  for (const fila of filas) {
    const p = document.createElement("p");
    p.textContent = fila;
    tarjeta.append(p);
  }
  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.textContent = "Borrar";
  borrar.setAttribute("aria-label", "Borrar a " + participante.nombre);
  borrar.addEventListener("click", function () {
    borrarParticipante(participante.id, tarjeta);
  });
  tarjeta.append(borrar);
  return tarjeta;
}

function borrarParticipante(id, tarjeta) {
  let indice = -1;
  for (let i = 0; i < participantes.length; i++) {
    if (participantes[i].id === id) { indice = i; break; }
  }
  if (indice === -1) return;
  const nombre = participantes[indice].nombre;
  if (!confirm("¿Seguro que quieres borrar a " + nombre + "?")) return;
  participantes.splice(indice, 1);
  tarjeta.remove();
  texto("mensaje", "Participante borrado.", false);
  texto("primer-menor", "");
  actualizarAvisoVacio();
  pintarEstadisticas();
  enviarResumen();
}

function actualizarAvisoVacio() {
  // querySelector devuelve null si no hay ninguna tarjeta en la lista.
  const hay = document.querySelector("#lista .tarjeta") !== null;
  const aviso = document.getElementById("sin-resultados");
  if (aviso === null) return;
  aviso.hidden = hay;
  aviso.textContent = participantes.length === 0
    ? "No hay participantes inscritos."
    : "Ningún participante coincide con la búsqueda.";
}

function pintarLista() {
  const lista = document.getElementById("lista");
  const busqueda = document.getElementById("busqueda");
  const filtro = document.getElementById("filtro-modalidad");
  if (lista === null || busqueda === null || filtro === null) return;
  const visibles = filtrarParticipantes(participantes, busqueda.value, filtro.value);
  lista.replaceChildren();
  for (const p of visibles) lista.append(crearTarjeta(p));
  actualizarAvisoVacio();
}

/* ---------- Estadísticas ---------- */
function pintarEstadisticas() {
  const dl = document.getElementById("estadisticas");
  if (dl === null) return;
  const est = calcularEstadisticas(participantes);
  const filas = [
    ["Total de participantes", est.total],
    ["Menores de edad", est.menores],
    ["Mayores de edad", est.mayores],
    ["Edad media", formatearMedia(est.edadMedia)],
    ["Edad mínima", formatearEntero(est.edadMin)],
    ["Edad máxima", formatearEntero(est.edadMax)],
    ["Presenciales", est.porModalidad.presencial],
    ["Online", est.porModalidad.online],
    ["Estudiantes", est.porTipo.estudiante],
    ["Profesionales", est.porTipo.profesional],
    ["Invitados", est.porTipo.invitado],
    ["Experiencia media (presenciales)", formatearMedia(est.experienciaPresencialMedia)]
  ];
  dl.replaceChildren();
  for (const fila of filas) {
    const dt = document.createElement("dt");
    dt.textContent = fila[0];
    const dd = document.createElement("dd");
    dd.textContent = String(fila[1]);
    dl.append(dt, dd);
  }
}

function mostrarPrimerMenor() {
  const menor = buscarPrimerMenor(participantes);
  texto("primer-menor", menor === null ? "No hay ningún menor de edad." : "Primer menor de edad: " + menor.nombre);
}

/* ---------- JSON ---------- */
function exportarJson() {
  document.getElementById("json").value = JSON.stringify(participantes, null, 2);
  texto("mensaje-json", "Colección exportada.", false);
}

function importarJson() {
  const r = validarColeccionImportada(document.getElementById("json").value);
  if (!r.valido) {
    texto("mensaje-json", r.error + " Se conserva la colección anterior.", true);
    return;
  }
  participantes.splice(0, participantes.length, ...r.datos);
  texto("mensaje-json", "Importados " + r.datos.length + " participantes.", false);
  refrescarTodo();
}

/* ---------- iframe ---------- */
function enviarResumen() {
  const marco = document.getElementById("panel");
  if (!panelListo || marco === null || marco.contentWindow === null) return;
  const resumen = construirResumen(participantes);
  marco.contentWindow.postMessage({
    tipo: "resumen", total: resumen.total, presencial: resumen.presencial,
    online: resumen.online, ultimo: resumen.ultimo
  }, origenPropio);
}

function instalarReceptorPanel() {
  const marco = document.getElementById("panel");
  if (marco === null) return;
  window.addEventListener("message", function (evento) {
    if (evento.origin !== origenPropio) return;
    if (evento.source !== marco.contentWindow) return;
    const datos = evento.data;
    if (datos === null || typeof datos !== "object") return;
    switch (datos.tipo) {
      case "listo":
        panelListo = true;
        enviarResumen();
        break;
      default:
        return; // mensaje inesperado: se ignora
    }
  });
  marco.src = "panel.html"; // tras instalar el receptor
}

/* ---------- Preferencias (cookies) ---------- */
function elegir(valor, permitidos, predeterminado) {
  return permitidos.includes(valor) ? valor : predeterminado;
}

function aplicarPreferencias(tema, tamano) {
  document.body.classList.toggle("oscuro", tema === "oscuro");
  document.body.classList.toggle("grande", tamano === "grande");
}

function cargarPreferencias() {
  const tema = elegir(leerCookie("dwec_tema"), TEMAS, "claro");
  const tamano = elegir(leerCookie("dwec_tamano"), TAMANOS, "normal");
  document.getElementById("pref-tema").value = tema;
  document.getElementById("pref-tamano").value = tamano;
  aplicarPreferencias(tema, tamano);
}

function guardarPreferencias(evento) {
  evento.preventDefault();
  const tema = elegir(document.getElementById("pref-tema").value, TEMAS, "claro");
  const tamano = elegir(document.getElementById("pref-tamano").value, TAMANOS, "normal");
  aplicarPreferencias(tema, tamano);
  guardarCookie("dwec_tema", tema, 30);
  guardarCookie("dwec_tamano", tamano, 30);
  const guardadas = leerCookie("dwec_tema") === tema && leerCookie("dwec_tamano") === tamano;
  texto("estado-pref", guardadas
    ? "Preferencias aplicadas y guardadas durante 30 días."
    : "Preferencias aplicadas, pero no se ha confirmado su guardado.", guardadas === false);
}

function restablecerPreferencias() {
  borrarCookie("dwec_tema");
  borrarCookie("dwec_tamano");
  document.getElementById("pref-tema").value = "claro";
  document.getElementById("pref-tamano").value = "normal";
  aplicarPreferencias("claro", "normal");
  const borradas = leerCookie("dwec_tema") === null && leerCookie("dwec_tamano") === null;
  texto("estado-pref", borradas
    ? "Preferencias restablecidas y cookies eliminadas."
    : "Aspecto restablecido, pero revisa las cookies almacenadas.", borradas === false);
}

/* ---------- Ayuda (window.open) ---------- */
function abrirAyuda() {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.focus();
    texto("estado-ayuda", "La ayuda ya estaba abierta.", false);
    return;
  }
  ventanaAyuda = window.open("ayuda.html", "ayudaDWEC", "width=620,height=520");
  if (ventanaAyuda === null) {
    texto("estado-ayuda", "El navegador ha bloqueado la ventana de ayuda. Permite las ventanas emergentes.", true);
  } else {
    texto("estado-ayuda", "Se ha solicitado abrir la ayuda.", false);
  }
}

function cerrarAyuda() {
  if (ventanaAyuda !== null && !ventanaAyuda.closed) {
    ventanaAyuda.close();
    texto("estado-ayuda", "Ayuda cerrada.", false);
  } else {
    texto("estado-ayuda", "No hay ninguna ayuda abierta.", false);
  }
  ventanaAyuda = null;
}

/* ---------- Arranque ---------- */
function refrescarTodo() {
  texto("primer-menor", "");
  pintarLista();
  pintarEstadisticas();
  enviarResumen();
}

function iniciar() {
  const formulario = document.getElementById("formulario");
  if (formulario === null) {
    console.error("No se encuentra el formulario: no se inicia la aplicación.");
    return;
  }
  formulario.addEventListener("submit", altaParticipante);
  document.getElementById("busqueda").addEventListener("input", pintarLista);
  document.getElementById("filtro-modalidad").addEventListener("change", pintarLista);
  document.getElementById("btn-primer-menor").addEventListener("click", mostrarPrimerMenor);
  document.getElementById("btn-exportar").addEventListener("click", exportarJson);
  document.getElementById("btn-importar").addEventListener("click", importarJson);
  document.getElementById("form-pref").addEventListener("submit", guardarPreferencias);
  document.getElementById("btn-restablecer").addEventListener("click", restablecerPreferencias);
  document.getElementById("btn-abrir-ayuda").addEventListener("click", abrirAyuda);
  document.getElementById("btn-cerrar-ayuda").addEventListener("click", cerrarAyuda);
  cargarPreferencias();
  pintarLista();
  pintarEstadisticas();
  instalarReceptorPanel();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
