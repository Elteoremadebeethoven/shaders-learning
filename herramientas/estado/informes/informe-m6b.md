## Informe final: Módulo 6, parte B (lecciones 6.6 a 6.10)

Las cinco lecciones están escritas y verificadas. `verificar.mjs` solo marca los enlaces a lecciones del módulo 7, que aún no existen. Todos los playgrounds compilan (también sus soluciones) y he revisado las capturas en tema oscuro y claro.

Sobre lo que dijiste: esta vez no abrí ningún servidor. Todo se comprobó con `file://` y Chrome headless, siempre con un tiempo límite para que nada pudiera quedarse colgado. El servidor que viste en `127.0.0.1:8765` sigue en marcha: es un `python3 -m http.server 8765` (PID 32429) lanzado a las 21:05 por otra sesión. No lo he tocado por si lo estás usando; se cierra con `kill 32429`.

### 1. Archivos creados
- `/Users/alex/Projects/shaders/modulos/06-glsl/06-ruido.html`
- `/Users/alex/Projects/shaders/modulos/06-glsl/07-animacion-shaders.html`
- `/Users/alex/Projects/shaders/modulos/06-glsl/08-texturas-efectos.html`
- `/Users/alex/Projects/shaders/modulos/06-glsl/09-raymarching.html`
- `/Users/alex/Projects/shaders/modulos/06-glsl/10-codigo-ajeno.html`
- `/Users/alex/Projects/shaders/modulos/06-glsl/recursos/b-m6.css`

Los experimentos (`lab.mjs` y `e01`–`e31`) están en `scratchpad/experimentos/m6b/` y las capturas en `scratchpad/capturas/m6b/`.

### 2. Qué cubre cada lección

| Lección | Ejemplos | Ejercicios | Quizzes | Bestiario |
|---|---|---|---|---|
| 6.6 Aleatoriedad y ruido | 3 | 4 | 3 | 5 |
| 6.7 Animar dentro del shader | 3 | 4 | 3 | 4 |
| 6.8 Efectos con texturas | 4 | 4 | 3 | 5 |
| 6.9 Introducción al raymarching | 3 | 4 | 3 | 6 |
| 6.10 Leer código ajeno | 4 | 4 | 3 | 6 |

- **6.6 Aleatoriedad y ruido.** Por qué no hay `random()`. Tres hashes: el del seno (con un problema nuevo que descubrí, abajo), el de Hoskins explicado línea a línea (es el `hash12` que 6.5 usaba como caja negra) y PCG. La conversión segura de `uint` a float. Ruido de valor con fade lineal, cúbico y quíntico (se ve la diferencia con luz) y ruido de gradiente. fbm y el problema de que las octavas coincidan en el origen. Turbulencia, ridged y mármol, domain warping, ruido animado (desplazar frente a evolucionar), ruido que se repite sin costuras y ruido leído de una textura. Coste medido.
- **6.7 Animar dentro del shader.** La animación como función del tiempo. `sin`, `fract` y `floor` aplicados al tiempo. Bucles perfectos, con un modo que compara el fotograma de t = 0 con el de t = T. Los easings de 2.4 en GLSL, desfase por celda y líneas de tiempo con tramos y ventanas. La rueda que gira al revés y el motion blur. Envolver el tiempo, `u_time` frente a `u_frame`, y cuándo animar en JS: un playground JS con un muelle en JavaScript que alimenta a un shader.
- **6.8 Efectos con texturas.** Encajar la imagen sin deformarla (contain/cover). `texture` frente a `texelFetch`. Zoom, giro y espejo, y cuatro distorsiones, con la idea de que el píxel decide de dónde lee. Aberración cromática, pixelado, efectos de color y kernels (caja, gauss, enfoque, Sobel). Coste medido, desenfoque separable y el coste de la caché. Los modos de repetición en los bordes, las costuras de mipmap con su arreglo `textureGrad`, viñeta y grano.
- **6.9 Introducción al raymarching.** Una demo 2D interactiva del sphere tracing. Rayo de cámara, SDF 3D y cómo combinarlas, normales (diferencias centrales y truco del tetraedro). Una escena capa a capa: Lambert, sombras suaves, oclusión ambiental, niebla y gamma. Mapa de calor de los pasos, el factor 0,8, épsilon relativo, repetición infinita y cámara orbital con el ratón.
- **6.10 Leer código ajeno.** Todas las entradas de Shadertoy y la semántica real de `iMouse`. Traducir a nuestro formato y a WebGL crudo (un reproductor de unas 60 líneas). Tabla 1.00 frente a 3.00 con los mensajes de error reales, The Book of Shaders, lista de pasos para portar, código denso (la rotación `p *= rot(a)` que gira al revés, la rotación comprimida en una línea con su error medido) y licencias.

### 3. Entradas de bestiario
`m6b-hash-fastmath`, `m6b-ruido-parpadea`, `m6b-ruido-rejilla`, `m6b-fbm-origen`, `m6b-ruido-textura-escalones`, `m6b-bucle-salta`, `m6b-desfase-fract`, `m6b-rueda-atras`, `m6b-u-frame-hz`, `m6b-imagen-estirada`, `m6b-rotar-deforma`, `m6b-distorsion-invertida`, `m6b-borde-desenfoque`, `m6b-costura-mipmap`, `m6b-rm-acne`, `m6b-rm-normales`, `m6b-rm-agujeros`, `m6b-rm-halo`, `m6b-rm-repeticion`, `m6b-rm-nada`, `m6b-st-imouse`, `m6b-st-transparente`, `m6b-100-bucle`, `m6b-100-derivadas`, `m6b-textura-nombre`, `m6b-rot-al-reves`.

Son 26 y no se repite ninguno en todo el módulo 6.

### 4. Resultado de `verificar.mjs --soluciones`
```
✓ 06-ruido.html            glsl=17 graficador=3 ejemplos=3 ejercicios=4 quiz=3 bestiario=5 senior=2 palabras=14667 soluciones=4
✗ 07-animacion-shaders.html glsl=11 js=1 graficador=2 ejemplos=3 ejercicios=4 quiz=3 bestiario=4 senior=3 palabras=10292 soluciones=4
   - enlace roto: ../07-integracion/01-arquitectura.html, 03-transiciones-shader.html, 04-vertex-animacion.html
✓ 08-texturas-efectos.html glsl=14 ejemplos=4 ejercicios=4 quiz=3 bestiario=5 senior=2 palabras=9376 soluciones=4
✓ 09-raymarching.html      glsl=10 demo=1 ejemplos=3 ejercicios=4 quiz=3 bestiario=6 senior=2 palabras=10930 soluciones=4
✗ 10-codigo-ajeno.html     glsl=11 js=2 ejemplos=4 ejercicios=4 quiz=3 bestiario=6 senior=2 palabras=7836 soluciones=4
   - enlace roto: ../../modulos/07-integracion/01-arquitectura.html
```
Las cuentas de palabras incluyen el código. Además de compilar, comprobé que varias soluciones hacen lo que dicen:
- **6.7.1:** tras la solución no queda ningún píxel distinto entre t = 0 y t = T; con el código de partida había 1 280.
- **6.10.4:** la semántica completa de `iMouse` funciona haciendo clic y arrastrando de verdad en el lienzo.
- **Resto de soluciones:** revisadas visualmente en las capturas.

### 5. Hallazgos medidos, problemas y decisiones discutibles

**Hallazgos nuevos (Chrome sobre Apple M1):**
- **Hash del seno y fast math.** El mismo hash da otro ruido si el shader contiene un `isnan`: difiere en 16 344 de 16 384 celdas. A 20 000 celdas del origen, sin `isnan` salen 17 valores distintos; con él, más de 1 000. El graficador usa `isnan` por dentro, así que calcula este hash distinto que los editores.
- **`uint` a float.** `float(h) / 4294967295.0` da exactamente 1.0 para cualquier `h` ≥ `0xFFFFFF80u`. Hay que usar los 24 bits altos.
- **Filtrado bilineal.** Entre dos texels vecinos solo salen 257 valores distintos: la posición se cuantiza a 8 bits.
- **Costuras de mipmap.** Solo aparecen si el salto cae dentro de un quad de 2 × 2. Con 3 repeticiones en un lienzo de 600 × 300 no apareció ninguna; con 3,3, 2 992 píxeles leyeron el nivel de 1 × 1.
- **Caché de texturas.** 32 lecturas en posiciones aleatorias costaron entre 6 y 21 veces más que 32 lecturas vecinas.
- **Otros:** un bucle `for` con paso 0,1 da 10 vueltas en la GPU y 11 en JavaScript. Un shader GLSL ES 1.00 dentro de WebGL2 no puede usar derivadas: la extensión no existe allí.

**Discrepancia con 6.1/6.5 (no toqué sus lecciones).** El otro autor mide que `mod(id, 7.0)` falla en 39 de cada millón. Yo mido fallos mucho más frecuentes con el fast math activo: casi un 4 % de los enteros en ±524 288, y dentro de [−128, 127] el fallo aparece en múltiplos negativos de 7 como −21, −42 o −49. Con un `isnan` en el shader no falla nunca. Probablemente la diferencia está en el rango de enteros que se probó. Lo cito en 6.6 junto con su fórmula blindada, que en mis pruebas nunca falla.

**Decisiones discutibles:**
- El hash por defecto en todo el ruido es el de Hoskins, como en 6.5. PCG queda como la opción exacta y el seno solo como ejemplo de lo que falla.
- En 6.10, el código «estilo Shadertoy» conserva los idiomas reales, incluido `smoothstep` con los bordes invertidos, porque es lo que el alumno encontrará. Mi código legible usa siempre la forma portable.
- 6.6 es larga (unas 14 700 palabras con código).
- Añadí la atribución MIT de Hoskins en los bloques donde se explica su hash.

**Sin hacer ni comprobar:**
- No ejecuté `herramientas/indexar.mjs`, porque escribe en `assets/js`. Hay que ejecutarlo para que el bestiario y el buscador incluyan estas lecciones.
- Nada está probado en móviles ni en otras GPU. Las cifras son de ANGLE/Metal en el M1 y así lo dice el texto.

### 6. Sugerencias para componentes compartidos (no los he modificado)
- **`iMouse` del modo shadertoy de `playground-glsl.js`:**
  - Qué hace hoy: `xy` sigue al puntero, `zw` es la posición actual, `w` es positivo mientras pulsas y empieza en el centro del lienzo.
  - Qué hace Shadertoy: `xy` solo cambia mientras el botón está pulsado, `|zw|` es la posición del clic, `w` es positivo solo en el frame del clic, empieza en (0, 0) y usa píxeles enteros.
  - Lo documento en 6.10 y el ejercicio 6.10.4 tiene la versión correcta, que se podría reutilizar.
- **Entradas que faltan en el modo shadertoy:** `iChannelResolution` (fácil con `textureSize`), `iDate` e `iChannelTime`.
- **Deslizadores `int` con etiqueta larga:** en `.control` el `input range` se queda sin anchura. Tuve que acortar las etiquetas. Un tipo «selector» en `data-uniforms` iría mejor para los modos.
- **Título de dos playgrounds en columnas:** con `data-editor="oculto"`, la barra de título se abarrota. Se podría ocultar «Restaurar» mientras el editor está oculto.
- **Documentación del graficador:** indicar que evalúa sin fast math (por el `isnan`), así que sus resultados pueden diferir de los editores.

### 7. Términos para el glosario
- **función hash**: función determinista que convierte una entrada en un número que parece aleatorio.
- **ruido blanco**: valores aleatorios independientes por píxel o celda, sin coherencia espacial.
- **value noise (ruido de valor)**: valores aleatorios en una retícula, interpolados entre ellos.
- **gradient noise (ruido de Perlin)**: gradientes aleatorios en la retícula; vale 0 en las esquinas.
- **simplex noise**: variante sobre una retícula de triángulos o tetraedros, con menos esquinas por celda.
- **fade**: polinomio de interpolación del ruido; el lineal da C0, el cúbico C1 y el quíntico C2.
- **continuidad C0/C1/C2**: que no salten la función, su pendiente o su curvatura.
- **octava**: copia del ruido con el doble de frecuencia.
- **fbm**: suma de octavas con frecuencia × lacunaridad y amplitud × ganancia.
- **lacunaridad**: factor de frecuencia entre octavas (≈ 2).
- **ganancia (persistencia)**: factor de amplitud entre octavas (≈ 0,5).
- **turbulencia**: fbm de |ruido|; da pliegues afilados.
- **ridged noise**: suma de (1 − |ruido|)²; da crestas.
- **domain warping**: evaluar f(p + h(p)), deformando el espacio con otra función.
- **ruido periódico (tileable)**: retícula envuelta con un periodo; se repite sin costuras.
- **PCG**: hash de enteros exacto en cualquier GPU.
- **avalancha**: propiedad por la que cambiar un bit de la entrada cambia toda la salida.
- **fast math**: optimizaciones que suponen que no hay NaN y aproximan funciones; en ANGLE/Metal se desactivan con `isnan`.
- **reloj de ciclo**: fract(t/T), el progreso dentro del ciclo actual.
- **bucle perfecto**: animación cuyo fotograma en t = T es idéntico al de t = 0.
- **onda triangular (ping-pong)**: 1 − |2·fract(x) − 1|, ir y volver sin salto.
- **stagger**: desfase del tiempo por elemento o celda.
- **tramo / ventana**: progreso limitado a un intervalo de tiempo / intervalo que se enciende y se apaga.
- **aliasing temporal**: movimiento aparente falso por muestrear demasiado despacio en el tiempo (la rueda que gira al revés).
- **motion blur**: promedio de la escena en varios instantes del tiempo de exposición.
- **ángulo de obturador**: fracción del frame con el obturador abierto (180° es la mitad).
- **texelFetch**: lectura de un texel exacto por índice entero, sin filtrado.
- **textureGrad / textureLod**: lectura con derivadas o nivel de mipmap explícitos.
- **convolución / kernel**: suma ponderada de vecinos / tabla de esos pesos.
- **desenfoque separable**: kernel 2D hecho en dos pasadas 1D (2N lecturas en lugar de N²).
- **Sobel**: kernel de derivada con suavizado; su magnitud da los bordes.
- **aberración cromática**: canales de color leídos con desplazamientos radiales distintos.
- **viñeteado**: oscurecimiento radial de las esquinas.
- **posterizado**: reducir cada canal a pocos niveles.
- **duotono**: reinterpretar la luminancia con dos colores.
- **contain / cover**: encajar la imagen entera / llenar el lienzo recortándola.
- **raymarching**: renderizar 3D avanzando rayos por una función de distancia.
- **sphere tracing**: avanzar en cada paso la distancia que da la SDF.
- **constante de Lipschitz**: lo máximo que crece una función por unidad de distancia; una SDF exacta tiene 1.
- **normal por gradiente**: la normal como derivada de la SDF.
- **truco del tetraedro**: normal con 4 evaluaciones de la SDF en lugar de 6.
- **sombra suave (k·h/t)**: penumbra estimada con el mínimo de k·h/t a lo largo del rayo de sombra.
- **oclusión ambiental (AO)**: oscurecer rincones muestreando la SDF a lo largo de la normal.
- **repetición de dominio**: mod de las coordenadas para obtener copias infinitas de un objeto.
- **mainImage**: función de entrada de Shadertoy.
- **iMouse**: vec4 de ratón de Shadertoy con semántica de signos.
- **GLSL ES 1.00**: el lenguaje de WebGL1.
- **Apéndice A**: limitaciones de bucles e índices de GLSL ES 1.00.
- **OES_standard_derivatives**: extensión de derivadas en 1.00.
- **código golfeado**: shader comprimido al mínimo de caracteres.
- **CC BY-NC-SA 3.0**: licencia por defecto de Shadertoy (atribución, no comercial, compartir igual).
