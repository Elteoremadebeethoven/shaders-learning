/* =====================================================================
   graficador.js — dibuja funciones y = f(x) escritas EN GLSL
   La curva la pinta un fragment shader: lo que ves es exactamente lo que
   devolvería esa expresión dentro de tus shaders (misma precisión float,
   mismas funciones built-in, mismas rarezas).
   ---------------------------------------------------------------------
     <div class="graficador" data-x="-0.5,1.5" data-y="-0.25,1.25">
       <script type="text/x-exprs">
         smoothstep(0.2, 0.8, x)
         step(0.5, x)
       </script>
       <!-- opcional: funciones auxiliares GLSL -->
       <script type="text/x-glsl"> float cuad(float v){ return v*v; } </script>
     </div>
   Variables disponibles en las expresiones: x, t (segundos) y los
   parámetros de data-uniforms='{"k":{"min":0,"max":4,"valor":1}}' (floats).
   Opciones: data-altura, data-fijo (no editable), data-titulo.
   OJO: el shader del graficador usa isnan() para no dibujar valores NaN/Inf; en ANGLE/Metal eso
   desactiva el "fast math", así que las operaciones INDEFINIDAS (pow de base negativa, 0/0…) pueden
   dar aquí NaN (hueco en la curva) y otra cosa en un playground GLSL sin isnan (ver lección 3.7).
   El efecto de isnan solo se da en la primera compilación de cada texto (después, la caché de programas
   de Chrome devuelve la versión con fast math): Curso.glCompartido.compilar añade un comentario único a
   los shaders con isnan/isinf para que siempre se compilen de nuevo (ver playground-glsl.js).
   Arrastra para desplazar; botones para zoom.
   ===================================================================== */
(function () {
  "use strict";
  const Curso = window.Curso, U = Curso.util;
  const MAX = 5;

  function pasoBonito(rango, objetivo) {
    const bruto = rango / objetivo;
    const p = Math.pow(10, Math.floor(Math.log10(bruto)));
    const n = bruto / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }
  function rgb(css) {
    const c = document.createElement("canvas").getContext("2d");
    c.fillStyle = css; const v = c.fillStyle;
    if (v[0] === "#") { const n = parseInt(v.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    const m = v.match(/[\d.]+/g) || [1, 1, 1]; return [m[0] / 255, m[1] / 255, m[2] / 255];
  }

  let contador = 0;
  function iniciar(el) {
    const id = "graf-" + ++contador;
    const GLC = Curso.glCompartido;
    const sExprs = el.querySelector('script[type="text/x-exprs"]');
    const sGlsl = el.querySelector('script[type="text/x-glsl"]');
    let exprs = sExprs ? U.textoDeScript(sExprs).split("\n").map((s) => s.trim()).filter(Boolean) : ["x"];
    const auxiliares = sGlsl ? U.textoDeScript(sGlsl) : "";
    const fijo = el.hasAttribute("data-fijo");
    const parse2 = (s, d) => { const v = (s || "").split(",").map(Number); return v.length === 2 && v.every(isFinite) ? v : d; };
    const x0 = parse2(el.dataset.x, [-1, 2]), y0 = parse2(el.dataset.y, [-0.5, 1.5]);
    let rango = { x: x0.slice(), y: y0.slice() };
    let params = {};
    try { params = el.dataset.uniforms ? JSON.parse(el.dataset.uniforms) : {}; } catch (e) { Curso.informarError(id, "data-uniforms inválido: " + e.message); }
    const valores = {};
    Object.keys(params).forEach((k) => (valores[k] = params[k].valor === undefined ? 0 : params[k].valor));
    const qa = (Curso.qa.playgrounds[id] = { tipo: "graficador", titulo: el.dataset.titulo || exprs.join(" | "), ok: null, error: null });

    el.innerHTML = "";
    if (el.dataset.titulo) el.appendChild(U.crear("div", { class: "pg-titulo", style: "display:flex;gap:10px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border);background:var(--surface-2);font-size:13.5px;font-weight:600;color:var(--text-2)", html: '<span style="font:600 11px var(--mono);color:var(--accent);background:var(--accent-soft);padding:2px 7px;border-radius:5px">y = f(x)</span>' + U.escapar(el.dataset.titulo) }));
    const lienzo = U.crear("div", { class: "gr-lienzo" });
    lienzo.style.height = (+(el.dataset.altura || 320)) + "px";
    const canvas = U.crear("canvas");
    const coord = U.crear("div", { class: "coord" });
    lienzo.append(canvas, coord);
    const zoom = U.crear("div", { style: "position:absolute;left:8px;top:8px;display:flex;gap:4px" });
    [["+", 0.8], ["−", 1.25], ["⟲", 0]].forEach(([t, f]) => {
      const b = U.crear("button", { class: "pg-btn", type: "button", text: t, style: "padding:2px 9px" });
      b.addEventListener("click", () => {
        if (!f) rango = { x: x0.slice(), y: y0.slice() };
        else ["x", "y"].forEach((k) => { const c = (rango[k][0] + rango[k][1]) / 2, m = (rango[k][1] - rango[k][0]) / 2 * f; rango[k] = [c - m, c + m]; });
        vista.sucio = true; GLC.arrancar();
      });
      zoom.appendChild(b);
    });
    lienzo.appendChild(zoom);
    const filas = U.crear("div", { class: "gr-exprs" });
    const err = U.crear("div", { class: "gr-error" });
    const ctrls = U.crear("div", { class: "pg-uniforms", style: "border-top:1px solid var(--border)" });
    el.append(lienzo, filas, ctrls, err);

    const colores = () => { const c = Curso.colores(); return [c.acento, c.acento2, c.rosa, c.amarillo, c.verde]; };
    const inputs = [];
    const nFilas = fijo ? exprs.length : Math.min(MAX, exprs.length + 1);
    for (let i = 0; i < nFilas; i++) {
      const fila = U.crear("div", { class: "gr-fila" });
      const muestra = U.crear("span", { class: "muestra" });
      const inp = U.crear("input", { type: "text", spellcheck: "false", value: exprs[i] || "", placeholder: "escribe otra función de x… (ej: sin(x*6.2832)*0.5)" });
      if (fijo) inp.readOnly = true;
      inp.addEventListener("input", U.debounce(() => { exprs = inputs.map((x) => x.value.trim()); compilar(); }, 300));
      fila.append(muestra, U.crear("span", { class: "etq", text: "f" + (i + 1) + "(x) =" }), inp);
      filas.appendChild(fila);
      inputs.push(inp);
    }
    function pintarMuestras() { const c = colores(); filas.querySelectorAll(".muestra").forEach((m, i) => (m.style.background = c[i % c.length])); }
    pintarMuestras();

    Object.keys(params).forEach((k) => {
      const d = params[k];
      const fila = U.crear("div", { class: "control" });
      const min = d.min === undefined ? 0 : d.min, max = d.max === undefined ? 1 : d.max;
      const inp = U.crear("input", { type: "range", min, max, step: d.paso || (max - min) / 200, value: valores[k] });
      const out = U.crear("output", { text: (+valores[k]).toFixed(2) });
      inp.addEventListener("input", () => { valores[k] = +inp.value; out.textContent = (+inp.value).toFixed(2); vista.sucio = true; GLC.arrancar(); });
      fila.append(U.crear("label", { text: d.etiqueta || k }), inp, out);
      ctrls.appendChild(fila);
    });

    const vista = {
      visible: false, sucio: true, programa: null, uniforms: {}, t0: performance.now(), animada: false, raton: null, ctx: null, activas: [],
      cambiarVisibilidad(v) { this.visible = v; if (v) { this.sucio = true; GLC.arrancar(); } },
      alPerderContexto() { this.programa = null; },
      alRestaurar() { compilar(); },
      renderizar(ms) {
        if (!this.programa || (!this.animada && !this.sucio)) return;
        this.sucio = false;
        const gl = GLC.gl, w = canvas.width, h = canvas.height;
        if (w < 2 || h < 2) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        GLC.asegurarTamaño(w, h);
        gl.viewport(0, 0, w, h);
        gl.useProgram(this.programa);
        const u = this.uniforms, pon = (n, v) => u[n] && GLKit.ponerUniform(gl, u[n], v);
        const t = (ms - this.t0) / 1000;
        const pasoX = pasoBonito(rango.x[1] - rango.x[0], w / dpr / 90), pasoY = pasoBonito(rango.y[1] - rango.y[0], h / dpr / 60);
        const C = Curso.colores();
        pon("u_res", [w, h]); pon("u_rango", [rango.x[0], rango.x[1], rango.y[0], rango.y[1]]); pon("u_time", t);
        pon("u_paso", [pasoX, pasoY]); pon("u_dpr", dpr);
        pon("u_fondo", rgb(C.fondo)); pon("u_rejilla", rgb(C.tenue)); pon("u_claro", Curso.tema() === "light" ? 1 : 0);
        const cols = colores();
        for (let i = 0; i < MAX; i++) pon("u_col" + i, rgb(cols[i % cols.length]));
        for (const k in valores) pon(k, valores[k]);
        gl.bindVertexArray(GLC.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const ctx = this.ctx || (this.ctx = canvas.getContext("2d"));
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(GLC.canvas, 0, GLC.canvas.height - h, w, h, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
        // etiquetas de los ejes
        ctx.save();
        ctx.scale(dpr, dpr);
        const W = w / dpr, H = h / dpr;
        const aX = (x) => (x - rango.x[0]) / (rango.x[1] - rango.x[0]) * W;
        const aY = (y) => H - (y - rango.y[0]) / (rango.y[1] - rango.y[0]) * H;
        ctx.font = "11px " + C.mono; ctx.fillStyle = C.tenue;
        const fmt = (v, p) => { const d = Math.max(0, -Math.floor(Math.log10(p) + 1e-9)); return (Math.abs(v) < p / 1e3 ? 0 : v).toFixed(d); };
        const ejeY = Math.min(H - 14, Math.max(4, aY(0) + 4));
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        for (let x = Math.ceil(rango.x[0] / pasoX) * pasoX; x <= rango.x[1]; x += pasoX) {
          if (Math.abs(x) < pasoX / 1e3) continue;
          ctx.fillText(fmt(x, pasoX), aX(x), ejeY);
        }
        const ejeX = Math.min(W - 4, Math.max(28, aX(0) - 4));
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        for (let y = Math.ceil(rango.y[0] / pasoY) * pasoY; y <= rango.y[1]; y += pasoY) {
          if (Math.abs(y) < pasoY / 1e3) continue;
          ctx.fillText(fmt(y, pasoY), ejeX, aY(y));
        }
        ctx.restore();
        if (this.raton) mostrarCoord();
      },
    };
    lienzo._vista = vista;

    function compilar() {
      const gl = GLC.obtener();
      if (!gl) { err.textContent = "WebGL2 no disponible"; return; }
      const nombresParams = Object.keys(params);
      const activas = exprs.map((e, i) => ({ e, i })).filter((o) => o.e);
      vista.activas = activas;
      const cab = [
        "#version 300 es", "precision highp float;",
        "uniform vec2 u_res; uniform vec4 u_rango; uniform float u_time; uniform vec2 u_paso; uniform float u_dpr;",
        "uniform vec3 u_fondo; uniform vec3 u_rejilla; uniform float u_claro;",
        "uniform vec3 u_col0; uniform vec3 u_col1; uniform vec3 u_col2; uniform vec3 u_col3; uniform vec3 u_col4;",
        nombresParams.length ? "uniform float " + nombresParams.join(", ") + ";" : "",
        "out vec4 fragColor;",
      ].join("\n") + "\n";
      const aux = auxiliares + "\n";
      const lineaInicioFun = (cab + aux).split("\n").length;
      let funs = "";
      activas.forEach((o) => { funs += "float f" + o.i + "(float x) { float t = u_time; return float(" + o.e + "); }\n"; });
      const cuerpo = `
float linea(float d, float grosor) { return 1.0 - smoothstep(grosor - 0.75, grosor + 0.75, d); }
// Usa isnan()/isinf() A PROPÓSITO: en ANGLE/Metal su presencia desactiva el "fast math" del
// shader, así que aquí las operaciones indefinidas (pow de base negativa, 0/0…) dan NaN según
// IEEE y se ven como huecos en la curva. En un playground sin isnan pueden dar otra cosa (3.7).
bool finito(float v) { return !(isnan(v) || isinf(v)); }
float curva(float y0, float yl, float yr, float e, float y, vec2 ppu) {
  if (!finito(y0) || !finito(yl) || !finito(yr)) return 0.0;
  float dy = (yr - yl) / (2.0 * e);
  float d = abs(y0 - y) * ppu.y;
  float pendiente = dy * ppu.y / ppu.x;
  d /= sqrt(1.0 + pendiente * pendiente);
  // saltos (step, floor…): trazo vertical entre los dos valores vecinos
  float lo = min(yl, yr), hi = max(yl, yr);
  if (abs(yr - yl) * ppu.y > 6.0 * u_dpr && y > lo && y < hi) d = min(d, 0.0);
  return linea(d, 1.1 * u_dpr);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(mix(u_rango.x, u_rango.y, uv.x), mix(u_rango.z, u_rango.w, uv.y));
  vec2 ppu = u_res / vec2(u_rango.y - u_rango.x, u_rango.w - u_rango.z);
  vec3 col = u_fondo;
  vec2 g = abs(fract(p / u_paso + 0.5) - 0.5) * u_paso * ppu;
  vec2 g2 = abs(fract(p / (u_paso * 0.2) + 0.5) - 0.5) * u_paso * 0.2 * ppu;
  float fuerza = mix(1.0, 1.6, u_claro);
  col = mix(col, u_rejilla, 0.10 * fuerza * linea(min(g2.x, g2.y), 0.5 * u_dpr));
  col = mix(col, u_rejilla, 0.28 * fuerza * linea(min(g.x, g.y), 0.5 * u_dpr));
  vec2 ej = abs(p) * ppu;
  col = mix(col, u_rejilla, 0.85 * linea(min(ej.x, ej.y), 0.6 * u_dpr));
  float e = 1.0 / ppu.x;
  float x = p.x;
  ${activas.map((o) => `{ float a = curva(f${o.i}(x), f${o.i}(x - e), f${o.i}(x + e), e, p.y, ppu); col = mix(col, u_col${o.i}, a); }`).join("\n  ")}
  fragColor = vec4(col, 1.0);
}`;
      const fs = cab + aux + funs + cuerpo;
      const vs = "#version 300 es\nin vec2 a_pos;\nvoid main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }";
      const r = GLC.compilar(vs, fs, 0);
      inputs.forEach((i) => i.classList.remove("error"));
      if (r.error) {
        // traducir la línea del error a "qué expresión falló"
        const m = r.error.match(/ERROR:\s*\d+:(\d+):\s*(.*)/);
        let txt = r.error.split("\n").filter((l) => /ERROR/.test(l)).slice(0, 3).join("\n") || r.error;
        if (m) {
          const k = +m[1] - lineaInicioFun;
          if (k >= 0 && k < activas.length) { inputs[activas[k].i].classList.add("error"); txt = "f" + (activas[k].i + 1) + ": " + m[2]; }
          else if (+m[1] < lineaInicioFun) txt = "En las funciones auxiliares: " + m[2];
        }
        err.textContent = txt;
        if (qa.ok === null) { qa.ok = false; qa.error = r.error.slice(0, 300); }
        return;
      }
      err.textContent = "";
      if (vista.programa) gl.deleteProgram(vista.programa);
      vista.programa = r.programa;
      vista.uniforms = GLKit.uniforms(gl, r.programa);
      vista.animada = activas.some((o) => /\bt\b/.test(o.e)) || /u_time|\bt\b/.test(auxiliares);
      vista.sucio = true;
      if (qa.ok === null) qa.ok = true;
      GLC.arrancar();
    }

    /* Valor de f en JS: no evaluamos GLSL en JS; mostramos solo las coordenadas
       y dejamos que el alumno lea la curva. */
    function mostrarCoord() {
      const r = vista.raton; if (!r) { coord.textContent = ""; return; }
      const x = rango.x[0] + r[0] * (rango.x[1] - rango.x[0]), y = rango.y[0] + r[1] * (rango.y[1] - rango.y[0]);
      coord.textContent = "x = " + x.toFixed(3) + "   y = " + y.toFixed(3);
    }

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(lienzo.clientWidth * dpr)), h = Math.max(2, Math.round(lienzo.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; vista.sucio = true; GLC.arrancar(); }
    };
    if ("ResizeObserver" in window) new ResizeObserver(ajustar).observe(lienzo);
    ajustar();

    let arrastre = null;
    canvas.style.touchAction = "none"; canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", (e) => { arrastre = { x: e.clientX, y: e.clientY, r: { x: rango.x.slice(), y: rango.y.slice() } }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; });
    canvas.addEventListener("pointermove", (e) => {
      const b = canvas.getBoundingClientRect();
      vista.raton = [(e.clientX - b.left) / b.width, (b.bottom - e.clientY) / b.height];
      if (arrastre) {
        const dx = (e.clientX - arrastre.x) / b.width * (arrastre.r.x[1] - arrastre.r.x[0]);
        const dy = (e.clientY - arrastre.y) / b.height * (arrastre.r.y[1] - arrastre.r.y[0]);
        rango = { x: [arrastre.r.x[0] - dx, arrastre.r.x[1] - dx], y: [arrastre.r.y[0] + dy, arrastre.r.y[1] + dy] };
        vista.sucio = true; GLC.arrancar();
      }
      mostrarCoord();
    });
    canvas.addEventListener("pointerup", () => { arrastre = null; canvas.style.cursor = "grab"; });
    canvas.addEventListener("pointerleave", () => { vista.raton = null; coord.textContent = ""; });
    document.addEventListener("curso:tema", () => { pintarMuestras(); vista.sucio = true; GLC.arrancar(); });

    compilar();
    GLC.registrar(vista);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((ents) => ents.forEach((en) => vista.cambiarVisibilidad(en.isIntersecting)), { rootMargin: "120px 0px" }).observe(lienzo);
    } else vista.cambiarVisibilidad(true);
  }

  Curso.registrar(".graficador", iniciar);
})();
