export const meta = {
  name: 'curso-revision',
  description: 'Revisión del módulo 6 (2 revisores), coherencia m0–m5 (2 revisores) y glosario A.4 — Opus xhigh',
  phases: [
    { title: 'Revisión y anexos', detail: '5 agentes Opus 5.5 xhigh en paralelo', model: 'opus' },
  ],
}

const RAIZ = '/Users/alex/Projects/shaders'
const SCRATCH = '/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad'
const GUIA = RAIZ + '/herramientas/GUIA_AUTORES.md'
const Q = RAIZ + '/herramientas'
const INF = RAIZ + '/herramientas/estado/informes'
const M6 = RAIZ + '/modulos/06-glsl'

const CHROME = `REGLA DE TEMPERATURA (pedido explícito del dueño, no negociable): solo puede haber UN Chrome headless a la vez en toda la máquina (MacBook Air sin ventilador) y ahora mismo trabajan 10 agentes en paralelo. Lanza Chrome SOLO con el puppeteer-core parcheado de ${Q}/node_modules (verificar.mjs, movil.mjs, o scripts tuyos guardados en ${Q}/ o en ${SCRATCH}/qa/ que hagan import puppeteer from "puppeteer-core"): hace cola automáticamente («esperando turno» es normal: espera, no lo esquives). Nunca ejecutes el binario de Chrome directamente, nunca instales otro puppeteer/playwright, nunca uses las herramientas de navegador (mcp__claude-in-chrome__*: son el Chrome personal del dueño). Cierra siempre el navegador en tus scripts. Agrupa comprobaciones para lanzar Chrome pocas veces. Un vigilante mata cualquier segundo Chrome que salte la cola.`

const COMUN = (idc) => `
Guía de autores (reglas, plantilla y componentes; §7 = verificación): ${GUIA}
Verificador: node ${Q}/verificar.mjs <archivo.html> --soluciones --capturas ${SCRATCH}/capturas/${idc}   (opciones: --pagina dir, --tema light, --aislar)
Experimentos: ${SCRATCH}/experimentos/${idc}/ (páginas) · scripts de puppeteer propios en ${SCRATCH}/qa/${idc}-*.mjs
${CHROME}
No puedes preguntar al dueño: decide con criterio y anota en el informe las decisiones discutibles.
Nunca edites assets/**, index.html ni assets/js/manifest.js (si encuentras un bug en un componente compartido, descríbelo en el informe con propuesta de arreglo). Otros agentes trabajan a la vez en otros archivos del curso: modifica SOLO los archivos que este encargo te asigna.
Comprueba empíricamente cada afirmación técnica que corrijas o pongas en duda (Chrome headless con GPU real, Apple M1, ANGLE/Metal) y di en qué hardware se midió cada cifra.
Objetivo del curso (palabras del dueño): entender al 100 % qué está sucediendo, cada comando, cada comportamiento raro, cada detalle que separa a un junior de un senior; nivel básico-intermedio con muchos ejemplos resueltos y ejercicios.`

const REVISAR_PASOS = `Para cada lección:
1. Ejecuta verificar.mjs con --soluciones --capturas y mira TODAS las capturas con Read (¿se ve lo que el texto dice que se ve?). Prueba también con --tema light.
2. Lee la lección entera con ojo de experto en gráficos en tiempo real: errores técnicos, afirmaciones dudosas o cifras sin medir (compruébalas con experimentos en Chrome headless), pasos saltados, código sin explicar, ejercicios cuyo enunciado no coincide con la solución, soluciones que no compilan o no hacen lo pedido (cárgalas: el botón «Ver solución» usa el <script data-solucion>), quizzes con respuesta discutible, erratas, enlaces y anclas rotos (el archivo y el #id deben existir), problemas de tema claro/oscuro, requisitos mínimos de la guía (§6), atribuciones «como vimos en X» correctas.
3. Corrige directamente lo que sea claro y local. Si algo exige reescribir una sección entera, hazlo solo si es imprescindible para la exactitud; si no, descríbelo en el informe.
4. Vuelve a verificar tras corregir.`

const TAREAS = [
  {
    id: 'rev-m6a', label: 'revisor 6.2–6.5',
    prompt: `Revisa a fondo las lecciones 6.2–6.5 del curso web «Shaders + Animación» (${RAIZ}), en español: ${M6}/02-pensar-en-paralelo.html, 03-formas-sdf.html, 04-color.html y 05-patrones.html (y sus recursos ${M6}/recursos/a-*). Solo puedes modificar esos archivos. La 6.1 (01-lenguaje.html) ya está revisada: léela como referencia de notación y no la modifiques. Otro revisor revisa a la vez 6.6–6.10.
${COMUN('rev-m6a')}
Contexto: informe del autor en ${INF}/informe-m6a.md (léelo: cifras y afirmaciones que dice haber medido — vuelve a medir las que no sean triviales).
Punto concreto: 6.1 y 6.5 dicen que, con fast math en ANGLE/Metal, mod(x, 7.0) da resultados erróneos del orden de 39 por millón (medido). Comprueba la cifra de 6.5 con un experimento propio (describe el experimento en el informe: el revisor de 6.6 alineará su texto con ella).
${REVISAR_PASOS}
Escribe tu informe (por lección: cambios con el porqué; pendientes con sección, qué está mal y propuesta; sugerencias para componentes compartidos) en ${INF}/revision-m6a.md y devuélvelo también como respuesta final.`,
  },
  {
    id: 'rev-m6b', label: 'revisor 6.6–6.10',
    prompt: `Revisa a fondo las lecciones 6.6–6.10 del curso web «Shaders + Animación» (${RAIZ}), en español: ${M6}/06-ruido.html, 07-animacion-shaders.html, 08-texturas-efectos.html, 09-raymarching.html y 10-codigo-ajeno.html (y sus recursos ${M6}/recursos/b-*). Solo puedes modificar esos archivos. Las lecciones 6.1–6.5 son la referencia de lo ya enseñado (léelas para comprobar las atribuciones; otro revisor revisa 6.2–6.5 a la vez: no las modifiques).
${COMUN('rev-m6b')}
Contexto: informe del autor en ${INF}/informe-m6b.md y pendientes en ${RAIZ}/herramientas/estado/PENDIENTES_FINALES.md. Las cinco lecciones ya compilan (verificadas), pero FALTA confirmar con experimentos las cifras y afirmaciones medidas por el autor (tiempos, conteos, porcentajes, comportamientos de ANGLE/Metal): haz una lista de todas y verifica cada una; corrige las que no se sostengan.
Puntos concretos:
- 6.6 dice que los errores de mod(x, 7.0) con fast math son «frecuentes», mientras que 6.1 y 6.5 midieron del orden de 39 por millón. Mide tú (mismo tipo de experimento) y alinea 6.6 con la cifra medida, explicando de dónde sale; si tu medida contradice la de 6.1/6.5, no las toques: anótalo en el informe con tu experimento.
- Atribuciones: dividir por la altura para corregir el aspecto se enseña en 6.2 (no en 6.3); fwidth se enseña en 6.3 (6.2 solo adelanta dFdx y los quads). Comprueba todas las referencias «como vimos en 6.X».
- 6.6 no debe decir que fract devuelve siempre un valor en [0,1): en float32 puede devolver 1.0 exacto (explicado en 6.5 y 3.4).
- 6.10: NO toques la caja que explica las diferencias de iMouse respecto a Shadertoy ni el ejercicio 6.10.4 (el lead está implementando AHORA en playground-glsl.js la semántica real de iMouse, iChannelResolution e iDate del modo shadertoy y reescribirá esas partes). El resto de 6.10 sí es tuyo. Si ves que el modo shadertoy cambia de comportamiento durante tu revisión, es por eso.
${REVISAR_PASOS}
Escribe tu informe (por lección: cambios con el porqué; lista de cifras verificadas con su resultado; pendientes con sección, qué está mal y propuesta; sugerencias para componentes compartidos) en ${INF}/revision-m6b.md y devuélvelo también como respuesta final.`,
  },
  {
    id: 'coh-web', label: 'coherencia m0–m2',
    prompt: `Eres el revisor de COHERENCIA del tramo «web y animación» del curso web «Shaders + Animación» (${RAIZ}), en español: módulo 0 (modulos/00-inicio/01-bienvenida.html), módulo 1 (modulos/01-web/, 7 lecciones) y módulo 2 (modulos/02-animacion/, 8 lecciones). Cada lección ya fue revisada individualmente; tu trabajo es lo que una revisión por lección no ve: el curso como un todo.
Puedes modificar SOLO los archivos HTML de modulos/00-inicio/, modulos/01-web/ y modulos/02-animacion/ (y sus recursos). Otro revisor hace lo mismo a la vez con los módulos 3–5; otros agentes revisan el módulo 6, escriben el 7 y el glosario.
${COMUN('coh-web')}
Qué buscar (y corregir en tus archivos):
1. Contradicciones entre lecciones: el mismo hecho, cifra o definición contado de forma distinta (p. ej. qué ocurre en un frame, microtareas vs rAF, qué propiedades van al compositor, cifras de Hz/ms, comportamiento de % con negativos, DPR…). Si la verdad no está clara, experimenta.
2. Orden pedagógico: conceptos usados antes de explicarse sin un «lo veremos en X» enlazado; ejercicios que exigen algo aún no enseñado.
3. Promesas: cada «lo veremos en la lección X» / «en X.Y» / enlace hacia delante debe apuntar a una lección que de verdad lo cubra (lee la sección destino, esté en el módulo que esté: los módulos 3–6 y 7.1–7.2 existen; 7.3–7.7 y el glosario A.4 se están escribiendo ahora y darán enlace roto: anótalos aparte, no los borres). Números y títulos de lección citados deben coincidir con el manifest (${RAIZ}/assets/js/manifest.js).
4. Repeticiones: la misma explicación a la misma profundidad en dos lecciones → deja la explicación completa donde toca según el manifest y convierte la otra en un recordatorio breve con enlace (sin perder contenido único).
5. Notación y terminología: nombres de variables y uniforms (u_time, u_resolution…), términos en español/inglés (búfer/buffer, fotograma/frame…), formato de números y unidades, estilo de los ejemplos de código. Unifica donde haya incoherencias que confundan al alumno (no por gusto).
6. Enlaces y anclas: escribe un script en node (sin Chrome: basta leer los HTML) que compruebe todos los href internos de tus archivos (archivo existe y #id existe en el destino) y arregla los rotos.
7. data-id de bestiario únicos en todo el curso (grep global).
Método (para no perder el hilo si tu contexto se compacta): recorre las lecciones en orden y ve anotando en ${SCRATCH}/experimentos/coh-web/mapa.md, por lección, las definiciones, cifras, promesas y términos clave; después cruza. También comprueba cómo citan a m0–m2 las lecciones de otros módulos (grep de "01-web/" y "02-animacion/" en modulos/**): si alguna cita apunta a algo que no existe o que tus lecciones no dicen, anótalo en el informe (no edites esos archivos).
Verifica con verificar.mjs cada archivo que modifiques (--soluciones).
Escribe tu informe (cambios hechos por archivo con el porqué; problemas en archivos ajenos con archivo/sección/propuesta; enlaces a 7.3–7.7/A.4 pendientes) en ${INF}/coherencia-m0-m2.md y devuélvelo también como respuesta final.`,
  },
  {
    id: 'coh-gpu', label: 'coherencia m3–m5',
    prompt: `Eres el revisor de COHERENCIA del tramo «matemáticas, GPU y WebGL» del curso web «Shaders + Animación» (${RAIZ}), en español: módulo 3 (modulos/03-matematicas/, 7 lecciones), módulo 4 (modulos/04-gpu/, 6 lecciones + scripts de python/ que citan) y módulo 5 (modulos/05-webgl/, 10 lecciones). Cada lección ya fue revisada individualmente; tu trabajo es lo que una revisión por lección no ve: el curso como un todo.
Puedes modificar SOLO los archivos HTML de modulos/03-matematicas/, modulos/04-gpu/ y modulos/05-webgl/ (y sus recursos). Otro revisor hace lo mismo a la vez con los módulos 0–2; otros agentes revisan el módulo 6, escriben el 7 y el glosario. Si encuentras incoherencias con 1.3 (números en JS) o 1.6 (binario) o con el módulo 6, anótalas en el informe sin editar esos archivos.
${COMUN('coh-gpu')}
Qué buscar (y corregir en tus archivos):
1. Contradicciones entre lecciones: el mismo hecho, cifra o definición contado de forma distinta (p. ej. qué guarda un VAO en 4.4 vs 5.2/5.3/5.9, column-major y el orden de multiplicación en 3.5 vs 3.6 vs 5.6, NDC y división de perspectiva, rango de atan, fract/mod con negativos, precisión float32/highp/mediump en 3.7 vs 5.x, valores por defecto de filtros de textura, premultiplied alpha, texelFetch fuera de rango, límites medidos en el M1…). Si la verdad no está clara, experimenta.
2. Orden pedagógico: conceptos usados antes de explicarse sin un «lo veremos en X» enlazado; ejercicios que exigen algo aún no enseñado.
3. Promesas: cada «lo veremos en la lección X» / «en X.Y» / enlace hacia delante debe apuntar a una lección que de verdad lo cubra (lee la sección destino, esté en el módulo que esté: el módulo 6 y 7.1–7.2 existen; 7.3–7.7 y el glosario A.4 se están escribiendo ahora y darán enlace roto: anótalos aparte, no los borres). Números y títulos de lección citados deben coincidir con el manifest (${RAIZ}/assets/js/manifest.js).
4. Repeticiones: la misma explicación a la misma profundidad en dos lecciones → deja la explicación completa donde toca según el manifest y convierte la otra en un recordatorio breve con enlace (sin perder contenido único).
5. Notación y terminología: nombres de uniforms/atributos/varyings (u_, a_, v_…), matrices (M, V, P; orden de producto), términos en español/inglés (búfer/buffer, fragmento, vértice, texel…), formato de números y unidades, estilo de los ejemplos (GLKit vs WebGL crudo según lo explicado hasta ese punto). Unifica donde haya incoherencias que confundan al alumno (no por gusto).
6. Enlaces y anclas: escribe un script en node (sin Chrome: basta leer los HTML) que compruebe todos los href internos de tus archivos (archivo existe y #id existe en el destino) y arregla los rotos.
7. data-id de bestiario únicos en todo el curso (grep global).
Método (para no perder el hilo si tu contexto se compacta): recorre las lecciones en orden y ve anotando en ${SCRATCH}/experimentos/coh-gpu/mapa.md, por lección, las definiciones, cifras, promesas y términos clave; después cruza. También comprueba cómo citan a m3–m5 las lecciones de otros módulos (grep de "03-matematicas/", "04-gpu/" y "05-webgl/" en modulos/**): si alguna cita apunta a algo que no existe o que tus lecciones no dicen, anótalo en el informe (no edites esos archivos).
Verifica con verificar.mjs cada archivo que modifiques (--soluciones).
Escribe tu informe (cambios hechos por archivo con el porqué; problemas en archivos ajenos con archivo/sección/propuesta; enlaces a 7.3–7.7/A.4 pendientes) en ${INF}/coherencia-m3-m5.md y devuélvelo también como respuesta final.`,
  },
  {
    id: 'glosario', label: 'autor A.4 glosario',
    prompt: `Eres el autor del anexo **A.4 · Glosario** del curso web «Shaders + Animación» (${RAIZ}), en español: ${RAIZ}/modulos/08-anexos/04-glosario.html, data-leccion="08-anexos/glosario" (ya fijado en el manifest). Solo escribes ese archivo (y, si hace falta, ${RAIZ}/modulos/08-anexos/recursos/glosario.*). No modifiques anexos.css/anexos.js (los usan los otros anexos: léelos y reutilízalos) ni ningún otro archivo.
${COMUN('glosario')}
Encargo original de los anexos (léelo; tu parte es A.4): ${RAIZ}/herramientas/estado/ENCARGO_ANEXOS.md. Mira cómo están hechos los anexos ya escritos (02-chuleta-glsl.html, 03-chuleta-webgl.html, 05-recursos.html) para mantener el estilo.
Contenido: todos los términos técnicos del curso (español e inglés), orden alfabético, definición precisa de 1–3 frases y enlace a la lección (y a la sección #id si existe) donde se explica; si el término aparece en varias lecciones, enlaza la principal y como mucho una o dos más. Índice de letras arriba y filtro en vivo (JS sencillo que oculte/muestre entradas del DOM). Al menos 120 términos (apunta a 150–250 si el curso los tiene): VBO, VAO, EBO, uniform, varying, atributo, fragmento, rasterización, clip space, NDC, w, división de perspectiva, viewport, mipmap, texel, premultiplied alpha, sRGB, SDF, fbm, draw call, warp, divergencia, event loop, microtarea, layout thrashing, compositor, DPR, easing, lerp, muelle, ζ, etc.
Fuentes: las secciones 7 («términos para el glosario») de los informes de autores en ${INF}/ (informe-m1, m2, m4, m5, m6a, m6b) y, sobre todo, las propias lecciones: recórrelas todas (modulos/00..07; del módulo 7 hoy existen 7.1 y 7.2 — 7.3–7.7 se escriben ahora mismo) para que cada definición diga exactamente lo que el curso enseña, con su misma notación, y para enlazar al sitio correcto. Las definiciones deben ser correctas y precisas (si una lección y tu definición discrepan, investiga y anota la discrepancia en el informe).
Formato: entradas como HTML estático en el propio archivo (p. ej. <dl> con <dt id="g-..."> y <dd>), NO generadas desde un array JS: así el buscador del curso (herramientas/indexar.mjs indexa el HTML) y Ctrl+F las encuentran. Para términos con sinónimo en otro idioma, una entrada principal y la otra como remisión («frame → fotograma» o al revés, según el término que use el curso). Marca en un comentario HTML <!-- M7-PENDIENTE --> el sitio donde el lead añadirá después los términos de 7.3–7.7.
Verifica con verificar.mjs (enlaces rotos = 0 salvo los que apunten a 7.3–7.7), capturas en tema oscuro y claro, y a 390 px de ancho (node ${Q}/movil.mjs <archivo>).
Escribe tu informe (archivo, número de términos, discrepancias encontradas entre lecciones, términos que no supiste dónde enlazar) en ${INF}/informe-glosario.md y devuélvelo también como respuesta final.`,
  },
]

phase('Revisión y anexos')
const resultados = await parallel(TAREAS.map((t) => () =>
  agent(t.prompt, { label: t.label, phase: 'Revisión y anexos', model: 'opus', effort: 'xhigh', agentType: 'general-purpose' })
    .then((r) => { log(`${t.label}: terminado`); return { id: t.id, informe: r } })
))
return resultados
