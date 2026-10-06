# Informe de revisión · Módulo 2 · Animación con CSS y JavaScript

Todo está en `/Users/alex/Projects/shaders/modulos/02-animacion/` (solo editadas las 8 lecciones `.html`; `recursos/m2.css` y `m2.js` intactos). No levanté ningún servidor: todo con `file://`, Chrome headless y límite de tiempo en cada comando.

## Verificación final
- **`verificar.mjs`** en oscuro y en claro, las 8 lecciones, capturas revisadas con Read. Sin errores de JS, KaTeX ni consola.
- **Enlaces:** los únicos rotos son a lecciones aún no escritas (6.4, 6.8, 7.2, 7.3, 7.5). 5.9 y 6.6 ya existen. Los 180 enlaces internos con `#ancla` de las lecciones del módulo apuntan a ids que existen.
- **Soluciones:** las 33 soluciones de ejercicio se ejecutan sin errores. Las dos que toqué (2.7.1 y 2.7.4) las probé además con clics simulados.
- **Anotados:** audité línea a línea todos los bloques de código anotado. Había cinco desalineados, ya corregidos.

## Cambios por lección
**Todas.** En los 26 quizzes la respuesta correcta estaba siempre en la 2.ª de 3 opciones. Reordené las opciones para repartirlas entre 1.ª, 2.ª y 3.ª, sin tocar los textos.

**2.1**
- Las notas del anotado del ejemplo 2.1.2 iban desplazadas una línea desde la 10 (la nota del `textContent` señalaba el `addEventListener`). Las realineé y añadí notas para las líneas 10 y 15.

**2.2**
- **Ejercicio 2.2.2 (máquina de escribir):** la solución nunca mostraba la última letra. Medí que `steps(19)` en bucle infinito llega como máximo a 18ch (303 px de 320). Los keyframes ahora escriben durante el 0–80 % y descansan con el texto entero; reescribí la explicación.
- **Ejercicio 2.2.4:** el enunciado decía que el borde «salta a mitad de vuelta», pero 0° y 360° se ven igual y no hay salto visible. Corregido en enunciado y solución.
- **Callout de interrupciones:** «parte con velocidad cero» era falso. Ahora dice que parte con la velocidad inicial de su propia curva.
- Realineé las notas del anotado de `cubicBezier` y de `@keyframes` (partí una línea larga que se cortaba).

**2.3**
- **Quiz:** «Unos 65 fps» era un error de cálculo; la media de los FPS da 71. Corregido con el cálculo en la explicación.
- **Ejercicio 2.3.4:** «los FPS bajan en menos de medio segundo» era falso. Con α = 0,05 bajan a ~37 fps tras 0,7 s y a ~31 al final de los 2 s. Lo calculé y corregí.
- Realineé las notas del anotado del paso fijo.
- Aclaré que «6 frames iguales» asume una pantalla de 60 Hz (12 a 120 Hz).

**2.4**
- **Tabla de suavizado:** la columna con `exp` no decía qué λ usaba; puse λ = 6 s⁻¹, que da el 95,0 %.
- **Ángulos:** faltaba el código de `lerpAngulo`, y había un párrafo con dos puntos sin nada detrás. Añadí `envolver` y `lerpAngulo`.
- **Graficador de smoothstep:** decía «curvas finas»; son f3 y f4. Añadí el valor máximo (1,875 frente a 1,5).
- **Gráfica de easings:** añadí una nota de que las curvas «se doblan» fuera de [0, 1].
- **Nota de color:** expliqué la diferencia de ±1 entre el teórico (127,5 / 187,5) y el muestreado (127 / 187).

**2.5**
- **Texto del graficador:** describía «curva verde» y «rosas»; son f2 cian y f3/f4 rosa y amarilla.
- **Ejercicio 2.5.2:** dos cosas.
  - Afirmaba que `h = 0/0` «contaminaría x», pero con `n = 0` el bucle no se ejecuta y la `NaN` no se usa; reescribí la frase.
  - Hacer clic sobre la caja medía `offsetX` respecto a la caja y la mandaba al borde izquierdo. Puse `pointer-events: none` en la caja.
- **Ejercicio 2.5.4:** «el producto siempre decae» no es cierto para un solo paso; lo cambié por una frase precisa.
- Todos los números de la lección los recalculé y coinciden. Incluye la tabla de estabilidad con amortiguamiento y los 4181 del muelle inestable.

**2.6**
- El texto decía «Fíjate en la línea 17» y era la 19. Además, el código dejaba el búfer a 0×0 y la escala en `0/0` en el primer frame: los rAF corren antes que `ResizeObserver` (lo comprobé). Añadí una guarda y ajusté las referencias a las líneas 17 y 20.
- El `<select>` del ejercicio 2.6.3 salía blanco sobre fondo oscuro; le puse estilo.

**2.7**
- **Diferencia real con CSS:** el `easing` de las opciones de `animate()` se aplica a **toda** la iteración, no a cada tramo entre fotogramas como en CSS. La explicación del ejercicio 2.7.1 decía lo contrario.
  - Lo medí con 4 fotogramas: el máximo llega a los 135 ms en CSS y hacia los 80 ms con easing en las opciones.
  - Añadí un párrafo explicativo, puse el easing en cada fotograma en la solución, corregí la pista y matizé el quiz.
- **Ejercicio 2.7.4:** con dos clics en menos de 200 ms, `flip()` cancelaba el desvanecimiento de la segunda tarjeta. Esta reaparecía atascada y sin poder pulsarse (lo reproduje: 14 de 15 tarjetas). La solución ahora excluye del FLIP a las tarjetas que se están desvaneciendo (13 de 15 tras el arreglo), con explicación.
- Realineé las notas del anotado de `animate()`.
- Quité «como hace el verificador de este curso»: el verificador no pausa animaciones.

**2.8**
- Realineé las notas del anotado del pool (la del `for` sin incremento y la de `continue` apuntaban a la línea equivocada).
- En la etapa 5, el deslizador de emisión tapaba el emisor; lo moví arriba.
- Probé la demo final con clic, modo píxeles y emisión máxima (140 000 partículas a 60 fps): sin errores.

## Pendiente, no corregido
- **`Curso.plano` sí soporta `alSoltar`** (`widgets.js`, línea ~272). La sugerencia del autor de añadirlo es innecesaria. El editor de cubic-bezier de 2.2 podría usarlo en vez de escuchar `pointerup` en el canvas; es cosmético.
- **Desborde horizontal en móvil (390 px)** en todos los módulos, también en el 1 y el 3: los `<code>` en línea largos no se parten y la página se ensancha. Es problema de `curso.css`.
- **Índices generados:** `assets/js/indice-busqueda.js` queda desactualizado por mis cambios de texto. Hay que regenerarlo con `herramientas/indexar.mjs`. No toqué ninguna caja `bestiario`, así que `datos-bestiario.js` sigue válido.
- **Ejercicio 2.5, flick:** las afirmaciones sobre `pointerup` y `pointermove` se comprobaron con eventos sintéticos. Con un dedo real la posición del `pointerup` puede diferir ligeramente de la del último `pointermove`. El texto ya dice «(o casi)».
- **Cifras medidas en una sola máquina** (M1, Chrome 154, 60 Hz). No las he podido contrastar en otra.
- **Demo de zoom en 2.4:** la etiqueta de la izquierda se solapa con el cuadrado grande. Es cosmético.
- **Ejemplos de 2.2:** usan `@starting-style`, `interpolate-size` y `calc-size`, que dependen del navegador. El texto ya avisa de ello.
