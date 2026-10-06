"""SOLUCIÓN del ejercicio 4.6.4 — ¿Qué hace moderngl con una cadena de formato?

Crea un VAO con el formato "3f 4f1 2f2 1u2 2x" y pregunta al driver (PyOpenGL, en el mismo
contexto) qué ha configurado para cada atributo: tipo, tamaño, normalizado, entero, stride, offset.

Ejecuta:  python moderngl/soluciones/ej4_formatos.py
"""
import moderngl
import numpy as np
import OpenGL
OpenGL.ERROR_CHECKING = False
from OpenGL import GL  # noqa: E402

ctx = moderngl.create_standalone_context()
prog = ctx.program(vertex_shader="""
    #version 330 core
    in vec3 a_pos; in vec4 a_color; in vec2 a_uv; in uint a_id;
    out vec4 v; flat out uint vid;
    void main() { v = a_color + vec4(a_uv, 0.0, 0.0); vid = a_id; gl_Position = vec4(a_pos, 1.0); }""",
                   fragment_shader="""
    #version 330 core
    in vec4 v; flat in uint vid; out vec4 o;
    void main() { o = v + vec4(float(vid)); }""")
FORMATO = "3f 4f1 2f2 1u2 2x"
buf = ctx.buffer(reserve=4 * 28)
vao = ctx.vertex_array(prog, [(buf, FORMATO, "a_pos", "a_color", "a_uv", "a_id")])
TIPOS = {GL.GL_FLOAT: "FLOAT", GL.GL_UNSIGNED_BYTE: "UNSIGNED_BYTE", GL.GL_HALF_FLOAT: "HALF_FLOAT", GL.GL_UNSIGNED_SHORT: "UNSIGNED_SHORT"}
GL.glBindVertexArray(vao.glo)


def q(loc, p):
    v = np.zeros(4, dtype=np.int32)
    GL.glGetVertexAttribiv(loc, p, v)
    return int(v[0])


print(f'formato "{FORMATO}":')
for nombre in ("a_pos", "a_color", "a_uv", "a_id"):
    loc = prog[nombre].location
    print(f"  {nombre:8s} size={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_SIZE)} tipo={TIPOS[q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_TYPE)]:14s} "
          f"normalizado={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_NORMALIZED)} entero={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_INTEGER)} "
          f"stride={q(loc, GL.GL_VERTEX_ATTRIB_ARRAY_STRIDE)} offset={int(GL.glGetVertexAttribPointerv(loc, GL.GL_VERTEX_ATTRIB_ARRAY_POINTER) or 0)}")
GL.glBindVertexArray(0)
