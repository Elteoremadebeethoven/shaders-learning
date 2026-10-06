Módulo 5 (WebGL2 desde cero) terminado: las 10 lecciones pasan `verificar.mjs` con `--soluciones`, y las 62 soluciones de ejercicios se ejecutan sin error. Lo único que queda marcado son enlaces al módulo 7, que aún no existe, y dos avisos de WebGL intencionados (sección 4).

## 1. Archivos creados
Todos en `/Users/alex/Projects/shaders/modulos/05-webgl/`: `01-contexto.html`, `02-primer-triangulo.html`, `03-buffers-atributos.html`, `04-uniforms-animacion.html`, `05-texturas.html`, `06-3d-cubo.html`, `07-blending.html`, `08-framebuffers.html`, `09-instancing.html`, `10-depuracion.html`.

Los experimentos (e01–e57 y los scripts `exp.mjs`, `sol.mjs`, `captura.mjs`) están en `scratchpad/experimentos/m5/`, y las capturas en `scratchpad/capturas/m5`, `m5-paginas`, `m5-sol` y `m5-claro`.

## 2. Por lección
Conteo: ejemplos / ejercicios / quizzes / bestiario.
- **5.1 Contexto (6/6/5/8):** atributos del contexto, tamaño del búfer y DPR, viewport y scissor. También la presentación y captura del canvas, la pérdida de contexto, el límite de contextos (demo con Worker) y `getError`.
- **5.2 Primer triángulo (5/11/3/5):** shaders, programa, buffer y VAO llamada por llamada, y los logs de compilación. El alumno escribe `crearShader`/`crearPrograma` y GLKit se presenta como «la librería que acabamos de escribir». Incluye el inspector de estado.
- **5.3 Buffers y atributos (7/6/3/4):** stride y offset, normalización, índices, primitive restart, el EBO como estado del VAO, `vertexAttribIPointer`.
- **5.4 Uniforms y animación (5/6/3/3):** la familia `uniform*`, uniforms como estado del programa, el bucle con dt y el tiempo en float32. Pausa fuera de pantalla con IntersectionObserver.
- **5.5 Texturas (5/6/3/7):** carga, volteo, `UNPACK_ALIGNMENT`, filtrado y mipmaps, wrap, unidades, texturas float, SecurityError con `file://`.
- **5.6 3D y cubo (3/6/3/5):** malla de 24 vértices, matrices MVP, profundidad, culling y winding, Lambert, matriz normal, cámara orbital.
- **5.7 Blending (4/5/2/4):** ecuación de mezcla, alfa premultiplicado, composición del canvas con la página, orden de dibujo, destinos float.
- **5.8 Framebuffers (5/5/3/4):** FBO a mano (textura y renderbuffer) con la tabla de códigos de completitud, viewport, bucle de realimentación y ping-pong (juego de la vida, estelas). Post-proceso con Sobel y otros efectos, picking con `readPixels`, lectura asíncrona con `PIXEL_PACK_BUFFER` + `fenceSync`, MRT y blit con MSAA.
- **5.9 Instancing (5/6/3/5):** divisor (tabla medida), `gl_InstanceID`, formato de los datos por instancia, `bufferSubData` cada frame (hasta 100 000 flechas con fps). Comparativa de N llamadas frente a una, 10 000 cubos con una `mat4` por instancia (4 locations), avance de transform feedback.
- **5.10 Depuración y rendimiento (5/5/3/5):** lista de comprobación para la pantalla negra, `diagnosticar(gl)`, envoltorio de depuración con `Proxy`, tabla de logs de ANGLE, `WEBGL_debug_shaders` (traducción a MSL). Falso color y NaN con lectura exacta en float, laboratorio CPU/GPU, causas típicas medidas, timer query con sus límites, fugas de memoria.

## 3. `data-id` de bestiario (50, todos únicos y con prefijo `m5-`)
- **5.1:** m5-atributos-ignorados, m5-getcontext-null, m5-captura-vacia, m5-canvas-borroso, m5-viewport-olvidado, m5-contexto-perdido, m5-demasiados-contextos, m5-geterror-pegajoso
- **5.2:** m5-version-primera-linea, m5-error-linea-siguiente, m5-bufferdata-array-normal, m5-atributo-menos-uno, m5-pantalla-negra-sin-error
- **5.3:** m5-color-sin-normalizar, m5-indice-65535, m5-ebo-desenlazado, m5-linewidth
- **5.4:** m5-uniform-null, m5-uniform-otro-programa, m5-tiempo-float32
- **5.5:** m5-textura-volteada, m5-unpack-alignment, m5-textura-negra, m5-muare, m5-borde-repeat, m5-sampler-unidad, m5-imagen-securityerror
- **5.6:** m5-cubo-del-reves, m5-profundidad-sin-borrar, m5-cara-invisible, m5-matriz-normal, m5-camara-polo
- **5.7:** m5-canvas-translucido, m5-halo-oscuro, m5-canvas-premultiplicado, m5-transparencia-orden
- **5.8:** m5-fbo-incompleto, m5-viewport-fbo, m5-bucle-realimentacion, m5-fbo-tamano
- **5.9:** m5-divisor-olvidado, m5-buffersubdata-elementos, m5-instancias-buffer-corto, m5-location-solapada, m5-mat4-columnas
- **5.10:** m5-demasiados-errores, m5-nan-negro, m5-finish-no-espera, m5-objeto-borrado, m5-memoria-sin-liberar

## 4. Verificación (pasada final, `--soluciones`)
```
✗ 01  js=15 ejemplos=6 ejercicios=6 quiz=5 bestiario=8 soluciones=6 · enlace roto: ../07-integracion/01-arquitectura.html
✗ 02  js=17 ejemplos=5 ejercicios=11 quiz=3 bestiario=5 soluciones=11 · consola warn ×3: WebGL: INVALID_OPERATION: drawArrays: no valid shader program in use · enlace roto: ../07-integracion/05-particulas-gpu.html
✓ 03  js=12 ejemplos=7 ejercicios=6 quiz=3 bestiario=4 soluciones=6
✓ 04  js=11 ejemplos=5 ejercicios=6 quiz=3 bestiario=3 soluciones=6
✓ 05  js=11 ejemplos=5 ejercicios=6 quiz=3 bestiario=7 soluciones=6
✓ 06  js=9  ejemplos=3 ejercicios=6 quiz=3 bestiario=5 soluciones=6
✓ 07  js=9  ejemplos=4 ejercicios=5 quiz=2 bestiario=4 soluciones=5
✗ 08  js=10 ejemplos=5 ejercicios=5 quiz=3 bestiario=4 soluciones=5 · enlace roto: 7.5
✗ 09  js=11 ejemplos=5 ejercicios=6 quiz=3 bestiario=5 soluciones=6 · consola warn ×3: WebGL: INVALID_VALUE: bufferSubData: buffer overflow · enlace roto: 7.5
✓ 10  js=10 ejemplos=5 ejercicios=5 quiz=3 bestiario=5 soluciones=5
```
- **Avisos intencionados:** los de 5.2 y 5.9 son el síntoma que enseñan dos ejercicios «arréglalo» (olvidar `useProgram`; buffer de instancias demasiado pequeño en el 5.9.5). No lanzan excepción, así que no se pueden marcar con `data-error-esperado`.
- **Capturas revisadas con Read:** todas las de 5.8–5.10 en tema oscuro, y las de 5.8–5.10 también en tema claro.

## 5. Problemas conocidos y lo que no pude comprobar
- **Enlaces a módulos futuros:** apuntan al módulo 7, que aún no existe (7.1 desde 5.1; 7.5 desde 5.2, 5.8 y 5.9).
- **Una sola máquina:** todas las cifras y comportamientos se midieron en Apple M1 con Chrome 154 (ANGLE sobre Metal), y el texto lo indica. En concreto:
  - las capas opacas superpuestas salen casi gratis en esta GPU (se rompe con mezcla o con `discard`);
  - `gl.finish()` no espera a la GPU (0,00 ms);
  - el timer query no aísla dibujos y varía entre 3 y 10 ms con el mismo trabajo;
  - `mediump` se traduce a 32 bits;
  - la consola se calla tras 256 avisos.

  No lo pude contrastar en Firefox, Safari, Windows/D3D ni en móviles.
- **Afirmaciones sin experimento:**
  - el consejo de dibujar opacos de delante a atrás en GPUs sin eliminación de superficies ocultas (está redactado con esa salvedad);
  - la retirada del timer query en 2018 (dato histórico);
  - Spector.js, descrito a partir de su README sin instalarlo.
- **Una medida hecha dentro de un playground:** la del ejercicio 5.10.5 (2,6 → 1,9 ms), con iframes en el mismo proceso bajo Puppeteer. Las demás cifras vienen de páginas de experimento de nivel superior.

## 6. Sugerencias para componentes compartidos (no modificados)
- **verificar.mjs:**
  - Los avisos «WebGL: …» de Blink que salen de iframes de playground llegan sin ubicación `about:srcdoc` y se cuelan en el informe de la página; los de ANGLE sí se filtran. Propongo filtrarlos también o admitir algo como `data-aviso-esperado`.
  - En pasadas con capturas, la excepción de un playground con `data-error-esperado` (el 5.8.1) apareció a veces como excepción de página.
- **GLKit:**
  - `revisarError` usa `console.error`; mejor `console.warn` o devolver el resultado.
  - `atributo` no admite divisor ni atributos enteros.
  - `crearTextura`: `flipY` no hace nada con ImageBitmap, y falta una opción para `UNPACK_ALIGNMENT`.
  - Un `borrarFBO` evitaría repetir `deleteFramebuffer`/`deleteTexture`/`deleteRenderbuffer` en cada lección.
  - `ajustarTamaño` en el arranque puede dar un búfer de 1×1 si el iframe aún no tiene layout. Crear recursos con ese tamaño es frágil: hizo fallar el juego de la vida en una pasada, ya corregido creando la rejilla en el bucle.
- **CSS:**
  - `.pg-lienzo` tiene un error de altura cuando `data-altura` es menor que 300.
  - Las notas de `.anotado` (máximo 640 px) no parten el código en línea y las firmas largas se desbordan; lo mismo pasa con código largo dentro de tablas.
  - Los botones nativos dentro de los resultados oscuros se ven con el estilo del navegador.

## 7. Glosario
- **Búfer de dibujo:** la imagen del canvas en la que escribe WebGL; su tamaño es el del canvas en píxeles de dispositivo.
- **DPR (devicePixelRatio):** píxeles físicos por píxel CSS.
- **ANGLE:** capa de Chrome que valida el GLSL y lo traduce a Metal, D3D o Vulkan.
- **VAO:** objeto que guarda la configuración de atributos, divisores y el EBO.
- **Stride:** bytes entre el inicio de un vértice y el siguiente.
- **Atributo normalizado:** entero que el shader recibe convertido a 0…1 o −1…1.
- **Primitive restart:** índice especial que corta una tira de primitivas.
- **Location:** número que identifica un atributo o un uniform en un programa.
- **Uniform:** valor constante durante un dibujo, guardado en el programa.
- **Mipmap:** versiones reducidas de una textura para muestrearla de lejos.
- **Textura completa:** textura muestreable según su filtro y sus niveles; si no lo es, se lee negra.
- **Matriz normal:** inversa traspuesta del modelo, para transformar normales.
- **Winding:** sentido de giro de los vértices en pantalla; decide la cara delantera.
- **Face culling:** descarte de las caras traseras.
- **Z-fighting:** parpadeo entre superficies de profundidad casi igual.
- **polygonOffset:** desplazamiento de profundidad que evita el z-fighting de las calcomanías.
- **Alfa premultiplicado:** RGB ya multiplicado por alfa.
- **FBO:** destino de dibujo alternativo al canvas.
- **Adjunto:** textura o renderbuffer conectado a un FBO.
- **Renderbuffer:** memoria solo de escritura para dibujar (profundidad, MSAA).
- **Bucle de realimentación:** leer y escribir la misma textura en un dibujo; WebGL lo prohíbe.
- **Ping-pong:** alternar dos texturas o buffers, leyendo de una y escribiendo en la otra.
- **Post-proceso:** efecto a pantalla completa sobre la escena renderizada en una textura.
- **MRT:** varias salidas del fragment shader a la vez.
- **Blit:** copia entre framebuffers (resuelve el MSAA).
- **Picking:** saber qué objeto hay en un píxel dibujando identificadores.
- **PBO:** buffer destino de `readPixels` para leer sin esperar.
- **Instancing:** dibujar N copias de una malla en una llamada.
- **Divisor:** cada cuántas instancias avanza un atributo.
- **gl_InstanceID:** número de la instancia en el vertex shader.
- **Swap and pop:** quitar un elemento copiando el último en su hueco.
- **Transform feedback:** capturar las salidas del vertex shader en un buffer.
- **Envoltorio de depuración:** Proxy que llama a `getError` tras cada llamada.
- **Falso color:** pintar valores intermedios como color para verlos.
- **NaN:** resultado inválido; en un canvas de 8 bits se ve negro.
- **Overdraw:** pintar varias veces el mismo píxel.
- **GPU por teselas / HSR:** arquitectura que solo sombrea el fragmento opaco visible.
- **Timer query:** medida del tiempo de GPU con `EXT_disjoint_timer_query_webgl2`.

## Decisiones discutibles
- Mantuve los dos avisos intencionados de 5.2 y 5.9 porque son el síntoma que se enseña.
- En 5.1, el límite de contextos se demuestra en un Worker, y del hilo principal se muestran registros reales en vez de agotarlo en vivo.
- En la pasada final añadí las cajas hack que faltaban en 5.4 (`gl.getUniform`, medido a unos 40 µs por llamada) y en 5.6 (`polygonOffset`, comprobado: la calcomanía pasa de 8507 a 10 045 de sus 10 045 píxeles).
- En 5.8, el juego de la vida vuelve a sembrarse al redimensionar.
- El scratchpad contiene un PNG binario de pruebas, fuera del proyecto.
