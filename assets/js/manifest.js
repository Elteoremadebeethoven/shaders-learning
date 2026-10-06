/* Estructura del curso: módulos y lecciones.
   `archivo` es relativo a la raíz del curso. El orden de este array ES el
   orden del curso (anterior / siguiente se calculan a partir de él). */
window.CURSO_MANIFEST = {
  titulo: "Shaders + Animación",
  subtitulo: "Entender la GPU, GLSL y la animación en JavaScript a nivel hacker",
  modulos: [
    {
      id: "00-inicio", num: "0", titulo: "Bienvenida",
      resumen: "Cómo funciona este curso, qué vas a construir y el mapa mental que usaremos de principio a fin.",
      lecciones: [
        { id: "bienvenida", num: "0.1", titulo: "Cómo usar este curso", archivo: "modulos/00-inicio/01-bienvenida.html" },
      ],
    },
    {
      id: "01-web", num: "1", titulo: "Fundamentos web mínimos",
      resumen: "Solo lo elemental de HTML, CSS y JavaScript, pero contado desde dentro: lo que de verdad necesitas para animar y para hablar con la GPU.",
      lecciones: [
        { id: "html", num: "1.1", titulo: "HTML y el DOM", archivo: "modulos/01-web/01-html.html" },
        { id: "css", num: "1.2", titulo: "CSS esencial: caja, posición y transformaciones", archivo: "modulos/01-web/02-css.html" },
        { id: "js-lenguaje", num: "1.3", titulo: "JavaScript I: el lenguaje", archivo: "modulos/01-web/03-js-lenguaje.html" },
        { id: "js-dom-eventos", num: "1.4", titulo: "JavaScript II: DOM, eventos y coordenadas", archivo: "modulos/01-web/04-js-dom-eventos.html" },
        { id: "event-loop", num: "1.5", titulo: "El event loop y el frame", archivo: "modulos/01-web/05-event-loop.html" },
        { id: "binario", num: "1.6", titulo: "Datos binarios: ArrayBuffer y TypedArrays", archivo: "modulos/01-web/06-binario.html" },
        { id: "herramientas", num: "1.7", titulo: "Herramientas: DevTools, servidor local y file://", archivo: "modulos/01-web/07-herramientas.html" },
      ],
    },
    {
      id: "02-animacion", num: "2", titulo: "Animación con CSS y JavaScript",
      resumen: "Cómo pinta el navegador un frame, el bucle de animación, el tiempo, el easing, la física de muelles y Canvas 2D.",
      lecciones: [
        { id: "pipeline-render", num: "2.1", titulo: "Cómo pinta el navegador un frame", archivo: "modulos/02-animacion/01-pipeline-render.html" },
        { id: "css-transiciones", num: "2.2", titulo: "Transiciones y keyframes CSS", archivo: "modulos/02-animacion/02-css-transiciones.html" },
        { id: "raf", num: "2.3", titulo: "requestAnimationFrame y el tiempo", archivo: "modulos/02-animacion/03-raf.html" },
        { id: "interpolacion-easing", num: "2.4", titulo: "Interpolación y easing", archivo: "modulos/02-animacion/04-interpolacion-easing.html" },
        { id: "fisica-muelles", num: "2.5", titulo: "Física: integración y muelles", archivo: "modulos/02-animacion/05-fisica-muelles.html" },
        { id: "canvas2d", num: "2.6", titulo: "Canvas 2D a fondo", archivo: "modulos/02-animacion/06-canvas2d.html" },
        { id: "waapi-flip", num: "2.7", titulo: "Web Animations API y la técnica FLIP", archivo: "modulos/02-animacion/07-waapi-flip.html" },
        { id: "proyecto-particulas", num: "2.8", titulo: "Proyecto: partículas interactivas", archivo: "modulos/02-animacion/08-proyecto-particulas.html" },
      ],
    },
    {
      id: "03-matematicas", num: "3", titulo: "Matemáticas para gráficos",
      resumen: "Vectores, producto punto, trigonometría, funciones de forma, matrices, espacios de coordenadas y precisión numérica. Todo interactivo.",
      lecciones: [
        { id: "vectores", num: "3.1", titulo: "Vectores y coordenadas", archivo: "modulos/03-matematicas/01-vectores.html" },
        { id: "producto-punto-cruz", num: "3.2", titulo: "Producto punto y producto cruz", archivo: "modulos/03-matematicas/02-producto-punto-cruz.html" },
        { id: "trigonometria", num: "3.3", titulo: "Trigonometría útil: ondas, ángulos y polares", archivo: "modulos/03-matematicas/03-trigonometria.html" },
        { id: "funciones-forma", num: "3.4", titulo: "Funciones de forma: step, smoothstep, fract, mod…", archivo: "modulos/03-matematicas/04-funciones-forma.html" },
        { id: "matrices", num: "3.5", titulo: "Matrices y transformaciones", archivo: "modulos/03-matematicas/05-matrices.html" },
        { id: "espacios-coordenadas", num: "3.6", titulo: "De modelo a pantalla: espacios de coordenadas", archivo: "modulos/03-matematicas/06-espacios-coordenadas.html" },
        { id: "precision", num: "3.7", titulo: "Precisión numérica: floats en CPU y GPU", archivo: "modulos/03-matematicas/07-precision.html" },
      ],
    },
    {
      id: "04-gpu", num: "4", titulo: "La GPU por dentro",
      resumen: "Qué es y cómo trabaja una GPU, el pipeline gráfico etapa por etapa, y una GPU de juguete en Python para ver con exactitud qué son VBO, VAO, uniforms y varyings.",
      lecciones: [
        { id: "cpu-vs-gpu", num: "4.1", titulo: "CPU vs GPU: paralelismo, draw calls y la máquina de estados", archivo: "modulos/04-gpu/01-cpu-vs-gpu.html" },
        { id: "pipeline-grafico", num: "4.2", titulo: "El pipeline gráfico etapa por etapa", archivo: "modulos/04-gpu/02-pipeline-grafico.html" },
        { id: "gpu-de-juguete", num: "4.3", titulo: "Una GPU de juguete en Python", archivo: "modulos/04-gpu/03-gpu-de-juguete.html" },
        { id: "vbo-vao", num: "4.4", titulo: "VBO, VAO y EBO: la memoria de los vértices", archivo: "modulos/04-gpu/04-vbo-vao.html" },
        { id: "uniforms-varyings", num: "4.5", titulo: "Atributos, uniforms y varyings", archivo: "modulos/04-gpu/05-uniforms-varyings.html" },
        { id: "opengl-python", num: "4.6", titulo: "OpenGL real desde Python (moderngl y PyOpenGL)", archivo: "modulos/04-gpu/06-opengl-python.html" },
      ],
    },
    {
      id: "05-webgl", num: "5", titulo: "WebGL2 desde cero",
      resumen: "La API cruda, llamada por llamada: contexto, buffers, atributos, uniforms, texturas, 3D, blending, framebuffers, instancing y depuración.",
      lecciones: [
        { id: "contexto", num: "5.1", titulo: "El contexto WebGL y el canvas", archivo: "modulos/05-webgl/01-contexto.html" },
        { id: "primer-triangulo", num: "5.2", titulo: "El primer triángulo, llamada por llamada", archivo: "modulos/05-webgl/02-primer-triangulo.html" },
        { id: "buffers-atributos", num: "5.3", titulo: "Buffers, atributos e índices a fondo", archivo: "modulos/05-webgl/03-buffers-atributos.html" },
        { id: "uniforms-animacion", num: "5.4", titulo: "Uniforms y animación", archivo: "modulos/05-webgl/04-uniforms-animacion.html" },
        { id: "texturas", num: "5.5", titulo: "Texturas: carga, filtrado, wrap y unidades", archivo: "modulos/05-webgl/05-texturas.html" },
        { id: "3d-cubo", num: "5.6", titulo: "3D: matrices, profundidad y el cubo que gira", archivo: "modulos/05-webgl/06-3d-cubo.html" },
        { id: "blending", num: "5.7", titulo: "Transparencia y blending", archivo: "modulos/05-webgl/07-blending.html" },
        { id: "framebuffers", num: "5.8", titulo: "Framebuffers, render-to-texture y ping-pong", archivo: "modulos/05-webgl/08-framebuffers.html" },
        { id: "instancing", num: "5.9", titulo: "Instancing: miles de objetos en un draw call", archivo: "modulos/05-webgl/09-instancing.html" },
        { id: "depuracion", num: "5.10", titulo: "Depuración y rendimiento", archivo: "modulos/05-webgl/10-depuracion.html" },
      ],
    },
    {
      id: "06-glsl", num: "6", titulo: "GLSL y fragment shaders",
      resumen: "El lenguaje a fondo y el arte de pintar con funciones: formas, SDF, color, patrones, ruido, animación, efectos y raymarching.",
      lecciones: [
        { id: "lenguaje", num: "6.1", titulo: "GLSL ES 3.00: el lenguaje", archivo: "modulos/06-glsl/01-lenguaje.html" },
        { id: "pensar-en-paralelo", num: "6.2", titulo: "Pensar como un fragment shader", archivo: "modulos/06-glsl/02-pensar-en-paralelo.html" },
        { id: "formas-sdf", num: "6.3", titulo: "Formas, SDF 2D y antialiasing", archivo: "modulos/06-glsl/03-formas-sdf.html" },
        { id: "color", num: "6.4", titulo: "Color: espacios, gamma y paletas", archivo: "modulos/06-glsl/04-color.html" },
        { id: "patrones", num: "6.5", titulo: "Patrones: repetición, celdas y simetrías", archivo: "modulos/06-glsl/05-patrones.html" },
        { id: "ruido", num: "6.6", titulo: "Aleatoriedad y ruido", archivo: "modulos/06-glsl/06-ruido.html" },
        { id: "animacion-shaders", num: "6.7", titulo: "Animar dentro del shader", archivo: "modulos/06-glsl/07-animacion-shaders.html" },
        { id: "texturas-efectos", num: "6.8", titulo: "Efectos con texturas", archivo: "modulos/06-glsl/08-texturas-efectos.html" },
        { id: "raymarching", num: "6.9", titulo: "Introducción al raymarching", archivo: "modulos/06-glsl/09-raymarching.html" },
        { id: "codigo-ajeno", num: "6.10", titulo: "Leer código ajeno: Shadertoy y GLSL 1.00", archivo: "modulos/06-glsl/10-codigo-ajeno.html" },
      ],
    },
    {
      id: "07-integracion", num: "7", titulo: "JavaScript + shaders juntos",
      resumen: "Arquitectura real: el bucle, el estado, la interacción, transiciones con easing y muelles en uniforms, vértices animados, partículas en GPU y el proyecto final.",
      lecciones: [
        { id: "arquitectura", num: "7.1", titulo: "Arquitectura de una app con shaders", archivo: "modulos/07-integracion/01-arquitectura.html" },
        { id: "interaccion", num: "7.2", titulo: "Interacción: ratón, touch y scroll", archivo: "modulos/07-integracion/02-interaccion.html" },
        { id: "transiciones-shader", num: "7.3", titulo: "Transiciones animadas con shaders", archivo: "modulos/07-integracion/03-transiciones-shader.html" },
        { id: "vertex-animacion", num: "7.4", titulo: "Animar vértices: mallas que se deforman", archivo: "modulos/07-integracion/04-vertex-animacion.html" },
        { id: "particulas-gpu", num: "7.5", titulo: "Partículas en la GPU", archivo: "modulos/07-integracion/05-particulas-gpu.html" },
        { id: "proyecto-final", num: "7.6", titulo: "Proyecto final: un hero interactivo", archivo: "modulos/07-integracion/06-proyecto-final.html" },
        { id: "siguientes-pasos", num: "7.7", titulo: "Siguientes pasos: Three.js y WebGPU con lo que ya sabes", archivo: "modulos/07-integracion/07-siguientes-pasos.html" },
      ],
    },
    {
      id: "08-anexos", num: "A", titulo: "Anexos",
      resumen: "Referencias para tener abiertas mientras programas.",
      lecciones: [
        { id: "bestiario", num: "A.1", titulo: "Bestiario de comportamientos raros", archivo: "modulos/08-anexos/01-bestiario.html" },
        { id: "chuleta-glsl", num: "A.2", titulo: "Chuleta de GLSL ES 3.00", archivo: "modulos/08-anexos/02-chuleta-glsl.html" },
        { id: "chuleta-webgl", num: "A.3", titulo: "Chuleta de la API WebGL2", archivo: "modulos/08-anexos/03-chuleta-webgl.html" },
        { id: "glosario", num: "A.4", titulo: "Glosario", archivo: "modulos/08-anexos/04-glosario.html" },
        { id: "recursos", num: "A.5", titulo: "Recursos para seguir", archivo: "modulos/08-anexos/05-recursos.html" },
      ],
    },
  ],
};
