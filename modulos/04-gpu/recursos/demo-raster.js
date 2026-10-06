/* =====================================================================
   demo-raster.js — lección 4.3: la rasterización, píxel a píxel.
   La GPU de juguete (gpu-juguete.js) dibuja un triángulo y guarda una
   traza de cada píxel candidato; la demo la reproduce paso a paso:
   funciones de arista, dentro/fuera, baricéntricas, pesos corregidos,
   varyings interpolados y el color que devuelve el fragment shader.
   ===================================================================== */
(function () {
  "use strict";
  const G = window.GPUJuguete;

  function demoRaster(raiz) {
    const info = raiz.querySelector(".demo-info");
    const W = 20, H = 12;
    const st = { paso: 0, reproduciendo: false, velocidad: 8, wC: 1, perspectiva: true, acumulado: 0 };
    const pts = {
      a: { x: 2.5, y: 1.25, etiqueta: "A", color: "#ff5a4a" },
      b: { x: 17.75, y: 3.5, etiqueta: "B", color: "#3ecf6e" },
      c: { x: 8.25, y: 10.75, etiqueta: "C", color: "#5a7bff" },
    };
    let traza = [], stats = null;

    function calcular() {
      const verts = [[pts.a, [1, 0.25, 0.2], 1], [pts.b, [0.2, 0.85, 0.3], 1], [pts.c, [0.3, 0.45, 1], st.wC]];
      // posición de clip tal que, tras dividir por w y aplicar el viewport, caiga en (x, y) de ventana
      const datos = new Float32Array(verts.flatMap(([p, col, w]) => [(2 * p.x / W - 1) * w, (2 * p.y / H - 1) * w, 0, w, ...col]));
      const vbo = new G.Buffer(datos);
      const vao = new G.VAO();
      vao.configurar(0, new G.Atributo(vbo, { size: 4, stride: 28, offset: 0 }));
      vao.configurar(1, new G.Atributo(vbo, { size: 3, stride: 28, offset: 16 }));
      const prog = new G.Programa({
        vertexShader: (a) => [a.a_pos, { v_color: a.a_color }],
        fragmentShader: (v) => [v.v_color[0], v.v_color[1], v.v_color[2], 1],
        atributos: { a_pos: [0, "vec4"], a_color: [1, "vec3"] },
      });
      const fb = new G.Framebuffer(W, H);
      const e = new G.EstadoFijo(); e.correccionPerspectiva = st.perspectiva;
      const lista = [], porPixel = new Map();
      let tri = null;
      stats = G.dibujarArrays(fb, prog, vao, G.TRIANGLES, 0, 3, e, null, (ev, d) => {
        if (ev === "triangulo") tri = d;
        else if (ev === "candidato") { const r = { x: d.x, y: d.y, w: d.w, dentro: d.dentro }; lista.push(r); porPixel.set(d.x + "," + d.y, r); }
        else if (ev === "fragmento") Object.assign(porPixel.get(d.x + "," + d.y), { lambda: d.lambda, pesos: d.pesos, v: d.varyings.v_color, color: d.color, bytes: d.color.map((c) => G.aByte(c)) });
      });
      traza = lista;
      st.tri = tri;
      st.paso = Math.min(st.paso, traza.length);
    }

    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-0.6, W + 0.6], centroY: H / 2, puntos: pts, iman: 0.25, rejilla: false, ejes: false,
      restringir(n, q) { q.x = Math.max(0, Math.min(W, q.x)); q.y = Math.max(0, Math.min(H, q.y)); },
      alCambiar() { calcular(); },
      dibujar(p) {
        const ctx = p.ctx, e = p.escala(), c = p.colores;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const [sx, sy] = p.aPantalla([x, y + 1]);
          ctx.fillStyle = c.superficie; ctx.fillRect(sx + 1, sy + 1, e - 2, e - 2);
        }
        // caja envolvente
        if (st.tri) {
          const [x0, y0, x1, y1] = st.tri.caja;
          const [sx, sy] = p.aPantalla([x0, y1 + 1]);
          ctx.setLineDash([5, 4]); ctx.strokeStyle = c.aviso; ctx.strokeRect(sx, sy, (x1 - x0 + 1) * e, (y1 - y0 + 1) * e); ctx.setLineDash([]);
        }
        // píxeles ya procesados
        for (let k = 0; k < st.paso && k < traza.length; k++) {
          const r = traza[k];
          const [sx, sy] = p.aPantalla([r.x, r.y + 1]);
          if (r.dentro && r.bytes) { ctx.fillStyle = "rgb(" + r.bytes.slice(0, 3).join(",") + ")"; ctx.fillRect(sx + 1, sy + 1, e - 2, e - 2); }
          else { ctx.strokeStyle = c.borde2; ctx.beginPath(); ctx.moveTo(sx + e * 0.35, sy + e * 0.35); ctx.lineTo(sx + e * 0.65, sy + e * 0.65); ctx.moveTo(sx + e * 0.65, sy + e * 0.35); ctx.lineTo(sx + e * 0.35, sy + e * 0.65); ctx.stroke(); }
        }
        // centros de píxel
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.punto([x + 0.5, y + 0.5], { radio: 1.6, color: "tenue" });
        // el triángulo
        p.poligono([[pts.a.x, pts.a.y], [pts.b.x, pts.b.y], [pts.c.x, pts.c.y]], { color: "texto", grosor: 1.2 });
        // píxel actual
        const r = traza[Math.min(st.paso, traza.length) - 1];
        if (r && st.paso <= traza.length) {
          const [sx, sy] = p.aPantalla([r.x, r.y + 1]);
          ctx.strokeStyle = c.texto; ctx.lineWidth = 2.5; ctx.strokeRect(sx + 1, sy + 1, e - 2, e - 2); ctx.lineWidth = 1;
          p.punto([r.x + 0.5, r.y + 0.5], { radio: 4, color: r.dentro ? "ok" : "error" });
        }
        pintarInfo(r);
      },
    });

    const f3 = (x) => (Math.abs(x) < 5e-4 ? 0 : x).toFixed(3), f2 = (x) => (Math.abs(x) < 5e-3 ? 0 : x).toFixed(2);
    function pintarInfo(r) {
      let s = "píxel " + Math.min(st.paso, traza.length) + " de " + traza.length + " candidatos de la caja envolvente · fragmentos generados: " + stats.fragmentos;
      if (r) {
        s += "\npíxel (" + r.x + ", " + r.y + ") · centro (" + (r.x + 0.5) + ", " + (r.y + 0.5) + ")";
        // Si arrastras los vértices hasta dejarlos en sentido horario, la GPU de juguete intercambia B y C para que
        // el área salga positiva (gpu-juguete.js, rasterizar): las aristas y las λ pasan a ser las del orden A, C, B.
        const horario = st.tri && st.tri.frontal === false;
        const E = horario ? ["E_CB", "E_BA", "E_AC"] : ["E_BC", "E_CA", "E_AB"];
        if (horario) s += "\n(sentido horario: la GPU de juguete intercambia B y C, así que el orden es A, C, B)";
        s += "\nfunciones de arista: w0 = " + E[0] + " = " + f2(r.w[0]) + "   w1 = " + E[1] + " = " + f2(r.w[1]) + "   w2 = " + E[2] + " = " + f2(r.w[2]);
        s += r.dentro ? "   → DENTRO (las tres > 0, o = 0 en una arista izquierda/inferior)" : "   → FUERA (alguna < 0, o = 0 en una arista derecha/superior; no se ejecuta el fragment shader)";
        if (r.dentro && r.lambda) {
          s += "\nλ" + (horario ? " (de A, C, B)" : "") + " = w / (2·área) = (" + r.lambda.map(f3).join(", ") + ")   pesos " + (st.perspectiva ? "corregidos con 1/w" : "(sin corregir)") + " = (" + r.pesos.map(f3).join(", ") + ")";
          s += "\nv_color = (" + r.v.map(f3).join(", ") + ")  →  fragColor en bytes = (" + r.bytes.join(", ") + ")";
        }
      } else s += "\npulsa ▶ para empezar (y arrastra los vértices cuando quieras)";
      info.textContent = s;
    }

    const ctr = raiz.querySelector(".demo-controles");
    const bPlay = Curso.boton(ctr, "▶ reproducir", () => { st.reproduciendo = !st.reproduciendo; if (st.paso >= traza.length) st.paso = 0; bPlay.textContent = st.reproduciendo ? "⏸ pausa" : "▶ reproducir"; ultimo = 0; requestAnimationFrame(tic); }, true);
    Curso.boton(ctr, "paso", () => { st.reproduciendo = false; bPlay.textContent = "▶ reproducir"; st.paso = Math.min(traza.length, st.paso + 1); pl.redibujar(); });
    Curso.boton(ctr, "⏭ todo", () => { st.reproduciendo = false; bPlay.textContent = "▶ reproducir"; st.paso = traza.length; pl.redibujar(); });
    Curso.boton(ctr, "⟲", () => { st.paso = 0; pl.redibujar(); });
    Curso.control(ctr, { etiqueta: "píxeles/s", min: 1, max: 120, paso: 1, valor: st.velocidad, alCambiar: (v) => { st.velocidad = v; } });
    Curso.control(ctr, { etiqueta: "w de C", min: 1, max: 4, paso: 0.25, valor: st.wC, alCambiar: (v) => { st.wC = v; calcular(); pl.redibujar(); } });
    Curso.casilla(ctr, { etiqueta: "corrección de perspectiva", valor: st.perspectiva, alCambiar: (v) => { st.perspectiva = v; calcular(); pl.redibujar(); } });
    let ultimo = 0;
    function tic(ms) {
      if (!st.reproduciendo) return;
      if (ultimo) { st.acumulado += (ms - ultimo) / 1000 * st.velocidad; const n = Math.floor(st.acumulado); if (n > 0) { st.acumulado -= n; st.paso = Math.min(traza.length, st.paso + n); pl.redibujar(); } }
      ultimo = ms;
      if (st.paso >= traza.length) { st.reproduciendo = false; bPlay.textContent = "▶ reproducir"; return; }
      requestAnimationFrame(tic);
    }
    calcular();
    st.paso = Math.round(traza.length * 0.45);       // al cargar, a medio camino
    pl.redibujar();
  }

  Curso.alListo(() => { const a = document.getElementById("demo-raster"); if (a) demoRaster(a); });
})();
