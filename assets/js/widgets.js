/* =====================================================================
   widgets.js — ayudas para demos interactivas hechas a mano en cada lección
   ---------------------------------------------------------------------
   Curso.lienzo2d(contenedor, opciones)  canvas 2D con DPR, bucle y ratón
   Curso.plano(contenedor, opciones)     plano cartesiano con puntos arrastrables
   Curso.control / casilla / boton / selector   controles para .demo-controles

   Ejemplo:
     <div class="demo" id="mi-demo">
       <div class="demo-lienzo"></div>
       <div class="demo-controles"></div>
       <div class="demo-info"></div>
     </div>
     <script>
     Curso.alListo(() => {
       const raiz = document.getElementById("mi-demo");
       let k = 1;
       const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
         x: [-4, 4], puntos: { a: { x: 2, y: 1, etiqueta: "a" } },
         dibujar(p, pts) { p.flecha([0, 0], pts.a, { color: "acento" }); },
       });
       Curso.control(raiz.querySelector(".demo-controles"), {
         etiqueta: "k", min: 0, max: 2, valor: 1, alCambiar: (v) => { k = v; pl.redibujar(); } });
     });
     </script>
   ===================================================================== */
(function () {
  "use strict";
  const Curso = window.Curso, U = Curso.util;

  const visObs = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { const w = e.target._widget; if (w) w._visible(e.isIntersecting); });
  }, { rootMargin: "80px 0px" }) : null;

  /* ---------------------------------------------------------------
     lienzo2d
     opciones: { altura, animar, dibujar(ctx, estado), alPulsar(estado, e),
                 alMover(estado, e), alSoltar(estado, e), dprMax }
     estado:   { w, h (px CSS), dpr, t, dt, frame, raton:{x,y,dentro,pulsado}, colores }
     OJO: el contexto 2D conserva su estado entre frames (fillStyle, textBaseline, lineDash…);
     usa ctx.save()/ctx.restore() en tus dibujos si cambias estado.
     --------------------------------------------------------------- */
  Curso.lienzo2d = function (contenedor, o) {
    o = o || {};
    if (typeof contenedor === "string") contenedor = document.querySelector(contenedor);
    if (o.altura) contenedor.style.height = o.altura + "px";
    if (getComputedStyle(contenedor).position === "static") contenedor.style.position = "relative";
    if (!contenedor.clientHeight) contenedor.style.height = "340px";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none";
    contenedor.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const estado = { w: 0, h: 0, dpr: 1, t: 0, dt: 0, frame: 0, raton: { x: 0, y: 0, dentro: false, pulsado: false }, colores: Curso.colores() };
    let raf = 0, visible = !visObs, previo = -1, animando = !!o.animar, pendiente = false;

    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, o.dprMax || 2);
      const w = contenedor.clientWidth, h = contenedor.clientHeight;
      estado.w = w; estado.h = h; estado.dpr = dpr;
      const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    }
    function pintar() {
      ctx.setTransform(estado.dpr, 0, 0, estado.dpr, 0, 0);
      try { o.dibujar && o.dibujar(ctx, estado); }
      catch (e) { console.error(e); Curso.informarError("lienzo2d", e.stack || e.message); animando = false; }
    }
    function paso(ms) {
      raf = 0;
      const s = ms / 1000;
      estado.dt = previo < 0 ? 0 : Math.min(0.1, s - previo);
      previo = s;
      estado.t += estado.dt;
      estado.frame++;
      pintar();
      pendiente = false;
      if (animando && visible) raf = requestAnimationFrame(paso);
    }
    function pedir() { if (!raf) { raf = requestAnimationFrame(paso); } }
    const api = {
      canvas, ctx, estado,
      redibujar() { if (animando) return; pendiente = true; pedir(); },
      animar(v) { animando = v; previo = -1; if (v && visible) pedir(); },
      get animando() { return animando; },
      reiniciarTiempo() { estado.t = 0; estado.frame = 0; },
      _visible(v) { visible = v; if (v) { previo = -1; pedir(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; } },
    };
    contenedor._widget = api;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); estado.raton.x = e.clientX - r.left; estado.raton.y = e.clientY - r.top; };
    canvas.addEventListener("pointermove", (e) => { pos(e); estado.raton.dentro = true; o.alMover && o.alMover(estado, e); if (!animando) api.redibujar(); });
    canvas.addEventListener("pointerdown", (e) => { pos(e); estado.raton.pulsado = true; canvas.setPointerCapture(e.pointerId); o.alPulsar && o.alPulsar(estado, e); if (!animando) api.redibujar(); });
    canvas.addEventListener("pointerup", (e) => { pos(e); estado.raton.pulsado = false; o.alSoltar && o.alSoltar(estado, e); if (!animando) api.redibujar(); });
    canvas.addEventListener("pointerleave", () => { estado.raton.dentro = false; if (!animando) api.redibujar(); });
    if ("ResizeObserver" in window) new ResizeObserver(() => { ajustar(); if (!animando) api.redibujar(); }).observe(contenedor);
    document.addEventListener("curso:tema", () => { estado.colores = Curso.colores(); api.redibujar(); });
    ajustar();
    if (visObs) visObs.observe(contenedor);
    pedir();
    return api;
  };

  /* ---------------------------------------------------------------
     plano: sistema de coordenadas matemático (y hacia ARRIBA)
     opciones: { x:[min,max], y:[min,max] (si falta, se calcula con proporción 1:1),
                 puntos:{ nombre:{x,y,color,etiqueta,fijo,radio} }, rejilla, ejes,
                 paso (de rejilla), animar, dibujar(p, puntos, estado), alCambiar(puntos),
                 restringir(nombre, punto) → puede modificar el punto al arrastrar,
                 iman (redondea al arrastrar, p.ej. 0.5),
                 alPulsar([x,y] mundo, nombrePuntoOnull, evento), alSoltar([x,y], nombre, evento) }
     --------------------------------------------------------------- */
  Curso.plano = function (contenedor, o) {
    o = o || {};
    const puntos = {};
    for (const k in o.puntos || {}) puntos[k] = Object.assign({ radio: 7 }, o.puntos[k]);
    let arrastrando = null, sobre = null;
    const p = {};
    let W = 0, H = 0, xr = o.x || [-5, 5], yr = o.y || null;
    function rangoY() { if (o.y) return o.y; const esc = W / (xr[1] - xr[0]); const alto = H / esc; const cy = o.centroY || 0; return [cy - alto / 2, cy + alto / 2]; }
    p.aPantalla = (v) => { const [x, y] = Array.isArray(v) ? v : [v.x, v.y]; return [(x - xr[0]) / (xr[1] - xr[0]) * W, H - (y - yr[0]) / (yr[1] - yr[0]) * H]; };
    p.aMundo = (px, py) => [xr[0] + px / W * (xr[1] - xr[0]), yr[0] + (H - py) / H * (yr[1] - yr[0])];
    p.escala = () => W / (xr[1] - xr[0]);
    const col = (c) => { if (!c) return p.colores.texto; return p.colores[c] || c; };

    p.linea = (a, b, s) => {
      s = s || {}; const ctx = p.ctx; const A = p.aPantalla(a), B = p.aPantalla(b);
      ctx.save(); ctx.strokeStyle = col(s.color || "tenue"); ctx.lineWidth = s.grosor || 1.5;
      if (s.discontinua) ctx.setLineDash(Array.isArray(s.discontinua) ? s.discontinua : [5, 5]);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.restore();
    };
    p.flecha = (a, b, s) => {
      s = s || {}; const ctx = p.ctx; const A = p.aPantalla(a), B = p.aPantalla(b);
      const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy); if (L < 0.5) return;
      const ux = dx / L, uy = dy / L, g = s.grosor || 2.5, cab = Math.min(14 + g, L * 0.45);
      ctx.save(); ctx.strokeStyle = ctx.fillStyle = col(s.color || "acento"); ctx.lineWidth = g; ctx.lineCap = "round";
      if (s.discontinua) ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0] - ux * cab * 0.8, B[1] - uy * cab * 0.8); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(B[0], B[1]);
      ctx.lineTo(B[0] - ux * cab - uy * cab * 0.45, B[1] - uy * cab + ux * cab * 0.45);
      ctx.lineTo(B[0] - ux * cab + uy * cab * 0.45, B[1] - uy * cab - ux * cab * 0.45);
      ctx.closePath(); ctx.fill();
      if (s.etiqueta) {
        ctx.font = "600 14px " + p.colores.fuente; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const mx = (A[0] + B[0]) / 2 - uy * 14, my = (A[1] + B[1]) / 2 + ux * 14;
        ctx.fillText(s.etiqueta, mx, my);
      }
      ctx.restore();
    };
    p.punto = (a, s) => {
      s = s || {}; const ctx = p.ctx; const A = p.aPantalla(a);
      ctx.save(); ctx.fillStyle = col(s.color || "texto"); ctx.beginPath(); ctx.arc(A[0], A[1], s.radio || 4, 0, Math.PI * 2); ctx.fill();
      if (s.etiqueta) { ctx.font = "600 13px " + p.colores.fuente; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(s.etiqueta, A[0] + 7, A[1] - 5); }
      ctx.restore();
    };
    p.circulo = (c, r, s) => {
      s = s || {}; const ctx = p.ctx; const C = p.aPantalla(c); const R = r * p.escala();
      ctx.save(); ctx.beginPath(); ctx.arc(C[0], C[1], Math.abs(R), 0, Math.PI * 2);
      if (s.relleno) { ctx.fillStyle = col(s.relleno); ctx.fill(); }
      if (s.color !== null) { ctx.strokeStyle = col(s.color || "tenue"); ctx.lineWidth = s.grosor || 1.5; if (s.discontinua) ctx.setLineDash([5, 5]); ctx.stroke(); }
      ctx.restore();
    };
    /* arco en sentido antihorario (matemático) de a0 a a1 (radianes) */
    p.arco = (c, r, a0, a1, s) => {
      s = s || {}; const ctx = p.ctx; const C = p.aPantalla(c); const R = r * p.escala();
      ctx.save(); ctx.beginPath(); ctx.arc(C[0], C[1], R, -a0, -a1, a1 > a0);
      if (s.relleno) { ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.fillStyle = col(s.relleno); ctx.fill(); }
      else { ctx.strokeStyle = col(s.color || "tenue"); ctx.lineWidth = s.grosor || 1.5; ctx.stroke(); }
      ctx.restore();
    };
    p.poligono = (pts, s) => {
      s = s || {}; const ctx = p.ctx;
      ctx.save(); ctx.beginPath();
      pts.forEach((q, i) => { const Q = p.aPantalla(q); i ? ctx.lineTo(Q[0], Q[1]) : ctx.moveTo(Q[0], Q[1]); });
      if (s.cerrar !== false) ctx.closePath();
      if (s.relleno) { ctx.fillStyle = col(s.relleno); ctx.fill(); }
      if (s.color !== null) { ctx.strokeStyle = col(s.color || "tenue"); ctx.lineWidth = s.grosor || 1.5; ctx.stroke(); }
      ctx.restore();
    };
    p.texto = (a, t, s) => {
      s = s || {}; const ctx = p.ctx; const A = p.aPantalla(a);
      ctx.save(); ctx.fillStyle = col(s.color || "texto"); ctx.font = (s.negrita ? "600 " : "") + (s.tam || 13) + "px " + (s.mono ? p.colores.mono : p.colores.fuente);
      ctx.textAlign = s.alinear || "left"; ctx.textBaseline = s.base || "middle";
      const d = s.desplazamiento || [0, 0];
      ctx.fillText(t, A[0] + d[0], A[1] + d[1]); ctx.restore();
    };
    /* y = f(x) muestreada en píxeles */
    p.funcion = (f, s) => {
      s = s || {}; const ctx = p.ctx; const a = s.desde === undefined ? xr[0] : s.desde, b = s.hasta === undefined ? xr[1] : s.hasta;
      ctx.save(); ctx.strokeStyle = col(s.color || "acento"); ctx.lineWidth = s.grosor || 2; ctx.beginPath();
      let primero = true; const n = Math.max(2, Math.round((b - a) * p.escala()));
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = f(x);
        if (!isFinite(y)) { primero = true; continue; }
        const P = p.aPantalla([x, y]);
        if (primero) { ctx.moveTo(P[0], P[1]); primero = false; } else ctx.lineTo(P[0], P[1]);
      }
      ctx.stroke(); ctx.restore();
    };
    /* curva paramétrica (x(s), y(s)) con s en [a, b] */
    p.parametrica = (fx, fy, a, b, s) => {
      s = s || {}; const ctx = p.ctx; const n = s.muestras || 200;
      ctx.save(); ctx.strokeStyle = col(s.color || "acento"); ctx.lineWidth = s.grosor || 2; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; const P = p.aPantalla([fx(u), fy(u)]); i ? ctx.lineTo(P[0], P[1]) : ctx.moveTo(P[0], P[1]); }
      ctx.stroke(); ctx.restore();
    };

    function dibujarRejilla() {
      const ctx = p.ctx, c = p.colores;
      const paso = o.paso || (() => { const r = (xr[1] - xr[0]) / (W / 60); const q = Math.pow(10, Math.floor(Math.log10(r))); const n = r / q; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * q; })();
      ctx.save(); ctx.lineWidth = 1;
      if (o.rejilla !== false) {
        ctx.strokeStyle = c.rejilla; ctx.beginPath();
        for (let x = Math.ceil(xr[0] / paso) * paso; x <= xr[1]; x += paso) { const X = Math.round(p.aPantalla([x, 0])[0]) + 0.5; ctx.moveTo(X, 0); ctx.lineTo(X, H); }
        for (let y = Math.ceil(yr[0] / paso) * paso; y <= yr[1]; y += paso) { const Y = Math.round(p.aPantalla([0, y])[1]) + 0.5; ctx.moveTo(0, Y); ctx.lineTo(W, Y); }
        ctx.stroke();
      }
      if (o.ejes !== false) {
        const O = p.aPantalla([0, 0]);
        ctx.strokeStyle = c.eje; ctx.beginPath();
        ctx.moveTo(0, Math.round(O[1]) + 0.5); ctx.lineTo(W, Math.round(O[1]) + 0.5);
        ctx.moveTo(Math.round(O[0]) + 0.5, 0); ctx.lineTo(Math.round(O[0]) + 0.5, H); ctx.stroke();
        if (o.numeros !== false) {
          ctx.fillStyle = c.tenue; ctx.font = "11px " + c.mono; ctx.textAlign = "center"; ctx.textBaseline = "top";
          const dec = paso < 1 ? Math.ceil(-Math.log10(paso)) : 0;
          for (let x = Math.ceil(xr[0] / paso) * paso; x <= xr[1]; x += paso) { if (Math.abs(x) < paso / 2) continue; const P = p.aPantalla([x, 0]); ctx.fillText(x.toFixed(dec), P[0], Math.min(H - 14, Math.max(2, P[1] + 4))); }
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          for (let y = Math.ceil(yr[0] / paso) * paso; y <= yr[1]; y += paso) { if (Math.abs(y) < paso / 2) continue; const P = p.aPantalla([0, y]); ctx.fillText(y.toFixed(dec), Math.max(24, Math.min(W - 4, P[0] - 5)), P[1]); }
        }
      }
      ctx.restore();
    }

    const lz = Curso.lienzo2d(contenedor, {
      animar: o.animar,
      dibujar(ctx, est) {
        W = est.w; H = est.h; yr = rangoY();
        p.ctx = ctx; p.colores = est.colores; p.estado = est;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = est.colores.fondo; ctx.fillRect(0, 0, W, H);
        dibujarRejilla();
        o.dibujar && o.dibujar(p, puntos, est);
        for (const k in puntos) {
          const q = puntos[k]; if (q.oculto) continue;
          const P = p.aPantalla(q);
          ctx.save();
          ctx.fillStyle = col(q.color || "acento");
          ctx.globalAlpha = q.fijo ? 0.9 : 1;
          ctx.beginPath(); ctx.arc(P[0], P[1], q.radio + (sobre === k || arrastrando === k ? 3 : 0), 0, Math.PI * 2); ctx.fill();
          if (!q.fijo) { ctx.strokeStyle = est.colores.fondo; ctx.lineWidth = 2; ctx.stroke(); }
          if (q.etiqueta) { ctx.fillStyle = col(q.color || "acento"); ctx.font = "600 14px " + est.colores.fuente; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(q.etiqueta, P[0] + 9, P[1] - 7); }
          ctx.restore();
        }
      },
      alPulsar(est, e) {
        const k = cercano(est.raton.x, est.raton.y);
        if (k) arrastrando = k;
        if (o.alPulsar) o.alPulsar(p.aMundo(est.raton.x, est.raton.y), k, e);
      },
      alMover(est) {
        if (arrastrando) {
          let [x, y] = p.aMundo(est.raton.x, est.raton.y);
          if (o.iman) { x = Math.round(x / o.iman) * o.iman; y = Math.round(y / o.iman) * o.iman; }
          const q = puntos[arrastrando];
          q.x = x; q.y = y;
          if (o.restringir) o.restringir(arrastrando, q, puntos);
          o.alCambiar && o.alCambiar(puntos, arrastrando);
        } else {
          const k = cercano(est.raton.x, est.raton.y);
          if (k !== sobre) { sobre = k; lz.canvas.style.cursor = k ? "grab" : "default"; }
        }
      },
      alSoltar(est, e) {
        const k = arrastrando;
        arrastrando = null;
        if (o.alSoltar) o.alSoltar(p.aMundo(est.raton.x, est.raton.y), k, e);
      },
    });
    function cercano(mx, my) {
      let mejor = null, d = 18;
      for (const k in puntos) { const q = puntos[k]; if (q.fijo || q.oculto) continue; const P = p.aPantalla(q); const dd = Math.hypot(P[0] - mx, P[1] - my); if (dd < d) { d = dd; mejor = k; } }
      return mejor;
    }
    p.redibujar = () => lz.redibujar();
    p.lienzo = lz;
    p.puntos = puntos;
    p.fijarRango = (x, y) => { xr = x; if (y) o.y = y; lz.redibujar(); };
    return p;
  };

  /* ---------------------------------------------------------------
     Controles
     --------------------------------------------------------------- */
  Curso.control = function (cont, o) {
    const fila = U.crear("div", { class: "control" });
    const min = o.min === undefined ? 0 : o.min, max = o.max === undefined ? 1 : o.max;
    const paso = o.paso || (max - min) / 200;
    const inp = U.crear("input", { type: "range", min, max, step: paso, value: o.valor === undefined ? min : o.valor });
    const dec = paso >= 1 ? 0 : paso >= 0.1 ? 1 : paso >= 0.01 ? 2 : 3;
    const fmt = o.formato || ((v) => v.toFixed(dec));
    const out = U.crear("output", { text: fmt(+inp.value) });
    const api = { input: inp, get valor() { return +inp.value; }, set valor(v) { inp.value = v; out.textContent = fmt(+v); } };
    inp.addEventListener("input", () => { out.textContent = fmt(+inp.value); o.alCambiar && o.alCambiar(+inp.value); });
    fila.append(U.crear("label", { text: o.etiqueta || "" }), inp, out);
    cont.appendChild(fila);
    return api;
  };
  Curso.casilla = function (cont, o) {
    const lab = U.crear("label", { style: "display:inline-flex;gap:6px;align-items:center;font-size:13.5px;color:var(--text-2);cursor:pointer" });
    const inp = U.crear("input", { type: "checkbox" }); inp.checked = !!o.valor; inp.style.accentColor = "var(--accent)";
    inp.addEventListener("change", () => o.alCambiar && o.alCambiar(inp.checked));
    lab.append(inp, o.etiqueta || "");
    cont.appendChild(lab);
    return { input: inp, get valor() { return inp.checked; } };
  };
  Curso.boton = function (cont, texto, alPulsar, primario) {
    const b = U.crear("button", { class: "pg-btn" + (primario ? " primario" : ""), type: "button", text: texto });
    b.addEventListener("click", alPulsar);
    cont.appendChild(b);
    return b;
  };
  Curso.selector = function (cont, o) {
    const lab = U.crear("label", { style: "display:inline-flex;gap:8px;align-items:center;font-size:13.5px;color:var(--text-2)" });
    const sel = U.crear("select", { style: "font:13px var(--font);padding:4px 8px;border-radius:6px;border:1px solid var(--border-2);background:var(--surface);color:var(--text)" });
    (o.opciones || []).forEach((op) => { const [v, t] = Array.isArray(op) ? op : [op, op]; const x = U.crear("option", { value: v, text: t }); sel.appendChild(x); });
    if (o.valor !== undefined) sel.value = o.valor;
    sel.addEventListener("change", () => o.alCambiar && o.alCambiar(sel.value));
    lab.append(o.etiqueta || "", sel);
    cont.appendChild(lab);
    return { select: sel, get valor() { return sel.value; } };
  };
})();
