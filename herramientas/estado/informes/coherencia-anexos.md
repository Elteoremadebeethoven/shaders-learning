# Coherencia de los anexos A.2, A.3 y A.5 (sesión 3, agente coh-anexos)

Archivos modificados: `modulos/08-anexos/02-chuleta-glsl.html`, `03-chuleta-webgl.html` y `05-recursos.html`. No he tocado lecciones, `01-bestiario.html`, `04-glosario.html`, `recursos/anexos.*`, `assets/**` ni `herramientas/**` (salvo este informe y las copias en `herramientas/estado/lab/coh-anexos-*`). No he ejecutado `indexar.mjs`. Parado por la orden de parada ordenada del coordinador.

Máquina: contenedor Linux sin GPU, Chromium 141 headless con SwiftShader. Lo que llamo «comprobado aquí» es semántica de la API o mensajes del compilador de ANGLE (validación de WebGL y front-end del traductor: iguales con cualquier backend), no comportamiento numérico de la GPU. No he cambiado ninguna cifra medida en el M1, salvo para alinearla con la lección que la midió.

Scripts y resultados (copiados a `herramientas/estado/lab/`, prefijo `coh-anexos-`): `enlaces-contexto.mjs` (para cada enlace interno de los anexos, contexto de origen y texto real de la sección destino, con los id calculados como `curso.js` en Chrome con JS desactivado), `correr-exp.mjs` (ejecuta una página de experimento y vuelca `window.__res`), `exp-glsl.html`/`exp-glsl2.html`/`exp-glsl3.html` (≈ 110 mensajes del compilador citados en A.2), `exp-api.html` (≈ 50 afirmaciones de A.3: errores, valores iniciales, FLIP_Y con TypedArray, isProgram…), resultados `exp-res*.txt`, `verif-dark.txt`.

## 1. Estado de cada pendiente

| Pendiente | Estado al empezar (commit base) | Qué hice |
|---|---|---|
| A.3 `flush`/`finish` (~l. 230) | Ya corregido por el agente de la sesión 2 (distinción especificación/Chrome; enlaces a `4.1#el-driver-y-el-command-buffer-…`, la sección con la tabla que lo mide, y a `5.10#m5-finish-no-espera`). Pero citaba «un dibujo que tarda unos 68 ms… `readPixels` esperó los 68 ms»: cifra que no está en ninguna lección (4.1: 12 ms, y 40 ms con un shader más pesado; 5.10: 3,6 ms). | Cambiada a la medida de 4.1 (12 ms; `finish` 0,0 ms) con enlace a su tabla. Comprobado que es semántica de Chrome y no de Metal: en SwiftShader, tras un dibujo pesado, `finish` volvió en 0,00 ms y el `readPixels` siguiente tardó 48 ms. |
| A.2 Shadertoy (hecho 4) | Ya hecho: semántica real de `iMouse`, todas las entradas extra y enlaces a `6.10#la-semantica-de-imouse` y `#lo-que-shadertoy-anade-por-delante-y-por-detras`. Comprobado contra `playground-glsl.js` (l. 31–34, 346–390). | Nada. |
| `texelFetch` (hecho 6) | A.2 decía «WebGL garantiza 0» sin el caso de la textura incompleta. | Añadido «(o (0, 0, 0, 1) si la textura está incompleta)» y enlace a `6.8#texture-frente-a-texelfetch` (6.8 ya está corregida). |
| `isnan` y la caché (hecho 1) | A.2 ya lo explicaba, con una imprecisión: «comentario único **a cada compilación**» (en realidad, solo a los shaders con `isnan`/`isinf`, `playground-glsl.js` l. 139). A.3 (`compileShader`) no decía que los editores del curso esquivan la caché. | Precisado en A.2; frase añadida en A.3. Nuevo aviso en A.2: el graficador de bolsillo usa `isnan` (`graficador.js` l. 188–191), así que calcula sin fast math, como la columna «con isnan» de 6.1. |
| `smoothstep` | A.2 se contradecía con e0 = e1: la fila decía «0 hasta el borde y 1 por encima»; la lista de lo indefinido, «NaN (si a = b)». 3.4: «en el borde exacto sale 0/0». | Unificadas con 3.4: «un escalón (0 por debajo, 1 por encima) con 0/0 justo en el borde». |
| `mod`/`fract` (hecho 3) | `fract` = 1.0 ya estaba. En `mod`, «Solo fallan múltiplos negativos del divisor» venía tras `mod(7.0, 0.1)` (que no lo es). La «versión robusta» `x - n * floor((x + 0.5) / n)` se atribuía a 6.1, pero está en 6.5/6.6 (6.1 tiene el remiendo `if (k >= n) k -= n` del ejercicio 6.1.4). | Reescrito con 6.5 (con x entero y divisores como 7 o 13 el fast math calcula `x * (1/y)`; solo fallan los múltiplos negativos; con 3, 5, 100 o potencias de 2, ninguno; 61 % en ±500 000). Remiendo → 6.1 (ej. 6.1.4); robusta → `6.5#cuando-falla-mod`. |
| `atan(0,0)`, `pow` negativa, `normalize(0)`, precisión | Coinciden con 3.3, 3.4, 3.7 y la tabla de 6.1. | `normalize`: añadido «indefinido» y el caso constante ((0, 0) y aviso, 6.1). |
| Valores por defecto, errores, límites | Ver §3. Faltaban los valores por defecto de `alpha`, `antialias`, `premultipliedAlpha`, `powerPreference`… en `getContext` (A.3). | Añadidos (coinciden con la tabla de 5.1 y con `getContextAttributes()` aquí). |
| VAO frente a estado global | Coincide con 4.4. | Nada. |
| Premultiplied alpha | A.3 nombraba `premultipliedAlpha` sin valor por defecto ni enlace. | Filas `getContext` y «canvas» (tabla «¿Quién guarda qué estado?»): por defecto `true`, el compositor trata el búfer como premultiplicado, enlace a `5.7#el-canvas-y-la-pagina-premultipliedalpha`. |
| Enlaces: existen y tratan el tema | 270 enlaces, 0 rotos. | Comprobado además en Chrome (id calculados como `curso.js`, excluyendo títulos dentro de playgrounds/quizzes/callouts/details/`.no-toc`): las 261 anclas existían. Leí el texto de cada sección destino y corregí las que apuntaban a una sección vecina (§2). Tras mis cambios: 306 enlaces, 0 rotos (`enlaces.mjs`, antes de las 3 últimas ediciones; ver §7). |
| Enlaces a 7.x | A.2 enlazaba 7.4 (2) y 7.7 (1); A.3, 7.5 sin ancla. | 29 enlaces nuevos a 7.1, 7.4, 7.5 y 7.7 (§4). |
| A.5 frente a 7.7 | 7.7 remite a A.5 (11 anclas) y no repite la lista; A.5 solo enlazaba 7.7 una vez, sin ancla. | A.5 enlaza en cada paso del plan la sección de 7.7 que da el primer paso (Three.js, WebGPU, compute), la tabla «Qué aprender después» (mismo plan visto como «lo que ya tienes / lo nuevo», incluido el deferred shading, que A.5 no tiene) y los recursos que 7.7 se reserva (WebGPU Explainer, Samples, guía del código del renderer de Three.js), sin repetirlos. |
| URLs externas | — | No comprobables: el proxy bloquea todos los dominios externos (`EGRESS_BLOCKED`: registry.khronos.org, webgl2fundamentals.org, webgpufundamentals.org, marketplace.visualstudio.com). No he cambiado ninguna URL. §6. |

## 2. Cambios por archivo

### A.2 `02-chuleta-glsl.html`
- **`#define`:** aviso de que un número inyectado desde JS (`#define RADIO 2`) es `int` → `7.1#m7-define-entero`.
- **`ivec2(vec2(-0.7, 0.7))`:** el enlace iba a la sección de `mod` de 3.4; ahora a `3.4#m3-mod-negativos` (el caso de la celda del 0 doble con `int()`), con esa explicación.
- **`switch`:** mensajes corregidos con lo medido aquí: selector float → `init-expression in a switch statement must be a scalar integer`; etiqueta float → `case label must be a scalar integer`; última etiqueta vacía → `no statement between the last label and the end of the switch statement` (el texto decía «last case label»).
- **Graficador de bolsillo:** aviso de que usa `isnan` y calcula sin fast math.
- **`mod`:** reescrita la frase de los fallos (§1) y corregidos los enlaces del remiendo (6.1) y de la versión robusta (6.5).
- **`smoothstep`:** fila y lista de lo indefinido unificadas con 3.4 para e0 = e1.
- **`isnan`:** el comentario único solo se añade a shaders con `isnan`/`isinf`.
- **`normalize`:** «indefinido» y caso constante.
- **Funciones de textura:** textura incompleta en el vertex shader → se ve como geometría plana (`7.4#m7-4-heightmap-plano`). `texelFetch`: caso incompleta + `6.8`.
- **`cross`, `fwidth`, `gl_PointSize`, `gl_FrontFacing`:** enlaces a 7.4 (tangentes, alambre baricéntrico, `m7-4-puntos-dpr` con la aclaración de que son píxeles del búfer, `m7-4-cara-trasera`).
- **Tabla 1.00 → 3.00, índices de array:** el mensaje citado (`Index expression can only contain const or loop symbols`) no aparece en Chromium 141, ni en contexto WebGL1 ni WebGL2, ni en VS ni en FS: siempre `Index expression must be constant` (también con `a[i + n]`, n uniform). Corregido, y añadida la excepción medida: en el vertex shader los arrays `uniform` admiten cualquier índice. (El texto decía «medido» en Chrome 154; si en el M1 sale el otro mensaje, ver §7.)

### A.3 `03-chuleta-webgl.html`
- **Regla «Borrar no es instantáneo»:** `is*()` es `false` desde el borrado salvo `isProgram` del programa en uso (medido aquí: `true` con `DELETE_STATUS` = `true`; `false` al soltarlo). La regla general contradecía la fila de `deleteProgram`.
- **`getContext`:** valores por defecto completos y `premultipliedAlpha` con enlace a 5.7.
- **`canvas.width`:** enlace a `7.1#tamano-lo-que-5-1-no-podia-saber`. **`isContextLost`:** enlaces a `7.1#m7-locations-viejas` y `#recursos-y-perdida-de-contexto`.
- **`compileShader`:** los editores del curso esquivan la caché; en WebGL crudo actúa. **`getShaderParameter`** y **`KHR_parallel_shader_compile`:** enlace a `7.1#recarga-en-caliente-sin-congelar-la-pagina`.
- **`vertexAttribDivisor`:** «no avanzan esa ranura» → «cuentan como una sola instancia, la 0» + `7.5#m7-5-divisor-colapso`.
- **`drawArrays` (feedback loop):** `7.5#m7-5-no-avanza`. **`drawElements`:** `Uint16Array` que da la vuelta → `7.4#m7-4-indices-uint16`.
- **`flush`/`finish`:** 68 ms → 12 ms de 4.1 (§1).
- **`bindFramebuffer`:** enlace al bestiario `5.8#m5-viewport-fbo` (antes a la sección general).
- **`enable`:** `RASTERIZER_DISCARD` olvidado anula también `clear` → 7.5. **`blendFunc`:** redondeo a 1/255 con mezcla aditiva → `7.5#m7-5-aditivo-invisible`. **`cullFace`:** `gl_FrontFacing` → `7.4#m7-4-cara-trasera`.
- **`getError`:** «unos 37 µs, entre 30 y 60 según la carga» + 4.1 (lo que dicen 4.1 y 5.1).
- **`getParameter`:** «barata» matizado con la excepción medida de 4.1/5.1 (`COLOR_CLEAR_VALUE` 36 µs) y enlace.
- **Transform feedback:** ancla `7.5#enfoque-3-transform-feedback`; `ARRAY_BUFFER` global como «otro punto» (`m7-5-tf-dos-sitios`); `RASTERIZER_DISCARD` en pareja (`m7-5-rasterizer-discard`).
- **Extensiones:** `EXT_color_buffer_float` → `7.5#enfoque-2-el-estado-en-texturas-float`; `EXT_color_buffer_half_float` → `m7-5-half-congeladas`.

### A.5 `05-recursos.html`
- Introducción del plan: enlace a `7.7#que-aprender-despues` y reparto explícito (A.5: orden y recursos; 7.7: qué es nuevo en cada paso; deferred shading solo en 7.7).
- Three.js: «Empieza por 7.7» (`#three-js-el-mismo-pipeline-con-otros-nombres`, `#lo-que-three-js-no-hace-por-ti`) y, en recursos, por qué archivos del renderer empezar (`#recursos-donde-seguir`).
- WebGPU: el triángulo, WGSL y las trampas al portar en `7.7#webgpu-la-misma-gpu-sin-maquina-de-estados`; WebGPU Explainer y Samples por remisión a 7.7 (sin duplicar las URL).
- Compute: `7.7#compute-shaders-la-gpu-sin-triangulos` (compute shader en WGSL explicado línea a línea; no es una demo en vivo).

## 3. Comprobaciones (Chromium 141, SwiftShader) que confirman lo que ya decían A.2/A.3
- Compilador (≈ 110 casos, `coh-anexos-exp-res*.txt`): `#version` (espacios delante sí; línea vacía antes, 310 es, 330), `#`/`##` (`'#' : invalid character` al expandirse), `GL_`, `#if` con nombre no definido, `#pragma`, `#include`, `__VERSION__`/`GL_ES`, literales (`1.0f`, `09`, 3000000000 compila, 5000000000 no), constructores, swizzles, operadores, calificadores (inicializador global, uniform con inicializador, atributos bool/array, varying int sin `flat`, `out mat`, `layout(location)` en uniform, `binding`, `packed`, bloques `in`, `noperspective`), `discard` en VS, recursión, built-ins de 3.10 inexistentes, sobrecargas (`abs(uint)`, `mix(int)`, `not(true)`, `max(0.5, v)`, `pow(vec3, float)`, `mod(5, 3)`), `textureOffset` fuera de [−8, 7], precisiones por defecto, dos salidas sin `layout`, toda la tabla 1.00 → 3.00 (bucles, `%`, `switch`, `f`, arrays, `round`, `flat`, `out`, inicializador global con aviso, `OES_standard_derivatives`, `texture2DLod`, `gl_FragData[1]`, `inverse`, `isnan`) y los tres errores de enlace. Todo coincide salvo los dos de §2 (switch, índice 1.00).
- API (`coh-anexos-exp-api.html`): atributos por defecto; `drawingBufferStorage` existe; `getAttribLocation` sin enlazar (−1, `INVALID_OPERATION`); `bufferData` con `Array` (0 bytes, sin error); relink (uniform a 0, location vieja `INVALID_OPERATION`); `uniform*(null)` sin error; `clearColor`/`blendColor` sin recortar, `clearDepth(5)` → 1; copia nueva de `getParameter`; FBO con adjuntos de distinto tamaño → 0x8CD9; `DRAW_BUFFER1` = `NONE`; `readBuffer(COLOR_ATTACHMENT0)` en el canvas → `INVALID_OPERATION`; FLIP_Y y PREMULTIPLY se aplican a TypedArrays; valores iniciales de textura, `pixelStorei` y todo el estado fijo; `enable(PRIMITIVE_RESTART_FIXED_INDEX)`, `lineWidth(NaN/0)`, `depthRange(1, 0)`, `activeTexture(1)`, `CONSTANT_COLOR`+`CONSTANT_ALPHA`, stride 256 y 6, `useProgram` sin enlazar; compilación fallida no toca `getError`; `canvas.width` no cambia `VIEWPORT`; query y fence no disponibles en la misma tarea; `MAX_CLIENT_WAIT_TIMEOUT_WEBGL` = 0 y `clientWaitSync` con 1 ns → `WAIT_FAILED` + `INVALID_OPERATION`; `deleteTexture` desenlaza de todas las unidades; `bindBufferBase` escribe el genérico.
- Lecciones cruzadas sin discrepancia: 3.4 (smoothstep, fract, round, mod), 3.7 (precisión, NaN), 4.1 (finish, getError), 4.4 (VAO), 5.1 (atributos, clearColor, límites, getParameter), 5.3 (puntos), 5.5 (pixelStorei, completitud, texelFetch), 5.7 (premultipliedAlpha), 6.1 (tabla de indefinidos), 6.8 (texelFetch), 6.10 (iMouse).

## 4. Enlaces nuevos a 7.x (anclas a vigilar si los revisores de m7 cambian títulos)
Bestiarios (estables, conservan id aunque pasen a nota): `7.1#m7-define-entero`, `#m7-locations-viejas`; `7.4#m7-4-heightmap-plano`, `#m7-4-puntos-dpr`, `#m7-4-cara-trasera` (A.2 y A.3), `#m7-4-indices-uint16`; `7.5#m7-5-divisor-colapso`, `#m7-5-no-avanza`, `#m7-5-aditivo-invisible`, `#m7-5-rasterizer-discard` (2), `#m7-5-tf-dos-sitios`, `#m7-5-half-congeladas`.
Slugs de títulos (cambian si cambia el texto del h2/h3): 7.1 `#tamano-lo-que-5-1-no-podia-saber`, `#recursos-y-perdida-de-contexto`, `#recarga-en-caliente-sin-congelar-la-pagina` (h3); 7.4 `#la-normal-sale-de-dos-tangentes` (h3), `#ver-la-malla-el-truco-baricentrico`; 7.5 `#enfoque-2-el-estado-en-texturas-float`, `#enfoque-3-transform-feedback`; 7.7 `#que-aprender-despues`, `#three-js-el-mismo-pipeline-con-otros-nombres`, `#lo-que-three-js-no-hace-por-ti`, `#recursos-donde-seguir`, `#webgpu-la-misma-gpu-sin-maquina-de-estados`, `#compute-shaders-la-gpu-sin-triangulos`. Ya existían: 7.4 `#terreno-desde-una-textura-…`, `#geometria-sin-buffers-gl-vertexid`; 7.7 `#m7-7-mod-wgsl`.
Pointer events (7.2): no tienen sitio natural en A.2/A.3 (no son API de WebGL) y A.5 no lista recursos de interacción; no los enlacé.

## 5. Discrepancias en lecciones y en 01-bestiario / 04-glosario (no editados)
1. **6.5 `05-patrones.html` l. 642**, caja `id="cuando-falla-mod"`: su `data-titulo` es «Un patrón que se repite sin costuras en una textura», pero 6.1 (l. ~1202) y 6.6 (l. ~946) la citan como la caja «¿Cuándo falla `mod`?» (que es el segundo párrafo). Propuesta: que 6.1/6.6 digan «el párrafo «¿Cuándo falla mod?» de la caja … de 6.5», o separar ese párrafo en su propia caja con ese título conservando el id.
2. **7.7 `07-siguientes-pasos.html` §«Recursos: dónde seguir»:** «tres recursos que no están en el anexo»: A.5 sí enlaza el repositorio de Three.js (raíz, con `src/renderers/shaders`); 7.7 enlaza `src/renderers/webgl`. No es grave; si se quiere exactitud: «el código del renderer WebGL de Three.js (A.5 enlaza el repositorio; aquí, por dónde empezar)».
3. **A.4 `04-glosario.html`:**
   - l. ~1139 `iMouse`: «El modo shadertoy de los editores del curso lo simplifica». **Falso** desde la sesión 2 (hecho 4): implementa la semántica real. Propuesta: «Los editores del curso (`data-modo="shadertoy"`) reproducen esa semántica».
   - l. ~821 `fast math`: no menciona la caché (hecho 1). Añadir: «… pero solo en la primera compilación de ese texto: después la caché de programas de Chrome devuelve la versión con fast math (los editores del curso lo evitan con un comentario único; 6.6)».
   - l. ~1439 `mod`: menciona el 1.0/y exacto con negativos diminutos pero no el fallo del fast math. Añadir: «y, con fast math, en múltiplos negativos de divisores como 7 (6.5)».
   - l. ~2177 `texelFetch`: «fuera de rango, WebGL devuelve ceros» → añadir «(0, 0, 0, 1) con una textura incompleta».
4. **A.1 `01-bestiario.html` l. 198** («Añadir isnan cambia el resultado (fast math)»): añadir «… y solo la primera vez que se compila ese texto: `#m6b-hash-fastmath`» (l. 252 ya enlaza ese caso, pero dentro del hash del seno).

## 6. URLs externas
No verificables desde este contenedor. El chip de A.5 dice «Enlaces comprobados en septiembre de 2026». Las que convendría comprobar primero (dependen de traducciones o páginas concretas): `webgpufundamentals.org/webgpu/lessons/es/webgpu-compute-shaders.html`, `codelabs.developers.google.com/your-first-webgpu-app?hl=es`, `webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html` (A.5 dice «once programas de ejemplo»), `marketplace.visualstudio.com/items?itemName=raczzalan.webgl-glsl-editor`, `…dtoplak.vscode-glsllint`, `graphics-programming.org`, `developer.nvidia.com/gpugems/gpugems/foreword` y `…/gpugems3/foreword`, y el estado de la traducción al español de The Book of Shaders («hasta el capítulo de color»).

## 7. Verificación
- `verificar.mjs --soluciones --capturas` (tema oscuro, Chromium 141/SwiftShader), lanzado tras casi todas las ediciones: **3/3 páginas sin problemas** (A.2: 1 playground JS + 1 graficador, 10 759 palabras; A.3: 3 playgrounds JS, 10 013; A.5: 3 134). Resultado en `coh-anexos-verif-dark.txt`. No llegué a mirar las capturas.
- `enlaces.mjs` (tres archivos): 306 enlaces internos, 0 rotos, antes de las tres últimas ediciones.
- No ejecutados (orden de parada): `--tema light` (cancelado en cola) y `movil.mjs`.

## Dónde me quedé (sesión 3)
**(a) Hecho y verificado:** todo lo de §2 salvo lo de (b). Verificado con `verificar.mjs` (oscuro, 3/3 sin problemas) y `enlaces.mjs` (0 rotos).

**(b) Hecho pero SIN verificar tras la última edición** (cambios de solo texto, HTML revisado a mano):
- `02-chuleta-glsl.html`: fila `switch` (mensajes), fila de índices de array en la tabla 1.00 → 3.00, fila `mod` (enlaces a 6.1 ejercicio 6.1.4 y a `6.5#cuando-falla-mod`), «producto cruz» en `cross`.
- `05-recursos.html`: «allí, qué es nuevo en cada paso».
- Falta: `node herramientas/enlaces.mjs` sobre los tres archivos; `verificar.mjs … --soluciones --tema light` y `movil.mjs` de los tres; mirar las capturas.

**(c) Pendiente, en orden:**
1. Verificación de (b) y mirar capturas (claro/oscuro, 390 px).
2. A.4 glosario y A.1 bestiario: las 5 correcciones de §5.3–§5.4 (las hace quien tenga esos archivos).
3. 6.5/6.1/6.6: título citado de la caja `cuando-falla-mod` (§5.1).
4. Si en el M1 (Chrome 154) el mensaje de índice no constante en GLSL 1.00 resulta ser «Index expression can only contain const or loop symbols» (lo que decía A.2), poner los dos y decir en qué Chrome sale cada uno (A.2, tabla «De GLSL ES 1.00 a 3.00», fila «Índices de array»). Aquí (Chromium 141) solo sale «Index expression must be constant».
5. Comprobar las URL de §6 desde una máquina con salida a internet.

**(d) Experimentos a medio hacer:** ninguno. Todos los scripts y resultados están en `herramientas/estado/lab/coh-anexos-*` (`correr-exp.mjs <página.html>` ejecuta cualquiera de las páginas `exp-*.html` con el Chrome de la cola; `enlaces-contexto.mjs <archivos>` necesita la variable `SALIDA` con la ruta del JSON de salida).
