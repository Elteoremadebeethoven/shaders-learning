/* =====================================================================
   m3.js — utilidades compartidas por las demos de la PÁGINA del módulo 3.
   (Los playgrounds JS se ejecutan en iframes aislados y no ven este archivo:
   allí cada ejemplo trae su propio código, completo y a la vista.)
   ===================================================================== */
(function () {
  "use strict";
  const M3 = (window.M3 = window.M3 || {});

  /* Formatea un número con d decimales, ancho fijo y los casos raros visibles. */
  M3.f = function (x, d, ancho) {
    d = d === undefined ? 2 : d;
    let s;
    if (Number.isNaN(x)) s = "NaN";
    else if (x === Infinity) s = "Inf";
    else if (x === -Infinity) s = "-Inf";
    else { s = x.toFixed(d); if (/^-0\.?0*$/.test(s)) s = s.slice(1); }
    return ancho ? s.padStart(ancho) : s;
  };
  /* "(x, y)" con formato */
  M3.par = (v, d) => "(" + M3.f(v.x, d) + ", " + M3.f(v.y, d) + ")";

  /* Vectores 2D como objetos {x, y}: lo mismo que los puntos de Curso.plano. */
  const V = (M3.v = {
    de: (x, y) => ({ x, y }),
    sumar: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    restar: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    escalar: (a, k) => ({ x: a.x * k, y: a.y * k }),
    punto: (a, b) => a.x * b.x + a.y * b.y,
    cruz: (a, b) => a.x * b.y - a.y * b.x,
    longitud: (a) => Math.hypot(a.x, a.y),
    normalizar: (a) => { const l = Math.hypot(a.x, a.y); return { x: a.x / l, y: a.y / l }; },
    lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
    rotar: (a, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }; },
    perp: (a) => ({ x: -a.y, y: a.x }),
    arr: (a) => [a.x, a.y],
  });

  /* Dibuja el ángulo entre dos direcciones con un arco (en un Curso.plano). */
  M3.arcoAngulo = function (p, centro, dirA, dirB, r, estilo) {
    const a0 = Math.atan2(dirA.y, dirA.x);
    let a1 = Math.atan2(dirB.y, dirB.x);
    let d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (d >= 0) p.arco(centro, r, a0, a0 + d, estilo);
    else p.arco(centro, r, a0 + d, a0, estilo);
    return d;
  };
})();
