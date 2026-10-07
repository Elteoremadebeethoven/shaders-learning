# Sesión 5 · agente opus-b — auditoría final de m6 (6.1–6.10), m7 (7.1–7.7) y proyecto-final/

Máquina: MacBook Air Apple M1 (sin ventilador), Chrome 154.0.8037.98, ANGLE/Metal. Todo Chrome headless lanzado con
`herramientas/turnos.mjs --agente opus-b` (un solo proceso pesado mío a la vez). Scripts que se conservan:
`herramientas/estado/lab/s5-opus-b-*`.

**Estado: terminado.** Los 17 archivos de lección, `proyecto-final/**` y `recursos/**` quedan verificados después de mi última edición (ver (c)).

Organización. Antes de la pausa el trabajo se repartió en cinco ayudantes (G1 = 6.1–6.5 · G2 = 6.6–6.10 · G3 = 7.1–7.3 +
m7kit.js / m7.css / l73-kit.js · G4 = 7.4–7.5 · G5 = 7.6–7.7 + proyecto-final/**), que el lead paró por superar el límite de
agentes del dueño. Tras la pausa lo he terminado yo solo, sin ayudantes: he repasado con `git diff` (y con las copias
`SCRATCH/G5/antes/`) lo que editaron, he completado lo que les faltaba y he fusionado aquí sus informes parciales.

## (a) Cambios hechos y porqué

### Módulo 6
- **6.1 `01-lenguaje.html`** (G1)
  - Tabla «La primera línea»: la fila de espacios dice ahora «Espacios, o un comentario `/* … */`, en la misma línea … ✓
    Compila». El resumen ya lo afirmaba (medido en la sesión 4, `s4-coh-m7-gpu-exp.mjs`), pero el cuerpo no lo enseñaba.
  - Solución del ejercicio 6.1.1: la cita del enunciado no coincidía con el enunciado («naranja con el verde a la mitad
    del rojo») → «un tono anaranjado (con el verde a la mitad del rojo)».
  - Quiz de `normalizar(out vec2 v)`: la explicación decía que «en nuestra GPU, d acaba valiendo (0, 0) (lo medimos), y otro
    compilador podría dar NaN». Medido hoy (`s5-opus-b-G1-interaccion.mjs`): (0, 0) tal cual, pero el mismo shader con un
    `isnan` (fast math desactivado, compilación nueva) da (NaN, NaN), y al salir de la caché, otra vez (0, 0). Añadido «(lo
    medimos; el mismo shader con un `isnan`, que desactiva el fast math como viste en 3.7, da NaN)» con enlace a
    `m3-isnan-heisenbug`.
- **6.4 `04-color.html`** (G1): editor «Bandas y ruido», comentario `// niveles: 7 con 3 bits ... 255 con 8` → «nivel
  máximo» (con 5 bits el texto dice 32 niveles y `N` vale 31: el comentario contradecía al texto).
- **6.6 `06-ruido.html`** (G2)
  - Anotado de PCG, l.4: «Un último XOR de la mitad alta sobre la baja» → «de los 10 bits altos sobre los bajos
    (`w >> 22u`)»: `w >> 22u` deja 10 bits, no la mitad.
  - Solución del ejercicio 6.6.2: «si confundes b con c, el ruido se ve suave igualmente, pero los círculos no
    coinciden» era falso: con b y c cambiados, dos celdas vecinas ya no dan el mismo valor a la esquina que comparten y
    el ruido salta en los bordes de las celdas (comprobado con captura). Frase reescrita.
- **6.7 `07-animacion-shaders.html`** (G2)
  - Ejemplo 6.7.3, «La integración es la de 2.5: Euler semi-implícito con subpasos de como mucho 1/120 s»: 2.5 usa
    1/240 s. Ahora dice que es la de 2.5 con subpasos, aquí de 1/120 s porque el muelle es lento (ω₀h ≈ 0,08), y la frase
    de `GLKit.bucle` (dt ≤ 0,1 s, comprobado en glkit.js) queda aparte.
  - Solución del ejercicio 6.7.4, comentario «Instantes repartidos en el intervalo [t - FRAME, t)»: el código muestrea
    t, t − FRAME·u_lento/N, …, es decir (t − FRAME·u_lento, t]. Comentario corregido.

- **6.9 `09-raymarching.html`** (yo): editor «Esferas infinitas». El texto propone «celda 2 y radio 1,2» para ver esferas
  cortadas por planos, pero la cámara iba por `ro = (0,3 c; 0,4 c; −1,5 t)`, a 0,5 c de los ejes de las esferas: con
  radio > 0,5 c quedaba DENTRO de una esfera 2/3 del tiempo (|q.z| < 0,66) y la pantalla entera salía de un color (la
  captura con interacción de G2 lo muestra: verde liso). Cámara movida al pasillo entre cuatro filas,
  `ro = (0,5 c; 0,5 c; −1,5 t)` (a 0,71 c de los ejes: con celda 2 y radio 1,2 nunca entra), y una frase que explica
  el efecto si el radio pasa de 0,7 celdas («el rayo choca en t = 0»).

### Módulo 7
- **7.1 `01-arquitectura.html`** (G3): «con tres `#define`, un error en la línea 5 se anuncia en la línea 9» → «en la
  línea 8» (medido en Chrome 154/M1: `ERROR: 0:8`; ver (b)).
- **7.4 `04-vertex-animacion.html`** (G4 y yo)
  - Quiz del ε («Tu océano usa diferencias centrales con ε = 0.00001…»): la explicación citaba la cifra de ε = 10⁻⁴
    (9° con t = 1000 s) para una pregunta con ε = 10⁻⁵. Ahora cita la fila de 10⁻⁵ de la tabla: hasta 1,3° en los
    primeros segundos y hasta 52° con t = 1000 s.
  - Modo «normal del plano» del océano: «el reflejo del cielo y el brillo del sol son iguales en todas partes» era falso
    (la captura muestra una mancha de sol y un cielo que cambia con la distancia) → «el brillo del sol es una sola mancha
    lisa y el reflejo del cielo solo cambia con la distancia, como en un lago en calma. Ninguna ola se nota en la luz».
  - Frase sobre las variantes del bucle de JavaScript: «medimos entre 1,3 y 1,6 veces más» → «entre 1,1 y 1,7 veces más
    (de 14 a 21 ms con 263 000 vértices: casi todo el frame, o más)», con la medida en Chrome caliente de (b).
- **7.5 `05-particulas-gpu.html`** (G4): tabla del ejemplo 7.5.1 y frases (vivas, simular, subir) con la medida de (b),
  con rangos que juntan la medida antigua y la nueva; cifras de `readPixels` de RGBA32F en la caja de la pérdida de
  contexto y el resumen («unos 4 ms» a 1024², «menos de 1 ms» a 512², 5,6 y 3,4 ms en frío; antes 5,2 y 2,1 sin método).
  Y (yo) el método CPU de la demo 7.5.4 decía «unos 5 fps» en un sitio y «6 fps» en otro → «5 o 6 fps» (la tabla da
  184 ms por frame, 5,4 fps).
- **7.6 `06-proyecto-final.html`** (G5)
  - Quiz de la arquitectura («Un usuario abre tu hero… ¿Qué ve?»): faltaba que las animaciones de entrada estaban
    **creadas en pausa**; sin eso, la opción «el texto con su animación de entrada, como siempre» sería la correcta (una
    animación en marcha avanza sola con `document.timeline`). Añadido «(creadas en pausa)».
  - «Sin JavaScript»: la regla citada era `html:not(.js) .hero-selector { display: none }`, pero el texto dice que
    desaparecen el selector **y** el botón de pausa; la regla real de `estilos.css` lleva también `.hero-pausa`. Igualada.
  - Anotado de `algoSeMueve` (l.4): una frase que explica el arreglo de `Motor.Puntero` antes del primer evento.
  - (yo) «la posición arranca sin barrido» → «…sin barrido, también cada vez que el puntero vuelve a entrar» (es lo que
    hace ahora `Motor.Puntero`, ver abajo).
- **`proyecto-final/motor.js`**
  - (G5) `Motor.Puntero` antes del primer evento: `if (!this.visto) return;` dejaba `sx, sy` en 0 mientras `x, y` salían
    de `clientX/Y = 0` menos la posición de la caja. Con la página desplazada y sin que el ratón hubiera entrado nunca,
    `enReposo()` era falso para siempre y el bucle bajo demanda no se dormía (movimiento reducido o pausa). Ahora copia la
    posición en la suavizada, como `M7.Puntero` de 7.2.
  - (yo) **Barrido al volver a entrar**: `Motor.Puntero` hacía `if (this.fresco)` donde `M7.Puntero` hace
    `if (this.fresco && this.dentro)`. La marca se gastaba en el primer frame tras el `pointerleave`, colocando la
    suavizada donde salió el puntero, y al volver a entrar por otro sitio el remolino cruzaba el hero desde allí: el bicho
    exacto que 7.2 describe en su anotado (l.13-17) y que 7.6 dice heredar («el `M7.Puntero` de 7.2 recortado»).
    Medido sin navegador con el código real (`s5-opus-b-puntero-barrido.cjs`): primer frame tras volver a entrar por
    (700, 500) habiendo salido por (100, 100): antes `sx, sy = 180,7; 153,8`; después `700; 500` (igual que `M7.Puntero`).
- **`proyecto-final/hero.js`** (G5): comentario l.67 «primer fotograma» → «primer fotograma clave» (convención de 0.1 que
  7.6 ya sigue).

## (b) Mediciones

- **7.1, mensajes del compilador con `#define` inyectados** (G3, `s5-opus-b-G3-afirmaciones.*`, Apple M1, Chrome 154,
  ANGLE/Metal): error en la línea 5 sin defines → `0:5`; con tres `#define` delante → `0:8` (el texto decía 9); con
  `#line 2` tras ellos → `0:5`; `#line 1 7` → `7:4`; `desynchronized` → false; `MAX_FRAGMENT_UNIFORM_VECTORS` 1024;
  `uniform3fv` con 10 floats → `INVALID_VALUE`; `premultipliedAlpha` por defecto true; ni `drawElement`, ni
  `drawElementImage`, ni `texElementImage2D`; `startViewTransition` es función. Todo coincide con 7.1–7.3.
- **7.3, derivadas dentro de una rama (persianas)** (G3, mismo laboratorio): textura con un color por nivel de mipmap,
  lienzo de 736 px, 8 persianas: con la lectura dentro de la rama, 8 píxeles malos por valor de `q` (columna del borde,
  leída del último nivel) salvo cuando el borde cae en el límite de un quad (q = 0,37 / 0,5 / 0,61: 0 malos); leyendo
  antes de elegir, 0 malos en todos. Confirma el texto de 7.3.
- **7.1, ejercicio 7.1.5** (G3, Node con el m7kit real, `s5-opus-b-G3-ej715.cjs`): base 16 cambios / 213 frames lentos, solución 4 / 117, ciclo de
  3 s → 10,5 s, como dice la lección.
- **7.3, muelles y coma flotante** (G3 y yo, Node con el m7kit real, `s5-opus-b-G3-muelles73.cjs` y `-ej73x.cjs`): `M7.suavizar` hacia 1 atascado en
  0,9999999999999998 tras 100 000 frames; muelle por defecto en 0,999999999999999; muelle de la lupa (0,25; 0,9) clava
  el 1 a los 7,6 s; hacia 0: −1,18·10⁻⁸ a 4 s y 1,97·10⁻²⁰ a 10 s; 60 × 1/60 = 1,0000000000000013;
  30 × (1/60)/0,5 = 0,9999999999999999; `1 − 2^−10` = 0,9990234375; `parametrosMuelle(0.1, 0.6)` → k = 127,18,
  c = 13,33, máximo 1,0947 y `enReposo()` a los 1,03 s; primer paso del muelle por defecto con dt = 0,1 → 0,39 (con 1/60,
  0,026). Todo coincide con el texto.
- **7.4, columna de JavaScript** (G4, Chrome caliente, 300 ms de calentamiento y mediana de 11, `s5-opus-b-G4-labA.mjs` + `s5-opus-b-G4-js74.html`): con
  `Math.hypot` 5,3 / 21,1 / 84,3 ms; con `Math.sqrt` 4,0 / 15,9 / 63,3; con las constantes en variables sueltas
  3,5 / 14,3 / 56,7 (256² / 512² / 1024²); en frío (1,5 s de reposo) la de `sqrt` a 512² tarda 30,5 ms (×1,9). La columna
  del autor (3,2 / 12,7 / 50,7) queda un 11 % por debajo de la más rápida: plausible, y la trampa de la CPU en frío no la
  infla. La frase de las variantes pasa de «1,3–1,6 veces» a «1,1–1,7» (14,3–21,1 frente a 12,7).
- **7.5** (G4, `s5-opus-b-G4-labA.mjs`): `readPixels` RGBA32F caliente 512² 0,9 ms (0,7–1,0) / 1024² 4,1 ms (3,9–4,1); en frío 3,4 /
  5,6 ms (antes el texto daba 2,1 / 5,2 sin método). Límites: `MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` 128,
  `SEPARATE_ATTRIBS` 4, puntos 1–511, `MAX_VERTEX_TEXTURE_IMAGE_UNITS` 16, `MAX_ELEMENT_INDEX` 4 294 967 294. Ejemplo
  7.5.1 (tasas 20 000 / 40 000 / 80 000): vivas 69 800 / 139 600 / 279 400; simular 0,6–1,8 / 1,1–2,4 / 2,2–2,9 ms; subir
  0–0,2 / 0–0,2 / 0,1–0,3 ms; 60 fps.
- **Three.js r186** (G5, paquete `three@0.186.1` leído con `npm pack`, sin cargarlo en el curso): todas las afirmaciones de
  7.7 cuadran con el código (Clock obsoleto desde r183 y Timer; `compileAsync` sondea cada 10 ms; `setDrawingBufferSize`;
  atributos del contexto; caché de uniforms `if ( cache[ 0 ] === v ) return;`, `arraysEqual`, `copyArray`; clave de
  programa con `onBeforeCompile.toString()`; comentario «buffers might not be writable…»; 110 chunks; renderer WebGL
  12 717 + 3 769 = 16 486 líneas, chunks 5 317; avisos de WebGPURenderer).
- **Motor.Puntero, barrido al volver a entrar** (yo, `s5-opus-b-puntero-barrido.cjs`, Node): ver (a).
- **Proyecto final, ¿se duerme el bucle con la página desplazada y sin eventos de puntero?** (G5/yo,
  `s5-opus-b-G5-interaccion.mjs`, headless, 1440 × 900): llamadas a rAF en 2 s con `?reducir` / con la pausa del teclado:
  arriba 0 / 0 antes y después; con `scrollY = 200`, antes del arreglo 120 / 121 (no se dormía nunca), después 0 / 0.
- **6.1, 6.3** (G1, mismo script): tabla de lo indefinido idéntica a la del texto (x/x → 1 normal y NaN con isnan; atan(0,0)
  NaN/0; 1 << 32 → 1; int(3e9) → 2 147 483 520…); la traducción de ANGLE (struct de uniforms sin `u_sinUso`, `ANGLE_div`,
  `ANGLE_int_clamp`, 0.899999976, `ANGLE_flippedFragCoord`, `_ux = 0.0f`); `smin` con k = 0 → d = NaN, cobertura con
  `clamp` 0 y con `1 − smoothstep` 1, como dice el bestiario; derivada en un if: 5,5 esperado → 10,5.
- **Interacciones** (G2, G3 y G5; capturas miradas): 6.6 seno con desplazamiento 300 000 → negro, a 5 000 → rayas; 6.6.2
  con b y c cambiados → saltos en los bordes de celda; fade lineal/cúbico/quíntico; 6.7 comprobador de bucles; 6.8
  costuras de `fract` y `textureGrad`, REPEAT frente a CLAMP; 6.9 capas y mapa de calor; 6.10 `iMouse` (antes, sin pulsar,
  arrastrando, suelto); 7.1.2 (×0,25 → dt 4,2 ms; pausa → 0); 7.1.4 (iniciación perezosa, liberar, contexto perdido →
  solo se reconstruye la activa); 7.1.6 (error → «sigue el anterior», 72 frames en 1,2 s); 7.2.1 (cruz frente al anillo en
  los tres modos, con media resolución y con scroll); 7.3.4 (diferencia máxima entre frames: congelar 15, cambiar 64,
  esperar 20); 7.3.6 (`elementFromPoint` sobre el enlace a mitad de la transición → el overlay); 7.6.1 (búfer 1472 × 680,
  736 × 340 y 368 × 170 con DPR 2); 7.6.2 (hero fuera de la vista: el bucle se para y el reloj no avanza; al volver, sigue
  donde estaba); 7.6.3 (pausa, ×0,25 → 0,255 s por segundo, t = 0 → las animaciones de entrada se repiten); 7.6.4
  (interrumpir: la velocidad del muelle cambia de signo una vez, sin saltos; `inert` y `aria-pressed` correctos);
  ejercicio 7.6.1 (píxeles magenta del chivato: partida 7 955 en p = 0 y 60 046 en p = 1; solución 0 y 0); 7.7.2 (consola de
  los frames 1–3 exactamente como la describe el texto); 7.7.3 (el halo sigue al ratón en los dos lienzos). Todo coincide
  con lo que dice el texto.
- **6.9 con la cámara nueva** (`s5-opus-b-comprobaciones.mjs`): por defecto se ve el pasillo entre las filas de esferas;
  con celda 2 y radio 1,2, seis capturas cada 0,35 s: siempre esferas cortadas por planos (los planos de las celdas que
  pasan por la cámara), nunca la pantalla de un color.
- **6.1, la traducción completa de ANGLE** (mismo script; el playground solo imprime el struct y `main`): 9 632 caracteres;
  existen `ANGLE_safeDivisor` y `ANGLE_div`, que la llama (`return zx / ANGLE_safeDivisor(zx, zy);`), como dice el anotado.
- **Pruebas ✓/✗ de las soluciones con espera fija de 12 s** (`s5-opus-b-pruebas-largas.mjs`): 7.1.2 7 ✓ · 7.1.3 1 ✓ ·
  7.1.4 5 ✓ · 7.1.5 2 ✓ · 7.3.3 6 ✓ · 7.3.4 9 ✓ · 7.3.5 **4** ✓ · 7.4.1 7 ✓ · 7.4.3 1 ✓ · 7.5.1–7.5.4 1 ✓ cada una · 7.6.2 3 ✓ ·
  7.6.3 3 ✓ · 7.6.4 **4** ✓ · 7.7.1 6 ✓ · 7.7.2 5 ✓ · 7.7.3 1 ✓ · 7.7.4 4 ✓; 0 ✗. (verificar.mjs contó 2 en 7.3.5 y 1 en
  7.6.4: ver (d).)
- **QA del proyecto final** tras los dos cambios de `motor.js` (`s4-m7b-76-proyecto.mjs`): 67 ✓, «todo correcto»; capturas
  (escritorio DPR 1 y 2, remolino, transición a medias, scroll, contexto perdido, móvil 390, sin WebGL, sin JS) miradas.

- **Cotejos sin cambios** (cifras recalculadas a mano o con Node; texto compacto de cada lección leído entero, con el código
  de cada ejemplo, ejercicio, solución, anotado y quiz): 6.1–6.5 (G1: sRGB, ulp, quads, rangos de `p`, `mod` con fast
  math; citas de bestiarios y números de lección con `s4-coh-m7-gpu-titulos.mjs`/`-numeros.mjs`: 0 discrepancias);
  6.6 (64 hashes por píxel, fbm 2⁵ y 200/32 ≈ 6 px, periodos 2ᵏP, fechas y atribuciones), 6.7 (quiz del logo 0,28 rad;
  rueda 42°/−3°/45°/12°; easeOutElastic(1) = 1,00049; ulp de `u_time` 0,0078 s tras un día), 6.8 (sepia de un blanco,
  65 000 M lecturas/s, separable 12×, Bayer, 9 niveles de mipmap de 512), 6.9 (f = 1/tan(fov/2) = 2,14 con 50°, √15,
  derecha = delante × arriba, smin ≤ k/4, tetraedro), 6.10 (cabecera de Shadertoy de 17 líneas, 33 ≈ 10,5π, bucle float
  10/11 vueltas, CC BY-NC-SA 3.0) (G2); 7.2 y 7.3 (yo: números de línea de los anotados de `M7.Puntero` y
  `L73.Transicion` frente a m7kit/l73-kit, derivada de cubicInOut/cubicOut, 21 % y 188 del fundido, h de la cortinilla,
  1,14 alturas, 46 ms/s, 10 MB de las dos instantáneas); 7.7 (yo: líneas del prefijo 68/56 → 70/63 y errores en 0:69/0:57,
  0,2159 × 255 = 55, 2,1445 → 1,0723, matrices GL/WebGPU −1,0202/−2,0202 → −1,0101/−1,0101, z = −0,327 a 1,5 unidades,
  struct de 64 bytes, profundidad invertida n/(f − n) y nf/(f − n), fechas de WebGPU en navegadores).

## (c) Verificación final
Todo con `turnos.mjs --agente opus-b`, un proceso mío a la vez (cola secuencial; logs en el SCRATCH, `r1`–`r5`).
- **Oscuro con soluciones y capturas** (`verificar.mjs … --soluciones --capturas`, de 2 a 3 lecciones por llamada):
  6.1–6.10 y 7.1–7.7, **17/17 sin problemas**; tras las últimas ediciones de 6.1 y 6.9, otra vez esas dos: 2/2 sin
  problemas. 7.4, 7.5 y 7.6 se verificaron después de editarlas. Capturas: TODAS miradas (los ~280 PNG, en hojas de 6),
  más las de las interacciones (G1, G2, G3, G5) y la de la cámara nueva de 6.9.
- **Pruebas de las soluciones con espera fija** (`s5-opus-b-pruebas-largas.mjs`, m7): 20 playgrounds, todas ✓, 0 ✗.
- **Tema claro** (`verificar.mjs … --tema light --capturas`): **17/17 sin problemas**; capturas de las demos a medida,
  graficadores y playgrounds JS miradas (legibles, colores del tema).
- **Móvil** (`movil.mjs`, 390 px): los 17 y `proyecto-final/index.html`, **18/18 sin desbordamiento** (scrollWidth 390).
- **QA del proyecto final** (`s4-m7b-76-proyecto.mjs`, tras los cambios de `motor.js`): **67 ✓**, «todo correcto».
  `node --check` de `motor.js` y `hero.js`: sin errores.
- **Enlaces** (`node enlaces.mjs`): 63 archivos, 3794 enlaces internos, **0 rotos**.
- No he ejecutado `indexar.mjs` (lo hace el lead). Ninguna edición de esta sesión en m6/m7 (mías ni de G1–G5) cae dentro
  de una caja bestiario, así que A.1 no cambia por ellas; el índice de búsqueda sí recoge texto nuevo de 6.1, 6.9, 7.4–7.6.

## (d) Pendientes y decisiones discutibles
- **Trampas de medida, revisadas.** CPU en frío: ningún playground de m6/m7 cronometra pocos ms de JS al ejecutarse
  (7.1.6 solo muestra lo que tardó una compilación; el 0,5 µs de `getBoundingClientRect` de 7.2 se midió con 200 000
  llamadas). fps en headless: la tabla de presupuesto de 7.1 cuadra con los tiempos de GPU medidos por pasadas
  (intervalos 100–117 ms frente a 104 ms de GPU; 50/67 alternos, media 58, frente a 58; 16,7/33,3 alternos, media 25,
  frente a 26) y se midió en una página sin iframe; la tabla de capacidad de 7.6 (sesión 4) también coincide con el
  método de pasadas (2,4 ms/MP); «0 rAF en 2 s fuera de pantalla» cuenta llamadas, no fps. 7.5.4: «1 M a 60 fps (10 ms de
  GPU por frame)» y «4 M a 22–23 fps (42–44 ms por frame)»: los ms salen del botón «medir GPU» (20 frames y un
  `readPixels`), y los fps coinciden con ellos (1000/44 ≈ 23), así que el headless no los infla (si lo hiciera, marcaría 60
  con 4 M, como la demo de 5.9). Por eso no lancé el laboratorio exclusivo que G4 tenía previsto (lab B).
- **verificar.mjs y las pruebas lentas** (tablón, PARA lead): la espera de las pruebas se corta tras 1,5 s sin líneas
  nuevas; en 7.3.5 y 7.6.4 hay huecos de 4 s entre pruebas y verificar solo contaba 2 de 4 y 1 de 4. Con espera fija pasan
  todas (ver (b)); la herramienta es del lead y no la he tocado.
- **6.9, cámara de «Esferas infinitas»**: el arreglo cambia la composición por defecto (antes, un punto descentrado del
  pasillo; ahora, el cruce de dos «calles» entre filas de esferas, simétrico). Alternativa: dejar la cámara y cambiar el
  ejemplo del texto por uno que no la meta dentro, pero no existe: con la cámara a 0,5 c de los ejes, cualquier radio
  mayor que media celda (justo lo que se quiere enseñar) la mete dentro de una esfera parte del tiempo.
- **7.4, columna de JavaScript** (3,2 / 12,7 / 50,7 ms): sigue siendo la del autor (la sesión 4 decidió conservarla); las
  tres variantes medidas hoy en Chrome caliente van de 1,1 a 1,7 veces esa cifra, y así lo dice ahora el texto.
- **7.5.1**: G4 juntó en cada celda de la tabla el rango antiguo y el medido hoy (p. ej. simular 0,6–2,4 ms con 20 000/s,
  hoy 0,6–1,8); es más ancho que la medida de hoy, pero no falso.
- m6a (6.1–6.5) escribe todos los decimales con punto (también en la prosa: «1.03 píxeles»), y m6b/m7 con coma. Es
  coherente dentro de cada lección y viene de sesiones anteriores; no lo he cambiado (serían cientos de cifras).

## Scripts de esta sesión (`herramientas/estado/lab/`)
- `s5-opus-b-puntero-barrido.cjs` — `Motor.Puntero` frente a `M7.Puntero` al volver a entrar (Node, sin navegador).
- `s5-opus-b-pruebas-largas.mjs` — pruebas ✓/✗ de las soluciones con espera fija (`--espera ms`). Con turno.
- `s5-opus-b-comprobaciones.mjs` — 6.9 cámara nueva (capturas) y traducción completa de ANGLE en 6.1. Con turno.
- `s5-opus-b-G1-interaccion.mjs`, `s5-opus-b-G2-qa.mjs`, `s5-opus-b-G3-qa.mjs`, `s5-opus-b-G5-interaccion.mjs`
  (`SIN_A=1` salta la medida del bucle del proyecto) — interacciones de 6.1–6.5, 6.6–6.10, 7.1–7.3 y 7.6/7.7 +
  proyecto. Con turno.
- `s5-opus-b-G3-afirmaciones.mjs` + `.html` — afirmaciones de 7.1–7.3 en Chrome. `s5-opus-b-G3-ej715.cjs`,
  `-ej73x.cjs`, `-muelles73.cjs` — cifras de 7.1.5 y 7.3 con el m7kit real (Node).
- `s5-opus-b-G4-labA.mjs` + `s5-opus-b-G4-js74.html` — columna de JavaScript de 7.4, subidas, `readPixels` RGBA32F,
  límites y tabla de 7.5.1. Con turno.

## Estado por lección
- 6.1: terminada ✓
- 6.2: terminada ✓
- 6.3: terminada ✓
- 6.4: terminada ✓
- 6.5: terminada ✓
- 6.6: terminada ✓
- 6.7: terminada ✓
- 6.8: terminada ✓
- 6.9: terminada ✓
- 6.10: terminada ✓
- 7.1: terminada ✓
- 7.2: terminada ✓
- 7.3: terminada ✓ (sin partir ni recortar: decisión pendiente del dueño)
- 7.4: terminada ✓
- 7.5: terminada ✓
- 7.6: terminada ✓
- 7.7: terminada ✓ (sin partir ni recortar: decisión pendiente del dueño)
- proyecto-final/: terminado ✓ (QA 67 ✓)
- recursos/ (m7kit.js, m7.css, l73-kit.js, l74kit.js, l75-particulas.js, l77-*): sin cambios en esta sesión; cotejados con
  las lecciones que los citan (anotados de `M7.Puntero`, `L73.Transicion`; Tres.js ≈ 500 líneas).
