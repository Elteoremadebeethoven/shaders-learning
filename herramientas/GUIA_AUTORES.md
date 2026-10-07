# Guía para autores del curso «Shaders + Animación»

Esta guía es tu contrato. Léela entera antes de escribir una línea. El curso vive en
`/Users/alex/Projects/shaders` y es un sitio estático en español.

---

## 1. La misión (palabras del dueño del curso, resumidas)

> Un curso web de shaders y animaciones con JavaScript, **básico-intermedio**, con **muchos
> ejemplos resueltos y ejercicios para el estudiante**. El objetivo NO es volverse experto
> cubriendo todos los temas: es **entender al 100 % qué está sucediendo**, cada comando, cada
> comportamiento raro, **cada detalle que separa a un junior de un senior**, para que al pasar a
> conceptos avanzados las bases estén firmes e incluso pueda usar *hacks* porque conoce el
> sistema a la perfección. Entenderlo a nivel «hacker»: todas las particularidades.
> Incluye un curso básico de HTML/CSS/JS, solo lo elemental. Para la parte de GPU se pueden usar
> ejemplos en Python para explicar con exactitud qué son VBO, VAO, uniforms, etc. Para la parte
> matemática, ejemplos interactivos con shaders o JavaScript.

Traducido a reglas de escritura:

1. **Ninguna línea sin explicar.** Si un ejemplo usa `gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 16, 8)`,
   se explica cada argumento, qué estado toca, qué pasa si te equivocas. Si hoy no toca explicarlo
   a fondo, se dice explícitamente «lo veremos en la lección X» (con enlace).
2. **El porqué antes que el cómo.** Primero el problema y el modelo mental, después la API.
3. **Comportamientos raros como contenido de primera clase.** Cada vez que exista un síntoma
   desconcertante (pantalla negra, imagen volteada, borroso, parpadeo, NaN, velocidad distinta a 120 Hz…)
   va en una caja `bestiario` con síntoma → causa → solución. Si puedes, **provócalo en vivo** en un
   playground para que el alumno lo vea.
4. **Detalles de senior** en cajas `senior`: lo que la documentación da por sabido.
5. **Hacks** (caja `hack`): trucos que solo funcionan porque sabes cómo va la máquina.
6. **Todo interactivo cuando ayude.** Una fórmula sin demo se olvida. Deslizadores, puntos
   arrastrables, shaders editables.
7. **Verificado empíricamente.** Si afirmas un comportamiento de WebGL/Chrome/JS, compruébalo con
   un experimento en el Chrome headless (ver §7). No escribas nada «de memoria» que no hayas podido
   confirmar; si algo depende del navegador/GPU, dilo.
8. Básico-intermedio: no te pierdas en temas avanzados (PBR, sombras, compute, etc.). Profundidad en
   los fundamentos, no amplitud.

## 2. Tono y estilo

- Español neutro, tuteando («fíjate», «prueba a…»). Frases claras, sin relleno ni marketing.
- Cercano pero preciso. Nada de «simplemente» ni «obviamente».
- Términos técnicos en inglés cuando son el nombre real (buffer, draw call, fragment shader),
  explicados la primera vez. Nuestras variables/funciones en español (`tiempo`, `crearPrograma`);
  la API en inglés tal cual.
- Convenciones GLSL: `u_` uniforms, `a_` atributos, `v_` varyings. `u_time`, `u_resolution`, `u_mouse`.
- Tiempo en segundos, ángulos en radianes.
- Enlaza a lecciones anteriores cuando reutilices un concepto (`<a href="../03-matematicas/02-producto-punto-cruz.html">3.2</a>`),
  y anuncia lo que viene.
- Longitud: la que haga falta para cumplir la misión. Orientativo: 3 500–8 000 palabras por lección
  sin contar código. Mejor partir un tema en secciones claras que hacer un muro de texto.

## 3. Restricciones técnicas (OBLIGATORIAS)

- El curso debe funcionar **abriendo los HTML con `file://`** (doble clic) y también servido por http.
  Por tanto:
  - **Nada de `<script type="module">`, `import`, ni `fetch()` de archivos locales.**
  - **Nada de imágenes externas como texturas** (WebGL las rechaza en file://). Usa `Texturas.crear(nombre)`
    (canvas generados: `damero`, `uv`, `paisaje`, `ruido`, `letraF`, `ladrillos`, `degradado`, `texto`)
    o genera tus datos con código. Imágenes `<img>` decorativas (SVG/PNG locales) sí se pueden mostrar
    en el HTML, pero preferimos SVG inline.
  - **Nada de CDNs ni recursos de internet**: el curso funciona sin conexión. (Enlaces externos de
    referencia en el texto sí, p. ej. a MDN o a la especificación.)
- No modifiques los archivos compartidos (`assets/**`, `index.html`, `modulos/00-inicio/**`, otros módulos).
  Si necesitas algo nuevo, créalo dentro de tu módulo (`modulos/NN-xxx/recursos/*.js|.css`) y cárgalo
  desde tus lecciones. Si crees que un componente compartido tiene un bug o le falta algo importante,
  **anótalo en tu informe final** (no lo cambies tú).
- No toques `assets/js/manifest.js`. Los nombres de archivo y los ids de tus lecciones ya están fijados
  ahí; úsalos tal cual. Si quieres cambiar un título, dilo en el informe.
- Cada lección es un archivo HTML autónomo con la plantilla de §4.
- CSS propio: en un `<style>` en la lección o en `recursos/` de tu módulo, siempre con las variables
  del tema (`var(--text)`, `var(--accent)`, `var(--surface)`, `var(--border)`…) para que funcione en
  tema claro y oscuro. Nunca colores fijos para texto o fondos de la página.
- Los iframes de los playgrounds JS están aislados (`sandbox="allow-scripts"`, origen opaco):
  `localStorage` lanza excepción dentro de ellos, no hay `alert()`. No los uses en ejemplos.

## 4. Plantilla de lección

```html
<!doctype html>
<html lang="es" data-root="../../">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>5.2 · El primer triángulo, llamada por llamada — Shaders + Animación</title>
<script>try{document.documentElement.dataset.theme=JSON.parse(localStorage.getItem("curso-tema"))||"dark"}catch(e){document.documentElement.dataset.theme="dark"}</script>
<link rel="stylesheet" href="../../assets/vendor/vendor.bundle.css">
<link rel="stylesheet" href="../../assets/css/curso.css">
</head>
<body data-leccion="05-webgl/primer-triangulo">   <!-- idModulo/idLeccion del manifest -->
<main class="leccion">

<header class="leccion-cabecera">
  <p class="modulo">Módulo 5 · WebGL2 desde cero</p>
  <h1>El primer triángulo, llamada por llamada</h1>
  <p class="resumen">Una o dos frases que digan qué problema resuelve la lección.</p>
  <div class="meta"><span class="chip">⏱ 60 min</span><span class="chip">Requisitos: 5.1, 4.4</span></div>
  <div class="objetivos">
    <h4>Al terminar esta lección</h4>
    <ul><li>…</li><li>…</li></ul>
  </div>
</header>

<h2>…</h2>
…contenido…

<div class="callout resumen"><ul><li>…</li></ul></div>

</main>
<script src="../../assets/vendor/vendor.bundle.js"></script>
<script src="../../assets/js/manifest.js"></script>
<script src="../../assets/js/curso.js"></script>
<script src="../../assets/js/texturas.js"></script>
<script src="../../assets/js/glkit.js"></script>
<script src="../../assets/js/playground-glsl.js"></script>
<script src="../../assets/js/playground-js.js"></script>
<script src="../../assets/js/graficador.js"></script>
<script src="../../assets/js/widgets.js"></script>
<!-- aquí, tus scripts de demos: siempre dentro de Curso.alListo(() => { … }) -->
</body>
</html>
```

La barra lateral, el índice de la página, los botones anterior/siguiente y «marcar como completada»
los genera `curso.js` a partir del manifest: **no los escribas**.

**Lección de referencia**: `modulos/00-inicio/01-bienvenida.html` usa todos los componentes. Ábrela y
cópiale el marcado.

## 5. Componentes disponibles (API completa)

Lee la cabecera de comentarios de cada archivo en `assets/js/` para el detalle. Resumen:

### 5.1 Texto y estructura
- `<h2>` secciones (entran en el índice de la página), `<h3>` subsecciones. No uses `<h1>` salvo el título.
- Fórmulas KaTeX: `$…$` en línea, `$$…$$` en bloque (también `\(…\)` y `\[…\]`). En HTML escapa `<`
  como `&lt;` dentro de las fórmulas o usa `\lt`. KaTeX NO se procesa (a propósito) dentro de `.anotado`,
  `.demo-info`, `.playground`, `.graficador`, `pre`, `code` ni `.no-math`.
- Código en línea: `<code>…</code>`.
- Bloques de código estáticos (se resaltan solos). Dos formas:
  - `<pre><code class="language-glsl">…</code></pre>` → el contenido debe ir escapado (`&lt;`, `&amp;`).
  - **Preferida**, sin escapar: `<script type="text/plain" class="codigo" data-lang="html" data-titulo="index.html">…</script>`.
    Dentro de un `<script>` NO puede aparecer `</script>`: escribe `<\/script>` (se restaura solo).
  - Lenguajes: `glsl`, `js`, `html`, `css`, `json`, `python`/`py`, `bash`/`text` (sin color).
  - Atributos: `data-lineas` (numerar), `data-resaltar="3-5,9"` (resaltar líneas), `data-titulo`.
  - La indentación común se elimina sola: puedes indentar el código dentro del HTML.
- Tablas normales `<table>`.
- Diagramas: **SVG inline** con `class="diagrama"`, usando `currentColor` y las clases
  `.caja`, `.acento`, `.acento-relleno`, `.acento2`, `.tenue`, `.texto-tenue` (se adaptan al tema).
  Define `viewBox` y `width`. Los `<marker>` deben tener ids únicos en la página.

### 5.2 Cajas (callouts)
```html
<div class="callout nota">…</div>
<div class="callout cuidado">…</div>
<div class="callout senior" data-titulo="opcional">…</div>
<div class="callout hack">…</div>
<div class="callout porque">…</div>
<div class="callout resumen">…</div>
<div class="callout bestiario" data-id="m5-textura-negra" data-titulo="La textura sale negra">
  <p><strong>Síntoma:</strong> …</p>
  <p><strong>Causa:</strong> …</p>
  <p><strong>Solución:</strong> …</p>
</div>
```
El título y el icono se añaden solos. **Las cajas `bestiario` necesitan `data-id` único
(prefijo `mN-` con tu número de módulo) y `data-titulo`**: con ellas se genera automáticamente el
Bestiario del anexo, que enlaza a `tu-leccion.html#data-id`.

### 5.3 Ejemplos resueltos y ejercicios
```html
<section class="ejemplo">
  <h3>Ejemplo 5.2.1 — Título</h3>
  <p>Planteamiento…</p>
  … código / playground / explicación paso a paso …
</section>

<section class="ejercicio" data-nivel="2">       <!-- 1, 2 o 3 estrellas -->
  <h3>Ejercicio 5.2.3 — Título</h3>
  <p>Enunciado preciso: qué debe verse / imprimirse al terminar.</p>
  <div class="glsl-playground">…código de partida… + <script … data-solucion>…</script></div>
  <details class="pista"><summary>Pista 1</summary><p>…</p></details>
  <details class="solucion"><summary>Solución explicada</summary><p>…por qué funciona…</p></details>
</section>
```
Las etiquetas «Ejemplo resuelto» / «Ejercicio» y las estrellas se añaden solas.
`<details class="plegable"><summary>…</summary>…</details>` para ampliaciones opcionales.

### 5.4 Quiz
```html
<div class="quiz">
  <p class="pregunta">¿…?</p>
  <ul>
    <li>Opción incorrecta<div class="explicacion">Por qué no…</div></li>
    <li data-correcta>Opción correcta<div class="explicacion">Por qué sí…</div></li>
  </ul>
</div>
```
Cada opción, correcta o no, lleva su explicación: los distractores deben ser errores de concepto
reales, no opciones absurdas.

### 5.5 Código anotado (línea a línea)
```html
<div class="anotado" data-lang="js">
<script type="text/plain">
…código…
</script>
<ol>
  <li data-l="1">Explicación de la línea 1</li>
  <li data-l="3-5">Explicación de las líneas 3 a 5</li>
</ol>
</div>
```
Ideal para «cada comando explicado». Úsalo mucho.

### 5.6 Playground GLSL (fragment shader en vivo)
```html
<div class="glsl-playground" data-titulo="…" data-altura="360"
     data-uniforms='{"u_freq":{"tipo":"float","min":1,"max":20,"valor":5,"etiqueta":"frecuencia"}}'
     data-texturas="paisaje,uv:nearest:clamp:nomip">
<script type="x-shader/x-fragment">
#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;
void main() { … }
</script>
<script type="x-shader/x-fragment" data-solucion> … (opcional) </script>
</div>
```
- Uniforms automáticos (si los declaras): `float u_time`, `vec2 u_resolution` (px físicos), `vec2 u_mouse`
  (px, origen abajo-izquierda; si lo declaras `vec4`, `.z = 1.0` con el botón pulsado), `int u_frame`,
  `sampler2D u_tex0..u_tex3` (según `data-texturas`). Varying: `in vec2 v_uv;` (0..1).
- Tipos en `data-uniforms`: `float`, `int`, `bool`, `color` (→ `vec3`), `vec2`, `vec3`, `vec4`
  (min/max/valor pueden ser arrays por componente).
- Texturas: `nombre[:nearest][:clamp][:nomip][:tamaño]`. Por defecto LINEAR + mipmaps + REPEAT, 512 px,
  subidas con `UNPACK_FLIP_Y_WEBGL = true` (v = 0 abajo).
- Opciones: `data-apilado` (editor encima), `data-editor="oculto"` (botón «ver código») o `"no"`,
  `data-pausado`, `data-tiempo="1.5"`, `data-modo="shadertoy"` (mainImage/iTime/iResolution/iMouse/iChannel0-3),
  `data-error-esperado` (si el código de partida falla a propósito, p. ej. para enseñar un error).
- Sin `#version 300 es` en la primera línea se compila como GLSL ES 1.00 (útil para 6.10).
- El contexto es `alpha:false`: el alfa de `fragColor` se ignora (como en Shadertoy).
- Todos los playgrounds GLSL (y graficadores) comparten UN contexto WebGL2; la barra muestra el color
  exacto del píxel bajo el ratón. Si el compilador da avisos (warnings) aunque compile, se muestran en amarillo.
- Hallazgo del módulo 3: en ANGLE/Metal, usar isnan()/isinf() en cualquier parte del shader desactiva el
  «fast math» de todo el shader y cambia resultados de operaciones indefinidas (p. ej. pow con base negativa).
  PERO solo en la primera compilación de ese texto exacto: después Chrome lo saca de su caché de programas
  (en memoria y en disco, entre pestañas y visitas) compilado CON fast math (revisiones de 6.2–6.10, medido en
  el M1). Los playgrounds GLSL y el graficador añaden un comentario único a los shaders con isnan/isinf para
  que el experimento sea repetible; en WebGL crudo (playgrounds JS, GLKit) el efecto de caché sí aparece.
  La detección en sí no falla en la versión de la caché (medido en el M1, Chrome 154, sesión 4: `isnan` marca los
  NaN de `pow`/`sqrt`/`log` de negativos y de `normalize(vec3(0))`, también tras recargar, en otra pestaña y tras
  relanzar Chrome), así que una vista «NaN en magenta» sigue sirviendo; lo que cambia son los resultados de las
  operaciones indefinidas (`0.0/0.0` da 1 con fast math; `atan(0,0)`, NaN; `mod` de múltiplos negativos falla).
  Ojo al probar el efecto: `mod(-(id+1000.0)*7.0, 7.0)` sin nada en medio no falla nunca, porque el fast math lo
  simplifica algebraicamente; con un uniform de por medio (`if (isnan(u_z)) x += 1.0;`) sí se ve.
- Medir tiempos de GPU: en la GPU de teselas del M1, dibujar N veces seguidas sobre el mismo framebuffer y
  dividir NO mide el trabajo (el controlador se ahorra lo que el siguiente dibujo tapa). Método fiable: cada
  dibujo en su propia pasada (dos FBO alternos con clear al empezar), readPixels al final DEL FRAMEBUFFER DE LA
  ÚLTIMA PASADA (leer del canvas no espera a lo que solo se escribió en un FBO o en transform feedback), mediana
  de varias tandas (ver la caja senior «Cómo se mide lo que cuesta un shader» de 6.6). Medido en el M1 (Chrome
  154): 32 capas con `discard` dibujadas seguidas, 56 ms; una capa por pasada, 1,8 ms (31×). Dos trampas más:
  con un solo dibujo entre dos `readPixels` pesan el coste fijo de la pasada y la espera (~0,6 ms), y el método
  «de capacidad» (N dibujos por frame hasta que no caben en 16,7 ms) da costes un 40 % bajos si «cabe» se decide
  con la mediana de los intervalos: con 20–22 ms de GPU por frame, 2 de cada 3 frames siguen llegando a 16,7 ms
  (mediana 16,7, media 22). Hay que mirar la media.
- Medir tiempos de CPU (y de llamadas síncronas como `getError`): la CPU sale de reposo con el reloj bajo. En el
  M1 (Node, sin navegador, bucle ya compilado) bastan 0,2 s de reposo para que los primeros ~100 ms de cálculo vayan
  2–3× más lentos (rampa, no salto). Una medida de pocos ms tomada al pulsar «Ejecutar» lo recoge entero: el
  playground de 4.1 daba 1,7–3 s en vez de 0,9–1,2, y 1000 `getError` 60–78 ms en vez de 37. Calienta ≥ 0,15 s con
  trabajo de verdad y mide ventanas de decenas de ms (caja `m4-cpu-en-frio` de 4.1; labs `estado/lab/s4-lead-cpu-*`).
  No era cosa de headless: con la CPU caliente, headless, una pestaña e iframes sandbox dan lo mismo que Node.
  Dos más: (1) con el calentamiento bien hecho salen DOS valores (0,90 / 1,20 s en 4.1): el bucle medido con el
  código de TurboFan o aún con el de Maglev (`--js-flags=--no-maglev` → siempre 0,90; `--no-turbofan` → siempre
  1,20; lab `s4-lead-cpu-bimodal.mjs`). (2) Una pestaña OCULTA corre el JS 2,5–6× más lento (ventana minimizada
  2,4–3,0 s; el Chrome del dueño con la ventana detrás, 5,2 s; lab `s5-lead-oculta.mjs`): mide con la pestaña visible.
- fps en headless: la demo de 5.9 dentro de la lección marcaba 60 fps con 4 M de instancias (73 ms de GPU por frame);
  el mismo documento en una página vacía, 12 fps; con ventana, 13–14. Lo limitado por la GPU se mide con una espera
  explícita (`readPixels` al final del frame) o en un Chrome con ventana (`VENTANA=1`, labs `s4-lead-instancing.mjs`).

### 5.7 Playground JS (HTML + CSS + JS en iframe)
```html
<div class="js-playground" data-titulo="…" data-altura="340" data-incluir="glkit,texturas" data-fondo="oscuro">
<script type="text/x-html"> <canvas id="c"></canvas> </script>
<script type="text/x-css"> canvas{width:100%;height:100%;display:block} </script>
<script type="text/x-js"> … </script>
<script type="text/x-js" data-solucion> … (opcional; también text/x-html o text/x-css) </script>
</div>
```
- Se ejecuta al hacerse visible y con ▶ / Ctrl+Enter. No se re-ejecuta al teclear salvo `data-autorun`
  (solo para CSS/HTML sin bucles).
- `console.log/warn/error` aparecen en la consola bajo el resultado (formatea TypedArrays, objetos, -0…).
  Los errores muestran la línea del JS del alumno.
- `data-incluir`: `glkit` (expone `GLKit`, `mat4`, `vec3` — ver `assets/js/glkit.js`) y `texturas`
  (expone `Texturas.crear(nombre, tamaño)`).
- Otras opciones: `data-apilado`, `data-consola="no"`, `data-sin-editor`, `data-pestaña="css"`,
  `data-error-esperado`, `data-sin-resultado` (oculta el lienzo: ejercicios que solo imprimen en consola).
- La consola entiende `%s %d %f %o %c` (los estilos `%c` se descartan) y `console.table` (tabla de texto).
- Altura FIJA: el editor mide `data-altura` (con scroll propio) y no crece con el código. Para código
  largo usa `data-apilado` (el editor va encima, hasta ~420 px).
- `.ancho` en un bloque de primer nivel lo ensancha hasta el hueco disponible (útil en demos anchas).
- **Importante en el módulo 5**: en las primeras lecciones el alumno debe ver WebGL crudo (sin GLKit).
  GLKit se presenta como «la librería que acabamos de escribir» y se usa a partir de que cada pieza
  esté explicada.
- Si el iframe queda muy lejos de la pantalla se destruye (libera su contexto WebGL) y se re-ejecuta al volver.

### 5.8 Graficador de funciones (expresiones GLSL)
```html
<div class="graficador" data-x="-0.5,1.5" data-y="-0.25,1.25" data-titulo="…"
     data-uniforms='{"k":{"min":0,"max":4,"valor":1}}'>
<script type="text/x-exprs">
smoothstep(0.2, 0.8, x)
pow(x, k)
</script>
<script type="text/x-glsl"> float cuadrado(float v){ return v*v; } </script>  <!-- opcional -->
</div>
```
Variables: `x`, `t` (segundos). `data-fijo` para que no se pueda editar. Máximo 5 curvas.

### 5.9 Demos a medida (Canvas 2D) — `assets/js/widgets.js`
```html
<div class="demo" id="demo-vectores">
  <div class="demo-lienzo"></div>        <!-- 340px de alto por defecto -->
  <div class="demo-controles"></div>
  <div class="demo-info"></div>          <!-- texto monoespaciado para valores en vivo -->
</div>
<script>
Curso.alListo(() => {
  const raiz = document.getElementById("demo-vectores");
  const info = raiz.querySelector(".demo-info");
  const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
    x: [-5, 5],                                  // y se calcula con proporción 1:1
    puntos: { a: { x: 3, y: 1, etiqueta: "a", color: "acento" }, b: { x: 1, y: 2, etiqueta: "b", color: "acento2" } },
    dibujar(p, pts) {
      p.flecha([0, 0], pts.a, { color: "acento" });
      p.flecha([0, 0], pts.b, { color: "acento2" });
      info.textContent = "a·b = " + (pts.a.x * pts.b.x + pts.a.y * pts.b.y).toFixed(2);
    },
  });
  Curso.control(raiz.querySelector(".demo-controles"), { etiqueta: "k", min: 0, max: 2, valor: 1, alCambiar: (v) => pl.redibujar() });
});
</script>
```
- `Curso.plano`: métodos `p.flecha, p.linea, p.punto, p.circulo, p.arco, p.poligono, p.texto, p.funcion,
  p.parametrica, p.aPantalla, p.aMundo, p.escala`, `p.ctx` (contexto 2D crudo) y `p.colores`. Colores por nombre:
  `acento, acento2, rosa, amarillo, verde, azul, naranja, violeta, ok, aviso, error, texto, texto2, tenue,
  borde, fondo` o cualquier color CSS. Opciones: `x, y, puntos, animar, rejilla, ejes, numeros, paso, iman,
  restringir(nombre, punto, puntos), alCambiar(puntos)`.
- `Curso.lienzo2d(contenedor, { animar, dibujar(ctx, estado), alPulsar, alMover, alSoltar })` para
  canvas libres: el DPR ya está resuelto (dibujas en px CSS); `estado = {w, h, t, dt, frame, raton, colores}`;
  solo anima mientras es visible.
- Controles: `Curso.control(cont, {etiqueta, min, max, paso, valor, alCambiar, formato})`,
  `Curso.casilla(cont, {etiqueta, valor, alCambiar})`, `Curso.boton(cont, texto, fn, primario)`,
  `Curso.selector(cont, {etiqueta, opciones:[[valor, texto]…], valor, alCambiar})`.
- `Curso.colores()` devuelve la paleta actual; escucha `document.addEventListener("curso:tema", …)`
  para redibujar al cambiar el tema (plano y lienzo2d ya lo hacen).
- Para demos WebGL a medida en la página (fuera de playgrounds) puedes usar `GLKit`/`mat4` globales, pero
  recuerda el límite de ~16 contextos WebGL vivos por proceso (la página y sus iframes juntos; al pasarlo, Chrome
  pierde el que lleva más tiempo sin usarse, medido en 5.1): crea como mucho 2–3 contextos propios por lección
  y, si puedes, usa un playground o `Curso.glCompartido`.

## 6. Estructura mínima de cada lección

1. Cabecera (módulo, título, resumen, chips de tiempo/requisitos, objetivos).
2. Motivación: el problema real que resuelve la lección.
3. Desarrollo en secciones `<h2>`, con el modelo mental primero y los detalles después.
4. **Al menos 2 ejemplos resueltos** (`section.ejemplo`) explicados paso a paso.
5. **Al menos 3 ejercicios** (`section.ejercicio`) con dificultad graduada, pistas y solución explicada.
   Siempre que se pueda, con playground y `data-solucion`.
6. **Al menos 2 quizzes** repartidos por la lección (no todos al final).
7. Cajas `senior` y `bestiario` donde toque (en lecciones técnicas, varias de cada).
8. Un `callout resumen` al final con las ideas clave.
9. Opcional: «Para profundizar» con 2–4 enlaces externos de calidad (MDN, especificación, artículos clásicos).

## 7. Verificación (OBLIGATORIA antes de terminar)

Herramienta: Chrome headless con GPU real (Apple M1 vía Metal).

**COMO MUCHO DOS PROCESOS PESADOS A LA VEZ, Y CON PERMISO (pedido del dueño: el MacBook Air no tiene
ventilador y se calienta).** Pesado = todo Chrome headless (verificar.mjs, movil.mjs, scripts con puppeteer),
los laboratorios de tiempos de GPU, Python que dibuja con OpenGL, o una CPU al 100 % más de ~1 min.
- El permiso se pide al portero `herramientas/turnos.mjs`, que concede como mucho 2 turnos a la vez y anota cada
  petición (PIDE → CONCEDE → LIBERA) en `herramientas/.turnos.log`:
  `node herramientas/turnos.mjs --agente <id> --motivo "verificar 5.2" -- node verificar.mjs …`.
  Las medidas de tiempos de GPU, con `--exclusivo` (los dos turnos: nadie más usa la GPU mientras se mide).
  El comando se corta a los 12 min (`--max-min` hasta 25). `node herramientas/turnos.mjs --estado` dice quién los tiene.
- El `puppeteer-core` de `herramientas/node_modules` está parcheado (`estado/PuppeteerNode.parcheado.js`):
  cada `launch()` pasa por el mismo portero (dentro de un comando lanzado con turnos.mjs no vuelve a pedir turno)
  y, sin turnos.mjs, cada sesión de Chrome se cierra sola a los 8 minutos. «esperando turno» es normal: espera.
- Lanza Chrome SOLO a través de ese puppeteer-core (verificar.mjs, movil.mjs o scripts tuyos que lo
  importen). Nunca ejecutes el binario de Chrome directamente, ni instales otro puppeteer/playwright,
  ni uses las herramientas de navegador de la extensión (son el Chrome personal del dueño).
- Un vigilante (`herramientas/vigilante.sh`) termina cualquier Chrome headless de más (más de 2).
- Cierra siempre el navegador (`await browser.close()`) y no dejes procesos en segundo plano.
- Agrupa: verifica varias cosas en una misma ejecución en vez de lanzar muchas seguidas (3–4 lecciones por
  llamada a verificar.mjs como mucho).

```bash
Q=/Users/alex/Projects/shaders/herramientas
node $Q/verificar.mjs /Users/alex/Projects/shaders/modulos/05-webgl/02-primer-triangulo.html \
     --capturas <SCRATCHPAD>/capturas/m5 --pagina <SCRATCHPAD>/capturas/m5-paginas
```
- Informa: errores de compilación de cada playground, excepciones JS (en la página y en los iframes),
  errores de consola, fórmulas KaTeX rotas, `$` sin renderizar, enlaces internos rotos, conteo de
  componentes (ejemplos, ejercicios, quizzes, callouts, palabras).
- `--capturas <dir>` guarda un PNG de cada playground/demo/graficador; `--pagina <dir>` guarda la página
  en tramos de ventana. **Mira las capturas con la herramienta Read** para comprobar que se ve lo que el
  texto dice que se ve (colores, orientación, animación visible, nada cortado, legible en el tema).
- Prueba también con `--tema light` al menos una vez por lección con demos a medida.
- `--soluciones` pulsa «Ver solución» en cada playground que la tenga y comprueba que compila / se
  ejecuta sin error (úsalo siempre antes de dar una lección por terminada). Si la solución imprime pruebas
  (líneas que empiezan por ✓/✗), espera a que terminen (máx. `--espera-sol 12000` ms) y cuenta como problema
  cualquier «✗ …»: las pruebas de los ejercicios deben imprimir ✓/✗ al principio de la línea. Para saber
  cuándo han terminado, cuenta en el código de la solución un mínimo de líneas ✓/✗ (cada línea de código que
  las imprime; si es una función auxiliar como `function prueba(nombre, ok) { … '✓' … }`, cada llamada) y,
  alcanzado ese mínimo, espera 1,5 s sin líneas nuevas. Una prueba que tarda más de 12 s en imprimir no se ve.
- Las capturas son de la parte visible del componente (`page.screenshot` con `clip`, sin
  `captureBeyondViewport`, que dormía los playgrounds JS y daba capturas negras); uno más alto que la
  ventana sale recortado. `data-error-esperado="webgpu"`: el error solo se exige si hay adaptador WebGPU.
- OJO con medir iframes: en Chrome de escritorio real los iframes sandbox (el resultado de los playgrounds
  JS) corren en OTRO proceso (un bucle ocupado dentro no bloquea la página; comprobado en el Chrome del
  dueño). Puppeteer, por defecto, los mete en el mismo proceso que la página. Para medir tiempos o bloqueos
  de iframes usa `--aislar` (o `--enable-features=IsolateSandboxedIframes` en tu script), pero ten en
  cuenta que en headless con aislamiento `elementFromPoint` dentro del iframe devuelve null.
- Las cajas `bestiario` se copian al anexo A.1: escribe los enlaces internos normalmente (relativos a tu
  lección); el indexador los reescribe para que funcionen desde el anexo.
- Los enlaces a lecciones de otros módulos que aún no existan saldrán como «enlace roto»: es normal
  mientras se escriben en paralelo. Revisa que los tuyos (dentro de tu módulo) estén bien.
- Para comprobar afirmaciones técnicas, escribe páginas de experimento en tu carpeta del scratchpad
  (`.../scratchpad/experimentos/mN/`) y ábrelas con `verificar.mjs` o con un script de puppeteer propio
  (impórtalo con ruta absoluta:
  `import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js"`,
  y lánzalo con turnos.mjs; con
  `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`,
  `args: ["--use-angle=metal","--enable-gpu","--ignore-gpu-blocklist"]`, `headless: "new"`).
- La lección está terminada cuando `verificar.mjs` no da problemas (salvo enlaces a módulos futuros) y
  las capturas se ven bien.

## 8. Informe final (lo que devuelves al terminar)

Breve y estructurado:
1. Archivos creados (rutas).
2. Por lección: 2–3 líneas de lo que cubre + conteo (ejemplos/ejercicios/quizzes/bestiario).
3. Lista de `data-id` de bestiario creados.
4. Resultado de la verificación (pega el resumen de `verificar.mjs`).
5. Problemas conocidos o cosas que no pudiste comprobar.
6. Sugerencias para componentes compartidos (bugs encontrados, mejoras) — sin haberlos modificado.
7. Términos para el glosario (término → definición de una línea) que hayas introducido.
