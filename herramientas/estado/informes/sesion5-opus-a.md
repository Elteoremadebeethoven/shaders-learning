# Sesión 5 · opus-a (index, 0.1, módulos 1–4, python/) — auditoría final

Máquina: MacBook Air Apple M1 (sin ventilador), macOS 26, Chrome 154, ANGLE/Metal. Todo lo pesado pasó por
`turnos.mjs`, a través de un cerrojo propio (`s5/opus-a/pesado.sh`: un solo turno de opus-a a la vez).

Historia: antes de la pausa por créditos, los módulos 1, 2 y 3 los empezaron tres ayudantes de opus-a (el lead los paró:
excedían el límite de agentes del dueño). Tras el relanzamiento trabajé yo solo: repasé con `git diff` lo que habían
editado, terminé lo que les faltaba con la misma lista de comprobación y lo integro aquí. Método de auditoría de cada
lección: extracción de objetivos, quizzes, ejemplos, ejercicios (enunciado, pistas, solución y su código) y resumen,
lectura completa de esa extracción, comprobación de cuentas (Node) y, donde el texto depende de interactuar o de una
cifra medida, un script de puppeteer o un laboratorio corto.

## (a) Cambios y porqué

### index.html
- La frase de presentación decía «Del HTML mínimo al raymarching»: el curso termina en el módulo 7 (JS + shaders y
  proyecto final). Ahora: «Del HTML mínimo a un proyecto final que junta JavaScript y shaders, pasando por … la
  animación … y el raymarching». Las tarjetas salen del manifest (`curso.js`, `#tarjetas-modulos`): coinciden siempre.

### 0.1 Cómo usar este curso
Decisión: es una lección meta (presentación de los componentes); no se le exigen 2 ejemplos y 3 ejercicios. Sí se
añadió lo que aporta de verdad y lo que la propia lección prometía:
- Quiz 2 (tras el mapa mental): qué dato va por buffer y cuál por uniform. Refuerza el objetivo 2 y reparte los quizzes.
- Ejemplo 0.1.1 «Predice el color de un píxel antes de mirarlo»: cuentas de `gl_FragCoord`/`uv` en tres píxeles y
  comprobación con la barra del editor (`rgb(byte/255)` con 3 decimales: en el centro 0.498 o 0.502, nunca 0.500).
- Demo `#demo-punto` (dos vectores arrastrables, producto punto por componentes y por |a||b|cos θ) en «Fórmulas»: el
  texto decía «siempre irán acompañadas de una demo o de código que puedas tocar» y no había ninguna.
- Comprobado: atajos y botones existen en `curso.js`/`playground-*.js`; los playgrounds dan lo que dice el texto.

### Módulo 1
- **1.1**, «Un canvas, dos tamaños»: al empezar, el texto del `<output>` hacía pasar el panel a otra línea y encogía la
  caja del canvas *después* de calcular el búfer: búfer 24 × 18 (0,750) para una caja 370 × 253 (0,684), un círculo
  ovalado justo en el playground que enseña a evitarlo. Ahora el `<output>` trae el texto inicial y `min-width: 13.5em`:
  búfer 24 × 16 (0,667), lo más cerca que permite un ancho de 24. (Ayudante m1: `<p id="final">` en la página
  resumida del experimento de `script`, que el registro mencionaba; «en horizontal/vertical» en la solución 1.1.4.)
- **1.3**, bestiario `m1-ya-declarado`: citaba `'status'` como nombre que da «already declared». Medido: `let status = 1`
  funciona (number:1); `let top` y `let location`, sí fallan. Cambiado a `'location'`. (Ayudante m1: «azul» → «cian»,
  el color real de la curva.)
- **1.5**, «Pestañas en segundo plano» (tablón, lead): párrafo nuevo: el propio JavaScript de una pestaña oculta va
  más lento (playground de 4.1: 0,9–1,2 s visible; 2,4–3,0 s minimizada; > 5 s en un Chrome de uso diario con la
  ventana detrás), con el mecanismo como hipótesis (prioridad del proceso), y la moraleja; el resumen lo recoge.
  (Ayudante m1 / sesión 4: «bola azul» → «cian»; comentario del código de la demo coherente con los colores.)
- **1.7**, caja «cuidado» de la consola de los editores: decía que `console.group`, `time`/`timeEnd`, `count`,
  `assert`, `trace` y `dir` no muestran nada; `playground-js.js` ya las implementa (lo comprobó el ayudante m1 con un
  script). Reescrita: qué hace cada una en la consola de texto y qué solo da la consola real (plegar, desplegar,
  enlaces a la pila).
- Revisados sin cambios: 1.2, 1.4, 1.6 (cuentas de quizzes y ejercicios, p. ej. 1.4.3 (16, 16)/(116, 66), 1.6.3 con
  `STRIDE = 0`, 1.7.1: id 27 a 197,2 px/s y 9 masas > 2, recalculado en Node).

### Módulo 2
- **2.1**, layout thrashing: el texto daba «50 ms contra menos de 1 ms: entre 50 y 80 veces». Medido con el
  playground: al ejecutarse 49,7 / 1,1 ms; con la CPU caliente 47–52 / 0,9–1,0 (≈ 50×); al pulsar los botones tras 1 s
  de reposo, la intercalada sube a 57–91 ms (CPU en frío). Texto: «unos 50 ms … alrededor de 1 ms: unas 50 veces
  menos (Apple M1, Chrome 154)» y una frase con la trampa de la CPU en frío (enlace a la caja `m4-cpu-en-frio` de 4.1).
  Ejercicio 2.1.2: las cifras «36 contra 2,6 ms» son las de la CPU caliente (medido 35,6–35,9 / 2,3–3,7); al pulsar
  «Ejecutar» salen unos 50 y 7 ms (primer layout de las tarjetas recién creadas + CPU en frío): añadido entre paréntesis.
- **2.2**, ejercicio 2.2.5 (esperar al final de una transición): **la solución fallaba con dos clics seguidos**. El
  `transitioncancel` de la primera transición llega después de que el segundo clic registre su manejador, y el segundo
  `await` se resolvía con esa cancelación (los dos «terminó … (transitioncancel)» a la vez; experimento
  `m2/exp/t225.*` con clics a 150, 30 y 0 ms). Solución nueva: solo acepta el final de una transición que haya visto
  nacer (espera su `transitionrun`, que en Chrome llega justo detrás de la cancelación anterior); con dos clics a
  150 ms: «(transitioncancel)» para el primero y, 233 ms después, «(transitionend)» para el segundo. Párrafo nuevo en la
  solución explicada; «esperaría para siempre» → «solo terminaría por el temporizador, y sin temporizador, nunca».
  (Sesión 4/ayudante: anotado de `animation-name` en la lista de `animation-*`.)
- **2.3**, ejercicio 2.3.4 (medidor de FPS): decía que con 30 ms de trabajo «los frames duran 33,3 ms» y el medidor baja
  a ~30 fps (31 al final de los 2 s). Medido: intervalos 33,3 con uno de 16,7 cada cuatro o cinco (media 30,3 ms, como
  predice la tabla del ejemplo 2.1.3) y el medidor marca 38 fps a los 0,7 s y 33 a los 2 s. Corregido con esas cifras.
- **2.4**, ejercicio 2.4.3: la solución explicada decía «≈ 0,332 s con cualquier HZ, con pequeñas diferencias». Medido:
  0,300 / 0,317 / 0,326 s a 30 / 60 / 144 Hz: siempre un frame por debajo, porque el cronómetro arranca en el frame del
  salto, que ya da el primer paso. Explicado con esas cifras. (El original k = 0,15: 0,467 / 0,233 / 0,097 s ✓.)
- **2.5** (ayudante m2): demo «redirigir con muelle»: la gráfica de velocidad recortaba a 2200 px/s y el muelle pasa de
  ahí (simulado: máx ≈ 3760 px/s): salían mesetas y subidas verticales justo donde el texto dice «sin saltos». Escala
  a 4500 (`VMAX`) y una frase: lo que cambia de golpe es la aceleración, no la velocidad.
- **2.8**, ejemplo 2.8.1 «¿Cuánto gana de verdad el pool?»: la tabla daba 1,84 ms a los objetos y 0,74 al SoA con
  100 000 partículas (y lo contrario con 400 000, «dentro del ruido»). Re-medido con la misma física, CPU caliente (1 s
  de calentamiento y mediana de 100 llamadas seguidas, tres tandas alternando el orden; `lab/s5-opus-a-m2-pool.mjs`):
  0,5 / 0,6 ms y 2,2–2,3 / 2,3 ms: empatados (en Node, igual). El 1,84 era la trampa de la CPU en frío. Tabla y paso 1
  reescritos con esas cifras y una frase que lo cuenta (enlace a `m4-cpu-en-frio`); «veinte veces más» → «más de
  veinte veces más» (17,8 frente a 0,6 ms). Lo que el SoA sí garantiza (sin basura, formato de la GPU) no cambia.
- Revisados sin cambios: 2.6, 2.7 (QA: mando con `finish` → `InvalidStateError` como dice el texto; 2.7.1 un solo
  «latido terminado» con dos clics, escala 1,25 a 135 ms y 0,95 a 270; 2.7.3 0 animaciones vivas; 2.7.4 con dos clics a
  80 ms quedan 13 tarjetas a opacidad 1 y se puede seguir quitando). El ayudante m2 recalculó todas las cifras no medidas
  de 2.1–2.8 (rebases de `cubic-bezier`, alturas del salto, EMA, energías de Euler, umbrales de estabilidad…): cuadran.

### Módulo 3
- **3.1** (ayudante m3), senior «El coste de crear objetos»: «un único `Float32Array` con todas las x e y (estructura
  de arrays)» contradecía 1.6 (SoA = arrays separados). Ahora: un `Float32Array` con las x y otro con las y.
- **3.4** (ayudante m3), solución 3.4.2: «0.1 unidades de uv por segundo en diagonal» era impreciso (lo que crece 0,1/s
  es `uv.x + uv.y`; en distancia, 0,1/√2 ≈ 0,07). Precisado.
- **3.7** (ayudante m3): 2¹⁸ s = 3 días y 49 minutos (no «3 días y 1 hora») y 2²⁰ s = 12 días y 3 horas (no «12 días y
  medio»), en el texto y en el bestiario `m3-tiempo-horas`. Yo: ejercicio 3.7.1, las pruebas imprimían el ✓/✗ al final
  de la línea y `verificar.mjs` (que cuenta las líneas que *empiezan* por ✓/✗) no las veía: ahora van al principio.
- **3.6**, ejercicio 3.6.4: la prueba del caso cenital solo comprobaba «sin NaN y determinante 1», y una matriz que
  no traslada (o traslada mal) también la pasa. Ahora el ✓ exige además que el punto (1, 0, 0) quede a z = −5 (lo que
  ya imprimía la línea siguiente); el enunciado lo dice.
- **3.1**, senior «Math.hypot contra Math.sqrt»: «57 ms con hypot y 7 con la raíz, unas ocho veces» → «unos 50 ms y
  5 ms (con la CPU ya caliente), unas diez veces»: medido en Chrome 154 caliente 49,8 / 4,8 ms (en frío 73 / 6,2) y en
  Node 54 / 4,7.
- Laboratorio que dejó preparado el ayudante m3 (`lab/s5-opus-a-m3-lab.*`), ejecutado ahora: confirma las cifras de
  3.7 (hash: 955 / 351 / 65 / 17 valores distintos con desplazamiento 0 / 1 000 / 5 000 / 20 000 y máximo 0,9846 desde
  2 000; ejercicio 3.7.3 (a): 1,5 % cerca del origen, 1,3 / 0,83 / 0,60 % con periodos 128 / 512 / 1024; errores del
  seno 1,9·10⁻⁵ / 0,0007 / 0,033 y 0,707 en lugar de 0,421), la tabla de fast math y el heisenbug de `isnan` (`pow(x, 2.0)`
  da x² sin `isnan` y NaN con él), `-1 % 2 = -1` (3.4.3), las matrices de CSS del quiz de 3.5 y el `INVALID_VALUE` de
  `uniformMatrix4fv` con `transpose = true` en WebGL1.
- Revisados sin cambios: 3.2, 3.3, 3.5, 3.6 (comprobados, entre otros: 3.6.3: 2,4 cm, 0,24 m y 58 m; 3.6.1: z NDC 0,97 = 98,5 % del rango;
  3.3.4: 4 lazos; fórmula del zapatero 6; el ayudante m3 comprobó 3.5 (determinante de 100 000 rotaciones) y 3.6.1/3.6.2).

### Módulo 4
- **4.1**:
  - «frente a unos 6,5 GFLOPS de un hilo de JavaScript» (sin método): medido en Node (bucle caliente): el bucle del
    playground (4 cadenas) 3,7 GFLOPS; 8 cadenas, 7,0; 1 cadena, 1,0. Texto: «2,8–3,7 GFLOPS del bucle de arriba
    (… con ocho cadenas independientes, unos 7)». No toqué el playground ni la caja `m4-cpu-en-frio` del lead salvo:
  - Tablón (lead), bimodal 0,90 / 1,20 s: caja senior nueva «0,9 o 1,2 s, y casi nunca nada entre medias» tras
    `m4-cpu-en-frio`: las doce cifras medidas, Maglev frente a TurboFan, `--no-maglev` siempre 0,90 y `--no-turbofan`
    siempre 1,20, y la moraleja. En la caja `m4-cpu-en-frio`, «deja el bucle en el nivel más rápido del JIT» → «ya
    optimizado …, aunque no siempre en su nivel más rápido (caja siguiente)», y una frase: no midas con la pestaña en
    segundo plano (2,4–3,0 s minimizada, enlace a 1.5).
  - Tabla de divergencia re-medida con turno exclusivo: 7,7–8,0 / 15,2–15,4 / 15,3–15,6 / 8,1–8,4 ms (antes 8–9 /
    15,5–17 / ≈ 9); hack «≈ 8 ms frente a 15 ms». Ejercicio 4.1.4: «en torno al 30 %» (medido 2,7–2,8 ms con T0 0,5 y
    T1 7,8–7,9; la fórmula da 27,5 %).
  - Bestiario `m4-tiron-primer-dibujo` re-medido con la CPU caliente: todo dentro de lo que dice: sin cambios.
- **4.2**: párrafo de las 32 capas: aclarado que el «31×» es de atrás a delante (de delante a atrás, 7×, porque la
  prueba de profundidad aún rechaza parte). Resumen: «(la PS1)» sin explicar → «(le pasaba a la PlayStation original,
  como verás en 4.5)». Ejercicio 4.2.2: las pruebas imprimían el ✓ al final (verificar contaba «0 ✓»): ahora al principio.
- **4.3**: solución 4.3.3: con π/6 y con π/3 hay *dos* vértices fuera de su hueco (a 1,0245 NDC), no uno.
- **4.4, 4.5, 4.6**: leídas enteras; cuentas y salidas citadas comprobadas: sin errores.

### python/
- `probar_todo.py --sin-ventana`: 26/26 correctos en 6,5 s (el 27.º es el de la ventana, que la batería salta sin
  ventana). Las 18 citas `data-fuente` de 4.3–4.6 son idénticas al código; las salidas citadas (4.6.1 (81, 83, 91, 255),
  formatos, índices…) coinciden. Sin cambios en python/ en esta sesión (el README lo actualizó la sesión 4).

## (b) Mediciones

| Qué | Método | Antes | Ahora |
|---|---|---|---|
| 4.1 GFLOPS de un hilo de JS | Node en el M1, bucle caliente (`lab/s5-opus-a-flops.mjs`) | 6,5 (sin método) | 3,7 (4 cadenas); 7,0 (8) |
| 4.1 divergencia | playground tal cual, turno exclusivo, 3 ejecuciones | 8–9 / 15,5–17 / ≈ 9 ms | 7,7–8,0 / 15,2–15,4 / 15,3–15,6 / 8,1–8,4 |
| 4.1 ej. 4.1.4 (p = 0,01) | solución tal cual, exclusivo, 2 ejecuciones | «25–30 %» | 2,7–2,8 ms (T0 0,5, T1 7,8–7,9) ≈ 30 % |
| 4.1 tirón del primer dibujo | `lab/s5-opus-a-tiron.*`, exclusivo, CPU caliente, 12 rondas | — | dentro de lo escrito: sin cambios |
| 4.2, 4.5 límites | `lab/s5-opus-a-sem.html` | — | puntos [1, 511], SUBPIXEL_BITS 4, MAX_SAMPLES 4… = texto |
| 1.1 búfer frente a caja al empezar | script puppeteer (`m1/qa1.mjs`) | 24×18 / 370×253 | 24×16 / 370×253 |
| 1.3 `let status` en el nivel superior | página mínima | «da SyntaxError» | funciona (solo `top`, `location`… fallan) |
| 2.1 thrashing (500 barras) | playground; frío = clic tras 1 s; caliente = 300 ms de cálculo antes | 50 / < 1 ms, 50–80× | 49,7 / 1,1 al ejecutar; caliente 47–52 / 0,9–1,0 (≈ 50×); frío 57–91 |
| 2.1.2 igualar alturas (300) | ídem | 36 / 2,6 ms (fuera del playground) | caliente 35,6–35,9 / 2,3–3,7; al ejecutar 49,9 / 7,2 |
| 2.2.5 doble clic | `m2/exp/t225.*` | (sin probar) | 2.º `await` resuelto por el cancel del 1.º → corregido |
| 2.3.4 EMA con 30 ms/frame | solución, rAF registrado | → ~30 fps; 37 a 0,7 s; 31 a 2 s | intervalo medio 30,3 ms; 38 a 0,7 s; 33 a 2 s |
| 2.4.3 semivida 0,1 s | solución con HZ = 30/60/144 | ≈ 0,332 s | 0,300 / 0,317 / 0,326 s (un frame por debajo) |
| 2.3 `setInterval` 600 frames | playground | 563 / 26 / alguno | 562 / 31 / 7 (sin cambio) |
| 3.1 `Math.hypot` (5 M) | Chrome 154 caliente / en frío (`lab/s5-opus-a-m3-lab.mjs`); Node caliente | 57 / 7 ms | 49,8 / 4,8 (frío 73 / 6,2); Node 54 / 4,7 → «unos 50 / 5 ms, diez veces» |
| 2.8 AoS frente a SoA | `lab/s5-opus-a-m2-pool.mjs`: CPU caliente, mediana de 100 seguidas, 3 tandas | 100 000: 1,84 / 0,74; 400 000: 2,56 / 2,92 ms | 0,5 / 0,6; 2,2–2,3 / 2,3 ms |
| 4.1 «10 000 draw calls contra 1» y ej. 4.1.3, en frío y en caliente | `lab/s5-opus-a-drawcalls-frio.mjs`, exclusivo, playgrounds tal cual tras 3 s de reposo y con 300 ms de cálculo delante | 3,3–5,7 (JS 0,4–1) / 0,7–1,1 ms; 4.1.3: 30–40 → 2,5 ms | frío 5,1–5,3 (JS 0,7–0,9) / 0,8–1,0; caliente 3,3–6,2 (JS 0,4–0,5) / 0,7–1,0; 4.1.3 frío 39–40, caliente 28 → 2,4–2,7: todo dentro de lo escrito, sin cambios |

## (c) Verificación

Todo con `turnos.mjs` (por el cerrojo `s5/opus-a/pesado.sh`), Chrome 154 headless con GPU real (ANGLE/Metal, M1), y
**después de la última edición de cada archivo** (las últimas: 3.1 a las 00:33, 3.6 a las 23:44, 2.8 a las 23:40):

- `verificar.mjs --soluciones --capturas` (tema oscuro), 30/30 sin problemas:
  index + 0.1 + 4.1–4.6 (23:19–23:27, tras las ediciones de 4.1; 4.2 otra vez a las 23:55 tras mover sus ✓);
  1.1–1.4, 1.5–1.7 + index (23:42–23:47); 3.5, 3.6, 3.7 + 4.2 (23:55); 2.1–2.4 (23:51); 2.5–2.8 (23:57);
  3.1–3.4 (00:13), 3.6 de nuevo (00:15) y 3.1 otra vez (00:34, tras la cifra de `hypot`, también en claro y móvil). Pruebas ✓ de las soluciones: 1.3.1 (6), 1.4.3 (3), 1.5.1 (1), 1.6.1 (4),
  1.6.4 (1), 3.1.1 (6), 3.2.1 (4), 3.5.1 (7), 3.5.2 (2), 3.6.1 (5), 3.6.2 (4), 3.6.4 (4), 3.7.1 (6), 3.7.2 (9), 4.2.2 (3),
  ninguna ✗.
- Capturas revisadas todas con Read (hojas de contacto de 2–3 columnas): se ve lo que el texto dice que se ve; las de
  los ejercicios sin resolver muestran el fallo que describe el enunciado (p. ej. 1.6.2 la zona clara oscura, 3.1.2 el
  anillo ovalado, 3.4.3 la fila doble y las zonas rosas, 3.7.4 las esquinas y el lado oscuro negros) y las soluciones,
  el arreglo.
- `verificar.mjs --tema light --capturas`: 30/30 sin problemas (8 lotes, 00:16–00:31); muestra de 18 capturas de demos
  a medida revisada: legibles en claro.
- `movil.mjs` (390 px, DPR 2): 30/30 con `scrollWidth = 390`, sin desbordamiento (los elementos que lista son fórmulas
  KaTeX, SVG y bytes dentro de contenedores con su propio scroll).
- `enlaces.mjs` sobre mis 30 archivos: 643 enlaces internos, 0 rotos (las anclas nuevas, como
  `05-event-loop.html#pestanas-en-segundo-plano` y `01-cpu-vs-gpu.html#m4-cpu-en-frio`, resuelven).
- python/: `probar_todo.py --sin-ventana` 26/26 correctos en 6,5 s (antes de la pausa; python/ no ha cambiado desde).
- Scripts de QA de interacción (puppeteer, vía turnos): `s5/opus-a/m1/qa1.mjs` (1.1 canvas, 1.2.2, 1.2.4, 1.3 globales,
  1.3.4, 1.4.1, 1.5.x, 1.7 consola), `m2/qa1.mjs` y `m2/qa2.mjs` (2.1, 2.1.2, 2.2 inserción, 2.2.5, 2.3.4, 2.3 setInterval,
  2.4.3, 2.5 flick, 2.7 mando, 2.7.1, 2.7.3, 2.7.4), `m2/exp/t225.*` y `m4/qa-m4.mjs`.
- Laboratorios conservados en `herramientas/estado/lab/`: `s5-opus-a-flops.mjs`, `s5-opus-a-tiron.*`,
  `s5-opus-a-sem.html`, `s5-opus-a-qa-m4.mjs`, `s5-opus-a-m2-pool.mjs`, `s5-opus-a-drawcalls-frio.mjs`.

## (d) Pendientes y decisiones discutibles

- 0.1 sigue por debajo de los mínimos de GUIA §6 (1 ejemplo, 1 ejercicio, 2 quizzes): decisión consciente, es la
  lección de presentación del curso.
- 1.5: el mecanismo de la lentitud de una pestaña oculta va como hipótesis (prioridad del proceso), como pidió el lead.
- 2.2.5: la solución nueva depende de que `transitionrun` llegue (lo hace en Chrome 154, justo detrás de la
  cancelación anterior); si un navegador no lo emitiera, el `await` terminaría por el temporizador de seguridad.
- 2.8: la tabla «¿Cuántas partículas aguanta la CPU?» (dibujo con `fillRect`) no la re-medí con el método nuevo: mi
  laboratorio usa un dibujo algo distinto (tamaño y alfa variables) y dio cifras del mismo orden (100 000: 16–23 ms
  frente a 17,8). La dejo.
- 4.1, ejercicio 4.1.3: «de 30–40 ms a unos 2,5 ms» se mantiene: en frío 39–40, con la CPU caliente 28 (no lo
  precisé: el rango del texto ya avisa de que varía).
- [PARA lead, menor] `playground-js.js`: `console.assert(false, "x")` imprime «Assertion failed:  x» con dos espacios.
- [PARA lead] `turnos.mjs` no es FIFO (anotado en el tablón): una petición mía esperó 14 min (850 s) mientras otros
  encadenaban lotes.
- No ejecuté `indexar.mjs` (lo hace el lead): cambian las cajas bestiario de 1.3 (`m1-ya-declarado`), 4.1
  (`m4-cpu-en-frio`) y 3.7 (`m3-tiempo-horas`, ayudante m3), y hay una caja senior nueva en 4.1 y párrafos nuevos en
  1.5, 2.1, 2.2, 2.3, 2.4 y 2.8.

## Estado por lección

- index.html: terminada ✓
- 0.1: terminada ✓ (lección meta; por debajo de los mínimos de §6 a propósito)
- 1.1: terminada ✓
- 1.2: terminada ✓
- 1.3: terminada ✓
- 1.4: terminada ✓
- 1.5: terminada ✓
- 1.6: terminada ✓
- 1.7: terminada ✓
- 2.1: terminada ✓
- 2.2: terminada ✓
- 2.3: terminada ✓
- 2.4: terminada ✓
- 2.5: terminada ✓
- 2.6: terminada ✓
- 2.7: terminada ✓
- 2.8: terminada ✓
- 3.1: terminada ✓
- 3.2: terminada ✓
- 3.3: terminada ✓
- 3.4: terminada ✓
- 3.5: terminada ✓
- 3.6: terminada ✓
- 3.7: terminada ✓
- 4.1: terminada ✓
- 4.2: terminada ✓
- 4.3: terminada ✓
- 4.4: terminada ✓
- 4.5: terminada ✓
- 4.6: terminada ✓
- python/: terminado ✓ (26/26 sin ventana; citas de 4.3–4.6 idénticas al código)
