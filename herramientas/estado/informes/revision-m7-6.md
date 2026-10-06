# Revisión m7-6 — 7.6 · Proyecto final: un hero interactivo (sesión 3, rev-m7-6)

Revisada desde cero la lección `modulos/07-integracion/06-proyecto-final.html` y toda la página autónoma
`modulos/07-integracion/proyecto-final/` (index.html, motor.js, hero.js, shaders.js, estilos.css).
Máquina: contenedor Linux sin GPU, Chromium 141 headless con SwiftShader (no sirve para tiempos de GPU).
Parada ordenada a petición del coordinador: ver «Dónde me quedé» al final.

## (a) Cambios hechos, con el porqué

### Lección `06-proyecto-final.html`
1. **Etapa 2, «El puntero: un remolino»**: decía que `Motor.Puntero` es «el `M7.Puntero` de 7.2 sin cambios». Falso: no tiene `pulsado` ni `nx/ny`, `aGL` no acepta x/y y añade `enReposo()`. Ahora lo dice así.
2. **Anotado de la transición (línea `n = clamp(...)`)**: «como verás en el bestiario» → no hay bestiario de eso en 7.6 (está en 7.3, vía la nota): «como verás en la nota de abajo y en el ejercicio 7.6.1».
3. **«Una sola evaluación del flujo»**: «dos veces tres `mix`» era inexacto → «dos llamadas a `paleta` (un `smoothstep`, un `mix` y una suma cada una), nada al lado de los 48 hashes».
4. **«El progreso es un muelle»**: notación de 2.5 explícita: rigidez $k = 60$, amortiguamiento $c = 15{,}5$, masa $m = 1$, $\zeta = c/(2\sqrt{k\,m})$, $\omega_0 = \sqrt{k/m}$ (antes solo números).
5. **Caja senior `100svh`**: «La especificación recomienda que `vh` equivalga a la grande» no pude comprobarlo (sin acceso a la spec; creo que CSS Values 4 solo dice «grande, pequeña o intermedia») → «En los navegadores móviles actuales (Chrome en Android, Safari en iOS), `vh` equivale a la grande», que es lo que cuenta el artículo de web.dev enlazado.
6. **Decisiones discutibles**: «la pausa congela la entrada durante el primer segundo y medio» → «mientras dura (los primeros 1,7 s)» (`FIN_ENTRADA` = 900 + 800 ms).
7. **Tabla de pruebas WAAPI**: «en el Chrome de pruebas» → «(Apple M1; los costes son de esa máquina)» (regla de CLAUDE.md: cifras con hardware).
8. **Solución del ejercicio 7.6.4**: `gl.getUniform` «obliga a esperar a la GPU» → «como `getError`, obliga a esperar la respuesta del proceso de la GPU» (coherente con 5.10, que mide eso).
9. **Bloque «La forma del hero con motor.js»**: añadido `calentamiento: 2000` (como el código final y la etapa 5) y `pedirFrame: () => bucle.pedirFrame()`; sin esa opción, con `bajoDemanda: true`, el `ResizeObserver` de la capa no despertaría al bucle dormido (el boceto enseñaba una forma que no funciona en reposo).
10. **Caja senior «Medir el coste en una GPU que cambia de marcha»**: añadida la relación con la caja «Cómo se mide lo que cuesta un shader» de 6.6 (`#medir-coste-shader`): la mezcla aditiva esquiva la misma trampa de la GPU de teselas que allí se resuelve con una pasada por dibujo. El método de capacidad NO es el engañoso del PLAN §4.
11. **Enunciado del ejercicio 7.6.4**: no coincidía con la solución («pedir la de destino no hace nada», «al terminar, la de destino pasa a ser la actual»). La solución reafirma el destino (y lo reanuda si iba de vuelta), anula lo encolado al pedir origen o destino, y al terminar la actual es aquella en la que paró el muelle. Enunciado reescrito para que coincida.
12. **«Un botón de pausa»**: el botón usaba `aria-pressed` y además cambiaba su texto a «Reanudar animación» (un lector diría «Reanudar animación, pulsado»; la APG de WAI-ARIA dice que un conmutador no debe cambiar de texto). Ahora el texto explica la regla: o texto que dice lo que hará (pausa) o texto fijo + `aria-pressed` (selector de diapositivas).
13. **«Movimiento reducido»**: nuevo párrafo sobre el fallo que encontré (ver hero.js): con la página abierta en movimiento reducido, `t` se queda en 0; al desactivar la preferencia la entrada volvía a su primer fotograma y el titular desaparecía y volvía a entrar (medido: opacidad 0,089 a los 0,4 s). Se explica la marca `estado.entradaVista`.

### Página autónoma `proyecto-final/`
- **hero.js**: (1) `estado.entradaVista` (la entrada se ve una vez; `u_entrada` usa la misma marca) — arregla el titular que reaparecía al desactivar el movimiento reducido (comprobado: opacidad mínima 1 tras el cambio). (2) Botón de pausa sin `aria-pressed`, con clase `pausado` para el icono y comentario del porqué. (3) Panel `?depurar`: no llama a `loseContext()` con el contexto ya perdido ni a `restoreContext()` sin perderlo (daban `WebGL: INVALID_OPERATION` en la consola; comprobado que desaparecen). (4) Comentario: `gl-perdido` y `sin-webgl` son ganchos que `estilos.css` no usa.
- **index.html**: botón de pausa sin `aria-pressed`; «un fbm deformado por otro fbm» → «por otros dos» (son dos para `q`); tabla: shaders.js «comentados línea a línea» → «en siete pasos».
- **estilos.css**: `.hero-pausa[aria-pressed="true"] .icono` → `.hero-pausa.pausado .icono`.
- **shaders.js**: comentario del paso 4: «la mitad / la otra mitad» → 55 % / 45 % (lo que hace el código) y «bestiario de la lección 7.6» → «bestiario de 7.3 y ejercicio 7.6.1», con la razón del `clamp`.
- motor.js: sin cambios (revisado entero: correcto; ver b-3 y d).

## (b) Problemas pendientes (sección y propuesta)
1. **Caja hack «Dale tus animaciones CSS al reloj»**: dice que la animación capturada «pasó a `'idle'` al activar el movimiento reducido». En este Chromium 141, con la animación CSS en pausa por script, tras `animation: none` la capturada seguía `'paused'` y seguía en `getAnimations()` (300 ms después); al volver a «sin preferencia» había 2 (la vieja y otra nueva `'running'`). La segunda mitad de la afirmación (se crea otra, en marcha) sí se confirma, y la recaptura funciona. Pendiente: repetir `herramientas/estado/lab/rev-m7-6-css-recreada.mjs` (polling a 50/500 ms, con y sin `pause()`) y, según el resultado, cambiar «pasó a `'idle'`» por lo observado (o decir que depende de si se pausó por script). Efecto práctico en el hero: ninguno (la vieja queda en pausa en 0).
2. **Accesibilidad del cambio de diapositiva** (`index.html`, `.diapositivas`): sin región viva, el lector no anuncia el texto nuevo al pulsar 01/02. Propuesta (patrón carrusel de la APG): `aria-live="polite"` en `.diapositivas` y una línea en «El texto y la accesibilidad». No lo hice: no puedo comprobar el anuncio en headless.
3. **Calidad adaptativa con GPUs muy lentas** (motor.js §5 `Calidad.medir`, igual en m7kit): descarta los intervalos > 250 ms, así que un equipo que dibuje a < 4 fps no baja nunca la resolución (visto en SwiftShader: 1440 × 900 a ~2–3 fps con calidad 1,00 fija). Propuesta: limitar el intervalo a 250 ms en vez de descartarlo (`Math.min(intervaloMs, 250)` para la media) o contar frames lentos consecutivos; decidirlo junto con 7.1.
4. Captura de la lección: con SwiftShader, varias capturas de `verificar.mjs` salen negras u oscuras (ejemplo 7.6.3, soluciones 2–4) porque el iframe aún no ha dibujado en 1,8 s; no es fallo de la lección (las pruebas de los ejercicios pasan, ver g).

## (c) Pendientes de medir en el M1
- Tabla de capacidad de la etapa 1 (0,43–0,54 / 1,7–2,1 / 4,2–5,6 / 5,6–8,3 ms; «unos 1,4 ms por megapíxel»): método válido (mezcla aditiva, nada se tapa), pero conviene contrastarlo con el método fiable `__tiempo2` de `herramientas/estado/lab/rev-m6b-lab.mjs`. Motivo: a partir de 6.6 (0,7 ms por octava en 4,2 MP ≈ 0,17 ms/MP por ruido) este shader de 13 ruidos daría ~2,2 ms/MP, 1,6 veces más que lo medido. De esa tabla salen «≈7 ms → ≈2 ms» (etapa 1 y checklist) y «3 ms en lugar de 5» (`pixelesMax`).
- Temporizador de GPU (2,5/5,7/9/12,4 ms) y la hipótesis del DVFS: el texto ya lo presenta como hipótesis; nada que cambiar sin medir.
- Compilación 43–78 ms / 2–3 ms, coste de 12/300 animaciones (< 0,1 / 0,9 ms), gesto táctil 504/0/500 px: cifras del M1, no reproducibles aquí (en este headless `Input.synthesizeScrollGesture` táctil no desplaza ni con `touch-action: auto`).

## (d) Problemas en archivos ajenos
- `modulos/07-integracion/recursos/m7kit.js`, `crearApp` → `tamañoObjetivo()` (l. ~155–163): mezcla `devicePixelContentBoxSize` con `devicePixelRatio`; con DPR emulado el búfer sale 1/DPR más pequeño. Comprobado aquí: con `deviceScaleFactor` 2 y 3, `devicePixelContentBoxSize` de un canvas de 390 × 300 px CSS = 390 × 300. Propuesta: la corrección de `motor.js` (si `|disp/anchoCSS − dpr| > 5 %`, usar `anchoCSS × dpr`).
- `m7kit.js`, `Calidad.medir` (l. ~78–80): mismo descarte de intervalos > 250 ms que b-3.
- `m7kit.js`, `fallar()`: no desconecta los observadores ni libera el contexto (ya lo dijo el autor).
- `herramientas/verificar.mjs` `--soluciones`: espera 1,8 s tras «Ver solución», así que no ve los ✓/✗ de pruebas a 2,5–8,4 s ni dibujos lentos en SwiftShader. Propuesta: opción `--espera-sol ms`.

## (e) Cajas bestiario de 7.6
| data-id | data-titulo | Síntoma (A.1) |
|---|---|---|
| `m7-6-hero-atrapa-scroll` | En el móvil no hay forma de pasar del hero: el scroll no funciona | eventos/puntero («Ratón, dedo, teclado») |
| `m7-6-texto-invisible` | El texto del hero no aparece nunca (sin JavaScript, sin WebGL o con movimiento reducido) | otro («Solo en otro equipo») |
| `m7-6-dpr-emulado` | En la emulación de móvil el fondo sale borroso (y en el móvil de verdad no) | borroso/pixelado («Borroso») |
| `m7-6-destello-negro` | Al cargar la página, el fondo aparece tras un instante en negro (o parpadea al recargar) | parpadeo («Parpadeo»; también «Pantalla negra») |

## (f) Glosario A.4 (sección 7 del autor, revisada y completada; anclas de la lección)
- **Hero** — sección que ocupa la primera pantalla de una página: titular, texto, botones y un fondo llamativo. `#el-encargo`
- **Velo (scrim)** — capa semitransparente oscura entre el fondo y el texto que garantiza el contraste se mueva lo que se mueva detrás. `#el-encargo`
- **Bucle de la página / capa WebGL opcional** — el rAF y el reloj pertenecen a la página (`crearBucle`); el canvas es una capa que puede faltar o fallar (`crearCapaGL`) sin detener el DOM. `#la-arquitectura-el-bucle-es-de-la-pagina-no-del-canvas`
- **Bucle bajo demanda** — solo pide el siguiente frame si algo se mueve; los eventos lo despiertan y el primer `dt` tras dormir vale 0. `#no-gastar-cuando-nadie-mira-ni-cuando-nada-se-mueve`
- **Dither (tramado)** — ruido fijo de ±0,5/255 que rompe las bandas de los degradados de 8 bits. `#etapa-1-el-fondo-un-flujo-de-ruido`
- **Medida por capacidad** — coste de un dibujo estimado repitiéndolo N veces por frame (con mezcla aditiva) hasta que deja de caber en el presupuesto. `#etapa-1-el-fondo-un-flujo-de-ruido`
- **Escalado dinámico de frecuencia (DVFS)** — la GPU cambia de frecuencia según la carga; un temporizador de GPU mide tiempo, no trabajo (hipótesis de la lección). `#etapa-1-el-fondo-un-flujo-de-ruido`
- **Umbral de transición** — número de 0 a 1 por píxel que decide cuándo cambia de imagen en una disolución o cortinilla. `#una-sola-evaluacion-del-flujo-dos-paletas`
- **Parallax** — capas que se desplazan a distinta velocidad con el scroll para sugerir profundidad. `#el-scroll-parallax-y-oscuridad`
- **svh / lvh / dvh** — altura de viewport pequeña (barras visibles), grande (barras escondidas) y dinámica. `#tamano-dpr-y-la-altura-del-movil`
- **inert** — atributo HTML que saca un bloque del foco, de la interacción y del árbol de accesibilidad. `#el-texto-y-la-accesibilidad`
- **aria-pressed** — estado de un botón conmutador («pulsado»/«no pulsado»); su texto no debe cambiar. `#el-texto-y-la-accesibilidad`, `#un-boton-de-pausa`
- **WCAG 2.2.2 (Pause, Stop, Hide)** — criterio A: el movimiento automático de más de 5 s junto a otro contenido debe poder pausarse. `#un-boton-de-pausa`
- **Animación en pausa colocada por el reloj** — WAAPI/CSSAnimation en `pause()` cuyo `currentTime` escribe el bucle (`t · 1000`). `#etapa-3-el-texto-con-el-mismo-reloj-que-el-shader`
- **Caché de programas** — el navegador (y el sistema) guardan los shaders compilados; recompilar el mismo texto es casi gratis. `#arrancar-sin-destello-negro`
- Ya existen y conviene enlazarles 7.6: `g-touch-action` (→ bestiario `m7-6-hero-atrapa-scroll`), `g-mejora-progresiva` (→ `#sin-webgl-sin-contexto-y-sin-javascript`), `g-prefers-reduced-motion` (→ `#movimiento-reducido`), `g-intersectionobserver`, `g-perdida-de-contexto`, `g-devicepixelcontentboxsize` (→ `#m7-6-dpr-emulado`).

## (g) Verificación final
- `verificar.mjs 06-proyecto-final.html --soluciones` (oscuro, con parte de las ediciones) y `--tema light` (con todas las ediciones de la lección): **0 problemas** (ejemplos 4, ejercicios 4, quiz 3, bestiario 4, senior 7, soluciones 4). Capturas oscuras revisadas (componentes, soluciones y tramos 1–8); las de tema claro no llegué a mirarlas.
- `movil.mjs`: lección y `index.html` sin scroll horizontal a 390 px. `enlaces.mjs`: 0 rotos (antes de las ediciones; los enlaces añadidos son `#medir-coste-shader`, existente).
- Ejercicios (script `rev-m7-6-experimentos.mjs`): partida falla y solución pasa en los cuatro (7.6.1: 2004/14 997 píxeles magenta → 0/0; 7.6.2 ✓✗✗ → ✓✓✓; 7.6.3 ✗✓✗ → ✓✓✓ con 0/43/0 frames; 7.6.4 ✗✓✓✓ → ✓✓✓✓).
- Afirmaciones comprobadas aquí: WAAPI (0,5 / 0 / 1 y `paused` / `CSSAnimation` / 500 ms sin `pause()` / 101,7 → 100 px), `inert` deja el foco en `body`, canvas `alpha:false` sin dibujar negro y `alpha:true` transparente, contexto perdido transparente (se ve la alternativa), `getContext('webgl2')` tras `'2d'` → `null` con «Canvas has an existing context of a different type», DPR emulado en px CSS.
- Página autónoma, `herramientas/estado/lab/rev-m7-6-proyecto.mjs` (última ejecución, con todas las ediciones; resultado en `rev-m7-6-proyecto-resultado.txt`): 0 excepciones y 0 errores/avisos inesperados en los 10 escenarios; 61 ✓ y 3 ✗, los tres del script, no de la página: (1) «pausa: dos capturas idénticas» — el bucle ya dormía (0 rAF) pero las capturas difieren; sin investigar; (2) búfer móvil 204 × 441 frente a 390 × 844 × 0,52: la calidad real es 0,522 y el panel redondea; falta tolerancia; (3) «de vuelta a reducido: flecha sin animación» — es el comportamiento de b-1 (la capturada sigue listada).

## Dónde me quedé (sesión 3)
**(a) Hecho y verificado**: todas las ediciones de la lección (verificar claro: 0 problemas; móvil OK); hero.js `entradaVista`, pausa sin `aria-pressed`, guardas de `?depurar`; index.html, estilos.css, shaders.js (QA de la página: 0 errores de consola/excepciones; `entradaVista` y la pausa comprobadas).
**(b) Hecho sin verificar tras la última edición**: nada de código. Pendiente solo: mirar las capturas de tema claro (se borrarán con el SCRATCH: regenerarlas con `verificar.mjs … --tema light --capturas`) y volver a pasar `node enlaces.mjs ../modulos/07-integracion/06-proyecto-final.html` (añadí un enlace a `../06-glsl/06-ruido.html#medir-coste-shader`, ancla que existe).
**(c) Pendiente, en orden**:
1. b-1: ejecutar `node herramientas/estado/lab/rev-m7-6-css-recreada.mjs` y corregir la frase «pasó a `'idle'`» de la caja hack de la etapa 3 según lo que salga.
2. `herramientas/estado/lab/rev-m7-6-proyecto.mjs`: tolerancia del 2 % en la prueba del búfer móvil; averiguar por qué difieren las dos capturas en pausa (¿transición CSS de `.listo`, hover?); en «de vuelta a reducido» comprobar solo que la flecha no se mueve (`currentTime` constante), no que no haya animaciones.
3. b-2 (`aria-live="polite"` en `.diapositivas` + una frase en «El texto y la accesibilidad»), si el lead lo aprueba.
4. b-3 y (d): decisión común con el revisor de m7kit (DPR emulado, intervalos > 250 ms en `Calidad`).
5. (c): medir en el M1 la tabla de capacidad con `__tiempo2`.
**(d) Scripts** (en `herramientas/estado/lab/`): `rev-m7-6-proyecto.mjs` (QA completa de la página autónoma, funciona en Mac y Linux), `rev-m7-6-experimentos.mjs` (+ `rev-m7-6-waapi.html`, `rev-m7-6-touch.html`: WAAPI, canvas, inert, DPR emulado, gesto táctil y pruebas de los 4 ejercicios), `rev-m7-6-css-recreada.mjs` (sin ejecutar con éxito: la cola de Chrome lo cortó; usa rutas absolutas de este contenedor), `rev-m7-6-proyecto-resultado.txt`. Copia de los originales previos a mis cambios: solo en el SCRATCH (se perderá); el diff está descrito en (a).
