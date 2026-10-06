# Informe m7-6 — Lección 7.6 · Proyecto final: un hero interactivo

## 1. Archivos creados

- `modulos/07-integracion/06-proyecto-final.html` — la lección (`data-leccion="07-integracion/proyecto-final"`).
- `modulos/07-integracion/proyecto-final/index.html` — la página autónoma: abre con doble clic (`file://`), sin internet, sin `curso.js` ni `assets/`, con enlace discreto de vuelta a la lección.
- `modulos/07-integracion/proyecto-final/estilos.css` — diseño, alternativa sin WebGL, velo de contraste, móvil, movimiento reducido.
- `modulos/07-integracion/proyecto-final/motor.js` — esqueleto reutilizable y sin dependencias: GL mínimo (compilar, `crearPrograma`, `uniforms`, `ponerUniform`), `Reloj`, `suavizar`, `Muelle`, `Puntero`, `Calidad`, **`crearBucle`** (el bucle de la página) y **`crearCapaGL`** (la capa WebGL opcional). La lección lo carga con `<script src="proyecto-final/motor.js">` y el propio archivo se registra en `Curso.libsIframe.motor` (dos líneas al final, inertes fuera del curso), así los playgrounds usan exactamente el archivo que el alumno copiará: `data-incluir="motor"`.
- `modulos/07-integracion/proyecto-final/shaders.js` — vertex y fragment shader del hero, comentados en 7 pasos.
- `modulos/07-integracion/proyecto-final/hero.js` — el hero en 8 secciones comentadas.
- No he creado `recursos/l76-*` (no hizo falta) ni he tocado 7.1, 7.2, `m7kit.js`, `m7.css`, `assets/**` ni otras lecciones.

## 2. Contenido y conteos

**7.6 · Proyecto final: un hero interactivo.** Una portada completa construida en 5 etapas: (1) fondo WebGL, domain warping de fbm (6.6) con coste medido; (2) puntero (remolino que gira el espacio) y scroll (parallax en el shader y en el DOM) con la tubería de 7.2; (3) contenido DOM animado con WAAPI en pausa y colocado cada frame con el reloj de la app (cumple la promesa de 7.1: `anim.currentTime = reloj.t * 1000`), latido sincronizado DOM + shader; (4) dos diapositivas con transición por umbral de ruido dibujada por el shader y guiada por un muelle crítico, interrumpible, con `inert`/`aria-pressed`; (5) robustez: DPR/tamaño/`100svh`, arranque sin destello negro, pausa fuera de pantalla y bucle bajo demanda (0 rAF en reposo), botón de pausa (WCAG 2.2.2), `prefers-reduced-motion` (tabla de qué cambia), alternativa sin WebGL, con el contexto perdido y sin JavaScript. Idea central de arquitectura: **el bucle es de la página, no del canvas** (`crearApp` de 7.1 partido en `crearBucle` + `crearCapaGL`), para que el DOM siga vivo si WebGL falta o falla. Cierra con la versión final (tour de archivos), revisión de la arquitectura (diagrama del frame, quién lee/escribe qué, decisiones discutibles, desmontaje en una SPA) y una checklist de rendimiento con cifras (`ul.m7-checklist` de m7.css).

Conteo: 4 ejemplos resueltos (7.6.1–7.6.4, uno por etapa, playgrounds JS con `data-incluir="motor"`) · 4 ejercicios (7.6.1 ★ GLSL con chivato en falso color; 7.6.2 ★★ «el título que no aparece»; 7.6.3 ★★ «dormir cuando nada se mueve»; 7.6.4 ★★★ «una tercera diapositiva»), todos con pistas, `data-solucion` y solución explicada, y los JS con pruebas automáticas en la consola · 3 quizzes repartidos (arquitectura, etapa 3, etapa 5) · 4 bestiario · 7 senior · 1 hack · 6 bloques anotados · 1 graficador · 2 diagramas SVG · resumen y «Para profundizar». ~9 000 palabras de texto sin contar código (verificar.mjs cuenta unas 15 700 con el código visible de los editores).

Comprobé además, con un script propio, que **el código de partida de cada ejercicio falla sus pruebas y la solución las pasa**: 7.6.1 (píxeles magenta del chivato con el progreso en 0 y en 1: 1988 y 15 002 → 0 y 0), 7.6.2 (✓✗✗ → ✓✓✓), 7.6.3 (✗✓✗ → ✓✓✓: 0 frames en reposo, 43 durante la transición), 7.6.4 (✗✓✓✓ → ✓✓✓✓).

## 3. data-id de bestiario

- `m7-6-hero-atrapa-scroll` — En el móvil no hay forma de pasar del hero: el scroll no funciona (`touch-action: none`).
- `m7-6-texto-invisible` — El texto del hero no aparece nunca (sin JavaScript, sin WebGL o con movimiento reducido).
- `m7-6-dpr-emulado` — En la emulación de móvil el fondo sale borroso (y en el móvil de verdad no).
- `m7-6-destello-negro` — Al cargar la página, el fondo aparece tras un instante en negro.

Un quinto candidato («quedan manchas al terminar la transición») lo retiré al ver que 7.3 ya tiene `m7-3-transicion-no-limpia` y `m7-3-disolucion-atascada`: la lección enlaza a esas fichas en una caja `nota` y el ejercicio 7.6.1 las practica.

## 4. Verificación

Todo en Apple M1, Chrome headless, ANGLE/Metal, siempre con el puppeteer-core parcheado (cola de un solo Chrome).

```
✓ ../modulos/07-integracion/06-proyecto-final.html
   glsl=1 js=7 graficador=1 demo=0 ejemplos=4 ejercicios=4 quiz=3 anotado=6 callouts=15 bestiario=4 senior=7 h2=11 pres=4 palabras=15703 soluciones=4
✗ ../modulos/07-integracion/proyecto-final/index.html
   - excepción: Curso.listo nunca se puso a true (¿falta curso.js o hubo un error al iniciar?)   ← esperado: la página autónoma no usa curso.js
```
- Lección: sin problemas en tema oscuro y en `--tema light` (`--soluciones`, capturas de los 9 componentes y 47 tramos de página revisados con Read). Sin enlaces rotos (7.3 y 7.7 ya existen).
- Página autónoma: sin errores de consola ni excepciones (el único aviso, `[capa GL] sin WebGL2 (Canvas has an existing context of a different type)`, sale solo con `?sinwebgl`, a propósito).
- `movil.mjs` (390 px): `✓ 06-proyecto-final.html scrollWidth=390 / 390` y `✓ index.html scrollWidth=390 / 390`.
- QA propia de la página autónoma (`scratchpad/qa/m7-6-final.mjs`): escritorio 1440 × 900 (búfer 1440 × 900 en tres cargas; transición, remolino, scroll); **0 llamadas a rAF en 2 s con el hero fuera de pantalla** y 60/s al volver; **movimiento reducido emulado** (`page.emulateMediaFeatures`): título visible (opacidad 1), fondo quieto, **0 rAF en 2 s de reposo**, y al volver a «sin preferencia» la animación CSS recapturada queda en pausa; `?sinwebgl`: clase `sin-webgl`, canvas retirado, texto visible, la alternativa sigue a la transición; `?depurar`: perder/recuperar contexto (el bucle sigue a 60 fps, se ve la alternativa, vuelve a dibujar); sin JavaScript: texto visible, 2.ª diapositiva oculta, selector y pausa ocultos; DPR 2 emulado: búfer 1440 × 900 (DPR 1, como se pide); móvil 390 × 800 a DPR 3 emulado: búfer 390 × 800, sin desbordamiento horizontal. **Contraste** medido ocultando el texto (percentil 99 del fondo): titular Tinta 13,6:1, titular Brasas 7,7:1, entradillas > 10:1.
- Experimentos que sostienen las cifras de la lección (páginas en `scratchpad/experimentos/m7-6/`, scripts `scratchpad/qa/m7-6-exp1..3.mjs`): coste del shader por capacidad (N pasadas por frame hasta no caber en 16,7 ms: ~1,4 ms/MP; 1440 × 900 → 1,7–2,1 ms; 2880 × 1800 → 5,6–8,3 ms) frente al temporizador de GPU (incoherente: 2,5/5,7/9/12,4 ms); canvas `alpha:false` sin dibujar = negro; contexto perdido = transparente (3 variantes); compilación fría 43–78 ms / en caché 2–3 ms; WAAPI en pausa + `currentTime` (estilo síncrono, `fill: 'backwards'`, `CSSAnimation` capturable, sin `pause()` sigue sola, escribir en marcha gana en el frame: 101,7 → 100 px); coste de colocar 12/300 animaciones por frame (< 0,1 / 0,9 ms); CSS recreada «running» al cambiar la media query; `inert` bloquea el foco; `touch-action` auto/none/pan-y con gesto táctil sintético (504/0/500 px); `devicePixelContentBoxSize` bajo emulación de DPR (px CSS); `addEventListener` con `signal`; WCAG 2.2.2 consultado en w3.org.
- No he ejecutado `node herramientas/indexar.mjs`: escribe en `assets/js/` y hay otros autores trabajando; queda para la pasada final (el bestiario nuevo necesita reindexar).

## 5. Problemas conocidos / no comprobado

- **Barras del navegador móvil (`svh`/`dvh`)**: la explicación de por qué `100svh` evita redimensionar el canvas a mitad de gesto sigue la especificación (y el artículo de web.dev); en Chrome headless solo pude comprobar que acepta `svh` y `dvh` (`CSS.supports`), no el comportamiento de las barras. La lección lo dice.
- **Emulación de DPR**: medido con la emulación de Puppeteer (`Emulation.setDeviceMetricsOverride`): `devicePixelContentBoxSize` devuelve px CSS aunque `devicePixelRatio` sea 2 o 3. No lo comprobé en la interfaz del modo dispositivo de DevTools (usa el mismo mecanismo, pero no lo afirmo) ni en un móvil real. `motor.js` lo corrige; `m7kit` no (ver §6).
- **Caché de compilación**: la primera compilación de una variante nueva del shader costó 43–78 ms y las siguientes 2–3 ms, **incluso en una sesión de Chrome nueva con perfil temporal**; lo atribuyo (con cautela, en el texto dice «apunta a») a una caché del sistema (compilador de Metal), no lo verifiqué más.
- **Temporizador de GPU**: la interpretación de que las cifras incoherentes de `EXT_disjoint_timer_query_webgl2` se deben al escalado de frecuencia de la GPU es una hipótesis (la lección dice «lo más probable»); la medida por capacidad (N pasadas hasta no caber en 16,7 ms) sí es sólida y proporcional a los píxeles.
- **Artefacto sin explicar**: en una página sintética con un canvas a pantalla completa (sin nada más), tras `loseContext()` la captura salió blanca con un icono de imagen rota; en la página con el canvas dentro de una caja con degradado, y en el hero real, el canvas perdido es transparente y se ve la alternativa (lo que afirma la lección, medido en 3 variantes y visto en la captura del hero con `?depurar`). No afecta al proyecto.
- **Tacto real**: el remolino con el dedo (hasta el `pointercancel` del scroll) y el gesto táctil se comprobaron con eventos sintéticos del protocolo de depuración, no con un dispositivo.
- **7.3 aún en escritura**: enlazo a sus fichas `#m7-3-transicion-no-limpia`, `#m7-3-disolucion-atascada` y `#m7-3-muelle-quema` y a la lección en general (no a secciones por su título, que puede cambiar). Si su autor renombra esos `data-id`, habrá que actualizar tres enlaces. También cito que 7.3 hace avanzar sus transiciones con `dt` (el hero usa `dtReal`, decisión discutible explicada) y adopto su «contrato» (`fijar()` del muelle en reposo).
- **Enlaces a 7.7** (`07-siguientes-pasos.html`) y 7.3: existían al verificar.

## 6. Sugerencias para componentes compartidos

1. **`m7kit.js` · `crearApp` · `tamañoObjetivo()`** (bug solo visible con emulación de DPR): mezcla los px de dispositivo del `ResizeObserver` (`devicePixelContentBoxSize`) con `window.devicePixelRatio` para aplicar `dprMax`. Con la emulación de DPR de Puppeteer/DevTools el observador devuelve px CSS y el búfer sale `1/dpr` más pequeño de lo previsto (medido en el hero con la misma lógica: 130 × 267 en vez de 390 × 800 a DPR 3; 720 × 450 en vez de 1440 × 900 a DPR 2). Propuesta (la que usa `motor.js`):
   ```js
   let dw = dispAncho, dh = dispAlto;
   if (app.anchoCSS > 0 && Math.abs(dw / app.anchoCSS - dpr) > 0.05 * dpr) {
     dw = Math.round(app.anchoCSS * dpr); dh = Math.round(app.altoCSS * dpr);
   }
   let w = dw * f, h = dh * f;   // en lugar de dispAncho * f, dispAlto * f
   ```
   El patrón de 5.1 (asignar `devicePixelContentBoxSize` tal cual) no mezcla fuentes, pero también da un búfer de 1 px por px CSS bajo emulación: quizá merezca una línea en 5.1.
2. **`m7kit.js` · `crearApp` · `fallar()`**: no desconecta el `ResizeObserver` ni el `IntersectionObserver` ni libera el contexto; en una página que recrea apps (como el ejemplo 7.1.5, que sí llama a `destruir` antes) no importa, pero `fallar` podría llamar a `destruir()` al final.
3. **`verificar.mjs` / `movil.mjs` con páginas autónomas**: ambos esperan `Curso.listo`; en `proyecto-final/index.html` verificar informa «Curso.listo nunca se puso a true» (esperado) y `movil.mjs` espera 15 s antes de medir. Sugerencia: una opción `--autonoma` que no espere a `Curso` y que siga informando de excepciones y errores de consola.
4. **`playground-js.js`**: el mecanismo `Curso.libsIframe` (que ya usa `m7kit`) permite que una lección registre librerías propias para `data-incluir`; convendría documentarlo en la guía (§5.7), porque es la forma limpia de inyectar helpers de módulo en los iframes.

## 7. Glosario

- **Hero**: sección que ocupa la primera pantalla de una página (titular, texto, botones y un fondo llamativo).
- **Capa WebGL opcional**: canvas WebGL cuyo fallo o ausencia no detiene la página; el bucle y el reloj pertenecen a la página.
- **Bucle bajo demanda**: bucle de animación que solo pide el siguiente frame si algo se mueve y se duerme en reposo; los eventos lo despiertan.
- **Dither (tramado)**: ruido de medio escalón de cuantización (±0,5/255) que rompe las bandas de los degradados de 8 bits.
- **Umbral de transición**: número de 0 a 1 por píxel que decide cuándo cambia de imagen en una transición por disolución o cortinilla.
- **svh / lvh / dvh**: alturas de viewport pequeña (barras visibles), grande (barras escondidas) y dinámica (sigue a las barras) en navegadores móviles.
- **inert**: atributo HTML que saca un bloque del orden de tabulación, de la interacción y del árbol de accesibilidad.
- **aria-pressed**: atributo ARIA de un botón conmutador; el lector de pantalla lo anuncia como «pulsado» o «no pulsado».
- **touch-action**: propiedad CSS que decide qué gestos táctiles gestiona el navegador (desplazar, ampliar) y cuáles recibe la página.
- **WCAG 2.2.2 (Pause, Stop, Hide)**: criterio de nivel A: todo movimiento automático de más de 5 s junto a otro contenido debe poder pausarse, detenerse u ocultarse.
- **Escalado dinámico de frecuencia (DVFS)**: la GPU cambia de frecuencia según la carga; por eso un temporizador de GPU mide tiempo, no trabajo.
- **Caché de programas (shaders)**: el navegador y el sistema guardan los shaders ya compilados; volver a compilar el mismo código es casi gratis.
- **Medida por capacidad**: estimar el coste real de un dibujo repitiéndolo N veces por frame hasta que deja de caber en el presupuesto.
