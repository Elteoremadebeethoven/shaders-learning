# Informe · Lección 7.3 · Transiciones animadas con shaders

## 1. Archivos creados

- `modulos/07-integracion/03-transiciones-shader.html` (lección, `data-leccion="07-integracion/transiciones-shader"`).
- `modulos/07-integracion/recursos/l73-kit.js` (helpers propios de la lección; se inyecta en los playgrounds con `data-incluir="…,l73"` y la página lo carga después de `m7kit.js`):
  - `L73.imagen('noche'|'mar'|'bosque', ancho, alto)`: tres «fotos» generadas con Canvas 2D (valen como textura en `file://`).
  - `L73.GLSL.VS | CUBRIR | RUIDO | COLOR`: trozos de GLSL para interpolar (triángulo de pantalla completa, `object-fit: cover`, hash12 de Hoskins + value noise + fbm de 4 octavas, sRGB ↔ lineal).
  - `L73.texturas(gl, u, lista)`: enlaza texturas a unidades y asigna samplers.
  - `L73.Transicion`: tween interrumpible (tramo nuevo desde el valor actual, duración proporcional, final exacto).
  - `L73.Linea`: línea de tiempo con cabezal, posición al estilo GSAP (`'<'`, `'+=x'`, `'-=x'`) y evaluación sin estado.

No he modificado ningún archivo compartido, ni 7.1/7.2/m7kit/m7.css.

## 2. Contenido y conteos

Qué cubre: el contrato de una transición (T(uv,0)=A, T(uv,1)=B) y el arnés `desde()/hacia()/transicion()` (el de gl-transitions); mover `u_progreso` con tween (dt del reloj de 7.1, final exacto) y con muelle (`M7.Muelle`, `parametrosMuelle`, `fijar` en reposo), qué hacer cuando el muelle se pasa de 1, y easing en JS frente a easing por píxel en el shader (fórmula de escalonado); catálogo de transiciones: fundido sRGB/luz/por negro, cortinilla direccional con borde suave y recorrido ampliado, revelado radial hasta la esquina más lejana (desde el puntero), disolución con ruido estirado a sus percentiles y borde de fuego, desplazamiento estilo gl-transitions, persianas escalonadas; interrupciones (tween recalculado con duración proporcional, muelle, instantánea en FBO con ping-pong de dos FBOs para no crear bucle de realimentación, transición entre escenas vivas); hover con muelle (cantidad), puntero suavizado (centro) y velocidad del muelle (efectos solo en movimiento); overlay de transición de página como máquina de estados (cubrir/cubierta/descubrir/quieta, clics bloqueados, foco y aria-live, movimiento reducido, alfa premultiplicado, el shader no puede leer el DOM, View Transitions API); línea de tiempo en JS con cabezal (reproducir, invertir, arrastrar; gobierna uniforms y DOM); bucle bajo demanda de `M7.crearApp` con medidas y sus dos bichos.

Conteo (verificar.mjs): 8 ejemplos resueltos, 5 ejercicios (★, ★★, ★★, ★★, ★★★; los cinco con playground y `data-solucion`), 4 quizzes repartidos, 10 bloques anotados, 8 bestiarios, 6 senior, 2 hack, 1 porqué, resumen, «Para profundizar». 4 playgrounds GLSL y 9 JS. ~14 500 palabras de prosa (sin código): es la lección más larga del módulo (7.1: ~10 400; 7.2: ~7 200). Chip de 180 min.

## 3. data-id de bestiario

- `m7-3-muelle-quema` — Con un muelle que rebota, la imagen de llegada se quema un instante (mix extrapola).
- `m7-3-transicion-no-limpia` — La transición empieza con un velo de la imagen nueva (o termina con un resto de la vieja).
- `m7-3-circulo-esquinas` — El revelado circular termina y las esquinas siguen con la imagen vieja.
- `m7-3-disolucion-atascada` — La disolución no hace nada al principio ni al final.
- `m7-3-vuelta-de-golpe` — Al invertir una transición a medias, la vuelta arranca casi parada y llega de golpe.
- `m7-3-salto-al-interrumpir` — Al pulsar «siguiente» a mitad de una transición, la imagen salta.
- `m7-3-bajo-demanda-insomne` — El bucle bajo demanda no se duerme nunca.
- `m7-3-salto-al-despertar` — Cada transición empieza con un salto (en un bucle que se duerme).

(7.6, escrita en paralelo, ya enlaza a `m7-3-transicion-no-limpia`, `m7-3-disolucion-atascada` y `m7-3-muelle-quema`: existen con esos ids.)

## 4. Verificación

```
✓ ../modulos/07-integracion/03-transiciones-shader.html  (69169 ms)
   glsl=4 js=9 graficador=0 demo=0 ejemplos=8 ejercicios=5 quiz=4 anotado=10 callouts=18 bestiario=8 senior=6 h2=9 pres=6 palabras=20421 soluciones=5
   capturas: 13 en …/scratchpad/capturas/m7-3
1/1 páginas sin problemas
```
Lo mismo con `--tema light` (más `--pagina`, 56 tramos revisados a muestreo) y con `movil.mjs` a 390 px: `✓ scrollWidth=390 / 390`. Sin enlaces rotos (los enlaces a 7.4 y 7.7 existen ya en disco).

Comprobaciones adicionales con un script propio (`scratchpad/qa/m7-3-qa1.mjs`, una sesión de Chrome):
- Ejercicio 7.3.1: el código de partida pinta 42 655 px magenta (fallo del contrato); la solución, 0, también con ángulos 90/135/250/333° y borde 0,3.
- Ejercicio 7.3.2: solución sin magenta con borde 0 y 0,3.
- Ejercicios 7.3.3, 7.3.4 y 7.3.5: la solución imprime solo ✓ en todas las pruebas; el código de partida falla las que debe (7.3.5 partida: 60 frames en reposo, no se duerme, muelle en −1,2·10⁻⁸).
- Ejemplo 7.3.8: tras quedarse quietas, «continuo · 60 frames en el último segundo» frente a «bajo demanda · 0 frames».
- Ejemplo 7.3.4 (galería, modo congelar): tras la ráfaga, 3 instantáneas y ningún salto; 7.3.6 (overlay): cubre, cambia el DOM, descubre, foco en el contenido nuevo y aviso aria-live «Página: Proyectos».
- Capturas revisadas en tema oscuro y claro (también de la página completa por tramos).

Medidas (todas en MacBook Air M1, Chrome 154 headless, ANGLE/Metal):
- Opacidad CSS: blanco sobre negro con `opacity: 0.5` → (128,128,128); 0,25 → (64,64,64): Chrome compone en sRGB.
- `mix(a, b, p)` con p = 1,15 / −0,15 → canales recortados a 0 y 255 (valores exactos en el bestiario).
- Distribución del fbm de 4 octavas (1024×512, escala 5, readPixels): min 0,15, p1 0,24, mediana 0,55, p99 0,80, max 0,89; tabla de fracción revelada con y sin estirar.
- Bucle continuo vs bajo demanda con imagen estática a 1440×900 (CPU por proceso vía `SystemInfo.getProcessInfo`, 2 rondas de 6 s): 360 frames, ~16 ms/s renderer + ~30 ms/s proceso GPU frente a 0 frames, 0 y 0,1 ms/s.
- GPU por frame de las transiciones a 1440×900 (EXT_disjoint_timer_query_webgl2, 10 dibujos por consulta): 0,07–1,3 ms, con mucha dispersión (se dice así en el texto).
- m7kit bajo demanda: 0 frames en reposo, primer dt tras despertar = 0, el canvas dormido conserva el último frame (píxel leído).
- Comparación exacta: `M7.suavizar` hacia 1 atascado en 0,9999999999999998 y `M7.Muelle` en 0,999999999999999 tras 100 000 frames (en Chrome).
- Muelles (simulados con el propio `M7.Muelle` en Node/V8 a 60 Hz): `parametrosMuelle(0.1, 0.6)` → pico 1,0947, reposo a 1,03 s; `(0.25, 0.9)` → pico 1,245, reposo 1,55 s; primer paso con dt = 0,1 desde el reposo: 0,39 (frente a 0,026 con 1/60).
- API: `document.startViewTransition` existe; no existen `drawElement`/`drawElementImage` (2D) ni `texElementImage2D` (WebGL2).

## 5. Problemas conocidos / cosas no comprobadas

- No he ejecutado `node herramientas/indexar.mjs` (escribe en `assets/js/`, que el encargo prohíbe tocar, y hay cinco autores escribiendo a la vez): hay que ejecutarlo una vez al final para que los 8 bestiarios entren en el anexo A.1 y la lección en el buscador.
- La afirmación sobre `pointerenter`/`pointerleave` con dedo (llegan justo antes de `pointerdown` y justo después de `pointerup`) está sacada de la especificación de Pointer Events, no medida.
- Los tiempos de GPU del temporizador tienen una dispersión grande (la GPU del M1 cambia de frecuencia); en el texto solo se da el rango.
- Decisión discutible: la lección es larga (14 500 palabras de prosa). Cubre todos los puntos del encargo con el nivel de detalle de 7.1; si se quiere acortar, lo más separable es el overlay de página o la línea de tiempo (cada uno podría ser una lección corta).
- Decisión discutible: el catálogo usa un solo programa con `if` por modo (cómodo para enseñar) y el texto aclara que en producción lo habitual es un programa por transición.
- En la galería, si el tamaño cambia o el contexto se pierde justo mientras la imagen de partida es una instantánea, la transición termina de golpe (simplificación documentada en el texto; se sugiere `blitFramebuffer` como alternativa).
- Durante la preparación ejecuté una vez el binario de Chrome con `--version` para saber la versión (sin abrir navegador ni headless; sale al instante). Después solo he lanzado Chrome con el puppeteer parcheado.

## 6. Sugerencias para componentes compartidos (sin modificarlos)

- **m7kit, `M7.Puntero`**: antes del primer evento, `x`/`y` se calculan con `cx = cy = 0` (coordenadas que nadie ha escrito) y `sx`/`sy` valen 0; cualquier comparación «¿persigue el suavizado a la posición real?» nunca se cumple y deja insomne un bucle bajo demanda (nos pasó en el ejemplo 7.3.8). Propuesta: mientras `!visto`, dejar `x = sx` e `y = sy` (p. ej., el centro de la caja), o documentarlo en la cabecera.
- **m7kit, `crearApp`**: `bajoDemanda` se lee de `o.bajoDemanda` en cada frame, así que mutar el objeto de opciones cambia el modo en caliente; no está documentado. Propuesta: exponer `app.bajoDemanda` (lectura/escritura) y documentarlo, útil para alternar modos sin recrear el canvas.
- **m7kit**: `L73.Transicion` y `L73.Linea` podrían subir a m7kit si 7.6 u otras lecciones los quieren reutilizar.
- **texturas.js**: todas las texturas son cuadradas (512); para transiciones entre imágenes vendría bien alguna «foto» apaisada y reconocible más (he generado tres en `l73-kit.js`: noche, mar, bosque). Si se añaden a `texturas.js`, los playgrounds GLSL también podrían usarlas en `data-texturas`.

## 7. Términos para el glosario

- **Transición (en un shader)**: función T(uv, p) que pasa de una imagen A a otra B según un progreso p.
- **Progreso (`u_progreso`)**: número de 0 a 1 que JavaScript anima y el shader interpreta en cada píxel.
- **Contrato de una transición**: exigencia de que en p = 0 se vea exactamente A y en p = 1 exactamente B.
- **Cortinilla (wipe)**: transición en la que un borde recorre la pantalla dejando la imagen nueva detrás.
- **Revelado radial**: cortinilla circular que crece desde un punto hasta la esquina más lejana.
- **Disolución (dissolve)**: transición en la que cada píxel cambia cuando un umbral alcanza su valor de ruido.
- **Transición por desplazamiento**: transición que lee las dos imágenes en posiciones desplazadas por un campo de flechas.
- **gl-transitions**: colección abierta de transiciones GLSL con la convención `getFromColor`/`getToColor`/`progress`/`ratio`.
- **Escalonado (stagger)**: retraso distinto para cada elemento o píxel dentro de una misma animación.
- **Instantánea (congelar el frame)**: textura de un FBO con lo que se está viendo, usada como origen de una transición interrumpida.
- **Línea de tiempo (timeline)**: conjunto de pistas con inicio, duración y easing que se evalúan desde un cabezal.
- **Cabezal (playhead)**: instante de la línea de tiempo que se está mostrando.
- **Position parameter**: notación (`'<'`, `'+=x'`, `'-=x'`) para colocar una pista respecto a la anterior o al final de la línea.
- **Bucle bajo demanda (render on demand)**: bucle que solo pide frames mientras algo cambia y se duerme en reposo.
- **Overlay de transición de página**: capa a pantalla completa que tapa el cambio del DOM entre dos «páginas».
- **View Transitions API**: API nativa del navegador que anima entre dos estados del DOM a partir de capturas y CSS.
