/* Demos de la lección 3.6 · De modelo a pantalla: una cámara 3D hecha a mano en Canvas 2D
   Todo el pipeline en JavaScript con mat4 de glkit.js (column-major, vectores columna). */
(function () {
  "use strict";
  const f = M3.f;

  Curso.alListo(() => {
    const raiz = document.getElementById("demo-camara");
    if (!raiz || !window.mat4) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    const st = { fov: 50, cerca: 0.5, lejos: 12, dist: 5, yaw: 0.65, pitch: 0.38, girar: true, sinAspecto: false, sinRecorte: false };
    let ang = 0.4, arrastre = null;

    const VERT = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const ARISTAS = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

    /* Recorta el segmento a–b (en espacio clip) contra los planos near (z ≥ −w) y far (z ≤ w).
       Se interpola en espacio clip, ANTES de dividir por w. */
    function recortar(a, b) {
      for (const plano of [(v) => v[2] + v[3], (v) => v[3] - v[2]]) {
        const da = plano(a), db = plano(b);
        if (da < 0 && db < 0) return null;             // entero fuera de este plano
        if (da < 0 || db < 0) {
          const t = da / (da - db);                    // dónde cruza el plano
          const p = a.map((x, i) => x + (b[i] - x) * t);
          if (da < 0) a = p; else b = p;
        }
      }
      return [a, b];
    }

    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h;
        if (st.girar) ang += e.dt * 0.35;
        const sep = 12, wL = Math.round(w * 0.58), wR = w - wL - sep;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);

        // --- el pipeline ---
        const cp = Math.cos(st.pitch);
        const ojo = [st.dist * cp * Math.sin(st.yaw), st.dist * Math.sin(st.pitch), st.dist * cp * Math.cos(st.yaw)];
        const M = mat4.rotacionY(ang);                                   // modelo
        const Vm = mat4.mirarA(ojo, [0, 0, 0], [0, 1, 0]);                // vista
        const aspecto = wL / h;
        const lejos = Math.max(st.lejos, st.cerca + 0.5);                // far siempre por detrás de near (los deslizadores se solapan)
        const P = mat4.perspectiva(st.fov * Math.PI / 180, st.sinAspecto ? 1 : aspecto, st.cerca, lejos);
        const PV = mat4.multiplicar(P, Vm);
        const PVM = mat4.multiplicar(PV, M);
        const aPantalla = (ndc) => [(ndc[0] + 1) / 2 * wL, (1 - ndc[1]) / 2 * h];   // viewport (y del canvas hacia abajo)

        // --- panel izquierdo: la imagen de la cámara ---
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, wL, h); ctx.clip();
        const segmento = (A, B, color, grosor) => {
          let a = A, b = B, malo = false;
          if (!st.sinRecorte) { const r = recortar(a, b); if (!r) return; [a, b] = r; }
          else malo = a[3] <= 0 || b[3] <= 0;
          const pa = aPantalla([a[0] / a[3], a[1] / a[3]]), pb = aPantalla([b[0] / b[3], b[1] / b[3]]);
          if (![pa[0], pa[1], pb[0], pb[1]].every(Number.isFinite)) return;
          ctx.strokeStyle = malo ? c.error : color; ctx.lineWidth = grosor;
          ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
        };
        // suelo (y = −1) en coordenadas de mundo: solo P·V
        for (let k = -4; k <= 4; k++) {
          segmento(mat4.porVector(PV, [k, -1, -4, 1]), mat4.porVector(PV, [k, -1, 4, 1]), c.borde2, 1);
          segmento(mat4.porVector(PV, [-4, -1, k, 1]), mat4.porVector(PV, [4, -1, k, 1]), c.borde2, 1);
        }
        const clips = VERT.map((v) => mat4.porVector(PVM, [v[0], v[1], v[2], 1]));
        ARISTAS.forEach(([i, j]) => segmento(clips[i], clips[j], c.acento, 2.5));
        clips.forEach((q, i) => {
          const dentro = [0, 1, 2].every((k) => Math.abs(q[k]) <= q[3]) && q[3] > 0;
          if (!dentro && !st.sinRecorte) return;
          if (q[3] <= 0 && !st.sinRecorte) return;
          const s = aPantalla([q[0] / q[3], q[1] / q[3]]);
          if (!s.every(Number.isFinite)) return;
          ctx.fillStyle = i === 6 ? c.amarillo : (q[3] <= 0 ? c.error : c.texto);
          ctx.beginPath(); ctx.arc(s[0], s[1], i === 6 ? 6 : 3.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
        ctx.strokeStyle = c.borde2; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, wL - 1, h - 1);
        ctx.fillStyle = c.tenue; ctx.font = "12px " + c.mono;
        ctx.fillText("cámara (arrastra para orbitar)", 10, 18);

        // --- panel derecho: vista desde arriba con el frustum ---
        ctx.save();
        ctx.translate(wL + sep, 0);
        ctx.beginPath(); ctx.rect(0, 0, wR, h); ctx.clip();
        ctx.fillStyle = c.superficie; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, wR, h); ctx.globalAlpha = 1;
        const ext = Math.max(st.dist, lejos - st.dist, 3) + 1.2;
        const esc = Math.min(wR, h) / (2 * ext);
        const top = (p) => [wR / 2 + p[0] * esc, h / 2 + p[2] * esc];          // x → derecha, z → abajo
        ctx.strokeStyle = c.rejilla; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = -Math.ceil(ext); k <= Math.ceil(ext); k++) {
          let a = top([k, 0, -ext]), b = top([k, 0, ext]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
          a = top([-ext, 0, k]); b = top([ext, 0, k]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
        // frustum: las 8 esquinas del cubo NDC llevadas al mundo con la inversa de P·V
        const inv = mat4.invertir(PV);
        if (inv) {
          const esquina = (x, y, z) => { const q = mat4.porVector(inv, [x, y, z, 1]); return [q[0] / q[3], q[1] / q[3], q[2] / q[3]]; };
          const E = {};
          for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) E[x + "," + y + "," + z] = esquina(x, y, z);
          ctx.strokeStyle = c.acento2; ctx.lineWidth = 1.5; ctx.beginPath();
          const lado = (k1, k2) => { const a = top(E[k1]), b = top(E[k2]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); };
          for (const y of [-1, 1]) for (const z of [-1, 1]) lado("-1," + y + "," + z, "1," + y + "," + z);
          for (const x of [-1, 1]) for (const z of [-1, 1]) lado(x + ",-1," + z, x + ",1," + z);
          for (const x of [-1, 1]) for (const y of [-1, 1]) lado(x + "," + y + ",-1", x + "," + y + ",1");
          ctx.stroke();
          ctx.fillStyle = c.acento2; ctx.font = "11px " + c.mono;
          const ncerca = top(esquina(0, 0, -1)), nlejos = top(esquina(0, 0, 1));
          ctx.fillText("near", ncerca[0] + 4, ncerca[1] - 4); ctx.fillText("far", nlejos[0] + 4, nlejos[1] - 4);
        }
        // el cubo visto desde arriba (sus aristas proyectadas en xz)
        const mundo = VERT.map((v) => mat4.porVector(M, [v[0], v[1], v[2], 1]));
        ctx.strokeStyle = c.acento; ctx.lineWidth = 1.5; ctx.beginPath();
        ARISTAS.forEach(([i, j]) => { const a = top(mundo[i]), b = top(mundo[j]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); });
        ctx.stroke();
        mundo.forEach((q, i) => {
          const cl = clips[i];
          const dentro = cl[3] > 0 && [0, 1, 2].every((k) => Math.abs(cl[k]) <= cl[3]);
          const s = top(q);
          ctx.fillStyle = i === 6 ? c.amarillo : dentro ? c.ok : c.error;
          ctx.beginPath(); ctx.arc(s[0], s[1], i === 6 ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
        });
        // la cámara
        const o = top(ojo);
        ctx.fillStyle = c.texto; ctx.beginPath(); ctx.arc(o[0], o[1], 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.tenue; ctx.font = "12px " + c.mono;
        ctx.fillText("vista desde arriba (x →, z ↓)", 10, 18);
        ctx.fillText("ojo", o[0] + 8, o[1] + 4);
        ctx.restore();
        ctx.strokeStyle = c.borde2; ctx.strokeRect(wL + sep + 0.5, 0.5, wR - 1, h - 1);

        // --- el viaje numérico del vértice (1, 1, 1) ---
        const v = [1, 1, 1, 1];
        const vm = mat4.porVector(M, v), vv = mat4.porVector(Vm, vm), vc = mat4.porVector(P, vv);
        const ndc = [vc[0] / vc[3], vc[1] / vc[3], vc[2] / vc[3]];
        const dentro = vc[3] > 0 && ndc.every((x) => Math.abs(x) <= 1);
        const px = [(ndc[0] + 1) / 2 * wL, (ndc[1] + 1) / 2 * h, (ndc[2] + 1) / 2];
        const fila = (nombre, q, n) => nombre.padEnd(22) + q.slice(0, n).map((x) => f(x, 3, 9)).join("");
        info.textContent =
          "vértice (1, 1, 1) del cubo (amarillo)      x        y        z        w\n" +
          fila("objeto", v, 4) + "\n" +
          fila("mundo    M·v", vm, 4) + "\n" +
          fila("vista    V·M·v", vv, 4) + (vv[2] < 0 ? "   ← z < 0: delante de la cámara" : "   ← z > 0: ¡detrás de la cámara!") + "\n" +
          fila("clip     P·V·M·v", vc, 4) + "   ← w = −z de vista" + "\n" +
          fila("NDC      clip ÷ w", ndc, 3) + (dentro ? "            dentro de [−1, 1]³: visible" : "            fuera del cubo NDC: recortado") + "\n" +
          fila("ventana  viewport", px, 3) + "            (píxeles con y hacia arriba; z del z-buffer)";
      },
      alPulsar(e) { if (e.raton.x < e.w * 0.58) arrastre = { x: e.raton.x, y: e.raton.y, yaw: st.yaw, pitch: st.pitch }; },
      alMover(e) {
        if (!arrastre) return;
        st.yaw = arrastre.yaw - (e.raton.x - arrastre.x) * 0.01;
        st.pitch = Math.max(-1.45, Math.min(1.45, arrastre.pitch + (e.raton.y - arrastre.y) * 0.01));   // ±83°: nunca cenital
      },
      alSoltar() { arrastre = null; },
    });
    const ctl = (etq, clave, min, max, paso, fmt) => Curso.control(ctrls, { etiqueta: etq, min, max, paso, valor: st[clave], formato: fmt, alCambiar: (v) => { st[clave] = v; lz.redibujar(); } });
    ctl("fov", "fov", 15, 120, 1, (v) => v.toFixed(0) + "°");
    ctl("near", "cerca", 0.1, 6, 0.05);
    ctl("far", "lejos", 2, 30, 0.5);
    ctl("distancia", "dist", 0.3, 12, 0.05);
    Curso.casilla(ctrls, { etiqueta: "girar el cubo", valor: true, alCambiar: (v) => { st.girar = v; } });
    Curso.casilla(ctrls, { etiqueta: "olvidar el aspecto", valor: false, alCambiar: (v) => { st.sinAspecto = v; } });
    Curso.casilla(ctrls, { etiqueta: "sin recorte (el bicho)", valor: false, alCambiar: (v) => { st.sinRecorte = v; } });
  });
})();
