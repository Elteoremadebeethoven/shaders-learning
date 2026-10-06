/* =====================================================================
   demos-45.js — lección 4.5 (atributos, uniforms y varyings)
     #demo-curva-w  fracción en pantalla u → fracción en 3D t, según w1/w0
     #demo-ps1      un quad con damero girando, dibujado por la GPU de
                    juguete: con/sin corrección de perspectiva, subdividido
                    o no, y con vértices redondeados a píxeles enteros
   ===================================================================== */
(function () {
  "use strict";
  const G = window.GPUJuguete;

  /* ---------------- curva t(u) de la interpolación con perspectiva ---------------- */
  function demoCurva(raiz) {
    const info = raiz.querySelector(".demo-info");
    let razon = 3;
    const pts = { u: { x: 0.5, y: 0, etiqueta: "u", color: "acento" } };
    const t = (u) => (u / razon) / ((1 - u) / 1 + u / razon);
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-0.08, 1.08], y: [-0.12, 1.08], puntos: pts,
      restringir(n, q) { q.x = Math.max(0, Math.min(1, q.x)); q.y = 0; },
      dibujar(p, P) {
        p.funcion((u) => u, { color: "tenue", grosor: 1.5, desde: 0, hasta: 1 });
        p.funcion(t, { color: "acento2", grosor: 2.5, desde: 0, hasta: 1 });
        const u = P.u.x, tv = t(u);
        p.linea([u, 0], [u, tv], { color: "acento", discontinua: true });
        p.linea([0, tv], [u, tv], { color: "acento", discontinua: true });
        p.punto([u, tv], { color: "acento", radio: 5 });
        p.texto([1.0, 1.0], "sin corregir: t = u", { color: "tenue", alinear: "right", desplazamiento: [0, -14] });
        p.texto([0.02, 1.02], "t (fracción del segmento en 3D)", { color: "texto2" });
        p.texto([1.06, 0.04], "u (fracción en pantalla)", { color: "texto2", alinear: "right" });
        info.textContent = "w del extremo lejano / w del cercano = " + razon.toFixed(1) + "\nen el píxel que está al " + (u * 100).toFixed(0) + " % del segmento en pantalla, el varying vale t = " + tv.toFixed(3) +
          " (sin corregir valdría " + u.toFixed(3) + ")\npesos corregidos: extremo cercano " + (1 - tv).toFixed(3) + " · extremo lejano " + tv.toFixed(3);
      },
    });
    Curso.control(raiz.querySelector(".demo-controles"), { etiqueta: "w lejano / w cercano", min: 1, max: 10, paso: 0.1, valor: razon, alCambiar: (v) => { razon = v; pl.redibujar(); } });
  }

  /* ---------------- el temblor de la PS1 ---------------- */
  function demoPS1(raiz) {
    const info = raiz.querySelector(".demo-info");
    const W = 160, H = 120;
    const st = { perspectiva: false, subdividir: false, enteros: true, girar: true, ang: 0.6 };
    const lienzo = raiz.querySelector(".demo-lienzo");
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated";
    lienzo.appendChild(canvas);
    const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; };
    const mul = (a, b) => { const o = []; for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
    const vec = (m, v) => [0, 1, 2, 3].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
    function malla(n) {                       // n × n quads en un plano de −1 a 1, con uv
      const d = [], idx = [];
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) d.push(-1 + 2 * i / n, -1 + 2 * j / n, 0, i / n, j / n);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; idx.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1); }
      const vao = new G.VAO();
      const vbo = new G.Buffer(new Float32Array(d));
      vao.configurar(0, new G.Atributo(vbo, { size: 3, stride: 20, offset: 0 }));
      vao.configurar(1, new G.Atributo(vbo, { size: 2, stride: 20, offset: 12 }));
      vao.elementos = new G.Buffer(new Uint16Array(idx));
      return { vao, n: idx.length };
    }
    const mallas = { 1: malla(1), 4: malla(4) };
    const prog = new G.Programa({
      vertexShader: (a, u) => [vec(u.u_mvp, [...a.a_pos, 1]), { v_uv: a.a_uv }],
      fragmentShader: (v) => {
        const c = (Math.floor(v.v_uv[0] * 8) + Math.floor(v.v_uv[1] * 8)) % 2;
        return c ? [0.93, 0.9, 0.8, 1] : [0.2, 0.23, 0.34, 1];
      },
      atributos: { a_pos: [0, "vec3"], a_uv: [1, "vec2"] }, uniforms: { u_mvp: "mat4" },
    });
    const original = G.aVentana;
    const redondeada = (v, vp) => { const r = original(v, vp); return [Math.round(r[0]), Math.round(r[1]), r[2], r[3]]; };
    let ultimo = 0, fps = 0, n = 0, t0 = 0;
    const img = canvas.getContext("2d");
    const lz = Curso.lienzo2d(lienzo, {
      animar: true,
      dibujar(ctx, e) {
        ctx.clearRect(0, 0, e.w, e.h);
        if (st.girar) st.ang += e.dt * 0.5;
        const a = 0.95 * Math.sin(st.ang), b = 0.3 * Math.sin(st.ang * 0.7 + 1);   // oscila, sin llegar a ponerse de canto
        const ry = [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
        const rx = [1, 0, 0, 0, 0, Math.cos(b), Math.sin(b), 0, 0, -Math.sin(b), Math.cos(b), 0, 0, 0, 0, 1];
        const tr = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -2.9, 1];
        prog.uniforms.u_mvp = mul(persp(1.0, W / H, 0.1, 50), mul(tr, mul(rx, ry)));
        const fb = new G.Framebuffer(W, H);
        fb.limpiar([0.06, 0.07, 0.09, 1]);
        const est = new G.EstadoFijo(); est.correccionPerspectiva = st.perspectiva;
        const m = mallas[st.subdividir ? 4 : 1];
        if (st.enteros) G.aVentana = redondeada;
        let r;
        try { r = G.dibujarElementos(fb, prog, m.vao, G.TRIANGLES, m.n, G.UNSIGNED_SHORT, 0, est); } finally { G.aVentana = original; }
        G.mostrar(fb, canvas);
        n++; if (e.t - t0 > 1) { fps = n / (e.t - t0); n = 0; t0 = e.t; }
        info.textContent = (st.perspectiva ? "con corrección de perspectiva" : "SIN corrección de perspectiva (afín)") + " · " + (st.subdividir ? "4 × 4 quads (32 triángulos)" : "1 quad (2 triángulos)") +
          " · vértices " + (st.enteros ? "redondeados a píxeles enteros" : "con subpíxel") + "\n" + r.fragmentos + " fragmentos por frame en la GPU de juguete (JavaScript) · " + fps.toFixed(0) + " fps";
      },
    });
    const ctr = raiz.querySelector(".demo-controles");
    Curso.casilla(ctr, { etiqueta: "corrección de perspectiva", valor: st.perspectiva, alCambiar: (v) => (st.perspectiva = v) });
    Curso.casilla(ctr, { etiqueta: "subdividir en 4 × 4", valor: st.subdividir, alCambiar: (v) => (st.subdividir = v) });
    Curso.casilla(ctr, { etiqueta: "vértices en píxeles enteros", valor: st.enteros, alCambiar: (v) => (st.enteros = v) });
    Curso.casilla(ctr, { etiqueta: "girar", valor: st.girar, alCambiar: (v) => (st.girar = v) });
  }

  Curso.alListo(() => {
    const a = document.getElementById("demo-curva-w"); if (a) demoCurva(a);
    const b = document.getElementById("demo-ps1"); if (b) demoPS1(b);
  });
})();
