/* =====================================================================
   demos-41.js — demos a medida de la lección 4.1 (CPU vs GPU)
     #demo-carriles  simulador de un warp: carriles, máscara y divergencia
     #demo-cola      línea de tiempo CPU / command buffer / GPU
     #demo-estado    la máquina de estados de WebGL, llamada a llamada
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. Simulador de carriles (SIMT y divergencia)
     ------------------------------------------------------------------ */
  function programas(n, prob) {
    // Cada programa devuelve { listado: [líneas], traza: [{ l: línea, tipo, m: máscara[] }] }
    const todos = (v) => new Array(n).fill(v);
    const pseudo = (i) => { const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return x - Math.floor(x); };
    const siNo = (listado, cond, costeA, costeB, lineaA, lineaB, extra) => {
      const traza = [{ l: 0, tipo: "comun", m: todos(true) }, { l: 1, tipo: "comun", m: todos(true) }];
      const mA = cond, mB = cond.map((c) => !c);
      if (mA.some(Boolean)) for (let k = 0; k < costeA; k++) traza.push({ l: lineaA, tipo: "A", m: mA });
      if (mB.some(Boolean)) for (let k = 0; k < costeB; k++) traza.push({ l: lineaB, tipo: "B", m: mB });
      traza.push({ l: listado.length - 1, tipo: "comun", m: todos(true) });
      return { listado, traza, extra };
    };
    const base = (c) => [
      "vec2 uv = gl_FragCoord.xy / u_res;",
      "if (" + c + ") {",
      "  color = caro(uv);    // 6 instrucciones",
      "} else {",
      "  color = barato(uv);  // 2 instrucciones",
      "}",
      "fragColor = vec4(color, 1.0);",
    ];
    const lanes = [...Array(n).keys()];
    return {
      mitad: siNo(base("x < " + n / 2), lanes.map((i) => i < n / 2), 6, 2, 2, 4),
      damero: siNo(base("x % 2 == 0"), lanes.map((i) => i % 2 === 0), 6, 2, 2, 4),
      uniforme: siNo(base("u_modo == 1"), todos(true), 6, 2, 2, 4),
      rara: siNo(base("ruido(uv) > " + (1 - prob).toFixed(2)), lanes.map((i) => pseudo(i) < prob), 6, 2, 2, 4),
      bucle: (() => {
        const listado = ["int n = iteraciones(x);  // entre 1 y 8", "for (int i = 0; i < n; i++) {", "  acc += f(i);", "}", "fragColor = vec4(acc);"];
        const it = lanes.map((i) => 1 + Math.floor(pseudo(i + 7) * 8));
        const traza = [{ l: 0, tipo: "comun", m: todos(true) }];
        const max = Math.max(...it);
        for (let k = 0; k < max; k++) {
          traza.push({ l: 1, tipo: "comun", m: it.map((v) => v >= k) });
          traza.push({ l: 2, tipo: "A", m: it.map((v) => v > k) });
        }
        traza.push({ l: 1, tipo: "comun", m: it.map((v) => v >= max) });
        traza.push({ l: 4, tipo: "comun", m: todos(true) });
        return { listado, traza, extra: it };
      })(),
    };
  }

  function demoCarriles(raiz) {
    const info = raiz.querySelector(".demo-info");
    let n = 8, clave = "mitad", prob = 0.1, paso = 0, reproduciendo = false, acumulado = 0;
    let prog = programas(n, prob)[clave];
    const recalcular = () => { prog = programas(n, prob)[clave]; paso = Math.min(paso, prog.traza.length); lz.redibujar(); };
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: false,
      dibujar(ctx, e) {
        const c = e.colores, W = e.w, H = e.h;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, W, H);
        const anchoListado = Math.min(300, W * 0.42);
        // listado
        ctx.font = "12.5px " + c.mono; ctx.textBaseline = "middle";
        const lineaActual = paso > 0 ? prog.traza[paso - 1].l : -1;
        prog.listado.forEach((txt, i) => {
          const y = 22 + i * 21;
          if (i === lineaActual) { ctx.fillStyle = c.borde; ctx.fillRect(4, y - 10, anchoListado - 8, 20); ctx.fillStyle = c.acento; ctx.fillRect(4, y - 10, 3, 20); }
          ctx.fillStyle = i === lineaActual ? c.texto : c.texto2;
          ctx.fillText(txt, 12, y, anchoListado - 16);
        });
        // leyenda
        const ly = 22 + prog.listado.length * 21 + 24;
        ctx.font = "12px " + c.fuente;
        [["comun", c.verde, "todos los carriles"], ["A", c.acento, "rama del if / cuerpo del bucle"], ["B", c.acento2, "rama del else"], ["x", c.borde2, "carril enmascarado (esperando)"]].forEach(([_, col, t], k) => {
          const x = 12, y = ly + k * 18;
          ctx.fillStyle = col; ctx.fillRect(x, y - 6, 12, 12); ctx.fillStyle = c.texto2; ctx.fillText(t, x + 18, y);
        });
        // rejilla carriles × ciclos
        const x0 = anchoListado + 34, y0 = 14, total = prog.traza.length;
        const cw = Math.max(4, Math.min(22, (W - x0 - 10) / total));
        const ch = Math.max(3, Math.min(20, (H - y0 - 34) / n));
        ctx.font = "10px " + c.mono; ctx.textAlign = "right";
        for (let i = 0; i < n; i++) {
          if (n <= 8 || i % 4 === 0) { ctx.fillStyle = c.tenue; ctx.fillText("x=" + i, x0 - 4, y0 + i * ch + ch / 2); }
          for (let k = 0; k < total; k++) {
            const t = prog.traza[k];
            const x = x0 + k * cw, y = y0 + i * ch;
            if (k >= paso) { ctx.strokeStyle = c.rejilla; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1); continue; }
            const activo = t.m[i];
            ctx.fillStyle = !activo ? c.borde2 : t.tipo === "A" ? c.acento : t.tipo === "B" ? c.acento2 : c.verde;
            ctx.globalAlpha = activo ? 1 : 0.35;
            ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
            ctx.globalAlpha = 1;
          }
        }
        ctx.textAlign = "left"; ctx.fillStyle = c.tenue;
        ctx.fillText("ciclo →", x0, y0 + n * ch + 12);
        // estadísticas
        let util = 0, hechos = 0;
        for (let k = 0; k < paso; k++) { util += prog.traza[k].m.filter(Boolean).length; hechos += n; }
        let utilTot = 0; prog.traza.forEach((t) => (utilTot += t.m.filter(Boolean).length));
        info.textContent = "ciclos ejecutados: " + paso + " de " + total + "   ·   trabajo útil: " + util + " de " + hechos +
          " carril·ciclos (" + (hechos ? Math.round(100 * util / hechos) : 0) + " %)   ·   eficiencia del programa completo: " +
          Math.round(100 * utilTot / (total * n)) + " %" + (clave === "bucle" ? "\niteraciones por carril: " + prog.extra.join(" ") : "");
      },
    });
    const ctr = raiz.querySelector(".demo-controles");
    Curso.selector(ctr, { etiqueta: "programa", valor: clave, opciones: [["mitad", "if (x < mitad)"], ["damero", "if (x % 2 == 0)"], ["uniforme", "if (uniform): sin divergencia"], ["rara", "if (ruido > umbral): rama rara"], ["bucle", "for con n distinto por carril"]],
      alCambiar: (v) => { clave = v; paso = 0; recalcular(); } });
    Curso.selector(ctr, { etiqueta: "carriles", valor: "8", opciones: [["8", "8"], ["32", "32 (un warp)"]], alCambiar: (v) => { n = +v; recalcular(); } });
    Curso.control(ctr, { etiqueta: "prob. rama rara", min: 0, max: 1, paso: 0.05, valor: prob, alCambiar: (v) => { prob = v; recalcular(); } });
    Curso.boton(ctr, "▶ paso", () => { reproduciendo = false; paso = Math.min(prog.traza.length, paso + 1); lz.redibujar(); }, true);
    const bPlay = Curso.boton(ctr, "▶▶ reproducir", () => { reproduciendo = !reproduciendo; if (paso >= prog.traza.length) paso = 0; bPlay.textContent = reproduciendo ? "⏸ pausa" : "▶▶ reproducir"; tic(); });
    Curso.boton(ctr, "⟲", () => { paso = 0; lz.redibujar(); });
    let ultimo = 0;
    function tic(ms) {
      if (!reproduciendo) return;
      if (ms && ms - ultimo > 260) { ultimo = ms; paso++; lz.redibujar(); }
      if (paso >= prog.traza.length) { reproduciendo = false; bPlay.textContent = "▶▶ reproducir"; return; }
      requestAnimationFrame(tic);
    }
    paso = prog.traza.length;   // al cargar se ve el programa completo
    lz.redibujar();
  }

  /* ------------------------------------------------------------------
     2. Línea de tiempo: CPU, command buffer y GPU
     ------------------------------------------------------------------ */
  const ESCENARIOS = {
    normal: { nombre: "8 draws y fin del frame", pasos: () => [...Array(8)].map(() => ({ t: "draw" })).concat([{ t: "fin" }]) },
    readpixels: { nombre: "8 draws + readPixels", pasos: () => [...Array(8)].map(() => ({ t: "draw" })).concat([{ t: "read" }, { t: "fin" }]) },
    geterror: { nombre: "getError tras cada draw", pasos: () => [...Array(8)].flatMap(() => [{ t: "draw" }, { t: "err" }]).concat([{ t: "fin" }]) },
    fence: { nombre: "readPixels diferido (fence)", pasos: () => [...Array(8)].map(() => ({ t: "draw" })).concat([{ t: "fence" }, { t: "fin" }]) },
  };
  function simular(pasos, costeGPU) {
    // Tiempos en ms. CPU: cada llamada cuesta ~0.05 ms de JS; GPU: cada draw cuesta costeGPU.
    const cpu = [], gpu = [];
    let tc = 0.5, tg = 0, cola = [];
    const ejecutarCola = () => {                // flush: el command buffer viaja y la GPU lo procesa en orden
      while (cola.length) {
        const c = cola.shift();
        const ini = Math.max(tg, tc + 0.15);     // no empieza antes de que llegue el envío
        tg = ini + c.dur; gpu.push({ ini, fin: tg, t: c.t });
      }
    };
    for (const p of pasos) {
      if (p.t === "draw") { cpu.push({ ini: tc, fin: tc + 0.05, t: "draw" }); cola.push({ t: "draw", dur: costeGPU, enviado: tc }); tc += 0.05; }
      else if (p.t === "err") { ejecutarCola(); cpu.push({ ini: tc, fin: tc + 0.06, t: "err" }); tc += 0.06; }  // envía y pregunta
      else if (p.t === "read") {
        cpu.push({ ini: tc, fin: tc + 0.05, t: "read" }); tc += 0.05;
        ejecutarCola();
        const fin = Math.max(tc, tg + 0.1);
        cpu.push({ ini: tc, fin, t: "espera" }); tc = fin;
      } else if (p.t === "fence") { cpu.push({ ini: tc, fin: tc + 0.05, t: "fence" }); tc += 0.05; }
      else if (p.t === "fin") { cpu.push({ ini: tc, fin: tc + 0.05, t: "fin" }); tc += 0.05; ejecutarCola(); }
    }
    return { cpu, gpu, finCPU: tc, finGPU: tg };
  }
  function demoCola(raiz) {
    const info = raiz.querySelector(".demo-info");
    let clave = "normal", coste = 1.5, t = 0, animando = true;
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, W = e.w, H = e.h;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, W, H);
        const sim = simular(ESCENARIOS[clave].pasos(), coste);
        const rango = 20;                                    // ms visibles
        if (animando) t = Math.min(rango, t + e.dt * 8);     // 8 ms simulados por segundo real (≈125× más lento que la realidad)
        const x0 = 110, x1 = W - 16, X = (ms) => x0 + (ms / rango) * (x1 - x0);
        const filas = { cpu: 70, gpu: 190 };
        ctx.font = "13px " + c.fuente; ctx.textBaseline = "middle"; ctx.fillStyle = c.texto;
        ctx.fillText("CPU · tu JS", 12, filas.cpu); ctx.fillText("GPU", 12, filas.gpu);
        ctx.fillStyle = c.tenue; ctx.font = "11px " + c.fuente;
        ctx.fillText("(proceso de la página)", 12, filas.cpu + 16); ctx.fillText("(ejecuta la cola)", 12, filas.gpu + 16);
        // regla de tiempo y vsync
        ctx.strokeStyle = c.rejilla; ctx.fillStyle = c.tenue; ctx.font = "10px " + c.mono;
        for (let ms = 0; ms <= rango; ms += 2) { ctx.beginPath(); ctx.moveTo(X(ms) + 0.5, 30); ctx.lineTo(X(ms) + 0.5, H - 40); ctx.stroke(); ctx.fillText(ms + " ms", X(ms) - 12, H - 30); }
        ctx.strokeStyle = c.aviso; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(16.7), 26); ctx.lineTo(X(16.7), H - 40); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.aviso; ctx.fillText("siguiente vsync (16,7 ms)", X(16.7) - 150, 22);
        // bloques
        const colorDe = { draw: c.acento, err: c.rosa, read: c.rosa, espera: c.error, fence: c.verde, fin: c.amarillo };
        const pintar = (lista, y) => lista.forEach((b) => {
          if (b.ini > t) return;
          const fin = Math.min(b.fin, t);
          ctx.fillStyle = colorDe[b.t] || c.acento2;
          ctx.fillRect(X(b.ini), y - 14, Math.max(2, X(fin) - X(b.ini) - 1), 28);
          if (b.t === "espera" && X(fin) - X(b.ini) > 70) { ctx.fillStyle = c.fondo; ctx.font = "600 12px " + c.fuente; ctx.fillText("esperando a la GPU", X(b.ini) + 6, y); }
        });
        pintar(sim.cpu, filas.cpu);
        sim.gpu.forEach((b) => { b.t = "draw"; });
        pintar(sim.gpu, filas.gpu);
        // flechas de "encolado"
        ctx.strokeStyle = c.borde2; ctx.lineWidth = 1;
        let k = 0;
        sim.cpu.filter((b) => b.t === "draw").forEach((b) => { const g = sim.gpu[k++]; if (!g || b.ini > t) return; ctx.beginPath(); ctx.moveTo(X(b.ini), filas.cpu + 14); ctx.lineTo(X(Math.min(g.ini, t)), filas.gpu - 14); ctx.stroke(); });
        // cursor
        ctx.strokeStyle = c.texto; ctx.beginPath(); ctx.moveTo(X(t) + 0.5, 30); ctx.lineTo(X(t) + 0.5, H - 40); ctx.stroke();
        info.textContent = "escenario: " + ESCENARIOS[clave].nombre + "\nla CPU queda libre en " + sim.finCPU.toFixed(2) + " ms · la GPU termina en " +
          sim.finGPU.toFixed(2) + " ms" + (clave === "readpixels" ? "  ← readPixels obliga a la CPU a esperar a la GPU" : clave === "geterror" ? "  ← cada getError es un viaje de ida y vuelta al proceso de la GPU" : clave === "fence" ? "  ← la fence se consulta en un frame posterior: nadie espera" : "  ← el JS termina enseguida; la GPU trabaja después");
        if (t >= rango) animando = false;
      },
    });
    const ctr = raiz.querySelector(".demo-controles");
    Curso.selector(ctr, { etiqueta: "escenario", valor: clave, opciones: Object.keys(ESCENARIOS).map((k) => [k, ESCENARIOS[k].nombre]), alCambiar: (v) => { clave = v; t = 0; animando = true; lz.animar(true); } });
    Curso.control(ctr, { etiqueta: "coste GPU por draw (ms)", min: 0.5, max: 2.2, paso: 0.1, valor: coste, alCambiar: (v) => { coste = v; t = 0; animando = true; lz.animar(true); } });
    Curso.boton(ctr, "⟲ repetir", () => { t = 0; animando = true; lz.animar(true); }, true);
  }

  /* ------------------------------------------------------------------
     3. La máquina de estados de WebGL, llamada a llamada
     ------------------------------------------------------------------ */
  const GUIONES = {
    bug: [
      ["// crearBuffer() enlaza y... deja el buffer enlazado", null],
      ["const bufA = gl.createBuffer();", (s) => { s.buffers.bufA = { datos: "—" }; }],
      ["gl.bindBuffer(gl.ARRAY_BUFFER, bufA);", (s) => { s.arrayBuffer = "bufA"; }],
      ["gl.bufferData(gl.ARRAY_BUFFER, trianguloIzq, …);", (s) => { s.buffers[s.arrayBuffer].datos = "triángulo izq."; s.tocado = "buf:" + s.arrayBuffer; }],
      ["const vaoA = gl.createVertexArray();", (s) => { s.vaos.vaoA = { attr: {}, ebo: null }; }],
      ["gl.bindVertexArray(vaoA);", (s) => { s.vao = "vaoA"; }],
      ["gl.enableVertexAttribArray(0);", (s) => { s.attr(0).on = true; }],
      ["gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);", (s) => { Object.assign(s.attr(0), { buf: s.arrayBuffer, size: 2, tipo: "FLOAT", stride: 0, off: 0 }); }],
      ["const bufB = gl.createBuffer();", (s) => { s.buffers.bufB = { datos: "—" }; }],
      ["gl.bindBuffer(gl.ARRAY_BUFFER, bufB);", (s) => { s.arrayBuffer = "bufB"; }],
      ["gl.bufferData(gl.ARRAY_BUFFER, trianguloDer, …);", (s) => { s.buffers[s.arrayBuffer].datos = "triángulo der."; s.tocado = "buf:" + s.arrayBuffer; }],
      ["const vaoB = gl.createVertexArray();", (s) => { s.vaos.vaoB = { attr: {}, ebo: null }; }],
      ["gl.bindVertexArray(vaoB);", (s) => { s.vao = "vaoB"; }],
      ["gl.enableVertexAttribArray(0);", (s) => { s.attr(0).on = true; }],
      ["gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);", (s) => { Object.assign(s.attr(0), { buf: s.arrayBuffer, size: 2, tipo: "FLOAT", stride: 0, off: 0 }); }],
      ["// ... más tarde: \"subo el triángulo de la izquierda\"", null],
      ["gl.bufferData(gl.ARRAY_BUFFER, izqMasArriba, …);", (s) => { s.buffers[s.arrayBuffer].datos = "izq. más arriba ⚠"; s.tocado = "buf:" + s.arrayBuffer; s.error = "¡Has sobrescrito " + s.arrayBuffer + ", no bufA! bufferData modifica el buffer ENLAZADO."; }],
    ],
    bien: null,
  };
  GUIONES.bien = GUIONES.bug.slice(0, 16).concat([
    ["gl.bindBuffer(gl.ARRAY_BUFFER, bufA);   // enlazar ANTES de editar", (s) => { s.arrayBuffer = "bufA"; }],
    ["gl.bufferData(gl.ARRAY_BUFFER, izqMasArriba, …);", (s) => { s.buffers[s.arrayBuffer].datos = "izq. más arriba ✓"; s.tocado = "buf:" + s.arrayBuffer; s.ok = "Correcto: vaoA sigue apuntando a bufA y bufA tiene los datos nuevos."; }],
  ]);

  function estadoInicial() {
    const s = { arrayBuffer: null, vao: null, programa: null, buffers: {}, vaos: {}, tocado: null, error: null, ok: null };
    s.attr = (loc) => { const v = s.vaos[s.vao]; if (!v) return (s.error = "no hay VAO enlazado"), {}; return (v.attr[loc] = v.attr[loc] || { on: false, buf: null, size: 4, tipo: "FLOAT", stride: 0, off: 0 }); };
    return s;
  }

  function demoEstado(raiz) {
    const cont = raiz.querySelector(".m4-estado");
    const codigo = cont.querySelector(".m4-codigo"), panel = cont.querySelector(".m4-panel");
    const info = raiz.querySelector(".demo-info");
    let clave = "bug", paso = 0;
    function ejecutar(hasta) {
      const s = estadoInicial();
      const guion = GUIONES[clave];
      for (let i = 0; i < hasta; i++) { s.tocado = null; s.error = null; s.ok = null; const f = guion[i][1]; if (f) f(s); }
      return s;
    }
    const obj = (nombre) => nombre ? '<span class="m4-obj ' + (/A$/.test(nombre) ? "a" : "b") + '">' + nombre + "</span>" : '<span class="m4-obj vacio">null</span>';
    function pintar() {
      const guion = GUIONES[clave];
      const s = ejecutar(paso), previo = ejecutar(Math.max(0, paso - 1));
      codigo.innerHTML = guion.map((g, i) => '<div class="' + (g[1] ? "" : "comentario ") + (i < paso - 1 ? "hecha" : i === paso - 1 ? "actual" : "") + '">' + Curso.util.escapar(g[0]) + "</div>").join("");
      const act = codigo.querySelector(".actual");
      if (act) { const top = act.offsetTop - codigo.offsetTop; if (top < codigo.scrollTop || top > codigo.scrollTop + codigo.clientHeight - 30) codigo.scrollTop = top - 60; }
      const cambia = (a, b) => (a !== b ? " cambio" : "");
      let h = "<h5>Estado del contexto</h5>";
      h += '<div class="m4-slot' + cambia(s.arrayBuffer, previo.arrayBuffer) + '"><span class="k">ARRAY_BUFFER</span>' + obj(s.arrayBuffer) + "</div>";
      h += '<div class="m4-slot' + cambia(s.vao, previo.vao) + '"><span class="k">VERTEX_ARRAY</span>' + obj(s.vao) + "</div>";
      for (const nv in s.vaos) {
        const v = s.vaos[nv];
        h += "<h5 style='text-transform:none;letter-spacing:0'>" + nv + " · estado guardado en el VAO</h5><table class='m4-attr'><tr><th>loc</th><th>habil.</th><th>buffer</th><th>size</th><th>tipo</th><th>stride</th><th>offset</th></tr>";
        const locs = Object.keys(v.attr);
        if (!locs.length) h += "<tr><td colspan='7' style='color:var(--muted)'>(sin atributos configurados)</td></tr>";
        locs.forEach((l) => { const a = v.attr[l], pa = previo.vaos[nv] && previo.vaos[nv].attr[l]; const cam = JSON.stringify(a) !== JSON.stringify(pa) ? " class='cambio'" : ""; h += "<tr" + cam + "><td>" + l + "</td><td>" + (a.on ? "sí" : "no") + "</td><td>" + (a.buf || "null") + "</td><td>" + a.size + "</td><td>" + a.tipo + "</td><td>" + a.stride + "</td><td>" + a.off + "</td></tr>"; });
        h += "</table>";
      }
      h += "<h5>Buffers (memoria de la GPU)</h5>";
      for (const nb in s.buffers) h += '<div class="m4-slot' + (s.tocado === "buf:" + nb ? " cambio" : "") + '"><span class="k">' + nb + '</span><span class="m4-datos">' + Curso.util.escapar(s.buffers[nb].datos) + "</span></div>";
      if (s.error) h += '<p class="error">' + Curso.util.escapar(s.error) + "</p>";
      if (s.ok) h += '<p style="color:var(--ok);font-weight:600">' + Curso.util.escapar(s.ok) + "</p>";
      panel.innerHTML = h;
      info.textContent = "paso " + paso + " de " + guion.length + (paso ? "   ·   " + guion[paso - 1][0] : "");
    }
    const ctr = raiz.querySelector(".demo-controles");
    Curso.selector(ctr, { etiqueta: "guion", valor: clave, opciones: [["bug", "con el bug (editar sin enlazar)"], ["bien", "corregido (enlazar antes de editar)"]], alCambiar: (v) => { clave = v; paso = 0; pintar(); } });
    Curso.boton(ctr, "◀", () => { paso = Math.max(0, paso - 1); pintar(); });
    Curso.boton(ctr, "▶ siguiente llamada", () => { paso = Math.min(GUIONES[clave].length, paso + 1); pintar(); }, true);
    Curso.boton(ctr, "⏭ todo", () => { paso = GUIONES[clave].length; pintar(); });
    Curso.boton(ctr, "⟲", () => { paso = 0; pintar(); });
    paso = 3; pintar();
  }

  Curso.alListo(() => {
    const a = document.getElementById("demo-carriles"); if (a) demoCarriles(a);
    const b = document.getElementById("demo-cola"); if (b) demoCola(b);
    const c = document.getElementById("demo-estado"); if (c) demoEstado(c);
  });
})();
