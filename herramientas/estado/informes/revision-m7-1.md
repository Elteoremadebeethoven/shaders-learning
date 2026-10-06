# Revisión de 7.1 «Arquitectura de una app con shaders» + `recursos/m7kit.js` + `recursos/m7.css` (rev-m7-1, sesión 3)

Archivos tocados: `modulos/07-integracion/01-arquitectura.html`, `modulos/07-integracion/recursos/m7kit.js`
(`m7.css` revisado, sin cambios) y, nuevo, `herramientas/estado/lab/rev-m7-1-tiempos.mjs` (laboratorio de tiempos de GPU
para el M1). Ver diferencias: `git diff 66d0cba -- modulos/07-integracion/01-arquitectura.html modulos/07-integracion/recursos/m7kit.js`.
Máquina de esta revisión: contenedor Linux, Chromium 141 headless, WebGL por SwiftShader (sin GPU). Experimentos en
`<SCRATCH>/agentes/rev-m7-1/exp/` (`afirmaciones.mjs`, `interactuar*.mjs`, `sim.cjs`).

## (a) Cambios hechos y por qué

### En la lección (01-arquitectura.html)

1. **«El script que crece», nota de las líneas 10-13.** Decía «redimensiona en el evento, fuera del frame, borrando el
   búfer ya dibujado». Falso en Chrome: medido, el evento `resize` de la ventana se despacha **en el frame, antes** de los
   callbacks de rAF (secuencia `raf#20 → resize → raf#21 → ResizeObserver`); el que corre después del rAF y borraría lo
   dibujado es el `ResizeObserver` (lo que ya dice 5.1). Reescrita con los fallos reales: solo se entera de cambios de la
   *ventana* (no del contenedor), olvida el DPR y no actualiza `gl.viewport` (enlace al bestiario de 5.1 conservado).
2. **Nota de la línea 14-16**: añadido «en píxeles CSS (no del búfer)».
3. **Nota de la línea 19** (`Date.now()/1000` como float32): «congelada desde el primer frame» → explicado: ~1 800 millones
   de segundos, separación de 128 s entre floats representables (comprobado con `Math.fround`), se ve congelada y salta
   cada dos minutos largos. Coherente con 5.4 («más de dos minutos»).
4. **Tabla DOM↔GL**: añadido el hardware (Chrome en el M1, 60 fps). Y corregida la explicación del `setInterval`:
   «unas veces un frame por delante y otras por detrás» no es lo que pasa; el DOM se coloca con la hora del temporizador
   (entre dos frames) y se presenta en el frame siguiente, así que va **por detrás** una distancia variable, de casi nada a
   más de un frame (8,6 px a 440 px/s = 20 ms).
5. **Caja senior `desynchronized`**: decía que en «el Chrome de pruebas» se concedió `false`. En Chromium/Linux de esta
   máquina se concede `true` (medido). Ahora dice que depende del sistema: `false` en Chrome para macOS (M1, lo que mide
   5.1) y `true` en Chromium/Linux.
6. **«Tamaño», punto 1**: «en 5.10 un shader pesado tardó 7 veces más» depende de una cifra de 5.10 (5,1 / 16,7 / 35,9 ms)
   que no ha pasado la auditoría de tiempos de GPU (§3.3 del plan; el 16,7 huele a vsync). Reescrito sin el número
   («crece casi en la misma proporción», enlace a la sección de 5.10). Ver (c).
7. **Código anotado `tamañoObjetivo`**: las notas no casaban con las líneas (L1-2 hablaba de `dispAncho`, que está en la
   L5). Reordenadas: L2-3 DPR, L4 calidad, L5 `dispAncho/dispAlto` (con `devicePixelContentBoxSize`).
8. **«Varias escenas»**: «conservar evita el tirón de volver a compilar» ignoraba la caché de programas de Chrome que el
   curso ya explica en 5.10 (en esta máquina también actúa, aunque la medida es ruidosa: el mismo texto tardó 20 ms la
   primera vez, 98,6 ms la segunda y 1,2 ms la tercera; otro texto, 14,5 ms). Matizado: el tirón (crear, compilar, estrenar el programa, 4.1) suele ser menor la segunda vez; lo mismo en
   la explicación del ejemplo 7.1.4.
9. **«Recursos y pérdida de contexto», nota L3**: «las llamadas de GL no hacen nada (ni se quejan)» → precisado y
   comprobado: `getError` devuelve `CONTEXT_LOST_WEBGL` (0x9242) una sola vez y después `NO_ERROR`.
10. **`M7.crearApp`, bloque «La forma de una app»**: faltaban las opciones `dtMax` y `alPerder` (el ejemplo 7.1.3 usa
    `alPerder`). Añadidas.
11. **Bucle anotado**: la nota L6-10 decía que un intervalo de más de 250 ms «es una pestaña que vuelve». Con `crearApp`,
    la vuelta de pestaña y las pausas llegan como intervalo **0** (`revisar` → `reiniciarReferencia`); lo que pasa de 250 ms
    es un tirón suelto o la vuelta de una suspensión. Reescrita, con la consecuencia (por debajo de 4 fps la cifra de fps
    se queda congelada en el último valor válido). La nota L22-23 explica ahora también la L4 (`pendiente = false`).
12. **Ejemplo 7.1.5**: el texto decía «en todos, el resultado debe ser una alternativa» (el botón «normal» no falla);
    precisado. Añadido el motivo real que llega en `webglcontextcreationerror` con el truco del contexto `'2d'`
    (`Canvas has an existing context of a different type`, comprobado) y anclado el enlace a `#m5-getcontext-null`.
13. **`#define` frente a uniform**: «con `#if CALIDAD > 1` … (el compilador elimina lo que no llega a las salidas)» mezclaba
    dos mecanismos. Ahora: `#if` lo quita el **preprocesador**; un `if` normal con la constante también desaparece por
    plegado de constantes y rama muerta (enlace a la sección de 6.1); con un uniform, ninguna de las dos cosas.
14. **Trampa 1 (`#define` delante de `#version`) y quiz**: comprobados los dos mensajes de ANGLE; la «cascada de errores de
    sintaxis» es en realidad `'out' : storage qualifier supported in GLSL ES 3.00 and above only`. Citado tal cual; el quiz
    dice ahora «`out` solo existe a partir de GLSL ES 3.00» (antes «no existe»).
15. **`conDefines` (lección y m7kit)**: la comprobación `/^\s*#version/` dejaba pasar una plantilla que empieza con salto de
    línea (`` ` `` + Intro + `#version…`), que ANGLE rechaza («#version directive must occur on the first line»,
    comprobado), y entonces el `#define` acababa insertado *antes* de `#version`: justo el error críptico que la comprobación
    quería evitar. Cambiada a `/^[ \t]*#version/` (espacios delante sí compilan, comprobado) y explicado en la nota, con
    enlace al bestiario `m5-version-primera-linea`.
16. **Bestiario `m7-define-entero`**: recomendaba `(2).toFixed(1)` sin avisar de que redondea cualquier otro valor
    (`(0.25).toFixed(1)` → `"0.3"`, comprobado). Ahora recomienda `flotante(v)` y advierte del atajo. Enlace a 6.1 anclado.
17. **Hack `#line 1 7`**: «un error en la quinta línea se anunció como 7:5 en lugar de 0:5» era ambiguo (sin la directiva
    sale 0:6). Reescrito con lo comprobado: tras `#line 1 7` la línea siguiente es la 1 de la cadena 7; con `#line 1` a secas
    sería 0:5. Y faltaba un paso: al terminar cada trozo hay que volver a la numeración principal con `#line L 0`
    (comprobado: error del trozo → `7:2`, error del texto principal tras `#line 3 0` → `0:5`).
18. **Cifras medidas sin hardware**: añadido «Chrome en el Apple M1 del curso» a la medida de compilación (177,5 ms; además,
    «un shader que Chrome aún no tenía en su caché de programas») y a la tabla de calidad adaptativa (con «un dibujo por
    frame», que es lo que hace fiable esa medida; ver (c)). «El primero, de calentamiento» → «el primer segundo».
19. **`Calidad.medir` anotado**: la nota L2 decía que >250 ms es «una pestaña que vuelve». Reescrita (ver 11) y explicado el
    precio real: si la GPU no llega a 4 fps, todos los intervalos se descartan y la calidad adaptativa **se queda ciega**
    (lo vi en SwiftShader: con coste 1500 en el ejemplo 7.1.7, frames de más de 250 ms, la escala se quedó en 0,72 y la
    cifra de fps congelada en «10»; al bajar el coste, el controlador volvió a actuar). Nueva opción `descartarMs` (ver m7kit) y el código anotado la usa.
20. **Ejemplo 7.1.7**: añadido el efecto secundario de compilar variantes dentro de `dibujar` mientras se arrastra el
    deslizador (frames largos que el controlador confunde con falta de GPU) y cómo se evita.
21. **Ejercicio 7.1.5**: la pista decía que el original oscila «cada 2,5 s» y la solución «de uno cada 2,5 s a uno cada
    10 s». Simulado (`sim.cjs`, idéntico al playground): subidas en 5,1 · 8,2 · 11,2 · 14,2 s… → **cada 3 s**; con la
    solución, 5,1 · 15,7 · 26,2 s → **cada 10,5 s**. Corregido. Las demás cifras (16 → 4 cambios, 213 → 117 frames lentos)
    son correctas. La solución usa ahora `this.descartarMs` en vez del 250 literal (mismo resultado).

### En `recursos/m7kit.js` (cambios compatibles: ninguna firma ni comportamiento por defecto cambia)

- **Bug**: `app.destruir()` sobre una app creada sin WebGL2 lanzaba `ReferenceError: Cannot access 'ro' before
  initialization` (zona muerta temporal: `crearApp` retorna antes de declarar `const ro/io/alVisibilidad`, y `destruir` las
  usa; reproducido en Node con el mismo patrón). El ejemplo 7.1.5 lo esquivaba con `if (app && app.gl)`. Arreglado con
  `if (!gl) return;` tras `destruido = true; revisar();`.
- `conDefines`: regex `/^[ \t]*#version/` (punto 15). Solo lo usa 7.1 (grep).
- `Calidad`: nueva opción `descartarMs` (por defecto 250, el valor de antes) para poder usar la calidad adaptativa en
  equipos que van por debajo de 4 fps.
- Comentario de cabecera de `crearApp`: añadida la opción `dtMax`.
- Revisado sin cambios: `Reloj`, `suavizar` (coincide con 2.4), `Muelle` (Euler semi-implícito, subpasos 1/240), `parametrosMuelle`
  (ζ a partir del rebote y asentamiento al 2 %), `easings` (backOut con c1 = 1,70158, c3 = c1 + 1), `Puntero`, `flotante`.
- `m7.css`: usa solo variables del tema que existen en `curso.css` (`--ok`, `--err`, `--accent-soft`, `--radius-sm`,
  `--mono`, `--text-2`); sin cambios.

Comprobado que 7.2–7.6 no dependen de lo cambiado: `conDefines` solo aparece en 7.1; `destruir()` solo se llama en 7.1
(7.6 usa su propio `motor.js`); `Calidad` mantiene el comportamiento por defecto. Verificada 06-proyecto-final.html (que
usa `calidad`) junto con 7.1 en tema claro (ver (g)).

### Comprobado y correcto (sin cambios)

Todo lo demás que afirma la lección y que no depende del M1, en este Chromium: los mensajes del bestiario
`m7-locations-viejas` (`uniform4f: location is not from the associated program`, `useProgram: object does not belong to
this context`, píxel (0,0,0,0), `isProgram(viejo) === false`); `getExtension` devuelve `null` con el contexto perdido y el
objeto pedido antes sigue sirviendo después; `--disable-webgl2` → `null` y `webglcontextcreationerror` *durante* la llamada
con `disabled by enterprise policy or commandline switch`, WebGL1 disponible; `#define` + `#line 2` (error de la línea 6 en
0:6, sin `#line` en 0:9); `RADIO 2 * 0.5` da exactamente los dos errores citados; el orden ResizeObserver-después-de-rAF;
las cuentas (k = 0,69 → 2667 × 1500; 0,85² = 0,72 → 28 %; 9/4 = 2,25; escalas 0,85⁵ y 0,85⁶ → 639 × 399 y 543 × 339; t final
0,14175 del ejercicio 7.1.2). Todos los playgrounds, manejados uno a uno (`interactuar*.mjs`): pausa y ×0,25 del reloj,
perder/recuperar en 7.1.3 (`iniciar() × 2`, reloj parado mientras tanto), gestor de escenas (consola y «vivas» tras la
pérdida), las cuatro alternativas de 7.1.5, recarga en caliente con error y arreglo, y las cinco soluciones (las de 7.1.1 y
7.1.3 producen consola limpia y «✓ ningún error de GL tras recuperar»).

## (b) Problemas pendientes (no corregidos) con propuesta

1. **Fallback que no libera la GPU** (m7kit `fallar`): cuando la app falla (shader que no compila, excepción en el bucle)
   el contexto WebGL sigue vivo hasta que alguien llame a `destruir()`. En una página con varios efectos, cada fallo deja
   un contexto ocupando memoria y contando para el límite de ~16. Propuesta (cambio de comportamiento, por eso no lo hice):
   opción `liberarAlFallar` en `crearApp` que llame a `destruir()` dentro de `fallar`, o una frase en «Cuando algo falla en
   producción» recomendando `app.destruir()` en el callback `fallar`.
2. **Contexto que no vuelve**: la tabla de «Cuando algo falla» recomienda una alternativa si `webglcontextrestored` no llega
   «al cabo de unos segundos», pero `crearApp` no lo implementa (ni lo hace ningún ejemplo). Propuesta: ejercicio corto o
   una opción `esperaRestauracionMs` que llame a `fallar('el contexto no volvió')`.
3. **Ejemplo 7.1.7**: el controlador ve como «falta de GPU» la compilación síncrona de cada variante (lo dice ahora el texto).
   Si se quiere que la demo sea limpia: compilar las variantes con `KHR_parallel_shader_compile` como en 7.1.6, o tras
   compilar hacer `app.calidad.mediaMs = app.calidad.objetivoMs` en el frame siguiente.
4. **`app.fps` por debajo de 4 fps** se queda congelado (ver (a)11). Las demos de 7.5 con millones de partículas, en un
   equipo débil, mostrarían una cifra falsa (no he comprobado de dónde salen las cifras de las tablas de 7.5, p. ej. «1,3 fps»). Propuesta compatible: en el
   bucle de `crearApp`, `const ivf = Math.min(iv, 1000)` y contar todo `iv > 0` (las pausas ya llegan como 0). No lo cambié
   porque altera lo que muestran 7.2–7.5 en equipos lentos.
5. **Lienzo con el contexto perdido**: la lección (ejemplo 7.1.3) y 5.1 dicen que se vuelve transparente (medido en el M1).
   En SwiftShader/headless se ve **blanco**. Probablemente es propio de SwiftShader (no lo cambio); anotado por si alguien lo
   ve en otro equipo.

## (c) Pendientes de medir en el M1

Script listo: `herramientas/estado/lab/rev-m7-1-tiempos.mjs` (método fiable: cada dibujo en su propia pasada, dos FBO
alternos con `clear`, `readPixels` al final de cada tanda, mediana de 7 tandas; comentario único en cada shader para que no
influya la caché de programas). Uso en el Mac: `cd herramientas && node estado/lab/rev-m7-1-tiempos.mjs`
(`--rapido` = prueba de humo con tamaños /8; probada aquí en SwiftShader, ver (g)).

| Cifra | Dónde | Cómo se midió | Estado |
|---|---|---|---|
| 5,1 / 16,7 / 35,9 ms a 800×500 / 1600×1000 / 2400×1500 y «×7 entre DPR 1 y 3» | 5.10 l.444 y l.559 (antes también 7.1 «Tamaño» punto 1) | desconocido; el 16,7 coincide con un periodo de vsync | 7.1 ya no cita el número. **Re-medir** (grupo A del script, con el shader exacto del laboratorio 5.10.5, u_n = 60 y 300) y corregir 5.10 |
| Intervalos 66,7 / 33,3 / 16,7 ms a escala 1 / 0,75 / 0,5 (1440×900, 1500 iteraciones) | 7.1 «Presupuesto de rendimiento», tabla | intervalos entre callbacks de rAF, un dibujo por frame presentado: **método fiable** para lo que afirma (el intervalo que ve el usuario), no es el «N dibujos sobre el mismo framebuffer» | Sin cambio. Contraste opcional: grupo B (el tiempo de GPU por dibujo debería caer entre 50 y 66,7 / 16,7 y 33,3 / <16,7 ms) |
| 1440×900 → 543×339 en 4,2 s, 14 → 60 fps, oscilación a 639×399 cada 3 s | 7.1, párrafo tras el código de `medir` y bestiario `m7-calidad-oscila` | mismo método (rAF, un dibujo por frame) | Fiable; contraste opcional: grupo C (543×339 debe caber en 16,7 ms y 639×399 no) |
| 177,5 ms de bloqueo, listo en 10 frames, 0,1 ms por consulta | 7.1 «Recarga en caliente» | tiempo de CPU del hilo principal (no es tiempo de GPU) | No requiere el método de pasadas; en esta máquina no se puede repetir (SwiftShader no ofrece `KHR_parallel_shader_compile`) |
| 0,3 / 1,2 / 2,7 px (máx. 0,6 / 1,8 / 8,6) DOM↔GL | 7.1 «Un único bucle» | 40 capturas en Chrome | Atribuido al M1 (sesión 1 se hizo en el Mac del dueño): **confirmar** que fue allí |
| `desynchronized` concedido `false` | 7.1 caja senior y 5.1 | `getContextAttributes()` | Atribuido a macOS/M1 como en 5.1; aquí (Linux) `true` |

## (d) Problemas en archivos ajenos

1. **`herramientas/verificar.mjs` l.190 (capturas de componentes) y l.169 (capturas de soluciones)**: `ElementHandle.screenshot`
   de un playground más alto que la ventana (los `data-apilado` miden ~1 000 px) hace que el iframe del resultado se recree
   (medido: el reloj del ejemplo 7.1.2 pasó de t = 2,68 s a 0,33 s justo después de una captura), así que muchas capturas
   salen con el resultado recién arrancado: lienzo negro y consola vacía (en 7.1: ejemplos 7.1.2, 7.1.4, 7.1.5, ejercicios
   7.1.1–7.1.4 y sus soluciones). Engaña al revisar «¿se ve lo que dice el texto?». Propuesta: tras `scrollIntoView`, esperar
   a que el iframe sea el mismo durante ≥1,5 s y capturar con `page.screenshot({ clip, captureBeyondViewport: false })`
   recortado a la ventana (como hice en `exp/interactuar2.mjs`), o al menos esperar 2–3 s *después* de la captura y
   repetirla. Con capturas de ventana, todo se ve bien.
2. **`modulos/05-webgl/10-depuracion.html` l.444 y l.559**: las cifras 5,1 / 16,7 / 35,9 ms y «tardó 7 veces más» (ver (c)).
3. **Glosario A.4, entrada `g-line-directiva`**: podría añadir la semántica comprobada («`#line N`: la línea siguiente cuenta
   como la N; `#line N S`: además, cadena S, que aparece como prefijo `S:` en los errores») y el enlace al hack de 7.1.
4. **Glosario A.4, `g-calidad-adaptativa`**: si se quiere, mencionar que el intervalo entre frames es la medida y que por
   debajo de ~4 fps hace falta `descartarMs` (opcional).

## (e) Cajas bestiario de 7.1

| data-id | data-titulo | Síntoma del «Diagnóstico rápido» (A.1) |
|---|---|---|
| `m7-camara-lenta-parcial` | Con la cámara lenta (o la pausa), unas cosas se ralentizan y otras no | animación a distinta velocidad (A.1: «Animaciones CSS y WAAPI que no obedecen»; también «Saltos al volver, tras una pausa…») |
| `m7-locations-viejas` | Tras recuperar el contexto, la escena sale negra (o transparente) | contexto perdido (A.1: «El canvas se queda vacío o deja de dibujar» y «Mensajes de WebGL en la consola»; secundario: pantalla negra) |
| `m7-define-entero` | Al inyectar un número desde JavaScript, el shader deja de compilar («wrong operand types») | otro: el shader no compila (A.1: «El shader no compila o el programa no enlaza») |
| `m7-calidad-oscila` | La nitidez del fondo cambia cada pocos segundos (y hay un tirón en cada cambio) | rendimiento/tirones (A.1: «Tirones y lentitud»; secundario: «Borroso, pixelado o dentado») |

## (f) Términos para el glosario A.4 (los que aún no tiene; ya existen: bucle de animación, calidad adaptativa, DPR,
estado de una app, interpolación bilineal, KHR_parallel_shader_compile, #line, mejora progresiva, pérdida de contexto,
recarga en caliente, reloj propio, visibilitychange, presupuesto de frame)

- **escala de tiempo** (*time scale*) — factor que multiplica el `dt` de la animación: 1 normal, 0,25 cámara lenta, 0 congelado; el límite de `dt` se aplica antes. → `01-arquitectura.html#un-reloj-propio`
- **pausar el bucle / pausar el tiempo** — no pedir más frames (coste cero, nada reacciona) frente a seguir dibujando con `dt = 0` (la escena se congela, el puntero sigue). → `#pausar-cuando-nadie-mira`
- **caché de GPU (recursos recreables)** — programas, locations, buffers, VAOs, texturas y FBOs: copias que se reconstruyen desde sus descripciones con `iniciar`/`redimensionar`; no son estado. → `#el-estado-vive-en-javascript`
- **estado derivado** — lo que se recalcula al dibujar a partir del estado y del tamaño de ese frame (`u_resolution`, puntero en píxeles del búfer, matriz de proyección). → `#el-estado-vive-en-javascript`
- **gestor de escenas** (*scene manager*) — objeto que decide qué escena de un mismo contexto se actualiza y dibuja, cuándo se inicia cada una y si al salir se libera. → `#varias-escenas-un-solo-contexto`
- **iniciación perezosa** (*lazy initialization*) — crear los recursos de una escena la primera vez que se necesita, no al arrancar. → `#varias-escenas-un-solo-contexto`
- **alternativa** (*fallback*) — contenido estático (degradado, imagen, vídeo) que sustituye al efecto cuando no hay WebGL2, el shader no compila o el bucle lanza. → `#cuando-algo-falla-en-produccion`
- **webglcontextcreationerror** — evento que llega durante `getContext` cuando no se puede crear el contexto; `statusMessage` trae el motivo (p. ej. `disabled by enterprise policy or commandline switch`). → `#cuando-algo-falla-en-produccion`
- **WEBGL_lose_context** — extensión con `loseContext()`/`restoreContext()` para simular la pérdida (y liberar la GPU al destruir); pídela antes de perder el contexto, porque con él perdido `getExtension` devuelve `null`. → `#recursos-y-perdida-de-contexto`
- **desynchronized** — atributo de `getContext` que pide un canvas de baja latencia presentado sin esperar al DOM (posible *tearing*); es una petición que el sistema puede denegar. → `#un-unico-bucle-para-todo`
- **límite de DPR / tope de píxeles** (`dprMax`, `pixelesMax`) — factores que reducen el búfer por debajo de los píxeles físicos: `min(1, dprMax/dpr)` y, si el área supera el tope, ambos lados por `√(tope/área)`. → `#tamano-lo-que-5-1-no-podia-saber`
- **variante de shader** — cada versión compilada de un mismo shader con distintos `#define` inyectados (octavas, calidad, depuración); el precio es una compilación por variante. → `#inyectar-define-sin-romper-nada`
- **COMPLETION_STATUS_KHR** — consulta de `KHR_parallel_shader_compile` que dice, sin bloquear, si un programa ha terminado de compilar y enlazar (puede ir dentro de la entrada existente). → `#recarga-en-caliente-sin-congelar-la-pagina`
- **histéresis** — en un controlador, no deshacer enseguida una decisión: subir solo con holgura sostenida y recordar el nivel que falló para no oscilar. → `#presupuesto-de-rendimiento-calidad-adaptativa` (bestiario `#m7-calidad-oscila`)
- **backoff exponencial** — esperar cada vez más (10 s, 20 s, 40 s…) antes de reintentar algo que falló, y reiniciar la espera cuando funciona. → `#ejercicio-7-1-5-calidad-que-no-oscila`
- **modo bajo demanda** — el bucle solo pide el siguiente frame si alguien llamó a `pedirFrame()`; si no, se duerme (explicación principal en 7.3). → `#todo-junto-m7-crearapp`

## (g) Verificación final

- `node verificar.mjs ../modulos/07-integracion/01-arquitectura.html --soluciones --capturas …` (tema oscuro):
  **✓ 0 problemas** — js=13, ejemplos=7, ejercicios=5 (niveles 1-2-2-2-3), quiz=4, anotado=8, callouts=13 (bestiario 4,
  senior 4), h2=14, soluciones=5 (las 5 se ejecutan sin error).
- `node verificar.mjs 01-arquitectura.html 06-proyecto-final.html --tema light --soluciones --capturas …`: **2/2 sin
  problemas** (06 incluida porque usa `calidad` de m7kit).
- `node movil.mjs ../modulos/07-integracion/01-arquitectura.html`: **✓ scrollWidth = 390 / 390** (sin desbordamiento).
- `node enlaces.mjs ../modulos/07-integracion/01-arquitectura.html`: **60 enlaces internos, 0 rotos** (no cambié ningún
  título h2/h3: otras lecciones y los anexos enlazan a sus anclas).
- Mínimos de la guía §6 cumplidos (≥2 ejemplos, ≥3 ejercicios graduados con pistas y solución, ≥2 quizzes repartidos,
  senior y bestiario, resumen, «Para profundizar»).
- Capturas: las de `verificar.mjs` no sirven para juzgar varios playgrounds (ver (d)1). Revisé los estados con mis
  scripts: por su texto de estado y su consola, todos los playgrounds (`exp/interactuar.mjs`); y con capturas de ventana
  (`exp/interactuar2.mjs`), el 7.1.3 antes y después de perder el contexto, las cuatro alternativas del 7.1.5, el paisaje
  ondulando tras recuperar en la solución del ejercicio 7.1.3 y el anillo sobre el halo en la del 7.1.1. Tema claro: los playgrounds conservan su fondo oscuro propio y
  las tablas usan variables del tema.
- Laboratorio `herramientas/estado/lab/rev-m7-1-tiempos.mjs --rapido` probado aquí (SwiftShader): funciona y da los 12
  casos; las cifras de SwiftShader **no** sirven para el curso, hay que ejecutarlo sin `--rapido` en el M1.
