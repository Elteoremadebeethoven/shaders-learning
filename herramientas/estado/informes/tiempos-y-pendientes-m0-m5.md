# Tiempos de GPU (m2–m5) y pendientes de coherencia (m0–m5) · sesión 3

Agente `pend-m0-m5`. Máquina de esta sesión: contenedor Linux sin GPU, Chromium 141 headless con SwiftShader. Aquí **no se ha re-medido ninguna cifra de GPU**: todas las cifras del curso siguen siendo las del M1 (Chrome, ANGLE/Metal). Lo que sí se ha comprobado aquí está marcado como «comprobado en Chromium 141».

Archivos modificados (todos dentro de mi encargo):
`01-web/01-html.html`, `02-animacion/01-pipeline-render.html`, `02-animacion/04-interpolacion-easing.html`, `02-animacion/06-canvas2d.html`, `02-animacion/07-waapi-flip.html`, `03-matematicas/03-trigonometria.html`, `03-matematicas/07-precision.html`, `04-gpu/01-cpu-vs-gpu.html`, `04-gpu/02-pipeline-grafico.html`, `04-gpu/03-gpu-de-juguete.html`, `04-gpu/06-opengl-python.html`, `04-gpu/recursos/demo-raster.js`, `05-webgl/03-buffers-atributos.html`, `05-webgl/04-uniforms-animacion.html`, `05-webgl/06-3d-cubo.html`, `05-webgl/10-depuracion.html`.

Archivos nuevos: `herramientas/estado/lab/pend-m0-m5-tiempos.mjs` y `pend-m0-m5-tiempos.html` (laboratorio para el M1) y este informe.

---

## A · Inventario de tiempos de GPU (módulos 2–5)

### A.1 Resultado en una frase

**Ninguna cifra de m2–m5 se midió con el método engañoso** (N dibujos seguidos sobre el mismo framebuffer divididos entre N). Todas las cifras de trabajo de la GPU cuyo método consta (código del playground o texto) se tomaron con un dibujo, o una escena completa, **entre dos `readPixels`**: cada medida es su propia pasada de render, que es lo esencial del método fiable. Las que no documentan el método son internamente coherentes. No he tenido que retirar ni rebajar ninguna conclusión; sí he añadido texto para que el alumno sepa qué mide cada cosa y no caiga en la trampa (A.4), y he dejado un laboratorio para que el dueño confirme todas las cifras en su M1 (A.5).

### A.2 Clasificación de todas las cifras de tiempo

Grep de `ms`, `µs`, `ns`, `fps`, `Hz`, `milisegundo`, `tarda/tardó/costó`, `veces más` en las 31 lecciones de m2–m5, leyendo cada contexto. Las duraciones de animación (`transition: 300ms`, `ease-out` en 450 ms…), los presupuestos (16,7 ms a 60 Hz) y las cuentas (ULP del tiempo, «28 minutos a 60 fps») no son medidas y no se listan.

**Tiempo de CPU (JavaScript, navegador, API): se mide bien con `performance.now()`. Veredicto: fiable; sin cambios.**

| Lección | Cifras |
|---|---|
| 2.1 | thrashing: intercalado ≈ 50 ms frente a < 1 ms (500 barras); 36 frente a 2,6 ms (300 tarjetas) y 399 frente a 8 ms (1000); la tabla de trazas cuenta frames, no tiempos |
| 2.2, 2.7 | tiempos del modelo de animación medidos con `getAnimations()`/`currentTime` (300 ms de vuelta, `linear()` a 375/750/875 ms, máximo de 1,25 a 135 ms): no son rendimiento |
| 2.3 | rAF anidado +16,6 ms; inicio de frame → callback 8,5 ms y 0,7–2,6 ms (E4 de coherencia-m0-m2); `setTimeout(f, 16)` 16,77 ms; mínimo de 4 ms; ejercicio del medidor (30 ms de trabajo → ~30 fps) |
| 2.5 | `e.timeStamp` frente a `performance.now()` (164,6 / 164,7 ms) |
| 2.6 | `fill()` de 0,1 a 0,5 ms; bucle por píxel 10,7 / 9,1 ms (800 × 600) y extrapolación a 180 ms; tabla de 20 000 formas (canvas GPU 2,0–16,2 ms, canvas CPU 8,4–35,5 ms: el texto dice «tiempo de JavaScript por frame», y en el canvas CPU incluye el rasterizado por software); 3000 formas caras; 0,1 µs por `fillRect` |
| 2.8 | simular / dibujar (0,4–92,7 ms, 0,18 µs por `fillRect`), píxeles directos 0,9–2,2 ms, `putImageData` a 4K ≈ 8 ms, 1 000 000 de partículas 17,2 + 7,2 ms |
| 3.1 | `Math.hypot` 57 ms frente a 7 ms (cinco millones de llamadas) |
| 4.1 | `drawArrays` 0,0–0,1 ms en el JS; `uniform1i` y casi todo `getParameter` < 0,0001 ms |
| 4.6 | `glUniform1f` 0,62 / 0,41 µs (Python, OpenGL nativo) |
| 5.1 | `getParameter`: 0,1 µs (valores simples), 2000 × `VIEWPORT` = 1,2 ms; 2000 × `clearColor` = 0,1 ms |
| 5.2 | compilar y enlazar 200 programas: 530 ms comprobando cada paso, 120 ms al final (0,2 ms de encolar): compilación del driver, no trabajo de la GPU |
| 5.3 | la demo de la onda (tiempos de JS en vivo); orphaning «décimas de milisegundo por llamada» |
| 5.4 | recalcular + `bufferSubData` 0,16–0,33 ms frente a `uniform2f` ≈ 0,001 ms; 10 000 `uniform4f` 0,6 ms; 10 000 `getUniformLocation` 1,8 ms |
| 5.9 | JS por frame de la tabla (0,85–35 ms; 40 y 170 ns por llamada); subir 1 000 000 de instancias, 0,64 ms de JS |
| 5.10 | ejercicio 5.10.5 (2,6 → 1,9 ms de JS); `FinalizationRegistry` (6 s) |

**Espera de sincronización (`readPixels`, `getError`, `finish`, `getParameter` que viaja): se mide bien con `performance.now()` alrededor de la llamada. Veredicto: fiable; sin cambios.**

| Lección | Cifras |
|---|---|
| 4.1 | `getError` 0,03–0,06 ms; `getParameter(COLOR_CLEAR_VALUE)` 36 µs; `finish` 0,0 ms; `readPixels` tras el dibujo ≈ 12 ms (40 ms con otro shader). Este último es a la vez el tiempo de GPU de **un** dibujo en su propia pasada: fiable |
| 5.1, 5.10 | `getError` ≈ 37 µs (74 ms por 2000); el envoltorio `Proxy`, 0,1 ms frente a 74,6 ms por 2000 llamadas |
| 5.4 | `gl.getUniform` ≈ 40 µs (caja hack) |
| 5.8 | `readPixels` de 1 px: 0,03 ms sin nada pendiente, 0,4 ms tras un dibujo trivial (el dibujo solo, 0,004 ms de JS), 14 ms tras uno pesado; con `PIXEL_PACK_BUFFER`, 0 ms; la valla, tres frames después |
| 5.10 | `finish` 0,00 ms y `readPixels` 3,6 ms sobre el mismo dibujo (bestiario `m5-finish-no-espera`) |

**Trabajo de la GPU (el sospechoso).**

| Lección · sección | Afirmación | Método | Veredicto | Cambio |
|---|---|---|---|---|
| 4.1 · «El mismo cálculo en tu CPU y en tu GPU» | GPU 7–10 ms (1024², 400 vueltas); «de 100 a 230 veces más rápida» | Código del playground: calentar, `readPixels`, `drawArrays`, `readPixels`. Un solo dibujo en su pasada; una sola muestra | **Fiable** (muestra única; por eso el texto ya da un rango) | ninguno |
| 4.1 · mismo párrafo | «con un bucle más cuidado, 0,9 TFLOPS» | No documentado | **Desconocido**, plausible: es el 39 % del pico publicado (2,3 TFLOPS); con la trampa habría salido por encima del pico | al laboratorio |
| 4.1 · «Mídelo en tu GPU» (divergencia) y hack «bloques de 8 × 8» | 8–9 ms; 15,5–17 ms; ≈ 9 ms con bloques ≥ 8 px | Playground: un dibujo entre dos `readPixels`, mediana de 5 | **Fiable** | ninguno |
| 4.1 · «La memoria» | coherente ≈ 1 ms, aleatorio ≈ 18 ms, «casi veinte veces» | Ídem | **Fiable**. Matiz: el ≈ 1 ms incluye el coste fijo de la ida y vuelta de `readPixels` (0,4 ms en 5.8), así que el cociente real es, si acaso, mayor | ninguno |
| 4.1 · «Cuánto cuesta un draw call» | 10 000 llamadas ≈ 3,5 ms en total (0,3 de JS), instanciado ≈ 0,7 ms; 100 000: 26 ms (10 de JS) | Playground: la escena completa entre dos `readPixels` (no divide entre N) | **Fiable**. Mide sobre todo el proceso de órdenes; los fragmentos (triángulos de 5 px) son despreciables | ninguno |
| 4.1 · bestiario `m4-tiron-primer-dibujo` | primer dibujo 4,7–7 ms frente a 0,5; blending nuevo 3,6–5,5; `linkProgram` 12–22 ms | No documentado | Plausible; es creación de estado del pipeline en el driver, no trabajo de fragmentos | ninguno |
| 4.1 · ejercicio 4.1.3 | 10 frames: 40–45 ms → ≈ 3 ms | 10 frames seguidos sobre el mismo búfer, cada uno con su `clear`, y una espera al final | **Fiable para lo que concluye** (el coste de 100 000 llamadas). El método no serviría para medir un shader: cada `clear` tapa lo anterior | nota en la solución |
| 4.1 · ejercicio 4.1.4 | (sin cifras en el texto) | un dibujo entre barreras, mediana de 5 | Fiable | ninguno |
| 4.2 · «Early-z» (tabla de 32 capas, bestiario `m4-discard-lento`, quiz) | 1 capa 2,4–3,5 ms; 32 opacas ≈ 1×; con `discard`, `gl_FragDepth` o blending 17–27× | Playground: `readPixels`, `clear`, 32 dibujos, `readPixels`; mediana de 3. Cada escena es su propia pasada | **Fiable**. Es justo la medida que demuestra por qué engaña la trampa (la eliminación de superficies ocultas) | párrafo nuevo |
| 4.2 · hack «Ocultar objetos desde el vertex shader» | 46 ms frente a 2 ms; ocultas 0,5 frente a 1,1 ms | No consta en el texto; según informe-m4, el mismo montaje de 32 capas | **Probablemente fiable**. El 0,5 ms es casi todo el coste fijo de la pasada y del `readPixels` | al laboratorio |
| 4.2 · senior «El driver también conoce trucos» | blending con alfa constante 1: 2,6 ms; alfa calculado: 66 ms | Ídem | **Probablemente fiable** | al laboratorio |
| 4.6 · tabla de los tres caminos | dibujar y leer 256²: 89 ms (Python), 0,29 ms (moderngl y PyOpenGL); 12 µs de encolar | OpenGL nativo de macOS, dibujo + lectura, mediana de 50 | **Fiable** (no es WebGL; fuera del laboratorio) | ninguno |
| 5.8 · «readPixels y picking» | 14 ms tras un dibujo pesado | un dibujo + `readPixels` | **Fiable** (muestra única) | ninguno |
| 5.8 · hack «Picking de un solo píxel» | dibujo completo 14 ms, con scissor de 1 px 0,6 ms | No documentado; el 14 ms coincide con la espera de `readPixels` del mismo apartado | **Desconocido**, plausible | al laboratorio |
| 5.9 · «¿Cuánto se ahorra?» | 60 fps con 1 000 000 de instancias; 19 fps con 4 000 000 | fps de un bucle de `requestAnimationFrame` real | **Fiable** como medida de extremo a extremo (cada frame es una pasada; el límite es la GPU) | ninguno |
| 5.10 · «¿Me frena la CPU o la GPU?» | shader pesado 5,1 / 16,7 / 35,9 ms a 800×500 / 1600×1000 / 2400×1500; «7 veces más» con DPR 3; 20 000 llamadas 5,4 / 5,6 / 6,7 ms | No documentado | **Desconocido, coherente**: encaja exactamente con un coste lineal en píxeles más un fijo (1,23 ms + 9,67 ms/Mpx predice 5,1 / 16,7 / 36,0) | al laboratorio |
| 5.10 · «Las causas habituales, medidas» | cambios de estado 8,4 / 3,6 ms y 6,3 / 4,1 ms; subir texturas 1 / 0,3 ms | No documentado | **Desconocido**, plausible (proceso de órdenes y transferencias, no fragmentos) | al laboratorio |
| 5.10 · overdraw (lista y senior «Overdraw opaco») | 16 capas translúcidas 85,9 ms frente a 5,9 ms una; 16 opacas 6,1–6,5 frente a 6,4; con `discard` 86,9 | No documentado (escenas completas) | **Coherente**: 85,9 / 16 = 5,4 ms ≈ una capa. Si «una capa» se hubiera medido con la trampa, habría salido muy por debajo y el cociente sería ≫ 16 | al laboratorio |
| 5.10 · senior «Lo que el temporizador no te dice» | 0,03 ms con scissor; 3,2 / 7,5 / 9,8 / 9,7 ms con el mismo dibujo; 3,1–10,2 ms | `EXT_disjoint_timer_query_webgl2`, una consulta por frame | **Fiable como descripción del temporizador**; coincide con el hecho 2 (medianas erráticas) | párrafo nuevo |
| 5.10 · ejemplo 5.10.5 «Laboratorio CPU/GPU» | muestra en vivo fps, JS por frame y «GPU X ms (aprox.)» | temporizador de la GPU, media del último medio segundo | **Orientativo** (es el temporizador, no la trampa) | texto nuevo bajo la demo |

En m2 y m3 no hay ninguna cifra de trabajo de la GPU: el único shader con tiempos (2.6, ejemplo 2.6.3) solo dice «va a 60 fps sin despeinarse», que es cualitativo.

### A.3 Por qué no he cambiado ninguna cifra

- El §4 del plan declara engañoso un método concreto. No aparece en m2–m5: se ve en el código de los playgrounds (`bloques.mjs` en mi carpeta de trabajo lista los 18 bloques de m4–m5 que llaman a `performance.now()` junto a `drawArrays`/`readPixels`: ninguno divide entre N dibujos sobre el mismo framebuffer).
- Las cifras de método no documentado (5.8, 5.10, el TFLOPS de 4.1 y los dos recuadros de 4.2) pasan las comprobaciones de coherencia de la tabla. No hay ninguna prueba de que estén mal, así que no las toco: van al laboratorio con la cifra antigua al lado.
- Ninguna conclusión pedagógica depende de una cifra dudosa: «32 capas opacas cuestan lo que una», «`discard` y la mezcla no son gratis», «la resolución manda con un shader caro» y «100 000 llamadas no caben en un frame» salen de medidas por pasada.

### A.4 Cambios de texto del encargo A (para que el alumno sepa qué mide)

- **4.2, tras la tabla de 32 capas (párrafo nuevo).** Explica que cada medida del playground es una pasada completa y aislada (`clear` … `readPixels`), y que dibujar N veces lo mismo seguido sobre el mismo framebuffer y dividir entre N daría una cifra muchas veces menor, por la misma eliminación de superficies ocultas que acaba de medir («al revisar el módulo 6 encontramos cifras medidas así entre 3 y 30 veces por debajo»). Enlaza a la caja de 6.6 (`#medir-coste-shader`). Es el sitio natural: 4.2 es donde el alumno ve la causa.
- **4.1, bestiario `m4-drawcall-0ms`, solución.** Antes recomendaba primero `EXT_disjoint_timer_query_webgl2` y después la barrera. Ahora va primero la barrera (`readPixels` antes y después, como en los playgrounds de la lección), con un solo dibujo o una escena entre las dos, y el aviso de no dividir N dibujos (enlace a 4.2). El temporizador queda como opción «que dio valores muy variables en nuestras pruebas» (enlace a 5.10). Así lo pide el hecho 2.
- **4.1, solución del ejercicio 4.1.3.** Una frase: los diez frames seguidos valen aquí porque se mide el coste de las llamadas, pero no para medir un shader (enlace a 4.2).
- **5.10, senior «Lo que el temporizador no te dice».** Le añado `id="lo-que-el-temporizador-no-te-dice"`, porque los callouts senior no reciben id automático. Párrafo nuevo con el método fiable para medir un shader concreto (pasadas aisladas con dos FBO alternos, `clear`, `readPixels` al final, mediana de tandas), la comparación del módulo 6 (el temporizador dio una mediana de 42 ms donde las pasadas medían 5,4 ms) y la trampa de los N dibujos. Enlaza a 4.2 y a 6.6.
- **5.10, ejemplo 5.10.5 (el laboratorio).** Tras «Lo que deberías observar»: qué es exactamente la cifra «GPU» (la media del temporizador en el último medio segundo), que es orientativa, que hay que fiarse más de los fps y de cómo cambian al mover cada mando, y que todo depende de la GPU. No he cambiado el código: no usa la trampa, y medir con pasadas aisladas dentro del bucle de animación rompería el paralelismo CPU/GPU que la demo quiere enseñar.

### A.5 Laboratorio para el M1: `herramientas/estado/lab/pend-m0-m5-tiempos.mjs`

Reproduce las escenas de 4.1 (cálculo, TFLOPS con 4 cadenas vec4 independientes, divergencia con 7 patrones, memoria, `readPixels`/`finish`, 10 000 y 100 000 llamadas, ejercicio 4.1.3), 4.2 (las 14 variantes de 32 capas, incluidos el hack y el truco del driver), 5.8 (scissor y esperas de `readPixels`), 5.9 (1 M y 4 M de instancias), 5.10 (resolución, 20 000 llamadas, overdraw de 16 capas, cambios de estado, subida de texturas, temporizador). Las mide con el método fiable: cada repetición en su propia pasada (dos FBO alternos, `clear` al empezar), `readPixels` al final de la tanda, mediana de 5 tandas, con repeticiones ajustadas para que cada tanda dure unos 120 ms. Donde tiene interés, mide también con el método de la lección (dibujo entre dos `readPixels`) y, en 4.1 y 4.2, con la trampa, para que se vea la diferencia en el M1.

Imprime una tabla Markdown (lección · afirmación · cifra antigua · cifra nueva · notas), con la GPU, la versión de Chrome y la fecha.

Incluye además una comprobación que **no está medida**: si `isnan(u_nan)` sigue detectando un NaN de verdad cuando el programa sale de la caché con fast math (ver B.4). Compila tres veces el mismo texto, cuenta los fallos de `mod(x, 7.0)` y cuenta los píxeles que detectan el NaN.

Cómo ejecutarlo en el Mac del dueño (desde la raíz del curso; usa el puppeteer-core parcheado de `herramientas/node_modules` y su cola):

```bash
node herramientas/estado/lab/pend-m0-m5-tiempos.mjs                       # todo; en el M1, del orden de 1–2 min
node herramientas/estado/lab/pend-m0-m5-tiempos.mjs --solo 4.2            # solo las pruebas cuyo id empieza por 4.2
node herramientas/estado/lab/pend-m0-m5-tiempos.mjs --json /tmp/t.json    # además, los datos crudos
```

Por defecto usa `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` con `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`; la variable `CHROME` cambia la ruta. Lo probé aquí con `CHROME=/opt/pw-browsers/chromium ANGLE=swiftshader RAPIDO=1`, que reduce los tamaños: las 17 pruebas corren sin errores en unos 40 s, la tabla sale completa y el código de salida es 0. Las cifras de SwiftShader no valen y no las he usado.

**Qué hacer con los resultados.** Si una cifra nueva difiere de la antigua más de lo que explican la variación entre ejecuciones y las diferencias de montaje, hay que actualizarla en la lección. La columna «Afirmación» dice dónde está. Montajes que no consten en el texto original, y que he tenido que suponer:
- el shader pesado de 5.8: el de 600 senos de 4.1;
- el de 5.10: el fondo del laboratorio con 300 vueltas;
- el tamaño del lienzo de 5.9: 1440 × 900.

En esos casos, compara sobre todo los cocientes (×4/×9 en píxeles; 16 capas frente a una; scissor frente a completo).

---

## B · Pendientes de las revisiones de coherencia

Fuentes: `coherencia-m0-m2.md`, `coherencia-m3-m5.md`, `revision-m6a.md`, `revision-m6b.md`, `PENDIENTES_FINALES.md` (y un pendiente menor de `revision-m4.md` en mis archivos). Antes de cada cambio comprobé que nadie lo había hecho: `git diff 66d0cba` en m0–m5 solo muestra mis cambios.

| Pendiente | Estado | Cambio |
|---|---|---|
| 1.1 l.692: «`gl.clear()` en WebGL (lección 5.2)» | **Hecho** | Enlace a 5.1 `#clearcolor-y-clear-sin-misterios` |
| 5.3 l.651: «sus pausas se notan como tirones (2.3)» | **Hecho** | Ahora enlaza a 1.3 `#el-recolector-de-basura-y-los-bucles-calientes` y al comportamiento raro `m2-tirones-periodicos` de 2.1, con su título exacto. Comprobé que las dos anclas existen |
| 5.6 l.524: `passive: false` en el canvas | **Hecho** (B.1) | Reescrito |
| isnan y fast math en 3.3, 3.7 y 5.10 | **Hecho** (B.2–B.4) | 3.3, 3.7 (5 sitios), 5.10 (caja y 3 playgrounds de WebGL crudo) |
| Títulos de bestiario citados que no coinciden | **Hecho** (B.5) | 7 citas en 2.1, 2.4, 2.6 (×2), 2.7, 5.3 y 5.4 |
| «semi-implícito» | **Nada que hacer** | En m0–m5 todas las apariciones (1.3, 2.3 y 26 en 2.5) ya llevan guion; no hay «semiimplícito» ni «semi implícito» |
| Rutas `guardado: modulos/04-gpu/img/…` (m4) | **Hecho en el HTML** (B.6) | 4.3 y 4.6 |
| 1.4 l.360 (NDC → 3.1/3.6) y 4.1 l.549 («(1.7, 5.10)») | **Ya estaban hechos** | Los resolvieron las coherencias m0–m2 y m3–m5; comprobado |
| `revision-m4`: etiquetas de `#demo-raster` (4.3) en sentido horario | **Hecho** (B.7) | `demo-raster.js` |
| Enlaces rotos en m0–m5 | **0** | `node herramientas/enlaces.mjs` sobre los 39 archivos de m0–m5: 754 enlaces internos, 0 rotos (anclas incluidas) |

### B.1 5.6 · `wheel` y los escuchadores pasivos (`05-webgl/06-3d-cubo.html`)
**Comprobado en Chromium 141** (`exp/rueda.mjs`, rueda real por CDP sobre la página):
- en un canvas sin opciones: `cancelable = true`, `defaultPrevented = true`, la página no se desplaza;
- con `passive: false`, lo mismo;
- en `window`, `document` y `body` sin opciones: `cancelable = false` y la página se desplaza 300 px.

Coincide con 1.4 y con E1 de coherencia-m0-m2 (M1).

El texto decía que, sin `passive: false`, el `preventDefault` del canvas «se ignoraría». Ahora dice que en el canvas `passive: false` no es imprescindible, porque Chrome solo trata como pasivos por defecto los de `window`, `document` y `body` (enlace a `m1-pasivo` de 1.4, con la comprobación), y que lo escribimos igualmente porque deja clara la intención y sigue funcionando si el escuchador acaba en `window`. El código no cambia.

### B.2 3.3 · `atan(0, 0)` (`03-matematicas/03-trigonometria.html`)
«(y 0 si el shader contenía un `isnan` …)» pasa a decir que eso ocurre **la primera vez que Chrome compila ese texto**, y que luego la caché de programas devuelve la versión de siempre. Mantiene los enlaces a 3.7 y 5.10.

### B.3 3.7 · `07-precision.html`
- **Párrafo nuevo tras los dos editores «Sin isnan» / «Con un isnan que no hace nada»** (hecho 1).
  - Qué pasa: el efecto solo se produce en la primera compilación del texto exacto. Chrome guarda los programas en una caché de memoria y disco, compartida entre pestañas y visitas, y luego devuelve el binario con fast math. Cifra del lead: con `mod(x, 7.0)`, 0 fallos de 4 096 y luego 2 071; en otra pestaña, ya en la primera compilación.
  - Por qué los editores del curso no lo sufren: añaden, sin mostrarlo, un comentario distinto en cada compilación (`// sin-cache …`). Para la caché es un texto nuevo cada vez.
  - Moraleja: no uses `isnan` como interruptor de precisión.
- **Bestiario `m3-isnan-heisenbug`.** En la causa, la caché, con enlace al de 6.6 «El arreglo con isnan funciona la primera vez y deja de funcionar al recargar la página» (`m6b-hash-fastmath`, ya alineado con el hecho 1). En la solución, el comentario único para depurar en WebGL propio.
- **Quiz de `x != x`** y **resumen**: «al menos / solo en la primera compilación de ese texto».
- **Bestiario `m3-hash-roto`.**
  - Añade que el seno del fast math es más tosco: en el M1, a 20 000 celdas, 17 valores distintos con fast math frente a unos 2 000 sin él (6.6, medido por revision-m6b).
  - Añade que un `isnan` «arregla» el ruido solo en la primera compilación, con enlace a `m3-isnan-heisenbug`.
  - Con eso queda claro en qué se diferencia de `m6b-hash-fastmath` y el anexo no lo cuenta dos veces.

### B.4 5.10 · `10-depuracion.html`: la caja y los playgrounds de WebGL crudo
- **Caja «Medir NaN con isnan() cambia el resultado».** Párrafo nuevo con:
  - la caché y su cifra;
  - por qué los editores GLSL no lo sufren;
  - qué hacemos en WebGL crudo: el fragment shader del ejemplo 5.10.4 y del ejercicio 5.10.2 termina con `'\n// ' + Math.random()`, un comentario que cambia en cada ejecución y obliga a compilar de verdad;
  - el precio (una compilación completa cada vez, nada para producción).
- **Código** (ejemplo 5.10.4, ejercicio 5.10.2 y su solución). Los tres contienen `isnan` en WebGL crudo vía `GLKit.crearPrograma`, que no añade nada. Les he añadido el sufijo `+ '\n// ' + Math.random()` y tres líneas de comentario que remiten a la caja. El comentario va al final, así que no mueve los números de línea de los errores.
- **Por qué hacía falta** (decisión discutible, razonada sin poder medir aquí):
  - En el 5.10.2, el síntoma (mesetas negras por `normalize(vec3(0))` → NaN) llega a la pantalla a través de `max(dot(n, l), 0.0)`. En el M1, con fast math, `max(NaN, 0.0)` da 0 (tabla de 3.7), así que en la versión de la caché las mesetas podrían salir gris oscuro en vez de negras.
  - En los dos, la vista «NaN en magenta» depende de que `isnan` funcione en esa versión, y eso **no está medido**. Lo mide la última fila del laboratorio de A.5.
  - Con el comentario único, la demo se comporta siempre como en la primera compilación, que es la que describe el texto.
- **Comprobado en Chromium 141:** los tres playgrounds se ejecutan sin errores (verificar.mjs con `--soluciones`). La captura del 5.10.4 se ve igual que antes.

### B.5 Títulos de bestiario citados
Script propio (`titulos.mjs` en mi carpeta de trabajo): para cada enlace a `#id` de una caja bestiario con texto entre «», compara la cita con el `data-titulo` del destino.

| Archivo | Caja | Título que ahora se cita |
|---|---|---|
| 2.1 | `m1-fixed-transform` | «Mi elemento «fixed» se mueve con el scroll» |
| 2.4 | `m1-modulo-negativo` | «… undefined al ir hacia atrás» |
| 2.6 | `m1-canvas-crece` | «… hasta llenar (y romper) la página» |
| 2.6 | `m4-drawcall-0ms` | «… (y el frame va a tirones)» |
| 2.7 | `m2-animacion-no-reinicia` | «… al volver a añadir la clase» |
| 5.3 | `m4-ebo-vao-equivocado` | «… (o falla con «Must have element array buffer bound»)» |
| 5.4 | `m4-uniform-silencioso` | «… (ni error, ni aviso)» |

Tras los cambios, el script no encuentra discrepancias en m0–m5. Solo quedan tres enlaces descriptivos sin comillas, que no pretenden citar el título («el bestiario de más arriba», «comportamiento raro de los colores saturados», «de la escala negativa»).

### B.6 Rutas impresas por los scripts de Python (4.3 y 4.6)
`python/gpu_juguete/rutas.py` construye `carpeta_img()` como ruta **absoluta** (`RAIZ_CURSO / "modulos" / "04-gpu" / "img"`, o `CARPETA_IMG`), y los scripts hacen `print("guardado:", ruta)`. Las salidas copiadas en las lecciones decían `guardado: modulos/04-gpu/img/…`.

Las cambié a `guardado: /ruta/de/tu/curso/modulos/04-gpu/img/juguete-triangulo.png` (4.3) y `…/moderngl-triangulo.png` (4.6).

En 4.4, `guardado img/moderngl-quad.png` ya coincide con el `print` literal de `02_buffers_y_vao.py`. No toqué `python/`: la incoherencia es de estilo (unos scripts imprimen la ruta absoluta y otros la relativa `img/…`) y no confunde.

### B.7 4.3 · `recursos/demo-raster.js` (pendiente menor de revision-m4)
Si el alumno arrastra los vértices hasta el sentido horario, la GPU de juguete intercambia B y C (`gpu-juguete.js`, `rasterizar`). Los rótulos `E_BC/E_CA/E_AB` y las λ quedaban con los nombres del orden original.

Ahora, si el evento `triangulo` llega con `frontal === false`, la línea informativa:
- avisa de que la GPU de juguete intercambia B y C, así que el orden es A, C, B;
- muestra `E_CB`, `E_BA` y `E_AC`;
- rotula las λ «(de A, C, B)».

Lo comprobé ejecutando `gpu-juguete.js` en Node con los dos órdenes: con B y C cambiados, `frontal = false`, y el primer fragmento da λ = (0,93; 0,06; 0,01) con color (0,93; 0,01; 0,06). La segunda λ es la del tercer vértice de entrada, C, como dice el rótulo. En sentido antihorario (el estado inicial) no cambia nada.

---

## Problemas en archivos ajenos (no los he tocado)

1. **`assets/js/glkit.js`, `GLKit.crearPrograma`.** No hace lo que `Curso.glCompartido.compilar`: no añade un comentario único a los shaders con `isnan`/`isinf`. En el curso lo resuelvo en cada playground (5.10). Propuesta: dejarlo así, porque GLKit es «la librería que acabamos de escribir» y el alumno debe ver el truco explícito. Como mucho, una línea en su cabecera que remita a 3.7/5.10.
2. **Guía de autores §5.6.** Ya recoge el hecho 1. Propuesta de añadido: «si un playground JS (WebGL crudo) usa `isnan`/`isinf` y su resultado importa para lo que enseña, añade al fuente del fragment shader `+ '\n// ' + Math.random()` y explícalo (ejemplo: 5.10.4)».
3. **Pendiente de medir en el M1 (no es de ningún archivo):** si `isnan()` sigue funcionando en un programa que sale de la caché con fast math. Lo mide la última fila del laboratorio. Si da 0 detecciones en la 2.ª compilación, hay que avisarlo en:
   - el resto del curso que recomiende la receta `any(isnan(v)) ? magenta : color` para WebGL propio: 3.7 `m3-nan-pixel-negro`, 5.10, 6.2 tabla «Depurar con color» y A.2/A.3;
   - y probablemente en un bestiario nuevo: «la vista de NaN no marca nada… la segunda vez».

   Fuera de m0–m5, el único playground JS que usa `isnan` es «Mide lo indefinido en tu GPU» de 6.1 (l.~697), y ya añade una marca distinta en cada ejecución (`EJECUCION`). Ningún playground JS de m7 ni de los anexos usa `isnan`/`isinf` (lo comprobé con un script sobre sus bloques `text/x-js`).
4. **Índices.** He cambiado texto dentro de cajas bestiario (`m3-isnan-heisenbug`, `m3-hash-roto`) y prosa indexable: hay que ejecutar `node herramientas/indexar.mjs` (lo hace el lead).

## Verificación

`verificar.mjs --soluciones --capturas` (Chromium 141 + SwiftShader), en tandas de 3–4, después de la última edición de cada archivo:

VERIFICACION_PENDIENTE

Enlaces: `node herramientas/enlaces.mjs` sobre m0–m5 → 39 archivos, 754 enlaces internos, 0 rotos.
Laboratorio: `pend-m0-m5-tiempos.mjs` en modo rápido con SwiftShader → 17 pruebas sin errores, salida 0.

## Decisiones discutibles

- **No he cambiado ninguna cifra.** Ninguna sale del método que el §4 declara engañoso, y las de método no documentado son coherentes. Prefiero que el laboratorio las confirme a corregirlas sin datos.
- **Comentario único en tres playgrounds de 5.10.** Hace la demo robusta, a cambio de una compilación sin caché por ejecución, que es barata. La alternativa era explicar que la vista de NaN «puede no funcionar la segunda vez», cosa que no está medida.
- **El párrafo de 4.2 cita «entre 3 y 30 veces por debajo»**, cifras del módulo 6 (revision-m6b), no del módulo 4. Lo digo así en el texto («al revisar el módulo 6 encontramos…»).
- **5.10.5 (el laboratorio) sigue usando el temporizador.** Cambiarlo a pasadas aisladas exigiría `readPixels` en el bucle de animación, que es justo lo que la lección enseña a no hacer. He explicado en el texto qué mide y cuánto fiarse.
