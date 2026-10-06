"""Ejercicio 4.3.1 — Cambia el fragment shader.

Objetivo: que el triángulo se pinte con franjas diagonales de 16 píxeles:
  · franja clara (0.93, 0.90, 0.80) si floor((x + y) / 16) es par,
  · franja del color interpolado v_color si es impar,
donde (x, y) es gl_FragCoord.xy (en Python: frag.coord[0], frag.coord[1]).

Ejecuta:  python ejercicios/ej1_fragment_shader.py   → img/ej1-fragment.png
Solución: soluciones/ej1_fragment_shader.py
"""
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
    return (*a["a_pos"], 0.0, 1.0), {"v_color": a["a_color"]}


def fragment_shader(v, u, frag):
    r, g, b = v["v_color"]
    # TODO: usa frag.coord[0] y frag.coord[1] para decidir la franja
    return (r, g, b, 1.0)


prog = gpu.Programa(vertex_shader, fragment_shader, atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec3")})
fb = gpu.Framebuffer(256, 256)
fb.limpiar((0.08, 0.09, 0.12, 1.0))
print(gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 3))
fb.guardar_png(carpeta_img() / "ej1-fragment.png")
