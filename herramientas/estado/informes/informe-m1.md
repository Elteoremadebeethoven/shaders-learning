Reporte del Módulo 1 · Fundamentos web mínimos. Terminé las 7 lecciones. `verificar.mjs` no da ningún problema salvo enlaces a lecciones que aún no existen.

**Sobre el servidor que se quedó trabado:** sigue abierto un `python3 -m http.server 8765 --bind 127.0.0.1` (PID 32429, lanzado a las 21:05) que sirve `/Users/alex/Projects/shaders`. Ya estaba corriendo antes de mi primer comando, así que no lo arrancó esta sesión. No lo maté porque podía estar usándolo otro autor; lo paras con `kill 32429`. Yo nunca ejecuté un servidor en primer plano: cada servidor vivía dentro de un script con límite de tiempo y se cerraba al terminar, y no quedó ningún proceso mío abierto.

### 1. Archivos creados (todos en `/Users/alex/Projects/shaders/modulos/01-web/`)
- `01-html.html`, `02-css.html`, `03-js-lenguaje.html`, `04-js-dom-eventos.html`, `05-event-loop.html`, `06-binario.html`, `07-herramientas.html`
- `recursos/m1.css`: estilos de las demos, siempre con variables del tema.
- `recursos/bucle-eventos.js`: simulador del event loop (solo lo carga la 1.5).
- Los experimentos quedaron en el scratchpad (`experimentos/m1/`) y las capturas en `capturas/m1/`.

### 2. Por lección
- **1.1 HTML y el DOM**: de bytes a DOM, doctype/quirks (con medidas), charset (mojibake medido por HTTP), viewport, nodos de texto, correcciones del parser, `</script>` dentro de un string, `data-*`, atributos frente a propiedades, `defer`/`async` con un experimento cronometrado y los dos tamaños del canvas. Demo principal: escribes HTML y ves el árbol DOM. 2 ejemplos, 4 ejercicios, 3 quizzes, 6 bestiarios.
- **1.2 CSS**: cascada y especificidad, modelo de caja (demo interactiva), display y flex, position, contextos de apilamiento, unidades, colores y `transform` a fondo (el orden, las matrices, `transform-origin`). Segunda demo: orden de las transformaciones paso a paso. Cierra con variables CSS y `overflow`. 3 ejemplos, 4 ejercicios, 3 quizzes, 8 bestiarios.
- **1.3 JS I**: tipos, TDZ, choques en el ámbito global entre scripts, doubles (EPSILON, 2^53, NaN, -0, `x|0`), Math, `%` frente al `mod` de GLSL (con graficador), conversiones, `==`, `??`, referencias, arrays, closures, `this`, clases y por qué no hay módulos. Incluye pausas del recolector de basura medidas con trazas. 2 ejemplos, 4 ejercicios, 3 quizzes, 6 bestiarios.
- **1.4 JS II**: colecciones vivas, `innerHTML` y XSS, estilos, listeners, fases, delegación, listeners pasivos, Pointer Events (captura y táctil emulado), `key`/`code`, `ResizeObserver` e `IntersectionObserver`. Demo principal: inspector con todos los sistemas de coordenadas, más la conversión a píxeles de canvas y a coordenadas GL/NDC. 2 ejemplos, 4 ejercicios, 3 quizzes, 8 bestiarios.
- **1.5 Event loop**: pila, tareas y microtareas (clic real frente a `el.click()`), pasos del frame, puzzles de orden, mínimo de 4 ms, inanición, relojes, pestañas en segundo plano, Workers/OffscreenCanvas y layout forzado. Demo principal: simulador paso a paso. Segunda demo: bloquear el hilo congela la animación JS pero no la de CSS (comprobado grabando frames). 2 ejemplos, 4 ejercicios, 3 quizzes, 5 bestiarios.
- **1.6 Binario**: `bufferData` con un array normal, vistas y aliasing, alineación, `DataView` y endianness, bits de un float32, desbordamiento frente a saturación, `subarray`/`slice`/`set`, transferencia y VBO entrelazado (comprobado dibujando con WebGL y leyendo píxeles). Demo principal: volcado hexadecimal con los bits de cada número. 2 ejemplos, 4 ejercicios, 3 quizzes, 4 bestiarios.
- **1.7 Herramientas**: Console y su API de línea de comandos, Elements, Sources (breakpoints condicionales y logpoints), Performance, Rendering, Network, orígenes, tabla `file://` frente a HTTP con los mensajes reales, servidor de Python (cabeceras medidas), caché heurística que sirve código viejo (reproducida) y adelanto de `WEBGL_debug_shaders` (salida Metal real). 2 ejemplos, 4 ejercicios, 3 quizzes, 4 bestiarios.

### 3. Bestiario (41 ids, todos únicos)
- **1.1:** m1-quirks, m1-mojibake, m1-canvas-autocerrado, m1-script-string, m1-getcontext-null, m1-circulo-ovalado
- **1.2:** m1-margen-colapsa, m1-franja-canvas, m1-canvas-flex, m1-fixed-transform, m1-zindex, m1-100vw, m1-svg-origen, m1-var-invalida
- **1.3:** m1-ya-declarado, m1-nan, m1-modulo-negativo, m1-cero-falsy, m1-particulas-juntas, m1-this-perdido
- **1.4:** m1-coleccion-viva, m1-pasivo, m1-arrastre-perdido, m1-tecla-atascada, m1-offsetx-hijo, m1-raton-desplazado, m1-raton-invertido, m1-canvas-crece
- **1.5:** m1-tarea-larga, m1-orden-timeout-raf, m1-inanicion-microtareas, m1-segundo-plano, m1-layout-forzado
- **1.6:** m1-bufferdata-array, m1-alineacion, m1-dataview-endian, m1-desbordamiento
- **1.7:** m1-salto-tras-pausa, m1-textura-file, m1-fetch-file, m1-cache-vieja

Los módulos 2, 3 y 5 ya enlazan a m1-tarea-larga, m1-segundo-plano, m1-canvas-crece, m1-nan, m1-modulo-negativo, m1-fixed-transform y m1-circulo-ovalado. No hay que renombrarlos.

### 4. Verificación (última pasada)
```
✗ 01-html  js=7 demo=1 ejemplos=2 ejercicios=4 quiz=3 bestiario=6 palabras=7798 · enlace roto: ../06-glsl/01-lenguaje.html
✗ 02-css   js=8 demo=2 ejemplos=3 ejercicios=4 quiz=3 bestiario=8 palabras=8336 · enlaces rotos: 06-glsl/04-color, 07-integracion/02-interaccion
✗ 03-js-lenguaje  js=6 graficador=1 ejemplos=2 ejercicios=4 quiz=3 bestiario=6 palabras=8304 · enlace roto: 06-glsl/06-ruido
✗ 04-js-dom-eventos  js=6 demo=1 ejemplos=2 ejercicios=4 quiz=3 bestiario=8 palabras=7779 · enlace roto: 07-integracion/02-interaccion
✓ 05-event-loop  js=6 demo=2 ejemplos=2 ejercicios=4 quiz=3 bestiario=5 palabras=5873
✗ 06-binario  js=6 demo=1 ejemplos=2 ejercicios=4 quiz=3 bestiario=4 palabras=6516 · enlace roto: 07-integracion/05-particulas-gpu
✗ 07-herramientas  js=3 ejemplos=2 ejercicios=4 quiz=3 bestiario=4 palabras=6308 · enlace roto: 05-webgl/10-depuracion (×2)
```
Todos los "✗" se deben solo a enlaces a lecciones futuras. Además comprobé:
- Pasé cada playground y cada solución por un script propio que vuelca su consola: todas las salidas coinciden con lo que dice el texto.
- Los ejercicios de arrastre y teclado los probé con entrada real dentro del iframe.
- Probé el tema claro en todas las lecciones con demos propias y revisé las capturas.
- Las palabras incluyen parte del código visible; la prosa sola queda dentro de 3 500–8 000.

### 5. Problemas conocidos y cosas que no pude comprobar
Todo lo que no pude medir está matizado en el texto:
- La interfaz de DevTools no se puede probar en modo headless: lo explico con esquemas y aviso de que cambia entre versiones.
- Que el zoom cambie `devicePixelRatio`: cito MDN y el alumno lo comprueba en un playground.
- `code` en teclados AZERTY o españoles: sale de la especificación, no de una prueba.
- Que el ratón dé `pressure` 0,5: es lo que dice la especificación; los eventos inyectados por CDP daban 0. Con toque emulado sí medí 0,5.
- Datos documentados pero no medidos: la limitación tras 5 minutos en segundo plano, los 5 µs con aislamiento de origen, el comportamiento de `100vh` en móvil y la traducción a HLSL en Windows.
- Las cifras de rendimiento (recolector de basura, layout forzado) son de un M1 con Chrome 154 y el texto lo dice.

Hallazgo que corregí sobre la marcha: `scheduler.yield()` apenas deja pintar a Chrome (5 frames en 600 ms, frente a 37–46 con MessageChannel, rAF o setTimeout). El ejercicio 1.5.2 cede con rAF y el texto explica por qué no con `scheduler.yield()`.

Decisiones discutibles:
- Cuando el lead fijó la altura de los playgrounds, reajusté `data-altura`. Además uso `data-apilado` en los ejercicios que solo imprimen en consola, para que el editor se lea completo.
- El ejercicio 1.3.4 muestra su error solo al pulsar el botón. Si fallara al cargar, `verificar.mjs` lo marcaría como excepción aunque tenga `data-error-esperado`.
- Clase `.ancho` en las demos: no tiene efecto (ver punto 6); la dejé.

### 6. Sugerencias para componentes compartidos (no modifiqué ninguno)
- **`verificar.mjs`:**
  - `pageerror` recoge también las excepciones de los iframes aislados, porque comparten proceso con la página, y `data-error-esperado` no las filtra.
  - Los `console.warn` de los iframes cuentan como problema.
- **`curso.css`:**
  - `.leccion > * { max-width: 100% }` anula `.ancho`.
  - La regla `.leccion pre .ln` choca con cualquier clase `.ln` de una demo (a mí me rompió el visualizador y la renombré): convendría un prefijo.
- **`playground-js`:**
  - Su consola no entiende `%c` ni `console.table`.
  - Una opción para ocultar el resultado en ejercicios que solo usan la consola evitaría la franja mínima de 60 px.
- **Indexador del bestiario:** el `data-titulo` de m1-script-string lleva `&lt;/script&gt;`; conviene que `indexar.mjs` decodifique las entidades.

### 7. Glosario
- DOM → árbol de objetos que el navegador construye a partir del HTML; es lo que ven JS y CSS.
- Modo quirks → modo de compatibilidad (sin doctype) que imita errores antiguos de CSS; se consulta con `document.compatMode`.
- Mojibake → texto corrompido por decodificar con otra codificación (Ã± en vez de ñ).
- Nodo de texto → nodo del DOM con texto, incluidos los espacios entre etiquetas.
- Contenido de respaldo → hijos de un `<canvas>`; solo se muestran si el navegador no soporta canvas.
- Preload scanner → lector secundario que descarga recursos mientras el parser está bloqueado.
- `defer` / `async` → atributos de `<script src>`: ejecutar tras el parseo en orden, o en cuanto llega.
- Búfer de dibujo → rejilla de píxeles del canvas (atributos `width`/`height`), distinta de su caja CSS.
- Especificidad → trío (ids, clases, tipos) que decide qué regla CSS gana.
- Bloque contenedor → caja respecto a la que se colocan los elementos `absolute` o `fixed`.
- Contexto de apilamiento → grupo que se pinta como unidad; los `z-index` solo compiten dentro de él.
- `devicePixelRatio` → píxeles físicos por píxel CSS.
- Propiedad personalizada → variable CSS (`--x`); se hereda y no se interpola sin `@property`.
- TDZ → tramo en el que un `let`/`const`/`class` existe pero no se puede usar.
- NaN → «no es un número»; no es igual a nada y se propaga sin avisar.
- `x | 0` → truncado a entero de 32 bits con signo.
- Closure → función que conserva las variables del ámbito donde se creó.
- Aliasing → dos referencias al mismo objeto.
- Recolector de basura (GC) → libera la memoria sin referencias; sus pausas producen tirones.
- Colección viva → `HTMLCollection` que cambia mientras la recorres.
- Delegación → un único listener en el contenedor en lugar de uno por elemento.
- Listener pasivo → listener que no puede cancelar el evento; permite desplazar sin esperar a JS.
- Captura de puntero → `setPointerCapture`: los eventos siguen llegando al elemento aunque el puntero salga.
- `touch-action` → CSS que impide al navegador usar los gestos táctiles para desplazar o hacer zoom.
- `key` / `code` → carácter producido / tecla física.
- NDC → coordenadas normalizadas de −1 a 1 con la Y hacia arriba.
- Event loop → bucle: una tarea, todas las microtareas y un frame si toca.
- Microtarea → callback de promesa o `queueMicrotask`; se ejecuta cuando la pila queda vacía.
- Compositor → hilo que combina las capas; puede animar `transform`/`opacity` aunque el hilo principal esté bloqueado.
- Tarea larga → tarea de más de 50 ms.
- Layout forzado → layout síncrono provocado por leer una medida tras escribir un estilo.
- TypedArray → vista con tipo sobre un `ArrayBuffer`.
- Little-endian → orden de bytes que empieza por el menos significativo.
- Alineación → una vista de N bytes debe empezar en un múltiplo de N.
- Saturación → recorte al rango en lugar de dar la vuelta (`Uint8ClampedArray`).
- Stride / offset → bytes entre un vértice y el siguiente / byte donde empieza un atributo.
- AoS / SoA → array de estructuras frente a estructura de arrays.
- Origen → esquema + host + puerto.
- Origen opaco → origen «null» de las páginas `file://`.
- CORS → permiso que da un servidor para leer sus recursos desde otro origen.
- Canvas contaminado → canvas con píxeles de otro origen; no se pueden leer ni subir como textura.
- Caché heurística → caché basada en `Last-Modified` cuando no hay `Cache-Control`.
- Logpoint → breakpoint que escribe en la consola sin pausar.
- ANGLE → capa de Chrome que traduce WebGL/GLSL a Metal, Direct3D, etc.
