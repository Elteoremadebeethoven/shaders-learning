# Shaders + Animación

Curso web (en español) de shaders y animación con JavaScript, de nivel básico-intermedio. Su objetivo es **entender al 100 % qué está pasando**: cada llamada, cada línea de GLSL, cada comportamiento raro.

## Cómo abrirlo

- **Doble clic en `index.html`.** El curso funciona con `file://`, sin internet y sin instalar nada.
- O con un servidor local (recomendado para tus propios proyectos):

  ```bash
  python3 -m http.server 8000
  # abre http://localhost:8000
  ```

Navegador recomendado: Chrome, Edge o Firefox recientes (hace falta WebGL2).

## Contenido

| Módulo | Tema |
|---|---|
| 0 | Bienvenida: cómo usar el curso y el mapa mental |
| 1 | Fundamentos web mínimos: HTML, CSS, JS, event loop, datos binarios, herramientas |
| 2 | Animación con CSS y JavaScript: pipeline de render, rAF, easing, muelles, Canvas 2D, WAAPI/FLIP |
| 3 | Matemáticas para gráficos: vectores, producto punto/cruz, trigonometría, funciones de forma, matrices, espacios, precisión |
| 4 | La GPU por dentro: pipeline, una GPU de juguete en Python, VBO/VAO/EBO, uniforms/varyings, OpenGL desde Python |
| 5 | WebGL2 desde cero: contexto, buffers, uniforms, texturas, 3D, blending, framebuffers, instancing, depuración |
| 6 | GLSL y fragment shaders: lenguaje, SDF, color, patrones, ruido, animación, efectos, raymarching, Shadertoy |
| 7 | JavaScript + shaders juntos: arquitectura, interacción, transiciones, vértices animados, partículas en GPU, proyecto final |
| A | Anexos: bestiario de comportamientos raros, chuletas de GLSL y WebGL2, glosario, recursos |

Cada lección trae ejemplos resueltos, ejercicios con pistas y solución, quizzes y editores en vivo (shaders GLSL y HTML/CSS/JS). Tus cambios en los editores se guardan en el navegador; el botón **Restaurar** vuelve al original.

## Estructura de carpetas

```
index.html                portada
modulos/NN-tema/*.html    lecciones
assets/css/curso.css      estilos (tema claro/oscuro)
assets/js/                núcleo del curso y componentes:
  manifest.js               estructura del curso (orden de módulos y lecciones)
  curso.js                  navegación, progreso, resaltado, callouts, quizzes, fórmulas
  playground-glsl.js        editor de fragment shaders en vivo
  playground-js.js          editor HTML/CSS/JS en iframe aislado
  graficador.js             graficador de funciones escritas en GLSL
  widgets.js                demos interactivas (plano cartesiano, lienzo 2D, controles)
  glkit.js                  mini-librería WebGL2 que se construye en el módulo 5
  texturas.js               texturas generadas por código (funcionan con file://)
assets/vendor/            CodeMirror 5 y KaTeX (copias locales, sin CDN)
python/                   ejemplos en Python del módulo 4 (ver python/README.md)
herramientas/             scripts de mantenimiento
```

## Mantenimiento

- `node herramientas/indexar.mjs` regenera el índice del buscador (`assets/js/indice-busqueda.js`) y los datos del Bestiario (`assets/js/datos-bestiario.js`). Ejecútalo después de editar lecciones.
