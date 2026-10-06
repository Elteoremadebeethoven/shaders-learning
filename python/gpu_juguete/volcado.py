"""Volcado hexadecimal de un buffer, como `xxd` pero marcando vértices y atributos."""


def volcado_hex(datos, por_fila=16, inicio=0, fin=None):
    """Devuelve el volcado clásico: desplazamiento | bytes en hex | ASCII."""
    datos = bytes(datos)
    fin = len(datos) if fin is None else fin
    lineas = []
    for base in range(inicio, fin, por_fila):
        trozo = datos[base:min(base + por_fila, fin)]
        hexa = " ".join(f"{b:02x}" for b in trozo)
        ascii_ = "".join(chr(b) if 32 <= b < 127 else "." for b in trozo)
        lineas.append(f"{base:08x}  {hexa:<{por_fila * 3}} {ascii_}")
    return "\n".join(lineas)


def volcado_vertices(datos, stride, campos, n=None):
    """Un vértice por línea, con los bytes de cada atributo agrupados.

    campos: [(nombre, offset, nbytes), ...] dentro de cada vértice."""
    datos = bytes(datos)
    n = len(datos) // stride if n is None else n
    lineas = []
    for v in range(n):
        base = v * stride
        partes = []
        for nombre, off, nb in campos:
            b = datos[base + off:base + off + nb]
            partes.append(f"{nombre}[{' '.join(f'{x:02x}' for x in b)}]")
        lineas.append(f"vértice {v} @ byte {base:3d}: " + " ".join(partes))
    return "\n".join(lineas)
