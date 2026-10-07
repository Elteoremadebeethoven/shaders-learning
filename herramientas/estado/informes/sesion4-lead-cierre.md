# Sesión 4 — cierre del lead tras la pausa (§3.1–§3.4 del plan)

Máquina: MacBook Air Apple M1 (sin ventilador), macOS 26, Chrome 154.0.8037.98, ANGLE/Metal. Todo lo pesado pasó por
`turnos.mjs` (como mucho 2 a la vez; las medidas, con `--exclusivo`). Vigilante en marcha durante toda la tanda.

## (a) Cambios y porqué

### 4.1 — la CPU «tardaba 2,3 s» por la rampa del reloj, no por headless
El agente m0-m6 midió 2,25–2,46 s en el playground «El mismo cálculo en tu CPU y en tu GPU» (el texto decía 1,0–1,5 s)
y sospechó de headless. Con el Mac en reposo:
- El mismo bucle en Node, en una página headless y en un iframe sandbox: 0,90–0,97 s (`s4-lead-cpu.mjs`).
- El código global frente a dentro de una función: igual (`s4-lead-cpu-global.mjs`); el srcdoc exacto del playground
  sobre about:blank, también lento (`s4-lead-cpu-leccion.mjs`, `s4-lead-cpu-biseccion.mjs`): no era el documento.
- Trozos seguidos de 4096 píxeles (`s4-lead-cpu-trozos.mjs`): tras unos segundos de reposo, el primer trozo va a 2,9 s
  (extrapolado) y baja en rampa (1,9 1,7 1,6 … 0,9) en ~15 trozos (~80 ms); sin reposo, 0,9 desde el primero.
- Solo Node, JIT caliente (`s4-lead-cpu-reposo.mjs`): tras 0,2 / 1 / 3 / 10 s de reposo, los primeros trozos van a
  2,1–3,0 y llegan a 0,9 tras ~100 ms de cálculo. **Es la CPU** (reloj / núcleo), no Chrome ni el JIT.
El playground medía 4096 píxeles (~4 ms) justo al pulsar «Ejecutar»: caía entero en la rampa.
Cambios:
- Playground: calentamiento `enCPU(131072)` (~0,15 s) y medida de 65 536 píxeles (~55 ms). Resultado (8 ejecuciones
  con 4 s de reposo entre ellas): CPU 0,90–1,19 s (bimodal: ~0,90 o ~1,19), GPU 6,1–7,8 ms, 116–195×.
- Párrafo: «entre 0,9 y 1,2 s y la GPU entre 6 y 8 ms: de 115 a 195 veces más rápida».
- Caja bestiario nueva `m4-cpu-en-frio` «Una medida corta de JavaScript sale el doble o el triple de lenta» (síntoma,
  causa con las cifras medidas, solución y cómo reproducirlo en el playground).

### getError: 37 µs con la CPU caliente, el doble en frío (no «según lo ocupado que esté el equipo»)
`s4-lead-geterror.mjs` (iframe sandbox, WebGL2): 1000 × getError en frío (tras 3 s de reposo) 59–78 ms; tras 250 ms de
cálculo, 36–38 ms; en bloques seguidos tras reposo, 72–73 / 39–40 / 36… El curso lo explicaba al revés.
- 4.1, playground «¿Cuánto tarda cada llamada de verdad?»: mide dos tandas e imprime la segunda; la primera aparte, con
  un aviso si es > 1,2× la segunda. En el playground: segunda 36,4–38,6 ms, primera 46,7–66,6 ms.
- 4.1 tabla: «≈ 0,037 ms cada uno … La primera tanda de 1000 tardó bastante más (47–67 ms) porque la CPU venía de
  reposo»; bestiario `m4-readpixels-lento`: «unos 37 µs cada uno … y el doble si la CPU viene de estar en reposo».
- 5.1 (l. ~1445) y A.3 (`getError()`): «el doble si la CPU viene de reposo», enlazando a `m4-cpu-en-frio`.
- A.4, entrada DVFS: añade la CPU y el enlace a 4.1.
- GUIA_AUTORES §5.6: viñeta «Medir tiempos de CPU (y de llamadas síncronas como getError)».

### 5.9 — tabla «¿Cuánto se ahorra?» medida con la demo, en un Chrome CON VENTANA
`s4-lead-instancing.mjs`: la demo «Comparativa: draw calls frente a instancing» tal cual (MAX subido a 4 000 000),
ventana 1440 × 900, lienzo 736 × 267 CSS = 1472 × 534 px (DPR 2). Con `VENTANA=1` lanza un Chrome con ventana (perfil
temporal de puppeteer; no el del dueño), porque en headless la demo marcaba 60 fps con 4 M de instancias (el bucle no
esperaba a la GPU; con un readPixels por frame: 73 ms). Resultados con ventana (fps · JS por frame):
20 000 llamadas 60 · 1,7–1,8 ms; 50 000 58–60 · 7→17 ms (sube según se llena la cola); 100 000 32–33 · 31 ms;
200 000 17–18 · 55 ms; 100 000 con mat4 en vez del vec2 32–34 · 30 ms (`… mat4`); 1 M instancias 48–52 · 0,07 ms;
4 M 13–14 · 0,04–0,07 ms. (Antes: 60/60/57/29/50/60/19.)
- Tabla, frase de condiciones (ventana, lienzo, MAX) y «Tres lecturas» (90 ns/llamada con 20 000, 275 ns con 200 000;
  mat4 = vec2; la GPU ya con 1 M baja a ~50 fps, con 4 M a 14; cómo pasar de 150 000 en la demo).
- Caja senior nueva «Los fps de una prueba automática pueden mentir». Corregida en la sesión 5 tras aislar la causa
  (`s4-lead-raf-iframe.mjs`, `s5-lead-raf-demo.mjs`): no es el iframe (una página mínima baja a 15 fps en la página,
  en un iframe y en un iframe sandbox, con DPR 1 o 2, con y sin alpha:false); el MISMO documento de la demo da
  «60 fps» dentro de la lección y 12 fps solo en una página vacía (headless): lo decide el resto de la lección.
  Con ventana, dentro de la lección: 13–14 fps.
- «subir 1 000 000 de instancias de 8 bytes … 0,64 ms» → «entre 0,8 y 1,1 ms … (la llamada a bufferSubData), sin bajar
  de 60 fps», medido con ventana (`s4-lead-subida.mjs`).

## (b) Mediciones (resumen: método → cifra antigua → nueva)
| Qué | Método | Antes | Ahora |
|---|---|---|---|
| 4.1 CPU, mismo cálculo | playground corregido, 8× con 4 s de reposo | 1,0–1,5 s | 0,90–1,19 s |
| 4.1 GPU, mismo cálculo | idem | 7–10 ms | 6,1–7,8 ms |
| getError | 1000 seguidas, CPU caliente / en frío | 30–60 µs | 36–38 µs / 59–78 µs |
| 5.9 tabla | demo, Chrome con ventana | ver arriba | ver arriba |
| 5.9 subir 8 MB/frame | página mínima, Chrome con ventana | 0,64 ms | 0,8–1,1 ms, 60 fps |

## (c) Verificación
- §3.1: `verificar-todo.mjs --movil --tanda 4 --solo '<los 18>'`: 18/18 sin problemas, 390 px sin desbordamiento (17,8 min).
- §3.3: `verificar-todo.mjs --tema light --sin-soluciones` en dos mitades a la vez (un turno cada una):
  33/33 y 29/29 sin problemas (17,8 y 21,1 min).
- Tras los cambios de §3.2: 4.1, 5.1, A.1, A.3, A.4 con `--movil` (oscuro, soluciones): 5/5; 5.9: ver abajo.
- `indexar.mjs`: 802 entradas, 253 casos de bestiario; `enlaces.mjs`: 3783 enlaces, 0 rotos.

## (d) Pendientes y decisiones discutibles
- §3.4 en el Chrome del dueño: la extensión Claude in Chrome no estaba conectada. Se hizo una revisión visual con
  capturas headless de página entera (ver abajo). La revisión en el Chrome del dueño sigue pendiente si se quiere.
- Lanzar un Chrome CON VENTANA desde puppeteer (perfil temporal) abre una ventana en la pantalla del dueño unos
  segundos; se hizo para las cifras de 5.9 porque headless daba fps falsos. Discutible pero necesario para medir fps.
- Por qué el resto de la lección hace que el rAF de headless deje de esperar a la GPU no está aclarado (la caja solo
  cuenta lo observado). Pestaña oculta: el JS va 2,4–3,0 s frente a 0,9–1,2 (`s5-lead-oculta.mjs`; pasado a opus-a).
- Bimodal 0,90 / 1,19 s de la CPU (sesión 5, `s4-lead-cpu-bimodal.mjs`): son los dos niveles del JIT de V8. Con
  `--js-flags=--no-maglev` siempre 0,90 s (TurboFan); con `--no-turbofan` siempre 1,20 s (Maglev). Pasado a opus-a.
- Otras cifras de fps del curso medidas en headless (7.1, 7.5, 7.6): sus autores las contrastaron con tiempos de GPU
  medidos aparte y cuadran; no se re-midieron.
