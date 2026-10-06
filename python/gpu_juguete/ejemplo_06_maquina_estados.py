"""Ejemplo 6: la máquina de estados y sus trampas, con la GPU de juguete.

Cuatro errores clásicos de OpenGL/WebGL reproducidos con ContextoGL (maquina_estados.py):
  1. bind-para-editar: bufferData modifica el buffer que ESTÁ enlazado, no "el tuyo";
  2. vertexAttribPointer se queda con el buffer enlazado en ese momento (y el VAO lo recuerda);
  3. uniforms: sin useProgram → error; ubicación de otro programa → error; nombre mal escrito → silencio;
  4. el ELEMENT_ARRAY_BUFFER es estado del VAO: enlázalo con el VAO equivocado y "desaparece".

Ejecuta:  python ejemplo_06_maquina_estados.py
Genera:   img/juguete-estado-bug.png (izquierda: con el bug 1; derecha: corregido)
"""
import struct

import gpu
import maquina_estados as G
from rutas import carpeta_img


def triangulo(dx):
    """Un triángulo (x, y) desplazado dx en x."""
    return struct.pack("<6f", -0.4 + dx, -0.5, 0.4 + dx, -0.5, dx, 0.5)


def nombre(ctx, b):
    return {id(ctx.buf_a): "buf_a", id(ctx.buf_b): "buf_b"}.get(id(b), repr(b))


prog = gpu.Programa(
    lambda a, u: ((*a["a_pos"], 0.0, 1.0), {}),
    lambda v, u, f: (*u["u_color"], 1.0),
    atributos={"a_pos": (0, "vec2")}, uniforms={"u_color": "vec3"})


def preparar(ctx):
    # Un "ayudante" típico: crea un buffer y... lo deja ENLAZADO.
    def crear_buffer(datos):
        b = ctx.create_buffer()
        ctx.bind_buffer(G.ARRAY_BUFFER, b)
        ctx.buffer_data(G.ARRAY_BUFFER, datos)
        return b
    ctx.buf_a = crear_buffer(triangulo(-0.5))      # triángulo de la izquierda
    ctx.vao_a = ctx.create_vertex_array()
    ctx.bind_vertex_array(ctx.vao_a)
    ctx.enable_vertex_attrib_array(0)
    ctx.vertex_attrib_pointer(0, 2, gpu.FLOAT, False, 0, 0)   # captura buf_a
    ctx.buf_b = crear_buffer(triangulo(+0.5))      # ...y ahora buf_b queda enlazado
    ctx.vao_b = ctx.create_vertex_array()
    ctx.bind_vertex_array(ctx.vao_b)
    ctx.enable_vertex_attrib_array(0)
    ctx.vertex_attrib_pointer(0, 2, gpu.FLOAT, False, 0, 0)   # captura buf_b


def dibujar(ctx):
    ctx.clear(G.COLOR_BUFFER_BIT)
    ctx.use_program(prog)
    loc = ctx.get_uniform_location(prog, "u_color")
    for vao, color in ((ctx.vao_a, (1.0, 0.45, 0.3)), (ctx.vao_b, (0.35, 0.8, 1.0))):
        ctx.bind_vertex_array(vao)
        ctx.uniform(loc, color)
        ctx.draw_arrays(gpu.TRIANGLES, 0, 3)


print("== 1. bind-para-editar ==")
imagenes = []
for corregido in (False, True):
    ctx = G.ContextoGL(160, 120)
    ctx.clear_color(0.08, 0.09, 0.12, 1.0)
    preparar(ctx)
    # Queremos subir el triángulo de la IZQUIERDA (buf_a) 0.3 unidades:
    if corregido:
        ctx.bind_buffer(G.ARRAY_BUFFER, ctx.buf_a)   # la regla: enlaza ANTES de editar
    print(f"  {'corregido' if corregido else 'con bug  '}: ARRAY_BUFFER enlazado al editar =",
          nombre(ctx, ctx.get_parameter(G.ARRAY_BUFFER_BINDING)))
    ctx.buffer_data(G.ARRAY_BUFFER, struct.pack("<6f", -0.9, -0.2, -0.1, -0.2, -0.5, 0.8))
    dibujar(ctx)
    imagenes.append(ctx.framebuffer)
# las dos imágenes, una al lado de la otra
hoja = gpu.Framebuffer(330, 120)
hoja.limpiar((1, 1, 1, 1))
for k, fb in enumerate(imagenes):
    for y in range(fb.alto):
        o, d = y * fb.ancho * 4, (y * hoja.ancho + k * 170) * 4
        hoja.color[d:d + fb.ancho * 4] = fb.color[o:o + fb.ancho * 4]
hoja.guardar_png(carpeta_img() / "juguete-estado-bug.png")

print("\n== 2. vertexAttribPointer 'fotografía' el buffer enlazado ==")
ctx = G.ContextoGL(8, 8)
preparar(ctx)
ctx.bind_vertex_array(ctx.vao_a)
print("  ARRAY_BUFFER enlazado ahora:      ", nombre(ctx, ctx.get_parameter(G.ARRAY_BUFFER_BINDING)))
print("  buffer del atributo 0 en vao_a:   ", nombre(ctx, ctx.get_vertex_attrib(0, G.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)))
ctx.bind_vertex_array(ctx.vao_b)
print("  (enlazo vao_b) ARRAY_BUFFER sigue:", nombre(ctx, ctx.get_parameter(G.ARRAY_BUFFER_BINDING)),
      "← no es estado del VAO")

print("\n== 3. uniforms ==")
otro = gpu.Programa(prog.vertex_shader, prog.fragment_shader, prog.atributos, uniforms={"u_color": "vec3"})
ctx.use_program(None)
ctx.uniform(ctx.get_uniform_location(prog, "u_color"), (1, 0, 0))
print("  sin useProgram:               ", G.NOMBRES_ERROR[ctx.get_error()])
ctx.use_program(otro)
ctx.uniform(ctx.get_uniform_location(prog, "u_color"), (1, 0, 0))
print("  ubicación de otro programa:   ", G.NOMBRES_ERROR[ctx.get_error()])
ctx.use_program(prog)
loc = ctx.get_uniform_location(prog, "u_colr")                  # errata
ctx.uniform(loc, (1, 0, 0))
print("  nombre mal escrito: ubicación =", loc, "| error =", G.NOMBRES_ERROR[ctx.get_error()],
      "| u_color no cambió:", prog.uniforms["u_color"], "(lo último que se le asignó)")

print("\n== 4. el EBO es estado del VAO ==")
ctx = G.ContextoGL(8, 8)
preparar(ctx)                                                   # deja vao_b enlazado
ebo = ctx.create_buffer()
ctx.bind_buffer(G.ELEMENT_ARRAY_BUFFER, ebo)                    # ¡se engancha a vao_b!
ctx.buffer_data(G.ELEMENT_ARRAY_BUFFER, struct.pack("<3H", 0, 1, 2))
ctx.bind_vertex_array(ctx.vao_a)
ctx.use_program(prog)
print("  EBO de vao_a:", ctx.get_parameter(G.ELEMENT_ARRAY_BUFFER_BINDING))
ctx.draw_elements(gpu.TRIANGLES, 3, gpu.UNSIGNED_SHORT, 0)
print("  drawElements con vao_a →", G.NOMBRES_ERROR[ctx.get_error()])
