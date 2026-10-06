"""03_ventana_glfw.py — una ventana interactiva con glfw + PyOpenGL (opcional).

El triángulo gira con un uniform u_tiempo. ESPACIO pausa, ESC cierra.
Lo que hace un navegador por ti con requestAnimationFrame y el canvas, aquí lo haces a mano:
el bucle, el intercambio de buffers (vsync), el tamaño real del framebuffer (Retina)...

Ejecuta:  python pyopengl/03_ventana_glfw.py
Para probarlo sin interacción:  python pyopengl/03_ventana_glfw.py --frames 90 --captura salida.png
"""
import argparse
import ctypes
import math
import struct
import sys
import time
from pathlib import Path

import glfw
from OpenGL import GL

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from png_propio import guardar_png  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument("--frames", type=int, default=0, help="cerrar tras N frames (0 = nunca)")
parser.add_argument("--captura", help="guardar el último frame en este PNG")
args = parser.parse_args()

if not glfw.init():
    raise SystemExit("glfw.init() falló")
glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 4)
glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 1)
glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
glfw.window_hint(glfw.OPENGL_FORWARD_COMPAT, glfw.TRUE)
ventana = glfw.create_window(640, 480, "GPU real desde Python", None, None)
if not ventana:
    glfw.terminate()
    raise SystemExit("no se pudo crear la ventana")
glfw.make_context_current(ventana)
glfw.swap_interval(1)                                    # vsync: swap_buffers espera al refresco
print("ventana (puntos):", glfw.get_window_size(ventana), "| framebuffer (píxeles):", glfw.get_framebuffer_size(ventana))


def compilar(tipo, fuente):
    sh = GL.glCreateShader(tipo)
    GL.glShaderSource(sh, fuente)
    GL.glCompileShader(sh)
    if not GL.glGetShaderiv(sh, GL.GL_COMPILE_STATUS):
        raise RuntimeError(GL.glGetShaderInfoLog(sh).decode())
    return sh


prog = GL.glCreateProgram()
GL.glAttachShader(prog, compilar(GL.GL_VERTEX_SHADER, """#version 330 core
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec3 a_color;
uniform float u_tiempo;
uniform float u_aspecto;          // ancho / alto del framebuffer
out vec3 v_color;
void main() {
    float c = cos(u_tiempo), s = sin(u_tiempo);
    vec2 p = mat2(c, s, -s, c) * a_pos;
    v_color = a_color;
    gl_Position = vec4(p.x / u_aspecto, p.y, 0.0, 1.0);
}"""))
GL.glAttachShader(prog, compilar(GL.GL_FRAGMENT_SHADER, """#version 330 core
in vec3 v_color; out vec4 fragColor;
void main() { fragColor = vec4(v_color, 1.0); }"""))
GL.glLinkProgram(prog)
assert GL.glGetProgramiv(prog, GL.GL_LINK_STATUS), GL.glGetProgramInfoLog(prog)
loc_tiempo = GL.glGetUniformLocation(prog, "u_tiempo")
loc_aspecto = GL.glGetUniformLocation(prog, "u_aspecto")

vao = GL.glGenVertexArrays(1)
GL.glBindVertexArray(vao)
vbo = GL.glGenBuffers(1)
GL.glBindBuffer(GL.GL_ARRAY_BUFFER, vbo)
datos = struct.pack("<15f", -0.75, -0.6, 1, 0, 0, 0.75, -0.6, 0, 1, 0, 0.0, 0.8, 0, 0, 1)
GL.glBufferData(GL.GL_ARRAY_BUFFER, len(datos), datos, GL.GL_STATIC_DRAW)
GL.glEnableVertexAttribArray(0)
GL.glVertexAttribPointer(0, 2, GL.GL_FLOAT, GL.GL_FALSE, 20, ctypes.c_void_p(0))
GL.glEnableVertexAttribArray(1)
GL.glVertexAttribPointer(1, 3, GL.GL_FLOAT, GL.GL_FALSE, 20, ctypes.c_void_p(8))

estado = {"pausa": False, "t": 0.0}


def al_teclear(win, tecla, scancode, accion, mods):
    if accion == glfw.PRESS and tecla == glfw.KEY_ESCAPE:
        glfw.set_window_should_close(win, True)
    if accion == glfw.PRESS and tecla == glfw.KEY_SPACE:
        estado["pausa"] = not estado["pausa"]


glfw.set_key_callback(ventana, al_teclear)
anterior = time.perf_counter()
cuenta, t_fps, frame = 0, anterior, 0
while not glfw.window_should_close(ventana):
    ahora = time.perf_counter()
    dt, anterior = min(ahora - anterior, 0.1), ahora            # dt en segundos, acotado (lección 2.3)
    if not estado["pausa"]:
        estado["t"] += dt
    ancho, alto = glfw.get_framebuffer_size(ventana)           # ¡en píxeles reales, no en puntos!
    GL.glViewport(0, 0, ancho, alto)
    GL.glClearColor(0.08, 0.09, 0.12, 1.0)
    GL.glClear(GL.GL_COLOR_BUFFER_BIT)
    GL.glUseProgram(prog)
    GL.glUniform1f(loc_tiempo, estado["t"])
    GL.glUniform1f(loc_aspecto, ancho / max(alto, 1))
    GL.glBindVertexArray(vao)
    GL.glDrawArrays(GL.GL_TRIANGLES, 0, 3)
    frame += 1
    ultimo = args.frames and frame >= args.frames
    if ultimo and args.captura:                                # leer el buffer trasero ANTES del swap
        GL.glPixelStorei(GL.GL_PACK_ALIGNMENT, 1)
        px = bytes(GL.glReadPixels(0, 0, ancho, alto, GL.GL_RGBA, GL.GL_UNSIGNED_BYTE))
        filas = b"".join(px[y * ancho * 4:(y + 1) * ancho * 4] for y in reversed(range(alto)))
        guardar_png(args.captura, ancho, alto, filas)
        print("captura guardada:", args.captura, f"({ancho}×{alto})")
    glfw.swap_buffers(ventana)                                 # muestra el frame (espera al vsync)
    glfw.poll_events()                                         # procesa teclado, ratón, redimensionado...
    cuenta += 1
    if ahora - t_fps >= 1.0:
        glfw.set_window_title(ventana, f"GPU real desde Python — {cuenta / (ahora - t_fps):.0f} fps")
        cuenta, t_fps = 0, ahora
    if ultimo:
        break
glfw.terminate()
