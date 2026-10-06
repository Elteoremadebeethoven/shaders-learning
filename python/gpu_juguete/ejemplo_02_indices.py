"""Ejemplo 2: índices (EBO) y la caché post-transformación.

A) Un quad: 6 vértices sin índices contra 4 vértices + 6 índices.
B) Una rejilla de 16×16 quads: ¿cuántas veces se ejecuta el vertex shader según el
   tamaño de la caché y el ORDEN de los índices?

Ejecuta:  python ejemplo_02_indices.py
Genera:   img/juguete-quad-indices.png
"""
import random
import struct

import gpu
from rutas import carpeta_img


def vs(a, u):
    x, y = a["a_pos"]
    return (x, y, 0.0, 1.0), {"v_uv": a["a_uv"]}


def fs(v, u, frag):
    s, t = v["v_uv"]
    borde = min(s, t, 1 - s, 1 - t) < 0.02
    return (1.0, 0.8, 0.3, 1.0) if borde else (s, t, 0.6, 1.0)


prog = gpu.Programa(vs, fs, atributos={"a_pos": (0, "vec2"), "a_uv": (1, "vec2")})


def vao_para(vbo, ebo=None):
    vao = gpu.VAO()
    vao.configurar(0, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=16, offset=0))
    vao.configurar(1, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=16, offset=8))
    vao.elementos = ebo
    return vao


# ---------------------------------------------------------------- A) el quad
esquinas = {0: (-0.8, -0.8, 0, 0), 1: (0.8, -0.8, 1, 0), 2: (0.8, 0.8, 1, 1), 3: (-0.8, 0.8, 0, 1)}
sin_indices = gpu.Buffer(b"".join(struct.pack("<4f", *esquinas[i]) for i in (0, 1, 2, 0, 2, 3)))
con_indices = gpu.Buffer(b"".join(struct.pack("<4f", *esquinas[i]) for i in range(4)))
ebo = gpu.Buffer(struct.pack("<6H", 0, 1, 2, 0, 2, 3))

fb = gpu.Framebuffer(200, 200)
est_a = gpu.dibujar_arrays(fb, prog, vao_para(sin_indices), gpu.TRIANGLES, 0, 6)
fb2 = gpu.Framebuffer(200, 200)
est_e = gpu.dibujar_elementos(fb2, prog, vao_para(con_indices, ebo), gpu.TRIANGLES, 6, gpu.UNSIGNED_SHORT, 0)
print("A) quad")
print(f"   drawArrays:   VBO {len(sin_indices)} bytes                    → vertex shader × {est_a.invocaciones_vs}")
print(f"   drawElements: VBO {len(con_indices)} bytes + EBO {len(ebo)} bytes = {len(con_indices) + len(ebo)} → "
      f"vertex shader × {est_e.invocaciones_vs} (aciertos de caché: {est_e.aciertos_cache})")
print("   ¿misma imagen?", fb.color == fb2.color)
fb2.guardar_png(carpeta_img() / "juguete-quad-indices.png")

# ---------------------------------------------------------------- B) la rejilla
N = 16
vertices = b"".join(struct.pack("<4f", -1 + 2 * i / N, -1 + 2 * j / N, i / N, j / N)
                    for j in range(N + 1) for i in range(N + 1))
triangulos = []
for j in range(N):
    for i in range(N):
        a = j * (N + 1) + i
        triangulos += [(a, a + 1, a + N + 2), (a, a + N + 2, a + N + 1)]
print(f"\nB) rejilla {N}×{N}: {(N + 1) ** 2} vértices distintos, {len(triangulos)} triángulos, "
      f"{3 * len(triangulos)} índices")


def invocaciones(orden, cache):
    idx = [i for t in orden for i in t]
    ebo = gpu.Buffer(struct.pack(f"<{len(idx)}H", *idx))
    estado = gpu.EstadoFijo()
    estado.cache_vertices = cache
    est = gpu.dibujar_elementos(gpu.Framebuffer(64, 64), prog, vao_para(gpu.Buffer(vertices), ebo),
                                gpu.TRIANGLES, len(idx), gpu.UNSIGNED_SHORT, 0, estado)
    return est.invocaciones_vs


barajados = triangulos[:]
random.Random(1).shuffle(barajados)
print("   caché (entradas) | por filas: VS   VS/triángulo | barajados: VS   VS/triángulo")
for cache in (0, 4, 8, 16, 32, 10_000):
    f, b = invocaciones(triangulos, cache), invocaciones(barajados, cache)
    nombre = "∞" if cache > 1000 else str(cache)
    print(f"   {nombre:>16} | {f:12d}   {f / len(triangulos):5.2f}        | {b:11d}   {b / len(triangulos):5.2f}")
