"""02_estado_y_errores.py — la máquina de estados de OpenGL, consultada en vivo.

  1. ¿Qué guarda un VAO? Lo preguntamos al driver con glGetVertexAttribiv.
  2. ARRAY_BUFFER no es estado del VAO; ELEMENT_ARRAY_BUFFER sí.
  3. Perfil core sin VAO: los errores que da el driver de Apple.
  4. Uniforms: sin programa, ubicación -1, uniform eliminado por el compilador.
  5. La trampa de glReadPixels con RGB y anchos impares (GL_PACK_ALIGNMENT).

Desactivamos la comprobación automática de PyOpenGL para ver los errores como en WebGL:
la llamada errónea no hace nada y el error queda apuntado hasta que llamas a glGetError.

Ejecuta:  python pyopengl/02_estado_y_errores.py
Genera:   modulos/04-gpu/img/pyopengl-alineacion.png
"""
import ctypes
import struct
import sys
from pathlib import Path

import OpenGL
OpenGL.ERROR_CHECKING = False            # sin esto, PyOpenGL lanza una excepción en cada error
import glfw  # noqa: E402
from OpenGL import GL  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from png_propio import guardar_png  # noqa: E402
from rutas import carpeta_img  # noqa: E402

ERRORES = {0: "GL_NO_ERROR", 0x500: "GL_INVALID_ENUM", 0x501: "GL_INVALID_VALUE", 0x502: "GL_INVALID_OPERATION"}


def error():
    return ERRORES.get(GL.glGetError(), "?")


glfw.init()
glfw.window_hint(glfw.VISIBLE, glfw.FALSE)
glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 4)
glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 1)
glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
glfw.window_hint(glfw.OPENGL_FORWARD_COMPAT, glfw.TRUE)
ventana = glfw.create_window(64, 64, "oculta", None, None)
glfw.make_context_current(ventana)


def entero(valor):
    return int(valor[0]) if hasattr(valor, "__len__") else int(valor)


def atributo(loc):
    """Todo lo que el VAO actual guarda para la location `loc`."""
    q = lambda p: entero(GL.glGetVertexAttribiv(loc, p))  # noqa: E731
    return {"habilitado": q(GL.GL_VERTEX_ATTRIB_ARRAY_ENABLED), "size": q(GL.GL_VERTEX_ATTRIB_ARRAY_SIZE),
            "tipo": hex(q(GL.GL_VERTEX_ATTRIB_ARRAY_TYPE)), "normalizado": q(GL.GL_VERTEX_ATTRIB_ARRAY_NORMALIZED),
            "entero": q(GL.GL_VERTEX_ATTRIB_ARRAY_INTEGER), "stride": q(GL.GL_VERTEX_ATTRIB_ARRAY_STRIDE),
            "divisor": q(GL.GL_VERTEX_ATTRIB_ARRAY_DIVISOR), "buffer": q(GL.GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
            "offset": int(GL.glGetVertexAttribPointerv(loc, GL.GL_VERTEX_ATTRIB_ARRAY_POINTER) or 0)}


print("== 1 y 2. Qué guarda un VAO ==")
x, y, ebo = (int(b) for b in GL.glGenBuffers(3))
vao_a, vao_b = (int(v) for v in GL.glGenVertexArrays(2))
GL.glBindVertexArray(vao_a)
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, x)
GL.glBufferData(GL.GL_ARRAY_BUFFER, 64, None, GL.GL_STATIC_DRAW)
GL.glEnableVertexAttribArray(0)
GL.glVertexAttribPointer(0, 2, GL.GL_FLOAT, GL.GL_FALSE, 12, ctypes.c_void_p(0))
GL.glEnableVertexAttribArray(1)
GL.glVertexAttribPointer(1, 4, GL.GL_UNSIGNED_BYTE, GL.GL_TRUE, 12, ctypes.c_void_p(8))
GL.glBindBuffer(GL.GL_ELEMENT_ARRAY_BUFFER, ebo)
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, y)                        # cambiamos ARRAY_BUFFER DESPUÉS
print(f"buffers: x={x} y={y} ebo={ebo} | VAOs: a={vao_a} b={vao_b}")
print("vao_a, atributo 0:", atributo(0))
print("vao_a, atributo 1:", atributo(1))
print("vao_a, atributo 2 (sin tocar):", atributo(2))
print("vao_a: ELEMENT_ARRAY_BUFFER =", entero(GL.glGetIntegerv(GL.GL_ELEMENT_ARRAY_BUFFER_BINDING)),
      "| ARRAY_BUFFER =", entero(GL.glGetIntegerv(GL.GL_ARRAY_BUFFER_BINDING)))
GL.glBindVertexArray(vao_b)
print("vao_b: ELEMENT_ARRAY_BUFFER =", entero(GL.glGetIntegerv(GL.GL_ELEMENT_ARRAY_BUFFER_BINDING)),
      "| ARRAY_BUFFER =", entero(GL.glGetIntegerv(GL.GL_ARRAY_BUFFER_BINDING)), "← sigue siendo y: no es del VAO")
GL.glVertexAttrib4f(3, 0.1, 0.2, 0.3, 0.4)                     # valor constante: estado del CONTEXTO
GL.glBindVertexArray(vao_a)
print("CURRENT_VERTEX_ATTRIB 3 visto desde vao_a:",
      [round(float(v), 3) for v in GL.glGetVertexAttribfv(3, GL.GL_CURRENT_VERTEX_ATTRIB)], "← no es estado del VAO")

print("\n== 3. Perfil core sin VAO ==")
GL.glBindVertexArray(0)
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, x)
GL.glEnableVertexAttribArray(0)
print("glEnableVertexAttribArray sin VAO →", error())
GL.glVertexAttribPointer(0, 2, GL.GL_FLOAT, GL.GL_FALSE, 0, ctypes.c_void_p(0))
print("glVertexAttribPointer sin VAO     →", error(), "(el driver de Apple no se queja aquí...)")
GL.glDrawArrays(GL.GL_TRIANGLES, 0, 3)
print("glDrawArrays sin VAO              →", error(), "(...pero sí al dibujar)")

print("\n== 4. Uniforms ==")


def compilar(tipo, fuente):
    sh = GL.glCreateShader(tipo)
    GL.glShaderSource(sh, fuente)
    GL.glCompileShader(sh)
    assert GL.glGetShaderiv(sh, GL.GL_COMPILE_STATUS), GL.glGetShaderInfoLog(sh)
    return sh


prog = GL.glCreateProgram()
GL.glAttachShader(prog, compilar(GL.GL_VERTEX_SHADER, """#version 330 core
layout(location = 0) in vec2 a_pos; uniform float u_escala; uniform float u_noUsado;
void main() { gl_Position = vec4(a_pos * u_escala, 0.0, 1.0); }"""))
GL.glAttachShader(prog, compilar(GL.GL_FRAGMENT_SHADER, """#version 330 core
uniform vec3 u_color; out vec4 o; void main() { o = vec4(u_color, 1.0); }"""))
GL.glLinkProgram(prog)
loc = GL.glGetUniformLocation(prog, "u_escala")
print("glGetUniformLocation('u_escala') =", loc, "| ('u_noUsado') =", GL.glGetUniformLocation(prog, "u_noUsado"),
      "← eliminado por el compilador")
print("uniforms activos:", entero(GL.glGetProgramiv(prog, GL.GL_ACTIVE_UNIFORMS)))
GL.glUseProgram(0)
GL.glUniform1f(loc, 2.0)
print("glUniform1f sin programa en uso  →", error())
GL.glUseProgram(prog)
GL.glUniform1f(-1, 2.0)
print("glUniform1f(-1, ...)              →", error(), "(silencio: -1 se ignora)")
GL.glUniform1i(loc, 2)
print("glUniform1i en un float           →", error())
valor = (ctypes.c_float * 3)()
GL.glGetUniformfv(prog, GL.glGetUniformLocation(prog, "u_color"), valor)
print("valor inicial de u_color (nunca asignado):", list(valor))

print("\n== 5. glReadPixels, RGB y GL_PACK_ALIGNMENT ==")
W = H = 99                                                    # 99 × 3 = 297 bytes por fila: no es múltiplo de 4
fbo = GL.glGenFramebuffers(1)
GL.glBindFramebuffer(GL.GL_FRAMEBUFFER, fbo)
rbo = GL.glGenRenderbuffers(1)
GL.glBindRenderbuffer(GL.GL_RENDERBUFFER, rbo)
GL.glRenderbufferStorage(GL.GL_RENDERBUFFER, GL.GL_RGBA8, W, H)
GL.glFramebufferRenderbuffer(GL.GL_FRAMEBUFFER, GL.GL_COLOR_ATTACHMENT0, GL.GL_RENDERBUFFER, rbo)
GL.glViewport(0, 0, W, H)
GL.glClearColor(0.08, 0.09, 0.12, 1.0)
GL.glClear(GL.GL_COLOR_BUFFER_BIT)
vao = GL.glGenVertexArrays(1)
GL.glBindVertexArray(vao)
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, x)
tri = struct.pack("<6f", -0.8, -0.8, 0.8, -0.8, 0.0, 0.8)
GL.glBufferData(GL.GL_ARRAY_BUFFER, len(tri), tri, GL.GL_STATIC_DRAW)
GL.glEnableVertexAttribArray(0)
GL.glVertexAttribPointer(0, 2, GL.GL_FLOAT, GL.GL_FALSE, 0, ctypes.c_void_p(0))
GL.glUniform1f(loc, 1.0)
GL.glUniform3f(GL.glGetUniformLocation(prog, "u_color"), 1.0, 0.6, 0.2)
GL.glDrawArrays(GL.GL_TRIANGLES, 0, 3)
print("GL_PACK_ALIGNMENT por defecto:", entero(GL.glGetIntegerv(GL.GL_PACK_ALIGNMENT)))
GL.glReadPixels(0, 0, W, H, GL.GL_RGB, GL.GL_UNSIGNED_BYTE)    # la versión "cómoda" de PyOpenGL...
print("GL_PACK_ALIGNMENT tras el glReadPixels cómodo de PyOpenGL:", entero(GL.glGetIntegerv(GL.GL_PACK_ALIGNMENT)),
      "← ¡lo cambió a tus espaldas!")


def leer_rgb(alineacion):
    """glReadPixels 'a lo C': con NUESTRO buffer, como harías en C, JS o con numpy."""
    GL.glPixelStorei(GL.GL_PACK_ALIGNMENT, alineacion)
    fila = (W * 3 + alineacion - 1) // alineacion * alineacion   # cada fila se rellena hasta un múltiplo
    destino = (ctypes.c_ubyte * (fila * H))()
    GL.glReadPixels(0, 0, W, H, GL.GL_RGB, GL.GL_UNSIGNED_BYTE, destino)
    return bytes(destino), fila


mal, fila_mal = leer_rgb(4)
bien, fila_bien = leer_rgb(1)
print(f"alineación 4: filas de {fila_mal} bytes (297 + 3 de relleno) | alineación 1: filas de {fila_bien} bytes")


def a_rgba_de_arriba_abajo(rgb):
    """Interpreta los bytes como RGB SIN relleno (el error típico) y los pasa a RGBA."""
    filas = [rgb[f * W * 3:(f + 1) * W * 3] for f in range(H)]
    out = b""
    for fila in reversed(filas):
        fila = fila.ljust(W * 3, b"\x00")
        out += b"".join(fila[i:i + 3] + b"\xff" for i in range(0, W * 3, 3))
    return out


hoja = bytearray()
izq, der = a_rgba_de_arriba_abajo(mal), a_rgba_de_arriba_abajo(bien)
for f in range(H):
    hoja += izq[f * W * 4:(f + 1) * W * 4] + b"\xff\xff\xff\xff" * 6 + der[f * W * 4:(f + 1) * W * 4]
guardar_png(carpeta_img() / "pyopengl-alineacion.png", 2 * W + 6, H, bytes(hoja))
print("guardado img/pyopengl-alineacion.png (izquierda: leída como si no hubiera relleno)")
glfw.terminate()
