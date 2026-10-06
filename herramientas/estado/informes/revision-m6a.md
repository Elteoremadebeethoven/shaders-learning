# Revisión del Módulo 6, parte A (6.2–6.5)

Las cuatro lecciones pasan `verificar.mjs --soluciones` sin problemas, en tema oscuro y en claro (resumen al final). Las 16 soluciones compilan, y las capturas confirman que hacen lo que pide cada enunciado. No hubo que reescribir ninguna sección entera. Solo toqué los cinco archivos del encargo: `02-pensar-en-paralelo.html`, `03-formas-sdf.html`, `04-color.html`, `05-patrones.html` y `recursos/a-demos.js`.

Todas las medidas se hicieron en un Apple M1 con Chrome 154 headless (ANGLE sobre Metal, «ANGLE Metal Renderer: Apple M1»), siempre a través de la cola del puppeteer parcheado: un solo Chrome a la vez y cerrado al terminar. Material de trabajo, en el scratchpad:
- **Scripts:** `qa/rev-m6a-lab.mjs` (banco GLSL, copia del `lab.mjs` del autor), `qa/rev-m6a-exp1.mjs`, `qa/rev-m6a-exp2.mjs` y `qa/rev-m6a-pag.mjs`.
- **Emulación en CPU:** `experimentos/rev-m6a/cpu.mjs`.
- **Salidas:** `experimentos/rev-m6a/*.txt`.
- **Capturas:** `capturas/rev-m6a/` (`v0` es la inicial, `v1` y `v1-claro` las finales, y `pag` las soluciones y estados concretos).

---

## El punto concreto: `mod(x, 7.0)` y los «39 por millón»

**Conclusión:** la cifra «39 de un millón» es real, pero no es una tasa. Solo fallan los **múltiplos negativos** de P, así que el número de fallos depende del rango de identificadores, no del compilador. Tampoco es cierto que el bucle de 6.1 genere otro código: con el mismo rango, el bucle da exactamente las mismas cifras que el cálculo por píxel.

### Experimento A: por píxel
Script `qa/rev-m6a-exp1.mjs`, prueba T1.
- **Montaje:** un FBO `RGBA32F` de 1000 × 1000. Cada fragmento calcula `x = floor(gl_FragCoord.x) + 1000·floor(gl_FragCoord.y) + u_base` (un entero exacto) y escribe `mod(x, u_P)`, además de la versión robusta `x - P*floor((x + 0.5)/P)`.
- **Comparación:** cada resultado se compara con el módulo entero exacto calculado en JavaScript, y también con una emulación en float32 de `x * fl(1/P)` hecha con `Math.fround`.
- **Casos:** cuatro rangos de un millón de enteros, con `P` = 3, 5, 7, 8, 13, 64 y 100.

| Rango de `x` | P = 7 | P = 13 | P = 3, 5, 8, 64, 100 |
|---|---|---|---|
| −500 … 999 499 (el del autor; solo 500 negativos) | **39** (de 71 múltiplos negativos) | **10** (de 38) | 0 |
| 0 … 999 999 | 0 | 0 | 0 |
| −500 000 … 499 999 | **43 682** (61 % de los 71 428 múltiplos negativos) | 13 099 (34 %) | 0 |
| −999 999 … 0 | 87 372 (61 % de 142 857) | 26 206 | 0 |

- **Qué devuelve cuando falla:** siempre exactamente `P`, y siempre en un múltiplo negativo de `P`. El primero es −441, cuyo cociente sale −63.0000038.
- **Coincidencia con la emulación:** en todos los casos, el resultado de la GPU es idéntico, píxel a píxel, a la emulación `x - P*floor(fl(x * fl(1/P)))`: 0 diferencias en 4 × 7 millones de valores.
- **La causa:** con fast math, Metal convierte la división `x / y` en `x * (1/y)`. El código traducido de ANGLE es `return x - y * metal::floor(x / y);`, así que la división sigue escrita como división y la sustitución la hace el compilador de Metal.
  - fl(1/7) = 0.142857149 y fl(1/13) están redondeados por arriba. Para −7k, el producto sale un ulp por debajo de −k en el 55–61 % de los casos, y `floor` baja un entero de más.
  - Con 3 y 5 el error relativo de 1/P es menor y el producto redondea al entero exacto.
  - Con potencias de 2 (8, 64), 1/P es exacto.
- **P como literal:** con `7.0` escrito en el código en lugar de un uniform, las cifras son idénticas (39 y 43 682).
- **Versión robusta:** 0 fallos en todos los rangos y divisores.

### Experimento B: el bucle
Prueba T2.
- **Montaje:** un único fragmento recorre en un bucle `for` un millón de valores (`x = float(i) + u_base`) y cuenta cuántos `mod(x, u_P)` caen fuera de [0, P).
- **Resultados:**
  - −500 000 … 499 999: **43 682** (P = 7) y 13 099 (P = 13), las mismas cifras que el experimento A.
  - −500 … 999 499: **39**.
  - 0 … 999 999: 0.
  - Tiempo: 46–75 ms por millón de vueltas.
- **Conclusión:** los «43 682 del bucle» del autor venían de haber usado otro rango, no de que el compilador «reutilice el inverso».

### Experimento C: sin fast math
Pruebas T1, T2 y `exp2` E1–E3.
- **Montaje:** el mismo shader con un `isnan` que nunca se cumple, lo que desactiva el fast math.
- **Resultado:** **0 fallos** en todos los rangos, pero **solo la primera vez que se compila ese texto exacto**. Ver el hallazgo sobre la caché de `isnan`, más abajo.

### Qué cambié en 6.5
Reescribí la caja «hack» del patrón que se repite con estas cifras y con su causa. También ajusté la frase de la caja senior sobre `mod`.

### Para el revisor de 6.6
Su texto de la línea ~946 ya dice «múltiplos negativos de 7», así que va en la buena dirección. Si da cifras, que las acompañe del rango, o que las exprese como proporción de los múltiplos negativos: «alrededor de 6 de cada 10 múltiplos negativos de 7, y ninguno positivo».

### Pendiente en 6.1 (no la toqué: fuera del encargo)
La línea 1199 de `01-lenguaje.html` dice que en el bucle el compilador «parece reutilizar el inverso de y en lugar de dividir cada vez» y que por eso falló en 43 682 casos. Es falso: con el mismo rango, el cálculo por píxel da 43 682 y el bucle da 39.

Texto propuesto: «Todos los fallos son múltiplos negativos de 7: con fast math, la división se hace como `x * (1/7)` y 1/7 en float está redondeado por arriba. Cuántos fallan depende de cuántos negativos haya en el rango: de −500 a 999 499, 39; de −500 000 a 499 999, 43 682 (con el mismo código, por píxel o en un bucle)».

---

## Hallazgo transversal: `isnan` y la caché de programas de Chrome

La guía de autores (§5.6, hallazgo del módulo 3) y varias lecciones dicen que un `isnan` en el shader desactiva el fast math. Es cierto, **pero solo la primera vez que Chrome compila ese texto exacto**.

**Cómo se midió** (`exp2` E1–E3 y `rev-m6a-pag.mjs`, apartado 3). El shader `mod(x, 7.0)` con `isnan` se ejecutó sobre x ∈ [−500 000, 499 999]:
- Primera compilación de un texto nuevo: 0 fallos, es decir, sin fast math.
- Segunda compilación del mismo texto en la misma página: 43 682 fallos, es decir, con fast math.
- El mismo texto en otra pestaña, y tras recargarla: 43 682 las dos veces.
- Con un comentario distinto en cada compilación (texto nuevo): 0 fallos siempre.

La caché, por tanto, distingue los textos por sus comentarios, y no se limita a una página.

**Consecuencias:**
- Cualquier demo que enseñe «añade `isnan` y mira cómo cambia el resultado» solo funciona la primera vez. Afecta al bicho de 6.6 `m6b-hash-fastmath`, a las demos del módulo 3 (`pow` con base negativa) y a 5.10.
- Si el alumno quita el `isnan` y lo vuelve a poner, o pulsa «Restaurar», el texto ya está en la caché y el efecto no aparece.
- En el Chrome de escritorio la caché de la GPU también se guarda en disco, así que puede que el efecto no se vea ni en visitas posteriores. **Esto no lo pude comprobar:** solo probé headless, dentro de una misma sesión.

**Qué cambié:** en 6.2 añadí la matización en la fila «NaN e infinitos» de la tabla de depuración.

**Propuesta para `playground-glsl.js`** (no lo toqué): cuando el código contenga `isnan` o `isinf`, añadir al compilar un comentario único al final, por ejemplo `\n// compilación 17`. Así se esquiva la caché y el efecto es reproducible siempre, a cambio de recompilar esos shaders cada vez. También convendría actualizar §5.6 de la guía.

---

## 6.2 · Pensar como un fragment shader

**Cambio:**
- **Tabla «Depurar con color», fila NaN:** añadí que el efecto de `isnan` sobre el fast math solo se ve en la primera compilación de cada texto (ver el hallazgo anterior).

**Comprobado sin cambios:**
- **`gl_FragCoord`:** es relativo a la ventana. Las derivadas `dFdx(x²)` dan 2, 2, 6, 6, 10, 10 por parejas de columnas, y `dFdy(y²)` da lo mismo por parejas de filas. Da igual un FBO que el canvas (lo probé con altos de 7, 8 y 9), y `dFdy(gl_FragCoord.y) = 1` también en el canvas.
- **`u_mouse`:** empieza en el centro del lienzo (comprobado en el código del playground).
- **Rejilla y viewports:** la demo de la rejilla (12 × 8 frente a 9 × 7) y los «Dos viewports», donde el círculo desaparece en el viewport derecho.
- **Cuentas y quizzes:** las del ejemplo 6.2.1 y del quiz 1200 × 400 (2.9975).
- **Soluciones:**
  - 6.2.1: marco blanco y cruz roja en la columna 367 y la fila 109 de un lienzo de 736 × 220, es decir, la de la izquierda y la de abajo.
  - 6.2.2: disco de radio 80 px.
  - 6.2.3: la F gira sobre su esquina.
  - 6.2.4: el reloj marca las 10:09 y avanza en sentido horario.
- **Referencias:** las atribuciones (6.1, 3.7.4, 4.1, 5.8 y 5.10) y las anclas (#m1-circulo-ovalado, #m1-raton-invertido y los dos #m3-… de 3.5) existen.

**Sin pendientes.**

## 6.3 · Formas, SDF 2D y antialiasing

**Cambios:**
- **Caja senior «Derivadas en control de flujo no uniforme»:** decía que la lectura de textura dentro de la rama daba «basura del orden de 10^18». Lo volví a medir (T7) y salió 3.6·10^18 en una columna, −4·10^9 en otra y −4.8·10^32 en otra. Ahora da dos de esos valores.
- **Ejercicio 6.3.4:** la solución con `px` deja el borde del cuello de 2 a 3 píxeles. Lo medí en la captura: 2.7 px en teoría, porque allí `smin` es una cota con gradiente 0.38 (es ½(∇a + ∇b)). El enunciado pedía «un píxel con cualquier k», así que añadí un aviso en el enunciado y un párrafo en la solución que lo explica y propone `fwidth(d)`. Así el ejercicio remite a la sección «SDF exacta o cota».

**Comprobado sin cambios:**
- **Derivada dentro de un `if` divergente:** el playground de la lección da 10.5 donde se esperaba 5.5.
- **`smin` con k = 0:** da NaN. Con la cobertura `smoothstep` el lienzo entero sale a 1, y con `clamp` la figura desaparece (T8), como dicen el bicho y el ejercicio.
- **`fwidth`:** en un círculo de radio 60 px da 1.016 a 0° y 1.422 a 45°, frente a una longitud del gradiente de 1.000–1.006. Coincide con las cifras del texto (1.03 y 1.40, medidas con radio 30).
- **Candado:** con el arco cortado en y = 0.1 aparecen exactamente 3 filas con el color del contorno (T11).
- **Escalar sin corregir:** 0.20 frente a 0.41, calculado.
- **Soluciones 6.3.1–6.3.4:** se ven como se describen.

**Pendiente menor:** la caja «hack» de contornos de contornos escribe `abs(mod(d, 0.1) - 0.05)`, que es la distancia a los niveles d = 0.05 + 0.1k. Para dibujarlos haría falta restar un grosor. Es correcto como idea y lo dejé.

## 6.4 · Color: espacios, gamma y paletas

**Cambios:**
- **Primer playground:** se titulaba «Siete operaciones con dos colores», pero muestra los dos colores y cinco operaciones (la tabla tiene seis, «invertir» no está en el playground). Ahora se titula «Dos colores y cinco operaciones».
- **Texto de ese playground:** decía «la suma sale casi blanca: varios canales se salen de 1». Con los colores por defecto los tres canales pasan de 1 (1.14, 1.03 y 1.14) y la franja sale blanca pura (255, 255, 255 en la captura). Corregido.
- **«Cuatro degradados, dos espacios»:** la marca de t = 0.5 era `vec3(0.5)`, y en el degradado de arriba (mezcla sRGB de negro a blanco) el color en ese punto es exactamente 0.5, así que la marca era invisible. Ahora es rosa `(1, 0.3, 0.5)`, comprobado en captura.
- **Ejercicio 6.4.2, solución:** «el umbral 1e-5 también protege la división por length(q)» era falso: esa división solo se hace cuando `r > 0.8`. Frase corregida.
- **Ejercicio 6.4.4, enunciado:** ahora dice «disco blanco rodeado de un halo anaranjado que se desvanece sin manchas planas». El disco del sol es uniforme por construcción, así que «sin manchas planas» solo puede referirse al halo.
- **Ejercicio 6.4.4, solución:** decía que el centro del sol («unos 10») «se acerca a 1 pero pasa por una curva suave».
  - Medido (T10): tras EV −1 vale (11.68, 9.34, 6.34), y tras Reinhard extendido con W = 8, (1.089, 1.035, 0.949). El rojo y el verde se recortan, y es lo esperado, porque W es el blanco.
  - Lo que la curva salva es el halo, que justo fuera del disco vale (0.62, 0.44, 0.24) y cae sin cortes. Sin curva, su canal rojo pasaría de 1 en un anillo de unas 0.1 unidades (d < ln(3/1.63)/6 ≈ 0.10).
  - Párrafo reescrito con esas cifras.

**Comprobado sin cambios (T9, `exp2` E5 y CPU):**
- Un texel 128 da 0.502 en `RGBA8` y 0.2159 en `SRGB8_ALPHA8`.
- El nivel 1×1 del mipmap de un damero 2 × 2 da 0.502 frente a 0.5028.
- Un FBO `SRGB8_ALPHA8` guarda 0.5 como 188, y el blending se hace en lineal: 0.25 + 0.25 da 188, no 255.
- `clear` de 0.5 en un FBO sRGB da 188; en el canvas, 0.5 se guarda como 128.
- `drawingBufferColorSpace` vale `"srgb"`, y `drawingBufferStorage` existe en Chrome 154, donde un `clear` de 0.5 da 188.
- La potencia 2.2 frente a la curva exacta: al codificar, 0.0335 de error máximo y 209 niveles distintos (como mucho 8); al decodificar, 0.0085; en el nivel 10, 0.00080 frente a 0.00304.
- Las cuentas 0.216, 0.735/188, 141 y 4.54×, 76, 13, y 26 frente a 90 niveles.
- La escalera de siete peldaños con 5 bits.
- Las soluciones 6.4.1–6.4.4.

**Pendiente menor:** en «¿Qué gris es la mitad de la luz?» los comentarios de final de línea quedan cortados en el editor. Es cosmético.

## 6.5 · Patrones

**Cambios:**
- **Repetición polar, costura con n = 5.5:** el texto decía que aparecía «siempre a la izquierda del centro». En este playground todo gira (`q = rot(-0.2 t) * p`) y el ángulo se mide en `q`, así que la costura gira con la figura. Lo capturé con n = 5.5 dos veces, con 8 s de diferencia: la costura se había movido unos 90°. Ahora se explica por qué gira.
- **Ejercicio 6.5.2, solución:** decía que los dos rayos iguales seguidos aparecen «a la izquierda del centro». Es el mismo fallo, porque el sol gira. Lo capturé con n = 7 dos veces y la pareja cambia de sitio. Ahora dice que está a la izquierda al empezar y luego gira.
- **Caja «hack» del patrón que se repite:** ahora son dos párrafos: primero la idea y la fórmula robusta, y después «¿Cuándo falla `mod`?», con el experimento de arriba (causa, solo negativos, dependencia del rango y la misma cifra en bucle y por píxel). Quité la afirmación falsa de que «la frecuencia depende de lo que genere el compilador».
- **Caja senior «fract también redondea»:**
  - `fract(−1e−9) = 1.0` exacto con fast math, pero **0.99999994** sin él (medido en T3): el `fract` de Metal se recorta al float anterior a 1. Añadí esa matización.
  - Cambié la frase sobre `mod` (antes decía «39 de un millón»).
- **`recursos/a-demos.js`, `#demo-vecinos`:** la línea informativa decía «distancia 0.319 → dentro», pero ese número es la distancia al **centro** de la burbuja, y leído como SDF, un 0.319 positivo significaría «fuera». Ahora dice «distancia a su centro 0.761 ≥ radio 0.55 → fuera (fondo)» y «el centro más cercano es el de la celda (+0, +1), a 0.319 < radio → dentro».

**Comprobado sin cambios:**
- **Costura de `fwidth(atan)`:** vale 6.2499 en la fila de la costura cuando cae dentro de un quad, frente a 0.0345–0.0356 fuera (T6). La línea gris de «Doce rayos» aparece con desfase 1 en el lienzo de 240 px.
- **Precisión:** separación de 0.0625 hacia un millón (16 pasos visibles con k = 6).
- **Hexágonos:** el panal, con identificadores distintos.
- **Truchet:** los arcos empalman.
- **Soluciones 6.5.1–6.5.4:** 6 filas de baldosas, rayos, cintas, y discos enteros con contorno.

---

## Verificación final

Tras los cambios pasé `verificar.mjs --soluciones --capturas` en oscuro (`v1`) y con `--tema light` (`v1-claro`). Revisé con Read todas las capturas iniciales y, además, las de las soluciones, los estados concretos y las demos en claro.

```
✓ 02-pensar-en-paralelo.html  glsl=12 js=1 demo=1 ejemplos=3 ejercicios=4 quiz=4 bestiario=5 senior=2 palabras=8639 soluciones=4
✓ 03-formas-sdf.html          glsl=11 js=1 graficador=1 demo=1 ejemplos=3 ejercicios=4 quiz=5 bestiario=4 senior=1 palabras=8967 soluciones=4
✓ 04-color.html               glsl=15 graficador=3 demo=1 ejemplos=2 ejercicios=4 quiz=4 bestiario=5 senior=1 palabras=9350 soluciones=4
✓ 05-patrones.html            glsl=16 demo=1 ejemplos=2 ejercicios=4 quiz=5 bestiario=5 senior=2 palabras=9967 soluciones=4
4/4 páginas sin problemas   (idéntico en --tema light)
```

- **Enlaces:** ya no hay enlaces rotos. El de 6.2 a 7.1 funciona porque el módulo 7 ya existe.
- **Requisitos mínimos de la guía (§6):** los cumplen las cuatro lecciones.
- **Capturas de las soluciones:** están en `capturas/rev-m6a/pag/sol-0N-M.png`.
- **Índices:** no regeneré `indexar.mjs`. No añadí ni quité bestiarios, pero cambié textos que entran en el índice de búsqueda, así que conviene regenerarlo al final de todas las revisiones.

## Sugerencias para componentes compartidos (no los modifiqué)

- **`playground-glsl.js`: caché de programas con `isnan`/`isinf`.** Ver el hallazgo transversal. Propuesta: añadir un comentario único al compilar un código que contenga `isnan` o `isinf`.
- **`verificar.mjs --soluciones`:** comprueba que la solución compila pero no la captura. Convendría que con `--capturas` guardara también `…-sol-N.png` tras pulsar «Ver solución». Yo lo hice con `qa/rev-m6a-pag.mjs`.
- **Guía §5.6:** añadir la salvedad de la caché al hallazgo del módulo 3 sobre `isnan`.

## Decisiones discutibles

- **Cifra de 2.7 px en 6.3.4:** es un cálculo a partir del gradiente de `smin`, contrastado con la captura (de 2 a 3 px). No la medí con derivadas.
- **Cifras de `mod` en 6.5:** doy las de dos rangos concretos en lugar de una tasa «por millón», porque la tasa no existe. Si el dueño prefiere una sola cifra, la más honesta es «alrededor de 6 de cada 10 múltiplos negativos de 7».
- **Caché de `isnan` en 6.2:** la matización queda en una celda de tabla y dice «(medido)». Es un comportamiento de Chrome/ANGLE que podría cambiar con versiones futuras.
