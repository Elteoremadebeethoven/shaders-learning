/* =====================================================================
   m2.js — utilidades compartidas por las demos del módulo 2
   (se carga después de widgets.js; las demos van dentro de Curso.alListo)

   M2.ocupar(ms)                 bloquea el hilo principal `ms` milisegundos
   M2.cubicBezier(x1,y1,x2,y2)   función de easing idéntica a la de CSS
   M2.graficaFrames(ctx, caja, deltas, op)  barras de tiempos de frame
   M2.easings                    las funciones de easing de la lección 2.4
   M2.mediana(array)
   ===================================================================== */
(function () {
  "use strict";
  const M2 = (window.M2 = window.M2 || {});

  /* Espera activa: ocupa el hilo principal sin soltarlo (a propósito). */
  M2.ocupar = function (ms) {
    const t0 = performance.now();
    let x = 0;
    while (performance.now() - t0 < ms) x++;
    return x;
  };

  M2.mediana = function (a) {
    if (!a.length) return 0;
    const b = a.slice().sort((p, q) => p - q);
    const m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  };

  /* cubic-bezier como en CSS: P0=(0,0), P3=(1,1).
     Dado el progreso del tiempo x, busca el parámetro s con X(s) = x
     (Newton-Raphson y, si no converge, bisección) y devuelve Y(s). */
  M2.cubicBezier = function (x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (s) => ((ax * s + bx) * s + cx) * s;
    const Y = (s) => ((ay * s + by) * s + cy) * s;
    const dX = (s) => (3 * ax * s + 2 * bx) * s + cx;
    function resolver(x) {
      let s = x;
      for (let i = 0; i < 8; i++) {
        const e = X(s) - x;
        if (Math.abs(e) < 1e-7) return s;
        const d = dX(s);
        if (Math.abs(d) < 1e-6) break;
        s -= e / d;
      }
      let lo = 0, hi = 1;
      s = x;
      while (hi - lo > 1e-7) { if (X(s) < x) lo = s; else hi = s; s = (lo + hi) / 2; }
      return s;
    }
    const f = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Y(resolver(x)));
    f.X = X; f.Y = Y;
    return f;
  };

  /* Gráfica de barras de tiempos de frame (ms).
     caja = {x, y, w, h}; op = {max (ms), periodo (ms), colores (Curso.colores())} */
  M2.graficaFrames = function (ctx, caja, deltas, op) {
    op = op || {};
    const c = op.colores || Curso.colores();
    const max = op.max || 50, periodo = op.periodo || 1000 / 60;
    const { x, y, w, h } = caja;
    ctx.save();
    ctx.fillStyle = c.superficie; ctx.globalAlpha = 0.6; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    const aY = (ms) => y + h - Math.min(ms, max) / max * h;
    // líneas de referencia: 1, 2 y 3 periodos
    ctx.font = "11px " + c.mono; ctx.textBaseline = "bottom"; ctx.textAlign = "right";
    for (let k = 1; k <= 3; k++) {
      const ms = periodo * k; if (ms > max) break;
      const Y = Math.round(aY(ms)) + 0.5;
      ctx.strokeStyle = k === 1 ? c.ok : c.aviso; ctx.globalAlpha = 0.55; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, Y); ctx.lineTo(x + w, Y); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.fillStyle = c.tenue;
      ctx.fillText(ms.toFixed(1) + " ms", x + w - 4, Y - 2);
    }
    const n = deltas.length, anchoBarra = w / (op.capacidad || Math.max(n, 1));
    for (let i = 0; i < n; i++) {
      const d = deltas[i];
      ctx.fillStyle = d > periodo * 2.5 ? c.error : d > periodo * 1.5 ? c.aviso : c.acento2;
      const X = x + i * anchoBarra, Y = aY(d);
      ctx.fillRect(X, Y, Math.max(1, anchoBarra - 1), y + h - Y);
    }
    ctx.restore();
  };

  /* Easings de la lección 2.4 (t en [0,1]) */
  const c1 = 1.70158, c3 = c1 + 1, c4 = (2 * Math.PI) / 3;
  function bounceOut(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
  const inAOut = (fin) => (t) => 1 - fin(1 - t);
  const inAInOut = (fin) => (t) => (t < 0.5 ? fin(2 * t) / 2 : 1 - fin(2 - 2 * t) / 2);
  const bases = {
    lineal: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    quart: (t) => t * t * t * t,
    sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    expo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    back: (t) => c3 * t * t * t - c1 * t * t,
    elastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)),
    bounce: (t) => 1 - bounceOut(1 - t),
  };
  M2.easings = {};
  for (const k in bases) {
    M2.easings[k + "In"] = bases[k];
    M2.easings[k + "Out"] = inAOut(bases[k]);
    M2.easings[k + "InOut"] = inAInOut(bases[k]);
  }
  M2.easings.smoothstep = (t) => t * t * (3 - 2 * t);
  M2.easings.smootherstep = (t) => t * t * t * (t * (6 * t - 15) + 10);
})();
