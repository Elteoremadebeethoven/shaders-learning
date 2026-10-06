/* =====================================================================
   hero.js — el hero interactivo (proyecto final, lección 7.6)
   ---------------------------------------------------------------------
   Depende de motor.js (window.Motor) y de shaders.js (window.ShadersHero),
   que index.html carga antes. Léelo en orden, de 1 a 8: es el mismo orden
   en que la lección lo construye.

   Reparto (7.1): los eventos solo anotan en el estado; actualizar() lee el
   layout y avanza el estado; dibujar() escribe el DOM y dibuja la capa GL.
   Un único bucle y un único reloj para el DOM y la GPU.
   ===================================================================== */
(function () {
  "use strict";
  const { Muelle, Puntero, suavizar, ponerUniform } = Motor;

  /* ---------- 1. Referencias al DOM y parámetros de la URL ---------- */
  const hero = document.getElementById("hero");
  const lienzo = hero.querySelector(".hero-lienzo");
  const diapositivas = Array.from(hero.querySelectorAll(".diapositiva"));
  const botonesDiapo = Array.from(hero.querySelectorAll("[data-ir]"));
  const botonPausa = hero.querySelector(".hero-pausa");
  const cta = hero.querySelector(".boton-principal");
  const capasCSS = Array.from(hero.querySelectorAll(".hero-alternativa .capa"));
  const contenido = hero.querySelector(".hero-contenido");
  const url = new URLSearchParams(location.search);   // ?reducir · ?sinwebgl · ?depurar
  const panel = url.has("depurar") ? hero.querySelector(".hero-depuracion") : null;

  /* ---------- 2. Datos ---------- */
  // Una paleta por diapositiva: fondo, cuerpo y luz (RGB de 0 a 1). Son 9 floats porque el shader
  // los recibe como uniform vec3 u_colX[3] (uniform3fv con 3·3 valores, 7.2).
  const PALETAS = [
    new Float32Array([0.020, 0.024, 0.070, 0.15, 0.13, 0.46, 0.22, 0.56, 0.90]),   // 01 · Tinta
    new Float32Array([0.045, 0.012, 0.020, 0.46, 0.10, 0.16, 0.95, 0.50, 0.20]),   // 02 · Brasas
  ];
  const ENTRADA_S = 1.6;   // s que dura la entrada: texto (WAAPI) y fondo (u_entrada) a la vez
  const LATIDO_S = 3;      // s entre latidos del botón principal: onda del DOM y halo del shader

  /* ---------- 3. Estado: lo mínimo para dibujar el siguiente frame (7.1) ---------- */
  const estado = {
    objetivo: 0,           // diapositiva pedida: 0 (A) o 1 (B)
    // El progreso de la transición es un muelle crítico: ζ = 15,5 / (2·√60) ≈ 1, ω₀ = √60 ≈ 7,7 rad/s,
    // así que llega al 99 % en unos 0,86 s sin pasarse (2.5). Si lo interrumpes, conserva la velocidad.
    progreso: new Muelle({ rigidez: 60, amortiguamiento: 15.5 }),
    scroll: 0,             // 0: hero entero en pantalla · 1: ha salido por arriba
    scrollSuave: 0,
    raton: 0,              // intensidad del remolino: 1 con el puntero dentro, 0 fuera (suavizada)
    reducir: false,        // prefers-reduced-motion (o ?reducir en la URL)
    pausa: false,          // el botón «Pausar animación»
    rectLienzo: null,      // rectángulos leídos al principio del frame (paso «leer»)
    rectBoton: null,
  };
  // El puntero se escucha en la sección, no en el canvas: el canvas tiene pointer-events: none para
  // que los clics lleguen al texto y a los botones de encima (7.2).
  const puntero = new Puntero(hero, { semivida: 0.08 });

  /* ---------- 4. Animaciones del DOM que obedecen a NUESTRO reloj ----------
     Se crean y se pausan al momento: a partir de ahí, su posición (currentTime, en ms) la fija
     dibujar() en cada frame con el reloj de la app (7.1). Así la pausa, el movimiento reducido y la
     pausa fuera de pantalla les afectan igual que al shader. Y si este script no llega a ejecutarse,
     estas animaciones no existen: el texto se ve tal cual (el estado «oculto» lo pone JavaScript). */
  const deEntrada = [];
  function entrada(selector, retardoMs) {
    for (const el of hero.querySelectorAll(selector)) {
      const a = el.animate(
        [{ opacity: 0, transform: "translateY(22px)" }, { opacity: 1, transform: "none" }],
        // fill: 'backwards' aplica el primer fotograma durante el retardo; al terminar no deja nada
        // «pegado» (el estilo normal manda otra vez: bestiario de fill: forwards, 2.7).
        { duration: 800, delay: retardoMs, easing: "cubic-bezier(.2, .7, .2, 1)", fill: "backwards" });
      a.pause();
      deEntrada.push(a);
    }
  }
  entrada(".hero-cabecera", 0);
  entrada(".antetitulo", 150);
  entrada(".diapositiva h2", 280);
  entrada(".entradilla", 450);
  entrada(".hero-acciones", 620);
  entrada(".hero-selector", 760);
  entrada(".hero-pie", 900);
  // El instante en que ya ha terminado la última (retardo + duración), para saltar ahí directamente.
  const FIN_ENTRADA = Math.max(...deEntrada.map((a) => a.effect.getComputedTiming().endTime));

  // El latido del botón principal: una onda que se expande y se apaga, cada LATIDO_S segundos.
  const latido = cta.querySelector(".boton-onda").animate(
    [{ opacity: 0, transform: "scale(1)" }, { opacity: 0.7, transform: "scale(1)", offset: 0.04 }, { opacity: 0, transform: "scale(1.12, 1.6)" }],
    { duration: LATIDO_S * 1000, iterations: Infinity, easing: "cubic-bezier(.2, .6, .3, 1)" });
  latido.pause();

  // Una animación escrita en CSS (el indicador «↓», @keyframes en estilos.css) también se puede
  // pasar al reloj: getAnimations() devuelve sus objetos CSSAnimation (2.7). OJO: si una media query
  // la quita y la vuelve a poner (movimiento reducido), el navegador crea OTRA, que nace en marcha:
  // por eso se vuelve a capturar cada vez que cambia la preferencia.
  const indicador = hero.querySelector(".hero-indicador");
  let deCSS = [];
  function capturarCSS() {
    deCSS = indicador.getAnimations();
    for (const a of deCSS) a.pause();
  }

  /* ---------- 5. Eventos: solo anotan en el estado (y despiertan al bucle) ---------- */
  for (const b of botonesDiapo) {
    b.addEventListener("click", () => { estado.objetivo = Number(b.dataset.ir); bucle.pedirFrame(); });
  }
  botonPausa.addEventListener("click", () => {
    estado.pausa = !estado.pausa;
    bucle.reloj.pausado = estado.pausa;          // pausa del TIEMPO: el puntero sigue respondiendo
    bucle.pedirFrame();
  });
  const consulta = matchMedia("(prefers-reduced-motion: reduce)");
  function aplicarPreferencia() {
    estado.reducir = consulta.matches || url.has("reducir");
    bucle.reloj.escala = estado.reducir ? 0 : 1;   // el flujo se congela; la interacción sigue (7.2)
    capturarCSS();
    bucle.pedirFrame();
  }
  consulta.addEventListener("change", aplicarPreferencia);
  // Con el bucle dormido (bajo demanda) nadie lee el puntero ni el scroll: estos eventos lo despiertan.
  for (const tipo of ["pointermove", "pointerdown", "pointerleave", "pointercancel"]) {
    hero.addEventListener(tipo, () => bucle.pedirFrame());
  }
  addEventListener("scroll", () => bucle.pedirFrame(), { passive: true });

  /* ---------- 6. El bucle: uno para toda la página ----------
     Mira la visibilidad del hero: fuera de la pantalla (o con la pestaña oculta) no hay frames, y
     el reloj no avanza. Bajo demanda: al final de un frame en el que nada se movió, se duerme. */
  const bucle = Motor.crearBucle({ observar: hero, bajoDemanda: true, actualizar: actualizar, dibujar: dibujar });

  function actualizar(dt, b) {
    const r = b.reloj;
    // (1) Leer: todo el layout junto, al principio del frame, antes de escribir nada (7.1, 7.2).
    const rh = hero.getBoundingClientRect();
    estado.scroll = Math.min(1, Math.max(0, -rh.top / rh.height));
    estado.rectLienzo = lienzo.isConnected ? lienzo.getBoundingClientRect() : rh;
    estado.rectBoton = cta.getBoundingClientRect();
    puntero.actualizar(r.dtReal);                // lo que responde al usuario usa el tiempo real
    // (2) Avanzar el estado.
    estado.raton = suavizar(estado.raton, puntero.dentro ? 1 : 0, 0.15, r.dtReal);
    estado.scrollSuave = estado.reducir ? estado.scroll : suavizar(estado.scrollSuave, estado.scroll, 0.1, r.dtReal);
    estado.progreso.objetivo = estado.objetivo;
    estado.progreso.actualizar(r.dtReal);        // la transición la pide el usuario: tiempo real
    // El «contrato» de 7.3: el muelle se acerca al objetivo sin llegar nunca; en reposo, se fija
    // en 0 o 1 exactos para que la máscara del shader termine limpia.
    if (estado.progreso.enReposo(1e-4)) estado.progreso.fijar(estado.objetivo);
    // (3) ¿Hay que seguir? Si nada se mueve, no se pide frame y el bucle se duerme.
    if (algoSeMueve(r)) b.pedirFrame();
  }

  function algoSeMueve(r) {
    return (!r.pausado && r.escala > 0)                             // el tiempo corre: el flujo se mueve
      || !estado.progreso.enReposo(1e-4)                            // la transición no ha terminado
      || !puntero.enReposo()                                        // el remolino aún persigue al puntero
      || Math.abs(estado.raton - (puntero.dentro ? 1 : 0)) > 1e-3   // el remolino se enciende o se apaga
      || Math.abs(estado.scrollSuave - estado.scroll) > 1e-4;       // el scroll suavizado aún no ha llegado
  }

  /* ---------- 7. Dibujar: escribir el DOM y después la GPU, con el mismo estado ---------- */
  // Escribe un estilo solo si cambió: dibujar() corre a 60 fps y la mayoría de frames no cambia nada.
  const escrito = new WeakMap();
  function estilo(el, prop, valor) {
    let m = escrito.get(el);
    if (!m) { m = {}; escrito.set(el, m); }
    if (m[prop] !== valor) { m[prop] = valor; el.style[prop] = valor; }
  }
  const suave = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  let objetivoAplicado = -1, pausaAplicada = null;

  function dibujar(b) {
    const t = b.reloj.t, ms = t * 1000, reducir = estado.reducir;
    const p = Math.min(1, Math.max(0, estado.progreso.x));

    // (3a) Las animaciones del DOM, colocadas en el instante del reloj.
    for (const a of deEntrada) a.currentTime = reducir ? FIN_ENTRADA : ms;   // reducir: ya terminadas
    latido.currentTime = reducir ? 0 : ms;                                    // 0 = onda apagada
    for (const a of deCSS) a.currentTime = reducir ? 0 : ms;

    // (3b) Las diapositivas: el mismo muelle que mueve el frente del shader mueve el texto.
    estilo(diapositivas[0], "opacity", (1 - suave(0.05, 0.5, p)).toFixed(3));
    estilo(diapositivas[1], "opacity", suave(0.5, 0.95, p).toFixed(3));
    estilo(diapositivas[0], "transform", reducir ? "none" : "translateY(" + (-14 * p).toFixed(1) + "px)");
    estilo(diapositivas[1], "transform", reducir ? "none" : "translateY(" + (14 * (1 - p)).toFixed(1) + "px)");
    // La alternativa CSS (visible sin WebGL o con el contexto perdido) sigue al mismo progreso.
    estilo(capasCSS[1], "opacity", p.toFixed(3));
    // El parallax del contenido: sube un poco más despacio que la página y se desvanece.
    const s = reducir ? 0 : estado.scrollSuave;
    estilo(contenido, "transform", "translateY(" + (s * 90).toFixed(1) + "px)");
    estilo(contenido, "opacity", (1 - 0.9 * s).toFixed(3));

    // (3c) Accesibilidad: solo cambia cuando cambia el objetivo, no en cada frame.
    if (objetivoAplicado !== estado.objetivo) {
      objetivoAplicado = estado.objetivo;
      diapositivas.forEach((d, i) => { d.inert = i !== estado.objetivo; });   // fuera del foco y del lector
      botonesDiapo.forEach((btn) => btn.setAttribute("aria-pressed", String(Number(btn.dataset.ir) === estado.objetivo)));
    }
    if (pausaAplicada !== estado.pausa) {
      pausaAplicada = estado.pausa;
      botonPausa.setAttribute("aria-pressed", String(estado.pausa));
      botonPausa.lastElementChild.textContent = estado.pausa ? "Reanudar animación" : "Pausar animación";
    }

    // (4) La GPU, si la capa vive (si no, no hace nada y se ve la alternativa CSS).
    capa.dibujar(estado, b.reloj.intervaloMs);
    if (panel) mostrarDepuracion(b);
  }

  /* ---------- 8. La capa WebGL: opcional ---------- */
  // ?sinwebgl simula un navegador sin WebGL2: un canvas solo admite un tipo de contexto (5.1), así
  // que si antes pedimos uno '2d', getContext('webgl2') devolverá null.
  if (url.has("sinwebgl")) lienzo.getContext("2d");

  const capa = Motor.crearCapaGL(lienzo, {
    // Un quad de pantalla completa opaco: sin alfa, sin MSAA, sin profundidad (5.1). Y la GPU de
    // bajo consumo si el equipo tiene dos: es un fondo, no un juego.
    contexto: { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" },
    dprMax: 1,             // un fondo suave no necesita píxeles retina: ~4 veces menos trabajo con DPR 2
    pixelesMax: 2.1e6,     // tope de área (un monitor enorme no debe pedir más que esto)
    // Si aun así no llega a 60 fps, baja la resolución (7.1). Con 2 s de calentamiento: mientras la
    // página termina de cargar, los frames lentos no dicen nada del efecto.
    calidad: { min: 0.5, calentamiento: 2000 },
    pedirFrame: () => bucle.pedirFrame(),
    iniciar(gl, capa) {
      const programa = Motor.crearPrograma(gl, ShadersHero.vertice, ShadersHero.fragmento);
      capa.gpu = { programa: programa, u: Motor.uniforms(gl, programa), vao: gl.createVertexArray() };
    },
    dibujar: dibujarGL,
    // Hasta el primer frame, el canvas (opaco) sería un rectángulo negro: está en opacity 0 y aparece
    // con una transición cuando ya tiene algo dibujado.
    alPrimerFrame() { lienzo.classList.add("listo"); },
    alPerder() { hero.classList.add("gl-perdido"); },       // el canvas queda transparente: se ve la alternativa
    alRecuperar() { hero.classList.remove("gl-perdido"); },
    fallar(motivo) {
      hero.classList.add("sin-webgl");                      // la alternativa CSS pasa a ser el fondo
      lienzo.remove();                                      // ni negro ni transparente: fuera
      if (panel) panel.dataset.motivo = motivo;
    },
  });

  function dibujarGL(gl, e, capa) {
    const g = capa.gpu, u = g.u, t = bucle.reloj.t;
    const rl = e.rectLienzo, rb = e.rectBoton;
    const k = capa.ancho / rl.width;                           // px del búfer por px CSS (7.2)
    const fase = (t % LATIDO_S) / LATIDO_S;                    // la fase se calcula en JS, con 64 bits
    gl.useProgram(g.programa);
    ponerUniform(gl, u.u_resolution, [capa.ancho, capa.alto]);
    ponerUniform(gl, u.u_escala, k);
    ponerUniform(gl, u.u_time, t);
    ponerUniform(gl, u.u_entrada, e.reducir ? 1 : suave(0, ENTRADA_S, t));
    ponerUniform(gl, u.u_scroll, e.reducir ? 0 : e.scrollSuave);
    ponerUniform(gl, u.u_mouse, puntero.aGL(lienzo));
    ponerUniform(gl, u.u_raton, e.raton);
    ponerUniform(gl, u.u_progreso, Math.min(1, Math.max(0, e.progreso.x)));
    ponerUniform(gl, u.u_colA, PALETAS[0]);
    ponerUniform(gl, u.u_colB, PALETAS[1]);
    // El rectángulo del botón, relativo al CANVAS y con la y hacia arriba (7.2).
    ponerUniform(gl, u.u_boton, [(rb.left - rl.left) * k, (rl.bottom - rb.bottom) * k, rb.width * k, rb.height * k]);
    ponerUniform(gl, u.u_pulso, e.reducir ? 0 : Math.exp(-6 * fase));
    ponerUniform(gl, u.u_reducir, e.reducir ? 1 : 0);
    gl.bindVertexArray(g.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- Depuración (?depurar): cifras en vivo y botones de maltrato ---------- */
  let extPerdida = null;
  if (panel) {
    panel.hidden = false;
    if (capa.gl) extPerdida = capa.gl.getExtension("WEBGL_lose_context");   // ¡antes de perderlo! (7.1)
    panel.addEventListener("click", (ev) => {
      const q = ev.target.dataset && ev.target.dataset.q;
      if (q === "perder" && extPerdida) extPerdida.loseContext();
      if (q === "recuperar" && extPerdida) extPerdida.restoreContext();
      if (q === "lento") bucle.reloj.escala = bucle.reloj.escala === 0.25 ? 1 : 0.25;
      bucle.pedirFrame();
    });
  }
  const salida = panel ? panel.querySelector("output") : null;
  function mostrarDepuracion(b) {
    salida.textContent =
      (capa.viva ? "búfer " + capa.ancho + "×" + capa.alto + " · calidad " + capa.calidad.escala.toFixed(2)
                 : capa.fallada ? "sin WebGL: " + capa.motivo : "contexto perdido") +
      " · " + b.fps.toFixed(0) + " fps · t = " + b.reloj.t.toFixed(2) + " s · escala " + b.reloj.escala +
      " · frames " + b.frame + (estado.reducir ? " · movimiento reducido" : "");
  }

  aplicarPreferencia();
})();
