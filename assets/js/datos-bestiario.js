/* Generado por herramientas/indexar.mjs — no editar a mano. */
window.CURSO_BESTIARIO = [
 {
  "id": "m1-quirks",
  "titulo": "Funciona en mi archivo de prueba y no en el proyecto",
  "html": "<p><strong>Síntoma:</strong> un <code>height:100%</code> que llenaba la pantalla ahora mide 150 px, o <code>el.style.left = x</code> ha dejado de mover el elemento.</p>\n  <p><strong>Causa:</strong> el archivo de prueba no tenía doctype y se renderizaba en modo quirks, que resuelve las alturas en % contra la ventana y acepta números sin unidad en <code>style</code>. El proyecto sí tiene doctype.</p>\n  <p><strong>Solución:</strong> <code>&lt;!doctype html&gt;</code> siempre en la primera línea, y unidades siempre en JavaScript: <code>el.style.left = x + \"px\"</code>. Para diagnosticarlo, escribe <code>document.compatMode</code> en la consola.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-mojibake",
  "titulo": "Aparece «Ã±» en lugar de «ñ»",
  "html": "<p><strong>Síntoma:</strong> tildes y eñes convertidas en parejas raras (Ã¡, Ã±, â‚¬), a veces solo cuando sirves la página por HTTP.</p>\n  <p><strong>Causa:</strong> los bytes UTF-8 se decodificaron como windows-1252 porque ni la cabecera HTTP ni el documento declaraban la codificación.</p>\n  <p><strong>Solución:</strong> <code>&lt;meta charset=\"utf-8\"&gt;</code> como primera línea del <code>&lt;head&gt;</code> (dentro de los primeros 1024 bytes) y archivos guardados en UTF-8. Compruébalo con <code>document.characterSet</code>.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-canvas-autocerrado",
  "titulo": "Todo lo que va después de mi canvas ha desaparecido",
  "html": "<p><strong>Síntoma:</strong> escribes <code>&lt;canvas id=\"lienzo\"/&gt;</code> y el párrafo y el botón que van detrás no se ven, aunque <code>getElementById</code> los encuentra sin problema.</p>\n  <p><strong>Causa:</strong> en HTML, <code>/&gt;</code> no cierra un elemento que no sea vacío. El canvas queda abierto y todo lo que sigue se convierte en su contenido de respaldo, que no se pinta cuando el navegador soporta canvas. Lo medí: el párrafo tiene <code>offsetHeight = 0</code> y su <code>parentNode</code> es el canvas. Los <code>&lt;script&gt;</code> que quedan dentro sí se ejecutan, lo que despista todavía más.</p>\n  <p><strong>Solución:</strong> <code>&lt;canvas id=\"lienzo\"&gt;&lt;/canvas&gt;</code>, siempre con cierre explícito.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-script-string",
  "titulo": "Un string con «</script>» rompe el script",
  "html": "<p><strong>Síntoma:</strong> <code>SyntaxError: Invalid or unexpected token</code> (o <code>Unexpected end of input</code>) en un script que parece correcto, y trozos de tu código aparecen como texto en la página.</p>\n  <p><strong>Causa:</strong> el tokenizador HTML corta el <code>&lt;script&gt;</code> en el primer <code>&lt;/script</code> que encuentra, aunque esté dentro de un string o de un comentario de JavaScript.</p>\n  <p><strong>Solución:</strong> escribe <code>&lt;\\/script&gt;</code> dentro del código en línea, o mueve el código a un archivo <code>.js</code> externo, donde el problema no existe.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-getcontext-null",
  "titulo": "«Cannot read properties of null (reading 'getContext')»",
  "html": "<p><strong>Síntoma:</strong> <code>TypeError: Cannot read properties of null (reading 'getContext')</code> nada más cargar la página.</p>\n  <p><strong>Causa:</strong> <code>document.getElementById(\"…\")</code> devolvió <code>null</code>. O el script se ejecutó antes de que el parser llegara al canvas (script en el <code>&lt;head&gt;</code> sin <code>defer</code>), o el <code>id</code> no coincide (mayúsculas, una errata, un <code>#</code> de más: <code>getElementById(\"#lienzo\")</code> busca un id que empieza por almohadilla).</p>\n  <p><strong>Solución:</strong> script al final del <code>&lt;body&gt;</code>, <code>defer</code> o <code>DOMContentLoaded</code>, y comprueba el id: <code>console.log(document.getElementById(\"lienzo\"))</code> antes de usarlo.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-circulo-ovalado",
  "titulo": "Dibujo un círculo y sale un óvalo borroso",
  "html": "<p><strong>Síntoma:</strong> <code>ctx.arc(…)</code> dibuja un óvalo; las líneas y el texto se ven borrosos o gruesos.</p>\n  <p><strong>Causa:</strong> el canvas tiene su búfer por defecto (300 × 150) o uno que no coincide con su caja CSS. El navegador estira la imagen con una escala horizontal distinta de la vertical (óvalo) y mayor que 1 (borroso).</p>\n  <p><strong>Solución:</strong> haz que el búfer tenga los píxeles de la caja: <code>canvas.width = canvas.clientWidth * devicePixelRatio</code> (y lo mismo con el alto), y vuelve a hacerlo si la caja cambia de tamaño. La receta completa, con <code>ResizeObserver</code>, está en la lección <a href=\"modulos/02-animacion/06-canvas2d.html\">2.6</a>; para WebGL, en la <a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>.</p>",
  "leccion": {
   "num": "1.1",
   "titulo": "HTML y el DOM",
   "archivo": "modulos/01-web/01-html.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-margen-colapsa",
  "titulo": "El margen del hijo empuja al padre",
  "html": "<p><strong>Síntoma:</strong> le pones <code>margin-top: 40px</code> al primer hijo para separarlo del borde de su contenedor, y lo que baja es el contenedor entero: el hijo sigue pegado arriba del padre y el fondo del padre empieza 40 px más abajo.</p>\n  <p><strong>Causa:</strong> si entre el margen del padre y el del primer hijo no hay borde, relleno ni contenido, los dos márgenes se fusionan y el del hijo «sale» por arriba del padre. Lo medí: el borde superior del padre y el del hijo quedaron a la misma altura.</p>\n  <p><strong>Solución:</strong> dale al padre un <code>padding-top</code> (o un borde), o conviértelo en un contexto de formato de bloque: <code>display: flow-root</code> (lo más limpio), <code>overflow: hidden</code> o <code>display: flex</code>. Con <code>overflow: hidden</code> comprobé que el hijo quedaba 40 px por debajo del borde del padre, como se esperaba. En flex y grid los márgenes nunca se fusionan.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-franja-canvas",
  "titulo": "Una franja de unos píxeles bajo el canvas",
  "html": "<p><strong>Síntoma:</strong> el contenedor de tu canvas mide unos píxeles más de alto que el canvas, y aparece una franja del color de fondo debajo.</p>\n  <p><strong>Causa:</strong> <code>canvas</code> (como <code>img</code> y <code>video</code>) es <code>inline</code> por defecto: se coloca sobre la línea base del texto, como una letra, y debajo queda el hueco reservado para los trazos descendentes de letras como «g» o «p». Lo medí: un <code>div</code> con un canvas de 100 px dentro midió 104 px.</p>\n  <p><strong>Solución:</strong> <code>canvas { display: block; }</code> (con eso el <code>div</code> pasó a medir 100 px), o <code>vertical-align: top</code>. Es la primera línea del CSS de casi cualquier proyecto con canvas.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-canvas-flex",
  "titulo": "El canvas no encoge dentro de un flex",
  "html": "<p><strong>Síntoma:</strong> un canvas con <code>flex: 1</code> se sale de su contenedor (aparece scroll horizontal) en lugar de ocupar el espacio que le queda.</p>\n  <p><strong>Causa:</strong> los hijos de un flex tienen <code>min-width: auto</code>: no encogen por debajo del ancho de su contenido. Y el «contenido» de un canvas es su búfer: con <code>width=\"600\"</code>, el canvas se negó a bajar de 600 px aunque solo quedaban 250 (medido). Peor aún, si ajustas el búfer al tamaño de la caja (como en el ejercicio 1.1.4), el canvas ya no encogerá nunca al estrechar la ventana.</p>\n  <p><strong>Solución:</strong> <code>min-width: 0</code> en el canvas (con eso midió los 250 px disponibles). En grid, usa columnas <code>minmax(0, 1fr)</code>.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-fixed-transform",
  "titulo": "Mi elemento «fixed» se mueve con el scroll",
  "html": "<p><strong>Síntoma:</strong> un panel o un canvas con <code>position: fixed</code> se desplaza con la página o aparece en un sitio raro.</p>\n  <p><strong>Causa:</strong> algún ancestro tiene <code>transform</code>, <code>filter</code>, <code>perspective</code> o <code>will-change: transform</code>. Eso lo convierte en el bloque contenedor del elemento fijo, que pasa a ser fijo respecto a ese ancestro, no respecto a la ventana. Pasa mucho cuando envuelves la página en un contenedor animado.</p>\n  <p><strong>Solución:</strong> saca el elemento fijo fuera del ancestro transformado (por ejemplo, como hijo directo de <code>&lt;body&gt;</code>) o quita la transformación del ancestro cuando no la necesites.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-zindex",
  "titulo": "z-index: 9999 y sigue debajo",
  "html": "<p><strong>Síntoma:</strong> un menú, un tooltip o una etiqueta sobre tu canvas queda tapado por otro elemento, subas lo que subas su <code>z-index</code>.</p>\n  <p><strong>Causa:</strong> o el elemento no está posicionado (y su <code>z-index</code> se ignora), o un ancestro suyo crea un contexto de apilamiento (<code>z-index</code>, <code>opacity</code>, <code>transform</code>, <code>filter</code>…) que está por debajo del elemento que lo tapa. Su <code>z-index</code> solo compite dentro de ese ancestro.</p>\n  <p><strong>Solución:</strong> sube de la hoja a la raíz buscando quién crea contexto (en DevTools, el panel <em>Layers</em> o el inspector de estilos computados ayudan). Sube el <code>z-index</code> de <em>ese</em> ancestro, quita la propiedad que crea el contexto o mueve el elemento fuera de él.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-100vw",
  "titulo": "width: 100vw provoca scroll horizontal",
  "html": "<p><strong>Síntoma:</strong> un canvas o una sección con <code>width: 100vw</code> hace aparecer una barra de scroll horizontal de unos 15 px, en unos ordenadores sí y en otros no.</p>\n  <p><strong>Causa:</strong> <code>100vw</code> incluye el ancho de la barra de scroll vertical. Con una barra clásica de 15 px, lo medí: <code>100vw</code> = 800 px, pero el ancho útil del documento (<code>document.documentElement.clientWidth</code>) era 785, así que sobraban 15. En macOS con las barras superpuestas por defecto la barra no ocupa sitio y no pasa nada, por eso «en tu máquina funciona».</p>\n  <p><strong>Solución:</strong> usa <code>width: 100%</code> en los bloques y <code>position: fixed; inset: 0</code> para un canvas a pantalla completa. Para medir el ancho útil desde JavaScript, <code>document.documentElement.clientWidth</code>.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-svg-origen",
  "titulo": "Mi forma SVG gira alrededor de una esquina lejana",
  "html": "<p><strong>Síntoma:</strong> aplicas <code>transform: rotate(…)</code> a un <code>&lt;rect&gt;</code> o un <code>&lt;circle&gt;</code> de un SVG y, en vez de girar sobre sí mismo, describe un arco enorme o desaparece.</p>\n  <p><strong>Causa:</strong> en los elementos SVG, el <code>transform-origin</code> por defecto es <code>0 0</code> <em>del SVG</em>, no el centro de la forma. Lo medí: <code>getComputedStyle(rect).transformOrigin</code> dio <code>\"0px 0px\"</code>, y un rectángulo en (50, 50) girado 90° acabó en x = −70, fuera del dibujo.</p>\n  <p><strong>Solución:</strong> <code>transform-box: fill-box; transform-origin: center;</code>. Con eso, el mismo rectángulo giró sobre su propio centro.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-var-invalida",
  "titulo": "La variable CSS no aplica ni su valor ni el de respaldo",
  "html": "<p><strong>Síntoma:</strong> <code>color: var(--c, blue)</code> no sale azul, o un <code>width: var(--tam)</code> hace que la caja ocupe todo el ancho de la página.</p>\n  <p><strong>Causa:</strong> la variable existe pero su valor no tiene sentido para esa propiedad. El respaldo solo se usa cuando la variable <em>no existe</em>; si existe con un valor absurdo, la declaración queda «inválida en tiempo de cálculo» y la propiedad vuelve a su valor heredado o inicial, no a la regla anterior. Lo medí: con <code>--c: 20px</code>, el color fue el heredado del <code>body</code>; y con <code>setProperty(\"--tam\", 80)</code> (un número sin unidad), <code>width: var(--tam)</code> quedó en <code>auto</code> y la caja midió 1000 px, todo el ancho.</p>\n  <p><strong>Solución:</strong> pasa valores con su unidad (<code>\"80px\"</code>) o multiplica en el CSS con <code>calc(var(--tam) * 1px)</code>. Si algo «desaparece», lee la variable con <code>getPropertyValue</code> y comprueba que es lo que la propiedad espera.</p>",
  "leccion": {
   "num": "1.2",
   "titulo": "CSS esencial: caja, posición y transformaciones",
   "archivo": "modulos/01-web/02-css.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-ya-declarado",
  "titulo": "«Identifier 'x' has already been declared» sin haberlo declarado dos veces",
  "html": "<p><strong>Síntoma:</strong> un script entero no se ejecuta y la consola dice <code>SyntaxError: Identifier 'lienzo' has already been declared</code> (o <code>'top'</code>, <code>'status'</code>…), aunque en ese archivo solo hay una declaración.</p>\n  <p><strong>Causa:</strong> otro <code>&lt;script&gt;</code> clásico de la página ya declaró ese nombre con <code>let</code>/<code>const</code>/<code>class</code> en su nivel superior, o el nombre es una propiedad fija de <code>window</code> (<code>top</code>, <code>location</code>…). Todos los scripts clásicos comparten el ámbito global.</p>\n  <p><strong>Solución:</strong> envuelve el código de cada script en su propio ámbito, con un bloque <code>{ … }</code> o una función autoejecutada <code>(function () { … })()</code>, o renombra la variable.</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-nan",
  "titulo": "La animación desaparece sin ningún error",
  "html": "<p><strong>Síntoma:</strong> una partícula, un objeto o todo el dibujo desaparece de repente (o nunca aparece), y la consola está limpia.</p>\n  <p><strong>Causa:</strong> un <code>NaN</code> se coló en una posición y se propagó. Los orígenes típicos: dividir por cero al normalizar un vector de longitud 0 (<code>0 / 0</code>), un <code>dt</code> que vale <code>undefined</code> en el primer frame, una propiedad mal escrita (<code>p.vx</code> cuando se llamaba <code>p.velX</code> da <code>undefined</code>, y <code>undefined * dt</code> es <code>NaN</code>) o un string que no se pudo convertir.</p>\n  <p><strong>Solución:</strong> imprime la posición: si ves <code>NaN</code>, sigue hacia atrás hasta la primera operación que lo produjo. Protege las divisiones (<code>const l = Math.hypot(x, y); if (l &gt; 0) { x /= l; y /= l; }</code>) y valida entradas con <code>Number.isFinite</code>. Un <code>console.assert(Number.isFinite(p.x), p)</code> en el bucle lo caza en el acto.</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-modulo-negativo",
  "titulo": "El índice cíclico se vuelve undefined al ir hacia atrás",
  "html": "<p><strong>Síntoma:</strong> recorres una paleta de colores o unos fotogramas con <code>(i - 1) % n</code> para ir hacia atrás, y al pasar del primero sale <code>undefined</code>. O un patrón que repites con <code>x % tamaño</code> se ve bien a la derecha del origen y roto (o reflejado) a la izquierda.</p>\n  <p><strong>Causa:</strong> <code>%</code> conserva el signo del dividendo: <code>(0 - 1) % 5</code> es −1, y <code>colores[-1]</code> es <code>undefined</code>.</p>\n  <p><strong>Solución:</strong> usa un módulo de verdad, <code>((a % n) + n) % n</code> o <code>a - n * Math.floor(a / n)</code>, siempre que el dividendo pueda ser negativo.</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-cero-falsy",
  "titulo": "Pongo la velocidad a 0 y sigue moviéndose",
  "html": "<p><strong>Síntoma:</strong> un parámetro que puede valer 0 (velocidad, retraso, opacidad, un ángulo inicial, la coordenada x del ratón en el borde) se ignora y se usa el valor por defecto.</p>\n  <p><strong>Causa:</strong> el valor por defecto se escribió con <code>||</code>, como en <code>const velocidad = opciones.velocidad || 1</code>. Como 0 es falsy, <code>0 || 1</code> da 1. Lo mismo pasa con <code>if (x)</code> cuando <code>x</code> puede ser 0 legítimamente.</p>\n  <p><strong>Solución:</strong> <code>opciones.velocidad ?? 1</code>, o un parámetro con valor por defecto, <code>function animar({ velocidad = 1 } = {})</code>, que también solo actúa con <code>undefined</code>. Y compara explícitamente: <code>if (x !== undefined)</code>.</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-particulas-juntas",
  "titulo": "Todas mis partículas se mueven a la vez",
  "html": "<p><strong>Síntoma:</strong> muchos objetos que deberían ser independientes se mueven, cambian de color o reaccionan todos a la vez, como si fueran uno.</p>\n  <p><strong>Causa:</strong> comparten un objeto por referencia: se creó una vez y se asignó a todos (<code>pos: origen</code>, <code>.fill({…})</code>, un objeto de configuración reutilizado y modificado).</p>\n  <p><strong>Solución:</strong> crea un objeto nuevo por elemento (<code>Array.from({ length: n }, () =&gt; ({…}))</code>, <code>{ ...obj }</code> si es plano, <code>structuredClone</code> si tiene anidados). Para comprobarlo: <code>a.pos === b.pos</code> debe ser <code>false</code>.</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-this-perdido",
  "titulo": "«Cannot read properties of undefined» dentro de un método",
  "html": "<p><strong>Síntoma:</strong> un método de tu clase funciona si lo llamas a mano (<code>anim.paso()</code>), pero falla con <code>TypeError: Cannot read properties of undefined (reading '…')</code> (o <code>Cannot set properties of undefined</code>) cuando lo llama <code>requestAnimationFrame</code>, un <code>setTimeout</code> o un evento.</p>\n  <p><strong>Causa:</strong> se pasó el método suelto (<code>requestAnimationFrame(this.paso)</code>). El navegador lo llama sin objeto delante, y en una clase <code>this</code> vale <code>undefined</code>.</p>\n  <p><strong>Solución:</strong> pasa una flecha que lo llame como método, <code>requestAnimationFrame((t) =&gt; this.paso(t))</code>, átalo con <code>bind</code> en el constructor, o decláralo como campo flecha (<code>paso = (t) =&gt; {…}</code>).</p>",
  "leccion": {
   "num": "1.3",
   "titulo": "JavaScript I: el lenguaje",
   "archivo": "modulos/01-web/03-js-lenguaje.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-coleccion-viva",
  "titulo": "El bucle se salta la mitad de los elementos",
  "html": "<p><strong>Síntoma:</strong> recorres los elementos con una clase para quitársela (o para borrarlos) y solo se procesa uno de cada dos.</p>\n  <p><strong>Causa:</strong> <code>getElementsByClassName</code> (y <code>getElementsByTagName</code>, y <code>el.children</code>) devuelven una colección <em>viva</em>. Al quitar la clase al elemento 0, sale de la colección y el que era el 1 pasa a ser el 0; tu <code>i++</code> salta al nuevo 1 y se lo deja. Lo reproduje con cuatro <code>&lt;li class=\"item\"&gt;</code>: tras el bucle, dos seguían teniendo la clase (b y d).</p>\n  <p><strong>Solución:</strong> usa <code>querySelectorAll</code>, que devuelve una foto fija, o convierte la colección en array antes de recorrerla: <code>[...coleccion].forEach(…)</code>.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-pasivo",
  "titulo": "preventDefault() no evita que la página se desplace",
  "html": "<p><strong>Síntoma:</strong> haces zoom con la rueda o arrastras con el dedo sobre tu escena y, además, la página se desplaza. La consola dice <code>Unable to preventDefault inside passive event listener…</code>.</p>\n  <p><strong>Causa:</strong> el listener de <code>wheel</code>/<code>touchstart</code>/<code>touchmove</code> está en <code>window</code>, <code>document</code> o <code>body</code>, y Chrome lo trata como pasivo por defecto: no puede cancelar.</p>\n  <p><strong>Solución:</strong> pon el listener en el propio elemento (el canvas) o decláralo con <code>{ passive: false }</code>. Para el tacto, casi siempre es mejor la vía CSS: <code>touch-action: none</code> en el elemento le dice al navegador, antes de que llegue ningún evento, que ahí no debe desplazar ni hacer zoom. Y <code>overscroll-behavior: contain</code> evita que el desplazamiento «rebote» hacia la página.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-arrastre-perdido",
  "titulo": "El arrastre se corta al mover rápido o con el dedo",
  "html": "<p><strong>Síntoma:</strong> arrastras un objeto y, si mueves rápido, se queda atrás; o sigue «enganchado» al ratón después de soltar fuera del elemento; o en el móvil el arrastre se corta al poco de empezar y la página se desplaza.</p>\n  <p><strong>Causa:</strong> sin captura, los <code>pointermove</code> y el <code>pointerup</code> solo llegan mientras el puntero está sobre el elemento. Con el dedo, si el navegador decide desplazar, cancela el puntero con <code>pointercancel</code>.</p>\n  <p><strong>Solución:</strong> <code>el.setPointerCapture(e.pointerId)</code> en el <code>pointerdown</code>, <code>touch-action: none</code> en el CSS del elemento, y trata <code>pointercancel</code> igual que <code>pointerup</code> (termina el arrastre).</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-tecla-atascada",
  "titulo": "Una tecla se queda «pulsada» para siempre",
  "html": "<p><strong>Síntoma:</strong> en tu juego, el personaje sigue andando solo después de cambiar de pestaña, de hacer clic fuera o de abrir un diálogo mientras mantenías una tecla pulsada.</p>\n  <p><strong>Causa:</strong> guardas las teclas pulsadas en un conjunto, añadiendo en <code>keydown</code> y quitando en <code>keyup</code>. Si la ventana pierde el foco con la tecla pulsada, el <code>keyup</code> llega a otra ventana, no a la tuya. Lo reproduje: pulsé W, pasé a otra pestaña y solté W; la primera página recibió <code>blur</code> y <code>visibilitychange</code>, pero nunca el <code>keyup</code>, y seguía creyendo que W estaba pulsada.</p>\n  <p><strong>Solución:</strong> vacía el conjunto de teclas en el evento <code>blur</code> de <code>window</code> (y cuando <code>document.visibilityState</code> pase a <code>\"hidden\"</code>).</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-offsetx-hijo",
  "titulo": "Las coordenadas del ratón saltan al pasar por encima de algo",
  "html": "<p><strong>Síntoma:</strong> usas <code>e.offsetX</code>/<code>offsetY</code> para dibujar o posicionar algo bajo el puntero y, al pasar sobre un elemento hijo (un icono, una etiqueta, un texto), la posición salta de golpe.</p>\n  <p><strong>Causa:</strong> <code>offsetX</code> se mide respecto al <code>target</code>, el elemento más profundo bajo el puntero, no respecto al elemento donde pusiste el listener.</p>\n  <p><strong>Solución:</strong> calcula la posición respecto al elemento que te interesa con <code>e.clientX − el.getBoundingClientRect().left</code> (y lo mismo en Y), o pon <code>pointer-events: none</code> en los hijos para que el <code>target</code> sea siempre el padre. Lo comprobé: con los hijos así, el <code>target</code> fue siempre el padre y <code>offsetX</code> siempre relativo a él.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-raton-desplazado",
  "titulo": "El dibujo aparece desplazado del ratón, más cuanto más cerca del borde",
  "html": "<p><strong>Síntoma:</strong> pintas donde está el ratón y el trazo sale unos píxeles desplazado; en el centro casi coincide, pero cerca de los bordes el error crece. O sale bien en tu portátil y mal en otra pantalla.</p>\n  <p><strong>Causa:</strong> falta una de las piezas de la conversión. O no escalas de px CSS a px del búfer (el error es un factor <code>devicePixelRatio</code>, y crece hacia la derecha y hacia abajo), o el canvas tiene <code>border</code> o <code>padding</code>, que <code>getBoundingClientRect()</code> incluye y el búfer no. Medí un canvas con 10 px de borde, 5 de padding y 300 px de contenido: su rectángulo medía 330 px, así que la fórmula simple escalaba por 600 / 330 en vez de 600 / 300 y desplazaba el origen 15 px. Justo en el centro los dos errores se compensan, y por eso cuesta tanto verlo.</p>\n  <p><strong>Solución:</strong> escala siempre por <code>canvas.width / anchoDelContenido</code>, y si hay borde o padding, resta primero <code>canvas.clientLeft</code> (el borde) y el padding: <code>x = (e.clientX − r.left − canvas.clientLeft − paddingIzq) * canvas.width / anchoDelContenido</code>. Mejor todavía: no le pongas borde ni padding al canvas; envuélvelo en un <code>div</code> que los tenga.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-raton-invertido",
  "titulo": "En mi shader, el ratón va al revés en vertical",
  "html": "<p><strong>Síntoma:</strong> el efecto sigue al ratón en horizontal, pero en vertical va al revés: subes y el efecto baja.</p>\n  <p><strong>Causa:</strong> pasas al shader la coordenada del DOM (Y hacia abajo) y la comparas con <code>gl_FragCoord</code> (Y hacia arriba).</p>\n  <p><strong>Solución:</strong> invierte la Y al convertir: <code>y = (r.bottom − e.clientY) * (canvas.height / r.height)</code>, o <code>canvas.height − py</code> si ya tenías los píxeles desde arriba. Escala también por la relación búfer/caja, o fallará en pantallas retina.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-canvas-crece",
  "titulo": "El canvas crece sin parar hasta llenar (y romper) la página",
  "html": "<p><strong>Síntoma:</strong> al ajustar el búfer al tamaño de la caja, el canvas se hace más grande en cada frame (en una pantalla retina sí, en tu monitor normal no), y la consola se llena de <code>ResizeObserver loop completed with undelivered notifications.</code></p>\n  <p><strong>Causa:</strong> el canvas no tiene tamaño CSS. Su caja toma entonces el tamaño del búfer (lección <a href=\"modulos/01-web/01-html.html\">1.1</a>), así que multiplicar el búfer por <code>devicePixelRatio</code> agranda la caja, lo que dispara el observador, que vuelve a multiplicar… Lo reproduje con un factor de escala real de 2: la caja pasó por 600×300, 1200×600, 2400×1200… hasta 76800×38400 en menos de un segundo, con ese error en cada frame. Con factor 1 no pasaba nada, por eso «en mi máquina funciona».</p>\n  <p><strong>Solución:</strong> fija el tamaño de la caja con CSS, independiente del búfer (<code>width: 100%; height: 100%</code> en un contenedor con tamaño, o <code>position: fixed; inset: 0</code>). La caja manda y el búfer la sigue; nunca al revés.</p>",
  "leccion": {
   "num": "1.4",
   "titulo": "JavaScript II: DOM, eventos y coordenadas",
   "archivo": "modulos/01-web/04-js-dom-eventos.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-tarea-larga",
  "titulo": "La página se congela y la animación se para",
  "html": "<p><strong>Síntoma:</strong> durante un momento (al cargar datos, al generar una malla, al procesar una imagen) la animación se detiene, los botones no responden y después todo da un salto.</p>\n  <p><strong>Causa:</strong> una tarea larga ocupa el hilo principal. Mientras no termine, el event loop no puede ejecutar callbacks de rAF, ni eventos, ni pintar. Solo sobreviven las animaciones que viven en el compositor (CSS sobre <code>transform</code> y <code>opacity</code>) y el propio desplazamiento de la página, que también lo gestiona el compositor mientras no haya listeners que lo bloqueen.</p>\n  <p><strong>Solución:</strong> trocea el trabajo en pedazos de pocos milisegundos y devuelve el control al event loop entre uno y otro, esperando al siguiente frame o creando una tarea nueva (ejercicio 1.5.2); mueve el cálculo pesado a un Web Worker; y para animaciones decorativas que no deben tropezar, usa CSS sobre <code>transform</code>/<code>opacity</code>. En DevTools, las tareas de más de 50 ms aparecen marcadas en rojo como <em>long tasks</em> (lección <a href=\"modulos/01-web/07-herramientas.html\">1.7</a>).</p>",
  "leccion": {
   "num": "1.5",
   "titulo": "El event loop y el frame",
   "archivo": "modulos/01-web/05-event-loop.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-orden-timeout-raf",
  "titulo": "A veces el setTimeout va antes que el rAF, y a veces después",
  "html": "<p><strong>Síntoma:</strong> un código que registra un <code>setTimeout(fn, 0)</code> y un <code>requestAnimationFrame(fn2)</code> se comporta distinto de una ejecución a otra, o en otro ordenador.</p>\n  <p><strong>Causa:</strong> el estándar no fija si el navegador ejecuta antes la tarea del temporizador o el frame; depende de cuánto falte para el siguiente refresco. Lo medí repitiendo el puzzle clásico 40 veces: el timeout salió antes 21 veces y el rAF 19. Y justo después de un bloqueo de 100 ms, el rAF salió antes las 20 veces que lo probé, porque el frame iba con retraso.</p>\n  <p><strong>Solución:</strong> no dependas de ese orden. Si una cosa tiene que ocurrir antes de pintar, ponla en el callback de rAF; si tiene que ocurrir después de otra, encadénala explícitamente.</p>",
  "leccion": {
   "num": "1.5",
   "titulo": "El event loop y el frame",
   "archivo": "modulos/01-web/05-event-loop.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-inanicion-microtareas",
  "titulo": "Un bucle de promesas congela la página",
  "html": "<p><strong>Síntoma:</strong> la página deja de pintar y de responder, aunque tu código no tiene ningún bucle largo; o una animación «asíncrona» hecha con promesas no se ve hasta que termina entera.</p>\n  <p><strong>Causa:</strong> una cadena de microtareas que no termina (una función <code>async</code> que hace <code>await</code> de promesas ya resueltas en un bucle, o <code>queueMicrotask</code> recursivo). Las microtareas nunca ceden el paso al frame.</p>\n  <p><strong>Solución:</strong> para ceder de verdad hay que crear una <em>tarea</em> (<code>await new Promise((r) =&gt; setTimeout(r, 0))</code>, un <code>MessageChannel</code>) o esperar al siguiente frame (<code>await new Promise(requestAnimationFrame)</code>). Un <code>await</code> de algo ya resuelto no cede nada.</p>",
  "leccion": {
   "num": "1.5",
   "titulo": "El event loop y el frame",
   "archivo": "modulos/01-web/05-event-loop.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-segundo-plano",
  "titulo": "Al volver a la pestaña, la animación da un salto enorme",
  "html": "<p><strong>Síntoma:</strong> cambias de pestaña, vuelves al cabo de un rato y los objetos aparecen de golpe muy lejos, la física explota o un contador ha avanzado de golpe.</p>\n  <p><strong>Causa:</strong> mientras la pestaña estaba oculta, rAF no se ejecutó. En el primer frame al volver, el tiempo transcurrido desde el frame anterior (<code>dt</code>) son decenas de segundos, y la simulación lo aplica de una vez.</p>\n  <p><strong>Solución:</strong> limita <code>dt</code> (por ejemplo, <code>Math.min(dt, 0.1)</code>, como hacen las demos de este curso) o pausa la animación en el evento <code>visibilitychange</code> y reinicia el reloj al volver. Y nunca uses temporizadores para llevar la cuenta del tiempo: en segundo plano se ralentizan.</p>",
  "leccion": {
   "num": "1.5",
   "titulo": "El event loop y el frame",
   "archivo": "modulos/01-web/05-event-loop.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-layout-forzado",
  "titulo": "Un bucle que toca el DOM es lentísimo sin motivo aparente",
  "html": "<p><strong>Síntoma:</strong> actualizar unos cientos de elementos por frame (barras, etiquetas, posiciones) tarda decenas de milisegundos, y en el panel Performance aparecen muchos bloques morados de «Layout» dentro de tu función.</p>\n  <p><strong>Causa:</strong> dentro del bucle se alternan escrituras de estilo y lecturas de medidas: cada lectura fuerza un layout síncrono.</p>\n  <p><strong>Solución:</strong> separa las fases: primero todas las lecturas, después todas las escrituras. Mejor aún, evita leer del DOM en el bucle de animación: guarda tú las medidas en variables y actualízalas con <code>ResizeObserver</code>. Y para mover cosas, <code>transform</code>, que no necesita layout. Lo verás a fondo en la lección <a href=\"modulos/02-animacion/01-pipeline-render.html\">2.1</a>.</p>",
  "leccion": {
   "num": "1.5",
   "titulo": "El event loop y el frame",
   "archivo": "modulos/01-web/05-event-loop.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-bufferdata-array",
  "titulo": "No se dibuja nada y no hay ningún error",
  "html": "<p><strong>Síntoma:</strong> tu geometría no aparece; la consola está limpia y <code>gl.getError()</code> devuelve 0.</p>\n  <p><strong>Causa:</strong> le pasaste a <code>gl.bufferData</code> un array normal de JavaScript. Se interpretó como un <em>tamaño</em> (0 bytes), así que el buffer está vacío y no hay vértices que dibujar. Si lo que pasaste fue un <code>Float64Array</code>, el buffer tiene datos, pero de 8 bytes por número, y la GPU los lee como floats de 4: basura.</p>\n  <p><strong>Solución:</strong> <code>new Float32Array(tusNumeros)</code> para vértices, <code>Uint16Array</code> o <code>Uint32Array</code> para índices, <code>Uint8Array</code> para píxeles. Compruébalo con <code>gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)</code>: debe valer el número de elementos por los bytes de cada uno.</p>",
  "leccion": {
   "num": "1.6",
   "titulo": "Datos binarios: ArrayBuffer y TypedArrays",
   "archivo": "modulos/01-web/06-binario.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-alineacion",
  "titulo": "«start offset of Float32Array should be a multiple of 4»",
  "html": "<p><strong>Síntoma:</strong> al crear una vista sobre un buffer que contiene datos mezclados (una cabecera de 2 bytes, colores de 3 bytes…), salta este <code>RangeError</code>.</p>\n  <p><strong>Causa:</strong> una vista de floats (o de enteros de 2 o 4 bytes) solo puede empezar en un byte múltiplo de su tamaño.</p>\n  <p><strong>Solución:</strong> diseña el formato con relleno (<em>padding</em>) para que cada campo quede alineado (por ejemplo, un color de 3 bytes seguido de 1 byte de relleno), lee los campos desalineados con <code>DataView</code>, o copia el trozo a un buffer nuevo con <code>slice</code>. Es la misma razón por la que los formatos de vértices y los bloques de uniforms de la GPU tienen reglas de alineación.</p>",
  "leccion": {
   "num": "1.6",
   "titulo": "Datos binarios: ArrayBuffer y TypedArrays",
   "archivo": "modulos/01-web/06-binario.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-dataview-endian",
  "titulo": "DataView lee números absurdos (4.6e-41, 256 en vez de 1…)",
  "html": "<p><strong>Síntoma:</strong> lees con <code>DataView</code> unos datos que escribiste con un TypedArray (o que vienen de un archivo) y obtienes valores diminutos, enormes o multiplicados por 256.</p>\n  <p><strong>Causa:</strong> <code>DataView</code> usa big-endian si no le dices otra cosa, y los TypedArrays (y casi todos los formatos modernos) usan little-endian. Con los bytes <code>[1, 0]</code>, <code>getUint16(0)</code> dio 256.</p>\n  <p><strong>Solución:</strong> pasa siempre <code>true</code> como último argumento (<code>getFloat32(o, true)</code>, <code>setUint32(o, v, true)</code>) salvo que el formato sea big-endian de verdad (algunos formatos de red y de archivo antiguos lo son).</p>",
  "leccion": {
   "num": "1.6",
   "titulo": "Datos binarios: ArrayBuffer y TypedArrays",
   "archivo": "modulos/01-web/06-binario.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-desbordamiento",
  "titulo": "Al aclarar una imagen, las zonas más brillantes se vuelven oscuras",
  "html": "<p><strong>Síntoma:</strong> subes el brillo o sumas dos imágenes y justo las zonas más claras aparecen negras o de colores extraños.</p>\n  <p><strong>Causa:</strong> los píxeles están en un <code>Uint8Array</code> (o en tu propio array de bytes), y los valores de más de 255 dan la vuelta: 250 + 80 = 330 se guarda como 74.</p>\n  <p><strong>Solución:</strong> usa <code>Uint8ClampedArray</code>, que satura en 255, o limita tú el valor: <code>Math.min(255, v)</code>. En un shader no pasa: allí los colores son floats de 0 a 1 y la GPU recorta al escribir en un framebuffer de 8 bits.</p>",
  "leccion": {
   "num": "1.6",
   "titulo": "Datos binarios: ArrayBuffer y TypedArrays",
   "archivo": "modulos/01-web/06-binario.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-salto-tras-pausa",
  "titulo": "Tras un breakpoint, la animación da un salto",
  "html": "<p><strong>Síntoma:</strong> pausas en un breakpoint, miras un rato, continúas… y los objetos aparecen de golpe muy lejos o la física explota.</p>\n  <p><strong>Causa:</strong> mientras el código estaba pausado, el reloj siguió avanzando. El primer frame tras la pausa calcula un <code>dt</code> de varios segundos, igual que al volver de una pestaña en segundo plano (lección <a href=\"modulos/01-web/05-event-loop.html\">1.5</a>).</p>\n  <p><strong>Solución:</strong> la misma: limita <code>dt</code> (<code>Math.min(dt, 0.1)</code>). Una animación que sobrevive a un breakpoint también sobrevive a un cambio de pestaña y a un tirón del sistema.</p>",
  "leccion": {
   "num": "1.7",
   "titulo": "Herramientas: DevTools, servidor local y file://",
   "archivo": "modulos/01-web/07-herramientas.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-textura-file",
  "titulo": "SecurityError al subir una imagen como textura",
  "html": "<p><strong>Síntoma:</strong> <code>gl.texImage2D</code> lanza <code>SecurityError: … The image element contains cross-origin data, and may not be loaded.</code> (o <code>Tainted canvases may not be loaded.</code>) y la textura sale negra.</p>\n  <p><strong>Causa:</strong> la página está abierta con <code>file://</code> (origen opaco: cualquier imagen es de otro origen) o la imagen viene de otro servidor sin cabeceras CORS. WebGL no puede leer píxeles de otro origen.</p>\n  <p><strong>Solución:</strong> sirve la página con un servidor local (la sección siguiente). Para imágenes de otro servidor, <code>img.crossOrigin = \"anonymous\"</code> antes de <code>src</code>, y que ese servidor responda con <code>Access-Control-Allow-Origin</code>. Para ejemplos que deban funcionar con doble clic, genera las texturas con código.</p>",
  "leccion": {
   "num": "1.7",
   "titulo": "Herramientas: DevTools, servidor local y file://",
   "archivo": "modulos/01-web/07-herramientas.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-fetch-file",
  "titulo": "«Failed to fetch» al cargar un archivo local",
  "html": "<p><strong>Síntoma:</strong> <code>fetch(\"datos.json\")</code> (o de un shader en <code>.glsl</code>, o de un modelo) falla con <code>TypeError: Failed to fetch</code> y la consola habla de <code>origin 'null'</code> y CORS; o un <code>import</code> no carga.</p>\n  <p><strong>Causa:</strong> la página está abierta con <code>file://</code>. <code>fetch</code>, los módulos y los workers hacen peticiones que exigen permiso CORS, y un origen opaco no puede tenerlo.</p>\n  <p><strong>Solución:</strong> un servidor local. (Existe un parámetro de arranque de Chrome, <code>--allow-file-access-from-files</code>, con el que comprobé que <code>fetch</code>, <code>getImageData</code> y <code>texImage2D</code> pasaban a funcionar con <code>file://</code>; no lo uses para navegar: desactiva una protección real).</p>",
  "leccion": {
   "num": "1.7",
   "titulo": "Herramientas: DevTools, servidor local y file://",
   "archivo": "modulos/01-web/07-herramientas.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m1-cache-vieja",
  "titulo": "Cambio el código y el navegador sigue ejecutando el antiguo",
  "html": "<p><strong>Síntoma:</strong> editas un <code>.js</code> o un <code>.css</code>, recargas y no cambia nada; o cambia la página pero no el script. A veces «se arregla solo» al rato.</p>\n  <p><strong>Causa:</strong> la caché heurística del navegador. Sin <code>Cache-Control</code>, un archivo con un <code>Last-Modified</code> antiguo se considera fresco durante un tiempo, y la recarga normal no revalida los recursos de la página.</p>\n  <p><strong>Solución:</strong> mientras desarrollas, activa <em>Disable cache</em> en el panel Network (funciona mientras las DevTools están abiertas); o usa la recarga forzada; o, con las DevTools abiertas, clic derecho en el botón de recargar → <em>Vaciar caché y recargar de manera forzada</em>. En producción, se añade una versión al nombre o a la URL (<code>app.js?v=2</code>) para que cada cambio sea un archivo «nuevo».</p>",
  "leccion": {
   "num": "1.7",
   "titulo": "Herramientas: DevTools, servidor local y file://",
   "archivo": "modulos/01-web/07-herramientas.html"
  },
  "modulo": {
   "num": "1",
   "titulo": "Fundamentos web mínimos"
  }
 },
 {
  "id": "m2-animacion-congelada",
  "titulo": "Una animación CSS también se congela cuando la página está ocupada",
  "html": "<p><strong>Síntoma:</strong> esperabas que una animación hecha con CSS (o con <code>element.animate()</code>) siguiera fluida mientras la página carga o procesa algo, porque «las animaciones CSS van en otro hilo», y sin embargo se queda quieta y luego salta de golpe; otras animaciones CSS de la misma página sí siguen.</p>\n  <p><strong>Causa:</strong> ser declarativa no basta: la animación solo puede ejecutarse en el hilo del compositor si la propiedad es de compositor (<code>transform</code>, <code>opacity</code> y, en Chrome reciente, algunas más como <code>background-color</code> o <code>clip-path</code>). Una animación de <code>left</code>, <code>width</code>, <code>box-shadow</code> o <code>color</code> necesita estilo, layout o pintado en cada frame, que solo hace el hilo principal. Y si la escribes tú con <code>requestAnimationFrame</code>, se congela aunque sea de <code>transform</code>. El caso general de las tareas largas es el comportamiento raro <a href=\"modulos/01-web/05-event-loop.html#m1-tarea-larga\">«La página se congela y la animación se para»</a> de la lección 1.5.</p>\n  <p><strong>Solución:</strong> expresa la animación con <code>transform</code>/<code>opacity</code> y declárala en CSS o con <code>element.animate()</code> (lección <a href=\"modulos/02-animacion/07-waapi-flip.html\">2.7</a>); comprueba en qué hilo corre bloqueando el hilo principal a propósito, como en el ejemplo 2.1.2 de <a href=\"modulos/02-animacion/01-pipeline-render.html#capas-y-el-hilo-del-compositor\">2.1</a>; y trocea el trabajo pesado del hilo principal.</p>",
  "leccion": {
   "num": "2.1",
   "titulo": "Cómo pinta el navegador un frame",
   "archivo": "modulos/02-animacion/01-pipeline-render.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-tirones-periodicos",
  "titulo": "La animación va fluida pero pega un tirón cada cierto tiempo",
  "html": "<p><strong>Síntoma:</strong> una animación casi perfecta tiene un salto cada uno o dos segundos, o cada vez que ocurre algo concreto (llega un dato, salta un temporizador, haces scroll).</p>\n  <p><strong>Causa:</strong> un frame largo aislado. Suele ser una tarea que cae dentro del frame: un <code>setInterval</code> que procesa datos, un manejador de eventos pesado, una recolección de basura (GC) provocada por crear muchos objetos por frame, o un layout forzado. También aparece cuando el trabajo medio ronda el presupuesto y unos frames caben y otros no.</p>\n  <p><strong>Solución:</strong> graba una traza en DevTools → <em>Performance</em> y busca los frames marcados en rojo; mira qué tarea los ocupa. Trocea el trabajo largo, deja de crear objetos por frame (reutilízalos: lo haremos en el proyecto <a href=\"modulos/02-animacion/08-proyecto-particulas.html\">2.8</a>) y evita los layouts forzados (siguiente sección).</p>",
  "leccion": {
   "num": "2.1",
   "titulo": "Cómo pinta el navegador un frame",
   "archivo": "modulos/02-animacion/01-pipeline-render.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-transicion-no-arranca",
  "titulo": "La transición no se ejecuta al insertar un elemento",
  "html": "<p><strong>Síntoma:</strong> un elemento que creas desde JavaScript aparece de golpe, aunque tiene <code>transition</code> y le añades la clase del estado final justo después de insertarlo. Si pruebas la misma clase en un elemento que ya existía, sí se anima.</p>\n  <p><strong>Causa:</strong> una transición compara el valor calculado actual con el del cálculo de estilo <em>anterior</em>. Un elemento recién insertado no tiene cálculo anterior: su primer estilo ya incluye la clase final. Ni una microtarea ni un único <code>requestAnimationFrame</code> lo arreglan (el callback de rAF corre antes del cálculo de estilos de ese frame), y <code>setTimeout(…, 0)</code> funciona solo a veces.</p>\n  <p><strong>Solución:</strong> en CSS moderno, <code>@starting-style</code> con el estado inicial. En JavaScript, fuerza un cálculo de estilo antes de añadir la clase leyendo una propiedad (<code>getComputedStyle(el).opacity</code> o <code>el.offsetWidth</code>) o espera dos frames con dos <code>requestAnimationFrame</code> anidados. O anímalo con <code>el.animate()</code> (lección <a href=\"modulos/02-animacion/07-waapi-flip.html\">2.7</a>), que no depende del estilo anterior.</p>",
  "leccion": {
   "num": "2.2",
   "titulo": "Transiciones y keyframes CSS",
   "archivo": "modulos/02-animacion/02-css-transiciones.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-animacion-no-reinicia",
  "titulo": "La animación CSS no se repite al volver a añadir la clase",
  "html": "<p><strong>Síntoma:</strong> quitas y vuelves a poner la clase que tiene la animación (<code>el.classList.remove('sacudir'); el.classList.add('sacudir')</code>) para repetirla, y no pasa nada: la animación sigue donde estaba o no vuelve a empezar.</p>\n  <p><strong>Causa:</strong> igual que con las transiciones, el navegador solo ve los estilos cuando los calcula. Si quitas y pones la clase en la misma tarea, en el siguiente cálculo <code>animation-name</code> es el mismo que antes y la animación no se reinicia. Lo medimos: tras quitar y poner la clase, <code>currentTime</code> seguía en 400 ms; con un <code>el.offsetWidth</code> entre medias, volvió a 0.</p>\n  <p><strong>Solución:</strong> fuerza un cálculo de estilo entre quitar y poner (<code>el.offsetWidth</code>), escucha <code>animationend</code> para quitar la clase al terminar, o mejor, reinicia el objeto animación directamente: <code>el.getAnimations()[0].currentTime = 0</code>, o anímalo con <code>el.animate()</code> (lección <a href=\"modulos/02-animacion/07-waapi-flip.html\">2.7</a>).</p>",
  "leccion": {
   "num": "2.2",
   "titulo": "Transiciones y keyframes CSS",
   "archivo": "modulos/02-animacion/02-css-transiciones.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-transitionend-varias-veces",
  "titulo": "transitionend se dispara varias veces (o ninguna)",
  "html": "<p><strong>Síntoma:</strong> el código que pusiste en <code>transitionend</code> se ejecuta dos, cuatro o cinco veces; o, al revés, a veces no se ejecuta nunca y la interfaz se queda a medias.</p>\n  <p><strong>Causa:</strong> <code>transitionend</code> se dispara una vez por cada propiedad larga que termina (un <code>padding</code> son cuatro), burbujea desde los hijos que también tienen transiciones, y no se dispara si la transición se interrumpe (llega <code>transitioncancel</code>), si el elemento pasa a <code>display: none</code> o si la duración es 0.</p>\n  <p><strong>Solución:</strong> filtra con <code>e.target === el &amp;&amp; e.propertyName === 'transform'</code>, escucha también <code>transitioncancel</code>, usa <code>{ once: true }</code> solo si ya filtras dentro, y añade un plan B con un temporizador. O espera a <code>Promise.all(el.getAnimations().map(a =&gt; a.finished))</code> manejando el rechazo.</p>",
  "leccion": {
   "num": "2.2",
   "titulo": "Transiciones y keyframes CSS",
   "archivo": "modulos/02-animacion/02-css-transiciones.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-rotate-360-no-gira",
  "titulo": "Un rotate(360deg) que no gira",
  "html": "<p><strong>Síntoma:</strong> una transición o animación a <code>rotate(360deg)</code> (o <code>1turn</code>) no gira nada, o gira de forma extraña; con 180° el giro va en el sentido que no esperabas.</p>\n  <p><strong>Causa:</strong> las listas de funciones de los dos extremos no coinciden en tipo y orden (por ejemplo, <code>rotate(0deg) translateX(10px)</code> frente a <code>translateX(10px) rotate(360deg)</code>, o un extremo escrito como <code>matrix(…)</code>). Entonces se interpolan como matrices, y una matriz no distingue 0° de 360°. Lo comprobamos: en ese caso el elemento no rotaba en ningún instante de la animación.</p>\n  <p><strong>Solución:</strong> escribe las dos listas con las mismas funciones en el mismo orden (<code>translateX(10px) rotate(0deg)</code> → <code>translateX(10px) rotate(360deg)</code>) o usa la propiedad independiente <code>rotate: 360deg</code>, que se interpola sola.</p>",
  "leccion": {
   "num": "2.2",
   "titulo": "Transiciones y keyframes CSS",
   "archivo": "modulos/02-animacion/02-css-transiciones.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-velocidad-depende-hz",
  "titulo": "La animación va más rápida (o más lenta) en otra pantalla",
  "html": "<p><strong>Síntoma:</strong> la animación se ve bien en tu equipo, pero en un móvil reciente, un iPad Pro o un monitor «gaming» va al doble (o más) de velocidad; o en un equipo lento va a cámara lenta. Los tiempos de un juego (saltos, disparos) cambian según el dispositivo.</p>\n  <p><strong>Causa:</strong> el código avanza una cantidad fija <em>por frame</em> (<code>x += 3</code>, <code>angulo += 0.01</code>, <code>vida--</code>), y <code>requestAnimationFrame</code> se ejecuta a la frecuencia de la pantalla: 60, 90, 120, 144 Hz… o menos si el dispositivo no llega.</p>\n  <p><strong>Solución:</strong> expresa velocidades en unidades por segundo y multiplícalas por <code>dt</code>, los segundos transcurridos desde el frame anterior, calculados con el argumento del callback (<code>x += 180 * dt</code>). Limita <code>dt</code> para evitar saltos y, si hay física, usa un paso fijo (lección <a href=\"modulos/02-animacion/03-raf.html#paso-fijo-con-acumulador\">2.3</a>).</p>",
  "leccion": {
   "num": "2.3",
   "titulo": "requestAnimationFrame y el tiempo",
   "archivo": "modulos/02-animacion/03-raf.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-salto-al-volver",
  "titulo": "Una animación dentro de un iframe salta al volver a verla",
  "html": "<p><strong>Síntoma:</strong> una animación o una simulación dentro de un <code>iframe</code> (un anuncio, un widget incrustado, una demo de CodePen, los playgrounds de este curso) aparece desplazada de golpe, con una cuenta atrás adelantada o con la física disparada cuando vuelves a hacer scroll hasta ella, aunque la pestaña nunca estuvo oculta.</p>\n  <p><strong>Causa:</strong> Chrome deja de dar frames a los <code>iframe</code> de otro origen que no se ven (fuera de la pantalla o con <code>display: none</code>). Medido: un iframe con <code>sandbox</code> recibió 1 callback de rAF en 5 s estando 3000 px por debajo de la pantalla, frente a 301 visible. Al volver a verse, el primer <code>dt</code> incluye todo el tiempo que estuvo fuera. Es el mismo efecto que el de las pestañas ocultas (<a href=\"modulos/01-web/05-event-loop.html#m1-segundo-plano\">«Al volver a la pestaña, la animación da un salto enorme»</a>, lección 1.5), pero sin ningún <code>visibilitychange</code> que te avise.</p>\n  <p><strong>Solución:</strong> limita <code>dt</code> (<code>Math.min(dt, 0.1)</code>) en todo bucle de animación, y para simulaciones usa un paso fijo con un máximo de pasos por frame (<a href=\"modulos/02-animacion/03-raf.html#paso-fijo-con-acumulador\">2.3</a>). Si necesitas saber si el iframe se ve, un <code>IntersectionObserver</code> dentro del propio documento te lo dice.</p>",
  "leccion": {
   "num": "2.3",
   "titulo": "requestAnimationFrame y el tiempo",
   "archivo": "modulos/02-animacion/03-raf.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-setinterval-tirones",
  "titulo": "Una animación con setInterval da un tirón cada medio segundo",
  "html": "<p><strong>Síntoma:</strong> una animación movida con <code>setInterval(f, 1000/60)</code> (o <code>16</code>) va casi fluida, pero pega un pequeño salto periódico, más o menos cada 0,4 s en una pantalla de 60 Hz; en una de 120 Hz, los tirones son otros.</p>\n  <p><strong>Causa:</strong> el temporizador no está sincronizado con el refresco. El retardo se trunca a 16 ms, así que se ejecuta 62,5 veces por segundo para 60 frames: cada 24 frames, uno recibe dos actualizaciones (salto doble). Con otras frecuencias de pantalla, el desajuste produce otros patrones.</p>\n  <p><strong>Solución:</strong> anima con <code>requestAnimationFrame</code> y <code>dt</code>. Si necesitas lógica a frecuencia fija (física, red), usa un acumulador dentro del bucle de rAF, no un temporizador.</p>",
  "leccion": {
   "num": "2.3",
   "titulo": "requestAnimationFrame y el tiempo",
   "archivo": "modulos/02-animacion/03-raf.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-invlerp-nan",
  "titulo": "Un elemento animado se queda congelado en su última posición, sin ningún error",
  "html": "<p><strong>Síntoma:</strong> un elemento que animas desde JavaScript escribiendo <code>el.style.transform</code> (o <code>opacity</code>, <code>width</code>…) deja de moverse y se queda donde estaba, sin ningún error en la consola. Suele pasar en un caso límite: un rango vacío, una duración de 0, una división por una distancia que resultó ser 0.</p>\n  <p><strong>Causa:</strong> el valor calculado es <code>NaN</code> o <code>Infinity</code> (por ejemplo, <code>inverseLerp(a, b, v)</code> con <code>a === b</code>: <code>0 / 0</code> da <code>NaN</code> y <code>1 / 0</code>, <code>Infinity</code>), y al convertirlo en texto la declaración es inválida: <code>'translateX(NaNpx)'</code>. El navegador ignora en silencio las declaraciones inválidas, así que el elemento conserva el último valor válido. Lo comprobamos con <code>translateX(NaNpx)</code>, <code>translateX(Infinitypx)</code> y <code>opacity = 'NaN'</code>: ninguna cambió nada. En Canvas 2D el síntoma es otro (lo que tiene coordenadas <code>NaN</code> no se dibuja y <code>translate(NaN, 0)</code> se ignora); el caso general del <code>NaN</code> que se propaga es el comportamiento raro <a href=\"modulos/01-web/03-js-lenguaje.html#m1-nan\">«La animación desaparece sin ningún error»</a> de la lección 1.3.</p>\n  <p><strong>Solución:</strong> protege las divisiones (<code>b === a ? 0 : (v - a) / (b - a)</code>), trata las duraciones de 0 como «ya terminado» y, al depurar, comprueba <code>Number.isFinite(valor)</code> antes de escribirlo en el estilo: un <code>console.assert(Number.isFinite(x))</code> en el bucle lo caza en el acto.</p>",
  "leccion": {
   "num": "2.4",
   "titulo": "Interpolación y easing",
   "archivo": "modulos/02-animacion/04-interpolacion-easing.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-suavizado-depende-hz",
  "titulo": "El «seguimiento suave» es más rápido en pantallas de 120 Hz",
  "html": "<p><strong>Síntoma:</strong> una cámara que sigue al jugador, un cursor personalizado o un valor que se acerca «con suavidad» a su objetivo va mucho más nervioso (o más perezoso) según el equipo. A 30 fps se queda muy atrás; a 144 Hz, casi no suaviza.</p>\n  <p><strong>Causa:</strong> <code>x += (objetivo - x) * k</code> aplica una fracción fija <em>por frame</em>. Con más frames por segundo, se aplica más veces. Multiplicar <code>k</code> por <code>dt * 60</code> solo lo arregla a medias y se vuelve inestable con <code>dt</code> grandes.</p>\n  <p><strong>Solución:</strong> usa la fracción exacta para el <code>dt</code> del frame: <code>k = 1 - Math.exp(-lambda * dt)</code>, con <code>lambda = Math.LN2 / semivida</code>. Para convertir un <code>k</code> ajustado a 60 fps: <code>lambda = -60 * Math.log(1 - k)</code>.</p>",
  "leccion": {
   "num": "2.4",
   "titulo": "Interpolación y easing",
   "archivo": "modulos/02-animacion/04-interpolacion-easing.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-color-mitad-oscura",
  "titulo": "La transición entre dos colores pasa por un tono sucio y oscuro",
  "html": "<p><strong>Síntoma:</strong> al animar de un color vivo a otro (rojo → verde, azul → amarillo), a mitad de camino aparece un color apagado, grisáceo u oscuro que no está en ninguno de los dos extremos.</p>\n  <p><strong>Causa:</strong> la interpolación se hace sobre los valores sRGB codificados con gamma, que no son proporcionales a la luz ni a la percepción. De rojo (255, 0, 0) a verde (0, 255, 0), la mitad sRGB es (128, 128, 0): cada canal a «medio valor», que en luz es mucho menos de la mitad.</p>\n  <p><strong>Solución:</strong> interpola en otro espacio: en CSS, <code>linear-gradient(in oklab, …)</code> o <code>color-mix(in oklab, …)</code>; en JavaScript o GLSL, convierte a lineal (o a Oklab), interpola y vuelve a sRGB. Detalles en la lección <a href=\"modulos/06-glsl/04-color.html\">6.4</a>.</p>",
  "leccion": {
   "num": "2.4",
   "titulo": "Interpolación y easing",
   "archivo": "modulos/02-animacion/04-interpolacion-easing.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-euler-explota",
  "titulo": "Un objeto que oscila acaba cada vez más lejos hasta salir disparado",
  "html": "<p><strong>Síntoma:</strong> un péndulo, un muelle o una órbita parecen correctos al principio, pero la oscilación crece lentamente sin que nada la empuje, hasta que el objeto sale de la pantalla o los valores se vuelven <code>Infinity</code> y <code>NaN</code>. Con más FPS tarda más en pasar, pero pasa.</p>\n  <p><strong>Causa:</strong> integración con Euler explícito: la posición avanza con la velocidad del principio del paso (<code>x += v * dt</code> escrito <em>antes</em> de <code>v += a * dt</code>). En cualquier sistema oscilante, eso añade energía en cada paso.</p>\n  <p><strong>Solución:</strong> cambia el orden: primero <code>v += a * dt</code>, después <code>x += v * dt</code> (Euler semi-implícito). Si el sistema es rígido, además limita <code>dt</code> o usa subpasos (ver la estabilidad en <a href=\"modulos/02-animacion/05-fisica-muelles.html#estabilidad-cuando-explota-un-muelle\">2.5</a>).</p>",
  "leccion": {
   "num": "2.5",
   "titulo": "Física: integración y muelles",
   "archivo": "modulos/02-animacion/05-fisica-muelles.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-muelle-explota",
  "titulo": "Un muelle rígido explota al volver de otra pestaña o en un móvil lento",
  "html": "<p><strong>Síntoma:</strong> una animación con muelles funciona en tu equipo, pero en un móvil lento, al volver de otra pestaña o tras un frame largo, el objeto sale disparado, vibra con violencia o desaparece (<code>NaN</code>).</p>\n  <p><strong>Causa:</strong> el integrador (incluso el semi-implícito) es inestable cuando $\\omega_0 \\cdot dt$ supera un umbral: 2 sin rozamiento y menos con él (≈ 0,83 para un muelle crítico). Un muelle rígido (<code>k</code> grande, <code>m</code> pequeña) con un <code>dt</code> grande lo supera.</p>\n  <p><strong>Solución:</strong> limita <code>dt</code> y divídelo en subpasos pequeños (por ejemplo, de 1/240 s) dentro de cada frame; o usa un paso fijo con acumulador (<a href=\"modulos/02-animacion/03-raf.html#paso-fijo-con-acumulador\">2.3</a>); o, para el muelle crítico, usa su solución cerrada, que es exacta con cualquier <code>dt</code> (<a href=\"modulos/02-animacion/05-fisica-muelles.html#hack-la-solucion-cerrada-del-muelle-critico\">2.5</a>).</p>",
  "leccion": {
   "num": "2.5",
   "titulo": "Física: integración y muelles",
   "archivo": "modulos/02-animacion/05-fisica-muelles.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-flick-falso",
  "titulo": "Al soltar, el objeto no sale lanzado (o sale lanzado aunque lo soltaste quieto)",
  "html": "<p><strong>Síntoma:</strong> en una interfaz que se lanza con el dedo (un carrusel, una tarjeta, un mapa), a veces el gesto rápido no produce inercia; otras, el objeto sale disparado aunque el usuario se detuvo antes de soltar.</p>\n  <p><strong>Causa:</strong> la velocidad se estima con los eventos equivocados. <code>pointerup</code> tiene la misma posición que el último <code>pointermove</code>, así que la velocidad entre ellos es 0. Y los dos últimos <code>pointermove</code> pueden ser de hace cientos de milisegundos si el dedo se quedó quieto antes de soltar.</p>\n  <p><strong>Solución:</strong> guarda un historial corto de muestras con <code>e.timeStamp</code> y, al soltar, calcula la velocidad con las muestras de los últimos 80–100 ms antes del <code>pointerup</code>; si no hay muestras en esa ventana, la velocidad es 0. Limita además la velocidad máxima: un evento aislado con un <code>timeStamp</code> muy próximo al anterior puede dar valores absurdos.</p>",
  "leccion": {
   "num": "2.5",
   "titulo": "Física: integración y muelles",
   "archivo": "modulos/02-animacion/05-fisica-muelles.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-contexto-reseteado",
  "titulo": "Tras redimensionar el canvas, el dibujo sale pequeño, negro o sin estilos",
  "html": "<p><strong>Síntoma:</strong> después de cambiar el tamaño de la ventana (o en el primer frame), el canvas dibuja a la mitad de tamaño en una pantalla retina, con líneas de 1 px negras en lugar de tus colores, o sin la fuente que habías configurado. A veces el problema aparece y desaparece al cambiar de monitor.</p>\n  <p><strong>Causa:</strong> asignar <code>canvas.width</code> o <code>canvas.height</code> borra el búfer y <strong>reinicia todo el estado del contexto 2D</strong>: la transformación (tu <code>scale(dpr, dpr)</code>), <code>fillStyle</code>, <code>strokeStyle</code>, <code>lineWidth</code>, <code>font</code>, <code>globalAlpha</code>, la composición… Lo comprobamos incluso asignando el mismo valor que ya tenía.</p>\n  <p><strong>Solución:</strong> trata el estado del contexto como algo que hay que volver a poner tras cada redimensionado: aplica <code>setTransform(dpr, 0, 0, dpr, 0, 0)</code> al principio de cada frame y configura los estilos justo antes de dibujar, no una sola vez al arrancar. Y redimensiona solo si el tamaño cambió.</p>",
  "leccion": {
   "num": "2.6",
   "titulo": "Canvas 2D a fondo",
   "archivo": "modulos/02-animacion/06-canvas2d.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-beginpath-olvidado",
  "titulo": "Las formas anteriores reaparecen en el canvas y todo va cada vez más lento",
  "html": "<p><strong>Síntoma:</strong> aunque borras el canvas en cada frame, aparecen las posiciones anteriores de los objetos, todas con el último color usado; o las líneas se van engrosando y oscureciendo; y la animación, fluida al principio, se ralentiza con el tiempo.</p>\n  <p><strong>Causa:</strong> falta <code>ctx.beginPath()</code>. El path actual persiste entre llamadas y entre frames: cada <code>moveTo</code>/<code>arc</code>/<code>lineTo</code> se añade a él, y cada <code>fill()</code> o <code>stroke()</code> vuelve a pintar todos los subpaths acumulados. <code>clearRect</code> borra píxeles, no el path.</p>\n  <p><strong>Solución:</strong> llama a <code>ctx.beginPath()</code> antes de construir cada forma (o cada grupo de formas que compartan estilo). Para formas que repites, usa objetos <code>Path2D</code>, que no dependen del path actual.</p>",
  "leccion": {
   "num": "2.6",
   "titulo": "Canvas 2D a fondo",
   "archivo": "modulos/02-animacion/06-canvas2d.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-linea-medio-pixel",
  "titulo": "Una línea de 1 px sale gris, borrosa y de 2 px de ancho",
  "html": "<p><strong>Síntoma:</strong> las líneas finas de una rejilla, un gráfico o un borde dibujado con <code>stroke()</code> se ven grises y blandas en lugar de negras y definidas, aunque el grosor sea 1 y las coordenadas enteras.</p>\n  <p><strong>Causa:</strong> el trazo se centra sobre el path. Una línea de 1 píxel del búfer centrada en un entero ocupa medio píxel a cada lado, y el antialiasing pinta dos columnas al 50 %. Comprobado leyendo los píxeles: 128 y 128 en lugar de 0.</p>\n  <p><strong>Solución:</strong> haz que los bordes del trazo caigan en bordes de píxel del búfer: con grosor impar (en píxeles del búfer), coordenadas en <code>n + 0,5</code>; con grosor par, enteras. Con <code>setTransform(dpr, …)</code>, piensa en píxeles del búfer: a DPR 2, una línea de 1 px CSS mide 2 y va nítida en coordenadas CSS enteras. Para rectángulos rellenos (<code>fillRect</code>) usa coordenadas y tamaños enteros: <code>fillRect(5.5, 0, 3, 10)</code> dejó columnas a medias (128) en los dos bordes.</p>",
  "leccion": {
   "num": "2.6",
   "titulo": "Canvas 2D a fondo",
   "archivo": "modulos/02-animacion/06-canvas2d.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-estela-fantasma",
  "titulo": "La estela del canvas nunca desaparece del todo",
  "html": "<p><strong>Síntoma:</strong> con el truco de borrar cada frame con un rectángulo semitransparente, los objetos dejan un rastro tenue permanente que no se va nunca, sobre todo con estelas largas (α pequeño) y fondos no negros. En algunos monitores se ve claramente; en otros, casi nada.</p>\n  <p><strong>Causa:</strong> el canvas guarda cada canal en 8 bits. Cada frame el valor se acerca al fondo una fracción α de la distancia, redondeando al entero más cercano; cuando la distancia es menor que $0{,}5/\\alpha$ niveles, el paso redondeado es 0 y el valor se queda congelado. Medido: con α = 0,05 sobre un fondo (14, 16, 20), el píxel se quedó en (23, 25, 29).</p>\n  <p><strong>Solución:</strong> no acumules: guarda las últimas posiciones de cada objeto y redibuja la estela entera en cada frame con transparencias decrecientes (así un frame limpio borra todo). Si necesitas acumular, limpia del todo cada cierto tiempo o usa un búfer de más precisión (un framebuffer de coma flotante en WebGL, lección <a href=\"modulos/05-webgl/08-framebuffers.html\">5.8</a>).</p>",
  "leccion": {
   "num": "2.6",
   "titulo": "Canvas 2D a fondo",
   "archivo": "modulos/02-animacion/06-canvas2d.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-alfa-premultiplicado",
  "titulo": "getImageData no devuelve los colores que escribiste con putImageData",
  "html": "<p><strong>Síntoma:</strong> escribes un píxel semitransparente con <code>putImageData</code> y, al leerlo con <code>getImageData</code>, el color es otro. Con transparencias muy bajas el error es enorme; los datos que guardabas «dentro» de un canvas (una tabla, un mapa de alturas) se corrompen.</p>\n  <p><strong>Causa:</strong> internamente el canvas guarda los colores <em>premultiplicados</em> por su alfa (R·A, G·A, B·A), en 8 bits. Al escribir se multiplica y al leer se divide, y se pierde precisión. Medido: escribimos (255, 128, 7, 3) y leímos (255, 170, 0, 3); con (200, 100, 50, 128) leímos (199, 100, 50, 128). Con alfa 0, el color se pierde por completo.</p>\n  <p><strong>Solución:</strong> no uses un canvas 2D como almacén de datos arbitrarios si el alfa no es 255: guarda los datos en un <code>TypedArray</code> propio. Si solo necesitas mostrar píxeles, trabaja con alfa 255. Para datos en la GPU, las texturas de WebGL (<a href=\"modulos/05-webgl/05-texturas.html\">5.5</a>) permiten controlar la premultiplicación.</p>",
  "leccion": {
   "num": "2.6",
   "titulo": "Canvas 2D a fondo",
   "archivo": "modulos/02-animacion/06-canvas2d.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-abort-error",
  "titulo": "«Uncaught (in promise) AbortError: The user aborted a request» sin haber hecho ninguna petición",
  "html": "<p><strong>Síntoma:</strong> la consola muestra un <code>AbortError</code> con el mensaje «The user aborted a request», aunque tu código no hace ninguna petición de red. A veces, además, una secuencia de animaciones encadenadas con <code>await</code> se detiene a medias.</p>\n  <p><strong>Causa:</strong> estabas esperando <code>animacion.finished</code> y la animación se canceló (con <code>cancel()</code>, al reemplazarla por otra o al desaparecer el elemento). La promesa <code>finished</code> se rechaza con un <code>AbortError</code> y, sin <code>try</code>/<code>catch</code> o <code>.catch()</code>, el rechazo queda sin manejar y la función asíncrona se interrumpe en ese <code>await</code>.</p>\n  <p><strong>Solución:</strong> captura el rechazo cuando la cancelación sea un caso normal: <code>await anim.finished.catch(() =&gt; {})</code>, o <code>try { await anim.finished } catch (e) { if (e.name !== 'AbortError') throw e }</code>. Y decide qué debe pasar con el resto de la secuencia si se cancela.</p>",
  "leccion": {
   "num": "2.7",
   "titulo": "Web Animations API y la técnica FLIP",
   "archivo": "modulos/02-animacion/07-waapi-flip.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-fill-forwards-pegado",
  "titulo": "Tras animar con fill: forwards, el elemento ignora los cambios de estilo",
  "html": "<p><strong>Síntoma:</strong> después de una animación de la Web Animations API, asignas <code>el.style.transform</code> (o añades una clase que cambia la propiedad) y el elemento no se mueve. Si inspeccionas el estilo, el valor inline es el nuevo, pero el valor calculado sigue siendo el final de la animación.</p>\n  <p><strong>Causa:</strong> una animación con <code>fill: 'forwards'</code> (o <code>'both'</code>) sigue aplicando su valor final para siempre, y las animaciones van por encima de los estilos normales en la cascada, incluido el atributo <code>style</code>.</p>\n  <p><strong>Solución:</strong> al terminar, <code>anim.commitStyles()</code> y <code>anim.cancel()</code>: el valor final pasa al atributo <code>style</code> y la animación desaparece. O cancela las animaciones anteriores (<code>el.getAnimations().forEach(a =&gt; a.cancel())</code>) antes de aplicar el estilo nuevo.</p>",
  "leccion": {
   "num": "2.7",
   "titulo": "Web Animations API y la técnica FLIP",
   "archivo": "modulos/02-animacion/07-waapi-flip.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-emision-por-frame",
  "titulo": "Salen el doble de partículas en una pantalla de 120 Hz",
  "html": "<p><strong>Síntoma:</strong> un efecto de partículas se ve denso en unos equipos y ralo en otros, o el rendimiento se hunde precisamente en los dispositivos con pantalla rápida (que acaban simulando el doble de partículas).</p>\n  <p><strong>Causa:</strong> la emisión se expresa por frame (<code>emitir(40)</code> en cada callback de rAF) y los frames por segundo dependen de la pantalla: 60, 120, 144 Hz…</p>\n  <p><strong>Solución:</strong> expresa la emisión en partículas por segundo y acumula la parte fraccionaria: <code>pendiente += tasa * dt; const n = Math.floor(pendiente); pendiente -= n; emitir(n);</code>. Así, con 2400/s, a 60 Hz salen 40 por frame y a 144 Hz, 16 o 17 alternados, siempre 2400 por segundo.</p>",
  "leccion": {
   "num": "2.8",
   "titulo": "Proyecto: partículas interactivas",
   "archivo": "modulos/02-animacion/08-proyecto-particulas.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-splice-en-bucle",
  "titulo": "Al borrar elementos de un array dentro de un bucle, algunos se saltan",
  "html": "<p><strong>Síntoma:</strong> al eliminar las partículas muertas recorriendo el array con un <code>for</code> y <code>splice(i, 1)</code>, algunas partículas muertas sobreviven un frame más (o para siempre, si el patrón se repite), o una de cada dos no se actualiza.</p>\n  <p><strong>Causa:</strong> <code>splice(i, 1)</code> desplaza todos los elementos siguientes una posición hacia atrás; el siguiente queda en el índice <code>i</code>, y el bucle pasa a <code>i + 1</code> sin mirarlo. Lo comprobamos: en <code>[1, 2, 3, 4, 5, 6]</code> con 2 y 3 muertas, borrar hacia delante dejó <code>1 3 4 5 6</code>, con la 3 muerta dentro. Además, cada <code>splice</code> mueve todo el resto del array: con miles de partículas, es muy lento.</p>\n  <p><strong>Solución:</strong> recorre el array hacia atrás (de <code>length − 1</code> a 0) si usas <code>splice</code>; o <code>filter</code> (crea un array nuevo); o, en un pool, intercambia la muerta con la última viva y no avances el índice (etapa 2 de <a href=\"modulos/02-animacion/08-proyecto-particulas.html#etapa-2-un-pool-con-arrays-tipados\">2.8</a>).</p>",
  "leccion": {
   "num": "2.8",
   "titulo": "Proyecto: partículas interactivas",
   "archivo": "modulos/02-animacion/08-proyecto-particulas.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m2-fuerza-infinita",
  "titulo": "Las partículas salen disparadas al pasar cerca del atractor",
  "html": "<p><strong>Síntoma:</strong> en una simulación con atracción hacia un punto (el ratón, un planeta), la mayoría de partículas orbitan bien, pero de vez en cuando una sale despedida a una velocidad enorme, o desaparece porque su posición se vuelve <code>NaN</code>.</p>\n  <p><strong>Causa:</strong> la fuerza es proporcional a $1/d^2$. Cuando la partícula pasa muy cerca del centro, $d$ es casi 0 y la aceleración de ese paso es gigantesca; con un paso de tiempo finito, la partícula no «ve» cómo la fuerza cambia de sentido al cruzar el centro y sale con toda esa velocidad. Con $d = 0$ exacto, la división da <code>Infinity</code> o <code>NaN</code>.</p>\n  <p><strong>Solución:</strong> <em>softening</em>: usa $d^2 + \\varepsilon^2$ en lugar de $d^2$ (con $\\varepsilon$ del orden del tamaño del atractor, por ejemplo 20 px). La fuerza queda acotada y se anula suavemente en el centro. Opcionalmente, limita también la velocidad máxima.</p>",
  "leccion": {
   "num": "2.8",
   "titulo": "Proyecto: partículas interactivas",
   "archivo": "modulos/02-animacion/08-proyecto-particulas.html"
  },
  "modulo": {
   "num": "2",
   "titulo": "Animación con CSS y JavaScript"
  }
 },
 {
  "id": "m3-raton-y-invertida",
  "titulo": "El efecto del ratón va al revés en vertical",
  "html": "<p><strong>Síntoma:</strong> mueves el ratón hacia arriba y el círculo que debería seguirlo baja; en horizontal va bien. O bien el efecto sigue al ratón solo si el lienzo ocupa toda la ventana, y se desplaza cuando hay algo encima.</p>\n  <p><strong>Causa:</strong> <code>clientY</code> crece hacia abajo y <code>gl_FragCoord.y</code> hacia arriba. Si pasas <code>clientY</code> tal cual al shader, la y queda reflejada. El segundo síntoma es otro olvido: <code>clientY</code> se mide desde la ventana, no desde el lienzo; hay que restar <code>getBoundingClientRect().top</code>.</p>\n  <p><strong>Solución:</strong> <code>y = (rect.bottom - e.clientY) * dpr</code>, que resta el borde del lienzo y da la vuelta al eje en una sola operación. Y multiplica por el dpr, o el efecto irá a la mitad de camino en pantallas de alta densidad. En la demo de arriba puedes comparar los valores de pantalla y GL.</p>",
  "leccion": {
   "num": "3.1",
   "titulo": "Vectores y coordenadas",
   "archivo": "modulos/03-matematicas/01-vectores.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-normalizar-cero",
  "titulo": "La partícula desaparece al llegar a su objetivo",
  "html": "<p><strong>Síntoma:</strong> un objeto que persigue un punto funciona perfectamente… hasta que lo alcanza. Entonces desaparece para siempre, sin ningún error en la consola. A veces solo pasa «de vez en cuando».</p>\n  <p><strong>Causa:</strong> cuando la posición coincide exactamente con el objetivo, el vector entre ambos es $(0,0)$ y normalizarlo divide 0 entre 0: <code>NaN</code>. La posición se vuelve <code>NaN</code> y ya no sale de ahí (<code>NaN + lo_que_sea</code> es <code>NaN</code>). Canvas 2D no lanza ningún error con coordenadas NaN: <code>ctx.arc(NaN, NaN, …)</code> no dibuja nada. Es intermitente porque solo ocurre cuando los números caen <em>exactamente</em> en el objetivo.</p>\n  <p><strong>Solución:</strong> antes de dividir, comprueba la longitud: si es menor que el paso de este frame, coloca el objeto en el objetivo y no normalices (es el ejemplo 3.1.2). En una librería, decide qué devuelve <code>normalizar</code> para el vector nulo y documéntalo: <code>glkit.js</code>, la librería del curso, devuelve $(0,0,0)$, lo que esconde el NaN pero puede ocultar también el error. Para cazar el problema, <code>Number.isNaN(pos.x)</code> en un <code>console.assert</code>.</p>",
  "leccion": {
   "num": "3.1",
   "titulo": "Vectores y coordenadas",
   "archivo": "modulos/03-matematicas/01-vectores.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-diagonal-rapida",
  "titulo": "En diagonal el personaje va más rápido",
  "html": "<p><strong>Síntoma:</strong> con dos teclas de dirección pulsadas, o con el joystick en una esquina, el personaje recorre más distancia por segundo que en horizontal o vertical. En los juegos de carreras de antes, correr en diagonal era un «truco» conocido.</p>\n  <p><strong>Causa:</strong> la entrada $(1, 1)$ mide $\\sqrt{2}$, no 1. Sumar ejes independientes produce vectores cuyo recorrido es un cuadrado, y las esquinas del cuadrado están más lejos del centro que sus lados.</p>\n  <p><strong>Solución:</strong> limita la longitud de la entrada a 1 antes de multiplicar por la velocidad (<code>limitar(entrada, 1)</code>). No la normalices sin más: rompería la media velocidad de un joystick analógico y daría NaN con la entrada <code>(0, 0)</code>.</p>",
  "leccion": {
   "num": "3.1",
   "titulo": "Vectores y coordenadas",
   "archivo": "modulos/03-matematicas/01-vectores.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-acos-nan",
  "titulo": "acos devuelve NaN con vectores casi paralelos",
  "html": "<p><strong>Síntoma:</strong> un cálculo de ángulo funciona siempre, salvo en algunos casos «de libro» en los que da <code>NaN</code>: justo cuando los dos vectores son paralelos. El objeto que debía girar hacia su objetivo desaparece cuando ya lo tiene delante.</p>\n  <p><strong>Causa:</strong> por el redondeo, el coseno calculado puede pasarse de 1 por una unidad del último bit, y <code>acos</code> de algo mayor que 1 no existe. En JavaScript, si normalizas <code>(7, 7)</code> dividiendo cada componente entre <code>Math.hypot(7, 7)</code> y haces el producto punto del resultado consigo mismo, sale <code>1.0000000000000002</code>, y <code>Math.acos</code> de eso es <code>NaN</code>. (Con <code>(1, 1)</code> sale <code>0.9999999999999998</code> y funciona, y con la <code>normalizar</code> de 3.1, que multiplica por <code>1 / l</code>, también da <code>0.9999999999999998</code> para <code>(7, 7)</code>: depende de los bits exactos y de cómo normalices.) En la GPU pasa lo mismo en float32: en nuestra prueba, <code>dot(normalize(a), normalize(2.0 * a))</code> con <code>a = (0.3, 0.7, 0.1)</code> dio <code>1.0000001</code> y <code>acos</code> devolvió NaN.</p>\n  <p><strong>Solución:</strong> recorta siempre antes de <code>acos</code> o <code>asin</code>: <code>acos(clamp(c, -1.0, 1.0))</code>. Y si puedes, no uses <code>acos</code>: compara cosenos, o calcula el ángulo con signo como <code>atan(cruz, punto)</code> (lo verás en la sección de la cruz 2D), que además es más preciso para ángulos pequeños.</p>",
  "leccion": {
   "num": "3.2",
   "titulo": "Producto punto y producto cruz",
   "archivo": "modulos/03-matematicas/02-producto-punto-cruz.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-luz-sin-normalizar",
  "titulo": "La iluminación sale quemada o cambia con la distancia",
  "html": "<p><strong>Síntoma:</strong> una superficie iluminada sale demasiado brillante, «quemada» en blanco, o su brillo cambia al alejar la luz aunque la dirección no cambie. A veces la iluminación se ve facetada o con manchas en una malla que debería ser suave.</p>\n  <p><strong>Causa:</strong> $\\hat N \\cdot \\hat L$ solo es un coseno si <strong>los dos</strong> vectores son unitarios. <code>luz - P</code> mide la distancia a la luz, así que el producto punto sale multiplicado por esa distancia y pasa de 1. El segundo caso es muy frecuente cuando la normal llega interpolada desde los vértices (un <em>varying</em>, <a href=\"modulos/04-gpu/05-uniforms-varyings.html\">4.5</a>), como en el cubo iluminado de <a href=\"modulos/05-webgl/06-3d-cubo.html\">5.6</a>: ya no mide 1, porque la media de dos vectores unitarios es más corta que ellos.</p>\n  <p><strong>Solución:</strong> <code>normalize()</code> los dos vectores justo antes del producto punto, también la normal interpolada en el fragment shader. Si quieres que la luz se atenúe con la distancia, hazlo aparte y a propósito (dividiendo por la distancia al cuadrado, por ejemplo), no por accidente.</p>",
  "leccion": {
   "num": "3.2",
   "titulo": "Producto punto y producto cruz",
   "archivo": "modulos/03-matematicas/02-producto-punto-cruz.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-reflect-sin-normalizar",
  "titulo": "El rebote sale con un ángulo absurdo o gana velocidad",
  "html": "<p><strong>Síntoma:</strong> la pelota rebota en direcciones raras, sale más rápido de lo que llegó o se «cuela» por la pared; un reflejo en un shader apunta hacia donde no debe.</p>\n  <p><strong>Causa:</strong> <code>reflect</code> (o tu versión en JavaScript) recibió una normal que no es unitaria. Con $|\\vec n| = 2$, el término $2(\\vec d\\cdot\\vec n)\\vec n$ se multiplica por 4 en lugar de por 1. En nuestra prueba en la GPU, reflejar $(0.707, -0.707, 0)$ en un suelo con normal $(0, 2, 0)$ dio $(0.707, 4.95, 0)$ en vez de $(0.707, 0.707, 0)$.</p>\n  <p><strong>Solución:</strong> normaliza la normal antes de reflejar. Si la normal viene de una arista (<code>perp(B - A)</code>) o de una interpolación, casi seguro que no mide 1.</p>",
  "leccion": {
   "num": "3.2",
   "titulo": "Producto punto y producto cruz",
   "archivo": "modulos/03-matematicas/02-producto-punto-cruz.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-winding-pantalla",
  "titulo": "Izquierda y derecha salen al revés en Canvas",
  "html": "<p><strong>Síntoma:</strong> el test de «de qué lado de la recta» funciona en el papel pero en Canvas 2D da el lado contrario; los polígonos que deberían ser antihorarios salen horarios; un personaje que debería girar a la izquierda gira a la derecha.</p>\n  <p><strong>Causa:</strong> la fórmula del producto cruz no cambia, pero en coordenadas de pantalla la y crece hacia abajo, y eso refleja el dibujo como en un espejo. Un giro que en números es «antihorario» (cruz positiva) se <em>ve</em> horario en pantalla. Pasa también con los ángulos: <code>ctx.rotate(0.5)</code> gira en sentido horario en pantalla.</p>\n  <p><strong>Solución:</strong> no mezcles convenciones. Decide en qué sistema trabajas (en Canvas, casi siempre en el de pantalla) e interpreta el signo en ese sistema: con la y hacia abajo, cruz positiva significa «a la derecha, visto en pantalla». Si portas código de un libro o de un shader (y hacia arriba), invierte la interpretación o convierte las coordenadas primero.</p>",
  "leccion": {
   "num": "3.2",
   "titulo": "Producto punto y producto cruz",
   "archivo": "modulos/03-matematicas/02-producto-punto-cruz.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-grados-radianes",
  "titulo": "Math.sin(90) no da 1",
  "html": "<p><strong>Síntoma:</strong> <code>Math.sin(90)</code> devuelve <code>0.8939966636005579</code>; un objeto que debería girar 45° da vueltas como loco; <code>ctx.rotate(90)</code> deja la imagen en un ángulo raro.</p>\n  <p><strong>Causa:</strong> las funciones esperan radianes y les has dado grados. 90 radianes son unas 14.3 vueltas, y el seno de eso es 0.894.</p>\n  <p><strong>Solución:</strong> convierte en la frontera: <code>const rad = grados * Math.PI / 180</code>. JavaScript no trae una función para esto; GLSL sí: <code>radians(90.0)</code> y <code>degrees(x)</code>. Mejor aún, trabaja en radianes en todo el código y usa grados solo para mostrar números a personas.</p>",
  "leccion": {
   "num": "3.3",
   "titulo": "Trigonometría útil: ondas, ángulos y polares",
   "archivo": "modulos/03-matematicas/03-trigonometria.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-costura-atan",
  "titulo": "Una costura recta a la izquierda del centro",
  "html": "<p><strong>Síntoma:</strong> un patrón radial perfecto tiene una línea de corte, un salto brusco, que sale del centro hacia la izquierda (el eje x negativo). A veces solo aparece con ciertos valores de un parámetro.</p>\n  <p><strong>Causa:</strong> <code>atan</code> devuelve ángulos en $(-\\pi, \\pi]$, así que al cruzar el eje x negativo el ángulo salta de π a −π. Si lo que calculas con el ángulo es periódico con periodo $2\\pi$ (<code>sin(a * 6.0)</code>, con un número entero de ciclos por vuelta), el salto no se nota: los dos lados dan el mismo valor. Si no lo es (<code>sin(a * 5.5)</code>, o el ángulo usado directamente como color), los dos lados no casan.</p>\n  <p><strong>Solución:</strong> usa solo funciones del ángulo que den un número entero de ciclos por vuelta. Si necesitas un valor que crezca con el ángulo (un degradado que dé la vuelta), acepta la costura y colócala donde no se vea, girando el ángulo antes: <code>atan(p.y, p.x) + desfase</code>, o intercambiando los argumentos.</p>",
  "leccion": {
   "num": "3.3",
   "titulo": "Trigonometría útil: ondas, ángulos y polares",
   "archivo": "modulos/03-matematicas/03-trigonometria.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-salto-frecuencia",
  "titulo": "Al cambiar la frecuencia en vivo, la onda da un salto",
  "html": "<p><strong>Síntoma:</strong> una animación oscilante funciona bien, pero cuando cambias su velocidad sobre la marcha (con un deslizador, o acelerando al pasar el ratón), el objeto pega un salto brusco, y cuanto más tiempo lleva abierta la página, más violento es el salto.</p>\n  <p><strong>Causa:</strong> en $\\sin(2\\pi f t)$ la fase es $2\\pi f t$. Si cambias $f$ de repente, cambias también toda la fase acumulada: con $t = 100$ s, pasar de 1 Hz a 1.005 Hz desplaza la fase $2\\pi\\cdot 0.005 \\cdot 100 = \\pi$ radianes de golpe: el objeto salta al extremo opuesto de su recorrido. La fórmula calcula dónde <em>estaría</em> el objeto si siempre hubiera ido a la nueva frecuencia.</p>\n  <p><strong>Solución:</strong> acumula la fase en lugar de calcularla desde el tiempo: en cada frame, <code>fase += 2 * Math.PI * f * dt</code>, y dibuja con <code>Math.sin(fase)</code>. Al cambiar <code>f</code> solo cambia la velocidad a partir de ahora. (En un shader, acumula la fase en JavaScript y pásala como uniform.) En la demo siguiente, mueve el deslizador de frecuencia y compara los dos puntos.</p>",
  "leccion": {
   "num": "3.3",
   "titulo": "Trigonometría útil: ondas, ángulos y polares",
   "archivo": "modulos/03-matematicas/03-trigonometria.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-giro-largo",
  "titulo": "La torreta da una vuelta completa al cruzar por la izquierda",
  "html": "<p><strong>Síntoma:</strong> un objeto que gira hacia su objetivo lo hace bien casi siempre, pero cuando el objetivo cruza cierta línea (a la izquierda del objeto en pantalla), gira 360° en sentido contrario en lugar de moverse un poco. Con interpolación de ángulos (<code>lerp</code> entre 170° y −170°) pasa lo mismo: recorre 340° en lugar de 20°.</p>\n  <p><strong>Causa:</strong> los ángulos son circulares: −170° y 190° son la misma dirección, pero como números están lejos. <code>atan2</code> devuelve valores en $(-\\pi, \\pi]$ y salta al cruzar π.</p>\n  <p><strong>Solución:</strong> antes de usar una diferencia de ángulos, llévala a $(-\\pi, \\pi]$: <code>d = Math.atan2(Math.sin(d), Math.cos(d))</code>. Para interpolar ángulos, interpola <code>a + envolver(b - a) * t</code>. O evita los ángulos: interpola las direcciones como vectores y normaliza.</p>",
  "leccion": {
   "num": "3.3",
   "titulo": "Trigonometría útil: ondas, ángulos y polares",
   "archivo": "modulos/03-matematicas/03-trigonometria.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-smoothstep-invertido",
  "titulo": "Un smoothstep invertido da 0 (a veces)",
  "html": "<p><strong>Síntoma:</strong> una transición escrita como <code>smoothstep(borde1, borde0, x)</code> (bordes al revés) funciona casi siempre, pero en cierto caso se vuelve negra, o funciona en un navegador y en otro no.</p>\n  <p><strong>Causa:</strong> con <code>edge0 &gt;= edge1</code> el resultado es indefinido según la especificación. Las GPU suelen aplicar la fórmula tal cual (y el resultado sale invertido), pero un compilador puede hacer otra cosa: ANGLE, cuando todos los argumentos son constantes, lo evalúa al compilar y devuelve 0. Con <code>edge0 == edge1</code> la fórmula divide por cero: en el borde exacto sale 0/0.</p>\n  <p><strong>Solución:</strong> escribe siempre los bordes en orden creciente e invierte con <code>1.0 - smoothstep(…)</code>. En el editor de abajo, el tercio izquierdo usa la versión constante, el central la misma cuenta con una variable y el derecho la versión portable. Los tres deberían ser iguales.</p>",
  "leccion": {
   "num": "3.4",
   "titulo": "Funciones de forma: step, smoothstep, fract, mod…",
   "archivo": "modulos/03-matematicas/04-funciones-forma.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-mod-negativos",
  "titulo": "El patrón o la animación se rompe al cruzar el cero",
  "html": "<p><strong>Síntoma:</strong> algo que se repite (un patrón, un índice circular, un mundo que da la vuelta) funciona en los valores positivos y falla en los negativos: los objetos desaparecen por la izquierda o por abajo, un patrón se refleja como en un espejo al cruzar el origen, una celda del centro sale el doble de ancha.</p>\n  <p><strong>Causa:</strong> se ha usado una operación que trunca hacia el cero donde hacía falta una que redondee hacia abajo. El <code>%</code> de JavaScript devuelve restos negativos para dividendos negativos; <code>int(x)</code> y <code>trunc(x)</code> en GLSL mandan −0.7 y 0.7 al mismo entero (0), así que la celda del 0 es el doble de ancha; y el <code>%</code> de enteros en GLSL con negativos es indefinido.</p>\n  <p><strong>Solución:</strong> para envolver y para numerar celdas, <code>floor</code> y <code>mod</code> (en JavaScript, <code>x - y * Math.floor(x / y)</code>). En GLSL, <code>floor(p)</code> en lugar de <code>int(p)</code>, y <code>mod(a, b)</code> con floats en lugar de <code>%</code> con enteros negativos.</p>",
  "leccion": {
   "num": "3.4",
   "titulo": "Funciones de forma: step, smoothstep, fract, mod…",
   "archivo": "modulos/03-matematicas/04-funciones-forma.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-pow-negativo",
  "titulo": "Manchas negras o huecos con pow",
  "html": "<p><strong>Síntoma:</strong> un efecto que usa <code>pow</code> tiene zonas negras, o una curva desaparece en ciertos tramos; o funciona con <code>pow(x, 2.0)</code> y se rompe al cambiar el 2.0 por un uniform; o funciona en un ordenador y no en otro.</p>\n  <p><strong>Causa:</strong> la base de <code>pow</code> es negativa en esos píxeles (típicamente, porque es un seno, un producto punto o una resta que a veces baja de 0). El resultado es indefinido: NaN en la mayoría de los casos, y NaN se pinta como negro y contagia todo lo que toca.</p>\n  <p><strong>Solución:</strong> asegura una base no negativa: <code>pow(max(x, 0.0), k)</code> si solo te interesa la parte positiva, o <code>sign(x) * pow(abs(x), k)</code> si quieres la curva simétrica. Para cuadrados y cubos, multiplica: <code>x * x</code> es más rápido, exacto y está definido para cualquier <code>x</code>. En el graficador de abajo, la curva violeta desaparece en los arcos negativos del seno: el graficador no dibuja los valores NaN.</p>",
  "leccion": {
   "num": "3.4",
   "titulo": "Funciones de forma: step, smoothstep, fract, mod…",
   "archivo": "modulos/03-matematicas/04-funciones-forma.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-orden-transformaciones",
  "titulo": "El objeto orbita alrededor del origen en lugar de girar sobre sí mismo",
  "html": "<p><strong>Síntoma:</strong> quieres que un objeto gire sobre sí mismo y, en cambio, describe un círculo enorme alrededor de un punto de la pantalla (la esquina, o el centro del mundo). O bien, al escalarlo, además de crecer se desplaza.</p>\n  <p><strong>Causa:</strong> la traslación se aplicó <em>antes</em> que la rotación o la escala (por ejemplo, <code>M = R · T</code>, o en CSS <code>rotate(…) translate(…)</code>): cuando llega la rotación, el objeto ya está lejos del origen y gira alrededor de él. En CSS hay una segunda causa: <code>transform-origin</code>, el punto alrededor del cual se aplica todo (por defecto, el centro del elemento; en SVG, la esquina del lienzo).</p>\n  <p><strong>Solución:</strong> orden TRS (<code>translate(…) rotate(…) scale(…)</code> en CSS, <code>T · R · S</code> con matrices). Para girar alrededor de un pivote $C$ que no es el origen del objeto: <code>T(C) · R · T(−C)</code>, que es exactamente lo que hace <code>transform-origin</code> por dentro: $M_{final} = T(o)\\cdot M\\cdot T(-o)$.</p>",
  "leccion": {
   "num": "3.5",
   "titulo": "Matrices y transformaciones",
   "archivo": "modulos/03-matematicas/05-matrices.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-matriz-traspuesta",
  "titulo": "El objeto gira al revés y no se traslada (o se deforma)",
  "html": "<p><strong>Síntoma:</strong> la rotación va en sentido contrario, la traslación no tiene efecto o hace algo absurdo, y en 3D la geometría se deforma en perspectiva o desaparece. Con la matriz identidad todo va bien.</p>\n  <p><strong>Causa:</strong> la matriz está <strong>traspuesta</strong>: se escribió fila a fila en un array que GL interpreta columna a columna, se pasó a un constructor de GLSL en el orden de filas, o se multiplicó <code>v * M</code> en lugar de <code>M * v</code>. La traspuesta de una rotación es la rotación inversa (gira al revés), y la traslación, que debía estar en la última columna, acaba en la última fila, la que calcula w. En un vertex shader, esa w distinta de 1 hace que la división de perspectiva (<a href=\"modulos/03-matematicas/06-espacios-coordenadas.html\">3.6</a>) deforme toda la geometría.</p>\n  <p><strong>Solución:</strong> comprueba con una matriz de traslación pura, que es asimétrica y delata el problema: sus números 12, 13, 14 deben ser la traslación. Imprime las matrices como en papel (<code>mat4.texto(m)</code> de <code>glkit.js</code>). En GLSL, multiplica siempre <code>M * v</code>. En el editor de abajo, activa la casilla para ver el error en vivo.</p>",
  "leccion": {
   "num": "3.5",
   "titulo": "Matrices y transformaciones",
   "archivo": "modulos/03-matematicas/05-matrices.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-rotacion-inversa-shader",
  "titulo": "En el shader todo se mueve al revés",
  "html": "<p><strong>Síntoma:</strong> en un fragment shader, sumas un desplazamiento a las coordenadas y el dibujo se mueve hacia el lado contrario; aplicas una rotación y gira en sentido opuesto; multiplicas por 2 para agrandarlo y se hace más pequeño.</p>\n  <p><strong>Causa:</strong> no estás transformando el dibujo, sino las <strong>coordenadas con las que cada píxel lo consulta</strong>. Si el píxel pregunta por el punto <code>p + (0.3, 0)</code>, ve lo que en el dibujo está 0.3 a la derecha: el dibujo parece haberse movido a la <em>izquierda</em>. Transformar las coordenadas equivale a aplicar al dibujo la transformación inversa.</p>\n  <p><strong>Solución:</strong> aplica a las coordenadas la inversa de lo que quieres ver: para mover el dibujo a la derecha, resta; para girarlo θ, gira las coordenadas −θ; para agrandarlo ×2, divide por 2. Con matrices: <code>inverse(M) * p</code>, como en el ejemplo. Es la misma relación que hay entre mover un objeto y mover la cámara en sentido contrario, que verás en <a href=\"modulos/03-matematicas/06-espacios-coordenadas.html\">3.6</a>.</p>",
  "leccion": {
   "num": "3.5",
   "titulo": "Matrices y transformaciones",
   "archivo": "modulos/03-matematicas/05-matrices.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-lookat-degenerado",
  "titulo": "La cámara que mira recto hacia abajo no ve nada",
  "html": "<p><strong>Síntoma:</strong> la escena se ve bien desde cualquier ángulo, pero cuando la cámara mira exactamente hacia abajo (o hacia arriba), todo desaparece, se colapsa en una línea o empieza a girar de forma errática.</p>\n  <p><strong>Causa:</strong> si la dirección de mirada es paralela a <code>arriba</code> (mirar a (0, −1, 0) con <code>arriba = (0, 1, 0)</code>), su producto cruz es el vector nulo y normalizarlo da NaN, o en <code>glkit.js</code>, que se protege de la división por cero, el vector (0, 0, 0). Con <code>ojo = (0, 5, 0)</code> y <code>objetivo</code> en el origen, <code>mat4.mirarA</code> devuelve una matriz con las dos primeras filas llenas de ceros: toda la escena se proyecta sobre un punto. Cerca de esa posición, el eje x cambia bruscamente al mover un poco la cámara, y la imagen gira.</p>\n  <p><strong>Solución:</strong> evita que la mirada sea paralela a <code>arriba</code>: limita el ángulo de elevación de una cámara orbital a ±89°, o elige otro <code>arriba</code> cuando <code>|dot(arriba, ẑ)|</code> se acerque a 1 (es el ejercicio 3.6.4). Las cámaras que necesitan mirar en cualquier dirección (simuladores de vuelo) guardan su orientación con cuaterniones en lugar de reconstruirla con <code>lookAt</code>.</p>",
  "leccion": {
   "num": "3.6",
   "titulo": "De modelo a pantalla: espacios de coordenadas",
   "archivo": "modulos/03-matematicas/06-espacios-coordenadas.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-aspecto",
  "titulo": "Todo sale estirado (o se estira al redimensionar)",
  "html": "<p><strong>Síntoma:</strong> los círculos salen ovalados y los cubos alargados; o todo se ve bien hasta que cambias el tamaño de la ventana, y a partir de ahí la imagen se estira o se aplasta.</p>\n  <p><strong>Causa:</strong> la matriz de proyección usa un aspecto que no coincide con el de la imagen: se olvidó (aspecto 1 en una imagen de 16:9), se calculó con el tamaño CSS en vez del del <em>drawing buffer</em>, o no se recalculó al redimensionar el canvas. En 2D es el mismo error que usar uv sin corregir en lugar de coordenadas centradas (<a href=\"modulos/03-matematicas/01-vectores.html\">3.1</a>).</p>\n  <p><strong>Solución:</strong> <code>aspecto = canvas.width / canvas.height</code> (el tamaño real del buffer), y vuelve a construir la matriz de proyección (y a llamar a <code>gl.viewport</code>) cada vez que cambie el tamaño del canvas (<a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>).</p>",
  "leccion": {
   "num": "3.6",
   "titulo": "De modelo a pantalla: espacios de coordenadas",
   "archivo": "modulos/03-matematicas/06-espacios-coordenadas.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-detras-camara",
  "titulo": "Geometría reflejada o triángulos gigantes que cruzan la pantalla",
  "html": "<p><strong>Síntoma:</strong> en un proyector 3D hecho a mano (en Canvas 2D, o proyectando puntos en JavaScript para colocar etiquetas HTML sobre objetos 3D), aparecen copias invertidas de objetos que están detrás de la cámara, o líneas enormes que atraviesan la imagen cuando la cámara se acerca a un objeto.</p>\n  <p><strong>Causa:</strong> se ha dividido por w sin comprobar su signo ni recortar. Con w &lt; 0 (detrás de la cámara), la división invierte x e y; con w cerca de 0, los valores se disparan. La GPU nunca comete este error porque recorta en espacio clip antes de dividir, pero tu código sí puede.</p>\n  <p><strong>Solución:</strong> antes de dividir, recorta cada segmento o triángulo contra el plano near ($z_c \\ge -w_c$ en GL) interpolando en espacio clip; para puntos sueltos (etiquetas), basta con no dibujar los que tengan $w \\le 0$. En la demo de la cámara, activa «sin recorte» y mete la cámara dentro del cubo.</p>",
  "leccion": {
   "num": "3.6",
   "titulo": "De modelo a pantalla: espacios de coordenadas",
   "archivo": "modulos/03-matematicas/06-espacios-coordenadas.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-mediump-movil",
  "titulo": "Funciona en el ordenador y falla en el móvil",
  "html": "<p><strong>Síntoma:</strong> un shader perfecto en el escritorio se ve mal en un teléfono: el ruido sale a bloques o desaparece, las animaciones van a saltos, las coordenadas de textura tiemblan en imágenes grandes, aparecen franjas en los degradados o todo se vuelve negro a partir de cierto valor.</p>\n  <p><strong>Causa:</strong> <code>precision mediump float</code> (muy común en código antiguo y en tutoriales de WebGL1). En el escritorio es float32 y no se nota; en el móvil es float16: con 11 bits significativos, 1000.3 se guarda como 1000.5, <code>u_time</code> a los 10 minutos ya avanza a saltos de medio segundo (y a partir de los 17, de un segundo entero), y cualquier valor por encima de 65 504 es infinito.</p>\n  <p><strong>Solución:</strong> <code>precision highp float;</code> para todo lo que sean posiciones, coordenadas de textura, tiempo y hashes. <code>mediump</code> solo compensa en cálculos de color en GPU de móvil muy justas. Y prueba en un móvil de verdad, o simula el float16 (<code>Math.f16round</code> en JavaScript, o la función <code>fp16()</code> de los shaders de abajo).</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-tiempo-horas",
  "titulo": "La animación va a saltos tras horas con la página abierta",
  "html": "<p><strong>Síntoma:</strong> una animación en shader (o en JavaScript, si pasa el tiempo por <code>Float32Array</code>) funciona perfectamente al cargar la página, pero tras varias horas o días se vuelve entrecortada, tiembla o se deforma. Recargar la página «lo arregla». Típico de pantallas de exposición, fondos animados y salvapantallas.</p>\n  <p><strong>Causa:</strong> el tiempo en segundos crece sin límite y, en float32, pierde resolución (ULP de 0.0078 s a las 24 h, 0.016 s a los 3 días, 0.031 s pasados los 3 días y 1 hora); además, <code>sin</code> y <code>cos</code> de argumentos grandes son imprecisos en la GPU. Con <code>mediump</code> en un móvil pasa en minutos (el bicho <a href=\"modulos/03-matematicas/07-precision.html#m3-mediump-movil\">«Funciona en el ordenador y falla en el móvil»</a>), y con la hora del sistema, desde el primer frame: <code>Date.now()</code> son milisegundos desde 1970, unos 1,8 billones, y en float32 sus valores representables están separados 2¹⁷ ms, más de dos minutos (lo mides en <a href=\"modulos/05-webgl/04-uniforms-animacion.html#el-tiempo-en-segundos-y-por-que-pierde-precision\">5.4</a>).</p>\n  <p><strong>Solución:</strong> envuelve el tiempo en JavaScript, donde es un double, antes de enviarlo: <code>gl.uniform1f(loc, (performance.now() / 1000) % PERIODO)</code>, con <code>PERIODO</code> múltiplo de todos los periodos de tu animación (para que el salto al envolver no se note). Si las frecuencias no tienen un múltiplo común razonable, acumula la fase de cada oscilación en JavaScript (<code>fase = (fase + 2π·f·dt) % (2π)</code>) y envía las fases. Es el ejemplo siguiente. Y manda siempre segundos desde el arranque de la animación, nunca <code>Date.now()</code>.</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-hash-roto",
  "titulo": "El ruido se convierte en rayas o bloques (o desaparece en el móvil)",
  "html": "<p><strong>Síntoma:</strong> un efecto con ruido (grano, estrellas, disolución) se ve bien cerca del origen y se llena de rayas o repeticiones al desplazarte lejos; o se ve distinto en cada ordenador; o en el móvil el ruido es un color plano.</p>\n  <p><strong>Causa:</strong> el hash <code>fract(sin(…) * 43758.5453)</code> depende de las cifras menos significativas de un float32 y de un seno de precisión indefinida. Con argumentos grandes o con float16, esas cifras no existen.</p>\n  <p><strong>Solución:</strong> mantén pequeñas las coordenadas que entran al hash (envuélvelas con <code>mod</code> a un periodo de unos cientos de celdas: en nuestras pruebas la calidad ya caía hacia la celda 500), usa <code>highp</code>, o mejor, cambia a un hash de enteros: con GLSL ES 3.00 tienes <code>uint</code>, desplazamientos y XOR, y hashes como PCG son exactos, rápidos y reproducibles. Más en <a href=\"modulos/06-glsl/06-ruido.html\">6.6</a>.</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-temblor-mundo-grande",
  "titulo": "El personaje tiembla lejos del origen",
  "html": "<p><strong>Síntoma:</strong> cerca del centro del mundo todo va bien; a medida que te alejas, los objetos vibran al mover la cámara, las mallas se «descomponen» con vértices que saltan, las sombras y las texturas parpadean.</p>\n  <p><strong>Causa:</strong> las posiciones de mundo en float32 tienen una rejilla de precisión que crece con la distancia al origen (0.0625 a un millón de unidades), y la resta mundo − cámara en la GPU se hace con esos números ya redondeados.</p>\n  <p><strong>Solución:</strong> resta la cámara en la CPU con doble precisión (renderizado relativo a la cámara) u origen flotante. Y elige unidades sensatas: si tu mundo cabe en ±10 000 unidades, trabajas con precisión submilimétrica.</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-nan-pixel-negro",
  "titulo": "Píxeles negros sueltos o manchas negras que crecen",
  "html": "<p><strong>Síntoma:</strong> aparecen píxeles negros aislados (a menudo en el centro exacto de algo, en un borde o en una esquina), o una mancha negra que crece con los frames en un efecto de varias pasadas.</p>\n  <p><strong>Causa:</strong> un NaN (o un infinito) en el cálculo de esos píxeles: una normalización de un vector nulo, una raíz de un negativo, una división por una distancia que vale 0. Al escribirse, NaN se convierte en negro (en nuestra GPU); en efectos que leen el frame anterior o promedian vecinos, se propaga.</p>\n  <p><strong>Solución:</strong> protege las operaciones peligrosas: <code>max(x, 0.0)</code> antes de <code>sqrt</code> y <code>pow</code>, <code>clamp</code> antes de <code>acos</code>, <code>max(length(v), 1e-6)</code> antes de dividir, y comprueba el vector nulo antes de normalizar. Para localizar el NaN, pinta de un color chillón los píxeles donde <code>isnan()</code> sea verdadero (<code>any(isnan(v)) ? vec4(1.0, 0.0, 1.0, 1.0) : color</code>; lo practicarás en <a href=\"modulos/05-webgl/10-depuracion.html#ver-lo-que-calcula-la-gpu\">5.10</a>)… pero lee antes la caja siguiente.</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-isnan-heisenbug",
  "titulo": "Añadir isnan() para depurar cambia el resultado",
  "html": "<p><strong>Síntoma:</strong> un shader tiene un problema visual; añades una comprobación con <code>isnan()</code> para encontrar el NaN y… el problema cambia de forma, desaparece o aparece en otro sitio. O bien <code>x != x</code> nunca detecta nada, aunque hay NaN a la vista.</p>\n  <p><strong>Causa:</strong> el compilador optimiza suponiendo que no existen NaN ni infinitos (<em>fast math</em>): pliega <code>x != x</code> a false, <code>x * 0</code> a 0, <code>x / x</code> a 1. En Chrome sobre Metal, usar <code>isnan</code> o <code>isinf</code> desactiva esas optimizaciones en todo el shader, y con ellas cambian los resultados de todas las operaciones indefinidas.</p>\n  <p><strong>Solución:</strong> no dependas de comportamientos indefinidos: elimina la causa del NaN (bases negativas, divisiones por cero, raíces de negativos) en lugar de detectarlo después. Para detectar NaN, usa <code>isnan()</code>, nunca <code>x != x</code>, y ten presente que la versión con la comprobación puede comportarse distinto de la versión sin ella: verifica el arreglo con el código final.</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m3-contador-congelado",
  "titulo": "Un contador se queda congelado o avanza de dos en dos",
  "html": "<p><strong>Síntoma:</strong> tras mucho tiempo, un contador de frames o de eventos deja de avanzar, o avanza a saltos de 2, 4, 8; los IDs de objetos muy numerosos se repiten.</p>\n  <p><strong>Causa:</strong> el contador es un float32 y ha superado $2^{24}$: <code>x + 1</code> se redondea a <code>x</code>.</p>\n  <p><strong>Solución:</strong> cuenta con enteros (<code>int</code>/<code>uint</code> en GLSL, números normales en JavaScript, que son exactos hasta $2^{53}$) y, si el valor llega a la GPU como float, envíalo envuelto (<code>frame % 1000000</code>).</p>",
  "leccion": {
   "num": "3.7",
   "titulo": "Precisión numérica: floats en CPU y GPU",
   "archivo": "modulos/03-matematicas/07-precision.html"
  },
  "modulo": {
   "num": "3",
   "titulo": "Matemáticas para gráficos"
  }
 },
 {
  "id": "m4-if-lento",
  "titulo": "Un if que casi nunca se cumple hace el shader el doble de lento",
  "html": "<p><strong>Síntoma:</strong> añades a un shader una rama cara que «solo afecta a unos pocos píxeles» (el brillo de unas pocas estrellas, un efecto cuando el ruido supera un umbral) y el shader entero pasa a costar casi lo mismo que si todos los píxeles la ejecutaran.</p>\n  <p><strong>Causa:</strong> divergencia. Si los píxeles que toman la rama están <em>salpicados</em> por la pantalla, casi todos los warps contienen al menos uno, y un warp paga la rama entera en cuanto un solo carril la necesita. Con una probabilidad $p$ por píxel, independiente, la fracción de warps de 32 que la pagan es $1 - (1-p)^{32}$: con $p = 0{,}1$ ya es el 97 %.</p>\n  <p><strong>Solución:</strong> haz la condición <em>coherente</em> (que dependa de regiones grandes: bloques de la pantalla, un uniform, una textura de baja resolución), abarata la rama o divide el trabajo en dos pasadas: una que marque dónde hace falta el efecto y otra que lo calcule solo ahí. Y mide: no te fíes de la intuición.</p>",
  "leccion": {
   "num": "4.1",
   "titulo": "CPU vs GPU: paralelismo, draw calls y la máquina de estados",
   "archivo": "modulos/04-gpu/01-cpu-vs-gpu.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-drawcall-0ms",
  "titulo": "performance.now() dice que dibujar no cuesta nada (y el frame va a tirones)",
  "html": "<p><strong>Síntoma:</strong> mides tu función de dibujo con <code>performance.now()</code> y tarda 0,2 ms, pero la animación va a 20 fps. O cambias un shader por otro diez veces más caro y la medida no se mueve.</p>\n  <p><strong>Causa:</strong> estás midiendo el tiempo de <em>apuntar</em> las órdenes en el command buffer, no el de ejecutarlas. La GPU trabaja después, en paralelo, y el cuello de botella está allí.</p>\n  <p><strong>Solución:</strong> mide la GPU con <code>EXT_disjoint_timer_query_webgl2</code> (cuando exista) o con una barrera (<code>readPixels</code> de un píxel antes y después, solo mientras depuras). Y mira también la pestaña <em>Performance</em> de DevTools, que muestra la actividad de la GPU aparte (<a href=\"modulos/01-web/07-herramientas.html\">1.7</a>); el método completo para saber si te frena la CPU o la GPU está en <a href=\"modulos/05-webgl/10-depuracion.html#me-frena-la-cpu-o-la-gpu\">5.10</a>.</p>",
  "leccion": {
   "num": "4.1",
   "titulo": "CPU vs GPU: paralelismo, draw calls y la máquina de estados",
   "archivo": "modulos/04-gpu/01-cpu-vs-gpu.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-readpixels-lento",
  "titulo": "readPixels o getError tardan milisegundos y congelan el frame",
  "html": "<p><strong>Síntoma:</strong> un <code>getError()</code> puesto «por si acaso» después de cada llamada, o un <code>readPixels</code> en cada frame, y la aplicación pierde fluidez aunque la GPU vaya sobrada.</p>\n  <p><strong>Causa:</strong> son <strong>puntos de sincronización</strong>. <code>getError</code> obliga a un viaje de ida y vuelta al proceso de la GPU (de 30 a 60 µs cada uno en nuestra máquina, según lo ocupada que esté); <code>readPixels</code> además espera a que terminen todos los dibujos anteriores. Mientras, la CPU no hace nada y la GPU se queda sin trabajo encolado: se pierde el paralelismo.</p>\n  <p><strong>Solución:</strong> <code>getError</code> solo en depuración (o una vez por frame, al final). Las lecturas, diferidas uno o dos frames con <code>fenceSync</code>. Y nunca compruebes <code>getShaderParameter</code>/<code>getProgramParameter</code> en el bucle de dibujo: solo al crear los programas.</p>",
  "leccion": {
   "num": "4.1",
   "titulo": "CPU vs GPU: paralelismo, draw calls y la máquina de estados",
   "archivo": "modulos/04-gpu/01-cpu-vs-gpu.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-tiron-primer-dibujo",
  "titulo": "Un tirón la primera vez que se dibuja algo nuevo",
  "html": "<p><strong>Síntoma:</strong> la animación va fluida, pero da un tirón (un frame de varios milisegundos de más) la primera vez que aparece un objeto con un shader nuevo, o la primera vez que activas el blending para algo. Las veces siguientes, nada.</p>\n  <p><strong>Causa:</strong> las API modernas (Metal, Direct3D 12, Vulkan) no tienen «estado suelto»: cada combinación de shaders + blending + formato de destino se compila en un objeto de estado de pipeline. ANGLE lo crea (y lo guarda en caché) la <em>primera</em> vez que dibujas con esa combinación. En el M1 medimos: primer <code>drawArrays</code> tras enlazar un programa, 4,7–7 ms; el segundo, 0,5 ms. El primer dibujo con un blending nuevo, 3,6–5,5 ms; el segundo, 0,5 ms. Y eso aparte de los 12–22 ms del propio <code>linkProgram</code>.</p>\n  <p><strong>Solución:</strong> «precalienta» durante la carga: dibuja una vez con cada combinación de programa y estado que vayas a usar, sobre el mismo tipo de destino, sin que se vea. Medimos que sirven tanto un triángulo colocado fuera de la pantalla como un dibujo con <code>gl.viewport(0, 0, 0, 0)</code>: ese dibujo se lleva los 5 ms y el primero de verdad baja a 0,5–1 ms. Y compila los programas pronto; la extensión <code>KHR_parallel_shader_compile</code> permite hacerlo sin bloquear (lo medirás en <a href=\"modulos/05-webgl/02-primer-triangulo.html\">5.2</a>).</p>",
  "leccion": {
   "num": "4.1",
   "titulo": "CPU vs GPU: paralelismo, draw calls y la máquina de estados",
   "archivo": "modulos/04-gpu/01-cpu-vs-gpu.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-bind-para-editar",
  "titulo": "Actualizo un buffer (o una textura) y cambia otro objeto",
  "html": "<p><strong>Síntoma:</strong> actualizas los vértices de un objeto y se deforma otro distinto; o cambias el filtrado de una textura y cambia el de otra; o un objeto que dibujabas bien desaparece después de llamar a una función auxiliar que «no tenía nada que ver».</p>\n  <p><strong>Causa:</strong> las funciones de edición (<code>bufferData</code>, <code>bufferSubData</code>, <code>texParameteri</code>, <code>texImage2D</code>…) actúan sobre el objeto <em>enlazado</em> en ese punto de enlace, y alguien (a menudo una función auxiliar) dejó enlazado otro. El estado persiste entre llamadas y entre frames.</p>\n  <p><strong>Solución:</strong> la regla de oro: <strong>enlaza siempre justo antes de editar</strong>, aunque creas que ya está enlazado. Las llamadas de enlace son baratísimas (se resuelven en el proceso de tu página). Y al terminar de configurar un VAO, desenlázalo (<code>gl.bindVertexArray(null)</code>) para que un <code>bindBuffer(ELEMENT_ARRAY_BUFFER, …)</code> posterior no lo modifique por accidente.</p>",
  "leccion": {
   "num": "4.1",
   "titulo": "CPU vs GPU: paralelismo, draw calls y la máquina de estados",
   "archivo": "modulos/04-gpu/01-cpu-vs-gpu.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-dividir-por-w",
  "titulo": "El triángulo desaparece o se deforma cuando un vértice pasa detrás de la cámara",
  "html": "<p><strong>Síntoma:</strong> una malla se ve bien, pero en cuanto la cámara se acerca y algún vértice queda detrás, los triángulos que lo tocan desaparecen, se estiran por toda la pantalla o se «dan la vuelta».</p>\n  <p><strong>Causa:</strong> casi siempre, que el vertex shader hace él mismo la división de perspectiva: <code>gl_Position = vec4(p.xyz / p.w, 1.0)</code>. Así la GPU recibe un vértice con $w = 1$ que ya no sabe que estaba detrás de la cámara, y no puede recortarlo bien. En Chrome lo medimos con un triángulo con un vértice detrás: bien hecho cubre 21 952 píxeles; dividiendo en el shader, solo 720 (una astilla en el borde).</p>\n  <p><strong>Solución:</strong> entrega <code>gl_Position</code> <em>sin dividir</em>, con su $w$. La división la hace el hardware después del recorte. Lo arreglarás en el ejercicio 4.2.3.</p>",
  "leccion": {
   "num": "4.2",
   "titulo": "El pipeline gráfico etapa por etapa",
   "archivo": "modulos/04-gpu/02-pipeline-grafico.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-escala-negativa",
  "titulo": "Al reflejar un objeto (escala negativa) desaparece o se ve por dentro",
  "html": "<p><strong>Síntoma:</strong> para hacer el simétrico de un objeto aplicas una escala <code>(-1, 1, 1)</code> en la matriz de modelo, y con el culling activado el objeto desaparece o solo se ven sus caras interiores.</p>\n  <p><strong>Causa:</strong> una reflexión invierte el sentido de giro de todos los triángulos en la pantalla: los antihorarios pasan a ser horarios. El culling descarta ahora las caras que miran a la cámara y deja las de atrás.</p>\n  <p><strong>Solución:</strong> cuando el determinante de la matriz de modelo sea negativo (una sola reflexión, o un número impar), cambia el convenio mientras dibujas ese objeto: <code>gl.frontFace(gl.CW)</code>, y vuelve a <code>gl.CCW</code> después. Recuerda que es estado global: si no lo restauras, fallará el siguiente objeto (<a href=\"modulos/04-gpu/01-cpu-vs-gpu.html\">4.1</a>).</p>",
  "leccion": {
   "num": "4.2",
   "titulo": "El pipeline gráfico etapa por etapa",
   "archivo": "modulos/04-gpu/02-pipeline-grafico.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-clear-no-borra",
  "titulo": "gl.clear no borra toda la pantalla (o no borra un canal)",
  "html": "<p><strong>Síntoma:</strong> después de dibujar algo con el scissor activado, o con <code>colorMask</code>, <code>gl.clear</code> deja restos del frame anterior: solo se limpia un rectángulo, o el color de fondo sale mal.</p>\n  <p><strong>Causa:</strong> <code>gl.clear</code> <em>respeta</em> el scissor y las máscaras de escritura. Lo comprobamos: con el scissor en un cuadrado de 16 × 16, <code>clear</code> solo pinta ese cuadrado; con <code>colorMask(false, true, true, true)</code>, no toca el canal rojo.</p>\n  <p><strong>Solución:</strong> antes de limpiar, deja el estado limpio: <code>gl.disable(gl.SCISSOR_TEST)</code>, <code>gl.colorMask(true, true, true, true)</code> y, si limpias la profundidad, <code>gl.depthMask(true)</code>. Otra vez la máquina de estados.</p>",
  "leccion": {
   "num": "4.2",
   "titulo": "El pipeline gráfico etapa por etapa",
   "archivo": "modulos/04-gpu/02-pipeline-grafico.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-discard-lento",
  "titulo": "Añadir un discard hace el shader más lento, aunque descarte píxeles",
  "html": "<p><strong>Síntoma:</strong> para «ahorrar trabajo» añades <code>if (alfa &lt; 0.5) discard;</code> a un shader, o dejas un <code>discard</code> en una rama que casi nunca se ejecuta, y la escena va más lenta.</p>\n  <p><strong>Causa:</strong> con <code>discard</code> (o con <code>gl_FragDepth</code>) la GPU no puede probar la profundidad antes de sombrear ni eliminar superficies ocultas: tiene que ejecutar el shader de todos los fragmentos para saber cuáles sobreviven. Medido en el M1: 32 capas con un <code>discard</code> que nunca se ejecuta, entre 17 y 27 veces el coste de una (según la ejecución); sin él, el coste de una.</p>\n  <p><strong>Solución:</strong> usa shaders sin <code>discard</code> para todo lo opaco y reserva los que descartan para lo que de verdad lo necesita (vegetación, rejillas), dibujado aparte. No escribas <code>gl_FragDepth</code> salvo que sea imprescindible.</p>",
  "leccion": {
   "num": "4.2",
   "titulo": "El pipeline gráfico etapa por etapa",
   "archivo": "modulos/04-gpu/02-pipeline-grafico.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-uno-de-diferencia",
  "titulo": "Mi cálculo en la CPU da 230 y la GPU escribe 229",
  "html": "<p><strong>Síntoma:</strong> calculas en JavaScript o en Python el color que debería salir (por ejemplo, <code>Math.round(0.9 * 255)</code>, que da 230) y al leer el píxel de la GPU con <code>readPixels</code> obtienes 229. La diferencia es de uno y aparece solo con algunos valores.</p>\n  <p><strong>Causa:</strong> JavaScript y Python calculan en doble precisión (64 bits); los shaders, en float32. El número 0,9 no existe exactamente en ninguno de los dos formatos: en float64 es 0,90000000000000002, y $\\times 255$ da 229,50000000000000…6, que redondea a 230; en float32 es 0,89999997615814, y $\\times 255$ da 229,4999939, que redondea a 229. Nuestra primera versión de la GPU de juguete no pasaba por float32 y difería de la GPU real en 13 633 píxeles (todos por 1). Con <code>f32</code>, en 0.</p>\n  <p><strong>Solución:</strong> no compares colores de la GPU con igualdad exacta: usa una tolerancia de ±1 en los bytes. Y si necesitas reproducir en la CPU el resultado exacto de un shader, redondea los intermedios a float32 (<code>Math.fround</code> en JavaScript, <code>numpy.float32</code> o <code>struct</code> en Python).</p>",
  "leccion": {
   "num": "4.3",
   "titulo": "Una GPU de juguete en Python",
   "archivo": "modulos/04-gpu/03-gpu-de-juguete.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-imagen-boca-abajo",
  "titulo": "La imagen que guardo del framebuffer sale boca abajo",
  "html": "<p><strong>Síntoma:</strong> lees los píxeles del framebuffer (con <code>gl.readPixels</code>, <code>glReadPixels</code> en Python o <code>fbo.read()</code> en moderngl), los guardas como imagen y sale volteada verticalmente.</p>\n  <p><strong>Causa:</strong> en GL la fila 0 es la de <em>abajo</em> (la y crece hacia arriba) y las lecturas devuelven las filas en ese orden. Los formatos de imagen (PNG, el <code>ImageData</code> de Canvas 2D) empiezan por la fila de <em>arriba</em>.</p>\n  <p><strong>Solución:</strong> invierte el orden de las filas al guardar. En la GPU de juguete lo hace <code>Framebuffer.filas_de_arriba_abajo</code>; con Pillow, <code>imagen.transpose(Image.Transpose.FLIP_TOP_BOTTOM)</code> (lo verás en <a href=\"modulos/04-gpu/06-opengl-python.html\">4.6</a>). No «arregles» el problema dando la vuelta a la geometría: la imagen en pantalla ya está bien.</p>",
  "leccion": {
   "num": "4.3",
   "titulo": "Una GPU de juguete en Python",
   "archivo": "modulos/04-gpu/03-gpu-de-juguete.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-stride-en-elementos",
  "titulo": "La malla sale hecha trizas (stride u offset en floats, no en bytes)",
  "html": "<p><strong>Síntoma:</strong> los triángulos aparecen estirados hasta el infinito, en posiciones absurdas o no aparecen; los colores parecen ruido. O WebGL avisa: <code>GL_INVALID_OPERATION: glVertexAttribPointer: Stride must be a multiple of the passed in datatype</code>.</p>\n  <p><strong>Causa:</strong> <code>stride</code> y <code>offset</code> se miden en bytes, y has pasado el número de componentes: por ejemplo, stride 3 en lugar de 12 para un vértice de 3 floats. La GPU lee entonces floats que empiezan a mitad de otro float y los interpreta tal cual: en la GPU de juguete, leer la posición del vértice 1 con stride 3 da <code>(107376120.0, 1.6e-19)</code>. WebGL, además, exige que stride y offset sean múltiplos del tamaño del tipo (4 para <code>FLOAT</code>) y que el stride no pase de 255.</p>\n  <p><strong>Solución:</strong> multiplica por el tamaño del tipo: <code>stride = componentesPorVértice * 4</code> para floats. Si usas un <code>Float32Array</code>, <code>Float32Array.BYTES_PER_ELEMENT</code> (4) deja claro qué estás multiplicando.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-sin-normalizar",
  "titulo": "Los colores salen blancos (o saturados) aunque el buffer está bien",
  "html": "<p><strong>Síntoma:</strong> guardas los colores de los vértices como bytes (0–255) para ahorrar memoria y la malla sale completamente blanca, o con colores chillones.</p>\n  <p><strong>Causa:</strong> <code>normalized = false</code> en <code>vertexAttribPointer</code>: el shader recibe 255,0 en lugar de 1,0, y el framebuffer satura todo lo que pasa de 1. El mismo síntoma aparece si pones en un buffer de floats valores de 0 a 255 (y en el <code>clearColor</code>: es el ejercicio 5.1.1).</p>\n  <p><strong>Solución:</strong> <code>gl.vertexAttribPointer(loc, 4, gl.UNSIGNED_BYTE, true, stride, offset)</code>. Si de verdad quieres los enteros sin escalar, recíbelos como enteros (siguiente apartado) o divide en el shader.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-tipo-atributo",
  "titulo": "drawArrays falla con «Vertex shader input type does not match the type of the bound vertex attribute»",
  "html": "<p><strong>Síntoma:</strong> no se dibuja nada y la consola dice <code>GL_INVALID_OPERATION: glDrawArrays: Vertex shader input type does not match the type of the bound vertex attribute</code>.</p>\n  <p><strong>Causa:</strong> el shader declara el atributo como entero (<code>in int</code>, <code>ivec4</code>, <code>uvec4</code>) y lo configuraste con <code>vertexAttribPointer</code> (que entrega floats), o al revés; o mezclaste signos: <code>vertexAttribIPointer(…, gl.UNSIGNED_BYTE, …)</code> con <code>in ivec4</code> (lo medimos: <code>INVALID_OPERATION</code>; con <code>uvec4</code> funciona).</p>\n  <p><strong>Solución:</strong> que coincidan función, tipo y signo: <code>vertexAttribPointer</code> ↔ <code>float/vecN</code>; <code>vertexAttribIPointer</code> con tipos con signo ↔ <code>int/ivecN</code>; con tipos sin signo ↔ <code>uint/uvecN</code>.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-ebo-vao-equivocado",
  "titulo": "drawElements dibuja la malla de otro objeto (o falla con «Must have element array buffer bound»)",
  "html": "<p><strong>Síntoma:</strong> una malla se dibuja con los índices de otra (triángulos que conectan vértices al azar), o <code>drawElements</code> falla con <code>GL_INVALID_OPERATION: glDrawElements: Must have element array buffer bound</code> aunque «acabas de enlazar el EBO».</p>\n  <p><strong>Causa:</strong> el enlace <code>ELEMENT_ARRAY_BUFFER</code> es estado del VAO que esté enlazado en ese momento. Si enlazas el EBO antes de enlazar tu VAO, se lo queda el VAO anterior; si lo desenlazas (<code>null</code>) con tu VAO enlazado, se lo quitas.</p>\n  <p><strong>Solución:</strong> sigue el orden del ejemplo 4.4.2: VAO, buffers, atributos, EBO, y desenlazar el VAO al final. Para comprobarlo, con tu VAO enlazado, <code>gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING)</code> debe devolver tu EBO.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-vao-buffer-antiguo",
  "titulo": "Cambio el buffer y la malla no se actualiza",
  "html": "<p><strong>Síntoma:</strong> para cambiar la geometría creas un buffer nuevo, lo rellenas y lo enlazas en <code>ARRAY_BUFFER</code>, pero se sigue dibujando la malla antigua.</p>\n  <p><strong>Causa:</strong> el VAO guarda el buffer que había enlazado cuando llamaste a <code>vertexAttribPointer</code>. Enlazar otro en <code>ARRAY_BUFFER</code> no afecta al VAO.</p>\n  <p><strong>Solución:</strong> o bien actualiza el <em>contenido</em> del buffer antiguo (<code>bufferData</code>/<code>bufferSubData</code> con él enlazado), o bien, con el VAO enlazado, enlaza el buffer nuevo y repite los <code>vertexAttribPointer</code> para que lo capturen.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-indice-65535",
  "titulo": "Con 65 536 vértices o más, parte de la malla desaparece o se retuerce",
  "html": "<p><strong>Síntoma:</strong> una malla grande con índices <code>UNSIGNED_SHORT</code> pierde triángulos, o a partir de cierto punto los triángulos conectan vértices equivocados.</p>\n  <p><strong>Causa:</strong> dos problemas que suelen ir juntos. Un <code>Uint16Array</code> no puede guardar índices mayores que 65 535: el 65 536 se convierte en 0 sin avisar (aritmética módulo $2^{16}$, <a href=\"modulos/01-web/06-binario.html\">1.6</a>). Y el índice 65 535 es el de reinicio: en <code>TRIANGLES</code>, medimos que descarta el triángulo incompleto en el que aparece y el ensamblado vuelve a empezar desde el índice siguiente, así que los triángulos de después pueden quedar desalineados. Y basta un solo triángulo para verlo: con 65 536 vértices, el de índices (0, 1, 65535) no pintó ni un píxel y el (0, 1, 65534) sí; con <code>Uint32Array</code>, el 65535 funcionó como un vértice normal.</p>\n  <p><strong>Solución:</strong> con más de 65 535 vértices, usa <code>Uint32Array</code> y <code>gl.UNSIGNED_INT</code>, o parte la malla en trozos de menos de 65 535 vértices.</p>",
  "leccion": {
   "num": "4.4",
   "titulo": "VBO, VAO y EBO: la memoria de los vértices",
   "archivo": "modulos/04-gpu/04-vbo-vao.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-uniform-silencioso",
  "titulo": "Cambio un uniform y no pasa nada (ni error, ni aviso)",
  "html": "<p><strong>Síntoma:</strong> llamas a <code>gl.uniform1f(loc, valor)</code> cada frame y el shader se comporta como si el uniform valiera 0 (o su valor anterior). No hay ningún error en la consola ni en <code>getError</code>.</p>\n  <p><strong>Causa:</strong> <code>loc</code> es <code>null</code>: el nombre está mal escrito, o el compilador eliminó el uniform por no usarse (a veces porque comentaste la línea que lo usaba mientras depurabas). <code>uniform*(null, …)</code> se ignora por diseño, sin error. Otra causa silenciosa: asignaste el valor con otro programa en uso… en el suyo, que sí lo tenía, pero dibujas con un programa distinto cuyo <code>u_color</code> nunca asignaste (cada programa tiene el suyo).</p>\n  <p><strong>Solución:</strong> al crear el programa, comprueba las ubicaciones: <code>if (loc === null) console.warn('u_tiempo no existe o no se usa')</code>. Lista los uniforms activos con <code>getActiveUniform</code> (como hace <code>GLKit.uniforms</code>). Y recuerda que el aviso también salta cuando el uniform no se usa: no siempre es un error.</p>",
  "leccion": {
   "num": "4.5",
   "titulo": "Atributos, uniforms y varyings",
   "archivo": "modulos/04-gpu/05-uniforms-varyings.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-precision-uniform",
  "titulo": "«Precisions of uniform 'u_x' differ between VERTEX and FRAGMENT shaders»",
  "html": "<p><strong>Síntoma:</strong> los dos shaders compilan, pero el programa no enlaza y el registro dice que la precisión de un uniform difiere entre los shaders.</p>\n  <p><strong>Causa:</strong> el mismo uniform declarado en los dos shaders es <em>una sola</em> variable y tiene que declararse igual en ambos, precisión incluida. El vertex shader tiene <code>highp</code> por defecto para los floats; si el fragment shader dice <code>precision mediump float;</code>, su <code>uniform float u_x</code> es <code>mediump</code> y no coincide (lo reprodujimos en Chrome). Lo mismo pasa con tipos distintos: <code>Types of uniform 'u_x' differ</code>.</p>\n  <p><strong>Solución:</strong> declara la precisión explícitamente en el uniform (<code>uniform highp float u_x;</code>) en los dos shaders, o usa <code>precision highp float;</code> también en el fragment shader (<a href=\"modulos/03-matematicas/07-precision.html\">3.7</a>).</p>",
  "leccion": {
   "num": "4.5",
   "titulo": "Atributos, uniforms y varyings",
   "archivo": "modulos/04-gpu/05-uniforms-varyings.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-offset-entero",
  "titulo": "Con PyOpenGL, un atributo vale siempre cero (el objeto sale negro)",
  "html": "<p><strong>Síntoma:</strong> un atributo (típicamente el color o la normal) llega al shader como ceros, sin ningún error de OpenGL. Las posiciones, con offset 0, funcionan.</p>\n  <p><strong>Causa:</strong> el offset de <code>glVertexAttribPointer</code> se pasó como un entero de Python (<code>8</code>). PyOpenGL lo convierte en un array en la memoria de la CPU y pasa su dirección, que el driver toma como un offset gigantesco dentro del VBO (ejemplo 4.6.2).</p>\n  <p><strong>Solución:</strong> pasa el offset como <code>ctypes.c_void_p(8)</code> (o <code>None</code> si es 0). Para comprobarlo: <code>glGetVertexAttribPointerv(loc, GL_VERTEX_ATTRIB_ARRAY_POINTER)</code> debe devolver el offset que pensabas.</p>",
  "leccion": {
   "num": "4.6",
   "titulo": "OpenGL real desde Python (moderngl y PyOpenGL)",
   "archivo": "modulos/04-gpu/06-opengl-python.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-pack-alignment",
  "titulo": "La imagen leída con glReadPixels sale inclinada o cizallada",
  "html": "<p><strong>Síntoma:</strong> lees el framebuffer en formato RGB (3 bytes por píxel) y al guardar la imagen cada fila aparece desplazada respecto a la anterior: la imagen sale inclinada, con franjas diagonales. Con anchos múltiplos de 4 (256, 300, 512…) no pasa; con los demás (99, 250, 301…), sí.</p>\n  <p><strong>Causa:</strong> <code>GL_PACK_ALIGNMENT</code>, que vale 4 por defecto: cada fila de la lectura se rellena hasta un múltiplo de 4 bytes. Con 99 píxeles RGB, una fila son 297 bytes y OpenGL escribe 300; si tu código supone que las filas están pegadas, cada fila empieza 3 bytes más tarde de lo que crees. Lo reprodujimos en <code>pyopengl/02_estado_y_errores.py</code>, pasando nuestro propio buffer como haríamos en C o con numpy:</p>\n  <figure class=\"m4-figura\" style=\"margin:.8rem 0\"><img class=\"pixelada\" src=\"modulos/04-gpu/img/pyopengl-alineacion.png\" width=\"408\" height=\"198\" alt=\"Izquierda: triángulo roto en franjas diagonales; derecha: el triángulo correcto\"><figcaption>Izquierda: leída suponiendo filas de 297 bytes con alineación 4. Derecha: con <code>glPixelStorei(GL_PACK_ALIGNMENT, 1)</code>.</figcaption></figure>\n  <p><strong>Solución:</strong> <code>glPixelStorei(GL_PACK_ALIGNMENT, 1)</code> antes de leer (o lee RGBA, cuyas filas son siempre múltiplo de 4). Curiosidad: el <code>glReadPixels</code> «cómodo» de PyOpenGL (sin buffer de destino) cambia <code>GL_PACK_ALIGNMENT</code> a 1 por su cuenta, sin avisar: lo comprobamos leyendo el estado antes (4) y después (1). Te protege de este fallo… y modifica estado global a tus espaldas. En WebGL existe lo mismo: <code>gl.pixelStorei(gl.PACK_ALIGNMENT, 1)</code>.</p>",
  "leccion": {
   "num": "4.6",
   "titulo": "OpenGL real desde Python (moderngl y PyOpenGL)",
   "archivo": "modulos/04-gpu/06-opengl-python.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-contexto-21",
  "titulo": "«version '330' is not supported» en un Mac",
  "html": "<p><strong>Síntoma:</strong> un shader con <code>#version 330 core</code> que funciona en Linux o Windows no compila en macOS: <code>ERROR: 0:1: '' :  version '330' is not supported</code>. Y <code>glGetString(GL_VERSION)</code> dice <code>2.1</code>.</p>\n  <p><strong>Causa:</strong> el contexto se creó sin pedir versión ni perfil, y macOS da entonces un contexto antiguo de OpenGL 2.1 (GLSL 1.20), por compatibilidad con programas viejos.</p>\n  <p><strong>Solución:</strong> antes de crear la ventana, pide un contexto core: <code>CONTEXT_VERSION_MAJOR = 4</code>, <code>CONTEXT_VERSION_MINOR = 1</code>, <code>OPENGL_PROFILE = OPENGL_CORE_PROFILE</code> y <code>OPENGL_FORWARD_COMPAT = True</code>. moderngl lo hace por ti en su contexto standalone.</p>",
  "leccion": {
   "num": "4.6",
   "titulo": "OpenGL real desde Python (moderngl y PyOpenGL)",
   "archivo": "modulos/04-gpu/06-opengl-python.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m4-retina-viewport",
  "titulo": "En una pantalla Retina, el dibujo ocupa solo un cuarto de la ventana",
  "html": "<p><strong>Síntoma:</strong> la escena aparece en la esquina inferior izquierda de la ventana, a la mitad de tamaño en cada eje, y el resto queda del color de borrado.</p>\n  <p><strong>Causa:</strong> <code>glViewport</code> recibió el tamaño de la ventana en <em>puntos</em> (<code>glfw.get_window_size</code>: 320 × 240) cuando el framebuffer tiene el doble de <em>píxeles</em> en cada eje (640 × 480). Lo medimos: con el viewport en puntos, el dibujo cubre el 25 % del framebuffer; con el tamaño del framebuffer, el 100 %. Es el mismo problema que el <code>devicePixelRatio</code> del canvas (<a href=\"modulos/02-animacion/06-canvas2d.html\">2.6</a>, <a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>).</p>\n  <p><strong>Solución:</strong> usa siempre <code>glfw.get_framebuffer_size(ventana)</code> para <code>glViewport</code> (y vuelve a leerlo cuando la ventana cambie de tamaño o de pantalla).</p>",
  "leccion": {
   "num": "4.6",
   "titulo": "OpenGL real desde Python (moderngl y PyOpenGL)",
   "archivo": "modulos/04-gpu/06-opengl-python.html"
  },
  "modulo": {
   "num": "4",
   "titulo": "La GPU por dentro"
  }
 },
 {
  "id": "m5-atributos-ignorados",
  "titulo": "Mis atributos de getContext no hacen nada",
  "html": "<p><strong>Síntoma:</strong> pides <code>{ preserveDrawingBuffer: true }</code> o <code>{ alpha: false }</code> y el comportamiento no cambia. No hay ningún error en la consola.</p>\n  <p><strong>Causa:</strong> ese canvas ya tenía un contexto WebGL2. Quizá lo creó una librería, un «test de soporte» que hace <code>canvas.getContext('webgl2')</code> sin atributos, o tu propio código en otro módulo. Toda llamada posterior devuelve el mismo objeto e ignora los atributos nuevos.</p>\n  <p><strong>Solución:</strong> pasa los atributos en la <em>primera</em> llamada. Para comprobar lo que tienes, imprime <code>gl.getContextAttributes()</code>. Si necesitas otra configuración, crea otro canvas. Y los tests de soporte, hazlos siempre sobre un canvas desechable.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-getcontext-null",
  "titulo": "getContext('webgl2') devuelve null",
  "html": "<p><strong>Síntoma:</strong> <code>gl</code> es <code>null</code> y la primera llamada revienta con <code>Cannot read properties of null</code>.</p>\n  <p><strong>Causa:</strong> una de estas cuatro. (1) El canvas ya tiene un contexto de otro tipo: <code>'2d'</code>, <code>'webgl'</code>… (2) El navegador no soporta WebGL2 o ha puesto la GPU o el driver en su lista negra. (3) Pediste <code>failIfMajorPerformanceCaveat: true</code> y solo había render por software: lo comprobamos forzando el renderizador por software de Chrome (SwiftShader) y, efectivamente, <code>getContext</code> devolvió <code>null</code>. (4) El navegador ha bloqueado WebGL en esa página tras varios fallos seguidos de la GPU (Chrome lo hace para protegerse).</p>\n  <p><strong>Solución:</strong> un canvas para cada tipo de contexto; comprobar siempre el <code>null</code> y mostrar un mensaje o una alternativa. Para saber el porqué, escucha el evento <code>webglcontextcreationerror</code> <em>antes</em> de llamar a <code>getContext</code>: se dispara durante la propia llamada y su <code>statusMessage</code> trae el motivo detallado.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-captura-vacia",
  "titulo": "La captura del canvas sale vacía (o lo dibujado desaparece)",
  "html": "<p><strong>Síntoma:</strong> <code>canvas.toDataURL()</code> o <code>toBlob</code> devuelven una imagen transparente aunque en pantalla se ve el dibujo. Variante: dibujas solo cuando algo cambia (un clic, un trazo) y lo pintado en frames anteriores desaparece.</p>\n  <p><strong>Causa:</strong> con <code>preserveDrawingBuffer: false</code> (el valor por defecto), el navegador borra el búfer de dibujo en cuanto lo presenta. Lo que ves en pantalla es la copia que tiene el compositor, no el búfer.</p>\n  <p><strong>Solución:</strong> para capturas, llama a <code>toDataURL</code>/<code>toBlob</code>/<code>drawImage</code> en el <em>mismo</em> callback en el que dibujas, justo después de las llamadas de dibujo (o vuelve a dibujar antes de capturar). Para acumular, redibuja todo cada frame desde tus datos, o dibuja en un framebuffer propio que nadie borra (5.8). <code>preserveDrawingBuffer: true</code> es el último recurso.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-canvas-borroso",
  "titulo": "Todo se ve borroso, pixelado o con muaré",
  "html": "<p><strong>Síntoma:</strong> los bordes se ven blandos, el texto dibujado en WebGL parece desenfocado, las líneas finas tienen grosores irregulares o aparecen franjas de muaré. En pantallas retina o en el móvil es mucho peor.</p>\n  <p><strong>Causa:</strong> el búfer de dibujo es más pequeño que los píxeles físicos que ocupa el canvas: se quedó en 300×150, se calculó con el tamaño CSS sin multiplicar por <code>devicePixelRatio</code>, o se redondeó mal. El navegador lo escala para rellenar la caja.</p>\n  <p><strong>Solución:</strong> el patrón de esta sección: tamaño en píxeles de dispositivo con <code>ResizeObserver</code> (<code>devicePixelContentBoxSize</code>, con plan B), aplicado al principio del frame y solo si cambió. Si el rendimiento no da para DPR 3, limita el DPR a propósito (5.10), pero que sea una decisión, no un accidente.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-viewport-olvidado",
  "titulo": "Tras redimensionar, el dibujo ocupa una esquina o sale estirado",
  "html": "<p><strong>Síntoma:</strong> al agrandar la ventana (o al crear el contexto antes de dar tamaño al canvas), la escena se ve pequeña en la esquina inferior izquierda. Al encogerla, solo ves la parte de abajo a la izquierda de la escena, como ampliada. Al cambiar solo el ancho, todo sale estirado en un eje.</p>\n  <p><strong>Causa:</strong> <code>gl.viewport</code> conserva el valor que tenía (el tamaño del búfer al crear el contexto, o el último que pusiste). Cambiar <code>canvas.width/height</code> no lo actualiza.</p>\n  <p><strong>Solución:</strong> llama a <code>gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)</code> cada vez que cambie el tamaño (o, más simple y sin coste apreciable, al principio de cada frame). Si además la escena sale deformada con el viewport correcto, lo que falta es corregir la proporción en la proyección (5.6).</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-contexto-perdido",
  "titulo": "Al volver de otra pestaña (o tras suspender el equipo) el canvas queda en blanco",
  "html": "<p><strong>Síntoma:</strong> la demo funcionaba, cambias de pestaña, suspendes el portátil o abres otra página con mucho WebGL, y al volver el canvas está vacío para siempre. Normalmente sin ningún error en la consola: con el contexto perdido, las llamadas de WebGL no hacen nada y no se quejan.</p>\n  <p><strong>Causa:</strong> el navegador te quitó el contexto y tu código no lo gestiona: no llamó a <code>preventDefault()</code> en <code>webglcontextlost</code> (así que no se restaurará) o no recrea los recursos en <code>webglcontextrestored</code>.</p>\n  <p><strong>Solución:</strong> separa la creación de recursos (buffers, texturas, programas, estado) en una función que puedas volver a llamar; en <code>webglcontextlost</code>, <code>preventDefault()</code> y deja de dibujar; en <code>webglcontextrestored</code>, llama otra vez a esa función. Prueba el camino completo con <code>WEBGL_lose_context</code> antes de publicar.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-demasiados-contextos",
  "titulo": "Al añadir otro canvas WebGL, una demo deja de dibujar",
  "html": "<p><strong>Síntoma:</strong> una página con muchas demos WebGL (una galería, un tutorial, un panel con varios gráficos) funciona hasta que añades una más; entonces otra, que no has tocado, se queda en blanco. En la consola: <code>WARNING: Too many active WebGL contexts. Oldest context will be lost.</code></p>\n  <p><strong>Causa:</strong> hay más de 16 contextos vivos en el mismo proceso (la página y sus iframes cuentan juntos). El navegador pierde a la fuerza el que lleva más tiempo sin usarse, y no lo devuelve.</p>\n  <p><strong>Solución:</strong> usa menos contextos. Un solo contexto puede dibujar varias vistas con <code>viewport</code> y <code>scissor</code>, o dibujar en uno oculto y copiar el resultado a canvas 2D (así funcionan los editores GLSL de este curso, como se contó en la <a href=\"modulos/00-inicio/01-bienvenida.html\">bienvenida</a>). Libera con <code>getExtension('WEBGL_lose_context').loseContext()</code> los contextos que ya no necesites en lugar de esperar al recolector de basura, y destruye los de las demos que salen de pantalla (los playgrounds de este curso lo hacen).</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-geterror-pegajoso",
  "titulo": "getError acusa a una línea inocente",
  "html": "<p><strong>Síntoma:</strong> pones un <code>getError()</code> después de una llamada sospechosa, devuelve un error, revisas la llamada mil veces y es correcta.</p>\n  <p><strong>Causa:</strong> el error es de una llamada anterior. Los indicadores se quedan activados hasta que alguien los lee, así que <code>getError</code> te dice «desde la última vez que preguntaste ha habido un error de este tipo», no «esta línea ha fallado».</p>\n  <p><strong>Solución:</strong> vacía los errores (el bucle hasta <code>NO_ERROR</code>) justo <em>antes</em> del bloque que investigas y vuelve a preguntar justo después. En 5.10 automatizaremos esto envolviendo el contexto para comprobar cada llamada en modo depuración.</p>",
  "leccion": {
   "num": "5.1",
   "titulo": "El contexto WebGL y el canvas",
   "archivo": "modulos/05-webgl/01-contexto.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-version-primera-linea",
  "titulo": "«#version directive must occur on the first line»",
  "html": "<p><strong>Síntoma:</strong> un shader que parece perfecto no compila. El log dice <code>ERROR: 0:2: '\\n' : #version directive must occur on the first line of the shader</code>, seguido de errores absurdos como <code>'layout' : syntax error</code>.</p>\n  <p><strong>Causa:</strong> la plantilla empieza con un salto de línea (<code>`</code> y en la línea siguiente <code>#version</code>), o con espacios, o un comentario. La directiva tiene que estar en la primera línea; ni siquiera se permite una línea vacía antes. Los errores siguientes son consecuencia: sin <code>#version</code> válido, el compilador usa GLSL ES 1.00, donde <code>layout</code>, <code>in</code> y <code>out</code> no existen.</p>\n  <p><strong>Solución:</strong> escribe <code>#version 300 es</code> pegado a la comilla invertida, o aplica <code>fuente.trim()</code> antes de pasarla a <code>shaderSource</code>. Si cargas shaders de archivos o de etiquetas <code>&lt;script&gt;</code>, recorta siempre.</p>",
  "leccion": {
   "num": "5.2",
   "titulo": "El primer triángulo, llamada por llamada",
   "archivo": "modulos/05-webgl/02-primer-triangulo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-error-linea-siguiente",
  "titulo": "El compilador señala una línea que está bien",
  "html": "<p><strong>Síntoma:</strong> el log dice <code>ERROR: 0:6: '}' : syntax error</code> y la línea 6 es un inocente <code>}</code>.</p>\n  <p><strong>Causa:</strong> el compilador informa de dónde <em>se dio cuenta</em> del problema, no de dónde lo cometiste. Si falta el <code>;</code> al final de la línea 5, la frase sigue abierta y el parser no descubre que algo va mal hasta que tropieza con el <code>}</code> de la línea siguiente. Lo mismo pasa con paréntesis sin cerrar o comentarios <code>/*</code> sin terminar, que pueden señalar líneas muy alejadas.</p>\n  <p><strong>Solución:</strong> ante un <code>syntax error</code>, mira la línea señalada <em>y las anteriores</em>. Y recuerda que el número de línea es el del texto del shader, no el de tu archivo JavaScript: por eso <code>crearShader</code> (un poco más abajo) imprime el código con números de línea.</p>",
  "leccion": {
   "num": "5.2",
   "titulo": "El primer triángulo, llamada por llamada",
   "archivo": "modulos/05-webgl/02-primer-triangulo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-bufferdata-array-normal",
  "titulo": "bufferData con un Array normal: un buffer de 0 bytes",
  "html": "<p><strong>Síntoma:</strong> no se dibuja nada. Al dibujar, la consola del navegador dice <code>GL_INVALID_OPERATION: glDrawArrays: Vertex buffer is not big enough for the draw call</code>, pero la llamada a <code>bufferData</code> no dio ningún error.</p>\n  <p><strong>Causa:</strong> escribiste <code>gl.bufferData(gl.ARRAY_BUFFER, [-0.7, -0.6, …], gl.STATIC_DRAW)</code> con un array de JavaScript normal. <code>bufferData</code> tiene una variante que recibe un <em>tamaño</em> en bytes en lugar de datos; al no ser un array tipado, tu array se convierte a número (<code>NaN</code>, que acaba siendo 0) y se reserva un buffer de <strong>0 bytes</strong> sin ningún error. Lo comprobamos: <code>getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)</code> devolvió 0.</p>\n  <p><strong>Solución:</strong> siempre un array tipado del tipo que declares en <code>vertexAttribPointer</code>: <code>new Float32Array([...])</code> para <code>gl.FLOAT</code>. Ojo también con <code>Float64Array</code>: sus números de 8 bytes leídos como <code>float</code> de 4 producen basura (en nuestra prueba, un triángulo de área cero: nada en pantalla y ningún error).</p>",
  "leccion": {
   "num": "5.2",
   "titulo": "El primer triángulo, llamada por llamada",
   "archivo": "modulos/05-webgl/02-primer-triangulo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-atributo-menos-uno",
  "titulo": "getAttribLocation devuelve −1",
  "html": "<p><strong>Síntoma:</strong> <code>getAttribLocation</code> devuelve −1 para un atributo que está claramente declarado. Si sigues adelante, <code>enableVertexAttribArray(-1)</code> da <code>INVALID_VALUE: enableVertexAttribArray: index out of range</code> y no se dibuja nada.</p>\n  <p><strong>Causa:</strong> el nombre no coincide (mayúsculas, un typo, <code>a_pos</code> frente a <code>a_posicion</code>) o, lo más desconcertante, el shader no usa el atributo y el compilador lo ha eliminado. Pasa mucho mientras depuras: comentas la línea que usaba <code>a_color</code> y de repente <code>a_color</code> «deja de existir».</p>\n  <p><strong>Solución:</strong> usa <code>layout(location = N)</code> y no preguntes. Si preguntas, trata el −1 como un caso normal (salta ese atributo) en vez de pasarlo a otras llamadas. Para ver qué atributos sobrevivieron, recorre <code>getProgramParameter(p, gl.ACTIVE_ATTRIBUTES)</code> con <code>getActiveAttrib(p, i)</code>.</p>",
  "leccion": {
   "num": "5.2",
   "titulo": "El primer triángulo, llamada por llamada",
   "archivo": "modulos/05-webgl/02-primer-triangulo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-pantalla-negra-sin-error",
  "titulo": "Pantalla negra, sin excepciones y con getError() = 0",
  "html": "<p><strong>Síntoma:</strong> el fondo del <code>clear</code> se ve, pero el objeto no. Ninguna excepción, ningún aviso, <code>getError()</code> devuelve 0.</p>\n  <p><strong>Causa:</strong> casi siempre, un dibujo perfectamente legal que no produce píxeles visibles: atributo sin activar (todos los vértices en el origen), <code>count</code> menor que 3, vértices fuera de clip space o con <code>w = 0</code>, el VAO por defecto enlazado en lugar del tuyo, datos leídos con el formato equivocado. Nada de eso es un error para WebGL.</p>\n  <p><strong>Solución:</strong> recorre la lista de esta sección en orden, con el inspector de estado. Y un truco de primera: haz que el fragment shader devuelva un color fijo y chillón y, si puedes, dibuja primero algo que sepas que funciona (el triángulo de este ejemplo) y ve cambiando pieza a pieza hacia tu programa.</p>",
  "leccion": {
   "num": "5.2",
   "titulo": "El primer triángulo, llamada por llamada",
   "archivo": "modulos/05-webgl/02-primer-triangulo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-linewidth",
  "titulo": "gl.lineWidth no hace nada",
  "html": "<p><strong>Síntoma:</strong> llamas a <code>gl.lineWidth(5)</code> y las líneas siguen midiendo un píxel. No hay ningún error, y <code>gl.getParameter(gl.LINE_WIDTH)</code> incluso devuelve 5.</p>\n  <p><strong>Causa:</strong> el rango admitido lo da <code>gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)</code>, y en prácticamente todas las implementaciones de WebGL actuales es <code>[1, 1]</code> (lo es en la GPU de pruebas: con Chrome sobre Metal, una línea con <code>lineWidth(10)</code> ocupa una sola fila de píxeles). El valor se guarda, pero el rasterizador solo sabe hacer líneas de 1 píxel. APIs modernas como Metal, Direct3D o Vulkan no tienen líneas anchas, y WebGL no las simula.</p>\n  <p><strong>Solución:</strong> las líneas gruesas se dibujan como triángulos: cada segmento se convierte en un rectángulo estrecho (dos triángulos), desplazando sus vértices a lo largo de la perpendicular al segmento (la de <a href=\"modulos/03-matematicas/02-producto-punto-cruz.html\">3.2</a>). Se puede hacer en JavaScript o en el vertex shader, y es como lo hacen las librerías de mapas y de gráficos. Las líneas de 1 píxel siguen siendo útiles para depurar (el alambre del ejemplo de la rejilla).</p>",
  "leccion": {
   "num": "5.3",
   "titulo": "Buffers, atributos e índices a fondo",
   "archivo": "modulos/05-webgl/03-buffers-atributos.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-uniform-otro-programa",
  "titulo": "«location is not from the associated program»",
  "html": "<p><strong>Síntoma:</strong> un uniform no se actualiza y la consola del navegador dice <code>INVALID_OPERATION: uniform4f: location is not from the associated program</code>.</p>\n  <p><strong>Causa:</strong> estás asignando con otro programa en uso (o ninguno). Típico con varios programas: asignas los uniforms del objeto B y el <code>useProgram(programaB)</code> está unas líneas más abajo, o te quedó en uso el programa del objeto anterior. La variante silenciosa: dos programas con un uniform del mismo nombre, y solo actualizas el del programa A; el del B se queda en su último valor (o en 0).</p>\n  <p><strong>Solución:</strong> el patrón por objeto es siempre <code>useProgram</code> → uniforms → <code>bindVertexArray</code> → dibujar. Y las locations son de un programa concreto: guárdalas junto a él (por ejemplo, en un objeto <code>{ programa, locs }</code>).</p>",
  "leccion": {
   "num": "5.4",
   "titulo": "Uniforms y animación",
   "archivo": "modulos/05-webgl/04-uniforms-animacion.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-textura-volteada",
  "titulo": "La imagen sale boca abajo (y a veces no hay manera de darle la vuelta)",
  "html": "<p><strong>Síntoma:</strong> la textura aparece invertida verticalmente. Variante desconcertante: activas <code>UNPACK_FLIP_Y_WEBGL</code> y no cambia nada.</p>\n  <p><strong>Causa:</strong> las imágenes guardan primero la fila de arriba y WebGL la coloca en <code>v = 0</code>, abajo. La variante: con fuentes <code>ImageBitmap</code>, WebGL <strong>ignora</strong> <code>UNPACK_FLIP_Y_WEBGL</code> y <code>UNPACK_PREMULTIPLY_ALPHA_WEBGL</code> (comprobado: con el flag activado, el bitmap se subió sin invertir). La orientación de un bitmap se decide al crearlo.</p>\n  <p><strong>Solución:</strong> <code>gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)</code> antes de <code>texImage2D</code> (y devuélvelo a <code>false</code> después), o invierte la v en el shader (<code>1.0 - v</code>), o genera las UV al revés. Con <code>ImageBitmap</code>: <code>createImageBitmap(fuente, { imageOrientation: 'flipY' })</code>. Lo importante es elegir una convención y aplicarla siempre igual; los editores GLSL del curso suben con <code>FLIP_Y</code> activado, así que <code>v = 0</code> es la parte de abajo de la imagen.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-unpack-alignment",
  "titulo": "La textura sale torcida en diagonal (o «ArrayBufferView not big enough»)",
  "html": "<p><strong>Síntoma:</strong> una textura subida desde un array de bytes RGB, R8 o RG sale inclinada: una línea vertical se convierte en diagonal y la imagen se desplaza fila a fila. O bien no se sube y la consola dice <code>INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request</code>.</p>\n  <p><strong>Causa:</strong> con <code>UNPACK_ALIGNMENT = 4</code> (el valor por defecto), WebGL busca cada fila en un múltiplo de 4 bytes. Una textura <code>R8</code> de 3×3 tiene filas de 3 bytes, pero WebGL lee la fila 1 desde el byte 4 y la 2 desde el byte 8. Si tu array es justo del tamaño apretado (27 bytes para RGB de 3×3), no llega y da el error de arriba; si es más grande (reutilizas un array o una vista sobre un buffer mayor), no hay error y la imagen sale torcida. Comprobamos los dos casos: la diagonal de una R8 de 3×3 se convirtió en una columna vertical.</p>\n  <p><strong>Solución:</strong> <code>gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)</code> antes de subir datos cuyas filas no midan un múltiplo de 4 bytes (y devuélvelo a 4 después, por ser estado global). O usa RGBA, que siempre está alineado y a menudo es más rápido de muestrear.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-textura-negra",
  "titulo": "La textura sale negra",
  "html": "<p><strong>Síntoma:</strong> el objeto texturizado se ve negro opaco (o del color que resulte de multiplicar por negro). Nada en la consola, <code>getError()</code> = 0.</p>\n  <p><strong>Causa:</strong> la textura es incompleta, o el sampler lee de una unidad donde no hay ninguna textura (que da el mismo negro). Las causas típicas: el filtro de minificación por defecto (<code>NEAREST_MIPMAP_LINEAR</code>) sin mipmaps; una textura float filtrada con <code>LINEAR</code> sin <code>OES_texture_float_linear</code>; la textura enlazada a otra unidad distinta de la que dice el sampler; en WebGL1, una textura no potencia de dos con <code>REPEAT</code> o mipmaps.</p>\n  <p><strong>Solución:</strong> fija siempre <code>TEXTURE_MIN_FILTER</code> al crear una textura (<code>LINEAR</code> o <code>NEAREST</code>), o llama a <code>generateMipmap</code> si vas a usar un filtro con mipmaps. Para floats, pide la extensión (y comprueba que no devuelve <code>null</code>) o usa <code>NEAREST</code> o <code>RGBA16F</code>. Revisa que <code>activeTexture</code> + <code>bindTexture</code> y el valor del sampler coinciden.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-muare",
  "titulo": "Muaré y parpadeo en texturas lejanas",
  "html": "<p><strong>Síntoma:</strong> una textura que se ve bien de cerca forma patrones de interferencia, ondas o ruido a lo lejos o al reducirla, y parpadea cuando la cámara o el objeto se mueven.</p>\n  <p><strong>Causa:</strong> minificación sin mipmaps: cada píxel cubre muchos texels, pero el filtro solo lee uno (<code>NEAREST</code>) o cuatro (<code>LINEAR</code>). Es aliasing.</p>\n  <p><strong>Solución:</strong> <code>generateMipmap</code> + <code>TEXTURE_MIN_FILTER = LINEAR_MIPMAP_LINEAR</code>, y anisotropía para superficies vistas de canto. Los mipmaps ocupan un tercio más de memoria (¼ + 1/16 + … de la original). Si generas la textura en cada frame (vídeo, render a textura), tendrás que regenerar los mipmaps o renunciar a ellos.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-borde-repeat",
  "titulo": "Una línea de otro color en el borde del sprite",
  "html": "<p><strong>Síntoma:</strong> al dibujar una imagen con <code>LINEAR</code>, en su borde aparece una línea fina del color del borde <em>opuesto</em> (arriba se ve un poco del color de abajo, a la izquierda un poco del de la derecha).</p>\n  <p><strong>Causa:</strong> el wrap por defecto es <code>REPEAT</code>. En el último medio texel de cada borde, el filtro bilineal mezcla con el texel vecino, que con <code>REPEAT</code> es el del lado contrario. Lo mismo pasa entre sprites vecinos de un atlas (una imagen con muchos sprites) aunque uses <code>CLAMP_TO_EDGE</code>.</p>\n  <p><strong>Solución:</strong> <code>CLAMP_TO_EDGE</code> en los dos ejes para imágenes que no se repiten. En atlas, deja un margen de píxeles entre sprites o ajusta las UV medio texel hacia dentro.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-sampler-unidad",
  "titulo": "Dos texturas y el shader lee la misma dos veces (o ninguna)",
  "html": "<p><strong>Síntoma:</strong> con dos texturas, las dos lecturas devuelven la misma imagen, o una sale negra. Variante ruidosa: <code>INVALID_VALUE: Sampler uniform value out of range</code>.</p>\n  <p><strong>Causa:</strong> los dos samplers valen 0 (nadie les asignó otra unidad), la segunda textura se enlazó sin cambiar de unidad (sustituyendo a la primera en la unidad 0), o se asignó al sampler el enum <code>gl.TEXTURE1</code> en lugar del número 1.</p>\n  <p><strong>Solución:</strong> para cada textura, el trío completo: <code>activeTexture(gl.TEXTURE0 + n)</code>, <code>bindTexture</code>, <code>uniform1i(locSampler, n)</code>. Las asignaciones de samplers persisten en el programa (son uniforms), pero los enlaces de las unidades son estado global del contexto que otro código puede cambiar: vuelve a enlazar antes de cada dibujo.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-imagen-securityerror",
  "titulo": "SecurityError al subir una imagen a una textura",
  "html": "<p><strong>Síntoma:</strong> <code>texImage2D</code> lanza <code>SecurityError: Failed to execute 'texImage2D'…: The image element contains cross-origin data, and may not be loaded</code>, aunque la imagen se ve perfectamente en la página.</p>\n  <p><strong>Causa:</strong> la imagen es de otro origen: otro dominio sin cabeceras CORS, o cualquier archivo cuando la página se abre con <code>file://</code>. WebGL no permite leer píxeles de imágenes ajenas (sí mostrarlas).</p>\n  <p><strong>Solución:</strong> sirve la página y las imágenes desde el mismo origen con un servidor local; para imágenes de otro dominio, que el servidor envíe <code>Access-Control-Allow-Origin</code> y pídelas con <code>img.crossOrigin = 'anonymous'</code> <em>antes</em> de asignar <code>src</code>. Para demos que deban funcionar con doble clic, genera las texturas con código (canvas, arrays) o incrústalas como data URL.</p>",
  "leccion": {
   "num": "5.5",
   "titulo": "Texturas: carga, filtrado, wrap y unidades",
   "archivo": "modulos/05-webgl/05-texturas.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-cubo-del-reves",
  "titulo": "El objeto se ve «del revés» o las caras de atrás tapan a las de delante",
  "html": "<p><strong>Síntoma:</strong> un objeto 3D parece transparente o vuelto del revés; al girar, caras que deberían estar ocultas aparecen por delante.</p>\n  <p><strong>Causa:</strong> no hay test de profundidad: <code>DEPTH_TEST</code> sin activar, o activado en un contexto (o un framebuffer, 5.8) que no tiene búfer de profundidad, como uno creado con <code>depth: false</code>. Sin él, gana el último triángulo dibujado.</p>\n  <p><strong>Solución:</strong> <code>gl.enable(gl.DEPTH_TEST)</code>, <code>gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)</code> en cada frame, y comprueba <code>gl.getParameter(gl.DEPTH_BITS)</code> si sospechas que no hay búfer. Recuerda que el culling puede ocultar el problema en objetos convexos y hacerlo aparecer en cuanto añadas un segundo objeto.</p>",
  "leccion": {
   "num": "5.6",
   "titulo": "3D: matrices, profundidad y el cubo que gira",
   "archivo": "modulos/05-webgl/06-3d-cubo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-profundidad-sin-borrar",
  "titulo": "Manchas, huecos y objetos que desaparecen al moverse",
  "html": "<p><strong>Síntoma:</strong> un objeto en movimiento deja manchas o se va «comiendo»: aparecen huecos por donde pasó antes, o un objeto nuevo no se ve aunque debería estar delante del fondo. A veces solo ocurre al dibujar en un framebuffer, o solo en una de las vistas de una pantalla dividida.</p>\n  <p><strong>Causa:</strong> la profundidad no se borra entre frames (o entre pasadas). El búfer conserva la profundidad más cercana de todo lo dibujado antes, y los fragmentos nuevos que están más lejos que ese «fantasma» pierden el test. Con el canvas normal el navegador la borra tras presentar y el error se esconde; con <code>preserveDrawingBuffer: true</code>, con varias pasadas por frame o en un framebuffer propio, sale a la luz.</p>\n  <p><strong>Solución:</strong> <code>gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)</code> al principio de cada frame y de cada pasada, sin excepciones. Y si borras con scissor (5.1), recuerda que el scissor también limita el borrado de la profundidad.</p>",
  "leccion": {
   "num": "5.6",
   "titulo": "3D: matrices, profundidad y el cubo que gira",
   "archivo": "modulos/05-webgl/06-3d-cubo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-cara-invisible",
  "titulo": "Falta una cara del objeto (o se ve el interior)",
  "html": "<p><strong>Síntoma:</strong> con el culling activado, alguna cara del modelo no aparece, o un objeto se ve «vaciado», como si miraras sus caras interiores.</p>\n  <p><strong>Causa:</strong> winding incorrecto. Esa cara tiene sus vértices (o sus índices) en sentido horario visto desde fuera, así que el culling la trata como trasera. Si le pasa a <em>todas</em> las caras, se descartan las de delante y ves el interior: el modelo está entero al revés, o alguien puso <code>frontFace(gl.CW)</code>. También ocurre al aplicar una escala negativa (un espejo, <code>escala(-1, 1, 1)</code>), que invierte el sentido de giro de todos los triángulos (el comportamiento raro <a href=\"modulos/04-gpu/02-pipeline-grafico.html#m4-escala-negativa\">de la escala negativa</a>, en 4.2).</p>\n  <p><strong>Solución:</strong> desactiva el culling y pinta las caras con <code>gl_FrontFacing</code> (5.3): las rojas son las mal orientadas. Intercambia dos índices de cada triángulo de esa cara. Para objetos reflejados con escala negativa, cambia <code>frontFace</code> mientras los dibujas.</p>",
  "leccion": {
   "num": "5.6",
   "titulo": "3D: matrices, profundidad y el cubo que gira",
   "archivo": "modulos/05-webgl/06-3d-cubo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-matriz-normal",
  "titulo": "Tras escalar un objeto, la iluminación sale mal",
  "html": "<p><strong>Síntoma:</strong> un objeto se ilumina bien hasta que alguien le aplica una escala distinta en cada eje; entonces las zonas iluminadas no corresponden a su forma, la luz parece venir de otra dirección o el objeto se ve más oscuro o más claro de lo normal.</p>\n  <p><strong>Causa:</strong> las normales se transforman con la matriz de modelo en lugar de con su inversa traspuesta. Con escalas no uniformes, eso las deja no perpendiculares a la superficie (y sin normalizar, más cortas o largas de lo debido).</p>\n  <p><strong>Solución:</strong> pasa la matriz normal (<code>mat4.normal(modelo)</code>, una <code>mat3</code>) y <code>normalize</code> en el fragment shader. Si solo usas rotaciones, traslaciones y escalas uniformes, <code>mat3(u_modelo)</code> da la misma dirección, pero no tientes a la suerte: calcularla cuesta una inversa por objeto y por frame, nada.</p>",
  "leccion": {
   "num": "5.6",
   "titulo": "3D: matrices, profundidad y el cubo que gira",
   "archivo": "modulos/05-webgl/06-3d-cubo.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-canvas-translucido",
  "titulo": "Donde dibujo algo transparente, se ve la página a través del canvas",
  "html": "<p><strong>Síntoma:</strong> los objetos semitransparentes se ven más claros (o más oscuros) de lo esperado, y en el hueco se transparenta el fondo de la página: su color, un degradado, el texto de detrás. Solo pasa en el canvas, nunca al leer los píxeles.</p>\n  <p><strong>Causa:</strong> el blending también mezcla el canal alfa. Con <code>blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)</code>, un objeto al 50 % sobre un fondo opaco deja alfa 0,75 en el búfer, y el navegador compone el canvas con la página usando ese alfa.</p>\n  <p><strong>Solución:</strong> <code>blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)</code>, trabajar en premultiplicado con <code>blendFunc(ONE, ONE_MINUS_SRC_ALPHA)</code> (que ya da el alfa correcto), o <code>alpha: false</code> si el canvas no tiene por qué dejar ver la página.</p>",
  "leccion": {
   "num": "5.7",
   "titulo": "Transparencia y blending",
   "archivo": "modulos/05-webgl/07-blending.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-halo-oscuro",
  "titulo": "Bordes oscuros (o de un color raro) alrededor de sprites y texto",
  "html": "<p><strong>Síntoma:</strong> las imágenes con transparencia se dibujan con un contorno oscuro, sobre todo al ampliarlas o al usar mipmaps; a veces el contorno es de un color que no está en la imagen.</p>\n  <p><strong>Causa:</strong> filtrado (o mipmaps) en alfa directo. Los píxeles invisibles de la textura tienen un RGB (casi siempre negro) que el filtrado mezcla con los visibles, y el modo alfa normal lo pinta. Los mipmaps promedian igual, así que el problema crece a lo lejos.</p>\n  <p><strong>Solución:</strong> premultiplica: sube con <code>UNPACK_PREMULTIPLY_ALPHA_WEBGL = true</code> (o <code>premultiplyAlpha: 'premultiply'</code> en <code>createImageBitmap</code>) y mezcla con <code>blendFunc(ONE, ONE_MINUS_SRC_ALPHA)</code>. Si el shader modifica el alfa, que multiplique también el RGB. La alternativa, que usan algunos exportadores, es rellenar el RGB de los píxeles transparentes con el color de sus vecinos visibles («sangrado»).</p>",
  "leccion": {
   "num": "5.7",
   "titulo": "Transparencia y blending",
   "archivo": "modulos/05-webgl/07-blending.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-canvas-premultiplicado",
  "titulo": "Colores raros o fantasmas blancos al componer el canvas",
  "html": "<p><strong>Síntoma:</strong> zonas del canvas que deberían ser transparentes brillan sobre fondos oscuros; los bordes suaves parecen «luminosos»; los colores semitransparentes se ven más claros de lo que deberían. En capturas o con <code>readPixels</code> todo parece correcto.</p>\n  <p><strong>Causa:</strong> el canvas tiene <code>alpha: true</code> y <code>premultipliedAlpha: true</code> (los valores por defecto), pero tu búfer contiene colores <em>no</em> premultiplicados: un shader que devuelve <code>vec4(color, alfa)</code> con el color sin multiplicar, un <code>clearColor(1, 1, 1, 0)</code>, o un modo de mezcla que deja RGB mayor que α. El compositor interpreta esos valores como premultiplicados y añade luz.</p>\n  <p><strong>Solución:</strong> si el canvas no tiene que ser transparente, <code>alpha: false</code> (la solución más común y la que usan los editores GLSL del curso). Si debe serlo, asegúrate de que el búfer acaba premultiplicado: el shader devuelve <code>vec4(color * a, a)</code>, borra con colores premultiplicados (<code>(0, 0, 0, 0)</code> para transparente) y mezcla con <code>ONE, ONE_MINUS_SRC_ALPHA</code>. Como último recurso, <code>premultipliedAlpha: false</code> hace que el compositor premultiplique por ti.</p>",
  "leccion": {
   "num": "5.7",
   "titulo": "Transparencia y blending",
   "archivo": "modulos/05-webgl/07-blending.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-transparencia-orden",
  "titulo": "Los objetos detrás de un cristal desaparecen (según el ángulo)",
  "html": "<p><strong>Síntoma:</strong> a través de un objeto semitransparente no se ve lo que hay detrás… a veces. Al girar la cámara, lo de detrás aparece y desaparece, o la mezcla de colores cambia de golpe.</p>\n  <p><strong>Causa:</strong> el objeto transparente escribió profundidad al dibujarse antes que los de detrás, así que esos fragmentos pierden el test y se descartan. Si además no se ordenan, el resultado depende del orden de la lista y no de la distancia.</p>\n  <p><strong>Solución:</strong> opacos primero; transparentes después, ordenados de atrás adelante por su distancia a la cámara, con <code>depthMask(false)</code> (y el test de profundidad activado). Ordenar por objetos no resuelve objetos que se cruzan entre sí, ni las caras de un mismo objeto transparente (dibújalo en dos pasadas: caras traseras con <code>cullFace(FRONT)</code> y luego delanteras); para eso existen técnicas de transparencia independiente del orden, más avanzadas. Y si puedes usar blending aditivo, no hace falta ordenar: la suma es conmutativa.</p>",
  "leccion": {
   "num": "5.7",
   "titulo": "Transparencia y blending",
   "archivo": "modulos/05-webgl/07-blending.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-fbo-incompleto",
  "titulo": "«Framebuffer incompleto» (o INVALID_FRAMEBUFFER_OPERATION al dibujar)",
  "html": "<p><strong>Síntoma:</strong> nada se dibuja en tu textura y la consola dice <code>INVALID_FRAMEBUFFER_OPERATION</code>, o tu comprobación de <code>checkFramebufferStatus</code> devuelve algo distinto de <code>0x8CD5</code>.</p>\n  <p><strong>Causa:</strong> la combinación de adjuntos no es válida. Las más comunes: un formato de color que no se puede renderizar (float sin <code>EXT_color_buffer_float</code>: <code>0x8CD6</code>), adjuntos de tamaños distintos (<code>0x8CD9</code>; pasa mucho al redimensionar la textura de color y olvidar la de profundidad) o ningún adjunto (<code>0x8CD7</code>).</p>\n  <p><strong>Solución:</strong> comprueba siempre el estado tras crear o modificar un FBO y lanza un error con el código. Para floats, pide la extensión (y comprueba que existe). Al redimensionar, recrea <em>todos</em> los adjuntos con el nuevo tamaño.</p>",
  "leccion": {
   "num": "5.8",
   "titulo": "Framebuffers, render-to-texture y ping-pong",
   "archivo": "modulos/05-webgl/08-framebuffers.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-viewport-fbo",
  "titulo": "Lo dibujado en el framebuffer sale recortado, desplazado o estirado",
  "html": "<p><strong>Síntoma:</strong> la textura resultante contiene solo una parte de la escena, la escena aparece desplazada hacia una esquina o deformada. O, al revés: tras la pasada del FBO, el canvas se dibuja pequeño en una esquina.</p>\n  <p><strong>Causa:</strong> el viewport no coincide con el tamaño del destino. <code>bindFramebuffer</code> no cambia el viewport: si el canvas mide 800×300 y el FBO 256×256, dibujar en el FBO con el viewport del canvas estira el clip space sobre un rectángulo de 800×300 del que solo caben 256×256 (comprobado: un triángulo que debía cubrir la mitad derecha del FBO quedó recortado y aplastado). Lo mismo al volver al canvas si no restauras el viewport.</p>\n  <p><strong>Solución:</strong> <code>gl.viewport(0, 0, anchoDelDestino, altoDelDestino)</code> inmediatamente después de cada <code>bindFramebuffer</code>, siempre. Un buen hábito es envolver los dos en una función <code>usarDestino(fbo, ancho, alto)</code>.</p>",
  "leccion": {
   "num": "5.8",
   "titulo": "Framebuffers, render-to-texture y ping-pong",
   "archivo": "modulos/05-webgl/08-framebuffers.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-bucle-realimentacion",
  "titulo": "«Feedback loop formed between Framebuffer and active Texture»",
  "html": "<p><strong>Síntoma:</strong> un efecto que lee una textura y escribe en un framebuffer no hace nada, y la consola dice <code>INVALID_OPERATION: … Feedback loop formed between Framebuffer and active Texture</code>.</p>\n  <p><strong>Causa:</strong> la textura que el shader muestrea está adjunta al framebuffer enlazado como destino. Leer y escribir la misma memoria en un mismo dibujo es indefinido, y WebGL lo bloquea.</p>\n  <p><strong>Solución:</strong> dos texturas y dos FBO: se lee de una y se escribe en la otra, y en el paso siguiente se intercambian. Es la técnica del ping-pong, justo lo que viene ahora.</p>",
  "leccion": {
   "num": "5.8",
   "titulo": "Framebuffers, render-to-texture y ping-pong",
   "archivo": "modulos/05-webgl/08-framebuffers.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-fbo-tamano",
  "titulo": "El post-proceso se ve borroso o estirado",
  "html": "<p><strong>Síntoma:</strong> con el efecto activado, la imagen pierde nitidez, se ve pixelada o deformada; sin el efecto, se ve bien. A menudo empeora al redimensionar la ventana o en pantallas retina.</p>\n  <p><strong>Causa:</strong> el FBO de la escena no tiene el tamaño del búfer del canvas: se creó una vez con un tamaño fijo (o antes de ajustar el canvas, cuando medía 300×150) y no se recrea al cambiar. El efecto amplía una imagen más pequeña.</p>\n  <p><strong>Solución:</strong> crea el FBO con <code>drawingBufferWidth × drawingBufferHeight</code> y recréalo (borrando el viejo) cuando <code>ajustarTamaño</code> devuelva <code>true</code>. Si usas un FBO más pequeño a propósito (efectos a media resolución para ganar rendimiento, 5.10), que sea una decisión consciente.</p>",
  "leccion": {
   "num": "5.8",
   "titulo": "Framebuffers, render-to-texture y ping-pong",
   "archivo": "modulos/05-webgl/08-framebuffers.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-divisor-olvidado",
  "titulo": "Todas las instancias salen en el mismo sitio (o una sola figura deformada)",
  "html": "<p><strong>Síntoma:</strong> en lugar de N copias repartidas, ves una sola figura, a menudo deformada o más grande de lo esperado. No hay ningún error.</p>\n  <p><strong>Causa:</strong> falta <code>vertexAttribDivisor(loc, 1)</code> en el atributo por instancia (o se llamó con otro VAO enlazado, porque es estado del VAO). Con divisor 0, cada <em>vértice</em> lee un desplazamiento distinto (el vértice 0 el primero, el 1 el segundo…) y todas las instancias son idénticas: una figura deformada, dibujada N veces en el mismo sitio.</p>\n  <p><strong>Solución:</strong> un <code>vertexAttribDivisor(loc, 1)</code> por cada atributo por instancia, con el VAO correcto enlazado. Para comprobarlo: <code>gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_DIVISOR)</code>.</p>",
  "leccion": {
   "num": "5.9",
   "titulo": "Instancing: miles de objetos en un draw call",
   "archivo": "modulos/05-webgl/09-instancing.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-buffersubdata-elementos",
  "titulo": "bufferSubData actualiza solo una parte (o «srcOffset + length too large»)",
  "html": "<p><strong>Síntoma:</strong> tras actualizar el buffer de instancias, solo se mueve una parte de ellas (las primeras: una quinta parte, por ejemplo) y el resto se queda congelado. O la consola dice <code>INVALID_VALUE: bufferSubData: srcOffset + length too large</code> o <code>bufferSubData: buffer overflow</code>.</p>\n  <p><strong>Causa:</strong> se mezclan unidades. En <code>bufferSubData(destino, desplazamiento, origen, desdeElemento, nElementos)</code>, el desplazamiento va en bytes y los dos últimos argumentos en elementos del array. Pasar <code>N</code> (instancias) en lugar de <code>N * 5</code> (floats) sube solo la quinta parte, sin error. Pasar bytes donde van elementos se sale del array (<code>srcOffset + length too large</code>), y escribir más allá del final del buffer da <code>buffer overflow</code>; en los dos casos no se sube nada.</p>\n  <p><strong>Solución:</strong> piensa en «floats por instancia × instancias» para el origen y en bytes para el destino (<code>primeraInstancia * STRIDE</code>).</p>",
  "leccion": {
   "num": "5.9",
   "titulo": "Instancing: miles de objetos en un draw call",
   "archivo": "modulos/05-webgl/09-instancing.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-instancias-buffer-corto",
  "titulo": "«Vertex buffer is not big enough for the draw call»",
  "html": "<p><strong>Síntoma:</strong> no se dibuja nada y la consola del navegador muestra <code>GL_INVALID_OPERATION: glDrawArraysInstanced: Vertex buffer is not big enough for the draw call</code>.</p>\n  <p><strong>Causa:</strong> pides más instancias de las que caben en el buffer de instancias (o más vértices de los que tiene el de vértices). WebGL comprueba que ninguna lectura se salga del buffer y, si alguna lo haría, rechaza el dibujo entero. Lo comprobamos: con datos para 8 instancias, dibujar 8 funcionó y dibujar 9 dio el error. Pasa mucho al aumentar el número de objetos sin agrandar el buffer que se creó con el tamaño antiguo.</p>\n  <p><strong>Solución:</strong> reserva el buffer con el máximo de instancias que vayas a usar (<code>bufferData(destino, MAX * STRIDE, gl.DYNAMIC_DRAW)</code>) y dibuja las que toquen, o recrea el buffer con <code>bufferData</code> cuando el número crezca por encima de lo reservado.</p>",
  "leccion": {
   "num": "5.9",
   "titulo": "Instancing: miles de objetos en un draw call",
   "archivo": "modulos/05-webgl/09-instancing.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-location-solapada",
  "titulo": "«Attribute 'a_pos' aliases attribute 'a_modelo' at location 5»",
  "html": "<p><strong>Síntoma:</strong> el programa no enlaza y el log dice <code>Attribute 'a_pos' aliases attribute 'a_modelo' at location 5</code> (texto exacto de la GPU de pruebas).</p>\n  <p><strong>Causa:</strong> has declarado <code>layout(location = 3) in mat4 a_modelo</code> y otro atributo en la location 5, creyendo que la <code>mat4</code> ocupa solo la 3. Ocupa de la 3 a la 6.</p>\n  <p><strong>Solución:</strong> el siguiente atributo va en la 7 (o en las libres por debajo de la 3). Una <code>mat3</code> ocupa 3 locations y una <code>mat2</code>, 2.</p>",
  "leccion": {
   "num": "5.9",
   "titulo": "Instancing: miles de objetos en un draw call",
   "archivo": "modulos/05-webgl/09-instancing.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-mat4-columnas",
  "titulo": "Con una mat4 por instancia no se ve nada",
  "html": "<p><strong>Síntoma:</strong> tras pasar a una matriz por instancia, los objetos desaparecen (queda, como mucho, algún píxel suelto), sin ningún error. O la consola dice <code>Vertex buffer is not big enough for the draw call</code>.</p>\n  <p><strong>Causa:</strong> solo se configuró la primera location de la <code>mat4</code>. Las otras tres columnas, desactivadas, leen el valor constante por defecto (0, 0, 0, 1), y la matriz resultante aplasta cada objeto en una línea sin área: comprobamos que un triángulo dibujado así no pintó ni un píxel. Si se activan las cuatro pero el divisor solo se pone en la primera, las otras tres avanzan por vértice, se salen del buffer y el dibujo se rechaza con el error de arriba.</p>\n  <p><strong>Solución:</strong> un bucle de 4 vueltas: <code>enableVertexAttribArray(loc + k)</code>, <code>vertexAttribPointer(loc + k, 4, gl.FLOAT, false, STRIDE, offset + k * 16)</code> y <code>vertexAttribDivisor(loc + k, 1)</code>.</p>",
  "leccion": {
   "num": "5.9",
   "titulo": "Instancing: miles de objetos en un draw call",
   "archivo": "modulos/05-webgl/09-instancing.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-demasiados-errores",
  "titulo": "La consola dejó de mostrar errores de WebGL",
  "html": "<p><strong>Síntoma:</strong> la consola se llenó de avisos de WebGL, terminó con <code>WebGL: too many errors, no more errors will be reported to the console for this context.</code>, y a partir de ahí, silencio, aunque sigan pasando cosas raras.</p>\n  <p><strong>Causa:</strong> Chrome muestra como mucho 256 avisos por contexto (lo comprobamos, tanto con errores de WebGL como con los de ANGLE). Un error dentro del bucle de animación agota el cupo en unos segundos, y cualquier error nuevo y distinto que aparezca después ya no se muestra.</p>\n  <p><strong>Solución:</strong> arregla el primer error antes de buscar los demás, recarga la página para recuperar el cupo, y en depuración usa el envoltorio, que se detiene en el primer error con una excepción.</p>",
  "leccion": {
   "num": "5.10",
   "titulo": "Depuración y rendimiento",
   "archivo": "modulos/05-webgl/10-depuracion.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-finish-no-espera",
  "titulo": "Medir con gl.finish() da 0 ms",
  "html": "<p><strong>Síntoma:</strong> mides el tiempo de un dibujo con <code>performance.now()</code> antes y después de <code>gl.finish()</code>, y sale prácticamente 0, aunque la escena va claramente lenta.</p>\n  <p><strong>Causa:</strong> en teoría, <code>finish</code> espera a que la GPU termine todo lo pendiente. En el Chrome de pruebas no esperó (ya lo viste en <a href=\"modulos/04-gpu/01-cpu-vs-gpu.html\">4.1</a>: se comporta como <code>flush</code>): tras un dibujo que tardaba 3,6 ms en la GPU, <code>finish</code> volvió en 0,00 ms. <code>readPixels</code> sobre el mismo dibujo sí esperó los 3,6 ms.</p>\n  <p><strong>Solución:</strong> no uses <code>finish</code> para medir. Para una medida puntual de «todo lo encolado hasta aquí», un <code>readPixels</code> de un píxel (sabiendo que añade una espera y que no debe quedarse en el bucle). Para medir la GPU de forma continua, el temporizador de la sección siguiente, y siempre, los fps.</p>",
  "leccion": {
   "num": "5.10",
   "titulo": "Depuración y rendimiento",
   "archivo": "modulos/05-webgl/10-depuracion.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-objeto-borrado",
  "titulo": "«attempt to use a deleted object»",
  "html": "<p><strong>Síntoma:</strong> una textura (o buffer, o programa) deja de verse, y la consola dice <code>WebGL: INVALID_OPERATION: bindTexture: attempt to use a deleted object</code> (texto exacto comprobado).</p>\n  <p><strong>Causa:</strong> se llamó a <code>deleteTexture</code> y después se siguió usando la variable, que ya no representa nada: <code>gl.isTexture(t)</code> devuelve <code>false</code> nada más borrarla. Suele pasar al recrear recursos: se borra el viejo, pero alguna parte del código conserva la referencia antigua.</p>\n  <p><strong>Solución:</strong> al borrar, pon la variable a <code>null</code> y sustitúyela por el recurso nuevo en todos los sitios que la usaban. Centralizar la creación y el borrado (una función que recrea el FBO y actualiza su referencia, como en 5.8) evita la mitad de estos fallos.</p>",
  "leccion": {
   "num": "5.10",
   "titulo": "Depuración y rendimiento",
   "archivo": "modulos/05-webgl/10-depuracion.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m5-memoria-sin-liberar",
  "titulo": "La memoria crece y crece (hasta perder el contexto)",
  "html": "<p><strong>Síntoma:</strong> tras un rato redimensionando la ventana, cargando imágenes o navegando por la aplicación, todo va más lento, el sistema avisa de poca memoria o el contexto se pierde (5.1).</p>\n  <p><strong>Causa:</strong> se crean recursos de WebGL sin borrarlos, confiando en que el recolector de basura los libere. Lo hace, pero cuando le presiona la memoria de JavaScript, no la de la GPU: en nuestra prueba, 120 MB de texturas sin referencias esperaron a que hubiera basura de JavaScript para liberarse.</p>\n  <p><strong>Solución:</strong> borra explícitamente con <code>delete…</code> cada recurso que ya no uses, en el momento en que lo sustituyes. En depuración, lleva la cuenta: suma uno en cada <code>create…</code> y resta uno en cada <code>delete…</code> (el mismo truco del <code>Proxy</code> sirve para contarlos). Si el contador crece sin parar mientras repites una acción, tienes una fuga.</p>",
  "leccion": {
   "num": "5.10",
   "titulo": "Depuración y rendimiento",
   "archivo": "modulos/05-webgl/10-depuracion.html"
  },
  "modulo": {
   "num": "5",
   "titulo": "WebGL2 desde cero"
  }
 },
 {
  "id": "m6a-enie-identificador",
  "titulo": "«syntax error» con un '?' en una línea que parece perfecta",
  "html": "<p><strong>Síntoma:</strong> el compilador protesta con <code>ERROR: 0:12: '?' : syntax error</code> en una línea sin ninguna interrogación, por ejemplo <code>float tamaño = 1.0;</code> o <code>vec3 colorPequeño;</code>.</p>\n  <p><strong>Causa:</strong> GLSL solo admite letras ASCII en los identificadores. La <code>ñ</code> o una vocal con tilde no son caracteres válidos del lenguaje; el preprocesador los sustituye por un marcador de error, que el mensaje muestra como <code>?</code>.</p>\n  <p><strong>Solución:</strong> nombres sin tildes ni eñes: <code>tamano</code>, <code>grosor</code>, <code>anio</code>. Es la convención del curso en todo el código GLSL; en los comentarios puedes escribir en español con normalidad.</p>",
  "leccion": {
   "num": "6.1",
   "titulo": "GLSL ES 3.00: el lenguaje",
   "archivo": "modulos/06-glsl/01-lenguaje.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-division-entera",
  "titulo": "Todo sale negro (o de un solo color) aunque la fórmula es correcta",
  "html": "<p><strong>Síntoma:</strong> un degradado, una animación por pasos o un índice normalizado se queda clavado en 0 (negro) y solo cambia en el último valor; o una proporción entre dos contadores sale siempre 0 o 1.</p>\n  <p><strong>Causa:</strong> la división se hace entre dos <code>int</code> (o dos <code>uint</code>) y trunca: <code>i / n</code> vale 0 para todo <code>i &lt; n</code>. Envolverla después en <code>float(…)</code> no la arregla. Es especialmente traicionero con variables como <code>u_frame</code>, que es <code>int</code>.</p>\n  <p><strong>Solución:</strong> convierte los operandos antes de dividir: <code>float(i) / float(n)</code>. Si ves un <code>float(a / b)</code> con enteros dentro, desconfía siempre.</p>",
  "leccion": {
   "num": "6.1",
   "titulo": "GLSL ES 3.00: el lenguaje",
   "archivo": "modulos/06-glsl/01-lenguaje.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-out-a-cero",
  "titulo": "Una función «olvida» el valor que tenía la variable",
  "html": "<p><strong>Síntoma:</strong> una función que debería modificar una variable (acumular un color, sumar una capa, avanzar un contador) la deja con un valor que no depende de lo que valía antes; en Chrome, como si hubiera empezado en 0.</p>\n  <p><strong>Causa:</strong> el parámetro es <code>out</code> y se lee antes de escribirlo. <code>out</code> solo copia hacia fuera: al entrar, el parámetro vale lo que sea (en WebGL, 0).</p>\n  <p><strong>Solución:</strong> si la función necesita el valor de entrada, el parámetro es <code>inout</code>. Usa <code>out</code> solo para resultados que la función escribe siempre, en todos los caminos, antes de leerlos.</p>",
  "leccion": {
   "num": "6.1",
   "titulo": "GLSL ES 3.00: el lenguaje",
   "archivo": "modulos/06-glsl/01-lenguaje.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-indefinido-portabilidad",
  "titulo": "En mi ordenador se ve bien y en otro sale negro, con manchas o distinto",
  "html": "<p><strong>Síntoma:</strong> un shader que has probado a fondo se ve diferente en otro equipo, en otro navegador o en un móvil: una zona negra, un píxel raro en el centro de una forma, un patrón que cambia. A veces cambia en tu propia máquina al tocar una línea que no tiene nada que ver.</p>\n  <p><strong>Causa:</strong> el shader depende de un comportamiento indefinido que en tu GPU daba un resultado aceptable: <code>atan(0.0, 0.0)</code> en el centro exacto, <code>pow</code> o <code>sqrt</code> de un negativo, una división por una distancia que llega a 0, un <code>normalize</code> del vector nulo, un <code>smoothstep</code> con los bordes al revés, un índice que se sale. Cada compilador, y cada nivel de optimización, resuelve lo indefinido a su manera.</p>\n  <p><strong>Solución:</strong> elimina la operación indefinida en lugar de confiar en su resultado: <code>max(x, 0.0)</code> antes de <code>sqrt</code> y <code>pow</code>, <code>max(d, 1e-6)</code> antes de dividir, <code>clamp</code> antes de <code>asin</code>/<code>acos</code> y de indexar, bordes de <code>smoothstep</code> en orden. Lee los avisos amarillos del compilador. Y prueba en al menos dos GPU distintas (un portátil y un móvil) antes de dar un efecto por terminado.</p>",
  "leccion": {
   "num": "6.1",
   "titulo": "GLSL ES 3.00: el lenguaje",
   "archivo": "modulos/06-glsl/01-lenguaje.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-macro-parentesis",
  "titulo": "Una macro da un resultado absurdo, pero solo con algunos argumentos",
  "html": "<p><strong>Síntoma:</strong> una macro funciona con <code>CUAD(x)</code> y da valores disparatados con <code>CUAD(x + 1.0)</code> o dentro de una expresión mayor (<code>CUAD(x) / 2.0</code>).</p>\n  <p><strong>Causa:</strong> el preprocesador sustituye texto, sin respetar la precedencia de los operadores. Sin paréntesis, los operadores del argumento y los de alrededor se mezclan con los de la macro.</p>\n  <p><strong>Solución:</strong> paréntesis alrededor de cada parámetro y de toda la expresión: <code>#define CUAD(x) ((x) * (x))</code>. Mejor aún, una función (<code>float cuad(float x)</code> y sus sobrecargas para vectores): el compilador la insertará igual y sin sorpresas.</p>",
  "leccion": {
   "num": "6.1",
   "titulo": "GLSL ES 3.00: el lenguaje",
   "archivo": "modulos/06-glsl/01-lenguaje.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-fragcoord-viewport",
  "titulo": "Con varios viewports, el efecto sale desplazado, cortado o no aparece",
  "html": "<p><strong>Síntoma:</strong> un shader que funciona a pantalla completa falla al dibujarlo en una parte del canvas (pantalla dividida, una miniatura, un <code>gl.viewport</code> con desplazamiento): la forma sale descentrada, cortada por el borde del viewport, o directamente fuera de él. En el viewport que empieza en (0, 0) todo va bien.</p>\n  <p><strong>Causa:</strong> <code>gl_FragCoord</code> se mide desde la esquina del framebuffer, no del viewport. Las fórmulas del tipo <code>(2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y</code> suponen que el primer píxel es (0.5, 0.5), y en un viewport desplazado el primero es (x₀ + 0.5, y₀ + 0.5).</p>\n  <p><strong>Solución:</strong> resta el origen del viewport (pásalo como uniform: <code>gl_FragCoord.xy - u_origen</code>) o usa un varying como <code>v_uv</code>, que se interpola desde los vértices y es relativo a la geometría que dibujas. Compruébalo en el programa de abajo: dos viewports con el mismo shader; en el derecho el círculo desaparece hasta que activas la casilla.</p>",
  "leccion": {
   "num": "6.2",
   "titulo": "Pensar como un fragment shader",
   "archivo": "modulos/06-glsl/02-pensar-en-paralelo.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-circulo-estirado",
  "titulo": "Un círculo dibujado en el shader sale ovalado (y se estira al redimensionar)",
  "html": "<p><strong>Síntoma:</strong> un círculo dibujado en el shader sale como una elipse, más ancha que alta en un lienzo apaisado; los cuadrados salen rectangulares; y al cambiar el tamaño de la ventana la forma se estira con ella.</p>\n  <p><strong>Causa:</strong> las coordenadas se normalizaron dividiendo cada eje por su propio tamaño: <code>gl_FragCoord.xy / u_resolution</code> o <code>v_uv</code>. Una unidad en x mide entonces <code>u_resolution.x</code> píxeles y en y, <code>u_resolution.y</code>: la «distancia» <code>length(uv - 0.5)</code> no es una distancia en la pantalla.</p>\n  <p><strong>Solución:</strong> divide los dos ejes por el mismo número: <code>(2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y</code>, o, si partes de <code>uv</code>, corrige la x: <code>p.x *= u_resolution.x / u_resolution.y</code>. Si el shader está bien y el círculo sigue ovalado, el problema está fuera: el canvas se muestra con un tamaño CSS de otra proporción que su búfer (el bicho <a href=\"modulos/01-web/01-html.html#m1-circulo-ovalado\">«Dibujo un círculo y sale un óvalo borroso»</a> de 1.1). Y en 3D, con una matriz de proyección, el mismo síntoma tiene otra causa: el aspecto de la proyección (<a href=\"modulos/03-matematicas/06-espacios-coordenadas.html#m3-aspecto\">«Todo sale estirado (o se estira al redimensionar)»</a>, 3.6).</p>",
  "leccion": {
   "num": "6.2",
   "titulo": "Pensar como un fragment shader",
   "archivo": "modulos/06-glsl/02-pensar-en-paralelo.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-espacios-mezclados",
  "titulo": "El efecto del ratón aparece desplazado, a otra escala o en todas partes",
  "html": "<p><strong>Síntoma:</strong> la luz no está bajo el cursor, sino desplazada hacia un lado y más lejos cuanto más te alejas del centro; o un radio que debería ser pequeño cubre todo el lienzo; o nada reacciona.</p>\n  <p><strong>Causa:</strong> se han mezclado dos espacios: el píxel en coordenadas normalizadas y el ratón en píxeles (o normalizado con otra fórmula: uno con <code>uv</code> y otro con <code>/ u_resolution.y</code>), o un radio en píxeles comparado con una distancia normalizada. Restar dos puntos de sistemas distintos no significa nada (<a href=\"modulos/03-matematicas/01-vectores.html\">3.1</a>).</p>\n  <p><strong>Solución:</strong> decide un espacio de trabajo y lleva todo a él con la misma fórmula: el píxel, el ratón, los radios y los grosores. Si un valor viene en píxeles (un radio de 40), conviértelo: <code>40.0 * 2.0 / u_resolution.y</code> unidades de <code>p</code>. Si el ratón va al revés en vertical, es otro bicho: la y de CSS contra la de GL (<a href=\"modulos/01-web/04-js-dom-eventos.html#m1-raton-invertido\">1.4</a>). Y si en tu propia página el desfase crece hacia los bordes aunque el shader trate igual el píxel y el ratón, el error está antes, en JavaScript: la conversión de píxeles CSS a píxeles del búfer (<a href=\"modulos/01-web/04-js-dom-eventos.html#m1-raton-desplazado\">«El dibujo aparece desplazado del ratón, más cuanto más cerca del borde»</a>, 1.4); en los editores del curso, <code>u_mouse</code> ya llega convertido.</p>",
  "leccion": {
   "num": "6.2",
   "titulo": "Pensar como un fragment shader",
   "archivo": "modulos/06-glsl/02-pensar-en-paralelo.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-depurar-saturado",
  "titulo": "El valor que intento depurar sale todo blanco (o todo negro)",
  "html": "<p><strong>Síntoma:</strong> pintas una variable para ver qué vale y la pantalla sale entera blanca, entera negra, o blanca con una mancha negra sin detalle.</p>\n  <p><strong>Causa:</strong> el valor está fuera de 0…1, y al escribirse en el framebuffer se recorta: todo lo que pasa de 1 es blanco y todo lo negativo es negro. Pasa con distancias en píxeles (valen cientos), ángulos (−π…π), coordenadas sin normalizar o productos punto (−1…1).</p>\n  <p><strong>Solución:</strong> averigua el orden de magnitud y remapea (<code>v / 800.0</code>, <code>v * 0.5 + 0.5</code>), usa bandas (<code>fract(v)</code>) si el rango es desconocido, o la vista «fuera de rango» para ver qué zonas se salen. Y antes de concluir «es un NaN», comprueba si es un negativo: los dos salen negros, pero tienen causas muy distintas (ejercicio 3.7.4).</p>",
  "leccion": {
   "num": "6.2",
   "titulo": "Pensar como un fragment shader",
   "archivo": "modulos/06-glsl/02-pensar-en-paralelo.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-borde-fijo",
  "titulo": "El borde es borroso en una pantalla y dentado en otra",
  "html": "<p><strong>Síntoma:</strong> las formas se ven nítidas en tu monitor, pero borrosas a pantalla completa o en un monitor con más resolución; o al revés, dentadas en un móvil. El grosor del borde suave cambia al redimensionar.</p>\n  <p><strong>Causa:</strong> el ancho de la transición está escrito en unidades de la escena (<code>smoothstep(0.0, 0.01, d)</code>), que equivalen a un número de píxeles distinto en cada tamaño de lienzo y en cada <code>devicePixelRatio</code>.</p>\n  <p><strong>Solución:</strong> mide el ancho en píxeles: <code>clamp(0.5 - d / px, 0.0, 1.0)</code> con <code>px = 2.0 / u_resolution.y</code> (dividido por las escalas que apliques al espacio), o con <code>px = fwidth(d)</code>. Así el borde mide un píxel físico en cualquier pantalla.</p>",
  "leccion": {
   "num": "6.3",
   "titulo": "Formas, SDF 2D y antialiasing",
   "archivo": "modulos/06-glsl/03-formas-sdf.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-derivadas-rama",
  "titulo": "Píxeles sueltos con el borde mal suavizado, o una línea rara en el límite de un if",
  "html": "<p><strong>Síntoma:</strong> el antialiasing hecho con <code>fwidth</code> falla en algunos píxeles aislados, o aparece una fila de píxeles raros justo donde cambia la condición de un <code>if</code> (el límite de una caja envolvente, el borde de una zona). Con una textura con mipmaps, los píxeles de ese límite salen borrosos o nítidos de más. Puede verse en una GPU y no en otra.</p>\n  <p><strong>Causa:</strong> la derivada (o la lectura de textura) se hace dentro de una rama que no todos los píxeles del quad de 2 × 2 toman. Los píxeles que no entran no calculan el valor, y la resta que da la derivada mezcla un valor real con uno inexistente.</p>\n  <p><strong>Solución:</strong> calcula <code>fwidth</code> (y las lecturas <code>texture()</code> con mipmaps) antes del <code>if</code>, en flujo uniforme, y usa el resultado dentro. Si no puedes, usa el tamaño del píxel calculado (<code>px</code>), o <code>textureLod</code>/<code>textureGrad</code> con el nivel o las derivadas calculadas fuera.</p>",
  "leccion": {
   "num": "6.3",
   "titulo": "Formas, SDF 2D y antialiasing",
   "archivo": "modulos/06-glsl/03-formas-sdf.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-smin-k-cero",
  "titulo": "La unión suave desaparece (o sale negra) cuando k llega a 0",
  "html": "<p><strong>Síntoma:</strong> una animación que reduce el suavizado hasta 0, o un deslizador de <code>k</code> en su mínimo, hace que las formas fundidas desaparezcan de golpe, salgan negras o llenas de agujeros, o (según cómo se pinte la cobertura) que todo el lienzo se llene del color de la forma.</p>\n  <p><strong>Causa:</strong> <code>h = max(k - abs(a - b), 0.0) / k</code> con <code>k = 0</code> es 0 / 0. Lo medimos: da NaN, y el NaN contagia a toda la distancia (<a href=\"modulos/03-matematicas/07-precision.html\">3.7</a>), que ya no es menor que nada. Lo que se ve depende de cómo consuma la cobertura ese NaN: con <code>clamp(0.5 - d / px, 0.0, 1.0)</code> sale 0 (la forma desaparece); con <code>1.0 - smoothstep(…, d)</code> salió 1 (el lienzo entero se pinta), en nuestra GPU.</p>\n  <p><strong>Solución:</strong> <code>k = max(k, 1e-5);</code> al principio de <code>smin</code>. Con un <code>k</code> diminuto, <code>smin</code> es indistinguible de <code>min</code> y no hay división por cero. Es la regla general de 6.1: no dependas de lo indefinido, elimínalo.</p>",
  "leccion": {
   "num": "6.3",
   "titulo": "Formas, SDF 2D y antialiasing",
   "archivo": "modulos/06-glsl/03-formas-sdf.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-escala-sdf",
  "titulo": "Al escalar una forma, el borde se emborrona o se vuelve dentado, y los contornos cambian de grosor",
  "html": "<p><strong>Síntoma:</strong> una forma que se ve perfecta a tamaño normal sale con el borde borroso al agrandarla (o dentado al encogerla); su contorno y su brillo crecen o menguan con ella; en raymarching, los objetos escalados tienen agujeros o se atraviesan.</p>\n  <p><strong>Causa:</strong> la forma se escala dividiendo las coordenadas, <code>sdf(p / s)</code>, pero el resultado no se multiplica por <code>s</code>: la distancia sigue en las unidades del espacio pequeño, y cualquier cosa que la compare con un tamaño de la escena (un píxel, un grosor) se equivoca en un factor <code>s</code>.</p>\n  <p><strong>Solución:</strong> <code>sdf(p / s) * s</code>. Con escalas distintas por eje, <code>sdf(p / escala) * min(escala.x, escala.y)</code> como cota. Y si usas <code>fwidth(d)</code> para el antialiasing, el borde saldrá bien incluso sin corregir (<code>fwidth</code> mide las unidades que tenga <code>d</code>), pero los contornos y los brillos seguirán mal: corrige siempre.</p>",
  "leccion": {
   "num": "6.3",
   "titulo": "Formas, SDF 2D y antialiasing",
   "archivo": "modulos/06-glsl/03-formas-sdf.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-luz-codificada",
  "titulo": "La iluminación se ve dura: sombras que caen a negro de golpe y focos que deslumbran al sumarse",
  "html": "<p><strong>Síntoma:</strong> los objetos iluminados parecen de plástico, con la transición entre luz y sombra demasiado brusca; la luz ambiente no se nota hasta valores altos; dos focos que se solapan crean una zona muchísimo más brillante que el doble; los degradados de color pasan por tonos sucios.</p>\n  <p><strong>Causa:</strong> la física (multiplicar por la luz, sumar focos, mezclar) se hace sobre valores codificados en sRGB, que no son proporcionales a la luz. Multiplicar un valor sRGB por 0.5 reduce su luz a la cuarta parte, más o menos.</p>\n  <p><strong>Solución:</strong> decodifica los colores de entrada (<code>srgbALineal</code>), calcula en lineal y codifica solo al final (<code>linealASrgb</code>). Si las texturas vienen de imágenes, súbelas como <code>SRGB8_ALPHA8</code> y la decodificación la hará la GPU.</p>",
  "leccion": {
   "num": "6.4",
   "titulo": "Color: espacios, gamma y paletas",
   "archivo": "modulos/06-glsl/04-color.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-mipmap-oscuro",
  "titulo": "Una textura se oscurece al alejarse o al reducirla",
  "html": "<p><strong>Síntoma:</strong> una textura con mucho contraste (un damero, texto blanco sobre negro, hojas contra el cielo) se ve más oscura y apagada cuando se dibuja pequeña o lejos; al acercarla recupera el brillo. Las líneas finas claras parecen desaparecer.</p>\n  <p><strong>Causa:</strong> la textura se subió como <code>RGBA8</code> y la GPU filtra y genera los mipmaps promediando los valores codificados en sRGB. El promedio de 0 y 255 es 128, que emite el 21 % de la luz, cuando el promedio de la luz es el 50 % (188).</p>\n  <p><strong>Solución:</strong> sube las imágenes con formato interno <code>SRGB8_ALPHA8</code>: la GPU decodifica antes de filtrar y los promedios se hacen en luz lineal. Recuerda que entonces <code>texture()</code> devuelve luz lineal, y que tendrás que codificar al escribir en el canvas.</p>",
  "leccion": {
   "num": "6.4",
   "titulo": "Color: espacios, gamma y paletas",
   "archivo": "modulos/06-glsl/04-color.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-doble-gamma",
  "titulo": "Todo se ve lavado y sin contraste (o demasiado oscuro y saturado)",
  "html": "<p><strong>Síntoma:</strong> tras «arreglar la gamma», la imagen sale pálida, con los negros grisáceos (o, al revés, oscurísima y con los colores quemados).</p>\n  <p><strong>Causa:</strong> la conversión se aplica dos veces, o ninguna en un sitio donde hacía falta: codificas en el shader y además escribes en un framebuffer <code>SRGB8_ALPHA8</code> que vuelve a codificar (lavado); o decodificas a mano una textura que ya era <code>SRGB8_ALPHA8</code> (demasiado oscuro); o codificas en un shader intermedio cuyo resultado lee otro shader que también codifica.</p>\n  <p><strong>Solución:</strong> dibuja la cadena completa y marca en cada paso en qué espacio están los valores. Una sola decodificación a la entrada (a mano o por el formato de la textura), una sola codificación a la salida (a mano en el último shader o por el formato del framebuffer). Todo lo intermedio, en lineal.</p>",
  "leccion": {
   "num": "6.4",
   "titulo": "Color: espacios, gamma y paletas",
   "archivo": "modulos/06-glsl/04-color.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-bandas-lineales",
  "titulo": "Franjas visibles en los degradados oscuros",
  "html": "<p><strong>Síntoma:</strong> un degradado oscuro (un cielo nocturno, una viñeta, una sombra suave) muestra escalones o franjas concéntricas, sobre todo cerca del negro, en lugar de una transición continua.</p>\n  <p><strong>Causa:</strong> la luz lineal se guardó con 8 bits por canal en algún punto de la cadena (una textura <code>RGBA8</code> intermedia, un FBO), y los oscuros se quedaron con muy pocos niveles. También aparece sin error de cadena en degradados muy lentos, porque 256 niveles no alcanzan para una transición larga.</p>\n  <p><strong>Solución:</strong> intermedios en <code>RGBA16F</code> o <code>SRGB8_ALPHA8</code>, nunca luz lineal en <code>RGBA8</code>. Para las bandas que quedan en el resultado final de 8 bits, el <em>dithering</em> del final de la lección.</p>",
  "leccion": {
   "num": "6.4",
   "titulo": "Color: espacios, gamma y paletas",
   "archivo": "modulos/06-glsl/04-color.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-recorte-tono",
  "titulo": "Las luces intensas se vuelven amarillas, blancas o planas",
  "html": "<p><strong>Síntoma:</strong> el centro de una explosión naranja, de un foco o de un halo sale como una mancha plana amarillenta o blanca, sin degradado; el color de una luz cambia al subir su intensidad.</p>\n  <p><strong>Causa:</strong> los valores de luz superan 1 y se recortan canal a canal al escribirse. Los canales que llegan antes al máximo se estancan mientras los demás siguen subiendo: el tono se desplaza hacia el amarillo y el blanco, y los detalles por encima de 1 desaparecen.</p>\n  <p><strong>Solución:</strong> trabaja en lineal sin miedo a pasar de 1, y aplica un tone mapping (Reinhard, Reinhard extendido, ACES) justo antes de codificar a sRGB. Si quieres conservar el tono, aplícalo sobre la luminancia.</p>",
  "leccion": {
   "num": "6.4",
   "titulo": "Color: espacios, gamma y paletas",
   "archivo": "modulos/06-glsl/04-color.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-cuartos-esquinas",
  "titulo": "Las formas aparecen en las esquinas de las celdas, partidas en cuatro trozos de colores distintos",
  "html": "<p><strong>Síntoma:</strong> los círculos de un patrón se ven centrados en las esquinas de la rejilla en lugar de en el centro de las celdas; y si cada celda tiene su color, cada círculo sale partido en cuatro cuartos de colores distintos.</p>\n  <p><strong>Causa:</strong> se usa <code>fract(g)</code> sin restar 0.5. Las coordenadas locales van de 0 a 1 con el origen en la esquina inferior izquierda de la celda, así que una forma centrada en el origen solo aporta un cuarto a cada celda; los cuatro cuartos que se juntan en una esquina pertenecen a cuatro celdas distintas, cada una con su propio identificador y su propio color.</p>\n  <p><strong>Solución:</strong> <code>q = fract(g) - 0.5</code> para centrar las coordenadas locales en la celda. Y en general: la forma de cada celda debe caber entera dentro de su celda (más sobre esto en «Formas que se salen de su celda»).</p>",
  "leccion": {
   "num": "6.5",
   "titulo": "Patrones: repetición, celdas y simetrías",
   "archivo": "modulos/06-glsl/05-patrones.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-patron-lejos",
  "titulo": "El patrón se pixela, tiembla o desaparece tras mucho tiempo en movimiento",
  "html": "<p><strong>Síntoma:</strong> un patrón que se desplaza con el tiempo (un fondo que avanza, un scroll infinito) se ve perfecto al principio y, tras horas, sus formas se vuelven poligonales o tiemblan; o un patrón funciona cerca del origen y se deshace al llevarlo lejos.</p>\n  <p><strong>Causa:</strong> la coordenada que entra en <code>fract</code> es enorme (<code>p * N + u_time * velocidad</code> tras horas, o una posición de mundo grande), y en float32 le quedan pocas cifras para los decimales. <code>fract</code> no puede devolver la precisión que la coordenada ya no tiene.</p>\n  <p><strong>Solución:</strong> mantén pequeñas las coordenadas que entran en la repetición. Si el patrón es periódico, envuelve el desplazamiento en JavaScript (en doble precisión) con un periodo que sea múltiplo de la celda: <code>(velocidad * t) % 1.0</code> para un patrón de periodo 1. Si las celdas tienen identificadores (colores por celda), envía por separado la parte entera del desplazamiento como offset de los identificadores, calculado en la CPU.</p>",
  "leccion": {
   "num": "6.5",
   "titulo": "Patrones: repetición, celdas y simetrías",
   "archivo": "modulos/06-glsl/05-patrones.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-costura-fwidth",
  "titulo": "Una línea de píxeles borrosos a la izquierda del centro, que aparece o no según el tamaño del lienzo",
  "html": "<p><strong>Síntoma:</strong> un patrón radial antialiasado (rayos, sectores, una rueda) tiene una línea fina de píxeles grises o borrosos que sale del centro hacia la izquierda. Aparece con unos tamaños de ventana y desaparece con otros, o al mover el centro medio píxel.</p>\n  <p><strong>Causa:</strong> el ancho del borde suave sale de <code>fwidth</code> de un valor derivado del ángulo de <code>atan</code>, que salta de π a −π en el eje x negativo. Si el salto cae dentro de un quad de 2 × 2 píxeles, la derivada ve una diferencia de 2π (6.25 frente a 0.035, medido) y la transición de esa fila ocupa medio lienzo. Si cae entre dos quads, nadie lo ve: de ahí que dependa de la paridad.</p>\n  <p><strong>Solución:</strong> calcula la derivada de algo que no salte: <code>min(fwidth(a), fwidth(atan(-p.y, -p.x)))</code>, o la derivada analítica del ángulo (el ángulo cambia <code>px / r</code> por píxel, con <code>r = length(p)</code>), o el ancho a partir de <code>length(fwidth(p))</code>. Regla general: <code>fwidth</code> de cualquier cosa discontinua (<code>fract</code>, <code>mod</code>, <code>atan</code>, <code>floor</code>) se dispara en la discontinuidad.</p>",
  "leccion": {
   "num": "6.5",
   "titulo": "Patrones: repetición, celdas y simetrías",
   "archivo": "modulos/06-glsl/05-patrones.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-formas-cortadas",
  "titulo": "Las formas del patrón aparecen cortadas por líneas rectas invisibles",
  "html": "<p><strong>Síntoma:</strong> en un patrón repetido, algunas formas tienen un lado recto, como si alguien las hubiera recortado con tijeras; los cortes forman una rejilla invisible. Pasa sobre todo al desplazarlas al azar, agrandarlas, girarlas o añadirles un brillo.</p>\n  <p><strong>Causa:</strong> la forma de una celda se extiende a la celda vecina, pero los píxeles de la vecina solo evalúan la forma de su propia celda. La parte que invade no la dibuja nadie.</p>\n  <p><strong>Solución:</strong> o haz que la forma quepa (desplazamiento + tamaño + giro dentro de medio lado de celda), o evalúa las celdas vecinas y quédate con la distancia mínima: las 3 × 3 si las formas pueden alejarse hasta una celda entera de la suya. Si solo sobresalen poco, basta con las 2 × 2 más cercanas al píxel (las de su cuadrante).</p>",
  "leccion": {
   "num": "6.5",
   "titulo": "Patrones: repetición, celdas y simetrías",
   "archivo": "modulos/06-glsl/05-patrones.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6a-muare-procedural",
  "titulo": "El patrón hierve, forma ondas o parpadea cuando se hace pequeño o se aleja",
  "html": "<p><strong>Síntoma:</strong> un patrón procedural (rayas, damero, puntos, rejilla) se ve bien de cerca pero, al reducirlo, alejarlo o verlo en perspectiva, aparecen curvas, ondas y manchas que no existen, que además se mueven o parpadean con la animación.</p>\n  <p><strong>Causa:</strong> el patrón oscila más deprisa de lo que muestrean los píxeles (menos de dos píxeles por periodo, el límite de Nyquist). Cada píxel toma una sola muestra en su centro, que cae en un punto casi arbitrario del periodo. Los mipmaps que salvan a las texturas no existen para una función.</p>\n  <p><strong>Solución:</strong> mide con <code>fwidth</code> cuántos periodos cruza el píxel y, cuando pase de unos 0.5, sustituye el patrón por su valor medio (desvanecer) o, mejor, usa una versión filtrada analíticamente (el promedio exacto sobre el píxel, como <code>dameroFiltrado</code>). Como último recurso, supermuestreo: evaluar el patrón en varios puntos del píxel y promediar (cuesta tantas veces como muestras).</p>",
  "leccion": {
   "num": "6.5",
   "titulo": "Patrones: repetición, celdas y simetrías",
   "archivo": "modulos/06-glsl/05-patrones.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-hash-fastmath",
  "titulo": "El arreglo con isnan funciona la primera vez y deja de funcionar al recargar la página",
  "html": "<p><strong>Síntoma:</strong> añades un <code>isnan</code> a tu shader (para depurar, o porque viste que con él el hash del seno, un <code>mod</code> o un <code>pow</code> dan el resultado «bueno») y en tu página funciona; recargas, la abres en otra pestaña o vuelves otro día, y el resultado es el de antes, como si el <code>isnan</code> no estuviera. En los editores y el graficador del curso, en cambio, el mismo shader se comporta igual siempre.</p>\n  <p><strong>Causa:</strong> en Chrome sobre Metal, <code>isnan</code>/<code>isinf</code> desactiva el fast math de todo el shader (el comportamiento raro <a href=\"modulos/03-matematicas/07-precision.html#m3-isnan-heisenbug\">«Añadir isnan() para depurar cambia el resultado»</a> de 3.7), pero solo cuando ANGLE compila de verdad ese texto. Chrome guarda los programas compilados en una caché de memoria y de disco, y la segunda vez que recibe exactamente el mismo código reutiliza el binario guardado, que se comporta como compilado <em>con</em> fast math. Medido en el M1: <code>mod(x, 7.0)</code> falló en 0 de 4 096 múltiplos negativos de 7 la primera vez y en 2 071 la segunda, al recargar y en otra pestaña. Los editores del curso añaden un comentario distinto en cada compilación de los shaders con <code>isnan</code>, y por eso no lo sufren.</p>\n  <p><strong>Solución:</strong> no uses <code>isnan</code> como interruptor de precisión: elimina la dependencia del fast math con fórmulas robustas (un hash sin funciones trascendentes, como el de Hoskins de abajo, en lugar del hash del seno, que además se rompe por otros motivos: <a href=\"modulos/03-matematicas/07-precision.html#m3-hash-roto\">3.7</a>; el <code>mod</code> blindado de 6.5; <code>max(x, 0.0)</code> antes de <code>pow</code>). Si depuras con <code>isnan</code> en tu página, cambia un comentario en cada prueba (o añade uno único al compilar, como los editores) y comprueba el arreglo final sin él.</p>",
  "leccion": {
   "num": "6.6",
   "titulo": "Aleatoriedad y ruido",
   "archivo": "modulos/06-glsl/06-ruido.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-ruido-parpadea",
  "titulo": "Quiero que el ruido se mueva y lo que hace es parpadear",
  "html": "<p><strong>Síntoma:</strong> para animar un ruido escribes algo como <code>hash12(celda + u_time)</code> o <code>ruido(p) * u_time</code>, y en lugar de desplazarse suavemente, la imagen hierve, parpadea en cada frame o cambia a saltos.</p>\n  <p><strong>Causa:</strong> un hash no es continuo: <code>hash12(celda + 0.016)</code> no se parece en nada a <code>hash12(celda)</code>. Si el tiempo entra en la entrada del hash, cada frame es un sorteo nuevo.</p>\n  <p><strong>Solución:</strong> el tiempo debe entrar en la <strong>posición</strong> que le pasas a un ruido continuo (<code>ruido(p + vec2(u_time, 0.0))</code> lo desplaza), en una tercera dimensión del ruido (<code>ruido3(vec3(p, u_time))</code> lo hace evolucionar), o en funciones continuas de valores aleatorios fijos (la fase de las estrellas del ejemplo 6.6.1). Si quieres cambios discretos a propósito, cuantiza el tiempo: <code>hash12(celda + floor(u_time * 2.0))</code> cambia dos veces por segundo, a saltos limpios.</p>",
  "leccion": {
   "num": "6.6",
   "titulo": "Aleatoriedad y ruido",
   "archivo": "modulos/06-glsl/06-ruido.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-ruido-rejilla",
  "titulo": "Se ve la cuadrícula a través del ruido",
  "html": "<p><strong>Síntoma:</strong> el ruido muestra estrellas de cuatro puntas, formas alineadas con los ejes o, al usarlo como relieve iluminado, facetas y líneas rectas que forman una rejilla.</p>\n  <p><strong>Causa:</strong> la retícula sale a la luz. Con interpolación lineal, la pendiente salta en cada línea de la rejilla ($C^0$); con el fade cúbico, la que salta es la curvatura ($C^1$), visible con iluminación especular; y el value noise, por construcción, pone sus extremos en las esquinas.</p>\n  <p><strong>Solución:</strong> fade quíntico si usas el ruido como altura o para calcular normales; ruido de gradiente en lugar de value noise si la forma debe parecer orgánica; y en fbm, rota o desplaza cada octava (lo verás enseguida) para que las rejillas de las octavas no coincidan.</p>",
  "leccion": {
   "num": "6.6",
   "titulo": "Aleatoriedad y ruido",
   "archivo": "modulos/06-glsl/06-ruido.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-fbm-origen",
  "titulo": "Una mancha o una costura recta en el centro del fbm",
  "html": "<p><strong>Síntoma:</strong> el fbm tiene una mancha muy oscura (o muy clara) justo en el origen de coordenadas, o una línea recta que lo cruza a lo largo de un eje. Pon <code>arreglo</code> a 0 y activa «usar value noise»: mancha negra en el centro. Con el ruido de gradiente, una costura vertical por el centro.</p>\n  <p><strong>Causa:</strong> con lacunaridad 2 exacta y sin nada más, las rejillas de todas las octavas coinciden en el origen y a lo largo de los ejes: el punto (0, 0) es esquina de celda en todas las escalas. En el origen, todas las octavas del value noise leen el valor de la misma esquina, <code>hash12(vec2(0.0))</code> (que en el hash de Hoskins vale exactamente 0: los tres pasos multiplican cero por algo), y en lugar de promediarse, se suman en la misma dirección. Rotar no basta (la rotación deja el origen donde está: pon <code>arreglo</code> a 1 y la mancha sigue ahí).</p>\n  <p><strong>Solución:</strong> además de rotar, desplaza cada octava (<code>+ vec2(17.3, 5.9)</code>) o usa una lacunaridad ligeramente distinta de 2 (Quilez usa 2,01 y 1,99, por ejemplo). Así ninguna esquina de retícula coincide entre octavas.</p>",
  "leccion": {
   "num": "6.6",
   "titulo": "Aleatoriedad y ruido",
   "archivo": "modulos/06-glsl/06-ruido.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-ruido-textura-escalones",
  "titulo": "El ruido leído de una textura hace escalones al ampliarlo",
  "html": "<p><strong>Síntoma:</strong> un ruido (o cualquier dato) leído de una textura con filtrado <code>LINEAR</code> se ve perfecto a tamaño normal, pero al ampliarlo mucho, o al usarlo como altura para iluminar, aparecen bandas o terrazas, aunque la interpolación debería ser suave.</p>\n  <p><strong>Causa:</strong> doble cuantización. Los texels de una textura <code>RGBA8</code> solo tienen 256 niveles, y además el hardware de filtrado calcula la posición entre texels con precisión limitada: en nuestra GPU, 8 bits (257 valores distintos entre dos texels vecinos, por mucho que se amplíe).</p>\n  <p><strong>Solución:</strong> para ruido de baja frecuencia muy ampliado, calcula el ruido en el shader. Si necesitas la textura, haz tú la interpolación: lee los 4 texels con <code>texelFetch</code> y mézclalos con <code>mix</code> en float32 (4 lecturas en lugar de 1), y usa una textura de más precisión (<code>R16F</code> o <code>R32F</code>, <a href=\"modulos/05-webgl/08-framebuffers.html\">5.8</a>) si los 256 niveles tampoco bastan.</p>",
  "leccion": {
   "num": "6.6",
   "titulo": "Aleatoriedad y ruido",
   "archivo": "modulos/06-glsl/06-ruido.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-bucle-salta",
  "titulo": "El bucle da un salto al volver a empezar",
  "html": "<p><strong>Síntoma:</strong> exportas una animación en bucle (o la reproduces con <code>mod(t, T)</code>) y al reiniciar cada ciclo algo da un salto: un objeto se teletransporta, un color cambia de golpe, una rotación retrocede.</p>\n  <p><strong>Causa:</strong> algún elemento tiene un periodo que no divide a T: en T segundos no completa un número entero de ciclos, así que el fotograma final no coincide con el inicial. El caso típico es <code>sin(t)</code> o <code>sin(3.0 * t)</code> escrito a ojo (periodos de $2\\pi$ y $2\\pi/3$ segundos), o una velocidad de rotación en «radianes por segundo» que no es múltiplo de $2\\pi/T$.</p>\n  <p><strong>Solución:</strong> calcula un único progreso de ciclo, <code>s = fract(t / T)</code>, y expresa todo con multiplicadores enteros: <code>sin(TAU * k * s)</code>, <code>fract(k * s)</code>, ángulo <code>TAU * k * s</code>. Compruébalo evaluando la escena en 0 y en T y restando, como en el editor de arriba.</p>",
  "leccion": {
   "num": "6.7",
   "titulo": "Animar dentro del shader",
   "archivo": "modulos/06-glsl/07-animacion-shaders.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-desfase-fract",
  "titulo": "Al arrancar, algunas celdas ya están a mitad de animación",
  "html": "<p><strong>Síntoma:</strong> una animación de entrada escalonada (los elementos aparecen uno tras otro, una sola vez) se ve mal en el primer segundo: algunas celdas aparecen ya a medias o parpadean antes de su turno.</p>\n  <p><strong>Causa:</strong> el progreso se calculó con <code>fract((t - retraso) / duración)</code>, que es para bucles. Mientras <code>t &lt; retraso</code>, el argumento es negativo y <code>fract</code> lo convierte en un valor entre 0 y 1: la celda está «a mitad» de un ciclo que en realidad aún no ha empezado.</p>\n  <p><strong>Solución:</strong> para animaciones de una sola vez usa la rampa recortada: <code>clamp((t - retraso) / duración, 0.0, 1.0)</code>. Vale 0 antes de su turno, sube durante la duración y se queda en 1 para siempre. <code>fract</code> solo para lo que se repite.</p>",
  "leccion": {
   "num": "6.7",
   "titulo": "Animar dentro del shader",
   "archivo": "modulos/06-glsl/07-animacion-shaders.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rueda-atras",
  "titulo": "Algo que gira rápido parece quieto o gira al revés",
  "html": "<p><strong>Síntoma:</strong> una rueda, un ventilador, un patrón de franjas que se desplaza o un spinner de carga va bien a velocidad baja, pero al acelerarlo parece detenerse, girar hacia atrás o moverse a trompicones. Y cambia de una pantalla a otra (60 Hz frente a 120 Hz).</p>\n  <p><strong>Causa:</strong> aliasing temporal. La pantalla muestra instantáneas a intervalos fijos; si el patrón avanza entre dos frames más de medio periodo espacial (medio ángulo entre radios, media anchura de franja), el movimiento aparente es otro. Como la frecuencia de muestreo es la de la pantalla, el resultado depende del monitor.</p>\n  <p><strong>Solución:</strong> limita la velocidad para que el avance por frame sea menor que medio periodo del patrón (a 60 Hz, una rueda de 8 radios aguanta menos de 3,75 vueltas/s), añade motion blur (promediar varios instantes, o estirar la forma en la dirección del movimiento), o, a velocidades muy altas, sustituye el patrón por su versión borrosa (lo que hacen las animaciones de hélices en los juegos).</p>",
  "leccion": {
   "num": "6.7",
   "titulo": "Animar dentro del shader",
   "archivo": "modulos/06-glsl/07-animacion-shaders.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-u-frame-hz",
  "titulo": "La animación del shader va el doble de rápido en otra pantalla",
  "html": "<p><strong>Síntoma:</strong> una animación hecha en un shader va bien en tu monitor, pero en un portátil con pantalla de 120 Hz (o en un móvil de 90 Hz) va más rápida, y en un equipo que no llega a 60 fps, más lenta.</p>\n  <p><strong>Causa:</strong> la animación depende del número de frame (<code>u_frame</code>, <code>iFrame</code> en Shadertoy, o un contador que incrementas en JavaScript una vez por frame) en lugar del tiempo. Es el bicho de JavaScript <a href=\"modulos/02-animacion/03-raf.html#m2-velocidad-depende-hz\">«La animación va más rápida (o más lenta) en otra pantalla»</a> de 2.3, trasladado al shader.</p>\n  <p><strong>Solución:</strong> expresa toda animación en función del tiempo en segundos. Deja el número de frame para lo que de verdad es «por imagen» (un sorteo nuevo cada frame, alternar patrones pares e impares).</p>",
  "leccion": {
   "num": "6.7",
   "titulo": "Animar dentro del shader",
   "archivo": "modulos/06-glsl/07-animacion-shaders.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-imagen-estirada",
  "titulo": "La imagen sale estirada o aplastada",
  "html": "<p><strong>Síntoma:</strong> una foto o textura se ve ensanchada, o las caras parecen alargadas; al redimensionar la ventana, la deformación cambia.</p>\n  <p><strong>Causa:</strong> <code>v_uv</code> (o <code>gl_FragCoord.xy / u_resolution</code>) va de 0 a 1 en los dos ejes sea cual sea la forma del lienzo, así que la textura se estira para llenarlo. Es el mismo bicho del aspecto de <a href=\"modulos/03-matematicas/06-espacios-coordenadas.html\">3.6</a>, en versión textura.</p>\n  <p><strong>Solución:</strong> compara el aspecto del lienzo (<code>u_resolution.x / u_resolution.y</code>) con el de la textura (<code>textureSize</code>) y escala las coordenadas alrededor del centro, como en el ejemplo 6.8.1: contain si toda la imagen debe verse, cover si el lienzo debe quedar lleno.</p>",
  "leccion": {
   "num": "6.8",
   "titulo": "Efectos con texturas",
   "archivo": "modulos/06-glsl/08-texturas-efectos.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rotar-deforma",
  "titulo": "Al girar la imagen se inclina o se deforma",
  "html": "<p><strong>Síntoma:</strong> al rotar una textura en el shader, en lugar de girar, se inclina como un paralelogramo; sus ángulos rectos dejan de serlo, y la deformación cambia al redimensionar la ventana.</p>\n  <p><strong>Causa:</strong> la rotación se aplicó a <code>v_uv</code> (o a <code>gl_FragCoord.xy / u_resolution</code>), coordenadas en las que una unidad en x no mide lo mismo que en y si el lienzo no es cuadrado. Una rotación solo conserva ángulos en un espacio con la misma escala en los dos ejes. Es la misma causa que la de los <a href=\"modulos/06-glsl/02-pensar-en-paralelo.html#m6a-circulo-estirado\">círculos ovalados</a> de 6.2.</p>\n  <p><strong>Solución:</strong> antes de rotar, multiplica x por el aspecto (<code>uv.x *= u_resolution.x / u_resolution.y</code>), rota, y si quieres volver al espacio de la textura, divide después. O trabaja desde el principio con <code>(gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y</code>, que ya es cuadrado.</p>",
  "leccion": {
   "num": "6.8",
   "titulo": "Efectos con texturas",
   "archivo": "modulos/06-glsl/08-texturas-efectos.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-distorsion-invertida",
  "titulo": "La lupa encoge en lugar de ampliar (o el remolino gira al revés)",
  "html": "<p><strong>Síntoma:</strong> programas una lupa que «empuja» los píxeles hacia fuera y el resultado encoge la imagen; un remolino gira en sentido contrario al que calculaste; una ola desplaza la imagen hacia el lado opuesto.</p>\n  <p><strong>Causa:</strong> un fragment shader no puede mover píxeles: cada píxel decide <strong>de dónde lee</strong>. Si en el píxel p lees en f(p), lo que había en f(p) aparece en p: la imagen se mueve según la transformación <em>inversa</em> de f. Leer más lejos del centro (f(p) = 1,5·p) trae hacia dentro lo que estaba fuera: la imagen se encoge.</p>\n  <p><strong>Solución:</strong> escribe la transformación inversa de la que quieres ver. Para ampliar ×1,5, lee en p / 1,5; para girar la imagen un ángulo, gira las coordenadas el ángulo opuesto. Si la inversa no tiene fórmula, aproxímala cambiando el signo de un desplazamiento pequeño.</p>",
  "leccion": {
   "num": "6.8",
   "titulo": "Efectos con texturas",
   "archivo": "modulos/06-glsl/08-texturas-efectos.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-borde-desenfoque",
  "titulo": "El desenfoque trae colores del borde contrario",
  "html": "<p><strong>Síntoma:</strong> al desenfocar una imagen (o aplicar cualquier kernel), aparece una banda del color del lado opuesto en cada borde: cielo en la parte de abajo, suelo en la de arriba, y la banda es tan ancha como el radio del desenfoque.</p>\n  <p><strong>Causa:</strong> el modo de repetición es <code>REPEAT</code> (el valor por defecto de WebGL), y las lecturas que se salen de 0–1 vuelven a entrar por el lado contrario.</p>\n  <p><strong>Solución:</strong> <code>CLAMP_TO_EDGE</code> en las texturas que no se repiten (fotos, post-proceso de la escena): el borde se extiende en lugar de envolverse. Si quieres un borde reflejado, WebGL (ya desde WebGL1) tiene <code>MIRRORED_REPEAT</code> (<code>gl.texParameteri(…, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)</code>), o puedes reflejar las coordenadas en el shader: <code>uv = 1.0 - abs(1.0 - mod(uv, 2.0))</code>.</p>",
  "leccion": {
   "num": "6.8",
   "titulo": "Efectos con texturas",
   "archivo": "modulos/06-glsl/08-texturas-efectos.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-costura-mipmap",
  "titulo": "Líneas finas en las juntas de un mosaico o entre los bloques de un pixelado",
  "html": "<p><strong>Síntoma:</strong> al repetir una textura con <code>fract</code>, pixelar con <code>floor</code> o mapearla en polares con <code>atan</code>, aparecen líneas de 1 o 2 píxeles, de un color «medio» o borroso, justo en las juntas. Aparecen y desaparecen al redimensionar o al mover la imagen.</p>\n  <p><strong>Causa:</strong> la GPU elige el mipmap a partir de las derivadas de la coordenada, medidas en quads de 2 × 2 píxeles. Donde la coordenada salta, la derivada es enorme y se lee un nivel muy reducido (en el extremo, el de 1 × 1 texel: el color medio de toda la textura). Solo ocurre en los quads que caen a caballo de la junta.</p>\n  <p><strong>Solución:</strong> <code>textureGrad(tex, coordenadaConSaltos, dFdx(coordenadaContinua), dFdy(coordenadaContinua))</code>. Alternativas: <code>textureLod(tex, uv, 0.0)</code> (sin mipmaps: vuelve el muaré al reducir), una textura sin mipmaps, o, en un mosaico simple, no usar <code>fract</code> y dejar que <code>REPEAT</code> repita.</p>",
  "leccion": {
   "num": "6.8",
   "titulo": "Efectos con texturas",
   "archivo": "modulos/06-glsl/08-texturas-efectos.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-acne",
  "titulo": "Todo sale en sombra (o las sombras salen moteadas)",
  "html": "<p><strong>Síntoma:</strong> al añadir sombras, toda la escena queda oscura, o las superficies iluminadas se llenan de manchas y puntos negros («acné»).</p>\n  <p><strong>Causa:</strong> el rayo de sombra empieza exactamente en el punto de impacto, que está a menos de <code>EPSILON</code> de la superficie (así lo aceptó el bucle principal). En su primer paso, <code>mapa</code> devuelve ese valor diminuto y el rayo de sombra «choca» con la propia superficie de la que sale. Lo comprobamos con una sombra dura que empieza en t = 0 y da por tapada la luz si <code>mapa</code> baja de 0,001: con el épsilon absoluto de 0,001 en el bucle principal, toda la parte iluminada de la escena salió en sombra; con el épsilon relativo del ejemplo 6.9.2 (<code>0.001 * t</code>, que acepta impactos algo más lejos de la superficie), «solo» se apagó un 4&nbsp;% de los píxeles iluminados, repartidos en motas: el acné.</p>\n  <p><strong>Solución:</strong> separa el origen del rayo de sombra de la superficie: empieza en <code>t = 0.02</code> (o algo mayor que el épsilon), o desplaza el punto a lo largo de la normal, <code>p + n * 0.01</code>. Lo mismo vale para cualquier rayo secundario (reflejos, oclusión).</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-normales",
  "titulo": "La superficie sale granulada, o las aristas salen redondeadas",
  "html": "<p><strong>Síntoma:</strong> la iluminación tiene un grano o ruido fino sobre las superficies, sobre todo lejos de la cámara; o, al revés, las aristas de las cajas se ven biseladas y los detalles finos, desdibujados.</p>\n  <p><strong>Causa:</strong> el paso <code>e</code> de las diferencias de la normal. Muy pequeño (del orden de 0,0000001 con objetos a unas pocas unidades del origen), la diferencia de dos distancias casi iguales se queda sin cifras significativas en float32 y la normal es ruido, o directamente el vector cero; muy grande (0,1), la derivada promedia una zona amplia y suaviza la geometría.</p>\n  <p><strong>Solución:</strong> un valor intermedio del orden de 0,001 para escenas de unas pocas unidades, o mejor, proporcional a la distancia (<code>e = 0.0005 * t</code>): lejos de la cámara un píxel abarca más espacio y la normal no necesita más detalle que ese.</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-agujeros",
  "titulo": "La superficie tiene agujeros o manchas oscuras que tiemblan",
  "html": "<p><strong>Síntoma:</strong> una forma deformada, retorcida o fractal aparece con agujeros, manchas negras o zonas que parecen erosionadas, que cambian de sitio al mover la cámara. Piezas delgadas desaparecen a trozos.</p>\n  <p><strong>Causa:</strong> la función de la escena no es una distancia exacta y en algún punto devuelve más de lo que hay hasta la superficie. El paso se pasa de largo: el rayo acaba dentro del objeto (con <code>d &lt; EPSILON</code>, una distancia negativa se acepta como impacto, en un punto equivocado y con sombras calculadas desde dentro), o atraviesa una pieza fina y sigue por el otro lado.</p>\n  <p><strong>Solución:</strong> multiplica cada paso por un factor menor que 1 (0,8 como punto de partida, menos si la deformación es fuerte), reduce la amplitud o la frecuencia de la deformación, o corrige la SDF. Si aceptas impactos con <code>abs(d) &lt; EPSILON</code> y dejas que <code>t</code> retroceda con pasos negativos, el rayo que se pasa vuelve hacia la superficie, pero eso no salva las piezas finas atravesadas.</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-halo",
  "titulo": "Halos alrededor de los objetos y un horizonte que se corta",
  "html": "<p><strong>Síntoma:</strong> alrededor de las siluetas aparece un borde del color del fondo, o el suelo se acaba en una línea curva mucho antes del horizonte, y empeora al alejar la cámara.</p>\n  <p><strong>Causa:</strong> pasos insuficientes. Los rayos que pasan rozando una superficie (siluetas) o casi paralelos a ella (suelo lejano) avanzan a saltos minúsculos y agotan el límite de pasos antes de llegar; el bucle termina sin impacto y el píxel se pinta como fondo.</p>\n  <p><strong>Solución:</strong> más pasos (con cuidado: el coste lo marcan los píxeles caros); un épsilon que crezca con la distancia (<code>d &lt; 0.001 * t</code>), que da por buenos los impactos lejanos antes; y, en vez de pintar de fondo un rayo que agotó los pasos, tratarlo como impacto si su última distancia era pequeña. La niebla, además, disimula lo que queda.</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-repeticion",
  "titulo": "Con la repetición, los objetos salen cortados por planos",
  "html": "<p><strong>Síntoma:</strong> al repetir un objeto con <code>mod</code>, las copias aparecen cortadas en seco, con caras planas o trozos que faltan, justo en las fronteras de las celdas.</p>\n  <p><strong>Causa:</strong> el objeto no cabe en su celda (su tamaño supera la mitad de la celda en algún eje, o al girarlo o desplazarlo se sale). En esa zona, la función evalúa la copia de la celda actual, pero la superficie más cercana es la de la celda vecina, que no se mira. La distancia devuelta es mayor que la real y los rayos atraviesan o cortan el objeto.</p>\n  <p><strong>Solución:</strong> mantén el objeto dentro de la celda con margen (radio &lt; media celda). Si necesita sobresalir, evalúa también las celdas vecinas y quédate con el mínimo (<code>min</code> de la copia actual y de la siguiente en el eje afectado), a costa de más evaluaciones. Es el bicho de las <a href=\"modulos/06-glsl/05-patrones.html#m6a-formas-cortadas\">formas cortadas</a> de 6.5, con una dimensión más y con consecuencias peores: en 2D se ve un corte; en raymarching, además, los rayos atraviesan el objeto.</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-rm-nada",
  "titulo": "Solo se ve el fondo (o un color plano en toda la pantalla)",
  "html": "<p><strong>Síntoma:</strong> el raymarcher compila pero no muestra ningún objeto, solo el color de fondo; o toda la pantalla sale de un único color.</p>\n  <p><strong>Causa:</strong> las más frecuentes, por orden: la dirección del rayo apunta hacia el otro lado (<code>vec3(uv, 1.0)</code> con la cámara mirando a −z: el rayo va hacia atrás); la cámara está <strong>dentro</strong> de un objeto (<code>mapa(ro)</code> es negativo, el primer paso ya cumple <code>d &lt; EPSILON</code> y todos los píxeles «chocan» en t = 0 con el mismo color); los objetos están más lejos que <code>T_MAX</code> o la escala de la escena no casa con la cámara; o <code>rd</code> no está normalizado y los pasos se descontrolan.</p>\n  <p><strong>Solución:</strong> depura por capas, como en el ejemplo 6.9.2. Pinta <code>0.5 + 0.5 * rd</code> para ver si las direcciones son razonables (el centro de la pantalla debe tener la dirección de la mirada); pinta <code>mapa(ro)</code> en el centro para saber si la cámara está dentro de algo; pinta <code>t / T_MAX</code> y el número de pasos. Casi siempre es un signo.</p>",
  "leccion": {
   "num": "6.9",
   "titulo": "Introducción al raymarching",
   "archivo": "modulos/06-glsl/09-raymarching.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-st-imouse",
  "titulo": "El efecto de ratón de un shader de Shadertoy no responde, o empieza en una esquina",
  "html": "<p><strong>Síntoma:</strong> portas un shader de Shadertoy y el efecto del ratón no hace nada al mover el puntero, solo al arrastrar; o, al cargar, todo aparece desplazado hacia la esquina inferior izquierda; o una acción que debía ocurrir «al hacer clic» ocurre continuamente o nunca.</p>\n  <p><strong>Causa:</strong> la semántica de <code>iMouse</code>: <code>xy</code> solo cambia mientras el botón está pulsado y vale (0, 0) hasta el primer clic (la esquina inferior izquierda); <code>zw</code> es la posición del clic, y sus signos codifican «pulsado» (z) y «frame del clic» (w). Si en tu motor mandas la posición del puntero sin más, o tus signos no siguen la convención, el shader se comporta distinto.</p>\n  <p><strong>Solución:</strong> implementa la semántica completa en JavaScript (es el ejercicio 6.10.4) o adapta el shader: si quieres que reaccione al pasar el ratón, usa la posición directamente y elimina las comprobaciones de signo; y dale un valor por defecto razonable para cuando <code>iMouse.xy</code> es (0, 0).</p>",
  "leccion": {
   "num": "6.10",
   "titulo": "Leer código ajeno: Shadertoy y GLSL 1.00",
   "archivo": "modulos/06-glsl/10-codigo-ajeno.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-st-transparente",
  "titulo": "Al pasar un shader de Shadertoy a mi página se ve transparente o lavado",
  "html": "<p><strong>Síntoma:</strong> el shader funciona en Shadertoy, pero en tu página se ve el fondo a través de él, los colores salen lavados o partes de la imagen desaparecen sobre fondos claros.</p>\n  <p><strong>Causa:</strong> Shadertoy ignora el alfa de la imagen final, y mucho código escribe en él cualquier cosa (0, o un valor intermedio). Tu canvas WebGL, por defecto, tiene canal alfa y el navegador lo compone con la página usando ese alfa (con alfa premultiplicado, <a href=\"modulos/05-webgl/07-blending.html\">5.7</a>).</p>\n  <p><strong>Solución:</strong> pide el contexto con <code>{ alpha: false }</code>, o fuerza el alfa a 1 en la envoltura (<code>salida = vec4(c.rgb, 1.0)</code>), como hacen Shadertoy y los editores del curso.</p>",
  "leccion": {
   "num": "6.10",
   "titulo": "Leer código ajeno: Shadertoy y GLSL 1.00",
   "archivo": "modulos/06-glsl/10-codigo-ajeno.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-100-bucle",
  "titulo": "«Loop index cannot be compared with non-constant expression»",
  "html": "<p><strong>Síntoma:</strong> un shader de WebGL1 (o un shader sin <code>#version</code>) no compila por un bucle como <code>for (int i = 0; i &lt; u_pasos; i++)</code>, aunque el mismo bucle funciona en un shader 3.00.</p>\n  <p><strong>Causa:</strong> el Apéndice A de la especificación de GLSL ES 1.00 limita los bucles a lo que el hardware de 2009 podía desenrollar: un <code>for</code> con índice inicializado a una constante, comparado con una expresión constante e incrementado por una constante, sin modificarlo dentro. WebGL obliga a cumplirlo (también con shaders 1.00 en un contexto WebGL2: lo comprobamos). Modificar el índice dentro del cuerpo da otro error («Loop index cannot be statically assigned to within the body of the loop»).</p>\n  <p><strong>Solución:</strong> en 1.00, un límite constante con salida anticipada: <code>for (int i = 0; i &lt; 64; i++) { if (i &gt;= u_pasos) break; … }</code>, el patrón que usa este módulo desde 6.6. O porta el shader a 3.00, donde los bucles no tienen esa restricción.</p>",
  "leccion": {
   "num": "6.10",
   "titulo": "Leer código ajeno: Shadertoy y GLSL 1.00",
   "archivo": "modulos/06-glsl/10-codigo-ajeno.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-100-derivadas",
  "titulo": "«'fwidth' : no matching overloaded function found»",
  "html": "<p><strong>Síntoma:</strong> un shader antiguo que usa <code>fwidth</code>, <code>dFdx</code> o <code>dFdy</code> (típico para antialiasing) no compila; o compila en una página y no en otra.</p>\n  <p><strong>Causa:</strong> en GLSL ES 1.00 las derivadas son una extensión, <code>GL_OES_standard_derivatives</code>. En WebGL1 hacen falta dos cosas a la vez: pedirla desde JavaScript con <code>gl.getExtension('OES_standard_derivatives')</code> y activarla en el shader con <code>#extension GL_OES_standard_derivatives : enable</code>. Solo con la directiva, el compilador avisa «extension is not supported»; solo con <code>getExtension</code>, da «extension is disabled». Y en un contexto WebGL2 (como el de los editores del curso), un shader 1.00 no puede usarla: la extensión no se ofrece en WebGL2, porque allí las derivadas son parte del lenguaje 3.00. Todo comprobado en Chrome.</p>\n  <p><strong>Solución:</strong> porta el shader a GLSL ES 3.00 (las derivadas vienen de serie; si dejas la directiva <code>#extension</code>, solo produce un aviso). En WebGL1, llama a <code>getExtension</code> antes de compilar y pon la directiva al principio del shader.</p>",
  "leccion": {
   "num": "6.10",
   "titulo": "Leer código ajeno: Shadertoy y GLSL 1.00",
   "archivo": "modulos/06-glsl/10-codigo-ajeno.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m6b-textura-nombre",
  "titulo": "«'texture' : function name expected» al portar un shader antiguo",
  "html": "<p><strong>Síntoma:</strong> al portar a 3.00 un shader que tenía <code>uniform sampler2D texture;</code> y cambiar <code>texture2D(texture, uv)</code> por <code>texture(texture, uv)</code>, el compilador responde «'texture' : function name expected». Otro parecido: <code>float sample = …;</code> da «Illegal use of reserved word».</p>\n  <p><strong>Causa:</strong> en GLSL ES 1.00, <code>texture</code> no era nada especial y muchos tutoriales antiguos lo usaban como nombre del sampler. En 3.00 es el nombre de la función de lectura, y una variable con ese nombre la oculta: en <code>texture(texture, uv)</code>, el primer <code>texture</code> ya es la variable, no la función. Lo curioso es que declarar <code>uniform sampler2D texture;</code> en 3.00 compila sin error (lo comprobamos): el fallo aparece al llamar a la función. <code>sample</code> y <code>patch</code>, en cambio, son palabras reservadas en 3.00 y no se pueden usar ni para declarar.</p>\n  <p><strong>Solución:</strong> renombra: <code>uniform sampler2D u_textura;</code>. En general, cualquier nombre que coincida con una función o palabra de 3.00 es sospechoso al portar.</p>",
  "leccion": {
   "num": "6.10",
   "titulo": "Leer código ajeno: Shadertoy y GLSL 1.00",
   "archivo": "modulos/06-glsl/10-codigo-ajeno.html"
  },
  "modulo": {
   "num": "6",
   "titulo": "GLSL y fragment shaders"
  }
 },
 {
  "id": "m7-camara-lenta-parcial",
  "titulo": "Con la cámara lenta (o la pausa), unas cosas se ralentizan y otras no",
  "html": "<p><strong>Síntoma:</strong> activas la pausa o la cámara lenta de tu escena y la mayor parte se detiene, pero algo sigue a velocidad normal: un elemento del DOM con una animación CSS, unas partículas, un parpadeo del shader, un muelle. Al reanudar, esas partes están desfasadas del resto.</p>\n  <p><strong>Causa:</strong> hay más de un reloj. Las partes que no se enteran leen el tiempo por su cuenta: el argumento de <code>requestAnimationFrame</code>, <code>performance.now()</code>, el <code>dt</code> sin escalar, una animación CSS o WAAPI (que avanza con <code>document.timeline</code>) o un <code>setInterval</code>.</p>\n  <p><strong>Solución:</strong> un único reloj de la aplicación (<code>t</code> y <code>dt</code> con escala y pausa) del que beben todos: <code>u_time</code>, <code>actualizar</code>, muelles, partículas y DOM. Las animaciones WAAPI se controlan desde él con <code>anim.pause()</code> y <code>anim.currentTime = reloj.t * 1000</code> en cada frame. Deja fuera a propósito solo lo que no debe ralentizarse (el suavizado del puntero, con <code>dtReal</code>).</p>",
  "leccion": {
   "num": "7.1",
   "titulo": "Arquitectura de una app con shaders",
   "archivo": "modulos/07-integracion/01-arquitectura.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-locations-viejas",
  "titulo": "Tras recuperar el contexto, la escena sale negra (o transparente)",
  "html": "<p><strong>Síntoma:</strong> la app sobrevive a la pérdida de contexto (el bucle vuelve, no hay excepciones), pero la escena sale negra, transparente o con los colores por defecto. En DevTools aparecen avisos como <code>WebGL: INVALID_OPERATION: uniform4f: location is not from the associated program</code> o <code>useProgram: object does not belong to this context</code>.</p>\n  <p><strong>Causa:</strong> <code>iniciar</code> recreó el programa, pero alguna referencia a objetos del contexto anterior sigue guardada fuera: las locations en variables globales, un VAO creado aparte, una textura cacheada. Lo comprobamos: tras restaurar, un <code>uniform4f</code> con la location del programa viejo dio <code>INVALID_OPERATION</code>, el uniform del programa nuevo se quedó en su valor inicial y el píxel salió (0, 0, 0, 0). <code>gl.isProgram(viejo)</code> devuelve <code>false</code>.</p>\n  <p><strong>Solución:</strong> todo lo que sale de la GPU (programas, locations, buffers, VAOs, texturas, FBOs) se crea dentro de <code>iniciar</code>/<code>redimensionar</code> y se guarda en un único objeto (<code>gpu = { … }</code>) que se sustituye entero. Pruébalo siempre con <code>WEBGL_lose_context</code>: <code>loseContext()</code> y, un segundo después, <code>restoreContext()</code>.</p>",
  "leccion": {
   "num": "7.1",
   "titulo": "Arquitectura de una app con shaders",
   "archivo": "modulos/07-integracion/01-arquitectura.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-define-entero",
  "titulo": "Al inyectar un número desde JavaScript, el shader deja de compilar («wrong operand types»)",
  "html": "<p><strong>Síntoma:</strong> el shader compilaba con el valor escrito a mano y, al generarlo desde JavaScript (<code>`#define RADIO ${radio}`</code>), falla con <code>'*' : wrong operand types - no operation '*' exists that takes a left-hand operand of type 'const int' and a right operand of type 'const float'</code> o con <code>cannot convert from 'const int' to 'highp float'</code>. A veces solo falla con ciertos valores: con 2,5 compila y con 2 no.</p>\n  <p><strong>Causa:</strong> JavaScript no distingue enteros de decimales: <code>String(2.0)</code> es <code>\"2\"</code>. El <code>#define</code> pega ese texto y en GLSL <code>2</code> es un <code>int</code>, y GLSL no convierte tipos implícitamente (<a href=\"modulos/06-glsl/01-lenguaje.html\">6.1</a>). Lo comprobamos: <code>#define RADIO 2</code> seguido de <code>RADIO * 0.5</code> da exactamente esos dos errores.</p>\n  <p><strong>Solución:</strong> formatea los floats al generarlos: <code>(2).toFixed(1)</code> o una función como <code>flotante(v)</code>, que añade <code>.0</code> cuando falta. Usa texto sin decimales solo cuando quieras un <code>int</code> de verdad (el límite de un bucle).</p>",
  "leccion": {
   "num": "7.1",
   "titulo": "Arquitectura de una app con shaders",
   "archivo": "modulos/07-integracion/01-arquitectura.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-calidad-oscila",
  "titulo": "La nitidez del fondo cambia cada pocos segundos (y hay un tirón en cada cambio)",
  "html": "<p><strong>Síntoma:</strong> con calidad adaptativa, el fondo alterna periódicamente entre más nítido y más borroso, y cada cambio viene con un pequeño tirón. En la consola de rendimiento se ve una caída de fps con un ritmo regular.</p>\n  <p><strong>Causa:</strong> el controlador sube cuando va holgado, el nivel superior no cabe, baja, vuelve a ir holgado y repite. Medimos un ciclo cada 3 s entre 543 × 339 y 639 × 399. Cada cambio reasigna el búfer (que se borra, <a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>) y el intento fallido son unos cuantos frames lentos. El fondo del problema: con la pantalla a 60 Hz, un frame que necesita 3 ms de GPU y uno que necesita 16 ms dan el mismo intervalo, 16,7 ms. Desde rAF no se puede saber cuánto margen queda: la única forma de averiguarlo es probar a subir.</p>\n  <p><strong>Solución:</strong> histéresis con memoria. Si una subida fracasa enseguida, recuerda ese nivel como «techo» y no lo vuelvas a intentar durante un buen rato (10 s o más, creciendo con cada fracaso). Sube solo con holgura sostenida, cuantiza la escala a pasos grandes y, si puedes, usa además el temporizador de GPU (<a href=\"modulos/05-webgl/10-depuracion.html\">5.10</a>) para estimar el margen. Es el ejercicio 7.1.5.</p>",
  "leccion": {
   "num": "7.1",
   "titulo": "Arquitectura de una app con shaders",
   "archivo": "modulos/07-integracion/01-arquitectura.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-puntero-despegado",
  "titulo": "El efecto se despega del puntero sin que lo muevas (al hacer scroll, zoom o cambiar la calidad)",
  "html": "<p><strong>Síntoma:</strong> el halo sigue perfectamente al ratón mientras lo mueves, pero al desplazar la página con la rueda (sin mover el ratón) se queda pegado a la página y no al cursor; o, al hacer zoom, cambiar de monitor o cuando la resolución se adapta, salta a otro sitio. Vuelve a su lugar en cuanto mueves el ratón.</p>\n  <p><strong>Causa:</strong> el evento convirtió el puntero a coordenadas que dependen de cosas que cambian sin eventos del puntero: coordenadas relativas al canvas (que se mueve con el scroll) o píxeles del búfer (que cambian de tamaño). Durante el scroll con el ratón quieto no llega ningún <code>pointermove</code> (comprobado), así que nadie actualiza el valor guardado.</p>\n  <p><strong>Solución:</strong> guarda <code>clientX</code>/<code>clientY</code> en el evento y convierte en cada frame, con el <code>getBoundingClientRect()</code> y el <code>canvas.width</code> de ese frame. Si el efecto debe desaparecer al salir el puntero, apóyate en <code>pointerleave</code>, que sí llega. Los otros bichos clásicos del puntero ya tienen su ficha: <a href=\"modulos/01-web/04-js-dom-eventos.html#m1-raton-invertido\">la y invertida</a>, <a href=\"modulos/01-web/04-js-dom-eventos.html#m1-raton-desplazado\">el factor DPR o el borde olvidados</a> y <a href=\"modulos/06-glsl/02-pensar-en-paralelo.html#m6a-espacios-mezclados\">los espacios mezclados en el shader</a>.</p>",
  "leccion": {
   "num": "7.2",
   "titulo": "Interacción: ratón, touch y scroll",
   "archivo": "modulos/07-integracion/02-interaccion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-barrido-inicial",
  "titulo": "Al entrar el ratón, el efecto llega volando desde una esquina",
  "html": "<p><strong>Síntoma:</strong> la primera vez que el puntero entra en el canvas (o cada vez que vuelve a entrar), el halo no aparece bajo el cursor: cruza la escena desde la esquina inferior izquierda, desde el centro o desde donde salió, y tarda unas décimas en alcanzarlo.</p>\n  <p><strong>Causa:</strong> el valor suavizado arranca en su valor inicial (0, 0) o se quedó donde salió el puntero, y el suavizado hace exactamente su trabajo: recorrer esa distancia con inercia.</p>\n  <p><strong>Solución:</strong> al llegar el primer evento, y en el primer frame tras un <code>pointerleave</code>, asigna el valor suavizado directamente a la posición real y pon la velocidad a 0. Después, suaviza. Si quieres que el efecto aparezca con suavidad, anima su intensidad (de 0 a 1), no su posición.</p>",
  "leccion": {
   "num": "7.2",
   "titulo": "Interacción: ratón, touch y scroll",
   "archivo": "modulos/07-integracion/02-interaccion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-ondas-otro-reloj",
  "titulo": "Las ondas del clic no aparecen, aparecen ya terminadas o se congelan con la pausa",
  "html": "<p><strong>Síntoma:</strong> haces clic y no pasa nada; o la onda aparece un instante ya muy abierta y desvanecida; o, al pausar la escena, las ondas siguen expandiéndose (o se paran las ondas pero no la escena).</p>\n  <p><strong>Causa:</strong> el instante del clic y el tiempo del shader vienen de relojes distintos. Típicamente <code>t0 = e.timeStamp</code> o <code>performance.now()</code> (milisegundos desde que se cargó la página) frente a un <code>u_time</code> en segundos del reloj de la app (que no cuenta las pausas): la edad sale enorme o negativa. O el shader resta dos tiempos grandes en float32 y la edad llega cuantizada.</p>\n  <p><strong>Solución:</strong> un solo reloj: el evento anota el clic, <code>actualizar</code> lo registra con <code>t0 = reloj.t</code>, y en cada frame se envía <code>edad = reloj.t − t0</code> calculada en JavaScript. Las ondas quedan sincronizadas con la pausa y la cámara lenta y la precisión no depende de cuánto tiempo lleve abierta la página.</p>",
  "leccion": {
   "num": "7.2",
   "titulo": "Interacción: ratón, touch y scroll",
   "archivo": "modulos/07-integracion/02-interaccion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-canvas-fijo-retraso",
  "titulo": "Al hacer scroll rápido, el efecto del canvas de fondo se despega de los elementos",
  "html": "<p><strong>Síntoma:</strong> un fondo WebGL fijo dibuja brillos o recortes alineados con tarjetas del DOM. Quieto, encaja al píxel; al desplazar la página deprisa (sobre todo con el dedo o un trackpad), el efecto va detrás de los elementos, como si arrastrara, y se recoloca al parar.</p>\n  <p><strong>Causa:</strong> el compositor desplaza el DOM sin esperar al hilo principal, y tu canvas fijo se dibuja con el <code>getBoundingClientRect()</code> que ve tu rAF, un frame más antiguo. Medido: 25 px de desfase constante a 1500 px/s.</p>\n  <p><strong>Solución:</strong> para efectos pegados a elementos, pon el canvas dentro del contenido que se desplaza (en la sección, o un canvas por sección si son pocas, cuidando el límite de contextos) y dibuja relativo a su propio rectángulo. Para fondos difusos, acepta el frame de retraso y suaviza. Para la parte del DOM, las animaciones CSS guiadas por scroll (<code>animation-timeline: scroll()</code>, donde el navegador las admita) corren en el compositor y no tienen retraso.</p>",
  "leccion": {
   "num": "7.2",
   "titulo": "Interacción: ratón, touch y scroll",
   "archivo": "modulos/07-integracion/02-interaccion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-canvas-sin-teclado",
  "titulo": "El canvas no responde al teclado (aunque haya hecho clic en él)",
  "html": "<p><strong>Síntoma:</strong> has añadido <code>canvas.addEventListener('keydown', …)</code>, haces clic sobre el canvas, pulsas teclas y el manejador nunca se ejecuta. Con el listener en <code>document</code> sí funciona.</p>\n  <p><strong>Causa:</strong> un canvas no es enfocable por defecto. El clic no le da el foco, así que las teclas van al elemento enfocado, que es el <code>body</code>. Lo comprobamos: tras un clic en un canvas sin <code>tabindex</code>, el <code>keydown</code> llegó a <code>document</code> con <code>target = BODY</code> y el listener del canvas no se enteró; con <code>tabindex=\"0\"</code>, el clic lo enfocó y su listener sí se ejecutó.</p>\n  <p><strong>Solución:</strong> <code>tabindex=\"0\"</code> en el canvas (y un estilo <code>:focus-visible</code> para que se vea cuándo tiene el foco). Si los controles deben funcionar en toda la página, escucha en <code>window</code>, pero entonces no bloquees con <code>preventDefault</code> las teclas que el usuario necesita para desplazarse y rellenar formularios.</p>",
  "leccion": {
   "num": "7.2",
   "titulo": "Interacción: ratón, touch y scroll",
   "archivo": "modulos/07-integracion/02-interaccion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-muelle-quema",
  "titulo": "Con un muelle que rebota, la imagen de llegada se quema (o sale saturada) un instante",
  "html": "<p><strong>Síntoma:</strong> la transición va guiada por un muelle con rebote. Justo al terminar, durante unas décimas de segundo, la imagen nueva se ve con colores quemados o hipersaturados, como si le hubieran subido el contraste; al volver hacia A, lo mismo con la imagen vieja. Después se estabiliza.</p>\n  <p><strong>Causa:</strong> <code>mix(a, b, p)</code> es $a + (b - a)\\,p$, y con $p > 1$ no se detiene en <code>b</code>: sigue en la misma dirección y <em>extrapola</em>. Cada canal se aleja de A más allá de B, y los que se salen de $[0, 1]$ se recortan al escribir en el búfer de 8 bits (<a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>). Lo medimos en la máquina de pruebas (Apple M1, Chrome 154, ANGLE sobre Metal), escribiendo en un búfer RGBA8 y leyéndolo con <code>readPixels</code>: entre $a = (0{,}2;\\ 0{,}4;\\ 0{,}9)$ y $b = (0{,}9;\\ 0{,}6;\\ 0{,}1)$, con $p = 1$ el píxel sale (229, 153, 26); con $p = 1{,}15$, (255, 161, 0); con $p = -0{,}15$, (24, 94, 255). Cada canal extremo acaba en 0 o en 255.</p>\n  <p><strong>Solución:</strong> decide en el shader qué significa el exceso. Para un fundido, <code>clamp(p, 0.0, 1.0)</code> antes del <code>mix</code>. Si quieres aprovechar el rebote, llévalo a una propiedad geométrica que lo admita (un radio, un zoom, la fuerza de una distorsión) y deja la mezcla de colores recortada. Y si nadie ha pensado en el exceso, usa un muelle sin rebote (<code>M7.Muelle</code> con sus valores por defecto está a un 0,3 % del amortiguamiento crítico).</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-transicion-no-limpia",
  "titulo": "La transición empieza con un velo de la imagen nueva (o termina con un resto de la vieja)",
  "html": "<p><strong>Síntoma:</strong> en el primer frame de una cortinilla, el borde por el que entra ya muestra un degradado de la imagen nueva, y el cambio desde la imagen anterior (sin transición) se nota como un pequeño salto. Al terminar, en el lado opuesto queda una franja con la imagen vieja a medio fundir, que se ve perfectamente con la imagen ya quieta. Lo mismo pasa con disoluciones que dejan puntitos sin revelar.</p>\n  <p><strong>Causa:</strong> la zona de transición tiene anchura y el recorrido no la tiene en cuenta. Con <code>e = p</code> y un borde de anchura $2w$, en $p = 0$ el píxel del borde de entrada vale <code>smoothstep(-w, w, 0.0)</code> = 0,5: la mitad de B desde el primer frame. En $p = 1$, el del lado opuesto conserva la mitad de A para siempre. En una disolución, la causa es la misma con otro disfraz: el umbral no llega a cubrir el valor más alto (o más bajo) del ruido, o $p$ se queda en 0,999 porque el tween o el muelle no aterrizan exactamente en 1.</p>\n  <p><strong>Solución:</strong> haz que el recorrido incluya el borde entero: <code>e = mix(-w, 1.0 + w, p)</code> para una cortinilla, y lo equivalente para radios y umbrales. Comprueba siempre los dos extremos con el valor exacto de los píxeles (en los editores del curso, la barra inferior muestra el color bajo el puntero). Y en JavaScript, termina en el objetivo exacto: <code>Math.min(objetivo, …)</code> en el tween, <code>fijar()</code> en el muelle.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-circulo-esquinas",
  "titulo": "El revelado circular termina y las esquinas siguen mostrando la imagen vieja",
  "html": "<p><strong>Síntoma:</strong> un revelado circular crece, se detiene, y en las cuatro esquinas (o en las más alejadas del punto del clic) queda la imagen anterior. En un lienzo cuadrado casi no pasa; en uno panorámico, siempre.</p>\n  <p><strong>Causa:</strong> el radio final no alcanza la esquina más lejana. Con <code>r = p</code> (radio 1, en alturas del lienzo) y el centro en medio de un lienzo de 736 × 330 px (el de estos editores), la esquina está a $\\sqrt{1{,}115^2 + 0{,}5^2} \\approx 1{,}22$ alturas: las esquinas nunca se revelan. Con el centro en el punto del clic, cerca de un borde, el hueco es aún mayor.</p>\n  <p><strong>Solución:</strong> calcula el radio máximo con la esquina más lejana, <code>length(max(c, 1.0 - c) * aspecto)</code>, y suma la anchura del borde: <code>r = mix(-w, R + w, p)</code>. Si el centro cambia con el puntero, el radio máximo también cambia: calcúlalo en el shader, no una vez en JavaScript.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-disolucion-atascada",
  "titulo": "La disolución no hace nada al principio ni al final, y todo ocurre de golpe en el medio",
  "html": "<p><strong>Síntoma:</strong> una disolución con ruido de 1 segundo parece durar la mitad: durante las primeras décimas no aparece nada, de repente la imagen nueva se extiende en muy poco tiempo y al final hay otro rato en el que no pasa nada. Cambiar el easing no lo arregla del todo.</p>\n  <p><strong>Causa:</strong> los valores del ruido no se reparten por igual entre 0 y 1. Un fbm suma varias octavas, y la suma se concentra alrededor de la media. Medido con el fbm de 4 octavas de esta lección: ningún valor por debajo de 0,15 ni por encima de 0,89; con un umbral lineal, en $p = 0{,}2$ se había revelado el 0,3 % de la imagen y en $p = 0{,}8$, el 99 %. El 60 % central del tiempo hace todo el trabajo.</p>\n  <p><strong>Solución:</strong> estira el ruido a su rango real antes de compararlo: <code>n = clamp((n - lo) / (hi - lo), 0.0, 1.0)</code>, con <code>lo</code> y <code>hi</code> medidos (los percentiles 1 y 99 dejan fuera los valores raros). Con 0,24 y 0,80, en $p = 0{,}2$ ya se ve el 8 % y en $p = 0{,}8$ el 86 %. Si lo quieres perfectamente uniforme, la técnica es la ecualización del histograma: medir la curva acumulada del ruido en JavaScript y pasarla como una textura de 256 × 1 que convierte cada valor en su percentil. Y si cambias la escala, las octavas o la función de ruido, vuelve a medir: los percentiles cambian.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-vuelta-de-golpe",
  "titulo": "Al invertir una transición a medias, la vuelta arranca casi parada y llega de golpe",
  "html": "<p><strong>Síntoma:</strong> una transición con <code>cubicOut</code> (o cualquier easing de salida) va perfecta hacia delante. Si la inviertes cerca del final (el hover que se retira), la vuelta tarda en arrancar, como si se hubiera atascado, y después acelera y llega al principio a toda velocidad, con un frenazo seco.</p>\n  <p><strong>Causa:</strong> el código invierte el sentido del progreso lineal y reutiliza la misma curva: <code>lin</code> baja y el valor es <code>cubicOut(lin)</code>. Hacia atrás, esa curva se recorre al revés: donde la ida frenaba (el final), la vuelta arranca despacio, y donde la ida salía disparada (el principio), la vuelta llega disparada. Con 0,9 s de duración, invirtiendo en <code>lin = 0,8</code>, la vuelta arranca a $3 \\cdot 0{,}2^2 / 0{,}9 \\approx 0{,}13$ unidades por segundo y llega a 0 a $3 / 0{,}9 \\approx 3{,}3$: veinticinco veces más rápido de lo que salió. Lo ves en el ejemplo 7.3.2 eligiendo <code>cubicOut</code>.</p>\n  <p><strong>Solución:</strong> al cambiar de destino, empieza un tramo nuevo desde el valor actual con su propio easing y una duración proporcional a lo que falta (<code>L73.Transicion</code>), o usa un muelle. Si mantienes el progreso lineal compartido, usa solo easings simétricos (<em>in-out</em>), que al menos se recorren igual en los dos sentidos.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-salto-al-interrumpir",
  "titulo": "Al pulsar «siguiente» a mitad de una transición, la imagen salta",
  "html": "<p><strong>Síntoma:</strong> la galería funciona bien si esperas a que termine cada transición. Si pulsas «siguiente» mientras una está en marcha, parte de la imagen cambia de golpe: la zona ya revelada salta a la imagen nueva, o la que aún no se había revelado salta a la intermedia. Con varios clics rápidos, la galería parpadea.</p>\n  <p><strong>Causa:</strong> el shader mezcla dos imágenes y en ese instante hay tres en juego (la de partida, la intermedia y la nueva). Cambiar cualquiera de las dos texturas o reiniciar $p$ sin más rompe la continuidad: el frame siguiente ya no se parece al anterior.</p>\n  <p><strong>Solución:</strong> congela lo que se ve: dibuja la transición actual en un framebuffer del tamaño del lienzo y usa esa textura como imagen de partida de la transición nueva, con $p = 0$. Usa dos framebuffers alternos para poder interrumpir también una transición que ya partía de una foto. Si no puedes permitirte el framebuffer, espera a que termine (y descarta los clics intermedios salvo el último), pero no cambies las texturas a medias.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-bajo-demanda-insomne",
  "titulo": "El bucle bajo demanda no se duerme nunca",
  "html": "<p><strong>Síntoma:</strong> has activado el modo bajo demanda y todo parece ir bien, pero el contador de frames sigue subiendo con la escena quieta, el ventilador no se calma y el panel de rendimiento muestra frames continuos.</p>\n  <p><strong>Causa:</strong> algo llama a <code>pedirFrame</code> en cada frame. La más traicionera es la comparación exacta: <code>if (suave !== objetivo) app.pedirFrame()</code>. Un suavizado exponencial o un muelle tardan muchísimo en valer exactamente su objetivo en coma flotante, o no lo valen nunca. Lo comprobamos en Chrome, a 60 Hz: <code>M7.suavizar</code> hacia 1 (semivida 0,06 s) se había quedado atascado tras 100 000 frames en 0,9999999999999998 (la diferencia con 1, $2{,}2 \\cdot 10^{-16}$, se multiplica por el factor del suavizado, 0,82, y al sumarla a 1 el resultado se redondea otra vez al mismo número); el muelle por defecto de <code>M7.Muelle</code>, casi crítico, en 0,999999999999999. Un muelle con rebote sí acaba clavando el 1 (el de la lupa, a los 7,6 s), mucho después de parecer quieto. Y hacia 0 ninguno llega en la práctica: el de la lupa vale $-1{,}2 \\cdot 10^{-8}$ a los 4 s y $2 \\cdot 10^{-20}$ a los 10 s, y sigue encogiendo durante minutos. Otras causas: un shader que usa <code>u_time</code> y alguien que pide frames «para que se mueva», un <code>pointermove</code> que pide frames aunque el efecto no dependa del puntero, o un muelle que nunca queda en reposo porque su objetivo se recalcula cada frame con un valor que tiembla.</p>\n  <p><strong>Solución:</strong> compara siempre con una tolerancia (<code>muelle.enReposo()</code>, <code>Math.abs(a - b) &gt; 1e-3</code>) y, al entrar en ella, clava el valor en el objetivo (<code>fijar</code>) para que el último frame sea exacto. Para depurar, cuenta cuántas veces se llama a <code>pedirFrame</code> y desde dónde (un <code>console.count()</code> dentro de cada llamada lo delata en segundos).</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-3-salto-al-despertar",
  "titulo": "Cada transición empieza con un salto (en un bucle que se duerme)",
  "html": "<p><strong>Síntoma:</strong> en una app que deja de dibujar cuando está quieta, todas las transiciones empiezan con un pequeño salto: el primer frame ya muestra la transición bastante avanzada. Si esperas poco entre una y otra, el salto es menor; si esperas mucho, se queda en un tamaño fijo.</p>\n  <p><strong>Causa:</strong> el bucle calcula <code>dt</code> como la diferencia con el <em>último frame dibujado</em>, que fue hace segundos. El tope de <code>dt</code> (0,1 s en el reloj de 7.1) evita el desastre, pero no el salto: el primer frame avanza 0,1 s de golpe. Con el muelle por defecto de m7kit, simulamos ese primer paso: la posición pasa de 0 a 0,39 en un solo frame, cuando a 60 Hz debería haber avanzado hasta 0,026.</p>\n  <p><strong>Solución:</strong> al despertar, olvida la referencia del frame anterior para que el primer <code>dt</code> sea 0 (<code>reloj.reiniciarReferencia()</code>). <code>M7.crearApp</code> lo hace dentro de <code>pedirFrame</code>; si escribes tu propio bucle bajo demanda, es la línea que no puede faltar.</p>",
  "leccion": {
   "num": "7.3",
   "titulo": "Transiciones animadas con shaders",
   "archivo": "modulos/07-integracion/03-transiciones-shader.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-indices-uint16",
  "titulo": "Una rejilla grande sale sin su parte de arriba, con triángulos estirados o con un agujero en la esquina",
  "html": "<p><strong>Síntoma:</strong> la rejilla se ve perfecta hasta cierto tamaño. A partir de ahí, falta un trozo entero (la parte superior) y aparecen triángulos alargados que cruzan la malla; o, justo en el límite, falta un solo triángulo en una esquina. No hay ningún error en la consola.</p>\n  <p><strong>Causa:</strong> índices en <code>Uint16Array</code> con más vértices de los que caben. Un array tipado no avisa al desbordar: guarda el valor módulo 65 536 (comprobado: <code>new Uint16Array([65535, 65536, 70000])</code> da <code>[65535, 0, 4464]</code>), así que los triángulos de arriba apuntan a vértices de abajo. Lo medimos dibujando la rejilla plana que llena un lienzo de 256 × 256: con N = 300 y <code>Uint16Array</code> solo se pintaron 47 306 de los 65 536 píxeles (la franja superior, vacía), sin <code>getError</code>; con <code>Uint32Array</code>, los 65 536. Con N = 255 el único índice problemático es el último vértice, el 65 535, que es la orden de reinicio de primitiva: faltó exactamente el triángulo que lo usa.</p>\n  <p><strong>Solución:</strong> elige el tipo por el índice máximo (<code>nVertices − 1 ≤ 65 534</code> → <code>Uint16Array</code>; si no, <code>Uint32Array</code>) y pasa a <code>drawElements</code> el tipo que corresponde (<code>UNSIGNED_SHORT</code> o <code>UNSIGNED_INT</code>). En WebGL2 <code>Uint32</code> está siempre disponible (<code>MAX_ELEMENT_INDEX</code> vale 4 294 967 294 en la máquina de pruebas). Puedes provocarlo en el ejemplo siguiente con la casilla «forzar Uint16Array».</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-normal-plana",
  "titulo": "La malla ondula, pero la luz no cambia: se ve plana aunque se mueva",
  "html": "<p><strong>Síntoma:</strong> la silueta de la superficie se mueve (el borde sube y baja contra el fondo), pero de frente parece una lámina plana: sin sombras en las laderas, sin brillos en las crestas. Solo se nota la deformación por el perfil.</p>\n  <p><strong>Causa:</strong> el vertex shader cambió la posición y dejó la normal del plano en reposo (un atributo <code>a_normal</code> constante o un <code>vec3(0.0, 1.0, 0.0)</code> fijo). Lambert solo mira la normal: si todas valen lo mismo, todos los puntos reciben la misma luz. Lo provocarás en el ejemplo 7.4.3 con el modo «normal del plano».</p>\n  <p><strong>Solución:</strong> recalcula la normal en el vertex shader a partir de la misma función que desplaza la posición: con la derivada analítica o con diferencias finitas (esta sección). Y si la malla además pasa por una matriz de modelo con escala no uniforme, esa normal nueva pasa después por la matriz normal (<a href=\"modulos/05-webgl/06-3d-cubo.html#m5-matriz-normal\">5.6</a>).</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-normal-invertida",
  "titulo": "La superficie sale oscura donde mira a la luz y clara donde le da la espalda",
  "html": "<p><strong>Síntoma:</strong> la iluminación parece venir del lado contrario, o desde debajo del suelo: las laderas que miran al sol están oscuras, las otras claras, y en un plano sin deformar todo sale casi negro (solo con la luz ambiente).</p>\n  <p><strong>Causa:</strong> la normal apunta hacia abajo. Casi siempre es el orden del producto cruz (<code>cross(tx, tz)</code> en lugar de <code>cross(tz, tx)</code>), un signo perdido en la fórmula (<code>vec3(hx, 1.0, hz)</code>, que inclina la normal hacia el lado equivocado) o un eje de la malla invertido (nuestra <code>z = 0,5 − v</code>) que no se tuvo en cuenta al derivar.</p>\n  <p><strong>Solución:</strong> comprueba el caso plano (debe salir <code>(0, 1, 0)</code>) y una ladera conocida. Y usa la visualización de normales como color, <code>n * 0.5 + 0.5</code>: una superficie casi horizontal debe verse verde claro (<code>y ≈ 1</code>), nunca oscura. El ejemplo 7.4.3 tiene ese modo.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-epsilon",
  "titulo": "Las normales por diferencias finitas salen con granulado o chispas (o empeoran con el tiempo)",
  "html": "<p><strong>Síntoma:</strong> una superficie iluminada con normales por diferencias finitas tiene un moteado fino que parpadea, brillos sueltos que saltan de vértice en vértice, o una luz «sucia» que no estaba al abrir la página y aparece al cabo de un rato (o al alejar la malla del origen).</p>\n  <p><strong>Causa:</strong> el paso ε es demasiado pequeño para la magnitud de los números. La resta <code>h(x + ε) − h(x − ε)</code> cancela los dígitos significativos de dos floats casi iguales y lo que queda es redondeo, amplificado al dividir por ε. Medido en el vertex shader del M1: ε = 0,0001 da hasta 0,5° de error con coordenadas de 0 a 10, 24° con coordenadas cerca de 1000 y 73° con t = 10 000 s dentro del seno.</p>\n  <p><strong>Solución:</strong> un ε de entre 1/100 y 1/1000 de la longitud de onda más corta que te importe (0,01 para olas de un par de unidades), nunca 1e-5 «por si acaso». Mantén pequeños los números que entran en la función: la malla centrada en el origen, el tiempo envuelto (<code>reloj.envuelto(periodo)</code> de 7.1) o, mejor, la fase de cada onda calculada en JavaScript con 64 bits y reducida a [0, 2π) antes de enviarla. Y si la función es derivable a mano, la derivada analítica no tiene este problema.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-aliasing-malla",
  "titulo": "Con olas cortas, la malla dibuja otra ola: más larga, torcida o que avanza hacia atrás",
  "html": "<p><strong>Síntoma:</strong> al subir la frecuencia de las olas (o bajar la resolución de la malla), la superficie no se vuelve más rizada: aparece un oleaje más largo que el que pediste, en otra dirección, y a veces avanza en sentido contrario. En el ejemplo 7.4.1, con N = 8 y k = 10, la ola principal avanza hacia la izquierda cuando la fórmula la manda hacia la derecha.</p>\n  <p><strong>Causa:</strong> la malla <em>muestrea</em> la función en los vértices, cada Δ = tamaño / N unidades, y entre ellos une con rectas. Si la longitud de onda es menor que 2Δ (el límite de Nyquist), las muestras coinciden con las de una onda más larga, su «alias», el mismo efecto que hace girar hacia atrás las ruedas de los carros en las películas. En el ejemplo 7.4.1 (plano de 4 unidades, N = 8, Δ = 0,5) el límite es k = π / Δ ≈ 6,3; con k = 10, las muestras son las de una onda de unas 2,4 unidades que avanza al revés.</p>\n  <p><strong>Solución:</strong> al menos 4 a 8 vértices por longitud de onda de la ola más corta que quieras en la <em>geometría</em>. Lo que sea más fino, a la luz: normal por píxel (ejemplo 7.4.4) o un ruido en el fragment shader. Si la malla se ve de lejos, reduce la amplitud de las olas cortas con la distancia antes de que caigan por debajo del límite.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-cara-trasera",
  "titulo": "Una tela (bandera, hoja, papel) se ve negra por detrás",
  "html": "<p><strong>Síntoma:</strong> la bandera se ilumina bien por delante, pero al girar la cámara (o cuando una onda la dobla hacia ti) la parte que muestra su reverso sale negra o solo con la luz ambiente, aunque la luz esté de tu lado.</p>\n  <p><strong>Causa:</strong> una normal por vértice apunta hacia un solo lado de la superficie, el de delante. Por detrás, el producto punto con una luz de tu lado es negativo, y <code>max(…, 0.0)</code> lo deja en 0. El culling está desactivado (si no, el reverso ni se dibujaría), pero nadie le dijo al fragment shader qué cara está viendo.</p>\n  <p><strong>Solución:</strong> <code>if (!gl_FrontFacing) n = -n;</code> en el fragment shader. <code>gl_FrontFacing</code> depende del sentido de giro en pantalla del triángulo: lo comprobamos dibujando el mismo triángulo en los dos órdenes (<code>true</code> antihorario, <code>false</code> horario). Si tu malla tiene el winding al revés, la corrección oscurecerá la cara de delante: arregla los índices o invierte la condición. Para un efecto de tela translúcida, suma además un poco de luz por detrás: <code>max(-dot(n, L), 0.0) × 0,3</code>.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-puntos-dpr",
  "titulo": "Los puntos cambian de tamaño según la pantalla (o cuando baja la calidad)",
  "html": "<p><strong>Síntoma:</strong> un campo de partículas se ve bien en tu monitor y diminuto en un portátil retina o en un móvil; o los puntos engordan de repente cuando la calidad adaptativa baja la resolución.</p>\n  <p><strong>Causa:</strong> <code>gl_PointSize</code> está en píxeles del búfer. Con DPR 2 un píxel del búfer mide medio píxel CSS, y con el búfer a la mitad mide dos. Comprobado: <code>gl_PointSize = 10.0</code> cubrió exactamente 10 × 10 píxeles del búfer en un canvas mostrado a la mitad de su resolución.</p>\n  <p><strong>Solución:</strong> multiplica por la proporción <code>canvas.width / rect.width</code> (la <code>u_escala</code> de 7.2), o calcula el tamaño con perspectiva a partir de la altura del búfer. Y recuerda el techo: con tamaños grandes y DPR 3 puedes chocar con el máximo de <code>ALIASED_POINT_SIZE_RANGE</code> (511 en el M1, bastante menos en otras GPU); por encima, cuadrados con instancing (5.9).</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-heightmap-plano",
  "titulo": "El terreno sale completamente plano (y no hay ningún error)",
  "html": "<p><strong>Síntoma:</strong> la malla del terreno se dibuja, pero plana, a altura 0, como si el mapa de alturas estuviera vacío. <code>getError</code> no dice nada.</p>\n  <p><strong>Causa:</strong> la lectura en el vertex shader devuelve 0. Las tres causas medidas: la textura está incompleta (sin mipmaps y con el <code>TEXTURE_MIN_FILTER</code> por defecto, que los pide), es <code>R32F</code> con <code>LINEAR</code> sin <code>OES_texture_float_linear</code>, o el sampler apunta a una unidad sin textura (<a href=\"modulos/05-webgl/05-texturas.html#m5-sampler-unidad\">5.5</a>). Las tres se comportan igual en el vertex shader que en el fragment shader; la diferencia es que un terreno plano parece un fallo de geometría y no de textura.</p>\n  <p><strong>Solución:</strong> <code>TEXTURE_MIN_FILTER</code> a <code>LINEAR</code> o <code>NEAREST</code> si no generas mipmaps (<code>GLKit.crearTextura</code> ya lo hace), <code>R16F</code> o la extensión para floats filtrados, y comprueba la unidad. Para depurar, pinta la altura leída como color en un varying: si sale negro, el problema está en la textura, no en la malla.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-4-heightmap-escalones",
  "titulo": "El terreno sale en terrazas, con escalones que la luz delata",
  "html": "<p><strong>Síntoma:</strong> un terreno leído de un mapa de alturas se ve bien de lejos, pero de cerca, o al exagerar la altura, las laderas están hechas de escalones: bandas planas separadas por saltos, muy visibles con luz rasante.</p>\n  <p><strong>Causa:</strong> el mapa tiene 8 bits por canal: solo 256 alturas posibles. Un canvas 2D (o un PNG normal) no puede guardar nada entre dos niveles, así que una ladera suave se convierte en una escalera de 256 peldaños, y la normal por diferencias de un texel, que vale 0 en los peldaños y mucho en los saltos, lo amplifica. En el ejemplo 7.4.8, con la exageración al máximo cada peldaño mide 3/255 ≈ 0,012 unidades del mundo, y la luz dibuja las curvas de nivel.</p>\n  <p><strong>Solución:</strong> más bits: una textura <code>R16F</code> o <code>R32F</code> (con la extensión de filtrado) rellenada desde un <code>Float32Array</code>, o dos canales de 8 bits combinados (<code>r + g / 255</code>) si el mapa tiene que viajar como PNG. Si solo puedes tener 8 bits, calcula la normal con un paso de varios texeles (suaviza los peldaños a costa de detalle) y no exageres la altura.</p>",
  "leccion": {
   "num": "7.4",
   "titulo": "Animar vértices: mallas que se deforman",
   "archivo": "modulos/07-integracion/04-vertex-animacion.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-costura-hilos",
  "titulo": "Con curl noise, las partículas forman hilos densos que nacen en los bordes",
  "html": "<p><strong>Síntoma:</strong> usas un campo de rotacional, que en teoría no amontona nada, y las partículas empiezan bien repartidas; pero al cabo de unos segundos aparecen hilos y zonas densas, y si te fijas, nacen en los bordes de la pantalla.</p>\n  <p><strong>Causa:</strong> el mundo «da la vuelta» (lo que sale por la derecha entra por la izquierda) pero el ruido no es periódico: el campo a un lado de la costura no tiene nada que ver con el del otro. En una altura donde el flujo sale por los dos bordes a la vez, las partículas salen por la derecha, entran por la izquierda y vuelven a salir: la costura se comporta como un sumidero, y lo acumulado se estira en hilos hacia el interior. Lo medimos con el campo de la lección en una versión sin periodicidad: a los 30 s, el 5 % de celdas más pobladas tenía el 46 % de las partículas. Con la versión periódica, que casa en la costura, el 7 %, lo mismo que al principio.</p>\n  <p><strong>Solución:</strong> usa ruido periódico con el mismo periodo que el mundo (se repite la rejilla de gradientes con un módulo, como en el <a href=\"modulos/06-glsl/06-ruido.html\">ejercicio 6.6.4</a>; es lo que hace <code>L75.RUIDO</code>, justo debajo), o no envuelvas: haz que las partículas que salen renazcan en un sitio al azar. O acéptalo: en un efecto decorativo, los hilos quedan bien. Lo importante es saber de dónde salen.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-todas-en-el-centro",
  "titulo": "Todas las partículas aparecen amontonadas en el centro (y no se mueven)",
  "html": "<p><strong>Síntoma:</strong> la simulación en texturas arranca y, en lugar de miles de partículas repartidas, ves un único punto muy brillante en el centro del lienzo (en <code>(0, 0)</code> del mundo). No hay ningún error en la consola. Si lees la textura inicial con <code>readPixels</code>, los datos están bien.</p>\n  <p><strong>Causa:</strong> la textura de estado es <code>RGBA32F</code> con el filtro por defecto de GLKit (<code>LINEAR</code>) o el de WebGL (<code>NEAREST_MIPMAP_LINEAR</code> para reducir, sin mipmaps). Filtrar linealmente una textura de 32 bits exige <code>OES_texture_float_linear</code>; sin ella, la textura está <em>incompleta</em> (<a href=\"modulos/05-webgl/05-texturas.html#m5-textura-negra\">5.5</a>) y cualquier lectura devuelve <code>(0, 0, 0, 1)</code>, incluida <code>texelFetch</code>, aunque no filtre nada. Lo comprobamos: con <code>LINEAR</code>, <code>texelFetch</code> devolvió (0, 0, 0, 1) en el vertex shader y en el fragment shader; con <code>NEAREST</code>, el valor correcto; y tras pedir la extensión, también con <code>LINEAR</code>. Todas las posiciones valen 0 y la primera simulación escribe esos ceros en la otra textura: el estado se ha perdido.</p>\n  <p><strong>Solución:</strong> <code>NEAREST</code> en los dos filtros de las texturas de estado (<code>GLKit.crearFBO(gl, w, h, { filtro: gl.NEAREST, … })</code> pone los dos). No dependas de una extensión para algo que no necesitas: <code>texelFetch</code> no filtra. Ojo: <code>RGBA16F</code> sí se puede filtrar en WebGL2 sin extensiones (comprobado), así que este fallo aparece justo al pasar de 16 a 32 bits.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-half-congeladas",
  "titulo": "Con RGBA16F, unas partículas se mueven y otras se quedan congeladas (o van más despacio)",
  "html": "<p><strong>Síntoma:</strong> la simulación va bien con <code>RGBA32F</code>. Con <code>RGBA16F</code> (para gastar la mitad de memoria, o porque el dispositivo no renderiza en 32 bits), las partículas lentas se quedan quietas en ciertas zonas, las de los bordes van más despacio que las del centro y, en una pantalla de 120 Hz, se congelan todavía más.</p>\n  <p><strong>Causa:</strong> un half float tiene 11 bits significativos (10 guardados y uno implícito, <a href=\"modulos/03-matematicas/07-precision.html\">3.7</a>): entre 0,5 y 1 los valores representables van de 0,00049 en 0,00049, y entre 1 y 2, de 0,00098 en 0,00098 (el ULP). Si una partícula avanza menos que eso en un frame, al guardarla vuelve a su valor anterior. Y en el M1 es peor que redondear: la conversión a 16 bits al escribir en el FBO <strong>trunca</strong> (redondea hacia cero). Lo medimos integrando <code>x += v · dt</code> durante 600 pasos de 1/60 s: con <code>x₀ = 0,5</code> y <code>v = 0,02</code>, la posición no se movió ni una milésima (debía llegar a 0,7); con <code>x₀ = 0,1</code> y <code>v = 0,01</code>, llegó a 0,173 en lugar de 0,2; con <code>x₀ = 0,9</code> y <code>v = 0,1</code>, a 1,52 en lugar de 1,9. En <code>RGBA32F</code>, las tres llegaron a su sitio con 5 cifras correctas. A 120 Hz, cada paso es la mitad de largo y cae por debajo del ULP con velocidades el doble de grandes: una partícula en <code>x₀ = 1,2</code> con <code>v = 0,1</code> recorrió en 5 s el 59 % de lo debido con pasos de 1/60 s (llegó a 1,49 en lugar de 1,7) y, con pasos de 1/120 s, no se movió (1,2002). El mismo código, congelado o no según la pantalla del usuario.</p>\n  <p><strong>Solución:</strong> <code>RGBA32F</code> para posiciones siempre que se pueda. Si tienes que usar 16 bits, guarda posiciones <em>relativas</em> (a una celda, a un centro) para que los valores sean pequeños y su ULP también, acumula el movimiento en la velocidad y no en la posición, o simula con transform feedback, que escribe floats de 32 bits en un buffer y no necesita ninguna extensión (enfoque 3). Pruébalo en el ejemplo 7.5.2: el selector cambia el formato del estado.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-no-avanza",
  "titulo": "La simulación en la GPU avanza un paso y se congela (o no hace nada y avisa de un «feedback loop»)",
  "html": "<p><strong>Síntoma:</strong> las partículas se mueven un instante y se quedan temblando en el mismo sitio; o no se mueven nunca y la consola repite <code>GL_INVALID_OPERATION: glDrawArrays: Feedback loop formed between Framebuffer and active Texture</code>.</p>\n  <p><strong>Causa:</strong> la contabilidad del ping-pong. Si no intercambias A y B, cada frame calcula el paso siguiente <em>del estado inicial</em> y lo escribe en B: la simulación nunca pasa del primer paso (lo comprobamos con transform feedback: tras cinco pasos sin intercambiar, una partícula que debía estar en x = 2,5 seguía en 0,5, la posición tras un paso). Si intercambias las texturas pero no los FBO (o al revés), acabas leyendo la textura adjunta al FBO en el que escribes: WebGL detecta el bucle, genera <code>INVALID_OPERATION</code> y no dibuja nada. Curiosidad medida: con la textura incompleta (el bestiario del centro), WebGL no avisa del bucle, porque una textura incompleta no se lee.</p>\n  <p><strong>Solución:</strong> guarda cada textura con su FBO en un mismo objeto (<code>crearFBO</code> devuelve <code>{ fbo, textura }</code>) e intercambia los objetos enteros, una sola vez por paso y justo después del dibujo de simulación. En la pasada de dibujo, lee siempre de A, el que se acaba de escribir.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-tf-dos-sitios",
  "titulo": "El transform feedback no escribe nada: «A transform feedback buffer that would be written to is also bound to a non-transform-feedback target»",
  "html": "<p><strong>Síntoma:</strong> el paso de simulación no produce ningún cambio (las partículas no se mueven, o el buffer de salida conserva lo que tenía), y la consola dice <code>GL_INVALID_OPERATION: glDrawArrays: A transform feedback buffer that would be written to is also bound to a non-transform-feedback target, which would cause undefined behavior</code>. O, al dibujar después, <code>It is undefined behavior to use a vertex buffer that is bound for transform feedback</code>.</p>\n  <p><strong>Causa:</strong> WebGL prohíbe que un buffer esté a la vez en un punto de transform feedback y en cualquier otro sitio, porque la GPU podría leerlo y escribirlo en el mismo dibujo. La trampa es que «cualquier otro sitio» incluye el enlace genérico de <code>ARRAY_BUFFER</code>, que es global y que casi nadie limpia: después de crear el buffer B con <code>bufferData</code>, B se queda enlazado a <code>ARRAY_BUFFER</code>, y el primer paso de simulación que escribe en B falla. Lo comprobamos: con B en <code>ARRAY_BUFFER</code>, <code>INVALID_OPERATION</code>; tras <code>bindBuffer(ARRAY_BUFFER, null)</code>, el paso funcionó. Lo mismo ocurrió con B en el enlace genérico de <code>UNIFORM_BUFFER</code>. La segunda variante es la contraria: dibujar con el buffer como atributo mientras sigue en el punto 0 del objeto de transform feedback enlazado (aunque la captura haya terminado).</p>\n  <p><strong>Solución:</strong> <code>gl.bindBuffer(gl.ARRAY_BUFFER, null)</code> al terminar de crear los buffers, y <code>bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, 0, null)</code> más <code>bindTransformFeedback(TRANSFORM_FEEDBACK, null)</code> después de cada captura. Leer del buffer de entrada mientras está en <code>ARRAY_BUFFER</code> sí está permitido (comprobado): la regla es solo para el que se escribe.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-rasterizer-discard",
  "titulo": "Tras añadir transform feedback, el lienzo se queda vacío (ni siquiera funciona clear)",
  "html": "<p><strong>Síntoma:</strong> añades la simulación con transform feedback y todo lo que se dibujaba después desaparece. El lienzo muestra el fondo de la página o se queda congelado en el último frame, y <code>gl.clear</code> tampoco hace nada. No hay ningún error.</p>\n  <p><strong>Causa:</strong> <code>gl.enable(gl.RASTERIZER_DISCARD)</code> sin su <code>disable</code>. Es estado global del contexto, y con él activo no se rasteriza <em>nada</em>: ni tus partículas, ni el fondo, ni un triángulo de pantalla completa. Y descarta también los <code>clear</code>: lo comprobamos limpiando de rojo un lienzo azul con el descarte activo, y el píxel siguió azul; un triángulo verde, lo mismo.</p>\n  <p><strong>Solución:</strong> <code>disable(gl.RASTERIZER_DISCARD)</code> justo después de <code>endTransformFeedback()</code>, siempre en pareja, como el <code>enable</code>/<code>disable</code> de la mezcla. Si depuras un lienzo vacío con transform feedback en el código, pregunta <code>gl.isEnabled(gl.RASTERIZER_DISCARD)</code> antes de dibujar.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-divisor-colapso",
  "titulo": "Tras el primer frame, todas las partículas saltan al mismo sitio",
  "html": "<p><strong>Síntoma:</strong> la simulación con transform feedback arranca bien, con las partículas repartidas, y en el frame siguiente todas colapsan en un único punto (o un único quad) que después se mueve como si fuera una sola partícula. Ningún error.</p>\n  <p><strong>Causa:</strong> el VAO con el que se simula tiene divisor 1 en los atributos de la partícula, porque es el mismo que se configuró para dibujar quads instanciados. Un <code>drawArrays</code> sin instancias equivale a una sola instancia, la 0, así que todos los vértices leen el registro 0: todas las partículas se calculan a partir de la primera. Lo comprobamos con cuatro partículas distintas: tras un paso con divisor 1, el buffer de salida tenía cuatro copias idénticas de la partícula 0 avanzada. La misma familia de fallo aparece sin transform feedback si configuras atributos sin ningún VAO enlazado: el divisor queda en el VAO por defecto y se «filtra» a otro dibujo que use esa location. Medido: un triángulo de pantalla completa con divisor 1 filtrado en su location 0 degeneró (sus tres vértices leyeron el mismo registro) y el centro del lienzo quedó sin pintar.</p>\n  <p><strong>Solución:</strong> un VAO por cada combinación de buffer y uso (la tabla de arriba), y los divisores fijados una vez en <code>iniciar</code>, cada uno en su VAO. Nunca cambies el divisor de un VAO sobre la marcha para reutilizarlo. Para comprobarlo: <code>gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_DIVISOR)</code> con el VAO enlazado. Y configura atributos siempre con tu VAO enlazado, nunca con el VAO por defecto.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-5-aditivo-invisible",
  "titulo": "Con un millón de partículas tenues no se ve nada (o 0,002 brilla el doble que 0,0019)",
  "html": "<p><strong>Síntoma:</strong> para que un millón de partículas no quemen la imagen a blanco, bajas la intensidad de cada una a algo como 0,001. El lienzo se queda completamente negro. Subes a 0,002 y de repente brilla muchísimo más de lo esperado; entre 0,002 y 0,005 apenas hay diferencia.</p>\n  <p><strong>Causa:</strong> el canvas guarda 8 bits por canal, y cada resultado de la mezcla se redondea a un múltiplo de 1/255 ≈ 0,0039. Una aportación menor que la mitad (0,00196) se redondea a 0 cada vez: mil partículas de 0,001 superpuestas siguen sumando 0 (medido). Por encima, cada aportación se convierte en 1/255, 2/255…: la intensidad real va a escalones, y 0,002 y 0,005 aportan lo mismo (medido: 100 sumas de cada una dieron 100/255).</p>\n  <p><strong>Solución:</strong> acumula en un FBO de 16 bits float (<code>RGBA16F</code>, renderizable con <code>EXT_color_buffer_float</code>; mezclar en 16 bits no necesita nada más) del tamaño del canvas, y después dibuja un triángulo de pantalla completa que lea esa textura y la lleve al canvas con una curva de tono como <code>1.0 - exp(-acumulado * exposicion)</code>, que nunca se recorta de golpe. Recuerda el techo del half float (una suma de aportaciones de 0,001 se estanca en 2,0): elige la exposición para que 2 ya sea casi blanco, o usa <code>RGBA32F</code>, que suma sin techo práctico (1000 × 0,001 dio 0,99999). Mezclar en 32 bits requiere la extensión <code>EXT_float_blend</code>; en el Chrome de pruebas funcionó sin error aunque solo habíamos pedido <code>EXT_color_buffer_float</code>, pero pídela también, explícitamente: no cuesta nada y deja escrita la dependencia. Es el ejercicio 7.5.4.</p>",
  "leccion": {
   "num": "7.5",
   "titulo": "Partículas en la GPU",
   "archivo": "modulos/07-integracion/05-particulas-gpu.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-6-hero-atrapa-scroll",
  "titulo": "En el móvil no hay forma de pasar del hero: el scroll no funciona",
  "html": "<p><strong>Síntoma:</strong> en el ordenador todo va bien, pero en un móvil el dedo sobre la portada no desplaza la página. Como el hero ocupa la pantalla entera, no hay ningún sitio donde apoyar el dedo para bajar: el usuario está atrapado.</p>\n  <p><strong>Causa:</strong> alguien puso <code>touch-action: none</code> en el hero (o en el canvas, de pantalla completa) para recibir todos los <code>pointermove</code> del dedo sin que el navegador los cancele, como se hace en un lienzo de dibujo (<a href=\"modulos/07-integracion/02-interaccion.html\">7.2</a>). Lo comprobamos simulando un gesto táctil de 500 px hacia arriba con el protocolo de depuración de Chrome sobre una sección de <code>100vh</code>: con <code>touch-action: auto</code> la página bajó 504 px (el puntero recibió <code>pointerdown</code>, <code>pointermove</code> y <code>pointercancel</code> al empezar el scroll); con <code>none</code>, 0 px, y el puntero recibió todo el arrastre hasta su <code>pointerup</code>; con <code>pan-y</code>, 500 px.</p>\n  <p><strong>Solución:</strong> en un fondo decorativo, deja <code>touch-action</code> por defecto y acepta que, con el dedo, el efecto dura hasta que el navegador decide que es un scroll (el <code>pointercancel</code> apaga el remolino, y <code>Motor.Puntero</code> lo trata como una salida). Si necesitas arrastres horizontales, <code>touch-action: pan-y</code> deja el scroll vertical al navegador. <code>none</code> solo en zonas pequeñas o en experiencias a pantalla completa con su propia forma de salir.</p>",
  "leccion": {
   "num": "7.6",
   "titulo": "Proyecto final: un hero interactivo",
   "archivo": "modulos/07-integracion/06-proyecto-final.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-6-texto-invisible",
  "titulo": "El texto del hero no aparece nunca (sin JavaScript, sin WebGL o con movimiento reducido)",
  "html": "<p><strong>Síntoma:</strong> en tu equipo el titular entra con su animación; en otro, el hero se queda con el fondo y sin texto. Pasa sin JavaScript (un bloqueador, un error en otro script), en un navegador sin WebGL2 o cuando el sistema pide menos movimiento.</p>\n  <p><strong>Causa:</strong> el estado inicial invisible de la entrada depende de algo que no siempre llega a ejecutarse. Tres variantes: (1) el CSS pone <code>opacity: 0</code> al texto «para que la animación lo revele», y sin JavaScript nadie lo revela; (2) las animaciones están en pausa y las mueve un bucle que muere con el canvas (el quiz de la sección de arquitectura); (3) el movimiento reducido pone la escala del reloj a 0 (<a href=\"modulos/07-integracion/02-interaccion.html\">7.2</a>), el tiempo se queda en 0 y la entrada, en su primer fotograma.</p>\n  <p><strong>Solución:</strong> el texto es visible por defecto y solo JavaScript lo oculta, creando las animaciones (con <code>fill: 'backwards'</code>) en el mismo script que las mueve; el bucle es de la página, no del canvas; y con movimiento reducido, las animaciones de entrada se colocan directamente en su final: <code>a.currentTime = FIN_ENTRADA</code>, con <code>FIN_ENTRADA</code> el mayor <code>effect.getComputedTiming().endTime</code>. En la versión final, las tres cosas.</p>",
  "leccion": {
   "num": "7.6",
   "titulo": "Proyecto final: un hero interactivo",
   "archivo": "modulos/07-integracion/06-proyecto-final.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-6-dpr-emulado",
  "titulo": "En la emulación de móvil el fondo sale borroso (y en el móvil de verdad no)",
  "html": "<p><strong>Síntoma:</strong> pruebas el hero con la emulación de dispositivo (DPR 2 o 3) y el fondo WebGL se ve mucho más borroso que el texto, como si tuviera un tercio de la resolución. En el móvil real se ve bien.</p>\n  <p><strong>Causa:</strong> el tamaño del búfer mezcla dos fuentes que, con la emulación, no cuentan lo mismo: los píxeles de dispositivo del <code>ResizeObserver</code> (<code>devicePixelContentBoxSize</code>, <a href=\"modulos/05-webgl/01-contexto.html\">5.1</a>) y <code>window.devicePixelRatio</code>, que se usa para aplicar el límite de DPR. Lo medimos con la emulación de Puppeteer (el comando <code>Emulation.setDeviceMetricsOverride</code> del protocolo de depuración, el mismo mecanismo en el que se apoya el modo dispositivo de DevTools, aunque no lo comprobamos en su interfaz): con <code>devicePixelRatio</code> 3, el observador devolvió 390 × 300 para un canvas de 390 × 300 px CSS, es decir, un píxel de dispositivo por píxel CSS. El límite de DPR dividía entonces por 3 algo que no estaba multiplicado por 3, y el hero pedía un búfer de 130 × 267 en lugar de 390 × 800 (con DPR 2 emulado, 720 × 450 en lugar de 1440 × 900). <code>M7.crearApp</code> de 7.1 hace la misma mezcla.</p>\n  <p><strong>Solución:</strong> que el límite y la medida salgan de la misma fuente. <code>motor.js</code> compara la proporción que mide el observador (<code>dispAncho / anchoCSS</code>) con <code>devicePixelRatio</code> y, si discrepan más de un 5 %, usa la caja CSS × <code>devicePixelRatio</code>; si coinciden (un dispositivo real, o el zoom del navegador), conserva los píxeles exactos del observador. Y en general: antes de dar por buena una cifra de rendimiento o de nitidez medida con emulación, compruébala en un dispositivo de verdad.</p>",
  "leccion": {
   "num": "7.6",
   "titulo": "Proyecto final: un hero interactivo",
   "archivo": "modulos/07-integracion/06-proyecto-final.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-6-destello-negro",
  "titulo": "Al cargar la página, el fondo aparece tras un instante en negro (o parpadea al recargar)",
  "html": "<p><strong>Síntoma:</strong> la página carga, el texto aparece y durante unas décimas de segundo el fondo es un rectángulo negro; después, de golpe, el shader. En recargas posteriores a veces no se nota y en la primera visita sí.</p>\n  <p><strong>Causa:</strong> un canvas con <code>alpha: false</code> se muestra opaco desde el principio, y su búfer, antes del primer dibujo, es negro. Lo medimos: el píxel de un canvas WebGL2 sin dibujar, sobre una página magenta, salió (0, 0, 0) con <code>alpha: false</code> y magenta (transparente) con <code>alpha: true</code>. El hueco dura lo que tarde el primer frame, y lo largo es compilar el shader: la primera vez que el navegador ve este código, compilarlo costó en el M1 entre 43 y 78 ms (lo medimos con variantes nuevas, cambiando una constante), hasta cinco frames; las siguientes, 2 o 3 ms, porque el resultado queda en caché (en nuestras pruebas, incluso con un perfil de Chrome nuevo, lo que apunta a una caché del propio sistema). Y, en la primera visita, lo que tarde en cargar el propio script.</p>\n  <p><strong>Solución:</strong> que el canvas no se vea hasta que tenga algo que enseñar. En el hero, el canvas empieza con <code>opacity: 0</code> y la capa llama a <code>alPrimerFrame</code> tras el primer dibujo con éxito, que le añade la clase <code>listo</code>: <code>opacity: 1</code> con una transición de 0,8 s. Debajo está siempre la alternativa CSS con los mismos colores, así que lo que se ve al cargar es un degradado que se convierte en flujo. Si el shader fuera muy grande, además, compílalo sin bloquear el hilo principal con <code>KHR_parallel_shader_compile</code> (<a href=\"modulos/07-integracion/01-arquitectura.html\">7.1</a>).</p>",
  "leccion": {
   "num": "7.6",
   "titulo": "Proyecto final: un hero interactivo",
   "archivo": "modulos/07-integracion/06-proyecto-final.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-version-duplicada",
  "titulo": "El shader que funcionaba en WebGL no compila en un ShaderMaterial («#version directive must occur before anything else»)",
  "html": "<p><strong>Síntoma:</strong> copias a un <code>ShaderMaterial</code> un shader que funciona en WebGL crudo o en los editores del curso, y el objeto no aparece. No hay excepción: la consola muestra <code>THREE.WebGLProgram: Shader Error</code> con <code>ERROR: 0:69: 'version' : #version directive must occur before anything else, except for comments and white space</code> y <code>ERROR: 0:70: 'position' : redefinition</code>, seguidos de <code>useProgram: program not valid</code> en cada frame.</p>\n  <p><strong>Causa:</strong> el prefijo. Three.js escribe su propio <code>#version 300 es</code> en la línea 1 y declara <code>position</code>, las matrices y la salida <code>pc_fragColor</code>; tu <code>#version</code> llega a la línea 69 del vertex shader y a la 57 del fragment, y tus declaraciones chocan con las suyas. Three.js no lanza nada: marca el programa como no ejecutable y deja de dibujar ese objeto. Lo comprobamos con r186; el texto exacto del error sale de ANGLE (<a href=\"modulos/06-glsl/01-lenguaje.html#la-primera-linea-version-300-es\">6.1</a>).</p>\n  <p><strong>Solución:</strong> en un <code>ShaderMaterial</code>, borra <code>#version</code>, <code>precision</code> y las declaraciones de <code>position</code>, <code>normal</code>, <code>uv</code> y de las matrices, y usa <code>gl_FragColor</code>; o añade <code>glslVersion: THREE.GLSL3</code> y declara tu propio <code>out vec4</code> (el prefijo deja entonces de definir <code>pc_fragColor</code>). Si quieres control total, <code>RawShaderMaterial</code> con <code>glslVersion: THREE.GLSL3</code>: tu texto va casi intacto y lo declaras todo tú. Ojo: un <code>RawShaderMaterial</code> sin <code>glslVersion</code> se compila como GLSL ES 1.00, y un <code>in</code> da <code>'in' : storage qualifier supported in GLSL ES 3.00 and above only</code> (medido).</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-onbeforerender-uniform",
  "titulo": "Cambio un uniform para cada objeto en onBeforeRender y todos salen con el valor del primero",
  "html": "<p><strong>Síntoma:</strong> varios objetos comparten un material; en el <code>onBeforeRender</code> de cada uno (el gancho que Three.js llama justo antes de dibujar un objeto) asignas un valor distinto a <code>material.uniforms.u_brillo.value</code>, y todos se dibujan con el valor que puso el primero.</p>\n  <p><strong>Causa:</strong> Three.js solo reenvía los uniforms del material cuando cambia el programa o cuando el objeto usa un material distinto del objeto anterior. Si el segundo objeto usa el mismo material, no se reenvían: el <code>uniform1f</code> nunca llega. Lo medimos con dos rectángulos que ponían 0,25 y 1,0: los dos salieron a 64 de 255, el valor del primero.</p>\n  <p><strong>Solución:</strong> marca <code>material.uniformsNeedUpdate = true</code> en ese <code>onBeforeRender</code> (medido: el segundo pasó a 255), usa un material por objeto (con <code>clone()</code>) o, mejor, saca el dato del uniform: un atributo por instancia en un <code>InstancedMesh</code> (<a href=\"modulos/05-webgl/09-instancing.html\">5.9</a>).</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-onbeforecompile-cache",
  "titulo": "Dos materiales con onBeforeCompile distinto se ven exactamente iguales",
  "html": "<p><strong>Síntoma:</strong> creas varios materiales con una función que genera su <code>onBeforeCompile</code> (por ejemplo, <code>crear('1.0, 0.0, 0.0')</code> y <code>crear('0.0, 0.0, 1.0')</code>, que meten un color distinto en el shader) y todos salen con el color del primero. <code>renderer.info.programs</code> dice que solo hay un programa.</p>\n  <p><strong>Causa:</strong> la caché de programas. Three.js reutiliza un programa si su clave coincide, y la clave de un material con <code>onBeforeCompile</code> incluye… <code>this.onBeforeCompile.toString()</code>, el <em>texto</em> de la función. Dos funciones creadas por la misma fábrica tienen el mismo texto aunque capturen valores distintos. El <code>onBeforeCompile</code> del segundo material <em>sí</em> se ejecuta y modifica su texto, pero después Three.js busca un programa con esa clave, encuentra el del primero y tira el texto modificado. Medido con r186: los dos rectángulos salieron rojos, se creó un solo programa y el <code>onBeforeCompile</code> se llamó dos veces, una por material.</p>\n  <p><strong>Solución:</strong> define <code>customProgramCacheKey</code> para que devuelva lo que distingue a cada material (<code>material.customProgramCacheKey = () => color;</code>). Con eso, medido: rojo y azul, dos programas. Mejor aún, si lo que cambia es un número, pásalo como uniform y comparte un solo programa.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-textura-oscura",
  "titulo": "En un ShaderMaterial, la textura sale más oscura (o, en un material de Three.js, más clara y lavada)",
  "html": "<p><strong>Síntoma:</strong> una imagen que en un <code>MeshBasicMaterial</code> se ve bien sale mucho más oscura y contrastada cuando la lees tú con <code>texture2D</code> en un <code>ShaderMaterial</code>. O al revés: una textura sin <code>colorSpace</code> se ve lavada y clara en un material de Three.js.</p>\n  <p><strong>Causa:</strong> la mitad de la gestión del color está en la textura y la otra mitad en el shader. Con <code>colorSpace = SRGBColorSpace</code>, la GPU decodifica al leer y tu shader recibe luz lineal (0,2159 para un gris 128), pero un <code>ShaderMaterial</code> no la vuelve a codificar: medido, 55 en lugar de 128. Sin <code>colorSpace</code>, un material de Three.js codifica valores que ya estaban codificados: 188.</p>\n  <p><strong>Solución:</strong> sé coherente en las dos mitades. Para imágenes de color: <code>texture.colorSpace = THREE.SRGBColorSpace</code> y, al final del <code>main</code> de tu <code>ShaderMaterial</code>, <code>#include &lt;colorspace_fragment&gt;</code> (o <code>gl_FragColor = linearToOutputTexel(gl_FragColor);</code>). Para datos (normales, alturas, ruido), deja la textura sin espacio de color. Y si tu efecto es un post-proceso sobre una imagen ya codificada, puedes trabajar en sRGB a propósito, pero sabiendo que lo haces.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-aspecto-sin-actualizar",
  "titulo": "Al redimensionar, la escena de Three.js sale estirada aunque cambié camera.aspect",
  "html": "<p><strong>Síntoma:</strong> redimensionas la ventana y todo se ve aplastado o alargado. El código hace <code>renderer.setSize(…)</code> y <code>camera.aspect = w / h</code>, y el valor de <code>aspect</code> es el correcto.</p>\n  <p><strong>Causa:</strong> <code>aspect</code>, <code>fov</code>, <code>near</code>, <code>far</code> y <code>zoom</code> son solo números; la matriz que llega al shader es <code>camera.projectionMatrix</code>, que únicamente se recalcula en <code>updateProjectionMatrix()</code>. Medido: tras <code>camera.aspect = 2</code>, el elemento [0] de la matriz seguía en 2,1445; tras <code>updateProjectionMatrix()</code>, pasó a 1,0723. Es el mismo cubo estirado de <a href=\"modulos/03-matematicas/06-espacios-coordenadas.html#m3-viewport-desfasado\">3.6</a> y <a href=\"modulos/05-webgl/06-3d-cubo.html\">5.6</a>, con un paso más donde olvidarse.</p>\n  <p><strong>Solución:</strong> <code>camera.updateProjectionMatrix()</code> justo después de cambiar cualquiera de esos parámetros, en el mismo sitio donde llamas a <code>setSize</code> (y solo cuando el tamaño cambió, al principio del frame).</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-culling-desplazado",
  "titulo": "La malla deformada, las partículas o las instancias desaparecen de golpe al mover la cámara",
  "html": "<p><strong>Síntoma:</strong> una malla cuyo vertex shader la desplaza (una ola, <a href=\"modulos/07-integracion/04-vertex-animacion.html#ondas-en-el-vertex-shader\">7.4</a>), unas partículas cuya posición sale de una textura (<a href=\"modulos/07-integracion/05-particulas-gpu.html#enfoque-2-el-estado-en-texturas-float\">7.5</a>) o un <code>InstancedMesh</code> cuyas instancias moviste se ven bien, pero al girar la cámara desaparecen de golpe, enteras, aunque deberían estar en pantalla.</p>\n  <p><strong>Causa:</strong> el frustum culling usa una esfera envolvente calculada en JavaScript: la de las posiciones originales del atributo, o la de las instancias en el momento del primer cálculo. Medido con r186: un plano desplazado 20 unidades en su vertex shader, con la cámara mirando a su posición final, dio <code>renderer.info.render.calls = 0</code>; con <code>frustumCulled = false</code>, 1 y el plano en pantalla. Y un <code>InstancedMesh</code> cuyas instancias movimos a x = 20 con <code>setMatrixAt</code> después del primer <code>render</code>: 0 draw calls, hasta llamar a <code>computeBoundingSphere()</code>.</p>\n  <p><strong>Solución:</strong> para lo que se mueve en el shader, <code>mesh.frustumCulled = false</code> o una <code>geometry.boundingSphere</code> ampliada a mano que cubra todo el recorrido. Para un <code>InstancedMesh</code>, llama a <code>computeBoundingSphere()</code> tras mover instancias (o desactiva el culling si se mueven en cada frame). La pista para diagnosticarlo es <code>renderer.info.render.calls</code>: si baja cuando el objeto debería verse, lo está descartando el culling.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-mod-wgsl",
  "titulo": "El patrón portado a WGSL se rompe en la mitad izquierda (o en la de abajo)",
  "html": "<p><strong>Síntoma:</strong> portas un patrón de bandas, un damero o una repetición (<a href=\"modulos/06-glsl/05-patrones.html\">6.5</a>) de GLSL a WGSL cambiando <code>mod(x, y)</code> por <code>x % y</code>. Compila y, en la mitad de la pantalla donde las coordenadas son positivas, se ve igual; en la otra mitad, las bandas cambian de anchura, el damero se desfasa o la repetición se refleja.</p>\n  <p><strong>Causa:</strong> no son la misma operación. El <code>mod</code> de GLSL es <code>x − y·floor(x/y)</code>, con el signo de <code>y</code>; el <code>%</code> de WGSL es <code>x − y·trunc(x/y)</code>, con el signo de <code>x</code>. Medido en la GPU de pruebas: <code>-0.5 % 2.0</code> dio −0,5 donde <code>mod</code> da 1,5; <code>-3.25 % 1.0</code>, −0,25 frente a 0,75; y con enteros, <code>-7 % 3</code> dio −1. Para <code>x ≥ 0</code> e <code>y &gt; 0</code> coinciden, y por eso el fallo solo aparece en media pantalla.</p>\n  <p><strong>Solución:</strong> define la versión de GLSL y úsala al portar: <code>fn modGLSL(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }</code> (y otra para <code>vec2f</code> si la necesitas; <code>floor</code> funciona componente a componente). Usa <code>%</code> solo cuando sepas que <code>x</code> no es negativo.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-struct-desalineado",
  "titulo": "Los uniforms de WebGPU llegan cambiados de sitio (o el bind group da «Binding size … is smaller than the minimum binding size»)",
  "html": "<p><strong>Síntoma:</strong> portas unos uniforms a un struct de WGSL y escribes sus valores seguidos en un <code>Float32Array</code>. El shader recibe números cruzados: el color en el tiempo, la mitad de un vector en otro. O, al crear el bind group, un error de validación: <code>Binding size (48) of [Buffer (unlabeled)] is smaller than the minimum binding size (64)</code>.</p>\n  <p><strong>Causa:</strong> la alineación. Un <code>vec3f</code> ocupa 12 bytes pero empieza en un múltiplo de 16, y el struct entero se redondea. Lo medimos rellenando un buffer con los números 0, 1, 2… (uno por cada 4 bytes) y pidiéndole a la GPU que devolviera lo que leía en <code>struct U { a: f32, b: vec3f, c: f32, d: vec2f, e: vec3f }</code>: <code>a</code> en el byte 0, <code>b</code> en el 16 (no en el 4: hay 12 bytes de hueco), <code>c</code> en el 28 (cabe justo detrás de <code>b</code>), <code>d</code> en el 32, <code>e</code> en el 48, y el struct mide 64 bytes, no los 52 de sumar los tamaños. Un buffer de 48 bytes era demasiado pequeño para él.</p>\n  <p><strong>Solución:</strong> calcula los offsets con las reglas (es el ejercicio 7.7.4) y escribe cada campo en su sitio: <code>datos[offset / 4] = valor</code>. Un truco habitual: ordena los campos de mayor a menor alineación (matrices y <code>vec4f</code>, después <code>vec3f</code> seguido de un <code>f32</code> que rellene su hueco, después <code>vec2f</code>, y por último los <code>f32</code>). Y crea el buffer con el tamaño del struct redondeado, nunca con la suma de los campos.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 },
 {
  "id": "m7-7-y-invertida-webgpu",
  "titulo": "El shader portado a WebGPU sale boca abajo (y el ratón, al revés)",
  "html": "<p><strong>Síntoma:</strong> un shader de Shadertoy o del curso, portado a WGSL con <code>@builtin(position)</code> en lugar de <code>gl_FragCoord</code>, se ve reflejado verticalmente: lo que estaba arriba sale abajo, y el efecto del puntero aparece a la altura contraria.</p>\n  <p><strong>Causa:</strong> el origen de <code>@builtin(position)</code> está arriba a la izquierda y su y crece hacia abajo; el de <code>gl_FragCoord</code>, abajo y hacia arriba. NDC es igual en las dos API, así que la geometría no se da la vuelta: solo lo que depende de la posición del píxel. Medido: en la fila superior de un destino de 4 × 4, <code>@builtin(position).y</code> valía 0,5.</p>\n  <p><strong>Solución:</strong> al principio del fragment shader, <code>let fc = vec2f(pos.x, resolucion.y - pos.y);</code> y usa <code>fc</code> donde el código original usaba <code>gl_FragCoord</code>; el puntero, en la convención de GL (origen abajo), como en 7.2. O, mejor, pasa unas UV desde el vertex shader (salen de NDC, que no cambia) y deja de depender de la posición del píxel.</p>",
  "leccion": {
   "num": "7.7",
   "titulo": "Siguientes pasos: Three.js y WebGPU con lo que ya sabes",
   "archivo": "modulos/07-integracion/07-siguientes-pasos.html"
  },
  "modulo": {
   "num": "7",
   "titulo": "JavaScript + shaders juntos"
  }
 }
];
