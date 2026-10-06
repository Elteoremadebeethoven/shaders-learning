/* Demos de la lección 3.2 · Producto punto y producto cruz */
(function () {
  "use strict";
  const V = M3.v, f = M3.f, par = M3.par;
  const grados = (r) => r * 180 / Math.PI;

  /* ---------------------------------------------------------------
     Producto punto: algebraico = geométrico, y la sombra de b sobre a
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-punto");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 6],
      puntos: { a: { x: 3.5, y: 0.8, etiqueta: "a", color: "acento" }, b: { x: 1.5, y: 2.2, etiqueta: "b", color: "acento2" } },
      dibujar(p, pts) {
        const a = pts.a, b = pts.b, O = [0, 0];
        const la = V.longitud(a), lb = V.longitud(b), d = V.punto(a, b);
        if (la < 1e-6 || lb < 1e-6) { p.flecha(O, a); p.flecha(O, b, { color: "acento2" }); info.textContent = "Uno de los vectores es nulo: no hay ángulo."; return; }
        const c = d / (la * lb);
        const colorSigno = Math.abs(c) < 0.03 ? "amarillo" : d > 0 ? "verde" : "rosa";
        const ua = V.escalar(a, 1 / la);
        p.linea(V.escalar(ua, -30), V.escalar(ua, 30), { color: "tenue", discontinua: [3, 5], grosor: 1 });
        const k = d / la;                       // proyección escalar de b sobre â
        const sombra = V.escalar(ua, k);
        p.linea(b, sombra, { color: "tenue", discontinua: true, grosor: 1.2 });
        p.flecha(O, sombra, { color: colorSigno, grosor: 5 });
        M3.arcoAngulo(p, O, a, b, 0.7, { color: "texto2", grosor: 1.5 });
        p.flecha(O, a, { color: "acento" });
        p.flecha(O, b, { color: "acento2" });
        const th = Math.acos(Math.max(-1, Math.min(1, c)));
        info.textContent =
          "a·b = ax·bx + ay·by = " + f(a.x) + "·" + f(b.x) + " + " + f(a.y) + "·" + f(b.y) + " = " + f(d, 3) + "\n" +
          "|a|·|b|·cos θ = " + f(la) + " · " + f(lb) + " · cos(" + f(grados(th), 1) + "°) = " + f(la * lb * Math.cos(th), 3) + "\n" +
          "sombra de b sobre la recta de a:  b·â = " + f(k, 3) + (k < 0 ? "  (negativa: cae hacia atrás)" : "") +
          "     " + (Math.abs(c) < 0.03 ? "≈ perpendiculares" : d > 0 ? "ángulo agudo" : "ángulo obtuso");
      },
    });
  });

  /* ---------------------------------------------------------------
     Cono de visión: delante/detrás y dentro del fov con productos punto
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-cono");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let fov = 80 * Math.PI / 180;
    const ALCANCE = 5;
    let gPrev = { x: -3.5, y: -1.2 };
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-7, 7],
      puntos: {
        G: { x: -3.5, y: -1.2, etiqueta: "G", color: "acento" },
        F: { x: -1.7, y: -0.4, etiqueta: "F", color: "acento2", radio: 6 },
        T: { x: 0.5, y: 0.8, etiqueta: "T", color: "texto" },
      },
      restringir(nombre, q, pts) {
        if (nombre === "G") { pts.F.x += q.x - gPrev.x; pts.F.y += q.y - gPrev.y; }
        gPrev = { x: pts.G.x, y: pts.G.y };
      },
      dibujar(p, pts) {
        const G = pts.G, F = pts.F, T = pts.T;
        gPrev = { x: G.x, y: G.y };
        const fv = V.restar(F, G), lf = V.longitud(fv);
        if (lf < 1e-6) { info.textContent = "F coincide con G: la mirada no tiene dirección."; return; }
        const fh = V.escalar(fv, 1 / lf);
        const ang = Math.atan2(fh.y, fh.x);
        const cosMitad = Math.cos(fov / 2);
        // cono
        p.ctx.save(); p.ctx.globalAlpha = 0.14;
        p.arco(G, ALCANCE, ang - fov / 2, ang + fov / 2, { relleno: "acento" });
        p.ctx.restore();
        p.arco(G, ALCANCE, ang - fov / 2, ang + fov / 2, { color: "acento", grosor: 1 });
        p.linea(G, V.sumar(G, V.escalar(V.rotar(fh, fov / 2), ALCANCE)), { color: "acento", grosor: 1 });
        p.linea(G, V.sumar(G, V.escalar(V.rotar(fh, -fov / 2), ALCANCE)), { color: "acento", grosor: 1 });
        // frontera delante / detrás
        const perp = V.perp(fh);
        p.linea(V.sumar(G, V.escalar(perp, -12)), V.sumar(G, V.escalar(perp, 12)), { color: "tenue", discontinua: [4, 5], grosor: 1 });
        p.texto(V.sumar(G, V.escalar(fh, -0.9)), "detrás", { color: "tenue", alinear: "center", tam: 12 });
        p.flecha(G, F, { color: "acento2", grosor: 2.5 });
        const t = V.restar(T, G), lt = V.longitud(t);
        const delante = V.punto(fh, t);
        const cosAng = lt > 1e-9 ? delante / lt : 1;
        const dentro = cosAng > cosMitad, cerca = lt <= ALCANCE;
        const loVe = dentro && cerca;
        pts.T.color = loVe ? "ok" : "error";
        p.linea(G, T, { color: loVe ? "ok" : "tenue", discontinua: [2, 4], grosor: 1 });
        info.textContent =
          "f̂ = normalize(F − G) = " + par(fh) + "        fov/2 = " + f(grados(fov / 2), 1) + "°   cos(fov/2) = " + f(cosMitad, 3) + "\n" +
          "f̂·(T − G) = " + f(delante, 2) + (delante > 0 ? "  > 0 → T está DELANTE" : "  ≤ 0 → T está DETRÁS") + "\n" +
          "cos(ángulo) = f̂·(T − G) / |T − G| = " + f(cosAng, 3) + (dentro ? "  > " : "  ≤ ") + f(cosMitad, 3) + (dentro ? " → dentro del cono" : " → fuera del cono") + "\n" +
          "|T − G| = " + f(lt, 2) + (cerca ? " ≤ " : " > ") + ALCANCE + "  →  " + (loVe ? "EL GUARDIA TE VE" : "no te ve");
      },
    });
    Curso.control(ctrls, { etiqueta: "fov", min: 10, max: 340, paso: 1, valor: 80, formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { fov = v * Math.PI / 180; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Reflexión: r = d − 2(d·n)n, y qué pasa si n no es unitaria
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-reflect");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let sinNormalizar = false;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 6],
      puntos: {
        D: { x: -3.2, y: 2.0, etiqueta: "D", color: "acento" },
        N: { x: 0.5, y: 1.9, etiqueta: "N", color: "acento2" },
      },
      dibujar(p, pts) {
        const D = pts.D, Np = pts.N, O = { x: 0, y: 0 };
        const ln = V.longitud(Np);
        if (ln < 1e-6) { info.textContent = "La normal es nula."; return; }
        const nh = V.escalar(Np, 1 / ln);
        const n = sinNormalizar ? { x: Np.x, y: Np.y } : nh;
        // espejo: recta por el origen perpendicular a la normal
        const t = V.perp(nh);
        p.linea(V.escalar(t, -20), V.escalar(t, 20), { color: "texto2", grosor: 3 });
        for (let i = -12; i <= 12; i++) {
          const q = V.escalar(t, i * 0.5);
          p.linea(q, V.sumar(q, V.sumar(V.escalar(nh, -0.25), V.escalar(t, -0.15))), { color: "tenue", grosor: 1 });
        }
        const d = V.restar(O, D);                      // dirección de llegada (hasta el origen)
        const dn = V.punto(d, n);
        const dPar = V.escalar(n, dn);                 // componente a lo largo de la normal
        const dPerp = V.restar(d, dPar);               // componente tangente
        const r = V.restar(d, V.escalar(dPar, 2));     // r = d − 2(d·n)n
        // descomposición dibujada en el punto de impacto
        p.flecha(O, dPerp, { color: "tenue", discontinua: true, grosor: 1.5 });
        p.flecha(dPerp, V.sumar(dPerp, V.escalar(dPar, -1)), { color: "naranja", discontinua: true, grosor: 1.5 });
        p.flecha(O, Np, { color: "acento2", grosor: 1.2, discontinua: true });
        p.flecha(O, nh, { color: "acento2", grosor: 3 });
        p.flecha(D, O, { color: "acento", etiqueta: "d" });
        p.flecha(O, r, { color: "verde", etiqueta: "r" });
        const ld = V.longitud(d), lr = V.longitud(r);
        info.textContent =
          "d = " + par(d) + "   n usada = " + par(n) + "   |n| = " + f(V.longitud(n), 3) + (sinNormalizar ? "   ← ¡no es unitaria!" : "") + "\n" +
          "d·n = " + f(dn, 3) + "     r = d − 2(d·n)n = " + par(r) + "\n" +
          "|d| = " + f(ld, 3) + "   |r| = " + f(lr, 3) + (Math.abs(ld - lr) < 1e-6 ? "   (misma longitud: el rebote conserva la rapidez)" : "   ← el rebote ha cambiado la rapidez") + "\n" +
          "Discontinuas: parte tangente de d (gris, se conserva) y parte normal invertida (naranja).";
      },
    });
    Curso.casilla(ctrls, { etiqueta: "usar la normal sin normalizar (el bicho)", valor: false, alCambiar: (v) => { sinNormalizar = v; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Producto cruz en 3D: vista oblicua con a y b arrastrables por el suelo
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-cruz");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const a = [1.6, 0.3, 0], b = [0.4, 1.5, 0];
    let yaw = -0.55, intercambiar = false, arrastre = null;
    const PHI = 28 * Math.PI / 180, sF = Math.sin(PHI), cF = Math.cos(PHI), RMAX = 1.8;
    const cruz3 = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const punto3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const len3 = (u) => Math.hypot(u[0], u[1], u[2]);
    const fmt3 = (u) => "(" + u.map((x) => f(x, 2)).join(", ") + ")";
    let geo = { cx: 0, cy: 0, s: 1 };
    const proy = (x, y, z) => {
      const X = x * Math.cos(yaw) - y * Math.sin(yaw), Y = x * Math.sin(yaw) + y * Math.cos(yaw);
      return [geo.cx + geo.s * X, geo.cy - geo.s * (Y * sF + z * cF)];
    };
    const alSuelo = (sx, sy) => {
      const X = (sx - geo.cx) / geo.s, Y = -(sy - geo.cy) / (geo.s * sF);
      return [X * Math.cos(yaw) + Y * Math.sin(yaw), -X * Math.sin(yaw) + Y * Math.cos(yaw)];
    };
    function flecha(ctx, P0, P1, color, g) {
      const dx = P1[0] - P0[0], dy = P1[1] - P0[1], L = Math.hypot(dx, dy);
      if (L < 1) return;
      const ux = dx / L, uy = dy / L, cab = Math.min(13, L * 0.4);
      ctx.save(); ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = g || 2.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.lineTo(P1[0] - ux * cab * 0.8, P1[1] - uy * cab * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P1[0], P1[1]);
      ctx.lineTo(P1[0] - ux * cab - uy * cab * 0.45, P1[1] - uy * cab + ux * cab * 0.45);
      ctx.lineTo(P1[0] - ux * cab + uy * cab * 0.45, P1[1] - uy * cab - ux * cab * 0.45);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h;
        geo = { cx: w / 2, cy: h * 0.5, s: h / 6 };
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        // suelo
        ctx.strokeStyle = c.rejilla; ctx.lineWidth = 1; ctx.beginPath();
        for (let i = -3; i <= 3; i++) {
          let P = proy(i, -3, 0), Q = proy(i, 3, 0); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]);
          P = proy(-3, i, 0); Q = proy(3, i, 0); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]);
        }
        ctx.stroke();
        const O = proy(0, 0, 0);
        const ejes = [[[2.6, 0, 0], "x"], [[0, 2.6, 0], "y"], [[0, 0, 1.3], "z"]];
        ctx.font = "600 12px " + c.mono;
        for (const [q, nombre] of ejes) {
          const P = proy(q[0], q[1], q[2]);
          ctx.strokeStyle = c.eje; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(P[0], P[1]); ctx.stroke();
          ctx.fillStyle = c.tenue; ctx.fillText(nombre, P[0] + 4, P[1] - 4);
        }
        const u = intercambiar ? b : a, v = intercambiar ? a : b;
        const cr = cruz3(u, v);
        // paralelogramo
        const P1 = proy(a[0], a[1], a[2]), P2 = proy(a[0] + b[0], a[1] + b[1], a[2] + b[2]), P3 = proy(b[0], b[1], b[2]);
        ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = c.verde;
        ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(P1[0], P1[1]); ctx.lineTo(P2[0], P2[1]); ctx.lineTo(P3[0], P3[1]); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = c.verde; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
        // b: sombra en el suelo
        const Bs = proy(b[0], b[1], 0);
        if (Math.abs(b[2]) > 0.01) {
          ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = c.acento2; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(Bs[0], Bs[1]); ctx.lineTo(P3[0], P3[1]); ctx.moveTo(O[0], O[1]); ctx.lineTo(Bs[0], Bs[1]); ctx.stroke(); ctx.restore();
        }
        // producto cruz (con su "pie" de referencia)
        const C = proy(cr[0], cr[1], cr[2]);
        flecha(ctx, O, C, c.verde, 3.5);
        flecha(ctx, O, P1, c.acento, 2.5);
        flecha(ctx, O, P3, c.acento2, 2.5);
        ctx.font = "600 14px " + c.fuente;
        ctx.fillStyle = c.acento; ctx.fillText("a", P1[0] + 8, P1[1] + 4);
        ctx.fillStyle = c.acento2; ctx.fillText("b", P3[0] + 8, P3[1] - 4);
        ctx.fillStyle = c.verde; ctx.fillText(intercambiar ? "b × a" : "a × b", C[0] + 8, C[1]);
        // asas para arrastrar (en el suelo)
        for (const [q, col] of [[a, c.acento], [b, c.acento2]]) {
          const H = proy(q[0], q[1], 0);
          ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(H[0], H[1], 7, 0, Math.PI * 2); ctx.stroke();
        }
        const area = len3(cruz3(a, b));
        info.textContent =
          "a = " + fmt3(a) + "    b = " + fmt3(b) + "\n" +
          (intercambiar ? "b × a = " : "a × b = ") + fmt3(cr) + "    |" + (intercambiar ? "b × a" : "a × b") + "| = " + f(len3(cr), 3) + " = área del paralelogramo (" + f(area, 3) + ")\n" +
          "a·(a × b) = " + f(punto3(a, cr), 4) + "    b·(a × b) = " + f(punto3(b, cr), 4) + "   → perpendicular a los dos" +
          (Math.abs(b[2]) < 0.01 ? "\nb en el suelo: el resultado es (0, 0, ax·by − ay·bx), la «cruz 2D»" : "");
      },
      alPulsar(e) {
        let mejor = null, dm = 16;
        for (const [nombre, q] of [["a", a], ["b", b]]) {
          const H = proy(q[0], q[1], 0), d = Math.hypot(H[0] - e.raton.x, H[1] - e.raton.y);
          if (d < dm) { dm = d; mejor = nombre; }
        }
        arrastre = mejor;
      },
      alMover(e) {
        if (!arrastre) { lz.canvas.style.cursor = "default"; return; }
        let [x, y] = alSuelo(e.raton.x, e.raton.y);
        const L = Math.hypot(x, y);
        if (L > RMAX) { x *= RMAX / L; y *= RMAX / L; }
        const q = arrastre === "a" ? a : b;
        q[0] = x; q[1] = y;
      },
      alSoltar() { arrastre = null; },
    });
    Curso.control(ctrls, { etiqueta: "altura de b", min: -1.5, max: 1.5, paso: 0.05, valor: 0, alCambiar: (v) => { b[2] = v; lz.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "girar vista", min: -180, max: 180, paso: 1, valor: Math.round(grados(yaw)), formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { yaw = v * Math.PI / 180; lz.redibujar(); } });
    Curso.casilla(ctrls, { etiqueta: "intercambiar: b × a", valor: false, alCambiar: (v) => { intercambiar = v; lz.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Cruz 2D: lado de una recta, área y orientación del triángulo ABP
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-lado");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-7, 7],
      puntos: {
        A: { x: -3.5, y: -1.2, etiqueta: "A", color: "acento" },
        B: { x: 3, y: 0.6, etiqueta: "B", color: "acento" },
        P: { x: -0.4, y: 1.6, etiqueta: "P", color: "texto" },
      },
      dibujar(p, pts) {
        const A = pts.A, B = pts.B, P = pts.P;
        const ab = V.restar(B, A), ap = V.restar(P, A);
        const lab = V.longitud(ab);
        if (lab < 1e-6) { info.textContent = "A y B coinciden: no hay recta."; return; }
        const u = V.escalar(ab, 1 / lab), izq = V.perp(u);
        // semiplano izquierdo sombreado
        p.ctx.save(); p.ctx.globalAlpha = 0.09;
        const L0 = V.sumar(A, V.escalar(u, -40)), L1 = V.sumar(A, V.escalar(u, 40));
        p.poligono([L0, L1, V.sumar(L1, V.escalar(izq, 40)), V.sumar(L0, V.escalar(izq, 40))], { relleno: "acento", color: null });
        p.ctx.restore();
        p.texto(V.sumar(A, V.sumar(V.escalar(u, -1.2), V.escalar(izq, 1.2))), "izquierda de A→B", { color: "acento", tam: 12, alinear: "center" });
        p.linea(L0, L1, { color: "texto2", grosor: 1.2 });
        const c = V.cruz(ab, ap), dt = V.punto(ab, ap);
        const col = Math.abs(c) < 0.05 ? "amarillo" : c > 0 ? "verde" : "rosa";
        p.ctx.save(); p.ctx.globalAlpha = 0.22;
        p.poligono([A, B, P], { relleno: col, color: null });
        p.ctx.restore();
        p.poligono([A, B, P], { color: col, grosor: 1.5 });
        p.flecha(A, B, { color: "acento", grosor: 2.5 });
        p.flecha(A, P, { color: "texto2", grosor: 1.5, discontinua: true });
        pts.P.color = col;
        const lado = Math.abs(c) < 0.05 ? "SOBRE la recta" : c > 0 ? "a la IZQUIERDA de A→B" : "a la DERECHA de A→B";
        info.textContent =
          "cruz(B − A, P − A) = " + f(ab.x) + "·" + f(ap.y) + " − " + f(ab.y) + "·" + f(ap.x) + " = " + f(c, 3) + "   → P está " + lado + "\n" +
          "área del triángulo ABP = |cruz| / 2 = " + f(Math.abs(c) / 2, 3) + "   (A → B → P gira en sentido " + (c > 0 ? "antihorario" : c < 0 ? "horario" : "—") + ")\n" +
          "ángulo con signo de B − A a P − A = atan2(cruz, punto) = " + f(grados(Math.atan2(c, dt)), 1) + "°";
      },
    });
  });
})();
