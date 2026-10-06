Nota sobre la ejecución anterior: esta vez no se levantó ningún servidor. Todo se comprobó abriendo los HTML con `file://`, con Chrome headless (GPU M1) y con un límite de tiempo en cada comando, así que no se ha quedado nada colgado.

# Informe final · Módulo 2 · Animación con CSS y JavaScript

## 1. Archivos creados
- `/Users/alex/Projects/shaders/modulos/02-animacion/01-pipeline-render.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/02-css-transiciones.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/03-raf.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/04-interpolacion-easing.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/05-fisica-muelles.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/06-canvas2d.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/07-waapi-flip.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/08-proyecto-particulas.html`
- `/Users/alex/Projects/shaders/modulos/02-animacion/recursos/m2.css`: estilos del módulo, solo con variables del tema.
- `/Users/alex/Projects/shaders/modulos/02-animacion/recursos/m2.js`: `M2.ocupar`, `M2.mediana`, `M2.cubicBezier` (coincide con las palabras clave de CSS con un error menor de 6·10⁻⁷), `M2.graficaFrames` y `M2.easings`.

Las herramientas de comprobación están en el scratchpad, en `experimentos/m2/`. Las principales son `exp.mjs`, `soluciones.mjs` (pulsa «Ver solución» en todos los playgrounds y busca errores) y `png.mjs` (decodifica capturas para leer píxeles). Hay unos 60 experimentos más. Las capturas están en `capturas/m2`, `m2-claro` y `m2-paginas`.

## 2. Lecciones
Todas las cifras de las lecciones están medidas, y el texto dice en qué máquina: Chrome 154, M1.

- **2.1 Pipeline** (4 ejemplos, 4 ejercicios, 4 quizzes, 2 bestiario, 4 senior, unas 6400 palabras):
  - Presupuesto por frame y vsync, las cinco etapas y una tabla de 13 propiedades medida con trazas. `background-color` y `clip-path` ya van al compositor; `filter: blur()` no.
  - Demo que bloquea el hilo principal: la caja de `transform` sigue moviéndose y las de `left` y rAF se paran. Lo confirmé con capturas frame a frame.
  - Demo de presupuesto de frame: los intervalos salen cuantizados a 16,7, 33,3 y 50 ms.
  - Layout thrashing medido (50 ms frente a 0,6 ms), qué lecturas fuerzan layout, `will-change` con número de capas y promoción por solapamiento, y `content-visibility`.
- **2.2 Transiciones y keyframes** (4 ejemplos, 5 ejercicios, 3 quizzes, 4 bestiario, 3 senior, unas 7950 palabras):
  - Tabla medida de qué técnicas consiguen que un elemento recién insertado transicione. Un solo rAF no funciona; doble rAF o leer `getComputedStyle(el).opacity` sí.
  - Editor de `cubic-bezier` con puntos arrastrables y una caja real animada con `element.animate()`.
  - Tablas medidas de `steps()` (jump-*) y `linear()`, `fill-mode`, retardo negativo para rebobinar una animación, trampas de los eventos (por propiedad, burbujeo, cancel).
  - `@starting-style` con `allow-discrete`, `height: auto` con grid `0fr`/`1fr` e `interpolate-size`, `@property`, listas de `transform` que no encajan y `prefers-reduced-motion`.
- **2.3 rAF y el tiempo** (2 ejemplos, 4 ejercicios, 3 quizzes, 3 bestiario, 2 senior):
  - Todos los callbacks de un frame reciben el mismo tiempo (medido) y `document.timeline.currentTime` da ese mismo valor.
  - Pestañas ocultas y iframes de otro origen fuera de pantalla no reciben rAF (medido).
  - Demo de tres pantallas simuladas a 30, 60 y 120 Hz, `dt` y su límite, paso fijo con acumulador e interpolación (demo).
  - `setInterval` redondea el retardo a 16 ms y produce un salto doble cada 24 frames (medido), y FPS con media móvil exponencial.
- **2.4 Interpolación y easing** (3 ejemplos, 4 ejercicios, 4 quizzes, 3 bestiario, 2 senior):
  - `lerp`, `inverseLerp`, `remap` y `clamp`, con la precisión de las dos fórmulas de lerp medida.
  - Cuatro graficadores GLSL y construcción de in/out/inOut, más un mini sistema de tweens.
  - Demo de interrupción con gráfica de velocidad, y `k = 1 − exp(−λ·dt)` con semivida (demo a distintas frecuencias).
  - Ángulos, colores (degradados medidos en sRGB, lineal y Oklab) y zoom en espacio logarítmico (demo).
- **2.5 Física y muelles** (3 ejemplos, 4 ejercicios, 4 quizzes, 3 bestiario, 3 senior):
  - Euler explícito, semi-implícito y Verlet con gráfica de energía, y la ecuación del muelle con ω₀ y ζ (graficador y laboratorio k/c/m).
  - El muelle como sustituto del easing y los límites de estabilidad calculados: ω₀·dt < 2 sin rozamiento, unos 0,83 en el crítico.
  - Solución cerrada del muelle crítico, demo de flick con la trampa de `pointerup` medida y cadena de muelles.
- **2.6 Canvas 2D** (3 ejemplos, 4 ejercicios, 3 quizzes, 5 bestiario, 2 senior, unas 8200 palabras):
  - Búfer frente a caja, DPR y `devicePixelContentBoxSize` (desfase de 1 px medido).
  - Olvidar `beginPath` (demo), el medio píxel (medido también a DPR 2), transformaciones y la estela fantasma por el redondeo a 8 bits (medida).
  - Alfa premultiplicado, `putImageData` ignora el estado del contexto, y bucle de píxeles en CPU comparado con el mismo shader en GPU.
  - Tabla de rendimiento en canvas GPU y CPU; varias recetas clásicas no se cumplen en Chrome actual. `OffscreenCanvas` en un worker (sigue animando con el hilo principal bloqueado, verificado).
- **2.7 WAAPI y FLIP** (3 ejemplos, 4 ejercicios, 3 quizzes, 2 bestiario, 2 senior):
  - `element.animate` (easing por defecto `linear`), mando a distancia del objeto `Animation`, `pending`/`ready` y `AbortError`.
  - `fill: 'forwards'` gana al estilo inline y la solución `commitStyles()` + `cancel()`, con el borrado automático de animaciones, el lugar de las animaciones en la cascada y `composite add/accumulate` (medido).
  - FLIP para reordenar y para expandir una tarjeta, y View Transitions: la interacción queda bloqueada durante la transición (verificado).
- **2.8 Proyecto de partículas** (2 ejemplos, 4 ejercicios de ampliación, 2 quizzes, 3 bestiario, 2 senior):
  - Etapas ejecutables: versión ingenua, pool con arrays tipados, fuerzas con ratón y softening, vida y mezcla aditiva, paso fijo con medidor, y demo final con controles.
  - Banco de pruebas medido: con `fillRect` deja de llegar a 60 fps entre 50 000 y 100 000 partículas; escribiendo píxeles aguanta 400 000. Enlaza con 5.9 y 7.5.

## 3. Entradas del bestiario (25)
m2-animacion-congelada, m2-tirones-periodicos, m2-transicion-no-arranca, m2-animacion-no-reinicia, m2-transitionend-varias-veces, m2-rotate-360-no-gira, m2-velocidad-depende-hz, m2-salto-al-volver, m2-setinterval-tirones, m2-invlerp-nan, m2-suavizado-depende-hz, m2-color-mitad-oscura, m2-euler-explota, m2-muelle-explota, m2-flick-falso, m2-contexto-reseteado, m2-beginpath-olvidado, m2-linea-medio-pixel, m2-estela-fantasma, m2-alfa-premultiplicado, m2-abort-error, m2-fill-forwards-pegado, m2-emision-por-frame, m2-splice-en-bucle, m2-fuerza-infinita.

## 4. Verificación (`verificar.mjs`, tema oscuro; también pasé todas en tema claro)
```
✓ 01-pipeline-render.html      js=5 demo=1 ejemplos=4 ejercicios=4 quiz=4 bestiario=2 senior=4 palabras=6437
✓ 02-css-transiciones.html     js=10 demo=1 ejemplos=4 ejercicios=5 quiz=3 bestiario=4 senior=3 palabras=7949
✓ 03-raf.html                  js=7 demo=2 ejemplos=2 ejercicios=4 quiz=3 bestiario=3 senior=2 palabras=6089
✗ 04-interpolacion-easing.html js=6 graficador=4 demo=4 ejemplos=3 ejercicios=4 quiz=4 bestiario=3 · solo enlace roto: ../06-glsl/04-color.html
✗ 05-fisica-muelles.html       js=5 graficador=1 demo=4 ejemplos=3 ejercicios=4 quiz=4 bestiario=3 · solo 07-integracion/02 y 03
✓ 07-waapi-flip.html           js=9 ejemplos=3 ejercicios=4 quiz=3 bestiario=2 senior=2 palabras=5673
✗ 06-canvas2d.html             glsl=1 js=8 demo=1 ejemplos=3 ejercicios=4 quiz=3 bestiario=5 · solo 05-webgl/09, 06-glsl/08, 07-integracion/05
✗ 08-proyecto-particulas.html  js=8 demo=1 ejemplos=2 ejercicios=4 quiz=2 bestiario=3 · solo 05-webgl/09, 06-glsl/06, 07-integracion/05
```
- Los cuatro ✗ se deben únicamente a enlaces a lecciones que todavía no existen (5.9, 6.4, 6.6, 6.8, 7.2, 7.3, 7.5). No hay errores de JavaScript ni de KaTeX.
- Las 36 soluciones de ejercicio se ejecutan sin errores. Las salidas coinciden con lo que dice el texto: 180 px/s, 0,33 s, energía entre 46 y 55, y las pruebas con clics en 2.7 se comportan como se describe.

## 5. Problemas conocidos y decisiones discutibles
- **Solapes con el módulo 1.** Sus autores escribieron en paralelo contenido que coincidía con el mío. Quité mis duplicados y enlacé los suyos: m1-canvas-crece, m1-layout-forzado y m1-modulo-negativo. Reorienté tres de mis entradas del bestiario para que traten un caso distinto:
  - m2-animacion-congelada: animaciones CSS de propiedades que no van al compositor.
  - m2-salto-al-volver: iframes fuera de pantalla.
  - m2-invlerp-nan: CSS ignora en silencio los valores inválidos.

  Conviene que el dueño revise el conjunto m1/m2.
- Todas las cifras son de una sola máquina (M1, Chrome 154 headless). El DPR mayor que 1 lo probé con `--force-device-scale-factor`, no con una pantalla retina real.
- En 2.8, la etapa 4 no tiene playground propio: funciona dentro de la etapa 5.
- La demo final de 2.8 usa un fondo de canvas oscuro fijo en los dos temas, porque la mezcla aditiva lo necesita.
- 2.2 usa `interpolate-size`, `calc-size` y `@starting-style`. El texto los presenta como mejora progresiva y dice que dependen del navegador.
- No cito los valores por defecto de Motion ni de react-spring: la documentación de Motion da un valor de rigidez por defecto que no me cuadra, así que no lo afirmo.
- Subí todos los playgrounds JS a `data-altura` de al menos 300 para evitar la banda negra que se ve con alturas menores (ver punto 6).

## 6. Sugerencias para los componentes compartidos (no he tocado ninguno)
- **playground-js:** con `data-altura` menor de 300 aparece una banda negra bajo el iframe y el editor se corta, porque `.pg-cuerpo` tiene `min-height: 300px` y el lienzo tiene `flex: none`. Propuesta: que `.pg-lienzo` use `flex: 1`, o que la altura del editor sea como mínimo 300.
- **curso.js:** KaTeX ignora todo `.anotado`, así que no se pueden poner fórmulas en las notas línea a línea. Propuesta: ignorar solo `.anotado-codigo`.
- **Curso.plano:** no expone `alSoltar`; tuve que escuchar `pointerup` en el canvas. Además, el estado de `ctx` (por ejemplo `textBaseline`) persiste entre frames en `lienzo2d`, y convendría documentarlo en la cabecera.
- **verificar.mjs:** no ejecuta las soluciones. Se podría incorporar `soluciones.mjs`. Además, su captura de página no sirve para medir animaciones con el hilo bloqueado, porque espera al hilo principal; para eso hay que usar el screencast, como hice yo.
- **Guía de autores:** conviene explicar que las cajas del bestiario se copian al anexo, así que sus enlaces deben escribirse como `../NN-modulo/archivo.html`.

## 7. Glosario
- frame → cada imagen que muestra la pantalla; a 60 Hz, una cada 16,7 ms.
- vsync → instante entre dos lecturas del framebuffer, el único en que se cambia la imagen.
- frame perdido (jank) → frame que no llega a tiempo; la pantalla repite el anterior.
- pipeline de renderizado → JavaScript, estilo, layout, pintado y composición.
- layout (reflow) → cálculo de la posición y el tamaño de cada caja.
- pintado (paint) → grabación de las listas de órdenes de dibujo.
- raster → conversión de esas órdenes en píxeles.
- composición → combinación de las capas en la imagen final.
- capa (composited layer) → parte de la página rasterizada aparte, en una textura.
- hilo del compositor → hilo que compone las capas y anima `transform` y `opacity` sin el hilo principal.
- layout síncrono forzado → layout que provoca leer geometría con cambios pendientes.
- layout thrashing → leer y escribir intercalado, un layout por vuelta.
- will-change → aviso para crear la capa por adelantado.
- función de tiempo (easing) → función de [0, 1] a [0, 1] que da forma al progreso.
- cubic-bezier → easing definido por P1 y P2, con P0 = (0, 0) y P3 = (1, 1).
- steps() → easing a saltos.
- linear() → easing definido por varios puntos unidos por segmentos rectos.
- animation-fill-mode → valor del elemento fuera de la fase activa de la animación.
- @starting-style → estilo «anterior» para el primer cálculo de estilo de un elemento.
- allow-discrete → permite transicionar propiedades discretas como `display`.
- @property → registra el tipo de una custom property para que se pueda interpolar.
- prefers-reduced-motion → preferencia del usuario de reducir el movimiento.
- delta time (dt) → segundos transcurridos desde el frame anterior.
- paso fijo → la simulación avanza siempre con el mismo dt.
- acumulador → tiempo real pendiente de simular.
- alfa (interpolación) → fracción de paso usada para mezclar los dos últimos estados.
- espiral de la muerte → los pasos pendientes crecen más deprisa de lo que se simulan.
- EMA → media móvil exponencial.
- lerp/mix → a + (b − a)·t.
- inverseLerp → fracción de v entre a y b.
- remap → trasladar un valor de un rango a otro.
- smoothstep / smootherstep → in-out con velocidad nula en los extremos (el segundo, también aceleración nula).
- tween → animación de un valor de «desde» a «hasta» en un tiempo, con un easing.
- suavizado exponencial → recorrer cada frame una fracción de la distancia que queda.
- semivida → tiempo en recorrer la mitad de la distancia restante.
- sRGB / luz lineal / Oklab → espacios de color: codificado con gamma / proporcional a la luz / perceptual.
- Euler explícito → integrador que mueve la posición con la velocidad vieja; gana energía.
- Euler semi-implícito (simpléctico) → actualiza primero la velocidad y mueve la posición con la nueva.
- Verlet → integrador que usa las dos últimas posiciones.
- ley de Hooke → F = −k·x.
- frecuencia natural ω₀ → √(k/m).
- razón de amortiguamiento ζ → c / (2√(km)).
- subamortiguado / crítico / sobreamortiguado → ζ < 1 / ζ = 1 / ζ > 1.
- subpasos → dividir el dt de un frame en trozos pequeños.
- flick → lanzar un objeto con la velocidad del gesto.
- eventos coalescidos → posiciones intermedias del puntero que se agrupan en un solo evento.
- devicePixelRatio → píxeles físicos por píxel CSS.
- devicePixelContentBoxSize → tamaño exacto de la caja en píxeles de dispositivo.
- path/subpath → trazado actual del contexto 2D y sus partes.
- alfa premultiplicado → color almacenado multiplicado por su alfa.
- willReadFrequently → canvas mantenido en CPU para lecturas baratas.
- 'lighter' → composición aditiva.
- OffscreenCanvas → canvas controlable desde un worker.
- Web Animations API → modelo de animaciones de CSS expuesto a JavaScript.
- commitStyles → copia el valor actual de una animación al atributo `style`.
- composite add/accumulate → formas de combinar una animación con el valor subyacente.
- FLIP → First, Last, Invert, Play.
- View Transitions → transición entre capturas hecha por el navegador.
- pool → almacén de capacidad fija que reutiliza sus huecos.
- struct of arrays → un array tipado por campo.
- softening → d² + ε² para acotar fuerzas del tipo 1/d².
