# Reglas comunes para los agentes de la sesión 5 — auditoría final (léelas enteras)

RAÍZ DEL CURSO: /Users/alex/Projects/shaders
SCRATCH: /private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/s5/<tu-id>/
(créala; ahí van tus notas, experimentos y capturas. Lo que haya que conservar va a herramientas/estado/lab/ con tu prefijo `s5-<tu-id>-`).

## Lecturas obligatorias
- CLAUDE.md, PLAN_CONTINUACION.md (estado; §4 son hechos medidos que debes respetar) y herramientas/GUIA_AUTORES.md ENTERA
  (plantilla, componentes, §5.6 isnan/caché y tiempos de GPU, §6 mínimos, §7 verificación).
- Manifest (números y títulos oficiales de las lecciones): assets/js/manifest.js
- Los informes de la sesión 4 de tus archivos (herramientas/estado/informes/sesion4-*.md) y el cierre del lead
  (`sesion4-lead-cierre.md`): no deshagas lo que ya se midió y decidió allí.

## Máquina de esta sesión: el Mac del dueño
- MacBook Air **Apple M1, SIN VENTILADOR**, 8 CPU, macOS. Chrome 154.0.8037.98 con GPU real (ANGLE/Metal).
  Es la máquina de referencia de las cifras del curso: aquí SÍ se miden tiempos de GPU y comportamientos de ANGLE/Metal
  (fast math, isnan y caché de programas, mediump, límites…). Todo lo que la sesión 3 dejó «pendiente de medir en el M1» se
  mide ahora. Cita las cifras así: «Apple M1, Chrome 154, ANGLE/Metal».
- Scripts de la sesión 3 en `herramientas/estado/lab/` pueden traer rutas de Linux (`/home/user/shaders-learning`,
  `/opt/pw-browsers/chromium`): cámbialas por la raíz de arriba y por
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` con
  `args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]` (los de `verificar.mjs`).
- **Dos trampas de medida descubiertas en la sesión 4** (GUIA §5.6):
  1. *CPU en frío*: tras ≥ 0,2 s de reposo, los primeros ~100 ms de cálculo van 2–3× más lentos (el reloj sube en
     rampa). Un playground que cronometra pocos ms de JS justo al pulsar «Ejecutar» mide la CPU a medio gas
     (caja `m4-cpu-en-frio` de 4.1). Calentar ≥ 0,15 s con trabajo de verdad y medir ventanas de decenas de ms.
  2. *fps en headless*: para lo limitado por la GPU, comprueba los fps con un `readPixels` de 1 píxel al final de
     cada frame (obliga a esperar a la GPU) antes de creer un «60 fps». No lances Chrome con ventana
     (`headless:false`): si una medida lo necesita, pídela al lead en el tablón.

## PROCESOS PESADOS: pide permiso SIEMPRE (regla del dueño: como mucho 2 a la vez; el Mac se calienta)
Son pesados: todo Chrome headless (verificar.mjs, movil.mjs, tus scripts con puppeteer), los laboratorios de tiempos de GPU,
los scripts de Python que dibujan con OpenGL (moderngl/PyOpenGL) y cualquier cosa que tenga una CPU al 100 % más de ~1 min.
**Se piden al portero `herramientas/turnos.mjs`**, que concede como mucho 2 a la vez y anota cada petición en
`herramientas/.turnos.log` (el lead lo vigila). Siempre con tu nombre y un motivo concreto:

    cd /Users/alex/Projects/shaders/herramientas
    node turnos.mjs --agente <tu-id> --motivo "verificar 7.4 (oscuro, soluciones)" -- node verificar.mjs ../modulos/07-integracion/04-vertex-animacion.html --soluciones --capturas <SCRATCH>/cap
    node turnos.mjs --agente <tu-id> --motivo "movil 7.4" -- node movil.mjs ../modulos/07-integracion/04-vertex-animacion.html
    node turnos.mjs --agente <tu-id> --motivo "mi script de QA de 7.4" -- node <SCRATCH>/qa.mjs

- **Tiempos de GPU: con `--exclusivo`** (toma los dos turnos: nadie más usa la GPU mientras mides; si no, las cifras no valen):
  `node turnos.mjs --exclusivo --max-min 15 --agente <tu-id> --motivo "tiempos de GPU de 7.5" -- node <lab>.mjs`.
  Que el laboratorio sea corto (minutos, no decenas de minutos) y que no haga nada más que medir.
- «[turnos] esperando turno…» es normal: espera (no lo mates, no lo saltes). El comando se corta a los 12 min
  (`--max-min M` hasta 25 para laboratorios largos). `node turnos.mjs --estado` dice quién tiene los turnos.
- Un comando = UN Chrome a la vez (nunca dos `puppeteer.launch` simultáneos en el mismo script); cierra siempre el navegador;
  agrupa comprobaciones; a `verificar.mjs` no le pases más de 3–4 archivos por llamada.
- Tus scripts importan el puppeteer parcheado con ruta absoluta:
  `import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";`
  Nunca ejecutes el binario de Chrome directamente, ni instales otro navegador/puppeteer/playwright, ni abras el Chrome del dueño.
- No hace falta turno para lo ligero: `node enlaces.mjs`, `node --check`, grep, scripts de Node sin Chrome que tarden segundos.
- Hay un vigilante que termina cualquier Chrome headless que pase de 2: si te salta la cola, perderás la ejecución.
- Verificador: `node verificar.mjs <archivos> [--soluciones] [--capturas dir] [--tema light] [--pagina dir] [--aislar] [--json]`.
  Mira las capturas con la herramienta Read (¿se ve lo que el texto dice que se ve?).

## Agentes: PROHIBIDO crear subagentes
- El dueño fija cuántos agentes hay EN TOTAL (sesión 5: 2 Opus + 1 Sonnet). No uses el tool Agent (tampoco forks)
  ni Workflow: cada ayudante que crees cuenta contra ese límite. Haz tu encargo tú solo.

## Archivos, git y coordinación
- Modifica SOLO los archivos que te asigna tu encargo: otros 3 agentes editan otros archivos A LA VEZ.
- **Tablón**: `herramientas/estado/informes/sesion5-tablon.md`. Si encuentras algo que cambiar en un archivo que no es tuyo,
  AÑADE al final (no reescribas el archivo; usa una edición que solo añada) una entrada:
  `- [PARA <agente o lead>] (de <tu-id>) archivo, sección/línea: problema → cambio concreto propuesto (texto exacto si es texto).`
  Léelo al empezar, a mitad y antes de terminar, y aplica lo que esté dirigido a ti (marca la entrada añadiendo ` — HECHO (<tu-id>)`
  al final de su línea). Agentes: `opus-a`, `opus-b`, `sonnet` (y `lead` para assets/**, herramientas/**, README, PLAN).
- PROHIBIDO cualquier git que cambie estado (`checkout`, `restore`, `stash`, `reset`, `commit`, `add`, `clean`): borrarías el
  trabajo de otros. `git diff`/`git log`/`git show` sí.
- Nunca edites assets/**, assets/js/manifest.js ni herramientas/** (salvo tu informe, el tablón y tus scripts en
  herramientas/estado/lab/ con prefijo `s5-<tu-id>-`), salvo que tu encargo lo diga expresamente.
- No ejecutes `node herramientas/indexar.mjs` (lo hace el lead al final). `enlaces.mjs` sí.
- No uses las herramientas de navegador de la extensión Claude in Chrome: son el Chrome personal del dueño y las usa el lead.
- Reglas técnicas del curso: funciona con file:// y sin internet (nada de módulos ES, import, fetch local, CDNs ni imágenes
  externas como texturas). Cajas bestiario con data-id único (prefijo mN-) y data-titulo. Una caja que pasa a nota conserva
  su `id` (sin `data-id`) para que los enlaces sigan funcionando (así se hizo en la sesión 2).

## Criterio
- No puedes preguntar al dueño: decide con criterio y anota las decisiones discutibles en tu informe.
- Objetivo del curso (dueño): entender al 100 % qué está sucediendo —cada comando, cada comportamiento raro, cada detalle que
  separa a un junior de un senior—, nivel básico-intermedio, con muchos ejemplos resueltos y ejercicios. Tono: español neutro,
  tuteo, preciso, sin relleno. Coherencia con lo que ya enseña el curso (notación, nombres, cifras).
- Comprueba empíricamente en este Chrome (M1) cada afirmación técnica que corrijas. Métodos de medida de la guía §5.6
  (tiempos de GPU: cada dibujo en su propia pasada —dos FBO alternos con clear—, readPixels al final, mediana de varias tandas;
  ver `herramientas/estado/lab/rev-m6b-lab.mjs`, función `__tiempo2`). Cifras con hardware y método.
- Calidad antes que velocidad, pero termina. **Informe obligatorio**: `herramientas/estado/informes/sesion5-<tu-id>.md` con
  (a) cambios hechos y porqué, (b) mediciones (método, cifra antigua → nueva), (c) verificación final (comandos y resultado),
  (d) pendientes y decisiones discutibles. Ve escribiéndolo mientras trabajas (si te paran, que quede el progreso), y lleva
  notas en SCRATCH/notas.md si tu contexto se llena.
- Al terminar, tus archivos deben pasar: `verificar.mjs --soluciones` (oscuro), `--tema light`, `movil.mjs` y `enlaces.mjs`,
  verificados DESPUÉS de tu última edición. Tu respuesta final al lead: un resumen breve (≤ 25 líneas) de lo hecho, lo
  verificado y lo que queda; el detalle va en el informe.
