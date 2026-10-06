Módulo 6, parte A (6.1–6.5) terminado. Las cinco lecciones pasan `verificar.mjs --soluciones` y las 23 soluciones compilan. Solo queda un aviso: el enlace de 6.2 a 7.1, que falla porque el módulo 7 aún no existe. En esta continuación no arranqué ningún servidor: todo se comprobó sobre `file://` con Chrome headless, que se cierra solo al terminar.

## 1. Archivos creados
Todos en `/Users/alex/Projects/shaders/modulos/06-glsl/`:
- `01-lenguaje.html`, `02-pensar-en-paralelo.html`, `03-formas-sdf.html`, `04-color.html`, `05-patrones.html`
- `recursos/a-estilos.css`: botonera, línea de código generado y muestras de color; solo usa variables del tema.
- `recursos/a-demos.js`: una función autoejecutable, sin módulos ni fetch. Contiene cuatro demos que arrancan con `Curso.alListo`:
  - `#demo-rejilla` (6.2): rejilla de píxeles, con viewport desplazado y selector de tamaño.
  - `#demo-caja` (6.3): derivación de `sdBox`, con los puntos P y B, las zonas y la flecha q.
  - `#demo-paleta` (6.4): editor de paletas de coseno, con 7 preajustes y la línea GLSL resultante.
  - `#demo-vecinos` (6.5): búsqueda en las 3 × 3 celdas vecinas, con el hash PCG portado a JS.

Material auxiliar, fuera del proyecto:
- Experimentos en `/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/experimentos/m6/`: `lab.mjs` (banco GLSL con lectura de píxeles en float), `e61a`–`e65a`, `soluciones.mjs`, `consola.mjs` y `paginas/`.
- Capturas en `scratchpad/capturas/m6`, `m6/sol` y `m6-claro`.

## 2. Por lección
Conteo: ejemplos / ejercicios / quizzes / bestiario.

- **6.1 El lenguaje (3/4/5/5; 4 senior, 2 hack).** Todo GLSL ES 3.00, contrastado con el compilador real:
  - `#version` con sus mensajes de error exactos, identificadores (el caso de la ñ) y la precisión obligatoria, que también afecta a `sampler3D` e `isampler*`.
  - Literales y conversiones: octal, desbordes y saturación float→int.
  - Constructores, swizzles y operadores, incluidas la división entera por cero y `1<<32`.
  - Funciones: copy-in/copy-out, `out` que empieza a cero y alias de `inout`.
  - Tabla de comportamientos indefinidos medidos, preprocesador, plegado de constantes frente a ejecución, fast math y la traducción de ANGLE a MSL.
  - Ejercicios: siete errores, dos resultados con `out`, capas con `inout` y sobrecarga, paleta cíclica sin comportamientos indefinidos.
- **6.2 Pensar en paralelo (3/4/4/5; 2 senior, 1 hack, 1 demo).**
  - El modelo de función pura por píxel.
  - `gl_FragCoord`: centros en .5 y relativo a la ventana, no al viewport.
  - Normalización y aspecto, y el ratón en el mismo espacio.
  - Depurar con color (siete vistas de un campo), máscaras y el primer círculo.
  - Transformar el espacio y no la forma, y un adelanto de la repetición.
  - Quads y `dFdx`, medidos: 2, 2, 6, 6.
  - Ejercicios: marco y cruz de 1 px, disco que lo llena todo, F que gira sobre su esquina, reloj.
- **6.3 Formas con SDF (3/4/5/4; 1 senior, 1 hack, 1 demo).**
  - Primitivas y cobertura del píxel.
  - Antialiasing con `fwidth`. Es norma L1: da 1,03 a 0° y 1,40 a 45°, mientras que la longitud del gradiente da 0,99–1,00. Las derivadas en control de flujo no uniforme también están medidas.
  - Contorno, brillo y sombra; operaciones booleanas; `smin` (con k = 0 da NaN).
  - Operaciones de dominio, escala, y SDF exacta frente a cota.
  - Ejercicios: píldora y anillo, candado, segmento desde cero y polilínea, arregla el antialiasing.
- **6.4 Color (2/4/4/5; 1 senior, 1 hack, 1 demo).**
  - RGB, HSV (versión suave de IQ) y paletas de coseno con editor.
  - sRGB frente a luz lineal, medido: `pow 2.2` difiere de la curva exacta en 209 de 256 niveles. También `SRGB8_ALPHA8`, los mipmaps y la diferencia entre escribir en un FBO o en el canvas.
  - Luminancia Rec. 709 frente a luma Rec. 601; brillo, contraste y saturación.
  - Exposición, tone mapping, banding y dithering.
  - Ejercicios: tres filtros, selector HSV, fundido sin bache, sol HDR.
- **6.5 Patrones (2/4/5/5; 2 senior, 1 hack, 1 demo).**
  - Repetición con `fract`/`floor` y la pérdida de precisión lejos del origen.
  - Identificador de celda más hash (hash12 de Hoskins, el mismo que en 6.6).
  - Espejo, ladrillos y dameros.
  - Repetición polar y caleidoscopio, con la costura de `fwidth(atan)`: 6,25 frente a 0,035.
  - Truchet y hexágonos.
  - Formas que se salen de su celda (búsqueda 3 × 3).
  - Muaré y damero filtrado analíticamente.
  - Zoom infinito log-polar y mosaico periódico con un `mod` a prueba de errores de redondeo.
  - Ejercicios: suelo de baldosas, sol de rayos alternos, cintas transportadoras, discos que no se cortan.

**Totales:** 13 ejemplos, 20 ejercicios, 23 quizzes, 24 bestiarios, 10 senior, 6 hack y 5 resúmenes; 64 playgrounds GLSL, 4 JS, 5 graficadores y 4 demos; unas 48 900 palabras.

## 3. `data-id` de bestiario
Son 24, todos con prefijo `m6a-`; comprobé que no hay duplicados en `modulos/`.
- **6.1:** m6a-enie-identificador, m6a-division-entera, m6a-out-a-cero, m6a-indefinido-portabilidad, m6a-macro-parentesis
- **6.2:** m6a-fragcoord-viewport, m6a-circulo-estirado, m6a-espacios-mezclados, m6a-depurar-saturado, m6a-orden-espacio
- **6.3:** m6a-borde-fijo, m6a-derivadas-rama, m6a-smin-k-cero, m6a-escala-sdf
- **6.4:** m6a-luz-codificada, m6a-mipmap-oscuro, m6a-doble-gamma, m6a-bandas-lineales, m6a-recorte-tono
- **6.5:** m6a-cuartos-esquinas, m6a-patron-lejos, m6a-costura-fwidth, m6a-formas-cortadas, m6a-muare-procedural

## 4. Verificación (pasada final con `--soluciones`)
```
✓ 01  glsl=10 js=2 graficador=1 demo=0 ejemplos=3 ejercicios=4 quiz=5 bestiario=5 senior=4 palabras=12630 soluciones=7
✗ 02  glsl=12 js=1 graficador=0 demo=1 ejemplos=3 ejercicios=4 quiz=4 bestiario=5 senior=2 palabras=8558 soluciones=4 · enlace roto: ../07-integracion/01-arquitectura.html
✓ 03  glsl=11 js=1 graficador=1 demo=1 ejemplos=3 ejercicios=4 quiz=5 bestiario=4 senior=1 palabras=8787 soluciones=4
✓ 04  glsl=15 js=0 graficador=3 demo=1 ejemplos=2 ejercicios=4 quiz=4 bestiario=5 senior=1 palabras=9270 soluciones=4
✓ 05  glsl=16 js=0 graficador=0 demo=1 ejemplos=2 ejercicios=4 quiz=5 bestiario=5 senior=2 palabras=9652 soluciones=4
4/5 páginas sin problemas
```
- **Tema claro (`--tema light`):** las cinco dan el mismo resultado; solo queda el enlace al módulo 7.
- **Soluciones:** `soluciones.mjs` pulsa «Ver solución» en cada ejercicio y captura el resultado; las 23 compilan.
- **Capturas:** las revisé con Read, todas en tema oscuro y una muestra en claro. De esa revisión salieron varias correcciones visuales:
  - bandas que se veían iguales;
  - código tapado en playgrounds lado a lado, que ahora usan `data-apilado`;
  - sombras que no se veían;
  - el encuadre de la demo de vecinos.
- **Cifras:** todas las del texto salen de experimentos en la GPU real.

## 5. Problemas conocidos y lo que no pude comprobar
- **Una sola máquina:** todo se midió en un Apple M1 con Chrome (ANGLE sobre Metal), y el texto lo indica donde importa. Nada está contrastado en Firefox, Safari, D3D/Vulkan ni móviles. Los comportamientos más dependientes de la plataforma:
  - saturación float→int y `7/0 = 7`;
  - índice fuera de rango recortado e inicialización a cero;
  - fast math (`0/0 = 1` sin `isnan`) y `mediump` de 32 bits;
  - derivadas calculadas por pareja de píxeles;
  - `mod(x, 7.0)`, que devuelve 7 en 39 de cada millón de enteros.
- **Derivadas basura en ramas no uniformes (6.3):** las muestro con números medidos, no con una imagen. Donde se esperaba 5,5 salió 10,5, y con una lectura de textura dentro de la rama, 4,18e18. En los casos simples, el compilador del M1 saca el cálculo de la rama y el artefacto no aparece.
- **Prueba perceptiva de gamma (6.4):** una captura no permite juzgar a ojo si las líneas de 1 px se funden con el gris 188. Solo comprobé los valores de los píxeles (128 frente a 188).
- **Enlace de 6.2 a 7.1:** estará roto hasta que exista el módulo 7. La carpeta `07-integracion/` existe, pero está vacía.
- **Comentarios cortados:** en anchos estrechos, algunos comentarios de final de línea quedan fuera del ancho del editor.
- **Servidor en 127.0.0.1:8765:** sigue escuchando un `python -m http.server` (PID 32429, cwd `/Users/alex/Projects/shaders`). Lo arrancó una llamada Bash anterior a esta tarea, el 28/09 a las 21:05. No lo paré porque no está claro que sea mío; `kill 32429` lo detiene.

## 6. Sugerencias para componentes compartidos (no los modifiqué)
- **`assets/js/playground-glsl.js:410`:** la expresión `/^#version\s+300\s+es/` rechaza un `#version` precedido de espacios, líneas vacías o comentarios, que la especificación permite. En ese caso el playground usa el vertex shader 1.00 con un fragment 3.00 y muestra «Fragment shader version does not match other shader versions», un mensaje engañoso. Propongo quitar espacios y comentarios iniciales antes de comprobarlo, o al menos usar `/^\s*#version…/`.
- **Panel de errores:** un mensaje del log que lleva un salto de línea literal se parte en dos líneas. Pasa con el error de `#version`.
- **Playgrounds lado a lado:** el editor toma la altura de `data-altura`, así que un lienzo bajo tapa el código. Convendría documentar `data-apilado` o ajustar el editor a su contenido.
- **`.anotado`:** la columna de código mide unos 48 caracteres a 1440 px y corta las líneas largas.
- **`verificar.mjs`:** podría volcar la consola de los playgrounds JS para revisar las cifras que imprimen, no solo si fallan. Yo lo hice con `consola.mjs`.
- **Incoherencias en otras lecciones:**
  - 6.6 (`06-ruido.html`), línea 420: dice que `fract` está «siempre en [0, 1)», pero en float32 puede dar 1.0 exacto: `fract(-1e-9)` = 1.0, medido y explicado en 6.5.
  - 6.6, línea 702: dividir por la altura para no estirar se enseña en 6.2, no en 6.3.
  - 6.6, línea 646: `fwidth` se enseña en 6.3; 6.2 solo adelanta `dFdx` y los quads.
  - 3.4 (`03-matematicas/04-funciones-forma.html`), líneas 181 y 765: repiten lo de `fract` siempre en [0, 1).
  - La contradicción sobre `mod` que había visto en 6.6 ya la corrigió su autor (línea 940).
- **Chuleta A.2:** puede reutilizar la tabla de comportamientos indefinidos medidos de 6.1.

## 7. Glosario

**Lenguaje y compilador**
- **Swizzle:** acceso a componentes por letras (`v.xy`, `c.bgr`, `v.xxx`) en cualquier orden; al escribir no se pueden repetir.
- **Constructor:** función con el nombre de un tipo (`vec3(1.0)`, `int(x)`); en GLSL ES es la única forma de convertir tipos.
- **Calificador de precisión:** `highp`, `mediump` o `lowp`; en el fragment shader, `float` no tiene precisión por defecto.
- **Copy-in/copy-out:** paso de parámetros: `in` copia al entrar, `out` copia al salir e `inout` hace las dos cosas.
- **Comportamiento indefinido:** resultado que la especificación no fija; cada GPU o driver puede dar uno distinto.
- **Plegado de constantes:** el compilador evalúa las expresiones constantes al compilar, con reglas que pueden diferir de la GPU (`sqrt(-1)` da 0).
- **Eliminación de código muerto:** el compilador borra lo que no afecta a la salida; un uniform sin uso queda inactivo y su location es null.
- **Fast math:** optimizaciones que suponen que no hay NaN ni infinitos; en Chrome sobre Metal están activas salvo que el shader use `isnan`.
- **WEBGL_debug_shaders:** extensión que devuelve el código traducido que ejecuta de verdad la GPU.
- **Preprocesador:** fase previa a la compilación que expande `#define` y resuelve `#if`; trabaja sobre texto, sin tipos.
- **#line:** directiva que cambia el número de línea que usan los mensajes del compilador.

**Coordenadas y depuración**
- **gl_FragCoord:** posición del fragmento en píxeles del búfer, con centros en .5 y origen abajo a la izquierda; es relativa a la ventana, no al viewport.
- **Relación de aspecto:** ancho / alto; dividir los dos ejes por la misma medida evita que las formas se estiren.
- **Máscara:** valor de 0 a 1 por píxel que dice cuánto se aplica una forma o un efecto.
- **Isolíneas:** líneas de igual valor de un campo; pintarlas permite leer una distancia a simple vista.
- **Transformar el dominio:** mover, girar, escalar o repetir las coordenadas en vez de la forma.

**Derivadas**
- **Quad:** bloque de 2 × 2 fragmentos que la GPU ejecuta junto, lo que permite restar valores entre vecinos.
- **dFdx / dFdy:** diferencia de un valor entre píxeles vecinos del quad, en x o en y.
- **fwidth:** `|dFdx| + |dFdy|`, cuánto cambia un valor en un píxel; es norma L1 y en diagonal sobreestima hasta ×1,41.
- **Invocación auxiliar (helper invocation):** fragmento fuera del triángulo que se ejecuta solo para completar un quad.
- **Control de flujo no uniforme:** rama o bucle en el que los píxeles de un quad toman caminos distintos; dentro, las derivadas están indefinidas.

**Formas**
- **SDF:** distancia con signo al borde de una forma: negativa dentro, cero en el borde, positiva fuera.
- **Cota (bound):** función que nunca supera la distancia real pero puede quedarse corta; deforma los contornos de grosor fijo.
- **Cobertura:** fracción del píxel que ocupa la forma; es lo que aproxima el antialiasing.
- **Smooth min (smin):** mínimo suavizado que funde dos SDF en una zona de ancho k.
- **Onion:** `abs(d) - r`, que convierte una forma en su contorno.

**Color**
- **HSV:** tono, saturación y valor; un modelo cilíndrico cómodo para elegir colores.
- **Paleta de coseno:** `a + b·cos(2π(c·t + d))`, una paleta continua definida con cuatro `vec3`.
- **sRGB:** codificación no lineal de los 8 bits de pantalla; el 0,5 codificado equivale a un 21 % de la luz.
- **Luz lineal:** valores proporcionales a la energía; es donde hay que mezclar, iluminar y promediar.
- **SRGB8_ALPHA8:** formato de textura que decodifica de sRGB a lineal al leer y codifica al escribir.
- **Luminancia Rec. 709:** `0,2126 R + 0,7152 G + 0,0722 B` sobre valores lineales.
- **Luma Rec. 601:** `0,299 R′ + 0,587 G′ + 0,114 B′` sobre valores codificados; es una aproximación heredada del vídeo.
- **Exposición:** factor que multiplica la luz antes del tone mapping.
- **Tone mapping:** curva que comprime los valores mayores que 1 al rango de la pantalla (Reinhard: `x / (1 + x)`).
- **Banding:** escalones visibles en un degradado por falta de niveles.
- **Dithering:** ruido de menos de un nivel que se suma antes de cuantizar para romper las bandas.

**Patrones**
- **Repetición de dominio:** reducir las coordenadas con `fract` o `mod` para dibujar infinitas copias evaluando una sola forma.
- **Identificador de celda:** `floor` de las coordenadas, el entero que distingue cada copia.
- **Hash:** función sin estado que convierte una entrada en un número pseudoaleatorio repetible.
- **Repetición en espejo:** repetir invirtiendo una de cada dos copias para que los bordes casen.
- **Repetición polar:** repetir por sectores angulares alrededor de un centro.
- **Caleidoscopio:** repetición polar con espejo en cada sector.
- **Truchet:** mosaico de una baldosa con dos orientaciones elegidas por hash.
- **Búsqueda en vecinos:** evaluar las 3 × 3 celdas de alrededor para que una forma pueda salirse de la suya.
- **Muaré:** patrón falso que aparece cuando un motivo es más fino que el píxel.
- **Límite de Nyquist:** hacen falta al menos dos muestras por periodo para representar una oscilación.
- **Filtro de caja analítico:** integral exacta del patrón sobre el área del píxel, que elimina el muaré.
- **Coordenadas log-polares:** `(log r, ángulo)`, que convierten escalar en trasladar; son la base del zoom infinito.

## Decisiones discutibles
- **`gl_FragCoord`:** corregí el encargo, que decía «relativo al viewport». Medido, es relativo a la ventana: vale `(64.5, 32.5)` en el origen de un viewport situado en (64, 32). Lo escribí así y añadí el bestiario m6a-fragcoord-viewport y una medida en JS.
- **Coherencia con 6.6:** uso el hash12 de Hoskins y la conversión PCG con `>> 8u`, igual que esa lección.
- **Solapes con 5.10** (ANGLE, `WEBGL_debug_shaders`, falso color): enlazo a 5.10 en lugar de repetir el contenido.
- **Playgrounds JS de medida:** usan `data-incluir="glkit"`.
- **Extensión de 6.1:** es la lección más larga (12 630 palabras, 20 secciones h2) porque su lista de temas cubre el lenguaje entero. Se podría partir en dos si el índice lo admite.
