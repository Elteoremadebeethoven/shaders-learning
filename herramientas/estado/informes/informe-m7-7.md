# Informe de la lección 7.7 · Siguientes pasos: Three.js y WebGPU con lo que ya sabes

## 1. Archivos creados

- `modulos/07-integracion/07-siguientes-pasos.html` (data-leccion `07-integracion/siguientes-pasos`)
- `modulos/07-integracion/recursos/l77-tresjs.js` — «Tres.js», una Three.js de juguete (~500 líneas con comentarios) con la API de Three.js (`WebGLRenderer`, `Scene`, `Mesh`, `BufferGeometry`, `BufferAttribute`, `PlaneGeometry`, `ShaderMaterial`, `RawShaderMaterial`, `InstancedMesh`, `PerspectiveCamera`, `info`, `dispose`) y su estrategia real (subida perezosa, programa por texto de shader con prefijo, VAO por pareja geometría-programa, caché de estado y de uniforms, comprobación de errores al primer uso). Incluye `Tres.espiar(gl)`, el espía de llamadas. Se registra como librería de iframe: `data-incluir="glkit,l77tres"`.
- `modulos/07-integracion/recursos/l77-wgsl.js` — modo de resaltado WGSL (CodeMirror «clike») y `data-lang="wgsl"` (envuelve `Curso.modoCM`; debe cargarse después de curso.js).
- `modulos/07-integracion/recursos/l77-estilos.css` — dos columnas de código comparado (`.l77-dos`), tabla de equivalencias (`table.l77-equiv`) y la caja de la comprobación de WebGPU.

No se tocó ningún archivo compartido ni de otras lecciones. **No he ejecutado `herramientas/indexar.mjs`** porque reescribe `assets/js/indice-busqueda.js` y `assets/js/datos-bestiario.js` (la consigna prohíbe editar `assets/**` y hay cinco autores en paralelo): hay que ejecutarlo al final, cuando terminen todos.

## 2. Contenido y conteos

Cierre del curso en dos mitades. **Three.js**: tabla de correspondencias (22 filas, cada una con lo que hace r186 por debajo y la lección del curso); un programa típico anotado línea a línea; el registro real de llamadas de WebGL de Three.js r186 (55 llamadas en el primer frame, 3 y 2 en los siguientes, anotadas); el texto completo que llega al compilador (prefijo de ShaderMaterial, tu código en la línea 57); Tres.js en vivo; ShaderMaterial frente a RawShaderMaterial; el objeto `{ value }`; `onBeforeCompile` y su caché; gestión del color (tabla medida 55/128/188); lo que Three.js no hace por ti (tamaño/cámara con el esqueleto de 7.1, `Timer`, pérdida de contexto y el truco `onUpload`, frustum culling, memoria y `dispose`). **WebGPU**: por qué existe y estado de soporte (con hedging y enlace a caniuse), comprobación en vivo del navegador del alumno, diagrama de objetos, tabla llamada a llamada frente a WebGL, ejemplo lado a lado WebGL2/WebGPU en vivo, WGSL para quien sabe GLSL (tabla con los mensajes reales de Tint), `override`, análisis de uniformidad, pipelines y bind groups, alineación de structs, límites de adaptador frente a dispositivo, compute shaders, z de NDC en [0, 1] (graficador GL frente a WebGPU) y origen de la y, errores asíncronos y `device.lost`, Three.js `WebGPURenderer`/TSL. Cierre: qué se transfiere (tabla), qué aprender después (tabla técnica → lo que ya tienes → lo nuevo, enlazando cada fila al plan de A.5), recursos (remitiendo a A.5 sin duplicarlo) y párrafo de fin de curso.

Conteo (verificar.mjs): ejemplos 3 · ejercicios 4 (todos con solución en playground) · quizzes 3 · anotados 7 · callouts 15 (bestiario 9, senior 3, hack 2, resumen 1) · playgrounds JS 6 · graficador 1 · demo 1 · SVG 2. Prosa ≈ 11 200 palabras sin código ni tablas (por encima del orientativo de 8 000: es una lección de cierre con dos temas grandes; ver §5).

- Ejemplo 7.7.1 — Un programa de Three.js, llamada a llamada (anotado + registro medido).
- Ejemplo 7.7.2 — Tres.js: una Three.js de juguete (playground; la consola muestra las llamadas de 3 frames).
- Ejemplo 7.7.3 — El mismo efecto en WebGL2 y en WebGPU (playground en vivo, con alternativa si no hay WebGPU).
- Ejercicio 7.7.1 (★★) — La caché de uniforms de Three.js (6 pruebas con el espía).
- Ejercicio 7.7.2 (★★) — La matriz de perspectiva de WebGPU (z en [0, 1]; compara con los valores de Three.js).
- Ejercicio 7.7.3 (★★) — Portar un shader de GLSL a WGSL (arnés que compara píxel a píxel WebGL2 y WebGPU; código de partida que no compila a propósito, `data-error-esperado`).
- Ejercicio 7.7.4 (★★★) — Dónde empieza cada campo de un struct (y la GPU real confirma los offsets con un compute shader).

## 3. data-id de bestiario

- `m7-7-version-duplicada` — El shader que funcionaba en WebGL no compila en un ShaderMaterial («#version directive must occur before anything else»)
- `m7-7-onbeforerender-uniform` — Cambio un uniform para cada objeto en onBeforeRender y todos salen con el valor del primero
- `m7-7-onbeforecompile-cache` — Dos materiales con onBeforeCompile distinto se ven exactamente iguales
- `m7-7-textura-oscura` — En un ShaderMaterial, la textura sale más oscura (o, en un material de Three.js, más clara y lavada)
- `m7-7-aspecto-sin-actualizar` — Al redimensionar, la escena de Three.js sale estirada aunque cambié camera.aspect
- `m7-7-culling-desplazado` — La malla deformada, las partículas o las instancias desaparecen de golpe al mover la cámara
- `m7-7-mod-wgsl` — El patrón portado a WGSL se rompe en la mitad izquierda (o en la de abajo)
- `m7-7-struct-desalineado` — Los uniforms de WebGPU llegan cambiados de sitio (o «Binding size … is smaller than the minimum binding size»)
- `m7-7-y-invertida-webgpu` — El shader portado a WebGPU sale boca abajo (y el ratón, al revés)

## 4. Verificación

Última ejecución (tema oscuro, con soluciones, capturas de componentes y de página):

```
✓ ../modulos/07-integracion/07-siguientes-pasos.html  (95087 ms)
   glsl=0 js=6 graficador=1 demo=1 ejemplos=3 ejercicios=4 quiz=3 anotado=7 callouts=15 bestiario=9 senior=3 h2=9 pres=2 palabras=15433 soluciones=4
1/1 páginas sin problemas
```

También sin problemas con `--tema light` (componentes y página en tramos) y con `movil.mjs` (390 px: `scrollWidth=390 / 390`; solo sobresale el MathML oculto de KaTeX). Revisé todas las capturas de componentes en los dos temas y la página completa en tramos; corregí una tabla que se desbordaba (columna con `nowrap`), una caja del diagrama de WebGPU con el texto fuera y la comparación GLSL/WGSL (líneas demasiado largas para dos columnas). Como `verificar.mjs --soluciones` no detecta un «✗» impreso con `console.log`, comprobé aparte con `scratchpad/qa/m7-7-sol.mjs` que las cuatro soluciones imprimen solo ✓ (7.7.3: «píxeles distintos: 0.0 %»; 7.7.4: la GPU confirma los cinco offsets) y que los códigos de partida fallan donde deben.

Todas las cifras se midieron en el Chrome headless del curso (HeadlessChrome/154, Apple M1, ANGLE/Metal para WebGL; Dawn/Metal para WebGPU), con scripts propios en `scratchpad/qa/m7-7-exp.mjs` y `m7-7-sol.mjs` (páginas en `scratchpad/experimentos/m7-7/`). Three.js r186 se cargó **solo en los experimentos** (desde `scratchpad/three-ref/node_modules/three/build`, servido por intercepción de peticiones de puppeteer); la lección no lo carga. Comprobado empíricamente:

- Three.js r186: atributos reales del contexto (`alpha: true` siempre); el registro de llamadas de 3 frames (55/3/2); el texto completo del vertex (69 líneas) y del fragment (62) de un ShaderMaterial; el error exacto de `#version` duplicado y de `in` en RawShaderMaterial sin `glslVersion`; `glslVersion: THREE.GLSL3` en Raw y en ShaderMaterial; uniforms por referencia y `clone()` profundo; `{ value }` compartido (191 en los dos materiales); `onBeforeRender` sin/con `uniformsNeedUpdate` (64/64 → 64/255); `onBeforeCompile` sin/con `customProgramCacheKey` (1 programa rojo/rojo → 2 programas rojo/azul); `InstancedMesh` con esfera vieja (0 draw calls hasta `computeBoundingSphere`); desplazamiento en el vertex shader culled (0 → 1 con `frustumCulled = false`); `aspect` sin `updateProjectionMatrix` (2,1445 → 1,0723); memoria sin `dispose` (15 → 65 geometrías, 200 buffers y 50 VAOs vivos; `dispose` borra 200 + 50); espacio de color (55 / 128 / 188); `setSize(301, 101)` con ratio 1,5 → 451 × 151 (floor); recuperación automática de contexto y su rotura con `onUpload(array = null)` (`TypeError … 'byteLength'`); `coordinateSystem = WebGPUCoordinateSystem` (m[10], m[14]); el ejemplo de `onBeforeCompile` con `MeshStandardMaterial` compila y anima.
- WebGPU: `navigator.gpu` existe en http://localhost, en file:// y dentro de iframes `sandbox="allow-scripts"` con srcdoc (origen `null`, `isSecureContext` true); adaptador apple/metal-3, subgrupos 32, `bgra8unorm`; límites del adaptador frente a los del dispositivo por defecto (1024/256 invocaciones, 4 GiB/128 MiB); `%` frente a `mod` (−0,5 % 2 = −0,5; −7 % 3 = −1); origen de `@builtin(position)` (fila 0 → y = 0,5) y NDC y hacia arriba; `writeTexture`/`copyExternalImageToTexture` (fila 0 = v = 0 = arriba); offsets del struct `U` (0/16/28/32/48, 64 bytes) y el error de `minBindingSize`; z de NDC −0,5 y 1,5 recortadas; `override` (255 → 128); `getCurrentTexture` igual en la misma tarea; `createRenderPipeline` vuelve al instante y `createRenderPipelineAsync` resuelve en 15,6 ms; mensajes de Tint para 17 errores típicos al portar (tabla de la lección); `smoothstep` con bordes invertidos y `if` sin llaves; el compute shader de partículas de la lección (compila y avanza bien); estados intermedios del ejercicio 7.7.3 (sin voltear y con `modGLSL`: 100 % distinto; volteando y con `%`: 31 %).

## 5. Problemas conocidos y decisiones discutibles

- **Longitud**: ≈ 11 200 palabras de prosa (más tablas y código). Es la última lección y cubre dos temas grandes más el cierre del curso; si se quiere recortar, lo más prescindible es la sección «Three.js sobre WebGPU» y parte de la tabla «Qué se transfiere».
- **Tres.js con nombres de Three.js en inglés**: el juguete usa los nombres exactos de Three.js (`WebGLRenderer`, `Mesh`, `setAttribute`, `needsUpdate`…) para que la correspondencia sea literal, aunque la guía pide nombres propios en español. Las variables y comentarios internos sí están en español.
- **Ejercicio 7.7.3 depende de WebGPU**: sin WebGPU imprime un aviso y el alumno solo puede comparar con la solución. Su código de partida no compila a propósito (`data-error-esperado`): la consola del navegador muestra el aviso de Chrome «Error while parsing WGSL», esperado.
- **Soporte de WebGPU por navegador** (Chrome 113 en 2023, Android 2024, Safari 26 y Firefox 141 en 2025): no lo pude comprobar empíricamente (solo Chrome); está redactado con cautela y remite a caniuse.
- **Rarezas de Three.js observadas que no entran en la lección**: la clave de la caché de programas de un `RawShaderMaterial` no incluye `glslVersion` (con r186, un `RawShaderMaterial` GLSL3 con el mismo texto que uno GLSL1 que falló reutiliza el programa roto). Es un caso raro y probablemente un fallo de Three.js; lo dejo aquí por si alguien quiere mencionarlo.
- **Afirmaciones de Three.js leídas en el código y no medidas**: el sondeo de `compileAsync` cada 10 ms, `samples`/`count` de `WebGLRenderTarget`, `Timer.connect(document)`, `setDrawingBufferSize`, `WebGPURenderer` (fallback a WebGL2 y «Material "ShaderMaterial" is not compatible»). Todas se citan tal como están en r186.
- Los enlaces a 7.3–7.6 apuntan a anclas que existían al terminar (`03-transiciones-shader.html#rendimiento-dibujar-solo-mientras-algo-se-mueve`, `04-vertex-animacion.html#ondas-en-el-vertex-shader`, `05-particulas-gpu.html#enfoque-2-el-estado-en-texturas-float`, `#enfoque-3-transform-feedback`); si sus autores cambian los títulos, habrá que actualizarlos.

## 6. Sugerencias para componentes compartidos (sin modificarlos)

- **curso.js**: añadir un modo `wgsl` a la tabla `MODOS` (lo hago localmente en `l77-wgsl.js`, envolviendo `Curso.modoCM`; se puede copiar tal cual). Con WebGPU en el curso, también sería útil que el editor de los playgrounds resaltara el WGSL dentro de cadenas `/* wgsl */`, pero es opcional.
- **verificar.mjs**: con `--soluciones` solo marca como fallo una línea `log-error` o un `✗` en `.estado`; las pruebas de los ejercicios que imprimen «✗ …» con `console.log` pasan sin aviso. Propuesta: tratar como fallo cualquier línea de consola que empiece por `✗` tras pulsar «Ver solución» (yo lo comprobé con un script propio, `qa/m7-7-sol.mjs`).
- **m7.css** define `table.m7-equivalencias` pensando en esta lección (columnas 2 y 3 en monoespaciada); no la uso porque mi primera columna es la de código: uso `table.l77-equiv` en `l77-estilos.css`. Se puede borrar de m7.css o dejarla.
- 7.1, 7.2 y m7kit: no encontré fallos.

## 7. Términos para el glosario

- **Grafo de escena**: árbol de objetos (escena, grupos, mallas, cámaras, luces) con una matriz local cada uno; la del mundo es la del padre por la local.
- **ShaderMaterial**: material de Three.js con GLSL propio al que Three.js antepone un prefijo (versión, precisión, matrices y atributos declarados).
- **RawShaderMaterial**: material de Three.js que compila tu GLSL casi tal cual; tú declaras todo.
- **onBeforeCompile**: gancho de un material de Three.js que permite editar el texto de sus shaders antes de compilarlos.
- **Chunk (trozo de shader)**: fragmento de GLSL de Three.js que sustituye a una línea `#include <nombre>` antes de compilar.
- **Frustum culling**: descartar en la CPU los objetos cuya esfera envolvente queda fuera de la pirámide de visión, antes de hacer su draw call.
- **Esfera envolvente (bounding sphere)**: esfera que contiene todos los vértices de una geometría; la usa el frustum culling.
- **dispose()**: método de Three.js que borra los recursos de GPU de una geometría, material, textura o render target.
- **TSL (Three Shading Language)**: lenguaje de nodos en JavaScript con el que Three.js genera WGSL o GLSL para su WebGPURenderer.
- **WebGPU**: API gráfica y de cálculo moderna de la web, sin máquina de estados global, con pipelines, bind groups y compute shaders.
- **WGSL**: lenguaje de shaders de WebGPU.
- **Adaptador (GPUAdapter)**: la GPU concreta que elige el navegador para WebGPU; informa de características y límites.
- **Dispositivo (GPUDevice)**: conexión lógica con el adaptador; crea y posee todos los objetos de WebGPU.
- **Render pipeline**: objeto inmutable de WebGPU que agrupa shaders, formato de vértices, primitiva, profundidad, mezcla y formato de destino.
- **Bind group**: conjunto de recursos (buffers, texturas, samplers) que se enlaza de una vez a un `@group` del shader.
- **Command encoder**: objeto que graba órdenes de GPU en una lista que se envía con `queue.submit`.
- **Render pass**: tramo de órdenes que dibujan en unas texturas de destino, con su borrado inicial (`loadOp`).
- **Compute shader**: programa de GPU que no dibuja: lee y escribe buffers y texturas sobre una rejilla de invocaciones.
- **Workgroup**: grupo de invocaciones de un compute shader que se lanzan juntas y comparten memoria rápida.
- **Storage buffer**: buffer que un shader de WebGPU puede leer y escribir (`var<storage, read_write>`).
- **override (WGSL)**: constante que se fija al crear el pipeline; el sustituto de un `#define` inyectado.
- **Análisis de uniformidad**: comprobación de WGSL que rechaza derivadas y `textureSample` dentro de un flujo de control que varía entre invocaciones.
- **Alineación (de un campo)**: múltiplo de bytes en el que debe empezar un campo en un buffer (`vec3f`: 16).
- **Dawn / Tint**: la implementación de WebGPU de Chrome y su compilador de WGSL.
- **Subgrupo**: conjunto de invocaciones que la GPU ejecuta en paso de marcha (el warp); 32 en el M1.
- **Deferred shading**: técnica que guarda posición, normal y material por píxel en varias texturas (G-buffer) e ilumina después cada píxel una vez.
- **G-buffer**: el conjunto de texturas de la primera pasada del deferred shading.
