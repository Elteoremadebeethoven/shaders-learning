/* Demos de la lección 3.5 · Matrices y transformaciones */
(function () {
  "use strict";
  const f = M3.f;
  const rad = (g) => g * Math.PI / 180;

  /* Matrices afines 2D como [a, b, c, d, e, f] (el orden de matrix() de CSS):
       x' = a·x + c·y + e
       y' = b·x + d·y + f          (columnas: (a,b), (c,d) y la traslación (e,f)) */
  const A = {
    id: () => [1, 0, 0, 1, 0, 0],
    T: (x, y) => [1, 0, 0, 1, x, y],
    R: (t) => [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t), 0, 0],
    S: (x, y) => [x, 0, 0, y, 0, 0],
    K: (k) => [1, 0, k, 1, 0, 0],
    mul(P, Q) {                       // P·Q: primero Q, después P
      return [
        P[0] * Q[0] + P[2] * Q[1], P[1] * Q[0] + P[3] * Q[1],
        P[0] * Q[2] + P[2] * Q[3], P[1] * Q[2] + P[3] * Q[3],
        P[0] * Q[4] + P[2] * Q[5] + P[4], P[1] * Q[4] + P[3] * Q[5] + P[5],
      ];
    },
    aplicar: (M, p) => { const x = Array.isArray(p) ? p[0] : p.x, y = Array.isArray(p) ? p[1] : p.y; return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]; },
    inversa(M) {
      const det = M[0] * M[3] - M[1] * M[2];
      const a = M[3] / det, b = -M[1] / det, c = -M[2] / det, d = M[0] / det;
      return [a, b, c, d, -(a * M[4] + c * M[5]), -(b * M[4] + d * M[5])];
    },
    texto(M, d) {
      d = d === undefined ? 2 : d;
      const w = d + 5;
      return ["| " + f(M[0], d, w) + " " + f(M[2], d, w) + " " + f(M[4], d, w) + " |",
              "| " + f(M[1], d, w) + " " + f(M[3], d, w) + " " + f(M[5], d, w) + " |",
              "| " + f(0, d, w) + " " + f(0, d, w) + " " + f(1, d, w) + " |"];
    },
  };
  M3.afin = A;

  // La F de las demos (en su espacio local)
  const F = [[0, 0], [0.4, 0], [0.4, 0.9], [1, 0.9], [1, 1.3], [0.4, 1.3], [0.4, 1.6], [1.4, 1.6], [1.4, 2], [0, 2]];

  /* ---------------------------------------------------------------
     Una matriz es adónde van los ejes: arrastrar î' y ĵ'
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-base");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-5, 5], iman: 0.05,
      puntos: {
        I: { x: 1.2, y: 0.3, etiqueta: "î′", color: "rosa" },
        J: { x: -0.4, y: 1.1, etiqueta: "ĵ′", color: "azul" },
        P: { x: 1.5, y: 1, etiqueta: "P", color: "tenue", radio: 5 },
      },
      dibujar(p, pts) {
        const I = pts.I, J = pts.J, P = pts.P;
        const M = (v) => [v[0] * I.x + v[1] * J.x, v[0] * I.y + v[1] * J.y];
        p.ctx.save(); p.ctx.globalAlpha = 0.3;
        for (let k = -8; k <= 8; k++) {
          p.linea(M([k, -8]), M([k, 8]), { color: "acento", grosor: 1 });
          p.linea(M([-8, k]), M([8, k]), { color: "acento", grosor: 1 });
        }
        p.ctx.restore();
        p.ctx.save(); p.ctx.globalAlpha = 0.2;
        p.poligono([M([0, 0]), M([1, 0]), M([1, 1]), M([0, 1])], { relleno: "verde", color: null });
        p.ctx.restore();
        p.ctx.save(); p.ctx.setLineDash([4, 4]); p.poligono(F, { color: "tenue", grosor: 1.2 }); p.ctx.restore();
        const Ft = F.map(M);
        p.ctx.save(); p.ctx.globalAlpha = 0.3; p.poligono(Ft, { relleno: "amarillo", color: null }); p.ctx.restore();
        p.poligono(Ft, { color: "amarillo", grosor: 2 });
        p.flecha([0, 0], I, { color: "rosa", grosor: 3.5 });
        p.flecha([0, 0], J, { color: "azul", grosor: 3.5 });
        const xi = [P.x * I.x, P.x * I.y];
        const Pp = M([P.x, P.y]);
        p.flecha([0, 0], xi, { color: "rosa", discontinua: true, grosor: 1.5 });
        p.flecha(xi, Pp, { color: "azul", discontinua: true, grosor: 1.5 });
        p.punto(Pp, { color: "texto", radio: 6, etiqueta: "P′" });
        const det = I.x * J.y - J.x * I.y;
        info.textContent =
          "M = | " + f(I.x, 2, 6) + " " + f(J.x, 2, 6) + " |    columnas: î′ = (a, b) = (" + f(I.x) + ", " + f(I.y) + ")   ĵ′ = (c, d) = (" + f(J.x) + ", " + f(J.y) + ")\n" +
          "    | " + f(I.y, 2, 6) + " " + f(J.y, 2, 6) + " |    det M = ad − bc = " + f(det, 3) +
          (Math.abs(det) < 0.02 ? "   ← ¡aplastado! sin inversa" : det < 0 ? "   ← negativo: la F sale reflejada" : "   (el área verde, que era 1)") + "\n" +
          "P = (" + f(P.x) + ", " + f(P.y) + ")  →  P′ = " + f(P.x) + "·î′ + " + f(P.y) + "·ĵ′ = (" + f(Pp[0]) + ", " + f(Pp[1]) + ")";
      },
    });
    const poner = (ix, iy, jx, jy) => { const q = pl.puntos; q.I.x = ix; q.I.y = iy; q.J.x = jx; q.J.y = jy; pl.redibujar(); };
    const c30 = Math.cos(rad(30)), s30 = Math.sin(rad(30));
    Curso.boton(ctrls, "identidad", () => poner(1, 0, 0, 1));
    Curso.boton(ctrls, "rotación 30°", () => poner(c30, s30, -s30, c30));
    Curso.boton(ctrls, "escala (1.5, 0.6)", () => poner(1.5, 0, 0, 0.6));
    Curso.boton(ctrls, "cizalla", () => poner(1, 0, 0.8, 1));
    Curso.boton(ctrls, "reflejo", () => poner(-1, 0, 0, 1));
    Curso.boton(ctrls, "aplastar (det = 0)", () => poner(1, 0.5, 2, 1));
  });

  /* ---------------------------------------------------------------
     El orden importa: X luego Y frente a Y luego X
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-orden");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const ops = {
      T: ["trasladar (2.5, 0.5)", A.T(2.5, 0.5)],
      R: ["rotar 60°", A.R(rad(60))],
      S: ["escalar (1.8, 0.6)", A.S(1.8, 0.6)],
      K: ["cizallar (k = 0.8)", A.K(0.8)],
    };
    let primero = "R", despues = "T";
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-5, 7], centroY: 2.1,
      dibujar(p) {
        const X = ops[primero][1], Y = ops[despues][1];
        const M1 = A.mul(Y, X), M2 = A.mul(X, Y);
        p.ctx.save(); p.ctx.setLineDash([4, 4]); p.poligono(F, { color: "tenue", grosor: 1.2 }); p.ctx.restore();
        p.ctx.save(); p.ctx.setLineDash([6, 4]); p.poligono(F.map((q) => A.aplicar(X, q)), { color: "acento", grosor: 1.2 }); p.ctx.restore();
        const f1 = F.map((q) => A.aplicar(M1, q)), f2 = F.map((q) => A.aplicar(M2, q));
        p.ctx.save(); p.ctx.globalAlpha = 0.3; p.poligono(f2, { relleno: "rosa", color: null }); p.poligono(f1, { relleno: "acento", color: null }); p.ctx.restore();
        p.poligono(f2, { color: "rosa", grosor: 2 });
        p.poligono(f1, { color: "acento", grosor: 2 });
        p.texto(A.aplicar(M1, [0.7, 2.3]), "1.º " + primero + ", 2.º " + despues, { color: "acento", negrita: true, alinear: "center" });
        p.texto(A.aplicar(M2, [0.7, 2.3]), "1.º " + despues + ", 2.º " + primero, { color: "rosa", negrita: true, alinear: "center" });
        const t1 = A.texto(M1), t2 = A.texto(M2);
        const iguales = M1.every((v, i) => Math.abs(v - M2[i]) < 1e-9);
        info.textContent =
          "violeta: primero " + ops[primero][0] + ", después " + ops[despues][0] + "  →  M = " + despues + "·" + primero + "\n" +
          "rosa:    primero " + ops[despues][0] + ", después " + ops[primero][0] + "  →  M = " + primero + "·" + despues + "\n" +
          "  " + despues + "·" + primero + " = " + t1[0] + "      " + primero + "·" + despues + " = " + t2[0] + "\n" +
          "        " + t1[1] + "              " + t2[1] + "\n" +
          "        " + t1[2] + "              " + t2[2] + "\n" +
          (iguales ? "Estas dos operaciones conmutan: el orden no importa (caso especial)." : "Distintas: el producto de matrices no es conmutativo. (Discontinua violeta: la F tras el primer paso.)");
      },
    });
    const opciones = Object.keys(ops).map((k) => [k, k + ": " + ops[k][0]]);
    Curso.selector(ctrls, { etiqueta: "Primero:", valor: primero, opciones, alCambiar: (v) => { primero = v; pl.redibujar(); } });
    Curso.selector(ctrls, { etiqueta: "Después:", valor: despues, opciones, alCambiar: (v) => { despues = v; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     TRS con un elemento CSS real: matriz del navegador contra la nuestra
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-trs");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const caja = document.getElementById("trs-caja");
    const st = { tx: 90, ty: -30, rot: 30, sx: 1.4, sy: 1, orden: "TRS", origen: "centro" };
    const nombres = { T: "translate", R: "rotate", S: "scale" };
    const r3 = (v) => { const s = (Math.round(v * 1000) / 1000).toString(); return s === "-0" ? "0" : s; };
    function aplicar() {
      const partes = { T: "translate(" + st.tx + "px, " + st.ty + "px)", R: "rotate(" + st.rot + "deg)", S: "scale(" + st.sx + ", " + st.sy + ")" };
      const css = st.orden.split("").map((k) => partes[k]).join(" ");
      caja.style.transform = css;
      caja.style.transformOrigin = st.origen === "centro" ? "50% 50%" : "0 0";
      const mats = { T: A.T(st.tx, st.ty), R: A.R(rad(st.rot)), S: A.S(st.sx, st.sy) };
      let M = A.id();
      for (const k of st.orden) M = A.mul(M, mats[k]);
      const nav = getComputedStyle(caja).transform;
      const lectura = st.orden.split("").reverse().map((k) => nombres[k]).join(", luego ");
      info.textContent =
        "transform: " + css + "\n" +
        "se aplica de derecha a izquierda: primero " + lectura + "\n" +
        "navegador (getComputedStyle):  " + nav + "\n" +
        "nuestra matriz " + st.orden.split("").join("·") + ":        matrix(" + M.map(r3).join(", ") + ")\n" +
        "transform-origin: " + (st.origen === "centro" ? "50% 50%, el centro de la caja: todo gira y escala alrededor de ese punto" : "0 0, la esquina superior izquierda de la caja");
    }
    const ctl = (etq, clave, min, max, paso, fmt) => Curso.control(ctrls, { etiqueta: etq, min, max, paso, valor: st[clave], formato: fmt, alCambiar: (v) => { st[clave] = v; aplicar(); } });
    ctl("translate x", "tx", -200, 200, 1, (v) => v.toFixed(0) + "px");
    ctl("translate y", "ty", -120, 120, 1, (v) => v.toFixed(0) + "px");
    ctl("rotate", "rot", -180, 180, 1, (v) => v.toFixed(0) + "°");
    ctl("scale x", "sx", 0.3, 2, 0.05);
    ctl("scale y", "sy", 0.3, 2, 0.05);
    Curso.selector(ctrls, { etiqueta: "Orden:", valor: st.orden, opciones: ["TRS", "TSR", "RTS", "RST", "STR", "SRT"].map((o) => [o, o.split("").map((k) => nombres[k]).join(" ")]), alCambiar: (v) => { st.orden = v; aplicar(); } });
    Curso.selector(ctrls, { etiqueta: "transform-origin:", valor: "centro", opciones: [["centro", "centro (50% 50%)"], ["esquina", "esquina (0 0)"]], alCambiar: (v) => { st.origen = v; aplicar(); } });
    aplicar();
  });

  /* ---------------------------------------------------------------
     Jerarquía: brazo con hombro y codo, y el ratón en coordenadas locales
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-brazo");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let a1 = 35, a2 = -55;
    const L1 = 3, L2 = 2.4, G = 0.28, base = [-3.5, -1.6];
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6.5, 6.5],
      puntos: { Q: { x: 1.6, y: 1.2, etiqueta: "Q", color: "acento2" } },
      dibujar(p, pts) {
        const Mh = A.mul(A.T(base[0], base[1]), A.R(rad(a1)));
        const Mc = A.mul(A.mul(Mh, A.T(L1, 0)), A.R(rad(a2)));
        const Mm = A.mul(Mc, A.T(L2, 0));
        const Q = pts.Q;
        const ql = A.aplicar(A.inversa(Mc), Q);
        const dentro = ql[0] >= 0 && ql[0] <= L2 && Math.abs(ql[1]) <= G;
        const rect = (M, L) => [[0, -G], [L, -G], [L, G], [0, G]].map((q) => A.aplicar(M, q));
        p.ctx.save(); p.ctx.globalAlpha = 0.85;
        p.poligono(rect(Mh, L1), { relleno: "borde2", color: "texto2", grosor: 1.5 });
        p.poligono(rect(Mc, L2), { relleno: dentro ? "acento" : "borde2", color: dentro ? "acento" : "texto2", grosor: 1.5 });
        p.ctx.restore();
        // ejes locales de cada pieza
        const ejes = (M, largo) => {
          const O = A.aplicar(M, [0, 0]);
          p.flecha(O, A.aplicar(M, [largo, 0]), { color: "rosa", grosor: 2 });
          p.flecha(O, A.aplicar(M, [0, largo]), { color: "verde", grosor: 2 });
        };
        ejes(Mh, 0.9); ejes(Mc, 0.9);
        p.punto(A.aplicar(Mh, [0, 0]), { color: "texto", radio: 6 });
        p.punto(A.aplicar(Mc, [0, 0]), { color: "texto", radio: 6 });
        const mano = A.aplicar(Mm, [0, 0]);
        p.punto(mano, { color: "amarillo", radio: 8, etiqueta: "mano" });
        p.linea(A.aplicar(Mc, [0, 0]), Q, { color: "acento2", discontinua: [2, 4], grosor: 1 });
        info.textContent =
          "M_hombro = T(base)·R(" + a1 + "°)    M_codo = M_hombro·T(" + L1 + ", 0)·R(" + a2 + "°)    M_mano = M_codo·T(" + L2 + ", 0)\n" +
          "mano = M_mano·(0, 0, 1) = (" + f(mano[0]) + ", " + f(mano[1]) + ")\n" +
          "Q en coordenadas del antebrazo = M_codo⁻¹·Q = (" + f(ql[0]) + ", " + f(ql[1]) + ")  →  " +
          (dentro ? "DENTRO (0 ≤ x ≤ " + L2 + " y |y| ≤ " + G + "): el ratón toca el antebrazo" : "fuera del antebrazo") + "\n" +
          "(flechas rosa y verde: los ejes x e y locales de cada pieza)";
      },
    });
    Curso.control(ctrls, { etiqueta: "hombro α₁", min: -180, max: 180, paso: 1, valor: a1, formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { a1 = v; pl.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "codo α₂", min: -180, max: 180, paso: 1, valor: a2, formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { a2 = v; pl.redibujar(); } });
  });
})();
