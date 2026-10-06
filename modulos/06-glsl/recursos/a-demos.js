/* =====================================================================
   a-demos.js — demos a medida (Canvas 2D) de las lecciones 6.1–6.5.
   Cada demo se inicia solo si su contenedor existe en la página.
   Todo con Curso.lienzo2d / Curso.plano / Curso.control (widgets.js).
   ===================================================================== */
(function () {
  "use strict";
  const Curso = window.Curso;
  const conAlfa = (ctx, a, fn) => { ctx.save(); ctx.globalAlpha = a; fn(); ctx.restore(); };
  const f2 = (v) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);

  /* -------------------------------------------------------------------
     6.2 · La rejilla de píxeles: gl_FragCoord, uv, p y el viewport
     ------------------------------------------------------------------- */
  function demoRejilla(raiz) {
    const info = raiz.querySelector(".demo-info");
    const ctrl = raiz.querySelector(".demo-controles");
    let W = 12, H = 8, conViewport = false;
    const VP = { x: 3, y: 2, w: 6, h: 4 };
    let geo = null;          // última geometría dibujada (para el ratón)
    let fijo = { i: 1, j: 0 }; // celda señalada cuando el ratón no está encima

    function celdaBajo(e) {
      if (!geo || !e.raton.dentro) return null;
      const i = Math.floor((e.raton.x - geo.ox) / geo.cel);
      const j = Math.floor((geo.oy - e.raton.y) / geo.cel);
      return i >= 0 && i < W && j >= 0 && j < H ? { i, j } : null;
    }

    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const c = e.colores;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, e.w, e.h);
        const margenIzq = 44, margenInf = 40, margenSup = 16, margenDer = 16;
        const cel = Math.max(8, Math.min((e.w - margenIzq - margenDer) / W, (e.h - margenInf - margenSup) / H));
        const ancho = cel * W, alto = cel * H;
        const ox = Math.round(margenIzq + (e.w - margenIzq - margenDer - ancho) / 2);
        const oy = Math.round(margenSup + alto);
        geo = { ox, oy, cel };
        const X = (x) => ox + x * cel, Y = (y) => oy - y * cel;   // píxeles de GL → lienzo

        // viewport
        if (conViewport) conAlfa(ctx, 0.16, () => { ctx.fillStyle = c.acento; ctx.fillRect(X(VP.x), Y(VP.y + VP.h), VP.w * cel, VP.h * cel); });
        // celda señalada
        const sel = celdaBajo(e) || fijo;
        conAlfa(ctx, 0.35, () => { ctx.fillStyle = c.acento2; ctx.fillRect(X(sel.i), Y(sel.j + 1), cel, cel); });
        // rejilla
        ctx.strokeStyle = c.borde2 || c.borde; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= W; i++) { ctx.moveTo(X(i) + 0.5, Y(0)); ctx.lineTo(X(i) + 0.5, Y(H)); }
        for (let j = 0; j <= H; j++) { ctx.moveTo(X(0), Y(j) + 0.5); ctx.lineTo(X(W), Y(j) + 0.5); }
        ctx.stroke();
        // centros de los píxeles
        ctx.fillStyle = c.tenue;
        for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) { ctx.beginPath(); ctx.arc(X(i + 0.5), Y(j + 0.5), Math.max(1.5, cel * 0.05), 0, Math.PI * 2); ctx.fill(); }
        // borde del viewport
        if (conViewport) { ctx.strokeStyle = c.acento; ctx.lineWidth = 2.5; ctx.strokeRect(X(VP.x), Y(VP.y + VP.h), VP.w * cel, VP.h * cel);
          ctx.fillStyle = c.acento; ctx.font = "600 12px " + c.fuente; ctx.textAlign = "left"; ctx.textBaseline = "bottom";
          ctx.fillText("viewport(3, 2, 6, 4)", X(VP.x) + 4, Y(VP.y + VP.h) - 3); }
        // centro de la ventana: p = (0, 0)
        ctx.strokeStyle = c.rosa; ctx.lineWidth = 2;
        const cx = X(W / 2), cy = Y(H / 2), r = Math.max(5, cel * 0.22);
        ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
        // números de los ejes (en los bordes de los píxeles)
        ctx.fillStyle = c.tenue; ctx.font = "11px " + c.mono;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        for (let i = 0; i <= W; i++) ctx.fillText(String(i), X(i), Y(0) + 5);
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        for (let j = 0; j <= H; j++) ctx.fillText(String(j), X(0) - 6, Y(j));
        ctx.fillStyle = c.texto2; ctx.font = "12px " + c.fuente; ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText("x →", X(W) - 26, Y(0) + 20);
        ctx.textAlign = "right"; ctx.fillText("origen (0, 0)", X(0) + 34, Y(0) + 20);
        ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText("y ↑", X(0) - 22, Y(H));

        // texto informativo
        const fx = sel.i + 0.5, fy = sel.j + 0.5;
        let t = "píxel (" + sel.i + ", " + sel.j + ")   gl_FragCoord.xy = (" + fx + ", " + fy + ")\n";
        t += "uv = gl_FragCoord.xy / u_resolution = (" + f2(fx / W) + ", " + f2(fy / H) + ")\n";
        t += "p = (2·gl_FragCoord.xy − u_resolution) / u_resolution.y = (" + f2((2 * fx - W) / H) + ", " + f2((2 * fy - H) / H) + ")";
        if (conViewport) {
          const dentro = sel.i >= VP.x && sel.i < VP.x + VP.w && sel.j >= VP.y && sel.j < VP.y + VP.h;
          t += dentro
            ? "\nv_uv (relativo al viewport) = (" + f2((fx - VP.x) / VP.w) + ", " + f2((fy - VP.y) / VP.h) + ")   ← gl_FragCoord NO se reinicia"
            : "\nfuera del viewport: este píxel no ejecuta el fragment shader";
        }
        info.textContent = t;
      },
    });
    Curso.selector(ctrl, {
      etiqueta: "Lienzo", valor: "12x8",
      opciones: [["12x8", "12 × 8"], ["9x7", "9 × 7 (impar)"], ["16x6", "16 × 6"]],
      alCambiar: (v) => { [W, H] = v.split("x").map(Number); fijo = { i: 1, j: 0 }; lz.redibujar(); },
    });
    Curso.casilla(ctrl, { etiqueta: "viewport desplazado", valor: false, alCambiar: (v) => { conViewport = v; if (v) fijo = { i: 4, j: 3 }; lz.redibujar(); } });
  }


  /* -------------------------------------------------------------------
     6.3 · La SDF de una caja, derivada a mano
     ------------------------------------------------------------------- */
  function demoCaja(raiz) {
    const info = raiz.querySelector(".demo-info");
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-3, 3],
      puntos: {
        P: { x: 2.0, y: 1.0, etiqueta: "p", color: "acento2" },
        B: { x: 1.2, y: 0.6, etiqueta: "b", color: "acento" },
      },
      restringir(nombre, q) {
        if (nombre === "B") { q.x = Math.max(0.15, Math.min(2.6, q.x)); q.y = Math.max(0.15, Math.min(1.1, q.y)); }
      },
      dibujar(p, pts) {
        const ctx = p.ctx, c = p.colores;
        const bx = pts.B.x, by = pts.B.y, px = pts.P.x, py = pts.P.y;
        const ax = Math.abs(px), ay = Math.abs(py);
        const qx = ax - bx, qy = ay - by;
        // las tres zonas exteriores del primer cuadrante
        const G = 9;
        conAlfa(ctx, 0.10, () => p.poligono([[bx, 0], [G, 0], [G, by], [bx, by]], { relleno: c.verde, color: null }));
        conAlfa(ctx, 0.10, () => p.poligono([[0, by], [bx, by], [bx, G], [0, G]], { relleno: c.azul, color: null }));
        conAlfa(ctx, 0.12, () => p.poligono([[bx, by], [G, by], [G, G], [bx, G]], { relleno: c.naranja, color: null }));
        // la caja
        conAlfa(ctx, 0.25, () => p.poligono([[-bx, -by], [bx, -by], [bx, by], [-bx, by]], { relleno: c.acento, color: null }));
        p.poligono([[-bx, -by], [bx, -by], [bx, by], [-bx, by]], { color: "acento", grosor: 2 });
        // distancia y punto más cercano (en el cuadrante original)
        const fuera = qx > 0 || qy > 0;
        let cx, cy, d;
        if (fuera) { cx = Math.min(ax, bx); cy = Math.min(ay, by); d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)); }
        else if (qx > qy) { cx = bx; cy = ay; d = qx; } else { cx = ax; cy = by; d = qy; }
        const sx = px < 0 ? -1 : 1, sy = py < 0 ? -1 : 1;
        p.circulo([px, py], Math.abs(d), { color: "amarillo", discontinua: true });
        p.linea([px, py], [sx * cx, sy * cy], { color: "amarillo", grosor: 2.5 });
        p.punto([sx * cx, sy * cy], { color: "amarillo", radio: 4 });
        // plegado al primer cuadrante y el vector q
        if (px < 0 || py < 0) {
          p.linea([px, py], [ax, ay], { color: "tenue", discontinua: true });
          p.punto([ax, ay], { color: "tenue", etiqueta: "|p|" });
        }
        if (Math.hypot(qx, qy) > 0.02) p.flecha([bx, by], [ax, ay], { color: "rosa", grosor: 2, etiqueta: "q" });
        // texto
        let zona;
        if (!fuera) zona = "dentro (q.x ≤ 0 y q.y ≤ 0): d = min(max(q.x, q.y), 0.0) = " + d.toFixed(3) + "  → el borde más cercano es el " + (qx > qy ? "vertical" : "horizontal");
        else if (qx > 0 && qy > 0) zona = "fuera, zona de la esquina (q.x > 0 y q.y > 0): d = length(max(q, 0.0)) = length(q) = " + d.toFixed(3);
        else if (qx > 0) zona = "fuera, frente al lado vertical (q.x > 0, q.y ≤ 0): d = length(max(q, 0.0)) = q.x = " + d.toFixed(3);
        else zona = "fuera, frente al lado horizontal (q.y > 0, q.x ≤ 0): d = length(max(q, 0.0)) = q.y = " + d.toFixed(3);
        info.textContent = "p = (" + px.toFixed(2) + ", " + py.toFixed(2) + ")   abs(p) = (" + ax.toFixed(2) + ", " + ay.toFixed(2) + ")   b = (" + bx.toFixed(2) + ", " + by.toFixed(2) + ")\n" +
          "q = abs(p) − b = (" + qx.toFixed(2) + ", " + qy.toFixed(2) + ")\n" + zona;
      },
    });
    return pl;
  }

  /* -------------------------------------------------------------------
     6.4 · Editor de paletas de coseno (Iñigo Quilez)
     color(t) = a + b·cos(2π(c·t + d)), con a, b, c, d vec3
     ------------------------------------------------------------------- */
  function demoPaleta(raiz) {
    const ctrl = raiz.querySelector(".demo-controles");
    const codigo = raiz.querySelector(".a-codigo");
    const botonera = raiz.querySelector(".a-botonera");
    const P = {
      "Arcoíris":  [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.0, 0.33, 0.67]],
      "Crepúsculo": [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.0, 0.10, 0.20]],
      "Arcilla":   [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 1], [0.3, 0.20, 0.20]],
      "Lima":      [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 1, 0.5], [0.8, 0.90, 0.30]],
      "Oro":       [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1, 0.7, 0.4], [0.0, 0.15, 0.20]],
      "Neón":      [[0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [2, 1, 0], [0.5, 0.20, 0.25]],
      "Pastel":    [[0.8, 0.5, 0.4], [0.2, 0.4, 0.2], [2, 1, 1], [0.0, 0.25, 0.25]],
    };
    let v = JSON.parse(JSON.stringify(P["Arcoíris"]));
    const col = (t, k) => v[0][k] + v[1][k] * Math.cos(2 * Math.PI * (v[2][k] * t + v[3][k]));
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const c = e.colores, W = e.w, H = e.h;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, W, H);
        const m = 12, franjaH = Math.round(H * 0.3);
        // la paleta, columna a columna
        for (let x = 0; x < W - 2 * m; x++) {
          const t = x / (W - 2 * m - 1);
          const r = Math.round(255 * Math.min(1, Math.max(0, col(t, 0))));
          const g = Math.round(255 * Math.min(1, Math.max(0, col(t, 1))));
          const b = Math.round(255 * Math.min(1, Math.max(0, col(t, 2))));
          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillRect(m + x, m, 1.5, franjaH);
        }
        // gráfica de los tres canales
        const y0 = m + franjaH + 18, alto = H - y0 - 22;
        const Y = (val) => y0 + alto - (val + 0.1) / 1.2 * alto;
        const X = (t) => m + t * (W - 2 * m);
        ctx.strokeStyle = c.rejilla; ctx.lineWidth = 1;
        ctx.beginPath();
        for (const val of [0, 0.5, 1]) { ctx.moveTo(m, Y(val) + 0.5); ctx.lineTo(W - m, Y(val) + 0.5); }
        ctx.stroke();
        conAlfa(ctx, 0.12, () => { ctx.fillStyle = c.error; ctx.fillRect(m, y0, W - 2 * m, Y(1) - y0); ctx.fillRect(m, Y(0), W - 2 * m, y0 + alto - Y(0)); });
        ctx.fillStyle = c.tenue; ctx.font = "11px " + c.mono; ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText("1", m + 14, Y(1)); ctx.fillText("0", m + 14, Y(0));
        const tonos = ["#ff5566", "#33dd77", "#4d8dff"];
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = tonos[k]; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= 200; i++) { const t = i / 200; const yy = Y(col(t, k)); if (i) ctx.lineTo(X(t), yy); else ctx.moveTo(X(t), yy); }
          ctx.stroke();
        }
        ctx.fillStyle = c.tenue; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText("t = 0", X(0) + 18, y0 + alto + 5); ctx.fillText("t = 1", X(1) - 18, y0 + alto + 5);
        // recorte: ¿algún canal se sale de [0, 1]?
        let sale = false;
        for (let k = 0; k < 3; k++) if (v[0][k] - Math.abs(v[1][k]) < -1e-6 || v[0][k] + Math.abs(v[1][k]) > 1 + 1e-6) sale = true;
        const f = (a) => "vec3(" + a.map((x) => x.toFixed(2)).join(", ") + ")";
        codigo.textContent = "vec3 color = paleta(t, " + f(v[0]) + ", " + f(v[1]) + ",\n                   " + f(v[2]) + ", " + f(v[3]) + ");" +
          (sale ? "\n// ¡ojo! a ± b se sale de [0, 1] en algún canal: esos tramos se recortan (zonas rojas)" : "");
      },
    });
    const controles = [];
    const nombres = ["a", "b", "c", "d"], rangos = [[0, 1], [0, 1], [0, 3], [0, 1]], canales = ["r", "g", "b"];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
      controles.push(Curso.control(ctrl, {
        etiqueta: nombres[i] + "." + canales[k], min: rangos[i][0], max: rangos[i][1], paso: 0.01, valor: v[i][k],
        alCambiar: (x) => { v[i][k] = x; lz.redibujar(); },
      }));
    }
    Object.keys(P).forEach((nombre) => Curso.boton(botonera, nombre, () => {
      v = JSON.parse(JSON.stringify(P[nombre]));
      let n = 0; for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) controles[n++].valor = v[i][k];
      lz.redibujar();
    }));
  }

  /* -------------------------------------------------------------------
     6.5 · Formas que se salen de su celda: la búsqueda en las 3 × 3 vecinas
     ------------------------------------------------------------------- */
  // Hash de enteros PCG (el mismo de 3.7 y 6.6), en JavaScript: Math.imul da el
  // producto módulo 2^32 igual que uint en GLSL, y >>> 0 reinterpreta como sin signo.
  function pcg(v) {
    const s = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
    const w = Math.imul(((s >>> ((s >>> 28) + 4)) ^ s) >>> 0, 277803737) >>> 0;
    return ((w >>> 22) ^ w) >>> 0;
  }
  function azar2(i, j) {
    const a = pcg((i >>> 0) + pcg(j >>> 0));
    return [(a >>> 8) / 16777216, (pcg(a) >>> 8) / 16777216];
  }
  function demoVecinos(raiz) {
    const info = raiz.querySelector(".demo-info");
    const ctrl = raiz.querySelector(".demo-controles");
    let jitter = 0.8, radio = 0.55, soloPropia = false;
    const centro = (i, j) => { const h = azar2(i, j); return [i + 0.5 + (h[0] - 0.5) * jitter, j + 0.5 + (h[1] - 0.5) * jitter]; };
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-3, 3],
      centroY: 0.45,
      puntos: { P: { x: 0.9, y: 0.9, etiqueta: "píxel", color: "acento2" } },
      paso: 1,
      dibujar(p, pts) {
        const ctx = p.ctx, c = p.colores;
        const P = pts.P, ci = Math.floor(P.x), cj = Math.floor(P.y);
        // las 3 × 3 celdas vecinas y la propia
        conAlfa(ctx, soloPropia ? 0.0 : 0.10, () => p.poligono([[ci - 1, cj - 1], [ci + 2, cj - 1], [ci + 2, cj + 2], [ci - 1, cj + 2]], { relleno: c.acento, color: null }));
        conAlfa(ctx, 0.22, () => p.poligono([[ci, cj], [ci + 1, cj], [ci + 1, cj + 1], [ci, cj + 1]], { relleno: c.acento, color: null }));
        // todas las burbujas visibles (centro con desplazamiento aleatorio, mismo radio)
        for (let i = -5; i <= 4; i++) for (let j = -3; j <= 3; j++) {
          const q = centro(i, j);
          p.circulo(q, radio, { color: "tenue" });
          p.punto(q, { color: "tenue", radio: 2.5 });
        }
        // candidatas y la más cercana
        let mejor = null, dMejor = 1e9;
        const rango = soloPropia ? [0] : [-1, 0, 1];
        for (const di of rango) for (const dj of rango) {
          const q = centro(ci + di, cj + dj);
          const d = Math.hypot(P.x - q[0], P.y - q[1]);
          p.linea([P.x, P.y], q, { color: "tenue", discontinua: true });
          if (d < dMejor) { dMejor = d; mejor = { q, di, dj }; }
        }
        const dentro = dMejor < radio;
        p.circulo(mejor.q, radio, { color: dentro ? "amarillo" : "naranja", grosor: 2.5 });
        p.linea([P.x, P.y], mejor.q, { color: "amarillo", grosor: 2.5 });
        // lo que ve el píxel si solo mira su celda
        const propia = centro(ci, cj), dPropia = Math.hypot(P.x - propia[0], P.y - propia[1]);
        let real = 1e9, celdaReal = [0, 0];
        for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
          const q = centro(ci + di, cj + dj), d = Math.hypot(P.x - q[0], P.y - q[1]);
          if (d < real) { real = d; celdaReal = [di, dj]; }
        }
        info.textContent = "celda del píxel: (" + ci + ", " + cj + ")\n" +
          "solo su celda: distancia a su centro " + dPropia.toFixed(3) + (dPropia < radio ? " < " : " ≥ ") + "radio " + radio.toFixed(2) + " → " + (dPropia < radio ? "dentro de una burbuja" : "fuera (fondo)") + "\n" +
          "con las 3 × 3 vecinas: el centro más cercano es el de la celda (" + (celdaReal[0] >= 0 ? "+" : "") + celdaReal[0] + ", " + (celdaReal[1] >= 0 ? "+" : "") + celdaReal[1] + "), a " + real.toFixed(3) + (real < radio ? " < " : " ≥ ") + "radio → " + (real < radio ? "dentro" : "fuera") +
          (dPropia >= radio && real < radio ? "   ← mirando solo su celda, este píxel se equivocaría" : "");
      },
    });
    Curso.control(ctrl, { etiqueta: "desplazamiento aleatorio", min: 0, max: 1, paso: 0.01, valor: jitter, alCambiar: (v) => { jitter = v; pl.redibujar(); } });
    Curso.control(ctrl, { etiqueta: "radio", min: 0.1, max: 0.9, paso: 0.01, valor: radio, alCambiar: (v) => { radio = v; pl.redibujar(); } });
    Curso.casilla(ctrl, { etiqueta: "mirar solo la celda propia", valor: false, alCambiar: (v) => { soloPropia = v; pl.redibujar(); } });
  }

  Curso.alListo(() => {
    const r = document.getElementById("demo-rejilla");
    if (r) demoRejilla(r);
    const c = document.getElementById("demo-caja");
    if (c) demoCaja(c);
    const pa = document.getElementById("demo-paleta");
    if (pa) demoPaleta(pa);
    const v = document.getElementById("demo-vecinos");
    if (v) demoVecinos(v);
  });
})();
