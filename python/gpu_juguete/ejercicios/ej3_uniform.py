"""Ejercicio 4.3.3 — Añade un uniform.

Añade al programa un uniform `u_angulo` (float, en radianes) y úsalo en el vertex shader
para GIRAR el triángulo alrededor del origen:

    x' = x·cos(θ) − y·sin(θ)
    y' = x·sin(θ) + y·cos(θ)

Después dibuja el MISMO VAO cuatro veces, cada una en su viewport de 128 × 128 dentro de
un framebuffer de 512 × 128, con u_angulo = 0, π/6, π/3 y π/2. Son 4 draw calls: entre una
y otra solo cambian dos piezas de estado (el viewport y el valor del uniform).

Ejecuta:  python ejercicios/ej3_uniform.py   → img/ej3-uniform.png
Solución: soluciones/ej3_uniform.py
"""
import math
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gpu  # noqa: E402
from rutas import carpeta_img  # noqa: E402

vbo = gpu.Buffer(struct.pack("<15f", -0.75, -0.75, 1, 0, 0, 0.75, -0.75, 0, 1, 0, 0.0, 0.75, 0, 0, 1))
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=20, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=20, offset=8))


def vertex_shader(a, u):
    x, y = a["a_pos"]
    # TODO: gira (x, y) con u["u_angulo"]
    return (x, y, 0.0, 1.0), {"v_color": a["a_color"]}


def fragment_shader(v, u, frag):
    return (*v["v_color"], 1.0)


prog = gpu.Programa(vertex_shader, fragment_shader,
                    atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec3")},
                    uniforms={})                              # TODO: declara u_angulo aquí
fb = gpu.Framebuffer(512, 128)
fb.limpiar((0.08, 0.09, 0.12, 1.0))
estado = gpu.EstadoFijo()
# TODO: 4 draw calls, cada una con su estado.viewport y su valor de u_angulo
gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 3, estado)
fb.guardar_png(carpeta_img() / "ej3-uniform.png")
print("guardado img/ej3-uniform.png")
