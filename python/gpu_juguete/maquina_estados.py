"""maquina_estados.py — la GPU de juguete con la "cara" de OpenGL/WebGL.

En gpu.py pasamos los objetos explícitamente: dibujar_arrays(fb, programa, vao, ...).
La API real NO funciona así: es una MÁQUINA DE ESTADOS. Hay "puntos de enlace"
(ARRAY_BUFFER, el VAO actual, el programa actual...) y cada llamada lee o modifica
lo que esté enlazado EN ESE MOMENTO. Esta clase es exactamente eso: unas pocas
variables de estado y funciones que las leen. Nada más.

Los nombres imitan a WebGL (gl.bindBuffer → ctx.bind_buffer) y los errores se
comportan como en GL: la llamada errónea no hace nada, apunta el error y sigue;
tú te enteras solo si llamas a get_error().
"""
import gpu

# Constantes con los mismos valores que en WebGL/OpenGL
NO_ERROR, INVALID_ENUM, INVALID_VALUE, INVALID_OPERATION = 0, 0x0500, 0x0501, 0x0502
ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER = 0x8892, 0x8893
ARRAY_BUFFER_BINDING, ELEMENT_ARRAY_BUFFER_BINDING = 0x8894, 0x8895
VERTEX_ARRAY_BINDING, CURRENT_PROGRAM = 0x85B5, 0x8B8D
VERTEX_ATTRIB_ARRAY_ENABLED, VERTEX_ATTRIB_ARRAY_SIZE = 0x8622, 0x8623
VERTEX_ATTRIB_ARRAY_STRIDE, VERTEX_ATTRIB_ARRAY_TYPE = 0x8624, 0x8625
CURRENT_VERTEX_ATTRIB, VERTEX_ATTRIB_ARRAY_NORMALIZED = 0x8626, 0x886A
VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 0x889F
CULL_FACE, DEPTH_TEST, BLEND = 0x0B44, 0x0B71, 0x0BE2
COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT = 0x4000, 0x0100
NOMBRES_ERROR = {NO_ERROR: "NO_ERROR", INVALID_ENUM: "INVALID_ENUM",
                 INVALID_VALUE: "INVALID_VALUE", INVALID_OPERATION: "INVALID_OPERATION"}


class UbicacionUniform:
    """Lo que devuelve getUniformLocation: un 'ticket' ligado a UN programa."""

    def __init__(self, programa, nombre):
        self.programa, self.nombre = programa, nombre

    def __repr__(self):
        return f"<UbicacionUniform {self.nombre}>"


class ContextoGL:
    def __init__(self, ancho, alto, avisar=True):
        self.framebuffer = gpu.Framebuffer(ancho, alto)
        # ---- el ESTADO: esto es todo lo que "recuerda" la máquina ----
        self.vao_por_defecto = gpu.VAO()          # WebGL1 / perfil compatible: siempre hay uno
        self.vao_actual = self.vao_por_defecto    # gl.bindVertexArray
        self.array_buffer = None                  # gl.bindBuffer(gl.ARRAY_BUFFER, ...)
        self.programa_actual = None               # gl.useProgram
        self.constantes = {}                      # gl.vertexAttrib4f: valores "actuales"
        self.estado = gpu.EstadoFijo()            # gl.enable/cullFace/depthFunc/blendFunc...
        self.color_limpiar = (0.0, 0.0, 0.0, 0.0)  # gl.clearColor
        self.error = NO_ERROR                     # el primer error pendiente
        self.avisar = avisar

    # ------------------------------------------------------------------ errores
    def _error(self, codigo, mensaje):
        if self.avisar:
            print(f"   [GL] {NOMBRES_ERROR[codigo]}: {mensaje}")
        if self.error == NO_ERROR:                # GL solo guarda el primero hasta que lo leas
            self.error = codigo

    def get_error(self):
        e, self.error = self.error, NO_ERROR
        return e

    # ------------------------------------------------------------------ buffers
    def create_buffer(self):
        b = gpu.Buffer()
        b.objetivo = None                         # WebGL recuerda el primer destino al que se enlazó
        return b

    def bind_buffer(self, destino, buffer):
        if buffer is not None:
            if getattr(buffer, "objetivo", None) is None:
                buffer.objetivo = destino
            elif buffer.objetivo != destino:      # regla de WebGL (no de OpenGL)
                return self._error(INVALID_OPERATION, "un buffer de vértices no puede ser de índices (ni al revés)")
        if destino == ARRAY_BUFFER:
            self.array_buffer = buffer            # estado del CONTEXTO
        elif destino == ELEMENT_ARRAY_BUFFER:
            self.vao_actual.elementos = buffer    # estado del VAO actual
        else:
            self._error(INVALID_ENUM, "destino desconocido")

    def _enlazado(self, destino):
        return self.array_buffer if destino == ARRAY_BUFFER else self.vao_actual.elementos

    def buffer_data(self, destino, datos):
        b = self._enlazado(destino)
        if b is None:
            return self._error(INVALID_OPERATION, "bufferData: no hay ningún buffer enlazado a ese destino")
        b.subir(datos)                            # modifica el buffer ENLAZADO, sea cual sea

    def buffer_sub_data(self, destino, offset, datos):
        b = self._enlazado(destino)
        if b is None:
            return self._error(INVALID_OPERATION, "bufferSubData: no hay buffer enlazado")
        try:
            b.actualizar(offset, datos)
        except ValueError as e:
            self._error(INVALID_VALUE, str(e))

    # ------------------------------------------------------------------ VAO
    def create_vertex_array(self):
        return gpu.VAO()

    def bind_vertex_array(self, vao):
        self.vao_actual = vao if vao is not None else self.vao_por_defecto

    def enable_vertex_attrib_array(self, loc):
        self.vao_actual.habilitados.add(loc)

    def disable_vertex_attrib_array(self, loc):
        self.vao_actual.habilitados.discard(loc)

    def vertex_attrib_pointer(self, loc, size, tipo, normalizado, stride, offset, entero=False):
        nbytes = gpu.TIPOS[tipo][1]
        if size not in (1, 2, 3, 4) or stride < 0 or offset < 0:
            return self._error(INVALID_VALUE, "size, stride u offset no válidos")
        if stride > 255:
            return self._error(INVALID_VALUE, "stride mayor que 255 (límite de WebGL)")
        if stride % nbytes or offset % nbytes:
            return self._error(INVALID_OPERATION, "stride y offset deben ser múltiplos del tamaño del tipo")
        if self.array_buffer is None and offset != 0:
            return self._error(INVALID_OPERATION, "no hay ARRAY_BUFFER enlazado y offset no es 0")
        # ¡La clave! El descriptor se queda con el buffer enlazado AHORA MISMO.
        self.vao_actual.atributos[loc] = gpu.Atributo(self.array_buffer, size, tipo, normalizado,
                                                      stride, offset, entero=entero)

    def vertex_attrib_i_pointer(self, loc, size, tipo, stride, offset):
        self.vertex_attrib_pointer(loc, size, tipo, False, stride, offset, entero=True)

    def vertex_attrib_4f(self, loc, x, y, z, w):
        self.constantes[loc] = (x, y, z, w)       # estado del CONTEXTO, no del VAO

    def get_vertex_attrib(self, loc, pname):
        a = self.vao_actual.atributos.get(loc)
        if pname == VERTEX_ATTRIB_ARRAY_ENABLED:
            return loc in self.vao_actual.habilitados
        if pname == CURRENT_VERTEX_ATTRIB:
            return self.constantes.get(loc, (0.0, 0.0, 0.0, 1.0))
        if a is None:                              # valores por defecto de un atributo sin configurar
            return {VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: None, VERTEX_ATTRIB_ARRAY_SIZE: 4,
                    VERTEX_ATTRIB_ARRAY_STRIDE: 0, VERTEX_ATTRIB_ARRAY_TYPE: gpu.FLOAT,
                    VERTEX_ATTRIB_ARRAY_NORMALIZED: False}[pname]
        return {VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: a.buffer, VERTEX_ATTRIB_ARRAY_SIZE: a.size,
                VERTEX_ATTRIB_ARRAY_STRIDE: a.stride, VERTEX_ATTRIB_ARRAY_TYPE: a.tipo,
                VERTEX_ATTRIB_ARRAY_NORMALIZED: a.normalizado}[pname]

    # ------------------------------------------------------------------ programas y uniforms
    def use_program(self, programa):
        self.programa_actual = programa

    def get_uniform_location(self, programa, nombre):
        # Si el uniform no existe (o el compilador lo eliminó por no usarse): None, sin error.
        return UbicacionUniform(programa, nombre) if nombre in programa.tipos_uniform else None

    def uniform(self, ubicacion, valor):
        if ubicacion is None:
            return                                # ¡silencio! ni error ni aviso: no hace nada
        if self.programa_actual is None:
            return self._error(INVALID_OPERATION, "uniform: no hay programa en uso (useProgram)")
        if ubicacion.programa is not self.programa_actual:
            return self._error(INVALID_OPERATION, "uniform: la ubicación es de OTRO programa")
        self.programa_actual.uniforms[ubicacion.nombre] = valor   # estado del PROGRAMA

    # ------------------------------------------------------------------ estado fijo
    def enable(self, cap, activar=True):
        campo = {CULL_FACE: "cull_face", DEPTH_TEST: "depth_test", BLEND: "blend"}.get(cap)
        if campo is None:
            return self._error(INVALID_ENUM, "enable: capacidad desconocida")
        setattr(self.estado, campo, activar)

    def disable(self, cap):
        self.enable(cap, False)

    def cull_face(self, modo):
        self.estado.cull_mode = modo

    def front_face(self, modo):
        self.estado.front_face = modo

    def depth_func(self, funcion):
        self.estado.depth_func = funcion

    def blend_func(self, src, dst):
        self.estado.blend_func = (src, dst)

    def viewport(self, x, y, ancho, alto):
        self.estado.viewport = (x, y, ancho, alto)

    def clear_color(self, r, g, b, a):
        self.color_limpiar = (r, g, b, a)

    def clear(self, bits):
        fb = self.framebuffer
        if bits & COLOR_BUFFER_BIT:
            fb.color[:] = bytes(gpu.a_byte(c) for c in self.color_limpiar) * (fb.ancho * fb.alto)
        if bits & DEPTH_BUFFER_BIT:
            for i in range(len(fb.profundidad)):
                fb.profundidad[i] = 1.0

    # ------------------------------------------------------------------ consultas
    def get_parameter(self, pname):
        return {ARRAY_BUFFER_BINDING: self.array_buffer,
                ELEMENT_ARRAY_BUFFER_BINDING: self.vao_actual.elementos,
                VERTEX_ARRAY_BINDING: None if self.vao_actual is self.vao_por_defecto else self.vao_actual,
                CURRENT_PROGRAM: self.programa_actual}[pname]

    # ------------------------------------------------------------------ dibujo
    def _validar(self):
        if self.programa_actual is None:
            self._error(INVALID_OPERATION, "draw: no hay programa en uso")
            return False
        for loc in self.vao_actual.habilitados:
            a = self.vao_actual.atributos.get(loc)
            if a is None or a.buffer is None:
                self._error(INVALID_OPERATION, f"draw: el atributo {loc} está habilitado pero no tiene buffer")
                return False
        return True

    def draw_arrays(self, modo, primero, cuenta):
        if not self._validar():
            return None
        try:
            return gpu.dibujar_arrays(self.framebuffer, self.programa_actual, self.vao_actual, modo,
                                      primero, cuenta, self.estado, self.constantes)
        except (IndexError, TypeError) as e:
            self._error(INVALID_OPERATION, f"drawArrays: {e}")

    def draw_elements(self, modo, cuenta, tipo, offset):
        if not self._validar():
            return None
        if self.vao_actual.elementos is None:
            return self._error(INVALID_OPERATION, "drawElements: el VAO actual no tiene ELEMENT_ARRAY_BUFFER")
        try:
            return gpu.dibujar_elementos(self.framebuffer, self.programa_actual, self.vao_actual, modo,
                                         cuenta, tipo, offset, self.estado, self.constantes)
        except (IndexError, TypeError, ValueError) as e:
            self._error(INVALID_OPERATION, f"drawElements: {e}")
