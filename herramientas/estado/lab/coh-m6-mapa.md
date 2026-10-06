# Mapa del módulo 6 (coh-m6)

## 6.1 GLSL ES 3.00: el lenguaje (req 3.1, 3.4, 3.7, 5.2)
- Def: #version 1.ª línea; precisión (frag sin float por defecto, int mediump, samplers lowp); literales; sin conversiones implícitas; constructores; swizzles; v*M = transpose(M)*v; in/out/inout (out empieza indefinido, 0 en Chrome); índice dinámico fuera de rango: ANGLE recorta; preprocesador; código muerto/plegado/inlining/fast math; ANGLE→MSL.
- Cifras: round(2.5)=3; −7/2=−3; −7%5=−2; int 7/0=7; 1<<32=1; int(3e9)=2 147 483 520; gl_MaxDrawBuffers 8, gl_MaxTextureImageUnits 16; mediump int (−2^15, 2^15) en spec; out float en RGBA8 → (128,255,19,21).
- mod(x,7): 39 en −500…999 499; 43 682 en ±500 000; 0 con y=5 → enlaza 6.5 #cuando-falla-mod. OK con hecho 3.
- isnan: tabla col. «con isnan (compilado por primera vez)», JS playground con comentario único, l.838 caché → 6.6. OK con hecho 1.
- Promesas: 6.2 (pensar en paralelo, aspecto, depurar pintando), 6.3 (fwidth), 6.10 (GLSL 1.00, bucles, Shadertoy), A.2.
- Derivadas: 6.2 (quads, dFdx), 6.3 (fwidth).

## 6.2 Pensar como un fragment shader (req 6.1, 3.1, 3.4, 3.5)
- Def: f pura; gl_FragCoord (px físicos, centro .5, origen abajo-izq, desde la ventana no el viewport); 4 normalizaciones; p=(2fc−r)/r.y; px = 2/r.y; v_uv vs gl_FragCoord; u_mouse (px físicos, origen abajo, empieza en el centro; vec4 .z=1 pulsado); depurar con color (tabla, NaN con isnan + caché ✓); máscaras (producto, max, 1−m, mix); transformar espacio = inversa (T R S → q=R(−θ)(p−c)/s); fract/floor adelanto 6.5; dFdx/dFdy quads 2×2 → 6.3 fwidth.
- Cifras: v_uv vs fc/r ≤1.2e−7; dFdx(x²)=2,2,6,6; quiz 1200×400 → 2.9975.
- rot(a)=mat2(c,s,−s,c) antihorario.
- Bestiarios: m6a-fragcoord-viewport, m6a-circulo-estirado, m6a-espacios-mezclados, m6a-depurar-saturado; nota m6a-orden-espacio (→ m3-orden-transformaciones ✓).
- Promesas: 6.3 (fwidth, AA, escala distancias), 6.5 (repetición, polar), módulo 7 (v_uv objeto), 5.8 ping-pong.

## 6.3 Formas, SDF 2D y AA (req 6.2, 3.2, 3.4)
- Def: SDF (neg dentro); sdCaja (derivación); inflar d−r; anillo abs(d)−w; segmento (proyección 3.2); cobertura clamp(0.5−d/px,0,1); px=2/r.y o fwidth(d); fwidth = |dFdx|+|dFdy| (L1, 1.03 vs 1.40 a 45°); derivadas en ramas no uniformes indefinidas (5.5 vs 10.5; textura 3.6e18/−4.8e32); efectos (sombra, glow exp, contorno); booleanas min/max/max(a,−b); smin polinómico (k ancho, k/4); escalar sdf(p/s)*s; exacta vs cota; 6.9 raymarching.
- Bestiarios: m6a-borde-fijo, m6a-derivadas-rama, m6a-smin-k-cero, m6a-escala-sdf.
- Promesas: 6.5 (repetición polar, formas cortadas), 6.9 (raymarching, cota).

## 6.4 Color (req 6.2, 2.4, 5.5)
- Def: operaciones; HSV (suave Quilez); paleta coseno; sRGB (0.5→0.214; 128→0.216; mitad luz 0.735/188); regla decodifica/lineal/codifica; exacta 2.4 vs pow 2.2; SRGB8_ALPHA8 textura (antes del filtrado) y FBO; drawingBufferColorSpace "srgb"; drawingBufferStorage; lineal en 8 bits (26 vs 90 niveles); luminancia 709 vs luma 601; exposición/saturación lineal, contraste sRGB; Reinhard + extendido; dithering ±0,5 niveles (un nivel de ancho) ✓; triangular ±1.
- Bestiarios: m6a-luz-codificada, m6a-mipmap-oscuro, m6a-doble-gamma, m6a-bandas-lineales, m6a-recorte-tono.
- Promesas: 6.9 (raymarching usa aproximación pow), 7.3 #fundido-en-srgb-y-en-luz, 6.6 (24 bits PCG), 5.8 (RGBA16F extensiones).
- Hash: PCG 3.7 (azar).

## 6.5 Patrones (req 6.2, 6.3, 3.4)
- Def: esqueleto g=p*N, id=floor, q=fract−0.5, pxq=px*N; precisión lejos (0.0625 hacia 1e6, 1 hacia 1e7); hash12 Hoskins caja negra → 6.6; espejo tri; ladrillos; damero (3.4.3 ✓); polar (atan (−π,π]); caleidoscopio; costura n no entero (gira con q); costura fwidth(atan) 6.25 vs 0.035; Truchet; hexágonos 2 rejillas; vecinos 3×3 (Worley → 6.6); muaré (Nyquist, 5.5 #m5-muare); damero filtrado; zoom infinito; hack mod (#cuando-falla-mod: «¿Cuándo falla mod?» es un párrafo, la caja se titula «Un patrón que se repite sin costuras en una textura»); fract puede dar 1.0 (fast math) / 0.99999994 (sin).
- Bestiarios: m6a-cuartos-esquinas, m6a-patron-lejos, m6a-costura-fwidth, m6a-formas-cortadas, m6a-muare-procedural.

## 6.6 Ruido (req 3.4, 3.7, 6.3–6.5)
- Def: hash (5 requisitos); seno (17 vs >1000 valores con isnan; caché ✓ hecho 1); bestiario m6b-hash-fastmath (caso distinto de m3-isnan-heisenbug: la caché); Hoskins (hash12 = el de 6.5; media 0,497…); PCG (Jarzynski-Olano; highp int; 24 bits >>8; /4294967295 → 1.0); tabla hashes (1× / 0,9× / 3×); ruido blanco (grano 6.8, dithering 6.4); value noise 1D/2D; fade C0/C1/C2; gradient (−0,695/0,691; 3D −0,75/0,78); simplex; fbm (rotación 37° mat2(0.8,0.6,−0.6,0.8)); octavas útiles (fwidth 6.3, muaré 6.5 ✓); nubes (altura → 6.2 ✓); turbulencia 0,17/0,39; ridged; warping (18 ms 2560×1600; 36 ms 4K); desplazar/evolucionar (1,4×); bucle → 6.7; retícula periódica (mod 6.1/6.5 ✓; −128..127: 8 fallos); textura (0,8/2,9/5,9 ms; 257 valores); tabla de coste; fbm 0,8/3,1/5,9/8,8 ms; senior #medir-coste-shader.
- PROBLEMAS: l.178 «como verás en 6.10» (getShaderPrecisionFormat) → ya en 6.1 senior; l.946 «la caja «¿Cuándo falla mod?» de 6.5» (la caja se titula de otro modo); l.1454 resumen «más caro en algunas» vs tabla ≈3×; l.114 «256 niveles … también al recargar» ¿medido tras el arreglo? (pendiente M1).
- Promesas: 6.8 (grano), 6.7 (bucles, u_frame), 6.10 (MIT/licencias, GLSL 1.00 bucles), 5.8 (media resolución, R16F).
- Bestiarios: m6b-hash-fastmath, m6b-ruido-parpadea, m6b-ruido-rejilla, m6b-fbm-origen, m6b-ruido-textura-escalones.

## 6.7 Animar en el shader (req 2.3, 2.4, 3.4, 6.3, 6.6)
- Def: color=f(p,t); u_time del editor (dt ≤ 0,1 s, GLKit.bucle 5.4 ✓); sin/fract/floor; bucles perfectos (s=fract(t/T), multiplicadores enteros); easings (back 1,10; elastic 1,00049); reinicio/ping-pong/pausas; stagger (fract de negativo «en [0,1)» l.378: sin la letra pequeña de 6.5); tramo(); ventanas (smoothstep(a,a) indefinido 3.4); rueda 42°/45°; motion blur; tiempo crece (0,0078 s/día; 0,031 s/4 días); u_frame vs u_time (2.3 m2-velocidad-depende-hz); shader vs JS; ejemplo muelle (Euler semi-implícito ✓ grafía).
- Bestiarios: m6b-bucle-salta, m6b-desfase-fract, m6b-rueda-atras, m6b-u-frame-hz.
- Promesas: 6.10 (arrays con constructor en 1.00), 7.1, 7.3, 7.4, 6.9.

## 6.8 Efectos con texturas (req 5.5, 5.8, 6.2, 6.4, 6.6)
- Def: imagen como función; editores 512, LINEAR+mipmaps, REPEAT, FLIP_Y; contain/cover; texture vs texelFetch (fuera de rango → 0 WebGL2 ✓, sin cita con enlace); textureSize; zoom divide / tirar no empujar (inversa); giro en espacio cuadrado; distorsiones; aberración cromática; pixelado (escalera 6.7); color (luminancia 709 sobre sRGB: senior lo matiza); sepia (1.35,1.2,0.94 ✓ 6.4); kernels; Sobel; coste 5,4/14,3/39 ms; separable (5.8.5 ✓) 1,65 ms; caché 6,3/29/213 ms; Rákos; bordes REPEAT/CLAMP; MIRRORED_REPEAT desde WebGL1; mipmaps y costuras (2 992 px); textureGrad; viñeta y grano (floor(t*24)); Bayer 12,5 %…
- Bestiarios: m6b-imagen-estirada, m6b-rotar-deforma, m6b-distorsion-invertida, m6b-borde-desenfoque, m6b-costura-mipmap.

## 6.9 Raymarching (req 3.2, 3.3, 3.6, 5.6, 6.3, 6.6)
- Def: rayo por píxel (f=1/tan(fov/2)); base de cámara (lookAt degenerado 3.6 ✓); sphere tracing (Hart 1996); EPSILON/T_MAX/pasos; SDF 3D; senior exacta/cota/escala (#m6a-escala-sdf ✓)/Lipschitz; smin (k/4); materiales vec2; normales (e: 1e−6 casi nada; 2e−7 grano; 1e−7 rotas); tetraedro (0,013°; 26°); Lambert, sombras k·h/t, AO, niebla, gamma pow 1/2.2 (6.4 ✓ anchor #el-0-5-que-no-es-la-mitad-srgb); mapa de calor (25/20 pasos); factor; 0,8 hack; épsilon relativo; coste 2,3 ms / 3,3 ms; repetición mod; cámara orbital (5.6).
- Bestiarios: m6b-rm-acne, m6b-rm-normales, m6b-rm-agujeros, m6b-rm-halo, m6b-rm-repeticion (≈ m6a-formas-cortadas en 3D: enlaza a 6.5; 6.5 no enlaza de vuelta), m6b-rm-nada.
