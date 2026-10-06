"""probar_todo.py — ejecuta TODOS los scripts del curso y comprueba que funcionan.

Ejecuta (con el entorno virtual activado):   python probar_todo.py
Opciones:  --sin-ventana   no abre la ventana de glfw (03_ventana_glfw.py)

Cada script se lanza en su propio proceso (como lo harías tú) con un tiempo máximo.
Al final se comprueba que las imágenes que deben generar existen y son nuevas.
"""
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
IMG = RAIZ.parent / "modulos" / "04-gpu" / "img"
SIN_VENTANA = "--sin-ventana" in sys.argv

# (carpeta, script, argumentos, imágenes que debe generar)
SCRIPTS = [
    ("gpu_juguete", "pruebas.py", [], []),
    ("gpu_juguete", "ejemplo_01_triangulo.py", [], ["juguete-triangulo.png"]),
    ("gpu_juguete", "ejemplo_02_indices.py", [], ["juguete-quad-indices.png"]),
    ("gpu_juguete", "ejemplo_03_profundidad.py", [], ["juguete-sin-profundidad.png", "juguete-con-profundidad.png", "juguete-zbuffer.png"]),
    ("gpu_juguete", "ejemplo_04_perspectiva.py", [], ["juguete-pared-correcta.png", "juguete-pared-afin.png", "juguete-suelo-correcto.png",
                                                      "juguete-suelo-afin.png", "juguete-suelo-afin-subdividido.png"]),
    ("gpu_juguete", "ejemplo_05_blending.py", [], ["juguete-blending.png"]),
    ("gpu_juguete", "ejemplo_06_maquina_estados.py", [], ["juguete-estado-bug.png"]),
    ("gpu_juguete", "ejemplo_07_formatos.py", [], ["juguete-formatos.png", "juguete-sin-normalizar.png"]),
    ("gpu_juguete", "ejemplo_08_varyings.py", [], ["juguete-varyings.png", "juguete-vertexid.png"]),
    ("gpu_juguete", "ejercicios/ej1_fragment_shader.py", [], ["ej1-fragment.png"]),
    ("gpu_juguete", "ejercicios/ej2_culling.py", [], ["ej2-culling.png"]),
    ("gpu_juguete", "ejercicios/ej3_uniform.py", [], ["ej3-uniform.png"]),
    ("gpu_juguete", "soluciones/ej1_fragment_shader.py", [], ["ej1-fragment-solucion.png"]),
    ("gpu_juguete", "soluciones/ej2_culling.py", [], ["ej2-culling-solucion.png"]),
    ("gpu_juguete", "soluciones/ej3_uniform.py", [], ["ej3-uniform-solucion.png"]),
    ("moderngl", "01_triangulo.py", [], ["moderngl-triangulo.png"]),
    ("moderngl", "02_buffers_y_vao.py", [], ["moderngl-quad.png"]),
    ("moderngl", "03_uniforms.py", [], ["moderngl-uniforms.png"]),
    ("moderngl", "04_interpolacion.py", [], ["moderngl-interpolacion.png"]),
    ("moderngl", "05_sin_buffers.py", [], ["moderngl-vertexid.png"]),
    ("moderngl", "comparar_con_juguete.py", [], ["comparacion-juguete-real.png"]),
    ("moderngl", "soluciones/ej2_quad_indices.py", [], ["ej-moderngl-quad.png"]),
    ("moderngl", "soluciones/ej3_cubo.py", [], ["ej-moderngl-cubo.png"]),
    ("moderngl", "soluciones/ej4_formatos.py", [], []),
    ("pyopengl", "01_triangulo_crudo.py", [], ["pyopengl-triangulo.png"]),
    ("pyopengl", "02_estado_y_errores.py", [], ["pyopengl-alineacion.png"]),
]
if not SIN_VENTANA:
    SCRIPTS.append(("pyopengl", "03_ventana_glfw.py", ["--frames", "60", "--captura", str(IMG / "pyopengl-ventana.png")],
                    ["pyopengl-ventana.png"]))

inicio = time.time()
fallos = []
for carpeta, script, argumentos, imagenes in SCRIPTS:
    ruta = RAIZ / carpeta / script
    t0 = time.time()
    try:
        r = subprocess.run([sys.executable, str(ruta), *argumentos], cwd=ruta.parent,
                           capture_output=True, text=True, timeout=180)
        ok, salida = r.returncode == 0, (r.stdout + r.stderr)
    except subprocess.TimeoutExpired:
        ok, salida = False, "TIEMPO AGOTADO"
    faltan = [i for i in imagenes if not (IMG / i).exists() or (IMG / i).stat().st_mtime < t0 - 1]
    ok = ok and not faltan
    print(f"{'✓' if ok else '✗'} {carpeta}/{script:34s} {time.time() - t0:5.1f} s" + (f"  faltan: {faltan}" if faltan else ""))
    if not ok:
        fallos.append(script)
        print("   " + salida.strip().replace("\n", "\n   ")[-2000:])

# La captura de la ventana sale al tamaño del framebuffer Retina (2×): la reducimos para la web.
captura = IMG / "pyopengl-ventana.png"
if not SIN_VENTANA and captura.exists():
    from PIL import Image
    im = Image.open(captura)
    if im.width > 640:
        im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(captura)

print(f"\n{len(SCRIPTS) - len(fallos)}/{len(SCRIPTS)} scripts correctos en {time.time() - inicio:.1f} s")
sys.exit(1 if fallos else 0)
