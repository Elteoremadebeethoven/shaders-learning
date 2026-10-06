# Código Python del módulo 4 · La GPU por dentro

Tres maneras de hacer lo mismo (dibujar triángulos) a tres niveles de abstracción:

| Carpeta | Qué es | Dependencias |
|---|---|---|
| `gpu_juguete/` | Una GPU **de juguete** en Python puro: VBO, VAO, shaders, rasterizador, z-buffer, blending y un codificador PNG propio. Para ver con exactitud qué pasa con cada byte. | Ninguna (biblioteca estándar, Python ≥ 3.9) |
| `moderngl/` | La GPU **real** con [moderngl](https://moderngl.readthedocs.io): OpenGL moderno con una API cómoda y contexto sin ventana. | `requirements.txt` |
| `pyopengl/` | La GPU real con **llamadas crudas** (PyOpenGL): `glGenBuffers`, `glBindBuffer`, `glVertexAttribPointer`... 1:1 con WebGL. | `requirements.txt` |

Todos los scripts guardan sus imágenes en `../modulos/04-gpu/img/` (se puede cambiar con la
variable de entorno `CARPETA_IMG`). Las lecciones del módulo 4 muestran esas imágenes.

## 1. Preparar el entorno

```bash
cd python
python3 -m venv .venv              # crea el entorno virtual en python/.venv
source .venv/bin/activate          # actívalo (en Windows: .venv\Scripts\activate)
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Comprobación rápida:

```bash
python -c "import moderngl; c = moderngl.create_standalone_context(); print(c.info['GL_RENDERER'], c.info['GL_VERSION'])"
# en un Mac con M1:  Apple M1 4.1 Metal - 90.5
```

### Notas sobre Python 3.14 (probado con Python 3.14.7 de Homebrew)

- `moderngl` 5.12.0 y su dependencia `glcontext` 3.0.0 **no publican ruedas precompiladas para
  Python 3.14 en macOS**: pip las **compila** al instalarlas (tarda unos 5 s). Necesitas las
  herramientas de línea de comandos de Xcode: `xcode-select --install`. Si no puedes compilar,
  usa un Python con ruedas publicadas, por ejemplo `brew install python@3.13` y
  `python3.13 -m venv .venv`.
- `numpy`, `pillow`, `glfw` y `PyOpenGL` sí tienen ruedas para 3.14 (o son Python puro).
- La GPU de juguete funciona con cualquier Python ≥ 3.9 sin instalar nada (probada también con
  el Python 3.9 de Apple, `/usr/bin/python3`).

## 2. La GPU de juguete (`gpu_juguete/`, solo biblioteca estándar)

| Archivo | Qué contiene |
|---|---|
| `gpu.py` | El pipeline completo: `Buffer` (VBO/EBO), `Atributo` y `VAO`, `Programa` (shaders = funciones), vertex fetch, ensamblado, recorte, división de perspectiva, viewport, culling, rasterización con funciones de arista, interpolación (con y sin corrección de perspectiva), z-buffer y blending. |
| `maquina_estados.py` | La misma GPU con la "cara" de OpenGL: puntos de enlace, `bind_buffer`, `vertex_attrib_pointer`, `get_error`... para ver por qué la API es una máquina de estados. |
| `png_propio.py` | Codificador PNG de ~30 líneas (zlib + struct) y un lector mínimo. |
| `matrices.py` | Matrices 4×4 column-major (como WebGL). |
| `volcado.py` | Volcados hexadecimales de buffers. |
| `pruebas.py` | Pruebas automáticas de la GPU de juguete. |

Ejecuta cualquier ejemplo **desde su carpeta** o con la ruta completa:

```bash
cd gpu_juguete
python ejemplo_01_triangulo.py      # VBO → VAO → shaders → PNG, con traza de vértices y fragmentos
python ejemplo_02_indices.py        # EBO y caché post-transformación (invocaciones del vertex shader)
python ejemplo_03_profundidad.py    # z-buffer: dos triángulos que se atraviesan
python ejemplo_04_perspectiva.py    # corrección de perspectiva, interpolación afín (PS1) y recorte
python ejemplo_05_blending.py       # blending: el orden importa (salvo con mezcla aditiva)
python ejemplo_06_maquina_estados.py  # las trampas de la máquina de estados, reproducidas
python ejemplo_07_formatos.py       # entrelazado vs separado, UNSIGNED_BYTE normalizado, stride
python ejemplo_08_varyings.py       # smooth / afín / flat, vértice provocador, gl_VertexID
python pruebas.py                   # pruebas (sale con código 0 si todo va bien)
```

Ejercicios de la lección 4.3 (el enunciado está en cada archivo; la solución, en `soluciones/`):

```bash
python ejercicios/ej1_fragment_shader.py   # cambia el fragment shader
python ejercicios/ej2_culling.py           # implementa el back-face culling
python ejercicios/ej3_uniform.py           # añade un uniform y dibuja en 4 viewports
```

## 3. La GPU real con moderngl (`moderngl/`)

```bash
python moderngl/01_triangulo.py          # el triángulo, sin ventana: contexto, buffer, programa, VAO, FBO, leer píxeles
python moderngl/02_buffers_y_vao.py      # leer el VBO de vuelta y preguntar al driver qué guarda el VAO
python moderngl/03_uniforms.py           # uniforms activos/eliminados, arrays, structs, write()
python moderngl/04_interpolacion.py      # smooth, noperspective, flat y el vértice provocador
python moderngl/05_sin_buffers.py        # dibujar sin buffers (gl_VertexID) y atributos constantes
python moderngl/comparar_con_juguete.py  # la GPU de juguete contra la real, píxel a píxel
```

`04_interpolacion.py` y `05_sin_buffers.py` comparan su resultado con el de la GPU de juguete
si antes has ejecutado `gpu_juguete/ejemplo_08_varyings.py`.

Soluciones de los ejercicios de la lección 4.6:

```bash
python moderngl/soluciones/ej2_quad_indices.py   # quad con buffer de índices (index_element_size=2)
python moderngl/soluciones/ej3_cubo.py           # el cubo de 4.3 con profundidad y culling (compara con la GPU de juguete)
python moderngl/soluciones/ej4_formatos.py       # qué llamadas hace moderngl con "3f 4f1 2f2 1u2 2x" (pregunta al driver)
```

## 4. Llamadas crudas con PyOpenGL (`pyopengl/`)

```bash
python pyopengl/01_triangulo_crudo.py    # glGenBuffers, glBindBuffer, glVertexAttribPointer... (ventana oculta + FBO)
python pyopengl/02_estado_y_errores.py   # consultar el estado del VAO, errores típicos, GL_PACK_ALIGNMENT
python pyopengl/03_ventana_glfw.py       # ventana interactiva (ESPACIO pausa, ESC cierra) — opcional
python pyopengl/03_ventana_glfw.py --frames 90 --captura salida.png   # sin interacción
```

## 5. Probarlo todo

```bash
python probar_todo.py                # ejecuta los 27 scripts y comprueba sus imágenes
python probar_todo.py --sin-ventana  # igual, sin abrir la ventana de glfw
```

## 6. Particularidades de macOS (todas comprobadas en macOS 26, Apple M1)

- **OpenGL 4.1 como máximo**, implementado sobre Metal: `GL_VERSION` = `4.1 Metal - 90.5`.
  Apple lo marca como obsoleto desde macOS 10.14, pero sigue funcionando.
- **Perfil core obligatorio para pasar de 2.1**: si creas la ventana sin pedir versión ni perfil,
  obtienes un contexto **2.1** (GLSL 1.20) y `#version 330 core` no compila.
- **Forward-compatible**: con GLFW 3.3 (paquete `glfw` ≤ 2.6), pedir 3.3 core sin
  `OPENGL_FORWARD_COMPAT` falla con *"NSGL: The targeted version of macOS only supports
  forward-compatible core profile contexts for OpenGL 3.2 and above"*. GLFW 3.4 (paquete
  `glfw` 2.10) lo activa solo. Ponlo siempre: no cuesta nada.
- **GLSL**: `#version 330 core` y `#version 410 core` sí; `#version 300 es` (el de WebGL2),
  `#version 420` y `#version 120` (en perfil core) no.
- **VAO obligatorio** en perfil core: sin VAO enlazado, `glEnableVertexAttribArray` y
  `glDrawArrays` dan `GL_INVALID_OPERATION` (curiosamente, `glVertexAttribPointer` no).
- **Retina**: una ventana de 640 × 480 puntos tiene un framebuffer de 1280 × 960 píxeles.
  Usa `glfw.get_framebuffer_size()` para `glViewport`, no `glfw.get_window_size()`.
- **vsync poco fiable**: con `glfw.swap_interval(1)` en una pantalla de 60 Hz medimos unos
  90 fps con intervalos irregulares (3–17 ms); con `swap_interval(0)`, unos 4000. Anima con el
  `dt` medido, no con 1/60.

## 7. Trampas de PyOpenGL

- El offset de `glVertexAttribPointer` se pasa como `ctypes.c_void_p(n)` (o `None` para 0).
  Un entero a secas (`8`) se convierte en un array en la memoria de la CPU y lo que llega es su
  dirección: el atributo lee fuera del VBO (ceros, en el Mac) y **no hay ningún error**.
  Compruébalo con `glGetVertexAttribPointerv(loc, GL_VERTEX_ATTRIB_ARRAY_POINTER)`.
- PyOpenGL comprueba `glGetError()` después de **cada** llamada y lanza una excepción: muy útil
  al aprender. Cuesta poco en OpenGL nativo (medido: `glUniform1f` 0,62 µs con comprobación,
  0,41 µs sin ella); se desactiva con `OpenGL.ERROR_CHECKING = False` antes de importar `GL`.
- El `glReadPixels` sin buffer de destino devuelve `bytes` y cambia `GL_PACK_ALIGNMENT` a 1
  sin avisar. Con tu propio buffer y formato RGB, pon tú la alineación (o las filas saldrán
  desplazadas si el ancho no es múltiplo de 4).
