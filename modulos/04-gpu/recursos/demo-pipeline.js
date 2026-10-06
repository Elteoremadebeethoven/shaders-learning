/* =====================================================================
   demo-pipeline.js — lección 4.2: un triángulo atraviesa el pipeline,
   etapa por etapa. Usa la GPU de juguete (gpu-juguete.js) para calcular
   de verdad cada paso (recorte, cobertura, interpolación, profundidad).
   Además: #demo-primitivas (modos de ensamblado) y #demo-cobertura
   (regla de desempate).
   ===================================================================== */
(function () {
  "use strict";
  const G = window.GPUJuguete;

  /* ---------------- matrices mínimas (column-major, como WebGL) ---------------- */
  const M = {
    mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    vec(m, v) { return [0, 1, 2, 3].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]); },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
    tras(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; },
    persp(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; },
  };
  const f2 = (x) => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);
  const f3 = (x) => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(3);

  const ETAPAS = [
    ["Datos: el VBO", "Tres vértices con posición (x, y, z) en el espacio del objeto, un color y unas coordenadas de textura (u, v). Para la GPU son solo 32 bytes por vértice en un buffer; el VAO dice cómo leerlos."],
    ["Vertex shader", "Una invocación por vértice. Multiplica la posición por las matrices de modelo, vista y proyección y escribe gl_Position en espacio de clip (x, y, z, w). Aquí lo ves desde arriba: la cámara está abajo, mirando hacia arriba (−z), y la línea discontinua es el plano cercano."],
    ["Ensamblado de primitivas", "Con el modo TRIANGLES, cada tres vértices forman un triángulo, en el orden en que llegan: A → B → C. Ese orden (el «giro») decidirá más tarde si el triángulo mira hacia la cámara."],
    ["Recorte", "Todo lo que queda fuera del volumen −w ≤ x, y, z ≤ w se recorta. Si un vértice está detrás del plano cercano, el triángulo se corta y se convierte en un polígono de 4 vértices (dos triángulos). Mueve «z de C» hacia la cámara para verlo."],
    ["División de perspectiva", "x, y y z se dividen por w: el resultado son coordenadas normalizadas de dispositivo (NDC), de −1 a 1 en los tres ejes. Aquí es donde lo lejano se encoge."],
    ["Viewport", "Las NDC se estiran al rectángulo de gl.viewport: x de −1…1 pasa a 0…ancho píxeles, y de −1…1 a 0…alto (con la y hacia ARRIBA), z de −1…1 a 0…1. Los puntos son los centros de los píxeles."],
    ["Culling", "El signo del área del triángulo en pantalla dice su giro: antihorario (CCW) = de frente, por defecto. Con gl.enable(gl.CULL_FACE), los que dan la espalda se descartan aquí, antes de gastar nada en rasterizarlos."],
    ["Rasterización", "¿Qué píxeles cubre? Para cada píxel de la caja envolvente se evalúan las tres funciones de arista en su CENTRO. Los que pasan generan un fragmento. Pasa el ratón por las celdas para ver los números."],
    ["Interpolación", "Cada fragmento recibe los varyings (aquí, el color) mezclados con las coordenadas baricéntricas del centro del píxel. Con corrección de perspectiva, los pesos se ajustan con 1/w; sin ella, el resultado es el de una PlayStation 1."],
    ["Fragment shader", "Una invocación por fragmento: calcula el color final. Este multiplica el color interpolado por un damero hecho con las coordenadas (u, v). Desactiva la corrección de perspectiva y mira cómo se tuerce el damero."],
    ["Operaciones por fragmento", "Antes de escribir, cada fragmento pasa las pruebas fijas: scissor, stencil, profundidad… Aquí ya había un triángulo gris en el framebuffer; los fragmentos que quedan detrás de él fallan la prueba de profundidad (marcados con una cruz)."],
    ["Framebuffer", "El resultado: una rejilla de píxeles con un color cada uno. Con tan pocos píxeles se ven los «dientes de sierra»; sube la resolución para acercarte a lo que harías en una pantalla de verdad."],
  ];

  function demoPipeline(raiz) {
    const texto = raiz.querySelector(".m4-etapa-texto");
    const info = raiz.querySelector(".demo-info");
    const st = { etapa: 0, angulo: 35, zC: 0, culling: false, perspectiva: true, profundidad: true, res: "48x30", hover: null };
    let r = null;                                              // resultados del pipeline

    function calcular() {
      const [W, H] = st.res.split("x").map(Number);
      const verts = [
        { p: [-1.0, -0.7, 0], c: [1, 0.25, 0.2], uv: [0, 0] },
        { p: [1.0, -0.6, 0], c: [0.2, 0.85, 0.3], uv: [1, 0] },
        { p: [0.15, 0.85, st.zC], c: [0.3, 0.45, 1], uv: [0.5, 1] },
      ];
      const modelo = M.mul(M.tras(0, 0, -2.3), M.rotY(st.angulo * Math.PI / 180));
      const proy = M.persp(55 * Math.PI / 180, W / H, 0.5, 10);
      const mvp = M.mul(proy, modelo);
      const datos = new Float32Array(verts.flatMap((v) => [...v.p, ...v.c, ...v.uv]));
      const vbo = new G.Buffer(datos);
      const vao = new G.VAO();
      vao.configurar(0, new G.Atributo(vbo, { size: 3, stride: 32, offset: 0 }));
      vao.configurar(1, new G.Atributo(vbo, { size: 3, stride: 32, offset: 12 }));
      vao.configurar(2, new G.Atributo(vbo, { size: 2, stride: 32, offset: 24 }));
      const prog = new G.Programa({
        vertexShader: (a, u) => [M.vec(u.u_mvp, [...a.a_pos, 1]), { v_color: a.a_color, v_uv: a.a_uv }],
        fragmentShader: (v) => { const k = (Math.floor(v.v_uv[0] * 4) + Math.floor(v.v_uv[1] * 4)) % 2 ? 1 : 0.35; return [v.v_color[0] * k, v.v_color[1] * k, v.v_color[2] * k, 1]; },
        atributos: { a_pos: [0, "vec3"], a_color: [1, "vec3"], a_uv: [2, "vec2"] }, uniforms: { u_mvp: "mat4" },
      });
      prog.uniforms.u_mvp = mvp;
      const fb = new G.Framebuffer(W, H);
      fb.limpiar([0.07, 0.08, 0.1, 1]);
      // triángulo gris ya dibujado (para la prueba de profundidad)
      const vboG = new G.Buffer(new Float32Array([0.05, -1.05, -2.45, 1.45, -0.25, -2.45, 0.45, 1.05, -2.45]));
      const vaoG = new G.VAO(); vaoG.configurar(0, new G.Atributo(vboG, { size: 3 }));
      const progG = new G.Programa({ vertexShader: (a, u) => [M.vec(u.p, [...a.a_pos, 1]), {}], fragmentShader: () => [0.42, 0.44, 0.5, 1], atributos: { a_pos: [0, "vec3"] }, uniforms: { p: "mat4" } });
      progG.uniforms.p = proy;
      const est = new G.EstadoFijo(); est.depthTest = true;
      const eG = st.etapa >= 10 && st.profundidad;
      const fbG = new G.Framebuffer(W, H); fbG.limpiar([0, 0, 0, 0]);
      G.dibujarArrays(fbG, progG, vaoG, G.TRIANGLES, 0, 3, est);
      if (eG) G.dibujarArrays(fb, progG, vaoG, G.TRIANGLES, 0, 3, est);
      const traza = { vertices: [], triangulos: [], candidatos: new Map(), fragmentos: new Map() };
      const e = new G.EstadoFijo();
      e.cullFace = st.culling; e.correccionPerspectiva = st.perspectiva; e.depthTest = eG;
      const estad = G.dibujarArrays(fb, prog, vao, G.TRIANGLES, 0, 3, e, null, (ev, d) => {
        if (ev === "vertice") traza.vertices.push(d);
        else if (ev === "triangulo") traza.triangulos.push(d);
        else if (ev === "candidato") traza.candidatos.set(d.x + "," + d.y, d);
        else if (ev === "fragmento") traza.fragmentos.set(d.x + "," + d.y, d);
      });
      // geometría auxiliar para las vistas
      const ojo = verts.map((v) => M.vec(modelo, [...v.p, 1]));
      const clip = traza.vertices.map((v) => v.gl_Position);
      const poligono = G.recortar(clip.map((p, i) => [p, { i }]));
      const ventana = poligono.map((v) => G.aVentana(v, [0, 0, W, H]));
      let area2 = 0;
      for (let i = 0; i < ventana.length; i++) { const a = ventana[i], b = ventana[(i + 1) % ventana.length]; area2 += a[0] * b[1] - b[0] * a[1]; }
      r = { W, H, verts, ojo, clip, poligono, ventana, area2, traza, fb, fbG, estad, recortado: clip.some((p) => p[2] < -p[3] || p[2] > p[3]), gris: eG };
    }

    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const c = e.colores, Wc = e.w, Hc = e.h;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, Wc, Hc);
        if (!r) return;
        const et = st.etapa;
        const col = (v) => "rgb(" + v.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255)).join(",") + ")";
        const nombres = ["A", "B", "C"];
        ctx.font = "12px " + c.fuente; ctx.textBaseline = "middle";
        if (et === 0) {                                           // espacio del objeto
          const esc = Math.min(Wc, Hc) / 3.2, cx = Wc / 2, cy = Hc / 2;
          const P = (p) => [cx + p[0] * esc, cy - p[1] * esc];
          ejes(ctx, c, cx, cy, esc, "x", "y");
          poli(ctx, r.verts.map((v) => P(v.p)), c.acento, "rgba(139,123,255,0.12)");
          r.verts.forEach((v, i) => { const q = P(v.p); punto(ctx, q, col(v.c)); ctx.fillStyle = c.texto; ctx.fillText(nombres[i] + "  z = " + f2(v.p[2]), q[0] + 9, q[1] - 9); });
        } else if (et <= 3) {                                     // vista cenital (espacio del ojo)
          const esc = Math.min(Wc / 8, Hc / 5.2), cx = Wc / 2, cy = Hc - 22;
          const P = (p) => [cx + p[0] * esc, cy + p[2] * esc];     // z negativo = hacia arriba
          const tf = Math.tan(27.5 * Math.PI / 180) * (r.W / r.H);
          ctx.strokeStyle = c.borde2; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(...P([0, 0, 0])); ctx.lineTo(...P([-tf * 5, 0, -5])); ctx.moveTo(...P([0, 0, 0])); ctx.lineTo(...P([tf * 5, 0, -5])); ctx.stroke();
          ctx.setLineDash([5, 4]); ctx.strokeStyle = c.aviso; ctx.beginPath(); ctx.moveTo(...P([-2.5, 0, -0.5])); ctx.lineTo(...P([2.5, 0, -0.5])); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = c.aviso; ctx.fillText("plano cercano (z = −0,5)", P([1.1, 0, -0.5])[0], P([0, 0, -0.5])[1] - 10);
          ctx.fillStyle = c.texto2; ctx.fillText("cámara", cx + 8, cy); punto(ctx, [cx, cy], c.texto);
          ctx.fillStyle = c.tenue; ctx.fillText("vista desde arriba: x → derecha, −z ↑", 10, 14);
          const pts = r.ojo.map(P);
          if (et === 3 && r.recortado) {
            // polígono recortado (en el espacio del ojo, contra z = −0,5)
            const ojoP = recortarOjo(r.ojo, -0.5);
            poli(ctx, pts, c.tenue, null, [4, 4]);
            poli(ctx, ojoP.map(P), c.acento, "rgba(139,123,255,0.18)");
            ojoP.forEach((q) => punto(ctx, P(q), c.amarillo, 3.5));
          } else poli(ctx, pts, c.acento, "rgba(139,123,255,0.12)");
          if (et === 2) flechasOrden(ctx, pts, c.acento2);
          r.ojo.forEach((q, i) => { const s = P(q); punto(ctx, s, col(r.verts[i].c)); ctx.fillStyle = c.texto; ctx.fillText(nombres[i], s[0] + 8, s[1] - 8); });
        } else if (et === 4) {                                    // NDC
          const lado = Math.min(Wc, Hc) - 50, x0 = (Wc - lado) / 2, y0 = 25;
          const P = (p) => [x0 + (p[0] + 1) / 2 * lado, y0 + (1 - (p[1] + 1) / 2) * lado];
          ctx.strokeStyle = c.borde2; ctx.strokeRect(x0, y0, lado, lado);
          ctx.fillStyle = c.tenue; ctx.fillText("(−1, −1)", x0 - 4, y0 + lado + 12); ctx.fillText("(1, 1)", x0 + lado - 30, y0 - 12);
          const ndc = r.poligono.map((v) => [v[0][0] / v[0][3], v[0][1] / v[0][3]]);
          ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, lado, lado); ctx.clip();
          poli(ctx, ndc.map(P), c.acento, "rgba(139,123,255,0.15)"); ctx.restore();
          ndc.forEach((q) => punto(ctx, P(q), c.amarillo, 3.5));
        } else {                                                  // rejilla de píxeles
          const { W, H } = r;
          const t = Math.min((Wc - 20) / W, (Hc - 20) / H), x0 = (Wc - t * W) / 2, y0 = (Hc - t * H) / 2;
          const X = (x) => x0 + x * t, Y = (y) => y0 + (H - y) * t;   // y de ventana hacia arriba
          const celda = (x, y, estilo) => { ctx.fillStyle = estilo; ctx.fillRect(X(x) + 0.5, Y(y + 1) + 0.5, t - 1, t - 1); };
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) celda(x, y, c.superficie);
          const caja = r.traza.triangulos[0] && r.traza.triangulos[0].caja;
          if (et >= 7) {
            for (const [k, d] of r.traza.candidatos) { if (!d.dentro) continue; const [x, y] = k.split(",").map(Number); celda(x, y, et === 7 ? c.acento : "transparent"); }
          }
          if (et >= 10 && r.gris) {                               // lo que ya había en el framebuffer
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (r.fbG.color[i + 3]) celda(x, y, "rgb(107,112,128)"); }
          }
          if (et === 8 || et === 9 || et === 10) {
            for (const [k, d] of r.traza.fragmentos) {
              const [x, y] = k.split(",").map(Number);
              const colr = et === 8 ? d.varyings.v_color : d.color;
              if (et === 10 && d.resultado === "falla profundidad") continue;
              celda(x, y, col(colr));
            }
            if (et === 10) for (const [k, d] of r.traza.fragmentos) {
              if (d.resultado !== "falla profundidad") continue;
              const [x, y] = k.split(",").map(Number);
              ctx.strokeStyle = c.error; ctx.lineWidth = Math.max(1, t / 12);
              ctx.beginPath(); ctx.moveTo(X(x) + t * 0.25, Y(y + 1) + t * 0.25); ctx.lineTo(X(x) + t * 0.75, Y(y + 1) + t * 0.75);
              ctx.moveTo(X(x) + t * 0.75, Y(y + 1) + t * 0.25); ctx.lineTo(X(x) + t * 0.25, Y(y + 1) + t * 0.75); ctx.stroke(); ctx.lineWidth = 1;
            }
          }
          if (et === 11) {
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; celda(x, y, "rgb(" + r.fb.color[i] + "," + r.fb.color[i + 1] + "," + r.fb.color[i + 2] + ")"); }
          }
          if (et >= 5 && et <= 7 && t >= 7) {                     // centros de píxel
            ctx.fillStyle = c.tenue;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { ctx.beginPath(); ctx.arc(X(x + 0.5), Y(y + 0.5), Math.max(1, t / 14), 0, 7); ctx.fill(); }
          }
          if (et === 7 && caja) { ctx.setLineDash([5, 4]); ctx.strokeStyle = c.aviso; ctx.strokeRect(X(caja[0]), Y(caja[3] + 1), (caja[2] - caja[0] + 1) * t, (caja[3] - caja[1] + 1) * t); ctx.setLineDash([]); }
          if (et <= 7) {
            const pts = r.ventana.map((v) => [X(v[0]), Y(v[1])]);
            const frente = r.area2 > 0;
            const relleno = et === 6 ? (frente ? "rgba(62,207,142,0.25)" : "rgba(255,107,122,0.28)") : null;
            ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W * t, H * t); ctx.clip();
            poli(ctx, pts, et === 6 ? (frente ? c.ok : c.error) : c.acento2, relleno);
            if (et === 6) flechasOrden(ctx, pts.slice(0, 3), frente ? c.ok : c.error);
            ctx.restore();
          }
          if (st.hover && et >= 7) {                              // celda bajo el ratón
            const hx = Math.floor((st.hover[0] - x0) / t), hy = H - 1 - Math.floor((st.hover[1] - y0) / t);
            if (hx >= 0 && hy >= 0 && hx < W && hy < H) { ctx.strokeStyle = c.texto; ctx.lineWidth = 2; ctx.strokeRect(X(hx), Y(hy + 1), t, t); ctx.lineWidth = 1; r.celda = [hx, hy]; } else r.celda = null;
          } else r.celda = null;
        }
        pintarInfo();
      },
      alMover(e) { st.hover = [e.raton.x, e.raton.y]; },
    });
    raiz.querySelector(".demo-lienzo canvas").addEventListener("pointerleave", () => { st.hover = null; lz.redibujar(); });

    function pintarInfo() {
      const et = st.etapa, n = ["A", "B", "C"];
      texto.innerHTML = "<strong>" + (et + 1) + ". " + ETAPAS[et][0] + ".</strong> " + ETAPAS[et][1];
      let s = "";
      if (et === 0) s = r.verts.map((v, i) => n[i] + ": pos (" + v.p.map(f2).join(", ") + ")  color (" + v.c.map(f2).join(", ") + ")  uv (" + v.uv.join(", ") + ")").join("\n");
      else if (et === 1 || et === 2) s = r.clip.map((p, i) => "gl_Position de " + n[i] + " = (" + p.map(f3).join(", ") + ")" + (p[3] <= 0 ? "   ← w ≤ 0: está DETRÁS de la cámara" : "")).join("\n") + (et === 2 ? "\ntriángulo: " + n.join(" → ") : "");
      else if (et === 3) s = r.recortado ? "hay vértices fuera de −w ≤ z ≤ w: el triángulo se recorta\nel polígono resultante tiene " + r.poligono.length + " vértices → " + (r.poligono.length - 2) + " triángulo(s)" : "todos los vértices cumplen −w ≤ z ≤ w: no hace falta recortar (x e y se limitan luego al viewport)";
      else if (et === 4) s = r.poligono.map((v, i) => "NDC " + (i + 1) + " = (" + [v[0][0] / v[0][3], v[0][1] / v[0][3], v[0][2] / v[0][3]].map(f3).join(", ") + ")   [dividido por w = " + f3(v[0][3]) + "]").join("\n");
      else if (et === 5) s = r.ventana.map((v, i) => "ventana " + (i + 1) + " = (" + f2(v[0]) + ", " + f2(v[1]) + ")  z = " + f3(v[2])).join("\n") + "\nviewport: (0, 0, " + r.W + ", " + r.H + ")";
      else if (et === 6) s = "área con signo = " + f2(r.area2 / 2) + " píxeles² → " + (r.area2 > 0 ? "antihorario (CCW): DE FRENTE" : "horario (CW): DE ESPALDAS") + (st.culling && r.area2 < 0 ? "\nculling activado: el triángulo se DESCARTA aquí" : st.culling ? "\nculling activado: pasa" : "\nculling desactivado: pasa (gira el triángulo más de 90° para verlo de espaldas)");
      else {
        s = "fragmentos generados: " + r.estad.fragmentos + (et >= 10 && r.gris ? " · fallan la profundidad: " + r.estad.fallanProfundidad : "") + (r.estad.descartadosCulling ? " · triángulo descartado por culling" : "");
        if (r.celda) {
          const k = r.celda.join(","), cd = r.traza.candidatos.get(k), fr = r.traza.fragmentos.get(k);
          s += "\npíxel (" + r.celda.join(", ") + "), centro (" + (r.celda[0] + 0.5) + ", " + (r.celda[1] + 0.5) + ")";
          if (!cd) s += ": fuera de la caja envolvente";
          else s += "\nfunciones de arista w0, w1, w2 = " + cd.w.map(f2).join(", ") + (cd.dentro ? "  → DENTRO" : "  → fuera");
          if (fr) s += "\nλ (pantalla) = " + fr.lambda.map(f3).join(", ") + "   pesos usados = " + fr.pesos.map(f3).join(", ") + "\nv_color = (" + fr.varyings.v_color.map(f3).join(", ") + ")  v_uv = (" + fr.varyings.v_uv.map(f3).join(", ") + ")  z = " + f3(fr.z) + (fr.resultado ? "  → " + fr.resultado : "");
        } else s += "\n(pasa el ratón por la rejilla)";
      }
      info.textContent = s;
    }

    // controles
    const ctr = raiz.querySelector(".demo-controles");
    const sel = Curso.selector(ctr, { etiqueta: "etapa", valor: "0", opciones: ETAPAS.map((x, i) => [String(i), (i + 1) + ". " + x[0]]), alCambiar: (v) => { st.etapa = +v; calcular(); lz.redibujar(); } });
    const ir = (d) => { st.etapa = Math.max(0, Math.min(ETAPAS.length - 1, st.etapa + d)); sel.select.value = String(st.etapa); calcular(); lz.redibujar(); };
    Curso.boton(ctr, "◀ anterior", () => ir(-1));
    Curso.boton(ctr, "siguiente ▶", () => ir(1), true);
    Curso.control(ctr, { etiqueta: "giro (°)", min: -170, max: 170, paso: 1, valor: st.angulo, alCambiar: (v) => { st.angulo = v; calcular(); lz.redibujar(); } });
    Curso.control(ctr, { etiqueta: "z de C", min: -1.5, max: 3.4, paso: 0.05, valor: st.zC, alCambiar: (v) => { st.zC = v; calcular(); lz.redibujar(); } });
    Curso.casilla(ctr, { etiqueta: "culling (BACK)", valor: st.culling, alCambiar: (v) => { st.culling = v; calcular(); lz.redibujar(); } });
    Curso.casilla(ctr, { etiqueta: "corrección de perspectiva", valor: st.perspectiva, alCambiar: (v) => { st.perspectiva = v; calcular(); lz.redibujar(); } });
    Curso.casilla(ctr, { etiqueta: "triángulo gris + profundidad", valor: st.profundidad, alCambiar: (v) => { st.profundidad = v; calcular(); lz.redibujar(); } });
    Curso.selector(ctr, { etiqueta: "píxeles", valor: st.res, opciones: [["16x10", "16 × 10"], ["32x20", "32 × 20"], ["48x30", "48 × 30"], ["96x60", "96 × 60"]], alCambiar: (v) => { st.res = v; calcular(); lz.redibujar(); } });
    calcular(); lz.redibujar();
  }

  /* ---------------- utilidades de dibujo ---------------- */
  function punto(ctx, p, color, r) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], r || 5, 0, 7); ctx.fill(); }
  function poli(ctx, pts, trazo, relleno, discontinua) {
    if (pts.length < 2) return;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    ctx.strokeStyle = trazo; ctx.lineWidth = 2; if (discontinua) ctx.setLineDash(discontinua); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
  }
  function flechasOrden(ctx, pts, color) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const mx = a[0] + (b[0] - a[0]) * 0.55, my = a[1] + (b[1] - a[1]) * 0.55;
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(mx + Math.cos(ang) * 9, my + Math.sin(ang) * 9);
      ctx.lineTo(mx + Math.cos(ang + 2.5) * 9, my + Math.sin(ang + 2.5) * 9);
      ctx.lineTo(mx + Math.cos(ang - 2.5) * 9, my + Math.sin(ang - 2.5) * 9); ctx.closePath(); ctx.fill();
    }
  }
  function ejes(ctx, c, cx, cy, esc, nx, ny) {
    ctx.strokeStyle = c.eje; ctx.beginPath(); ctx.moveTo(cx - 1.5 * esc, cy); ctx.lineTo(cx + 1.5 * esc, cy); ctx.moveTo(cx, cy + 1.3 * esc); ctx.lineTo(cx, cy - 1.3 * esc); ctx.stroke();
    ctx.fillStyle = c.tenue; ctx.fillText(nx, cx + 1.5 * esc - 10, cy + 12); ctx.fillText(ny, cx + 8, cy - 1.3 * esc + 6);
  }
  function recortarOjo(pts, zPlano) {               // Sutherland–Hodgman contra z <= zPlano (delante de la cámara)
    const salida = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const da = zPlano - a[2], db = zPlano - b[2];
      if (da >= 0) salida.push(a);
      if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); salida.push(a.map((v, k) => v + t * (b[k] - v))); }
    }
    return salida;
  }

  /* =====================================================================
     #demo-primitivas: cómo se agrupan los vértices según el modo
     ===================================================================== */
  function demoPrimitivas(raiz) {
    const info = raiz.querySelector(".demo-info");
    let modo = "TRIANGLE_STRIP";
    const pts = { v0: { x: -3, y: 1.2 }, v1: { x: -2.4, y: -1.3 }, v2: { x: -1, y: 1.1 }, v3: { x: 0, y: -1.4 }, v4: { x: 1.1, y: 1.2 }, v5: { x: 2.3, y: -1.2 } };
    Object.keys(pts).forEach((k, i) => Object.assign(pts[k], { etiqueta: String(i), color: "acento" }));
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-4.2, 4.2], puntos: pts, rejilla: false, ejes: false,
      dibujar(p, P) {
        const v = Object.values(P);
        const tris = [], lineas = [];
        if (modo === "TRIANGLES") for (let i = 0; i + 2 < v.length; i += 3) tris.push([i, i + 1, i + 2]);
        if (modo === "TRIANGLE_STRIP") for (let i = 0; i < v.length - 2; i++) tris.push(i % 2 ? [i + 1, i, i + 2] : [i, i + 1, i + 2]);
        if (modo === "TRIANGLE_FAN") for (let i = 1; i < v.length - 1; i++) tris.push([0, i, i + 1]);
        if (modo === "LINES") for (let i = 0; i + 1 < v.length; i += 2) lineas.push([i, i + 1]);
        if (modo === "LINE_STRIP") for (let i = 0; i < v.length - 1; i++) lineas.push([i, i + 1]);
        if (modo === "LINE_LOOP") for (let i = 0; i < v.length; i++) lineas.push([i, (i + 1) % v.length]);
        const textos = [];
        tris.forEach((t, k) => {
          const [a, b, c] = t.map((i) => v[i]);
          const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
          const ccw = area > 0;
          p.poligono([[a.x, a.y], [b.x, b.y], [c.x, c.y]], { relleno: ccw ? "rgba(62,207,142,0.18)" : "rgba(255,107,122,0.22)", color: ccw ? "ok" : "error", grosor: 1.5 });
          const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
          p.texto([cx, cy], "T" + k, { alinear: "center", color: ccw ? "ok" : "error", negrita: true });
          textos.push("T" + k + " = (" + t.join(", ") + ") " + (ccw ? "CCW" : "CW"));
        });
        lineas.forEach(([i, j]) => p.linea([v[i].x, v[i].y], [v[j].x, v[j].y], { color: "acento2", grosor: 2.5 }));
        if (modo === "POINTS") textos.push("cada vértice es un punto (gl_PointSize en el vertex shader)");
        if (lineas.length) textos.push(lineas.length + " líneas: " + lineas.map((l) => "(" + l.join(", ") + ")").join(" "));
        info.textContent = modo + ": " + textos.join(" · ");
      },
    });
    Curso.selector(raiz.querySelector(".demo-controles"), { etiqueta: "modo", valor: modo, opciones: ["TRIANGLES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "LINES", "LINE_STRIP", "LINE_LOOP", "POINTS"].map((m) => [m, "gl." + m]), alCambiar: (m) => { modo = m; pl.redibujar(); } });
  }

  /* =====================================================================
     #demo-cobertura: dos triángulos que comparten una arista y la regla de desempate
     ===================================================================== */
  function demoCobertura(raiz) {
    const info = raiz.querySelector(".demo-info");
    const W = 16, H = 10;
    let regla = "gpu";
    const pts = { a: { x: 2.5, y: 1.5, etiqueta: "A" }, b: { x: 13.5, y: 2.5, etiqueta: "B" }, c: { x: 5.5, y: 8.5, etiqueta: "C" }, d: { x: 12.5, y: 8.5, etiqueta: "D" } };
    Object.values(pts).forEach((q) => (q.color = "acento"));
    const pl = Curso.plano(raiz.querySelector(".demo-lienzo"), {
      x: [-0.5, W + 0.5], centroY: H / 2, puntos: pts, iman: 0.5, rejilla: false, ejes: false,
      restringir(n, q) { q.x = Math.max(0, Math.min(W, q.x)); q.y = Math.max(0, Math.min(H, q.y)); },
      dibujar(p, P) {
        const t1 = [[P.a.x, P.a.y], [P.b.x, P.b.y], [P.c.x, P.c.y]];            // comparten la arista B-C
        const t2 = [[P.b.x, P.b.y], [P.d.x, P.d.y], [P.c.x, P.c.y]];
        const cuenta = new Array(W * H).fill(0), quien = new Array(W * H).fill(0), compartida = new Array(W * H).fill(false);
        const Bp = [P.b.x, P.b.y], Cp = [P.c.x, P.c.y];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {            // centros EXACTAMENTE sobre la arista B–C
          const q = [x + 0.5, y + 0.5];
          const dentroSegmento = q[0] >= Math.min(Bp[0], Cp[0]) && q[0] <= Math.max(Bp[0], Cp[0]) && q[1] >= Math.min(Bp[1], Cp[1]) && q[1] <= Math.max(Bp[1], Cp[1]);
          const esExtremo = (q[0] === Bp[0] && q[1] === Bp[1]) || (q[0] === Cp[0] && q[1] === Cp[1]);   // un vértice no es "arista compartida": es el borde exterior del conjunto
          if (G.arista(Bp, Cp, q) === 0 && dentroSegmento && !esExtremo) compartida[y * W + x] = true;
        }
        [t1, t2].forEach((t, k) => {
          let [A, B, C] = t;
          let area = G.arista(A, B, C);
          if (area === 0) return;
          if (area < 0) [B, C] = [C, B];
          const emp = [G.cuentaEmpate(B, C), G.cuentaEmpate(C, A), G.cuentaEmpate(A, B)];
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const q = [x + 0.5, y + 0.5];
            const w = [G.arista(B, C, q), G.arista(C, A, q), G.arista(A, B, q)];
            const dentro = regla === "gpu" ? w.every((v, i) => v > 0 || (v === 0 && emp[i])) : regla === "incluir" ? w.every((v) => v >= 0) : w.every((v) => v > 0);
            if (dentro) { cuenta[y * W + x]++; quien[y * W + x] |= k + 1; }
          }
        });
        const e = p.escala();
        let dobles = 0, total = 0, huecos = 0, nCompartida = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const col = cuenta[i] >= 2 ? "rgba(255,107,122,0.85)" : quien[i] === 1 ? "rgba(139,123,255,0.55)" : quien[i] === 2 ? "rgba(63,208,232,0.5)" : null;
          const [sx, sy] = p.aPantalla([x, y + 1]);
          p.ctx.strokeStyle = p.colores.rejilla; p.ctx.strokeRect(sx + 0.5, sy + 0.5, e - 1, e - 1);
          if (col) { p.ctx.fillStyle = col; p.ctx.fillRect(sx + 1, sy + 1, e - 2, e - 2); }
          if (cuenta[i] >= 2) dobles++;
          if (cuenta[i]) total++;
          if (compartida[i]) { nCompartida++; if (!cuenta[i]) huecos++; }
          p.punto([x + 0.5, y + 0.5], { radio: compartida[i] ? 3.5 : 1.8, color: compartida[i] ? "amarillo" : "tenue" });
        }
        p.poligono(t1, { color: "acento", grosor: 1.5 });
        p.poligono(t2, { color: "acento2", grosor: 1.5 });
        info.textContent = "píxeles cubiertos: " + total + " · pintados DOS veces: " + dobles + " · centros justo sobre la arista compartida B–C, sin contar los vértices (amarillos): " + nCompartida + ", sin pintar: " + huecos +
          (regla === "gpu" ? "\nregla de la GPU: un centro sobre una arista cuenta solo si es arista izquierda o inferior → nunca dobles, nunca huecos" : regla === "incluir" ? "\n«>= 0» en todas las aristas: los centros sobre la arista compartida se pintan dos veces (se notaría con transparencias)" : "\n«> 0» estricto: los centros sobre la arista compartida no los pinta ninguno (huecos)");
      },
    });
    Curso.selector(raiz.querySelector(".demo-controles"), { etiqueta: "regla", valor: regla, opciones: [["gpu", "la de la GPU (izquierda/inferior)"], ["incluir", "incluir siempre (>= 0)"], ["excluir", "excluir siempre (> 0)"]], alCambiar: (v) => { regla = v; pl.redibujar(); } });
  }

  Curso.alListo(() => {
    const a = document.getElementById("demo-pipeline"); if (a) demoPipeline(a);
    const b = document.getElementById("demo-primitivas"); if (b) demoPrimitivas(b);
    const c = document.getElementById("demo-cobertura"); if (c) demoCobertura(c);
  });
})();
