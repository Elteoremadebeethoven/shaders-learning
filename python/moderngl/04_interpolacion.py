"""04_interpolacion.py — smooth, noperspective y flat en la GPU real.

La misma escena que gpu_juguete/ejemplo_08_varyings.py, pero con los calificadores de GLSL:
  smooth        (el de siempre: con corrección de perspectiva)
  noperspective (interpolación lineal en pantalla: lo que hacía la PS1; existe en GLSL de
                 escritorio; en WebGL2 solo con la extensión NV_shader_noperspective_interpolation)
  flat          con el vértice provocador por defecto (el ÚLTIMO) y con el PRIMERO

Ejecuta:  python moderngl/04_interpolacion.py
Genera:   modulos/04-gpu/img/moderngl-interpolacion.png
"""
import math
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
import matrices as M  # noqa: E402
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()
datos = [(-1.0, -1.0, -2.2, 0.0), (1.0, -1.0, -2.2, 0.0), (0.0, 2.2, -7.0, 1.0)]
vbo = ctx.buffer(b"".join(struct.pack("<4f", *v) for v in datos))
mvp = M.producto(M.perspectiva(math.radians(60), 1.0, 0.1, 100.0), M.traslacion(0.0, 0.2, 0.0))

VS = """#version 330 core
in vec3 a_pos; in float a_t;
uniform mat4 u_mvp;
CALIF out float v_t;
flat out vec3 v_id;
const vec3 COLORES[3] = vec3[3](vec3(1.0, 0.35, 0.3), vec3(0.3, 0.85, 0.4), vec3(0.35, 0.55, 1.0));
void main() { v_t = a_t; v_id = COLORES[gl_VertexID]; gl_Position = u_mvp * vec4(a_pos, 1.0); }"""
FS = """#version 330 core
CALIF in float v_t;
flat in vec3 v_id;
uniform bool u_flat;
out vec4 fragColor;
void main() {
    float franja = mod(floor(v_t * 10.0), 2.0);
    vec3 c = franja > 0.5 ? vec3(0.93, 0.90, 0.80) : vec3(0.20, 0.23, 0.34);
    fragColor = vec4(u_flat ? v_id : c, 1.0);
}"""

paneles = []
for calificador, es_flat, provocador in (("smooth", False, moderngl.LAST_VERTEX_CONVENTION),
                                         ("noperspective", False, moderngl.LAST_VERTEX_CONVENTION),
                                         ("smooth", True, moderngl.LAST_VERTEX_CONVENTION),
                                         ("smooth", True, moderngl.FIRST_VERTEX_CONVENTION)):
    prog = ctx.program(vertex_shader=VS.replace("CALIF", calificador), fragment_shader=FS.replace("CALIF", calificador))
    prog["u_mvp"].value = mvp
    prog["u_flat"].value = es_flat
    ctx.provoking_vertex = provocador                       # glProvokingVertex(...)
    vao = ctx.vertex_array(prog, [(vbo, "3f 1f", "a_pos", "a_t")])
    fbo = ctx.simple_framebuffer((160, 160))
    fbo.use()
    fbo.clear(0.08, 0.09, 0.12, 1.0)
    vao.render(moderngl.TRIANGLES)
    paneles.append(Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM))

hoja = Image.new("RGBA", (4 * 160 + 30, 160), (255, 255, 255, 255))
for k, p in enumerate(paneles):
    hoja.paste(p, (k * 170, 0))
ruta = carpeta_img() / "moderngl-interpolacion.png"
hoja.save(ruta)
print("guardado:", ruta)

# ¿Coincide con la GPU de juguete? (hay que haber ejecutado antes ejemplo_08_varyings.py)
juguete = carpeta_img() / "juguete-varyings.png"
if juguete.exists():
    d = ImageChops.difference(hoja.convert("RGB"), Image.open(juguete).convert("RGB"))
    distintos = sum(1 for p in d.get_flattened_data() if max(p) > 0) if hasattr(d, "get_flattened_data") \
        else sum(1 for p in d.getdata() if max(p) > 0)
    print(f"píxeles distintos respecto a la GPU de juguete: {distintos} de {160 * 160 * 4}")
