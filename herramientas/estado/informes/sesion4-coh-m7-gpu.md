# Sesión 4 · agente coh-m7-gpu — coherencia del lado GPU de m7 (7.4, 7.5, 7.7) con el resto del curso

Máquina: MacBook Air Apple M1, Chrome 154.0.8037.98, ANGLE/Metal (`ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)`).
Archivos tocados: `modulos/07-integracion/04-vertex-animacion.html`, `05-particulas-gpu.html`, `07-siguientes-pasos.html`.
Sin cambios: `recursos/l74kit.js`, `recursos/l75-particulas.js`, `recursos/l77-*` (revisados: cabeceras y API coherentes con el texto).
Scripts: `herramientas/estado/lab/s4-coh-m7-gpu-*` (lista al final). Tablón: aplicadas las 3 entradas PARA coh-m7-gpu (de
coh-m7-web); añadidas 4 PARA lead.

**Método.** Cada lección de m1–m7 pasada a texto compacto con números de línea (`s4-coh-m7-gpu-texto.mjs`); mapa de 7.4, 7.5 y
7.7 (definiciones, cifras, promesas, términos) en el SCRATCH; después, cruce tema a tema con m3–m6, 7.1–7.3 y 7.6 (grep + lectura de
la sección destino), los 161 enlaces entrantes hacia 7.4/7.5/7.7 (`s4-coh-m7-gpu-entrantes.mjs`), los títulos citados entre «»
(`s4-coh-m7-gpu-titulos.mjs`) y los números de lección (`s4-coh-m7-gpu-numeros.mjs`), y la API real de GLKit, m7kit, l74kit y l75.

## (a) Cambios hechos y por qué

### Contradicciones y hechos mal atribuidos
1. **`texelFetch` con una textura incompleta** (7.4 decía «devolvió ceros»; 7.5, 6.8 y A.2, «(0, 0, 0, 1), también con texelFetch»).
   Medido ((b)1): las dos cosas son ciertas según el texel. 7.4 («Terreno desde una textura», 2.ª regla) y 7.5 (bestiario
   `m7-5-todas-en-el-centro`, solución del ejercicio 7.5.1 y resumen) cuentan ahora lo medido: (0, 0, 0, 1) en el texel (0, 0),
   (0, 0, 0, 0) en los demás, `textureSize` = 1 × 1, la especificación pide (0, 0, 0, 1) en todos y la explicación más probable
   (ANGLE sustituye la textura por una de 1 × 1). El resumen de 7.5 ya no dice «todo lee ceros». 6.8/A.2/A.4 → tablón (lead).
2. 7.4 «La silueta no miente»: «En 6.7 hiciste agua, humo y baldosas» — 6.7 no tiene agua ni humo → «En el módulo 6 hiciste nubes
   con ruido (6.6), ondas que corrían y baldosas que se volteaban (6.7)».
3. 7.4, título citado de la caja de 6.6 → «Cómo se mide lo que cuesta un shader (y cómo no)» (tablón, coh-m7-web) y, como pide ahora
   esa caja, «un `readPixels` del framebuffer de la última pasada» (comprobado en `s4-m7b-74-tiempos.mjs`: lee del FBO enlazado).
4. 7.4, la C de «Geometría sin buffers» (≈ 3× y no 6×): la hipótesis ahora se apoya en lo que el alumno contó en 4.4 con la GPU de
   juguete (fila a fila y caché FIFO pequeña: casi cada vértice se procesa dos veces, 1,06 VS/triángulo) → «seis entre dos son tres»,
   sigue marcado como «lo más probable».
5. 7.7, quiz de la caché de uniforms: «el bicho de 7.1» (sección sin bestiario) → bicho `m5-uniform-otro-programa` de 5.4 + ejercicio
   7.1.1 (tablón, coh-m7-web). 7.7 l.504: ancla del observador → `#tamano-lo-que-5-1-no-podia-saber` (tablón, coh-m7-web).
6. 7.4, bestiario `m7-4-epsilon`: `reloj.envuelto(periodo)` solo sirve si el periodo es múltiplo del de todas las ondas (lo dice 7.1;
   si no, la superficie salta al envolver) — añadido, con enlace a «Un reloj propio» de 7.1.
7. 7.5, senior «¿Por qué no gl.POINTS?»: «la especificación de OpenGL ES *permite* descartar» → «se descartan enteros» (como 5.3 y
   7.4; la especificación de ES 3.0 lo dice así).

### Repeticiones (recordatorio breve + enlace, sin perder lo propio)
8. 7.5, senior «¿Por qué no gl.POINTS?»: repetía 5.3/7.4 (511 px, descarte en el borde). Ahora remite a 5.3 y 7.4 (y al bicho
   `m7-4-puntos-dpr` por los píxeles del búfer) y conserva lo propio: el punto de 32 px medido y que el cuadrado no se puede girar ni
   estirar (la estela del enfoque 1).
9. 7.5, hack «Luz y humo en la misma llamada»: era el hack «Brillos y transparencia en una sola pasada» de 5.7 a la misma profundidad.
   Ahora lo cita y se queda con lo propio de 7.5: el alfa por partícula y por edad (con referencia al hack «¿Y la edad?…»).
10. 7.4, senior «flat, el vértice provocador…»: 4.5 ya mide el vértice provocador y `WEBGL_provoking_vertex`. Remite a 4.5
    (`#calificadores-smooth-flat-y-noperspective`) y conserva lo nuevo: con índices, «el último» es el tercero de la lista ([1, 2, 0] →
    vértice 0), la rejilla y `cross(dFdx, dFdy)`.
11. 7.5, senior «Subir datos a un buffer que la GPU todavía está usando»: enlaza el *orphaning* de 5.3 (allí, en un bucle normal,
    costó lo mismo) — sin contradicción: 7.5 mide frames forzados.

### Bestiarios gemelos (ida m7 → m2–m6; la vuelta m6 → m7, en el tablón)
12. `m7-4-aliasing-malla` ↔ `m6a-muare-procedural` (6.5) y `m6b-rueda-atras` (6.7); `m7-4-heightmap-plano` ↔ `m5-textura-negra` (5.5).
13. `m7-5-half-congeladas` ↔ `m3-contador-congelado` (3.7); `m7-5-no-avanza` ↔ `m5-bucle-realimentacion` (5.8);
    `m7-5-divisor-colapso` ↔ `m5-divisor-olvidado` (5.9, «el reverso»); `m7-5-aditivo-invisible` ↔ `m2-estela-fantasma` (2.6) y las
    estelas de 5.8; `m7-5-rasterizer-discard` ↔ `m4-clear-no-borra` (4.2).
14. `m7-7-version-duplicada` ↔ `m5-version-primera-linea` (5.2), con la diferencia de mensajes medida ((b)2);
    `m7-7-textura-oscura` ↔ `m6a-doble-gamma` (6.4); `m7-7-mod-wgsl` ↔ `m3-mod-negativos` (3.4); `m7-7-y-invertida-webgpu` →
    `m3-raton-y-invertida` (3.1); `m7-7-culling-desplazado` ↔ caja senior «La CPU no sabe dónde están tus vértices» de 7.4 (enlaces
    en los dos sentidos: la caja de 7.4 cita ahora la medida de 7.7, cero draw calls).
    Todos los enlaces llevan el `data-titulo` exacto entre «».

### Orden pedagógico, enlaces y notación
15. 7.5: chip de requisitos «2.8, 5.8, 5.9, 7.1» → «2.8, 5.8, 5.9, 6.6, 7.1, 7.2» (usa el ruido de gradiente y el PCG de 6.6 y
    `M7.Puntero` de 7.2 en todos los ejemplos).
16. 7.5: el paso de las diferencias del curl noise (0,01, una centésima de celda) enlaza la regla del ε de 7.4; la curva de tono del
    ejercicio 7.5.4 enlaza el tone mapping de 6.4 (Reinhard como alternativa).
17. Anclas precisas en lugar de la lección entera: 7.4 → 4.5 `#gl-vertexid-dibujar-sin-buffers`, 3.2 `#ejercicio-3-2-2-…` (y «de la
    solución del ejercicio», que es donde aparece el vector medio), 6.3 `#como-calcula-la-gpu-una-derivada`, 5.3
    `#puntos-gl-pointsize-y-sus-rarezas` y `#indices-…`, 6.5 `#muare-…`; 7.5 → 4.5, 5.5 `#unpack-flip-y-webgl-arriba-y-abajo`, 5.7
    `#ejercicio-5-7-5-particulas-sin-ordenar`, 7.2 `#movimiento-reducido-prefers-reduced-motion`; 7.4 «el mismo detalle de 5.6»,
    ahora con enlace y la razón (renormalizar compensa el acortamiento de la interpolación, quiz de 5.6).
18. 7.4, las líneas de la rejilla: el muaré que evitan es el procedural (`m6a-muare-procedural` de 6.5, sin mipmaps), no el de texturas.
19. «buffer de profundidad» → «búfer de profundidad» (convención de 0.1) en 7.4 y 7.5.

### Comprobado sin cambios (coherente)
- Transform feedback (5.9 → 7.5; 7.4 lo usa para medir con enlace a 7.5), ping-pong y float (5.8 ↔ 7.5: 0x8CD6, RGBA16F filtrable,
  `EXT_float_blend` implícito con `EXT_color_buffer_float`), instancing y divisores (5.9), `gl_VertexID` con `drawElements` (4.5),
  mediump = 23 bits en el M1 (3.7, 6.1), int `mediump` en el FS (6.1, 6.6), PCG con `highp int` en todos los shaders de 7.5,
  alfa premultiplicado y aditivo (5.7), límites del M1 (tabla de 5.1: 511, 16, 2³²−2), `ALIASED_POINT_SIZE_RANGE`, `performance.now`
  a 100 µs (1.5), semivida ln 2/λ (2.4), amortiguamiento crítico 2√(km) (2.5), softening (2.8), AoS/SoA (1.6 promete y 7.5 cumple),
  cita literal de 4.1 sobre WebGPU en 7.7, z de NDC [0, 1] (3.6), orden rAF → ResizeObserver (1.5, 5.1), API de GLKit
  (`crearTextura`: flipY true y lo devuelve a false; LINEAR y CLAMP por defecto; `crearFBO`: flipY false, LINEAR; `rotacionY`;
  `varyingsTF` con SEPARATE por defecto), de m7kit (`Reloj` con `dtMax` 0,1, `dt`/`dtReal`, `envuelto`, `reiniciarReferencia`;
  `Puntero.nx/ny/sx/sy`; `crearApp`: `ancho/anchoCSS`, `fallar`, `redimensionar` tras perder el contexto), de l74kit y l75.
- Promesas entrantes (161 enlaces): 1.6 (AoS en 7.5), 2.6, 2.8 (un millón a 60 fps), 3.6 (NDC en 7.7), 4.1 (WebGPU), 4.5 (rejilla de
  quads con `gl_VertexID`, citas literales), 5.2/5.9 (`varyingsTF`), 5.8 (ping-pong), 6.6/6.9 (gemelos), 6.7 (baldosas en 3D:
  ejercicio 7.4.4), 7.1 (estado en la GPU), 7.3 y 7.6 (→ 7.4 y 7.7), A.2/A.3/A.5: todas se cumplen. Promesas internas («enseguida»,
  «lo verás en el campo de puntos», «volveremos a ello»): se cumplen.
- Nombres: `u_raton` en 7.5 (unidades del mundo + intensidad en z) frente a `u_mouse` (px del búfer) del resto del curso: semántica
  distinta, nombre distinto (7.6 hace lo mismo). Varyings `v_` y atributos `a_` en todos los shaders de 7.4/7.5.

## (b) Mediciones (Apple M1, Chrome 154, ANGLE/Metal; un Chrome por ejecución, con turno)

**1. Textura incompleta leída en un shader** (`lab/s4-coh-m7-gpu-exp2.mjs` y `-exp3.mjs`; destino FBO RGBA8 de 1 × 1, un punto,
`readPixels`; el texto del shader cambia en cada lectura, así que la caché de programas no influye):

| Textura (2 × 2 o 4 × 4, datos (255, 128, 64, 200)) | `texture()` | `texelFetch` en (0, 0) | `texelFetch` en (1, 0), (0, 1), (1, 1), (3, 3) | `textureSize(u_t, 0)` |
|---|---|---|---|---|
| completa (NEAREST, o con mipmaps) | el dato | el dato | el dato | 2 × 2 / 4 × 4 |
| incompleta: filtro por defecto o `LINEAR_MIPMAP_LINEAR` sin mipmaps | (0, 0, 0, 1) | (0, 0, 0, 1) | **(0, 0, 0, 0)** | **1 × 1** |
| incompleta: RGBA32F con `LINEAR` sin `OES_texture_float_linear` | (0, 0, 0, 1) | (0, 0, 0, 1) | **(0, 0, 0, 0)** | (no medido) |
| unidad sin textura | (0, 0, 0, 1) | (0, 0, 0, 1) | **(0, 0, 0, 0)** | **1 × 1** |

Igual en el vertex y en el fragment shader; `getError` = 0. Interpretación (lo más probable; `textureSize` la apoya): ANGLE sustituye
la textura incompleta (o la unidad vacía) por una de 1 × 1 negra opaca; `texture()` la muestrea → (0, 0, 0, 1); `texelFetch` de un
texel que no sea el (0, 0) cae fuera de esa textura → (0, 0, 0, 0), el valor «fuera de rango». La especificación de WebGL 2.0 pide
(0, 0, 0, 1) en todos («a texture source color of (0, 0, 0, 1) in the case of a texel fetch from an incomplete texture»).
Cifra antigua → nueva: 7.4 «ceros» y 7.5 «(0, 0, 0, 1)» → «(0, 0, 0, 1) en el texel (0, 0); (0, 0, 0, 0) en los demás».

**2. `#version 300 es` fuera de la primera línea** (`lab/s4-coh-m7-gpu-exp.mjs`, fragment shader):
- una línea vacía delante, o una línea `// …` delante → `ERROR: 0:2: '\n' : #version directive must occur on the first line of the shader`
  (el `'\n'` es un salto de línea literal; el mensaje que cita 5.2);
- código delante (`#define X 1`, `precision highp float;`) o un segundo `#version` en la línea 57 →
  `'version' : #version directive must occur before anything else, except for comments and white space` (el que cita 7.7);
- espacios delante en la misma línea (`   #version 300 es`) o un comentario de bloque en la misma línea (`/* hola */ #version 300 es`)
  → **compila** (coincide con la tabla de 6.1; contradice el «o con espacios» de 5.2 → tablón).
- Y de paso: `texture()`/`texelFetch` en el VS de una textura completa leen el dato (control de los experimentos).

No he medido tiempos de GPU (no hacía falta: ninguna cifra de tiempo cambia).

## (c) Verificación final (después de la última edición de cada archivo)
- `verificar.mjs 04 05 07 --soluciones --capturas` (oscuro): **3/3 sin problemas** (7.4: 7.4.1 7 ✓, 7.4.3 1 ✓; 7.5: 7.5.1–7.5.4
  1 ✓ cada una; 7.7: 7.7.1 6 ✓, 7.7.2 5 ✓, 7.7.3 1 ✓ y su partida falla como debe, 7.7.4 4 ✓). 7.4 se editó después (un cambio de
  orden en un bestiario) y se volvió a pasar: ✓ (oscuro + soluciones) y ✓ (claro).
- `verificar.mjs … --tema light`: **3/3 sin problemas**.
- `movil.mjs` (390 px): 7.4, 7.5, 7.7 scrollWidth = 390 (7.4, otra vez tras su última edición: 390). Los elementos anchos que lista son
  fórmulas KaTeX y un `path` de SVG dentro de contenedores con desplazamiento propio, como en la sesión anterior.
- `enlaces.mjs` (todo el curso): 63 archivos, 3 780 enlaces internos, **0 rotos**.
- `s4-coh-m7-gpu-titulos.mjs`: todas las citas entre «» de 7.4/7.5/7.7 coinciden con su `data-titulo`; `-numeros.mjs`: 0 enlaces
  con número de lección equivocado.
- Capturas (`s4-coh-m7-gpu-capturas.mjs`, 24 párrafos/cajas editados × oscuro 1280, claro 1280, claro 390 = 72): 0 errores de KaTeX,
  sin scroll horizontal; miradas las de `m7-5-todas-en-el-centro`, la caché de 4.4 en 7.4, `m7-7-version-duplicada` a 390 px, el
  senior de los puntos, el bestiario del aliasing, el hack de luz y humo y la regla de la textura incompleta: se leen bien en los dos
  temas.

## (d) Pendientes y decisiones discutibles
1. **Tablón PARA lead** (no son archivos míos): (1) `texelFetch` incompleta en 6.8 l.99, A.2 l.433 y A.4 l.1890/l.~2656 (texto
   exacto propuesto); (2) 5.2 l.188 «o con espacios» (contradice 6.1) y, opcional, el resumen de 6.1 l.1208; (3) vuelta de los gemelos
   m6 → m7 (6.4 `m6a-doble-gamma`, 6.5 `m6a-muare-procedural`, 6.7 `m6b-rueda-atras`) y, opcional, m2–m5 → m7; (4) **ejecutar
   `node herramientas/indexar.mjs`**: cambié el texto de 14 cajas bestiario (lista en el tablón) y A.1 copia ese texto.
2. La explicación de la textura de 1 × 1 es una inferencia (no he leído el código de ANGLE); está marcada «lo más probable» en las
   dos lecciones. Lo medido es la tabla de (b)1.
3. No he tocado `u_raton` de 7.5 (ver (a), «Comprobado»), ni recortado más repeticiones de 7.5 con 5.5/5.8 (completitud,
   `EXT_color_buffer_float`): allí 7.5 ya es breve y enlaza, y el bestiario `m7-5-todas-en-el-centro` tiene síntoma propio.
4. Menciones de lecciones sin enlace en la prosa de 7.4/7.5/7.7 («la regla de 7.1», «como en 7.2»…): las dejé; el curso no enlaza
   cada mención y las de primera aparición ya llevan enlace. Solo añadí enlaces donde el concepto se reutiliza a fondo.
5. 7.5 chip de requisitos ampliado (6.6, 7.2): si el dueño quiere chips cortos, se puede volver atrás sin consecuencias.

## Scripts (en `herramientas/estado/lab/`)
- `s4-coh-m7-gpu-texto.mjs` (lección → texto compacto con números de línea; copia de `coh-m6-texto.mjs`),
  `s4-coh-m7-gpu-titulos.mjs` y `s4-coh-m7-gpu-numeros.mjs` (copias de `coh-m6-*` con la raíz del Mac),
  `s4-coh-m7-gpu-entrantes.mjs` (enlaces de todo el curso hacia 7.4/7.5/7.7 con contexto). Sin Chrome.
- `s4-coh-m7-gpu-exp.mjs` (textura incompleta en el VS, primera tanda, y mensajes de `#version`), `s4-coh-m7-gpu-exp2.mjs` (causas de
  incompletitud × `texture`/`texelFetch` × VS/FS), `s4-coh-m7-gpu-exp3.mjs` (`textureSize` y texels de una 4 × 4). Con turno.
- `s4-coh-m7-gpu-capturas.mjs <dir>`: capturas de los 24 párrafos editados (oscuro/claro 1280, claro 390), con `clip` en coordenadas
  del documento y `captureBeyondViewport: false`. Con turno.
Salidas en el SCRATCH (`agentes/coh-m7-gpu/exp*.txt`, `verif-*.txt`, `movil.txt`; se perderán): las cifras están en (b) y (c).
