"""01_triangulo_crudo.py — el triángulo de colores con llamadas OpenGL crudas (PyOpenGL).

Nada de envoltorios: glGenBuffers, glBindBuffer, glBufferData, glVertexAttribPointer...
exactamente las mismas llamadas que harás en WebGL (gl.createBuffer, gl.bindBuffer...).
Para tener un contexto usamos una ventana OCULTA de glfw y dibujamos en un framebuffer
propio (FBO), así no dependemos de la ventana ni de la pantalla Retina.

Ejecuta:  python pyopengl/01_triangulo_crudo.py
Genera:   modulos/04-gpu/img/pyopengl-triangulo.png
"""
import ctypes
import struct
import sys
from pathlib import Path

import glfw
from OpenGL import GL

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from png_propio import guardar_png  # noqa: E402  (el mismo codificador PNG de la GPU de juguete)
from rutas import carpeta_img  # noqa: E402

ANCHO, ALTO = 256, 256

# ---------------------------------------------------------------- 1. contexto
if not glfw.init():
    raise SystemExit("glfw.init() falló")
glfw.window_hint(glfw.VISIBLE, glfw.FALSE)                    # ventana oculta: solo queremos el contexto
glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 4)               # macOS: 4.1 es lo máximo
glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 1)
glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
glfw.window_hint(glfw.OPENGL_FORWARD_COMPAT, glfw.TRUE)       # obligatorio en macOS con glfw < 3.4
ventana = glfw.create_window(64, 64, "oculta", None, None)
if not ventana:
    glfw.terminate()
    raise SystemExit("no se pudo crear el contexto OpenGL")
glfw.make_context_current(ventana)                            # a partir de aquí, GL.* habla con ESTE contexto
print("OpenGL", GL.glGetString(GL.GL_VERSION).decode(), "|", GL.glGetString(GL.GL_RENDERER).decode())


# ---------------------------------------------------------------- 2. shaders y programa
def compilar(tipo, fuente):
    sh = GL.glCreateShader(tipo)                              # gl.createShader(tipo)
    GL.glShaderSource(sh, fuente)                             # gl.shaderSource(sh, fuente)
    GL.glCompileShader(sh)                                    # gl.compileShader(sh)
    if not GL.glGetShaderiv(sh, GL.GL_COMPILE_STATUS):        # gl.getShaderParameter(sh, gl.COMPILE_STATUS)
        raise RuntimeError(GL.glGetShaderInfoLog(sh).decode())
    return sh


VS = """#version 330 core
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec3 a_color;
out vec3 v_color;
void main() {
    v_color = a_color;
    gl_Position = vec4(a_pos, 0.0, 1.0);
}"""
FS = """#version 330 core
in vec3 v_color;
out vec4 fragColor;
void main() {
    fragColor = vec4(v_color, 1.0);
}"""
vs, fs = compilar(GL.GL_VERTEX_SHADER, VS), compilar(GL.GL_FRAGMENT_SHADER, FS)
programa = GL.glCreateProgram()                               # gl.createProgram()
GL.glAttachShader(programa, vs)                               # gl.attachShader(p, vs)
GL.glAttachShader(programa, fs)
GL.glLinkProgram(programa)                                    # gl.linkProgram(p)
if not GL.glGetProgramiv(programa, GL.GL_LINK_STATUS):        # gl.getProgramParameter(p, gl.LINK_STATUS)
    raise RuntimeError(GL.glGetProgramInfoLog(programa).decode())
GL.glDeleteShader(vs)                                         # ya están dentro del programa
GL.glDeleteShader(fs)

# ---------------------------------------------------------------- 3. VAO + VBO
vertices = struct.pack("<15f",
                       -0.75, -0.75, 1.0, 0.0, 0.0,
                        0.75, -0.75, 0.0, 1.0, 0.0,
                        0.00,  0.75, 0.0, 0.0, 1.0)
vao = GL.glGenVertexArrays(1)                                 # gl.createVertexArray()
GL.glBindVertexArray(vao)                                     # gl.bindVertexArray(vao)
vbo = GL.glGenBuffers(1)                                      # gl.createBuffer()
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, vbo)                      # gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
GL.glBufferData(GL.GL_ARRAY_BUFFER, len(vertices), vertices, GL.GL_STATIC_DRAW)   # gl.bufferData(...)
GL.glEnableVertexAttribArray(0)                               # gl.enableVertexAttribArray(0)
GL.glVertexAttribPointer(0, 2, GL.GL_FLOAT, GL.GL_FALSE, 20, ctypes.c_void_p(0))  # gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0)
GL.glEnableVertexAttribArray(1)
GL.glVertexAttribPointer(1, 3, GL.GL_FLOAT, GL.GL_FALSE, 20, ctypes.c_void_p(8))  # gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8)

# ---------------------------------------------------------------- 4. framebuffer propio
fbo = GL.glGenFramebuffers(1)                                 # gl.createFramebuffer()
GL.glBindFramebuffer(GL.GL_FRAMEBUFFER, fbo)
rbo = GL.glGenRenderbuffers(1)                                # gl.createRenderbuffer()
GL.glBindRenderbuffer(GL.GL_RENDERBUFFER, rbo)
GL.glRenderbufferStorage(GL.GL_RENDERBUFFER, GL.GL_RGBA8, ANCHO, ALTO)
GL.glFramebufferRenderbuffer(GL.GL_FRAMEBUFFER, GL.GL_COLOR_ATTACHMENT0, GL.GL_RENDERBUFFER, rbo)
assert GL.glCheckFramebufferStatus(GL.GL_FRAMEBUFFER) == GL.GL_FRAMEBUFFER_COMPLETE

# ---------------------------------------------------------------- 5. dibujar
GL.glViewport(0, 0, ANCHO, ALTO)                              # gl.viewport(0, 0, w, h)
GL.glClearColor(0.08, 0.09, 0.12, 1.0)                        # gl.clearColor(...)
GL.glClear(GL.GL_COLOR_BUFFER_BIT)                            # gl.clear(gl.COLOR_BUFFER_BIT)
GL.glUseProgram(programa)                                     # gl.useProgram(p)
GL.glBindVertexArray(vao)
GL.glDrawArrays(GL.GL_TRIANGLES, 0, 3)                        # gl.drawArrays(gl.TRIANGLES, 0, 3)
print("glGetError tras dibujar:", GL.glGetError())            # 0 = GL_NO_ERROR

# ---------------------------------------------------------------- 6. leer los píxeles
GL.glPixelStorei(GL.GL_PACK_ALIGNMENT, 1)                     # filas sin relleno (ver la lección)
datos = GL.glReadPixels(0, 0, ANCHO, ALTO, GL.GL_RGBA, GL.GL_UNSIGNED_BYTE)   # gl.readPixels(...)
datos = bytes(datos)
fila = ANCHO * 4
de_arriba_abajo = b"".join(datos[y * fila:(y + 1) * fila] for y in reversed(range(ALTO)))  # GL: fila 0 = abajo
print("píxel (128, 100):", tuple(datos[(100 * ANCHO + 128) * 4:][:4]))
ruta = carpeta_img() / "pyopengl-triangulo.png"
guardar_png(ruta, ANCHO, ALTO, de_arriba_abajo)
print("guardado:", ruta)

# ---------------------------------------------------------------- 7. limpieza
GL.glDeleteFramebuffers(1, [fbo])
GL.glDeleteRenderbuffers(1, [rbo])
GL.glDeleteBuffers(1, [vbo])
GL.glDeleteVertexArrays(1, [vao])
GL.glDeleteProgram(programa)
glfw.terminate()
