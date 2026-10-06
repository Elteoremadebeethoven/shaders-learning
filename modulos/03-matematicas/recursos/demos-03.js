/* Demos de la lección 3.3 · Trigonometría útil */
(function () {
  "use strict";
  const V = M3.v, f = M3.f, par = M3.par;
  const TAU = Math.PI * 2;
  const grados = (r) => r * 180 / Math.PI;

  /* ---------------------------------------------------------------
     El círculo unidad: seno y coseno como sombras de un punto que gira
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-circulo");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let theta = 0.9, animar = true, vel = 0.8, ctlTheta = null;
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h;
        if (animar) { theta = (theta + e.dt * vel) % TAU; if (ctlTheta) ctlTheta.valor = theta; }
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        const R = Math.min(h * 0.3, w * 0.14), cx = R + 34, cy = R + 22;
        const x0 = cx + R + 50, x1 = w - 24, esc = (x1 - x0) / TAU;
        const px = cx + R * Math.cos(theta), py = cy - R * Math.sin(theta);
        const yCos = cy + R + 42;
        // ejes del círculo
        ctx.strokeStyle = c.eje; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(cx - R - 14, cy); ctx.lineTo(cx + R + 14, cy); ctx.moveTo(cx, cy - R - 14); ctx.lineTo(cx, cy + R + 14);
        ctx.moveTo(x0, cy); ctx.lineTo(x1, cy);                       // eje de la onda
        ctx.moveTo(cx - R, yCos); ctx.lineTo(cx + R, yCos);           // eje del coseno
        ctx.stroke();
        ctx.strokeStyle = c.borde2; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
        // marcas π/2, π, 3π/2, 2π en el eje de la onda
        ctx.fillStyle = c.tenue; ctx.font = "11px " + c.mono; ctx.textAlign = "center";
        ["π/2", "π", "3π/2", "2π"].forEach((t, i) => { const X = x0 + (i + 1) * Math.PI / 2 * esc; ctx.fillText(t, X, cy + 16); ctx.fillRect(X - 0.5, cy - 4, 1, 8); });
        ctx.textAlign = "left"; ctx.fillText("θ (rad)", x1 - 44, cy - 10);
        // la onda completa (tenue) y el tramo recorrido
        ctx.strokeStyle = c.acento2; ctx.globalAlpha = 0.3; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i <= 200; i++) { const a = TAU * i / 200; const X = x0 + a * esc, Y = cy - R * Math.sin(a); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 200; i++) { const a = theta * i / 200; const X = x0 + a * esc, Y = cy - R * Math.sin(a); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        // arco de longitud θ (en unidades de radio) y ángulo
        ctx.strokeStyle = c.amarillo; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, -theta, true); ctx.stroke();
        ctx.strokeStyle = c.texto2; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, -theta, true); ctx.stroke();
        // radio, proyecciones
        ctx.strokeStyle = c.texto; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.strokeStyle = c.acento2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x0 + theta * esc, py); ctx.stroke();
        ctx.strokeStyle = c.acento; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, yCos); ctx.stroke();
        ctx.setLineDash([]);
        // segmentos seno (vertical) y coseno (horizontal) sobre los ejes
        ctx.lineWidth = 4;
        ctx.strokeStyle = c.acento2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, py); ctx.stroke();
        ctx.strokeStyle = c.acento; ctx.beginPath(); ctx.moveTo(cx, yCos); ctx.lineTo(px, yCos); ctx.stroke();
        const punto = (X, Y, col, r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, r || 6, 0, TAU); ctx.fill(); };
        punto(px, py, c.texto); punto(x0 + theta * esc, py, c.acento2); punto(px, yCos, c.acento, 5);
        ctx.font = "600 13px " + c.fuente; ctx.fillStyle = c.acento2; ctx.fillText("sin θ", cx + 6, (cy + py) / 2);
        ctx.fillStyle = c.acento; ctx.fillText("cos θ", cx - R, yCos + 18);
        ctx.fillStyle = c.amarillo; ctx.fillText("arco = θ", cx + R * 0.78, cy - R * 0.78 - 6);
        const s = Math.sin(theta), co = Math.cos(theta);
        info.textContent =
          "θ = " + f(theta, 3) + " rad = " + f(grados(theta), 1) + "°      (el arco amarillo mide θ veces el radio)\n" +
          "cos θ = " + f(co, 3) + " (la x del punto)      sin θ = " + f(s, 3) + " (la y del punto)      cos²θ + sin²θ = " + f(co * co + s * s, 3);
      },
    });
    Curso.casilla(ctrls, { etiqueta: "animar", valor: true, alCambiar: (v) => { animar = v; lz.animar(v); } });
    ctlTheta = Curso.control(ctrls, { etiqueta: "θ", min: 0, max: TAU, paso: 0.01, valor: theta, alCambiar: (v) => { theta = v; if (animar) { animar = false; lz.animar(false); ctrls.querySelector("input[type=checkbox]").checked = false; } lz.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "velocidad", min: 0.1, max: 3, paso: 0.1, valor: vel, formato: (v) => v.toFixed(1) + " rad/s", alCambiar: (v) => { vel = v; } });
  });

  /* ---------------------------------------------------------------
     Polares: atan2 frente a atan(y/x)
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-polar");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-5, 5],
      puntos: { P: { x: -2.2, y: -1.3, etiqueta: "P", color: "acento" } },
      dibujar(p, pts) {
        const P = pts.P, O = [0, 0];
        [["I", 3.6, 1.7], ["II", -3.6, 1.7], ["III", -3.6, -1.7], ["IV", 3.6, -1.7]].forEach(([t, x, y]) => p.texto([x, y], t, { color: "tenue", tam: 16, alinear: "center", negrita: true }));
        const r = Math.hypot(P.x, P.y);
        const a2 = Math.atan2(P.y, P.x);
        const a1 = Math.atan(P.y / P.x);
        p.circulo(O, r, { color: "tenue", discontinua: true, grosor: 1 });
        if (r > 1e-9) {
          p.arco(O, Math.min(0.9, r * 0.6), Math.min(0, a2), Math.max(0, a2), { color: "verde", grosor: 2.5 });
          const d1 = { x: Math.cos(a1), y: Math.sin(a1) };
          if (isFinite(a1)) p.flecha(O, V.escalar(d1, r), { color: "rosa", discontinua: true, grosor: 2 });
        }
        p.flecha(O, P, { color: "acento" });
        const mal = P.x < 0;
        info.textContent =
          "r = √(x² + y²) = " + f(r, 3) + "\n" +
          "atan2(y, x) = " + f(a2, 3) + " rad = " + f(grados(a2), 1) + "°   (arco verde)\n" +
          "atan(y / x) = " + (P.x === 0 ? "atan(±∞) → ±90°, pero dividir por 0 no es buena idea" : f(a1, 3) + " rad = " + f(grados(a1), 1) + "°   (flecha rosa)" + (mal ? "   ← ¡cuadrante opuesto! x < 0" : "   ← coincide: x > 0"));
      },
    });
  });

  /* ---------------------------------------------------------------
     Respirar y flotar: el papel de la fase
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-oscilar");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const N = 7;
    let modo = "escalonada", distintas = false;
    // valores aleatorios fijos (deterministas: siempre los mismos)
    let semilla = 7;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    const fasesAzar = Array.from({ length: N }, () => azar() * TAU);
    const facFrec = Array.from({ length: N }, () => 0.85 + 0.3 * azar());
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h, t = e.t;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        const F = 0.5, A = h * 0.16;
        const cols = [c.acento, c.acento2, c.rosa, c.amarillo, c.verde, c.azul, c.naranja];
        for (let i = 0; i < N; i++) {
          const fase = modo === "misma" ? 0 : modo === "escalonada" ? i * TAU / N : fasesAzar[i];
          const fr = F * (distintas ? facFrec[i] : 1);
          const x = w * (i + 1) / (N + 1);
          const y = h / 2 + A * Math.sin(TAU * fr * t + fase);               // flotar
          const esc = 1 + 0.12 * Math.sin(TAU * fr * 0.7 * t + fase + 1.0);   // respirar
          ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.18;
          ctx.beginPath(); ctx.ellipse(x, h / 2 + A + 26, 16 * esc, 4, 0, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 17 * esc, 0, TAU); ctx.fill();
        }
        info.textContent = "yᵢ = base + A·sin(2π·f·t + φᵢ)      escalaᵢ = 1 + 0.12·sin(2π·0.7f·t + φᵢ + 1)\n" +
          (modo === "misma" ? "φᵢ = 0 para todos: se mueven a la vez, como soldados." :
            modo === "escalonada" ? "φᵢ = i·2π/" + N + ": una ola que recorre la fila (una vuelta completa en " + N + " objetos)." :
              "φᵢ aleatoria (elegida una vez por objeto): parece más vivo.") +
          (distintas ? "  Frecuencias ligeramente distintas: nunca vuelven a coincidir." : "");
      },
    });
    Curso.selector(ctrls, { etiqueta: "Fases:", valor: modo, opciones: [["misma", "la misma para todos"], ["escalonada", "escalonada"], ["aleatoria", "aleatoria"]], alCambiar: (v) => { modo = v; lz.redibujar(); } });
    Curso.casilla(ctrls, { etiqueta: "frecuencias ligeramente distintas", valor: false, alCambiar: (v) => { distintas = v; } });
  });

  /* ---------------------------------------------------------------
     Cambiar la frecuencia en vivo: fase calculada frente a fase acumulada
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-frecuencia");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let F = 0.6, faseAcum = 0;
    const T0 = 200;                       // como si la página llevara 200 s abierta
    const estelas = [[], []];
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h;
        const t = T0 + e.t;
        faseAcum = (faseAcum + TAU * F * e.dt) % TAU;
        const faseDirecta = TAU * F * t;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        const filas = [[h * 0.32, faseDirecta, c.error, "sin(2π·f·t)"], [h * 0.72, faseAcum, c.ok, "fase += 2π·f·dt"]];
        filas.forEach(([y, fase, col, nombre], k) => {
          const x = w / 2 + (w * 0.36) * Math.sin(fase);
          const est = estelas[k]; est.push(x); if (est.length > 40) est.shift();
          ctx.strokeStyle = c.eje; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * 0.12, y); ctx.lineTo(w * 0.88, y); ctx.stroke();
          est.forEach((ex, i) => { ctx.fillStyle = col; ctx.globalAlpha = (i / est.length) * 0.35; ctx.beginPath(); ctx.arc(ex, y, 9, 0, TAU); ctx.fill(); });
          ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill();
          ctx.fillStyle = c.texto2; ctx.font = "13px " + c.mono; ctx.fillText(nombre, 10, y - 18);
        });
        info.textContent = "t = " + f(t, 1) + " s     f = " + f(F, 2) + " Hz\nfase calculada = 2π·f·t = " + f(faseDirecta, 1) + " rad   (cambia " + f(TAU * t, 0) + " rad por cada Hz que muevas el deslizador)";
      },
    });
    Curso.control(ctrls, { etiqueta: "frecuencia f", min: 0.2, max: 1.5, paso: 0.01, valor: F, formato: (v) => v.toFixed(2) + " Hz", alCambiar: (v) => { F = v; } });
  });

  /* ---------------------------------------------------------------
     Curvas de Lissajous
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-lissajous");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let a = 3, b = 2, d = Math.PI / 2;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-3.4, 3.4], animar: true, numeros: false,
      dibujar(p, pts, est) {
        const K = 1.35;
        p.parametrica((s) => K * Math.sin(a * s + d), (s) => K * Math.sin(b * s), 0, TAU, { color: "acento", grosor: 2, muestras: 800 });
        const s = est.t * 0.7;
        const P = [K * Math.sin(a * s + d), K * Math.sin(b * s)];
        p.linea([P[0], -1.6], [P[0], 1.6], { color: "tenue", discontinua: [2, 5], grosor: 1 });
        p.linea([-3.4, P[1]], [3.4, P[1]], { color: "tenue", discontinua: [2, 5], grosor: 1 });
        p.punto(P, { color: "amarillo", radio: 7 });
        info.textContent = "x = sin(" + a + "·s + " + f(d, 2) + ")     y = sin(" + b + "·s)     a : b = " + a + " : " + b +
          (a === b && Math.abs(d - Math.PI / 2) < 0.02 ? "   (a = b y δ = π/2: una circunferencia)" : "");
      },
    });
    Curso.control(ctrls, { etiqueta: "a", min: 1, max: 7, paso: 1, valor: a, alCambiar: (v) => { a = v; pl.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "b", min: 1, max: 7, paso: 1, valor: b, alCambiar: (v) => { b = v; pl.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "δ", min: 0, max: Math.PI, paso: 0.01, valor: d, alCambiar: (v) => { d = v; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Rotar un punto alrededor de un pivote
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-rotar");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let th = 50 * Math.PI / 180;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 6],
      puntos: { P: { x: 3, y: 0.6, etiqueta: "P", color: "acento" }, C: { x: 0.5, y: -0.8, etiqueta: "C (pivote)", color: "amarillo" } },
      dibujar(p, pts) {
        const P = pts.P, C = pts.C;
        const d = V.restar(P, C);
        const dr = V.rotar(d, th);
        const Pp = V.sumar(C, dr);
        const r = V.longitud(d);
        p.circulo(C, r, { color: "tenue", discontinua: true, grosor: 1 });
        if (r > 1e-6) M3.arcoAngulo(p, C, d, dr, Math.min(r, 1.1), { color: "verde", grosor: 2 });
        // ejes girados en el pivote: adónde van i y j
        p.flecha(C, V.sumar(C, V.rotar({ x: 0.9, y: 0 }, th)), { color: "rosa", grosor: 1.8 });
        p.flecha(C, V.sumar(C, V.rotar({ x: 0, y: 0.9 }, th)), { color: "azul", grosor: 1.8 });
        p.flecha(C, P, { color: "acento", grosor: 1.5, discontinua: true });
        p.flecha(C, Pp, { color: "verde", grosor: 2 });
        p.punto(Pp, { color: "verde", radio: 7, etiqueta: "P′" });
        const co = Math.cos(th), s = Math.sin(th);
        info.textContent =
          "d = P − C = " + par(d) + "      θ = " + f(grados(th), 0) + "°   cos θ = " + f(co, 3) + "   sin θ = " + f(s, 3) + "\n" +
          "rotar(d) = (dx·cos θ − dy·sin θ,  dx·sin θ + dy·cos θ) = " + par(dr) + "\n" +
          "P′ = C + rotar(d) = " + par(Pp) + "      (flechas rosa y azul en C: adónde van los ejes x e y al girar)";
      },
    });
    Curso.control(ctrls, { etiqueta: "θ", min: -180, max: 180, paso: 1, valor: 50, formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { th = v * Math.PI / 180; pl.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Campo de visión: h = d·tan(fov/2)
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-fov");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let fov = 60 * Math.PI / 180, dist = 5;
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-6, 9.5],
      dibujar(p) {
        const O = { x: -5, y: 0 };
        const L = 30;
        const up = V.rotar({ x: 1, y: 0 }, fov / 2), dn = V.rotar({ x: 1, y: 0 }, -fov / 2);
        p.ctx.save(); p.ctx.globalAlpha = 0.1;
        p.poligono([O, V.sumar(O, V.escalar(up, L)), V.sumar(O, V.escalar(dn, L))], { relleno: "acento", color: null });
        p.ctx.restore();
        p.linea(O, V.sumar(O, V.escalar(up, L)), { color: "acento", grosor: 1.5 });
        p.linea(O, V.sumar(O, V.escalar(dn, L)), { color: "acento", grosor: 1.5 });
        p.linea(O, { x: 20, y: 0 }, { color: "tenue", discontinua: [4, 5], grosor: 1 });
        const h = dist * Math.tan(fov / 2);
        const X = O.x + dist;
        p.linea({ x: X, y: -h }, { x: X, y: h }, { color: "verde", grosor: 4 });
        p.linea(O, { x: X, y: 0 }, { color: "amarillo", grosor: 2.5 });
        p.arco(O, 1.1, 0, fov / 2, { color: "texto2", grosor: 1.5 });
        p.texto({ x: X, y: h / 2 }, "  h", { color: "verde", negrita: true, tam: 14 });
        p.texto({ x: O.x + dist / 2, y: 0 }, "d", { color: "amarillo", negrita: true, tam: 14, alinear: "center", desplazamiento: [0, 14] });
        p.texto({ x: O.x + 1.2, y: 0.35 }, "fov/2", { color: "texto2", tam: 12 });
        p.punto(O, { color: "texto", radio: 6, etiqueta: "cámara" });
        const t = Math.tan(fov / 2);
        info.textContent =
          "fov = " + f(grados(fov), 0) + "°   fov/2 = " + f(grados(fov / 2), 1) + "°   tan(fov/2) = " + f(t, 3) + "\n" +
          "h = d · tan(fov/2) = " + f(dist, 1) + " · " + f(t, 3) + " = " + f(h, 3) + "   (altura visible total: " + f(2 * h, 2) + ")\n" +
          "factor de la proyección: 1 / tan(fov/2) = " + f(1 / t, 3);
      },
    });
    Curso.control(ctrls, { etiqueta: "fov", min: 10, max: 175, paso: 1, valor: 60, formato: (v) => v.toFixed(0) + "°", alCambiar: (v) => { fov = v * Math.PI / 180; pl.redibujar(); } });
    Curso.control(ctrls, { etiqueta: "d", min: 1, max: 12, paso: 0.1, valor: dist, alCambiar: (v) => { dist = v; pl.redibujar(); } });
  });
})();
