"""Dónde guardan los ejemplos sus imágenes: la carpeta img/ del módulo 4 del curso.
Puedes cambiarla con la variable de entorno CARPETA_IMG."""
import os
from pathlib import Path

RAIZ_CURSO = Path(__file__).resolve().parents[2]


def carpeta_img():
    carpeta = Path(os.environ.get("CARPETA_IMG", RAIZ_CURSO / "modulos" / "04-gpu" / "img"))
    carpeta.mkdir(parents=True, exist_ok=True)
    return carpeta
