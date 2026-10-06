# Reglas comunes para los agentes de la sesión 3 (léelas enteras)

RAÍZ DEL CURSO: /home/user/shaders-learning   (la guía y los informes antiguos dicen /Users/alex/Projects/shaders: es la misma carpeta en el Mac del dueño; tradúcelo).
SCRATCH: <scratchpad de la sesión>/agentes/<tu-id>/  (créala; ahí van tus notas, experimentos y capturas; se borra al acabar la sesión: lo que haya que conservar va a herramientas/estado/lab/ con tu prefijo).

## Lecturas obligatorias
- /home/user/shaders-learning/CLAUDE.md y /home/user/shaders-learning/PLAN_CONTINUACION.md (estado y hallazgos de la sesión 2; §4 son hechos medidos en el M1 que debes respetar).
- /home/user/shaders-learning/herramientas/GUIA_AUTORES.md ENTERA (tu contrato: plantilla, componentes, §5.6 isnan/tiempos de GPU, §6 mínimos, §7 verificación).
- Manifest (números y títulos oficiales de las lecciones): /home/user/shaders-learning/assets/js/manifest.js

## Máquina de esta sesión (¡distinta de la del dueño!)
- Contenedor Linux, 4 CPU, SIN GPU. Chrome = Chromium 141 headless con WebGL por SwiftShader (software). Sirve para comprobar que todo compila, se ejecuta, se ve bien, que la semántica de WebGL/GLSL/JS/DOM es la que dice el texto, y para medir cosas de CPU/JS.
- NO sirve para medir tiempos de GPU, ni para reproducir comportamientos propios de ANGLE/Metal o de la GPU de teselas del M1 (fast math, isnan y la caché de programas, precisión de mediump, `mod(x,7.0)` con fast math, límites como MAX_TEXTURE_SIZE del M1…). Las cifras del curso se midieron en un Apple M1 (Chrome, ANGLE/Metal): NO las sustituyas por cifras de SwiftShader. Si una cifra o afirmación dependiente del M1 te parece sospechosa, razónalo (código del experimento, método) y anótalo en tu informe como «pendiente de medir en el M1» con la propuesta; corrígela en el texto solo si el error es demostrable sin el M1 (p. ej. un método de medida que el §4 del plan ya declaró engañoso, una cuenta mal hecha, una contradicción con otra lección que sí midió bien).
- Un fallo que solo aparece por SwiftShader (p. ej. un límite menor, una extensión que falta, lentitud) NO es un fallo de la lección: anótalo y sigue.

## Chrome: compártelo
- Lanza Chrome SOLO a través del puppeteer-core de /home/user/shaders-learning/herramientas/node_modules (está parcheado: cola global de 2 Chrome a la vez para toda la máquina; «[turno-chrome] esperando turno» es normal: espera; cada sesión se cierra sola a los 10 min).
  - Verificador: `cd /home/user/shaders-learning/herramientas && node verificar.mjs <archivo.html> [más…] --soluciones --capturas <SCRATCH>/capturas` (opciones: `--pagina dir`, `--tema light`, `--aislar`, `--json`). ~1 min por lección con SwiftShader: no le pases más de 3–4 archivos por llamada.
  - Móvil (390 px): `node movil.mjs <archivo.html>`. Enlaces y anclas sin Chrome: `node enlaces.mjs [archivos…]`.
  - Scripts propios: guárdalos en tu SCRATCH e importa con ruta absoluta:
    `import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";`
    y lanza con `executablePath: "/opt/pw-browsers/chromium", headless: "new", args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]`. Cierra siempre el navegador. Agrupa comprobaciones.
  - Nunca ejecutes el binario de Chrome directamente ni instales otro navegador/puppeteer/playwright.
- Mira las capturas con la herramienta Read (¿se ve lo que el texto dice que se ve?).

## Archivos y git
- Modifica SOLO los archivos que te asigna tu encargo. Otros agentes editan otros archivos A LA VEZ.
- PROHIBIDO cualquier git que cambie estado: nada de `git checkout`, `git restore`, `git stash`, `git reset`, `git commit`, `git add`, `git clean` (borrarías el trabajo de otros). `git diff`/`git log`/`git show` sí (útil: `git diff <archivo>` para ver lo que cambiaron los revisores que se pararon a medias; el commit base es el estado al cerrar la sesión 2).
- Nunca edites assets/**, index.html, assets/js/manifest.js, herramientas/** (salvo tu informe) ni archivos de otros módulos/lecciones: si encuentras un bug en un componente compartido o en otro archivo, descríbelo en tu informe con archivo, sección/línea y propuesta concreta.
- No ejecutes `node herramientas/indexar.mjs` (lo hace el lead al final); `enlaces.mjs` y `verificar.mjs` sí.
- Reglas técnicas del curso: funciona con file:// y sin internet (nada de módulos ES, import, fetch local, CDNs ni imágenes externas como texturas). Cajas bestiario con data-id único (prefijo mN-) y data-titulo.

## Criterio
- No puedes preguntar al dueño: decide con criterio y anota las decisiones discutibles en tu informe.
- Objetivo del curso (dueño): entender al 100 % qué está sucediendo —cada comando, cada comportamiento raro, cada detalle que separa a un junior de un senior—, nivel básico-intermedio, con muchos ejemplos resueltos y ejercicios. Tono: español neutro, tuteo, preciso, sin relleno.
- Corrige directamente lo que sea claro y local. Reescribe una sección entera solo si es imprescindible para la exactitud; si no, descríbelo en el informe.
- Comprueba empíricamente (en este Chromium) cada afirmación técnica que corrijas y que no dependa del M1.
- Calidad antes que velocidad, pero termina: el informe es obligatorio. Si tu contexto se llena, apunta el progreso en SCRATCH/notas.md para no perder el hilo.
