"""Ejemplo 4: corrección de perspectiva (y recorte contra el plano cercano).

Escena A: una "pared" con damero, girada 55°: con y sin corrección de perspectiva.
Escena B: un suelo que se mete por DETRÁS de la cámara (hay que recortarlo) dibujado
          corregido, afín, y afín pero subdividido en muchos quads (el truco de la PS1).

Ejecuta:  python ejemplo_04_perspectiva.py
Genera:   img/juguete-pared-correcta.png, img/juguete-pared-afin.png,
          img/juguete-suelo-correcto.png, img/juguete-suelo-afin.png,
          img/juguete-suelo-afin-subdividido.png
"""
import math
import struct

import gpu
import matrices as M
from rutas import carpeta_img

ANCHO, ALTO = 320, 240
PROYECCION = M.perspectiva(math.radians(60), ANCHO / ALTO, 0.1, 100.0)


def malla(esquina, eje_u, eje_v, nu, nv):
    """Rejilla de nu × nv quads: devuelve (vbo, ebo, número de índices)."""
    datos, indices = b"", []
    for j in range(nv + 1):
        for i in range(nu + 1):
            s, t = i / nu, j / nv
            p = [esquina[k] + s * eje_u[k] + t * eje_v[k] for k in range(3)]
            datos += struct.pack("<5f", *p, s, t)                     # x y z u v
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i
            b, c, d = a + 1, a + nu + 2, a + nu + 1
            indices += [a, b, c, a, c, d]                              # dos triángulos CCW
    return gpu.Buffer(datos), gpu.Buffer(struct.pack(f"<{len(indices)}H", *indices)), len(indices)


def vao_de(vbo, ebo):
    vao = gpu.VAO()
    vao.configurar(0, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=20, offset=0))    # a_pos
    vao.configurar(1, gpu.Atributo(vbo, 2, gpu.FLOAT, stride=20, offset=12))   # a_uv
    vao.elementos = ebo
    return vao


def vertex_shader(a, u):
    x, y, z = a["a_pos"]
    return M.por_vector(u["u_mvp"], (x, y, z, 1.0)), {"v_uv": a["a_uv"]}


def fragment_shader(v, u, frag):
    uu, vv = v["v_uv"]
    nu, nv = u["u_casillas"]
    casilla = (math.floor(uu * nu) + math.floor(vv * nv)) % 2
    r, g, b = (0.93, 0.90, 0.80) if casilla else (0.20, 0.23, 0.34)
    return (r, g, b, 1.0)


programa = gpu.Programa(vertex_shader, fragment_shader,
                        atributos={"a_pos": (0, "vec3"), "a_uv": (1, "vec2")},
                        uniforms={"u_mvp": "mat4", "u_casillas": "vec2"})


def render(vao, n_indices, corregir, cielo, nombre):
    fb = gpu.Framebuffer(ANCHO, ALTO)
    fb.limpiar(cielo)
    estado = gpu.EstadoFijo()
    estado.correccion_perspectiva = corregir
    est = gpu.dibujar_elementos(fb, programa, vao, gpu.TRIANGLES, n_indices, gpu.UNSIGNED_SHORT, 0, estado)
    fb.guardar_png(carpeta_img() / nombre)
    print(f"{nombre:38s} {est}")


# --- Escena A: pared girada 55° alrededor de y, delante de la cámara -------------------
pared_vbo, pared_ebo, n = malla((-1.0, -1.0, 0.0), (2.0, 0.0, 0.0), (0.0, 2.0, 0.0), 1, 1)
programa.uniforms["u_mvp"] = M.producto(PROYECCION, M.traslacion(0.0, 0.0, -2.3), M.rotacion_y(math.radians(55)))
programa.uniforms["u_casillas"] = (8.0, 8.0)
for corregir, nombre in ((True, "juguete-pared-correcta.png"), (False, "juguete-pared-afin.png")):
    render(vao_de(pared_vbo, pared_ebo), n, corregir, (0.08, 0.09, 0.12, 1.0), nombre)

# --- Escena B: suelo de z = -10 a z = +4; la cámara está en z = 2 -----------------------
programa.uniforms["u_mvp"] = M.producto(PROYECCION, M.mirar_a((0.0, 1.0, 2.0), (0.0, 0.2, -3.0)))
programa.uniforms["u_casillas"] = (4.0, 14.0)
for x, z in ((-2.0, 4.0), (2.0, -10.0)):
    c = M.por_vector(programa.uniforms["u_mvp"], (x, 0.0, z, 1.0))
    print(f"esquina ({x:4.1f}, 0, {z:5.1f}) → clip = ({c[0]:.3f}, {c[1]:.3f}, {c[2]:.3f}, w = {c[3]:.3f})")
suelo = malla((-2.0, 0.0, 4.0), (4.0, 0.0, 0.0), (0.0, 0.0, -14.0), 1, 1)
render(vao_de(*suelo[:2]), suelo[2], True, (0.55, 0.70, 0.90, 1.0), "juguete-suelo-correcto.png")
render(vao_de(*suelo[:2]), suelo[2], False, (0.55, 0.70, 0.90, 1.0), "juguete-suelo-afin.png")
fino = malla((-2.0, 0.0, 4.0), (4.0, 0.0, 0.0), (0.0, 0.0, -14.0), 4, 14)
render(vao_de(*fino[:2]), fino[2], False, (0.55, 0.70, 0.90, 1.0), "juguete-suelo-afin-subdividido.png")
