"""SOLUCIÓN del ejercicio 4.6.2 — Un quad con buffer de índices en moderngl.

Parte de 01_triangulo.py y dibuja un quad (4 vértices, 6 índices) con un EBO.

Ejecuta:  python moderngl/soluciones/ej2_quad_indices.py   → img/ej-moderngl-quad.png
"""
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "gpu_juguete"))
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        in vec2 a_pos;
        in vec3 a_color;
        out vec3 v_color;
        void main() { v_color = a_color; gl_Position = vec4(a_pos, 0.0, 1.0); }
    """,
    fragment_shader="""
        #version 330 core
        in vec3 v_color;
        out vec4 fragColor;
        void main() { fragColor = vec4(v_color, 1.0); }
    """,
)
# 4 vértices (x, y, r, g, b): las esquinas del quad, cada una UNA vez
vertices = struct.pack("<20f",
                       -0.8, -0.8, 1.0, 0.25, 0.1,
                        0.8, -0.8, 0.1, 0.8, 0.25,
                        0.8,  0.8, 0.15, 0.35, 1.0,
                       -0.8,  0.8, 1.0, 0.85, 0.15)
indices = struct.pack("<6H", 0, 1, 2, 0, 2, 3)          # dos triángulos CCW, índices de 2 bytes
vbo = ctx.buffer(vertices)
ibo = ctx.buffer(indices)
vao = ctx.vertex_array(prog, [(vbo, "2f 3f", "a_pos", "a_color")],
                       index_buffer=ibo, index_element_size=2)   # 2 = UNSIGNED_SHORT
print("vértices que dibujará vao.render():", vao.vertices, "(con índices: el número de índices)")
fbo = ctx.simple_framebuffer((200, 200))
fbo.use()
fbo.clear(0.08, 0.09, 0.12, 1.0)
vao.render(moderngl.TRIANGLES)                                    # glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0)
Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM) \
    .save(carpeta_img() / "ej-moderngl-quad.png")
print("guardado img/ej-moderngl-quad.png")
