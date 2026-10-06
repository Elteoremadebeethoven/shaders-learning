/* Demos de la lección 3.7 · Precisión numérica */
(function () {
  "use strict";
  const f = M3.f;

  // Vistas de 4 bytes: el mismo float32 como número y como patrón de bits (lección 1.6)
  const BUF = new ArrayBuffer(4), F32 = new Float32Array(BUF), U32 = new Uint32Array(BUF);
  const bitsDe = (x) => { F32[0] = x; return U32[0] >>> 0; };
  const floatDe = (u) => { U32[0] = u >>> 0; return F32[0]; };
  /* Siguiente y anterior float32 (hacia +∞ y hacia −∞) */
  function siguiente(u) {
    if (u === 0x80000000) return 1;                    // −0 → el menor subnormal positivo
    return (u >>> 31) ? (u - 1) >>> 0 : (u + 1) >>> 0;  // negativos: hacia 0
  }
  function anterior(u) {
    if (u === 0) return 0x80000001;                    // +0 → el menor subnormal negativo
    return (u >>> 31) ? (u + 1) >>> 0 : (u - 1) >>> 0;
  }
  const ulp = (x) => { const a = Math.abs(Math.fround(x)); return floatDe(bitsDe(a) + 1) - a; };
  /* Miles separados por un espacio duro y decimales con punto, como en el texto de la lección
     (toLocaleString("es-ES") daría «1.000.000,5», que se confunde con «0.0625» de la misma pantalla). */
  const conMiles = (x) => {
    const [ent, dec] = String(Number(x.toFixed(6))).split(".");
    const g = ent.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
    return dec ? g + "." + dec : g;
  };
  M3.f32 = { bitsDe, floatDe, siguiente, anterior, ulp };

  /* ---------------------------------------------------------------
     Editor de bits de un float32
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-bits");
    if (!raiz) return;
    const cont = raiz.querySelector(".m3-bits");
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let u = bitsDe(0.1), escrito = "0.1";
    const botones = [];
    for (let i = 31; i >= 0; i--) {
      const b = document.createElement("button");
      b.type = "button"; b.className = i === 31 ? "s" : i >= 23 ? "e" : "m";
      b.title = "bit " + i + (i === 31 ? " (signo)" : i >= 23 ? " (exponente)" : " (mantisa)");
      b.addEventListener("click", () => { u = (u ^ (1 << i)) >>> 0; escrito = null; pintar(); });
      cont.appendChild(b); botones.push([i, b]);
    }
    const lab = document.createElement("label");
    lab.style.cssText = "display:inline-flex;gap:8px;align-items:center;font-size:13.5px;color:var(--text-2)";
    const entrada = document.createElement("input");
    entrada.className = "m3-entrada"; entrada.value = "0.1"; entrada.setAttribute("aria-label", "Número a convertir");
    lab.append("Número:", entrada);
    ctrls.appendChild(lab);
    const leer = () => { const v = Number(entrada.value.replace(",", ".")); if (!Number.isNaN(v) || /nan/i.test(entrada.value)) { escrito = entrada.value; u = bitsDe(v); pintar(); } };
    entrada.addEventListener("change", leer);
    entrada.addEventListener("keydown", (e) => { if (e.key === "Enter") leer(); });
    Curso.boton(ctrls, "− 1 ULP", () => { u = anterior(u); escrito = null; pintar(); });
    Curso.boton(ctrls, "+ 1 ULP", () => { u = siguiente(u); escrito = null; pintar(); });
    const ejemplos = [["0.1", "0.1"], ["1", "1"], ["-2", "−2"], ["0.3333333333", "1/3"], ["16777216", "2²⁴"], ["16777217", "2²⁴ + 1"], ["65504", "65504"],
      ["3.4028234663852886e38", "máximo"], ["1.1754943508222875e-38", "mínimo normal"], ["1.401298464324817e-45", "mínimo subnormal"], ["Infinity", "∞"], ["NaN", "NaN"], ["-0", "−0"]];
    Curso.selector(ctrls, { etiqueta: "Ejemplos:", valor: "0.1", opciones: ejemplos, alCambiar: (v) => { entrada.value = v; escrito = v; u = bitsDe(Number(v)); pintar(); } });

    function pintar() {
      const v = floatDe(u);
      botones.forEach(([i, b]) => { const bit = (u >>> i) & 1; b.textContent = bit; b.classList.toggle("uno", bit === 1); });
      const s = u >>> 31, e = (u >>> 23) & 255, m = u & 0x7fffff;
      const bin = u.toString(2).padStart(32, "0");
      let cat, formula;
      if (e === 255) { cat = m ? "NaN (exponente todo unos, mantisa distinta de 0)" : (s ? "−infinito" : "+infinito") + " (exponente todo unos, mantisa 0)"; formula = ""; }
      else if (e === 0) {
        cat = m ? "subnormal (exponente 0: sin bit implícito)" : (s ? "−0" : "+0") + " (cero con signo)";
        formula = m ? "valor = (−1)^" + s + " × (" + m + " / 2²³) × 2^−126 = " + v : "";
      } else {
        cat = "normal";
        formula = "valor = (−1)^" + s + " × (1 + " + m + " / 2²³) × 2^(" + e + " − 127) = " + (1 + m / 8388608).toPrecision(10) + " × 2^" + (e - 127) + " = " + v.toPrecision(12);
      }
      const finito = e !== 255;
      info.textContent =
        "valor guardado: " + (Object.is(v, -0) ? "-0" : String(v)) + (escrito !== null && finito && String(v) !== escrito && Number(escrito) !== v ? "      (escribiste " + escrito + ": no es representable, se redondea)" : "") + "\n" +
        "hex: 0x" + u.toString(16).toUpperCase().padStart(8, "0") + "      bits: " + bin[0] + " " + bin.slice(1, 9) + " " + bin.slice(9) + "\n" +
        "signo s = " + s + "      exponente e = " + e + (e > 0 && e < 255 ? " (real: " + (e - 127) + ")" : "") + "      mantisa m = 0x" + m.toString(16).toUpperCase() + " = " + m + "\n" +
        (formula ? formula + "\n" : "") +
        "categoría: " + cat + (finito ? "      ULP aquí (distancia al siguiente float): " + ulp(v).toExponential(3) : "");
    }
    pintar();
  });

  /* ---------------------------------------------------------------
     La recta de los floats: marcas representables en una ventana fija
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-recta");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let expo = 6, ancho = 1;
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        const centro = Math.pow(10, expo);
        const izq = centro - ancho / 2, der = centro + ancho / 2;
        const X = (x) => 20 + (x - izq) / ancho * (w - 40);
        const y0 = h * 0.5;
        ctx.strokeStyle = c.eje; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, y0); ctx.lineTo(w - 10, y0); ctx.stroke();
        // marcas: floats representables en [izq, der]
        let q = Math.fround(izq); if (q < izq) q = floatDe(siguiente(bitsDe(q)));
        const marcas = [];
        while (q <= der && marcas.length <= 400) { marcas.push(q); q = floatDe(siguiente(bitsDe(q))); }
        const u = ulp(centro);
        ctx.fillStyle = c.acento; ctx.strokeStyle = c.acento;
        if (marcas.length > 400) {
          ctx.globalAlpha = 0.5; ctx.fillRect(20, y0 - 14, w - 40, 28); ctx.globalAlpha = 1;
          ctx.fillStyle = c.texto; ctx.font = "13px " + c.mono; ctx.textAlign = "center";
          ctx.fillText("≈ " + conMiles(Math.round(ancho / u)) + " floats: demasiado juntos para dibujarlos uno a uno", w / 2, y0 - 22);
        } else {
          ctx.lineWidth = 2; ctx.beginPath();
          marcas.forEach((m) => { const x = Math.round(X(m)) + 0.5; ctx.moveTo(x, y0 - 14); ctx.lineTo(x, y0 + 14); });
          ctx.stroke();
        }
        // etiquetas de los extremos
        ctx.fillStyle = c.tenue; ctx.font = "11px " + c.mono;
        ctx.textAlign = "left"; ctx.fillText(conMiles(izq), 20, h - 12);
        ctx.textAlign = "right"; ctx.fillText(conMiles(der), w - 20, h - 12);
        // el ratón: un valor cualquiera y su redondeo a float32
        const mx = e.raton.dentro ? e.raton.x : w * 0.62;
        const xv = izq + (mx - 20) / (w - 40) * ancho;
        const xf = Math.fround(xv);
        ctx.strokeStyle = c.acento2; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(mx, 12); ctx.lineTo(mx, h - 28); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.amarillo; ctx.beginPath(); ctx.arc(X(xf), y0, 6, 0, Math.PI * 2); ctx.fill();
        info.textContent =
          "centro = " + conMiles(centro) + "      ULP (separación entre floats) = " + (u >= 0.001 ? String(u) : u.toExponential(3)) + "      en una ventana de ancho " + ancho + " caben " +
          (marcas.length > 400 ? "≈ " + conMiles(Math.round(ancho / u)) : marcas.length) + " floats\n" +
          "ratón: x = " + xv.toFixed(8) + "  →  float32 más cercano (amarillo) = " + xf.toFixed(8) + "      error = " + Math.abs(xf - xv).toExponential(2) +
          (e.raton.dentro ? "" : "\n(mueve el ratón por la recta)");
      },
    });
    Curso.control(ctrls, { etiqueta: "magnitud", min: 0, max: 7.6, paso: 0.05, valor: expo, formato: (v) => "10^" + v.toFixed(2), alCambiar: (v) => { expo = v; lz.redibujar(); } });
    Curso.selector(ctrls, { etiqueta: "Ancho de la ventana:", valor: "1", opciones: [["4", "4"], ["1", "1"], ["0.01", "0.01"], ["0.0001", "0.0001"], ["0.000001", "0.000001"]], alCambiar: (v) => { ancho = Number(v); lz.redibujar(); } });
  });

  /* ---------------------------------------------------------------
     Temblor lejos del origen: resta en float32 frente a resta en double
     --------------------------------------------------------------- */
  Curso.alListo(() => {
    const raiz = document.getElementById("demo-temblor");
    if (!raiz) return;
    const info = raiz.querySelector(".demo-info");
    const ctrls = raiz.querySelector(".demo-controles");
    let expo = 6;
    const lz = Curso.lienzo2d(raiz.querySelector(".demo-lienzo"), {
      animar: true,
      dibujar(ctx, e) {
        const c = e.colores, w = e.w, h = e.h, t = e.t;
        ctx.fillStyle = c.fondo; ctx.fillRect(0, 0, w, h);
        const X0 = expo <= 0 ? 0 : Math.pow(10, expo);          // desplazamiento del mundo
        const S = 42;                                            // píxeles por unidad
        const pers = [X0 + 2.2 * Math.sin(0.9 * t), 0.7 * Math.sin(1.7 * t)];          // personaje
        const cam = [X0 + 0.6 * 2.2 * Math.sin(0.9 * t - 0.4), 0.3 * Math.sin(1.7 * t - 0.4)];   // cámara que lo sigue con retraso
        const mitad = (w - 12) / 2;
        const paneles = [
          [0, "ingenuo: fround(objeto) − fround(cámara)", (p) => [Math.fround(p[0]) - Math.fround(cam[0]), Math.fround(p[1]) - Math.fround(cam[1])]],
          [mitad + 12, "relativo a la cámara: fround(objeto − cámara)", (p) => [Math.fround(p[0] - cam[0]), Math.fround(p[1] - cam[1])]],
        ];
        paneles.forEach(([x0, titulo, rel]) => {
          ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, mitad, h); ctx.clip();
          ctx.fillStyle = c.superficie; ctx.globalAlpha = 0.3; ctx.fillRect(x0, 0, mitad, h); ctx.globalAlpha = 1;
          const cx = x0 + mitad / 2, cy = h * 0.55;
          const aPantalla = (p) => { const r = rel(p); return [cx + r[0] * S, cy - r[1] * S]; };
          // suelo y árboles fijos en el mundo
          for (let k = -8; k <= 8; k++) {
            const a = aPantalla([X0 + k, -1.2]);
            ctx.fillStyle = c.verde;
            ctx.beginPath(); ctx.moveTo(a[0], a[1] - 34); ctx.lineTo(a[0] - 10, a[1]); ctx.lineTo(a[0] + 10, a[1]); ctx.closePath(); ctx.fill();
            ctx.fillStyle = c.borde2; ctx.fillRect(a[0] - 18, a[1], 36, 2);
          }
          const pp = aPantalla(pers);
          ctx.fillStyle = c.acento; ctx.beginPath(); ctx.arc(pp[0], pp[1], 11, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = c.tenue; ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
          ctx.restore();
          ctx.fillStyle = c.tenue; ctx.font = "12px " + c.mono; ctx.fillText(titulo, x0 + 8, 18);
          ctx.strokeStyle = c.borde2; ctx.strokeRect(x0 + 0.5, 0.5, mitad - 1, h - 1);
        });
        const u = X0 > 0 ? ulp(X0) : ulp(2.2);
        info.textContent =
          "mundo desplazado a x = " + conMiles(X0) + "      ULP de float32 ahí = " + (u >= 0.001 ? u : u.toExponential(2)) + " unidades = " + (u * S).toFixed(u * S < 0.1 ? 4 : 2) + " px a esta escala\n" +
          "izquierda: la GPU recibe posiciones de mundo en float32 y resta la cámara (así tiembla). derecha: JavaScript resta en double y envía la diferencia.";
      },
    });
    Curso.control(ctrls, { etiqueta: "distancia al origen", min: 0, max: 7.3, paso: 0.05, valor: expo, formato: (v) => v <= 0 ? "0" : "10^" + v.toFixed(2), alCambiar: (v) => { expo = v; } });
  });
})();
