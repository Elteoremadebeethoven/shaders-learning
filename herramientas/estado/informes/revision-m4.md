# Revisión del Módulo 4 · La GPU por dentro

Las seis lecciones quedan sin problemas en `verificar.mjs` (oscuro, con `--soluciones`; 4.6 también en claro). Solo avisa de enlaces a lecciones del módulo 7 que aún no existen (`07-siguientes-pasos`, `05-particulas-gpu`, `04-vertex-animacion`). Las soluciones de 4.1, 4.2, 4.3, 4.4 y 4.5 compilan y hacen lo que pide el enunciado. No hizo falta rescribir ninguna sección entera. No abrí ningún servidor: todo fue con `file://`, y las esperas largas fueron en segundo plano.

Sobre lo que ocurrió antes de esta revisión: sigue vivo un `python -m http.server 8765` (PID 32429). No lo lancé en esta revisión, lo dejé como estaba y puedes matarlo cuando quieras.

Las capturas están en `scratchpad/capturas/rev-m4/` (`final/` y `light/`). Los experimentos y la ejecución de `verificar.mjs` están en `scratchpad/experimentos/rev-m4/`. Todo lo que comprobé además de lo anterior:

- **Mensajes de error de Chrome:** los de GLSL, WebGL y de stride/offset/índices que cita el texto, uno a uno.
- **Comportamiento de WebGL:** `lineWidth`, `SUBPIXEL_BITS`, `MAX_SAMPLES`, uniforms, varyings, vértice provocador y atributo constante.
- **Tiempos:** 100 000 draw calls y la tabla de las 32 capas.
- **Codificación a 8 bits:** `n/255` da `n` en los 256 casos y `(n+0.5)/255` da `n+1` en 255.
- **Python:** los 26 scripts de `probar_todo.py --sin-ventana`, `pruebas.py` con el Python 3.9 del sistema, y que los extractos de código coinciden con los archivos (0 desincronizados).
- **Puerto JS:** la GPU de juguete en JS reproduce la de Python (18 432 fragmentos, píxel (128, 100) = (81, 83, 91, 255) y (254, 0, 1) en el (32, 32)).
- **GLFW y PyOpenGL:** GLFW 3.4 activa solo el forward-compatible, y `glVertexAttribPointer` de PyOpenGL hace lo que dice 4.6.2.
- **Enlaces:** los cruzados entre lecciones apuntan a los números correctos del manifest.

## 4.1 CPU vs GPU
Cambios en `01-cpu-vs-gpu.html` y `recursos/demos-41.js`:
- **Caja «hack» de bloques de 8×8:** decía «en el ejemplo 4.1.1 mediste…», pero el 4.1.1 es la cuenta teórica. Ahora remite al playground «Divergencia medida en tu GPU» y dice «16–17 ms».
- **Demo de la máquina de estados:** decía «penúltima línea», y esa línea es un comentario. El fallo está en la última llamada.
- **Demo de la cola:** el texto decía «ocho veces más despacio», pero `t += dt*8` son 8 ms simulados por segundo real, unas 125 veces más despacio. Corregí el texto y el comentario del código.
- **Viñeta de ANGLE:** decía «en esta lección has visto varios» mensajes de ANGLE y no había ninguno. Ahora dice que lo verás en 4.4.
- **Tablas de tiempos:** las cifras exactas (17 ms, 8,5–9 ms) no se reproducen entre ejecuciones (medí 15,7 y 8,0–8,5). Las cambié por rangos (15,5–17 y 8–9 ms).
- **CPU frente a GPU:** «de 130 a 150 veces» pasa a «de 100 a 230 veces». Medí entre 100× y 230×, según lo ocupado que esté el equipo.
- **Solución del ejercicio 4.1.1:** el enunciado pedía la eficiencia con warps de 32 y de 64 y la solución solo la daba para 32. Añadí la de 64.
- **Ejemplo 4.1.3:** «Esto es TODO el estado» pasa a «estado esencial», con una nota de que el listado está abreviado respecto a `maquina_estados.py`. Quité «como en WebGL1», que inducía a error porque WebGL2 también tiene VAO por defecto.

## 4.2 Pipeline gráfico
Cambios en `02-pipeline-grafico.html` y `recursos/demo-pipeline.js`:
- **Fórmula rota del ejemplo 4.2.2:** el archivo tenía un TAB literal donde iba `\to`, así que `$B \to C$` salía como «B   o C». Corregido (comprobado con captura).
- **Demo de la regla de desempate:** contaba los vértices B y C como «centros sobre la arista compartida» y mostraba «sin pintar: 2» junto al mensaje «nunca huecos». Ahora excluye los vértices y muestra 1 y 0. Los modos «>= 0» (3 dobles) y «> 0» (1 hueco) siguen dando lo esperado.
- **Ejercicio 4.2.3:** «gran cuña» pasa a «gran superficie (un cuadrilátero)», como dice la solución.

## 4.3 GPU de juguete
Cambios en `03-gpu-de-juguete.html` y `recursos/demo-raster.js`:
- **Caja «hack» del printf:** usaba `gl_InstanceID` dentro del fragment shader y eso no compila (`undeclared identifier`, comprobado). Ahora el vertex shader lo pasa como `flat out int`.
- **Demo de rasterización:** el mensaje «las tres ≥ 0: DENTRO / alguna negativa: FUERA» contradecía la regla de desempate. Ahora dice «>0, o =0 en arista izquierda/inferior».
- **Ayudantes:** `volcado_hex` y `volcado_vertices` aparecían sin explicar; añadí que vienen de `volcado.py`.

## 4.4 VBO, VAO y EBO
Sin cambios de contenido, salvo quitar un «simplemente» (ver más abajo). Los mensajes de error, la tabla de tipos, los playgrounds (incluidos los botones «provocar errores»), la caché ACMR y el hack del VAO compartido coinciden con lo medido. Las soluciones dan 0,64 invocaciones por triángulo, 92 bytes y el quad correcto.

## 4.5 Uniforms y varyings
- **Demo del temblor de la PS1:** el fondo negro fijo del lienzo quedaba muy feo en tema claro. Ahora es transparente.
- **Resto:** todos los límites, mensajes y comportamientos de uniforms y varyings coinciden con lo medido, y la derivación de la interpolación con perspectiva es correcta.

## 4.6 OpenGL desde Python
- **Vsync:** «El vsync del OpenGL de macOS no es de fiar» generalizaba una sola medida (~90 fps irregulares, sin saber si la causa es GLFW o macOS). Lo suavicé.
- **Resto:** los scripts, las tablas, PyOpenGL y GLFW coinciden con lo comprobado. Los ejercicios de esta lección son solo de Python, como decía el informe del autor, y quedan sin playground.

## Cambios transversales
La guía prohíbe «simplemente», así que lo quité de 5 frases (4.2, 4.3 y 4.5).

## Pendientes menores (no corregidos)
- **Rutas impresas:** los scripts de Python imprimen `guardado: /ruta/absoluta/...` o `guardado img/...`, pero las lecciones 4.3 y 4.6 citan `guardado: modulos/04-gpu/img/...`. Es cosmético: se puede dejar o cambiar la cita por «guardado: …/img/…».
- **Etiquetas en `#demo-raster` (4.3):** si el alumno arrastra los vértices hasta un orden horario, los rótulos `E_BC`, `E_CA` y `E_AB` corresponden a los vértices ya intercambiados. Bastaría una nota o mostrar los nombres reales.
- **Enlaces de Khronos:** las cuatro páginas de `khronos.org/opengl/wiki` no se pudieron comprobar desde aquí (sin conexión a ese dominio). Sí respondieron las demás URLs externas, salvo `pyopengl.sourceforge.net`, `fabiensanglard.net`, `learnopengl.com` y el repositorio de ANGLE, que bloquean a `curl` (403, 406 y 503).
- **Medidas:** siguen siendo de un M1 con Chrome/ANGLE-Metal. Varían entre ejecuciones (hasta ±10 %, y más en la comparación CPU/GPU).
