"""02_buffers_y_vao.py — qué hay en un VBO y qué guarda un VAO, en la GPU real.

  1. Empaquetamos un quad entrelazado: posición (2 × float32) + color (4 × uint8) = 12 bytes.
  2. Lo subimos (ctx.buffer) y lo LEEMOS de vuelta de la GPU (buffer.read): mismos bytes.
  3. Creamos el VAO con el formato "2f 4f1" y le preguntamos al driver (con PyOpenGL,
     en el MISMO contexto) qué ha guardado exactamente para cada atributo.
  4. Un atributo que el shader no usa: el enlazador lo elimina y moderngl lanza KeyError.

Ejecuta:  python moderngl/02_buffers_y_vao.py
Genera:   modulos/04-gpu/img/moderngl-quad.png
"""
import struct
import sys
from pathlib import Path

import moderngl
import numpy as np
import OpenGL
OpenGL.ERROR_CHECKING = False
from OpenGL import GL  # noqa: E402
from PIL import Image  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from rutas import carpeta_img  # noqa: E402
from volcado import volcado_vertices  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        in vec2 a_pos;
        in vec4 a_color;          // llega como float: los bytes se normalizan a 0..1
        out vec4 v_color;
        void main() { v_color = a_color; gl_Position = vec4(a_pos, 0.0, 1.0); }
    """,
    fragment_shader="""
        #version 330 core
        in vec4 v_color; out vec4 fragColor;
        void main() { fragColor = v_color; }
    """,
)
print("locations asignadas por el enlazador:", {n: prog[n].location for n in ("a_pos", "a_color")})

# 1. Los bytes: 4 vértices × 12 bytes (el mismo quad que gpu_juguete/ejemplo_07_formatos.py)
pos = [(-0.8, -0.8), (0.8, -0.8), (0.8, 0.8), (-0.8, 0.8)]
col = [(255, 64, 32, 255), (32, 200, 64, 255), (40, 90, 255, 255), (255, 220, 40, 255)]
datos = b"".join(struct.pack("<2f4B", *p, *c) for p, c in zip(pos, col))
indices = struct.pack("<6H", 0, 1, 2, 0, 2, 3)

# 2. Subir y leer de vuelta
vbo = ctx.buffer(datos)                                      # glBufferData(GL_ARRAY_BUFFER, ...)
ebo = ctx.buffer(indices)
print(f"VBO: {vbo.size} bytes | ¿lo que devuelve la GPU es idéntico? {vbo.read() == datos}")
print(volcado_vertices(vbo.read(), 12, [("xy", 0, 8), ("rgba", 8, 4)]))

# 3. El VAO: "2f" = 2 × float32; "4f1" = 4 × 1 byte que el shader verá como float (normalizado)
vao = ctx.vertex_array(prog, [(vbo, "2f 4f1", "a_pos", "a_color")], index_buffer=ebo, index_element_size=2)

GL.glBindVertexArray(vao.glo)                                # vao.glo = el nombre OpenGL del VAO
TIPOS = {GL.GL_FLOAT: "FLOAT", GL.GL_UNSIGNED_BYTE: "UNSIGNED_BYTE"}


def q(loc, pname):
    v = np.zeros(4, dtype=np.int32)
    GL.glGetVertexAttribiv(loc, pname, v)
    return int(v[0])


for nombre in ("a_pos", "a_color"):
    loc = prog[nombre].location
    print(f"  {nombre:8s} loc={loc} habilitado={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_ENABLED)} "
          f"size={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_SIZE)} tipo={TIPOS[q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_TYPE)]} "
          f"normalizado={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_NORMALIZED)} stride={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_STRIDE)} "
          f"offset={int(GL.glGetVertexAttribPointerv(loc, GL.GL_VERTEX_ATTRIB_ARRAY_POINTER) or 0)} "
          f"buffer={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)} (vbo.glo={vbo.glo})")
eab = np.zeros(1, dtype=np.int32)
GL.glGetIntegerv(GL.GL_ELEMENT_ARRAY_BUFFER_BINDING, eab)
print(f"  ELEMENT_ARRAY_BUFFER del VAO = {int(eab[0])} (ebo.glo={ebo.glo})")
GL.glBindVertexArray(0)

fbo = ctx.simple_framebuffer((120, 120))
fbo.use()
fbo.clear(0.0, 0.0, 0.0, 1.0)
vao.render(moderngl.TRIANGLES)                               # glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0)
img = Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
img.save(carpeta_img() / "moderngl-quad.png")
print("guardado img/moderngl-quad.png")

# 4. Un atributo sin usar desaparece del programa
prog2 = ctx.program(vertex_shader="""
    #version 330 core
    in vec2 a_pos; in vec4 a_color;          // a_color no se usa...
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }""",
                    fragment_shader="""
    #version 330 core
    out vec4 o; void main() { o = vec4(1.0); }""")
print("miembros de prog2:", list(prog2))
try:
    ctx.vertex_array(prog2, [(vbo, "2f 4f1", "a_pos", "a_color")])
except KeyError as e:
    print("ctx.vertex_array con a_color → KeyError:", e, "(el enlazador lo eliminó)")
vao_ok = ctx.vertex_array(prog2, [(vbo, "2f 4x", "a_pos")])   # "4x" = salta 4 bytes de relleno
print("con '2f 4x' (saltando los bytes del color) funciona: stride =", 12)
