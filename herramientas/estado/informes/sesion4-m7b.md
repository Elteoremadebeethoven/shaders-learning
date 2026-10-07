# Sesión 4 · agente m7b — 7.4, 7.5, 7.6 y proyecto-final/ (Apple M1, Chrome 154, ANGLE/Metal)

Archivos tocados: `modulos/07-integracion/04-vertex-animacion.html`, `05-particulas-gpu.html`, `06-proyecto-final.html`,
`proyecto-final/motor.js`, `proyecto-final/index.html`. Sin cambios: `recursos/l74kit.js`, `recursos/l75-particulas.js`,
`proyecto-final/hero.js`, `shaders.js`, `estilos.css`. Scripts nuevos en `herramientas/estado/lab/` con prefijo `s4-m7b-`
(lista en (e)). Tablón: aplicadas las 3 entradas PARA m7b (dos de m7a y una informativa de anexos); añadidas 4 (PARA m0-m6: de dónde leer el píxel
en la caja de 6.6; PARA lead: lo mismo en la guía §5.6 + mediana/media + captureBeyondViewport; PARA m7a: mediana de
intervalos; PARA anexos: `m7-4-indices-uint16` ya es nota).

## (a) Cambios hechos y porqué

### 7.4 · Animar vértices
1. **Tiempos de GPU re-medidos con el método fiable** (cada dibujo en su pasada, dos FBO alternos con clear,
   readPixels al final de cada tanda de 10, mediana de 7 tandas; lienzo 512 × 512 con profundidad). Tabla «La silueta
   no miente» (columna GPU) 0,6 / 1,1 / 3,2 → **0,3 / 0,7 / 1,8 ms**; el párrafo deja de llamarla «orientativa» y describe
   el método (+ el coste de la pasada vacía, 0,1 ms). Tabla A/B/C de «Geometría sin buffers» sustituida entera (ver (b));
   párrafo siguiente reescrito: B empata con A en todos los casos (antes «décimas de ms» en N = 512), C ≈ 3× con el
   shader pesado (28,1 frente a 9,6 ms; antes «11 frente a 4,2») y por qué 3 y no 6 (hipótesis marcada como tal). Resumen:
   «1,1 ms con nuestro método, orientativo» → «0,7 ms»; «unas 2,5 veces» → «casi tres veces».
2. **Columna de JavaScript**: no se reproduce con el código del laboratorio (ver (b)); se conserva la del autor y se
   añade una frase: según cómo se escriba el bucle, entre 1,3 y 1,6 veces más (con 263 000 vértices, el frame entero).
3. **Tabla del ε re-medida con las ondas de la lección** (las del ejemplo 7.4.3; transform feedback, 2000 puntos, exacta
   = derivada analítica en float64 con constantes y puntos en float32). Todas las celdas nuevas y una fila más (derivada
   analítica). Las filas de truncamiento ahora cuadran con float64 (1,7° y 0,19°; antes 3,2° y 0,36°: era otra superficie).
   Ajustados el párrafo siguiente (0,2° y 2° con coordenadas de 1000; 10° con t ≈ 10 000 s), el bestiario `m7-4-epsilon`
   (0,09° / 18° / 55°) y el quiz («hasta 16°» → «hasta 9°» con t = 1000 s y ε = 10⁻⁴).
4. **Bandera tras una hora** (paso 2 del ejemplo 7.4.5): «unos pocos grados» (estimación) → medido con transform feedback:
   0,008° al principio, 5° tras 1 h (0,6° de media), 13° tras 3 h (viento 0,7).
5. `m7-4-indices-uint16` → `callout nota` con el mismo `id` (sin `data-id`/`data-titulo`), con enlace y título de
   `m4-indice-65535` de 4.4; conserva lo propio de 7.4 (47 306 píxeles con N = 300, el triángulo del 65 535, la casilla).
6. Bestiarios gemelos: `m7-4-epsilon` → enlace a `../06-glsl/09-raymarching.html#m6b-rm-normales`;
   `m7-4-heightmap-escalones` → `../06-glsl/06-ruido.html#m6b-ruido-textura-escalones` (con la segunda cuantización
   del filtrado que añade 6.6).
7. Enlace externo de codeflow.org: el sitio no responde (DNS sí, http y https agotan 40 s; 2026-10-06) → copia de
   archive.org (`web.archive.org/web/20200708050342/…`, 200 y título correcto), con la aclaración en el texto. Los otros 11
   enlaces externos de 7.4–7.6 responden 200.
8. Cierre: «partículas con memoria (posición, velocidad, edad)» → «(posición, velocidad y, si hace falta, edad)»
   (propuesta b.5 de `revision-m7-5.md`: 7.5 no les da edad).
9. **Ejemplo 7.4.3, instrucciones**: «baja ε hasta 10⁻⁵ y aleja el origen a 1000 para ver el granulado» era falso en esa
   combinación: con el origen en 1000 y ε = 10⁻⁵ la superficie se ve como la del modo «normal del plano» (capturas
   `e3-m1-eps-5-o1000` y `e3-m0` iguales). Cerca de 1000 dos float32 vecinos distan 6,1·10⁻⁵, así que x ± 10⁻⁵ redondea a x,
   la resta da 0 exacto y la normal es (0, 1, 0); la celda de la tabla (25°) es casi la pendiente máxima de las olas
   (atan 0,59 = 30°). Corregidas la instrucción y la viñeta «Diferencias finitas» (con la explicación).
10. «(Apple M1, Chrome, …)» → «Chrome 154» en las cifras nuevas; la columna de JavaScript conserva las del autor (ver (d)).

### 7.5 · Partículas en la GPU
1. **Comparativa** (tabla de «Comparativa: medir antes de elegir»): columnas de GPU re-medidas (frame completo =
   simular + limpiar + dibujar en el canvas de 1000 × 600, 20 frames + readPixels, mediana de 5 tandas). 1 M: 12,8 / 12,3
   → **11,1 / 9,7 ms**; 4 M: 56,0 / 53,7 → **44,2 / 42,7 ms** (≈ 22 fps); 16 K–262 K también (ver (b)). La frase de
   contraste con los fps reales: «56 ms frente a 50–53» → la demo marca 22–23 fps (≈ 44 ms), lo mismo que su botón.
   «El transform feedback fue más rápido en todas las cargas, entre un 40 % … y un 4 %» → «igual o más rápido, hasta un
   40 % con 65 K y solo un 4 % con 4 M». La columna de CPU no cambia (la demo dio 12,4 / 45,5 / 182,6 ms con 16 K / 65 K /
   262 K: cuadra con 11,7 / 46,1 / 184).
2. **Viñeta «lo caro ya no es simular»**: por separado, con el método fiable (y la sincronización arreglada, ver (b)):
   simular 1 M 2,4 ms (TF 2,9; antes 2,8), dibujar 8,2 → **10 ms**; 4 M: 9,5 → **9 ms (TF 11)** de simulación y 35 → **43 ms**
   de dibujo. Explicado por qué las partes suman algo más que el frame (la simulación del frame siguiente no depende del
   dibujo de este: la GPU las solapa). «0,6 ms fuera de pantalla»: **confirmado** (0,61 / 0,64). Mezcla 8,4/8,2 → 10,0/10,1;
   tamaño 8,3/11,0 → 10,0/12,3. **Nuevo, medido**: el coste depende de cuánto se apiñan las partículas: el mismo millón
   al azar (estado inicial) 5,7 ms; tras 10 s de simulación 10 ms, con el 19 % de las partículas en píxeles con 8 o más
   (0,2 % al principio; máximo 72 por píxel). Causa propuesta con «lo más probable»: el orden de escritura por píxel.
3. **Quads frente a puntos y antialiasing**: 12,6 vs 8,6 → **12,9 vs 10,1 ms** (estado simulado; al azar 9,5 vs 5,7);
   MSAA 8,7 → 12,3 → **9,9 → 12,0 ms**.
4. **Demo 7.5.4** (búfer 736 × 420, DPR 1): «4 M a 21 fps (44 ms)» → 22–23 fps (42–44 ms); 1 M 10 ms y CPU 12 ms / 6 fps
   **confirmados**. «Son algo menos que en la tabla porque el lienzo es más pequeño» → casi las mismas cifras con la
   mitad de píxeles (lo que cuesta es cuántas primitivas y cuántas caen juntas).
5. **Solución del ejercicio 7.5.4**: la anomalía «5,5 ms acumulando frente a 8,4 directo» **no se confirma**: acumular en
   RGBA16F cuesta lo mismo que en el canvas de 8 bits (≈ 10 ms) y el frame completo con la pasada de tono sale
   12,6–13,3 ms frente a 12,4–12,9 directo. Frase reescrita («unas décimas de milisegundo»), fuera la del «no sabemos por
   qué» y lo de headless.
6. **Resumen**: «12,3–12,8 ms … 54–56 ms … 8,2 ms» → «9,7–11,1 ms … 43–44 ms … 10 ms (más cuanto más se apiñan)».
7. Pruebas: ejercicios 7.5.1–7.5.4 (partida ✗, solución ✓) y prueba sin `EXT_color_buffer_float` tras las guardas: ver (c).
8. **(c)5 decidido: el ejercicio 7.5.4 sigue con 1 M** (≈ 10–12 ms por frame en el M1 mientras está a la vista; el
   playground se destruye fuera de la pantalla). Con 262 K el fenómeno (0,0015 se redondea a 0 en 8 bits) se vería
   igual, pero el título y la idea («un millón de luciérnagas») y la comparación con la demo se pierden. Discutible: ver (d).

### 7.6 · Proyecto final y `proyecto-final/`
1. **(c)1 Caja hack «Dale tus animaciones CSS al reloj»**: en Chrome 154 la capturada **sí pasa a `'idle'`** (con y sin
   `pause()`) y sale de `getAnimations()`; al volver, otra en `'running'`. La frase se mantiene, con «(Chrome 154)» y «en
   pausa o sin pausar». **Hallazgo nuevo** (explica lo que vio la sesión 3 en Chromium 141): escribir `currentTime` a una
   animación `'idle'` la resucita (`'paused'`, vuelve a `getAnimations()` y su efecto se aplica aunque el CSS diga
   `animation: none`: la flecha de prueba siguió moviéndose). En el hero ocurre en el frame en que cambia la preferencia
   (QA: tras volver a reducido queda una `paused@0`), inofensivo porque la deja en 0. Añadida la sutileza a la caja, con
   «lo más probable» para el orden (el bucle lee layout y escribe `currentTime` antes del evento `change`) y el remedio
   (`playState !== 'idle'`). No he cambiado hero.js (el efecto es nulo; la lección no muestra esa línea).
2. **(c)2 Script de QA** → `lab/s4-m7b-76-proyecto.mjs`: tolerancia del 2 % en el búfer móvil; «de vuelta a reducido»
   comprueba que la flecha no se mueve (transform constante 1 s, animaciones `paused@0` o ninguna); **capturas en pausa
   que difieren: causa encontrada** (`lab/s4-m7b-76-pausa-capturas.mjs`): `page.screenshot` con `captureBeyondViewport`
   por defecto (true) dispara en la página dos `resize`, `pointerout` y `pointerleave`; el hero se despierta (22 rAF
   durante la captura) y el remolino se apaga porque el puntero «sale». Con `captureBeyondViewport: false`: 0 rAF y
   capturas idénticas. No es un fallo de la página. Añadidos: región viva (árbol de accesibilidad por CDP) y un
   escenario de «equipo lento» (espera activa de 300 ms por frame) para la regla de `Calidad`.
3. **(c)3 `aria-live="polite"`** en `.diapositivas` de `proyecto-final/index.html` y del ejemplo 7.6.4, y un párrafo en
   «El texto y la accesibilidad» (patrón de carrusel de la APG, por qué «polite», `inert` → entra en el árbol, `off` si
   rotara solo). Comprobado por CDP (`Accessibility.getFullAXTree`): 1 nodo `live=polite`; tras «02» está el titular de la
   02 y no el de la 01. El anuncio hablado no se puede oír en headless: el texto lo dice.
4. **(c)5 Tabla de capacidad de la etapa 1**: re-medida de dos maneras (ver (b)). La antigua (0,43–0,54 / 1,7–2,1 /
   4,2–5,6 / 5,6–8,3 ms, «1,4 ms/MP») salía un 40 % baja; reproduzco sus cifras decidiendo «cabe» con la **mediana** de los
   intervalos, y con la **media** coinciden con el método de 6.6. Tabla nueva con las dos columnas (capacidad con media:
   0,70–0,84 / 2,8–3,3 / 5,6–8,3 / 8,3–16,7; pasada propia: 0,9 / 3,2 / 7,1 / 12,5 ms), «unos 2,4 ms por megapíxel» y el
   cruce con 6.6 (13 ruidos × ≈ 0,17 ms/MP). Caja senior: añadida la trampa de la mediana (con el dato de 720 × 450 y 28
   pasadas: mediana 16,7, media 22,2), la comprobación de la trampa de la GPU de teselas (8 dibujos opacos en el mismo FBO:
   0,05 ms cada uno a 1440 × 900, 60 veces menos) y que a 2880 × 1800 el temporizador de GPU (12,4) coincide con la medida
   honesta (12,5), lo que apoya la hipótesis del DVFS. Dependientes: «≈ 7 ms → ≈ 2 ms» → **≈ 12,5 ms → ≈ 3 ms** («tres
   cuartas partes del presupuesto»), checklist igual; `pixelesMax` «3 ms en lugar de 5» → **5 en lugar de 9** (medido:
   1932 × 1087 5,1 ms; 2560 × 1440 9,0 ms); resumen «1,4 ms/MP» → «2,4 ms/MP».
5. **Regla común de `Calidad.medir`** (motor.js §5), idéntica a `M7.Calidad` de m7a: `descartarMs` (250) y `largos`;
   método `filtrar`: 0 no cuenta; ≤ descartarMs cuenta y pone la racha a 0; > descartarMs: 1.º y 2.º no cuentan, desde el
   3.º cuentan recortados a descartarMs. Y `bucle.fps` en `crearBucle` con la misma racha sin recortar (propuesta de m7a en
   el tablón). Texto de 7.6 (viñeta `calidad` de «Tamaño, DPR y la altura del móvil»): una frase con el filtro y por qué
   (sin la excepción, un equipo a < 4 fps no bajaría nunca), con enlace a 7.1. Comprobado: prueba unitaria en Node (tirón
   suelto y dos seguidos no cambian la escala; a 3 fps baja 1 → 0,85 → … → 0,5 entre 3,7 y 7,7 s) y en la página (QA:
   con 300 ms de espera activa por frame la calidad bajó en 1,2 s y llegó a 0,50; un tirón suelto de 400 ms no la bajó).
6. Bestiario `m7-6-dpr-emulado` (tablón, de m7a): fuera «`M7.crearApp` de 7.1 hace la misma mezcla» y añadido al final de
   la solución «`M7.crearApp` de 7.1 hace la misma comprobación» con enlace a `01-arquitectura.html#tamano-lo-que-5-1-no-podia-saber`.

## (b) Mediciones (método, cifra antigua → nueva)
Todas en Apple M1, Chrome 154.0.8037.98, ANGLE/Metal, headless con GPU real, turno `--exclusivo` (3 tandas: 15:27,
15:3x y 15:4x). Método de la guía §5.6 salvo donde se dice.

**7.4** (`lab/s4-m7b-74-tiempos.mjs`, copia de `rev-m7-4-tiempos.mjs` con pasada vacía y 2.ª ronda en orden inverso;
FBO 512 × 512 RGBA8 + DEPTH24, plano 6 × 6, cámara propia; 10 dibujos por tanda, mediana de 7):
| Cifra | Antes | Ahora |
|---|---|---|
| Pasada vacía (clear + guardar) | — | 0,09–0,13 ms |
| Dibujo completo N = 256 / 512 / 1024 (tres senos) | 0,6 / 1,1 / 3,2 | 0,30 / 0,71 / 1,84 (método antiguo en este lab: 0,45 / 0,73 / 1,8) |
| A/B/C N=512 ligero | 1,1 / 1,4 / 1,6 | 0,43 / 0,43 (0,65 en la 1.ª ronda) / 0,85–0,88 |
| A/B/C N=512 pesado | 1,3 / 1,4 / 3,1 | 2,47 / 2,49–2,57 / 7,16–7,18 |
| A/B/C N=1024 ligero | 3,2 / 3,2 / 4,5 | 1,80–1,86 / 1,77–1,78 / 2,96–3,01 |
| A/B/C N=1024 pesado | 4,2 / 4,3 / 11,0 | 9,57–9,62 / 9,69–9,72 / 28,1 |
| JS calcular N = 256/512/1024 | 3,2 / 12,7 / 50,7 (autor) | lab (con `Math.hypot`) 5,3 / 20,9 / 83,3; Node 24 con `sqrt` 5,2 / 19,5 / 75,9; con escalares 4,5 / 16,7 / 65,1 → se conserva la del autor + frase |

**7.4 precisión** (`lab/s4-m7b-74-precision.mjs`, transform feedback, 2000 puntos, exacta en float64 con constantes y
puntos en float32): ε × columnas (grados; 0–10 t=10 · 100–110 · 1000–1010 · t=1000 · t=10 000):
0,3: 1,69 1,71 1,71 1,7 1,7 · 0,1: 0,192 0,194 0,201 0,193 0,26 · 0,01: 0,0023 0,0195 0,187 0,085 1,06 · 0,001: 0,014 0,238
1,99 1,0 10,1 · 1e-4: 0,093 1,95 18,1 9,0 54,5 · 1e-5: 1,34 19,8 25 51,9 85,4 · analítica: 5,4e-5 8e-4 7,4e-3 4,1e-3 0,043.
Solo truncamiento (float64): 1,69 / 0,192 en todas las columnas (cuadra con el 1,68 / 0,19 de la sesión 3).
Bandera (e = 0,002, viento 0,7; máx / medio): t 0–10 s 0,008° / 0,002°; 1 h 5,4° / 0,56°; 3 h 12,8° / 1,5°; 10 h 33° / 5,3°
(viento 1: 0,009 / 8,5 / 18,7 / 42°). Truncamiento puro (float64): 0,005°.

**7.5** (`lab/s4-m7b-75-medir.html` + `s4-m7b-labs-gpu.mjs`, canvas 1000 × 600 sin antialias, 20 iteraciones por tanda,
mediana de 5). **Ojo, fallo de método encontrado**: el laboratorio de la sesión 3 (`rev-m7-5-medir.html`) sincronizaba
leyendo un píxel del canvas; lo que solo escribía en FBO o en buffers de TF no se esperaba (1.ª tanda: «simular 1 M»
0,08 ms, «dibujar en FBO» 0,07). Arreglado anotando el destino del último dibujo y leyendo de ahí (2.ª tanda). Válidas
desde la 1.ª tanda: todo lo que terminaba en el canvas.
| Cifra (texturas / TF) | Antes | Ahora |
|---|---|---|
| Frame 16 K / 65 K / 262 K | 0,7/0,4 · 1,3/1,0 · 2,9/2,3 | 0,29/0,28 · 0,77/0,47 · 2,69/2,08 |
| Frame 1 M | 12,8 / 12,3 | 11,1–11,2 / 9,65–9,67 (repetición al final: 10,98) |
| Frame 4 M | 56,0 / 53,7 | 44,1–44,2 / 42,6–42,9 |
| Simular 1 M | 2,4 / 2,8 | 2,35 / 2,85 |
| Dibujar 1 M (FBO alternos; canvas cerrando la pasada) | 8,2 | 9,99 / 9,9 ; 9,92 / 10,3 |
| Simular 4 M / dibujar 4 M | 9,5 / 35 | 9,2 (TF 11,0) / 43,2–43,7 |
| 1 M fuera de pantalla | 0,6 | 0,61 / 0,64 |
| Sin mezcla · 8 px | 8,2 · 11,0 | 10,1–10,2 · 12,3–12,4 |
| Puntos al azar vs tras 600 pasos (1,5 px) | — | 5,75 → 10,04 (apiñadas: 0,2 % → 18,8 % en píxeles con ≥ 8) |
| Quads 2 px vs puntos 2 px | 12,6 vs 8,6 | 12,9 vs 10,1 (al azar 9,5 vs 5,7) |
| MSAA (canvas antialias:true vs false, 1,5 px) | 8,7 → 12,3 | 9,9 → 12,0 (al azar 5,3 → 7,0) |
| 7.5.4 ejercicio: acumular 16F + tono vs directo | 5,5 vs 8,4 | dibujo 10,1 vs 10,2–10,4; frame 12,6–13,3 vs 12,4–12,9; 16F 9,9 = 8 bits 9,9 |
| Demo 7.5.4 (736 × 420): 1 M / 4 M / CPU 16 K, 65 K, 262 K | 10 / 44 (21 fps) / 12 ms · 6 fps | 10,0–10,2 / 42–44 (22–23 fps) / 12,4 · 45,5 (22 fps) · 182,6 (6 fps) |

**7.6** (`lab/s4-m7b-76-capacidad.html`, shader completo de `proyecto-final/shaders.js`; pasada propia = 10 dibujos por
tanda, mediana de 7; dos rondas en orden inverso y una tercera al final: diferencias < 3 %):
| Búfer | Pasada propia | Vacía | Aditivo (8 en el mismo FBO) | Opaco (8 en el mismo FBO, trampa) | Capacidad rAF, mediana | Capacidad rAF, media |
|---|---|---|---|---|---|---|
| 720 × 450 | 0,88–0,92 | 0,10–0,15 | 0,72–0,73 | 0,02 | 28 sí / 32 no | 20 / 24 |
| 1440 × 900 | 3,21–3,25 | 0,12–0,19 | 2,78–2,79 | 0,05 | 8 / 9 | 5 / 6 |
| 2160 × 1350 | 7,12 | 0,28–0,30 | 6,24–6,26 | 0,10 | 3 / 4 | 2 / 3 |
| 2880 × 1800 | 12,51–12,52 | 0,38–0,42 | 11,05–11,09 | 0,17 | 1 / 2 | 1 / 2 |
2560 × 1440: 8,95 ms; reducido por `pixelesMax` (1932 × 1087): 5,08 ms. ms/MP (restando la vacía): 2,28–2,38.
rAF del Chrome sin interfaz: 16,7 ms sin dibujo (60 Hz).

## (c) Verificación final (después de la última edición de cada archivo; Apple M1, Chrome 154)
- `verificar.mjs 04 05 06 --soluciones --capturas` (oscuro): **3/3 sin problemas** (16:04). 7.4 se volvió a pasar tras su
  última edición (16:25) → ✓ (oscuro + soluciones, 16:3x): pruebas de las soluciones 7.4.1 7 ✓, 7.4.3 1 ✓; 7.5: 7.5.1–7.5.4
  1 ✓ cada una; 7.6: 7.6.2 3 ✓, 7.6.3 3 ✓, 7.6.4 1 ✓. Conteos: 7.4 ejemplos 8, ejercicios 5, quiz 5, bestiario 8 (antes 9:
  uno pasó a nota), senior 5, ~21 000 palabras; 7.5 4/4/4, bestiario 8; 7.6 4/4/3, bestiario 4.
- `verificar.mjs … --tema light --capturas`: **3/3 sin problemas** (16:11); 7.4 de nuevo tras su última edición: ✓.
- `movil.mjs` (390 px): 7.4, 7.5, 7.6 y `proyecto-final/index.html`: scrollWidth = 390 (los elementos anchos que lista son
  fórmulas KaTeX y un `path` de SVG dentro de contenedores con desplazamiento propio; no desbordan la página).
- `enlaces.mjs` (4 archivos): 239 enlaces internos, 0 rotos (tras la última edición). Externos: 11 × 200 + archive.org 200.
- Capturas miradas: las 45 de componentes y soluciones en oscuro y las 32 de componentes en claro de `verificar.mjs` (ya no salen negras:
  todas muestran lo que dice el texto; p. ej. 7.4.2 solución en negro = bien, 7.5.4 partida negra / solución con
  luciérnagas, 7.6.1 partida con manchas magenta / solución limpia, 7.6.2 partida sin dos títulos / solución con los tres);
  las de interacción de 7.4 (`s4-m7b-74-capturas.mjs`: N = 300 + Uint16 con los triángulos estirados, modos de 7.4.2–7.4.4,
  ε/origen de 7.4.3, puntos de 7.4.7 y «mitad»), y las de lo editado en claro/oscuro/390 (`s4-m7b-editados.mjs`: tablas
  nuevas, nota, bestiario del ε, caja senior y caja hack de 7.6): legibles en los dos temas; en 390 px las tablas anchas se
  desplazan dentro de su contenedor, como el resto del curso.
- **7.5, pruebas** (`s4-m7b-75-pruebas.mjs`): 7.5.1 partida ✗ «(0, 0)» / solución ✓; 7.5.2 ✗ 2,3 % → ✓ 28,2 %; 7.5.3 ✗ 1 posición /
  ✓ 2000; 7.5.4 ✗ brillo 0,000 / ✓ 0,308; 0 errores de consola. **Sin `EXT_color_buffer_float`** (tras las guardas):
  7.5.2 mensaje en el panel; 7.5.3 funciona; 7.5.4 pasa a transform feedback con aviso; ejercicios 7.5.1 y 7.5.2 (partida
  y solución): solo «Error: sin EXT_color_buffer_float», ya sin el `TypeError`; 0 excepciones.
- **proyecto-final/index.html** (`s4-m7b-76-proyecto.mjs`, tras todas las ediciones, 16:20): **67 ✓ / 0 ✗**: 0
  excepciones y 0 errores/avisos inesperados en los 11 escenarios (1440 DPR 1 y 2, comportamiento, ?depurar, 390 DPR 2
  táctil, movimiento reducido y su cambio en caliente, ?reducir, sin WebGL, ?sinwebgl, equipo lento, sin JS); región viva
  ✓; capturas en pausa idénticas; búfer móvil 390 × 844 con calidad 1.

## (d) Pendientes y decisiones discutibles
1. **Columna de JavaScript de 7.4** (3,2 / 12,7 / 50,7 ms): no la reproduzco (mi código: 1,3–1,6 veces más); la conservo
   porque es del autor en el mismo M1 y la conclusión no cambia, y añado la frase sobre la variación. Alternativa: poner
   las del laboratorio (5,3 / 20,9 / 83,3), que tienen código conocido.
2. **Tabla A/B/C de 7.4**: B ligero N = 512 dio 0,65 ms en la 1.ª ronda y 0,43 en la 2.ª (A: 0,43–0,44); pongo 0,43 (la
   1.ª ronda tuvo a B justo después de compilar). La explicación de «tres veces y no seis» (la caché no acierta siempre con
   índices) es una hipótesis, marcada como tal en el texto.
3. **7.5: causa del coste por apiñamiento** («el orden de escritura por píxel»): hipótesis marcada «lo más probable». Lo
   medido es la correlación (5,7 → 10 ms con 0,2 % → 19 % de partículas en píxeles con ≥ 8). Igual el solapamiento de la
   simulación del frame siguiente con el dibujo (frame < suma de las partes): explicación razonable, no comprobada aparte.
4. **Ejercicio 7.5.4 con 1 M** (encargo (c)5): lo dejo. Coste ≈ 10–12 ms/frame en el M1 mientras está a la vista. Si el
   dueño prefiere prudencia, bajar a 512² cambiando título y texto (la sesión 3 calculó el brillo con 262 K: 0,13 > 0,04).
5. **7.6, caja hack**: el orden «lee layout → escribe currentTime → llega `change`» que explica la resurrección en el
   hero es inferido (lo observado: queda una `paused@0` tras volver a reducido). No he tocado hero.js: el efecto es nulo.
6. **7.6, capacidad**: el texto atribuye la tabla antigua a decidir «cabe» con la mediana porque así la reproduzco (8/9
   a 1440 × 900, 3/4 a 2160 × 1350); no sé qué criterio usó el autor. Redactado como «con la mediana, este método nos dio
   pasadas un 40 % más baratas», sin afirmar qué hizo el autor.
7. **7.6, temporizador de GPU** (2,5 / 5,7 / 9 / 12,4 ms): no re-medido (no hace falta para el texto); la coincidencia
   12,4 ≈ 12,5 a 2880 × 1800 se usa como apoyo de la hipótesis del DVFS.
8. **Laboratorio de la sesión 3 `rev-m7-5-medir.html`**: tiene el fallo de sincronización descrito en (b); no lo he
   tocado (no es mío); el bueno es `s4-m7b-75-medir.html`.
9. Para el lead: entradas del tablón sobre la guía §5.6 (de dónde leer el píxel; mediana frente a media) y 6.6 (m0-m6).

## (e) Scripts (en `herramientas/estado/lab/`)
- `s4-m7b-74-tiempos.mjs`: tiempos de GPU de 7.4 (método fiable + antiguo + pasada vacía + CPU). `--rapido` para probar.
- `s4-m7b-74-precision.mjs`: tabla del ε (ondas de la lección, transform feedback) y error de la normal de la bandera
  con el tiempo. No mide tiempos.
- `s4-m7b-74-capturas.mjs`: capturas con interacción de 7.4 (versión Mac de `rev-m7-4-capturas.mjs`, con
  `page.screenshot({ clip, captureBeyondViewport: false })`): `node … <dir> dark 1280 1400`.
- `s4-m7b-75-medir.html`: laboratorio de 7.5 (sincronización con el destino del último dibujo; `?segunda`, `?tercera`,
  `?rapido`). `s4-m7b-labs-gpu.mjs`: lanza 7.5 y 7.6 en un Chrome (`--rapido`, `--segunda`, `--tercera`, `75`, `76`).
- `s4-m7b-75-demo.mjs`: cifras de la demo 7.5.4 con su botón «medir GPU» y sus fps.
- `s4-m7b-75-pruebas.mjs`: ✓/✗ de los ejercicios de 7.5 y prueba sin `EXT_color_buffer_float`.
- `s4-m7b-76-capacidad.html`: coste del fondo del hero (pasada propia, vacía, aditivo, opaco, capacidad con rAF:
  mediana y media).
- `s4-m7b-76-css-recreada.mjs`: la `CSSAnimation` capturada y la media query (sin tocar / `pause()` / `pause()` +
  `currentTime`).
- `s4-m7b-76-pausa-capturas.mjs`: por qué difieren dos capturas en pausa (`captureBeyondViewport`).
- `s4-m7b-76-proyecto.mjs`: QA completa de `proyecto-final/index.html` (sucesor de `rev-m7-6-proyecto.mjs`).
- `s4-m7b-editados.mjs`: capturas de las tablas y cajas editadas (claro/oscuro 1280, claro 390).
Salidas de las ejecuciones: en el SCRATCH del agente (`agentes/m7b/*.txt`; se perderá); las cifras están en (b).
