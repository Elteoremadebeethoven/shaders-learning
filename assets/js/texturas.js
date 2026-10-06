/* =====================================================================
   texturas.js — texturas generadas por código (Canvas 2D)
   ¿Por qué no usar imágenes .jpg? Porque al abrir el curso con file://
   Chrome trata cada archivo como un origen distinto y WebGL se niega a
   subir imágenes "de otro origen" (texImage2D lanza SecurityError).
   Un canvas dibujado por nuestro propio código siempre es del mismo
   origen, así que funciona en file:// y en http.

   Uso:  const canvas = Texturas.crear("paisaje", 512);
   Nombres: damero, uv, paisaje, ruido, letraF, ladrillos, degradado, texto
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    function lienzo(w, h) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h || w;
      return [c, c.getContext("2d")];
    }
    /* generador pseudoaleatorio determinista (mulberry32) */
    function azar(semilla) {
      let a = semilla >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const gen = {
      /* Damero 8x8 con índices: sirve para ver filtrado, wrap y orientación. */
      damero(n) {
        const [c, g] = lienzo(n); const k = 8, s = n / k;
        for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
          g.fillStyle = (x + y) % 2 ? "#e9e9f0" : "#23232e";
          g.fillRect(x * s, y * s, s, s);
        }
        g.fillStyle = "#ff4d6d"; g.font = "bold " + Math.round(s * 0.34) + "px sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle";
        for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
          g.fillStyle = (x + y) % 2 ? "#5b46e8" : "#3fd0e8";
          g.fillText(x + "," + y, (x + 0.5) * s, (y + 0.5) * s);
        }
        return c;
      },
      /* Coordenadas UV codificadas en color: R = u (izq→der), G = v.
         Con la etiqueta ARRIBA para detectar texturas volteadas. */
      uv(n) {
        const [c, g] = lienzo(n);
        const img = g.createImageData(n, n);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const i = (y * n + x) * 4;
          img.data[i] = Math.round((x + 0.5) / n * 255);
          img.data[i + 1] = Math.round((1 - (y + 0.5) / n) * 255); // v crece hacia arriba
          img.data[i + 2] = 40; img.data[i + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = Math.max(1, n / 256);
        for (let i = 1; i < 8; i++) { const p = i * n / 8; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, n); g.moveTo(0, p); g.lineTo(n, p); g.stroke(); }
        g.fillStyle = "#fff"; g.font = "bold " + Math.round(n / 11) + "px sans-serif"; g.textAlign = "center";
        g.textBaseline = "top"; g.fillText("ARRIBA", n / 2, n * 0.04);
        g.textBaseline = "bottom"; g.fillText("abajo", n / 2, n * 0.96);
        g.font = Math.round(n / 18) + "px monospace"; g.textAlign = "left"; g.fillText("(0,0)", n * 0.02, n * 0.96);
        g.textAlign = "right"; g.textBaseline = "top"; g.fillText("(1,1)", n * 0.98, n * 0.16);
        return c;
      },
      /* Un "paisaje" con cielo, sol, montañas y agua: una imagen reconocible
         para efectos de post-proceso. */
      paisaje(n) {
        const [c, g] = lienzo(n); const r = azar(7);
        let gr = g.createLinearGradient(0, 0, 0, n * 0.62);
        gr.addColorStop(0, "#1b1f5e"); gr.addColorStop(0.55, "#b8467a"); gr.addColorStop(1, "#ffb36b");
        g.fillStyle = gr; g.fillRect(0, 0, n, n);
        for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(255,255,255," + (0.3 + r() * 0.7) + ")"; g.fillRect(r() * n, r() * n * 0.35, n / 400 + r() * n / 300, n / 400 + r() * n / 300); }
        g.fillStyle = "#ffe7a8"; g.beginPath(); g.arc(n * 0.68, n * 0.5, n * 0.11, 0, 7); g.fill();
        g.fillStyle = "rgba(255,231,168,0.25)"; g.beginPath(); g.arc(n * 0.68, n * 0.5, n * 0.16, 0, 7); g.fill();
        const capa = (base, amp, color, semilla) => {
          const q = azar(semilla); g.fillStyle = color; g.beginPath(); g.moveTo(0, n);
          for (let x = 0; x <= n; x += n / 64) {
            const y = base + Math.sin(x / n * 6 + semilla) * amp * 0.5 + (q() - 0.5) * amp * 0.5 + Math.sin(x / n * 17 + semilla * 3) * amp * 0.2;
            g.lineTo(x, y);
          }
          g.lineTo(n, n); g.closePath(); g.fill();
        };
        capa(n * 0.52, n * 0.12, "#5a2d6e", 1); capa(n * 0.58, n * 0.09, "#3a1f52", 4); capa(n * 0.63, n * 0.05, "#221538", 9);
        gr = g.createLinearGradient(0, n * 0.64, 0, n);
        gr.addColorStop(0, "#3a3a8c"); gr.addColorStop(1, "#0d0f2b");
        g.fillStyle = gr; g.fillRect(0, n * 0.64, n, n * 0.36);
        for (let i = 0; i < 26; i++) { g.fillStyle = "rgba(255,210,150," + (0.5 - i / 60) + ")"; const w = n * (0.14 - i * 0.004) * (0.6 + r() * 0.8); g.fillRect(n * 0.68 - w / 2, n * 0.66 + i * n * 0.012, w, n * 0.004); }
        g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "bold " + Math.round(n / 14) + "px sans-serif"; g.textAlign = "left"; g.textBaseline = "top";
        g.fillText("GLSL", n * 0.05, n * 0.05);
        return c;
      },
      /* Ruido blanco en escala de grises (cada píxel independiente). */
      ruido(n) {
        const [c, g] = lienzo(n); const r = azar(42); const img = g.createImageData(n, n);
        for (let i = 0; i < n * n; i++) { const v = (r() * 256) | 0; img.data[i * 4] = v; img.data[i * 4 + 1] = (r() * 256) | 0; img.data[i * 4 + 2] = (r() * 256) | 0; img.data[i * 4 + 3] = 255; }
        g.putImageData(img, 0, 0); return c;
      },
      /* La letra F: asimétrica en ambos ejes, perfecta para detectar volteos. */
      letraF(n) {
        const [c, g] = lienzo(n);
        g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, n, n);
        g.fillStyle = "#e0453a"; const u = n / 8;
        g.fillRect(2 * u, 1 * u, 1.3 * u, 6 * u); g.fillRect(2 * u, 1 * u, 4 * u, 1.2 * u); g.fillRect(2 * u, 3.4 * u, 3 * u, 1.1 * u);
        g.strokeStyle = "#2b2b3a"; g.lineWidth = n / 64; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, n - g.lineWidth, n - g.lineWidth);
        return c;
      },
      ladrillos(n) {
        const [c, g] = lienzo(n); const r = azar(3);
        g.fillStyle = "#d8d2c8"; g.fillRect(0, 0, n, n);
        const fh = n / 8, fw = n / 4;
        for (let f = 0; f < 8; f++) for (let k = -1; k < 5; k++) {
          const x = k * fw + (f % 2 ? fw / 2 : 0), m = n / 128;
          const t = 150 + r() * 50; g.fillStyle = "rgb(" + (t + 20 | 0) + "," + (t * 0.45 | 0) + "," + (t * 0.35 | 0) + ")";
          g.fillRect(x + m, f * fh + m, fw - 2 * m, fh - 2 * m);
        }
        return c;
      },
      degradado(n) {
        const [c, g] = lienzo(n); const gr = g.createLinearGradient(0, 0, n, 0);
        gr.addColorStop(0, "#000"); gr.addColorStop(1, "#fff"); g.fillStyle = gr; g.fillRect(0, 0, n, n);
        return c;
      },
      texto(n) {
        const [c, g] = lienzo(n);
        g.fillStyle = "#0e1014"; g.fillRect(0, 0, n, n);
        g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
        g.font = "bold " + Math.round(n / 5) + "px sans-serif"; g.fillText("Shader", n / 2, n * 0.42);
        g.font = Math.round(n / 12) + "px monospace"; g.fillStyle = "#8b7bff"; g.fillText("gl_FragCoord", n / 2, n * 0.64);
        return c;
      },
    };
    const cache = {};
    return {
      nombres: Object.keys(gen),
      crear(nombre, tam) {
        tam = tam || 512;
        const k = nombre + "@" + tam;
        if (!gen[nombre]) throw new Error('Textura desconocida: "' + nombre + '". Opciones: ' + Object.keys(gen).join(", "));
        return cache[k] || (cache[k] = gen[nombre](tam));
      },
    };
  }
  window.Texturas = factory();
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).texturas = "window.Texturas = (" + factory.toString() + ")();";
})();
