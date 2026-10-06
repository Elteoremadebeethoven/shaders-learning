## Informe: anexo A.4 · Glosario

### 1. Archivos

- `modulos/08-anexos/04-glosario.html` (`data-leccion="08-anexos/glosario"`): 576 entradas en HTML estático, dentro de `<dl class="ax-glosario">`. Cada entrada es un `<div class="ax-entrada" id="g-…">` con `<dt>` y `<dd>`. Así la encuentran el buscador del curso (indexa el HTML) y Ctrl+F.
- `modulos/08-anexos/recursos/glosario.js` (3,5 KB): el filtro en vivo, que solo oculta y muestra entradas que ya están en el DOM.
- No he tocado `anexos.css` ni `anexos.js`. Reutilizo sus clases `.ax-buscador`, `.ax-letras`, `.ax-entrada`, `.ax-lec`, `.ax-oculto`… Lo poco que faltaba va en un `<style>` de la propia página: un texto oculto para lectores de pantalla, el estilo de las letras y el de las remisiones.
- El HTML se generó con un script que ordena, agrupa por letra y valida los enlaces. El script está en `<scratchpad>/experimentos/glosario/`: `g1–g5.mjs` son los datos, `gen.mjs` el generador y `plantilla.html` la plantilla. Ese directorio es temporal: **la fuente de verdad es el HTML** y se puede editar a mano.

### 2. Cifras

- **482 términos** con definición y **94 remisiones** («fotograma → frame», «z-buffer → búfer de profundidad», «clip space → espacio de clip», nombres en inglés, siglas y nombres de la API). La Ñ queda vacía; el resto de letras, de la A a la Z, tienen entradas.
- La página tiene unas 23 700 palabras y 1 155 enlaces internos. `herramientas/enlaces.mjs` da 0 rotos.
- Anclas comprobadas en Chrome: 500 anclas `#sección` en 53 archivos, todas presentes en las páginas ya montadas por `curso.js`. No hay ningún enlace a 7.3–7.7.
- Cada definición tiene de 1 a 3 frases, usa la notación del curso y cita las cifras medidas tal como las dan las lecciones (Apple M1, Chrome, ANGLE/Metal).
- Cada entrada enlaza a 1–3 lecciones. La primera etiqueta es la lección principal; su `title` muestra «N.N · lección › sección (explicación principal)». Solo va una etiqueta por lección.

### 3. Cómo funciona la página

- En la cabecera, la plantilla de §4. Después vienen dos secciones: «Cómo leer las entradas» (formato, remisiones, orden, notación y qué hay en A.1/A.2/A.3) y «Términos de la A a la Z».
- El buscador es fijo (sticky), como el del bestiario. Tiene el filtro, el recuento («15 de 482 términos») y el índice de letras.
  - Filtro: quedan las entradas que contienen todas las palabras, sin tildes ni mayúsculas. Busca en el término, el nombre en inglés y la definición.
  - Las letras sin resultados se ocultan en el cuerpo y se atenúan en el índice.
  - `Esc` vacía el filtro y `?q=palabras` en la URL lo rellena al abrir. Sirve para enlazar desde una lección, p. ej. `04-glosario.html?q=varying`.
  - Si pulsas un enlace a una entrada que el filtro tiene oculta, el filtro se vacía antes de saltar.
  - Si no queda ninguna entrada, sale un aviso que remite al buscador del curso.
- Letras: cada una es un `<h2 id="letra-x">` dentro de `.no-toc`, así que no llenan el índice lateral, que queda con 3 entradas. El `h2` lleva un texto oculto, «Glosario, letra X». Lo comprobé con una ejecución de prueba de `indexar.mjs` escribiendo en el scratchpad: el buscador del curso muestra «Glosario, letra V» y lleva a `#letra-v`. Buscar «vbo» encuentra A.4 y «Glosario, letra V».
- Hay un `<!-- M7-PENDIENTE -->` general al principio del cuerpo con las instrucciones para insertar entradas. Además hay 8 marcas `M7-PENDIENTE` dentro de las entradas que deberán enlazar también a 7.x:
  - transform feedback → 7.5, WebGPU → 7.7;
  - easing y muelle amortiguado → 7.3;
  - vertex shader → 7.4;
  - sistema de partículas, ping-pong e instancing → 7.5.

### 4. Verificación

- `verificar.mjs --soluciones --capturas … --pagina …`, tema oscuro: **1/1 sin problemas** (78 capturas de página revisadas por muestreo).
- `verificar.mjs --soluciones --tema light --capturas …`: **1/1 sin problemas**.
- `movil.mjs`: ✓ `scrollWidth = 390 / 390`, sin scroll horizontal. Los «culpables» que lista son el MathML oculto de KaTeX (`.katex-mathml`, recortado con `clip`), no contenido visible.
- Script propio (`<scratchpad>/qa/glosario-qa.mjs`, un solo Chrome):
  - Anclas de las lecciones enlazadas: 0 faltan. Para no calentar la GPU, las páginas se cargaron con los scripts de playgrounds, widgets y graficadores bloqueados; `curso.js` sí se ejecuta, porque es quien asigna los id.
  - 0 errores de KaTeX, 0 `$` sin renderizar, 0 id duplicados, 0 enlaces `#` internos rotos y ningún error de consola, en oscuro, en claro y a 390 px.
  - Filtro: «varying» deja 15 términos, «alfa premultiplicado» 2 (más 1 remisión), «profundidad» por URL 17, una búsqueda imposible 0 con el aviso visible, y `Esc` devuelve los 482.
  - Saltos a letras y a entradas: el destino queda por debajo del buscador fijo (destino en y = 222 px, borde inferior del buscador en y = 180 px, a 1440 px de ancho).
  - Enlace cruzado con el filtro puesto («varying» → clic en «funciones de arista», que el filtro ocultaba): el filtro se vacía y la página salta a la entrada.
  - Capturas `qa-*.png` en oscuro y claro a 1440 px, y a 390 px, en `<scratchpad>/capturas/glosario/`.

### 5. Decisiones discutibles

1. **Muchos más términos de los 150–250 orientativos (482).** Criterio: todo término que el curso define o usa con un significado técnico propio, en los dos mundos (navegador y GPU). También nombres de la API que son conceptos por sí mismos (`preserveDrawingBuffer`, `UNPACK_FLIP_Y_WEBGL`, `gl_FragCoord`…). El catálogo función a función se deja a A.2 y A.3, que se enlazan desde la introducción. Si parece demasiado, lo más prescindible es lo de HTML/CSS/JS básico (`data-*`, `box-sizing`, `flexbox`, `truthy/falsy`…).
2. **Entrada principal según el uso del curso** (lo medí contando apariciones en el texto de las lecciones):
   - «frame» (821) antes que «fotograma» (81);
   - «draw call» y «blending» en inglés;
   - «atributo», «búfer de profundidad» y «alfa premultiplicado» en español;
   - «espacio de clip» / «clip space» están empatados (23 frente a 21): elegí el español.
3. **Orden.** Alfabético español con `Intl.Collator("es")`, ignorando los signos del código (`@property` en la P, `#version 300 es` en la V, `gl_FragCoord` en la G). Las letras griegas se ordenan por su nombre: ω₀ en la O y ζ en la Z. Lo explica la introducción.
4. **Términos con dos significados.** Van en una entrada con los dos sentidos o en dos entradas:
   - «aliasing»: muestreo en gráficos (6.x) y dos referencias a la misma memoria (1.3, 1.6);
   - «enlazar»: bind (4.1) y link (5.2);
   - «quad»: bloque de 2 × 2 fragmentos (6.2/6.3) y rectángulo de dos triángulos (6.2);
   - «ping-pong»: texturas (5.8) y onda triangular (6.5/6.7);
   - «alfa»: canal (5.7) y fracción del paso fijo (2.3).
5. **Posición tras un salto.** Dejé el `scroll-margin-top: 150px` de `anexos.css`, que junto con el `scroll-padding-top: 72px` de `curso.css` pone el destino 42 px por debajo del buscador fijo a 1440 px. Probé un valor mayor en la página y lo quité: el destino quedaba demasiado bajo.
6. **Tamaño del archivo: ~385 KB**, sobre todo por los `title` de las etiquetas de lección. Carga y filtra sin problema con file://.

### 6. Discrepancias encontradas (entre lecciones o con los informes)

Ninguna contradicción técnica entre lecciones. Contrasté las cifras que se repiten en varias lecciones (16 contextos, 4 ms de `setTimeout` anidado, `gl_PointSize` ≤ 511, 2²⁴, 50 ms de tarea larga, 21,6 % de sRGB…) y coinciden. Anoto matices:

- **6.4, dithering.** El texto dice «un número aleatorio del tamaño de un nivel»; el resumen y el ejercicio dicen «ruido de medio nivel». No es contradictorio si se lee como rango de 1 nivel = amplitud de ±½ nivel, pero es ambiguo. El glosario dice «del tamaño de un nivel (±medio nivel)». Sugiero unificar en 6.4.
- **informe-m6a frente a 6.4, sRGB.** El informe dice que 0,5 codificado es «un 21 % de la luz». La lección precisa que 128 (0,502) emite el 21,6 % y que 0,5 exacto decodifica a 0,214. El glosario sigue a la lección.
- **informe-m4, «PSO».** Ninguna lección menciona el PSO. El concepto está en 4.1 como «compilación del pipeline», así que no hay entrada PSO; está la de «precalentar». Los términos del informe «framebuffer Retina» y «swap interval» se integran en DPR y GLFW.
- **4.5, título «Calificadores: smooth, flat y noperspective».** `noperspective` no existe en GLSL ES 3.00; el texto lo aclara (solo con `NV_shader_noperspective_interpolation`). La entrada del glosario se titula «smooth, flat y centroid» y lo advierte.
- **Guía de autores frente a 5.1.** La guía dice «~16 contextos WebGL por página»; 5.1 midió que son por proceso (página e iframes juntos) y que se pierde el que lleva más tiempo sin usarse, no el primero creado. El glosario sigue a 5.1.

### 7. Términos sin un sitio claro donde enlazar

- **WebGPU.** Solo aparece de paso en 3.6 (rango de z de las NDC), 4.1 (APIs sin máquina de estados) y 5.1. Enlazado ahí, con M7-PENDIENTE hacia 7.7.
- **Three.js.** Solo se nombra de pasada en 2.6, 3.5 y 7.1 y ninguna lección escrita lo define: no hay entrada. Pendiente de 7.7.
- **Transform feedback.** Solo un párrafo en 5.9, en la sección «Una matriz por instancia»; la explicación de verdad será 7.5.
- **Cuaternión, UBO y HDR.** Se mencionan sin sección propia («fuera del curso» o «no lo necesitaremos»). Enlazan a donde se mencionan: 3.5/3.6, 4.5/5.4 y 6.4/5.8.
- **Spector.js.** Solo 1.7 (adelanto). En 5.10 no aparece.
- **Módulo 7 (7.3–7.7).** Al terminar, los archivos ya existían en disco pero se estaban escribiendo (se modificaron durante mi trabajo). No los he recorrido: sus términos los añade el lead donde marca `M7-PENDIENTE`.

### 8. Sugerencias (no he modificado nada compartido)

- **Ejecutar `node herramientas/indexar.mjs`.** No lo he hecho porque escribe en `assets/js/`. En la ejecución de prueba, el glosario aporta 30 entradas al índice: la página, las 3 secciones y las 26 letras.
- **`indexar.mjs` no quita los comentarios HTML** antes de extraer las palabras. Un comentario que contenga `>` deja fragmentos en el índice de búsqueda. Mi comentario M7 ya no tiene `>` por dentro, pero conviene añadir `.replace(/<!--[\s\S]*?-->/g, " ")` en `palabras()` y `sinEtiquetas()`, como ya hace `enlaces.mjs`.
- **Enlazar desde las lecciones.** Podrían enlazar un término a su entrada la primera vez que aparece (`../08-anexos/04-glosario.html#g-varying`) o a una búsqueda (`…04-glosario.html?q=varying`). Los id `g-…` son estables.
