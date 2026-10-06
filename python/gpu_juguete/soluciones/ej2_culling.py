"""SOLUCIÓN del ejercicio 4.3.2 — Implementa el back-face culling.

Dibujamos un cubo (12 triángulos) SIN prueba de profundidad. Sin culling, las caras
traseras se pintan encima de las delanteras según el orden de dibujo y el cubo se ve
"del revés". Con back-face culling solo sobreviven las caras que miran a la cámara
y, en un objeto convexo, eso basta para que se vea bien.

Completa descartar_por_cara(frontal, estado): debe devolver True cuando el triángulo
se tiene que tirar, según estado.cull_face (bool) y estado.cull_mode
("BACK", "FRONT" o "FRONT_AND_BACK"). Al terminar deben descartarse 6 de 12 triángulos.

Ejecuta:  python soluciones/ej2_culling.py   → img/ej2-culling-solucion.png
"""
import math
import struct
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import gpu  # noqa: E402
import matrices as M  # noqa: E402
from rutas import carpeta_img  # noqa: E402


def descartar_por_cara(frontal, estado):
    if not estado.cull_face:                  # sin gl.enable(gl.CULL_FACE) no se descarta nada
        return False
    if estado.cull_mode == "FRONT_AND_BACK":  # se descarta todo (¡solo se dibujan puntos y líneas!)
        return True
    if estado.cull_mode == "BACK":
        return not frontal                    # fuera las traseras
    return frontal                            # "FRONT": fuera las delanteras


gpu.descartar_por_cara = descartar_por_cara      # sustituimos la función de la GPU por la tuya

# El cubo: 6 caras × 2 triángulos, todos en sentido antihorario vistos DESDE FUERA.
V = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]
caras = [((4, 5, 6, 7), (1.0, 0.35, 0.3)), ((1, 0, 3, 2), (0.3, 0.8, 0.4)), ((5, 1, 2, 6), (0.35, 0.55, 1.0)),
         ((0, 4, 7, 3), (1.0, 0.8, 0.3)), ((7, 6, 2, 3), (0.8, 0.4, 1.0)), ((0, 1, 5, 4), (0.3, 0.9, 0.9))]
datos = b""
for (a, b, c, d), color in caras:
    for i in (a, b, c, a, c, d):
        datos += struct.pack("<6f", *V[i], *color)
vbo = gpu.Buffer(datos)
vao = gpu.VAO()
vao.configurar(0, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=24, offset=0))
vao.configurar(1, gpu.Atributo(vbo, 3, gpu.FLOAT, stride=24, offset=12))
prog = gpu.Programa(lambda a, u: (M.por_vector(u["u_mvp"], (*a["a_pos"], 1.0)), {"v_color": a["a_color"]}),
                    lambda v, u, f: (*v["v_color"], 1.0),
                    atributos={"a_pos": (0, "vec3"), "a_color": (1, "vec3")}, uniforms={"u_mvp": "mat4"})
prog.uniforms["u_mvp"] = M.producto(M.perspectiva(math.radians(50), 1.0, 0.1, 50.0), M.traslacion(0, 0, -6),
                                    M.rotacion_x(math.radians(25)), M.rotacion_y(math.radians(35)))
fb = gpu.Framebuffer(200, 200)
fb.limpiar((0.08, 0.09, 0.12, 1.0))
estado = gpu.EstadoFijo()
estado.cull_face, estado.cull_mode = True, "BACK"     # gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK)
est = gpu.dibujar_arrays(fb, prog, vao, gpu.TRIANGLES, 0, 36, estado)
print(f"triángulos descartados por culling: {est.descartados_culling} de {est.triangulos}")
fb.guardar_png(carpeta_img() / "ej2-culling-solucion.png")
