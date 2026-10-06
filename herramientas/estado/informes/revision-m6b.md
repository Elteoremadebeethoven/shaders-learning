# Revisión de las lecciones 6.6–6.10 (módulo 6, parte B)

Revisadas a fondo `06-ruido.html`, `07-animacion-shaders.html`, `08-texturas-efectos.html`, `09-raymarching.html` y `10-codigo-ajeno.html` (no tienen recursos `b-*` propios aparte de `recursos/b-m6.css`, que no he tocado). Todas las medidas son de Chrome headless con la GPU real de un **Apple M1 (MacBook Air), ANGLE sobre Metal**, lanzado siempre con el puppeteer-core parcheado de la cola (un solo Chrome a la vez).

**Resultado de la verificación final** (`verificar.mjs --soluciones --capturas` en tema oscuro; `--tema light --capturas` en tema claro): las cinco lecciones pasan sin problemas en los dos temas, con todas las soluciones compilando. Revisé todas las capturas antes y después de los cambios, y también las soluciones de los 20 ejercicios renderizadas aparte en dos instantes. Todas hacen lo que pide el enunciado.

```
✓ 06-ruido.html            glsl=17 graficador=3 ejemplos=3 ejercicios=4 quiz=3 bestiario=5 senior=4 palabras=16051 soluciones=4
✓ 07-animacion-shaders.html glsl=11 js=1 graficador=2 ejemplos=3 ejercicios=4 quiz=3 bestiario=4 senior=3 palabras=10308 soluciones=4
✓ 08-texturas-efectos.html glsl=14 ejemplos=4 ejercicios=4 quiz=3 bestiario=5 senior=2 palabras=9540 soluciones=4
✓ 09-raymarching.html      glsl=10 demo=1 ejemplos=3 ejercicios=4 quiz=3 bestiario=6 senior=2 palabras=11451 soluciones=4
✓ 10-codigo-ajeno.html     glsl=12 js=2 ejemplos=4 ejercicios=4 quiz=3 bestiario=6 senior=2 palabras=8155 soluciones=4
```
Los enlaces y las anclas (`#id`) los comprobé aparte con `rev-m6b-enlaces.mjs`: los enlaces a 7.3 y 7.4 que antes estaban rotos ya funcionan (el módulo 7 los ha creado) y todas las anclas existen.

---

## 1. Hallazgos que afectan a más de una lección (y a otros módulos)

### 1.1 El efecto de `isnan` sobre el fast math se pierde cuando el programa sale de la caché de shaders
Experimento (`scratchpad/qa/rev-m6b-cache.mjs`, salida en `experimentos/rev-m6b/cache.txt`): se compila varias veces el mismo shader con un `isnan` que nunca se cumple y se mide el hash del seno a 20 000 celdas (17 valores distintos = fast math; ~2 000 = seno preciso) y `mod(x, 7.0)` en ±524 288 (43 682 fallos = división rápida; 0 = precisa).

| Compilación del mismo texto con `isnan` | seno (valores distintos) | `mod` (fallos) |
|---|---|---|
| 1.ª vez en un perfil nuevo | 2 069 | 0 |
| 2.ª vez, misma página | 17 | 43 682 |
| tras `page.reload()` | 17 | 43 682 |
| tras cerrar Chrome y relanzarlo con el mismo perfil | 17 | 43 682 |
| mismo shader con un carácter distinto en un comentario | 2 069 | 0 |

Y en la **página real de 6.6** (`rev-m6b-e-cache-pagina.mjs`): en la primera carga, el editor «El mismo + un isnan» muestra 256 niveles de gris (seno preciso); tras recargar, 17, idéntico al editor sin `isnan`. Es decir: **la demostración de 6.6 deja de funcionar en la segunda visita** (en el Chrome del dueño, la caché de disco persiste entre sesiones), y lo mismo le pasa a cualquier afirmación del tipo «con un `isnan` en el shader, X no falla».

- En 6.6 lo he documentado (párrafo nuevo tras los dos editores, caja de bestiario `m6b-hash-fastmath`, hack de la retícula periódica y resumen), con el truco para verlo en vivo: cambiar un espacio en un comentario del segundo editor fuerza una compilación nueva.
- **Fuera de mi encargo, pendiente para el lead:** 3.7 (`m3-isnan-heisenbug`), la GUIA §5.6 («usar isnan()/isinf() … desactiva el fast math de todo el shader»), la cabecera de `graficador.js` (dice que evalúa sin fast math) y las frases de 6.1/6.5 que dicen que con `isnan` `mod` no falla. Todas son ciertas solo en la primera compilación de ese texto exacto.
- **Propuesta para `playground-glsl.js` y `graficador.js`:** si el código fuente contiene `isnan`/`isinf`, añadir al compilar un comentario único por carga de página (p. ej. `// sesión <aleatorio>`) para que el comportamiento documentado sea reproducible; o bien explicar el fenómeno allí donde se enseña. Con la corrección, el graficador volvería a evaluar siempre sin fast math, como dice su cabecera.

### 1.2 Las cifras de tiempo del autor estaban medidas con un método que la GPU de Apple falsea
El laboratorio del autor (`experimentos/m6b/lab.mjs`, `__tiempo`) dibujaba N veces seguidas sobre el mismo framebuffer y dividía. En la GPU de teselas del M1, ese método no mide el trabajo real (la eliminación de superficies ocultas, u otra optimización del controlador, se ahorra los dibujos que el siguiente tapa): por ejemplo, la caja 9 × 9 salía igual de cara que la 1 × 1 (0,22 ms), y el fbm de 8 octavas, en 0,26 ms. He medido de nuevo con cada dibujo en su propia pasada de render (dos framebuffers alternos, `clear` al empezar, `readPixels` final; mediana de 5 tandas; `rev-m6b-lab.mjs` → `__tiempo2`). Las cifras resultantes escalan con el trabajo y son físicamente plausibles (p. ej., los kernels leen a ~65 000 millones de texels/s en los tres tamaños). **Casi todas las cifras de tiempo de 6.6, 6.8 y 6.9 eran de 3 a 30 veces menores que las reales** y las he corregido (lista en el apartado 3). Añadí en 6.6 una caja `senior` «Cómo se mide lo que cuesta un shader (y cómo no)» con la trampa y el método, y 6.8 la cita.

- `EXT_disjoint_timer_query_webgl2` está disponible, pero sus medianas eran erráticas (42 ms para un shader de 5,4 ms); solo el mínimo coincidía con el método robusto. No lo recomiendo sin contraste (así lo dice ahora la caja).
- **Pendiente para el lead:** otros módulos dan tiempos de GPU (5.8, 5.10, 7.1, 7.4…). Conviene comprobar con qué método se midieron.

### 1.3 El «39 por millón» de `mod(x, 7.0)` depende del rango, no del código
Experimento `rev-m6b-e66.mjs` (cada compilación con texto único para evitar la caché):

| Rango de enteros | fallos de `mod(x, 7.0)` (fast math) | múltiplos negativos de 7 en el rango |
|---|---|---|
| −500…999 499 (el de 6.1) | 39 | 71 |
| −128…127 | 8 (−21, −42, −49, −77, −84, −91, −98, −105) | 18 |
| −32 768…32 767 | 2 724 | 4 681 |
| −524 288…524 287 | 43 682 (4,2 % de todos) | 74 898 |

Divisor literal o uniform: idéntico. Con `isnan` (1.ª compilación): 0 en todos. Con 13: 10 / 1 / 813 / 13 099. Con 5 y 12: 0. La versión blindada `x - P*floor((x+0.5)/P)`: 0 fallos en todo. Una simulación en JavaScript de `x * Math.fround(1/7)` redondeado a float32 reproduce **exactamente** los 43 682 fallos: la GPU multiplica por el inverso redondeado, que para 7 y 13 se pasa lo bastante como para que, en los múltiplos negativos, el producto quede por debajo del entero.

- 6.6 decía «frecuentes» y listaba −21, −42…: ahora explica el mecanismo y da las cifras por rango, conectándolas con el 39 de 6.1/6.5.
- **Mi medida no contradice el 39 de 6.1/6.5** (sale exactamente igual en su rango), **pero sí su explicación de los 43 682**: 6.1 (l. 1199) y 6.5 (l. 643) atribuyen esa cifra a «otro shader, con un bucle de un millón de vueltas (donde el compilador parece reutilizar el inverso…)» y dicen que «la frecuencia depende de lo que genere el compilador». Con el shader más simple, un píxel por entero, en el rango ±524 288 salen los mismos 43 682. La frecuencia depende del rango (cuántos múltiplos negativos hay) y de si hay fast math, no de la forma del código. No he tocado 6.1/6.5; propuesta: sustituir esa frase por «en el rango simétrico −524 288…524 287 fallan 43 682 (todos múltiplos negativos de 7): la proporción depende de cuántos negativos pruebes».

---

## 2. Cambios por lección (con el porqué)

### 6.6 Aleatoriedad y ruido
- **Caché y `isnan`** (párrafo nuevo tras los editores del seno, bestiario `m6b-hash-fastmath`, resumen): ver 1.1.
- **Tabla de coste de los hashes:** Hoskins ≈ 0,9× (antes ≈ 1×), PCG ≈ 3× (antes 2,6×), con los ms netos. Se quitó la afirmación «en las GPU de Apple las multiplicaciones de enteros de 32 bits son más caras que las de floats»: la medí y una cadena de 256 multiplicaciones-sumas `uint` costó lo mismo que con `float` (6,2 ms a 2048²). Ahora se atribuye a que PCG hace más trabajo por celda.
- **`fract` en [0, 1)** (anotado del value noise 2D): añadida la letra pequeña de float32 (−1e−9 da 1.0 exacto, enlazando 6.5) y por qué aquí no hace daño (con f = 1 la interpolación da la esquina correcta).
- **Atribuciones:** `fwidth` ahora remite a 6.3 (antes 6.2); dividir por la altura para no estirar, a 6.2 (antes 6.3).
- **Rango del ruido de gradiente 2D:** −0,695 / 0,691 en 4,2 M muestras (antes −0,671 / 0,695) y media de |ruido| 0,18. **3D:** −0,75 / 0,78 (antes −0,71 / 0,72).
- **Turbulencia:** media 0,17 y máximo 0,39 (antes «en torno a 0,25»); ridged, máximo 0,96 y media 0,69.
- **Domain warping:** decía que el M1 «lo mueve sin esfuerzo a pantalla completa». Medido: 18 ms por frame a 2560 × 1600 y 36 ms en 4K. No llega a 60 fps a pantalla completa. Reescrito.
- **Evolucionar (3D) frente a desplazar (2D):** decía «cuesta el doble»; con las implementaciones de la lección, 1,4× (el 2D paga seno y coseno por esquina). Matizado también en el resumen.
- **Hack de la retícula periódica:** reescrito el párrafo del `mod` (ver 1.3), con la advertencia de la caché y la observación de que en el propio editor las esquinas nunca son negativas.
- **Tiempos del fbm** (ruido de textura y «Cuánto paga cada píxel»): textura 0,8 / valor 2,9 / gradiente 5,9 ms con 8 octavas (antes 0,2 / 0,35 / 0,65); 1/4/8/12 octavas: 0,8 / 3,1 / 5,9 / 8,8 ms (antes 0,14 / 0,37 / 0,62 / 0,90), 0,7 ms por octava. La conclusión cambia: 12 octavas a 2048² ya son más de medio frame.
- **Caja `senior` nueva** «Cómo se mide lo que cuesta un shader (y cómo no)» (ver 1.2).
- **Ejercicio 6.6.1:** «con un hash, cualquier cambio en la entrada da otro número, por pequeño que sea» era exagerado. Emulando el `hash13` de Hoskins en float32 (JS con `Math.fround`), la correlación entre la entrada t y t + δ es ≈ 0 para δ = 0,016 y 0,004, −0,17 para 0,001, 0,66 para 0,0001 y 0,96 para 0,00001. Reescrito.

### 6.7 Animar dentro del shader
- Sin cambios de texto: todas sus cifras son analíticas y las comprobé (easeOutBack 1,0996; elastic 1,00049 en p = 1 y máximo ≈ 1,37; 42° por fotograma; 3,75 vueltas/s; 2,09 s y 0,87 s; pasos de float de 0,0078 s y 0,031 s). El comportamiento del reloj de los editores (dt ≤ 0,1 s; `u_frame` congelado en pausa) coincide con `playground-glsl.js`.
- Medí la solución del ejercicio 6.7.1: 0 píxeles rojos en el mapa de diferencia (el código de partida da 1 101 a 350 × 280). En el comprobador de bucles, T = 4 solo falla el disco rosa (892 px) y T = 2 falla también la barra (3 934 px), como dice el texto.
- Enlaces a 7.3 y 7.4: rotos en la primera verificación y correctos en la final (el módulo 7 ya los ha creado).

### 6.8 Efectos con texturas
- **Coste de los kernels:** 9 × 9 → 5,4 ms, 15 × 15 → 14,3 ms, 25 × 25 → 39 ms a 2048² (antes 0,8 / 2,1 / 5,6); «un tercio del presupuesto de un frame» pasa a «más de dos frames enteros». Separable: 1,65 ms por pasada, 3,3 ms en total frente a 39 (antes 0,3 → 0,6 frente a 5,6).
- **Caché:** cerca 6,3 ms (de los que 5,8 son los hashes), al azar en 512 → 29 ms, en 2048 → 213 ms (antes 0,75 / 4,6 / 16, hashes 1). «Veinte veces» → «más de treinta».
- **`MIRRORED_REPEAT`:** existe desde WebGL1 (el texto decía «WebGL2 tiene»).
- **Caleidoscopio sin espejo:** 928–1 428 píxeles en niveles 3–8 según el instante (antes «unos 1 500»); con espejo, todos en el nivel 0.
- **Bayer (6.8.3):** «sube en uno o dos de cada cuatro bloques» era impreciso: con el `+ 0.5` los umbrales efectivos son 12,5 / 37,5 / 62,5 / 87,5 %, así que un color al 30 % sube en 1 de cada 4. Reescrito con los umbrales.

### 6.9 Introducción al raymarching
- **Paso `e` de la normal:** «con e = 0.000001 la esfera salió con ruido» no se sostiene en la escena del ejercicio 6.9.3. Medido: con 1e−6, 30 píxeles difieren en más de 8 niveles de color (la esfera, apenas un par de niveles). El grano aparece hacia 2e−7 y con 1e−7 las normales se rompen del todo. Las caras planas de la caja no cambian nunca, porque las otras dos diferencias dan 0 exacto. Reescritos el párrafo, el bestiario `m6b-rm-normales` y la solución del ejercicio. **El deslizador del ejercicio 6.9.3 pasa a ser logarítmico** (`u_log_e` de −7 a −1, `e = pow(10.0, u_log_e)`): con el lineal anterior, el mínimo era 1e−6, donde no se ve nada, y el editor mostraba «0.000».
- **Tetraedro frente a diferencias centrales:** media 0,013° (98 % de los píxeles < 0,1°) y máximo 26° en aristas (antes 0,04° y 18°).
- **Acné (bestiario `m6b-rm-acne`):** «con una sombra dura empezando en t = 0 la escena entera salió en sombra» solo ocurre con el épsilon absoluto (0,001) en el bucle principal. Con el épsilon relativo del ejemplo 6.9.2 se apaga el 4 % de los píxeles iluminados, en motas. Reescrito con las dos cifras.
- **Mapa de calor:** media de 25 pasos con el lienzo del editor (736 × 320) y 20 a 1024² (antes 23); factor 0,5: de 25 a 45 («casi se duplica»); factor 0,8: de 25 a 31 (antes 23 → 29); épsilon relativo: media 26,5 → 20,6 y máximo 246 → 147 con límite 256, y rayos agotados 8 278 → 261 con límite 100 (antes 28 → 21 y 256 → 166).
- **SDF deformada (punto 4 del ejemplo 6.9.3):** las cifras 680 / 321 / 48 / 0 no se reproducen. Con pasos de sobra y referencia fina, en la esfera salen 316 (f = 1) / 55 (0,9) / 49 (0,8) / 0 (0,7). Y con los 100 pasos del editor, bajar el factor empeora el resto: el horizonte se acorta (con f = 0,6, más de 18 000 píxeles difieren, casi todos en el suelo lejano). Además, «la esfera se llena de manchas oscuras» exageraba. Reescrito, con el consejo de subir los pasos al bajar el factor. En el hack del 0,8, «0,6» pasa a ser «0,7, con pasos de sobra».
- **Coste:** mapa de calor a 1024², 2,3 ms (1,9 con límite 32 y 2,5 con 256) (antes 0,85); añadido 3,3 ms para la escena completa de 6.9.2 frente a 1,25 ms sin sombras ni AO.
- **6.9.4:** con una sola celda, entre el 0,03 y el 0,1 % de píxeles cambian, y el mapa de diferencias muestra que son arañazos en la parte alta de las columnas (antes «en torno al 0,1 %, en las columnas lejanas»).

### 6.10 Leer código ajeno
- Mientras revisaba, el lead reescribió la parte de `iMouse` (caja, demo nueva «iMouse, visualizado», tabla de entradas, envoltura de 17 líneas, ejercicio 6.10.4, resumen). No lo he tocado.
- **Túnel (6.10.1):** la costura del `atan` no está «a la izquierda del centro»: gira con el túnel, porque la rotación se aplica antes del `atan`. Corregido.
- **Tabla 1.00/3.00:** añadido el mensaje real de `%` en 1.00 («integer modulus operator supported in GLSL ES 3.00 and above only»), que es distinto del de los operadores de bits.
- Todo lo demás comprobado sin cambios (apartado 3).

---

## 3. Cifras y afirmaciones medidas, con su resultado
Leyenda: ✓ se sostiene; ✗ no se sostiene (corregida en la lección); ≈ matizada. Todas son de Apple M1, Chrome headless, ANGLE/Metal.

| Lección | Afirmación | Medido | |
|---|---|---|---|
| 6.6 | Seno a 20 000 celdas: 17 valores, correlación 0,55; con `isnan` > 1 000 y ≈ 0; 16 344/16 384 celdas distintas | 17; 0,549; 2 069; −0,016; 16 344 | ✓ (solo en la 1.ª compilación, ver 1.1) |
| 6.6 | Rayas hacia 5 000; 0 en todas las celdas a 300 000 | 65 valores y corr. 0,28 a 5 000; 16 384 ceros a 300 000 | ✓ |
| 6.6 | Hoskins: media 0,497, var. 0,0832, corr. ≈ 0 (0 / 1 000 / 20 000 / −5 000 / 300 000), igual con `isnan`, ~5 000 valores frente a ~8 000 | 0,496–0,499; 0,0828–0,0836; \|corr\| ≤ 0,011; idéntico; 4 346–5 206 frente a 8 078 | ✓ |
| 6.6 | `mediump int` de 32 bits en el M1 | `getShaderPrecisionFormat`: enteros [31, 30, 0] y floats [127, 127, 23] en todas las precisiones | ✓ |
| 6.6 | `float(0xFFFFFF80u)/4294967295.0` = 1.0; con `>>8` el máximo es 0.99999994 | 1.0; 0.99999994 | ✓ |
| 6.6 | bits de −0.0 = 2 147 483 648; `hash12(vec2(0))` = 0 | ídem | ✓ |
| 6.6 | Coste relativo seno 1× / Hoskins ≈ 1× / PCG ≈ 2,6× | 15,8 / 14,0 / 47,4 ms netos → 1× / 0,88× / 3,0× | ≈ |
| 6.6 | Enteros de 32 bits más lentos que floats en Apple | 256 mult.-sumas `uint` = `float` (6,16 ms) | ✗ |
| 6.6 | Rango del ruido de gradiente 2D −0,671 / 0,695 | −0,695 / 0,691 | ≈ |
| 6.6 | Turbulencia de media ≈ 0,25 | 0,167 (máx. 0,385) | ✗ |
| 6.6 | Ruido de gradiente 3D de −0,71 a 0,72 | −0,748 / 0,783 | ≈ |
| 6.6 | Domain warping «sin esfuerzo a pantalla completa» | 17,9 ms a 2560 × 1600; 36,2 ms en 4K | ✗ |
| 6.6 | Evolucionar «cuesta el doble» | fbm3 5 oct. 5,27 ms frente a fbm2 5 oct. 3,79 ms (1,4×) | ≈ |
| 6.6 | fbm 8 oct. a 2048²: textura 0,2 / valor 0,35 / gradiente 0,65 ms | 0,84 / 2,89 / 5,92 ms | ✗ |
| 6.6 | Filtrado LINEAR: 257 valores entre dos texels, escalón cada 8 px | 257; 8,0 px | ✓ |
| 6.6 | fbm gradiente 1/4/8/12 oct.: 0,14 / 0,37 / 0,62 / 0,90 ms | 0,81 / 3,06 / 5,92 / 8,79 ms | ✗ |
| 6.6 | `pow(d, 2.0)` con d < 0: bien sin `isnan`; NaN con `isnan` o con exponente uniform | 0,25; NaN; NaN | ✓ |
| 6.6 | `mod(x, 7.0)` falla en múltiplos negativos; con `isnan` no; la blindada nunca | ver 1.3 | ✓ (con el matiz de la caché) |
| 6.6 | Bicho del origen: mancha negra (value noise), costura vertical (gradiente) | visto en capturas | ✓ |
| 6.7 | 6.7.1: diferencia nula con la solución | partida 1 101 px rojos; solución 0 | ✓ |
| 6.7 | Comprobador: con T = 4 falla solo el rosa; con T = 2, también la barra | 892 px; 3 934 px | ✓ |
| 6.8 | `texelFetch` fuera de rango → (0, 0, 0, 0) | (0, 0, 0, 0), también con un nivel inexistente | ✓ |
| 6.8 | `textureSize`: 256 en el nivel 0 y 32 en el 3 | ídem | ✓ |
| 6.8 | Pixelado: sin líneas con bloques pares; con impares, miles de píxeles distintos | 2/4/8/10/12/40 → 0; 3/7/9/13/39 → 9 323 / 8 141 / 7 026 / 6 025 / 3 457 | ✓ |
| 6.8 | Mosaico 600 × 300: con 3 rep. todo en nivel 2; con 3,3, 2 992 px en el 1 × 1 | 180 000 en nivel 2; 2 992 en nivel 9; con `textureGrad`, todo en nivel 2 | ✓ |
| 6.8 | Caleidoscopio sin espejo: ~1 500 px en niveles reducidos | 928 / 1 372 / 1 428 px (t = 0 / 1,3 / 2,7); con espejo, 0 | ≈ |
| 6.8 | Cajas 9 × 9 / 15 × 15 / 25 × 25: 0,8 / 2,1 / 5,6 ms; 1D de 25: 0,3 ms | 5,40 / 14,26 / 39,36 ms; 1,65 ms | ✗ |
| 6.8 | Caché: 0,75 / 4,6 / 16 ms, hashes 1 ms | 6,34 / 28,6 / 213 ms, hashes 5,78 ms | ✗ |
| 6.9 | Tetraedro frente a centrales: media 0,04°, máx. 18° | 0,013°; 25,6° | ≈ |
| 6.9 | Sombra dura desde t = 0 → toda la escena en sombra | con épsilon absoluto: 0 px iluminados; con el relativo de 6.9.2: 4 % en sombra de más | ≈ |
| 6.9 | Media de 23 pasos; franja roja en el horizonte | 25,2 (736 × 320), 19,6 (1024²); 8 278 px agotan 100 pasos | ≈ |
| 6.9 | Factor 0,5 duplica la media | 25,2 → 45,1 (100 pasos); 26,5 → 53,3 (256 pasos) | ≈ |
| 6.9 | Deformación 0,12: 680 / 321 / 48 / 0 px (f = 1 / 0,9 / 0,8 / 0,6) | 316 / 55 / 49 / 0 (f = 0,7) con pasos de sobra; con 100 pasos, bajar f empeora el horizonte | ✗ |
| 6.9 | Factor 0,8: de 23 a 29 pasos | 25,2 → 30,8 | ≈ |
| 6.9 | Épsilon relativo: media 28 → 21, máx. 256 → 166 | 26,5 → 20,6; 246 → 147 (límite 256) | ≈ |
| 6.9 | Mapa de calor a 1024²: 0,85 ms, casi igual de 32 a 256 pasos | 1,88 / 2,31 / 2,48 ms (32 / 100 / 256) | ✗ |
| 6.9 | Con e = 1e−6 la esfera sale con ruido | casi invisible; grano a 2e−7; rotura a 1e−7 | ✗ |
| 6.9 | 6.9.4: una celda frente a nueve, ~0,1 % de píxeles | 0,03–0,10 % en 5 instantes | ✓ |
| 6.10 | Mensajes de error de la tabla y de los bestiarios | todos idénticos en Chrome (más el de `%`, que faltaba) | ✓ |
| 6.10 | `GL_ES` = 1; `__VERSION__` 100/300; −7/2 = −3; −7 % 2 = −1 | ídem | ✓ |
| 6.10 | Bucle float de paso 0,1: 10 vueltas en la GPU, 11 en JS | 10; 11 | ✓ |
| 6.10 | `OES_standard_derivatives`: no existe en WebGL2; en WebGL1, «not supported» / «disabled» | `getExtension` → null; mensajes idénticos | ✓ |
| 6.10 | `uniform sampler2D texture` compila en 3.00; llamarla da «function name expected» | ídem | ✓ |
| 6.10 | ANGLE inicializa a 0 el parámetro `out` | llamado con `vec4(7.0)`, `+= 0.25` da 0,25 | ✓ |
| 6.10 | `smoothstep` con bordes invertidos y argumentos constantes → 0 | 0 (con argumentos no constantes, 0,648) | ✓ |
| 6.10 | 6.10.3: la rotación aproximada cambia el 1–2 % de los píxeles; con la exacta, 0 | 1,50 / 1,90 / 1,98 / 1,85 %; 0 | ✓ |

---

## 4. Pendientes (no los he cambiado)
- **3.7, GUIA §5.6, cabecera de `graficador.js`, 6.1 y 6.5:** la caché de shaders anula el efecto de `isnan` (1.1).
- **6.1 (l. 1199) y 6.5 (l. 643):** la explicación de los 43 682 fallos (1.3).
- **Tiempos de otros módulos** (5.8, 5.10, 7.1, 7.4…): comprobar el método de medida (1.2).
- **Índices:** hay que ejecutar `node herramientas/indexar.mjs` (escribe en `assets/js`, que no puedo tocar). Hay bestiario y texto nuevos en 6.6 y 6.9.
- **Demo del lead «iMouse, visualizado» (6.10):** usa `smoothstep(12.0, 10.0, d1)` (bordes invertidos). Funciona porque los argumentos no son constantes, pero la propia 6.10 recomienda escribir `1.0 - smoothstep(10.0, 12.0, d1)`. Sugiero cambiarlo por coherencia; no lo toco porque es la parte reservada.
- **Ejercicio 6.9.4 (código de partida, cosmético):** la cámara avanza y, a los ~5 s, la única columna queda detrás y el alumno ve una escena vacía. Se podría colocar la columna relativa a la cámara; lo dejo, porque el alumno reescribe esa parte.

## 5. Sugerencias para componentes compartidos
- **`playground-glsl.js` y `graficador.js`:** comentario único al compilar código con `isnan`/`isinf` (1.1).
- **Deslizadores (`data-uniforms`):** con `paso` < 0,001 el valor se muestra como «0.000» (`dec` máximo 3). Propuesta: decimales según el paso (`Math.ceil(-log10(paso))`) o notación científica, o un campo `formato`. Lo esquivé en 6.9.3 con un deslizador logarítmico.
- **Graficador:** en las discontinuidades (escalones de `floor`, rectas tangentes a trozos) dibuja rayas verticales finas que sobresalen de la curva y llegan hasta los bordes del gráfico (capturas de «Value noise 1D» y «Gradient noise 1D» de 6.6). Propuesta: no unir muestras cuya diferencia supere un umbral, o limitar el trazo por gradiente en los saltos.

## 6. Experimentos (rutas)
- Scripts: `scratchpad/qa/rev-m6b-lab.mjs` (laboratorio, con `__tiempo2` robusto y comentario único anticaché), `rev-m6b-cache.mjs`, `rev-m6b-e-cache-pagina.mjs`, `rev-m6b-e66.mjs`, `rev-m6b-e66b.mjs`, `rev-m6b-e68.mjs`, `rev-m6b-e69.mjs`, `rev-m6b-e69c.mjs`, `rev-m6b-e610.mjs`, `rev-m6b-tiempos.mjs`, `rev-m6b-enlaces.mjs` (enlaces y anclas, sin Chrome).
- Salidas: `scratchpad/experimentos/rev-m6b/*.txt` y sus PNG (soluciones renderizadas en `sol/`).
- Capturas: `scratchpad/capturas/rev-m6b/r1` (antes), `r2` (después, tema oscuro) y `r2-light` (después, tema claro).
