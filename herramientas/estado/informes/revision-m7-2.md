# Revisión de 7.2 «Interacción: ratón, touch y scroll» (rev-m7-2, sesión 3)

Archivo revisado y corregido: `modulos/07-integracion/02-interaccion.html` (única lección tocada). Primera revisión de la
lección (escrita en la sesión 1). Experimentos en Chromium 141 sin ventana (Linux, SwiftShader, entrada sintética por CDP);
scripts y páginas en `<SCRATCH>/agentes/rev-m7-2/exp/` (`exp.mjs`, `exp2.mjs`, `exp3.mjs`, `exp4.mjs`, `extraer.mjs`).

## (a) Cambios hechos y por qué

1. **«Los cuatro sistemas de coordenadas» → cinco** (sección «Del evento al píxel», 1.er párrafo). 1.4 presenta cinco
   (`client`, `page`, `offset`, `screen`, `movement`); ahora los nombra y enlaza a
   `04-js-dom-eventos.html#los-sistemas-de-coordenadas-del-puntero`. Los «cuatro pasos» del diagrama (evento → caja →
   búfer → GL) se mantienen: son pasos de conversión, no sistemas.
2. **«Chrome te entrega como mucho un `pointermove` por frame» (FALSO) → caja senior reescrita** («Más muestras que
   frames…»). Medido aquí (CDP `Input.dispatchMouseEvent`, `exp.mjs`/`exp2.mjs`/`exp3.mjs`):
   - 250 Hz (40 muestras cada ~4 ms): 23–27 `pointermove` en 11–12 frames, **2–4 por frame**; ~650 Hz (120 muestras en
     190 ms): 68–69 eventos, **hasta 9 en un frame**; 60 de golpe: 2 eventos (con listener de `pointerrawupdate`) o 36
     (18 en un frame) sin él. Enviados uno a uno esperando cada envío: 1 por frame (artefacto: CDP espera el ack).
   - Siempre: la suma de `getCoalescedEvents()` = muestras enviadas (40/40, 120/120, 60/60).
   - Alineados con el frame: cada `pointermove` se despachó 0–4 ms antes del rAF de su frame (casi siempre < 1,5 ms).
   - Discretos (`pointerdown`/`pointerup`): no esperan (hasta 16 ms antes del rAF) y el `pointermove` en cola se despacha
     justo antes que ellos (p. ej. move 13,3 ms antes del rAF, down 12,8).
   - `pointerrawupdate`: uno por muestra (40/40; 117/120 a ~650 Hz), hasta 17 ms antes del rAF, sin agrupar;
     `isSecureContext` y `'onpointerrawupdate' in window` = true en `file://`.
   El texto ahora explica qué agrupa Chrome y cuándo (continuos: alineados + coalescidos «los que puede»; discretos no),
   da las cifras con hardware/método, cita la medida de 2.5 (31), concluye «no cuentes con un evento por frame» y
   ata la conclusión a la arquitectura (el evento anota, el frame lee). Enlaces a 1.4 (#pointer-events…) y 2.5 (#lanzar…).
3. **Segunda aparición de la misma idea** («Suavizar el puntero», 1.er párrafo: «un evento por frame como mucho»):
   reescrita sin la afirmación falsa.
4. **Bug real en `M7.Puntero` (barrido al volver a entrar), reflejado en la lección.** La marca `fresco` que pone
   `pointerleave` se gastaba en el primer frame después de salir, colocando el valor suavizado donde salió el puntero;
   al volver a entrar por otro sitio el efecto cruzaba la escena: medido `sx` = 83 → 135 → 178 → 213… hacia 380 px
   (exp.mjs E6). Con `if (this.fresco && this.dentro)` el valor salta a 380 en el primer frame (exp4.mjs). En la lección:
   el anotado del núcleo usa ya `this.fresco && this.dentro`, su nota explica por qué, y la solución del bestiario
   `m7-barrido-inicial` dice «el primer evento después de un `pointerleave`» y avisa del error de hacerlo «en el primer
   frame tras el `pointerleave`». **Hay que aplicar el mismo cambio en m7kit.js (ver (d)1)**.
5. **Anotado de `M7.Puntero`: números de línea desplazados.** Las notas apuntaban a 7, 9-12, 14-18, 19-23, 26-29
   (líneas vacías o equivocadas: el componente quita la primera línea en blanco). Ahora 6, 8-12, 13-17, 18-23, 25-28,
   con explicación del `return` sin eventos y del `dt <= 0` (división por 0 → NaN).
6. **Ejemplo 7.2.4 (multitouch): fuga de huecos con el ratón.** El ratón tiene siempre `pointerId` 1; si volvía a
   pulsar antes de que su halo se apagara (un doble clic), el `pointerdown` creaba entrada nueva y la vieja salía del
   `Map` con su hueco ocupado para siempre. Medido: 6 clics rápidos → huecos `[1,1,1,1,null]` permanentes (solo un dedo
   posible a partir de ahí). Arreglado (el `pointerdown` reactiva la entrada existente con su hueco e intensidad):
   tras 6 clics, todos los huecos libres; 3 dedos simulados ocupan 0, 1, 2 y se liberan al soltar (exp4.mjs). Párrafo
   explicativo añadido tras el ejemplo.
7. **Teclado con `dtReal`** (anotado de la sección «Teclado», su nota 11-13, frase de introducción y resumen). El
   anotado movía con `dt` (escalado): con el movimiento reducido de la sección siguiente (escala 0) el control por
   teclado se habría congelado, en contra de la regla de la propia lección («`dtReal` para lo que responde al usuario»)
   y de la solución del ejercicio 7.2.4, que ya usaba `dtReal`. La nota explica además cuándo querrías `dt` (un juego con
   pausa). Nota «3-6» → «2-7» (incluye el `Set` y el `keyup`).
8. **`pointer-events: none` (sección de accesibilidad y explicación del quiz).** Decía que sirve «para que los clics
   lleguen a los elementos de encima»: con `z-index: -1` ya llegan sin él (medido: `elementFromPoint` sobre el texto y el
   botón devuelve el texto y el botón). Lo que evita es que el canvas sea el destino cuando queda pintado encima: un
   canvas `position: fixed` sin `z-index` se pinta sobre el contenido no posicionado y `elementFromPoint` devolvió el
   canvas sobre el texto. Texto y explicación del quiz reescritos con eso.
9. **Arrays de uniforms**: «la location de `'u_ondas'` y la de `'u_ondas[0]'` son la misma» → son objetos distintos
   (`===` da false) que apuntan al mismo elemento (escribir con una y leer con otra coincide); añadido qué hace
   `uniform3fv` con la location de `'u_ondas[5]'` (empieza en el 5, ignora lo que no cabe). Resto de la lista confirmado
   aquí: `getActiveUniform` → `u_ondas[0]`, FLOAT_VEC3, 8; 12 floats → 4 primeros; 30 → sin error; 10 →
   `WebGL: INVALID_VALUE: uniform3fv: invalid size` y nada asignado.
10. **`setPointerCapture`** (lista de multitouch): añadido que con el dedo la captura es implícita (1.4, con ancla) y con
    ratón/lápiz no.
11. **Hardware en cifras medidas**: 0,4 µs de `getBoundingClientRect()` (Apple M1; aquí medí 0,8 µs en el contenedor,
    mismo orden), `MAX_FRAGMENT_UNIFORM_VECTORS` 1024 «en el M1 (Chrome, ANGLE/Metal)» (antes «la máquina de pruebas»;
    SwiftShader da 4096), 25 px a 1500 px/s «Apple M1, Chrome, 60 Hz» con la cuenta 1500/60 = 25, y el orden
    `scroll` → rAF (M1, 12 casos) más mi repetición (0–0,3 ms en 8 casos).
12. **Precisiones menores**: `animation-timeline: scroll()` sin retraso «siempre que animen `transform`/`opacity`»; enlace a
    2.1 con ancla `#capas-y-el-hilo-del-compositor` (2.1 presenta el hilo del compositor, no el scroll: el texto ya lo
    dice); 2.2 con ancla `#movimiento-reducido`; 2.5 con ancla `#lanzar-con-un-gesto-la-velocidad-del-puntero`; ejercicio
    7.2.3: los «trompicones» de la rueda solo «cuando el navegador no anima el desplazamiento».

Comprobado y correcto sin cambios (en este Chromium): con el ratón quieto y la rueda, 0 `pointermove` y solo
`pointerout` + `pointerleave` cuando el elemento sale de debajo del cursor; dedos con `pointerId` 2 y 3
(`isPrimary` true/false) y un toque posterior con id 4; clic en canvas sin `tabindex` → `activeElement` = BODY y el
`keydown` va al body; con `tabindex="0"` llega al canvas; el canvas enfocado recibe `blur` al pasar a otra pestaña;
`matchMedia('(prefers-reduced-motion: reduce)')` cambia y dispara `change` al emularlo; árbol de accesibilidad: canvas
sin atributos = rol «Canvas» sin nombre, `role="img"` + `aria-label` = «image» con nombre, `aria-hidden` desaparece,
contenido dentro del canvas (botón) presente. Fórmulas de progreso de scroll, amortiguamiento crítico 2√170 ≈ 26, edades
en Float64 y el resto de ejercicios: correctos.

## (b) Problemas pendientes (con propuesta)

- **Ejemplo 7.2.2 (estela)**: sin interacción, la captura es un lienzo casi negro con «mueve el puntero sobre el
  lienzo». Funciona, pero un alumno que solo lee no ve nada. Propuesta (opcional): un puntero fantasma como el de 7.2.4
  hasta el primer evento.
- **Progreso de página** usa `innerHeight` (incluye la barra horizontal si la hay); `document.documentElement.clientHeight`
  sería exacto. Diferencia irrelevante en la práctica; lo dejo.
- **A.1/A.4**: tras `indexar.mjs`, el anexo A.1 recogerá los textos nuevos de `m7-barrido-inicial` y
  `m7-canvas-fijo-retraso`.

## (c) Pendientes de medir en el M1

- La lección no contiene tiempos de GPU: nada que re-medir con el método de §4.
- Opcional, para cerrar la caja senior con hardware real: contar `pointermove` por frame con un ratón/trackpad real en el
  Chrome del M1 (las cifras de la caja son de entrada sintética en headless y el texto lo dice).
- Confirmar que las cifras de la sesión 1 que he atribuido al M1 se midieron allí (25 px a 1500 px/s; `scroll` 0–0,1 ms
  antes del rAF en 12 casos; 0,4 µs por `getBoundingClientRect()`; `MAX_FRAGMENT_UNIFORM_VECTORS` = 1024). Lo deduzco de
  que la sesión 1 se hizo en el Mac del dueño.

## (d) Problemas en archivos ajenos

1. **`modulos/07-integracion/recursos/m7kit.js`, `Puntero.actualizar`, línea ~375 (PRIORIDAD ALTA)**:
   `if (this.fresco) {` → `if (this.fresco && this.dentro) {` (y el comentario: «primera vez, o la primera tras volver a
   entrar»). Sin esto, el efecto «llega volando» desde el punto de salida cada vez que el puntero vuelve a entrar
   (medido arriba, punto (a)4). El anotado de 7.2 ya muestra la línea corregida: si no se aplica, el anotado y el kit
   divergen. Afecta a todo lo que use `M7.Puntero` (7.2, 7.3, 7.4, 7.5…); el cambio no tiene efectos secundarios (mientras
   está fuera, `sx` se queda donde estaba).
2. **`modulos/08-anexos/04-glosario.html`, entrada «eventos coalescidos» (l.~779)**: ya dice «en menos `pointermove`»
   (correcto). Propuesta: añadir «(no necesariamente uno por frame: medido hasta 9 en un frame) y despachados justo antes
   del rAF» y un enlace a `07-integracion/02-interaccion.html#suavizar-el-puntero-y-medir-su-velocidad`.
3. **`modulos/02-animacion/05-fisica-muelles.html`, caja «eventos coalescidos y predichos» (l.~321)**: «llegaron 31»
   es una medida válida, pero el número varía mucho con el método (aquí 2 o 36 con 60 de golpe). Propuesta opcional:
   «llegaron 31 (en otras pruebas, entre 2 y 36: lo único fijo es la suma)».
4. **`modulos/01-web/04-js-dom-eventos.html`, caja senior «Más muestras de las que ves» (l.~272)**: no menciona que los
   `pointermove` se despachan alineados con el frame. Propuesta opcional: una frase («se entregan justo antes del rAF,
   ver 7.2») con enlace.

## (e) Cajas bestiario de 7.2

| data-id | data-titulo | Síntoma del diagnóstico rápido |
|---|---|---|
| `m7-puntero-despegado` | El efecto se despega del puntero sin que lo muevas (al hacer scroll, zoom o cambiar la calidad) | eventos/puntero |
| `m7-barrido-inicial` | Al entrar el ratón, el efecto llega volando desde una esquina | eventos/puntero |
| `m7-ondas-otro-reloj` | Las ondas del clic no aparecen, aparecen ya terminadas o se congelan con la pausa | animación a distinta velocidad (relojes mezclados; secundario: eventos/puntero) |
| `m7-canvas-fijo-retraso` | Al hacer scroll rápido, el efecto del canvas de fondo se despega de los elementos | eventos/puntero (scroll; secundario: rendimiento/tirones) |
| `m7-canvas-sin-teclado` | El canvas no responde al teclado (aunque haya hecho clic en él) | eventos/puntero (teclado) |

## (f) Términos para el glosario A.4

- **eventos alineados con el frame** (*rAF-aligned input*) — Chrome retiene los `pointermove`/`mousemove` hasta justo
  antes de los callbacks de rAF y agrupa los que puede; los discretos (`pointerdown`, `pointerup`) no esperan. →
  `#suavizar-el-puntero-y-medir-su-velocidad`
- **`pointerrawupdate`** — evento de puntero que llega en cuanto hay una muestra, sin esperar al frame ni agruparse;
  solo en contextos seguros. → `#suavizar-el-puntero-y-medir-su-velocidad`
- **`getPredictedEvents()`** — posiciones futuras del puntero estimadas por el navegador, para reducir la latencia
  percibida al dibujar un trazo. → `#suavizar-el-puntero-y-medir-su-velocidad`
- **eventos coalescidos** — (actualizar, ver (d)2) añadir enlace a 7.2 en la misma ancla.
- **`isPrimary`** — `true` en el primer puntero de un gesto multitáctil; cada dedo tiene su `pointerId`, que no se
  reutiliza enseguida. → `#varios-dedos-a-la-vez`
- **edades, no instantes** — en lugar de mandar al shader el instante de un suceso y restarlo a `u_time` en float32, se
  calcula `edad = t − t0` en JavaScript (64 bits) y viaja un número pequeño. →
  `#ondas-al-hacer-clic-un-array-de-uniforms-como-buffer-circular`
- **`MAX_FRAGMENT_UNIFORM_VECTORS`** — límite de uniforms del fragment shader en vectores de 4 componentes; WebGL2
  garantiza 224 (1024 en el M1). → `#ondas-al-hacer-clic-un-array-de-uniforms-como-buffer-circular`
- **progreso de scroll** — número de 0 a 1 derivado de la posición de la página (`scrollY / (scrollHeight − innerHeight)`)
  o de una sección (`(vh − r.top) / (vh + r.height)`), leído en el frame. → `#el-scroll-como-entrada`
- **desfase del canvas fijo** — un canvas `position: fixed` dibujado con el `scrollY` del hilo principal va un frame por
  detrás del scroll del compositor (25 px a 1500 px/s y 60 Hz). → `#el-scroll-como-entrada`
- **animaciones guiadas por scroll** (`animation-timeline: scroll()`) — animaciones CSS cuyo progreso es el scroll;
  con `transform`/`opacity` corren en el compositor sin retraso. → `#el-scroll-como-entrada`
- **`tabindex`** — hace enfocable un elemento: `0` lo mete en el orden del tabulador; negativo, solo con clic o
  `focus()`. Un canvas lo necesita para recibir teclado. → `#teclado`
- **`:focus-visible`** — pseudoclase para mostrar el foco cuando el navegador cree que hace falta (teclado), sin
  marcarlo en cada clic. → `#teclado`
- **árbol de accesibilidad** — la versión del DOM que leen los lectores de pantalla (visible en DevTools); un canvas
  aparece como nodo sin nombre salvo con `role="img"` + `aria-label`. →
  `#accesibilidad-el-canvas-no-existe-para-un-lector-de-pantalla`
- **`u_escala` (px del búfer por px CSS)** — factor `canvas.width / rect.width` con el que el shader escala sus longitudes
  para que midan lo mismo con cualquier DPR o calidad. → `#suavizar-el-puntero-y-medir-su-velocidad` (ejemplo 7.2.2)

## (g) Verificación final

PENDIENTE (se completa abajo).
