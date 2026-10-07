# Sesión 4 · agente m0-m6 (módulos 0–6, python/, cabecera de glkit.js)

Máquina: MacBook Air Apple M1, Chrome 154.0.8037.98, ANGLE/Metal (renderer «ANGLE Metal Renderer: Apple M1»).
Informe terminado (todas las ediciones verificadas después de la última; ver (c)).

## (b) Mediciones

### Semántica (sin tiempos): `herramientas/estado/lab/s4-m0-m6-semantica.mjs` + `.html`
Chrome lanzado dos veces seguidas con el mismo perfil persistente (S1: perfil nuevo; S2: relanzado). Salida en el
SCRATCH (`sem/semantica.json`).

- **Precisión** (`getShaderPrecisionFormat`): todos los float `127,127,23`; todos los int (low/medium/high, vértice y
  fragmento) `31,30,0`.
- **isnan y la caché de programas** (WebGL crudo, mismo texto compilado varias veces):
  - experimento del lead (`if (isnan(u_z)) x += 1.0;` y `mod(x, 7.0)` en 4 096 múltiplos negativos de 7):
    1.ª compilación 0 fallos; 2.ª 2 071; tras recargar, en otra pestaña y tras relanzar Chrome con el mismo perfil, 2 071.
    El hecho 1 sigue vigente en Chrome 154.
  - hash del seno a 20 000 celdas (128 × 128): 2 069 valores distintos en la 1.ª compilación con isnan; 17 en las
    siguientes (= sin isnan). `0.0/0.0` con un cero de uniform: NaN la 1.ª vez, **1** después (y sin isnan);
    `atan(0, 0)`: 0 la 1.ª vez, NaN después.
  - **¿Detecta `isnan` un NaN en la versión que sale de la caché (con fast math)?** Sí: 16 384 de 16 384 píxeles con
    `isnan(u_nan)` (uniform NaN), y también con NaN calculados: `any(isnan(pow(negativo, 1/2.2)))`, `sqrt`/`log` de
    negativo y `normalize(vec3(0))`: 16 384/16 384 en la 1.ª compilación, en la 2.ª, en la 3.ª, tras recargar, en otra
    pestaña y tras relanzar Chrome. `isinf(1.0/0.0)`, igual. La única excepción es `0.0/0.0`, que con fast math
    **no produce** NaN (da 1), así que no hay nada que detectar. ⇒ La condición del encargo («si la 2.ª compilación da
    0 detecciones, avisar») no se cumple: **no hace falta el aviso** en las recetas de «NaN en magenta».
  - Nota sobre el laboratorio de la sesión 3: la fila «fallos de mod» de `pend-m0-m5-tiempos.html` (isnan-cache) da
    0 → 0 → 0 en el M1 porque ese shader calcula `mod(-(id+1000)*7, 7)` sin nada en medio y, con fast math, el
    compilador lo simplifica algebraicamente (también 0 fallos sin isnan): no sirve para ver la caché. El montaje del
    lead (con `x += 1.0` condicionado) sí la ve.
- **`pow` con base negativa** (M1): NaN con y sin fast math (`pow(-0.1346, 1/2.2)` y el shader del 5.10.4 en el punto
  que lee la lección: `dot(n, l) = −0,195`, final `(NaN, NaN, NaN)`, también con el texto fijo compilado varias veces).
  En la lección real: consola «píxel (308, 79): dot(n, l) = -0.194 · color final = (NaN, NaN, NaN)», vista normal con
  4 756 píxeles negro puro, vista de NaN con 6 172 píxeles magenta (capturas `sem/5104-vista0.png` y `-vista3.png`).
- **PCG** (256 × 256 celdas a (20 000, −70 000), salida `RGBA32UI` comparada bit a bit con la referencia en JS):
  0 diferencias con `precision highp int`, sin declarar (mediump), `mediump` y `lowp`. Un `int` de 40 000 × x
  (> 2¹⁵) tampoco se recorta. En el M1, ANGLE/Metal usa 32 bits para todos los enteros.
- **`texelFetch`** (montaje de `coh-m6-texelfetch.html`): fuera de rango en coordenadas → 0,0,0,0; incompleta →
  0,0,0,255; **nivel de mipmap inexistente → 0,0,0,0** en todos los casos (textura sin mipmaps nivel 1 y 3; con
  mipmaps nivel 3 de una 2 × 2; nivel −1; `TEXTURE_MAX_LEVEL` 0 y nivel 1; 16 × 16 nivel 5 y 7; textura con solo
  niveles 0–1 y nivel 2/5). Es lo que manda WebGL 2.0. SwiftShader (sesión 3) recortaba al nivel más cercano.
- **6.6, los dos editores del hash del seno** (niveles de gris distintos en el lienzo visible, 381 × 200): primera
  carga 17 / 256; al recargar 17 / 256; tras cerrar y relanzar Chrome con el mismo perfil 17 / 256. Confirmado.

### Tiempos de GPU (turno `--exclusivo`; Apple M1, Chrome 154, ANGLE/Metal)
Scripts: `lab/pend-m0-m5-tiempos.mjs` (completo + repetición de 5.10), `lab/rev-m7-1-tiempos.mjs`,
`lab/s4-m0-m6-tiempos.mjs` (+ `.html`: hack de 4.2 con el `discard` al principio, `readPixels` promediado de 5.8,
picking con scissor por los dos métodos y `PIXEL_PACK_BUFFER` + valla) y `lab/s4-m0-m6-playgrounds.mjs` (ejecuta los
playgrounds de las lecciones tal cual y recoge su consola; permite cambiar una línea, p. ej. `N`). «Pasadas» = cada
escena en su propia pasada (dos FBO alternos con clear), `readPixels` al final, mediana de 5 tandas; «barreras» = una
escena entre dos `readPixels`, mediana de 3–5 (el método de los playgrounds de 4.1/4.2).

| Lección · sitio | Antes | Ahora (método) |
|---|---|---|
| 4.1 «0,9 TFLOPS» | sin método | 0,91 TFLOPS (4 cadenas vec4, 1000 vueltas, 1024², pasadas): **se mantiene**; añado el método al texto |
| 4.1 «10 000 draw calls contra 1» | 3,5 ms (JS 0,3); inst. 0,7; 100 000: 26 ms (JS 10) | playground ×4: 3,3–5,7 ms (JS 0,4–1,0); inst. 0,7–1,1; con `N = 100000` ×4: 29–31 ms (JS 9,7–10,7) |
| 4.1 ejercicio 4.1.3 | 40–45 ms → ≈ 3 ms | playground ×4/×3: 30,8–39,8 ms → 2,5–2,7 ms |
| 4.1 «El mismo cálculo…» (sin cambio) | GPU 7–10 ms, CPU 1,0–1,5 s | playground ×3: GPU 6,3–6,7 ms (pasadas 4,9); CPU 2,25–2,46 s en headless (no lo toco: el JS de una página headless en el M1 no es comparable, ver (d)) |
| 4.1 divergencia, memoria, tabla de llamadas (sin cambio) | 8–9 / 15,5–17 / ≈9; ≈1 / ≈18; 12 ms | 7,9–8,0 / 15,2–15,8 / 8,0–8,4; 1,1–1,2 / 17,3–17,5; 11,4–11,6 ms (`getError` ×1000: 56–68 ms, algo por encima de los «0,03–0,06 ms» de la tabla; no lo cambio) |
| 4.2 tabla de 32 capas | 1 capa 2,4–3,5; opacas 2,2–2,9; discard d→a 14–15,5 (4–6×); discard a→d, `gl_FragDepth`, blending 59–66 (17–27×) | pasadas: 1,8 / 1,8 / 12,9 (7×) / 56,0–56,2 (31×). Playground ×3: 1 capa 3,8–4,6; opacas 2,4–3,5; 56,7–57,5 (12–15×) |
| 4.2 hack «Ocultar objetos desde el VS» | visibles con discard 46 ms, VS 2 ms; ocultas 0,5 (VS) frente a 1,1 (discard) | `if (oculto) discard;` al principio (montaje del texto): visibles 56,0–56,1 (barreras 57) / VS 1,8 (2,4–2,8); ocultas VS 0,11–0,13 (≈ no dibujar nada, 0,09) / discard 0,59–0,60 (1,2–1,3). (En `pend-m0-m5` el discard iba después del bucle caro: las ocultas pagaban 56 ms; montaje equivocado) |
| 4.2 senior «El driver también conoce trucos» | alfa 1 constante 2,6 ms; calculado 66 ms | pasadas 1,8 / 56,1 (barreras 2,7 / 56,9) |
| 5.8 `readPixels` | 0,03 / 0,4 ms (dibujo 0,004); pesado 14 ms | promedio de 200 y 100 lecturas, dos ejecuciones: 0,06–0,07 / 0,34–0,58 ms (dibujo 0,002–0,003); tras 600 senos a 1024²: 11,4–11,9 ms |
| 5.8 hack picking | completo 14 ms, scissor 0,6 ms | completo 11,8 (barreras) / 10,9 (pasadas); scissor 0,6–0,7 (barreras) = pasada vacía 0,6–0,7; por pasadas 0,10 ≈ vacía 0,09 |
| 5.8 senior PBO | 0 ms frente a 14; valla 3 frames después | 0 ms frente a 11,4–11,9; con 3 dibujos pesados por delante, valla a los 2–3 frames (21–28 ms); datos correctos ×5 |
| 5.10 «¿Me frena…?» | 5,1 / 16,7 / 35,9 ms (×3,3, ×7); 20 000 llamadas 5,4 / 5,6 / 6,7 | u_n = 300: 3,9–4,0 / 15,7 / 35,2–35,4 ms (×3,9–4,0 y ×8,8–9,0: proporcional a los píxeles; el 16,7 era un periodo de vsync); 20 000 llamadas 4,2–4,6 / 4,2–4,6 / 4,4–4,8 |
| 5.10 «La resolución» | «7 veces más» | casi 9 veces (35,3 frente a 4,0) |
| 5.10 cambios de estado | 8,4 / 3,6; 6,3 / 4,1 | 6,6–6,9 / 2,4–2,6; 5,4–6,0 / 2,9–3,1 |
| 5.10 overdraw y senior | 1 capa 5,9–6,4; 16 opacas 6,1–6,5; 16 translúcidas 85,9; con discard 86,9 | (fondo a 300 vueltas, 800 × 500) 4,0; 4,0 (cualquier orden y sin prueba de profundidad); 63,0–63,4 (16×); 63,0–63,6 |
| 5.10 subir texturas (sin cambio) | 1 / 0,3 ms | pasada con subida 0,85–1,1 / 0,25–0,28 (sin subir 0,09–0,12) |
| 5.10 temporizador (sin cambio) | mediana 42 ms frente a 5,4 por pasadas (6.6) | 12 consultas de un dibujo de 10,9 ms: de 10,9 a 113,8 ms (mediana 59) y de 11,0 a 73,6 (mediana 43); el mínimo coincide con las pasadas. Crece ~10,7 ms por consulta: en headless sin presentar nada, los frames se ejecutan juntos y la consulta mide desde el principio del lote. Coherente con el recuadro; no lo cambio |
| 5.9 (no tocado) | 1 M → 60 fps, 4 M → 19 fps | 1 440 × 900, pasadas: 15,7 ms y 69 ms (≤ 14 fps). El tamaño del lienzo y de los cuadraditos del original no constan: no comparable |

### Otras comprobaciones
- **GLSL ES 1.00, índices no constantes** (`lab/s4-m0-m6-indices.mjs`, contextos WebGL1 y WebGL2): en el fragment
  shader, array local, array `uniform` y `vec4` con índice uniform → `'n' : Index expression can only contain const or
  loop symbols`; índice del bucle → compila. En el vertex shader, array `uniform` con índice uniform o derivado de un
  atributo → compila; array local → el mismo error. Confirma la propuesta de anexos para 6.10.
- **¿De dónde se lee el píxel final al medir?** (`s4-m0-m6-tiempos.mjs`, prueba `6.6-leer`, propuesta de m7b): tras 10
  pasadas de 600 senos a 1024² que solo escriben en FBO, leer 1 px del canvas: 0,05 ms por pasada (no espera); del FBO
  de la última pasada: 10,89 ms. Confirmado.
- **Python** (`python/.venv`, Python 3.14.7, macOS 26.6.2): `probar_todo.py` → 27/27 en 7,6 s (incluida la ventana
  glfw). Las 33 imágenes de `modulos/04-gpu/img/` salieron idénticas byte a byte salvo `pyopengl-ventana.png` (el
  triángulo gira: depende del instante); restauré esa del respaldo para no cambiar el archivo sin motivo.
  `moderngl.create_standalone_context()` → «Apple M1 4.1 Metal - 90.5» (como dice el README). vsync con glfw
  (`SCRATCH/py/vsync.py`, ventana de 320 × 240 en la pantalla Retina de 60 Hz): `swap_interval(1)` 83 y 90 vueltas/s,
  intervalos de 2,6–17 ms (mediana 13–16); `swap_interval(0)` 4 990 vueltas/s.

## (a) Cambios hechos y porqué

| Archivo | Cambio | Motivo |
|---|---|---|
| `04-gpu/01-cpu-vs-gpu.html` (4.1) | Método del 0,9 TFLOPS (4 cadenas vec4, cada dibujo en su pasada, enlace a 4.2). «10 000 draw calls contra 1»: cifras de Chrome 154 (3,3–5,7 ms, JS 0,4–1; instanciado 0,7–1,1; 100 000: ~30 ms, JS ~10) y «cambia `N`». Ejercicio 4.1.3: 30–40 ms → 2,5 ms | Re-medido (el TFLOPS se mantiene; las demás cifras habían cambiado) |
| `04-gpu/02-pipeline-grafico.html` (4.2) | Tabla de 32 capas rehecha: columna por pasadas (1,8 / 1,8 / 12,9 / 56 ms; 1×, 7×, 31×) y columna del playground (3 ejecuciones). Párrafo del método: por qué el «× una capa» del playground no es estable (coste fijo de pasada + `readPixels`, ~0,6 ms) y qué hace la columna fiable. «Se sombrean las 32 capas: 31 veces». Bestiario `m4-discard-lento` y quiz: «17–27×» → 31× / «unas 30 veces». Hack del VS: 56 / 1,8 ms visibles; 0,1 / 0,6 ms ocultas (`if (oculto) discard;` al principio, pasadas). Senior del driver: 1,8 / 56 ms | Las cifras eran de una medida inestable; el cociente 31 dice mejor lo que pasa (se pagan las 32) |
| `05-webgl/07-blending.html` (5.7) | «entre 17 y 27 veces» → «unas 30 veces» | Coherencia con 4.2 |
| `05-webgl/08-framebuffers.html` (5.8) | `readPixels`: 0,06 / 0,3–0,6 ms (dibujo 0,003); pesado 12 ms con el shader descrito. Hack del picking: 12 ms → 0,6 ms, «lo mismo que una pasada sin dibujar nada». Senior PBO: 12 ms; valla «dos o tres frames después» con tres dibujos pesados por delante | Re-medido; el 0,6 ms es el coste fijo, ahora se dice |
| `05-webgl/10-depuracion.html` (5.10) | «¿Me frena…?»: 4,0 / 15,7 / 35,3 ms (3,9× y 8,8×, la proporción de píxeles) con el shader y el método dichos; 20 000 llamadas 4,2–4,8 ms. «La resolución»: «casi 9 veces más» (antes «7»). Causas habituales: intro con método; estado 6,7 / 2,5 y 5,7 / 3,0; overdraw 63 ms frente a 4,0 (16×). Senior «Overdraw opaco»: 4,0 / 63 / 63 ms. Tras el ejemplo 5.10.4: `pow` con base negativa es indefinido; M1 → NaN con y sin fast math; SwiftShader → `pow(|x|, y)`, cara marrón, la vista de NaN no marca nada, lectura (0,402, 0,272, 0,162); el diagnóstico es el mismo. Caja «Medir NaN con isnan()…»: la detección no falla en la versión de la caché; lo que cambia es que `0.0/0.0` deja de dar NaN. Senior del temporizador: el píxel final se lee del framebuffer de la última pasada | Encargos 1–3; el 16,7 ms era un periodo de vsync |
| `03-matematicas/07-precision.html` (3.7) | `precision highp int;` en los dos editores con PCG (l.~278 y l.~617). En el párrafo del hash: «si pides enteros de 32 bits con `precision highp int`». En «El límite de 2²⁴»: la letra pequeña (mediump int solo garantiza 16 bits; en el M1 los tres calificadores dan 32 y PCG da los mismos bits; por eso los editores lo declaran) | Encargo 4; medido en el M1, sin exagerar |
| `05-webgl/05-texturas.html` (5.5) | `texelFetch` con nivel inexistente: (0,0,0,0) en el M1 (Chrome 154, mayor que el último o negativo); SwiftShader recorta al nivel más cercano (enlace a 6.8); «el código correcto nunca lee fuera» | Encargo 5 |
| `06-glsl/08-texturas-efectos.html` (6.8) | «(repetido con Chrome 154, también con un nivel negativo y con niveles por encima del último de una textura con mipmaps)» | El M1 no difiere; solo se confirma |
| `06-glsl/06-ruido.html` (6.6) | l.114: «en Chrome 154: … en la primera carga, al recargar y al cerrar y volver a abrir Chrome …; el primero, 17 las tres veces». Bestiario `m6b-ruido-textura-escalones`: enlace a `m7-4-heightmap-escalones`. Caja `#medir-coste-shader`: el píxel se lee del framebuffer de la última pasada (0,05 frente a 10,9 ms) | Encargos 6 y 9; propuesta de m7b (tablón) |
| `06-glsl/09-raymarching.html` (6.9) | Bestiario `m6b-rm-normales`: «En 7.4 aparece el mismo problema…» con enlace a `m7-4-epsilon` (título exacto) | Encargo 9 |
| `06-glsl/01-lenguaje.html` (6.1) | Cita exacta: el párrafo «¿Cuándo falla mod?» de la caja «Un patrón que se repite sin costuras en una textura» | Encargo 7 (6.6 ya estaba bien) |
| `06-glsl/10-codigo-ajeno.html` (6.10) | Tabla 1.00 → 3.00: «también para los uniforms del fragment shader (en el vertex shader, los arrays `uniform` admiten cualquier índice)» | Tablón (anexos), comprobado |
| `01-web/06-binario.html` (1.6) | La promesa de SoA en 7.5 → «en la 7.5 verás por qué, para subir esos datos a la GPU, conviene entrelazarlos (AoS)» | Encargo 8 (7.5 entrelaza para la GPU) |
| `01-web/04-js-dom-eventos.html` (1.4) | Senior «Más muestras…»: Chrome puede despachar los `pointermove` según llegan o retenerlos hasta justo antes del rAF, según el sistema y la carga; enlace a 7.2 | Opcional (d)4 de revision-m7-2, ajustado a lo que m7a midió en el M1 (no se alinean con el hilo libre) |
| `02-animacion/05-fisica-muelles.html` (2.5) | «El 31 no es una constante: … entre 2 y 39 … lo único fijo es que los coalescidos las suman todas» (enlace a 7.2) | Opcional (d)3, con la cifra actual de 7.2 |
| `04-gpu/06-opengl-python.html` (4.6) | vsync: 4 000–5 000 vueltas/s sin vsync; 85–90 con `swap_interval(1)` | Re-medido |
| `python/README.md` | Última comprobación (fecha, máquina, 27/27, imágenes idénticas salvo la de la ventana); vsync 85–90 / 4 000–5 000 | Encargo 11: que diga la verdad |
| `assets/js/glkit.js` (cabecera, solo comentario) | 4 líneas: `crearPrograma` compila el texto tal cual (sin el comentario único de los playgrounds GLSL), la caché puede devolverlo con fast math, `isnan` sigue detectando, y cómo forzar la compilación | Propuesta de la sesión 3 («una línea que remita a 3.7/5.10»); ver (d) |

Scripts nuevos (en `herramientas/estado/lab/`): `s4-m0-m6-semantica.mjs` + `.html`, `s4-m0-m6-tiempos.mjs` + `.html`,
`s4-m0-m6-playgrounds.mjs`, `s4-m0-m6-indices.mjs`. Tablón: 3 entradas (anexos, lead, m7a) y 2 aplicadas (de anexos y m7b).

## (c) Verificación final (después de la última edición de cada archivo; Apple M1, Chrome 154)

- `verificar.mjs --soluciones` (oscuro), tandas: 4.1 + 4.2 + 4.6 ✓ 3/3 · 5.5 + 5.7 + 5.8 ✓ 3/3 · 3.7 + 1.6 ✓ (con
  5.10) · 6.1 + 6.8 ✓ (con 6.6) · 6.9 + 6.10 ✓ (con 1.4 y 2.5) · re-verificación tras las últimas ediciones de 5.10,
  6.6, 1.4 y 2.5: ✓ 4/4. Todas las soluciones ejecutadas; pruebas ✓ de 4.2.2, 3.7.1, 3.7.2, 1.6.1, 1.6.4, 1.4.3.
- `verificar.mjs --tema light`: 4.1, 4.2, 4.6, 5.5 ✓ · 5.7, 5.8, 5.10, 3.7 ✓ · 1.6, 1.4, 2.5, 6.1 ✓ · 6.6, 6.8, 6.9,
  6.10 ✓ (16/16).
- `movil.mjs` (390 px): 16/16 con scrollWidth = 390.
- `enlaces.mjs`: mis 16 archivos, 417 enlaces internos, 0 rotos; todo el curso, 63 archivos, 3 713 enlaces, 0 rotos.
- Capturas revisadas: 3.7 solución del 3.7.3 (con `precision highp int`: el cielo con estrellas a 20 000), 4.2 tabla
  nueva en tema claro (se lee; la tabla hace scroll propio en móvil), 5.10.4 vistas normal y NaN (negro / magenta).
- `node --check assets/js/glkit.js` ✓ (solo cambió un comentario; todas las verificaciones son posteriores).

## (d) Pendientes y decisiones discutibles

- **Aviso de isnan en las recetas «NaN en magenta»: no hacía falta** (la 2.ª compilación detecta 16 384/16 384). No
  toqué 3.7 `m3-nan-pixel-negro` ni 6.2. En 5.10 añadí una frase positiva («lo que no falla es la detección…»). La
  línea de `glkit.js` la añadí igualmente (el encargo la ligaba al aviso), porque la caché sí cambia el fast math en
  WebGL crudo y GLKit no se protege: decisión discutible; es solo un comentario de 4 líneas.
- **Laboratorio de la sesión 3, dos montajes que no sirven en el M1** (no los cambié: no son míos): la fila
  «fallos de mod» de `isnan-cache` (el fast math simplifica `mod(-(id+1000)*7, 7)`) y el «hack: ocultas con discard»
  de 4.2 (el `discard` iba después del bucle caro). Mis medidas usan los montajes buenos.
- **4.2: dos columnas en la tabla** (pasadas y playground). Alternativa no hecha: cambiar el playground para que mida
  por pasadas (sería más estable, pero el párrafo explica justo por qué no lo es y el código es el del alumno).
- **4.1 «El mismo cálculo en tu CPU y en tu GPU» sin cambiar**: en headless la CPU tardó 2,25–2,46 s (el texto dice
  1,0–1,5 s) y la GPU 6,3–6,7 ms (7–10). Sospecho que el JS de una página headless en el M1 no corre igual que en una
  pestaña visible (no lo he comprobado: necesitaría el Chrome con ventana del dueño). Si se quiere, repetirlo en el
  Chrome normal y actualizar el párrafo (l.~109).
- **4.1 tabla «¿Cuánto tarda cada llamada?»**: `getError` dio 56–68 µs (la tabla dice 0,03–0,06 ms; 5.1, 5.10 y A.3
  dicen ~37 µs). No lo cambié (cascada a varios módulos, y es una espera que depende de la carga); anotado.
- **5.9 (1 M / 4 M instancias: 60 / 19 fps)** no se puede comparar con el laboratorio (tamaño del lienzo y de los
  cuadrados desconocidos); sin cambio.
- **5.10, recuadro del temporizador**: el laboratorio vio consultas que crecen ~10,7 ms por frame (el lote entero
  medido desde el principio, en headless sin presentar). Coherente con el texto («solo el mínimo se parecía»); sin cambio.
- **Índices**: cambié texto dentro de bestiarios (`m4-discard-lento`, `m6b-rm-normales`, `m6b-ruido-textura-escalones`)
  y prosa indexable: hace falta `node herramientas/indexar.mjs` (anexos/lead).
- Separador decimal: no lo cambié (las cifras nuevas siguen el de cada lección).
