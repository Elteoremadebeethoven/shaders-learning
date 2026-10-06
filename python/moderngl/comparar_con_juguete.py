"""comparar_con_juguete.py — ¿dibuja la GPU de juguete lo mismo que la GPU real?

Renderiza tres escenas con la GPU de juguete (Python puro) y con la GPU real
(moderngl) y compara píxel a píxel:

  1. el triángulo de colores (interpolación de varyings);
  2. la prueba de la regla de desempate: aristas que pasan EXACTAMENTE por
     centros de píxel, con blending aditivo para detectar píxeles pintados 2 veces;
  3. la pared con damero en perspectiva (matrices, corrección de perspectiva).

Ejecuta:  python moderngl/comparar_con_juguete.py
Genera:   img/comparacion-juguete-real.png (tres filas: juguete | real | diferencias ×40)
"""
import math
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
import gpu  # noqa: E402
import matrices as M  # noqa: E402
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()


def real(vs, fs, datos, formato, nombres, tam, uniforms=None, mezcla_aditiva=False, fondo=(0, 0, 0, 1), n=None):
    prog = ctx.program(vertex_shader=vs, fragment_shader=fs)
    for k, v in (uniforms or {}).items():
        prog[k].value = v
    vbo = ctx.buffer(datos)
    vao = ctx.vertex_array(prog, [(vbo, formato, *nombres)])
    fbo = ctx.simple_framebuffer(tam)
    fbo.use()
    fbo.clear(*fondo)
    if mezcla_aditiva:
        ctx.enable(moderngl.BLEND)
        ctx.blend_func = moderngl.ONE, moderngl.ONE
    else:
        ctx.disable(moderngl.BLEND)
    vao.render(moderngl.TRIANGLES, vertices=n if n is not None else -1)
    datos = fbo.read(components=4)
    for obj in (vao, vbo, fbo, prog):
        obj.release()
    return Image.frombytes("RGBA", tam, datos).transpose(Image.Transpose.FLIP_TOP_BOTTOM)


def a_imagen(fb):
    return Image.frombytes("RGBA", (fb.ancho, fb.alto), fb.filas_de_arriba_abajo())


def comparar(nombre, a, b):
    pa, pb = a.load(), b.load()
    distintos, maximo = 0, 0
    dif = Image.new("RGBA", a.size, (0, 0, 0, 255))
    pd = dif.load()
    for y in range(a.height):
        for x in range(a.width):
            d = max(abs(c1 - c2) for c1, c2 in zip(pa[x, y][:3], pb[x, y][:3]))
            if d:
                distintos += 1
                maximo = max(maximo, d)
                v = min(255, d * 40)
                pd[x, y] = (v, v, v, 255)
    print(f"{nombre:28s} píxeles distintos: {distintos:5d} de {a.width * a.height}  (diferencia máxima: {maximo}/255)")
    return dif


filas = []

# ---------------------------------------------------------------- 1. triángulo
tri = struct.pack("<15f", -0.75, -0.75, 1, 0, 0, 0.75, -0.75, 0, 1, 0, 0.0, 0.75, 0, 0, 1)
vs1 = """#version 330 core
in vec2 a_pos; in vec3 a_color; out vec3 v_color;
void main() { v_color = a_color; gl_Position = vec4(a_pos, 0.0, 1.0); }"""
fs1 = """#version 330 core
in vec3 v_color; out vec4 o; void main() { o = vec4(v_color, 1.0); }"""
img_real = real(vs1, fs1, tri, "2f 3f", ("a_pos", "a_color"), (256, 256), fondo=(0.08, 0.09, 0.12, 1))
vbo = gpu.Buffer(tri)
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=20, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=20, offset=8))
prog = gpu.Programa(lambda a, u: ((*a["a_pos"], 0.0, 1.0), {"v_color": a["a_color"]}),
                    lambda v, u, f: (*v["v_color"], 1.0),
                    atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec3")})
fb = gpu.Framebuffer(256, 256)
fb.limpiar((0.08, 0.09, 0.12, 1.0))
gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 3)
img_jug = a_imagen(fb)
filas.append((img_jug, img_real, comparar("1. triángulo de colores", img_jug, img_real)))

# ---------------------------------------------------------------- 2. regla de desempate
# Coordenadas en píxeles de un framebuffer 32×32 (el vertex shader las pasa a NDC).
# Cada triángulo suma alfa 0.25 con blending aditivo: alfa 64 = pintado una vez,
# 128 = pintado DOS veces (eso no debería pasar nunca en una arista compartida).
def px(*pts):
    return [c / 16.0 - 1.0 for c in pts]


tris = [  # (vértices en píxeles, color)
    (px(4.5, 4.5, 12.5, 4.5, 4.5, 12.5), (0.5, 0, 0)),     # cuadrado con aristas sobre centros...
    (px(12.5, 4.5, 12.5, 12.5, 4.5, 12.5), (0, 0.5, 0)),   # ...partido por la diagonal
    (px(16, 16, 32, 16, 16, 32), (0.5, 0, 0)),             # diagonal x + y = 48: pasa por centros
    (px(32, 16, 32, 32, 16, 32), (0, 0.5, 0)),
    (px(22, 8, 30, 4, 28, 14), (0.5, 0, 0)),               # abanico de 4 triángulos alrededor
    (px(22, 8, 28, 14, 15, 12), (0, 0.5, 0)),              # del vértice compartido (22, 8)
    (px(22, 8, 15, 12, 17, 2), (0, 0, 0.5)),
    (px(22, 8, 17, 2, 30, 4), (0.5, 0.5, 0)),
]
datos = b"".join(struct.pack("<15f", p[0], p[1], *c, p[2], p[3], *c, p[4], p[5], *c) for p, c in tris)
fs2 = """#version 330 core
in vec3 v_color; out vec4 o; void main() { o = vec4(v_color, 0.25); }"""
img_real = real(vs1, fs2, datos, "2f 3f", ("a_pos", "a_color"), (32, 32), mezcla_aditiva=True, fondo=(0, 0, 0, 0))
vbo = gpu.Buffer(datos)
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=20, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=20, offset=8))
prog2 = gpu.Programa(prog.vertex_shader, lambda v, u, f: (*v["v_color"], 0.25),
                     atributos={"a_pos": (0, "vec2"), "a_color": (1, "vec3")})
fb = gpu.Framebuffer(32, 32)
fb.limpiar((0, 0, 0, 0))
estado = gpu.EstadoFijo()
estado.blend, estado.blend_func = True, ("ONE", "ONE")
gpu.dibujar_arrays(fb, prog2, vao, gpu.TRIANGLES, 0, 3 * len(tris), estado)
img_jug = a_imagen(fb)
for nombre, im in (("juguete", img_jug), ("real", img_real)):
    alfas = [im.getpixel((x, y))[3] for y in range(32) for x in range(32)]
    print(f"   {nombre:8s}: píxeles pintados 1 vez = {alfas.count(64)}, 2 veces o más = {sum(1 for a in alfas if a > 64)}")
opacas = [i.copy() for i in (img_jug, img_real)]
for im in opacas:
    im.putalpha(255)
filas.append(tuple(i.resize((256, 256), Image.NEAREST) for i in
                   (opacas[0], opacas[1], comparar("2. regla de desempate", img_jug, img_real))))

# ---------------------------------------------------------------- 3. pared en perspectiva
esq = [(-1, -1, 0, 0, 0), (1, -1, 0, 1, 0), (1, 1, 0, 1, 1), (-1, -1, 0, 0, 0), (1, 1, 0, 1, 1), (-1, 1, 0, 0, 1)]
datos = b"".join(struct.pack("<5f", *v) for v in esq)
mvp = M.producto(M.perspectiva(math.radians(60), 1.0, 0.1, 100.0), M.traslacion(0, 0, -2.3), M.rotacion_y(math.radians(55)))
vs3 = """#version 330 core
in vec3 a_pos; in vec2 a_uv; uniform mat4 u_mvp; out vec2 v_uv;
void main() { v_uv = a_uv; gl_Position = u_mvp * vec4(a_pos, 1.0); }"""
fs3 = """#version 330 core
in vec2 v_uv; out vec4 o;
void main() { float c = mod(floor(v_uv.x * 8.0) + floor(v_uv.y * 8.0), 2.0);
              o = vec4(mix(vec3(0.20, 0.23, 0.34), vec3(0.93, 0.90, 0.80), c), 1.0); }"""
img_real = real(vs3, fs3, datos, "3f 2f", ("a_pos", "a_uv"), (256, 256), uniforms={"u_mvp": mvp})
vbo = gpu.Buffer(datos)
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=20, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=20, offset=12))


def vs_pared(a, u):
    return M.por_vector(u["u_mvp"], (*a["a_pos"], 1.0)), {"v_uv": a["a_uv"]}


def fs_pared(v, u, f):
    c = (math.floor(v["v_uv"][0] * 8) + math.floor(v["v_uv"][1] * 8)) % 2
    return (0.93, 0.90, 0.80, 1.0) if c else (0.20, 0.23, 0.34, 1.0)


prog3 = gpu.Programa(vs_pared, fs_pared, atributos={"a_pos": (0, "vec3"), "a_uv": (1, "vec2")}, uniforms={"u_mvp": "mat4"})
prog3.uniforms["u_mvp"] = mvp
fb = gpu.Framebuffer(256, 256)
fb.limpiar((0, 0, 0, 1))
gpu.dibujar_arrays(fb, prog3, vao, gpu.TRIANGLES, 0, 6)
img_jug = a_imagen(fb)
filas.append((img_jug, img_real, comparar("3. pared en perspectiva", img_jug, img_real)))

# ---------------------------------------------------------------- hoja de resultados
from PIL import ImageDraw, ImageFont  # noqa: E402

hoja = Image.new("RGBA", (3 * 256 + 20, 3 * 256 + 20 + 34), (255, 255, 255, 255))
dibujo = ImageDraw.Draw(hoja)
try:
    fuente = ImageFont.load_default(size=18)
except TypeError:                                  # Pillow antiguo: fuente de mapa de bits
    fuente = ImageFont.load_default()
for i, texto in enumerate(("GPU de juguete (Python)", "GPU real (" + ctx.info["GL_RENDERER"] + ")", "diferencias (x40)")):
    dibujo.text((i * 266 + 128, 17), texto, fill=(30, 34, 46, 255), font=fuente, anchor="mm")
for j, fila in enumerate(filas):
    for i, im in enumerate(fila):
        hoja.paste(im, (i * 266, 34 + j * 266))
ruta = carpeta_img() / "comparacion-juguete-real.png"
hoja.save(ruta)
print("guardado:", ruta)
