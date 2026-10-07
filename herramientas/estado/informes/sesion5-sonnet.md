# Sesión 5 · agente `sonnet` (m5: 5.1–5.10, anexos A.1–A.5)

Máquina: Mac del dueño (Apple M1, sin ventilador), Chrome 154.0.8037.98, ANGLE/Metal. Todo lo pesado pasó por `turnos.mjs`.
Trabajé solo (sin subagentes). La sesión se cortó por la pausa de créditos a mitad: este informe junta lo hecho antes
(reconstruido de mis notas, de `git diff` y de los laboratorios `s5-sonnet-lab1/lab2/qa1`) y la segunda pasada, entera,
posterior a la pausa.

Método, por lección: (1) lectura entera de la lección con ojo crítico (cifras, enunciado ↔ solución ↔ pruebas, quizzes,
referencias cruzadas, `data-l` de cada código anotado: 135 anotaciones, ninguna fuera de rango ni descolocada);
(2) `verificar.mjs --soluciones --capturas` y revisión de las capturas; (3) cada afirmación técnica dudosa, comprobada en este
Chrome con un laboratorio corto (lista en (b)); (4) las dos trampas de medida (CPU en frío, fps de la GPU) aplicadas a
cada cifra de tiempo de m5.

## (a) Cambios y porqué

### Antes de la pausa (de mis notas y del diff)
- **5.1** — `getParameter(VIEWPORT)` ×2000: «1,2 ms» → «menos de 1 ms (0,5 µs cada una)» y 0,07 µs para valores simples
  (lab1, CPU caliente). Playground «¿Cuánto cuesta getError?»: calienta ~0,2 s con trabajo de verdad antes de medir y
  enseña aparte la primera tanda (trampa de la CPU en frío, GUIA §5.6). El texto de «el doble si la CPU viene de reposo»
  es del lead.
- **5.3** — Resumen: «los componentes que faltan se rellenan con (0, 0, 1)» era erróneo → «con 0 (los de y y z) y con 1
  (el de w)» (lo que explica el cuerpo y mide el playground).
- **5.4** — Caja senior «¿Cuánto cuesta una llamada uniform*?»: 10 000 `uniform4f` «0,6 ms (60 ns)» → «unos 0,2 ms (20 ns)»;
  10 000 `getUniformLocation` «1,8 ms» → «1,5 ms (150 ns)» (lab1: 7 tandas, mediana, CPU caliente; las cifras viejas
  salían de la CPU a medio gas).
- **5.5** — «una textura de 1×1 siempre es completa» era falso para `RGBA32F` sin `OES_texture_float_linear` (sale negra):
  ahora vale solo para `RGBA8`/`RGBA16F`, con la excepción explicada; también en el resumen. (lab1: 1×1 `RGBA8` (255,128,0),
  `RGBA16F` ídem, `RGBA32F` sin extensión (0,0,0,255), con extensión ídem a RGBA8; sin aviso en la consola.)
- **5.6** — Ejemplo 5.6.2: «la izquierda queda casi entera en penumbra» no coincidía con la captura → «mucho más oscura,
  con solo un reflejo apagado arriba».
- **5.10** — Solución del ejercicio 5.10.5: «6,7 / 2,5 ms» (antes 8,4 / 3,6) para que coincida con el cuerpo de la
  lección (re-medido en la sesión 4).
- Estilo: quitado «simplemente» (GUIA §2) de explicaciones de quiz y párrafos de 5.5, 5.6 y 5.7.

### Después de la pausa (segunda pasada)
- **5.4** — Caja senior «Por qué el array parece traspuesto»: «los números de la traslación acaban multiplicando la `w`» era
  inexacto (no multiplican la w, caen en la fila que la calcula) → «acaban en la fila que calcula la `w` de salida
  (w′ = tx·x + ty·y + tz·z + w)». Tabla «Mover con un uniform o reescribir el buffer»: `uniform2f` «≈ 0,001 ms» →
  «≈ 0,00002 ms (una llamada de unos 20 ns)» y «unas doscientas veces menos» → «miles de veces menos» (la cifra de 1 µs
  contradecía los 20 ns de la caja siguiente; resumen de la lección igual).
- **5.5** — Ejercicio 5.5.5 (comentario del plan B): float16 «11 bits de mantisa» → «10» (5.4 dice 10 explícitos).
- **5.10** — Lista «Las causas habituales»: «con 200 000 por frame, 29 fps (5.9)» → «17–18 fps (tabla de 5.9, en un Apple
  M1)». La tabla de 5.9 se re-midió con ventana en la sesión 4 (lead) y esta cita se quedó con la cifra vieja.
- **5.2** — Caja senior «Comprobar cuesta» (compilación en paralelo): «unos 530 ms» / «unos 120 ms» / «las 200 llamadas»
  → «unos 450 ms» / «unos 150 ms» / «todas las llamadas», con «shaders mínimos, en un Apple M1 con Chrome 154». Re-medido:
  la conclusión (comprobar al final es ~3× más rápido) se mantiene; «200 llamadas» no era reproducible (40 programas son 400).
- **A.2** — La fila `textureLod` enlazaba a 5.5 (mipmaps), que no la explica → enlaza a 6.8 `#texture-frente-a-texelfetch`
  (donde está `textureLod`).
- Sin cambios en 5.7, 5.8, 5.9 (caja del lead intacta), A.1, A.3, A.4 y A.5: comprobados (ver (b)).

### Tablón
- A.4: contador. **La cifra real es 604 términos + 114 remisiones = 718 entradas.** El filtro
  (`modulos/08-anexos/recursos/glosario.js`: `total = entradas.filter((e) => !e.remision).length`) no cuenta las remisiones;
  el chip de la cabecera, el contador del filtro y el recuento por DOM coinciden (604 / 604 / 604, 114 remisiones,
  ids únicos) y no se perdió ninguna entrada. Con Chrome ahora mismo el contador marca «604 términos» (`s5-sonnet-claims2.mjs`);
  no he conseguido ver «601» (¿una captura anterior a que el generador de la sesión 4 dejara 604?). No hace falta
  tocar `assets/**` ni el texto de la página.
- 5.9: verificada entera (verificar + lectura); la caja del lead, sin tocar.

## (b) Mediciones (Apple M1, Chrome 154, ANGLE/Metal; labs en `herramientas/estado/lab/s5-sonnet-*.mjs`)

| Qué | Método | Antes → ahora |
|---|---|---|
| 5.1 `getParameter(VIEWPORT)` ×2000 | CPU caliente, mediana de 7 | 1,2 ms → 0,9 ms (0,45 µs) |
| 5.1 `getParameter(CURRENT_PROGRAM / MAX_TEXTURE_SIZE)` | ídem ×20 000 | 0,1 µs → 0,06 / 0,07 µs |
| 5.1/5.10 `getError` ×2000, `COLOR_CLEAR_VALUE`, `getUniform` | ídem | 36–40 µs cada uno (confirma 37 µs del lead) |
| 5.4 `uniform4f` ×10 000 | ídem | 0,6 ms → 0,2 ms (20 ns) |
| 5.4 `getUniformLocation` ×10 000 | ídem | 1,8 ms → 1,5 ms |
| 5.3 orphaning, 200 000 vértices (1,6 MB) | ídem | `bufferSubData` / `bufferData` / orphaning + sub: 0,2 ms las tres (un valor suelto de 3,5 ms); calcular 200 000 senos/cosenos en JS: 3,2 ms (confirma el texto) |
| 5.4 100 000 vértices recalcular + `bufferSubData` | ídem | 0,1 + 0,1 ms (el texto dice 0,16–0,33) |
| 5.2 compilar 40 programas | 3 repeticiones, shaders distintos por constante aleatoria | comprobando cada paso 429–489 ms; todo y comprobar al final 151–157 ms; encolar 0,1–0,2 ms (antes 530 / 120 ms) |
| 5.10.5 JS por frame, 24 000 figuras | rAF real, 120 frames tras calentar, mediana | desordenadas 2,5–3,4 ms; ordenadas 1,8–1,9 ms; 60 fps las dos (el texto: 2,6 → 1,9) |
| 5.10 `FinalizationRegistry`, 30 texturas de 4 MB | sin referencias, 6 s, luego basura de JS | 0 recogidas tras 6 s; las 30 en 15 ms de basura (confirma) |

Comprobaciones sin cifra (todas confirman el texto, salvo lo marcado en (a)):
- 5.1: `clearColor(2, −1, 0.5, 1)` se guarda sin recortar y da el píxel (255, 0, 128, 255); asignar el mismo `canvas.width` no
  borra y otro valor sí; el viewport no cambia tras redimensionar (queda [0, 0, 64, 64]); lecturas del canvas tras presentar
  (`drawImage`, `toBlob`, `createImageBitmap`, `texImage2D` en otro contexto): (0,0,0,0), y en el mismo task, el azul;
  `powerPreference` en un iframe sandbox: `low-power` en los dos contextos (en página normal: `default` / `high-performance`);
  límites: MAX_TEXTURE_SIZE 16384, atributos 16, varyings 30, uniforms 1024/1024, unidades 16 (32 combinadas), draw buffers 8,
  muestras 4, punto [1, 511], línea [1, 1], MAX_ELEMENT_INDEX 4 294 967 294: la tabla de 5.1 y A.4 cuadran.
- 5.3: un punto de 50 px con el centro fuera del canvas se dibuja en parte (píxel x = 5 rojo).
- 5.9: `WEBGL_draw_instanced_base_vertex_base_instance` no está en `getSupportedExtensions` (solo `WEBGL_multi_draw`).
- 5.2: `KHR_parallel_shader_compile` disponible.
- 5.5/5.8: `picking` con MSAA deja píxeles con el id de otro cuadrado (valores {0, 3, 5}) y sin MSAA solo {0, 5}.
- A.3: las 186 llamadas citadas en las firmas existen en `WebGL2RenderingContext` y ninguna firma completa lista menos argumentos
  que los obligatorios (solo abreviaturas con «…»). A.2: los 93 nombres de función son GLSL ES 3.00 válidos.
- Enlaces de fila de A.2 y A.3 a lecciones (156): cada uno apunta a una sección donde aparece la función de su fila, salvo
  el de `textureLod` (corregido) y los enlaces secundarios a notas de m7 (aceptables).
- 15 citas de títulos de bestiario entre comillas en mis archivos: todas coinciden con el `data-titulo` real.

## (c) Verificación final (después de mi última edición: la última es de las 23:30, la verificación empezó a las 23:42)
Comandos (todos vía `turnos.mjs --agente sonnet`; script `scratchpad/.../final.sh`; salidas en `scratchpad/.../final/`):
- `node verificar.mjs <5 tandas de 3 archivos> --soluciones --capturas cap2` (oscuro): **15/15 sin problemas**, todas las
  soluciones ejecutadas (5.1: 6, 5.2: 11, 5.3: 6, 5.4: 6, 5.5: 6, 5.6: 6, 5.7: 5, 5.8: 5, 5.9: 6, 5.10: 5; las pruebas ✓/✗
  de las soluciones, sin ningún ✗). Revisadas con Read las hojas de contacto de **todas** las capturas de 5.1–5.10, de las
  soluciones y de A.2/A.3 (las de A.1, A.4 y A.5 no tienen componentes; las he leído enteras/por extractos).
- `node verificar.mjs <ídem> --tema light --capturas cap-light`: **15/15 sin problemas**; hojas de 5.5 y 5.7 revisadas (el
  editor y las páginas pasan a claro; los lienzos son los mismos por `data-fondo="oscuro"`).
- `node movil.mjs <los 15>` (390 px): **15/15 ✓, scrollWidth = 390** (los «culpables» que lista `movil.mjs` junto a algunos
  archivos —botones del playground, anclas, SVG, MathML— son informativos: el veredicto es por `scrollWidth`, que vale 390).
- `node enlaces.mjs ../modulos/05-webgl/*.html ../modulos/08-anexos/*.html`: **2248 enlaces internos, 0 rotos**.
- Comprobaciones de contenido sin Chrome: 135 `data-l` en rango; 15 citas de títulos de bestiario coinciden; nombres de
  A.2 y A.3 válidos (ver (b)).

## (d) Pendientes y decisiones discutibles
- **Cifras de 5.8 y 5.10** (0,06 / 0,3–0,6 / 12 ms de `readPixels`; 4,0 / 15,7 / 35,3 ms de resolución; cambios de estado
  6,7 / 2,5 ms; subir texturas 1 / 0,3 ms; overdraw 63 ms): son las de la sesión 4 (`s4-m0-m6-tiempos`, pasadas aisladas
  con `readPixels` al final). No las he vuelto a medir; solo he comprobado que 5.8, 5.10, A.3 y A.4 se citan igual.
- **Cifras de 5.9** (tabla de fps y «90 / 275 ns»): del lead, medidas en un Chrome con ventana; no re-medidas.
- «Unos 20 ns por llamada `uniform*`» (5.4) es el coste en el hilo de JavaScript (se encola); no es el coste total del
  dibujo, que lo paga el proceso de la GPU. El texto lo dice («solo se anotan en la cola de órdenes»).
- 5.2: el enunciado «unas 50 líneas» es aproximado (el programa del ejemplo 5.2.1 tiene ~60 con comentarios). Lo dejo.
- El informe de la sesión 3 (`tiempos-y-pendientes-m0-m5.md`, fila 5.2) habla de «200 programas»; la lección decía «40
  programas, 200 llamadas». Ya no se contradice con la lección (40 programas), pero el informe viejo sigue diciendo 200.
- No he tocado `assets/**`; no hay entradas nuevas para el lead salvo la aclaración del contador de A.4.

## Una línea por página
- 5.1: terminada ✓
- 5.2: terminada ✓
- 5.3: terminada ✓
- 5.4: terminada ✓
- 5.5: terminada ✓
- 5.6: terminada ✓
- 5.7: terminada ✓
- 5.8: terminada ✓ (cifras de la sesión 4, no re-medidas por mí: ver (d))
- 5.9: terminada ✓ (caja del lead intacta; tabla del lead no re-medida)
- 5.10: terminada ✓ (cifras de la sesión 4)
- A.1: terminada ✓ (253 casos, 283 enlaces del diagnóstico, 0 rotos; lo de m5 coherente con las cajas)
- A.2: terminada ✓ (fila `textureLod` corregida)
- A.3: terminada ✓
- A.4: terminada ✓ (604 términos + 114 remisiones, confirmado)
- A.5: terminada ✓
