"""03_uniforms.py — uniforms en la GPU real: activos, eliminados, arrays y structs.

Ejecuta:  python moderngl/03_uniforms.py
Genera:   modulos/04-gpu/img/moderngl-uniforms.png
"""
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        in vec2 a_pos;
        out vec2 v_pos;
        void main() { v_pos = a_pos; gl_Position = vec4(a_pos, 0.0, 1.0); }
    """,
    fragment_shader="""
        #version 330 core
        struct Circulo { vec3 color; float radio; };
        uniform vec2 u_centros[3];        // array de 3 vec2
        uniform Circulo u_circulos[3];    // array de structs
        uniform vec3 u_fondo;
        uniform float u_olvidado;         // declarado pero NO usado: el compilador lo elimina
        in vec2 v_pos;
        out vec4 fragColor;
        void main() {
            vec3 c = u_fondo;
            for (int i = 0; i < 3; i++) {
                float d = distance(v_pos, u_centros[i]);
                c = mix(c, u_circulos[i].color, smoothstep(u_circulos[i].radio, u_circulos[i].radio - 0.02, d));
            }
            fragColor = vec4(c, 1.0);
        }
    """,
)

print("Miembros activos del programa (lo que queda tras compilar y enlazar):")
for nombre in prog:
    m = prog[nombre]
    tipo = type(m).__name__
    extra = f"location={m.location} dimension={m.dimension} array_length={m.array_length}" if tipo == "Uniform" else ""
    print(f"  {nombre:24s} {tipo:10s} {extra}")

print("\nValores iniciales (nunca asignados): u_fondo =", prog["u_fondo"].value,
      "| u_centros =", prog["u_centros"].value)
try:
    prog["u_olvidado"].value = 1.0
except KeyError:
    print("prog['u_olvidado'] → KeyError: el compilador lo eliminó (en WebGL: getUniformLocation → null)")

# Asignar: un array entero de una vez, y los structs miembro a miembro
prog["u_fondo"].value = (0.08, 0.09, 0.12)
prog["u_centros"].value = [(-0.35, -0.2), (0.35, -0.2), (0.0, 0.35)]
for i, (color, radio) in enumerate([((1.0, 0.35, 0.3), 0.45), ((0.3, 0.85, 0.4), 0.45), ((0.35, 0.55, 1.0), 0.45)]):
    prog[f"u_circulos[{i}].color"].value = color
    prog[f"u_circulos[{i}].radio"].value = radio
# .write() sube bytes crudos: el tercer círculo, más pequeño, escribiendo el float directamente
prog["u_circulos[2].radio"].write(struct.pack("<f", 0.3))
print("u_circulos[2].radio tras write:", round(prog["u_circulos[2].radio"].value, 3))

vbo = ctx.buffer(struct.pack("<8f", -1, -1, 1, -1, -1, 1, 1, 1))
vao = ctx.vertex_array(prog, [(vbo, "2f", "a_pos")])
fbo = ctx.simple_framebuffer((200, 200))
fbo.use()
vao.render(moderngl.TRIANGLE_STRIP)                        # 4 vértices en tira = 2 triángulos
Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM) \
    .save(carpeta_img() / "moderngl-uniforms.png")
print("guardado img/moderngl-uniforms.png")
print("u_fondo sigue valiendo", tuple(round(v, 2) for v in prog["u_fondo"].value),
      "después de dibujar: los uniforms son estado del programa y persisten")
