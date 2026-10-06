/* =====================================================================
   demo-memoria.js — lección 4.4: los bytes de un VBO, clicables.
   Un quad (4 vértices) con posición (2 × FLOAT) y color (4 × UNSIGNED_BYTE
   normalizado) en tres distribuciones: entrelazada, en dos buffers y por
   bloques. Al elegir un atributo y un vértice se ve qué bytes lee el
   vertex fetch y cómo se calcula su dirección.
   ===================================================================== */
(function () {
  "use strict";
  const POS = [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]];
  const COL = [[255, 64, 32, 255], [32, 200, 64, 255], [40, 90, 255, 255], [255, 220, 40, 255]];

  // Cada distribución: buffers (nombre → bytes) y descriptores (atributo → {buffer, size, tipo, stride, offset})
  function construir(modo) {
    const f32 = (v) => { const b = new Uint8Array(4); new DataView(b.buffer).setFloat32(0, v, true); return [...b]; };
    const posBytes = POS.flatMap((p) => [...f32(p[0]), ...f32(p[1])]);
    const colBytes = COL.flat();
    if (modo === "entrelazado") {
      const bytes = POS.flatMap((p, i) => [...f32(p[0]), ...f32(p[1]), ...COL[i]]);
      return { buffers: { vbo: bytes }, porFila: 12,
        attr: { a_pos: { buffer: "vbo", size: 2, tipo: "FLOAT", nb: 4, norm: false, stride: 12, offset: 0 },
                a_color: { buffer: "vbo", size: 4, tipo: "UNSIGNED_BYTE", nb: 1, norm: true, stride: 12, offset: 8 } } };
    }
    if (modo === "separado") {
      return { buffers: { vboPos: posBytes, vboColor: colBytes }, porFila: 8,
        attr: { a_pos: { buffer: "vboPos", size: 2, tipo: "FLOAT", nb: 4, norm: false, stride: 0, offset: 0 },
                a_color: { buffer: "vboColor", size: 4, tipo: "UNSIGNED_BYTE", nb: 1, norm: true, stride: 0, offset: 0 } } };
    }
    return { buffers: { vbo: posBytes.concat(colBytes) }, porFila: 16,
      attr: { a_pos: { buffer: "vbo", size: 2, tipo: "FLOAT", nb: 4, norm: false, stride: 0, offset: 0 },
              a_color: { buffer: "vbo", size: 4, tipo: "UNSIGNED_BYTE", nb: 1, norm: true, stride: 0, offset: 32 } } };
  }
  const strideReal = (a) => a.stride || a.size * a.nb;

  function demoMemoria(raiz) {
    const cont = raiz.querySelector(".m4-bytes"), ley = raiz.querySelector(".m4-leyenda"), info = raiz.querySelector(".demo-info");
    const COLORES = { a_pos: "var(--accent)", a_color: "var(--c-hack)" };
    const st = { modo: "entrelazado", attr: "a_color", vertice: 2, hover: null };

    function pertenencia(d, nombreBuf, i) {        // ¿a qué atributo/vértice/componente pertenece el byte i?
      for (const [n, a] of Object.entries(d.attr)) {
        if (a.buffer !== nombreBuf) continue;
        for (let v = 0; v < 4; v++) {
          const ini = a.offset + v * strideReal(a), fin = ini + a.size * a.nb;
          if (i >= ini && i < fin) return { attr: n, vertice: v, comp: Math.floor((i - ini) / a.nb) };
        }
      }
      return null;
    }

    function pintar() {
      const d = construir(st.modo);
      let h = "";
      for (const [nb, bytes] of Object.entries(d.buffers)) {
        const porFila = nb === "vboColor" ? 4 : d.porFila;
        h += '<div class="fila"><span class="etq" style="color:var(--text)">' + nb + " (" + bytes.length + " B)</span></div>";
        for (let f = 0; f < bytes.length; f += porFila) {
          h += '<div class="fila"><span class="etq">byte ' + String(f).padStart(2, " ") + "</span>";
          for (let i = f; i < Math.min(f + porFila, bytes.length); i++) {
            const p = pertenencia(d, nb, i);
            const on = p && p.attr === st.attr && p.vertice === st.vertice;
            const tenue = p && p.attr === st.attr;
            const estilo = on ? "background:" + COLORES[p.attr] + ";border-color:" + COLORES[p.attr] :
              tenue ? "border-color:" + COLORES[p.attr] + ";color:var(--text)" : "";
            const sep = (d.porFila === 12 && (i % 12 === 4 || i % 12 === 8)) || (d.porFila === 16 && i % 4 === 0 && i % 16) ? " sep" : "";
            h += '<span class="byte' + (on ? " on" : "") + sep + '" data-b="' + nb + '" data-i="' + i + '" style="' + estilo + '">' + bytes[i].toString(16).padStart(2, "0") + "</span>";
          }
          h += "</div>";
        }
      }
      cont.innerHTML = h;
      // leyenda / botones
      ley.innerHTML = "";
      for (const n of ["a_pos", "a_color"]) {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = n + (n === "a_pos" ? " (location 0)" : " (location 1)");
        b.style.borderColor = COLORES[n];
        if (st.attr === n) { b.classList.add("activo"); b.style.background = COLORES[n]; }
        b.addEventListener("click", () => { st.attr = n; pintar(); });
        ley.appendChild(b);
      }
      for (let v = 0; v < 4; v++) {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = "vértice " + v;
        if (st.vertice === v) { b.classList.add("activo"); b.style.background = "var(--text-2)"; b.style.color = "var(--bg)"; }
        b.addEventListener("click", () => { st.vertice = v; pintar(); });
        ley.appendChild(b);
      }
      // el cálculo del vertex fetch
      const a = d.attr[st.attr], v = st.vertice, sr = strideReal(a);
      const ini = a.offset + v * sr, bytes = d.buffers[a.buffer].slice(ini, ini + a.size * a.nb);
      let valores;
      if (a.tipo === "FLOAT") { const dv = new DataView(new Uint8Array(bytes).buffer); valores = [0, 1].map((k) => dv.getFloat32(k * 4, true)); }
      else valores = bytes;
      const conv = a.norm ? valores.map((x) => (x / 255).toFixed(4)) : valores.map((x) => +x.toFixed(4));
      const loc = st.attr === "a_pos" ? 0 : 1;
      let s = "gl.vertexAttribPointer(" + loc + ", " + a.size + ", gl." + a.tipo + ", " + a.norm + ", " + a.stride + ", " + a.offset + ");   // con " + a.buffer + " enlazado en ARRAY_BUFFER";
      s += "\n" + st.attr + " del vértice " + v + ": empieza en offset + i × stride = " + a.offset + " + " + v + " × " + sr + (a.stride ? "" : " (stride 0 → " + sr + ": empaquetado)") + " = byte " + ini;
      s += "\nlee " + a.size + " × " + a.nb + " bytes = bytes " + ini + "…" + (ini + a.size * a.nb - 1) + ": [" + bytes.map((x) => x.toString(16).padStart(2, "0")).join(" ") + "]";
      s += "\n→ " + (a.tipo === "FLOAT" ? "2 float32 little-endian = (" + valores.map((x) => +x.toFixed(4)).join(", ") + ") → el shader recibe vec2" : "4 bytes (" + valores.join(", ") + ") / 255 = (" + conv.join(", ") + ") → vec4 normalizado");
      if (st.hover) s += "\n\n" + st.hover;
      info.textContent = s;
      cont.querySelectorAll(".byte").forEach((el) => {
        el.addEventListener("click", () => { const p = pertenencia(d, el.dataset.b, +el.dataset.i); if (p) { st.attr = p.attr; st.vertice = p.vertice; } pintar(); });
        el.addEventListener("mouseenter", () => {
          const p = pertenencia(d, el.dataset.b, +el.dataset.i);
          st.hover = "byte " + el.dataset.i + " de " + el.dataset.b + ": " + (p ? p.attr + " del vértice " + p.vertice + ", componente " + "xyzw"[p.comp] + (p.attr === "a_color" ? " (" + "rgba"[p.comp] + ")" : "") : "no lo lee ningún atributo");
          info.textContent = info.textContent.split("\n\n")[0] + "\n\n" + st.hover;
        });
      });
    }
    Curso.selector(raiz.querySelector(".demo-controles"), { etiqueta: "distribución", valor: st.modo,
      opciones: [["entrelazado", "entrelazada (AoS): un buffer, stride 12"], ["separado", "separada (SoA): dos buffers"], ["bloques", "por bloques: un buffer, color en el byte 32"]],
      alCambiar: (v) => { st.modo = v; st.hover = null; pintar(); } });
    pintar();
  }

  Curso.alListo(() => { const a = document.getElementById("demo-memoria"); if (a) demoMemoria(a); });
})();
