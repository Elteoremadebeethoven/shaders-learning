"""01_triangulo.py — el triángulo de colores con moderngl, sin ventana.

Es EXACTAMENTE la misma escena que gpu_juguete/ejemplo_01_triangulo.py, pero
ahora la dibuja la GPU de verdad a través del driver OpenGL.

Ejecuta:  python moderngl/01_triangulo.py
Genera:   modulos/04-gpu/img/moderngl-triangulo.png
"""
import struct
import sys
from pathlib import Path

import moderngl
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "gpu_juguete"))
from rutas import carpeta_img  # noqa: E402

# 1. Un contexto OpenGL "standalone": sin ventana (en macOS, un contexto CGL 4.1 core).
ctx = moderngl.create_standalone_context()
print("GPU:", ctx.info["GL_RENDERER"], "| OpenGL", ctx.info["GL_VERSION"])

# 2. El programa: compila los dos shaders y los enlaza (glCreateShader ... glLinkProgram).
prog = ctx.program(
    vertex_shader="""
        #version 330 core
        in vec2 a_pos;
        in vec3 a_color;
        out vec3 v_color;
        void main() {
            v_color = a_color;
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    """,
    fragment_shader="""
        #version 330 core
        in vec3 v_color;
        out vec4 fragColor;
        void main() {
            fragColor = vec4(v_color, 1.0);
        }
    """,
)

# 3. El VBO: los mismos 60 bytes que en la GPU de juguete (x, y, r, g, b por vértice).
vertices = struct.pack("<15f",
                       -0.75, -0.75, 1.0, 0.0, 0.0,
                        0.75, -0.75, 0.0, 1.0, 0.0,
                        0.00,  0.75, 0.0, 0.0, 1.0)
vbo = ctx.buffer(vertices)                       # glGenBuffers + glBindBuffer + glBufferData

# 4. El VAO: "2f 3f" = 2 floats y luego 3 floats por vértice → stride 20, offsets 0 y 8.
vao = ctx.vertex_array(prog, [(vbo, "2f 3f", "a_pos", "a_color")])
print("vértices que dibujará vao.render():", vao.vertices)

# 5. Un framebuffer propio (no hay ventana): color RGBA8 + profundidad.
fbo = ctx.simple_framebuffer((256, 256))
fbo.use()                                        # glBindFramebuffer + glViewport(0, 0, 256, 256)
fbo.clear(0.08, 0.09, 0.12, 1.0)                 # glClearColor + glClear

# 6. La orden de dibujo.
vao.render(moderngl.TRIANGLES)                   # glUseProgram + glBindVertexArray + glDrawArrays

# 7. Leer los píxeles (glReadPixels): las filas llegan de ABAJO a ARRIBA.
datos = fbo.read(components=4)
print("bytes leídos:", len(datos), "| píxel (128, 100):", tuple(datos[(100 * 256 + 128) * 4:][:4]))
imagen = Image.frombytes("RGBA", fbo.size, datos).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
ruta = carpeta_img() / "moderngl-triangulo.png"
imagen.save(ruta)
print("guardado:", ruta)
