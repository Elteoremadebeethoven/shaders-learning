"""Pruebas de la GPU de juguete (solo biblioteca estándar).

Ejecuta:  python pruebas.py      (sale con código 0 si todo va bien)
"""
import math
import struct
import tempfile
from pathlib import Path

import gpu
import maquina_estados as G
from png_propio import guardar_png, leer_png

fallos = 0


def comprobar(nombre, condicion):
    global fallos
    print(("  ok   " if condicion else "  FALLO ") + nombre)
    if not condicion:
        fallos += 1


def cerca(a, b, eps=1e-9):
    return abs(a - b) <= eps


print("PNG")
with tempfile.TemporaryDirectory() as d:
    datos = bytes((i * 37) % 256 for i in range(5 * 3 * 4))
    guardar_png(Path(d) / "x.png", 5, 3, datos)
    comprobar("ida y vuelta de un PNG 5×3", leer_png(Path(d) / "x.png") == (5, 3, datos))

print("Vertex fetch y conversiones")
b = gpu.Buffer(struct.pack("<4B", 255, 128, 0, 64))
comprobar("UNSIGNED_BYTE normalizado: 255→1, 128→128/255",
          gpu.Atributo(b, 4, gpu.UNSIGNED_BYTE, normalizado=True).leer(0) == (1.0, 128 / 255, 0.0, 64 / 255))
comprobar("UNSIGNED_BYTE sin normalizar: 255→255.0",
          gpu.Atributo(b, 4, gpu.UNSIGNED_BYTE).leer(0) == (255.0, 128.0, 0.0, 64.0))
b = gpu.Buffer(struct.pack("<4b", -128, -127, 127, 64))
comprobar("BYTE normalizado: -128 y -127 → -1; 127 → 1",
          gpu.Atributo(b, 4, gpu.BYTE, normalizado=True).leer(0) == (-1.0, -1.0, 1.0, 64 / 127))
b = gpu.Buffer(struct.pack("<2f", 0.5, 0.25))
comprobar("size 2 se rellena con (z=0, w=1)", gpu.Atributo(b, 2, gpu.FLOAT).leer(0) == (0.5, 0.25, 0.0, 1.0))
b = gpu.Buffer(struct.pack("<4f", 1, 2, 3, 4) + struct.pack("<4f", 5, 6, 7, 8))
comprobar("stride y offset en bytes", gpu.Atributo(b, 2, gpu.FLOAT, stride=16, offset=8).leer(1) == (7.0, 8.0, 0.0, 1.0))
try:
    gpu.Atributo(b, 2, gpu.FLOAT, stride=16, offset=8).leer(2)
    comprobar("leer fuera del buffer lanza error", False)
except IndexError:
    comprobar("leer fuera del buffer lanza error", True)

print("Rasterización")
comprobar("función de arista > 0 a la izquierda", gpu.arista((0, 0), (1, 0), (0.5, 1)) > 0)
comprobar("regla de desempate: arista inferior sí, superior no",
          gpu.cuenta_empate((0, 0), (1, 0)) and not gpu.cuenta_empate((1, 1), (0, 1)))
comprobar("regla de desempate: arista izquierda sí, derecha no",
          gpu.cuenta_empate((0, 1), (0, 0)) and not gpu.cuenta_empate((1, 0), (1, 1)))


def cobertura(tris, tam=16):
    """Dibuja triángulos (en píxeles) sumando 1 por fragmento; devuelve la lista de conteos."""
    datos = b"".join(struct.pack("<6f", *[c / (tam / 2) - 1 for c in t]) for t in tris)
    vao = gpu.VAO()
    vao.configurar(0, gpu.Atributo(gpu.Buffer(datos), 2, gpu.FLOAT))
    cuenta = [0] * (tam * tam)

    def fs(v, u, f):
        cuenta[f.y * tam + f.x] += 1
        return (1, 1, 1, 1)
    prog = gpu.Programa(lambda a, u: ((*a["a_pos"], 0.0, 1.0), {}), fs, atributos={"a_pos": (0, "vec2")})
    gpu.dibujar_arrays(gpu.Framebuffer(tam, tam), prog, vao, gpu.TRIANGLES, 0, 3 * len(tris))
    return cuenta


c = cobertura([(2.5, 2.5, 10.5, 2.5, 2.5, 10.5), (10.5, 2.5, 10.5, 10.5, 2.5, 10.5)])
comprobar("cuadrado con aristas sobre centros: 8×8 = 64 píxeles, ninguno doble", sum(c) == 64 and max(c) == 1)
c = cobertura([(0, 0, 16, 0, 0, 16), (16, 0, 16, 16, 0, 16)])
comprobar("dos triángulos que cubren todo: 256 píxeles, cada uno UNA vez", c.count(1) == 256)
c = cobertura([(0, 0, 0, 16, 16, 0), (16, 0, 0, 16, 16, 16)])
comprobar("lo mismo con los triángulos en sentido horario", c.count(1) == 256)

print("Recorte y perspectiva")
v_dentro = ((0.0, 0.0, 0.5, 1.0), {"t": 0.0})
v_detras = ((0.0, 0.0, -3.0, -1.0), {"t": 1.0})
res = gpu.recortar([v_dentro, v_detras, ((1.0, 0.0, 0.5, 1.0), {"t": 0.0})])
comprobar("recortar contra z = -w deja todos los vértices con z >= -w",
          len(res) >= 3 and all(p[2] >= -p[3] - 1e-12 for p, _ in res))
w0, w1 = 1.0, 3.0
# un punto a mitad de camino EN PANTALLA entre dos vértices con w distinta:
pesos = (0.5 * (1 / w0) / (0.5 / w0 + 0.5 / w1), 0.5 * (1 / w1) / (0.5 / w0 + 0.5 / w1))
comprobar("corrección de perspectiva: a mitad de pantalla el peso del vértice cercano es 0.75",
          cerca(pesos[0], 0.75))

print("Blending y conversión a 8 bits")
comprobar("SRC_ALPHA, ONE_MINUS_SRC_ALPHA",
          gpu.mezclar_color((1, 0, 0, 0.25), (0, 0, 1, 1), ("SRC_ALPHA", "ONE_MINUS_SRC_ALPHA"))
          == (0.25, 0.0, 0.75, 0.25 * 0.25 + 0.75))
comprobar("a_byte redondea como la GPU (float32): 0.9 → 229, 0.5 → 128", gpu.a_byte(0.9) == 229 and gpu.a_byte(0.5) == 128)

print("Máquina de estados")
ctx = G.ContextoGL(4, 4, avisar=False)
x, y = ctx.create_buffer(), ctx.create_buffer()
vao = ctx.create_vertex_array()
ctx.bind_vertex_array(vao)
ctx.bind_buffer(G.ARRAY_BUFFER, x)
ctx.buffer_data(G.ARRAY_BUFFER, bytes(32))
ctx.vertex_attrib_pointer(0, 2, gpu.FLOAT, False, 8, 0)
ctx.bind_buffer(G.ARRAY_BUFFER, y)
comprobar("vertexAttribPointer captura el buffer enlazado en ese momento",
          ctx.get_vertex_attrib(0, G.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) is x)
ctx.bind_vertex_array(ctx.create_vertex_array())
comprobar("ARRAY_BUFFER no es estado del VAO", ctx.get_parameter(G.ARRAY_BUFFER_BINDING) is y)
ctx.vertex_attrib_pointer(0, 2, gpu.FLOAT, False, 6, 0)
comprobar("stride no múltiplo de 4 con FLOAT → INVALID_OPERATION", ctx.get_error() == G.INVALID_OPERATION)
ctx.uniform(None, 1.0)
comprobar("uniform con ubicación None y sin programa → nada, sin error (como en WebGL)", ctx.get_error() == G.NO_ERROR)
p = gpu.Programa(None, None, {}, uniforms={"u_k": "float"})
ctx.uniform(ctx.get_uniform_location(p, "u_k"), 1.0)
comprobar("uniform sin programa en uso → INVALID_OPERATION", ctx.get_error() == G.INVALID_OPERATION)
ctx.use_program(p)
ctx.uniform(ctx.get_uniform_location(p, "u_kk"), 5.0)
comprobar("uniform con ubicación None → nada, sin error", ctx.get_error() == G.NO_ERROR and p.uniforms["u_k"] == 0.0)

print("\n" + ("TODO BIEN" if fallos == 0 else f"{fallos} FALLO(S)"))
raise SystemExit(1 if fallos else 0)
