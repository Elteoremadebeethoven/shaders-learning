# Revisión de la lección 7.5 · Partículas en la GPU (rev-m7-5, sesión 3)

Archivos revisados y tocados: `modulos/07-integracion/05-particulas-gpu.html` y `modulos/07-integracion/recursos/l75-particulas.js`. Nuevo: `herramientas/estado/lab/rev-m7-5-medir.html` (laboratorio para medir en el M1 las cifras pendientes). La lección no tenía informe de autor ni revisión previa.

Máquina de esta revisión: contenedor Linux sin GPU, Chromium 141 headless con WebGL por **SwiftShader**. No he sustituido ninguna cifra del M1. Lo que he comprobado aquí es semántica de WebGL/GLSL/JS, cálculos que no dependen de la GPU (el gemelo en JavaScript del campo) y que todo compila, se ejecuta y se ve bien.

**Resultado final:** la lección pasa `verificar.mjs --soluciones --capturas` en tema oscuro **sin problemas**, con el estado final (la verificación empezó después de la última edición). Las cuatro soluciones funcionan y, en tres ejercicios, el código de partida falla su prueba como debe; en el cuarto (7.5.3), el fallo de partida solo se vio en la captura (ver g). Enlaces: 61 internos, 0 rotos. Móvil (390 px): sin desbordamiento. Tema claro: revisado con capturas propias de diagramas, tablas y cajas. La verificación completa `--tema light` no llegó a terminar (ver g).

---

## (a) Cambios hechos y por qué

### Errores técnicos corregidos
1. **Sentido del desplazamiento del campo** (anotado de `L75.RUIDO`, líneas 10-11). El texto decía que la primera octava se mueve «hacia arriba a 0,11 celdas/s» y la segunda «hacia la derecha». Es al revés: sumar `0.11 * t` a la coordenada mueve el dibujo hacia abajo, y `+0.17 * t` en x lo mueve a la izquierda. Comprobado con el gemelo en JavaScript (`deriva.mjs`: el dibujo de t = 0 aparece en t = 1 desplazado (0, −0,11) celdas, y la segunda octava (−0,085, 0)). Corregido, con enlace al bestiario de 3.5 «En el shader todo se mueve al revés» (`m3-rotacion-inversa-shader`).
2. **Divergencia del rotacional calculado en celdas** (anotado, línea 17). Decía $(s_x - s_y)\,\partial^2\psi/\partial x\partial y$, mezclando derivadas en el mundo con la escala de las celdas. Lo correcto, con $u = s_x x$ y $v = s_y y$, es $(s_x - s_y)\,\partial^2\psi/\partial u\,\partial v$. Reescrito así, con la definición de $u$ y $v$.
3. **El pool de 2.8 «encaja sin cambios»** (Enfoque 1). Falso: 2.8 usa SoA (un `Float32Array` por campo) y 7.5 entrelaza los campos de la GPU en un solo array (AoS, stride de 20 bytes). Ahora el texto lo explica: por qué se entrelaza (una subida y un stride) y que con SoA serían cinco buffers y cinco `bufferSubData`. De paso cumple la promesa de 1.6 (l. 384), que anunciaba SoA «en las partículas en GPU de la 7.5».
4. **`EXT_float_blend`** (bestiario `m7-5-aditivo-invisible`). El texto decía que la mezcla en `RGBA32F` «funcionó sin error aunque solo habíamos pedido `EXT_color_buffer_float`», sin explicar por qué. La especificación de Khronos (`extensions/EXT_float_blend/extension.xml`) dice que la extensión se activa sola al activar `EXT_color_buffer_float`, pero solo donde el sistema la admite. Lo he comprobado aquí: mezclar 1000 × 0,001 en `RGBA32F` sin pedirla dio `NO_ERROR` y 0,99999. Reescrito: por qué funciona, que donde no la hay el dibujo da `INVALID_OPERATION`, y que `getExtension('EXT_float_blend') === null` es la señal para acumular en `RGBA16F`.
5. **Techo de la suma en `RGBA16F`** (párrafo tras la tabla de mezcla y bestiario aditivo). El texto daba el techo de 2,0 como general. Ese techo sale del truncamiento del M1. En SwiftShader, que redondea al más cercano, 5000 × 0,001 llegó a **4,0**, no a 2,0, y un 0,500333 escrito en `RGBA16F` se guardó como 0,500488 (redondeado hacia arriba). Ahora el texto dice que el techo existe siempre y que su valor depende de cómo redondee la GPU. En el bestiario `m7-5-half-congeladas` añadí el contraste: el M1 trunca, SwiftShader redondea, y con cualquiera de las dos reglas un paso menor que medio ULP se pierde.
6. **Filtro por defecto de WebGL** (bestiario `m7-5-todas-en-el-centro`). Atribuía la incompletitud con `NEAREST_MIPMAP_LINEAR` a la falta de `OES_texture_float_linear`. En realidad, sin mipmaps, ese filtro deja incompleta una textura de cualquier formato. Reescrito; comprobado aquí (`texelFetch` → (0, 0, 0, 1) en el VS y en el FS).
7. **`multiplicar por 0 es más barato que ramificar`** (solución del ejercicio 7.5.2). Es discutible: un `if` sobre un uniform no diverge y se salta el trabajo. Reescrito: el término se anula solo, un `if (u_raton.z != 0.0)` tampoco costaría casi nada (misma rama para todos, enlace a 4.1), y sin él el código es más corto.
8. **Analogía de la inercia** (caja senior «Sin sumideros no significa sin grumos»). «Como la arena en un vaso de agua que gira» invita a la objeción de la paradoja de las hojas de té (en un vaso removido, las hojas se juntan en el centro del fondo). Cambiada por la centrifugadora, añadiendo que se acumulan entre remolinos (que es la concentración preferente).
9. **Resolución de `performance.now()`.** Atribuía los 100 µs a «un iframe sin aislamiento de origen». No es cosa del iframe: pasa en cualquier página sin aislamiento de origen cruzado (como dice 1.5, enlazada ahora).

### Huecos de contenido rellenados
10. **`L75.PASO` no se mostraba en ninguna parte.** La función `avanzar` (flujo, arrastre exponencial, atracción del ratón, Euler, vuelta del mundo) solo se podía ver con `console.log`, aunque la caja senior hablaba de `ARRASTRE = 2` y de `v = flujo`. He añadido un anotado de 16 líneas tras el de `L75.RUIDO`, con el código real de `l75-particulas.js`, explicado línea a línea:
    - los uniforms;
    - `FLUJO` y `ARRASTRE`;
    - `inout` (6.1);
    - el suavizado exponencial exacto de 2.4, con semivida ln 2/2 ≈ 0,35 s;
    - el softening de 2.8;
    - **Euler semi-implícito (2.5)**, con guion;
    - `mod` de GLSL frente al `%` de JS (1.3), y su relación con la costura.
11. En la lista de `actualizar` del ejemplo 7.5.1 se nombra ahora el Euler semi-implícito (2.5). Antes el código lo usaba sin decirlo.
12. Sobre el método de la comparativa, he añadido por qué es fiable según el §4 del plan. Cada frame alterna de framebuffer (simulación en textura o buffer, dibujo en el canvas) y el dibujo es aditivo, así que no hay trabajo tapado que la GPU se pueda ahorrar. El enlace va ahora al ancla de la caja de 6.6 (`#medir-coste-shader`).
13. Cifras de la demo grande: el búfer «de unos 740 × 420 píxeles» implica `devicePixelRatio` 1 (headless). Lo digo, y añado que en Retina el búfer mide el doble por eje y cada punto cubre 4× más píxeles.

### Degradación sin `EXT_color_buffer_float` (pedido del encargo)
14. **Ejemplo 7.5.2**:
    - Antes, sin la extensión, el lienzo se quedaba negro y solo aparecía un error en la consola.
    - Ahora `crearApp` recibe `fallar(motivo)`, que escribe en el panel: «error al iniciar: sin EXT_color_buffer_float: esta GPU no puede renderizar en RGBA32F · el ejemplo 7.5.3 (transform feedback) no la necesita».
    - En la lista de explicaciones hay una viñeta que enlaza a `#que-funcione-en-el-equipo-de-tu-usuario`.
    - Comprobado anulando la extensión con un parche de `getExtension` en todos los marcos (`sinext.mjs`): el mensaje aparece y 7.5.3 funciona.
15. **Ejemplo 7.5.4**:
    - Antes, sin la extensión, el método «texturas» (el de arranque) lanzaba una excepción dentro de `dibujar`. `crearApp` paraba el bucle para siempre y el selector ya no servía de nada.
    - Ahora `iniciar` anota si existe la extensión, y `dibujar` cambia a transform feedback, actualiza el selector y lo avisa en la línea de información: es el `elegirMetodo` de la última sección, aplicado a la demo.
    - El texto bajo la demo lo explica.
16. Los ejercicios con texturas ya lanzaban `Error('sin EXT_color_buffer_float')`, que el playground muestra en su consola, y eso basta para un ejercicio. Pero en 7.5.1 y 7.5.2 la prueba «no la toques» leía después `app.gpu.A` y añadía un `TypeError` confuso. He añadido `if (!app.gpu) return;` al principio de las dos pruebas, en el código de partida y en la solución. En 7.5.4 la prueba solo lee el canvas y en 7.5.3 no hay extensión que falte.

### Otras correcciones menores
17. «`M7.crearApp` y `M7.Puntero` de 7.2»: `crearApp` es de 7.1. Corregido.
18. «Las mismas unidades que 7.1 recomendaba»: 7.1 recomienda unidades independientes del búfer (0…1, px CSS), no estas. Reescrito como «unidades independientes del búfer, como pedía 7.1».
19. «Propuesta por Robert Bridson»: el artículo es de Bridson, Hourihan y Nordenstam. Ahora dice «Bridson y sus coautores».
20. Enlaces al ejercicio 6.6.4 con ancla (`#ejercicio-6-6-4-un-fbm-que-se-repite-sin-costuras`), dos veces.
21. Tabla comparativa, fila «Precisión» del enfoque CPU: «float64 al simular» → «float64 al calcular, float32 al guardar», porque el estado vive en un `Float32Array`.
22. `l75-particulas.js`: eliminada la clase `L75.MedidorGPU` (`EXT_disjoint_timer_query_webgl2`), que no usaba nadie. Contradecía la regla «nada de magia; cada pieza se construye a mano en la lección» y la advertencia de 5.10/6.6 sobre esa extensión. `grep` en todo el curso: sin usos.

### Afirmaciones comprobadas en este Chromium (sin cambios, quedan respaldadas)
Experimento `exp1.html`, en el scratch del agente:
- **FBO float:** sin extensión, un FBO `RGBA32F`/`RGBA16F` da `0x8CD6`. Con ella, `RGBA32F`, `RG32F` y `RGBA16F` quedan completos (`0x8CD5`) y `RGB32F` sigue dando `0x8CD6`. `RGBA16F` se filtra con `LINEAR` sin extensiones.
- **`texelFetch` y completitud:** `texelFetch` de una `RGBA32F` con `LINEAR` devuelve (0, 0, 0, 1) en el VS y en el FS, y con `NEAREST` el valor correcto. Bucle de realimentación con textura completa: `GL_INVALID_OPERATION: glDrawArrays: Feedback loop formed between Framebuffer and active Texture.` Con la textura incompleta: `NO_ERROR` (la «curiosidad medida» del bestiario).
- **Mensajes literales de transform feedback** (coinciden con los del texto):
  - `useProgram: transform feedback is active and not paused`;
  - `not enough transform feedback buffers bound`;
  - `Draw mode must match…`;
  - `Not enough space in bound transform feedback buffers`;
  - `A transform feedback buffer that would be written to is also bound to a non-transform-feedback target…` (con el buffer de salida en `ARRAY_BUFFER` y en `UNIFORM_BUFFER`; con el de entrada en `ARRAY_BUFFER`, sin error);
  - `It is undefined behavior to use a vertex buffer that is bound for transform feedback`.
- **Más transform feedback:** con divisor 1, las cuatro salidas son copias de la partícula 0. `getTransformFeedbackVarying` → `v_pos`, `0x8B50`, 1. Un VS sin `gl_Position` compila sin avisos.
- **Estado y descarte:** `RASTERIZER_DISCARD` también anula `clear`. `UNPACK_FLIP_Y_WEBGL` voltea un `Float32Array` (texel (0, 0) = 0,75).
- **Mezcla en 8 bits:** 100 × 0,0019 → 0 niveles; 100 × 0,002 → 100; 100 × 0,005 → 100; 100 × 0,0015 → 0. Las mismas cifras que en el M1.
- **Límites:** `MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS` 128 y `SEPARATE_ATTRIBS` 4 (como en el M1). `ALIASED_POINT_SIZE_RANGE` [1, 1023] (el M1 da [1, 511]).
- **Punto con el centro fuera:** un punto de 32 px con el centro fuera del lienzo **también se dibuja en parte en SwiftShader**. El texto ya era prudente («no lo des por hecho»).
- **Estadísticas de rotacional frente a gradiente** (`curl-stats.mjs`, mismo gemelo de JS, 20 000 partículas, 40 × 24 celdas, dt = 1/60):

  | Caso | 5 s (celdas ocupadas) | 30 s (celdas ocupadas) | 5 % más pobladas | CV |
  |---|---|---|---|---|
  | Gradiente | 63,6 % | 4,0 % | 100 % | — |
  | Rotacional | 100 % | 100 % | 7,5 % | 0,22 |
  | Con inercia | — | 94,8 % | 21,8 % | 1,06 |

  Coincide con las tablas de la lección. La versión «sin periodicidad» del bestiario de la costura no la puedo reproducir exactamente: no se sabe cuál usó el autor. Con la mía (3 celdas, sin `mod`, sin inercia) sale 37,5 % en el 5 % de celdas más pobladas, frente al 46 % del texto. Es el mismo fenómeno y no lo cambio.

---

## (b) Problemas pendientes (con sección y propuesta)

1. **Demos que arrancan solas.** Los playgrounds JS se ejecutan al hacerse visibles (no hay opción para no hacerlo).
   - Situación:
     - La demo grande (7.5.4) arranca con 65 536 partículas y sube con botones, que es lo que pedía el encargo.
     - Los ejemplos 7.5.2 y 7.5.3 arrancan con 262 144.
     - El ejercicio 7.5.4 arranca con **1 048 576**: ≈ 12,8 ms por frame en el M1 y mucho más en una GPU integrada modesta, mientras esté a la vista.
   - Decisión: lo dejo, porque el ejercicio necesita el millón para que se vea el fenómeno. Si el dueño lo quiere más prudente, hay dos opciones:
     - una opción `data-manual` en `playground-js.js` (no ejecutar hasta pulsar ▶), que no es mío;
     - bajar el ejercicio a 512² = 262 144 con la misma intensidad. Calculado: el centro quedaría en ≈ 0,13 de brillo medio, por encima del umbral 0,04 de la prueba. Habría que cambiar el título («Un millón de luciérnagas») y el texto.
2. **Cifras de 4 M que no cuadran entre sí** (Comparativa, tercera viñeta).
   - Simular (9,5 ms) + dibujar (35 ms) suman 44,5 ms, pero el frame completo de la tabla son 56 ms.
   - Con 1 M sí cuadran: 2,4 + 8,2 ≈ 10,6 frente a 12,8.
   - 44,5 coincide en cambio con los 44 ms de la demo en un búfer de 740 × 420: sospecho que las medidas «por separado» se hicieron con otro tamaño de lienzo.
   - No es demostrable sin el M1: va al apartado (c).
3. **Bestiario de la costura: el 46 %** no es reproducible sin saber la versión exacta (ver arriba). Propuesta: si se re-mide, describir la versión sin periodicidad en una frase.
4. **Longitud.** La lección tiene ~18 000 palabras de texto (la guía orienta 3 500–8 000). No he recortado nada: todo es técnico y sin relleno. Si se quisiera aligerar, la tabla de cifras de mezcla y la caja senior «Subir datos a un buffer que la GPU todavía está usando» son las más prescindibles.
5. **7.4 promete partículas «con memoria (posición, velocidad, edad)»** (7.4 l. ~2406). En 7.5 las partículas de la GPU no tienen edad; solo la caja hack «¿Y la edad?» explica cómo añadirla. Es aceptable. Si se quiere afinar, en 7.4 bastaría «(posición, velocidad y, si hace falta, edad)».

---

## (c) Pendientes de medir en el M1

Todas las cifras de la lección son del M1 (Chrome, ANGLE/Metal) y lo dicen.

**El método de la comparativa y del botón «medir GPU» no es el engañoso del §4.** Son 20 frames completos con `readPixels` final. Cada frame alterna de framebuffer (simulación en un FBO o buffer distinto del anterior, dibujo en el canvas con `clear`) y el dibujo es aditivo. Además se contrastó con los fps reales. Por eso no he cambiado esas cifras.

**Quedan sin método documentado** las medidas «por separado». Para medirlas con el método fiable (cada dibujo en su pasada, dos FBO alternos, `clear`, `readPixels`, mediana de 5 tandas de 20) he dejado el laboratorio **`herramientas/estado/lab/rev-m7-5-medir.html`**:
- **Uso:** abrir con `file://` en el Chrome del M1 y pulsar «medir», o `page.evaluate(() => medirTodo())`.
- **Qué mide** (1 M y 4 M; 16 K y 65 K con `?rapido`):
  - el frame completo de texturas y de transform feedback;
  - la simulación sola;
  - el dibujo solo en FBO alternos y en el canvas;
  - para 1 M, acumular en `RGBA16F` + tono, frente a dibujar directo al canvas.
- **Prueba de humo en SwiftShader** (`?rapido`, 16 K y 65 K): se ejecuta entera sin errores. Sus cifras de software no significan nada para el M1.

Cifras que hay que confirmar con él:
1. «La simulación del millón costó 2,4 ms (2,8 con transform feedback) y dibujar los puntos, 8,2 ms». También «con cuatro millones: 9,5 ms de simulación frente a 35 ms de dibujo», que no cuadra con los 56 ms del frame completo (ver b.2). Repetido en el resumen final («8,2 ms … frente a 2,4 ms»).
2. Ejercicio 7.5.4, solución: «acumular … y llevarlo al canvas costó 5,5 ms, *menos* que dibujarlos directamente en el canvas (8,4 ms)». Es una anomalía que el autor no supo explicar. El texto ya la relativiza, pero conviene confirmarla con el método fiable o quitarla.
3. «El mismo millón de puntos, colocados todos fuera de la pantalla, se dibujó en 0,6 ms».
4. «8,3 ms con puntos de 1,5 px, 11,0 ms con puntos de 8 px».
5. «Un millón de quads de 2 px, 12,6 ms, frente a 8,6 ms de puntos».
6. «Antialiasing multimuestra: de 8,7 a 12,3 ms».

Con mezcla aditiva estas medidas probablemente son fiables aunque se hicieran sobre el mismo framebuffer, pero no consta el método.

Dependientes del M1 y plausibles, sin acción:
- el truncamiento de `RGBA16F` al escribir (en SwiftShader redondea: ya lo dice el texto);
- 0,977 y el techo de 2,0 en la tabla;
- `ALIASED_POINT_SIZE_RANGE` [1, 511];
- el sampler `lowp` sin pérdida;
- `bufferSubData` de 16 MB en uso (6,6 ms) y con orphaning (7,3 ms);
- `readPixels` de 16 MB (5,2 ms) y de 4 MB (2,1 ms);
- tablas de fps de 7.5.1 y de la demo (fps de extremo a extremo con rAF: medida razonable y ya dice qué mide).

---

## (d) Problemas en archivos ajenos

1. **`herramientas/verificar.mjs`, l. ~156 (`--soluciones`).** Tras pulsar «Ver solución» espera solo 1,8 s y no mira lo que imprimen las pruebas de los ejercicios (✓/✗ en la consola del playground).
   - En 7.5 las pruebas imprimen a 1,2–3 s. La captura `-sol-2.png` (ejercicio 7.5.2) sale en blanco porque se toma antes de que el iframe pinte, y un ✗ de la solución pasaría inadvertido.
   - Propuesta: opción `--espera-sol <ms>` y contar como fallo una línea de `.pg-consola` que empiece por «✗» tras la espera.
   - Yo lo he comprobado aparte con `ejercicios.mjs`; resultado en (g).
2. **`modulos/08-anexos/04-glosario.html`.** Las entradas «instancing» (l. ~1155), «ping-pong» (l. ~1661), «sistema de partículas» (l. ~2047) y «transform feedback» (l. ~2241) tienen `<!-- M7-PENDIENTE -->` para enlazar 7.5. Anclas:
   - instancing → `#los-datos-un-vertice-por-esquina-un-registro-por-instancia` o `#enfoque-1-la-cpu-simula-la-gpu-dibuja`;
   - ping-pong → `#enfoque-2-el-estado-en-texturas-float`;
   - sistema de partículas → `#donde-se-va-el-tiempo`;
   - transform feedback → `#enfoque-3-transform-feedback` (explicación principal; la de 5.9 es solo un adelanto).

   Otras entradas que conviene enlazar a 7.5: «mezcla aditiva», «float16/half float», «bucle de realimentación», «softening», «divisor», «orphaning», «tone mapping», «ULP», «PCG», «AoS y SoA», «swap and pop». El término nuevo «divergencia (de un campo)» choca con la entrada existente «divergencia» (ramas de un warp): propongo una entrada aparte o una acepción 2 (ver f).
3. **`modulos/08-anexos/01-bestiario.html` (Diagnóstico rápido).** Añadir los casos de 7.5 según el apartado (e).
4. **`modulos/01-web/06-binario.html`, l. 384.** Dice que el SoA se usará «en las partículas en GPU de la 7.5». Ahora 7.5 explica que para la GPU entrelaza (AoS) y por qué. Propuesta: «…en 2.8, y en la 7.5 verás por qué para la GPU conviene entrelazarlos».
5. **`assets/js/glkit.js`, `crearFBO`.** El filtro por defecto (`LINEAR`) deja incompleta una textura `RGBA32F` sin `OES_texture_float_linear`. Es la causa del bestiario `m7-5-todas-en-el-centro` y la premisa del ejercicio 7.5.1, que **depende** de ese valor por defecto. **No propongo cambiarlo**. Como mucho, documentarlo en la cabecera de `crearFBO` («con formatos de 32 bits usa `filtro: gl.NEAREST`»).
6. **`m7kit.js`:** no he encontrado errores en lo que usa 7.5 (`crearApp` con `fallar`/`redimensionar`, `Reloj`, `Puntero`).

---

## (e) Cajas bestiario de 7.5

Las ocho tienen prefijo `m7-5-` (empieza por `m7-`). `grep` en todo el curso: cada `data-id` aparece en un solo archivo y una sola vez.

| data-id | data-titulo | Síntoma del diagnóstico (A.1) |
|---|---|---|
| `m7-5-costura-hilos` | Con curl noise, las partículas forman hilos densos que nacen en los bordes | **otro** (en A.1: «Costuras, cortes y rejillas en patrones y ruido») |
| `m7-5-todas-en-el-centro` | Todas las partículas aparecen amontonadas en el centro (y no se mueven) | **textura negra** (lectura de textura incompleta = 0; en A.1: «La textura sale negra…» y «Algo desaparece sin ningún error») |
| `m7-5-half-congeladas` | Con RGBA16F, unas partículas se mueven y otras se quedan congeladas (o van más despacio) | **animación a distinta velocidad** (en A.1: «Va a otra velocidad según la pantalla») |
| `m7-5-no-avanza` | La simulación en la GPU avanza un paso y se congela (o no hace nada y avisa de un «feedback loop») | **otro** (en A.1: «Mensajes de WebGL en la consola»; también «Algo desaparece sin ningún error») |
| `m7-5-tf-dos-sitios` | El transform feedback no escribe nada: «A transform feedback buffer that would be written to is also bound to a non-transform-feedback target» | **otro** (en A.1: «Mensajes de WebGL en la consola») |
| `m7-5-rasterizer-discard` | Tras añadir transform feedback, el lienzo se queda vacío (ni siquiera funciona clear) | **pantalla negra** (en A.1: «El canvas se queda vacío o deja de dibujar») |
| `m7-5-divisor-colapso` | Tras el primer frame, todas las partículas saltan al mismo sitio | **otro** (en A.1: «Algo desaparece sin ningún error»; también «Geometría rota») |
| `m7-5-aditivo-invisible` | Con un millón de partículas tenues no se ve nada (o 0,002 brilla el doble que 0,0019) | **colores lavados/oscuros** (en A.1: «Colores lavados, oscuros o de otro tono»; también «Pantalla negra») |

---

## (f) Términos para el glosario A.4

Anclas de `modulos/07-integracion/05-particulas-gpu.html`; las he calculado con el `slug` de `curso.js`.

| Término | Definición (una línea) | Ancla |
|---|---|---|
| curl noise (ruido rotacional) | Campo de velocidades que es el rotacional de un ruido, $\vec v = (\partial\psi/\partial y, -\partial\psi/\partial x)$: sin divergencia, las partículas lo siguen sin amontonarse. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| campo de flujo (*flow field*) | Una velocidad definida en cada punto del plano, que cambia despacio con el tiempo, y que las partículas siguen como hojas en un río. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| rotacional (*curl*) en 2D | De un potencial escalar ψ: $(\partial\psi/\partial y, -\partial\psi/\partial x)$, el gradiente girado 90°; sigue las curvas de nivel de ψ. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| divergencia (de un campo vectorial) | $\nabla\cdot\vec v$: positiva en una fuente, negativa en un sumidero; cero en un fluido incompresible. No confundir con la divergencia de ramas de la GPU. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| sumidero | Punto o zona de un campo al que llega flujo y del que no sale; con el gradiente de un ruido, cada máximo. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| concentración preferente | Las partículas con inercia se acumulan entre los remolinos de un flujo aunque este no tenga divergencia. | `#un-campo-de-flujo-sin-sumideros-curl-noise` (caja senior) |
| diferencias centrales | Derivada aproximada $(f(x+e) - f(x-e))/2e$; el paso $e$ ni tan pequeño que la resta pierda precisión ni tan grande que se pierda detalle. | `#un-campo-de-flujo-sin-sumideros-curl-noise` |
| quad instanciado | Partícula dibujada como un cuadrado de 4 vértices (`TRIANGLE_STRIP`) que se repite por instancia con los datos de cada partícula (divisor 1). | `#los-datos-un-vertice-por-esquina-un-registro-por-instancia` |
| textura de estado | Textura float (p. ej. `RGBA32F`) en la que cada texel guarda los datos de una partícula; su posición en la textura es su identidad, no su posición en pantalla. | `#enfoque-2-el-estado-en-texturas-float` |
| `EXT_color_buffer_float` | Extensión de WebGL2 que hace renderizables las texturas `R/RG/RGBA` 16F y 32F (no `RGB32F`); sin ella, el FBO da `0x8CD6`. | `#tres-requisitos-que-no-perdonan` |
| `OES_texture_float_linear` | Extensión que permite filtrar con `LINEAR` texturas float de 32 bits; sin ella, esa textura está incompleta y se lee (0, 0, 0, 1), también con `texelFetch`. | `#tres-requisitos-que-no-perdonan` |
| `EXT_float_blend` | Extensión que permite mezclar (blending) sobre adjuntos float de 32 bits; se activa sola con `EXT_color_buffer_float` donde el hardware la admite. | `#mezcla-aditiva-sin-orden-pero-con-redondeo` |
| `texelFetch` | Lee un texel exacto por coordenadas enteras y nivel de mipmap, sin filtrado ni coordenadas normalizadas. | `#enfoque-2-el-estado-en-texturas-float` |
| `gl_VertexID` | Índice del vértice dentro del dibujo; con un VAO vacío permite generar vértices o leer datos de una textura sin ningún atributo. | `#enfoque-2-el-estado-en-texturas-float` |
| `RASTERIZER_DISCARD` | Estado global que detiene el pipeline tras el vertex shader: ni rasterización ni fragmentos (ni `clear`); se usa con transform feedback. | `#cada-frame-capturar-sin-rasterizar` |
| objeto de transform feedback | `createTransformFeedback()`: recuerda qué buffers reciben las salidas capturadas (puntos de enlace indexados, `bindBufferBase`), como un VAO recuerda de dónde se lee. | `#cada-frame-capturar-sin-rasterizar` |
| `transformFeedbackVaryings` (`INTERLEAVED_ATTRIBS` / `SEPARATE_ATTRIBS`) | Antes de enlazar, qué salidas del VS se capturan y cómo: todas seguidas en un buffer, o cada una en el suyo. | `#antes-de-enlazar-que-salidas-se-capturan` |
| pista de uso de un buffer (`STATIC/DYNAMIC/STREAM_DRAW/READ/COPY`) | Indicación al driver de quién escribe y quién lee el buffer y con qué frecuencia; no cambia lo que se puede hacer con él (`DYNAMIC_COPY`: lo escribe y lo lee la GPU). | `#ejemplo-7-5-3-la-misma-simulacion-con-transform-feedback-y-quads` |
| compute shader | Programa de GPU que lee y escribe buffers sin pasar por el pipeline de dibujo; en la web, solo en WebGPU (7.7). | `#ejemplo-7-5-4-de-16-000-a-4-millones-la-demo-grande` (caja senior justo después; si 7.7 tiene entrada principal, mejor allí) |

Entradas existentes a las que añadir 7.5: ver (d).2. «tone mapping» puede citar la solución del ejercicio 7.5.4 (`#ejercicio-7-5-4-un-millon-de-luciernagas`).

---

## (g) Verificación final

```
✓ ../modulos/07-integracion/05-particulas-gpu.html  (297477 ms)
   glsl=1 js=8 graficador=0 demo=0 ejemplos=4 ejercicios=4 quiz=4 anotado=8 callouts=19 bestiario=8 senior=7 h2=9 pres=3 palabras=18679 soluciones=4
1/1 páginas sin problemas
```

**Otras comprobaciones**

- **`node enlaces.mjs ../modulos/07-integracion/05-particulas-gpu.html`:** 61 enlaces internos, 0 rotos (incluidas las anclas nuevas).
- **`node movil.mjs`:** `✓ 05-particulas-gpu.html scrollWidth=390 / 390`.
- **Prueba de ejercicios y ejemplos** (`lab/rev-m7-5-pruebas.mjs`; resultado en `lab/rev-m7-5-pruebas-resultado.txt`), en SwiftShader:

  | Playground | Código de partida | Solución |
  |---|---|---|
  | Ejercicio 7.5.1 | ✗ «la simulación ha dejado la partícula en (0, 0)» | ✓ |
  | Ejercicio 7.5.2 | ✗ 2,4 % → 2,3 % | ✓ 2,3 % → 28,7 % |
  | Ejercicio 7.5.3 | ✗ en la captura de la verificación: 1 posición distinta | ✓ 2000/2000 |
  | Ejercicio 7.5.4 | negro (captura) | ✓ brillo 0,295 |

  - Ejemplo 7.5.2: el cambio a `RGBA16F` va sin errores.
  - Ejemplo 7.5.4: los tres métodos y «medir GPU» van sin errores.
  - Sin errores ni avisos de consola.
- **Sin `EXT_color_buffer_float`** (`getExtension` parcheado en todos los marcos):
  - 7.5.2 muestra el mensaje en el panel;
  - 7.5.3 funciona;
  - 7.5.4 pasa a transform feedback con el aviso;
  - el ejercicio 7.5.1 muestra `Error: sin EXT_color_buffer_float` (el `TypeError` de la prueba que aparecía después ya está corregido con la guarda, pero esa prueba sin extensión no se repitió).
- **Temas:** capturas propias en claro y oscuro de los dos SVG, las 7 tablas, el anotado nuevo y el bestiario aditivo: todo legible.
- **Capturas de la verificación vistas** (antes de los cambios): los 9 playgrounds y las 4 soluciones se ven como dice el texto. Excepción: `-sol-2.png` sale en blanco porque el verificador captura a los 1,8 s (ver d.1).

---

## Dónde me quedé (sesión 3)

**(a) Hecho y verificado**
- Todos los cambios del apartado (a), en `modulos/07-integracion/05-particulas-gpu.html` y `recursos/l75-particulas.js`.
- Verificación final en tema oscuro con `--soluciones` (0 problemas), iniciada después de la última edición (archivo modificado a las 20:22:46; capturas de 20:28).
- Enlaces y prueba móvil correctos.

**(b) Hecho pero sin verificar tras la última edición**
- La guarda `if (!app.gpu) return;` en las pruebas de los ejercicios 7.5.1 y 7.5.2 y la nota `data-l="8-9"` del anotado de `L75.PASO`. Las cubre la verificación final (empezó después), pero no se repitió la prueba sin extensión ni la de ✓/✗ de los ejercicios.
- `verificar.mjs --tema light --capturas` completo: se cortó (cola de Chrome y parada). El tema claro solo está revisado con `rev-m7-5-pruebas.mjs` (diagramas, tablas, anotado, bestiario).
- `herramientas/estado/lab/rev-m7-5-medir.html` solo se ha probado en SwiftShader con `?rapido`.

**(c) Pendiente, en orden**
1. **En el M1:** abrir `herramientas/estado/lab/rev-m7-5-medir.html` y pulsar «medir». Con el resultado, corregir en 7.5:
   - sección «Comparativa: medir antes de elegir», tercera viñeta: 2,4 / 2,8 / 8,2 ms con 1 M, y 9,5 / 35 ms con 4 M;
   - la misma sección, «0,6 ms fuera de pantalla»;
   - el resumen final: «8,2 ms … 2,4 ms»;
   - la solución del ejercicio 7.5.4: «5,5 ms frente a 8,4 ms»; si no se confirma, borrar la frase y dejar «la pasada extra cuesta poco».
2. Opcional: `verificar.mjs --tema light --capturas` (sin `--pagina`, que no termina en 10 min con SwiftShader).
3. Glosario A.4 y bestiario A.1: aplicar los apartados (d), (e) y (f) de este informe (lo hace el lead).
4. `01-web/06-binario.html` l. 384: matizar la promesa de SoA en 7.5 (propuesta en d.4).
5. Decidir si el ejercicio 7.5.4 debe arrancar con menos partículas (b.1).

**(d) Scripts y experimentos** (copiados a `herramientas/estado/lab/`, prefijo `rev-m7-5-`; el SCRATCH se borrará)
- `rev-m7-5-medir.html`: laboratorio de tiempos para el M1, terminado.
- `rev-m7-5-exp1.html` + `rev-m7-5-exp.mjs` (uso: `node rev-m7-5-exp.mjs <ruta absoluta a rev-m7-5-exp1.html>`): experimentos de semántica WebGL. Resultado en `rev-m7-5-exp1-resultado.txt`. Terminado.
- `rev-m7-5-curl-stats.mjs` (uso: `node rev-m7-5-curl-stats.mjs rot grad inercia np`, sin Chrome): estadísticas de rotacional frente a gradiente. Resultado en `rev-m7-5-curl-stats-resultado.txt`. Terminado.
- `rev-m7-5-deriva.mjs`: sentido del desplazamiento de las octavas. **Ojo: la etiqueta que imprime tiene el signo invertido**; el desplazamiento real del dibujo es (0, −0,11) y (−0,085, 0). Terminado.
- `rev-m7-5-pruebas.mjs`: ejercicios ✓/✗, controles de los ejemplos, prueba sin extensión, `medir.html?rapido` y capturas de temas, todo en un solo Chrome. Resultado en `rev-m7-5-pruebas-resultado.txt`. La constante `S` apunta al SCRATCH (para las capturas de temas): cámbiala antes de usarlo. Las esperas son cortas para SwiftShader: en los ejercicios 7.5.3 y 7.5.4 no llegó a leer la consola del código de partida.
