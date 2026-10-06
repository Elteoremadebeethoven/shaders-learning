"""Matrices 4x4 en Python puro, column-major como en WebGL (y como mat4 de glkit.js).

El elemento (fila r, columna c) vive en m[c*4 + r]. Ver lecciones 3.5 y 3.6.
"""
import math


def identidad():
    return (1.0, 0.0, 0.0, 0.0,  0.0, 1.0, 0.0, 0.0,  0.0, 0.0, 1.0, 0.0,  0.0, 0.0, 0.0, 1.0)


def multiplicar(a, b):
    """a · b (primero se aplica b, luego a)."""
    return tuple(sum(a[k * 4 + r] * b[c * 4 + k] for k in range(4)) for c in range(4) for r in range(4))


def producto(*ms):
    resultado = ms[0]
    for m in ms[1:]:
        resultado = multiplicar(resultado, m)
    return resultado


def por_vector(m, v):
    """m · (x, y, z, w)."""
    return tuple(m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3] for r in range(4))


def traslacion(x, y, z):
    m = list(identidad())
    m[12], m[13], m[14] = x, y, z
    return tuple(m)


def rotacion_y(a):
    c, s = math.cos(a), math.sin(a)
    return (c, 0.0, -s, 0.0,  0.0, 1.0, 0.0, 0.0,  s, 0.0, c, 0.0,  0.0, 0.0, 0.0, 1.0)


def rotacion_x(a):
    c, s = math.cos(a), math.sin(a)
    return (1.0, 0.0, 0.0, 0.0,  0.0, c, s, 0.0,  0.0, -s, c, 0.0,  0.0, 0.0, 0.0, 1.0)


def perspectiva(fov_y, aspecto, cerca, lejos):
    """Igual que gluPerspective / mat4.perspectiva: la cámara mira hacia -z."""
    f = 1.0 / math.tan(fov_y / 2.0)
    nf = 1.0 / (cerca - lejos)
    return (f / aspecto, 0.0, 0.0, 0.0,
            0.0, f, 0.0, 0.0,
            0.0, 0.0, (lejos + cerca) * nf, -1.0,
            0.0, 0.0, 2.0 * lejos * cerca * nf, 0.0)


def mirar_a(ojo, centro, arriba=(0.0, 1.0, 0.0)):
    def resta(a, b): return tuple(x - y for x, y in zip(a, b))
    def cruz(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
    def norm(a):
        l = math.sqrt(sum(x * x for x in a)) or 1.0
        return tuple(x / l for x in a)
    def punto(a, b): return sum(x * y for x, y in zip(a, b))
    z = norm(resta(ojo, centro))
    x = norm(cruz(arriba, z))
    y = cruz(z, x)
    return (x[0], y[0], z[0], 0.0,
            x[1], y[1], z[1], 0.0,
            x[2], y[2], z[2], 0.0,
            -punto(x, ojo), -punto(y, ojo), -punto(z, ojo), 1.0)
