"""SOLUCIÓN del ejercicio 4.6.3 — El cubo de 4.3 en la GPU real, con profundidad y culling.

Ejecuta:  python moderngl/soluciones/ej3_cubo.py   → img/ej-moderngl-cubo.png
"""
import math
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "gpu_juguete"))
import matrices as M  # noqa: E402
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        in vec3 a_pos;
        in vec3 a_color;
        uniform mat4 u_mvp;
        out vec3 v_color;
        void main() { v_color = a_color; gl_Position = u_mvp * vec4(a_pos, 1.0); }
    """,
    fragment_shader="""
        #version 330 core
        in vec3 v_color;
        out vec4 fragColor;
        void main() { fragColor = vec4(v_color, 1.0); }
    """,
)
# El mismo cubo que gpu_juguete/ejercicios/ej2_culling.py: 6 caras × 2 triángulos, CCW desde fuera
V = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]
caras = [((4, 5, 6, 7), (1.0, 0.35, 0.3)), ((1, 0, 3, 2), (0.3, 0.8, 0.4)), ((5, 1, 2, 6), (0.35, 0.55, 1.0)),
         ((0, 4, 7, 3), (1.0, 0.8, 0.3)), ((7, 6, 2, 3), (0.8, 0.4, 1.0)), ((0, 1, 5, 4), (0.3, 0.9, 0.9))]
datos = b"".join(struct.pack("<6f", *V[i], *color) for (a, b, c, d), color in caras for i in (a, b, c, a, c, d))
vao = ctx.vertex_array(prog, [(ctx.buffer(datos), "3f 3f", "a_pos", "a_color")])
prog["u_mvp"].value = M.producto(M.perspectiva(math.radians(50), 1.0, 0.1, 50.0), M.traslacion(0, 0, -6),
                                 M.rotacion_x(math.radians(25)), M.rotacion_y(math.radians(35)))
fbo = ctx.simple_framebuffer((200, 200))                          # color + PROFUNDIDAD (renderbuffer)
fbo.use()
fbo.clear(0.08, 0.09, 0.12, 1.0, depth=1.0)                       # limpia también el z-buffer
ctx.enable(moderngl.DEPTH_TEST | moderngl.CULL_FACE)             # glEnable(GL_DEPTH_TEST); glEnable(GL_CULL_FACE)
ctx.cull_face = "back"                                            # glCullFace(GL_BACK) (el valor por defecto)
vao.render(moderngl.TRIANGLES)
img = Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
img.save(carpeta_img() / "ej-moderngl-cubo.png")
print("guardado img/ej-moderngl-cubo.png")
juguete = carpeta_img() / "ej2-culling-solucion.png"
if juguete.exists():
    ref = Image.open(juguete).convert("RGB")
    dif = sum(1 for a, b in zip(img.convert("RGB").get_flattened_data() if hasattr(img, "get_flattened_data") else img.convert("RGB").getdata(),
                                ref.get_flattened_data() if hasattr(ref, "get_flattened_data") else ref.getdata()) if a != b)
    print(f"píxeles distintos respecto al cubo de la GPU de juguete (solo culling, sin profundidad): {dif} de {200 * 200}")
