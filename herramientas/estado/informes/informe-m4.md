## Informe final: Módulo 4 · La GPU por dentro

Las seis lecciones del módulo 4 están escritas y pasan `verificar.mjs`. Los únicos avisos son enlaces a lecciones de los módulos 5 y 7 que todavía no existen. Los 27 scripts de Python funcionan (`probar_todo.py`: 27/27 en 7,8 s).

**1. Archivos creados**

- **Lecciones**, en `/Users/alex/Projects/shaders/modulos/04-gpu/`:
  - `01-cpu-vs-gpu.html`, `02-pipeline-grafico.html`, `03-gpu-de-juguete.html`
  - `04-vbo-vao.html`, `05-uniforms-varyings.html`, `06-opengl-python.html`
- **`recursos/`**: `m4.css`, `gpu-juguete.js`, `demos-41.js`, `demo-pipeline.js`, `demo-raster.js`, `demo-memoria.js`, `demos-45.js`.
- **`img/`**: 33 PNG, todos generados por los scripts de Python.
- **Python**, en `/Users/alex/Projects/shaders/python/`:
  - `README.md`, `requirements.txt`, `probar_todo.py`.
  - `gpu_juguete/`: `gpu.py`, `maquina_estados.py`, `png_propio.py`, `matrices.py`, `volcado.py`, `rutas.py`, `pruebas.py`, los ejemplos 01 a 08, y los ejercicios 1 a 3 con sus soluciones.
  - `moderngl/`: scripts 01 a 05, `comparar_con_juguete.py` y las soluciones de los ejercicios 4.6.2, 4.6.3 y 4.6.4.
  - `pyopengl/`: `01_triangulo_crudo.py`, `02_estado_y_errores.py`, `03_ventana_glfw.py`.
  - El entorno virtual está en `python/.venv`.

**2. Por lección**

- **4.1 CPU vs GPU.** Modelo SIMT y divergencia medida: un damero de 1 píxel cuesta el doble, y con bloques de 8 píxeles o más no hay penalización. También ocupación, caché de texturas, memoria unificada, asincronía (`finish` no espera en Chrome), coste de draw calls y el tirón del primer dibujo, máquina de estados y ANGLE.
  - Ejemplos 3 · ejercicios 4 · quizzes 4 · bestiario 5 · senior 5 · hack 1.
- **4.2 Pipeline gráfico.** Todas las etapas, con recorte y guard band, división por w, regla de empate, early-z y TBDR/HSR (32 capas medidas) y blending.
  - Ejemplos 3 · ejercicios 4 · quizzes 3 · bestiario 5 · senior 3 · hack 1.
- **4.3 GPU de juguete.** `gpu.py` paso a paso, más una versión en JS con la rasterización animada. Coincide con la GPU real píxel a píxel (0 diferencias). Ejercicios: cambiar el fragment shader, implementar culling y añadir un uniform.
  - Ejemplos 2 · ejercicios 4 · quizzes 2 · bestiario 2 · senior 2 · hack 1.
- **4.4 VBO, VAO y EBO.** Qué guarda un VAO y qué no, tipos normalizados y enteros (`IPointer`), índices, reinicio de primitivas, validación de índices y caché post-transformación (ACMR).
  - Ejemplos 3 · ejercicios 4 · quizzes 2 · bestiario 6 · senior 2 · hack 1.
- **4.5 Atributos, uniforms y varyings.** Atributos constantes, semántica de los uniforms, corrección de perspectiva (demo de la curva t(u)), interpolación afín tipo PS1, `flat` y vértice provocador, `gl_VertexID`.
  - Ejemplos 2 · ejercicios 4 · quizzes 2 · bestiario 2 · senior 1 · hack 2.
- **4.6 OpenGL desde Python.** Preparación del entorno, moderngl y PyOpenGL con bloques anotados, y una tabla de traducción WebGL ↔ PyOpenGL ↔ moderngl. Un playground de WebGL lee el mismo píxel (81, 83, 91, 255) que los tres caminos de Python. Además: las particularidades de macOS, el bucle de una ventana glfw y una comparación de los tres caminos con tiempos medidos.
  - Ejemplos 2 · ejercicios 4 · quizzes 3 · bestiario 4 · senior 1 · hack 1.

**3. `data-id` del bestiario (24, todos únicos)**

m4-if-lento, m4-drawcall-0ms, m4-readpixels-lento, m4-tiron-primer-dibujo, m4-bind-para-editar, m4-linewidth, m4-dividir-por-w, m4-escala-negativa, m4-clear-no-borra, m4-discard-lento, m4-uno-de-diferencia, m4-imagen-boca-abajo, m4-stride-en-elementos, m4-sin-normalizar, m4-tipo-atributo, m4-ebo-vao-equivocado, m4-vao-buffer-antiguo, m4-indice-65535, m4-uniform-silencioso, m4-precision-uniform, m4-offset-entero, m4-pack-alignment, m4-contexto-21, m4-retina-viewport.

**4. Verificación**

- `verificar.mjs` en tema oscuro (4.6 también en claro): 4 de 6 páginas sin problemas.
- 4.1 y 4.5 solo avisan de enlaces a `05-webgl/10-depuracion`, `07-integracion/04`, `/05` y `/07`. Las cuatro rutas están en el manifest; son lecciones aún sin escribir.
- `sincronizar.py --comprobar`: los extractos de código de las seis lecciones coinciden con los archivos de Python (0 desincronizados).

**5. Problemas conocidos y cosas sin comprobar**

- Todo está medido en un Apple M1 con Chrome, ANGLE sobre Metal y macOS 26. No he podido medir una GPU de escritorio de modo inmediato (NVIDIA o AMD); el texto lo dice donde importa.
- El Python solo está probado en macOS con Python 3.14.7; ni Linux ni Windows.
- El mensaje de error de GLFW 3.3 lo comprobé con el paquete `glfw` 2.6.5 desempaquetado en el scratchpad, no instalado en el entorno.
- **Vsync**: con `swap_interval(1)` medí unos 90 fps irregulares en una pantalla de 60 Hz. No sé si la causa está en GLFW o en macOS.
- `probar_todo.py` abre una ventana visible durante 1 s. Hay que usar `--sin-ventana` en un entorno sin pantalla.
- **Error encontrado en un experimento antiguo (e20)**: codificaba enteros como `(n + 0,5)/255`, y en esta GPU eso da n + 1 porque redondea. Volví a comprobar la afirmación de 4.5 sobre `gl_InstanceID` con la codificación exacta y sigue siendo correcta.
- **Decisiones discutibles**:
  - En la pasada final añadí cajas `hack` a 4.1–4.4 y 4.6. Cada una sale de una medida propia: bloques de 8 × 8, ocultar desde el vertex shader (46 ms frente a 2 ms), el «printf» por color y un VAO compartido entre programas.
  - Los ejercicios de 4.6 son solo de Python, así que no llevan playground ni `data-solucion`.
  - Creé dos clases CSS propias en `m4.css`, `m4-traduccion` y `m4-largo`, para evitar desbordes del código en línea.

**6. Sugerencias para componentes compartidos (no modificados)**

- En las notas de `.anotado` KaTeX no se procesa. Convendría permitirlo o documentarlo.
- El `code` en línea lleva `white-space: nowrap`, y los mensajes largos se salen de la columna. Convendría una clase compartida que permita partirlos.
- `.leccion table` usa `display: block` con scroll horizontal, y ese scroll no se nota. Sugiero una sombra que lo indique o permitir que el código se parta dentro de las tablas.
- `verificar.mjs`:
  - Marca como error los avisos de WebGL que se provocan a propósito. Sugiero un atributo tipo `data-errores-esperados`.
  - No cuenta las cajas `hack`.
- `sincronizar.py` (en `scratchpad/experimentos/m4/`) mantiene los extractos `data-fuente` iguales al código real. Podría servir a todo el curso.

**7. Glosario**

- **SIMT**: un mismo programa ejecutado en paso de marcha por los carriles de un warp.
- **Warp**: grupo de 32 (o 64) hilos con un solo contador de programa.
- **Divergencia**: carriles de un mismo warp que toman ramas distintas, así que el warp ejecuta las dos.
- **Ocupación**: warps residentes por núcleo; sirven para ocultar la latencia de memoria.
- **Command buffer**: cola de órdenes que la CPU llena y la GPU ejecuta más tarde.
- **Draw call**: una orden de dibujo (`drawArrays` o `drawElements`).
- **PSO**: objeto de estado de pipeline que compilan Metal, D3D12 y Vulkan.
- **ANGLE**: capa que traduce WebGL a Metal, D3D o Vulkan.
- **Bind-to-edit**: modificar un objeto de OpenGL enlazándolo primero a un punto de enlace.
- **TBDR / HSR**: render diferido por teselas / eliminación de superficies ocultas antes de sombrear.
- **Early-z**: prueba de profundidad antes del fragment shader.
- **Guard band**: margen en el que el rasterizador no necesita recortar.
- **Regla de empate**: criterio que decide a qué triángulo pertenece un píxel que cae justo en una arista compartida.
- **Función de arista**: área con signo que dice de qué lado de una arista está un punto.
- **Coordenadas baricéntricas**: pesos de los tres vértices en un punto del triángulo.
- **Corrección de perspectiva**: interpolar v/w y 1/w linealmente en pantalla y dividir.
- **Interpolación afín**: interpolar sin corrección de perspectiva (la textura «nada», como en la PS1).
- **Vértice provocador**: el vértice que aporta el valor de un varying `flat`.
- **VBO / EBO**: buffer de vértices / buffer de índices.
- **VAO**: objeto que guarda cómo leer cada atributo y qué EBO usar.
- **Stride / offset**: bytes entre vértices consecutivos / bytes desde el inicio del vértice.
- **Atributo normalizado**: entero convertido a [0, 1] o [−1, 1].
- **Atributo entero**: se entrega sin convertir, con `vertexAttribIPointer`.
- **Atributo constante**: valor fijado con `vertexAttrib*` y el array desactivado.
- **Reinicio de primitivas**: el índice máximo del tipo corta la primitiva.
- **Caché post-transformación / ACMR**: reutilizar vértices ya procesados / vértices sombreados por triángulo.
- **Uniform**: valor constante durante un dibujo; es estado del programa.
- **Varying**: salida del vertex shader interpolada para cada fragmento.
- **`gl_VertexID`**: índice del vértice en curso; permite dibujar sin buffers.
- **Perfil core**: OpenGL sin las funciones antiguas.
- **Forward-compatible**: contexto core sin nada obsoleto (obligatorio en macOS).
- **Contexto standalone**: contexto de OpenGL sin ventana.
- **`GL_PACK_ALIGNMENT`**: alineación de las filas al leer píxeles.
- **Swap interval / vsync**: esperar al refresco de la pantalla al presentar el frame.
- **Framebuffer Retina**: framebuffer con el doble de píxeles que puntos tiene la ventana.
