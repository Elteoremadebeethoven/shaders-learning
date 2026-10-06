export const meta = {
  name: 'curso-oleada2',
  description: 'Coherencia m6 + anexos A.2/A.3/A.5 y auditoría de tiempos de GPU + pendientes m0–m5 (Opus xhigh)',
  phases: [
    { title: 'Oleada 2', detail: '2 agentes Opus 5.5 xhigh', model: 'opus' },
  ],
}

const RAIZ = '/Users/alex/Projects/shaders'
const SCRATCH = '/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad'
const GUIA = RAIZ + '/herramientas/GUIA_AUTORES.md'
const Q = RAIZ + '/herramientas'
const INF = RAIZ + '/herramientas/estado/informes'

const CHROME = `REGLA DE TEMPERATURA (pedido explícito del dueño, no negociable): solo puede haber UN Chrome headless a la vez en toda la máquina (MacBook Air sin ventilador) y trabajan otros agentes en paralelo. Lanza Chrome SOLO con el puppeteer-core parcheado de ${Q}/node_modules (verificar.mjs, movil.mjs, o scripts tuyos guardados en ${Q}/ o en ${SCRATCH}/qa/ que hagan import puppeteer from "puppeteer-core"): hace cola automáticamente («esperando turno» es normal: espera). Nunca ejecutes el binario de Chrome directamente, nunca instales otro puppeteer/playwright, nunca uses las herramientas de navegador (mcp__claude-in-chrome__*). Cierra siempre el navegador en tus scripts. Agrupa comprobaciones para lanzar Chrome pocas veces.`

const COMUN = (idc) => `
Guía de autores (reglas, plantilla y componentes; §5.6 y §7 recién actualizados): ${GUIA}
Verificador: node ${Q}/verificar.mjs <archivo.html> --soluciones --capturas ${SCRATCH}/capturas/${idc}   (opciones: --pagina dir, --tema light)
Enlaces y anclas sin Chrome: node ${Q}/enlaces.mjs [archivos…]   (sin argumentos, todo el curso)
Experimentos: ${SCRATCH}/experimentos/${idc}/ · scripts de puppeteer propios en ${SCRATCH}/qa/${idc}-*.mjs
${CHROME}
No puedes preguntar al dueño: decide con criterio y anota en el informe las decisiones discutibles.
Nunca edites assets/**, index.html ni assets/js/manifest.js (bugs de componentes compartidos → al informe con propuesta). Otros agentes trabajan a la vez en el módulo 7 (modulos/07-integracion/**: NO lo toques) y en otros archivos: modifica SOLO los archivos que este encargo te asigna.
Comprueba empíricamente cada afirmación técnica que corrijas (Chrome headless con GPU real, Apple M1, ANGLE/Metal) y di en qué hardware se midió cada cifra.
Objetivo del curso (palabras del dueño): entender al 100 % qué está sucediendo, cada comando, cada comportamiento raro, cada detalle que separa a un junior de un senior; nivel básico-intermedio.

NOVEDADES DEL LEAD (tenlas en cuenta en los textos que revises):
1. isnan y la caché de programas: los revisores del módulo 6 midieron que un isnan()/isinf() desactiva el fast math de ANGLE/Metal SOLO en la primera compilación de ese texto exacto; después Chrome lo saca de su caché de programas (memoria y disco, entre pestañas y visitas) compilado CON fast math. El lead ha cambiado Curso.glCompartido.compilar (playground-glsl.js, que usan los playgrounds GLSL y el graficador): si el fragment shader contiene isnan/isinf, le añade al final un comentario único («// sin-cache …») para que cada compilación sea un texto nuevo. Medido tras el cambio (M1): en los playgrounds GLSL y el graficador, el efecto de isnan se ve SIEMPRE (0 fallos de mod(x,7.0) en la 1.ª, 2.ª y 3.ª compilación y en otra pestaña), mientras que compilando el mismo texto dos veces en WebGL crudo, la 2.ª ya tiene fast math (2 071 fallos de 4 096) y en otra pestaña ya la 1.ª. Consecuencia para los textos: «añade un isnan y mira cómo cambia» es reproducible en los playgrounds GLSL y el graficador del curso (gracias a ese comentario, y conviene decirlo); en WebGL crudo (playgrounds JS con GLKit, o la app del alumno) NO es fiable, y eso merece contarse (comportamiento raro de nivel hacker: no uses isnan como interruptor de precisión en producción; usa fórmulas robustas).
2. Medir tiempos de GPU: en la GPU de teselas del M1, dibujar N veces seguidas sobre el mismo framebuffer y dividir NO mide el trabajo real (el controlador se ahorra lo que el siguiente dibujo tapa: una caja 9×9 salía igual de cara que una 1×1). Método fiable: cada dibujo en su propia pasada (dos FBO alternos, clear al empezar), readPixels al final, mediana de varias tandas; EXT_disjoint_timer_query_webgl2 existe pero dio medianas erráticas. Ver la caja senior «Cómo se mide lo que cuesta un shader (y cómo no)» de 6.6 y el laboratorio del revisor en ${SCRATCH}/qa/rev-m6b-lab.mjs (función __tiempo2).
3. El modo shadertoy de playground-glsl.js implementa ahora la semántica real de iMouse y añade iDate, iChannelResolution[4], iFrameRate, iChannelTime[4] e iSampleRate (6.10 ya lo explica).`

const TAREAS = [
  {
    id: 'coh-m6', label: 'coherencia m6 + anexos',
    prompt: `Eres el revisor de COHERENCIA del módulo 6 (modulos/06-glsl/, 10 lecciones, recién revisadas una a una) y de los anexos A.2 (08-anexos/02-chuleta-glsl.html), A.3 (03-chuleta-webgl.html) y A.5 (05-recursos.html) del curso web «Shaders + Animación» (${RAIZ}), en español. Puedes modificar SOLO modulos/06-glsl/** y esos tres archivos de 08-anexos/ (no 01-bestiario.html ni 04-glosario.html, ni recursos/anexos.*).
${COMUN('coh-m6')}
Informes de contexto: ${INF}/revision-m6a.md, ${INF}/revision-m6b.md, ${INF}/coherencia-m3-m5.md (sus secciones de «problemas en archivos ajenos» tocan tus archivos) y ${INF}/coherencia-m0-m2.md.
Pendientes concretos (compruébalos y resuélvelos):
- 6.1 (~línea 1199): atribuye los 43 682 fallos de mod(x, 7.0) a que el compilador «reutiliza el inverso» en un bucle. Falso: depende del rango (cuántos múltiplos negativos de 7 hay), no de la forma del código (ver revision-m6a y revision-m6b §1.3). Revisa también 6.5 por si queda algo parecido.
- Textos sobre isnan y fast math en 6.1, 6.2, 6.5 y 6.6 (incluido el bestiario m6b-hash-fastmath y el párrafo nuevo de 6.6 que dice que la demostración «deja de funcionar en la segunda visita» y el truco de cambiar un espacio en un comentario): actualízalos a la NOVEDAD 1 (en los editores del curso ya no deja de funcionar; en WebGL crudo y en la app del alumno, sí). Mantén el fenómeno de la caché como contenido (es un detalle de hacker).
- 6.8 (~línea 99): dice que texelFetch fuera de rango es indefinido y «no cuentes con ningún valor». WebGL 2.0 obliga a devolver 0 (o (0,0,0,1) con textura incompleta); medido (0,0,0,0) en el M1; así lo dicen 5.5 y las chuletas. Corrige.
- 6.6 (~línea 425): «fract siempre en [0,1)» si sigue ahí (en float32 puede dar 1.0; 3.4 y 6.5).
- Bestiarios del módulo 6 casi idénticos a otros del módulo 3: m6a-orden-espacio (≈ m3-orden-transformaciones / m3-rotacion-inversa-shader), m6b-rot-al-reves (≈ m3-rotacion-inversa-shader), m6b-hash-fastmath (≈ m3-isnan-heisenbug y m3-hash-roto). Lee los de 3.x: si son el mismo caso, convierte el de 6.x en una nota (class="callout nota", conservando el id="…" en el div para no romper enlaces y SIN data-id de bestiario) que enlace al de 3.x y conserve lo que aporte de nuevo; si son casos distintos, que se enlacen mutuamente y el título deje clara la diferencia. (El anexo A.1 se genera de las cajas bestiario: no queremos el mismo síntoma dos veces.)
- Títulos de bestiario citados en el texto que no coinciden con su data-titulo (6.1 cita m5-version-primera-linea, m4-precision-uniform, m5-sampler-unidad y m4-uniform-silencioso; 6.2 cita m3-rotacion-inversa-shader; 6.5 cita m3-costura-atan).
- 6.4 dithering: el texto dice «un número aleatorio del tamaño de un nivel» y el resumen/ejercicio «ruido de medio nivel»: unifícalo con precisión (amplitud y rango).
- 6.10: la demo «iMouse, visualizado» (escrita por el lead) y el shader de prueba del ejercicio 6.10.4 usan smoothstep con bordes invertidos (smoothstep(12.0, 10.0, d)); la propia 6.10 recomienda 1.0 - smoothstep(10.0, 12.0, d): corrígelos por coherencia.
- A.3 (~línea 230, flush/finish): dice que finish espera y bloquea; 4.1 y 5.10 midieron que en Chrome finish vuelve al instante (como flush) y que es readPixels quien espera. Corrige con la distinción especificación/Chrome.
- A.2: la fila de Shadertoy debe reflejar la NOVEDAD 3 si lo menciona; revisa que A.2 y A.3 coincidan con lo que enseñan las lecciones (valores por defecto, errores, límites medidos, texelFetch, smoothstep, mod, fract, atan, precisión) y que sus enlaces a lecciones apunten a la sección correcta (los módulos 7.1–7.7 ya existen en disco, aunque 7.3–7.7 aún se están revisando: puedes enlazarlos).
Después, la revisión de coherencia general del módulo 6 como un todo: contradicciones entre sus lecciones y con los módulos 3–5, orden pedagógico, promesas «lo veremos en X» (que el destino lo cubra), repeticiones a la misma profundidad (deja la completa donde toca y convierte la otra en recordatorio con enlace), notación y terminología (búfer/buffer según la convención de 0.1, u_time…), enlaces y anclas (enlaces.mjs).
Método: anota por lección definiciones, cifras, promesas y términos en ${SCRATCH}/experimentos/coh-m6/mapa.md; después cruza.
Verifica con verificar.mjs (--soluciones) cada archivo que modifiques, y mira las capturas de los playgrounds que cambies.
Escribe tu informe (cambios por archivo con el porqué; problemas en archivos ajenos con archivo/sección/propuesta, en especial los que afecten a 01-bestiario.html y 04-glosario.html) en ${INF}/coherencia-m6-anexos.md y devuélvelo también como respuesta final.`,
  },
  {
    id: 'tiempos', label: 'tiempos GPU + pendientes m0–m5',
    prompt: `Tienes dos encargos sobre los módulos 0–5 del curso web «Shaders + Animación» (${RAIZ}), en español. Puedes modificar SOLO los HTML (y recursos) de modulos/00-inicio/, 01-web/, 02-animacion/, 03-matematicas/, 04-gpu/ y 05-webgl/ (y, si una cifra sale de un script de python/, ese script y su PNG en modulos/04-gpu/img/).
${COMUN('tiempos')}

ENCARGO A · Auditoría de tiempos de GPU (NOVEDAD 2).
1. Localiza TODAS las cifras de tiempo de GPU (ms o µs de dibujar, de un shader, de un draw call, de subir texturas, de readPixels, fps de una demo pesada…) de los módulos 0–5: grep de «ms», «µs», «fps», «milisegundo» y lee el contexto. Distingue: tiempo de CPU de JavaScript (llamadas a la API, validación: esas se miden bien con performance.now()), tiempo de espera de sincronización (readPixels, getError) y tiempo de trabajo de la GPU (eso es lo sospechoso).
2. Para cada cifra de trabajo de GPU, averigua cómo se midió (el texto, el código del playground o los experimentos del autor si los cita) y vuelve a medirla con el método fiable (reutiliza el laboratorio de ${SCRATCH}/qa/rev-m6b-lab.mjs si te sirve). Corrige las que no se sostengan, con el hardware (Apple M1, Chrome, ANGLE/Metal). Si un playground de la lección mide tiempos de GPU delante del alumno con el método engañoso, arréglalo o explica en el texto qué mide de verdad (cuidado: las demos deben seguir siendo ligeras; nada de bucles pesados que arranquen solos).
3. Si una conclusión pedagógica cambia con las cifras nuevas (p. ej. «X es gratis»), reescribe la conclusión.
Lista en el informe cada cifra revisada: lección, afirmación, método original, medida nueva, veredicto.

ENCARGO B · Pendientes de las revisiones de coherencia (lee ${INF}/coherencia-m0-m2.md, ${INF}/coherencia-m3-m5.md, ${INF}/revision-m6a.md y ${INF}/revision-m6b.md; resuelve lo que caiga en tus archivos):
- 1.1 (~línea 692): «gl.clear() en WebGL (lección 5.2)» → clearColor/clear se explican en 5.1.
- 5.3 (~línea 658): «sus pausas se notan como tirones (2.3)»: 2.3 no habla del recolector de basura → enlaza a 1.3 (#el-recolector-de-basura-y-los-bucles-calientes) o a 2.1 (#m2-tirones-periodicos).
- 5.6 (~línea 526): el listener de wheel está en el canvas y el texto dice que sin passive:false se ignoraría preventDefault; Chrome solo hace pasivos por defecto los de window, document y body (1.4; medido en coherencia-m0-m2 E1). Corrige.
- Textos sobre isnan y fast math en 3.3 (atan(0,0) con isnan), 3.7 (m3-isnan-heisenbug y alrededores, m3-hash-roto) y 5.10 (caja «Medir NaN con isnan() cambia el resultado»): actualízalos a la NOVEDAD 1. Ojo con los playgrounds JS (WebGL crudo) de 5.10 o de otras lecciones que demuestren el efecto de isnan: ahí la caché SÍ actúa (el efecto solo se ve la primera vez que se compila ese texto, también entre visitas); o haces la demo robusta (p. ej. añadiendo tú un comentario único al código del shader y explicando por qué — eso ya es una lección de hacker) o el texto lo explica. Compruébalo en Chrome.
- Títulos de bestiario citados en el texto que no coinciden con su data-titulo, en tus archivos (grep de los data-id citados y compara).
- Cualquier otro pendiente de esos informes que caiga en tus archivos y siga sin resolver (comprueba primero si ya lo arregló alguien).
Verifica con verificar.mjs (--soluciones) cada archivo que modifiques.
Escribe tu informe (A: tabla de cifras; B: cambios por archivo con el porqué; pendientes en archivos ajenos con archivo/sección/propuesta; sugerencias para componentes compartidos) en ${INF}/tiempos-y-pendientes-m0-m5.md y devuélvelo también como respuesta final.`,
  },
]

phase('Oleada 2')
const resultados = await parallel(TAREAS.map((t) => () =>
  agent(t.prompt, { label: t.label, phase: 'Oleada 2', model: 'opus', effort: 'xhigh', agentType: 'general-purpose' })
    .then((r) => { log(`${t.label}: terminado`); return { id: t.id, informe: r } })
))
return resultados
