# Informe de revisión: Módulo 1 · Fundamentos web mínimos

Las siete lecciones quedan corregidas y sin problemas en `verificar.mjs`, en tema oscuro con `--soluciones` y en tema claro. Solo quedan avisos de enlaces a tres lecciones futuras: `06-glsl/04-color` (desde 1.2), `07-integracion/02-interaccion` (1.2 y 1.4) y `07-integracion/05-particulas-gpu` (1.6). Miré todas las capturas. Ejecuté las soluciones de los 28 ejercicios que tienen botón «Ver solución». Los de arrastre, teclado, foco y 1.3.4 los probé con entrada real (ratón y teclado).

El servidor `python3 -m http.server 8765` (PID 32429, de las 21:05) sigue abierto. No lo lancé yo, no lo he tocado y no queda ningún proceso mío.

## Hallazgo más importante

En 1.5 el texto decía que los iframes de los editores comparten hilo con la lección. Eso solo pasa con los flags por defecto de Puppeteer, que desactivan `IsolateSandboxedIframes`. Comprobé que en Chrome 154 con flags normales un bucle ocupado de 1,5 s dentro de un editor no congela la página: los temporizadores de la página siguen a 50 ms. Con los flags de Puppeteer sí medí 1516 ms de congelación. Reescribí ese párrafo y la frase de la demo del bloqueo.

Las demás cifras de 1.5 que dependían de esa configuración (fps de rAF, tabla de `scheduler.yield`, temporizadores anidados, pestañas en segundo plano) las repetí en Chrome sin flags y coinciden.

## Cambios por lección

**1.1 HTML y el DOM**
- La anécdota en primera persona «Me pasó dos veces escribiendo esta misma lección» se reescribió en neutro.
- El enunciado del ejercicio 1.1.4 prometía «sea cual sea el tamaño del panel», pero la solución no reacciona a cambios posteriores de tamaño. Lo aclaré.
- «simplemente» sustituido por «equivale a» (guía §2).
- Comprobé en Chrome la tabla de quirks (con las variantes de doctype), `hidden="false"`, `<div/>`, los ids como globales, la tabla de `canvas.width`, el reinicio del contexto y la tabla de correcciones del parser. Todo coincide con el texto.

**1.2 CSS**
- La frase sobre `getComputedStyle().width` («te dice lo que pusiste, no lo que mide») confundía. Ahora explica que depende de `box-sizing`.
- Ejemplo 1.2.2: en el iframe de 350 px el rótulo se partía en dos líneas, porque `left:50%` solo le deja la mitad del ancho. Añadí `white-space: nowrap` y un párrafo que lo explica (centros 175,115 y 175,115).
- En ese mismo ejemplo, el texto sobre la errata `postion` decía que el rótulo «cae debajo del canvas». Faltaba que el `transform` sigue aplicándose: medí el rótulo en (−175, 209), medio fuera de la ventana. Lo corregí.
- Nueva caja `cuidado`: `transform` se ignora en cajas `inline` de texto. Medido: un `span` girado 45° sigue midiendo 44×18 aunque `getComputedStyle` devuelva la matriz. Una `img` sí gira.
- Ejercicio 1.2.3: «crezca» pasa a «sea mayor», porque la solución salta a 160 sin animar. También añadí que soltar fuera de la escena deja el foco grande, con remisión a la captura de puntero de 1.4.
- Comprobados `overflow: clip`/`hidden`, las propiedades `translate`/`rotate` sueltas, `var()`/`calc()`, la tabla de colores, `style["--x"]` y el hueco de 4,45 px entre `inline-block`.

**1.3 JS I**
- Error factual: «cerca de 2000, unas 2000 veces más» que `EPSILON`. Son 1024 veces (2¹⁰), unos 2,3·10⁻¹³ entre 1024 y 2048.
- En la demo de closures el botón salía estirado porque `flex-wrap` reparte el espacio libre entre líneas. Añadí `align-content: flex-start`.
- Nota en el graficador de `mod` frente a `%`: para x positiva la curva azul tapa la morada.
- El ejercicio 1.3.4 lo probé con el botón real: el error sale como dice el enunciado y la solución alterna pausada y reanudada.

**1.4 JS II**
- El orden de eventos de un clic omitía `mouseenter` y `mousemove`. Lo sustituí por el orden medido: pointerover → pointerenter → mouseover → mouseenter → pointermove → mousemove → pointerdown → mousedown → pointerup → mouseup → click.
- Con ratón real, el ejercicio 1.4.2 falla como describe el enunciado y su solución funciona. El 1.4.4 responde bien, con diagonal a la misma velocidad y detención al perder el foco.

**1.5 Event loop**
- Corregido el párrafo del iframe (ver hallazgo).
- Bug en `recursos/m1.css`: el código del simulador es un `<pre>` y `.leccion pre` le ganaba en especificidad. Salía a 14 px, con márgenes y esquinas redondeadas, y las líneas se cortaban. Añadí el prefijo `.leccion` a `.m1-bucle-codigo` y a `.m1-serializado` (el `<pre>` de 1.1).
- La demo del bloqueo mostraba «1 frames/s» al entrar en pantalla, por un contador de fps que arrancaba en la carga. Ahora se reinicia al volver a la vista y muestra «midiendo…».
- «de los ejercicios 1.3.2 y del ejemplo 1.3.2» pasa a «del ejercicio 1.3.2 y del ejemplo 1.3.2».
- Ejecuté las 8 programaciones del simulador en Node con las dos opciones del frame: todas dan el orden real.

**1.6 Binario**
- Los ejemplos aparecían en orden 1.6.2 y luego 1.6.1. Los renumeré.
- Un comentario del bloque de `vertexAttribPointer` quedaba cortado y lo acorté.
- La solución del ejercicio 1.6.2 ahora explica `willReadFrequently`, que aparecía sin explicación.

**1.7 Herramientas**
- La caja `cuidado` decía que la consola de los editores «no entiende `%c`» y muestra `console.table` como objeto. Es falso desde que se actualizó el componente. La probé método a método y la reescribí:
  - Muestra `log`, `info`, `warn`, `error` y `debug`.
  - Muestra `table` como tabla de texto y descarta los estilos de `%c`.
  - No muestra `group` (sí sus mensajes), `time`, `count`, `assert`, `trace` ni `dir`.
- «Python 3 viene instalado en macOS»: matizado. En macOS llega con las herramientas de línea de comandos de Apple, y en Windows el comando suele ser `py`.
- Ejercicio 1.7.1 (d): añadí el orden de eventos que muestra `monitorEvents` (no incluye `mouseenter`).
- Verifiqué las respuestas del ejercicio 1.7.1 (partícula 27 a 197,18 px/s, 9 con masa > 2, 40 instancias) y el comportamiento antes y después del 1.7.2.
- El comentario `// var: visible desde la consola` era engañoso (`let`/`const` globales también se ven) y ahora dice que `var` cuelga de `window`.
- En 1.7.3 la caja llegaba a recortarse en el borde del panel estrecho. Bajé la amplitud de 250 a 230 px.

## Pendientes que no corregí

1. **`data-sin-resultado` no arranca solo.** Es un bug de `playground-js.js`: observa `lienzo`, que queda oculto, y el playground no se ejecuta hasta pulsar ▶ (`verificar.mjs` lo marca como «nunca se ejecutó»). Lo probé en los 11 playgrounds solo de consola y lo revertí. Siguen con `data-altura="60" data-apilado` y una franja vacía de 60 px:
   - 1.2: DPR.
   - 1.3: ejercicios 1.3.1, 1.3.2 y 1.3.3.
   - 1.5: ejemplos 1.5.1 y 1.5.2 y ejercicio 1.5.1.
   - 1.6: ejemplos 1.6.1 y 1.6.2 y ejercicios 1.6.1 y 1.6.4.
   
   Propuesta: observar `el` (o `cuerpo`) cuando esté esa opción, y luego cambiar esos atributos.
2. **La consola del playground no muestra** `console.group`, `time`, `count`, `assert`, `trace` ni `dir`. La 1.3 recomienda `console.assert` y la 1.7 enseña todos, y ahora lo avisa. Propuesta: añadirlos al puente de consola.
3. **Consola fija de 130 px.** Los ejercicios con siete u ocho líneas de salida (1.1.1, 1.3.1) obligan a desplazar. Propuesta: una opción de altura de consola.
4. **`verificar.mjs` y GUIA §7.** Las mediciones sobre iframes o procesos con Puppeteer por defecto no valen. Propuesta: añadir `--enable-features=IsolateSandboxedIframes` a los args del verificador o dejarlo anotado en la guía.
5. **Ejercicio 1.5.4.** La comprobación «diferencia 0 ms» es casi tautológica para la solución de referencia, porque compara dos lecturas del mismo reloj. No lo cambié. Se puede imprimir además el valor mostrado en pantalla en el último frame.
6. **No comprobable en headless:** la interfaz de DevTools (1.7, ya avisado en el texto), que el zoom cambie `devicePixelRatio` (se cita MDN), `code` en teclados AZERTY y con la «ñ» (viene de la especificación) y que `getCoalescedEvents` exija contexto seguro.

Ninguna sección necesita reescribirse entera. Las sugerencias del autor sobre `%c`/`console.table`, `.ancho` en `curso.css`, el filtrado de iframes en `verificar.mjs` y la decodificación de entidades del indexador ya están resueltas en los componentes compartidos.

Archivos en `/Users/alex/Projects/shaders/modulos/01-web/`: las siete lecciones `01-html.html` a `07-herramientas.html`, y `recursos/m1.css`. Los experimentos están en `/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/experimentos/rev-m1/` y las capturas en `.../capturas/rev-m1/`.
