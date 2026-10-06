# Revisión de la lección 7.7 · Siguientes pasos: Three.js y WebGPU con lo que ya sabes (rev-m7-7, sesión 3)

Archivos revisados: `modulos/07-integracion/07-siguientes-pasos.html`, `recursos/l77-tresjs.js`, `recursos/l77-wgsl.js`,
`recursos/l77-estilos.css`. Revisión desde cero (el revisor anterior no dejó informe; sus cambios ya estaban en el commit base).

Máquina de esta revisión: contenedor Linux sin GPU, Chromium 141 headless, WebGL por SwiftShader. Las cifras del curso
medidas en el M1 (Chrome 154, ANGLE/Metal, Dawn/Metal) no se han tocado.

**Cómo se comprobó lo que la lección afirma de Three.js y WebGPU** (nada de esto se carga en la lección):

- **Three.js r186**: descargué el paquete oficial `three@0.186.1` (`npm pack`, el más reciente publicado; r186.0 es del
  2026-09-08) en `SCRATCH/agentes/rev-m7-7/three-pkg/` y (1) leí el código fuente de cada API citada y (2) lo cargué en
  Chromium 141 en una página de experimento (`exp/three.html` + `exp/run-three.mjs`, módulos servidos por intercepción
  de peticiones de puppeteer). **Reproducido exactamente**: atributos del contexto (`alpha: true`, `depth: true`,
  `stencil: false`, `antialias: false`, `premultipliedAlpha: true`); el registro de llamadas del ejemplo 7.7.1
  (**55 / 3 / 2** llamadas, la misma secuencia del anotado, incluido `uniform2f(200, 100)` y `drawElements(4, 6, 5123, 0)`);
  los errores de `#version` duplicado (`0:69 'version'`, `0:70 'position' : redefinition`, `0:57` en el fragment) y de
  `in` en un `RawShaderMaterial` sin `glslVersion`; la tabla de color (**128 / 188 / 55 / 128 / 128**); `onBeforeRender`
  (64/64 → 64/255 con `uniformsNeedUpdate`); `onBeforeCompile` con fábrica (2 llamadas, 1 programa, los dos rojos);
  `aspect` sin `updateProjectionMatrix` (2,1445 → 1,0723); `WebGPUCoordinateSystem` (m[10] = m[14] = −1,0101); culling de
  un plano desplazado en el vertex shader (0 → 1 draw calls con `frustumCulled = false`); `uniforms === U`;
  `outputColorSpace = 'srgb'`; `colorSpace` por defecto `''`; `Timer` y `Clock` existen (`Clock` marcado
  `@deprecated since r183` en el código). Leídos en el código y correctos: `setPixelRatio`/`setSize`/`setDrawingBufferSize`
  (floor, el ratio queda en 1), `Timer` (`connect`, `update`, `reset`, `getElapsed` sin tope), `bindAttribLocation(…, 0,
  'position')`, comprobación de errores en el primer uso, `if (cache[0] === v) return;`, `arraysEqual`/`copyArray`,
  clave de caché con `onBeforeCompile.toString()` (y sin `glslVersion` en los raw), VAO por geometría+programa (y por
  `InstancedMesh`), `texStorage2D` salvo vídeos, `SRGB8_ALPHA8`, `compileAsync` (setTimeout de 10 ms +
  `COMPLETION_STATUS_KHR`), 110 chunks, ~16 500 líneas del renderer WebGL y ~5 300 de chunks, `makePerspective` con
  `reversedDepth`, `WebGPURenderer` (`'three/webgpu'`, aviso «WebGPU is not available, running under WebGL2 backend»,
  `Material "ShaderMaterial" is not compatible`, `await renderer.init()`), `wgslFn`/`glslFn`, orden de dibujo de los
  opacos por `material.id`.
- **WebGPU/WGSL**: el Chromium de esta máquina sí da un adaptador WebGPU (SwiftShader, `isFallbackAdapter`) si la página
  es un contexto seguro (`http://localhost`, servido por intercepción) y se lanza con `--enable-unsafe-webgpu` (scripts
  `exp/gpu.html`, `exp/run-gpu.mjs`, `exp/leccion-gpu.mjs`). Reproducidos **todos** los mensajes de Tint de la tabla
  «WGSL para quien sabe GLSL» (literalmente), el de uniformidad, el de `let i = 2; let f: f32 = i;`, los literales
  abstractos, `%` (−0,5 % 2 = −0,5; −3,25 % 1 = −0,25; −7 % 3 = −1), los límites por defecto del dispositivo (256
  invocaciones, 128 MiB, 4 bind groups). En la lección servida así: el ejemplo 7.7.3 arranca WebGPU, el ejercicio
  7.7.3 (partida: falla en `17:26 invalid character found`; solución: «píxeles distintos: 0.0 % · ✓») y el 7.7.4
  (partida: ✗ y la GPU lo desmiente; solución: ✓ y la GPU confirma 0/16/28/32/48). Especificación de WGSL leída en
  su fuente (`gpuweb/wgsl/index.bs`, GitHub): `smoothstep`, `%`, extensiones de lenguaje (`swizzle_assignment`
  existe).

## (a) Cambios hechos y por qué

En `07-siguientes-pasos.html`:

1. **«semiimplícito» → «semi-implícito»** (anotado del compute shader, l.~907): la grafía del curso (2.5 y el resto).
   Era el único caso en la lección.
2. **Número de líneas del shader compilado (ejemplo 7.7.1 y «Lo que llega de verdad al compilador»)**: decía 69 (vertex)
   y 62 (fragment) y «tu código empieza en la línea 57» con `uniform float u_time` en esa línea. Con el código que
   muestra la lección (plantillas de texto que empiezan con un salto de línea) son **70 y 63**, y `uniform float u_time`
   cae en la **58** (la 57 es el salto de línea inicial). Medido con r186.1 en Chromium; cuadra además con el bestiario
   (prefijo de 68 líneas en el vertex y 56 en el fragment: un `#version` del usuario llega a la 69 y a la 57, como dice).
   Las cifras del autor corresponden a cadenas sin el salto inicial. Corregidos los dos números, la frase «tiene 6 líneas
   (7 contando el salto de línea…)», el comentario del listado y el anotado de las líneas 26–31.
3. **Struct `U` del bestiario `m7-7-struct-desalineado`**: «el struct mide 64 bytes, no los 52 de sumar los tamaños»
   era una cuenta mal hecha (4 + 12 + 4 + 8 + 12 = 40; el último campo acaba en 60; 52 es el fin de `Normales` del
   ejercicio). Ahora: «ni los 40 de sumar los tamaños de los campos ni los 60 en los que acaba el último».
4. **`smoothstep` con los bordes al revés**: el curso enseña que es indefinido en GLSL ES 3.00 (A.2 «Lo indefinido»,
   6.10, glosario: «para invertirlo, `1.0 - smoothstep(…)`»), y la lección de cierre lo usaba en el GLSL del ejemplo
   7.7.3 (dos veces) y del ejercicio 7.7.3, y la solución decía que «compiló y dio el mismo resultado» como si fuera
   normal. Cambiado a `1.0 - smoothstep(a, b, x)` (idéntico matemáticamente: el polinomio de Hermite es simétrico) en el
   GLSL y en el WGSL del ejemplo 7.7.3 y del ejercicio 7.7.3 (partida y solución). Comprobado en Chromium con WebGPU: la
   solución sigue dando 0,0 % de píxeles distintos. A cambio, en la caja senior «Lo que en GLSL era indefinido, en WGSL
   no compila» añadí el contrapunto, verificado en la especificación y en Tint: WGSL **define** `smoothstep` con los
   bordes al revés (desciende de 1 a 0) y solo es error con bordes iguales y constantes (`smoothstep called with 'low'
   (0.5) equal to 'high' (0.5)`), con enlace a A.2 `#lo-indefinido-lista-de-comprobacion`.
5. **«Es la caché de estado que 5.10 te recomendaba montar»**: 5.10 no recomienda montar una caché de estado; recomienda
   ordenar los dibujos por programa y textura. Reescrito: la caché de Three.js completa lo de 5.10 (Three.js ordena los
   opacos por material, `painterSortStable`, y la caché evita las llamadas que no cambiarían nada).
6. **«`modelViewMatrix` … calculada en JavaScript con 64 bits, como recomendaba 5.6»**: 5.6 recomienda calcularla una vez
   por objeto en JavaScript, no habla de 64 bits, y en Tres.js (GLKit) las matrices son `Float32Array`. Ahora: «una vez
   por objeto, como recomendaba 5.6», y el detalle real de Three.js: `Matrix4.elements` es un `Array` normal (doble
   precisión) y solo se redondea a 32 bits al enviar (`mat4array.set(elements)` en `WebGLUniforms.js`).
7. **Enlaces que apuntaban a la sección equivocada** (comprobados uno a uno con un script que imprime el destino de cada
   ancla, `scripts/anclas.mjs`):
   - bestiario del aspecto: «el mismo cubo estirado de 3.6» apuntaba a `#m3-viewport-desfasado` (viewport no
     actualizado); ahora a `#m3-aspecto` («Todo sale estirado (o se estira al redimensionar)»).
   - caja senior de uniformidad: «En 6.3 mediste qué pasa con una derivada dentro de un `if`…» apuntaba a la h2
     «Del número al píxel»; la medida está en la h3 `#como-calcula-la-gpu-una-derivada`.
   - 1.7 (módulos y `file://`): ahora `#por-que-file-rompe-cosas`.
   - A.3: «los bloques de uniforms con layout std140 (los viste en la chuleta A.3)» → «(están en la chuleta A.3)», con
     ancla `#uniforms-y-bloques-de-uniforms` (ninguna lección los enseña; solo la chuleta).
8. **«matriz de proyección llena de `NaN`»** (anotado del esqueleto de tamaño): con `aspect = 0/0` solo son `NaN` los
   elementos de la x (m[0] y m[8], `makePerspective` divide por `right − left`); ahora «`NaN` en la fila de la matriz de
   proyección que calcula la x».
9. **Pista 1 del ejercicio 7.7.3**: ahora da los cuatro errores en el orden en que salen de verdad (medido: Tint informa
   primero los de sintaxis, `invalid character found` y `expected '{' for if statement`, y después los de nombres,
   `unresolved call target 'mod'` y `no matching call to 'atan(f32, f32)'`), y explica por qué.
10. **Asignación a un swizzle**: añadido el mensaje que da un Chrome sin `swizzle_assignment` (medido en Chromium 141:
    `cannot assign to value of type 'vec2<f32>'`; la extensión no aparece en su `wgslLanguageFeatures`).
11. **Coordenadas de textura en WebGPU** (tabla «¿Dónde está…?» y bestiario `m7-7-y-invertida-webgpu`): la celda «en
    v = 0, y se ve arriba: no hay que voltear nada» solo es cierta si las UV siguen la convención de WebGPU (v hacia
    abajo). Ahora lo dice, y el bestiario, que recomienda pasar UV desde NDC (v hacia arriba), avisa de que con esas UV
    una textura subida en WebGPU sale volteada.
12. **Ejercicio 7.7.4** (partida y solución): si `navigator.gpu` existe pero no hay adaptador, la prueba final terminaba
    en silencio; ahora imprime «(WebGPU sin adaptador: no podemos preguntarle a la GPU)», como ya hacía sin `navigator.gpu`.
13. **Pista 1 del ejercicio 7.7.1**: «lo verá por clausura» → «gracias a su closure», el término que usa 1.3, con ancla
    `#closures-funciones-con-memoria`.

En `recursos/l77-tresjs.js`: la cabecera decía «unas 300 líneas»; son ~515 (la lección dice «unas 500 líneas (con
comentarios)»). Unificado.

No toqué `l77-wgsl.js` ni `l77-estilos.css` (correctos; solo usan variables del tema).

## (b) Problemas pendientes (con sección y propuesta)

1. **Longitud** (toda la lección): ≈15 700 palabras con código (el autor estima 11 200 de prosa), muy por encima del
   orientativo de 8 000. Es la lección de cierre y todo está verificado; si el dueño quiere recortar, lo más prescindible
   es «Three.js sobre WebGPU» y parte de «Qué se transfiere y qué no». No lo he recortado.
2. **Cifras dependientes del M1 que no puedo reproducir aquí** (no las he cambiado; son plausibles y están marcadas como
   «en el Chrome de pruebas»/«en el M1»): `createRenderPipelineAsync` resolvió en 15,6 ms; adaptador `apple`/`metal-3`,
   subgrupos de 32; límites del adaptador 1024 invocaciones y 4 GiB; `getCurrentTexture` igual en la misma tarea;
   `swizzle_assignment` disponible en Chrome 154; recuperación de contexto y `TypeError … 'byteLength'` con `onUpload`;
   memoria 15 → 65 geometrías y 200 `deleteBuffer`. Nada de esto contradice el código de r186 ni la especificación.
3. **Ejercicio 7.7.3 y `data-error-esperado`**: en una máquina sin adaptador WebGPU (como esta con `verificar.mjs`) el
   código de partida no llega a compilar WGSL, no falla, y el verificador informa «marcado data-error-esperado pero NO
   falló». Es un efecto del entorno (en el M1 falla como debe; aquí, con WebGPU activado, también: `17:26 invalid
   character found`). No lo «arreglo» forzando un error sin WebGPU, porque mostraría un error falso al alumno. Ver la
   propuesta para `verificar.mjs` en (d).
4. **Tres.js usa los nombres en inglés de Three.js** (decisión del autor para que la correspondencia sea literal). La
   mantengo: es el objetivo del ejemplo.
5. **«Chrome 154»** (párrafo de introducción): es la versión del Chrome de pruebas del autor en el M1 según su informe;
   no la puedo comprobar aquí. Si el lead tiene la cifra exacta de la sesión 2, que la confirme.

## (c) Afirmaciones sobre Three.js/WebGPU que no pude confirmar

- **Soporte por navegador** («Chrome y Edge … 2023 (versión 113) … Android en 2024; Safari 26 en 2025; Firefox 141 en
  Windows en 2025 y poco a poco en el resto»): coincide con lo que sé, pero no tengo acceso a caniuse/MDN desde aquí
  (el proxy bloquea esos dominios). El texto ya remite a caniuse y está redactado con cautela.
- **Lo medido solo en el M1 o en Chrome 154** (lista del punto (b)2): coherente con el código y la especificación, sin
  reproducción propia.
- **URLs externas** (`https://gpuweb.github.io/gpuweb/explainer/`, `https://webgpu.github.io/webgpu-samples/`,
  `https://github.com/mrdoob/three.js/tree/dev/src/renderers/webgl`, `https://caniuse.com/webgpu`): canónicas según mi
  conocimiento; el proxy no me deja abrirlas. `WebGLProgram.js`, `WebGLUniforms.js` y `WebGLBindingStates.js` existen en
  r186. La traducción al español de WebGPU Fundamentals **sí** la confirmé (archivos `webgpu/lessons/es/*.md` en su repo).
- **Tint/Dawn como nombres de la implementación de Chrome**: correcto según mi conocimiento (los mensajes que da Chromium
  son los de Tint); no hay una fuente que pueda abrir aquí.

## (d) Problemas en archivos ajenos

1. **`herramientas/verificar.mjs`**
   - (l.62, `args`) Chromium en Linux no da adaptador WebGPU sin `--enable-unsafe-webgpu`, y además `navigator.gpu`
     solo existe en contexto seguro. Con `file://` y esos argumentos sale «Failed to create WebGPU Context Provider» ×19
     y todos los ejemplos WebGPU quedan sin probar. Propuesta: añadir `--enable-unsafe-webgpu
     --enable-features=Vulkan --use-webgpu-adapter=swiftshader --use-vulkan=swiftshader` cuando no hay GPU (yo lo
     comprobé sirviendo la lección en `http://localhost` por intercepción; con `file://` habría que probarlo), y filtrar
     el aviso «Failed to create WebGPU Context Provider» como ya se filtran los de SwiftShader (l.222).
   - (l.~165) Sigue vigente la propuesta del autor: con `--soluciones`, tratar como fallo una línea de consola que empiece
     por `✗` (las pruebas de los ejercicios 7.7.x imprimen ✗ con `console.log`).
   - `data-error-esperado` debería poder condicionarse a una capacidad (p. ej. `data-error-esperado="webgpu"`: solo se
     exige el error si hay adaptador), para que el ejercicio 7.7.3 no salga como problema en máquinas sin WebGPU.
2. **`modulos/07-integracion/recursos/m7.css` l.31**: `table.m7-equivalencias` no la usa ninguna lección (la 7.7 usa
   `l77-equiv`). Propuesta: borrarla.
3. **`modulos/08-anexos/04-glosario.html`**: la entrada `g-webgpu` tiene `<!-- M7-PENDIENTE: enlazar 7.7 -->`; enlazar
   a `07-siguientes-pasos.html#webgpu-la-misma-gpu-sin-maquina-de-estados`. Las entradas `g-alineacion`, `g-pipeline`,
   `g-command-buffer`, `g-warp` y `g-reversed-z` deberían ampliarse/enlazar a 7.7 (ver (f)).
4. **`modulos/08-anexos/01-bestiario.html`** (diagnóstico rápido): añadir los 9 casos de 7.7 según (e). Falta un grupo
   natural para los mensajes de WebGPU: propongo renombrar «Mensajes de WebGL en la consola» a «Mensajes de WebGL o
   WebGPU en la consola» y meter ahí `m7-7-struct-desalineado`.

## (e) Cajas bestiario de 7.7

| data-id | data-titulo | Síntoma (lista del encargo) | Grupo de «Diagnóstico rápido» de A.1 donde encaja |
|---|---|---|---|
| `m7-7-version-duplicada` | El shader que funcionaba en WebGL no compila en un ShaderMaterial («#version directive must occur before anything else») | pantalla negra | «El shader no compila o el programa no enlaza» (y «Pantalla negra: el objeto no aparece») |
| `m7-7-onbeforerender-uniform` | Cambio un uniform para cada objeto en onBeforeRender y todos salen con el valor del primero | otro (un uniform que no llega) | «JavaScript: errores y valores inesperados» (o un grupo nuevo de Three.js) |
| `m7-7-onbeforecompile-cache` | Dos materiales con onBeforeCompile distinto se ven exactamente iguales | otro (caché de programas) | «Colores lavados, oscuros o de otro tono» (los dos salen del color del primero) |
| `m7-7-textura-oscura` | En un ShaderMaterial, la textura sale más oscura (o, en un material de Three.js, más clara y lavada) | colores lavados/oscuros | «Colores lavados, oscuros o de otro tono» |
| `m7-7-aspecto-sin-actualizar` | Al redimensionar, la escena de Three.js sale estirada aunque cambié camera.aspect | otro (estirado) | «Estirado, en una esquina o recortado» |
| `m7-7-culling-desplazado` | La malla deformada, las partículas o las instancias desaparecen de golpe al mover la cámara | otro (desaparece) | «Algo desaparece sin ningún error» |
| `m7-7-mod-wgsl` | El patrón portado a WGSL se rompe en la mitad izquierda (o en la de abajo) | otro (patrón roto en media pantalla) | «Costuras, cortes y rejillas en patrones y ruido» |
| `m7-7-struct-desalineado` | Los uniforms de WebGPU llegan cambiados de sitio (o el bind group da «Binding size … is smaller than the minimum binding size») | otro (datos cruzados / error de validación) | «Mensajes de WebGL en la consola» (renombrado a WebGL o WebGPU, ver (d)4) |
| `m7-7-y-invertida-webgpu` | El shader portado a WebGPU sale boca abajo (y el ratón, al revés) | imagen volteada (y eventos/puntero) | «Boca abajo, reflejado o moviéndose al revés» |

## (f) Términos para el glosario A.4

Revisada la lista de la sección 7 del informe del autor: las definiciones son correctas; las ajusto donde hacía falta
precisión y añado anclas y los términos que faltaban. Todas las anclas son de `07-integracion/07-siguientes-pasos.html`.

| Término | Definición (una línea) | Ancla |
|---|---|---|
| Grafo de escena (scene graph) | Árbol de objetos (escena, grupos, mallas, cámaras, luces) con una matriz local cada uno; la del mundo es la del padre por la local. No existe en WebGL: es organización en JavaScript. | `#three-js-el-mismo-pipeline-con-otros-nombres` |
| Three.js | Librería de JavaScript con un grafo de escena y un renderer que hace por ti las llamadas de WebGL2 (o de WebGPU con `WebGPURenderer`). | `#three-js-el-mismo-pipeline-con-otros-nombres` |
| ShaderMaterial | Material de Three.js con GLSL propio al que Three.js antepone un prefijo (versión, precisión, macros de GLSL 1.00, matrices y atributos declarados). | `#shadermaterial-o-rawshadermaterial` |
| RawShaderMaterial | Material de Three.js que compila tu GLSL casi tal cual (solo unos `#define`; la versión, con `glslVersion: THREE.GLSL3`); tú declaras todo. | `#shadermaterial-o-rawshadermaterial` |
| onBeforeCompile | Gancho de un material de Three.js que recibe el texto de sus shaders (con los `#include` sin resolver) y sus uniforms antes de compilar, para modificarlos. | `#onbeforecompile-tu-codigo-dentro-de-los-materiales-de-three-js` |
| customProgramCacheKey | Método de un material de Three.js que devuelve la parte de la clave de la caché de programas que lo distingue; por defecto, el texto de `onBeforeCompile`. | `#onbeforecompile-tu-codigo-dentro-de-los-materiales-de-three-js` |
| Chunk (trozo de shader) | Fragmento de GLSL de Three.js (110 en r186) que sustituye a una línea `#include <nombre>` antes de compilar. | `#onbeforecompile-tu-codigo-dentro-de-los-materiales-de-three-js` |
| colorSpace / outputColorSpace | Propiedades de Three.js que dicen en qué espacio están los texels de una textura (`SRGBColorSpace` → se sube como `SRGB8_ALPHA8`) y a cuál se convierte la salida (sRGB por defecto). | `#el-espacio-de-color-por-que-tu-textura-sale-mas-oscura` |
| Frustum culling | Descartar en la CPU, antes de su draw call, los objetos cuya esfera envolvente queda fuera de la pirámide de visión. | `#el-frustum-culling-y-los-vertices-que-se-mueven-en-el-shader` |
| Esfera envolvente (bounding sphere) | Esfera que contiene todos los vértices de una geometría (calculada una vez a partir del array de JavaScript); la usa el frustum culling. | `#el-frustum-culling-y-los-vertices-que-se-mueven-en-el-shader` |
| dispose() | Método de Three.js que borra los recursos de GPU de una geometría, material, textura o render target; quitar de la escena no lo hace. | `#la-memoria-quitar-de-la-escena-no-es-borrar` |
| WebGPURenderer | Renderer de Three.js (`'three/webgpu'`) que habla WebGPU y cambia solo a WebGL2 si no hay WebGPU; no acepta `ShaderMaterial` (usa TSL). | `#three-js-sobre-webgpu` |
| TSL (Three Shading Language) | Lenguaje de nodos escrito en JavaScript con el que Three.js genera WGSL o GLSL para su `WebGPURenderer`. | `#three-js-sobre-webgpu` |
| WebGPU *(ya existe: enlazar 7.7)* | — | `#webgpu-la-misma-gpu-sin-maquina-de-estados` |
| WGSL | Lenguaje de shaders de WebGPU: tipos estrictos, funciones con `@vertex`/`@fragment`/`@compute`, sin preprocesador. | `#wgsl-para-quien-sabe-glsl` |
| Dawn / Tint | La implementación de WebGPU de Chrome y su compilador de WGSL (los mensajes de error que ves son de Tint). | `#lo-que-ya-sabes-y-quien-hace-las-llamadas` |
| Adaptador (GPUAdapter) | La GPU concreta que elige el navegador para WebGPU (`requestAdapter()`); informa de sus características y límites. | `#el-triangulo-de-webgpu-llamada-por-llamada` |
| Dispositivo (GPUDevice) | Conexión lógica con el adaptador (`requestDevice()`); crea y posee todos los objetos de WebGPU; por defecto, con los límites mínimos garantizados. | `#el-triangulo-de-webgpu-llamada-por-llamada` |
| Render pipeline (WebGPU) | Objeto inmutable que agrupa shaders, formato de vértices, primitiva y culling, profundidad, mezcla y formato de destino; sustituye a la máquina de estados. *(Ampliar `g-pipeline` o entrada nueva.)* | `#pipelines-y-bind-groups-el-estado-congelado` |
| Bind group | Conjunto de recursos (buffers, texturas, samplers) que se enlaza de una vez a un `@group(n)` del shader con `setBindGroup`. | `#pipelines-y-bind-groups-el-estado-congelado` |
| Command encoder | Objeto de WebGPU que graba órdenes (pasadas de render o de cálculo) en un command buffer que se envía con `queue.submit`. *(Remisión desde `g-command-buffer`.)* | `#el-triangulo-de-webgpu-llamada-por-llamada` |
| Render pass | Tramo de órdenes que dibujan en unas texturas de destino, con su `loadOp` (p. ej. borrar) y su `storeOp`. | `#el-triangulo-de-webgpu-llamada-por-llamada` |
| Compute shader | Programa de GPU que no dibuja: lee y escribe buffers y texturas sobre una rejilla de invocaciones (en la web, solo en WebGPU). | `#compute-shaders-la-gpu-sin-triangulos` |
| Workgroup | Grupo de invocaciones de un compute shader que se lanzan juntas (`@workgroup_size`) y comparten memoria rápida (`var<workgroup>`) y barreras. | `#compute-shaders-la-gpu-sin-triangulos` |
| Storage buffer | Buffer que un shader de WebGPU puede leer y escribir (`var<storage, read_write>`). | `#compute-shaders-la-gpu-sin-triangulos` |
| override (WGSL) | Constante de WGSL que se fija al crear el pipeline (`constants: {…}`); el sustituto de un `#define` inyectado. | `#wgsl-para-quien-sabe-glsl` (caja hack «override») |
| Análisis de uniformidad | Comprobación de WGSL que rechaza derivadas y `textureSample` dentro de un flujo de control que puede variar entre invocaciones. | `#wgsl-para-quien-sabe-glsl` (caja senior) |
| Literal abstracto | Literal de WGSL sin tipo propio (`2`, `1.0`) que toma el tipo que necesita la expresión; entre tipos concretos no hay conversiones implícitas. | `#wgsl-para-quien-sabe-glsl` |
| Alineación (de un campo) *(ampliar `g-alineacion`)* | En un buffer de WebGPU (o un UBO std140), múltiplo de bytes en el que debe empezar un campo: `f32` 4, `vec2f` 8, `vec3f`/`vec4f` 16; el struct se redondea a la mayor. | `#pipelines-y-bind-groups-el-estado-congelado` |
| Subgrupo *(remisión a `g-warp`)* | Nombre de WebGPU para el warp: invocaciones que la GPU ejecuta en paso de marcha (32 en el M1). | `#webgpu-la-misma-gpu-sin-maquina-de-estados` |
| WebGPUCoordinateSystem | Valor de `camera.coordinateSystem` de Three.js con el que `updateProjectionMatrix` genera la z de NDC en [0, 1]. *(Enlazar también desde `g-reversed-z`, ej. 7.7.2.)* | `#la-profundidad-de-0-a-1-y-la-y-que-baja` |
| Deferred shading | Técnica que guarda posición, normal y material por píxel en varias texturas (G-buffer) e ilumina después cada píxel una vez. | `#que-aprender-despues` |
| G-buffer | El conjunto de texturas de la primera pasada del deferred shading. | `#que-aprender-despues` |

## (g) Verificación final

- `node enlaces.mjs ../modulos/07-integracion/07-siguientes-pasos.html` → **136 enlaces internos, 0 rotos** (tras la
  última edición).
- `node verificar.mjs … --soluciones --capturas` (tema oscuro, tras todas las ediciones salvo la de la pista 1 del
  ejercicio 7.7.1, que solo cambia texto y un ancla): `glsl=0 js=6 graficador=1 demo=1 ejemplos=3 ejercicios=4 quiz=3
  anotado=7 callouts=15 bestiario=9 senior=3 h2=9 palabras=16004 soluciones=4`. **Único problema: «js-5 (Ejercicio
  7.7.3) marcado data-error-esperado pero NO falló»**, más 17 avisos «Failed to create WebGPU Context Provider»: los dos
  se deben a que el Chromium del verificador no tiene adaptador WebGPU (ver (b)3 y (d)1). Las cuatro soluciones pasan;
  capturas revisadas (Tres.js dibuja las tres tarjetas; el GLSL del ejemplo 7.7.3 con `1.0 - smoothstep` se ve igual
  que antes; ejercicios 7.7.1, 7.7.2 y 7.7.4 imprimen solo ✓ con la solución y ✗ con el código de partida).
- Con WebGPU activado (`exp/leccion-gpu*.mjs`, lección servida en `http://localhost`): ejemplo 7.7.3 «WebGPU listo» y
  los dos lienzos idénticos (captura `herramientas/estado/lab/rev-m7-7/ejemplo-7-7-3-webgl-vs-webgpu.png`); ejercicio
  7.7.3: partida → `WGSL 17:26 invalid character found`, solución → «píxeles distintos: 0.0 % · ✓»; ejercicio 7.7.4:
  partida ✗ (y la GPU lo desmiente), solución ✓ (la GPU confirma 0/16/28/32/48).
- La primera pasada (antes de editar) también se hizo con `--pagina` (45 tramos de página, revisados todos) en tema
  oscuro. **No llegaron a terminar** la pasada con `--tema light` ni `movil.mjs` (la sesión de Chrome se cerró por la
  parada ordenada).

## Dónde me quedé (sesión 3)

**(a) Hecho y verificado.** Los 13 cambios de (a) en `modulos/07-integracion/07-siguientes-pasos.html` y la cabecera de
`recursos/l77-tresjs.js`. Verificado: enlaces (0 rotos), `verificar.mjs --soluciones` en tema oscuro (solo el problema
de entorno de WebGPU), y las partes WebGPU con mi script (`leccion-gpu*.mjs`). Las afirmaciones de Three.js r186 y de
WGSL/Tint, comprobadas como se explica al principio.

**(b) Hecho pero SIN verificar tras la última edición.**
- `07-siguientes-pasos.html`, pista 1 del ejercicio 7.7.1 (texto «gracias a su closure» + ancla
  `#closures-funciones-con-memoria`): solo comprobado con `enlaces.mjs` (0 rotos); es texto dentro de un `<details>`.
- Falta la pasada en **tema claro** (`node verificar.mjs ../modulos/07-integracion/07-siguientes-pasos.html --tema light
  --capturas <dir>`) y **móvil** (`node movil.mjs ../modulos/07-integracion/07-siguientes-pasos.html`). Mis cambios no
  tocan CSS ni marcado de diseño (solo texto, enlaces y código dentro de playgrounds), y el autor ya las pasó en la
  sesión 2, así que no espero problemas; pero no están hechas.

**(c) Pendiente, en orden.**
1. Pasada `--tema light` y `movil.mjs` de 7.7 (ver (b)). Esperado: los mismos problemas de entorno WebGPU que en oscuro.
2. `herramientas/verificar.mjs` l.62 y l.222 (archivo del lead): argumentos de WebGPU y filtro del aviso «Failed to
   create WebGPU Context Provider»; `data-error-esperado` condicionado a WebGPU; tratar `✗` de `console.log` como fallo
   (detalle en (d)1).
3. `modulos/08-anexos/04-glosario.html` (agente del glosario): términos de la tabla (f), enlazar `g-webgpu` a 7.7 y
   ampliar `g-alineacion`, `g-pipeline`, `g-command-buffer`, `g-warp`, `g-reversed-z`.
4. `modulos/08-anexos/01-bestiario.html` (lead, tras `indexar.mjs`): añadir los 9 casos de 7.7 al diagnóstico rápido
   según la tabla (e); renombrar «Mensajes de WebGL en la consola» a «… de WebGL o WebGPU …».
5. `modulos/07-integracion/recursos/m7.css` l.31 (revisor de m7kit): borrar `table.m7-equivalencias` (sin uso).
6. Opcional (decisión del dueño): recortar la longitud de 7.7 (≈16 000 palabras con código), empezando por «Three.js
   sobre WebGPU» y la tabla «Qué se transfiere y qué no».
7. Opcional: confirmar en el M1 las cifras de (b)2 (sobre todo «Chrome 154» y `createRenderPipelineAsync` 15,6 ms).

**(d) Experimentos y scripts** (copiados a `herramientas/estado/lab/rev-m7-7/`; el SCRATCH se borrará):
- `three.html` + `run-three.mjs`: carga Three.js r186 en Chromium e imprime llamadas, prefijos, errores, colores,
  `onBeforeRender`, `onBeforeCompile`, aspecto, culling. **Necesita el paquete** (no copiado): `mkdir three-pkg && cd
  three-pkg && npm pack three@0.186.1 && mkdir x && tar -xzf three-0.186.1.tgz -C x`, y ajustar la constante `BUILD`
  de `run-three.mjs` (apunta a `../three-pkg/x/package/build` relativo al script). Resultado: `resultado-three.txt`.
- `gpu.html`, `gpu2.html` + `run-gpu.mjs`: WebGPU por SwiftShader en `http://localhost:9` (intercepción de puppeteer;
  `navigator.gpu` exige contexto seguro), mensajes de Tint de la tabla y orden de errores del ejercicio 7.7.3.
  Resultados: `resultado-gpu.txt`, `resultado-gpu2.txt`. Uso: `node run-gpu.mjs gpu.html` (sirve los archivos de la
  carpeta del script).
- `leccion-gpu.mjs` / `leccion-gpu2.mjs`: abre la lección entera con WebGPU y lee la consola de los playgrounds
  7.7.2–7.7.4 (partida y solución); el 2 guarda capturas de ventana. Uso: `node leccion-gpu.mjs <dirCapturas>`.
  Resultado: `resultado-leccion-gpu.txt` y `ejemplo-7-7-3-webgl-vs-webgpu.png`. Nada a medio hacer.
- `anclas.mjs`: imprime, para cada enlace con ancla de una lección, el contexto y el texto de la sección de destino
  (para comprobar que «lo viste en X» apunta a donde debe). Uso: `node anclas.mjs <lección.html>`.
