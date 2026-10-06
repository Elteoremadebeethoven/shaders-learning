# Coherencia del tramo m3–m5 (matemáticas, GPU y WebGL)

Revisé las 23 lecciones de los módulos 3, 4 y 5 como un todo. Por cada lección anoté definiciones, cifras, promesas y términos en `scratchpad/experimentos/coh-gpu/mapa.md`, y luego crucé las notas. También revisé las 388 citas que el resto del curso hace a m3–m5.

**Resultado:**
- **Contradicciones reales:** encontré pocas. Hay una técnica (5.2 sobre la diagonal de un quad frente a 4.2/4.3), dos cifras de coste que no cuadraban (4.1 frente a 5.1), un cálculo mal redondeado (5.4) y varias promesas que apuntaban a una lección equivocada.
- **Duplicaciones:** es el problema principal. Nueve cajas `bestiario` repetían, casi literalmente, la de otra lección del tramo, así que el anexo A.1 las listaba dos veces. Además había explicaciones repetidas entre 4.4 y 5.3, entre 4.5 y 5.4, y entre 3.7 y 5.10.

Modifiqué 15 archivos, todos HTML de `modulos/03-matematicas`, `modulos/04-gpu` y `modulos/05-webgl`. No toqué `assets/**`, el manifest, otros módulos ni los anexos.

## Herramientas (scratchpad)

- `qa/coh-gpu-enlaces.mjs`: comprobador de enlaces sin Chrome. Lee los HTML y simula los id que crea `curso.js`: id explícitos, `data-id` de las cajas y el slug de los h2/h3 fuera de playgrounds, quizzes, demos, callouts y details. Comprueba que el archivo existe y que el `#ancla` existe en el destino.
- `qa/coh-gpu-citas.mjs`: lista las citas de otros módulos hacia m3–m5 con su contexto (`experimentos/coh-gpu/citas-entrantes.txt`).
- `qa/coh-gpu-texto.mjs`: pasa cada lección a texto plano para leerla (`experimentos/coh-gpu/txt/`).
- `qa/coh-gpu-exp1.mjs` y `qa/glsl-lab.mjs`: los experimentos. Cada uno lanzó un solo Chrome a través de la cola y lo cerró al terminar.

## Experimentos

Todos se hicieron en un Apple M1 con Chrome 154, ANGLE sobre Metal (`ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)`).

| Qué | Resultado | Para qué |
|---|---|---|
| Coste por llamada (mediana de 7 rondas de 2000 llamadas) | `getParameter(CURRENT_PROGRAM)` y `(MAX_TEXTURE_SIZE)`: 0,1 µs<br>`getParameter(VIEWPORT)`: 0,45 µs<br>**`getParameter(COLOR_CLEAR_VALUE)`: 36 µs**<br>`uniform1i` y `clearColor`: menos de 0,1 µs<br>`getError`: 34 µs (entre 33,8 y 39,4) | Reconciliar 4.1 («getParameter < 0,0001 ms», sin medirlo) con 5.1 (VIEWPORT 0,6 µs), y los 40–60 µs de `getError` en 4.1 con los 37 µs de 5.1 |
| `texelFetch` fuera de rango en una textura RGBA8 de 2×2 | (5,5), (−1,0) y nivel 3 inexistente: siempre `(0, 0, 0, 0)` | Confirmar 5.5. Descargué además la especificación de WebGL 2.0, apartado «Texel Fetches»: *«Texel fetches that have undefined results in the OpenGL ES 3.0 API must return zero, or a texture source color of (0, 0, 0, 1) in the case of a texel fetch from an incomplete texture»* |
| Valores por defecto de una textura nueva | MIN `0x2702` (NEAREST_MIPMAP_LINEAR), MAG `0x2601` (LINEAR), WRAP `0x2901` (REPEAT). Incompleta leída con `texture()`: `(0, 0, 0, 255)` | Coherencia de 5.5 con A.3 |
| Quad de dos triángulos a pantalla completa (64×64), blending aditivo con alfa 0,25 | 4096 píxeles pintados una vez, 0 dos veces | Corregir 5.2 (decía que la diagonal se evalúa dos veces) |
| `atan(u0, u0)` con `u0` = 0 por uniform | NaN sin `isnan` en el shader; 0 con `isnan` | Conciliar 3.3 (dice NaN) con 5.10 (lista 0) |
| `u0 / u0` sin `isnan` en el shader | 1 | Confirma la tabla de 3.7 |
| `Math.fround` en Node | 1,79·10¹² ms tiene un ULP en float32 de 131 072 ms; 1,79·10⁹ s, de 128 s | Corregir 5.4 («hasta 64 s») |

## Cambios por archivo

### 3.2 `02-producto-punto-cruz.html`
- **Caja senior «¿Y los píxeles que caen justo en una arista?»**
  - **El problema:** decía que un píxel sobre una arista pertenece al triángulo si la arista es «superior o izquierda». No aclaraba que eso se define con la y hacia abajo, como en Direct3D. Todo 3.2 trabaja con la y hacia arriba, y 4.2 midió en GL «izquierda o inferior». Un alumno leería que 3.2 y 4.2 se contradicen.
  - **Qué cambié:** añadí la aclaración y el enlace a 4.2, en `#los-pixeles-justo-sobre-una-arista`.

### 3.3 `03-trigonometria.html`
- **`atan(0, 0)`:** 3.3 decía «dio NaN» y 5.10 listaba «dio 0». Los dos resultados son ciertos: 5.10 midió con un `isnan` en el shader. Añadí «(y 0 si el shader contenía un `isnan`…)» con enlaces al comportamiento raro `m3-isnan-heisenbug` y a 5.10. Lo verifiqué: ver la tabla de experimentos.

### 3.6 `06-espacios-coordenadas.html`
- **Bestiario `m3-viewport-desfasado` convertido en nota.** Era idéntico a `m5-viewport-olvidado` de 5.1 («La imagen ocupa solo una esquina o sale estirada tras redimensionar»), y 3.6 ya prometía «lo verás en 5.1».
  - La nota conserva todo su contenido, incluida la pista de que `GLKit.ajustarTamaño` devuelve `true`.
  - Enlaza la caja de 5.1 y mantiene el `id` para que no se rompa ningún enlace.

### 3.7 `07-precision.html`
Esta lección queda como la caja de referencia de los dos pares que se fusionan con 5.4 y 5.10.
- **`m3-tiempo-horas`:**
  - **Causa:** añadí el caso de `mediump` en el móvil (enlace a `#m3-mediump-movil`) y el de `Date.now()`, con valores separados 2¹⁷ ms desde el primer frame (enlace a la sección de 5.4).
  - **Solución:** «nunca `Date.now()`».
- **`m3-nan-pixel-negro`:** añadí la receta concreta, `any(isnan(v)) ? vec4(1.0, 0.0, 1.0, 1.0) : color`, y el enlace a 5.10, donde se practica.

### 4.1 `01-cpu-vs-gpu.html`
- **Tabla de costes:**
  - **`getError`:** «0,04–0,06 ms» pasa a «0,03–0,06 ms», con la advertencia de que varía con la carga del equipo.
  - **Fila «`uniform1i`, `getParameter`, < 0,0001 ms»:** el playground solo mide `uniform1i`. Ahora dice «casi todo `getParameter`» y añade la excepción medida: `COLOR_CLEAR_VALUE` cuesta 36 µs, como `getError`. Enlaza a 5.1.
- **Bestiario `m4-readpixels-lento`:** «de 40 a 60 µs» pasa a «de 30 a 60 µs, según lo ocupada que esté».
- **Dos promesas que apuntaban a una lección equivocada:**
  - **`KHR_parallel_shader_compile` «(5.10)»:** 5.10 no lo trata; lo mide la caja senior de 5.2. El enlace ahora va a 5.2.
  - **Pestaña Performance de DevTools «(1.7, 5.10)»:** 5.10 no habla de DevTools. Ahora remite a 1.7 para la pestaña, y a 5.10 (`#me-frena-la-cpu-o-la-gpu`) para el método CPU/GPU.

### 4.2 `02-pipeline-grafico.html`
- **Bestiario `m4-linewidth` convertido en nota.** Era idéntico a `m5-linewidth`.
  - La caja completa queda en 5.3, que es la lección de puntos y líneas; la tabla de límites de 5.1 ya remitía allí.
  - Los datos propios de 4.2 (la línea medida en una sola fila de píxeles y la perpendicular de 3.2) pasan a la caja de 5.3.
  - La nota mantiene el `id` y enlaza a 5.3.

### 4.4 `04-vbo-vao.html`
Esta lección queda como la caja de referencia para los índices y los colores normalizados.
- **`m4-indice-65535`:** incorpora la medida propia de 5.3: con 65 536 vértices, el triángulo (0, 1, 65535) no pinta nada, el (0, 1, 65534) sí, y con `Uint32Array` el 65535 funciona como un vértice normal.
- **`m4-sin-normalizar`:** incorpora dos datos: el mismo síntoma aparece con floats de 0 a 255, y en el `clearColor` (ejercicio 5.1.1).
- **Promesa corregida:** decía «si el shader no usa un atributo, el enlazador lo elimina… que verás en 4.5». Pero 4.5 lo trata con uniforms, no con atributos. Ahora remite a 4.5 (uniforms) y a 5.2 (`#m5-atributo-menos-uno`, atributos).

### 5.1 `01-contexto.html`
- **«(Qué es enlazar un buffer, en 5.2.)»:** es una promesa desfasada, porque 4.1 y 4.4 ya lo explicaron a fondo. Ahora remite al patrón «enlazar para editar» de 4.1.
- **Caja senior «¿Cuánto cuesta preguntar?»:** añade las cifras medidas (0,1 µs con valores simples) y la excepción de `COLOR_CLEAR_VALUE` (36 µs), que resuelve la tensión con 4.1. También reordené la frase final, que había quedado ambigua.
- **Coste de `getError`:** «cerca de 37 µs» se completa con «en otras ejecuciones, y en la tabla de 4.1, entre 30 y 60 µs», con enlace.

### 5.2 `02-primer-triangulo.html`
- **Caja hack «Un triángulo sin buffers», corrección técnica.** Decía «con dos triángulos, los píxeles de la diagonal se evaluarían dos veces». Eso contradice la regla de desempate de 4.2 y la comparación píxel a píxel de 4.3, que dan cero píxeles pintados dos veces; lo volví a comprobar.
  - **Qué es lo correcto:** lo que se desperdicia son los bloques de 2×2 píxeles partidos por la diagonal, con píxeles de relleno (las *helper invocations* de 4.1 y 4.5).
  - **Otros cambios en la caja:** ahora empieza con «Lo viste en 4.5», enlazado a `#gl-vertexid-dibujar-sin-buffers`, porque 4.5 ya enseña el triángulo con `gl_VertexID` y 5.2 lo presentaba como nuevo.
- **Caja senior «Qué guarda un VAO y qué no»:** ahora remite a la lista de 4.4, comprobada con tres implementaciones.
- **Caja senior del buffer de índices:** ahora dice que es el EBO de 4.4.

### 5.3 `03-buffers-atributos.html`
Esta era la lección con más material repetido de 4.4.
- **Tres bestiarios convertidos en notas, con enlace a su gemelo de 4.4:**
  - `m5-color-sin-normalizar`, gemela de `m4-sin-normalizar`;
  - `m5-indice-65535`, gemela de `m4-indice-65535`;
  - `m5-ebo-desenlazado`, gemela de `m4-ebo-vao-equivocado`.
  - Las notas conservan los datos propios de 5.3 y mantienen su `id`. Siguen funcionando los enlaces desde el ejercicio 5.3.2, desde 7.4 (`#m5-indice-65535`) y desde el anexo.
- **Bestiario `m5-linewidth`:** se queda como caja completa y absorbe los datos de 4.2.
- **Caja senior «¿Entrelazado o separado?»:** tenía el mismo título y el mismo contenido que la de 4.4. La sustituí por un párrafo que remite a 4.4 y conserva la frase propia sobre lo que se sube por frame.
- **Enlaces a 4.4 y 4.5 donde 5.3 volvía a explicar lo mismo:**
  - la tabla de tipos normalizados (con la aclaración de que añade el `UNSIGNED_SHORT`);
  - la caja senior de `vertexAttribIPointer`;
  - los atributos constantes y el hack del color, que son el truco de 4.5;
  - la caja senior de la caché de vértices, con las cifras medidas en 4.4 (de 2,9 a 0,64 invocaciones por triángulo).
- **Solución del ejercicio 5.3.2:** ahora apunta a la caja de 4.4.

### 5.4 `04-uniforms-animacion.html`
- **Bestiario `m5-uniform-null` convertido en nota.** Era gemela de `m4-uniform-silencioso` de 4.5. La nota conserva la referencia a `GLKit.uniforms` y mantiene el `id`, al que enlaza la chuleta A.3.
- **Bestiario `m5-tiempo-float32` convertido en nota.**
  - **Por qué:** es el mismo síntoma que `m3-tiempo-horas` más `m3-mediump-movil`, ambas de 3.7.
  - **Qué conserva:** la receta completa, incluida la idea propia de 5.4 de enviar por separado la parte entera y la fracción.
  - **Enlaces:** mantiene el `id`, al que enlazan 7.1 y 7.2.
- **Corrección numérica sobre `Date.now()`:** decía «se desvía hasta 64 segundos (la mitad de la separación) y esa separación es de 128 s incluso contando en segundos». En milisegundos, la separación es 2¹⁷ ms, unos 131 s, así que la desviación llega a unos 65 s. En segundos sí es 128 s. Lo comprobé con `Math.fround`.
- **Sección «Los uniforms son estado del programa»:** ahora abre diciendo que el modelo ya se vio en 4.5 (`#uniforms-estado-del-programa`) y que aquí se repasa con los mensajes exactos de WebGL.
- **«el truco de `gl_VertexID` de 5.2»:** pasa a «de 4.5 y 5.2».

### 5.5 `05-texturas.html`
- **`texelFetch` fuera de rango:** la afirmación ya era correcta, pero solo citaba la especificación. Ahora añade la medida: `(0, 0, 0, 0)` con coordenadas mayores que el tamaño, negativas y con un nivel de mipmap inexistente.
- **Promesa «lo veremos en 6.2»**, sobre derivadas y mipmaps dentro de ramas divergentes: 6.2 trata los quads y `dFdx`, pero el efecto de las ramas, medido, está en 6.3. Ahora enlaza a las dos.

### 5.6 `06-3d-cubo.html`
- **Bestiario `m5-camara-polo` convertido en nota.** Era el mismo experimento que `m3-lookat-degenerado` de 3.6: `mirarA([0,5,0],…)`. La nota conserva el límite de ±1,55 rad y remite a 3.6.
- **Bestiario `m5-cara-invisible`:** enlaza al comportamiento raro de la escala negativa de 4.2 (`m4-escala-negativa`).
- **Caja senior de precisión de la profundidad:** enlaza a la derivación y la tabla de 3.6 (`#la-profundidad-no-es-lineal`).

### 5.7 `07-blending.html`
- **Párrafo «discard frente a alfa»:** decía «en muchas GPU impide optimizaciones» sin cifras. Ahora cita la medida de 4.2: entre 17 y 27 veces más con 32 capas. Enlaza a `#early-z-probar-la-profundidad-antes-de-sombrear`.

### 5.10 `10-depuracion.html`
- **Bestiario `m5-nan-negro` convertido en nota.** Era gemela de `m3-nan-pixel-negro`. La nota conserva las causas comprobadas aquí y la receta, y mantiene el `id`. En la tabla de síntomas, la fila del NaN pasa a «3.7, esta lección».
- **Párrafo introductorio del NaN:** enlaza a la sección de NaN de 3.7, a la que no remitía.
- **Caja cuidado «Medir NaN con isnan() cambia el resultado»:** repetía el comportamiento raro `m3-isnan-heisenbug` de 3.7 sin citarlo. Ahora lo nombra y lo enlaza.
- **Caja senior «Overdraw opaco…»:**
  - **El problema:** repetía la explicación de TBDR de 4.2.
  - **Qué cambié:** ahora dice «ya lo mediste en 4.2 con 32 capas» y conserva las cifras propias con 16 capas.
- **Bestiario `m5-finish-no-espera`:** ahora remite a 4.1, que ya mostraba que `finish` se comporta como `flush`.

## Problemas en archivos ajenos (no los edité)

1. **6.8 `06-glsl/08-texturas-efectos.html`, línea ~99 (`texelFetch`)**
   - **Qué dice:** «Fuera de rango, el resultado no está definido… (WebGL solo asegura que no se lee memoria ajena), así que no cuentes con ningún valor».
   - **Por qué está mal:** contradice la especificación de WebGL 2.0 (cita arriba), el texto de 5.5 y las chuletas A.2, A.3 y A.5. En el M1 da `(0, 0, 0, 0)`.
   - **Propuesta:** «Fuera de rango, GLSL ES lo deja indefinido, pero WebGL 2.0 obliga a devolver cero (o (0,0,0,1) con una textura incompleta): en nuestra prueba, (0, 0, 0, 0). En OpenGL nativo no cuentes con ello.»
2. **6.6 `06-glsl/06-ruido.html`, línea ~425**
   - **Qué dice:** «`fract(x)` es `x − floor(x)`, siempre en $[0, 1)$ también para negativos (… lo viste en 3.4)».
   - **Por qué está mal:** 3.4 y 6.5 dicen que en float32 puede dar 1.0 exacto; es el pendiente ya anotado en `PENDIENTES_FINALES.md`, que sigue sin arreglar.
   - **Propuesta:** «en $[0, 1)$ (salvo el 1.0 por redondeo con negativos diminutos, 3.4 y 6.5)».
3. **A.3 `08-anexos/03-chuleta-webgl.html`, línea 230 (`flush()`, `finish()`)**
   - **Qué dice:** «finish además espera a que terminen… finish bloquea el hilo principal».
   - **Por qué está mal:** 4.1 y 5.10 midieron que en Chrome `finish` vuelve al instante (se comporta como `flush`), y es `readPixels` el que espera.
   - **Propuesta:** «En la especificación, finish espera; en Chrome no (medido: vuelve en 0 ms, como flush). Para esperar a la GPU, readPixels (o fenceSync sin bloquear).»
4. **1.1 `01-web/01-html.html`, línea 692:** dice «`gl.clear()` en WebGL (lección 5.2)», pero `clearColor` y `clear` se explican en 5.1. Propuesta: 5.1.
5. **1.4 `01-web/04-js-dom-eventos.html`, línea 360:** dice «coordenadas normalizadas (NDC)… (lo verás en la lección 5.2)». Es una sugerencia: las NDC se presentan en 3.1 y se desarrollan en 3.6, así que mejor «3.1 y 3.6 (y en WebGL, 5.2)».
6. **A.1 `08-anexos/01-bestiario.html`: anclas que dejarán de existir cuando se regenere `datos-bestiario.js`.** Las listas de diagnóstico enlazan cajas que ahora son notas. Propuesta por línea:

   | Línea | Enlace actual | Qué hacer |
   |---|---|---|
   | 79 | `#m5-uniform-null` | cambiarlo por `#m4-uniform-silencioso` |
   | 84 | `#m5-camara-polo` | quitarlo (ya está `#m3-lookat-degenerado`) |
   | 145 | `#m3-viewport-desfasado` | quitarlo (queda `#m5-viewport-olvidado`) |
   | 179 | `#m5-color-sin-normalizar` | cambiarlo por `#m4-sin-normalizar` |
   | 191 | `#m5-nan-negro` | quitarlo (queda `#m3-nan-pixel-negro`) |
   | 221 | `#m5-tiempo-float32` | cambiarlo por `#m3-mediump-movil` (ya está `#m3-tiempo-horas`) |
   | 264 y 325 | `#m5-ebo-desenlazado` | cambiarlo por `#m4-ebo-vao-equivocado` |
   | 265 | `#m5-indice-65535` | quitarlo (queda `#m4-indice-65535`) |
   | 273 | `#m4-linewidth` | quitarlo (queda `#m5-linewidth`) |

   Los enlaces desde lecciones a esos `id` siguen funcionando (7.1, 7.2, 7.4, A.3 y 6.1), porque mantuve el `id` en cada nota.
7. **Índices generados:** hay que ejecutar `node herramientas/indexar.mjs`. No lo hice porque escribe en `assets/js/`. Hasta entonces, `datos-bestiario.js` sigue listando las 9 cajas convertidas, con enlaces que aún funcionan.
8. **Bestiarios de 6.x muy parecidos a los de 3.x.** Se lo dejo a quien revise el módulo 6 y a A.1:
   - `m6a-orden-espacio` («La forma orbita alrededor del centro de la pantalla en lugar de girar sobre sí misma») casi coincide con `m3-orden-transformaciones` y `m3-rotacion-inversa-shader`.
   - `m6b-rot-al-reves` se parece a `m3-rotacion-inversa-shader`.
   - `m6b-hash-fastmath` se solapa con `m3-isnan-heisenbug` y `m3-hash-roto`.
   - Si se quedan, que al menos enlacen a la de 3.x.
9. **Separador decimal:** el curso mezcla coma y punto; m3 usa punto de forma deliberada según `revision-m3.md`, y m4–m5 sobre todo coma. No lo unifiqué: es una decisión de estilo de todo el curso, no algo que confunda dentro del tramo.

## Enlaces que siguen rotos a lecciones en redacción

- 3.6:247 enlaza a 7.7.
- 4.1:765 enlaza a 7.7 (WebGPU).
- 4.5:358 enlaza a 7.5. El enlace a 7.4 de esa misma línea ya funciona, y 7.4 usa `gl_VertexID` como promete 4.5.
- 5.2:741, 5.8:35 y 5.9:692 enlazan a 7.5.
- En m3–m5 no hay ningún enlace a A.4.

Aparte de esos, el comprobador da 0 enlaces rotos en los 23 archivos de m3–m5, y ninguna cita de otros módulos hacia m3–m5 está rota.

## Comprobaciones que salieron bien

- **Qué guarda un VAO:** 4.1, 4.4, 5.2, 5.3 y 5.9 cuentan lo mismo.
- **Matrices:** column-major, `m[c*4+r]`, `A·B` aplica B primero, TRS, y `transpose` falso en WebGL1 y permitido en WebGL2. Coincide en 3.5, 3.6, 4.5, 5.4 y 5.6.
- **NDC y viewport:** coinciden en 3.1, 3.6, 4.2, 4.3 y 5.1, incluida la mano izquierda en NDC.
- **Funciones con casos raros:**
  - `atan` en (−π, π];
  - `mod` y `fract` con negativos;
  - `pow` con base negativa;
  - `smoothstep` con los bordes invertidos.
- **Precisión:**
  - `highp` es obligatoria en el fragment shader;
  - `mediump` es float32 en el M1 y float16 en muchos móviles;
  - los ULP del tiempo coinciden entre 3.3, 3.7 y 5.4 (los recalculé).
- **Valores por defecto:** culling, profundidad, blending y filtros coinciden en 4.2, 5.5, 5.6 y 5.7.
- **Premultiplicado:** 5.1, 5.5 y 5.7 coinciden.
- **Promesas:** 3.1 (ratón en 5.4), 3.2 (cubo iluminado con normales interpoladas en 5.6), 3.5 (matriz normal y rotaciones en 5.6, `transpose` en 5.4), 3.6 (viewport en 5.1, proyección y profundidad en 5.6) y 4.1 (lectura diferida en 5.8) se cumplen.
- **1.3 y 1.6:** coinciden con 3.7 y 4.3 (`0x3DCCCCCD`, `MAX_SAFE_INTEGER`, little-endian).
- **Bestiario:** 224 `data-id` en todo el curso, sin duplicados.

## Decisiones discutibles

- **Qué caja se queda en cada pareja de bestiario.** El criterio fue la lección que el manifest dedica al tema, o la que ya citaban las demás:
  - 5.3 para las líneas;
  - 4.4 para los índices, el EBO y los colores normalizados;
  - 5.1 para el viewport;
  - 4.5 para la location `null`;
  - 3.7 para el tiempo y el NaN;
  - 3.6 para `lookAt`.
- **El resto del solapamiento lo mantuve,** con enlaces explícitos:
  - **4.4 y 5.3:** tabla de tipos, tabla de índices.
  - **4.5 y 5.4:** familia `uniform*`, estado del programa.
  - **3.7 y 5.4:** tiempo.

  Los apartados de módulo 5 tienen ejercicios, mensajes de error de WebGL y medidas propias. Recortarlos más obligaría a rehacer ejercicios.
- **Cifras que no toqué.** Las de draw calls de 4.1 (10 000 llamadas: 0,3 ms de JS; 100 000: 10 ms) y 5.9 (20 000: 0,85 ms; 100 000: 17 ms) salen de escenas distintas. Coinciden en orden de magnitud.
- **Nombres que no unifiqué:** `a_pos` frente a `a_posicion`, y `u_t` frente a `u_time` en algunos ejemplos de 4.x y 5.9–5.10. No confunden.

- **Menos cajas de bestiario en 5.3 y 5.4.** Tras la fusión, 5.3 tiene una sola (`m5-linewidth`) y 5.4 otra (`m5-uniform-otro-programa`). Los fenómenos siguen explicados en notas con la receta, y enlazados a la caja que se conserva. Si el dueño prefiere que cada lección técnica tenga varias cajas propias, habría que elegir el caso contrario y dejar las de 4.4 y 4.5 como notas. Lo que no debería volver es el anexo con cada síntoma listado dos veces.

## Verificación

Pasé `verificar.mjs --soluciones --capturas` a los 15 archivos modificados, en 5 tandas por la cola de Chrome. Todas las tandas se ejecutaron después de la última edición.

- **Sin problemas:** 3.2, 3.3, 3.7, 4.2, 4.4, 5.1, 5.3, 5.4, 5.5, 5.6, 5.7 y 5.10.
- **Con avisos solo por enlaces a lecciones aún sin escribir:** 3.6 y 4.1 (hacia 7.7) y 5.2 (hacia 7.5).
- **Errores:** ninguno de compilación, excepciones, KaTeX roto ni errores de consola. Todas las soluciones se ejecutan.
- **Capturas:** están en `scratchpad/capturas/coh-gpu/b1…b5`. Los cambios son solo de texto y no tocan playgrounds.
- **Enlaces:** después de la última edición, `coh-gpu-enlaces.mjs` da 0 enlaces rotos en m3–m5, salvo los 6 que van a 7.5 y 7.7.
