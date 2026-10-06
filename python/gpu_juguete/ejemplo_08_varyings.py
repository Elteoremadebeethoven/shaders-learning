"""Ejemplo 8: varyings (smooth, "afín", flat), atributos constantes y gl_VertexID.

Panel 1: smooth (con corrección de perspectiva)   Panel 2: la misma escena, interpolación afín
Panel 3: flat, vértice provocador = el último     Panel 4: flat, provocador = el primero
Aparte: un triángulo de pantalla completa SIN buffers (solo gl_VertexID) y un color constante.

Ejecuta:  python ejemplo_08_varyings.py
Genera:   img/juguete-varyings.png, img/juguete-vertexid.png
"""
import math
import struct

import gpu
import matrices as M
from rutas import carpeta_img

# Un triángulo en 3D que se aleja: su vértice de arriba está 4.8 unidades más lejos.
#          x     y     z      t  (varying que queremos interpolar)
datos = [(-1.0, -1.0, -2.2, 0.0), (1.0, -1.0, -2.2, 0.0), (0.0, 2.2, -7.0, 1.0)]
vbo = gpu.Buffer(b"".join(struct.pack("<4f", *v) for v in datos))
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=16, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 1, gpu.FLOAT, stride=16, offset=12))
COLORES = ((1.0, 0.35, 0.3), (0.3, 0.85, 0.4), (0.35, 0.55, 1.0))


def vs(a, u):
    x, y, z = a["a_pos"]
    return (M.por_vector(u["u_mvp"], (x, y, z, 1.0)),
            {"v_t": a["a_t"], "v_id": COLORES[a["gl_VertexID"]]})


def fs_franjas(v, u, frag):
    franja = math.floor(v["v_t"] * 10) % 2           # 10 franjas iguales... en el espacio 3D
    return (0.93, 0.90, 0.80, 1.0) if franja else (0.20, 0.23, 0.34, 1.0)


def fs_flat(v, u, frag):
    return (*v["v_id"], 1.0)


mvp = M.producto(M.perspectiva(math.radians(60), 1.0, 0.1, 100.0), M.traslacion(0.0, 0.2, 0.0))
paneles = []
for fs, corregir, flat, provocador in ((fs_franjas, True, (), "ULTIMO"), (fs_franjas, False, (), "ULTIMO"),
                                       (fs_flat, True, ("v_id",), "ULTIMO"), (fs_flat, True, ("v_id",), "PRIMERO")):
    prog = gpu.Programa(vs, fs, atributos={"a_pos": (0, "vec3"), "a_t": (1, "float")},
                        uniforms={"u_mvp": "mat4"}, flat=flat)
    prog.uniforms["u_mvp"] = mvp
    fb = gpu.Framebuffer(160, 160)
    fb.limpiar((0.08, 0.09, 0.12, 1.0))
    estado = gpu.EstadoFijo()
    estado.correccion_perspectiva, estado.provocador = corregir, provocador
    gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 3, estado)
    paneles.append(fb)

hoja = gpu.Framebuffer(4 * 160 + 30, 160)
hoja.limpiar((1, 1, 1, 1))
for k, fb in enumerate(paneles):
    for y in range(160):
        d = (y * hoja.ancho + k * 170) * 4
        hoja.color[d:d + 640] = fb.color[y * 640:(y + 1) * 640]
hoja.guardar_png(carpeta_img() / "juguete-varyings.png")
w = [M.por_vector(mvp, (x, y, z, 1.0))[3] for x, y, z, _ in datos]
print("w de clip de cada vértice:", [round(x, 3) for x in w])


# ---------------------------------------------------------------- sin buffers: gl_VertexID
def vs_pantalla(a, u):
    i = a["gl_VertexID"]
    x, y = (i << 1) & 2, i & 2                        # 0 → (0,0), 1 → (2,0), 2 → (0,2)
    return (x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0), {"v_uv": (float(x), float(y)), "v_color": a["a_color"]}


def fs_pantalla(v, u, frag):
    s, t = v["v_uv"]
    r, g, b, _ = v["v_color"]                          # el MISMO valor en todos los vértices
    return (s * r, t * g, b, 1.0)


prog = gpu.Programa(vs_pantalla, fs_pantalla, atributos={"a_color": (1, "vec4")})
vacio = gpu.VAO()                                     # ¡ningún atributo habilitado!
fb = gpu.Framebuffer(160, 120)
# el array del atributo 1 está deshabilitado: todos los vértices reciben este valor constante
est = gpu.dibujar_arrays(fb, prog, vacio, gpu.TRIANGLES, 0, 3, constantes={1: (1.0, 0.5, 0.2, 1.0)})
fb.guardar_png(carpeta_img() / "juguete-vertexid.png")
print("triángulo de pantalla completa sin buffers:", est)
print("esquinas: abajo-izq", fb.leer(0, 0), "arriba-der", fb.leer(159, 119))
