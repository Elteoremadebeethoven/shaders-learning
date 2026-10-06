"""Codificador PNG mínimo: solo biblioteca estándar (zlib + struct).

Un PNG es: una firma de 8 bytes y una lista de "trozos" (chunks).
Cada trozo = longitud (4 bytes, big-endian) + tipo (4 letras) + datos + CRC32.
Nos bastan tres trozos: IHDR (cabecera), IDAT (píxeles comprimidos) e IEND (fin).
"""
import struct
import zlib

FIRMA = b"\x89PNG\r\n\x1a\n"


def _trozo(tipo, datos):
    crc = zlib.crc32(tipo + datos) & 0xFFFFFFFF          # el CRC cubre tipo + datos
    return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", crc)


def codificar_png(ancho, alto, rgba):
    """rgba: bytes con ancho*alto*4 valores, filas de ARRIBA a ABAJO."""
    fila = ancho * 4
    assert len(rgba) == fila * alto, "tamaño de datos incorrecto"
    # Cada fila va precedida de un byte de "filtro" (0 = sin filtro).
    crudo = b"".join(b"\x00" + bytes(rgba[y * fila:(y + 1) * fila]) for y in range(alto))
    # IHDR: ancho, alto, 8 bits por canal, tipo de color 6 (RGBA),
    # compresión 0 (deflate), filtro 0, sin entrelazado.
    ihdr = struct.pack(">IIBBBBB", ancho, alto, 8, 6, 0, 0, 0)
    return (FIRMA + _trozo(b"IHDR", ihdr)
            + _trozo(b"IDAT", zlib.compress(crudo, 9))
            + _trozo(b"IEND", b""))


def guardar_png(ruta, ancho, alto, rgba):
    with open(ruta, "wb") as f:
        f.write(codificar_png(ancho, alto, rgba))


def leer_png(ruta):
    """Lector mínimo (solo los PNG RGBA sin filtros que escribe este módulo).
    Devuelve (ancho, alto, bytes RGBA de arriba a abajo). Útil para las pruebas."""
    with open(ruta, "rb") as f:
        datos = f.read()
    assert datos[:8] == FIRMA, "no es un PNG"
    pos, idat, ancho, alto = 8, b"", 0, 0
    while pos < len(datos):
        (n,) = struct.unpack(">I", datos[pos:pos + 4])
        tipo = datos[pos + 4:pos + 8]
        cuerpo = datos[pos + 8:pos + 8 + n]
        if tipo == b"IHDR":
            ancho, alto = struct.unpack(">II", cuerpo[:8])
        elif tipo == b"IDAT":
            idat += cuerpo
        pos += 12 + n
    crudo = zlib.decompress(idat)
    fila = ancho * 4
    salida = bytearray()
    for y in range(alto):
        inicio = y * (fila + 1)
        assert crudo[inicio] == 0, "este lector solo entiende el filtro 0"
        salida += crudo[inicio + 1:inicio + 1 + fila]
    return ancho, alto, bytes(salida)
