# Revisión · Lección 7.3 · Transiciones animadas con shaders (rev-m7-3, sesión 3)

Archivo revisado: `modulos/07-integracion/03-transiciones-shader.html` (y `recursos/l73-kit.js`, sin cambios).
Revisión desde cero (el revisor anterior se paró sin informe; sus cambios ya estaban en el commit base `66d0cba`).
Máquina: contenedor Linux sin GPU, Chromium 141 headless con SwiftShader. Nada de lo que depende del M1 se ha
re-medido aquí; lo que sí se ha comprobado en este Chromium se dice en cada punto.

## (a) Cambios hechos (y por qué)

1. **§«Un número que va de 0 a 1», l.32 — cita de `clip-path`/`mask-image`.** Decía «cortinillas con `clip-path`
   o `mask-image` (2.2)», pero 2.2 (`02-css-transiciones.html`) no trata ninguna de las dos (grep: 0 apariciones);
   quien mide `clip-path` es 2.1 (tabla «Qué dispara cada propiedad»: 0 frames de estilo/layout/pintado, «sí (Chrome
   reciente)»). Ahora: «Con una transición CSS (2.2) tienes un fundido con `opacity` y, con algo de ingenio,
   cortinillas: animando un recorte con `clip-path` (una de las propiedades que mediste en 2.1#que-dispara-cada-propiedad)
   o desplazando una máscara en degradado con `mask-image` y `mask-position`». Lo de `mask-position` es porque
   `mask-image` en sí es discreta (no se interpola una imagen/degradado): lo que se anima es la posición o el tamaño
   de la máscara.
2. **Senior «¿Hace falta un shader?», l.~1439 — compositor y `clip-path`.** Contrastado con 2.1: allí se midió en
   Chrome 154 (M1) que `clip-path` se anima sin trabajo en el hilo principal, con la advertencia «no lo des por
   hecho en otros navegadores ni en versiones antiguas». La frase de 7.3 era coherente pero sin matiz ni ancla;
   ahora enlaza a `2.1#que-dispara-cada-propiedad`, separa lo seguro (`opacity`/`transform`) de lo medido en «el
   Chrome reciente en que medimos 2.1» (`clip-path`) y repite la advertencia de 2.1.
3. **Rendimiento, l.~1316 — tiempo de GPU medido con el método engañoso.** El texto daba «entre 0,07 y 1,3 ms por
   frame» con un temporizador de GPU; según el informe del autor se midió con `EXT_disjoint_timer_query_webgl2` y
   **10 dibujos por consulta sobre el mismo framebuffer**, el método que el PLAN §4 declara engañoso en la GPU de
   teselas del M1 (cifras 3–30× menores). Quitada la cifra; el párrafo explica ahora que el trabajo de GPU no está en
   las cifras de CPU, por qué no se mide dividiendo N dibujos sobre el mismo búfer y enlaza al método fiable
   (`6.6#medir-coste-shader`). Anotado en (c) con script de medida.
4. **Fundido, l.~323 — cita de 6.4.** Ahora enlaza a `6.4#mezclar-en-srgb-o-en-lineal` y concreta qué se vio allí
   (el oliva entre rojo y verde, el bache del ejercicio 6.4.3 y la regla «fundidos de dos imágenes en lineal»). La
   frase «pasar por una zona oscura» se conserva: es la de la solución del ejercicio 6.4.3.
5. **Bestiario `m7-3-circulo-esquinas`.** Decía «lienzo de 736 × 330 px (el de estos editores)», pero el revelado
   radial está en el catálogo (7.3.3), que mide 736 × 360 (captura del verificador). Cuenta rehecha: esquina a
   √(1,022² + 0,5²) ≈ 1,14 alturas (antes 1,22 con el 330).
6. **Senior «Veinte imágenes con hover».** Decía que el ejemplo 7.2.5 dibuja «con `gl.viewport` y `gl.scissor`»;
   7.2.5 no usa ninguno de los dos (lee los rectángulos de las tarjetas y dibuja una sola pasada). Ahora: canvas fijo
   «como el del ejemplo 7.2.5», cada imagen con `gl.viewport` «como los dos paneles del ejemplo 7.3.2» y `gl.scissor`
   solo si además borras cada rectángulo.
7. **Solución del ejercicio 7.3.5 — afirmación falsa.** Decía que sin `puntero.visto` «la primera prueba fallaría».
   Comprobado en Chromium: el canvas del ejercicio está en (0, 0) del iframe (body con `margin: 0`), así que antes
   del primer evento `x = −r.left = 0 = sx` y **las cuatro pruebas pasan igual sin `puntero.visto`**. Reescrito: la
   guarda sigue siendo necesaria en general (en 7.3.8 las tarjetas están a 12 px del borde y sin ella la app no se
   duerme, como cuenta la lección), pero aquí coincide por casualidad.
8. **Ejercicio 7.3.2, código de partida.** El comentario `✗` de `return n < p ? hacia(uv) : desde(uv);` añade
   «(y texture dentro de una rama: 6.3)»: es exactamente el bicho de las derivadas que la lección explica en el modo 7
   del catálogo, y el código de partida lo tenía sin avisar.
9. **Ancla** del «bicho del aspecto» de 3.6 → `#m3-aspecto`.

`l73-kit.js`: revisado entero, sin cambios (Transicion, Linea, GLSL, imágenes; coincide con lo que cuenta la lección).

## Comprobado y correcto (no se ha tocado)

Simulado en Node con el propio `m7kit.js` (mismo V8 que Chrome para doubles) o medido en Chromium 141:
- `parametrosMuelle(0.1, 0.6)` → k = 127,18, c = 13,33 (masa 1), pico 1,0947, `enReposo` a 1,033 s ✓. Fórmulas y
  notación (k, c, m, ζ, ω₀, «rebote», «asentamiento», Euler semi-implícito) iguales que en 2.5 ✓.
- Muelle por defecto (170, 26): ζ = 0,9971 («a un 0,3 % del crítico») ✓; se queda en 0,999999999999999 ✓.
- Lupa `(0.25, 0.9)`: x === 1 exacto a los 7,6 s ✓; hacia 0: −1,18·10⁻⁸ a 4 s y 1,97·10⁻²⁰ a 10 s ✓ (y en Chromium,
  el ejercicio 7.3.5 de partida imprime −1,24·10⁻⁸).
- Primer paso con dt = 0,1 del muelle por defecto: 0,392 frente a 0,0264 con 1/60 ✓.
- `M7.suavizar` hacia 1 (semivida 0,06, 60 Hz): atascado en 0,9999999999999998, factor 0,8249 ✓ (la explicación del
  redondeo es correcta para la forma `objetivo + (actual − objetivo)·f` de m7kit).
- Sumas en coma flotante del ejercicio 7.3.3 (1,0000000000000013 y 0,9999999999999999) y `expoOut` ingenuo
  (0,9990234375) ✓; `lerp(100, 0.1, 1)` y el «stop and go» están en 2.4 ✓.
- Derivadas de los easings (cubicInOut 3 en 0,5 → 3,3/s; cubicOut 0,12 en 0,8 y 3 en 0 → ×25) ✓; `backOut` máx. 1,1 ✓.
- Extrapolación de `mix` (229,153,26 / 255,161,0 / 24,94,255) coherente con la cuenta ✓; sRGB: 0,5 → 21,4 % de luz;
  lineal 0,5 → 188 ✓.
- Ráfaga del ejemplo 7.3.2 simulada: el tween llega a 23,5 % y 27 %, el muelle a 1,095 ✓ («apenas pasa del 25 %»).
- **fbm de l73-kit en Chromium/SwiftShader** (1024 × 512, RGBA32F): min 0,154, p1 0,241, mediana 0,554, p99 0,799,
  máx 0,891 y la tabla de la disolución (0/2,8 · 0,3/8,0 · 3,0/16,7 · 36,5/41,1 · 89,0/74,3 · 99,0/86,6 · 100/95,3)
  coinciden con lo medido en el M1 (diferencias ≤ 0,2 puntos) ✓. «Arden en p = 0» con borde 0,08: 2,2 % ✓ («un 2 %»).
- **Opacidad CSS** blanco/negro 0,5 → (128,128,128) y 0,25 → (64,64,64) también en Chromium 141 ✓.
- **Toque emulado por CDP** (Chromium 141): sin arrastre, `pointerover, pointerenter, pointerdown, touchstart,
  pointerup, pointerout, pointerleave, touchend, click` ✓ (el orden que da la lección); con arrastre vertical sobre un
  elemento sin `touch-action: none`: `pointercancel` y la página se desplaza ✓.
- `document.startViewTransition` es función; `drawElement`, `drawElementImage` (2D) y `texElementImage2D` (WebGL2)
  no existen sin flags ✓.
- Los 5 ejercicios: el código de partida falla lo que debe y la solución pasa todo (consola leída en Chromium:
  7.3.3 6/6 ✓, 7.3.4 9/9 ✓, 7.3.5 4/4 ✓ con 0 frames en reposo y muelle en 0 exacto). Ejercicios 7.3.1 y 7.3.2:
  partida con magenta (7.3.1) / solución sin magenta (capturas). Enunciados y soluciones coinciden.
- Ejemplos JS en marcha (capturas propias, lienzo recortado): 7.3.2 (curvas con picos del tween y muelle que rebota),
  7.3.4 (tras la ráfaga en «congelar»: `foto → paisaje · p = 1.00 · instantáneas: 3`, sin saltos), 7.3.5 (lupa del
  puntero fantasma), 7.3.6 (cortina de tinta a mitad; al final `h1 = Proyectos`, `aria-current` en Proyectos, aviso
  «Página: Proyectos», foco en `#contenido`), 7.3.7 (B/N + zoom a 1,3 s; título «Atardecer» al final), 7.3.8
  («continuo · 31 frames» con SwiftShader frente a «bajo demanda · 0 frames · total 2»).
- Promesas de 7.1/7.2 hacia 7.3: `bajoDemanda` y `pedirFrame` (7.1 l.671/719) ✓ sección Rendimiento; transición entre
  dos escenas vivas (7.1 l.816) ✓ senior «Transiciones entre dos escenas vivas»; cierre de 7.2 (progreso con easings y
  muelles, transiciones entre imágenes, interrupciones, bucle que solo trabaja si algo se mueve) ✓.
- Referencias cruzadas comprobadas en destino: 2.4, 2.5, 3.6, 4.1 (`#m4-tiron-primer-dibujo`), 5.1 (recorte al
  escribir en 8 bits, `#m5-demasiados-contextos`), 5.7 (`#m5-canvas-premultiplicado`), 5.8 (`#m5-bucle-realimentacion`,
  `#m5-viewport-fbo`, `blitFramebuffer`), 6.2 (`#m6a-fragcoord-viewport`), 6.3 (`#m6a-derivadas-rama`), 6.6 (hash12,
  fbm con `mat2(0.8,0.6,-0.6,0.8)`), 6.7 (`tramo`, ejemplo 6.7.3 con el toque que alterna), 6.8 (cover, «tirar, no
  empujar», `#m6b-borde-desenfoque`), 7.1 (`#m7-camara-lenta-parcial`, DOM y GPU en el mismo frame,
  `COMPLETION_STATUS_KHR`), 7.2 (`#m7-canvas-fijo-retraso`, `aria-hidden`, `dtReal`).
- `smoothstep`: siempre con bordes crecientes y `1.0 − smoothstep(...)` (como recomienda el curso) ✓. Alfa
  premultiplicado del overlay ✓ (`premultipliedAlpha: true` + `vec4(col·α, α)`). `linealASrgb` con `max(c, 0)` ✓.
- Mínimos §6: 8 ejemplos, 5 ejercicios (★ a ★★★, todos con `data-solucion`), 4 quizzes repartidos, 8 bestiarios,
  6 senior, 2 hack, 1 porqué, resumen y «Para profundizar». Quizzes revisados: distractores con error de concepto real.

## (b) Problemas pendientes (no corregidos)

1. **Catálogo 7.3.3 con `borde = 0` en los modos 3 y 4** (cortinilla y radial): `smoothstep(e, e, x)` es indefinido en
   GLSL ES 3.00. El ejercicio 7.3.1 lo explica (en el M1 se comporta como escalón) y propone `max(u_ancho, 1e-4)`,
   pero el catálogo deja el deslizador en 0 sin aviso. Propuesta (opcional): en el catálogo, `float w = max(u_ancho,
   1e-4);` en `cortinilla` y `radial`, o que el deslizador empiece en 0,002. No lo he cambiado porque los bloques
   anotados copian ese código y la lección ya lo trata en el ejercicio.
2. **Longitud**: ~21 000 palabras en la página (≈14 500 de prosa según el autor), 180 min. Coherente con el encargo;
   si el dueño quiere acortar, lo separable es el overlay de página o la línea de tiempo (decisión del autor que
   comparto).
3. **El código de partida del ejercicio 7.3.2 cumple el contrato** (corte duro con el ruido sin estirar: en p = 0 y
   p = 1 no hay magenta). No es un error (la casilla avisa cuando el alumno añade el fuego sin margen, y la solución
   lo explica), pero el alumno podría pensar que el paso (4) ya está hecho. Propuesta opcional: una frase en el
   enunciado («el corte duro de partida cumple el contrato por casualidad; en cuanto añadas la franja de fuego, ya no»).

## (c) Pendientes de medir en el M1

1. **Tiempo de GPU por frame de las transiciones del catálogo a 1440 × 900** (antes «0,07–1,3 ms», medido con 10
   dibujos por consulta sobre el mismo framebuffer = método engañoso). Script fiable listo:
   `herramientas/estado/lab/rev-m7-3-tiempos.mjs` (lee el shader del propio HTML de la lección, mide los 8 modos con
   dos FBO alternos + clear + readPixels + mediana de 7 tandas, y también con el método engañoso para comparar).
   Uso en el Mac: `cd herramientas && node estado/lab/rev-m7-3-tiempos.mjs` (opcional: `ancho alto`). Si se quiere
   volver a dar una cifra en el texto (l.~1316), ponerla con hardware («Apple M1, Chrome 154, ANGLE/Metal») y sin
   llamarla «temporizador de GPU».
2. Sin re-medir (dependen del M1, métodos razonables, se dejan): CPU por proceso continuo/bajo demanda (16 + 30 ms/s
   frente a 0 + 0,1 ms/s, `SystemInfo.getProcessInfo`); `dt` al despertar (0; 0,0167; 0,0167); derivadas en las
   persianas (columna del nivel 1 × 1, hasta 228/255); `smoothstep(e, e, x)` como escalón; `mix` extrapolado
   (229,153,26…).

## (d) Problemas en archivos ajenos

1. **`recursos/m7kit.js`, `M7.Puntero.actualizar`** (para el revisor de m7kit): antes del primer evento,
   `x = cx − r.left` con `cx = 0` y `sx = 0`, así que «¿persigue el suavizado?» da una distancia igual a la posición
   de la caja y deja insomne un bucle bajo demanda si la caja no está en (0, 0) (pasa en 7.3.8). Propuesta: mientras
   `!this.visto`, igualar `sx = x`, `sy = y` (o documentarlo en la cabecera). **Si se cambia, hay que actualizar dos
   textos de 7.3** que describen el comportamiento actual: el párrafo tras el ejemplo 7.3.8 (l.~1426) y la solución
   del ejercicio 7.3.5 (l.~2052).
2. **`recursos/m7kit.js`, `crearApp`**: `bajoDemanda` se lee de `o.bajoDemanda` en cada frame (mutar el objeto de
   opciones cambia el modo en caliente) y no está documentado (lo señaló el autor). Propuesta: documentarlo o exponer
   `app.bajoDemanda`.
3. **`herramientas/verificar.mjs`, capturas de playgrounds JS**: con `--capturas`, varias capturas de playgrounds JS de
   7.3 salen negras con el estado «en pausa (fuera de pantalla)» (7.3.4, 7.3.6, 7.3.7, 7.3.8, sol. 7.3.5). Causa
   probable: `ElementHandle.screenshot()` usa `captureBeyondViewport` y Chrome agranda el viewport un instante; los
   `IntersectionObserver` de `playground-js.js` (margen 1400 px) destruyen o pausan iframes. En mi script, la captura
   con un elemento también hizo desaparecer el iframe; con `page.screenshot({ clip: {x: left + scrollX, y: top +
   scrollY, …}, captureBeyondViewport: false })` y esperando a que el estado diga «ejecutando» las capturas salen
   bien. Propuesta: usar ese método en `verificar.mjs` (y esperar ~1,5 s tras ver «ejecutando»).
4. **A.1 (`08-anexos/01-bestiario.html`)**: añadir al «Diagnóstico rápido» los 8 casos de 7.3 (ver (e)).
5. **A.4 (`08-anexos/04-glosario.html`)**: términos de (f) y enlaces a 7.3 en las entradas marcadas `M7-PENDIENTE`
   de `g-easing` (l.~691) y `g-muelle-amortiguado` (l.~1487); conviene enlazar también 7.3 desde `g-stagger`
   (`#escalonar-persianas`), `g-tween` (`#volver-atras-un-tween-que-se-recalcula`), `g-alfa-premultiplicado`
   (`#transicion-de-pagina-con-un-overlay`), `g-ping-pong` y `g-bucle-de-realimentacion`
   (`#ir-a-otra-parte-congelar-lo-que-se-ve`) y `g-fbm` (`#disolucion-con-umbral-de-ruido-y-borde-que-arde`).

## (e) Cajas bestiario de 7.3

| data-id | data-titulo | Síntoma del diagnóstico (A.1) |
|---|---|---|
| `m7-3-muelle-quema` | Con un muelle que rebota, la imagen de llegada se quema (o sale saturada) un instante | colores lavados/oscuros (colores quemados/saturados; en A.1, «Colores lavados, oscuros o de otro tono») |
| `m7-3-transicion-no-limpia` | La transición empieza con un velo de la imagen nueva (o termina con un resto de la vieja) | otro: restos o salto en los extremos de una transición (lo más cercano en A.1: «Parpadeo y manchas que van y vienen»; propuesta: subsección nueva «Transiciones que no empiezan o no terminan limpias») |
| `m7-3-circulo-esquinas` | El revelado circular termina y las esquinas siguen mostrando la imagen vieja | otro: restos en las esquinas (misma subsección propuesta; alternativa A.1: «Estirado, en una esquina o recortado») |
| `m7-3-disolucion-atascada` | La disolución no hace nada al principio ni al final, y todo ocurre de golpe en el medio | animación a distinta velocidad (ritmo de la transición) |
| `m7-3-vuelta-de-golpe` | Al invertir una transición a medias, la vuelta arranca casi parada y llega de golpe | animación a distinta velocidad (ritmo al invertir) |
| `m7-3-salto-al-interrumpir` | Al pulsar «siguiente» a mitad de una transición, la imagen salta | parpadeo («Parpadeo y manchas que van y vienen») |
| `m7-3-bajo-demanda-insomne` | El bucle bajo demanda no se duerme nunca | rendimiento/tirones («Tirones y lentitud») |
| `m7-3-salto-al-despertar` | Cada transición empieza con un salto (en un bucle que se duerme) | animación a distinta velocidad / salto de tiempo («Saltos al volver, tras una pausa o tras horas») |

(7.6 ya enlaza a `m7-3-transicion-no-limpia`, `m7-3-disolucion-atascada` y `m7-3-muelle-quema`: existen.)

## (f) Términos para el glosario A.4 (sección 7 del autor, revisada y completada)

Anclas relativas a `modulos/07-integracion/03-transiciones-shader.html`.

| Término | Definición (una línea) | Ancla |
|---|---|---|
| Transición (en un shader) | Función T(uv, p) que pasa de una imagen A a otra B según un progreso p que anima JavaScript. | `#un-numero-que-va-de-0-a-1` |
| Progreso (`u_progreso`) | Número de 0 a 1 que JavaScript avanza con el `dt` del reloj y el shader interpreta en cada píxel. | `#un-numero-que-va-de-0-a-1` |
| Contrato de una transición | Exigencia de que en p = 0 se vea exactamente A y en p = 1 exactamente B, en todos los píxeles. | `#un-numero-que-va-de-0-a-1` |
| Arnés `desde`/`hacia`/`transicion` | Estructura del shader de transición: dos funciones que leen A y B en cualquier uv y una que las combina (la de gl-transitions). | `#ejemplo-7-3-1-el-arnes-de-una-transicion` |
| gl-transitions | Colección abierta de transiciones GLSL con la convención `getFromColor`/`getToColor`/`progress`/`ratio`. | `#ejemplo-7-3-1-el-arnes-de-una-transicion` |
| Fundido a través de negro (dip to black) | A se apaga en la primera mitad de p y B se enciende en la segunda (dos tramos). | `#fundido-en-srgb-y-en-luz` |
| Fundido en luz | Fundido que decodifica sRGB, mezcla en lineal y vuelve a codificar; sin el bache oscuro del `mix` en sRGB. | `#fundido-en-srgb-y-en-luz` |
| Cortinilla (wipe) | Transición en la que un borde recorre la pantalla dejando la imagen nueva detrás; su borde recorre de −w a 1 + w. | `#cortinilla-con-borde-suave` |
| Revelado radial | Cortinilla circular que crece desde un punto (el centro o el clic) hasta la esquina más lejana. | `#revelados-radiales-y-desde-el-puntero` |
| Disolución (dissolve) | Transición en la que cada píxel cambia cuando un umbral que avanza con p alcanza su valor de ruido. | `#disolucion-con-umbral-de-ruido-y-borde-que-arde` |
| Estirar el ruido (percentiles) / ecualización del histograma | Reescalar el ruido con sus percentiles medidos (o con su curva acumulada) para que el umbral reparta el trabajo por todo el recorrido. | `#disolucion-con-umbral-de-ruido-y-borde-que-arde` |
| Transición por desplazamiento | Transición que lee A y B en posiciones desplazadas en sentidos opuestos por un campo de flechas (A cada vez más, B cada vez menos). | `#desplazamiento-una-imagen-que-se-derrite-en-la-otra` |
| Escalonado (stagger) por píxel / persianas | Progreso local p_local = clamp((p − r·s)/(1 − s), 0, 1) con un retraso r por píxel o celda; el easing se aplica después, en el shader. | `#escalonar-persianas` (el senior está en `#con-un-tween`) |
| Tween interrumpible (duración proporcional) | Al cambiar de destino, tramo nuevo desde el valor actual con duración proporcional a lo que falta y final exacto (`L73.Transicion`). | `#volver-atras-un-tween-que-se-recalcula` |
| Instantánea (congelar el frame) | Textura de un FBO con lo que se está viendo, usada como origen de una transición interrumpida (dos FBO alternos). | `#ir-a-otra-parte-congelar-lo-que-se-ve` |
| Overlay de transición de página | Capa WebGL a pantalla completa que tapa el cambio del DOM: cubrir, cubierta, descubrir, quieta. | `#transicion-de-pagina-con-un-overlay` |
| View Transitions API | API nativa (`document.startViewTransition`) que anima entre dos estados del DOM a partir de capturas y CSS; sin acceso a esos píxeles desde un shader. | `#transicion-de-pagina-con-un-overlay` |
| Línea de tiempo (timeline) | Conjunto de pistas (propiedad, inicio, duración, easing) que se evalúan sin estado desde un cabezal. | `#encadenar-uniforms-una-linea-de-tiempo` |
| Pista (track) | Animación de una propiedad dentro de una línea de tiempo, de un valor a otro, con inicio, duración y easing. | `#encadenar-uniforms-una-linea-de-tiempo` |
| Cabezal (playhead) | Instante de la línea de tiempo que se está mostrando; avanza con `dt × velocidad` (1, −1, 0 o cámara lenta). | `#encadenar-uniforms-una-linea-de-tiempo` |
| Position parameter | Notación de GSAP para colocar una pista: número absoluto, `'<'` (con la anterior), `'+=x'` / `'-=x'` (respecto al final de la línea). | `#encadenar-uniforms-una-linea-de-tiempo` |
| Bucle bajo demanda (render on demand) | Bucle que solo pide frames mientras algo cambia (`pedirFrame`) y se duerme en reposo; al despertar, primer `dt` = 0. | `#rendimiento-dibujar-solo-mientras-algo-se-mueve` |

## (g) Verificación final (tras los cambios; Chromium 141 + SwiftShader)

```
node verificar.mjs ../modulos/07-integracion/03-transiciones-shader.html --soluciones --capturas …/capturas-final
✓ ../modulos/07-integracion/03-transiciones-shader.html  (100524 ms)
   glsl=4 js=9 graficador=0 demo=0 ejemplos=8 ejercicios=5 quiz=4 anotado=10 callouts=18 bestiario=8 senior=6 h2=9 pres=6 palabras=21442 soluciones=5
1/1 páginas sin problemas

node verificar.mjs … --tema light --pagina …/claro      → ✓ 1/1 páginas sin problemas (59 tramos; revisados a
                                                          muestreo: cabecera, diagrama, bestiarios, tablas, código anotado)
node movil.mjs …                                        → ✓ scrollWidth=390 / 390 (solo aparecen los <math> ocultos de KaTeX)
node enlaces.mjs …                                      → 55 enlaces internos, 0 rotos (incluidas las anclas nuevas
                                                          #que-dispara-cada-propiedad, #mezclar-en-srgb-o-en-lineal,
                                                          #m3-aspecto y #medir-coste-shader)
```

Además, con scripts propios (en el scratch del agente: `qa1.mjs`, `qa2.mjs`): los 9 playgrounds JS en marcha con
capturas recortadas (todas se ven como dice el texto), las pruebas de consola de los ejercicios 7.3.3–7.3.5 (partida
y solución) y los experimentos de (a)/«Comprobado». El script de medida para el M1
(`herramientas/estado/lab/rev-m7-3-tiempos.mjs`) se ha probado aquí y funciona (cifras de SwiftShader descartadas).
No he ejecutado `indexar.mjs` (lo hace el lead).
