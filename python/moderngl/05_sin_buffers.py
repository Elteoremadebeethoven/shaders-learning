"""05_sin_buffers.py — dibujar SIN buffers: gl_VertexID y atributos constantes.

  · Un VAO vacío y vao.render(vertices=3): el vertex shader fabrica el triángulo de
    pantalla completa a partir de gl_VertexID (0, 1, 2).
  · a_color es un atributo con el array DESHABILITADO: todos los vértices reciben el valor
    constante que pongamos con glVertexAttrib4f (moderngl no lo expone; usamos PyOpenGL
    sobre el mismo contexto).

Ejecuta:  python moderngl/05_sin_buffers.py
Genera:   modulos/04-gpu/img/moderngl-vertexid.png
"""
import sys
from pathlib import Path

import moderngl
import OpenGL
OpenGL.ERROR_CHECKING = False
from OpenGL import GL  # noqa: E402
from PIL import Image, ImageChops  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from rutas import carpeta_img  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        layout(location = 1) in vec4 a_color;   // array deshabilitado → valor constante
        out vec2 v_uv;
        out vec4 v_color;
        void main() {
            // 0 → (0,0)   1 → (2,0)   2 → (0,2): un triángulo que tapa todo el viewport
            vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
            v_uv = p;
            v_color = a_color;
            gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
        }
    """,
    fragment_shader="""
        #version 330 core
        in vec2 v_uv; in vec4 v_color;
        out vec4 fragColor;
        void main() { fragColor = vec4(v_uv.x * v_color.r, v_uv.y * v_color.g, v_color.b, 1.0); }
    """,
)
vao = ctx.vertex_array(prog, [])                  # un VAO sin ningún buffer
fbo = ctx.simple_framebuffer((160, 120))
fbo.use()
GL.glVertexAttrib4f(1, 1.0, 0.5, 0.2, 1.0)       # el "valor actual" del atributo 1 (estado del contexto)
vao.render(moderngl.TRIANGLES, vertices=3)        # glDrawArrays(GL_TRIANGLES, 0, 3)
img = Image.frombytes("RGBA", fbo.size, fbo.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
img.save(carpeta_img() / "moderngl-vertexid.png")
print("guardado img/moderngl-vertexid.png | esquina abajo-izq:", img.getpixel((0, 119)), "arriba-der:", img.getpixel((159, 0)))
juguete = carpeta_img() / "juguete-vertexid.png"
if juguete.exists():
    d = ImageChops.difference(img.convert("RGB"), Image.open(juguete).convert("RGB"))
    print("¿idéntica a la de la GPU de juguete?", d.getbbox() is None)
