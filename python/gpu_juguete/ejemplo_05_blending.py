"""Ejemplo 5: blending. El orden importa... salvo cuando no.

Tres triángulos semitransparentes (alfa 0.6) dibujados en dos órdenes con la mezcla
"normal" (SRC_ALPHA, ONE_MINUS_SRC_ALPHA) y con mezcla aditiva (ONE, ONE).

Ejecuta:  python ejemplo_05_blending.py
Genera:   img/juguete-blending.png (4 paneles: normal RGB, normal BGR, aditiva RGB, aditiva BGR)
"""
import math
import struct

import gpu
from rutas import carpeta_img


def tri(cx, cy, r, color):
    pts = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in (math.pi / 2, math.pi * 7 / 6, math.pi * 11 / 6)]
    return b"".join(struct.pack("<2f4f", x, y, *color) for x, y in pts)


rojo, verde, azul = (1.0, 0.25, 0.2, 0.6), (0.2, 0.9, 0.3, 0.6), (0.25, 0.4, 1.0, 0.6)
piezas = {"R": tri(-0.25, 0.1, 0.62, rojo), "G": tri(0.25, 0.1, 0.62, verde), "B": tri(0.0, -0.3, 0.62, azul)}

prog = gpu.Programa(lambda a, u: ((*a["a_pos"], 0.0, 1.0), {"v_color": a["a_color"]}),
                    lambda v, u, f: v["v_color"],
                    atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec4")})

hoja = gpu.Framebuffer(4 * 160 + 30, 160)
hoja.limpiar((1, 1, 1, 1))
for k, (func, orden) in enumerate([(("SRC_ALPHA", "ONE_MINUS_SRC_ALPHA"), "RGB"),
                                   (("SRC_ALPHA", "ONE_MINUS_SRC_ALPHA"), "BGR"),
                                   (("ONE", "ONE"), "RGB"), (("ONE", "ONE"), "BGR")]):
    vbo = gpu.Buffer(b"".join(piezas[c] for c in orden))
    vao = gpu.VAO()
    vao.configurar(0, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=24, offset=0))
    vao.configurar(1, gpu.Atributo(vbo, 4, gpu.FLOAT, stride=24, offset=8))
    fb = gpu.Framebuffer(160, 160)
    fb.limpiar((0.08, 0.09, 0.12, 1.0))
    estado = gpu.EstadoFijo()
    estado.blend, estado.blend_func = True, func
    gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 9, estado)
    print(f"{func[0]:>9s}, {func[1]:<20s} orden {orden}: píxel del centro (80, 80) = {fb.leer(80, 80)}")
    # ¡Ojo! El alfa del framebuffer TAMBIÉN se mezcla (aquí el centro queda con alfa < 255).
    # Al copiar el panel a la hoja lo forzamos a 255, como un canvas con alpha: false.
    for y in range(160):
        d = (y * hoja.ancho + k * 170) * 4
        fila = bytearray(fb.color[y * 640:(y + 1) * 640])
        fila[3::4] = b"\xff" * 160
        hoja.color[d:d + 640] = fila
hoja.guardar_png(carpeta_img() / "juguete-blending.png")
