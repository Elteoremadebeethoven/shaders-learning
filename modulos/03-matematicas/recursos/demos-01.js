/* Demos de la lección 3.1 · Vectores y coordenadas */
(function () {
  "use strict";
  const V = M3.v, f = M3.f, par = M3.par;

  /* ---------------------------------------------------------------
     Punto contra vector: el mismo cálculo visto por dos observadores
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-origen");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-8, 8],
      puntos: {
        P: { x: 0.5, y: 1.5, etiqueta: "P", color: "acento" },
        Q: { x: 2.5, y: -0.5, etiqueta: "Q", color: "acento2" },
        O2: { x: -3, y: -1.5, etiqueta: "O′", color: "rosa" },
      },
      dibujar(p, pts) {
        const { P, Q, O2 } = pts;
        // ejes del segundo observador
        p.linea([O2.x - 30, O2.y], [O2.x + 30, O2.y], { color: "rosa", discontinua: [3, 5], grosor: 1 });
        p.linea([O2.x, O2.y - 30], [O2.x, O2.y + 30], { color: "rosa", discontinua: [3, 5], grosor: 1 });
        p.texto([0, 0], "O", { color: "tenue", desplazamiento: [-14, 12], negrita: true });
        // "P + Q" según cada observador (dónde cae, en coordenadas del plano)
        const S = V.sumar(P, Q);                 // O + P + Q
        const S2 = V.restar(V.sumar(P, Q), O2);  // O′ + (P − O′) + (Q − O′)
        p.flecha([0, 0], S, { color: "naranja", discontinua: true, grosor: 1.5 });
        p.punto(S, { color: "naranja", radio: 5, etiqueta: "P+Q (O)" });
        p.flecha(O2, S2, { color: "rosa", discontinua: true, grosor: 1.5 });
        p.punto(S2, { color: "rosa", radio: 5, etiqueta: "P+Q (O′)" });
        // Q − P, igual para todos
        p.flecha(P, Q, { color: "verde", etiqueta: "Q − P" });
        // punto medio, igual para todos
        const M = V.lerp(P, Q, 0.5);
        p.punto(M, { color: "amarillo", radio: 5 });
        const rel = (A) => V.restar(A, O2);
        info.textContent =
          "            según O              según O′\n" +
          "P           " + par(P).padEnd(21) + par(rel(P)) + "\n" +
          "Q           " + par(Q).padEnd(21) + par(rel(Q)) + "\n" +
          "Q − P       " + par(V.restar(Q, P)).padEnd(21) + par(V.restar(rel(Q), rel(P))) + "   ← el mismo vector\n" +
          "½P + ½Q     cae en " + par(M).padEnd(14) + "cae en " + par(V.sumar(O2, V.lerp(rel(P), rel(Q), 0.5))) + "   ← el mismo sitio\n" +
          "P + Q       cae en " + par(S).padEnd(14) + "cae en " + par(S2) + "   ← ¡depende del origen!";
      },
    });
  });

  /* ---------------------------------------------------------------
     Cinco sistemas de coordenadas para el mismo punto del lienzo
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-sistemas");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let sistema = "pantalla", dprSim = false;

    function flecha(ctx, x0, y0, x1, y1, color) {
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.save(); ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - 9 * Math.cos(a), y1 - 9 * Math.sin(a)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - 13 * Math.cos(a - 0.4), y1 - 13 * Math.sin(a - 0.4));
      ctx.lineTo(x1 - 13 * Math.cos(a + 0.4), y1 - 13 * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function etiqueta(ctx, txt, x, y, alinear, base, color, c) {
      ctx.save(); ctx.font = "600 12.5px " + c.mono; ctx.textAlign = alinear; ctx.textBaseline = base;
      const m = ctx.measureText(txt), pw = m.width + 10, ph = 19;
      const bx = alinear === "left" ? x : alinear === "right" ? x - pw : x - pw / 2;
      const by = base === "top" ? y : base === "bottom" ? y - ph : y - ph / 2;
      ctx.fillStyle = c.superficie; ctx.globalAlpha = 0.9; ctx.fillRect(bx, by, pw, ph); ctx.globalAlpha = 1;
      ctx.fillStyle = color; ctx.fillText(txt, alinear === "left" ? x + 5 : alinear === "right" ? x - 5 : x, base === "top" ? y + 4 : base === "bottom" ? y - 4 : y);
      ctx.restore();
    }

    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const { w, h } = e, c = e.colores;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = c.rejilla; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 50; x < w; x += 50) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
        for (let y = 50; y < h; y += 50) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
        ctx.stroke();

        const dpr = dprSim ? 2 : (window.devicePixelRatio || 1);
        const pos = e.raton.dentro ? { x: e.raton.x, y: e.raton.y } : { x: w * 0.7, y: h * 0.3 };
        const W = w * dpr, H = h * dpr, asp = w / h;
        const col = c.acento, m = 3;
        // ejes y esquinas del sistema elegido
        if (sistema === "pantalla") {
          flecha(ctx, m, m, 90, m, col); flecha(ctx, m, m, m, 80, col);
          etiqueta(ctx, "x", 94, m, "left", "top", col, c); etiqueta(ctx, "y", m, 84, "left", "top", col, c);
          etiqueta(ctx, "(0, 0)", 12, 14, "left", "top", c.texto, c);
          etiqueta(ctx, "(" + f(w, 0) + ", " + f(h, 0) + ")", w - 6, h - 6, "right", "bottom", c.texto, c);
        } else if (sistema === "gl" || sistema === "uv") {
          flecha(ctx, m, h - m, 90, h - m, col); flecha(ctx, m, h - m, m, h - 80, col);
          etiqueta(ctx, "x", 94, h - m, "left", "bottom", col, c); etiqueta(ctx, "y", m + 4, h - 84, "left", "bottom", col, c);
          etiqueta(ctx, "(0, 0)", 12, h - 14, "left", "bottom", c.texto, c);
          etiqueta(ctx, sistema === "gl" ? "(" + f(W, 0) + ", " + f(H, 0) + ")" : "(1, 1)", w - 6, 6, "right", "top", c.texto, c);
        } else {
          flecha(ctx, w / 2, h / 2, w / 2 + 90, h / 2, col); flecha(ctx, w / 2, h / 2, w / 2, h / 2 - 80, col);
          ctx.save(); ctx.strokeStyle = c.eje; ctx.setLineDash([4, 5]); ctx.beginPath();
          ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5); ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h); ctx.stroke(); ctx.restore();
          etiqueta(ctx, "(0, 0)", w / 2 + 6, h / 2 + 6, "left", "top", c.texto, c);
          const ax = sistema === "ndc" ? 1 : asp;
          etiqueta(ctx, "(" + f(-ax, 2) + ", -1)", 6, h - 6, "left", "bottom", c.texto, c);
          etiqueta(ctx, "(" + f(ax, 2) + ", 1)", w - 6, 6, "right", "top", c.texto, c);
        }
        // el puntero
        ctx.save(); ctx.strokeStyle = c.acento2; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(pos.x, 0); ctx.lineTo(pos.x, h); ctx.moveTo(0, pos.y); ctx.lineTo(w, pos.y); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = c.acento2; ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        const gx = Math.floor(pos.x * dpr) + 0.5, gy = Math.floor((h - pos.y) * dpr) + 0.5;
        const fila = (nombre, a, b, d) => nombre.padEnd(30) + "x = " + f(a, d, 8) + "   y = " + f(b, d, 8);
        info.textContent = [
          fila("pantalla (px CSS, y ↓)", pos.x, pos.y, 1),
          fila("gl_FragCoord (físicos, y ↑)", gx, gy, 1) + "   (dpr = " + dpr + ")",
          fila("uv (0..1, y ↑)", pos.x / w, 1 - pos.y / h, 3),
          fila("NDC (−1..1, y ↑)", 2 * pos.x / w - 1, 1 - 2 * pos.y / h, 3),
          fila("centrado p (÷ alto, y ↑)", (2 * pos.x - w) / h, (h - 2 * pos.y) / h, 3),
        ].join("\n") + (e.raton.dentro ? "" : "\n(mueve el ratón por el lienzo)");
      },
    });
    Curso.selector(ctrls, {
      etiqueta: "Ejes:", valor: "pantalla",
      opciones: [["pantalla", "pantalla / Canvas 2D"], ["gl", "gl_FragCoord"], ["uv", "uv"], ["ndc", "NDC"], ["centrado", "centrado (p)"]],
      alCambiar: (v) => { sistema = v; lz.redibujar(); },
    });
    Curso.casilla(ctrls, { etiqueta: "simular devicePixelRatio = 2", valor: false, alCambiar: (v) => { dprSim = v; lz.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Suma, resta y producto por escalar
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-operaciones");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let modo = "suma", k = 1.5;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 6],
      puntos: { a: { x: 2.5, y: 0.5, etiqueta: "a", color: "acento" }, b: { x: 1, y: 1.8, etiqueta: "b", color: "acento2" } },
      dibujar(p, pts) {
        const a = pts.a, b = pts.b, O = [0, 0];
        pts.b.oculto = modo === "escala";
        if (modo === "suma") {
          const s = V.sumar(a, b);
          p.ctx.save(); p.ctx.globalAlpha = 0.12; p.poligono([O, a, s, b], { relleno: "verde", color: null }); p.ctx.restore();
          p.flecha(a, s, { color: "acento2", discontinua: true, grosor: 2 });
          p.flecha(b, s, { color: "acento", discontinua: true, grosor: 2 });
          p.flecha(O, a, { color: "acento" });
          p.flecha(O, b, { color: "acento2" });
          p.flecha(O, s, { color: "verde", etiqueta: "a + b" });
          info.textContent = "a + b = " + par(a) + " + " + par(b) + " = " + par(s) +
            "\nDiscontinuas: b trasladado a la punta de a, y a a la punta de b. Los dos caminos llegan al mismo sitio.";
        } else if (modo === "resta") {
          const d = V.restar(b, a);
          p.flecha(O, a, { color: "acento" });
          p.flecha(O, b, { color: "acento2" });
          p.flecha(a, b, { color: "verde", etiqueta: "b − a" });
          p.flecha(O, d, { color: "verde", discontinua: true, grosor: 1.5 });
          p.texto(d, "b − a (trasladado al origen)", { color: "verde", desplazamiento: [8, -10], tam: 12 });
          info.textContent = "b − a = " + par(b) + " − " + par(a) + " = " + par(d) +
            "\nVa de la punta de a a la punta de b: «destino menos origen». Trasladado al origen sigue siendo el mismo vector.";
        } else {
          const s = V.escalar(a, k);
          p.flecha(O, a, { color: "acento", discontinua: true, grosor: 1.5 });
          p.flecha(O, s, { color: "verde", etiqueta: f(k, 2) + " · a" });
          info.textContent = "k · a = " + f(k, 2) + " · " + par(a) + " = " + par(s) +
            "\n|k · a| = " + f(Math.abs(k), 2) + " · |a| = " + f(Math.hypot(s.x, s.y), 2) + (k < 0 ? "   (k < 0: se da la vuelta)" : k === 0 ? "   (k = 0: vector nulo, sin dirección)" : "");
        }
      },
    });
    Curso.selector(ctrls, { etiqueta: "Operación:", valor: "suma", opciones: [["suma", "a + b"], ["resta", "b − a"], ["escala", "k · a"]], alCambiar: (v) => { modo = v; pl.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "k", min: -2, max: 2, paso: 0.05, valor: k, alCambiar: (v) => { k = v; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Longitud (Pitágoras) y normalización
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-longitud");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-4.5, 4.5], iman: 0.25,
      puntos: { v: { x: 2.5, y: 1.5, etiqueta: "v", color: "acento" } },
      dibujar(p, pts) {
        const v = pts.v, O = [0, 0];
        p.circulo(O, 1, { color: "tenue", discontinua: true });
        p.texto([0.72, -0.72], "círculo unidad", { color: "tenue", tam: 11.5 });
        if (v.x !== 0 && v.y !== 0) {
          // marca de ángulo recto en (vx, 0)
          const sx = Math.sign(v.x) * 0.2, sy = Math.sign(v.y) * 0.2;
          p.poligono([[v.x - sx, 0], [v.x - sx, sy], [v.x, sy]], { color: "tenue", cerrar: false, grosor: 1 });
        }
        p.linea(O, [v.x, 0], { color: "naranja", grosor: 2.5 });
        p.linea([v.x, 0], [v.x, v.y], { color: "azul", grosor: 2.5 });
        if (Math.abs(v.x) > 0.3) p.texto([v.x / 2, 0], "vx", { color: "naranja", alinear: "center", desplazamiento: [0, v.y >= 0 ? 13 : -13], negrita: true });
        if (Math.abs(v.y) > 0.3) p.texto([v.x, v.y / 2], "vy", { color: "azul", alinear: v.x >= 0 ? "left" : "right", desplazamiento: [v.x >= 0 ? 7 : -7, 0], negrita: true });
        p.flecha(O, v, { color: "acento" });
        const L = Math.hypot(v.x, v.y);
        const u = { x: v.x / L, y: v.y / L };
        if (L > 0) p.flecha(O, u, { color: "verde", grosor: 4 });
        let txt = "|v| = √(vx² + vy²) = √(" + f(v.x * v.x, 4) + " + " + f(v.y * v.y, 4) + ") = " + f(L, 4);
        if (L > 0) txt += "\nv̂ = v / |v| = " + par(u, 4) + "      |v̂| = " + f(Math.hypot(u.x, u.y), 4) + "   (en verde)";
        else txt += "\nv̂ = v / |v| = (0/0, 0/0) = " + "(" + f(u.x) + ", " + f(u.y) + ")   ← el vector nulo no tiene dirección";
        info.textContent = txt;
      },
    });
  });

  /* ---------------------------------------------------------------
     lerp entre dos puntos
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-lerp");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let t = 0.35, animar = false, t0 = 0, ctl = null;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 6],
      puntos: { A: { x: -3.5, y: -1.2, etiqueta: "A", color: "acento" }, B: { x: 3, y: 1.4, etiqueta: "B", color: "acento2" } },
      dibujar(p, pts, est) {
        if (animar) { t = 0.5 - 0.5 * Math.cos((est.t - t0) * 1.8); if (ctl) ctl.valor = t; }
        const A = pts.A, B = pts.B, d = V.restar(B, A);
        p.linea(V.sumar(A, V.escalar(d, -4)), V.sumar(A, V.escalar(d, 5)), { color: "tenue", discontinua: [3, 5], grosor: 1 });
        p.linea(A, B, { color: "texto2", grosor: 2.5 });
        const P = V.lerp(A, B, t);
        const fuera = t < 0 || t > 1;
        p.flecha(A, P, { color: fuera ? "naranja" : "verde", grosor: 2 });
        p.punto(P, { color: fuera ? "naranja" : "verde", radio: 7, etiqueta: "P(t)" });
        info.textContent =
          "P = A + (B − A)·t = " + par(A) + " + " + par(d) + "·" + f(t, 2) + " = " + par(P) + "\n" +
          "  = (1 − t)·A + t·B   con pesos " + f(1 - t, 2) + " (para A) y " + f(t, 2) + " (para B); suman 1" +
          (fuera ? "\n  t fuera de [0, 1]: extrapolación, P sigue la recta más allá de " + (t < 0 ? "A" : "B") : "");
      },
    });
    ctl = Curso.control(ctrls, { etiqueta: "t", min: -0.5, max: 1.5, paso: 0.01, valor: t, alCambiar: (v) => { t = v; pl.redibujar(); } });
    Curso.casilla(ctrls, { etiqueta: "animar t entre 0 y 1", valor: false, alCambiar: (v) => { animar = v; t0 = pl.lienzo.estado.t; pl.lienzo.animar(v); } });
  });

  /* ---------------------------------------------------------------
     El bug de la diagonal: entrada cruda contra entrada limitada
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-diagonal");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    function limitar(v, max) {
      const l2 = v.x * v.x + v.y * v.y;
      if (l2 <= max * max) return { x: v.x, y: v.y };
      const k = max / Math.sqrt(l2);
      return { x: v.x * k, y: v.y * k };
    }
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-1.7, 6.3], animar: true,
      puntos: { J: { x: 1, y: 1, etiqueta: "J", color: "acento" } },
      restringir(n, q) { q.x = Math.max(-1, Math.min(1, q.x)); q.y = Math.max(-1, Math.min(1, q.y)); },
      dibujar(p, pts, est) {
        const J = pts.J, O = [0, 0];
        p.poligono([[-1, -1], [1, -1], [1, 1], [-1, 1]], { color: "texto2", grosor: 1.5 });
        p.circulo(O, 1, { color: "tenue", discontinua: true });
        p.texto([1, -1], "recorrido del mando", { color: "tenue", alinear: "right", desplazamiento: [0, 14], tam: 11.5 });
        const Jl = limitar(J, 1);
        p.flecha(O, J, { color: "error", grosor: 2 });
        p.flecha(O, Jl, { color: "ok", grosor: 3 });
        const C = { x: 3.9, y: 0 }, R = 1.5, T = 1.6;
        p.circulo(C, R, { color: "tenue", discontinua: true });
        p.texto([C.x, C.y - R], "alcance en " + T + " s a velocidad 1", { color: "tenue", alinear: "center", desplazamiento: [0, 14], tam: 11.5 });
        const s = (est.t % T) / T;
        const pr = V.sumar(C, V.escalar(J, R * s)), pv = V.sumar(C, V.escalar(Jl, R * s));
        p.linea(C, pr, { color: "error", grosor: 1, discontinua: [3, 4] });
        p.punto(C, { color: "tenue", radio: 3 });
        p.punto(pr, { color: "error", radio: 7 });
        p.punto(pv, { color: "ok", radio: 7 });
        const L = Math.hypot(J.x, J.y);
        info.textContent =
          "entrada cruda    J = " + par(J) + "   |J| = " + f(L, 3) + "   → rapidez " + f(L * 100, 0) + " %   (rojo)\n" +
          "entrada limitada    " + par(Jl) + "   |J| = " + f(Math.hypot(Jl.x, Jl.y), 3) + "   → rapidez " + f(Math.hypot(Jl.x, Jl.y) * 100, 0) + " %   (verde)";
      },
    });
  });
})();
