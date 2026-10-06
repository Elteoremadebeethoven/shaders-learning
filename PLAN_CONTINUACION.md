# Plan de continuación del curso (estado al 2026-09-29, 22:30 — fin de la sesión 2)

La sesión 2 se paró a petición del dueño (pocos créditos). Todos los agentes se detuvieron; lo que hay en disco
es el estado real y está verificado (ver §5). Lo importante de la carpeta temporal se copió a `herramientas/`.

## 1. Estado

| Parte | Estado |
|---|---|
| 0 · Bienvenida | ✅ escrita · coherencia revisada |
| 1 · Fundamentos web (7) | ✅ escritas + revisadas + coherencia (m0–m2) |
| 2 · Animación (8) | ✅ escritas + revisadas + coherencia (m0–m2) |
| 3 · Matemáticas (7) | ✅ escritas + revisadas + coherencia (m3–m5) |
| 4 · GPU por dentro (6) + `python/` | ✅ escritas + revisadas + coherencia (m3–m5) |
| 5 · WebGL2 (10) | ✅ escritas + revisadas + coherencia (m3–m5) |
| 6 · GLSL (10) | ✅ escritas + revisadas a fondo (6.2–6.5 y 6.6–6.10) · ⚠️ coherencia m6 A MEDIAS (§3.2) |
| 7 · JS + shaders (7 + proyecto) | ✅ las 7 lecciones y `proyecto-final/` escritas y pasan `verificar.mjs` · ⚠️ revisión A MEDIAS (§3.1) |
| A.1 Bestiario | ✅ pasa verificación (254 casos, diagnóstico sin enlaces rotos) · ⚠️ falta añadir casos de m7 al diagnóstico (§3.4) |
| A.2 · A.3 · A.5 | ✅ escritos · ⚠️ coherencia a medias (§3.2) |
| A.4 Glosario | ✅ escrito (482 términos + 94 remisiones) · ⚠️ faltan términos de 7.3–7.7 (§3.5) |
| Auditoría de tiempos de GPU m2–m5 | ❌ sin hacer (§3.3) |

Enlaces: `node herramientas/enlaces.mjs` → 63 archivos, 3 232 enlaces internos, **0 rotos**. Índices regenerados
(`indexar.mjs`: 802 entradas, 254 casos de bestiario).

## 2. Cómo arrancar la próxima sesión

1. Lee este archivo, `CLAUDE.md` y `herramientas/GUIA_AUTORES.md` (§5.6 y §7 actualizados en esta sesión).
2. **Un solo Chrome headless a la vez (regla del dueño, MacBook Air sin ventilador):**
   - `herramientas/node_modules` ya tiene `puppeteer-core` parcheado (cola global en `herramientas/.chrome-turno`,
     cierre a los 8 min). Si falta `node_modules`: `cd herramientas && npm install` y copiar el parche de
     `herramientas/estado/PuppeteerNode.parcheado.js` sobre `node_modules/puppeteer-core/lib/puppeteer/node/PuppeteerNode.js`.
   - Arrancar el vigilante (mata un 2.º Chrome headless): `nohup herramientas/vigilante.sh >/dev/null 2>&1 & disown`.
   - **`verificar.mjs` usa UN Chrome para todos los archivos que le pases y la cola lo cierra a los 8 min:
     verifica en tandas de 3–4 lecciones** (ver `verif-pausa.sh` más abajo).
3. Agentes: el dueño autorizó hasta **10 Opus 5.5 en xhigh** a la vez. En este Mac (8 CPU) un Workflow ejecuta como
   mucho 6 agentes a la vez; para llegar a 10, dos workflows en paralelo. No enviar SendMessage a agentes que estén
   dentro de un Workflow (los interrumpe). Los encargos completos de esta sesión están en
   `herramientas/estado/workflows/` (curso-m7, curso-revision, curso-oleada2): reutiliza sus textos `COMUN`/`CHROME`.
4. Informes de todos los agentes: `herramientas/estado/informes/`.
5. Scripts de shell del proyecto: `herramientas/vigilante.sh` (vigilante de un solo Chrome headless: arrancarlo al
   empezar, matarlo al terminar con `pkill -f vigilante.sh`) y `herramientas/estado/verif-pausa.sh` (verificación por
   tandas de lo tocado al final de la sesión 2; plantilla para verificar en tandas). `.claude/supervisor/` (run.sh,
   sup.sh) NO es del curso: es un supervisor de procesos de otro proyecto (piezas de Manim, 2026-09-28); no usarlo aquí.

## 3. Pasos pendientes (en orden)

### 3.1 Terminar la revisión del módulo 7 (Opus xhigh; se puede repartir por lección)
- Los revisores de 7.3, 7.6 y 7.7 se pararon a mitad (hicieron algunos cambios; sin informe). 7.4 y 7.5 no se han
  revisado nunca (sus autores estaban en la verificación final: lecciones completas y verificadas, pero SIN informe
  de autor). 7.1 y 7.2 (sesión 1) tampoco se han revisado, ni `recursos/m7kit.js`.
- Informes de autor disponibles: `informe-m7-3.md`, `informe-m7-6.md`, `informe-m7-7.md`.
- Pendientes ya conocidos: 7.2 dice «los cuatro sistemas de coordenadas» (1.4 presenta cinco) y «como mucho un
  `pointermove` por frame» (falso: medido 31 en un frame, ver `coherencia-m0-m2.md` E2); 7.3 cita `clip-path`/
  `mask-image` en 2.2 (2.2 no los trata; 2.1 mide `clip-path`); 7.7 escribe «semiimplícito» (el curso: «semi-implícito»);
  comprobar con el método fiable los tiempos de GPU de 7.1, 7.4 y 7.5 (ver §4).
- Encargo de revisor: `PROMPT_REVISOR` en `herramientas/estado/workflows/curso-m7-*.js`.

### 3.2 Coherencia del módulo 6 + anexos A.2/A.3/A.5 (relanzar)
El agente se paró tras ~20 min: ya había editado las 10 lecciones de m6 y A.2/A.3/A.5 (todo verificado después, §5),
pero sin terminar ni dejar informe. Relanzar con el mismo encargo (`curso-oleada2-*.js`, tarea `coh-m6`), pidiéndole
que primero compruebe qué puntos de su lista ya están hechos. Lista: 6.1 l.~1199 (explicación de los 43 682 fallos de
`mod`), textos de `isnan`/caché en 6.1/6.2/6.5/6.6, 6.8 `texelFetch` fuera de rango (WebGL2 devuelve 0), bestiarios de
6.x duplicados de 3.x (m6a-orden-espacio y m6b-rot-al-reves ya son notas), títulos citados que no coinciden, dithering
de 6.4, `smoothstep` invertido en la demo «iMouse, visualizado» y en 6.10.4, A.3 `finish()` (en Chrome no espera),
coherencia general m6 ↔ m3–m5.

### 3.3 Auditoría de tiempos de GPU m2–m5 + pendientes m0–m5 (relanzar)
No llegó a editar nada. Mismo encargo (`curso-oleada2-*.js`, tarea `tiempos`): re-medir con el método fiable toda cifra
de trabajo de GPU de m2–m5; y pendientes: 1.1 l.~692 (`clear` es 5.1), 5.3 l.~658 (enlace GC → 1.3/2.1), 5.6 l.~526
(`passive` en el canvas), textos de `isnan`/caché en 3.3, 3.7 y 5.10 (en WebGL crudo la caché SÍ actúa), títulos citados.

### 3.4 A.1 Bestiario
Ejecutar `indexar.mjs` tras 3.1–3.3 y añadir al «Diagnóstico rápido por síntoma» los casos de m7 (prefijos m7-, m7-3-…
m7-7-). La página avisa en consola si el diagnóstico enlaza a un caso inexistente (el verificador lo detecta).

### 3.5 A.4 Glosario
Añadir los términos de 7.3–7.7 donde marca `<!-- M7-PENDIENTE -->` (listas en la sección 7 de `informe-m7-*.md`; para
7.4 y 7.5 extraerlos de las lecciones) y los enlaces a 7.x marcados en 8 entradas.

### 3.6 Coherencia del módulo 7 (y m6 ↔ m7)
Como las de esta sesión (encargo `coh-web`/`coh-gpu` de `curso-revision-*.js` adaptado): contradicciones, promesas,
repeticiones, notación, enlaces.

### 3.7 Pasada final del lead
1. `node herramientas/indexar.mjs` y `node herramientas/enlaces.mjs`.
2. Verificar TODO en tandas de 3–4 archivos (`verificar.mjs … --soluciones`) + `movil.mjs` (390 px).
3. Revisión visual de varias lecciones en el Chrome del dueño (extensión Claude in Chrome; servir con
   `python3 -m http.server 8765 --bind 127.0.0.1`, la extensión no abre file://).
4. Actualizar README.md e informar al dueño.

## 4. Hecho en la sesión 2 y hallazgos a recordar
- Módulo 7 escrito (7.3–7.7 + `proyecto-final/`: index.html, motor.js, hero.js, shaders.js, estilos.css).
- Revisión a fondo de 6.2–6.10, coherencia m0–m2 y m3–m5 (9 bestiarios duplicados convertidos en notas que conservan
  su `id`), glosario A.4.
- **isnan y la caché de programas de Chrome**: un `isnan()`/`isinf()` desactiva el fast math de ANGLE/Metal SOLO en la
  primera compilación de ese texto; después la caché (memoria y disco) devuelve la versión con fast math. Arreglo del
  lead en `Curso.glCompartido.compilar` (playground-glsl.js, lo usa también el graficador): a los shaders con
  isnan/isinf se les añade un comentario único → efecto reproducible (medido: 0 fallos siempre; en WebGL crudo, la
  2.ª compilación ya falla). Pruebas en `herramientas/estado/lab/` (lead-isnan.mjs + isnan-cache.html).
- **Tiempos de GPU**: en el M1 (GPU de teselas), dibujar N veces sobre el mismo framebuffer y dividir NO mide el
  trabajo. Método fiable: cada dibujo en su propia pasada (dos FBO alternos, clear), readPixels al final, mediana.
  Laboratorio: `herramientas/estado/lab/rev-m6b-lab.mjs` (`__tiempo2`). Muchas cifras de 6.6/6.8/6.9 eran 3–30× menores.
- `mod(x, 7.0)` con fast math falla solo en múltiplos negativos de 7 (≈6 de cada 10); el número depende del rango.
- Modo shadertoy de playground-glsl.js: `iMouse` con la semántica real de Shadertoy (probado: un solo frame con w>0),
  más iDate, iChannelResolution[4], iFrameRate, iChannelTime[4], iSampleRate. 6.10 actualizada (demo «iMouse, visualizado»).
- Deslizadores: más decimales con pasos < 0.001. `verificar.mjs --soluciones --capturas` guarda `<lección>-sol-N.png`.
  `indexar.mjs` ignora comentarios HTML. Nuevo `herramientas/enlaces.mjs` (enlaces y anclas sin Chrome).
- Decisiones anteriores siguen vigentes: contexto WebGL2 compartido por los playgrounds GLSL (límite ~16 contextos),
  iframes sandbox en otro proceso en Chrome real (`--aislar` en headless), `#version 300 es` en la línea 1.

## 5. Verificación al cerrar la sesión 2
- Sin problemas (`verificar.mjs --soluciones`): 6.1–6.10, 7.1–7.7, A.1, A.2, A.3, A.4 y A.5; enlaces: 0 rotos.
- `proyecto-final/index.html` sale como «✗ Curso.listo nunca se puso a true»: es lo esperado, porque es una página
  autónoma sin curso.js y el verificador espera a curso.js. Para comprobarla hace falta un script propio (excepciones
  y consola, 390 px, prefers-reduced-motion) — incluirlo en la revisión de 7.6 (§3.1).
- Al cerrar se detuvo el vigilante (`pkill -f vigilante.sh`): no queda ningún proceso del curso en marcha.
