# Sesión 4 · agente coh-m7-web — coherencia del lado web/animación del módulo 7

Lecciones: 7.1 `01-arquitectura.html`, 7.2 `02-interaccion.html`, 7.3 `03-transiciones-shader.html`, 7.6 `06-proyecto-final.html`,
más `recursos/m7kit.js`, `recursos/m7.css`, `recursos/l73-kit.js` y `proyecto-final/**`.
Máquina: MacBook Air Apple M1, Chrome 154 (ANGLE/Metal), cada Chrome con `herramientas/turnos.mjs`.
Scripts: `herramientas/estado/lab/s4-coh-m7-web-*`.

Informe terminado: todas las ediciones verificadas después de la última (ver (c)).

## Método
- Texto compacto de las 4 lecciones, de 7.4/7.5/7.7 y de las lecciones de m1–m6 que citan (1.4, 2.1–2.5, 2.7, 5.1, 5.4,
  5.10, 6.4, 6.6–6.8) con `lab/s4-coh-m7-gpu-texto.mjs`; mapa de definiciones, cifras, promesas y términos en el SCRATCH.
- `lab/s4-coh-m7-web-entrantes.mjs`: contexto de cada enlace o mención «7.1/7.2/7.3/7.6» desde otros archivos (237 enlaces,
  100 del glosario; `--glosario` para incluirlo). `lab/s4-coh-m7-web-salientes.mjs`: enlaces salientes de una lección agrupados
  por destino, con su frase (para leer la sección destino de cada «lo viste en X»).
- `lab/s4-coh-m7-gpu-numeros.mjs` (texto «N.M» frente al manifest: 0 discrepancias) y `lab/s4-coh-m7-gpu-titulos.mjs`
  (títulos de bestiario citados frente a `data-titulo`); grep de citas «…» de otras cajas (senior, hack) frente a su `data-titulo`.
- Cifras de muelles y de la regla `filtrar` comprobadas con el código real de m7kit en Node (`lab/s4-coh-m7-web-muelles.cjs`,
  `lab/s4-coh-m7-web-filtrar.cjs`).
- Bestiarios: 253 `data-id` en todo el curso, ninguno duplicado; comparación por síntoma de los 21 de mis lecciones con los
  de m1–m6.

## (a) Cambios hechos y porqué

### 7.1 `01-arquitectura.html`
1. **Estado en la GPU** («El estado vive en JavaScript»): «tres opciones: … o poder regenerarla desde una semilla» no cuadraba con
   7.5 (que llama «aceptar que se reinicia» a volver a la semilla y deja la tercera para recalcular desde una descripción).
   Ahora: «aceptar que se reinicia (con una semilla, al menos vuelve al mismo estado inicial), guardar … con `readPixels`, o poder
   recalcularla desde una descripción (si la simulación es determinista, su semilla y el tiempo transcurrido). 7.5 vuelve sobre las
   tres con su sistema de partículas, y mide lo que cuesta la copia.»
2. **Caja senior «Unidades que sobreviven a los cambios de tamaño»**: decía que un puntero guardado de 0 a 1 «nunca se desplaza.
   Lo verás en 7.2», pero 7.2 (bestiario `m7-puntero-despegado`, ejemplo 7.2.1) demuestra que sí se desplaza con el scroll si se
   convirtió en el evento. Ahora dice que ya no le afectan los cambios del búfer y anuncia, con ancla, el paso de 7.2 (guardar
   `clientX/clientY` y convertirlo todo en el frame).
3. **Nota del DPR emulado** (anotado de `tamañoObjetivo`, l.4-7): «la emulación de dispositivo de las herramientas de desarrollo.
   Lo comprobamos con la emulación de Chrome» afirmaba más que 7.6 (que dice que se midió con `Emulation.setDeviceMetricsOverride`
   y no en la interfaz de DevTools). Igualado a 7.6.
4. **Bestiario `m7-locations-viejas`**: su síntoma cita el aviso «location is not from the associated program», que en 5.4 tiene
   otra causa (`m5-uniform-otro-programa`). Añadido en la causa: «El mismo aviso de DevTools tiene otra causa, sin pérdida de
   contexto de por medio … si no ha habido pérdida, busca primero ahí», y en la solución el gemelo de 5.1 (`m5-contexto-perdido`,
   canvas en blanco para siempre).
5. **Solución del ejercicio 7.1.1**: es exactamente `m5-uniform-otro-programa`; ahora lo dice, con enlace.
6. **Solución del ejercicio 7.1.5** (pendiente opcional de m7a): párrafo sobre `this.filtrar(intervaloMs)`: por qué la primera
   línea del `medir` sobrescrito llama a `filtrar` y qué pasaría con `intervaloMs` a secas. Comprobado en Node con la solución
   real leída del HTML (`lab/s4-coh-m7-web-filtrar.cjs`): sin `filtrar`, un tirón suelto de 300 ms 0,9 s después de una subida
   baja la escala (0,85 → 0,723) y guarda 0,85 como techo; con `filtrar`, nada; y un intervalo 0 baja la media de 20 a 18 ms.

### 7.2 `02-interaccion.html`
1. Solución del ejercicio 7.2.1: «unos 0,4 µs» → **0,5 µs** (la cifra re-medida por m7a en el M1 ya estaba en el texto y en el
   resumen; quedaba esta).
2. Caja senior de coalescencia: «y la revisión de 2.5 vio 31 en un frame» (jerga interna: el alumno no sabe de revisiones) →
   «(31, todos en un mismo frame, en la de 2.5)» (E2 de `coherencia-m0-m2.md`, M1).
3. **Interfaz completa de `M7.Puntero`**: 7.4 dice «`nx, ny` … lo que da `M7.Puntero` de 7.2» y 7.6 «el `M7.Puntero` de 7.2
   recortado (sin `pulsado` ni `nx/ny`)», pero 7.2 solo mostraba el núcleo y nunca nombraba `nx`, `ny` ni `pulsado`. Párrafo
   nuevo tras el anotado: `pulsado` (cuándo se enciende y se apaga), `dentro`, `tipo`, `visto` y `nx, ny` (sin suavizar, 0..1,
   origen abajo como `v_uv`), con los usos de 7.4 (rayo) y 7.5 (repeler con `pulsado`). Leído del código de m7kit.
4. **Teclado**: el patrón «conjunto de teclas leído en cada frame» ya es el del ejercicio 1.4.4; ahora lo dice (enlace con ancla), y
   el enlace a 1.4 va a `#teclado-key-frente-a-code`.
5. **Movimiento reducido**: el párrafo de entrada repetía 2.2 («en CSS ya usaste en 2.2. En JavaScript, con `matchMedia`», cuando
   2.2 ya enseña `matchMedia` con su `change`). Ahora es un recordatorio de 2.2 y dice qué es lo nuevo (en una app con shaders el
   movimiento sale del reloj); la nota de la línea 1 dice «El `MediaQueryList` de 2.2».
6. `Map` (ejemplo 7.2.4) se usaba sin presentarlo (solo aparece en el código del FLIP de 2.7): paréntesis breve con qué es y sus
   cuatro métodos.
7. Bestiario `m7-ondas-otro-reloj`: enlace a su gemelo general `m7-camara-lenta-parcial` (7.1, «más de un reloj»).

### 7.3 `03-transiciones-shader.html`
1. Caja «Veinte imágenes con hover»: «Chrome empieza a destruir los más antiguos» contradecía 5.1 (se pierde el que lleva más
   tiempo sin usarse, no el primero creado) → corregido.
2. Caja «¿Y la View Transitions API?»: re-presentaba la API sin decir que 2.7 ya la había presentado → enlace a
   `07-waapi-flip.html#view-transitions-en-una-mencion`.
3. Bestiario `m7-3-salto-al-despertar`: enlace a su gemelo `m1-segundo-plano` (1.5) con la diferencia (el tope de `dt` evita el
   desastre, pero el salto de 0,1 s se ve en cada transición).
4. Caja «Porque» de la línea de tiempo: enlaza el sistema de tweens de 2.4 (antes sin enlace) y relaciona el cabezal sin estado con
   el `currentTime` de WAAPI del ejercicio 2.7.2 (misma idea, que el alumno ya usó).

### 7.6 `06-proyecto-final.html`
1. **Chip de requisitos**: añadido 7.3 (la lección usa su contrato, sus bestiarios, su modo bajo demanda y el ejercicio 7.6.1 parte
   de «los dos fallos del bestiario de 7.3»; 7.5 también presenta 7.6 como «las transiciones de 7.3»).
2. **Caja del dither**: no enlazaba a 6.4 («Banding y dithering») y contradecía su recomendación: 6.4 cambia el ruido en cada
   frame (`u_frame`) «para que el ojo lo promedie también en el tiempo»; 7.6 decía que «un grano que cambia en cada frame se percibe
   como un centelleo» (afirmación perceptiva sin medir). Ahora enlaza 6.4, dice que el hash es el de Hoskins (6.6) y no PCG, y da
   la razón verificable de que aquí sea fijo: sale solo de `gl_FragCoord` (`shaders.js` §7) y mantiene «mismo estado, misma imagen»
   (7.1): con el tiempo en pausa o con movimiento reducido el fondo queda quieto de verdad aunque el bucle siga dibujando.
3. **Caja «Medir el coste en una GPU que cambia de marcha»**: el título citado de la caja de 6.6 estaba recortado → «Cómo se mide
   lo que cuesta un shader (y cómo no)»; y enlaza el recuadro de 5.10 «Lo que el temporizador no te dice», que ya avisaba de que
   el temporizador baila.
4. «caja «El precio de la sincronía»» → título real «El precio de la sincronía: el hilo principal».
5. Caja de la SPA: «el navegador empieza a matar los viejos» → «pierde a la fuerza el que lleva más tiempo sin usarse» (5.1); y el
   `AbortController`/`signal` enlaza a 1.4, donde se enseña.
6. «fotograma» → «fotograma clave» en los 10 sitios donde designa un keyframe de WAAPI (primer/último fotograma, «dos
   fotogramas»): la convención de 0.1 reserva «fotograma» para el frame, y la lección usa «frame» en el mismo párrafo.
7. Bestiarios `m7-6-dpr-emulado` (gemelo `m5-canvas-borroso`: si también sale borroso en el dispositivo real, es aquel) y
   `m7-6-destello-negro` (el tirón del primer dibujo de 4.1, `m4-tiron-primer-dibujo`): enlazados.

### `recursos/m7kit.js` y `recursos/m7.css`
- m7kit: la cabecera listaba todas las piezas salvo `M7.parametrosMuelle` (que 7.3 usa y explica) → añadida. Solo comentario.
- m7.css: borrada `.m7-cifras` (no la usa ninguna lección ni ningún script del curso; mismo criterio que m7a con `m7-equivalencias`).

### `proyecto-final/**` y `l73-kit.js`
Sin cambios: el código y sus comentarios cuadran con 7.6 (secciones §1–§8 de hero.js, §1–§7 de motor.js y shaders.js citadas en
la tabla del encargo; 13 uniforms; muelle crítico k = 60, c = 15,5; filtro de `Calidad` y racha de `bucle.fps` iguales a m7kit).
Decisión: el comentario de hero.js l.67 dice «primer fotograma» (keyframe); no lo toco para no obligar a repetir la QA de la
página autónoma por un comentario.

## Comprobado sin cambios (coherencia que ya estaba bien)
- **m1–m2**: presupuesto 16,7/8,3 ms y cuantización de intervalos a múltiplos de 16,7 (2.1, tabla de 20 ms → 16,7/33,3 y
  media 19,6, coherente con la trampa de la mediana de 7.6); `clip-path` en el compositor (2.1); `dt` limitado a 0,1 s, primer
  `dt` = 0, EMA de fps y «todos los callbacks de un frame reciben el mismo tiempo» (2.3); suavizado con semivida
  `1 − 2^(−dt/h)`, tweens desde el instante de inicio, `lerp(100, 0.1, 1)`, «stop and go», `invlerp` (2.4); notación k/c/m, ζ,
  ω₀, rebote → ζ y asentamiento → ω₀ = 4/(ζ·T), 1 % en ω₀t ≈ 6,64, semi-implícito con subpasos de 1/240 s (2.5; m7kit, 7.3 y 7.6
  usan exactamente eso); `document.timeline`, `currentTime` en ms, `fill` (2.7); key/code, captura implícita con el dedo, cinco
  sistemas de coordenadas, `canvas.width / r.width` (1.4); TDZ (1.3); `fetch`/módulos en `file://` (1.7).
- **m5–m6**: `getExtension` → null y `getError` → `CONTEXT_LOST_WEBGL` una vez con el contexto perdido, 4 muestras MSAA y 24 bits
  de profundidad por defecto, el observador anota y el tamaño se aplica al empezar el frame (5.1); compilación en otros hilos y
  `LINK_STATUS` que espera (5.2); 128 s de separación del tiempo desde 1970 en float32 y 7,8 ms tras un día (5.4); caché de programas
  (5.10 `#ver-lo-que-calcula-la-gpu`); 0,7 ms por octava en 4,2 MP = 0,17 ms/MP (6.6, coherente con los 2,4 ms/MP de 7.6), «diez
  veces más lenta» (6.6), warping de 6.6 = 100 hashes (7.6 dice 48, «la mitad»); `tramo` y ejemplo 6.7.3 con el toque que alterna
  (6.7); cover, `MIRRORED_REPEAT`, «tirar, no empujar» (6.8); oliva (128, 128, 0) frente a (188, 188, 0) y bache del ejercicio 6.4.3
  (6.4).
- **Entre lecciones de m7**: las unas 70 referencias de 7.4/7.5/7.7 a 7.1/7.2/7.3/7.6 cumplen lo que prometen (salvo las dos de 7.7 y la
  de 7.4 que van al tablón); las promesas de 1.2, 1.4, 2.5, 5.1, 5.4, 6.2, 6.4 y 6.7 hacia mis lecciones se cumplen; el glosario (100
  enlaces) no contradice mis lecciones (una matización al tablón). Las promesas internas («lo verás en el ejercicio 7.3.1», «etapa 5»,
  «al final de la lección») se cumplen.
- **Cifras de muelles en Node con el código de m7kit** (`lab/s4-coh-m7-web-muelles.cjs`): `parametrosMuelle(0.1, 0.6)` → k = 127,18,
  c = 13,33; máximo 1,0947 y `enReposo()` a 1,03 s (7.3 l.170); primer paso de 0,1 s 0,392 frente a 0,0264 a 60 Hz (bestiario
  `m7-3-salto-al-despertar`); muelle del hero (k = 60, c = 15,5) al 99 % a 0,88 s muestreando a 60 Hz (0,86 s analítico) y
  velocidad < 10⁻⁴ hacia 1,88 s (7.6 «hacia los 1,8 s»); derivada de `cubicInOut` en 0,5 = 3. Todo cuadra.
- **Notación**: uniforms `u_`, API de m7kit tal como está en el código, coma decimal en la prosa (las únicas cifras con punto son
  «GLSL ES 1.00/3.00»), búfer/buffer según 0.1, títulos y números de lección = manifest (`s4-coh-m7-gpu-numeros.mjs`: 0).
- **Bestiarios**: `data-id` únicos (253 en el curso); los 21 de mis lecciones están en el diagnóstico rápido de A.1.

## (b) Mediciones
No he medido tiempos de GPU (ninguna cifra de mis lecciones cambió). Comprobaciones en Node (sin Chrome), descritas arriba:
`lab/s4-coh-m7-web-filtrar.cjs` (regla `filtrar` en la solución de 7.1.5) y `lab/s4-coh-m7-web-muelles.cjs` (cifras de muelles).

## (c) Verificación final (Apple M1, Chrome 154, ANGLE/Metal; cada Chrome con `turnos.mjs`; después de la última edición)
- `node verificar.mjs 01-arquitectura 02-interaccion 03-transiciones-shader 06-proyecto-final --soluciones --capturas` (oscuro):
  **4/4 sin problemas** (pruebas: 7.1.2 7 ✓, 7.1.3 1 ✓, 7.1.4 5 ✓, 7.1.5 2 ✓; 7.3.3 6 ✓, 7.3.4 9 ✓, 7.3.5 2 ✓; 7.6.2 3 ✓,
  7.6.3 3 ✓, 7.6.4 1 ✓). Conteos: 7.1 ejemplos 7 / ejercicios 5 / quiz 4 / bestiario 4; 7.2 5/5/3/5; 7.3 8/5/4/8; 7.6 4/4/3/4.
- Lo mismo con `--tema light`: **4/4 sin problemas**, mismas pruebas ✓.
- `node movil.mjs` (390 px): las 4 con `scrollWidth = 390 / 390` (7.3 y 7.6 listan fórmulas KaTeX y un `path` de SVG dentro de
  contenedores con desplazamiento propio, como antes).
- `node enlaces.mjs` (todo el curso): **63 archivos, 3 763 enlaces internos, 0 rotos**.
- `node --check recursos/m7kit.js`: ✓.
- Capturas miradas: 7.6.1 (flujo, DPR 1, búfer 736 × 340, 60 fps), 7.2.2 (estela del puntero fantasma), solución de 7.1.5 en claro
  (16 → 4 cambios, 213 → 117 frames lentos, las dos pruebas ✓).
- Compatibilidad de m7kit (solo cambié su cabecera), solo lectura: `verificar.mjs 04 05 07 --soluciones` → **3/3 sin
  problemas** (7.4.1 7 ✓, 7.4.3 1 ✓; 7.5.1–7.5.4 1 ✓ cada una; 7.7.1 6 ✓, 7.7.2 5 ✓, 7.7.3 1 ✓, 7.7.4 4 ✓).
- `proyecto-final/` sin cambios: no hacía falta repetir su QA.

## (d) Pendientes y decisiones discutibles
Decisiones:
1. **Dither de 7.6**: la frase «un grano que cambia en cada frame se percibe como un centelleo» era una afirmación perceptiva sin
   medir que contradecía la recomendación de 6.4 (ruido por frame). La sustituí por una razón comprobable (la imagen solo depende
   del estado). No he medido si un dither temporal de ±0,5/255 se ve en el M1 (no es medible en headless).
2. **Chip de requisitos de 7.6**: añadido 7.3. Alternativa: dejarlo como estaba y considerar 7.3 recomendable (7.6 dice «en 7.3
   tienes el catálogo… aquí montamos una»). Lo añado porque el ejercicio 7.6.1 y la etapa 5 dan por sabidos su contrato, sus
   bestiarios y el modo bajo demanda.
3. **«fotograma clave»** en 7.6 (10 sitios) siguiendo 0.1. 2.2 y 2.7 también dicen a veces «primer fotograma» por keyframe; no
   es mío. El comentario de `proyecto-final/hero.js` l.67 conserva «primer fotograma» (no toco la página autónoma por un comentario).
4. **`.m7-cifras`** borrada de m7.css (sin uso en el curso).
5. No he enlazado cada «7.1»/«2.4» sin enlace del texto (hay muchos «el reloj de 7.1» sin `<a>`): solo los que acompañan una
   afirmación que remite a una sección concreta.

Para otros (en el tablón):
- coh-m7-gpu: 7.4 l.44 (título recortado de la caja de 6.6); 7.7 l.383 («el bicho de 7.1» → el de 5.4 + ejercicio 7.1.1);
  7.7 l.504 (ancla del observador → «Tamaño: lo que 5.1 no podía saber»).
- lead: A.1 l.96 («elimina el más antiguo» → «pierde el que lleva más tiempo sin usarse»); glosario `g-device-pixel-content-box`
  (matizar la emulación); gemelos de ida m5 → m7 (`m5-uniform-otro-programa`, `m5-contexto-perdido`) y, opcional, `m1-segundo-plano`
  → `m7-3-salto-al-despertar`; **`node herramientas/indexar.mjs`** (5 bestiarios con texto nuevo).

## Scripts (`herramientas/estado/lab/`)
- `s4-coh-m7-web-entrantes.mjs` — contexto de cada enlace o mención «7.1/7.2/7.3/7.6» desde otros archivos (`--glosario`).
- `s4-coh-m7-web-salientes.mjs` — enlaces salientes de una lección, agrupados por destino, con su frase (`archivo [filtro]`).
- `s4-coh-m7-web-filtrar.cjs` — la solución de 7.1.5 con y sin `filtrar` ante un tirón suelto tras una subida (Node).
- `s4-coh-m7-web-muelles.cjs` — cifras de muelles de 7.3 y 7.6 con el código real de m7kit (Node).
