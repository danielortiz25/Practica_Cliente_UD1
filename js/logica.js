"use strict";
console.log("logica.js cargado");

// Lógica de validación y cálculo: no lee ni modifica el DOM.
const TIPOS = ["estudiante", "profesional", "invitado"];
const MODALIDADES = ["presencial", "online"];
const ID_MIN = 100000;
const ID_MAX = 999999;

function aNumero(valor) {
  // Los números (importación JSON) pasan tal cual; -0 se normaliza a 0.
  if (typeof valor === "number") return valor === 0 ? 0 : valor;
  if (typeof valor !== "string") return NaN;
  const texto = valor.trim();
  // Cadena vacía -> NaN (Number("") daría 0).
  if (texto === "") return NaN;
  // Solo dígitos y, como mucho, un punto decimal en medio: se rechazan
  // "0x10", "1e1", "-0", "7,5", ".5", "5." y "18abc".
  let puntos = 0;
  for (const caracter of texto) {
    if (caracter === ".") {
      puntos += 1;
      continue;
    }
    if (caracter < "0" || caracter > "9") return NaN;
  }
  if (puntos > 1 || texto.startsWith(".") || texto.endsWith(".")) return NaN;
  return Number(texto);
}

function validarParticipante(datos) {
  const errores = {};
  const origen = (datos !== null && typeof datos === "object") ? datos : {};

  const nombre = typeof origen.nombre === "string" ? origen.nombre.trim() : "";
  if (nombre.length < 2 || nombre.length > 60) {
    errores.nombre = "El nombre debe tener entre 2 y 60 caracteres.";
  }
  const edad = aNumero(origen.edad);
  if (!Number.isFinite(edad) || !Number.isInteger(edad) || edad < 0 || edad > 120) {
    errores.edad = "La edad debe ser un entero entre 0 y 120.";
  }
  const tipo = typeof origen.tipo === "string" ? origen.tipo : "";
  if (!TIPOS.includes(tipo)) {
    errores.tipo = "Elige estudiante, profesional o invitado.";
  }
  const modalidad = typeof origen.modalidad === "string" ? origen.modalidad : "";
  if (!MODALIDADES.includes(modalidad)) {
    errores.modalidad = "Elige presencial u online.";
  }
  const experiencia = aNumero(origen.experiencia);
  if (!Number.isFinite(experiencia) || experiencia < 0 || experiencia > 10) {
    errores.experiencia = "La experiencia debe ser un número entre 0 y 10 (decimales con punto, por ejemplo 7.5).";
  }
  const valido = Object.keys(errores).length === 0;
  // datos solo existe si todo es válido: así nunca circula un NaN.
  return {
    valido,
    errores,
    datos: valido ? { nombre, edad, tipo, modalidad, experiencia } : null
  };
}

function generarId(participantes) {
  const usados = new Set();
  for (const p of participantes) usados.add(p.id);
  let intentos = 0;
  while (intentos < 1000) { // límite: nunca bloquea la pestaña
    const id = Math.floor(Math.random() * (ID_MAX - ID_MIN + 1)) + ID_MIN;
    if (!usados.has(id)) return id;
    intentos += 1;
  }
  return null;
}

function calcularEstadisticas(participantes) {
  const est = {
    total: participantes.length, menores: 0, mayores: 0,
    edadMedia: null, edadMin: null, edadMax: null,
    porModalidad: { presencial: 0, online: 0 },
    porTipo: { estudiante: 0, profesional: 0, invitado: 0 },
    experienciaPresencialMedia: null
  };
  let sumaEdad = 0;
  for (const p of participantes) {
    sumaEdad += p.edad;
    if (p.edad < 18) est.menores += 1; else est.mayores += 1;
    if (est.edadMin === null || p.edad < est.edadMin) est.edadMin = p.edad;
    if (est.edadMax === null || p.edad > est.edadMax) est.edadMax = p.edad;
    est.porModalidad[p.modalidad] += 1;
    est.porTipo[p.tipo] += 1;
  }
  let sumaExp = 0;
  let presenciales = 0;
  for (const p of participantes) {
    if (p.modalidad === "online") continue;
    sumaExp += p.experiencia;
    presenciales += 1;
  }
  if (est.total > 0) est.edadMedia = sumaEdad / est.total;
  if (presenciales > 0) est.experienciaPresencialMedia = sumaExp / presenciales;
  return est;
}

function buscarPrimerMenor(participantes) {
  let encontrado = null;
  for (const p of participantes) {
    if (p.edad < 18) { encontrado = p; break; }
  }
  return encontrado;
}

function clasificarEdad(edad) {
  return edad < 18 ? "menor de edad" : "mayor de edad";
}

function clasificarExperiencia(exp) {
  if (exp < 4) return "inicial";
  else if (exp < 7) return "intermedia";
  else return "avanzada";
}

function etiquetaTipo(tipo) {
  // Primera letra en mayúscula con métodos de String.
  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function formatearMedia(valor) {
  return (valor === null || !Number.isFinite(valor)) ? "Sin datos" : valor.toFixed(2);
}

function formatearEntero(valor) {
  return (valor === null || !Number.isFinite(valor)) ? "Sin datos" : String(valor);
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString("es-ES");
}

function filtrarParticipantes(participantes, texto, modalidad) {
  const buscado = texto.trim().toLowerCase();
  const resultado = [];
  for (const p of participantes) {
    if (buscado !== "" && !p.nombre.toLowerCase().includes(buscado)) continue;
    if (modalidad !== "todas" && p.modalidad !== modalidad) continue;
    resultado.push(p);
  }
  return resultado;
}

function construirResumen(participantes) {
  const est = calcularEstadisticas(participantes);
  let reciente = null;
  for (const p of participantes) {
    if (reciente === null || new Date(p.fechaInscripcion) > new Date(reciente.fechaInscripcion)) reciente = p;
  }
  return {
    total: est.total,
    presencial: est.porModalidad.presencial,
    online: est.porModalidad.online,
    ultimo: reciente === null ? null : { nombre: reciente.nombre, fecha: reciente.fechaInscripcion }
  };
}

function esFechaIso(texto) {
  const f = new Date(texto);
  return !Number.isNaN(f.getTime()) && f.toISOString() === texto;
}

function validarElementoImportado(el, idsVistos) {
  if (el === null || typeof el !== "object" || Array.isArray(el)) {
    return { error: "no es un objeto.", participante: null };
  }
  if (typeof el.id !== "number" || typeof el.nombre !== "string" || typeof el.edad !== "number" ||
      typeof el.tipo !== "string" || typeof el.modalidad !== "string" ||
      typeof el.experiencia !== "number" || typeof el.fechaInscripcion !== "string") {
    return { error: "faltan campos o tienen un tipo incorrecto.", participante: null };
  }
  const r = validarParticipante(el);
  if (!r.valido) {
    return { error: "datos no válidos (" + Object.values(r.errores).join(" ") + ")", participante: null };
  }
  if (!esFechaIso(el.fechaInscripcion)) return { error: "fecha ISO no válida.", participante: null };
  if (!Number.isInteger(el.id) || el.id < ID_MIN || el.id > ID_MAX) {
    return { error: "identificador no válido.", participante: null };
  }
  if (idsVistos.has(el.id)) return { error: "identificador repetido.", participante: null };
  return {
    error: null,
    participante: Object.assign({ id: el.id }, r.datos, { fechaInscripcion: el.fechaInscripcion })
  };
}

function validarColeccionImportada(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (error) {
    return { valido: false, error: "El JSON está mal formado: " + error.message, datos: null };
  }
  if (!Array.isArray(datos)) {
    return { valido: false, error: "El JSON debe ser un array de participantes.", datos: null };
  }
  const ids = new Set();
  const resultado = [];
  for (let i = 0; i < datos.length; i++) {
    const r = validarElementoImportado(datos[i], ids);
    if (r.error !== null) {
      return { valido: false, error: "Elemento " + (i + 1) + ": " + r.error, datos: null };
    }
    ids.add(r.participante.id);
    resultado.push(r.participante);
  }
  return { valido: true, error: null, datos: resultado };
}
