# Plan de continuación del curso (estado al 2026-10-07 — CURSO TERMINADO: el dueño empieza a estudiarlo)

Las sesiones 4 y 5 corrieron en el **Mac del dueño (Apple M1, Chrome 154.0.8037.98, ANGLE/Metal)**. La sesión 5 fue
la auditoría de aceptación final («que todo funcione y que el proyecto esté terminado al 100 %»): informe del lead
`herramientas/estado/informes/sesion5-lead-cierre.md`; informes de los agentes `sesion5-{opus-a,opus-b,sonnet}.md`.
No queda ningún proceso del curso en marcha (vigilante y servidor local parados, turnos libres, cola vacía). Todo
está en `master` (commit «Sesiones 4 y 5: medidas en el M1 y auditoría de aceptación final», fusionado por avance
rápido; sin subir a GitHub).

**Lo siguiente es estudiar.** El dueño empieza el curso (README → «Cómo estudiarlo»). Si al estudiar encuentra un
error o algo confuso, el procedimiento de una sesión de mantenimiento es:
1. Leer este plan, `CLAUDE.md` y lo pertinente de `herramientas/GUIA_AUTORES.md`; reproducir el problema
   (servir con `python3 -m http.server 8765 --bind 127.0.0.1` si se usa la extensión Claude in Chrome, que no abre
   `file://`; o `verificar.mjs` headless).
2. Corregir la lección (cifras nuevas: medidas en el M1, con método; GUIA §5.6 tiene las trampas de medida).
3. `node herramientas/indexar.mjs`, `node herramientas/enlaces.mjs` y, con turno,
   `node herramientas/turnos.mjs --agente lead --motivo "…" -- node herramientas/verificar.mjs <lección> --soluciones`
   (y `--tema light`, `movil.mjs` si cambió el aspecto). Arrancar antes el vigilante (§2).
4. Commit solo si el dueño lo pide.

## 0. Sesión 5 (2026-10-06/07) — resumen
- Agentes: 2 Opus 5.5 + 1 Sonnet 5.5 xhigh EN TOTAL (límite del dueño; **prohibido que los agentes creen subagentes,
  forks o Workflow**: en la sesión 5 opus-a y opus-b lo hicieron y el lead los paró). `opus-a` = index, m0–m4,
  python/ · `opus-b` = m6, m7, proyecto-final/, recursos/ · `sonnet` = m5, anexos. Reglas:
  `herramientas/estado/workflows/sesion5-COMUN.md`; tablón `herramientas/estado/informes/sesion5-tablon.md`.
- Pausa por créditos (20:05) y reanudación (22:50): primero se verificaron los 36 archivos que los agentes dejaron
  sin re-verificar (34/34 + QA 67 ✓), luego se relanzaron los 3 agentes con el encargo original +
  `scratchpad/s5/relanzamiento-comun.txt`. Los tres terminaron: **las 61 lecciones, la portada, python/ y el
  proyecto final, «terminada ✓»**, cada archivo verificado tras su última edición.
- Errores reales corregidos en la sesión 5: lista en `sesion5-lead-cierre.md` (a) (2.2.5, 1.7, 1.3, 1.1, 3.6.4, 2.8,
  `motor.js`, 6.9, 5.4, 5.5, 5.10, A.2…), con cifras re-medidas en caliente.
- Herramientas (lead): `verificar.mjs` ya no da por terminadas las pruebas ✓/✗ de una solución hasta recibir el mínimo
  que se deduce de su código (antes se cortaba tras 1,5 s de silencio: 7.3.5 y 7.6.4 se contaban a medias);
  `turnos.mjs` reparte por orden de llegada (cola); `playground-js.js` `console.assert` sin doble espacio.
- Verificación final (§5): todo sin problemas.

## 1. Estado

| Parte | Estado |
|---|---|
| 0–6 (m0–m6) | ✅ escritas, revisadas, coherencia hecha · ✅ cifras «pendientes de medir en el M1» medidas y aplicadas (sesión 4) · ✅ pasada final en el M1: 55/55 sin problemas (con soluciones y a 390 px) · ✅ retoques del lead re-verificados (18/18) · ✅ 4.1, 5.1 y 5.9 re-medidas con el Mac en reposo (§4) · ✅ tema claro 62/62 |
| 7 · JS + shaders (7 + proyecto) | ✅ pendientes de la sesión 3 cerrados (m7a, m7b, anexos) · ✅ coherencia m7 hecha (coh-m7-web, coh-m7-gpu) · ✅ cada lección verificada tras su última edición (oscuro + soluciones, claro, 390 px) · ✅ QA de `proyecto-final/index.html`: 67 ✓ |
| A.1 Bestiario | ✅ 253 casos (nuevo: `m4-cpu-en-frio`), diagnóstico rápido con los casos de m7 · ✅ re-verificado |
| A.2 · A.3 · A.5 | ✅ medidas del M1 aplicadas; 73 URL externas comprobadas · ✅ re-verificados |
| A.4 Glosario | ✅ 604 términos + 114 remisiones (DVFS amplía a la CPU) · ✅ re-verificado |
| Python m4 | ✅ `probar_todo.py` 27/27 en el Mac (moderngl, PyOpenGL y ventana glfw incluidos) · sesión 5: 26/26 sin ventana |
| Herramientas | ✅ portero de procesos pesados (por orden de llegada desde la sesión 5), verificador mejorado, `verificar-todo.mjs` (§2) |
| **Sesión 5: auditoría de aceptación** | ✅ 61 lecciones + portada + python/ + proyecto final «terminada ✓» (informes `sesion5-*.md`) · ✅ verificación final 62/62 oscuro con soluciones y a 390 px, 62/62 claro, QA del proyecto 67 ✓, revisión animada en el Chrome del dueño |

`node herramientas/indexar.mjs` → 802 entradas, 253 casos · `node herramientas/enlaces.mjs` → 63 archivos,
3 794 enlaces internos, **0 rotos** (al terminar la sesión 5).

## 2. Cómo arrancar la próxima sesión

1. Lee este archivo, `CLAUDE.md`, `herramientas/GUIA_AUTORES.md` (§5.6 y §7 actualizados en la sesión 4) y las
   reglas comunes de los agentes: `herramientas/estado/workflows/sesion5-COMUN.md` (la última versión).
2. **Procesos pesados (regla del dueño): como mucho DOS a la vez, y los agentes piden permiso.** El permiso se pide
   al portero `herramientas/turnos.mjs` (anota PIDE/CONCEDE/LIBERA en `herramientas/.turnos.log`):
   `node herramientas/turnos.mjs --agente <id> --motivo "…" -- <comando>` (por orden de llegada desde la sesión 5:
   cola `herramientas/.chrome-turno-cola/`); las medidas de tiempos de GPU con
   `--exclusivo` (los dos turnos). El `puppeteer-core` de `herramientas/node_modules` está parcheado para pasar por
   el mismo portero (si falta `node_modules`: `cd herramientas && npm install` y copiar
   `estado/PuppeteerNode.parcheado.js` sobre `node_modules/puppeteer-core/lib/puppeteer/node/PuppeteerNode.js`).
   Arrancar el vigilante (cierra un 3.er Chrome headless): `nohup herramientas/vigilante.sh >/dev/null 2>&1 & disown`;
   pararlo al terminar: `pkill -f vigilante.sh`. En la sesión 4: 122 peticiones, ninguna saltó la cola.
3. Agentes: los fija el dueño en cada sesión (sesión 4: 4 Opus 5.5 xhigh; sesión 5: 2 Opus + 1 Sonnet xhigh) y
   **cuentan todos: los agentes no pueden crear subagentes, forks ni Workflow**. Se lanzan con el tool Agent (en
   segundo plano), uno por grupo de archivos, sin solapes, coordinados por un **tablón**
   (`herramientas/estado/informes/sesionN-tablon.md`, entradas `[PARA <agente|lead>]`).
4. Verificación: `verificar.mjs` (soluciones con pruebas ✓/✗, capturas sin pantallas negras, WebGPU opcional),
   `movil.mjs`, `enlaces.mjs` y `verificar-todo.mjs [--movil] [--tema light] [--solo "regex"]` (todo el curso por
   tandas, un turno). Informes de la sesión 4: `herramientas/estado/informes/sesion4-*.md`; scripts:
   `herramientas/estado/lab/s4-*`.

## 3. Lo que falta (en orden)

§3.1–§3.4 se hicieron en la sesión 4 (detalle en `sesion4-lead-cierre.md`); la sesión 5 hizo la auditoría final. Solo
quedan las decisiones del dueño (§3.5) y el commit (§3.6).

### 3.1 ✅ Re-verificar lo que el lead tocó tras la pasada final
`verificar-todo.mjs --movil --tanda 4 --solo '<los 18>'`: 18/18 sin problemas, 390 px sin desbordamiento.

### 3.2 ✅ Medir con el Mac en reposo
- 4.1 «El mismo cálculo»: los 2,3 s no eran de headless sino de **la rampa del reloj de la CPU** (el playground medía
  4 ms justo al pulsar «Ejecutar»). Playground corregido (calentar ~0,15 s, medir ~55 ms): CPU 0,90–1,19 s, GPU
  6,1–7,8 ms. Caja bestiario nueva `m4-cpu-en-frio`.
- `getError`: 37 µs con la CPU caliente, 60–78 µs en frío (4.1, 5.1, A.3 y A.4 corregidos; el playground imprime las
  dos tandas).
- 5.9: tabla medida con la demo en un Chrome CON VENTANA (en headless, dentro del iframe del playground, los fps de
  4 M de instancias salían a 60). Caja senior nueva «Los fps de una prueba automática pueden mentir».

### 3.3 ✅ Pasada en tema claro
`verificar-todo.mjs --tema light --sin-soluciones` en dos mitades a la vez: 33/33 y 29/29 sin problemas.

### 3.4 ✅ Revisión visual
Sesión 4: capturas headless de página entera. Sesión 5: en el Chrome del dueño con la extensión Claude in Chrome
(servido con `python3 -m http.server 8765 --bind 127.0.0.1`, porque la extensión no abre `file://`; turno
`--exclusivo` mientras dura): portada, m0–m7, A.1, A.4 sin errores de consola; con la ventana visible, lo animado del
proyecto final, 6.9, 1.1 y 4.1.

### 3.5 Decisiones del dueño (no bloquean)
- ✅ DECIDIDO (2026-10-07): 7.3 (~21 000 palabras) y 7.7 (~16 000) se quedan enteras: no se parten ni se recortan
  temas.
- Glosario de 604 términos: si sobra, lo más prescindible es lo de HTML/CSS/JS básico (`informe-glosario.md` §5).
- Decimales: m3, 6.1–6.5 y las chuletas escriben los de la prosa con punto (como el código); el resto, con coma.
  Coherente dentro de cada lección; unificarlo serían cientos de cifras.
- 0.1 queda por debajo de los mínimos de GUIA §6 a propósito (lección de presentación). 6.9: la cámara nueva de
  «Esferas infinitas» (en el cruce de dos pasillos) cambia la composición por defecto.
- Decisiones discutibles de cada agente: sección (d) de cada `sesion4-*.md` y `sesion5-*.md` (p. ej. `fallar()` de m7kit libera la
  GPU y deja el lienzo transparente; un intervalo 0 no corta la racha de `Calidad.filtrar`; hipótesis marcadas como
  «lo más probable» en 7.4 y 7.6).

### 3.6 Cierre
✅ Commit de las sesiones 4 y 5 hecho y fusionado en `master` (2026-10-07). Sin subir a GitHub (si el dueño lo pide:
`git push`; la sesión 3 entró por el PR #1).

## 4. Hallazgos de la sesión 4 a recordar (medidos en el M1, Chrome 154, ANGLE/Metal)
- **isnan y la caché**: la versión que sale de la caché de programas tiene fast math (mod: 0 → 2 071 fallos; hash
  del seno: 2 069 → 17 valores; `0.0/0.0` da 1), pero `isnan`/`isinf` siguen detectando los NaN reales
  (16 384/16 384, también al recargar, en otra pestaña y al relanzar Chrome): las vistas «NaN en magenta» sirven.
  `mod(-(id+1000.0)*7.0, 7.0)` sin nada en medio nunca falla (el fast math lo simplifica).
- **Tiempos de GPU**: el `readPixels` final debe leer del framebuffer de la ÚLTIMA pasada (leer del canvas no espera
  a lo escrito en un FBO o en transform feedback: el laboratorio de 7.5 de la sesión 3 estaba mal por eso). El método
  de capacidad da costes un 40 % bajos si «cabe» se decide con la mediana de los intervalos: hay que usar la media.
  4.2: 32 capas con `discard` 56 ms frente a 1,8 ms una capa por pasada (31×). 5.10: 4,0 / 15,7 / 35,3 ms (crece como
  los píxeles; el antiguo 16,7 era un periodo de vsync).
- **`texelFetch`**: fuera de rango y nivel de mipmap inexistente (también negativo) → (0, 0, 0, 0). Con una textura
  incompleta → (0, 0, 0, 1) SOLO en el texel (0, 0) y (0, 0, 0, 0) en los demás; `textureSize` = 1 × 1 (lo más
  probable: ANGLE la sustituye por una 1 × 1 negra opaca). La especificación pide (0, 0, 0, 1) en todos.
- **`pow` con base negativa**: NaN en el M1 (con y sin fast math); SwiftShader da `pow(|x|, y)`.
- **`#version`**: espacios o un `/* */` delante en la misma línea compilan; una línea vacía o `// …` antes →
  «must occur on the first line»; código antes → «must occur before anything else…».
- **Eventos de puntero** (Chrome 154 headless, entrada sintética por CDP): en el M1 los `pointermove` NO se alinean
  con el frame con el hilo principal libre (38–40 eventos para 40 muestras a 250 Hz, mediana 3 ms antes del rAF;
  110–116 para 120 a ~700 Hz, hasta 13 por frame); solo se agrupan los que esperan con el hilo ocupado (rAF de 8 ms:
  58 de 120; de 12 ms: 34). En Chromium 141/Linux sí se alineaban (2–4 por frame). Se mantiene: coalescidos = todas
  las muestras; discretos no esperan; `pointerrawupdate` uno por muestra; `scroll` justo antes del rAF. Canvas fijo:
  25 px detrás durante un gesto táctil a 1 500 px/s; dentro del contenido, 0. 7.2 cuenta los dos comportamientos.
- **WebGPU** (Chrome 154, M1): adaptador `apple`/`metal-3`, `bgra8unorm`; `createRenderPipelineAsync` ≈ 9 ms con
  un shader nuevo, 52 ms el primero del dispositivo, < 1 ms con el shader en caché; `finish()` de WebGL no espera.
- **GLSL ES 1.00, índice no constante**: M1 «Index expression can only contain const or loop symbols»; Chromium 141
  con SwiftShader «Index expression must be constant».
- **WAAPI**: con `animation: none`, la animación CSS capturada pasa a `'idle'`; escribir su `currentTime` la resucita.
- **Puppeteer**: `captureBeyondViewport: true` (por defecto en `ElementHandle.screenshot`) dispara `resize`,
  `pointerout` y `pointerleave` en la página y duerme los playgrounds JS (capturas negras): `verificar.mjs` ya
  captura con `clip` y sin él.
- m7kit (sesión 4): `Calidad.filtrar` (intervalos > `descartarMs` sueltos se descartan; desde el 3.º seguido cuentan
  recortados), corrección del DPR emulado, `Puntero` sin barrido antes del primer evento, `fallar()` libera la GPU,
  opción `esperaRestauracionMs`. `motor.js` aplica la misma regla de calidad.
- Decisiones anteriores siguen vigentes (contexto WebGL2 compartido por los playgrounds GLSL, iframes sandbox en otro
  proceso en Chrome real, `#version 300 es` en la línea 1, comentario único con isnan/isinf en
  `Curso.glCompartido.compilar`).

- **CPU en frío** (sesión 4, lead): tras ≥ 0,2 s de reposo, los primeros ~100 ms de cálculo van 2–3× más lentos (rampa;
  medido en Node, sin navegador). Afecta a toda medida corta de CPU y a `getError` (37 → 60–78 µs). GUIA §5.6.
- **Headless y fps**: la demo de 5.9 dentro del iframe del playground marcaba 60 fps con 4 M de instancias (73 ms de
  GPU por frame); la misma carga en una página sin iframe sí baja a 14–15 fps en headless. Los fps de lo limitado por
  la GPU se miden con ventana (`VENTANA=1 … s4-lead-instancing.mjs`) o con una espera explícita (`readPixels`).

## 5. Verificación al terminar la sesión 5 (2026-10-07, tras la última edición de cualquier archivo)
- `indexar.mjs` → 802 entradas, 253 casos · `enlaces.mjs` → 3 794 enlaces internos, 0 rotos.
- `verificar-todo.mjs --movil` (oscuro, con soluciones, verificador nuevo): m5–m8 32/32 y portada + m0–m4 30/30,
  **62/62 sin problemas** y a 390 px sin desbordamiento.
- `verificar-todo.mjs --tema light --sin-soluciones`: 32/32 + 30/30, **62/62 sin problemas**.
- QA de `proyecto-final/index.html` (`estado/lab/s4-m7b-76-proyecto.mjs`): 67 ✓.
- Chrome del dueño (extensión): proyecto final, 6.9, 1.1, 4.1 y A.4 como dice el texto, sin errores de consola.

## 5b. Verificación al terminar la sesión 4
- Tras la pausa: §3.1 18/18; tema claro 62/62; tras los cambios de §3.2, 4.1, 5.1, 5.9, A.1, A.3 y A.4 verificados
  (oscuro con soluciones, claro donde tocaba, 390 px): sin problemas.
- `verificar-todo.mjs --movil --solo "^index|^modulos/0[0-6]-|^modulos/08-anexos"` (oscuro, con soluciones):
  **55/55 sin problemas** y 390 px sin desbordamiento (35,6 min). Después el lead retocó los archivos de §3.1.
- Módulo 7: cada agente verificó tras su última edición (oscuro con soluciones y pruebas ✓, claro, 390 px):
  7.1–7.3 y 7.6 (coh-m7-web), 7.4, 7.5 y 7.7 (coh-m7-gpu); `proyecto-final/index.html` con su QA propia (m7b): 67 ✓.
- `enlaces.mjs`: 0 rotos; `indexar.mjs` ejecutado al final.
