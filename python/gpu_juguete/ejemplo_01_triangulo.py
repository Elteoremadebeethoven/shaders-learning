"""Ejemplo 1: el triángulo de colores, de los bytes al PNG.

Ejecuta:  python ejemplo_01_triangulo.py
Genera:   modulos/04-gpu/img/juguete-triangulo.png
"""
import struct

import gpu
from rutas import carpeta_img
from volcado import volcado_hex, volcado_vertices

# 1. Los datos en la CPU: 3 vértices, cada uno con posición (x, y) y color (r, g, b).
vertices = [
    # x      y      r    g    b
    (-0.75, -0.75, 1.0, 0.0, 0.0),   # abajo a la izquierda: rojo
    ( 0.75, -0.75, 0.0, 1.0, 0.0),   # abajo a la derecha:   verde
    ( 0.00,  0.75, 0.0, 0.0, 1.0),   # arriba:               azul
]

# 2. El VBO: empaquetamos todo en bytes. '<' = little-endian, 'f' = float32 (4 bytes).
#    5 floats por vértice → 20 bytes por vértice → stride = 20.
vbo = gpu.Buffer(b"".join(struct.pack("<5f", *v) for v in vertices))
print(f"VBO: {len(vbo)} bytes")
print(volcado_hex(vbo.datos, por_fila=20))
print(volcado_vertices(vbo.datos, 20, [("pos", 0, 8), ("color", 8, 12)]))

# 3. El VAO: cómo leer cada atributo de esos bytes.
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, size=2, tipo=gpu.FLOAT, stride=20, offset=0))   # a_pos
vao.configurar(1, gpu.Atributo(vbo, size=3, tipo=gpu.FLOAT, stride=20, offset=8))   # a_color


# 4. Los shaders: funciones de Python.
def vertex_shader(a, u):
    x, y = a["a_pos"]
    return (x, y, 0.0, 1.0), {"v_color": a["a_color"]}    # gl_Position, varyings


def fragment_shader(v, u, frag):
    r, g, b = v["v_color"]
    return (r, g, b, 1.0)                                  # fragColor


programa = gpu.Programa(vertex_shader, fragment_shader,
                        atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec3")})

# 5. El framebuffer y la orden de dibujo.
fb = gpu.Framebuffer(256, 256)
fb.limpiar((0.08, 0.09, 0.12, 1.0))

traza = []


def trazar(evento, datos):
    if evento == "vertice":
        print(f"vertex shader #{datos['indice']}: entrada={datos['entrada']} → gl_Position={datos['gl_Position']}")
    elif evento == "fragmento" and len(traza) < 4:
        traza.append(datos)


est = gpu.dibujar_arrays(fb, programa, vao, gpu.TRIANGLES, 0, 3, trazar=trazar)
print("estadísticas:", est)
for d in traza:
    l0, l1, l2 = d["lambda"]
    r, g, b, a = d["color"]
    print(f"fragmento ({d['x']:3d},{d['y']:3d})  λ=({l0:.3f}, {l1:.3f}, {l2:.3f})  color=({r:.3f}, {g:.3f}, {b:.3f})")
print("píxel del centro (128, 100):", fb.leer(128, 100))

ruta = carpeta_img() / "juguete-triangulo.png"
fb.guardar_png(ruta)
print("guardado:", ruta)
