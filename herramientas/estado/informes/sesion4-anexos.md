# Sesión 4 · agente `anexos` (7.7, A.1–A.5)

Máquina: MacBook Air Apple M1, Chrome 154.0.8037.98 (headless, ANGLE/Metal; WebGPU con Dawn/Metal).
Archivos tocados: `modulos/07-integracion/07-siguientes-pasos.html`, `modulos/08-anexos/01-bestiario.html`,
`02-chuleta-glsl.html`, `03-chuleta-webgl.html`, `04-glosario.html`, `05-recursos.html`; `assets/js/indice-busqueda.js` y
`assets/js/datos-bestiario.js` (regenerados con `node herramientas/indexar.mjs`). Scripts: `herramientas/estado/lab/s4-anexos-*`.

## (a) Cambios hechos y por qué

### 7.7 `07-siguientes-pasos.html`
1. **`createRenderPipelineAsync` (sección «Pipelines y bind groups»)**: «resolvió en 15,6 ms para un shader pequeño» →
   cifras medidas en el M1 (b)3: `createRenderPipeline` vuelve en < 0,1 ms y la compilación se espera en el primer uso
   (≈ 9 ms el primer dibujo frente a 0,3 ms con un pipeline ya usado); la versión asíncrona resuelve en ≈ 9 ms (52 ms el
   primero del dispositivo, < 1 ms si el mismo shader ya se compiló, aunque solo cambie un comentario). El 15,6 ms era una
   medida suelta que no cuadra con ninguna de las tres situaciones (probablemente un primer pipeline «templado»).
2. **Ejercicio 7.7.3**: `data-error-esperado` → `data-error-esperado="webgpu"` (tablón, lead): el código de partida solo
   puede fallar con adaptador WebGPU; el verificador nuevo ya no da un falso problema en máquinas sin GPU.
3. **«Recursos: dónde seguir»** (coherencia-anexos §5.2): «tres recursos que no están en el anexo» era inexacto (A.5 enlaza
   el repositorio de Three.js) → «tres recursos que el anexo deja para esta lección … (A.5 enlaza el repositorio entero;
   aquí, por dónde empezar: …)».
4. Confirmado sin cambios (b)2 y (b)4: «Chrome 154 en un Apple M1», adaptador `apple`/`metal-3`, `bgra8unorm`, subgrupos
   de 32, límites 1024/4 GiB y 256/128 MiB, `getCurrentTexture`, `swizzle_assignment`, la recuperación de contexto de
   Three.js, el `TypeError … 'byteLength'` con `onUpload` y los contadores de memoria (200 buffers, 50 VAOs). No se recorta.

### A.1 `01-bestiario.html` («Diagnóstico rápido por síntoma»)
1. **Casos de m7** (tablas (e) de revision-m7-1…7): los 47 casos m7 que no estaban enlazados quedan en su síntoma (43; el
   44.º, `m7-4-indices-uint16`, ya es nota: m7b; no se enlaza, el síntoma lo cubre `m4-indice-65535`). Varios en dos
   síntomas cuando la tabla lo pedía (p. ej. `m7-5-aditivo-invisible` en «Pantalla negra» y «Colores»;
   `m7-4-heightmap-plano` en «Textura» y «Desaparece»).
2. **Subsección nueva «Transiciones que no empiezan o no terminan limpias»** (`#s-transiciones`, con su entrada en el
   índice de síntomas): los 7 casos de 7.3 y `m6b-desfase-fract` (6.7), con una frase sobre el contrato de una transición.
3. **«Mensajes de WebGL en la consola» → «Mensajes de WebGL o WebGPU en la consola»** (y el índice): añadidos
   `Binding size … is smaller than the minimum binding size` (`m7-7-struct-desalineado`), `A transform feedback buffer
   that would be written to…` (`m7-5-tf-dos-sitios`), `location is not from the associated program` también con
   `m7-locations-viejas`, y el feedback loop de una simulación (`m7-5-no-avanza`). `m7-7-version-duplicada` va en «El
   shader no compila» (con el `0:69: 'version'` de Three.js) y en «Pantalla negra».
4. **coherencia-m6 (c)1–3**: (c)1 ya estaba hecho (commit «A.1 sin enlace a la tarjeta degradada»); (c)2 «Una rotación
   copiada de otro shader gira al revés» apuntaba a `m3-rotacion-inversa-shader`: fundida con la fila de
   `m3-matriz-traspuesta` (con enlace a la nota `m6b-rot-al-reves` de 6.10); (c)3 el hash del seno: `isnan` →
   `m3-isnan-heisenbug` y la caché → `m6b-hash-fastmath`.
5. **coherencia-anexos §5.4**: el ítem de `isnan` («Añadir isnan cambia el resultado (fast math)») añade «pero solo la
   primera vez que se compila ese texto exacto: al recargar, el programa sale de la caché de Chrome compilado con fast
   math» con enlace a `m6b-hash-fastmath`.
6. Además, los 4 casos que tampoco estaban en el diagnóstico (`m2-contexto-reseteado`, `m4-uno-de-diferencia`,
   `m4-pack-alignment`, `m6b-desfase-fract`): ahora los 252 casos tienen al menos un síntoma (comprobado con
   `s4-anexos-diag.mjs`: 283 enlaces, 252 distintos, 0 a casos inexistentes).

### A.4 `04-glosario.html`
Generado con `s4-anexos-glosario.mjs` + `s4-anexos-glosario-datos.mjs` (inserta en su letra con la clave de orden del
generador original —el término sin signos ni espacios, `Intl.Collator("es")`—, calcula el `title` de cada etiqueta desde el
manifest y el destino, valida anclas e ids y actualiza los recuentos). Resultado: **482 → 604 términos, 94 → 114
remisiones**; marcas `M7-PENDIENTE` quitadas (9).
1. **122 términos nuevos de 7.1–7.7** (tablas (f) de revision-m7-1…7 y §7 de informe-m7-3/6/7; para 7.4/7.5 repasé además
   los términos en negrita/cursiva de las lecciones), con definiciones de 1–3 frases, cifras del M1 donde las hay y la
   primera etiqueta como explicación principal. Algunos agrupan términos de varias lecciones: «bucle bajo demanda» (7.3
   principal, 7.1, 7.6), «frustum culling» (7.7 y 7.4, el «descarte por visibilidad» de 7.4), «diferencias finitas» (7.4,
   7.5, 6.9), «compute shader» (7.7 y 7.5), «disolución» (7.3 y el «umbral de transición» de 7.6), «caché de programas»
   (7.6, 6.6, 7.7). «divergencia (de un campo vectorial)» es entrada aparte de «divergencia» (ramas), con remisión cruzada.
2. **20 remisiones** (nombres en inglés y sinónimos: `COMPLETION_STATUS_KHR`, modo bajo demanda, render on demand,
   fallback, diferencias centrales, descarte por visibilidad, heightmap, wipe, timeline, playhead, scrim, umbral de
   transición, Gouraud, Phong, flat shading, subgrupo, `GPUAdapter`, `GPUDevice`, sombreado diferido, scene graph).
3. **Enlaces a 7.x** en las entradas marcadas y en las de las listas de los revisores (≈ 55 entradas): easing, muelle
   amortiguado, stagger (con la fórmula del progreso local de 7.3), tween (interrumpible), alfa premultiplicado, ping-pong,
   bucle de realimentación, fbm, WebGPU (7.7 como explicación principal), vertex shader, instancing, sistema de partículas,
   transform feedback (7.5 como principal), touch-action, prefers-reduced-motion, mejora progresiva, IntersectionObserver,
   pérdida de contexto, devicePixelContentBoxSize, coordenadas baricéntricas, gl_VertexID (valor del índice con
   drawElements), gl_PointSize (píxeles del búfer), vértice provocador, calificadores, caché post-transformación, reinicio
   de primitivas, Nyquist, normal, picking, textura completa, mipmap, textureGrad/textureLod, mezcla aditiva, float16,
   softening, divisor, orphaning, tone mapping, ULP, PCG, AoS/SoA, swap and pop, View Transitions, hint de uso, destino float,
   #version 300 es, precalentar. Regla del glosario respetada: una etiqueta por lección y entrada.
4. **Correcciones**: `iMouse` («el modo shadertoy … lo simplifica», falso desde la sesión 2 → «reproduce esa semántica»);
   `g-dithering` («±medio nivel, un nivel de pico a pico»); `g-fast-math` (solo en la primera compilación; la caché devuelve
   fast math, aunque `isnan` sigue detectando NaN reales —medido por m0-m6—); comportamiento indefinido (+ caché);
   `g-texelfetch` (incompleta → (0, 0, 0, 1); nivel inexistente: ceros en el M1, recortado con SwiftShader); `g-mod`
   (fast math con divisores como 7; `%` de WGSL); `g-eventos-coalescidos` (no uno por frame, hasta 9; antes del rAF; enlace
   a 7.2); `g-line-directiva` (semántica medida de `#line N` y `#line N S`); `g-khr-parallel` (tablón, m7a: 177,5 ms /
   10 frames → unos 85 ms / 8 o 9 frames, Chrome 154).
5. **Ampliadas** (revision-m7-7 (c)3): `g-alineacion` (reglas de WebGPU/std140, `vec3f` a 16), `g-pipeline` (el render
   pipeline como objeto), `g-command-buffer` (command encoder), `g-warp` (subgrupo, 32 en el M1), `g-profundidad-no-lineal`
   (z de NDC en [0, 1] en WebGPU; `g-reversed-z` es remisión a esta entrada), más `g-culling` (≠ frustum culling),
   `g-calidad-adaptativa` (histéresis) y `g-reloj-propio` (escala de tiempo).
6. Recuento de la cabecera y del buscador: 604 términos / 114 remisiones.

### A.2 `02-chuleta-glsl.html`
1. **Índice no constante en GLSL ES 1.00** (tabla 1.00 → 3.00): el M1 da `'n' : Index expression can only contain const or
   loop symbols` (el texto que A.2 tenía antes de la sesión 3) y Chromium 141/SwiftShader `'[]' : Index expression must be
   constant`: ahora cita los dos, con su versión (y que el mensaje del M1 nombra la variable).
2. **Fila de `isnan`** (tablón, m0-m6): la detección no falla en la versión de la caché (medido por m0-m6: 16 384/16 384);
   lo que cambia es que operaciones como `0.0 / 0.0` dejan de dar NaN.

### A.3 `03-chuleta-webgl.html`
- `compileShader`: «aunque `isnan` sigue detectando los NaN reales» (tablón, m0-m6). `finish()` comprobado en el M1 (b)6:
  el texto ya era correcto; sin cambios.

### A.5 `05-recursos.html`
- Las 73 URL externas de los anexos y de 7.7 responden (b)7; ninguna rota. Chip «Enlaces comprobados en septiembre de
  2026» → «octubre de 2026».

## (b) Mediciones (método, cifra antigua → nueva)

1. **7.7, verificación en el M1** (`verificar.mjs --soluciones`, oscuro, antes de editar): ✓ sin problemas; el ejercicio
   7.7.3 falla como debe (`WGSL 17:26 invalid character found`) y su solución da «píxeles distintos: 0.0 % · ✓». WebGPU
   funciona en el Chrome headless del M1 con `file://` (`isSecureContext` = true).
2. **Datos de WebGPU de 7.7** (`s4-anexos-medidas.html`): adaptador `apple` / `metal-3`, no fallback, subgrupos 32–32,
   formato preferido `bgra8unorm`; límites del adaptador 1024 invocaciones/workgroup y 4 294 967 292 B (4 GiB − 4) de
   storage; dispositivo por defecto 256 y 134 217 728 B (128 MiB); `swizzle_assignment` en `wgslLanguageFeatures` y
   `c.xy = p.xy` compila; `getCurrentTexture()` dos veces en la misma tarea → el mismo objeto, y otro tras dos rAF.
   Todo coincide con el texto. «Chrome 154» confirmado (`browser.version()` = Chrome/154.0.8037.98).
3. **`createRenderPipelineAsync`** (`s4-anexos-pipeline.html`, turno exclusivo; `performance.now()` alrededor del
   `await`, mediana de 9; shaders que se distinguen en una constante, no en un comentario): 15,6 ms → **≈ 9 ms**
   (8,3–9,5); el primero del dispositivo, 52 ms; el mismo shader ya compilado (o que solo cambia un comentario),
   0,2–0,6 ms. `createRenderPipeline` vuelve en < 0,1 ms y el primer dibujo con él tarda ≈ 9 ms en completarse
   (`onSubmittedWorkDone`) frente a 0,3 ms con un pipeline ya usado. Primera tanda (solo comentarios distintos):
   0,4–0,6 ms, que delató la caché.
4. **Three.js r186.1 en el M1** (`s4-anexos-three.mjs` + `s4-anexos-three.html`; paquete bajado con
   `npm pack three@0.186.1`, servido por intercepción): tras `loseContext`/`restoreContext` el siguiente `render` da el
   mismo píxel (255, 128, 0); con `onUpload(function () { this.array = null; })` lanza `TypeError: Cannot read properties
   of null (reading 'byteLength')`; 50 `BoxGeometry` añadidas, dibujadas y quitadas: `info.memory.geometries` +50, 200
   `createBuffer`, 50 `createVertexArray`, 0 borrados; tras `geometry.dispose()`: −50, 200 `deleteBuffer`, 50
   `deleteVertexArray`. Coincide con el texto (el «15» inicial era de otras pruebas de la misma página, como dice).
   Nota: `restoreContext()` llamado desde el mismo despacho del evento `webglcontextlost` (un `await` en su listener)
   da «context restoration not allowed»: Chrome decide si se permite restaurar al terminar el despacho.
5. **A.2, índice no constante en GLSL ES 1.00** (contextos WebGL1 y WebGL2, VS y FS): en el M1 sale
   `'n' : Index expression can only contain const or loop symbols`; en Chromium 141/SwiftShader (sesión 3)
   `'[]' : Index expression must be constant`. Arrays `uniform` del VS: compilan con cualquier índice (en los dos); un
   `int` local que no es índice de bucle también falla.
6. **A.3, `finish()`** (1024 × 1024, 400 iteraciones de sin·cos por píxel): `finish` 0,0 ms; el `readPixels` siguiente
   15,3 ms (mediana de 7), frente a 14,4 ms sin `finish`: en Chrome 154 `finish` no espera a la GPU.
7. **URL externas** (`curl -sIL`, y GET con user agent de navegador si HEAD falla): 73 URL; 68 dan 200 a la primera; las 3
   del Marketplace de VS Code dan 404 a HEAD y 200 a GET (las tres extensiones existen: una inexistente da «not found»);
   shadertoy.com y realtimerendering.com dan 403 con la página de comprobación de Cloudflare («Just a moment…»), es decir,
   existen. Comprobado además: la traducción de The Book of Shaders llega al capítulo 06 (color) y desde el 07 (formas)
   está en inglés, como dice A.5; el WebGL State Diagram tiene 11 programas de ejemplo; las páginas de WebGPU
   Fundamentals en español y el codelab `?hl=es` existen. El enlace de 7.4 a codeflow.org (web.archive.org) da 200
   (tablón, para m7b).

### Cambios posteriores, a petición del tablón
- `g-eventos-alineados-con-el-frame` y `g-eventos-coalescidos` (m7a): en el M1 (Chrome 154) los `pointermove` no se
  retuvieron hasta el rAF; el texto dice ahora que depende del sistema (Linux: alineados; M1: según llegan; hasta 9 y 13
  en un frame). Editado a mano tras el generador.
- `g-medida-por-capacidad` (m7b, informativo): «cabe» se decide con la media de los intervalos, no con la mediana (7.6 ya
  lo dice con las mismas cifras).
- A.3, `drawElements` (m7b: `m7-4-indices-uint16` es nota): enlaza también el caso de 4.4 (`m4-indice-65535`); la nota de
  7.4 conserva su id, así que el enlace a 7.4 sigue valiendo.

## (c) Verificación final (después de la última edición de cada archivo)

| Archivo | `verificar.mjs --soluciones` (oscuro) | `--tema light` | `movil.mjs` (390 px) |
|---|---|---|---|
| 7.7 `07-siguientes-pasos.html` | ✓ (soluciones: 7.7.1 6 ✓, 7.7.2 5 ✓, 7.7.3 1 ✓, 7.7.4 4 ✓; 7.7.3 falla como debe) | ✓ | ✓ 390/390 |
| A.1 `01-bestiario.html` | ✓ | ✓ | ✓ 390/390 |
| A.2 `02-chuleta-glsl.html` | ✓ | ✓ | ✓ 390/390 |
| A.3 `03-chuleta-webgl.html` | ✓ | ✓ | ✓ 390/390 |
| A.4 `04-glosario.html` | ✓ | ✓ | ✓ 390/390 |
| A.5 `05-recursos.html` | ✓ | ✓ | ✓ 390/390 |

- `node herramientas/indexar.mjs` (última vez tras la última edición): 802 entradas, **252 casos** (m7-4-indices-uint16
  pasó a nota). `s4-anexos-diag.mjs`: 283 enlaces del diagnóstico, 252 casos distintos, 0 a casos inexistentes, 0 casos
  sin síntoma.
- `node herramientas/enlaces.mjs` (todo el curso): 63 archivos, 3 713 enlaces internos, **0 rotos**.
- QA propia (`s4-anexos-qa.mjs`, un Chrome; oscuro y claro a 1280 px, oscuro a 390 px): 0 errores de KaTeX, 0 `$` sin
  renderizar, 0 mensajes de consola, sin scroll horizontal, 0 enlaces marcados como rotos por `bestiario.js`; filtro del
  glosario: «webgpu» 22 de 604, «transicion» 19, «cache de programas» 6. Capturas revisadas: A.1 (#s-transiciones,
  #s-webgl, #s-reves, #s-nan, una tarjeta m7-7), A.4 (8 entradas nuevas o ampliadas, con KaTeX), A.2 (tabla 1.00 → 3.00),
  7.7 (pipelines, recursos). Capturas de `verificar.mjs` de 7.7 en claro y oscuro revisadas: Tres.js dibuja las tres
  tarjetas, el ejemplo 7.7.3 muestra los dos lienzos iguales con «WebGPU listo · formato bgra8unorm · adaptador apple
  metal-3», el graficador de la z de NDC se lee en los dos temas, los ejercicios 7.7.1–7.7.4 imprimen ✗ con el código de
  partida (7.7.3: «WGSL 17:26 invalid character found») y ✓ con la solución.

## (d) Pendientes y decisiones discutibles

1. **Longitud de 7.7** (≈ 16 000 palabras con código): no se recorta (encargo).
2. **Glosario: 604 términos**. Entran todos los de las tablas (f); algunos son muy específicos de una lección (gl-transitions,
   position parameter, `u_escala`, doble implementación, `WebGPUCoordinateSystem`). Si sobran, son los primeros
   candidatos. Las definiciones que citan una cifra del M1 la toman de la lección (no re-medidas aquí, salvo las de 7.7).
3. **Remisiones de nombres en inglés**: solo las que están lejos alfabéticamente del término principal o son nombres de
   la API (20); otras (bounding sphere, timeline…) se encuentran igual con el filtro, que busca también en el nombre
   inglés.
4. **«Una etiqueta por lección y entrada»** (regla del glosario): algunas entradas mencionan en el texto otra sección de la
   misma lección que no lleva etiqueta (p. ej. `g-disolucion` solo enlaza la sección de 7.3, no el bestiario
   `m7-3-disolucion-atascada`).
5. **A.1, casos en dos síntomas**: se repitieron solo los que la tabla (e) daba con dos grupos; la subsección de
   transiciones repite `m7-3-muelle-quema` (también en «Colores») y `m7-3-salto-al-despertar` (también en «Saltos»).
6. **`createRenderPipelineAsync`**: la cifra nueva es la de shaders que cambian de verdad; si el autor midió 15,6 ms con
   otra cosa (un pipeline más complejo, con depth/blend), su número no era falso, pero sin método no se puede reproducir.
7. El generador del glosario (`s4-anexos-glosario.mjs`) no es idempotente: inserta entradas y falla si ya existen (lo
   comprueba); sirve como registro de lo que se aplicó. Los cambios posteriores (tablón) se hicieron a mano.
8. Nada a medias. Si m7a/m7b cambian títulos de 7.x después de esta pasada, `enlaces.mjs` lo dirá (el glosario tiene
   213 enlaces a 104 anclas distintas de 7.x; los `title` de las etiquetas copian el título de la sección: se quedarían viejos, no rotos).

## Scripts (herramientas/estado/lab/)
- `s4-anexos-medidas.html` + `s4-anexos-medidas.mjs` (ejecutar con `turnos.mjs --exclusivo`): mensajes de GLSL 1.00 con
  índices, `finish()` frente a `readPixels`, datos y límites de WebGPU, `getCurrentTexture`. `node s4-anexos-medidas.mjs
  s4-anexos-pipeline.html`: tiempos de `createRenderPipeline(Async)`.
- `s4-anexos-three.mjs` + `s4-anexos-three.html`: Three.js r186.1 (recuperación de contexto, `onUpload`, memoria);
  necesita el paquete (`npm pack three@0.186.1`, instrucciones en la cabecera; `THREE_BUILD` apunta al `build/`).
- `s4-anexos-glosario.mjs` + `s4-anexos-glosario-datos.mjs`: los términos, remisiones y cambios aplicados a A.4.
- `s4-anexos-diag.mjs`: comprobación del «Diagnóstico rápido» de A.1 contra `datos-bestiario.js`.
- `s4-anexos-qa.mjs <dir>`: capturas en anclas (oscuro/claro/390 px), KaTeX, consola y filtro del glosario.
- `s4-anexos-resultados.txt`: salidas de las medidas, de Three.js, de las URL y de `movil.mjs`.
