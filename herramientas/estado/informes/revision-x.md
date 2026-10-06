**Módulo 5 revisado: las 10 lecciones pasan `verificar.mjs --soluciones` en tema oscuro y claro.** Lo único que queda marcado son los enlaces al módulo 7, que aún no existe (7.1 desde 5.1; 7.5 desde 5.2, 5.8 y 5.9). Los avisos de WebGL de los ejercicios 5.2.8 y 5.9.5 (síntoma intencionado) salen de forma intermitente. Antes de tocar nada verifiqué con experimentos en Chrome headless las afirmaciones técnicas dudosas. Salvo las que se corrigen abajo, salieron ciertas.

**Revisión hecha**
- Vi todas las capturas en oscuro y en claro.
- Ejecuté las 62 soluciones y miré su resultado.
- Probé con clics simulados el picking de 5.8.4 (DPR 1 y 2).
- Comprobé anclas, ids duplicados, referencias entre ejercicios y desbordes del texto de los SVG.

El servidor `http.server` del puerto 8765 (más de 3 horas activo) no es de esta tarea y no lo toqué. Trabajé siempre con `file://`.

## Cambios por lección

**5.1 Contexto** (`/Users/alex/Projects/shaders/modulos/05-webgl/01-contexto.html`)
- Ejemplo 5.1.1: en el iframe sandbox del playground, `getContextAttributes().powerPreference` devuelve `low-power` incluso con `"default"` y `"high-performance"`. En página normal devuelve lo pedido; lo comprobé con dos experimentos. El texto solo mencionaba `desynchronized`, y ahora explica también esta diferencia.
- Ejercicio 5.1.4: el enunciado decía «el mismo patrón» pero solo dibuja líneas verticales; corregido.
- Cierre de la lección: «diez maneras» pasa a «once», que es lo que hay en 5.2.

**5.2 Primer triángulo** (`02-primer-triangulo.html`)
- El ejercicio 5.2.8 tenía «Pista 1» con una sola pista; ahora es «Pista».
- Comprobé por experimento todos los mensajes de compilación y enlace, la restricción de `ELEMENT_ARRAY_BUFFER`, el `bufferData` con `Array` y las locations. Todo cierto.

**5.3 Buffers** (`03-buffers-atributos.html`)
- Ejercicio 5.3.5: decía que subir un `Uint32Array` con `UNSIGNED_SHORT` daba error por salirse del buffer. Es falso: no hay error, el canvas sale vacío. Corregido.
- SVG del layout entrelazado: el texto «stride = 5 floats…» salía cortado por la izquierda; corregido.
- Añadí una nota de que el `atributo` real de `glkit.js` tiene dos parámetros extra (`divisor` y `entero`), que la lección no explica hasta 5.9.
- «Se lee cuatro veces más rápido» pasa a «cuatro veces menos ancho de banda».
- El enlace a la especificación apuntaba a `#5.18`, que no pude verificar. Ahora apunta a la especificación con el nombre de la sección.

**5.4 Uniforms** (`04-uniforms-animacion.html`)
- Error de un mensaje de consola: el texto y el quiz citaban «Uniform type does not match…» para `uniform1f` sobre un `int`. Medido: el mensaje real es «Uniform size does not match uniform method» (y «type» solo para `uniform1i` sobre `uint`). Corregido.
- `smoothstep(350.0, 0.0, d)` tiene los bordes invertidos, que en GLSL es comportamiento indefinido. Cambiado a `1.0 - smoothstep(0.0, 350.0, d)`, con el mismo resultado.
- «Es el error del ejercicio 5.4.4» debía ser 5.4.2 (el de los milisegundos).
- `Date.now()` «se desvía unos 25 s» pasa a «hasta 64 s», porque el valor depende del momento en que se mide.
- Frase confusa en un quiz («Solo se para solo…») reescrita.

**5.5 Texturas** (`05-texturas.html`)
- El extracto de `GLKit.crearTextura` estaba desactualizado: el `glkit.js` actual ya tiene la opción `alineacion`, y el texto decía que no tocaba `UNPACK_ALIGNMENT`. Actualizado.
- Solución del 5.5.4: su log final imprimía `UNPACK_ALIGNMENT = 4`, igual que la versión rota. Ahora muestra el valor durante la subida y otro log tras restaurarlo.

**5.6 Cubo** y **5.7 Blending** (`06-3d-cubo.html`, `07-blending.html`)
- Sin cambios necesarios.
- En 5.6 comprobé a mano que en `crearCubo` todas las caras cumplen `u × v = n`, y que en el ejercicio 5.6.3 solo falla la cara +x.

**5.8 Framebuffers** (`08-framebuffers.html`)
- `smoothstep(0.85, 0.3, …)` invertido en el efecto de viñeta; corregido.
- «Es el ejercicio siguiente» debía ser 5.8.5 (el desenfoque separable).
- Añadí una mención a `GLKit.borrarFBO`, que ya existe en el `glkit.js` actual.
- SVG: la etiqueta «framebufferRenderbuffer» se salía del viewBox por la derecha; corregida.

**5.9 Instancing** (`09-instancing.html`)
- «Solo se mueve una de cada cinco» (en el ejercicio 5.9.4 y en el bestiario) era inexacto: se mueve la primera quinta parte. Corregido.

**5.10 Depuración** (`10-depuracion.html`)
- **Error de fondo con la sección de NaN:** la lista de NaN se midió con `isnan()` dentro del shader, y en ANGLE/Metal eso desactiva el fast math de todo el shader.
  - Sin `isnan`, con un cero que llega por un uniform, `0.0/0.0` da **1** y `atan(0.0, 0.0)` da NaN. El resto de casos no cambia.
  - Añadí un recuadro «Medir NaN con isnan() cambia el resultado» y una referencia desde el bestiario `m5-nan-negro`.
- La explicación de `QUERY_RESULT` decía «entre 10^6, milisegundos»; ahora dice «dividido entre 10^6».
- Los mensajes de la tabla de logs del compilador están verificados.

## Pendiente (no lo toqué)

- **Enlaces al módulo 7:** se resolverán cuando exista.
- **Datos sin contrastar por el autor y por mí:** la retirada del timer query en 2018 (5.10) y el detalle de Spector.js.
- **Componentes compartidos (sugerencias):**
  - En los playgrounds, el visor de consola muestra la cola de la excepción. En 5.2.1 y 5.2.2 el código numerado se ve, pero la línea `ERROR: 0:6: …` queda fuera del scroll. Sería mejor mostrar el inicio del error.
  - `verificar.mjs --soluciones` usa un clic DOM. Con un clic real de puppeteer, el botón «Ver solución» quedaba a veces tapado por la barra superior fija (me pasó en `pick2.mjs`).
  - Sigue pendiente lo que ya informó el autor: los avisos «WebGL: …» de iframes sin `about:srcdoc` salen en el informe de página.

Archivos en `/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/`: experimentos en `experimentos/rev-m5/` (`e01`–`e09`, `correr.mjs`, `sols.mjs`, `pick2.mjs`) y capturas en `capturas/rev-m5*/`.
