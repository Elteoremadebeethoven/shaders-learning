"""Ejemplo 7: el MISMO quad con tres distribuciones de memoria distintas.

Cada vértice: posición (2 × float32 = 8 bytes) + color (4 × uint8 normalizado = 4 bytes).

  a) entrelazado (AoS):          [x y r g b a][x y r g b a]...      stride 12
  b) dos buffers (SoA):          [x y][x y]...  y  [r g b a][r g b a]...
  c) un buffer, por bloques:     [x y][x y][x y][x y][r g b a]...    offset del color = 32

Ejecuta:  python ejemplo_07_formatos.py
Genera:   img/juguete-formatos.png, img/juguete-sin-normalizar.png
"""
import struct

import gpu
from rutas import carpeta_img
from volcado import volcado_hex, volcado_vertices

pos = [(-0.8, -0.8), (0.8, -0.8), (0.8, 0.8), (-0.8, 0.8)]
col = [(255, 64, 32, 255), (32, 200, 64, 255), (40, 90, 255, 255), (255, 220, 40, 255)]
indices = gpu.Buffer(struct.pack("<6H", 0, 1, 2, 0, 2, 3))

prog = gpu.Programa(lambda a, u: ((*a["a_pos"], 0.0, 1.0), {"v_color": a["a_color"]}),
                    lambda v, u, f: v["v_color"],
                    atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec4")})


def dibujar(vao, nombre=None):
    vao.elementos = indices
    fb = gpu.Framebuffer(120, 120)
    gpu.dibujar_elementos(fb, prog, vao, gpu.TRIANGLES, 6, gpu.UNSIGNED_SHORT, 0)
    if nombre:
        fb.guardar_png(carpeta_img() / nombre)
    return fb.color


# a) entrelazado: struct "<2f4B" = 2 floats + 4 bytes sin signo = 12 bytes
entrelazado = gpu.Buffer(b"".join(struct.pack("<2f4B", *p, *c) for p, c in zip(pos, col)))
print("a) entrelazado,", len(entrelazado), "bytes")
print(volcado_vertices(entrelazado.datos, 12, [("xy", 0, 8), ("rgba", 8, 4)]))
vao_a = gpu.VAO()
vao_a.configurar(0, gpu.Atributo(entrelazado, 2, gpu.FLOAT, stride=12, offset=0))
vao_a.configurar(1, gpu.Atributo(entrelazado, 4, gpu.UNSIGNED_BYTE, normalizado=True, stride=12, offset=8))
img_a = dibujar(vao_a, "juguete-formatos.png")

# b) dos buffers separados (stride 0 = empaquetado)
posiciones = gpu.Buffer(b"".join(struct.pack("<2f", *p) for p in pos))
colores = gpu.Buffer(bytes(c for rgba in col for c in rgba))
print("\nb) dos buffers:", len(posiciones), "+", len(colores), "bytes")
print("posiciones:\n" + volcado_hex(posiciones.datos) + "\ncolores:\n" + volcado_hex(colores.datos))
vao_b = gpu.VAO()
vao_b.configurar(0, gpu.Atributo(posiciones, 2, gpu.FLOAT))                        # stride 0 → 8
vao_b.configurar(1, gpu.Atributo(colores, 4, gpu.UNSIGNED_BYTE, normalizado=True))  # stride 0 → 4
img_b = dibujar(vao_b)

# c) un solo buffer: primero todas las posiciones, luego todos los colores
bloques = gpu.Buffer(posiciones.datos + colores.datos)
vao_c = gpu.VAO()
vao_c.configurar(0, gpu.Atributo(bloques, 2, gpu.FLOAT, offset=0))
vao_c.configurar(1, gpu.Atributo(bloques, 4, gpu.UNSIGNED_BYTE, normalizado=True, offset=len(posiciones)))
img_c = dibujar(vao_c)
print("\n¿las tres imágenes son idénticas?", img_a == img_b == img_c)

# Lo que recibe el vertex shader del vértice 0 (conversión de UNSIGNED_BYTE normalizado)
print("a_color del vértice 0 =", vao_a.atributos[1].leer(0), " ← 64/255 =", 64 / 255)

# El despiste clásico: olvidar normalized=true → 255 llega como 255.0 (¡blanco saturado!)
vao_mal = gpu.VAO()
vao_mal.configurar(0, gpu.Atributo(entrelazado, 2, gpu.FLOAT, stride=12, offset=0))
vao_mal.configurar(1, gpu.Atributo(entrelazado, 4, gpu.UNSIGNED_BYTE, normalizado=False, stride=12, offset=8))
print("sin normalizar, a_color del vértice 0 =", vao_mal.atributos[1].leer(0))
dibujar(vao_mal, "juguete-sin-normalizar.png")

# Otro clásico: stride en "número de valores" en vez de en BYTES (3 en vez de 12)
vao_roto = gpu.Atributo(entrelazado, 2, gpu.FLOAT, stride=3, offset=0)
print("stride = 3 (¡en bytes!): posición del vértice 1 =", vao_roto.leer(1))
