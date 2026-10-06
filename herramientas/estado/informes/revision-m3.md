# Informe de revisión del Módulo 3 · Matemáticas para gráficos

Las siete lecciones quedan sin errores de compilación, excepciones, KaTeX roto ni errores de consola. Solo salen enlaces rotos a lecciones que todavía no existen: 6.1, 6.3, 6.4, 6.5, 6.6, 6.8 y 7.7.

Verifiqué en dark y en light las siete lecciones, mirando todas las capturas. También pulsé «Ver solución» en los 26 editores con solución y comprobé que hacen lo pedido, no solo que compilan. Para eso escribí `qa/soluciones.mjs` y `qa/glsl-lab.mjs` en el scratchpad. Las afirmaciones «medido en el M1» las contrasté con experimentos en Chrome 154 sobre Metal, y las citas de la especificación GLSL ES 3.00 con el PDF real.

Sobre lo que dijiste del servidor en `127.0.0.1:8765`: no arranqué ninguno. Todo fue con `file://` y con un límite de tiempo por comando. El proceso 32429 no es mío y no lo toqué.

Los cambios están en `/Users/alex/Projects/shaders/modulos/03-matematicas/`, en las siete lecciones y en `recursos/demos-01.js`, `demos-06.js` y `demos-07.js`.

## 3.1 Vectores
- **Ejemplo 3.1.1:** decía «a la derecha rojo intenso, arriba verde». El shader da un rosa salmón (1, 0.5, 0.6) y un verde claro (0.5, 1, 0.6). Lo corregí.
- **Mini librería:** la razón del umbral `1e-12` era incorrecta (hablaba de desbordar). Ahora explica el residuo de redondeo, por ejemplo `(3e-17, −1e-17)`.
- **Ejercicio 3.1.2:** ahora dice «mueve el ratón», porque al principio el ratón y su reflejo coinciden en el centro.
- **Ejercicio 3.1.4:** la solución decía que «en el frame siguiente la cadena ya está estirada». La simulé: con `dt = 0` la cadena empieza plegada y tarda uno o dos segundos en estirarse. Lo reescribí.
- **`demos-01.js`:** el cuadrado del mando no se veía en tema claro. Cambié el color y moví la etiqueta que se solapaba.

## 3.2 Producto punto y cruz
- **Diagrama de Lambert:** los rayos del haz inclinado divergían. Los puse paralelos, así el ancho `w/cosθ` del dibujo es el de la fórmula.
- **Bestiario `m3-acos-nan`:** «normalizar (7,7) da 1.0000000000000002» solo vale dividiendo por `Math.hypot`. Con la `normalizar` de 3.1 (multiplica por `1/l`) da 0.9999999999999998. Lo aclaré.
- **Ejemplo del guardia:** el código tenía `alcance = 6` y la demo usa 5. Ahora ambos usan 5.
- **Funciones de arista:** «líneas a menos de 2 píxeles» era «menos de 1 píxel» (una línea de unos 2 px de ancho). Corregido.
- **Caja senior de lateralidad:** aclaré el tratamiento de las normales al reflejar un eje.

## 3.3 Trigonometría
- **Referencia a la especificación (§4.5.1):** ahora cita la frase literal, que verifiqué en el PDF.
- **Graficador de combinaciones:** el texto habla de `sin(20x)·sin(x)` y el graficador usaba `sin(x·0.5)`. Lo igualé.
- **Radar 3.3.3:** el anillo de `r = 1` se dibujaba fuera del círculo del radar. Lo limité a `r < 0.9` en el código de partida y en la solución.

## 3.4 Funciones de forma
- **Tabla de `round`:** el «−0» de `roundEven(−0.5)` no es lo que da el M1 (da +0). Lo puse como «±0» con una nota, y reordené ese párrafo.
- **Hermite y 2.4:** decía que 2.4 trata los polinomios de Hermite y no es así. Ahora dice que 2.4 muestra smoothstep como curva de easing.
- **Spinner 3.4.4:** decía que para girar en sentido horario bastaba con restar el tiempo. Eso deja la estela delante de la cabeza. Ahora indica también el orden de la resta.
- **Ejemplo 3.4.2:** el mensaje de consola decía «fuera del lienzo» con la partícula aún medio visible. Subí el umbral a −20.

## 3.5 Matrices
- **`ctx.getTransform()`:** decía «a = 0, d = 0» y salen `6.1e-17`, porque `cos(π/2)` no es exactamente 0. Lo corregí y lo aproveché como explicación.
- **Rotaciones 3D (sección nueva):** ninguna lección derivaba Rx, Ry, Rz y `mat4.rotacionY` se usaba en 3.6 y en 5.6 sin explicación.
  - **Contenido:** una tabla con las tres matrices, la razón del `−sin` «cambiado de sitio» en Ry, la no conmutatividad, los ángulos de Euler y el gimbal lock.
  - **Comprobación:** un playground que lo demuestra en vivo y que verifiqué contra `glkit.js`.
  - **Resumen:** añadí una viñeta.

## 3.6 Espacios de coordenadas
- **Resumen de la cabecera:** decía que el vértice (1,1,1) acaba en el píxel (523, 211). El ejemplo 3.6.1 da (769, 468) con profundidad 0.986. Lo corregí.
- **Tabla del z-buffer:** «la precisión crece con el cuadrado de la distancia» estaba al revés. La resolución empeora con `d²`.
- **`demos-06.js`:** los deslizadores near y far podían cruzarse y dejar far por delante de near. Añadí una guarda.

## 3.7 Precisión
- **ULP del tiempo:** a los 3 días (259 200 s) es 0.0156, no 0.031. Lo corregí en el texto y en el bestiario. Los 12 días reales para 0.125 son «12 días y medio».
- **Hash clásico:** «947 / 351 / 121 / 33 valores distintos» mezclaba dos convenciones de desplazamiento. Con la del editor da 955 / 351 / 65 / 17. Además, la densidad con `mod 512` es 0.9 %, no 0.8 %.
- **Cancelación catastrófica:** «0.656 y 1.99» ahora son 0.64 y 1.73, y el texto avisa de que dependen de la GPU.
- **Subnormales:** `1e-30 * 1e-10` da 0 solo si los operandos llegan como uniform. Con constantes, el compilador lo pliega al compilar y conserva el subnormal. Lo aclaré.
- **Índices en texturas de 8192×4096:** «la mitad de los índices no son exactos» era «los impares de la segunda mitad».
- **Ejercicio 3.7.3:** el enunciado pide dos arreglos, (a) y (b), y la solución solo traía (b). Ahora trae los dos con un interruptor `USAR_PCG`, y ambos compilan.
- **`demos-07.js`:** los ejes salían como «1.000.000,5» junto a «0.0625» en la misma pantalla. Pasé a un espacio duro para los miles y punto para los decimales, como en el texto.

Comprobé que la afirmación del autor sobre `isnan` es cierta: con `isnan` usado en el shader, `n != n` pasa a true, `n*0`, `n−n` y `0/0` dan NaN, y `pow(x, 2.0)` con x negativo pasa de x² a NaN. En cambio, el mecanismo (ANGLE quitando fast math) sigue siendo una deducción.

## Pendiente (no lo toqué)
1. **`assets/js/datos-bestiario.js` y el índice de búsqueda:** hay que regenerarlos con `herramientas/indexar.mjs`. Editué el texto de dos cajas de bestiario, `m3-acos-nan` y `m3-tiempo-horas`, y el archivo generado tiene copia del texto anterior.
2. **`graficador.js`, rayas verticales junto a un NaN:** se ven en 3.4 (`step`, `floor`/`fract`) y en 3.7 (cancelación, en x = 0). Propuesta: comprobar también los vecinos `yl` e `yr` en `curva()`, como propuso el autor.
3. **Sugerencia n.º 3 del autor ya resuelta:** `playground-glsl.js` ya muestra los avisos del compilador («compilado (con avisos)»). El texto de 3.4 sobre `smoothstep` invertido es coherente con eso.
4. **Sin comprobar:** la regla top-left (3.2), el comportamiento de fp16 en un teléfono real, y los NDC de Vulkan y WebGPU, que se apoyan en documentación.
5. **Ampliaciones opcionales:** 3.2 no cubre `refract` ni `faceforward`.
