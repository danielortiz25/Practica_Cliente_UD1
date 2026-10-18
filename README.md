# Gestor de participantes de un evento

Práctica UD1 de Desarrollo Web en Entorno Cliente (DWEC), curso 2026-2027. Aplicación que se ejecuta entera en el navegador con HTML, CSS y JavaScript, sin frameworks ni lógica de servidor.

## Enlace de CLaude

https://claude.ai/share/f9dd22c7-d9dd-4dc1-a23d-46f68aa65036

## 1. Cómo ejecutarla

El servidor solo entrega ficheros estáticos; toda la lógica corre en el navegador. Se sirve por HTTP (no `file://`) porque el origen, las cookies y `postMessage` no son fiables con `file://`.

1. Abrir la carpeta en VS Code.
2. Clic derecho en `index.html` → **Open with Live Server** (alternativa: `python -m http.server 5500`).
3. Usar **siempre el mismo host y puerto** (p. ej. `http://127.0.0.1:5500`). `localhost` y `127.0.0.1` son orígenes distintos.

## 2. Estructura

```
index.html        página principal (formulario, listado, estadísticas, JSON, iframe, preferencias, ayuda)
panel.html        panel que se incrusta en un iframe
ayuda.html        ayuda abierta con window.open
css/estilos.css   estilos (tema oscuro y letra grande mediante clases)
js/logica.js      validación y cálculo, sin tocar el DOM
js/app.js         interfaz de la página principal
js/cookies.js     leerCookie, guardarCookie, borrarCookie
js/panel.js       receptor y DOM del panel
js/ayuda.js       datos del navegador en la ayuda
```

## 3. Funcionalidades: dónde y cómo

| Funcionalidad | Archivos y funciones | Cómo se hace |
|---|---|---|
| Alta y validación | `logica.js`: `validarParticipante`, `aNumero`; `app.js`: `altaParticipante`, `mostrarErrores` | La validación devuelve `{valido, errores, datos}`. `aNumero` rechaza la cadena vacía antes de convertir y acepta solo dígitos con un punto decimal. Los errores salen junto a cada campo y no se hace `reset()`, así que se conservan los valores. |
| Identificadores | `logica.js`: `generarId` | `Math.random` entre 100000 y 999999, comprobando duplicados con un `while` limitado a 1000 intentos; devuelve `null` si se agotan. |
| Listado y clasificación | `app.js`: `crearTarjeta`, `pintarLista`; `logica.js`: `clasificarEdad`, `clasificarExperiencia`, `formatearFecha` | Tarjetas con `createElement`, `textContent` y `append`; clases y atributos `data-*` para los estados. Sin `innerHTML`. |
| Bajas | `app.js`: `borrarParticipante` | `confirm`; si se cancela no cambia nada; si se acepta se quita del array y se hace `tarjeta.remove()`. |
| Búsqueda y filtro | `logica.js`: `filtrarParticipantes`; `app.js`: `pintarLista`, `actualizarAvisoVacio` | `trim`, `toLowerCase` e `includes`; combinables; aviso si no hay coincidencias. |
| Estadísticas | `logica.js`: `calcularEstadisticas`, `buscarPrimerMenor`, `formatearMedia`; `app.js`: `pintarEstadisticas` | Bucles, contadores y acumuladores (sin `reduce`); `continue` para omitir online; `break` para el primer menor; `"Sin datos"` si no hay datos. |
| JSON | `logica.js`: `validarColeccionImportada`, `validarElementoImportado`; `app.js`: `exportarJson`, `importarJson` | `JSON.stringify`/`JSON.parse` con `try/catch`. Importación todo o nada. |
| Panel (iframe + postMessage) | `app.js`: `instalarReceptorPanel`, `enviarResumen`; `logica.js`: `construirResumen`; `panel.js` | `targetOrigin` = `location.origin` (nunca `"*"`). Ambos lados comprueban `origin`, `source` y estructura de `data`. El panel avisa con `listo` tras instalar su receptor. |
| Cookies | `cookies.js`; `app.js`: `cargarPreferencias`, `guardarPreferencias`, `restablecerPreferencias` | Dos cookies (`dwec_tema`, `dwec_tamano`) con `Path=/`, `SameSite=Lax`, `Max-Age` de 30 días y `Secure` si es HTTPS. Valores codificados, validados al leer y confirmados por lectura. |
| Ayuda | `app.js`: `abrirAyuda`, `cerrarAyuda`; `ayuda.js` | `window.open` con referencia guardada, comprobación de `closed`, aviso si se bloquea. |

## 4. Casos de prueba (en el navegador, con DevTools abierto)

### Alta
| Pasos y datos | Resultado esperado |
|---|---|
| Nombre `Pablo Ruiz`, edad `0`, tipo invitado, modalidad online, experiencia `0` → Añadir | Se añade (edad 0 válida), tarjeta «menor de edad», formulario limpio, estadísticas actualizadas. |
| Edad `18abc` (resto válido) | Error junto a «Edad», no se añade, **se conservan** los valores escritos. |
| Edad vacía; `17.5`; `121`; `-1`; `0x10` | Error en edad en todos los casos. |
| Nombre `A`, o solo espacios | Error en nombre. |
| Tipo o modalidad sin elegir | Error junto al campo. |
| Experiencia `7,5` | Error: el mensaje indica que los decimales van con punto. |
| Experiencia `7.5` y `10` | Se aceptan. `10.01` se rechaza. |

### Listado, búsqueda y bajas
| Pasos | Resultado esperado |
|---|---|
| Buscar `ANA` (mayúsculas) | Aparece Ana García. |
| Buscar `zzz` | Mensaje de que no hay coincidencias. |
| Filtro «Online» + búsqueda `luis` | Solo Luis Pérez (filtros combinados). |
| Pulsar «Borrar» y **Cancelar** en el `confirm` | No cambia nada. |
| Pulsar «Borrar» y Aceptar | Desaparece esa tarjeta, las demás siguen, estadísticas y panel se actualizan. |
| Borrar los tres participantes | Mensaje «No hay participantes inscritos» (lista vacía). |

### Estadísticas
| Pasos | Resultado esperado |
|---|---|
| Datos iniciales | Total 3, 1 menor y 2 mayores, edad media 37.67, mínima 17, máxima 62, 2 presenciales y 1 online, experiencia media presencial 2.50. |
| Con lista vacía | «Sin datos» en medias y extremos; nunca `NaN` ni `Infinity`. |
| Con la lista vacía, «Localizar al primer menor» | «No hay ningún menor de edad.» |
| Con los datos iniciales | «Primer menor de edad: Ana García». |

### JSON
| Pasos | Resultado esperado |
|---|---|
| Exportar | El textarea muestra el array con los participantes. |
| Importar el JSON exportado | Importación correcta. |
| Importar `[]` | Válido: lista vacía, panel «Sin inscripciones». |
| Importar `{"a":1}` o texto mal formado (`[{`) | Error comprensible; se conserva la colección anterior. |
| Importar un elemento con `edad` como texto `"17"` | Rechazado (tipo incorrecto), colección intacta. |
| Dos elementos con el mismo `id` | Rechazado por id repetido. |
| Fecha `2026-02-30T10:00:00.000Z` | Rechazada: fecha ISO no válida. |

### Panel e intercambio de mensajes
| Pasos | Resultado esperado |
|---|---|
| Cargar la página | El panel muestra total, presenciales, online y última inscripción (Carmen Soto). |
| Añadir o borrar un participante | El panel se actualiza solo. |
| Consola de la página principal: `document.getElementById("panel").contentWindow.postMessage({tipo:"resumen",total:99,presencial:1,online:1,ultimo:null}, location.origin)` | Estructura inválida: el panel lo ignora, sin cambios ni errores. |
| Con la ayuda abierta, en su consola: `window.opener.postMessage({tipo:"listo"}, location.origin)` | La principal lo ignora (`source` no es el iframe). |

### Cookies
| Pasos | Resultado esperado |
|---|---|
| Primera visita sin cookies | Tema claro y letra normal. |
| Elegir oscuro y grande → Guardar | Cambia el aspecto y aparece «guardadas durante 30 días»; en Application → Cookies, dos cookies con `Max-Age` de 30 días. |
| Recargar | Se recuperan las preferencias. |
| En Application, cambiar `dwec_tema` a `rojo` y recargar | Se aplica tema claro (valor inválido). |
| Restablecer | Se borran ambas cookies y vuelve el aspecto por defecto. |
| Bloquear cookies del sitio y guardar | Se aplica el aspecto, pero el mensaje dice que no se ha confirmado el guardado. |

### Ayuda
| Pasos | Resultado esperado |
|---|---|
| Abrir ayuda | Se abre `ayuda.html` con idioma, origen y resolución de pantalla. |
| Abrir de nuevo con la ayuda abierta | Se reutiliza (foco) y lo indica. |
| Cerrar ayuda | Se cierra; si no hay ninguna abierta, lo indica. |
| Bloquear ventanas emergentes y abrir | Aviso de bloqueo. |

## 5. Contenidos aplicados de las sesiones

| Sesión | Dónde se aplica |
|---|---|
| 1. Arquitectura y navegador | Servidor estático + código cliente; `defer`; separación HTML/CSS/JS; DevTools. |
| 2. Primeros programas | `const`/`let`, tipos, `typeof`, operadores. |
| 3. Tipos, ámbitos, decisiones | Conversión explícita (`aNumero`), `===`, `if/else`, ternario (`clasificarEdad`), `switch` (receptores de mensajes). |
| 4. Bucles | `for`, `for...of`, `while` (`generarId`), contadores y acumuladores, `break`, `continue`. |
| 5. Objetos predefinidos | `String`, `Number`, `Math`, `Date`, `JSON`, `navigator`, `location`, `screen`, `confirm`. |
| 6. DOM | `getElementById`, `querySelector`, `querySelectorAll`, `createElement`, `append`, `remove`, `classList`, atributos. |
| 7. Ventanas y cookies | `window.open`, iframe, `postMessage`, cookies. |

### Explicaciones pedidas
- **Carga del script:** `defer` en el `head`. Descarga en paralelo, ejecuta tras analizar el HTML y respeta el orden (`cookies.js`, `logica.js`, `app.js`). Al ejecutarse el DOM ya existe y las funciones de los scripts anteriores ya están definidas.
- **Cliente-servidor:** el servidor solo responde a `GET` de ficheros estáticos; validación, DOM, cookies y mensajes se ejecutan en el navegador. Por eso el navegador no debe ser la única defensa en una aplicación real: todo dato del cliente es manipulable.
- **Ámbitos y hoisting:** los scripts clásicos comparten el ámbito global, por eso `app.js` usa funciones de `logica.js`. `logica.js` recibe los datos por parámetros (ámbito de función) y no depende de globales. `const`/`let` tienen ámbito de bloque y zona temporal muerta; las declaraciones `function` se elevan completas, pero una constante como `TIPOS` debe estar inicializada antes de llamar a `validarParticipante`.
- **Truthy y falsy:** la edad `0` es falsy pero válida. Por eso se compara con `null` y no con `!valor`: `valor || "Sin datos"` mostraría «Sin datos» con edad mínima 0. Tampoco se usa `||` para valores por defecto; `??` solo sustituye `null`/`undefined` y conservaría el `0`.
- **Restricciones entre orígenes:** origen = esquema + host + puerto. Todas las páginas se sirven desde el mismo host y puerto para poder usar `postMessage` con `targetOrigin` concreto y comprobar `event.origin` y `event.source`. Una referencia a una ventana no da acceso a su `document`: por eso el panel construye su propio DOM.

## 6. Decisiones de diseño
- Experiencia con **punto decimal** (`7.5`); la coma se rechaza y el mensaje lo indica.
- `esFechaIso` exige el formato que genera `toISOString()` (con milisegundos), coherente con lo que exporta la aplicación.
- `src` del iframe se asigna desde `app.js` **después** de instalar el receptor de mensajes (no está en el HTML a propósito).
- `datos` de `validarParticipante` es `null` si hay errores, para que nunca circule un `NaN`.
- Los `console.log("... cargado")` se mantienen como evidencia del orden de carga.

## 7. Uso de IA
- Chats utilizados: **[COMPLETAR: enlaces o exportaciones]**
- El código base fue generado por Claude a petición mía. Decisiones tomadas con ayuda de la IA:
  - Estructura en dos capas (`logica.js` sin DOM, `app.js` con la interfaz). **[COMPLETAR: aceptado / cambiado]**
  - `aNumero`: la IA propuso primero una expresión regular y la sustituí por un recorrido con `for...of` porque no se ha visto en clase.
  - `validarParticipante` devuelve `datos: null` si hay errores.
  - Mensajes de `postMessage` gestionados con `switch` sobre `datos.tipo`.
  - **[COMPLETAR: qué revisé, qué probé y qué descarté por mi cuenta]**

## 8. Evidencias de depuración
- **Breakpoint:** **[COMPLETAR: captura]** de Sources con un punto de interrupción en `validarParticipante` al enviar el formulario con edad `18abc`. Explicación: se ve `origen.edad === "18abc"` y que `aNumero` devuelve `NaN`, por lo que `errores.edad` se rellena y `valido` es `false`.
- **Network:** **[COMPLETAR: captura]** de la pestaña Network al cargar la página: `index.html`, `estilos.css`, los tres `.js` y `panel.html` con estado 200 desde el mismo origen. Explicación: el navegador pide cada recurso con `GET` y el iframe carga `panel.html` como segundo documento.
