# Plan de continuación del curso (estado al 2026-10-06 — fin de la sesión 3)

La sesión 3 se paró a petición del dueño (pocos créditos) con una **parada ordenada**: cada agente dejó sus
ediciones completas (nada a medias) y escribió en su informe una sección final **«## Dónde me quedé (sesión 3)»**
con lo hecho y verificado, lo hecho sin verificar, lo pendiente en orden (archivo, línea, corrección propuesta) y
sus scripts. Esas secciones son la fuente de verdad para continuar; este archivo es el índice.

Rama: `claude/bold-cori-b4ers4` (commits «WIP sesión 3» = puntos de control; se fusiona en `master` sin
conflictos, avance rápido). La sesión 3 corrió en un **contenedor Linux sin GPU** (Chromium 141 + SwiftShader):
ver §2 y §4.

## 1. Estado

| Parte | Estado |
|---|---|
| 0–5 (m0–m5) | ✅ escritas + revisadas + coherencia · ✅ pendientes de coherencia de la sesión 2 resueltos (§3.3 B) · ✅ inventario de tiempos de GPU (§3.3 A) · ⚠️ cifras de GPU por re-medir en el M1 (§3.3) |
| 6 · GLSL (10) | ✅ revisadas a fondo · ✅ coherencia m6 terminada (sesión 3) · ⚠️ 6.5 sin pasar `--soluciones` aquí (el verificador agota el tiempo en SwiftShader) |
| 7 · JS + shaders (7 + proyecto) | ✅ las 7 lecciones, `m7kit.js` y `proyecto-final/` revisadas (sesión 3) · ⚠️ quedan pendientes concretos por lección (§3.1) · ❌ coherencia m7 sin hacer (§3.6) |
| A.1 Bestiario | ✅ 253 casos · ❌ faltan casos de m7 en el «Diagnóstico rápido» (§3.4) |
| A.2 · A.3 · A.5 | ✅ coherencia hecha (sesión 3) · ⚠️ últimas ediciones de texto sin re-verificar (ver §5) |
| A.4 Glosario | ❌ faltan términos de 7.x y 4 correcciones (§3.5) |
| Python m4 | ✅ GPU de juguete: pruebas OK y sus 22 PNG se regeneran idénticos byte a byte (sesión 3, Python 3.13) · moderngl/PyOpenGL no se pudieron ejecutar en el contenedor (sin driver OpenGL) |

`node herramientas/indexar.mjs` → 802 entradas, 253 casos · `node herramientas/enlaces.mjs` → 63 archivos,
3 321 enlaces internos, **0 rotos** (al cerrar la sesión 3).

## 2. Cómo arrancar la próxima sesión

1. Lee este archivo, `CLAUDE.md`, `herramientas/GUIA_AUTORES.md` y las reglas comunes de los agentes de la
   sesión 3: `herramientas/estado/workflows/sesion3-COMUN.md` (máquina, Chrome compartido, git prohibido a los
   agentes, archivos asignados, criterio). Reutilízalas en los encargos (cambia la parte de «Máquina» si vuelves al Mac).
2. Herramientas: `cd herramientas && npm install`. Luego el parche de cola de Chrome sobre
   `node_modules/puppeteer-core/lib/puppeteer/node/PuppeteerNode.js`:
   - **Mac del dueño** (1 Chrome, 8 min, regla de temperatura): `estado/PuppeteerNode.parcheado.js` (+ `vigilante.sh`).
   - **Contenedor Linux** (sesión 3): `estado/PuppeteerNode.parcheado-linux.js` (lock relativo a `herramientas/`,
     `CURSO_CHROME_TURNOS` turnos —por defecto 2—, 10 min por sesión).
   `verificar.mjs` y `movil.mjs` ya detectan el navegador: Chrome de macOS con ANGLE/Metal, o `$CHROME` /
   `/opt/pw-browsers/chromium` con SwiftShader y `--no-sandbox` si se corre como root.
3. **En Linux/SwiftShader no se mide GPU**: sirve para compilar, ejecutar, ver capturas y comprobar semántica de
   WebGL/GLSL/JS; NO para tiempos de GPU ni comportamientos de ANGLE/Metal (fast math, isnan y caché, mediump…).
   Todo lo marcado «pendiente de medir en el M1» exige el Mac del dueño.
4. Agentes: el dueño autorizó hasta 10 Opus 5.5 a la vez. En la sesión 3 se lanzaron con el tool Agent
   (general-purpose, en segundo plano), uno por archivo/lección, sin solapes de archivos. Encargos de la sesión 2
   en `herramientas/estado/workflows/` (curso-m7, curso-revision, curso-oleada2).
5. Informes: `herramientas/estado/informes/`. Scripts y resultados de experimentos: `herramientas/estado/lab/`
   (prefijo = id del agente: `rev-m7-N-`, `coh-m6-`, `coh-anexos-`, `pend-m0-m5-`).

## 3. Pasos pendientes (en orden)

### 3.0 Terminar lo que la parada dejó sin verificar (barato; hacerlo primero)
Detalle en cada «Dónde me quedé». Resumen (ver §5 para lo que ya se re-verificó al cerrar):
- 6.5 (`modulos/06-glsl/05-patrones.html`): pasar `verificar.mjs --soluciones` en una máquina donde no agote el
  tiempo (en el Mac) — un script propio no encontró errores en sus 17 componentes.
- 7.6: capturas en tema claro sin revisar; repetir `herramientas/estado/lab/rev-m7-6-css-recreada.mjs` (la caja
  hack de la etapa 3 dice que la animación CSS capturada pasa a `'idle'`; en Chromium 141 siguió `'paused'`) y
  corregir la frase; ajustar el script de QA `rev-m7-6-proyecto.mjs` (61 ✓ / 3 ✗ que parecen del script; uno sin
  investigar: capturas en pausa que difieren).
- 7.4: ejecutar `herramientas/estado/lab/rev-m7-4-capturas.mjs` y mirar las capturas.
- 7.5: repetir la prueba «sin `EXT_color_buffer_float`» tras la última guarda de los ejercicios 7.5.1 y 7.5.2.
- 7.7: el ejercicio 7.7.3 lleva `data-error-esperado` y el verificador lo marca «NO falló» porque su Chromium no
  tiene adaptador WebGPU (en el Mac sí falla como debe); ver propuesta en `revision-m7-7.md`.

### 3.1 Pendientes del módulo 7 (revisión hecha; quedan puntos concretos)
Lee la sección «Dónde me quedé» de `revision-m7-1.md` … `revision-m7-7.md`. Lo principal:
- 7.1: confirmar que la tabla DOM↔GL y los 177,5 ms de compilación se midieron en el M1.
- 7.3 (opcional): `borde = 0` en los modos 3 y 4 del catálogo cae en `smoothstep(e, e, x)` (indefinido) →
  `max(u_ancho, 1e-4)` o mínimo 0,002 en el deslizador; frase en el enunciado de 7.3.2. Lección de ~21 000
  palabras / 180 min: valorar partirla (overlay de página o línea de tiempo).
- 7.4: decidir si `m7-4-indices-uint16` (duplica `m4-indice-65535`) pasa a nota (id conservado, sin data-id, con
  enlace a 4.x); tabla del ε (filas de truncamiento no cuadran: 1,68° vs 3,2°); error de la normal de la bandera
  tras una hora (estimación); comprobar desde el Mac el enlace externo a codeflow.org.
- 7.5: las cifras de GPU «por separado» no tienen método documentado y las de 4 M no cuadran (9,5 + 35 ms vs
  56 ms) → medir con `lab/rev-m7-5-medir.html` en el M1 (incluida la anomalía 5,5 ms vs 8,4 ms del ejercicio 7.5.4).
- 7.6: `aria-live` en las diapositivas (valorar).
- `m7kit.js` (cambios de la sesión 3, compatibles): `destruir()` sin WebGL2 ya no lanza; `conDefines` con
  plantilla que empieza por salto de línea; `Calidad` admite `descartarMs` (250 por defecto); `M7.Puntero`
  solo reinicia el suavizado con el puntero dentro (`fresco && dentro`). Pendientes propuestos: `M7.Puntero`
  antes del primer evento (`x = −r.left` con `sx = 0` deja insomne un bucle bajo demanda si la caja no está en
  (0,0): propuesta en `revision-m7-3.md` (d)1 — si se cambia, retocar 7.3 l.~1426 y la solución de 7.3.5
  l.~2052); `crearApp` lee `bajoDemanda` cada frame sin documentarlo; bug de DPR emulado y filtro de 250 ms de
  `Calidad` (ver `revision-m7-6.md` (d)).

### 3.2 Pendientes de m6 y anexos A.2/A.3/A.5
- `coherencia-m6.md` («Dónde me quedé»): arreglos propuestos en archivos ajenos con texto concreto — A.1 l.122 y
  l.252; PCG sin `highp int` en 3.7; matizar en 5.5 el nivel de mipmap inexistente en `texelFetch`; enlazar
  bestiarios gemelos m6 ↔ m7. Pendiente de medir en el M1: 6.6 l.114 (256 niveles de gris también al recargar).
- `coherencia-anexos.md`: el mensaje de GLSL 1.00 de índice no constante (A.2) se cambió al medido aquí («Index
  expression must be constant»); estaba marcado como medido en Chrome 154 en el M1 → comprobar en el Mac.
  6.1 y 6.6 citan una caja de 6.5 con un título que no tiene. A.1 l.198: el ítem de `isnan` debería mencionar la
  caché de programas. URLs externas de A.5 sin comprobar (el proxy del contenedor bloqueaba todo dominio externo).

### 3.3 Medir en el M1 (requiere el Mac del dueño)
- `herramientas/estado/lab/pend-m0-m5-tiempos.mjs` (+ `.html`): re-mide con el método fiable las cifras de GPU de
  4.1, 4.2, 5.8, 5.9 y 5.10 y imprime lección / afirmación / cifra antigua / nueva. Su última fila mide algo
  nuevo: si `isnan` sigue detectando NaN cuando el programa sale de la caché; si NO, avisar en las recetas de «NaN
  en magenta». Inventario completo de cifras en `tiempos-y-pendientes-m0-m5.md` (A): ninguna de m2–m5 se midió
  con el método engañoso; las sin método documentado son coherentes.
- `lab/rev-m7-1-tiempos.mjs` (la cifra «7 veces más» de 5.10 l.444/l.559 que 7.1 citaba: el 16,7 ms parece un
  periodo de vsync), `lab/rev-m7-3-tiempos.mjs` (catálogo de 7.3 a 1440×900; la cifra se retiró del texto),
  `lab/rev-m7-4-tiempos.mjs` (solo pasó `node --check`: probar antes con `--rapido`; las tablas de 7.4 se
  presentan ahora como orientativas), `lab/rev-m7-5-medir.html`, y la tabla de capacidad de 7.6 (1,4 ms/MP)
  contra `__tiempo2` (`lab/rev-m6b-lab.mjs`).
- Frase propuesta para 5.10 tras el ejemplo 5.10.4 (en SwiftShader `pow` con base negativa devuelve
  `pow(|x|, y)` en vez de NaN): texto en `tiempos-y-pendientes-m0-m5.md`.

### 3.4 A.1 Bestiario
Añadir al «Diagnóstico rápido por síntoma» de `modulos/08-anexos/01-bestiario.html` los casos de m7: cada
`revision-m7-N.md` trae en su sección (e) la tabla data-id → síntoma (7.3: 8 casos; 7.4: 9; 7.5: 8; 7.7: 9; 7.1,
7.2 y 7.6 también). Algunos piden una subsección nueva (p. ej. «restos al principio/final de una transición»).
Después `node herramientas/indexar.mjs` y `node herramientas/enlaces.mjs` (0 rotos).

### 3.5 A.4 Glosario
Añadir los términos de m7 donde marca `<!-- M7-PENDIENTE -->` de `modulos/08-anexos/04-glosario.html`: listas
con definición y ancla en la sección (f) de cada `revision-m7-N.md` (7.1: 16 términos + la semántica de `#line`;
7.3: 22; 7.4: 24; 7.7: ~30; 7.2, 7.5, 7.6 también) y en la sección 7 de `informe-m7-3/6/7.md`. Enlazar 7.x desde
las entradas marcadas (`g-easing`, `g-muelle-amortiguado`, `g-stagger`, `g-tween`, `g-alfa-premultiplicado`,
`g-ping-pong`, `g-bucle-de-realimentacion`, `g-fbm`…). Correcciones: la entrada de Shadertoy dice que el modo del
curso simplifica `iMouse` (falso desde la sesión 2); dithering, fast math y comportamiento indefinido (texto
propuesto en `coherencia-m6.md` y `coherencia-anexos.md` §5).

### 3.6 Coherencia del módulo 7 (y m6 ↔ m7)
Como las coherencias de la sesión 2 (encargo `coh-web`/`coh-gpu` de `workflows/curso-revision-*.js` adaptado):
contradicciones, promesas, repeticiones, notación, enlaces; bestiarios gemelos m6 ↔ m7 (`coherencia-m6.md`).

### 3.7 Herramientas (propuestas de los revisores, sin aplicar)
- `verificar.mjs --capturas`: las capturas de elemento de playgrounds JS altos salen negras/en blanco («en pausa
  (fuera de pantalla)»): `ElementHandle.screenshot()` (captureBeyondViewport) hace que el IntersectionObserver
  destruya o pause el iframe. Propuesta concreta (que funcionó en el script del revisor): `page.screenshot` con
  `clip` en coordenadas del documento y `captureBeyondViewport: false`, esperando a que el estado diga
  «ejecutando» (`revision-m7-3.md` (d)3).
- `verificar.mjs`: comprobar el ✓/✗ de las pruebas de los ejercicios en consola (`revision-m7-5.md`) y saber
  tratar WebGPU ausente (`revision-m7-7.md`).
- Propuestas para `glkit.js`, la guía §5.6 (`tiempos-y-pendientes-m0-m5.md`) y `m7.css` (`revision-m7-7.md`).

### 3.8 Pasada final del lead
1. `node herramientas/indexar.mjs` y `node herramientas/enlaces.mjs`.
2. Verificar TODO en tandas de 3–4 archivos (`verificar.mjs … --soluciones`) + `movil.mjs` (390 px), en el Mac
   (GPU real) si es posible.
3. Revisión visual de varias lecciones en el Chrome del dueño (servir con `python3 -m http.server 8765 --bind
   127.0.0.1`).
4. Actualizar README.md e informar al dueño.

## 4. Hallazgos de la sesión 3 a recordar
- **SwiftShader ≠ M1** (Chromium 141, Linux): `pow` con base negativa devuelve `pow(|x|, y)` (no NaN);
  `texelFetch` con un nivel de mipmap inexistente se recorta al nivel existente más cercano (contra WebGL 2.0;
  fuera de rango en coordenadas sí da 0, e incompleta (0,0,0,1)); techo de la suma en `RGBA16F` 4,0 (redondea)
  frente a 2,0 en el M1 (trunca); `desynchronized` es `true` en Chromium/Linux y `false` en macOS; WebGPU funciona
  por SwiftShader en `http://localhost`, no en el Chromium del verificador.
- **Eventos de puntero** (Chromium 141 headless, entrada sintética por CDP): 2–4 `pointermove` por frame a 250 Hz
  y hasta 9 a ~650 Hz (no «como mucho uno por frame»); los coalescidos siempre suman todas las muestras;
  `pointermove` se despacha justo antes del rAF; `pointerdown`/`pointerup` no esperan; `pointerrawupdate`, uno por
  muestra. `wheel` en un canvas es cancelable; en `window`/`document`/`body` es pasivo por defecto.
- **Tiempos de GPU**: ninguna cifra de m2–m5 se midió con el método engañoso. En m7: 7.3 retiró su cifra; 7.4
  presenta sus tablas como orientativas (tandas de 8 dibujos seguidos); 7.5 tiene cifras sin método documentado.
- **Three.js r186.1** (descargado con `npm pack` y ejecutado en Chromium 141): todas las APIs que cita 7.7 existen
  y se comportan como dice el texto (cómo volver a bajarlo: `revision-m7-7.md`).
- `isnan` en playgrounds JS (WebGL crudo) de 5.10: ahora añaden un comentario distinto en cada ejecución para que
  el efecto se vea siempre; el texto explica por qué (caché de programas).
- Decisiones de la sesión 2 siguen vigentes (contexto WebGL2 compartido por los playgrounds GLSL, iframes sandbox
  en otro proceso en Chrome real, `#version 300 es` en la línea 1, comentario único con isnan/isinf en
  `Curso.glCompartido.compilar`).

## 5. Verificación al cerrar la sesión 3 (Chromium 141 + SwiftShader, Linux)
Re-verificado por el lead al cerrar (lo que los agentes dejaron sin verificar tras la parada):
- `verificar.mjs --soluciones` (oscuro): ✓ 7.4, A.2, A.3, A.5 y 5.10 (5/5 sin problemas).
- `verificar.mjs --soluciones --tema light`: ✓ 7.2 y A.1. ✗ 7.5: «Runtime.callFunctionOn timed out» (el verificador
  agota el tiempo en SwiftShader, como 6.5; 7.5 sí pasó en oscuro con `--soluciones` tras la última edición de su
  revisor). ✗ 7.7: solo problemas del entorno —sin adaptador WebGPU en el Chromium del verificador: el ejercicio
  7.7.3 «NO falló» y avisos «Failed to create WebGPU Context Provider»—; en oscuro pasaba igual salvo eso.
- `movil.mjs` (390 px): ✓ 7.2, 7.4, 7.7, A.2, A.3, A.5 (scrollWidth = 390).
- Por agente (tras su última edición): 7.1 ✓ (oscuro, claro, móvil, enlaces) · 7.3 ✓ (oscuro, claro, móvil,
  enlaces) · 7.6 ✓ (claro con todas las ediciones; móvil) · m6: ✓ 6.1, 6.3, 6.4, 6.6, 6.7, 6.8 (6.5 agota el
  tiempo aquí) · m0–m5: 16/16 ✓.
- `enlaces.mjs`: 63 archivos, 3 321 enlaces internos, 0 rotos. `indexar.mjs`: 802 entradas, 253 casos.
- Sin verificar en esta sesión (no se tocaron): el resto del curso pasó `verificar.mjs` al cerrar la sesión 2 en
  el M1; la verificación de base de la sesión 3 (SwiftShader) llegó a m0, m1 y 2.1–2.4: todo ✓.
