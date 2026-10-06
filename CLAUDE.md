# Curso «Shaders + Animación»

Curso web estático en español (básico-intermedio) sobre shaders (WebGL2/GLSL ES 3.00) y animación con JavaScript. Objetivo del dueño: entender al 100 % qué pasa —cada llamada, cada comportamiento raro, cada detalle junior/senior— a nivel «hacker».

## Reglas técnicas (no negociables)
- Debe funcionar con `file://` (doble clic en `index.html`) y sin internet: nada de `type="module"`, `import`, `fetch()` de archivos locales, CDNs ni imágenes externas como texturas (usar `Texturas.crear(nombre)`).
- Estructura del curso en `assets/js/manifest.js` (orden de módulos y lecciones; anterior/siguiente se calculan de ahí).
- Componentes compartidos en `assets/js/`: `curso.js` (núcleo), `playground-glsl.js`, `playground-js.js`, `graficador.js`, `widgets.js`, `glkit.js`, `texturas.js`. Estilos en `assets/css/curso.css` (variables de tema claro/oscuro). Librerías de terceros vendorizadas en `assets/vendor/` (CodeMirror 5, KaTeX) y empaquetadas en `vendor.bundle.*`.
- Cada lección es un HTML autónomo con la plantilla y los componentes descritos en `herramientas/GUIA_AUTORES.md` (la lección de referencia que usa todos los componentes es `modulos/00-inicio/01-bienvenida.html`).
- Cajas `.callout.bestiario` con `data-id` único (prefijo `mN-`) y `data-titulo`: alimentan el anexo A.1.

## Mantenimiento
- Tras editar lecciones: `node herramientas/indexar.mjs` (regenera `assets/js/indice-busqueda.js` y `assets/js/datos-bestiario.js`).
- Verificar: `cd herramientas && npm install` (una vez) y `node verificar.mjs ../modulos/NN-x/archivo.html --soluciones --capturas /tmp/capturas`. Usa el Chrome instalado con GPU real (ANGLE/Metal). Informa errores de compilación de shaders, excepciones de los playgrounds, KaTeX roto, enlaces internos rotos y soluciones que fallan.
- Afirmaciones técnicas: comprobarlas con experimentos en Chrome headless; las cifras medidas dicen en qué hardware (Apple M1, Chrome, ANGLE/Metal).
- Python del módulo 4 en `python/` (entorno en `python/.venv`, ver `python/README.md`).
