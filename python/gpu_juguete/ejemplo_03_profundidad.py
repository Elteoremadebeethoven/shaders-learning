"""Ejemplo 3: el z-buffer. Dos triángulos que se atraviesan.

El rojo está inclinado (z va de -0.6 a la izquierda a +0.6 a la derecha, en NDC);
el azul es plano (z = 0) y se dibuja DESPUÉS.

Ejecuta:  python ejemplo_03_profundidad.py
Genera:   img/juguete-sin-profundidad.png, img/juguete-con-profundidad.png, img/juguete-zbuffer.png
"""
import struct

import gpu
from rutas import carpeta_img

# x, y, z, r, g, b  (z en NDC: -1 cerca ... +1 lejos)
datos = [
    (-0.9, -0.7, -0.6, 1.0, 0.35, 0.3), (0.9, -0.7, 0.6, 1.0, 0.35, 0.3), (0.0, 0.9, 0.0, 1.0, 0.35, 0.3),  # rojo
    (-0.7, 0.7, 0.0, 0.3, 0.6, 1.0), (-0.1, -0.9, 0.0, 0.3, 0.6, 1.0), (0.9, 0.3, 0.0, 0.3, 0.6, 1.0),      # azul
]
vbo = gpu.Buffer(b"".join(struct.pack("<6f", *v) for v in datos))
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=24, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=24, offset=12))
prog = gpu.Programa(lambda a, u: ((*a["a_pos"], 1.0), {"v_color": a["a_color"]}),
                    lambda v, u, f: (*v["v_color"], 1.0),
                    atributos={"a_pos": (0, "vec3"), "a_color": (1, "vec3")})

for profundidad in (False, True):
    fb = gpu.Framebuffer(240, 240)
    fb.limpiar((0.08, 0.09, 0.12, 1.0))              # también pone el z-buffer a 1.0
    estado = gpu.EstadoFijo()
    estado.depth_test = profundidad                  # gl.enable(gl.DEPTH_TEST)
    est = gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 6, estado)
    nombre = "juguete-con-profundidad.png" if profundidad else "juguete-sin-profundidad.png"
    fb.guardar_png(carpeta_img() / nombre)
    print(f"{nombre:30s} {est}")

# El z-buffer como imagen: negro = cerca (0), blanco = lejos (1, el valor de "limpio").
zb = gpu.Framebuffer(fb.ancho, fb.alto)
for i, z in enumerate(fb.profundidad):
    zb.color[i * 4:i * 4 + 4] = bytes((gpu.a_byte(z),) * 3 + (255,))
zb.guardar_png(carpeta_img() / "juguete-zbuffer.png")
print("z en el centro del píxel (60, 120):", round(fb.profundidad[120 * fb.ancho + 60], 4),
      "| (180, 120):", round(fb.profundidad[120 * fb.ancho + 180], 4))
