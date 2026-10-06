# Informe de coherencia · módulos 0–2 («web y animación»)

Revisor de coherencia del tramo 0.1, 1.1–1.7 y 2.1–2.8. Solo he modificado HTML de `modulos/00-inicio/`, `modulos/01-web/` y `modulos/02-animacion/`. No he tocado `assets/**`, `index.html`, el manifest ni archivos de otros módulos.

Todas las cifras nuevas se midieron en Chrome 154.0.8037.92 headless, en un Apple M1 con ANGLE/Metal, a través del puppeteer-core parcheado (cola de un solo Chrome).

## 1. Método

- Leí las 16 lecciones en orden y apunté, lección por lección, definiciones, cifras, promesas, términos y `data-id` en `scratchpad/experimentos/coh-web/mapa.md`. Después crucé las notas.
- Scripts propios en `scratchpad/qa/`:
  - `coh-web-enlaces.mjs` (sin Chrome): comprueba todos los `href` internos, archivo y `#ancla`. Los ids se calculan como los genera `curso.js`: `id` explícitos, `data-id` de los callouts y slugs automáticos de h2/h3. Con `--entrantes` lista los enlaces de otros módulos hacia m0–m2, y también avisa si un enlace con texto «N.M» apunta a otra lección que la N.M del manifest.
  - `coh-web-texto.mjs`: pasa una lección a texto compacto para leerla.
  - `coh-web-exp1.mjs`, `coh-web-exp2.mjs` y `coh-web-exp3.mjs`: los experimentos en Chrome, agrupados (5 lanzamientos en total, más 5 tandas de `verificar.mjs`).
- Comprobé la unicidad de los `data-id` de bestiario en todo el curso con un grep global: 245 ids y ningún duplicado. La caja de demostración de 0.1 no tiene `data-id` a propósito, y `indexar.mjs` ya la omite.

## 2. Experimentos (M1, Chrome 154, ANGLE/Metal)

| # | Qué | Resultado | Uso |
|---|---|---|---|
| E1 | `wheel` con `preventDefault` en `window` y en un `div` sin opciones | En `window`: `cancelable=false`, se ignora y la página se desplaza. En el `div`: `cancelable=true`, `defaultPrevented=true` y la página no se desplaza. Con `passive:false`, igual que el `div`. | Confirma 1.4. Contradice una frase de 5.6 (§5). |
| E2 | 60 `mouseMoved` (CDP) lanzados de golpe sobre un `div`, en `file://` | 31 `pointermove` en **un solo frame**. Sus `getCoalescedEvents()` suman exactamente 60. Enviados uno a uno (esperando cada envío), 1 por frame. `getCoalescedEvents` y `getPredictedEvents` existen en `file://` (`isSecureContext = true`). | La afirmación «como mucho un `pointermove` por frame» (2.5, 7.2, glosario) no se sostiene. Reescribí 2.5; lo demás va en §5. |
| E4 | `performance.now() − t` al empezar el callback de rAF, 180 frames | Mediana 2,3 ms; p5 0,7; p95 2,5; máximo 2,6 | Coherente con 1.5 (0,4–2,5 ms). Añadido a 2.3, que solo daba un caso de 8,5 ms. |
| E5 | Trazas de 1 s, página nueva por caso: estilo / layout / paint en `CrRendererMain` | Left con JS+rAF: 61 / 61 / 122. Transform con JS+rAF: **60** / 0 / 0. Transform con `@keyframes`: 0 / 0 / 0. Left con `@keyframes`: 60 / 60 / 120. WebGL con `clear` en cada frame: sin estilo, layout ni paint; unas 84 `GPUTask`/s en el proceso GPU (hilo `CrGpuMain`). | Aclara 1.7, que mezclaba una medida hecha con JS con la tabla de `@keyframes` de 2.1. Añade la pista GPU. |

Nota técnica: `page.setContent` de puppeteer reutiliza la ventana y deja vivos los rAF del contenido anterior, lo que contamina las trazas. Para medir, abre una página nueva por caso.

## 3. Cambios por archivo (y por qué)

### `00-inicio/01-bienvenida.html` (0.1)
- **Promesas sin enlace.** Enlacé 1.5, 1.6, 2.3 y 2.4 en la tabla de la ruta, 1.7 (file://), 5.1 (16 contextos), 6.10 (GLSL 1.00) y la explicación de px CSS frente a píxeles físicos, que ahora apunta a 1.2 (donde se explica) y a 2.6 (el canvas). Antes solo citaba 2.6.
- **16 contextos.** Decía «destruye el más antiguo». 5.1 midió que se pierde *el que lleva más tiempo sin usarse*, no el primero que se creó. Ahora lo dice así y enlaza a 5.1.
- **Servidor local.** Estaba `python3 -m http.server 8000` con `localhost:8000`. Lo alineé con 1.7: `--bind 127.0.0.1` y `http://127.0.0.1:8000`, más una frase que avisa de que `localhost` y `127.0.0.1` son orígenes distintos (el progreso vive en `localStorage`, por origen).
- **Tabla de la ruta.** Añadí la fila «A · Anexos», con enlace al bestiario.
- **Viñeta nueva de vocabulario en «Convenciones».** Define *frame* (o fotograma) y *fps*, avisa de que *fotograma clave* (keyframe, 2.2) es otra cosa y fija la ortografía que ya seguía el curso: *búfer* para la rejilla de píxeles (búfer de dibujo, de profundidad) y *buffer* para bloques de bytes (ArrayBuffer, buffers de WebGL). Motivo: 1.3 usa «fotograma» y «frame» como sinónimos, 2.2 y 2.7 llaman «fotogramas clave» a los keyframes, y las dos grafías de búfer aparecían sin explicar en todo el curso.

### `01-web/01-html.html` (1.1)
- Prometía que en 6.1 «un `;` olvidado deja la pantalla negra». 6.1 no habla de pantallas negras. Ahora: en los editores del curso verás el error en rojo (el GLSL de 6.1 es aún más estricto que C), y en tu propio WebGL el síntoma es una pantalla negra, que se diagnostica en 5.2 («La pantalla negra: una lista sistemática»).
- Decía que el DPR se «resolverá para el canvas en 2.6», pero el ejercicio 1.1.4 de la misma lección ya lo resuelve. Ahora: primer paso en el ejercicio 1.1.4 y receta completa en 2.6.

### `01-web/03-js-lenguaje.html` (1.3)
- Llamaba «Integración de Euler elemental» a `vy += g·dt; y += vy·dt`, que es **Euler semi-implícito**. En 2.5, «Euler» a secas es el explícito, el que explota, así que el alumno podía creer que el código de 1.3 era el malo. Ahora lo nombra bien y anuncia por qué importa el orden.

### `01-web/04-js-dom-eventos.html` (1.4)
- NDC: decía «lo verás en 5.2», pero 5.2 habla de *clip space* y quien define NDC es 3.6. Ahora: las definirás en 3.6 y colocarás vértices con ellas en 5.2.

### `01-web/06-binario.html` (1.6)
- Nota breve de ortografía buffer/búfer (primera lección con «buffer» a mansalva), con enlace al búfer de dibujo de 1.1.

### `01-web/07-herramientas.html` (1.7)
- `queryObjects`: prometía «Lo usarás en 5.10», pero 5.10 no lo menciona. Ahora dice que es una herramienta para las fugas de memoria de la GPU que estudiarás en 5.10, con enlace a `#fugas-de-memoria`, que sí existe.
- **Medida `left` frente a `transform`.** Decía «con transform ninguno… (el recálculo de estilos sí ocurrió en ambos casos)», mientras la tabla de 2.1 da 0 frames con estilo para `transform`. Las dos cosas son ciertas, pero en montajes distintos (E5): 1.7 medía una animación con JS+rAF y 2.1 una con `@keyframes`. Ahora 1.7 lo dice y añade que con `@keyframes` desaparece hasta el estilo (enlace a 2.1).
- Nueva viñeta **GPU** en el panel Performance, respaldada por E5. 4.1 citaba «(1.7, 5.10)» para la actividad de la GPU en Performance y ninguna de las dos lo contaba. Ahora 1.7 sí.
- `prefers-reduced-motion`: «en el módulo 2» pasa a enlazar a 2.2, donde se explica.

### `02-animacion/01-pipeline-render.html` (2.1)
- **Orden pedagógico.** 2.1 usa `transition` y `@keyframes` en su tabla, en sus ejemplos y en el ejercicio 2.1.1 antes de 2.2. Añadí una nota breve: qué basta saber de ellos y que la sintaxis es la de 2.2.
- **Repetición con 1.5.** La demo del bloqueo ya estaba en 1.5. El ejemplo 2.1.2 ahora lo reconoce y dice lo que añade (la caja de `left`, el porqué). La nota del thrashing decía «que viste en 1.5, ahora medido», pero 1.5 ya había medido (80 ms frente a 1 ms). Ahora dice «ahora a fondo».
- Títulos de bestiario citados que no coincidían con el `data-titulo`: `m1-tarea-larga` y `m1-layout-forzado`. Uno de ellos va dentro de la caja `m2-animacion-congelada`.
- DPR: el enlace iba solo a 2.6. Ahora va a 1.2 y 2.6.

### `02-animacion/03-raf.html` (2.3)
- Título citado de `m1-segundo-plano`, dentro de la caja `m2-salto-al-volver`.
- Párrafo nuevo tras la tabla A/B. La tabla enseñaba 8,5 ms entre el inicio del frame y el callback, mientras 1.5 dice 0,4–2,5 ms. Ahora explica que no es un número fijo: en un bucle en marcha, 0,7–2,6 ms (E4), y los eventos de `resize`/`scroll` van antes de rAF según el estándar. Enlace a 1.5.
- La caja «resolución del reloj» enlaza a 1.5, donde está la explicación completa de Spectre (evita repetirla).

### `02-animacion/05-fisica-muelles.html` (2.5)
- La caja «eventos coalescidos y predichos» repetía la de 1.4 y afirmaba «como mucho un `pointermove` por frame», que E2 no confirma. Ahora es un recordatorio de 1.4 con lo que aporta de nuevo: usar las muestras coalescidas para estimar el flick, `getPredictedEvents` y la medida E2.

### `02-animacion/06-canvas2d.html` (2.6)
- Título citado de `m1-circulo-ovalado`.
- «Tres detalles del contexto» ahora avisa de que los dos primeros ya salieron en 1.1.

### `02-animacion/08-proyecto-particulas.html` (2.8)
- «búfer de vértices» pasa a «buffer de vértices», por coherencia con 1.6, 5.3 y la convención.
- Prometía «millones de partículas a 60 fps» en 7.5. 7.5, ya escrita, llega a **un millón**. Ajustado.

**Sin cambiar, a propósito:**
- El nombre del argumento de rAF varía entre `ms`, `t` y `ahora`, pero cada fragmento comenta sus unidades.
- La repetición de «dos tamaños del canvas», ResizeObserver y «canvas que crece» entre 1.1, 1.4 y 2.6 va a distinta profundidad y con enlaces.
- «setTimeout frente a rAF» (1.5, breve) y «setInterval no sirve» (2.3, a fondo) están bien repartidos.

## 4. Verificación (`verificar.mjs --soluciones --capturas …/capturas/coh-web`)

- 0.1, 1.1, 1.3, 1.4, 1.7, 2.1, 2.3 y 2.5: ✓ sin problemas, con todas las soluciones ejecutadas.
- 1.6, 2.6 y 2.8: su único problema era el enlace a 7.5, que ya existe (repaso final más abajo).
- `coh-web-enlaces.mjs`: 0 enlaces internos rotos en m0–m2; 0 textos «N.M» que apunten a otra lección; 0 enlaces entrantes rotos (unos 300, incluidos 210 del glosario).
- **Pendiente para el orquestador:** he cambiado texto dentro de cajas de bestiario (2.1 `m2-animacion-congelada`, 2.3 `m2-salto-al-volver`) y prosa indexable. Hay que ejecutar `node herramientas/indexar.mjs`. No lo he hecho porque escribe en `assets/js/`, que tengo vedado.

## 5. Problemas en archivos ajenos (no editados)

1. **5.3 `05-webgl/03-buffers-atributos.html` L658.** «…sus pausas se notan como tirones (2.3)»: 2.3 no habla del recolector de basura. *Propuesta:* enlazar a 1.3 `#el-recolector-de-basura-y-los-bucles-calientes` o a 2.1 `#m2-tirones-periodicos`.
2. **5.6 `05-webgl/06-3d-cubo.html` L526.** Dice que el listener de `wheel` va con `passive: false` porque, «con los escuchadores pasivos por defecto de Chrome, ese `preventDefault` se ignoraría». El listener está en el **canvas**, y Chrome solo hace pasivos por defecto los de `window`, `document` y `body` (1.4; E1: en un elemento sin opciones es cancelable y bloquea el desplazamiento). *Propuesta:* «`passive: false` no es necesario en el canvas (solo `window`, `document` y `body` son pasivos por defecto, 1.4), pero deja clara la intención».
3. **7.2 `07-integracion/02-interaccion.html`.**
   - «En 1.4 recorriste los cuatro sistemas de coordenadas del puntero»: 1.4 presenta **cinco** (client, page, offset, screen, movement). *Propuesta:* «los sistemas de coordenadas».
   - L204: «Chrome te entrega como mucho un `pointermove` por frame con el último punto (1.4)». 1.4 no lo dice, y E2 lo contradice (31 en un frame). *Propuesta:* «Chrome agrupa las muestras y te entrega menos `pointermove` de los que genera el dispositivo (1.4)».
4. **4.1 `04-gpu/01-cpu-vs-gpu.html` L549.** Cita «(1.7, 5.10)» para la actividad de la GPU en Performance. 5.10 no lo menciona; 1.7 ya sí.
5. **7.3 `07-integracion/03-transiciones-shader.html`.** «cortinillas con `clip-path` o `mask-image` (2.2)»: 2.2 no trata ninguna de las dos. *Propuesta:* quitar la referencia o citar 2.1, que mide `clip-path` en el compositor.
6. **Glosario A.4 `08-anexos/04-glosario.html`**, contradicciones con m0–m2:
   - «eventos coalescidos»: «agrupa en un solo `pointermove` por frame». E2 lo contradice. *Propuesta:* «en menos `pointermove`».
   - «IntersectionObserver»: «rAF solo se detiene solo en pestañas ocultas, no con el canvas fuera de pantalla». 2.3 midió que también se detiene en iframes de otro origen fuera de pantalla o con `display:none` (los playgrounds del curso). Además, «solo … solo» es una errata.
   - «tarea»: «Ceder con una tarea (setTimeout, MessageChannel, `scheduler.yield()`) deja pasar un frame». 1.5 midió que `scheduler.yield()` casi nunca deja pintar (5 frames en 40 lotes). *Propuesta:* quitar `scheduler.yield()` de la lista o matizarlo.
7. **Títulos de bestiario citados que no coinciden con su `data-titulo`** (cosmético): 6.1 cita `m5-version-primera-linea`, `m4-precision-uniform`, `m5-sampler-unidad` y `m4-uniform-silencioso`; 6.2 cita `m3-rotacion-inversa-shader`; 6.5 cita `m3-costura-atan`. Casi todo son mayúsculas o títulos recortados.
8. **Menor.** 7.7 escribe «Euler semiimplícito» y el resto del curso «semi-implícito».

**Componentes compartidos:** no he encontrado bugs. Una observación para quien use el checker propio: los `href` con `?query` (`proyecto-final/index.html?depurar` en 7.6) salen como falsos rotos en `coh-web-enlaces.mjs`, porque no quita la query. `verificar.mjs` no tiene ese problema.

## 6. Enlaces a 7.3–7.7 y A.4

Al empezar faltaban 7.3 (enlazada desde 2.5) y 7.5 (desde 1.6, 2.6 y 2.8 ×3). Durante la revisión se escribieron 7.3–7.7 y el glosario, y **ya no queda ningún enlace pendiente**. Comprobé que cumplen lo prometido:
- 7.3 anima un uniform de progreso con muelles (promesa de 2.5).
- 7.5 guarda el estado en un Float32Array, dibuja con instancing, simula en GPU y llega a un millón a 60 fps (promesas de 1.6, 2.6 y 2.8; 2.8 ajustada a «un millón»).
- 7.2 cubre `u_mouse`, `getCoalescedEvents` y `getPredictedEvents` (promesas de 1.2, 1.4 y 2.5).

## 7. Decisiones discutibles

- **Viñeta de vocabulario en 0.1** (frame/fotograma, fotograma clave, búfer/buffer). La prefiero a reescribir decenas de usos: la convención ya era coherente en el curso, solo faltaba decirla.
- **2.5.** Retiré «como mucho un `pointermove` por frame» por E2, que usa entrada sintética por CDP en headless. Con un ratón real, Chrome podría agrupar más, pero no puedo medirlo aquí, así que el texto ya no afirma nada que no haya comprobado.
- **1.2** sigue diciendo «según MDN» que el zoom cambia el DPR, mientras 2.6 y 5.1 lo afirman (zoom al 125 %, DPR 1,25). No es comprobable en headless porque no hay zoom de navegador. No es una contradicción, así que lo dejé.
- **1.7** conserva «61 layouts y 120 operaciones de pintado» (medida original, repetida en la solución del ejercicio 1.7.3). Yo medí 61 y 122 en el mismo montaje.
- **Thrashing entre 1.5 y 2.1.** No recorté la sección de 1.5: 1.4 promete explícitamente «números en 1.5, a fondo en 2.1», y cada lección tiene su bestiario y su ejercicio. Solo ajusté las referencias cruzadas.
