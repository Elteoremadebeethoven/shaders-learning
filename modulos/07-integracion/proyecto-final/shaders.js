/* =====================================================================
   shaders.js — el código GLSL del hero, como cadenas de JavaScript.
   ---------------------------------------------------------------------
   ¿Por qué cadenas y no archivos .vert/.frag? Porque desde file:// no se
   puede hacer fetch() de archivos locales (1.7). Las comillas invertidas
   (template literals) permiten escribir el shader en varias líneas; el
   comentario «glsl» que va delante de cada una no cambia nada para
   JavaScript, pero algunos editores lo usan para colorear el GLSL (7.1).
   Expone un único global: window.ShadersHero = { vertice, fragmento }.
   ===================================================================== */
(function (raiz) {
  "use strict";

  /* Un triángulo que cubre toda la pantalla, sin buffers: los vértices salen
     de gl_VertexID (el índice del vértice, 0, 1 y 2). Es el mismo de 7.1. */
  const vertice = /* glsl */ `#version 300 es
void main() {
  vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);
}`;

  const fragmento = /* glsl */ `#version 300 es
precision highp float;

// ---------- Lo que llega de JavaScript (todo lo calcula el estado; el shader solo traduce) ----------
uniform vec2  u_resolution;  // tamaño del búfer en px
uniform float u_escala;      // px del búfer por px CSS (DPR, límites y calidad incluidos)
uniform float u_time;        // s del reloj de la app (se congela con la pausa y el movimiento reducido)
uniform float u_entrada;     // 0 → 1 durante la entrada, sincronizado con el texto
uniform float u_scroll;      // 0: hero entero en pantalla · 1: hero fuera por arriba (suavizado)
uniform vec2  u_mouse;       // puntero suavizado, px del búfer, origen ABAJO a la izquierda
uniform float u_raton;       // 0..1: intensidad del remolino (sube al entrar el puntero, baja al salir)
uniform float u_progreso;    // 0 = diapositiva A · 1 = diapositiva B (lo mueve un muelle)
uniform vec3  u_colA[3];     // paleta A: fondo, cuerpo, luz
uniform vec3  u_colB[3];     // paleta B
uniform vec4  u_boton;       // botón principal: x, y (esquina abajo-izquierda), ancho, alto (px del búfer)
uniform float u_pulso;       // 0..1: latido del botón, calculado en JavaScript con el mismo reloj
uniform float u_reducir;     // 1.0 = el usuario prefiere menos movimiento

out vec4 fragColor;

// ---------- Ruido de gradiente y fbm (6.6) ----------
float hash12(vec2 p) {                        // hash de Hoskins: 2 números → 1 en [0, 1)
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 gradiente(vec2 e) {                      // un vector unitario pseudoaleatorio por esquina
  float a = 6.2831853 * hash12(e);
  return vec2(cos(a), sin(a));
}
float ruido(vec2 p) {                         // gradient noise 2D, más o menos en [-0.7, 0.7]
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);   // fade quíntico: continuo hasta la 2.ª derivada
  float a = dot(gradiente(i), f);
  float b = dot(gradiente(i + vec2(1, 0)), f - vec2(1, 0));
  float c = dot(gradiente(i + vec2(0, 1)), f - vec2(0, 1));
  float d = dot(gradiente(i + vec2(1, 1)), f - vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const int OCTAVAS = 4;                        // el fondo es suave: 4 octavas bastan (y cuestan poco)
const mat2 ROTAR = mat2(0.8, 0.6, -0.6, 0.8); // unos 37°: las rejillas de las octavas no coinciden
float fbm(vec2 p) {
  float suma = 0.0, amplitud = 0.5;
  for (int k = 0; k < OCTAVAS; k++) {
    suma += amplitud * ruido(p);
    p = ROTAR * p * 2.0 + vec2(17.3, 5.9);    // más frecuencia, girada y desplazada (bestiario de 6.6)
    amplitud *= 0.5;
  }
  return suma;
}

// De un valor del flujo y una «luz» a un color, con los tres colores de una diapositiva.
vec3 paleta(vec3 c[3], float v, float luz) {
  vec3 col = mix(c[0], c[1], smoothstep(-0.3, 0.45, v));
  return col + c[2] * luz;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;   // 0..1 en el lienzo (para la viñeta y la transición)
  float alto = u_resolution.y;

  // 1. Un espacio común para el píxel y el puntero: alturas del lienzo con el origen en el centro
  //    (círculos redondos con cualquier aspecto, 6.2). El canvas sube con la página; el dibujo, la
  //    mitad: sumarle media altura por cada hero desplazado lo hace bajar respecto al canvas (parallax).
  vec2 parallax = vec2(0.0, 0.5 * u_scroll);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / alto + parallax;
  vec2 m = (u_mouse - 0.5 * u_resolution) / alto + parallax;

  // 2. El remolino: giramos el espacio alrededor del puntero, más cuanto más cerca (campana gaussiana).
  //    El radio son 200 px CSS pasados a alturas con u_escala: mide lo mismo con cualquier DPR.
  vec2 d = p - m;
  float radio = 200.0 * u_escala / alto;
  float giro = u_raton * mix(2.4, 0.6, u_reducir) * exp(-dot(d, d) / (radio * radio));
  float cg = cos(giro), sg = sin(giro);
  p = m + mat2(cg, sg, -sg, cg) * d;

  // 3. El flujo: un fbm evaluado en un espacio deformado por otros dos (domain warping, 6.6).
  //    El tiempo empuja las entradas de q en sentidos distintos: las formas se retuercen como tinta.
  vec2 x = p * 1.6;
  float t = u_time * 0.07;
  vec2 q = vec2(fbm(x + vec2(0.0, t)), fbm(x + vec2(5.2, 1.3) - vec2(t, 0.0)));
  float v = fbm(x + 2.6 * q + vec2(1.7, 9.2) + vec2(0.4 * t, -0.9 * t));
  float luz = smoothstep(0.25, 0.85, length(q) * 1.6 + 0.5 * v);

  // 4. Dos paletas sobre el MISMO flujo (se calcula una vez) y la transición entre ellas.
  //    Cada píxel tiene un umbral n en [0, 1]: la mitad es su posición x (la transición barre de
  //    izquierda a derecha) y la otra mitad, ruido (el borde es irregular). El píxel cambia cuando
  //    el progreso, estirado a [0, 1 + ANCHO], supera su umbral: así en 0 no ha cambiado nadie y en
  //    1 han terminado todos (bestiario de la lección 7.6).
  vec3 colA = paleta(u_colA, v, luz);
  vec3 colB = paleta(u_colB, v, luz);
  float n = clamp(0.55 * uv.x + 0.45 * (0.5 + ruido(p * 3.0 + 11.0)), 0.0, 1.0);
  const float ANCHO = 0.15;
  float mezcla = smoothstep(n, n + ANCHO, u_progreso * (1.0 + ANCHO));
  mezcla = mix(mezcla, u_progreso, u_reducir);             // movimiento reducido: fundido sin frente
  vec3 col = mix(colA, colB, mezcla);
  float frente = 4.0 * mezcla * (1.0 - mezcla);            // 0 lejos del frente, 1 justo en él
  col += (1.0 - u_reducir) * 0.6 * frente * frente * mix(u_colA[2], u_colB[2], mezcla);

  // 5. El halo del botón principal: su rectángulo llega del DOM en cada frame (7.2). SDF de una
  //    caja con esquinas redondeadas (6.3); el radio de esquina es medio alto: una píldora.
  if (u_boton.z > 0.0) {
    vec2 b = 0.5 * u_boton.zw;
    vec2 k = abs(gl_FragCoord.xy - (u_boton.xy + b)) - b + b.y;
    float db = length(max(k, 0.0)) + min(max(k.x, k.y), 0.0) - b.y;
    float halo = exp(-max(db, 0.0) / (34.0 * u_escala)) * (0.16 + 0.5 * u_pulso);
    col += halo * mix(u_colA[2], u_colB[2], mezcla);
  }

  // 6. Entrada, scroll y viñeta: tres multiplicadores de brillo.
  col *= 0.12 + 0.88 * u_entrada;
  col *= 1.0 - 0.6 * u_scroll;
  vec2 cv = uv - 0.5;
  col *= 1.0 - 0.6 * dot(cv, cv);

  // 7. Dither: ±medio escalón de 8 bits de ruido fijo. Rompe las bandas de los degradados oscuros.
  col += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}`;

  raiz.ShadersHero = { vertice: vertice, fragmento: fragmento };
})(window);
