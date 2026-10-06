# Revisión de 7.4 «Animar vértices: mallas que se deforman» (rev-m7-4, sesión 3)

Archivos tocados: `modulos/07-integracion/04-vertex-animacion.html`, `modulos/07-integracion/recursos/l74kit.js`
(solo la cabecera de comentarios) y, nuevo, `herramientas/estado/lab/rev-m7-4-tiempos.mjs` (laboratorio de tiempos
para el M1). Máquina de la revisión: contenedor Linux, Chromium 141 headless, WebGL por SwiftShader (sin GPU).

La lección estaba muy bien: técnicamente sólida, con casi todas las afirmaciones comprobables correctas. He
reproducido en este Chromium todo lo que no depende del M1 (lista en (g)). Los cambios son locales; lo más
importante es el tratamiento de las cifras de tiempo de GPU (c).

## (a) Cambios hechos (y por qué)

Todas en `04-vertex-animacion.html` salvo la última.

1. **Tiempos de GPU (cabecera «La silueta no miente», tabla A/B/C de «Geometría sin buffers» y resumen).** Las cifras
   «Vertex shader: dibujo completo» (0,6 / 1,1 / 3,2 ms) y la tabla A/B/C se tomaron con «mediana de 7 tandas de 8
   dibujos sincronizadas con `readPixels`» (la columna de la primera tabla coincide con la fila A ligera: mismo
   método). No queda el script del autor y nada dice que cada dibujo fuera a su propia pasada: es el método que el
   §4 del plan y la caja de 6.6 declaran poco fiable en la GPU de teselas del M1. No puedo re-medir aquí, así que:
   el texto describe ahora el método, lo califica de orientativo y enlaza a la caja
   [«Cómo se mide lo que cuesta un shader»](../../../modulos/06-glsl/06-ruido.html#medir-coste-shader) de 6.6; la
   conclusión se apoya en el orden de magnitud y en que el trabajo de la GPU no ocupa el hilo principal (no en «3,2 ms
   = 3,2 ms»). En la tabla A/B/C se pide fijarse en las proporciones entre variantes (mismo fragment shader). En el
   resumen: «1,1 ms con nuestro método de medida, orientativo» y «unas 2,5 veces más lento en nuestra medida» en lugar
   de «11 ms frente a 4,2». Las cifras de CPU (calcular 3,2/12,7/50,7 ms y subir) no cambian: son de JavaScript.
2. **«la división entera no es gratis»** (explicación de por qué B va algo por detrás de A con N = 512): no se sostiene
   con los propios datos (con N = 1024, cuatro veces más divisiones, B empata con A). Ahora dice que son décimas de
   milisegundo que no crecen con la malla y que por eso no son el coste de la división.
3. **Memoria:** N = 255 → «2,09 MB» corregido a **2,08 MB** (524 288 + 1 560 600 B = 2 084 888 B); N = 320 →
   «2,9 MB» corregido a **3,3 MB** (0,82 MB de uv + 2,46 MB de índices Uint32 = 3 281 928 B), con el desglose.
   El resto de la tabla de conteos y memoria está bien (comprobado con un script: vértices, triángulos, índices, tipo).
4. **«transform feedback (la extensión de WebGL2…)»**: no es una extensión, es parte de WebGL2. Corregido y enlazado a
   7.5 (`#enfoque-3-transform-feedback`), donde se explica llamada por llamada.
5. **Cita de 4.5** en «Geometría sin buffers»: el texto entrecomillaba una frase que 4.5 no dice así («una rejilla de
   N × N a partir de gl_VertexID…»). Ahora cita literalmente los dos fragmentos («una rejilla de N × N quads», «fila =
   id / N, columna = id % N»), enlaza al ancla `#gl-vertexid-dibujar-sin-buffers` y aclara que allí N son elementos
   por fila (en una rejilla de vértices, nuestro `lado = N + 1`).
6. **Ejemplo 7.4.3 sin explicar dos términos de la luz**: el especular era Blinn-Phong y el «reflejo del cielo» un
   término de Fresnel aproximado, sin nombrarlos ni explicarlos («ninguna línea sin explicar»). Añadido: Blinn-Phong
   con el vector medio `H = normalize(L + V)` del ejercicio 3.2.2 (exponente 250 = mancha diminuta) y
   `pow(1 − n·V, 4)` como imitación barata de Fresnel (0 de frente, 1 rasante).
7. **Puntos (`gl_PointSize`)**: (a) la explicación del tamaño en perspectiva era ambigua («`0,045 × focal / w` es su
   altura en NDC dividida entre 2») y podía leerse mal; reescrita: es la altura en NDC, y × `altoBúfer / 2` pasa a
   píxeles; «esfera» → «bolita de 0,045 unidades de diámetro»; (b) se explica el `clamp(tam, 1, 64)` del shader, que
   no se comentaba; (c) «511 px en la máquina de pruebas, bastante menos en otras GPU» → «la especificación solo
   garantiza 1 px, y en otras GPU puede ser mucho menor» (en SwiftShader es 1023: «bastante menos» no es cierto en
   general); igual en el bestiario `m7-4-puntos-dpr` (con enlace a 5.9); (d) «la variante B sin índices» → «la
   cuenta de la variante B, pero con `drawArrays`, donde `gl_VertexID` va de 0 a lado² − 1».
8. **Alambre baricéntrico**: `b / fwidth(b)` es una distancia en píxeles *aproximada* (fwidth es norma L1): añadido
   que en las aristas diagonales la línea sale hasta un 40 % más gruesa, como los bordes de 6.3 (que lo mide).
9. **z-fighting de `gl.LINES` sobre la malla**: «la prueba de profundidad decide al azar» → lo decide el redondeo de
   la profundidad, que línea y triángulo interpolan cada uno a su manera.
10. **`WEBGL_polygon_mode` «en borrador»** → «extensión reciente»: Chromium 141 la expone sin
    `--enable-webgl-draft-extensions` (comprobado), así que ya no se trata como borrador. Se mantienen el aviso de
    consola citado (idéntico aquí) y la cifra del M1.
11. **Bandera**: «la tabla … dice que vamos sobrados» solo vale al principio; añadido que el tiempo entra multiplicado
    por 5,5 y 8,3 y que tras una hora las fases rondan 30 000 y el error de la normal sube a unos pocos grados
    (estimación a partir de la tabla del ε; ver (c)), con la recomendación de envolver el tiempo.
12. **Heightmap «uno por texel»**: el vértice i tiene u = i/255 y el centro del texel i está en (i + 0,5)/256: solo
    coinciden en el centro, y LINEAR mezcla vecinos. Añadido, junto con que CLAMP_TO_EDGE (por defecto en
    `GLKit.crearTextura`) evita mezclar los bordes con el lado opuesto; `texelFetch` como lectura exacta.
13. **Coherencia con 3.5** (solución del ejercicio 7.4.4): «la regla de 3.5 (las transformaciones se aplican de
    dentro afuera)» → el orden de 3.5 con su notación ($T \cdot R\,\vec v$ leído de derecha a izquierda).
14. **Promesa de 7.3** («en 7.4 … con estos mismos uniforms de progreso»): añadido en «Deformar con el ratón» que
    `u_fuerza` es un número animado por un muelle, como el `u_progreso` de 7.3, con enlace.
15. **Bestiario `m7-4-indices-uint16`**: es el mismo bicho que `m4-indice-65535` de 4.4; añadida la remisión (ver (b)).
16. Menores: «celdas de medio metro» → «0,5 unidades» (el curso no usa metros); «con `i / lado` la última columna
    valdría 0,97» → `N / (N + 1)` (0,96 con N = 24, el valor por defecto); ladera «hacia el lado del que viene la
    subida» → «hacia el lado bajo de la cuesta»; requisitos de la cabecera: + 7.2 (Puntero, `u_escala`, buffer
    circular del ejercicio 7.4.5); la caja senior de l74kit documenta `{ sinUV: true }` (variante B), que existía
    en el kit sin mencionarse.
17. **`recursos/l74kit.js` (solo comentarios)**: la cabecera citaba `L74.GLSL.ALAMBRE`, que no existe (son
    `ALAMBRE_VS` y `ALAMBRE_FS`); las referencias a secciones estaban desplazadas (§8 → §9 para `gl_VertexID`,
    §7 → §8 para el rayo); `rayo` «sale del ojo» → sale del plano cercano (es lo que hace el código).

Nuevo: `herramientas/estado/lab/rev-m7-4-tiempos.mjs` (ver (c)).

## (b) Problemas pendientes (con sección y propuesta)

1. **Bestiario duplicado** (`m7-4-indices-uint16` ↔ `m4-indice-65535` de 4.4): mismo síntoma y misma causa; 7.4 aporta
   la medida en una rejilla (47 306 de 65 536 píxeles con N = 300) y la provocación en vivo. Lo he dejado como
   bestiario con remisión a 4.4; en la pasada de coherencia de m7 (§3.6) decidir si se convierte en `callout nota`
   conservando el `id` (como se hizo con los 9 duplicados de m3–m5) o si A.1 los agrupa.
2. **La tabla del ε no es la superficie del ejemplo 7.4.3.** Las filas de arriba (ε = 0,3 y 0,1) son error de
   truncamiento, que no depende del hardware: con las tres ondas de la lección (`DIR`, `K`, `A`, `W`), x, z ∈ [0, 10],
   t = 10 y 2000 puntos, en float64 sale 1,68° y 0,19° (script `eps.mjs` de mi scratch), no 3,2° y 0,36°; la razón
   entre filas (≈ 9 = (0,3/0,1)²) sí coincide. O el autor midió otra «superficie de tres senos» o con otra métrica.
   El texto no dice que sea la del ejemplo, pero el ejemplo 7.4.3 la presenta como «la tabla de arriba en vivo».
   Propuesta: re-medir en el M1 con las ondas de la lección (ver (c)) o añadir «(otra superficie de tres senos, más
   empinada que la del ejemplo)».
3. **Enlace externo sin comprobar**: `codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/`
   (Florian Bösch) — no he podido comprobarlo (esta máquina no tiene internet); es un blog personal de 2012.
   Comprobarlo desde el Mac; si no responde, usar su copia de archive.org o sustituirlo por el tutorial «Flat and
   Wireframe Shading» de Catlike Coding (comprobar la URL antes de ponerla). Los otros tres enlaces externos (GPU Gems
   cap. 1 en developer.nvidia.com, iquilezles.org/articles/morenoise, especificación GLSL ES 3.00 en
   registry.khronos.org) tienen URLs de forma correcta, tampoco comprobadas en red.
4. **Longitud**: ~20 000 palabras (la guía orienta 3 500–8 000) y ⏱ 160 min. No he recortado nada (todo el contenido
   es pertinente y está verificado), pero es la lección más larga del módulo; si el dueño quiere aligerarla, los
   candidatos son la caja de `WEBGL_polygon_mode`, la tabla de cuatro modos de iluminación (repite las viñetas del
   ejemplo 7.4.4) y el quiz de `drawArrays` + baricéntricas.
5. **Capturas del verificador**: varios playgrounds JS de esta lección salen negros o «en pausa (fuera de pantalla)»
   en las capturas de `verificar.mjs` (ver (d)) y también en mi primer script (ventana de 1000 px); los que sí se
   capturaron se ven bien, y en los blancos la línea `info` del iframe demuestra que el código corre. El script con
   ventana de 1400 px no llegó a ejecutarse (parada). Muy probablemente no es un fallo de la lección.

## (c) Pendientes de medir en el M1

Ninguna cifra de 7.4 se ha sustituido por cifras de SwiftShader. Script para el lead:
**`herramientas/estado/lab/rev-m7-4-tiempos.mjs`** (`cd herramientas && node estado/lab/rev-m7-4-tiempos.mjs [--json salida.json]`;
en macOS usa Chrome con ANGLE/Metal; `--rapido` solo para comprobar que funciona). Mide, con las ondas y el fbm de la
lección, en un FBO de 512 × 512 con profundidad: cada dibujo en su propia pasada (dos FBO alternos, `clear` de color
y profundidad, `readPixels` al final de cada tanda, mediana de 7 tandas de 10) y, para comparar, el método antiguo
(8 dibujos seguidos sobre el mismo FBO). También repite las cifras de CPU (calcular posición + normal en JS y
`bufferSubData`). Probado aquí con `--rapido` (funciona; las cifras de SwiftShader no valen).

| Cifra de 7.4 | Dónde | Estado | Qué hacer con el resultado |
|---|---|---|---|
| «Vertex shader: dibujo completo» 0,6 / 1,1 / 3,2 ms (N = 256/512/1024) | tabla de «La silueta no miente» y resumen («1,1 ms») | método antiguo (tandas de 8 dibujos): orientativa; texto ya matizado | sustituir por `tabla1 … GPU fiable`; si las cifras cambian poco, se puede quitar el matiz «orientativa» y la remisión a 6.6 |
| Tabla A/B/C (1,1 … 11,0 ms) y «11 ms frente a 4,2» (ahora «unas 2,5 veces») | «Geometría sin buffers» y resumen | mismo método antiguo | sustituir por `tablaABC` (fiable); revisar la frase de B («décimas de ms») y la proporción C/A del resumen |
| JS calcular 3,2 / 12,7 / 50,7 ms; subir < 0,1 / 0,2 ms | primera tabla | CPU: válidas | el script las repite (con la normal en JS); solo para confirmar |
| `texSubImage2D` de 256 × 256 «menos de 0,1 ms de JavaScript» | ejemplo 7.4.8 | CPU: válida | — |
| Tabla del ε (error angular por diferencias finitas, transform feedback, highp) | «Diferencias finitas» y bestiario `m7-4-epsilon` | precisión del M1, no tiempos; plausible, pero las filas de truncamiento no cuadran con las ondas del ejemplo (ver (b) 2) | re-medir con las ondas de la lección (`ondas()` del ejemplo 7.4.3) en el M1 |
| «tras una hora … el error de la normal sube a unos pocos grados» (bandera) | ejemplo 7.4.5, paso 2 | estimación mía a partir de la tabla del ε (fase ≈ 30 000, paso efectivo ε ≈ 0,006 en x): ≈ 3° | comprobar con la misma medida de transform feedback (t = 3600, la función `bandera`) |
| `polygonModeWEBGL`: 211 600 → 11 843 píxeles | caja senior | M1; aquí, misma rejilla 8 × 8 en 460 × 460: 211 600 → 10 896 (la rasterización de líneas varía) | ninguna acción |
| `MAX_ELEMENT_INDEX` 4 294 967 294; `MAX_VERTEX_TEXTURE_IMAGE_UNITS` 16; `ALIASED_POINT_SIZE_RANGE` 511; mediump = 23 bits en el VS | varios | del M1 (aquí: 1 073 741 823, 32, 1023 y 10 bits: SwiftShader) | ninguna acción; el texto ya dice «en la máquina de pruebas» |

## (d) Problemas en archivos ajenos

1. **`herramientas/verificar.mjs`** (capturas, l. ~182–192): con la ventana de 900 px de alto y 900 ms de espera, en
   esta lección 8 de las 13 capturas de playgrounds JS salen con el resultado negro o «en pausa (fuera de pantalla)»
   (el playground apilado mide ~1 030 px, más que la ventana; al capturar un elemento más alto que la ventana
   Puppeteer redimensiona/desplaza y el `IntersectionObserver` de `playground-js.js` duerme o recrea el iframe).
   Propuesta: ventana de captura de 1 400 px de alto (o `captureBeyondViewport: false` y capturar por tramos) y una
   espera mayor por defecto con SwiftShader (`--espera 3000`). Hipótesis no confirmada: mi script de 1 400 px no
   llegó a ejecutarse.
2. **A.1 Bestiario (`modulos/08-anexos/01-bestiario.html`, «Diagnóstico rápido por síntoma»)**: no enlaza ningún
   caso `m7-4-*` (pendiente conocido §3.4). Propuesta de ubicación en (e).
3. **A.4 Glosario (`modulos/08-anexos/04-glosario.html`)**: el comentario `<!-- M7-PENDIENTE: enlazar también 7.4
   (animar vértices) -->` de la entrada `g-vertex-shader` → enlazar a `../07-integracion/04-vertex-animacion.html#ondas-en-el-vertex-shader`.
   Además conviene añadir 7.4 a `span.ax-donde` de: `g-coordenadas-baricentricas` (#ver-la-malla-el-truco-baricentrico),
   `g-gl-vertexid` (#geometria-sin-buffers-gl-vertexid; su definición solo habla del triángulo de pantalla completa:
   añadir «con drawElements recibe el valor del índice»), `g-gl-pointsize` (#rejillas-de-puntos-el-modo-points:
   «en píxeles del búfer»), `g-vertice-provocador` y `g-flat` (#por-vertice-o-por-fragmento), `g-cache-post-transformacion`
   (#geometria-sin-buffers-gl-vertexid: sin índices el VS se ejecuta 6 veces por vértice), `g-reinicio-de-primitivas`
   (#la-materia-prima-un-plano-subdividido), `g-nyquist`/`g-aliasing` (#por-vertice-o-por-fragmento, bestiario
   `m7-4-aliasing-malla`), `g-normal` (#normales-que-la-luz-se-entere), `g-camara-orbital` (l74kit), `g-picking`
   (#deformar-con-el-raton-el-abombamiento: el rayo como alternativa matemática), `g-completitud` y `g-mipmap`
   (#terreno-desde-una-textura-el-vertex-shader-tambien-lee-texturas: en el VS se lee el nivel 0).
4. **`modulos/04-gpu/05-uniforms-varyings.html` l. 358**: «una rejilla de N × N quads … (fila = id / N, columna = id % N…)»
   es correcto para N elementos por fila, pero un lector que lo aplique a vértices de una rejilla de N × N celdas
   necesita N + 1. No es un error; si se toca, añadir «(N elementos por fila)».
5. **m7kit.js**: sin bugs que afecten a 7.4. Otro agente ha añadido `dtMax` al comentario de `crearApp` y una guarda
   en `destruir()` sin WebGL2: compatible con 7.4 por lectura del diff (no llegué a verificarlo en Chrome tras ese cambio).
6. **GLKit (`assets/js/glkit.js`)**: nada que corregir; nota menor: `crearTextura` devuelve `UNPACK_FLIP_Y_WEBGL` a
   `false` (7.4 lo explica y lo usa bien en el ejemplo 7.4.8).

## (e) Cajas bestiario de 7.4

Nueve cajas; los nueve `data-id` son únicos en todo el curso (grep de `data-id="…"`/`id="…"` en `modulos/**/*.html`:
una aparición cada uno) y llevan el prefijo `m7-4-` (cumple `m7-`). Ya están en `assets/js/datos-bestiario.js`.

| data-id | data-titulo | Síntoma del «Diagnóstico rápido» | Subsección de A.1 donde enlazarlo |
|---|---|---|---|
| `m7-4-indices-uint16` | Una rejilla grande sale sin su parte de arriba, con triángulos estirados o con un agujero en la esquina | otro (geometría rota) | «Geometría rota: triángulos que faltan, estirados o ajenos» (junto a `m4-indice-65535`) |
| `m7-4-normal-plana` | La malla ondula, pero la luz no cambia: se ve plana aunque se mueva | otro (iluminación) | «La iluminación sale mal» |
| `m7-4-normal-invertida` | La superficie sale oscura donde mira a la luz y clara donde le da la espalda | colores lavados/oscuros | «La iluminación sale mal» (y «Colores lavados, oscuros…») |
| `m7-4-epsilon` | Las normales por diferencias finitas salen con granulado o chispas (o empeoran con el tiempo) | parpadeo | «Parpadeo y manchas que van y vienen» y «Saltos al volver, tras una pausa o tras horas» |
| `m7-4-aliasing-malla` | Con olas cortas, la malla dibuja otra ola: más larga, torcida o que avanza hacia atrás | otro (aliasing de la geometría) | «Geometría rota…» (o «Borroso, pixelado o dentado») |
| `m7-4-cara-trasera` | Una tela (bandera, hoja, papel) se ve negra por detrás | colores lavados/oscuros | «La iluminación sale mal» |
| `m7-4-puntos-dpr` | Los puntos cambian de tamaño según la pantalla (o cuando baja la calidad) | otro (depende de la pantalla/DPR) | «Funciona en mi equipo y falla en otro» |
| `m7-4-heightmap-plano` | El terreno sale completamente plano (y no hay ningún error) | textura negra | «La textura sale negra, torcida o no se carga» y «Algo desaparece sin ningún error» |
| `m7-4-heightmap-escalones` | El terreno sale en terrazas, con escalones que la luz delata | borroso/pixelado (cuantización a 8 bits) | «Borroso, pixelado o dentado» |

## (f) Términos para el glosario A.4

Ancla = sección de `07-integracion/04-vertex-animacion.html` (ids generados por `curso.js` a partir de los `h2`/`h3`;
comprobados con su función `slug`). Ninguno existe aún en A.4.

| Término (inglés) | Definición de una línea | Ancla |
|---|---|---|
| plano subdividido, rejilla (*subdivided plane*, *grid mesh*) | Plano de N × N celdas partidas en dos triángulos: (N + 1)² vértices, 2N² triángulos y 6N² índices; el vértice (i, j) es el `j·(N+1) + i`. | `#la-materia-prima-un-plano-subdividido` |
| desplazamiento de vértices (*vertex displacement*) | Mover cada vértice en el vertex shader con una función del tiempo y de unos uniforms; la malla de la GPU no cambia nunca. | `#ondas-en-el-vertex-shader` |
| número de onda (*wavenumber*) | $k$ en $\sin(k\,x - \omega t)$: radianes por unidad de longitud; la longitud de onda es $2\pi/k$ y la onda avanza a $\omega/k$. | `#ondas-en-el-vertex-shader` |
| vectores tangentes (*tangent vectors*) | Derivadas de la posición de una superficie respecto a sus dos parámetros; su producto cruz, en el orden correcto, es la normal. | `#la-normal-sale-de-dos-tangentes` |
| derivada analítica (*analytic derivative*) | Derivada escrita a mano con la regla de la cadena; para $A\sin(k\,\mathbf d\cdot\mathbf p - \omega t)$ el gradiente es $A k\cos(\dots)\,\mathbf d$, y la normal $(-h_x, 1, -h_z)$. | `#derivada-analitica-exacta-y-casi-gratis` |
| diferencias finitas (*finite differences*) | Derivada aproximada con evaluaciones cercanas; la central $(h(x+\varepsilon) - h(x-\varepsilon))/2\varepsilon$ tiene error $O(\varepsilon^2)$, pero un ε demasiado pequeño en float32 da ruido por cancelación. | `#diferencias-finitas-la-derivada-por-la-fuerza-bruta` |
| superficie paramétrica (*parametric surface*) | Superficie dada como posición 3D $P(u, v)$ para cada punto del plano uv (una bandera); su normal es el producto cruz de $\partial P/\partial u$ y $\partial P/\partial v$. | `#una-bandera-al-viento` |
| alambre baricéntrico (*barycentric wireframe*) | Dibujar las aristas en el fragment shader con un varying que vale (1,0,0), (0,1,0), (0,0,1) en los vértices: un píxel está en una arista si alguna componente, medida en píxeles con `fwidth`, es casi 0. | `#ver-la-malla-el-truco-baricentrico` |
| coloración de tres colores (*3-coloring*) | Asignar 0, 1 o 2 a cada vértice compartido sin que ningún triángulo repita; en la rejilla de 7.4, `(i + 2j) mod 3` (con la otra diagonal, `(i + j) mod 3`). | `#ver-la-malla-el-truco-baricentrico` |
| `WEBGL_polygon_mode` | Extensión que dibuja solo las aristas de los triángulos (`polygonModeWEBGL(FRONT_AND_BACK, LINE_WEBGL)`); Chrome avisa de que casi no existe en móviles. | `#ver-la-malla-el-truco-baricentrico` |
| sombreado de Gouraud (*Gouraud shading*) | Calcular la luz por vértice e interpolar colores: barato, pero pierde los brillos más pequeños que un triángulo. | `#por-vertice-o-por-fragmento` |
| sombreado de Phong (*Phong shading*) | Interpolar la normal y calcular la luz por fragmento (renormalizando); no confundir con el modelo de brillo de Phong. | `#por-vertice-o-por-fragmento` |
| sombreado plano, facetas (*flat shading*, *low poly*) | Una normal por triángulo; en el fragment shader, `normalize(cross(dFdx(pos), dFdy(pos)))`, que además apunta siempre hacia la cámara. | `#por-vertice-o-por-fragmento` |
| Blinn-Phong | Brillo especular con el vector medio `H = normalize(L + V)`: `pow(max(dot(n, H), 0), s)`; más barato que reflejar la luz (enlazar también 3.2). | `#ejemplo-7-4-3-agua-con-tres-ondas` |
| término de Fresnel (aprox.) (*Fresnel term*) | Reflejo que crece al mirar rasante; aproximación barata `pow(1 − n·V, 4)` (0 de frente, 1 de canto). | `#ejemplo-7-4-3-agua-con-tres-ondas` |
| rayo del puntero (*picking ray*, *unproject*) | Del puntero al mundo: NDC (x, y, −1) y (x, y, 1) por la inversa de proyección × vista, divididos por w, dan dos puntos del rayo; se corta con un plano. | `#deformar-con-el-raton-el-abombamiento` |
| doble implementación (CPU/GPU) | La misma función de deformación en GLSL y en JavaScript, con el mismo reloj, para que la CPU sepa dónde están los vértices (selección, física, descarte). | `#deformar-con-el-raton-el-abombamiento` |
| descarte por visibilidad (*frustum culling*) | El motor no dibuja objetos cuya esfera envolvente (de los vértices sin deformar) cae fuera de la cámara; en Three.js, `frustumCulled = false` para mallas desplazadas en el shader. | `#deformar-con-el-raton-el-abombamiento` |
| VAO vacío, geometría sin buffers (*bufferless rendering*) | Dibujar con un VAO sin atributos y calcular cada vértice a partir de `gl_VertexID` (y `gl_InstanceID`). | `#geometria-sin-buffers-gl-vertexid` |
| `gl_PointCoord` | En el fragment shader de un punto, la posición dentro de su cuadrado (0..1); con `discard` fuera del círculo se hacen puntos redondos. | `#rejillas-de-puntos-el-modo-points` |
| mapa de alturas (*heightmap*) | Textura en escala de grises que da la altura de cada punto de un terreno; con 8 bits solo hay 256 alturas (terrazas). | `#terreno-desde-una-textura-el-vertex-shader-tambien-lee-texturas` |
| lectura de texturas en el vertex shader (*vertex texture fetch*) | `texture()` en el VS lee siempre el nivel 0 (no hay derivadas); para otro nivel, `textureLod`; WebGL2 garantiza 16 unidades (`MAX_VERTEX_TEXTURE_IMAGE_UNITS`). | `#terreno-desde-una-textura-el-vertex-shader-tambien-lee-texturas` |
| `textureLod` | Lectura de textura con el nivel de mipmap explícito; la única forma de usar mipmaps en el vertex shader (la versión con sesgo de `texture` no existe allí). | `#terreno-desde-una-textura-el-vertex-shader-tambien-lee-texturas` |
| `OES_texture_float_linear` | Extensión necesaria para filtrar con LINEAR texturas de 32 bits por canal (R32F…); sin ella la textura está incompleta y lee 0. `R16F` se filtra sin pedir nada. | `#terreno-desde-una-textura-el-vertex-shader-tambien-lee-texturas` |

## (g) Verificación final

- **Antes de corregir** (`verificar.mjs … --soluciones --capturas`, Chromium 141 + SwiftShader): ✓ sin problemas;
  glsl=0 js=13 demo=1 ejemplos=8 ejercicios=5 quiz=5 anotado=6 callouts=19 bestiario=9 senior=5 h2=12,
  ~20 000 palabras, 5 soluciones que se ejecutan sin error. Mínimos de la guía §6: cumplidos de sobra.
- Capturas revisadas (verificador y mi primer script, ventana de 1000 px): 7.4.3 (los cuatro modos), 7.4.4, 7.4.6 y soluciones de 7.4.1,
  7.4.2 (negro = bien), 7.4.3 (0 de 288) y 7.4.5 (anillos en la geometría; consola 1, 2, 3) se ven como dice el
  texto; demo 2D correcta. Las de 7.4.1, 7.4.2, 7.4.5, 7.4.7 y 7.4.8 salieron en blanco por el problema de capturas
  descrito en (d) 1, no por la lección (la línea `info` del iframe sí se actualiza: 7.4.1 «625 vértices…»,
  con N = 300 + Uint16 «90601 vértices · 180000 triángulos · 540000 índices en Uint16Array»; 7.4.7 «búfer 736×360 …
  19600 puntos» y a la mitad «368×180 · 0.50»).
- `enlaces.mjs` tras la mayoría de las correcciones: 62 enlaces internos, 0 rotos (incluidos los nuevos a 6.6
  `#medir-coste-shader`, 7.5 `#enfoque-3-transform-feedback`, 4.4 `#m4-indice-65535` y 4.5 `#gl-vertexid-dibujar-sin-buffers`).
- **Comprobado en este Chromium** (scripts en `herramientas/estado/lab/rev-m7-4-exp-*.mjs`): `Uint16Array([65535,
  65536, 70000])` → `[65535, 0, 4464]`; rejilla plana N = 300 con Uint16 en 256 × 256 → 47 305 píxeles (el M1
  midió 47 306), con Uint32 65 536, sin `getError`; N = 255 con Uint16 forzado → 65 535 (falta exactamente el
  triángulo del vértice 65 535); `gl_VertexID` con `drawElements` e índices [5, 9, 2] → 5, 9, 2; mensaje de enlace
  «Precisions of uniform 'u_modo' differ between VERTEX and FRAGMENT shaders.» idéntico y `highp int` lo arregla;
  en el VS `texture()` lee el nivel 0, `textureLod` 1 y 2 leen los niveles 1 y 2, `texture(t, uv, 1.0)` no compila
  («'texture' : no matching overloaded function found»), textura incompleta → (0,0,0,1) y `texelFetch` → ceros,
  R32F+LINEAR sin `OES_texture_float_linear` → 0 y con ella 0,5, R16F filtra sin extensión; vértice provocador =
  el último (drawArrays → vértice 2; índices [1,2,0] → vértice 0); `gl_FrontFacing` true antihorario / false
  horario y `cross(dFdx, dFdy)` apunta a la cámara en los dos; `gl_PointSize = 10` en un canvas 256×256 mostrado a
  128×128 CSS → 100 píxeles del búfer; aviso de consola de `WEBGL_polygon_mode` idéntico al citado.
- **Después de corregir: NO hay verificación final con `verificar.mjs` ni `movil.mjs`** (parada ordenada del
  coordinador mientras esperaba turno de Chrome). Ver «Dónde me quedé».

## Dónde me quedé (sesión 3)

**(a) Hecho y verificado.** Revisión completa de la lección (texto, código, cuentas, enlaces, promesas de otras
lecciones, bestiarios, coherencia con 3.2/3.5/4.4/4.5/5.3/5.6/6.3/6.6/7.1/7.2/7.3/7.5). Verificación inicial sin
problemas y experimentos de (g) hechos. `enlaces.mjs` (0 rotos) pasado tras casi todas las ediciones.

**(b) Hecho pero SIN verificar tras la última edición.** `modulos/07-integracion/04-vertex-animacion.html` (todas las
ediciones de (a); las últimas, sin pasar ni `enlaces.mjs`: requisitos «+ 7.2», `N / (N + 1)` en el anotado de
`crearRejilla`, párrafo «Ojo con lo de "uno por texel"» del ejemplo 7.4.8, KaTeX `$T \cdot R\,\vec v$` en la
solución del ejercicio 7.4.4, caja senior de l74kit con `{ sinUV: true }`, `WEBGL_polygon_mode` «reciente») y
`modulos/07-integracion/recursos/l74kit.js` (solo comentarios de cabecera; el código no se tocó). Las ediciones son
de texto dentro de `<p>`, `<li>` y `<td>` ya existentes; no he dejado ninguna a medias.
Para cerrar: `cd herramientas && node enlaces.mjs ../modulos/07-integracion/04-vertex-animacion.html` y
`node verificar.mjs ../modulos/07-integracion/04-vertex-animacion.html --soluciones --tema light --capturas <dir>`
(+ `node movil.mjs …`). Esperado: 0 problemas (los cambios no tocan código ejecutable). Para mirar los playgrounds JS
usar `herramientas/estado/lab/rev-m7-4-capturas.mjs` (ventana de 1400 px; pasada oscura con interacciones, clara y
390 px), no las capturas del verificador ((d) 1).

**(c) Pendiente, en orden.**
1. Verificación final de (b) (comandos arriba) y mirar las capturas en claro y a 390 px (no llegué a verlas).
2. En el M1: `node herramientas/estado/lab/rev-m7-4-tiempos.mjs --json /tmp/t74.json` y sustituir en 7.4 las cifras de
   GPU según la tabla de (c): primera tabla de «La silueta no miente» (columna «Vertex shader: dibujo completo» y el
   párrafo siguiente, que ahora dice «orientativa»), tabla A/B/C de «Geometría sin buffers» (+ párrafo «La variante B
   empata…» y frase «Vale la advertencia…») y las dos viñetas del resumen («1,1 ms con nuestro método…», «unas 2,5
   veces más lento…»). Ojo: el script usa un plano de 6 × 6 y una cámara propia; si se quiere la escena exacta del
   autor, no existe (su script se perdió).
3. Tabla del ε (sección «Diferencias finitas»): re-medir en el M1 con las ondas de la lección (ver (b) 2) o añadir
   que es otra superficie de tres senos más empinada.
4. Bandera (ejemplo 7.4.5, paso 2 del «Paso a paso»): la estimación «unos pocos grados tras una hora» es mía;
   confirmar con transform feedback en el M1 (t = 3600, función `bandera`) y poner la cifra.
5. Coherencia m7 (§3.6): decidir si `m7-4-indices-uint16` pasa a `callout nota` (duplica `m4-indice-65535`).
6. A.1: enlazar los nueve `m7-4-*` en el «Diagnóstico rápido» según la tabla de (e). A.4: añadir los términos de (f)
   y los enlaces a 7.4 de (d) 3.
7. Comprobar desde el Mac el enlace externo a codeflow.org ((b) 3).

**(d) Scripts y resultados** (el SCRATCH se borrará; copiados a `herramientas/estado/lab/`):
- `rev-m7-4-tiempos.mjs`: laboratorio de tiempos para el M1 (método fiable + antiguo + CPU). Terminado y con la
  sintaxis comprobada (`node --check`); **no llegué a ejecutarlo ni con `--rapido`** (cola de Chrome), así que puede
  tener algún fallo de ejecución: probarlo primero con `--rapido`.
- `rev-m7-4-exp-semantica.mjs` y `rev-m7-4-exp-vertexid-polygonmode.mjs`: experimentos de semántica de (g)
  (ejecutados; resultados en (g)). En el primero, la prueba de `gl_VertexID` con transform feedback + `drawElements`
  da INVALID_OPERATION (WebGL2 no permite `drawElements` con transform feedback activo): por eso existe el segundo,
  que lo comprueba con puntos.
- `rev-m7-4-eps-memoria.mjs` (node, sin Chrome): error de truncamiento con las ondas de la lección y tabla de
  memoria por N.
- `rev-m7-4-capturas.mjs`: capturas con interacciones (7.4.1 con N = 300 + Uint16 y N = 8, k = 10; modos de 7.4.2,
  7.4.3, 7.4.4, 7.4.5 y 7.4.7; soluciones), pasada en tema claro (diagramas, tablas, demo, callouts) y a 390 px.
  Las rutas de importación son absolutas a `/home/user/shaders-learning` y al Chromium del contenedor; ejecución:
  `node rev-m7-4-capturas.mjs <dir> dark 1280 1400`. La última ejecución se interrumpió por la parada.
