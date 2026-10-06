"""gpu.py — una GPU de juguete: el pipeline de OpenGL/WebGL en Python puro.

Solo biblioteca estándar. Cada etapa es una función corta que puedes leer:

  VBO (bytes) → vertex fetch (VAO) → vertex shader → ensamblado → recorte
  → división de perspectiva → viewport → culling → rasterización
  → interpolación de varyings → fragment shader → profundidad → blending → framebuffer

Convenciones, las mismas que OpenGL/WebGL:
  * espacio de clip → NDC dividiendo por w; NDC va de -1 a 1 en x, y, z;
  * coordenadas de ventana con el origen ABAJO a la izquierda (y hacia arriba);
  * el centro del píxel (x, y) está en (x + 0.5, y + 0.5);
  * triángulos en sentido antihorario (CCW) = de frente;
  * profundidad de ventana en [0, 1], el valor inicial del z-buffer es 1.0.
"""
import math
import struct
from array import array
from collections import OrderedDict

from png_propio import guardar_png

# ---------------------------------------------------------------------------
# Constantes (mismos valores numéricos que en OpenGL/WebGL, por diversión)
# ---------------------------------------------------------------------------
BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, INT, UNSIGNED_INT, FLOAT = range(0x1400, 0x1407)
TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN = 0x0004, 0x0005, 0x0006

# tipo → (código de struct, bytes, ¿con signo?)
TIPOS = {
    BYTE: ("b", 1, True), UNSIGNED_BYTE: ("B", 1, False),
    SHORT: ("h", 2, True), UNSIGNED_SHORT: ("H", 2, False),
    INT: ("i", 4, True), UNSIGNED_INT: ("I", 4, False),
    FLOAT: ("f", 4, None),
}
NOMBRE_TIPO = {BYTE: "BYTE", UNSIGNED_BYTE: "UNSIGNED_BYTE", SHORT: "SHORT", UNSIGNED_SHORT: "UNSIGNED_SHORT",
               INT: "INT", UNSIGNED_INT: "UNSIGNED_INT", FLOAT: "FLOAT"}

# tipo GLSL → número de componentes
COMPONENTES = {"float": 1, "vec2": 2, "vec3": 3, "vec4": 4,
               "int": 1, "ivec2": 2, "ivec3": 3, "ivec4": 4,
               "uint": 1, "uvec2": 2, "uvec3": 3, "uvec4": 4}


def es_entero(tipo_glsl):
    return tipo_glsl.startswith(("int", "ivec", "uint", "uvec"))


# ---------------------------------------------------------------------------
# Objetos de la "API": buffer, descriptor de atributo, VAO, programa
# ---------------------------------------------------------------------------
class Buffer:
    """Un VBO o un EBO: bytes sin tipo. La GPU no sabe qué hay dentro."""

    def __init__(self, datos=b""):
        self.datos = bytearray(datos)

    def subir(self, datos):
        """≈ gl.bufferData: reemplaza el contenido (y el tamaño) entero."""
        self.datos = bytearray(datos)

    def actualizar(self, offset, datos):
        """≈ gl.bufferSubData: sobrescribe un trozo sin cambiar el tamaño."""
        if offset < 0 or offset + len(datos) > len(self.datos):
            raise ValueError("bufferSubData fuera de rango (en GL: INVALID_VALUE)")
        self.datos[offset:offset + len(datos)] = datos

    def __len__(self):
        return len(self.datos)


class Atributo:
    """Lo que gl.vertexAttribPointer guarda en el VAO para UNA location."""

    def __init__(self, buffer, size, tipo, normalizado=False, stride=0, offset=0,
                 entero=False, divisor=0):
        if size not in (1, 2, 3, 4):
            raise ValueError("size debe ser 1, 2, 3 o 4 (en GL: INVALID_VALUE)")
        self.buffer = buffer            # el buffer QUE ESTABA ENLAZADO al configurar
        self.size = size                # componentes por vértice (1..4)
        self.tipo = tipo                # FLOAT, UNSIGNED_BYTE, ...
        self.normalizado = normalizado  # enteros → [0, 1] o [-1, 1]
        self.entero = entero            # True = vertexAttribIPointer (sin convertir a float)
        self.divisor = divisor          # 0 = por vértice (instancing: lo veremos en 5.9)
        self.offset = offset            # byte donde empieza el primer vértice
        # stride 0 significa "empaquetado": exactamente el tamaño de un elemento
        self.stride = stride or size * TIPOS[tipo][1]

    def leer(self, indice):
        """Vertex fetch de este atributo para el vértice número `indice`."""
        codigo, nbytes, con_signo = TIPOS[self.tipo]
        inicio = self.offset + indice * self.stride
        if inicio + self.size * nbytes > len(self.buffer.datos):
            raise IndexError(f"el vértice {indice} se sale del buffer (WebGL: INVALID_OPERATION)")
        crudos = struct.unpack_from("<" + codigo * self.size, self.buffer.datos, inicio)
        if self.entero:                         # enteros tal cual
            return crudos + (0, 0, 0, 1)[self.size:]
        if self.tipo == FLOAT or not self.normalizado:
            valores = [float(c) for c in crudos]          # 255 → 255.0
        elif con_signo:                         # [-127, 127] → [-1, 1]  (y -128 → -1)
            m = (1 << (8 * nbytes - 1)) - 1
            valores = [max(c / m, -1.0) for c in crudos]
        else:                                   # [0, 255] → [0, 1]
            m = (1 << (8 * nbytes)) - 1
            valores = [c / m for c in crudos]
        # los componentes que no están en el buffer se rellenan con (0, 0, 0, 1)
        return tuple(valores) + (0.0, 0.0, 0.0, 1.0)[self.size:]


class VAO:
    """Vertex Array Object: la receta para leer los vértices de los buffers."""

    def __init__(self):
        self.atributos = {}      # location → Atributo      (gl.vertexAttribPointer)
        self.habilitados = set()  # locations habilitadas    (gl.enableVertexAttribArray)
        self.elementos = None    # buffer de índices (EBO): TAMBIÉN es estado del VAO

    def configurar(self, location, atributo):
        """Atajo: vertexAttribPointer + enableVertexAttribArray."""
        self.atributos[location] = atributo
        self.habilitados.add(location)


def valor_inicial(tipo_glsl):
    """Todo uniform vale 0 hasta que lo asignas (como en GL)."""
    if tipo_glsl.startswith("mat"):
        n = int(tipo_glsl[3])
        return (0.0,) * (n * n)
    if tipo_glsl == "bool":
        return False
    n = COMPONENTES[tipo_glsl]
    cero = 0 if es_entero(tipo_glsl) else 0.0
    return cero if n == 1 else (cero,) * n


class Programa:
    """Un 'programa' enlazado: vertex shader + fragment shader + sus interfaces.

    atributos: {"a_pos": (location, "vec2"), ...}   ≈  layout(location=0) in vec2 a_pos;
    uniforms:  {"u_escala": "float", ...}           ≈  uniform float u_escala;
    flat:      nombres de varyings sin interpolar   ≈  flat out ...
    """

    def __init__(self, vertex_shader, fragment_shader, atributos, uniforms=None, flat=()):
        self.vertex_shader = vertex_shader
        self.fragment_shader = fragment_shader
        self.atributos = dict(atributos)
        self.tipos_uniform = dict(uniforms or {})
        self.uniforms = {n: valor_inicial(t) for n, t in self.tipos_uniform.items()}
        self.flat = set(flat)


class EstadoFijo:
    """La parte configurable pero NO programable del pipeline (gl.enable, gl.cullFace...)."""

    def __init__(self):
        self.viewport = None             # (x, y, ancho, alto); None = todo el framebuffer
        self.cull_face = False           # gl.enable(gl.CULL_FACE)
        self.cull_mode = "BACK"          # gl.cullFace(gl.BACK)
        self.front_face = "CCW"          # gl.frontFace(gl.CCW)
        self.depth_test = False          # gl.enable(gl.DEPTH_TEST)
        self.depth_func = "LESS"         # gl.depthFunc(gl.LESS)
        self.depth_mask = True           # gl.depthMask(true)
        self.blend = False               # gl.enable(gl.BLEND)
        self.blend_func = ("ONE", "ZERO")  # gl.blendFunc(src, dst); por defecto: ONE, ZERO
        self.provocador = "ULTIMO"       # vértice que da los varyings flat (GL: el último)
        self.correccion_perspectiva = True  # interruptor didáctico (la GPU real siempre corrige)
        self.cache_vertices = 16         # caché post-transformación (FIFO) en dibujos indexados


class Fragmento:
    """Lo que el fragment shader sabe de 'su' píxel."""
    __slots__ = ("x", "y", "coord", "frontal")

    def __init__(self, x, y, coord, frontal):
        self.x, self.y = x, y            # píxel entero
        self.coord = coord               # gl_FragCoord = (x + 0.5, y + 0.5, z, 1/w)
        self.frontal = frontal           # gl_FrontFacing


class Estadisticas:
    def __init__(self):
        self.invocaciones_vs = 0
        self.aciertos_cache = 0
        self.triangulos = 0
        self.recortados = 0
        self.descartados_culling = 0
        self.fragmentos = 0
        self.descartados_fs = 0
        self.fallan_profundidad = 0
        self.escritos = 0

    def __str__(self):
        return ", ".join(f"{k}={v}" for k, v in vars(self).items())


# ---------------------------------------------------------------------------
# El framebuffer: color RGBA de 8 bits + z-buffer
# ---------------------------------------------------------------------------
def f32(x):
    """Redondea un float de Python (64 bits) a float32, que es con lo que calcula la GPU."""
    return struct.unpack("<f", struct.pack("<f", x))[0]


def a_byte(c):
    """float [0, 1] → entero [0, 255], redondeando (como al escribir en RGBA8).
    Primero a float32: 0.9 en float32 es 0.89999998 → 229.49999 → 229, no 230."""
    return int(min(max(f32(c), 0.0), 1.0) * 255.0 + 0.5)


class Framebuffer:
    def __init__(self, ancho, alto):
        self.ancho, self.alto = ancho, alto
        self.color = bytearray(ancho * alto * 4)          # fila 0 = la de ABAJO
        self.profundidad = array("d", [1.0]) * (ancho * alto)

    def limpiar(self, color=(0.0, 0.0, 0.0, 1.0), profundidad=1.0):
        """≈ gl.clearColor(...) + gl.clearDepth(...) + gl.clear(COLOR | DEPTH)."""
        self.color[:] = bytes(a_byte(c) for c in color) * (self.ancho * self.alto)
        self.profundidad = array("d", [profundidad]) * (self.ancho * self.alto)

    def leer(self, x, y):
        i = (y * self.ancho + x) * 4
        return tuple(self.color[i:i + 4])

    def filas_de_arriba_abajo(self):
        """Como gl.readPixels + voltear: los PNG empiezan por la fila de ARRIBA."""
        fila = self.ancho * 4
        return b"".join(bytes(self.color[y * fila:(y + 1) * fila]) for y in reversed(range(self.alto)))

    def guardar_png(self, ruta):
        guardar_png(ruta, self.ancho, self.alto, self.filas_de_arriba_abajo())


# ---------------------------------------------------------------------------
# Etapa 1: vertex fetch
# ---------------------------------------------------------------------------
def buscar_vertice(programa, vao, indice, constantes=None):
    """Arma el diccionario de entradas (atributos) del vertex shader para un vértice."""
    entrada = {"gl_VertexID": indice}                    # variable predefinida de GLSL
    for nombre, (loc, tipo_glsl) in programa.atributos.items():
        if loc in vao.habilitados:
            atributo = vao.atributos[loc]
            if atributo.entero != es_entero(tipo_glsl):
                raise TypeError(f"'{nombre}': el tipo del atributo no coincide con el del shader "
                                "(WebGL2: INVALID_OPERATION al dibujar)")
            valor = atributo.leer(indice)
        else:
            # atributo deshabilitado: todos los vértices reciben el mismo valor constante
            # (gl.vertexAttrib4f); si nunca lo pusiste, vale (0, 0, 0, 1)
            valor = (constantes or {}).get(loc, (0.0, 0.0, 0.0, 1.0))
        n = COMPONENTES[tipo_glsl]
        entrada[nombre] = valor[0] if n == 1 else tuple(valor[:n])
    return entrada


# ---------------------------------------------------------------------------
# Etapa 3: ensamblado de primitivas
# ---------------------------------------------------------------------------
def ensamblar(modo, v):
    """Agrupa los vértices ya transformados en triángulos.
    Devuelve (a, b, c, primero, ultimo): los índices de los posibles vértices provocadores."""
    n = len(v)
    if modo == TRIANGLES:                       # 0-1-2, 3-4-5, ... (sobrantes: ignorados)
        for i in range(0, n - 2, 3):
            yield v[i], v[i + 1], v[i + 2], i, i + 2
    elif modo == TRIANGLE_STRIP:                # cada vértice nuevo + los dos anteriores
        for i in range(n - 2):
            if i % 2 == 0:
                yield v[i], v[i + 1], v[i + 2], i, i + 2
            else:                               # impar: se intercambian para no invertir el giro
                yield v[i + 1], v[i], v[i + 2], i, i + 2
    elif modo == TRIANGLE_FAN:                  # todos comparten el vértice 0
        for i in range(1, n - 1):
            yield v[0], v[i], v[i + 1], i, i + 1
    else:
        raise ValueError("modo no soportado por esta GPU de juguete")


# ---------------------------------------------------------------------------
# Utilidades para varyings (pueden ser floats o tuplas)
# ---------------------------------------------------------------------------
def mezclar(valores, pesos):
    """Suma ponderada: sum(peso_i * valor_i). Sirve para floats y para tuplas."""
    if isinstance(valores[0], (tuple, list)):
        return tuple(sum(p * v[k] for p, v in zip(pesos, valores)) for k in range(len(valores[0])))
    return sum(p * v for p, v in zip(pesos, valores))


def lerp_vertice(a, b, t):
    """Punto a + t·(b − a) entre dos vértices de clip (posición y varyings)."""
    pos = tuple(pa + t * (pb - pa) for pa, pb in zip(a[0], b[0]))
    var = {k: mezclar((a[1][k], b[1][k]), (1.0 - t, t)) for k in a[1]}
    return pos, var


# ---------------------------------------------------------------------------
# Etapa 4: recorte (clipping) contra los planos cercano y lejano
# ---------------------------------------------------------------------------
def recortar(poligono):
    """Sutherland–Hodgman en espacio de clip contra z >= -w (cercano) y z <= w (lejano).

    Los planos laterales (x, y) no hace falta recortarlos geométricamente: la
    rasterización ya se limita al viewport (las GPU reales hacen lo mismo: 'guard band').
    El plano cercano sí es obligatorio: detrás de la cámara w <= 0 y dividir por w
    daría basura (puntos 'reflejados').
    """
    for distancia in (lambda p: p[2] + p[3], lambda p: p[3] - p[2]):
        salida = []
        for i, actual in enumerate(poligono):
            previo = poligono[i - 1]
            da, dp = distancia(actual[0]), distancia(previo[0])
            if da >= 0:
                if dp < 0:                                       # entra: añade el corte
                    salida.append(lerp_vertice(previo, actual, dp / (dp - da)))
                salida.append(actual)
            elif dp >= 0:                                        # sale: solo el corte
                salida.append(lerp_vertice(previo, actual, dp / (dp - da)))
        poligono = salida
        if len(poligono) < 3:
            return []
    return poligono


# ---------------------------------------------------------------------------
# Etapa 7: rasterización con funciones de arista
# ---------------------------------------------------------------------------
def arista(a, b, p):
    """Función de arista: > 0 si p está a la IZQUIERDA de a→b (con y hacia arriba).
    Es el producto cruz 2D (b − a) × (p − a) de la lección 3.2."""
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])


def cuenta_empate(a, b):
    """Regla de desempate para centros EXACTAMENTE sobre la arista a→b (triángulo CCW).

    Solo cuenta si es una arista izquierda (baja: dy < 0) o inferior (horizontal
    hacia la derecha). Es lo que medimos en Chrome (ANGLE/Metal) y en el driver GL de
    Apple: la regla 'top-left' de D3D/Metal vista con el eje y hacia arriba.
    Así un píxel sobre una arista compartida se pinta UNA sola vez.
    """
    dx, dy = b[0] - a[0], b[1] - a[1]
    return dy < 0 or (dy == 0 and dx > 0)


def _dentro(w, empate):
    return w > 0 or (w == 0 and empate)


# ---------------------------------------------------------------------------
# Etapa 9: blending
# ---------------------------------------------------------------------------
def _factor(nombre, src, dst):
    sa, da = src[3], dst[3]
    return {
        "ZERO": (0.0,) * 4, "ONE": (1.0,) * 4,
        "SRC_ALPHA": (sa,) * 4, "ONE_MINUS_SRC_ALPHA": (1 - sa,) * 4,
        "DST_ALPHA": (da,) * 4, "ONE_MINUS_DST_ALPHA": (1 - da,) * 4,
        "SRC_COLOR": src, "ONE_MINUS_SRC_COLOR": tuple(1 - c for c in src),
        "DST_COLOR": dst, "ONE_MINUS_DST_COLOR": tuple(1 - c for c in dst),
    }[nombre]


def mezclar_color(src, dst, blend_func):
    """color = src · factor_src + dst · factor_dst   (gl.blendEquation(FUNC_ADD))."""
    fs, fd = _factor(blend_func[0], src, dst), _factor(blend_func[1], src, dst)
    return tuple(s * a + d * b for s, a, d, b in zip(src, fs, dst, fd))


PRUEBAS_PROFUNDIDAD = {
    "NEVER": lambda z, zb: False, "LESS": lambda z, zb: z < zb, "EQUAL": lambda z, zb: z == zb,
    "LEQUAL": lambda z, zb: z <= zb, "GREATER": lambda z, zb: z > zb,
    "NOTEQUAL": lambda z, zb: z != zb, "GEQUAL": lambda z, zb: z >= zb, "ALWAYS": lambda z, zb: True,
}


# ---------------------------------------------------------------------------
# Etapas 4-9 para un triángulo ya ensamblado
# ---------------------------------------------------------------------------
def procesar_triangulo(fb, programa, tri, flat_de, estado, est, trazar=None):
    # 4. recorte en espacio de clip (solo si algún vértice está fuera de -w <= z <= w)
    if any(p[2] < -p[3] or p[2] > p[3] for p, _ in tri):
        est.recortados += 1
        poligono = recortar(list(tri))
    else:
        poligono = list(tri)
    # un polígono recortado de k vértices = abanico de k − 2 triángulos
    for i in range(1, len(poligono) - 1):
        rasterizar(fb, programa, (poligono[0], poligono[i], poligono[i + 1]), flat_de, estado, est, trazar)


def es_frontal(area2, front_face="CCW"):
    """gl.frontFace: con CCW, un triángulo que en pantalla gira antihorario (área > 0) es de frente."""
    return (area2 > 0) == (front_face == "CCW")


def descartar_por_cara(frontal, estado):
    """Face culling (gl.enable(gl.CULL_FACE) + gl.cullFace(modo)): ¿se tira el triángulo?"""
    if not estado.cull_face:
        return False
    if estado.cull_mode == "FRONT_AND_BACK":
        return True
    return (not frontal) if estado.cull_mode == "BACK" else frontal


def a_ventana(vertice, viewport):
    """5-6. División de perspectiva (clip → NDC) y transformación de viewport."""
    (x, y, z, w), _ = vertice
    xn, yn, zn = x / w, y / w, z / w                     # NDC: de -1 a 1
    vx, vy, vw, vh = viewport
    return (vx + (xn + 1.0) * vw / 2.0,                  # x de ventana (píxeles)
            vy + (yn + 1.0) * vh / 2.0,                  # y de ventana (hacia ARRIBA)
            (zn + 1.0) / 2.0,                            # profundidad en [0, 1]
            1.0 / w)                                     # 1/w: para corregir la perspectiva


def rasterizar(fb, programa, tri, flat_de, estado, est, trazar=None):
    viewport = estado.viewport or (0, 0, fb.ancho, fb.alto)
    A, B, C = (a_ventana(v, viewport) for v in tri)
    VA, VB, VC = (v[1] for v in tri)                    # varyings de cada vértice

    # 6. orientación y culling: el signo del área dice si el triángulo gira CCW o CW
    area2 = arista(A, B, C)                              # = 2 × área con signo
    if area2 == 0:
        return                                           # degenerado: no cubre nada
    frontal = es_frontal(area2, estado.front_face)
    if descartar_por_cara(frontal, estado):
        est.descartados_culling += 1
        return
    if area2 < 0:                                        # lo ponemos CCW para que
        B, C, VB, VC = C, B, VC, VB                      # "dentro" sea siempre w > 0
        area2 = -area2
    empates = (cuenta_empate(B, C), cuenta_empate(C, A), cuenta_empate(A, B))

    # 7. caja envolvente, recortada al viewport y al framebuffer
    x0 = max(math.floor(min(A[0], B[0], C[0])), viewport[0], 0)
    x1 = min(math.ceil(max(A[0], B[0], C[0])), viewport[0] + viewport[2], fb.ancho) - 1
    y0 = max(math.floor(min(A[1], B[1], C[1])), viewport[1], 0)
    y1 = min(math.ceil(max(A[1], B[1], C[1])), viewport[1] + viewport[3], fb.alto) - 1
    if trazar:
        trazar("triangulo", {"ventana": (A, B, C), "area2": area2, "frontal": frontal, "caja": (x0, y0, x1, y1)})

    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            p = (x + 0.5, y + 0.5)                       # ¡el CENTRO del píxel!
            w0, w1, w2 = arista(B, C, p), arista(C, A, p), arista(A, B, p)
            dentro = (_dentro(w0, empates[0]) and _dentro(w1, empates[1])
                      and _dentro(w2, empates[2]))
            if trazar:
                trazar("candidato", {"x": x, "y": y, "w": (w0, w1, w2), "dentro": dentro})
            if not dentro:
                continue
            est.fragmentos += 1
            # 8. coordenadas baricéntricas en pantalla (suman 1)
            l0, l1, l2 = w0 / area2, w1 / area2, w2 / area2
            z = l0 * A[2] + l1 * B[2] + l2 * C[2]         # la z de ventana SÍ es lineal en pantalla
            q = l0 * A[3] + l1 * B[3] + l2 * C[3]         # 1/w interpolado
            if estado.correccion_perspectiva:            # pesos corregidos: λ_i (1/w_i) / Σ λ_j (1/w_j)
                pesos = (l0 * A[3] / q, l1 * B[3] / q, l2 * C[3] / q)
            else:                                        # interpolación "afín" (PS1)
                pesos = (l0, l1, l2)
            varyings = {}
            for nombre in VA:
                if nombre in programa.flat:
                    varyings[nombre] = flat_de[nombre]   # sin interpolar: el vértice provocador
                else:
                    varyings[nombre] = mezclar((VA[nombre], VB[nombre], VC[nombre]), pesos)
            frag = Fragmento(x, y, (p[0], p[1], z, q), frontal)
            # 9. el fragment shader
            color = programa.fragment_shader(varyings, programa.uniforms, frag)
            info = {"x": x, "y": y, "lambda": (l0, l1, l2), "pesos": pesos, "z": z,
                    "varyings": varyings, "color": color} if trazar else None
            if color is None:                            # discard
                est.descartados_fs += 1
                if trazar:
                    trazar("fragmento", dict(info, resultado="discard"))
                continue
            escribir_fragmento(fb, x, y, z, color, estado, est, info, trazar)


def escribir_fragmento(fb, x, y, z, color, estado, est, info=None, trazar=None):
    """10. Operaciones por fragmento: prueba de profundidad, blending y escritura."""
    i = y * fb.ancho + x
    z = min(max(z, 0.0), 1.0)
    if estado.depth_test:
        if not PRUEBAS_PROFUNDIDAD[estado.depth_func](z, fb.profundidad[i]):
            est.fallan_profundidad += 1
            if trazar:
                trazar("fragmento", dict(info, resultado="falla profundidad"))
            return
        if estado.depth_mask:
            fb.profundidad[i] = z
    color = tuple(color) + (1.0,) * (4 - len(color))
    if estado.blend:
        destino = tuple(c / 255.0 for c in fb.color[i * 4:i * 4 + 4])
        color = mezclar_color(color, destino, estado.blend_func)
    fb.color[i * 4:i * 4 + 4] = bytes(a_byte(c) for c in color)
    est.escritos += 1
    if trazar:
        trazar("fragmento", dict(info, resultado="escrito"))


# ---------------------------------------------------------------------------
# Las dos órdenes de dibujo: drawArrays y drawElements
# ---------------------------------------------------------------------------
def _dibujar(fb, programa, vao, modo, indices, estado, constantes, trazar, indexado):
    estado = estado or EstadoFijo()
    est = Estadisticas()
    # 1-2. vertex fetch + vertex shader (con caché post-transformación si hay índices)
    cache = OrderedDict()
    salida = []
    for idx in indices:
        if indexado and idx in cache:
            est.aciertos_cache += 1
            salida.append(cache[idx])
            continue
        entrada = buscar_vertice(programa, vao, idx, constantes)
        pos, varyings = programa.vertex_shader(entrada, programa.uniforms)
        est.invocaciones_vs += 1
        v = (tuple(float(c) for c in pos), dict(varyings))
        if trazar:
            trazar("vertice", {"indice": idx, "entrada": entrada, "gl_Position": v[0], "varyings": v[1]})
        if indexado:
            cache[idx] = v
            if len(cache) > estado.cache_vertices:
                cache.popitem(last=False)                # FIFO: sale el más antiguo
        salida.append(v)
    # 3. ensamblado, y el resto del pipeline por triángulo
    for a, b, c, i_primero, i_ultimo in ensamblar(modo, salida):
        est.triangulos += 1
        prov = salida[i_ultimo if estado.provocador == "ULTIMO" else i_primero]
        flat_de = {k: prov[1][k] for k in programa.flat if k in prov[1]}
        procesar_triangulo(fb, programa, (a, b, c), flat_de, estado, est, trazar)
    return est


def dibujar_arrays(fb, programa, vao, modo, primero, cuenta, estado=None, constantes=None, trazar=None):
    """≈ gl.drawArrays(modo, primero, cuenta): vértices consecutivos, sin índices."""
    return _dibujar(fb, programa, vao, modo, range(primero, primero + cuenta),
                    estado, constantes, trazar, indexado=False)


def dibujar_elementos(fb, programa, vao, modo, cuenta, tipo, offset, estado=None, constantes=None, trazar=None):
    """≈ gl.drawElements(modo, cuenta, tipo, offset): los índices salen del EBO del VAO."""
    if vao.elementos is None:
        raise RuntimeError("el VAO no tiene buffer de índices (en GL: INVALID_OPERATION)")
    codigo, nbytes, _ = TIPOS[tipo]
    if offset % nbytes:
        raise ValueError("offset no múltiplo del tamaño del índice (WebGL: INVALID_OPERATION)")
    indices = struct.unpack_from("<" + codigo * cuenta, vao.elementos.datos, offset)
    return _dibujar(fb, programa, vao, modo, indices, estado, constantes, trazar, indexado=True)
