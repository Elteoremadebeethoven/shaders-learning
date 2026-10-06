# Coherencia del módulo 6 (GLSL y fragment shaders) — sesión 3 (coh-m6)

Revisor de coherencia de `modulos/06-glsl/` (6.1–6.10) como un todo. Solo he modificado HTML de `modulos/06-glsl/` (siete lecciones) y este informe. No he tocado `assets/**`, el manifest, los anexos ni otros módulos, ni he ejecutado `indexar.mjs`.

**Máquina.** Contenedor Linux sin GPU: Chromium 141 headless, WebGL por SwiftShader (ANGLE sobre Vulkan). Aquí solo he medido semántica (`texelFetch`), nunca tiempos ni fast math. Las cifras del curso siguen siendo las del M1 (Chrome, ANGLE/Metal).

**Material de trabajo** (scratch `agentes/coh-m6/`):
- `mapa.md`: definiciones, cifras, promesas y términos de cada lección.
- `notas.md`: el progreso.
- `txt/`: cada lección pasada a texto compacto.
- `titulos.mjs`: compara cada enlace a un bestiario con el `data-titulo` del destino.
- `numeros.mjs`: comprueba que los enlaces con texto «N.M» van a esa lección del manifest.
- `entrantes.txt`: los 279 enlaces de otros módulos hacia m6, con su contexto.
- `bichos.txt`: los 254 bestiarios del curso.
- `exp/texelfetch.*`: el experimento de `texelFetch` y su salida.
- `capturas/`: las capturas de la verificación.

**Punto de partida.** El agente de la sesión 2 ya había resuelto casi toda la lista. Lo comprobé leyendo cada sitio, no solo con grep. Lo que quedaba eran detalles:
- una cita de la especificación que faltaba;
- una promesa dirigida a la lección equivocada;
- una «caja» citada con un título que no existe;
- un resumen que contradecía su propia tabla;
- enlaces que faltaban entre bestiarios gemelos;
- un bestiario duplicado más, `m6b-distorsion-invertida`;
- tres shaders de 6.4 que usaban PCG sin `precision highp int`, lo que contradice 6.6.

---

## 1. Estado de cada pendiente de la lista

| Pendiente | Estado | Detalle |
|---|---|---|
| 6.1 (~l.1199): los 43 682 fallos de `mod(x, 7.0)` atribuidos a «reutilizar el inverso» | Ya estaba hecho | Ahora es l.1202. Explica la causa: con fast math se multiplica por `fl(1/7)`, que es algo mayor que 1/7. Solo fallan los múltiplos negativos. El número de fallos depende del rango (39 en −500…999 499 y 43 682 en ±500 000), «igual con un píxel por entero que con un bucle». Remite a 6.5 `#cuando-falla-mod`. Coincide con el hecho 3. |
| 6.5, lo mismo | Ya estaba hecho | La caja hack `#cuando-falla-mod` incluye el párrafo «¿Cuándo falla `mod`?» con las cifras por rango y por divisor, la emulación en CPU y la versión blindada. |
| `isnan`, fast math y la caché en 6.1, 6.2, 6.5 y 6.6 | Ya estaba hecho; revisado frase a frase | Detalle debajo de la tabla. |
| 6.8 (~l.99): `texelFetch` fuera de rango | Corrección ya hecha; **completado ahora** | El texto ya decía que WebGL 2.0 obliga a devolver 0, o (0, 0, 0, 1) si la textura está incompleta, con la cifra del M1. Añadí la cita literal de la especificación de WebGL 2.0 (apartado «Texel Fetches», con enlace) y lo medido aquí: ver §3, que trae una sorpresa. |
| 6.6 (~l.425): «`fract` siempre en [0, 1)» | Ya estaba hecho | l.426 incluye la letra pequeña de float32 (−1e−9 da 1.0) con enlace a 6.5, y explica por qué ahí no hace daño. **Además**: la misma afirmación seguía sin matizar en 6.7 (l.378) y la matizo ahora. |
| `PENDIENTES_FINALES.md` sobre 6.6: dividir por la altura es de 6.2 y `fwidth` es de 6.3 | Ya estaba hecho | l.708 enlaza a 6.2 y l.652 a 6.3. |
| `m6a-orden-espacio` y `m6b-rot-al-reves` | Ya estaba hecho | Son `callout nota`, conservan el `id` y no llevan `data-id` ni la clase `bestiario`. Enlazan a `m3-orden-transformaciones` y a `m3-matriz-traspuesta` + `m3-rotacion-inversa-shader` con el título exacto. |
| `m6b-hash-fastmath` frente a `m3-isnan-heisenbug` y `m3-hash-roto` | **Decidido: son casos distintos; se queda como bestiario** | `m3-isnan-heisenbug` es «añadir `isnan` cambia el resultado». `m6b-hash-fastmath` es «el arreglo con `isnan` deja de funcionar al recargar», es decir, la caché de programas. El título ya marca la diferencia y los dos se enlazan mutuamente. El de 6.6 enlazaba ya al de 3.7 y a `m3-hash-roto`. El revisor de m0–m5 ha añadido esta sesión el enlace de vuelta en la causa de `m3-isnan-heisenbug`; lo comprobé leyendo 3.7. El diagnóstico de A.1 enlaza a `#m6b-hash-fastmath`, así que conservarlo evita romperlo. |
| Otros duplicados entre m6 y m3–m5 (grep de `data-titulo`) | **Uno nuevo, convertido en nota** | `m6b-distorsion-invertida` («La lupa encoge en lugar de ampliar») es el mismo fenómeno, con la misma causa y la misma solución, que `m3-rotacion-inversa-shader` («En el shader todo se mueve al revés»), que ya menciona «multiplicas por 2 para agrandarlo y se hace más pequeño». Ver §2 (6.8) y el **aviso para A.1** en §4. El resto de parejas cercanas son casos distintos (lista en §5). |
| Títulos de bestiario citados que no coincidían | Ya estaba hecho | Los seis pedidos (6.1: `m5-version-primera-linea`, `m4-precision-uniform`, `m5-sampler-unidad` y `m4-uniform-silencioso`; 6.2: `m3-rotacion-inversa-shader`; 6.5: `m3-costura-atan`) coinciden. Con `titulos.mjs`: los 21 enlaces que citan un título entre «» coinciden exactamente con su `data-titulo`, incluidos los que añadí. Las demás referencias son paráfrasis sin comillas («el bicho de las derivadas en una rama»), que dejé así. |
| 6.4, dithering: amplitud y rango | Ya estaba hecho | El texto, la demo, el hack, el enunciado y la solución de 6.4.4 y el resumen dicen lo mismo: ruido uniforme entre −0,5 y +0,5 niveles, «un nivel de ancho en total». El código lo hace: `n = azar − 0.5` ∈ [−0,5, 0,5) en niveles, y `(azar − 0.5) / 255.0`. El caso de 100,3 (30 % a 101) es correcto. El glosario no está alineado (§4). |
| 6.10: `smoothstep` invertido en «iMouse, visualizado» y en 6.10.4 | Ya estaba hecho | El enunciado y la solución usan `1.0 - smoothstep(10.0, 12.0, d1)` (l.99, 814 y 881). Con un grep de todo m6 (literales y bordes con `px`) solo quedan dos casos, ambos a propósito: la tabla de idiomas de Shadertoy, que explica el problema y da la traducción, y el original «golfeado» del ejercicio 6.10.3, cuya solución lo reescribe en orden. |

**Detalle del pendiente de `isnan`, fast math y la caché.**
- **6.1:**
  - La columna de la tabla dice «con `isnan`… (compilado por primera vez)».
  - El playground JS (WebGL crudo) añade un comentario único en cada ejecución y el texto explica por qué.
  - l.838 explica la caché y que los editores del curso añaden un comentario único a los shaders con `isnan`.
  - El resumen dice «e incluso si el programa sale de la caché».
- **6.2:** la tabla de depuración dice «en los editores del curso eso pasa siempre; en tu propia página, solo la primera vez».
- **6.5:** la caja senior «`fract` también redondea» lleva la misma matización.
- **6.6:**
  - El párrafo tras los dos editores cuenta la caché como contenido de hacker: «Los editores de este curso y el graficador usan justo ese truco…», y desaconseja usar `isnan` como interruptor.
  - El bestiario lleva la cifra medida de 0 y 2 071 fallos sobre 4 096.
  - La retícula periódica y el ejercicio 6.6.1 llevan la matización.
  - El resumen también.
  - Ya no queda la frase «deja de funcionar en la segunda visita» ni el truco del espacio en un comentario como única salida.
- **6.10:** la caja senior «El mismo código, otro resultado» también está matizada.

Todo coincide con el hecho 1. Solo hay una cifra que no puedo confirmar aquí: ver §6.

---

## 2. Cambios por archivo (y por qué)

### 6.1 `01-lenguaje.html`
- **l.34:** decía «Ya lo comprobaste en 4.1: todo el espacio que usa un shader se conoce al compilar». 4.1 no lo comprueba: explica que los registros se reparten entre los grupos en vuelo (ocupación). Ahora dice: «Ya viste por qué en 4.1: los registros de cada núcleo se reparten de antemano entre los grupos de píxeles en vuelo, así que todo el espacio que usa un shader tiene que conocerse al compilar».

### 6.3 `03-formas-sdf.html`
- **Hack «Contornos de contornos»:**
  - **El problema:** decía que `abs(mod(d, 0.1) - 0.05)` da un número ilimitado de contornos. Esa expresión es la distancia a los niveles d = 0,05 + 0,1k, no una banda; dibujarla con la cobertura no da contornos. Lo dejó anotado `revision-m6a.md` como pendiente menor.
  - **Qué cambié:** ahora es `abs(mod(d, 0.1) - 0.05) - 0.01`, con la explicación entre paréntesis. Así es coherente con la regla «`abs(d) - w` es un contorno» de la misma caja.

### 6.4 `04-color.html`
- **Chip de requisitos:** `6.2, 2.4, 5.5` → `6.2, 6.3, 2.4, 5.5`. Los ejercicios 6.4.2 y 6.4.4 usan SDF y la cobertura de un píxel de 6.3, y sus soluciones la citan.
- **PCG sin `precision highp int`** (playground «Bandas y ruido», y código de partida y solución del ejercicio 6.4.4):
  - **El problema:** los tres usan el hash PCG con `uint` sin declarar `precision highp int;`. 6.6 (caja senior «¿Y la precisión de los enteros?») dice que sin esa línea PCG no está garantizado, porque en el fragment shader `int` y `uint` son `mediump` y pueden tener 16 bits en un móvil.
  - **Qué cambié:** añadí la línea, con el comentario `// PCG necesita enteros de 32 bits de verdad (6.6)`, debajo de `precision highp float;`. En el M1 no cambia nada, porque allí `mediump int` ya es de 32 bits.
  - **Hack «Dithering en una línea»:** ahora dice de dónde sale `azar` y por qué necesita `highp int`, con enlace a 6.6.

### 6.5 `05-patrones.html`
- **Bestiario `m6a-patron-lejos`:** al final de la causa, «Es la versión en patrones de dos bichos de 3.7», con enlace al título exacto de `m3-temblor-mundo-grande` y de `m3-tiempo-horas`. Comparten mecanismo (rejilla de float32 a gran escala) y solución (envolver en la CPU). Antes no se citaban.
- **Bestiario `m6a-formas-cortadas`:** al final de la solución, el enlace a su gemelo 3D `m6b-rm-repeticion` (6.9), que ya enlazaba a este. Ahora el enlace va en los dos sentidos, como pide el criterio «casos distintos → enlazados».

### 6.6 `06-ruido.html`
- **l.178 (caja senior de la precisión de los enteros):** decía «getShaderPrecisionFormat da 32 bits también para mediump int, como verás en 6.10». La promesa apuntaba a una lección posterior para algo que ya mostró 6.1, en su caja senior «lowp en un sampler…». Ahora dice «como viste en 6.1», con enlace a `#precision-la-declaracion-obligatoria`.
- **l.946 (hack de la retícula periódica):** citaba «la caja «¿Cuándo falla `mod`?» de 6.5», pero esa caja se titula «Un patrón que se repite sin costuras en una textura» y «¿Cuándo falla `mod`?» es un párrafo dentro de ella. Ahora dice «el párrafo «¿Cuándo falla `mod`?» de la caja «Un patrón que se repite…» de 6.5», con enlace.
- **Resumen:** decía que PCG es «más caro en algunas [GPU]», cuando la tabla de la propia lección lo da ≈ 3× más caro que el seno en el M1 (Hoskins, ≈ 0,9×). Ahora dice «más caro (en nuestro M1, más de tres veces el de Hoskins)».
- **l.113:** «el bicho de añadir isnan cambia el resultado» (paráfrasis) pasa a ser el título exacto, «Añadir isnan() para depurar cambia el resultado».

### 6.7 `07-animacion-shaders.html`
- **l.378 (ejemplo 6.7.1):** decía «`fract` de un negativo sigue estando en $[0, 1)$», sin la letra pequeña que 6.5 y 6.6 sí dan. Ahora añade: «(con la letra pequeña de float32 de 6.5: un negativo diminuto puede dar 1.0, que en un ciclo periódico equivale a 0)».

### 6.8 `08-texturas-efectos.html`
- **l.99 (`texelFetch`):**
  - **La cita:** añadí la cita de la especificación de WebGL 2.0, apartado «Texel Fetches», con enlace: *«Texel fetches that have undefined results in the OpenGL ES 3.0 API must return zero, or a texture source color of (0, 0, 0, 1) in the case of a texel fetch from an incomplete texture»*. Es la misma cita que descargó el revisor de m3–m5.
  - **La medida de aquí:** añadí que en Chromium 141 sin GPU (ANGLE sobre Vulkan con SwiftShader) las coordenadas fuera de rango dieron cero, pero un nivel de mipmap inexistente o negativo devolvió el texel del nivel existente más cercano.
  - **Remate:** «El código correcto nunca lee fuera».
  - **Por qué lo añadí:** es una desviación real de la especificación en un backend de Chrome que usan muchos equipos sin GPU. Encaja con el «no cuentes con ello» del párrafo y no contradice la cifra del M1, que se conserva.
- **Bestiario `m6b-imagen-estirada`:** decía «Es el mismo bicho del aspecto de 3.6». El bicho de 3.6, `m3-aspecto`, trata de la matriz de proyección. El de un fragment shader que normaliza cada eje por separado es `m6a-circulo-estirado`, de 6.2, y la propia 6.2 distingue las dos causas. Ahora enlaza a 6.2 con el título exacto y deja 3.6 como el equivalente en 3D.
- **`m6b-distorsion-invertida` convertido en nota:**
  - **Formato:** `callout nota` con `id="m6b-distorsion-invertida"` y sin `data-id`. Enlaza a `m3-rotacion-inversa-shader` de 3.5.
  - **Lo que conserva:** todo su contenido: la explicación «cada píxel decide de dónde lee», la lupa de ×1,5 y el consejo propio de las distorsiones (si la inversa no tiene fórmula, cambiar el signo de un desplazamiento pequeño).
  - **Por qué:** es el mismo síntoma, con la misma causa y la misma solución, que el bicho de 3.5, cuyo síntoma ya incluye «multiplicas por 2 para agrandarlo y se hace más pequeño». Es la misma política que se aplicó a `m6a-orden-espacio` y a `m6b-rot-al-reves`.
  - **Enlaces:** el enunciado del ejercicio 6.8.2 decía «repasa el bicho de la lupa que encoge». Ahora dice «la nota de la lupa que encoge», con enlace al `id`.
- **l.76 («Tirar, no empujar»):** la regla de la transformación inversa ahora remite a la sección de 6.2 donde se enseña a fondo, `#transformar-el-espacio-no-la-forma`.

---

## 3. Experimento: `texelFetch` fuera de rango

**Montaje y entorno:** Chromium 141, ANGLE sobre Vulkan con SwiftShader. Un FBO RGBA8 de 1 × 1, un `texelFetch` por dibujo y `readPixels`. Las texturas son RGBA8 de 2 × 2 con el valor (255, 128, 64, 200).

| Caso | Resultado |
|---|---|
| Textura completa (`NEAREST`), (0, 0), nivel 0 | 255, 128, 64, 200 |
| Completa, (5, 5) y (−1, 0) | **0, 0, 0, 0** |
| Completa, nivel 1 o 3 (no existen) | 255, 128, 64, 200 (no da cero) |
| Con mipmaps, nivel 0 = 10 y nivel 1 = 90: `lod` 2, 5 / −1 | **90 / 10**: se recorta al nivel existente más cercano |
| Con mipmaps, (1, 0) en el nivel 1 (de 1 × 1) | 0, 0, 0, 0 |
| Incompleta (filtro por defecto sin mipmaps), (0, 0) | **0, 0, 0, 255** (el (0, 0, 0, 1) de la especificación) |
| Incompleta, (5, 5) | 0, 0, 0, 0 |

**Conclusiones:**
- Las coordenadas fuera de rango y la textura incompleta se comportan como dice la especificación (y como dicen 5.5, 6.8 y las chuletas).
- El nivel de mipmap inexistente **no** se comporta así en este backend: el `lod` se recorta. En el M1 (Metal) los revisores de la sesión 2 midieron cero también con un nivel inexistente, así que es propio de ANGLE/Vulkan/SwiftShader.
- Lo añadí a 6.8 como detalle de hacker y no toqué la cifra del M1. Va en §4 para 5.5 y las chuletas.

---

## 4. Problemas en archivos ajenos (no los edité)

### A.1 `08-anexos/01-bestiario.html` («Diagnóstico rápido»): IMPORTANTE para la pasada de `indexar.mjs`
1. **l.120:** `<a href="#m6b-distorsion-invertida">La lupa encoge en vez de ampliar</a>`. Ese `id` deja de ser un bestiario (§2, 6.8): al regenerar `datos-bestiario.js` desaparece la tarjeta y la página avisará de un enlace a un caso inexistente.
   - **Propuesta:** apuntarlo a `#m3-rotacion-inversa-shader`, o fundirlo con la l.119: `<a href="#m3-rotacion-inversa-shader">En el shader todo se mueve al revés</a>: transformas las coordenadas, no el dibujo (también la lupa que encoge en vez de ampliar)`.
2. **l.122:** `<a href="#m3-rotacion-inversa-shader">Una rotación copiada de otro shader gira al revés</a>`. Según la nota `m6b-rot-al-reves` de 6.10, la rotación copiada de Shadertoy es el caso de `m3-matriz-traspuesta` (`p *= rot(a)` con `mat2(c, -s, s, c)`).
   - **Propuesta:** `href="#m3-matriz-traspuesta"`. La l.121 ya enlaza `m3-matriz-traspuesta` con el texto «La matriz está traspuesta»; se podría fundir: «…gira al revés y no traslada (también una rotación copiada de Shadertoy)».
3. **l.252:** `<a href="#m3-hash-roto">El hash del seno</a> depende de la precisión de cada GPU (<a href="#m6b-hash-fastmath">y de si el shader usa isnan</a>)`. Que el seno cambie con `isnan` es `m3-isnan-heisenbug` (y el texto de 6.6); `m6b-hash-fastmath` trata de la caché.
   - **Propuesta:** `(<a href="#m3-isnan-heisenbug">y de si el shader usa isnan</a>, <a href="#m6b-hash-fastmath">e incluso de la caché de programas</a>)`.
4. **Ningún otro enlace del diagnóstico a m6 se rompe:** comprobé las 48 referencias a `m6a-`/`m6b-`, y todos los demás `id` siguen siendo bestiarios. `datos-bestiario.js` ya no lista `m6a-orden-espacio` ni `m6b-rot-al-reves`, y el diagnóstico no los usa.

### A.4 `08-anexos/04-glosario.html`
1. **`#g-dithering` (l.609):** «un ruido del tamaño de un nivel (±medio nivel)». Es justo la ambigüedad que se corrigió en 6.4.
   - **Propuesta:** «un ruido uniforme de ±medio nivel (un nivel de ancho de pico a pico)».
2. **`#g-fast-math` (l.821):** «En Chrome sobre Metal están activas salvo que el shader use isnan/isinf…». Le falta la caché.
   - **Propuesta:** añadir «…aunque solo en la primera compilación de ese texto exacto: si Chrome saca el programa de su caché (memoria y disco), vuelve el fast math; los editores del curso lo evitan añadiendo un comentario único ([6.6](#m6b-hash-fastmath))».
3. **«comportamiento indefinido» (l.407):** «Depende del contexto (valores constantes o no, isnan presente o no)».
   - **Propuesta:** añadir «e incluso de si el programa sale de la caché del navegador», como el resumen de 6.1.
4. **`#g-texelfetch` (l.2177):** «(fuera de rango, WebGL devuelve ceros)». Es correcto para las coordenadas.
   - **Propuesta opcional:** «(coordenadas fuera de rango: WebGL obliga a devolver ceros; un nivel inexistente debería dar cero, pero ANGLE/Vulkan con SwiftShader recorta el nivel)».

### Módulo 5 y chuletas (a quien los revise)
- **5.5 `05-webgl/05-texturas.html` l.431:** afirma que `texelFetch` devuelve cero también «con un nivel de mipmap que no existe». Es verdad en el M1, pero no en Chrome con SwiftShader, donde el nivel se recorta (§3). A.2 (l.621) y A.3 (l.630) solo lo dicen en general («`texelFetch` fuera de rango»), lo que sigue siendo cierto para las coordenadas. Si se quiere, la misma matización que puse en 6.8.

### Módulo 3 (al revisor de m0–m5)
- **3.7 `03-matematicas/07-precision.html`, editores con PCG (l.275 y l.613):** usan `uint` sin `precision highp int;`, mientras 6.6 explica que PCG lo necesita para ser exacto en un móvil (en el M1 no cambia nada). Propuesta: añadir la línea, como hice en 6.4.
- **3.7, párrafo nuevo sobre la caché (l.435):** está bien y coincide con 6.6 (0 y 2 071 sobre 4 096; el comentario único de los editores). Ahora la explicación completa está en los dos sitios. No es grave, porque cada uno tiene su demo, pero si se quiere aligerar, 3.7 podría quedarse con dos frases y el enlace a 6.6, donde están las medidas y el bestiario.

### Módulo 7 (a la coherencia m6 ↔ m7, §3.6 del plan)
Bestiarios de m7 muy cercanos a los de m6, que convendría que al menos se enlazaran:
- **`m7-4-epsilon`** («Las normales por diferencias finitas salen con granulado o chispas») y **`m6b-rm-normales`** (6.9, «La superficie sale granulada, o las aristas salen redondeadas»): misma causa, el paso ε y la cancelación catastrófica de 3.7.
- **`m7-4-heightmap-escalones`** («El terreno sale en terrazas…») y **`m6b-ruido-textura-escalones`** (6.6, «El ruido leído de una textura hace escalones al ampliarlo»): 8 bits por texel.

Las citas de m7 hacia m6 (unas 40) son correctas y sus anclas existen; m7 cumple las promesas que le hace m6 (7.3 `#fundido-en-srgb-y-en-luz` y el reparto «JS decide cuánto» de 6.7; 7.4 hace en 3D las baldosas de 6.7).

---

## 5. Coherencia general del módulo (lo comprobado sin cambios)

**Contradicciones entre lecciones de m6 y con m3–m5:** no encontré ninguna más allá de las corregidas. Coinciden:
- **`gl_FragCoord`:** centros en .5, origen abajo y relativo a la ventana (6.1, 6.2, 6.10).
- **`u_mouse`:** píxeles físicos, empieza en el centro, `.z` = 1 al pulsar (6.2, 6.9, 6.10); el `iMouse` de Shadertoy, en 6.10.
- **Derivadas:** quads de 2 × 2 en 6.2; `fwidth` en norma L1 en 6.3, con 1,03 frente a 1,40; la costura de `fwidth(atan)` en 6.5 (6,25 frente a 0,035); la costura de mipmap en 6.8; y la paridad del quad, igual en 6.5 y en 6.8.
- **Precisión:** `highp` garantizado en el fragment en 3.00; `mediump int` mínimo de ±2¹⁵ en la especificación y de 32 bits en el M1 (6.1, 6.6, 6.10).
- **`out`:** empieza a 0 en Chrome (6.1 y 6.10).
- **`v * M` = traspuesta:** 6.1, 6.10 y 3.5.
- **`rot(a) = mat2(c, s, -s, c)`, antihoraria:** 6.2 y 6.10.
- **`smin`:** k/4 y protección de k = 0 (6.3 y 6.9); exacta frente a cota, con la escala `sdf(p/s)*s` (6.3 y 6.9).
- **sRGB:** 0,5 → 0,214; 128 → 0,216; 188 (6.4, 6.8, 6.9, 5.5).
- **Sepia:** 1,351/1,203 (6.4 y 6.8).
- **Hashes:** `hash12` es el de Hoskins (6.5 → 6.6 → 6.7); PCG con 24 bits (6.4 → 6.6).
- **Bucles de 1.00:** 6.1, 6.6 y 6.10.
- **Tiempo en float32:** 0,0078 s y 0,031 s (6.7 = 3.7 = 5.4).
- **`GLKit.bucle` con dt ≤ 0,1 s:** 5.4 y 6.7.
- **`MAX_DRAW_BUFFERS` 8:** 6.1 y 5.8.

**Tiempos de GPU:** solo 6.6, 6.8 y 6.9 dan cifras de trabajo de GPU, y las tres remiten al método de la caja senior `#medir-coste-shader` (ya re-medidas en la sesión 2). 6.1–6.5, 6.7 y 6.10 no dan ninguna (comprobado con grep de «ms», «µs» y «fps»).

**Orden pedagógico:** lo que una lección usa antes de enseñarlo lleva un «lo verás en…» que se cumple:
- `fwidth` en las isolíneas de 6.2 → 6.3;
- `hash12` en 6.5 → 6.6;
- PCG en 6.4 → 3.7 y 6.6;
- el aspecto en 6.1 → 6.2.

Revisé las 32 promesas internas («lo verás en / al final / enseguida / en la sección…»): todas se cumplen, salvo la de l.178 de 6.6, corregida. También revisé las promesas que otros módulos hacen a m6:
- 3.2 → SDF de 6.3;
- 3.4 → 6.3, 6.4 y 6.5;
- 4.1 → `dFdx` en 6.2;
- 5.2 y 5.10 → «el módulo 6»;
- 5.5 → 6.2, 6.3 y 6.4;
- 1.2 → gamma en 6.4;
- 2.4 → 6.4;
- 2.6 → filtros en 6.8;
- 2.8 y 1.3 → hashes en 6.6.

Todas se cumplen.

**Repeticiones:** las que quedan van a distinta profundidad y con enlace:
- el hash del seno de 3.7 «visto otra vez» en 6.6, con lo nuevo (fast math y caché);
- depurar con color en 5.10 y 6.2;
- ANGLE en 4.1, 5.10 y 6.1;
- `smin` en 6.3 (derivación) y 6.9 (recordatorio);
- mipmaps en 5.5 (breve) y 6.8 (a fondo);
- la transformación inversa en 6.2 (a fondo) y en 6.8, 6.10 y 3.5 (ahora enlazadas).

**Bestiarios cercanos que se quedan, con su motivo:**
- **`m6a-circulo-estirado`, `m6b-imagen-estirada` y `m6b-rotar-deforma`:** la misma causa con tres síntomas distintos. Se enlazan entre sí, y A.1 los agrupa como variantes de `m3-aspecto`.
- **`m6b-u-frame-hz` y `m2-velocidad-depende-hz`:** el primero enlaza al segundo; A.1 los lista como dos causas del mismo síntoma.
- **`m6a-muare-procedural` y `m5-muare`:** patrón frente a textura, enlazados.
- **`m6a-espacios-mezclados` frente a `m1-raton-invertido` y `m1-raton-desplazado`:** 6.2 distingue las tres causas.
- **`m6a-indefinido-portabilidad` y `m3-mediump-movil`:** comportamiento indefinido frente a precisión.

**Notación y terminología:**
- **búfer/buffer:** se respeta la convención de 0.1 («búfer de dibujo», «búfer de profundidad», «buffer de bytes/memoria»; los «buffers A–D» de Shadertoy son nombre propio).
- **Uniforms:** `u_time`, `u_resolution`, `u_mouse` y `u_frame` en todo el módulo (169 `u_resolution`, 76 `u_time`; ningún `u_t`).
- **Grafías:** «semi-implícito» bien escrito; «warp» definido en 4.1.

**Enlaces:**
- `node enlaces.mjs` sobre m6: 10 archivos, 321 enlaces internos, **0 rotos** (tras todas las ediciones). Sobre todo el curso: 63 archivos, 0 rotos.
- `numeros.mjs`: los 246 enlaces cuyo texto es un número de lección apuntan a esa lección del manifest.

---

## 6. Pendientes de medir en el M1
- **6.6, l.114:** «lo comprobamos: el segundo [editor, con `isnan`] dio 256 niveles de gris distintos en la primera carga y también al recargar; el primero, 17 las dos veces».
  - **Por qué lo dudo:** es plausible tras el comentario único de `Curso.glCompartido.compilar` (el lead midió 0 fallos de `mod` en la 1.ª, 2.ª y 3.ª compilación en los playgrounds), pero no sé si alguien midió exactamente esta cifra después del arreglo. Aquí no se puede medir: SwiftShader no tiene fast math y daría 256 en los dos editores.
  - **Propuesta:** cargar 6.6 dos veces en el M1 con el mismo perfil y contar los niveles de gris de los dos editores.
- **`texelFetch` con un nivel inexistente en el M1:** las revisiones de la sesión 2 midieron (0, 0, 0, 0). Si alguien vuelve a medirlo, que distinga una textura sin mipmaps de una con mipmaps y un `lod` mayor que el último nivel (en SwiftShader se recorta: §3).

---

## 7. Decisiones discutibles
- **`m6b-distorsion-invertida` → nota.** Seguí la política de las sesiones anteriores, «un síntoma, una tarjeta». A cambio, 6.8 pasa de 5 a 4 bestiarios y A.1 necesita el cambio de §4.1. Si el dueño prefiere conservar la tarjeta por lo fácil que es buscar «lupa», basta con restaurar la caja y no tocar A.1.
- **`m6b-hash-fastmath` se queda.** Su síntoma, que un arreglo deje de funcionar al recargar, es distinto del de `m3-isnan-heisenbug`, aunque ahora la causa de este último también mencione la caché.
- **Separador decimal.** 6.1–6.5 (autor m6a) usan punto en la prosa y 6.6–6.10 (autor m6b), coma. Es la misma mezcla de todo el curso que señaló `coherencia-m3-m5.md`; no hay convención en 0.1 ni en la guía. No lo unifiqué: sería tocar cientos de cifras y no confunde. Si el dueño fija una convención, es una pasada mecánica.
- **Nota sobre SwiftShader en 6.8.** El curso da sus cifras en el M1. Añadí una medida de otro backend porque es una desviación de la especificación que un alumno sin GPU dedicada puede encontrarse, y porque refuerza la regla «nunca leas fuera».
- **Paráfrasis de títulos.** Dejé sin cambiar las referencias informales sin comillas, como «el bicho de las formas cortadas». Solo exijo título exacto cuando la cita va entre «».

---

## 8. Verificación
(ver abajo)
