export const meta = {
  name: 'curso-m7',
  description: 'Módulo 7: 5 autores Opus xhigh en paralelo (7.3–7.7 + proyecto final) y revisor Opus xhigh por lección',
  phases: [
    { title: 'Autores', detail: 'Opus 5.5 xhigh, una lección por autor', model: 'opus' },
    { title: 'Revisión', detail: 'Opus 5.5 xhigh, un revisor por lección', model: 'opus' },
  ],
}

const RAIZ = '/Users/alex/Projects/shaders'
const SCRATCH = '/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad'
const GUIA = RAIZ + '/herramientas/GUIA_AUTORES.md'
const Q = RAIZ + '/herramientas'
const M7 = RAIZ + '/modulos/07-integracion'
const INF = RAIZ + '/herramientas/estado/informes'

const CHROME = `REGLA DE TEMPERATURA (pedido explícito del dueño, no negociable): solo puede haber UN Chrome headless a la vez en toda la máquina (MacBook Air sin ventilador) y ahora mismo trabajan 10 agentes en paralelo. Lanza Chrome SOLO con el puppeteer-core parcheado de ${Q}/node_modules (verificar.mjs, movil.mjs, o scripts tuyos guardados en ${Q}/ o en ${SCRATCH}/qa/ que hagan import puppeteer from "puppeteer-core"): hace cola automáticamente («esperando turno» es normal: espera, no lo esquives). Nunca ejecutes el binario de Chrome directamente, nunca instales otro puppeteer/playwright, nunca uses las herramientas de navegador (mcp__claude-in-chrome__*: son el Chrome personal del dueño). Cierra siempre el navegador en tus scripts. Agrupa comprobaciones para lanzar Chrome pocas veces. Un vigilante mata cualquier segundo Chrome que salte la cola.`

const COMUN = (idc) => `
Guía de autores (léela ENTERA primero, es tu contrato; §7 = verificación): ${GUIA}
Verificador: node ${Q}/verificar.mjs <archivo.html> --soluciones --capturas ${SCRATCH}/capturas/${idc}   (opciones: --pagina dir, --tema light, --aislar)
Lección de referencia (usa todos los componentes): ${RAIZ}/modulos/00-inicio/01-bienvenida.html
Experimentos: ${SCRATCH}/experimentos/${idc}/ (páginas) · scripts de puppeteer propios en ${SCRATCH}/qa/${idc}-*.mjs
${CHROME}
No puedes preguntar al dueño: decide con criterio siguiendo la guía y anota en el informe las decisiones discutibles.
Nunca edites assets/**, index.html, assets/js/manifest.js ni archivos de otros módulos o de otras lecciones (si encuentras un bug en un componente compartido, descríbelo en el informe con propuesta de arreglo).
Comprueba empíricamente cada afirmación técnica no trivial (Chrome headless con GPU real, Apple M1, ANGLE/Metal) y di en qué hardware se midió cada cifra. Calidad antes que velocidad.
El alumno quiere entenderlo TODO a nivel «hacker»: cada llamada, cada argumento, cada comportamiento raro, cada detalle que separa a un junior de un senior. Nada de líneas sin explicar.`

const CONTEXTO_M7 = `Módulo 7 · JavaScript + shaders juntos. Arquitectura real: combinar lo aprendido de animación (módulo 2) con WebGL/GLSL (módulos 5 y 6). El alumno debe terminar sabiendo montar una experiencia interactiva completa y robusta, con el criterio de un senior. Los módulos 0–6 y los anexos A.2, A.3 y A.5 están escritos y revisados.
Estado del módulo: otro autor (sesión anterior) escribió 7.1 (${M7}/01-arquitectura.html) y 7.2 (${M7}/02-interaccion.html) y los helpers ${M7}/recursos/m7kit.js y m7.css. AHORA escriben a la vez cinco autores: 7.3, 7.4, 7.5, 7.6 (+ proyecto final) y 7.7, cada uno solo su archivo.
Antes de escribir: lee 7.1 y 7.2 ENTERAS (arquitectura, bucle, helpers de m7kit.js, notación, estilo) y busca en ellas las promesas y enlaces hacia tu lección («lo veremos en 7.N», href a tu archivo): tu lección debe cumplirlas. Lee el manifest (${RAIZ}/assets/js/manifest.js) y las cabeceras de assets/js/*.js (sobre todo glkit.js, playground-js.js con data-incluir="glkit,texturas", texturas.js).
NO modifiques 01-arquitectura.html, 02-interaccion.html, recursos/m7kit.js ni recursos/m7.css (úsalos cuanto quieras; si necesitas helpers o estilos propios, crea recursos/l7N-*.js|css con tu número de lección). Si 7.1/7.2/m7kit tienen un bug, anótalo en el informe.
Bestiario: data-id únicos con el prefijo de tu lección (m7-N-...) para no chocar con los otros autores. Requisitos de la guía §6 en tu lección: ≥2 ejemplos resueltos, ≥3 ejercicios con pistas y solución explicada (con playground y data-solucion siempre que se pueda), ≥2 quizzes repartidos, cajas senior/bestiario/hack donde toque, resumen final.`

const LECCIONES = [
  {
    n: '3', idc: 'm7-3', archivos: `${M7}/03-transiciones-shader.html (data-leccion="07-integracion/transiciones-shader") y, si hace falta, ${M7}/recursos/l73-*`,
    leer: 'En detalle: 2.2 (transiciones CSS), 2.4 (interpolación/easing), 2.5 (muelles), 5.5 (texturas), 5.8 (framebuffers), 6.6 (ruido), 6.8 (efectos con texturas), 6.7 (animar en el shader).',
    temas: `**7.3 · Transiciones animadas con shaders** — 03-transiciones-shader.html
Animar un uniform con easing (2.4) y con muelles (2.5) — u_progreso 0→1; transiciones entre dos texturas: fundido, cortinilla con borde smoothstep, disolución con umbral de ruido y borde brillante, transiciones por desplazamiento (estilo gl-transitions), revelados direccionales y radiales; interrupciones (reapuntar el muelle); efectos hover sobre imágenes (cantidad de distorsión guiada por un muelle); overlay estilo transición de página; encadenar varios uniforms (línea de tiempo); rendimiento: renderizar solo mientras se anima (bucle bajo demanda — senior). Texturas con Texturas.crear (file://: nada de imágenes externas).`,
  },
  {
    n: '4', idc: 'm7-4', archivos: `${M7}/04-vertex-animacion.html (data-leccion="07-integracion/vertex-animacion") y, si hace falta, ${M7}/recursos/l74-*`,
    leer: 'En detalle: 4.2 (pipeline), 4.5 (varyings, gl_VertexID), 5.3 (buffers e índices), 5.6 (3D, matrices, profundidad, normales), 5.9 (instancing), 6.6 (ruido), 3.2 (producto cruz, normales).',
    temas: `**7.4 · Animar vértices: mallas que se deforman** — 04-vertex-animacion.html
Animación en el vertex shader: generar un plano subdividido (rejilla de vértices + índices; cuántos; tipo de índice), desplazamiento con ondas/ruido en el vertex shader (u_time), recalcular normales (derivada analítica vs diferencias finitas en el shader) para la iluminación, por vértice vs por fragmento (resolución de la malla vs detalle — facetas), bandera/tela ondeando, deformación con el ratón (abombamiento), geometría procedural con gl_VertexID (sin buffers — hack), modo POINTS con gl_PointSize para rejillas de partículas; visualizar el wireframe (truco baricéntrico) para ver la malla; lectura de texturas en el vertex shader (heightmap).`,
  },
  {
    n: '5', idc: 'm7-5', archivos: `${M7}/05-particulas-gpu.html (data-leccion="07-integracion/particulas-gpu") y, si hace falta, ${M7}/recursos/l75-*`,
    leer: 'En detalle: 2.8 (proyecto de partículas en CPU), 4.5 (gl_VertexID), 5.5 (texturas, formatos float), 5.8 (FBO, ping-pong, EXT_color_buffer_float), 5.9 (instancing, divisor), 5.10 (depuración/rendimiento), 6.6 (ruido; curl noise si aparece).',
    temas: `**7.5 · Partículas en la GPU** — 05-particulas-gpu.html
Límites de las partículas en CPU (2.8); enfoque 1: quads instanciados con atributos por instancia actualizados desde JS cada frame (simulación en CPU, dibujo en GPU); enfoque 2: simulación en GPU con el estado en texturas float (posición/velocidad) + FBOs ping-pong (requiere EXT_color_buffer_float), dibujar leyendo la textura en el vertex shader vía gl_VertexID → texelFetch; enfoque 3: transform feedback (WebGL2): actualizar buffers en el vertex shader, capturar las salidas, intercambiar buffers (RASTERIZER_DISCARD); comparativa; fuerzas: campo de flujo con curl noise, atracción del ratón; mezcla aditiva y problemas de orden; demo de 100k–1M partículas con FPS (ojo: la demo grande que arranque pausada o con pocos elementos por defecto y un botón para subir; mide en el M1 y di las cifras); trampas: soporte/precisión de texturas float, bucles de realimentación, fugas del divisor de atributos en el estado del VAO. Nota: GLKit.crearPrograma admite {varyingsTF} para transform feedback (léelo en glkit.js).`,
  },
  {
    n: '6', idc: 'm7-6', archivos: `${M7}/06-proyecto-final.html (data-leccion="07-integracion/proyecto-final") y la página autónoma ${M7}/proyecto-final/index.html (con sus propios .js/.css dentro de proyecto-final/; si hace falta también ${M7}/recursos/l76-*)`,
    leer: 'En detalle: 2.2 y 2.7 (CSS/WAAPI), 2.3 (rAF y tiempo), 2.5 (muelles), 5.1 (contexto, pérdida de contexto), 5.8 (FBO), 6.6 (ruido/fbm), 6.7 (animación en shaders). 7.3 (transiciones por shader) y 7.5 se escriben AHORA en paralelo: escribe tu lección autocontenida (explica lo que necesites y enlaza a 7.3 para el detalle de las transiciones); al final, si 03-transiciones-shader.html ya existe, léelo para alinear notación y enlaces a sus secciones.',
    temas: `**7.6 · Proyecto final: un hero interactivo** — 06-proyecto-final.html
Una sección de página completa que combina: fondo WebGL (flujo de ruido/fbm con uniforms de ratón y scroll), contenido DOM superpuesto con animaciones CSS/WAAPI sincronizadas con el mismo reloj, una transición por shader entre dos «diapositivas» disparada por botones (guiada por un muelle), responsive y consciente del DPR, pausa fuera de pantalla, alternativa con prefers-reduced-motion, alternativa elegante sin WebGL; construida paso a paso (varias etapas como playgrounds JS) y la versión final completa como página autónoma en proyecto-final/index.html (enlázala desde la lección). Revisión de la arquitectura y checklist de rendimiento.
La página autónoma proyecto-final/index.html: abrible por sí sola con file:// (doble clic) y sin internet, SIN depender de curso.js ni de assets/ (sus propios archivos dentro de proyecto-final/), código limpio y muy comentado en español (es el código que el alumno copiará como plantilla), con un enlace discreto de vuelta a la lección. Verifícala también con verificar.mjs (aunque no sea una lección, detecta excepciones y errores de consola) y con capturas; comprueba a 390 px de ancho (node ${Q}/movil.mjs <archivo>) y con prefers-reduced-motion (emúlalo en un script puppeteer: page.emulateMediaFeatures).`,
  },
  {
    n: '7', idc: 'm7-7', archivos: `${M7}/07-siguientes-pasos.html (data-leccion="07-integracion/siguientes-pasos") y, si hace falta, ${M7}/recursos/l77-*`,
    leer: 'Recorre el curso entero por encima (títulos, secciones, cajas senior/hack) para que la lección sea el cierre de lo que el alumno ha aprendido: qué sabe ya y cómo se traduce a Three.js/WebGPU. Lee en detalle 4.4–4.5, 5.2–5.9, 6.1 y el anexo A.5 (08-anexos/05-recursos.html) para no repetirlo y enlazarlo.',
    temas: `**7.7 · Siguientes pasos: Three.js y WebGPU con lo que ya sabes** — 07-siguientes-pasos.html
Correspondencia de conceptos con Three.js (Scene/Camera/Mesh; Geometry = VBO+VAO+EBO; Material = programa + uniforms; ShaderMaterial/RawShaderMaterial; objeto uniforms; hacks con onBeforeCompile; renderer.setPixelRatio; render targets = FBO; InstancedMesh = instancing) con tabla y código comparado (sin cargar Three.js: el curso es offline; código estático explicando qué hace por debajo — y si mencionas APIs concretas de Three.js o WebGPU, que sean reales y actuales: no inventes nombres; si dudas, dilo sin detalle); panorama de WebGPU (WGSL vs GLSL, pipelines explícitos, bind groups vs uniforms, compute shaders, NDC z en [0,1], origen de coordenadas de textura/framebuffer), qué se transfiere; qué aprender después (PBR, sombras, deferred, compute); recursos (artículos de IQ, The Book of Shaders, WebGL2 Fundamentals, Shadertoy, Real-Time Rendering) enlazando al anexo A.5 en vez de duplicarlo. Esta lección puede tener menos ejercicios (≥2) pero sí ≥2 quizzes. Si Chrome headless expone navigator.gpu en esta máquina, puedes incluir una comprobación en vivo de soporte (sin depender de ella).`,
  },
]

const PROMPT_AUTOR = (l) => `Eres el autor de la lección 7.${l.n} del curso web «Shaders + Animación» (${RAIZ}), en español.
${CONTEXTO_M7}
Tus archivos (solo escribes estos): ${l.archivos}
Lecturas previas recomendadas: ${l.leer}
${COMUN(l.idc)}

Tema obligatorio (archivo y data-leccion ya fijados en el manifest):
${l.temas}

Trabaja por secciones: escribe, verifica con verificar.mjs (--soluciones --capturas), mira TODAS las capturas con Read (y alguna con --tema light), corrige. La lección está terminada cuando verificar.mjs no da problemas (salvo enlaces a lecciones hermanas que aún no existan) y las capturas se ven bien.
Al terminar, escribe tu informe (formato §8 de la guía: archivos, contenido y conteos, data-id de bestiario, resumen de verificación, problemas conocidos, sugerencias para componentes compartidos, términos para el glosario con definición de una línea) en ${INF}/informe-m7-${l.n}.md y devuélvelo también como respuesta final.`

const PROMPT_REVISOR = (l, informe) => `Revisa la lección 7.${l.n} del curso web «Shaders + Animación» (${RAIZ}), recién escrita por su autor${l.n === '7' ? `, y además las lecciones 7.1 (${M7}/01-arquitectura.html) y 7.2 (${M7}/02-interaccion.html), escritas en una sesión anterior y nunca revisadas (y el helper ${M7}/recursos/m7kit.js que usan: puedes corregirlo, pero solo con cambios compatibles, porque 7.3–7.6 también lo usan; comprueba esas lecciones si lo tocas)` : ''}.
Archivos que puedes modificar: ${l.archivos}${l.n === '7' ? `, ${M7}/01-arquitectura.html, ${M7}/02-interaccion.html, ${M7}/recursos/m7kit.js, ${M7}/recursos/m7.css` : ''}. Nada más: otros agentes trabajan a la vez en otras lecciones.
${COMUN('rev-' + l.idc)}

Objetivo del curso (palabras del dueño): entender al 100 % qué está sucediendo, cada comando, cada comportamiento raro, cada detalle que separa a un junior de un senior; nivel básico-intermedio con muchos ejemplos resueltos y ejercicios.

Para cada lección:
1. Ejecuta verificar.mjs con --soluciones --capturas y mira TODAS las capturas con Read (¿se ve lo que el texto dice que se ve?). Prueba al menos una vez con --tema light.
2. Lee la lección entera con ojo de experto en gráficos en tiempo real y JavaScript: errores técnicos, afirmaciones dudosas (compruébalas con un experimento en Chrome headless), cifras sin medir o sin hardware, pasos saltados, código sin explicar, ejercicios cuyo enunciado no coincide con la solución, soluciones que no funcionan o no hacen lo pedido, quizzes con respuesta discutible, erratas, enlaces y anclas mal (incluidos los enlaces a otros módulos: el archivo y el #id deben existir), problemas de tema claro/oscuro o de móvil, requisitos mínimos de la guía (§6), coherencia de notación con 7.1/7.2 y con los módulos 2, 5 y 6.
3. Corrige directamente lo que sea claro y local. Si algo requiere reescribir una sección entera, hazlo solo si es imprescindible para la exactitud; si no, descríbelo en el informe.
4. Vuelve a verificar tras corregir.

Informe del autor (contexto):
---
${String(informe || '(el autor no devolvió informe)').slice(0, 12000)}
---

Escribe tu informe (por lección: cambios hechos con el porqué; problemas pendientes con sección concreta, qué está mal y propuesta; sugerencias para componentes compartidos) en ${INF}/revision-m7-${l.n}.md y devuélvelo también como respuesta final.`

const resultados = await pipeline(
  LECCIONES,
  (l) => agent(PROMPT_AUTOR(l), { label: `autor 7.${l.n}`, phase: 'Autores', model: 'opus', effort: 'xhigh', agentType: 'general-purpose' }),
  (informe, l) => {
    log(`7.${l.n} escrita${informe ? '' : ' (sin informe)'}; entra su revisor`)
    return agent(PROMPT_REVISOR(l, informe), { label: `revisor 7.${l.n}`, phase: 'Revisión', model: 'opus', effort: 'xhigh', agentType: 'general-purpose' })
      .then((revision) => ({ leccion: '7.' + l.n, informe, revision }))
  },
)
return resultados
