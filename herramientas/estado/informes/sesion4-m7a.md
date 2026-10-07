# Sesión 4 · agente m7a — 7.1, 7.2, 7.3, `m7kit.js`, `m7.css`, `l73-kit.js`

Máquina: MacBook Air Apple M1, macOS, Chrome 154.0.8037.98 headless con GPU real (ANGLE/Metal), lanzado siempre
a través de `herramientas/turnos.mjs`. Scripts de esta sesión: `herramientas/estado/lab/s4-m7a-*`.
Copia de los archivos originales (antes de mis cambios): `<SCRATCH>/agentes/m7a/` (y `git diff`).

Informe terminado (todas las ediciones verificadas después de la última).

## (a) Cambios hechos y porqué

### `recursos/m7kit.js` (compatible con las 7 lecciones)

1. **Regla común de `Calidad.medir`** (la misma que m7b aplica a `proyecto-final/motor.js`; texto exacto en el
   tablón). Nuevo método `filtrar(intervaloMs)` que `medir` usa al empezar:
   - intervalo 0 o no positivo (primer frame tras una pausa): se ignora del todo (ni cuenta ni toca la racha);
   - ≤ `descartarMs` (250 por defecto): cuenta tal cual y pone la racha (`this.largos`) a 0;
   - \> `descartarMs`: el 1.º y el 2.º seguidos no cuentan (tirón suelto, vuelta de una suspensión); del 3.º en
     adelante cuentan **recortados a `descartarMs`** (equipo a < 4 fps: hay que bajar la resolución). El recorte basta
     para saber que vamos muy por encima del presupuesto y evita que un intervalo enorme arrastre la media decenas de frames.
   - Decisión discutible: el 0 no rompe la racha (la regla del encargo decía «≤ `descartarMs` pone el contador a 0»;
     un 0 no es una medida, así que lo ignoro del todo; avisado en el tablón a m7b con el código exacto).
   - Por qué un método aparte: el ejercicio 7.1.5 sobrescribe `medir` entero; con `filtrar` su solución hereda la
     regla con una línea (`const iv = this.filtrar(intervaloMs); if (!iv) return false;`).
2. **`app.fps` con intervalos largos** (revision-m7-1 (b)4/(c)4): la misma racha que `filtrar` (variable `largos` del
   cierre de `crearApp`), pero **sin recortar**: son los fps que ve el usuario, aunque sean 2. Antes, por debajo de
   4 fps la cifra se quedaba congelada (7.5 muestra `app.fps` en demos que pueden caer tan bajo).
3. **DPR emulado** en `tamañoObjetivo()`: si `|dispAncho/anchoCSS − devicePixelRatio| > 0,05·dpr` (y `anchoCSS > 0`),
   se usa `anchoCSS × dpr` (la misma corrección que `motor.js`). Medido (ver (b)).
4. **`M7.Puntero` antes del primer evento** (revision-m7-3 (d)1): mientras `!visto`, `sx = x`, `sy = y` (antes `sx`
   se quedaba en 0 y `x` valía −left: un bucle bajo demanda que pregunta «¿persigue el suavizado?» no se dormía si la
   caja no estaba en (0,0)). Ninguna lección dependía del 0 anterior (7.4/7.5 usan `sx` solo con `dentro`/`pulsado`/`visto`).
5. **`bajoDemanda` se lee en cada frame**: documentado en la cabecera de `crearApp` y en la nota del bucle anotado de 7.1.
6. **`fallar()` es definitivo y libera la GPU**: se informa una sola vez (`if (fallado || destruido) return`), llama a
   `o.fallar` con el contexto aún vivo (para la telemetría) y después `destruir()` (en un `finally`): desconecta
   `ResizeObserver`, `IntersectionObserver`, `visibilitychange` y los listeners de contexto, y `loseContext()`.
   `destruir()` es idempotente (`if (destruido) return`).
7. **Contexto que no vuelve**: nueva opción `esperaRestauracionMs` (por defecto, sin tope: así no cambia nada en las
   lecciones, p. ej. el 7.1.3 que pierde y recupera a mano). Si el contexto perdido no vuelve en ese tiempo,
   `fallar("el contexto no volvió en N ms")`; al restaurarse se cancela el temporizador.

### 7.1 `01-arquitectura.html`
- Anotados que copian el kit, igualados al código nuevo: `tamañoObjetivo` (comprobación del DPR emulado, con nota
  medida y enlace al bestiario `m7-6-dpr-emulado` de 7.6), bucle `frame` (racha de `largos` para `app.fps`; nota de
  `bajoDemanda` leído en cada frame), `Calidad` (`filtrar` + `medir`, notas renumeradas). «La forma de una app»: opción
  `esperaRestauracionMs` y comentario de `fallar`. Tabla «Cuando algo falla»: fila del contexto que no vuelve → la opción.
- Ejemplo 7.1.5: `if (app) app.destruir()` (antes `if (app && app.gl)`) y párrafo nuevo: tras `fallar`, `crearApp` se
  destruye sola (después de llamar a tu `fallar`, para que aún puedas leer el contexto para la telemetría).
- Ejercicio 7.1.5 (solución): usa `this.filtrar(intervaloMs)` en vez de copiar el filtro (mismas cifras: 4 cambios, 117 lentos).
- Re-medido en el M1 (ver (b)): tabla DOM↔GL de «Un único bucle» (0,3/1,2/2,7 px → 0,2/1,0/2,7; máximos 0,6/1,8/8,6 →
  0,4/1,4/6,6; texto «8,6 px son 20 ms» → «6,6 px son 15 ms», y el resumen); compilación «177,5 ms, 10 frames» → «unos
  85 ms con un shader de ~400 líneas (135 ms con el doble; 147 ms la primera en frío), listo en 8–9 frames sondeando».
- **Tabla de «Presupuesto de rendimiento»** (aviso de m0-m6 en el tablón: los 104 ms de GPU por dibujo no cabían en los
  66,7 ms de la tabla): re-medida con el shader real de 7.1.7 a 1440 × 900: con 1500 iteraciones los intervalos son
  100–117 / 50 y 67 alternos / 16,7 y 33,3 alternos (≈ 10 / 17 / 40 fps), y la tabla añade la columna de GPU por dibujo
  (104 / 58 / 26 ms, medidas de m0-m6 con el método de pasadas). Texto nuevo: el intervalo medio ≈ el tiempo de GPU,
  cuantizado a múltiplos de 16,7 ms. El relato de la calidad adaptativa (1440×900 → 543×339 en 4,2 s, oscilación cada
  3 s con 639×399) **cuadra con 1500 iteraciones, no con 2500** como decía el texto (fps de 10, no de 14, a 60): corregido;
  añadido lo que pasa con 2500 (baja a 462×289 en 6,3 s y se queda a ~54 fps: la media cae en la zona intermedia).

### 7.2 `02-interaccion.html`
- Anotado de `Puntero.actualizar`: `if (!this.visto) { this.sx = this.x; this.sy = this.y; return; }` y nota que explica
  por qué (enlace a la sección de rendimiento de 7.3).
- Ejemplo 7.2.2: **puntero fantasma** hasta el primer evento (un ocho a velocidad variable; velocidad = derivada exacta),
  que entra por el mismo camino que el real (estado → `aGL` y `k`); línea de información «demostración (mueve el puntero…)».
  Captura: estela visible y alargada en el cruce; con el ratón real, el halo salta bajo el cursor.
- Caja senior de coalescencia **reescrita con lo medido en el M1** (ver (b)): en Chrome 154/M1 los `pointermove` no se
  retuvieron hasta el rAF (se despacharon según llegaban y solo se agruparon los que esperaban con el hilo ocupado); en
  Chromium 141/Linux sí. Se presentan los dos comportamientos y la conclusión («ni uno por frame ni uno por muestra»).
- Cifras confirmadas y atribuidas a «Chrome 154, Apple M1»: `getBoundingClientRect` 0,4 → **0,5 µs** (texto y resumen);
  `scroll` 0–0,1 ms antes del rAF y mismo `scrollY` (12/12); canvas fijo 25 px detrás (22–27) en todos los frames de un
  gesto táctil sintético a 1500 px/s (antes «grabando la pantalla»), canvas dentro del contenido: 0;
  `MAX_FRAGMENT_UNIFORM_VECTORS` = 1024.

### 7.3 `03-transiciones-shader.html`
- Catálogo 7.3.3: `w = max(w, 1e-4);` al empezar `cortinilla` y `radial` (borde 0 ⇒ `smoothstep(e, e, x)` indefinido), y
  los anotados «Cortinilla con borde suave» y «Revelados radiales» iguales (línea nueva con su nota; notas renumeradas).
  Solución de 7.3.1: «Es lo que hacen la cortinilla y el revelado radial del catálogo».
- Enunciado de 7.3.2: el código de partida cumple el contrato por casualidad; al estirar el ruido (el `clamp` deja
  píxeles en 1 exacto) o añadir el fuego, deja de cumplirlo. Comprobado: partida 0 píxeles magenta; solo estirando,
  812 de 81 000 (360×225).
- `M7.Puntero` antes del primer evento: ejemplo 7.3.8 y solución de 7.3.5 ya no necesitan `puntero.visto &&` en
  «¿persigue?» (quitado) y sus dos textos explican el comportamiento nuevo (y por qué el kit lo hace así).
- Párrafo «Unos 46 ms de CPU por segundo…»: cifra de GPU con hardware y método (ver (b)).

### `recursos/m7.css`
- Borrada `table.m7-equivalencias` (grep en todo el curso: solo la usaban los informes; 7.7 usa `l77-equiv`).

## (b) Mediciones

### Comportamiento del kit nuevo (`lab/s4-m7a-kit.mjs`, página de prueba con el kit viejo y el nuevo)
Apple M1, Chrome 154, ANGLE/Metal, headless:
- DPR emulado (`page.setViewport({deviceScaleFactor})` = `Emulation.setDeviceMetricsOverride`), canvas 390×300 px CSS:
  dsf 1 → observador 390×300, viejo y nuevo 390×300 · dsf 2 → `devicePixelRatio` 2 pero observador **390×300**;
  viejo 390×300, **nuevo 780×600** · dsf 3 → observador 390×300; con `dprMax` 2: viejo **260×200**, nuevo **780×600**;
  con `dprMax` 3: viejo 390×300, nuevo 1170×900.
- DPR «real» (`--force-device-scale-factor=2`, sin emulación): observador **780×600**, viejo = nuevo = 780×600 (la
  comprobación no se dispara).
- `fallar`: shader que no compila → `o.fallar` llamado 1 vez con el contexto vivo (`isContextLost()` false, `VERSION`
  legible); después `isContextLost()` true, `activo` false; `destruir()` dos veces sin excepción. Excepción en `dibujar`
  → 1 llamada, 1 `console.error`, 0 frames después, contexto perdido. Sin WebGL2 → motivo «sin WebGL2 (Canvas has an
  existing context of a different type)», `destruir()` sin excepción. Kit viejo: contexto vivo tras fallar.
- `esperaRestauracionMs: 400` sin restaurar → `fallar("el contexto no volvió en 400 ms")`; con 1000 y restauración a
  los 300 ms → sin fallo, `iniciar` × 2, la app sigue (18 frames en 300 ms).
- Frames de 300 ms (bucle ocupado en `dibujar`) durante 6 s (20 frames): nuevo `fps` 3,94 y bajando (media aún
  convergiendo, `msFrame` 254), `calidad.escala` 1 → 0,444 (5 cambios); viejo `fps` 0 (nunca se actualizó) y escala 1.
- `M7.Puntero` en una caja a (120, 90), bajo demanda, preguntando «¿persigue?» sin mirar `visto`: nuevo `x = sx = −120`,
  0 frames en 0,5 s (duerme); viejo `x = −120`, `sx = 0`, 30 frames en 0,5 s (insomne).
- `bajoDemanda` en caliente: continuo 25 frames/0,4 s → `o.bajoDemanda = true` 0 → `false` sin despertar 0 →
  `pedirFrame()` 25.
- Node (`lab/s4-m7a-calidad.cjs`, sin Chrome): `filtrar` da [16,7, 0, 0, 0, 16,7, 0, 0, 250, 250, 0, 250, 16,7] para
  [16,7, 0, 300, 400, 16,7, 300, 300, 300, 1000, 0, 500, 16,7]; un equipo a 3 fps baja a la escala mínima; tirones sueltos
  de 2 s en un equipo a 60 fps: 0 cambios; ejercicio 7.1.5 (partida y solución leídas del HTML): 16 cambios / 213 frames
  lentos (base) y 4 / 117 con la solución, como dice la lección.

### 7.1 en el M1 (Chrome 154, ANGLE/Metal, headless; turno `--exclusivo`)
- DOM↔GL (`lab/s4-m7a-71.mjs` + `s4-m7a-71-domgl.html`): círculo WebGL y cuadrado del DOM en la misma circunferencia a
  440 px/s (DOM desplazado 170 px para no taparlo), 40 capturas a intervalos aleatorios (40–200 ms) por modo, dos tandas
  (`s4-m7a-71-resultado1/2.json`). Mediana / máximo (80 capturas): mismo rAF y tiempo del frame 0,2 / 0,4 px; mismo rAF
  con `performance.now()` 1,0 / 1,4 px; `setInterval(…,16)` 2,7 / 6,6 px (medianas por tanda 1,8 y 3,2). Antes:
  0,3/0,6 · 1,2/1,8 · 2,7/8,6 (origen sin documentar).
- Compilación (`s4-m7a-71-compilar.html`): fragment shader de N funciones fbm con constantes aleatorias (ni caché de
  Chrome ni de Metal). `LINK_STATUS` enseguida: 114 líneas 49 ms (117 ms la primera del navegador, en frío), 214 líneas
  60 ms, 414 líneas 85/87/85 ms (147 ms en frío), 814 líneas 135 ms. Sondeando `COMPLETION_STATUS_KHR` por frame:
  listo en 6–9 frames, consulta ≤ 0,1 ms (resolución de `performance.now()`), intervalo máximo 17,1–18,6 ms, 0 frames
  lentos. Antes: 177,5 ms y 10 frames (shader sin documentar).
- Presupuesto (`s4-m7a-71c.mjs` + `s4-m7a-71c-presupuesto.html`, shader de 7.1.7, 1440 × 900, un dibujo por frame, 45
  frames): 800 it. → 50 / 33,3 / 16,7 ms de mediana a escala 1 / 0,75 / 0,5; 1500 it. → 100–117 / 50 y 67 / 17 y 33 ms
  (alternos). Calidad adaptativa (`min 0.25, max 1`) 20 s: con 1500 it., 1440×900 → 543×339 en 4,16 s (cambios a 1,38 ·
  2,09 · 2,61 · 3,14 · 3,65 · 4,16 s), fps 10 → 60, y cada ~3,1 s sube a 639×399 y vuelve en 0,6–0,7 s; con 2500 it.,
  → 462×289 a los 6,3 s y se queda a 51–56 fps. GPU por dibujo (m0-m6, método de pasadas): 104 / 58 / 26 ms.

### 7.2 en el M1 (`lab/s4-m7a-72.mjs`, `s4-m7a-72b.mjs`; páginas `s4-m7a-72-*.html`; `s4-m7a-72-resultado.json`)
- Coalescencia (entrada sintética `Input.dispatchMouseEvent`): 250 Hz → 38–40 `pointermove` para 40 muestras, 2–4 por
  frame, mediana 3,0–3,5 ms antes del rAF (máx. 12–14); ~700 Hz (120 en 163–172 ms) → 110–116, hasta 13 por frame,
  mediana 7 ms antes; de golpe (60) → 29 y 39. Hilo ocupado (rAF que trabaja 8 / 12 ms): 250 Hz 28 / 22 eventos;
  1000 Hz 58 / 34. Coalescidos = muestras siempre. `pointerrawupdate`: 40/40 a 250 Hz (hasta 17,1 ms antes del rAF),
  117/120 a ~700 Hz. Discretos: `pointerdown/up` a 0,4–15,7 ms del rAF, el `pointermove` en cola justo antes (0,0–0,2 ms).
- Scroll con rueda y ratón quieto: 12 eventos, 0–0,1 ms antes del rAF, mismo `scrollY` 12/12.
- `getBoundingClientRect()` con el layout limpio: 0,505 µs/llamada (200 000 llamadas).
- `MAX_FRAGMENT_UNIFORM_VECTORS` = `MAX_VERTEX_UNIFORM_VECTORS` = 1024 («ANGLE Metal Renderer: Apple M1»).
- Canvas fijo frente a scroll: `Input.synthesizeScrollGesture` táctil a 1500 px/s, `Page.startScreencast` (124 frames):
  paso de scroll mediano 25,07 px/frame; canvas `fixed` 25 px detrás (22–27) en todos los frames a velocidad constante
  (0 al empezar y al parar); canvas `absolute` en el contenido: 0 en los 126 frames.

### 7.3 en el M1 (`lab/s4-m7a-73-tiempos.mjs`, copia de `rev-m7-3-tiempos.mjs` + pasada de referencia; turno `--exclusivo`)
- 1440 × 900, u_progreso 0,5, borde 0,08, un dibujo por pasada (dos FBO alternos con clear), `readPixels` al final de
  cada tanda de 10, mediana de 7 tandas; dos ejecuciones (`s4-m7a-73-tiempos-resultado.txt`): referencia (shader trivial)
  0,17 ms · fundido sRGB 0,34/0,36 · en luz 0,41/0,40 · por negro 0,22/0,23 · cortinilla 0,25/0,26 · radial 0,29/0,29 ·
  **disolución 0,58/0,58** · desplazamiento 0,36/0,38 · persianas 0,20/0,23 ms. Método engañoso (10 dibujos sobre el
  mismo FBO): 0,08–0,12 ms. Antes: cifra retirada en la sesión 3 («0,07–1,3 ms», método engañoso).

## (c) Verificación final

Todo después de la última edición de mis archivos (Apple M1, Chrome 154, ANGLE/Metal; cada Chrome con `turnos.mjs`):
- `node verificar.mjs 01-arquitectura.html 02-interaccion.html 03-transiciones-shader.html --soluciones --capturas …`
  (oscuro): **3/3 sin problemas** (7.1: js=13, ejemplos 7, ejercicios 5, quiz 4, 5 soluciones; pruebas 7.1.2 7 ✓,
  7.1.3 1 ✓, 7.1.4 5 ✓, 7.1.5 2 ✓ · 7.2: js=10, 5 soluciones · 7.3: glsl=4, js=9, 5 soluciones; 7.3.3 6 ✓, 7.3.4 9 ✓, 7.3.5 2 ✓).
- Lo mismo con `--tema light`: **3/3 sin problemas** (mismas pruebas ✓).
- `node movil.mjs` (390 px): 7.1, 7.2 y 7.3 `scrollWidth = 390 / 390` (en 7.3 lista elementos KaTeX más anchos dentro
  de contenedores con scroll propio, como antes; la página no desborda).
- `node enlaces.mjs` de las tres: 148 enlaces internos, **0 rotos**.
- Compatibilidad del kit (solo lectura): `verificar.mjs --soluciones` de **7.4, 7.5, 7.6 y 7.7: 4/4 sin problemas** (7.4.1 7 ✓,
  7.4.3 1 ✓; 7.5.1–7.5.4 1 ✓ cada una; 7.6.2 3 ✓, 7.6.3 3 ✓, 7.6.4 1 ✓; 7.7.1 6 ✓, 7.7.2 5 ✓, 7.7.3 1 ✓, 7.7.4 4 ✓).
- Capturas miradas: las de `verificar.mjs` de 7.2.2 (estela del fantasma), 7.3.3 (disolución), 7.1.3 y 7.1.5 (claro) y las
  del QA propio `lab/s4-m7a-qa.mjs` (`page.screenshot` con `clip`): 7.2.2 fantasma y con ratón real (el halo salta bajo el
  cursor, 835 px CSS/s), 7.1.5 en los cuatro escenarios (alternativa con el motivo; contexto perdido tras fallar; «normal»
  vuelve a dibujar), 7.1.3 perder/recuperar (`iniciar() #2`, el reloj no avanza perdido), 7.1.7 (60 fps, escala 1 con
  coste 200), 7.3.8 (continuo 60 frames/s; bajo demanda 0 frames/s y total 2 sin ningún evento), solución de 7.3.5 (las
  4 pruebas ✓) y 7.3.2 (partida 0 px magenta; solo estirando el ruido, 812).
- `node --check m7kit.js` y `node lab/s4-m7a-calidad.cjs` (Node): todo ✓.

## (d) Pendientes y decisiones discutibles

Decisiones:
1. Regla de `filtrar`: el intervalo 0 no corta la racha de largos (el encargo decía «≤ descartarMs pone el contador a 0»).
   Avisado a m7b en el tablón con el código exacto; `motor.js` ya lleva el mismo `filtrar` (con `if (!(intervaloMs > 0))
   return 0;`) y la misma racha para los fps de `crearBucle`.
2. `app.fps` cuenta la racha de largos **sin recortar** (Calidad sí recorta): son los fps reales; el anotado de 7.1 lo explica.
3. `fallar` destruye la app siempre (no es opcional): una app que falló no vuelve a dibujar, y `destruir()` es idempotente,
   así que ninguna lección se rompe (7.1.5 llama a `destruir()` después sin problema; 7.5 escribe el motivo en su panel).
   Consecuencia visible: tras un fallo en `dibujar`, el lienzo queda transparente (antes, congelado en el último frame);
   todas las lecciones retiran el canvas o ponen una alternativa en `fallar`.
4. `esperaRestauracionMs` sin valor por defecto (esperar siempre): con un tope por defecto, el 7.1.3 («perder» y, cuando
   quieras, «recuperar») fallaría si el alumno tarda.
5. 7.1: las cifras antiguas (DOM↔GL, 177,5 ms, tabla de presupuesto) no tenían método documentado; las sustituí por las
   medidas aquí con método descrito. La tabla de presupuesto ahora es la del shader del ejemplo 7.1.7 (reproducible por el
   alumno con su deslizador), con los tiempos de GPU de m0-m6. El relato de la oscilación cuadra con 1500 iteraciones,
   no con 2500 (corregido).
6. 7.2: la alineación de `pointermove` con el frame **no se reproduce en el M1** (Chrome 154 headless, entrada sintética);
   sí en Chromium 141/Linux. No he podido probar con un ratón real (prohibido usar el Chrome del dueño), así que la caja
   presenta los dos comportamientos medidos sin afirmar cuál es el «normal».
7. No he partido 7.3 (encargo). No he tocado `l73-kit.js` (no depende de m7kit; sin pendientes).

Pendiente para otros (en el tablón):
- m7b: bestiario `m7-6-dpr-emulado` de 7.6 — ya aplicado por m7b («`M7.crearApp` de 7.1 hace la misma comprobación»,
  con el ancla de 7.1 correcta); y la regla común en `motor.js`, también aplicada.
- anexos: glosario `g-khr-parallel` (177,5 ms → ~85 ms, 10 → 8–9 frames) y `g-eventos-alineados-con-el-frame` /
  `g-eventos-coalescidos` (la alineación depende del sistema; texto propuesto).
- lead: PLAN §4 «Eventos de puntero» (resultado del M1).
- Opcional, sin hacer: una frase en la solución de 7.1.5 que explique que `filtrar` hereda la regla de pausas y tirones (el
  código ya lo dice en un comentario); probar la alineación de `pointermove` con un ratón real en el Chrome del dueño.

Scripts de esta sesión (`herramientas/estado/lab/`): `s4-m7a-kit.mjs` (+ `s4-m7a-kit.html`, carga el kit viejo desde el
scratch: cambia esa ruta por una copia de `git show HEAD:modulos/07-integracion/recursos/m7kit.js`), `s4-m7a-calidad.cjs`,
`s4-m7a-71.mjs` (+ `s4-m7a-71-domgl.html`, `s4-m7a-71-compilar.html`, resultados 1 y 2), `s4-m7a-71c.mjs`
(+ `s4-m7a-71c-presupuesto.html`, `s4-m7a-71c-resultado.json`), `s4-m7a-72.mjs` / `s4-m7a-72b.mjs` (+ páginas
`s4-m7a-72-*.html`: copiarlas a un directorio con los nombres `eventos.html`, `eventos-sinraw.html`, `scrollgl.html`,
`eventos-ocupado.html`), `s4-m7a-73-tiempos.mjs` (+ resultado), `s4-m7a-qa.mjs`.
