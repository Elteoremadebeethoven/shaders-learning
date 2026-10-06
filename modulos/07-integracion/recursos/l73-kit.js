/* =====================================================================
   l73-kit.js — piezas de la lección 7.3 (transiciones animadas con shaders).
   Como m7kit, nada de magia: cada pieza se escribe a mano en la lección y
   aquí solo se recoge para no repetirla en cada ejemplo.

     L73.imagen(nombre, ancho, alto)   «fotos» dibujadas con Canvas 2D:
                                       'noche', 'mar', 'bosque' (valen en file://)
     L73.GLSL.VS        vertex shader del triángulo de pantalla completa,
                        sin atributos (gl_VertexID, como en 7.1)
     L73.GLSL.CUBRIR    vec2 cubrir(vec2 uv, vec2 lienzo, vec2 imagen):
                        object-fit: cover dentro del shader (6.8)
     L73.GLSL.RUIDO     hash12 (Hoskins, MIT), ruidoValor y fbm de 4 octavas (6.6)
     L73.GLSL.COLOR     srgbALineal y linealASrgb (6.4)
     L73.texturas(gl, u, lista)   enlaza cada textura a una unidad y asigna su sampler
     L73.Transicion     progreso interrumpible con easing y duración
                        proporcional a lo que falta            (7.3, «Interrumpir»)
     L73.Linea          línea de tiempo de valores con cabezal (7.3, «Encadenar»)

   En los playgrounds JS se inyecta con  data-incluir="glkit,m7kit,l73"
   (la página de la lección debe cargar este archivo después de m7kit.js).
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    /* ---------- imágenes generadas (mismo origen: sirven como textura en file://) ---------- */
    function azar(semilla) {                       // mulberry32, como texturas.js
      let a = semilla >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function lienzo(w, h) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return [c, c.getContext("2d")];
    }
    const gen = {
      /* Ciudad de noche: cielo, estrellas, luna y edificios con ventanas encendidas. */
      noche(w, h) {
        const [c, g] = lienzo(w, h), r = azar(11);
        let gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, "#050817"); gr.addColorStop(0.55, "#1d1c4a"); gr.addColorStop(0.8, "#51307a"); gr.addColorStop(1, "#1a1030");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 160; i++) { g.fillStyle = "rgba(255,255,255," + (0.25 + r() * 0.75) + ")"; const s = 0.6 + r() * 1.6; g.fillRect(r() * w, r() * h * 0.6, s, s); }
        g.fillStyle = "rgba(230,236,255,0.18)"; g.beginPath(); g.arc(w * 0.2, h * 0.24, h * 0.12, 0, 7); g.fill();
        g.fillStyle = "#eef1ff"; g.beginPath(); g.arc(w * 0.2, h * 0.24, h * 0.075, 0, 7); g.fill();
        const capa = (base, alto, color, ventanas, semilla) => {
          const q = azar(semilla); let x = -10;
          while (x < w) {
            const bw = w * (0.03 + q() * 0.06), bh = h * (alto * (0.4 + q() * 0.6));
            g.fillStyle = color; g.fillRect(x, h * base - bh, bw + 1, bh + h);
            if (ventanas) for (let yy = h * base - bh + 6; yy < h; yy += 9) for (let xx = x + 4; xx < x + bw - 4; xx += 7) {
              if (q() < 0.32) { g.fillStyle = q() < 0.8 ? "rgba(255,210,120,0.9)" : "rgba(150,220,255,0.85)"; g.fillRect(xx, yy, 3, 4); }
            }
            x += bw + w * 0.004;
          }
        };
        capa(0.86, 0.42, "#231b3f", false, 3);
        capa(0.94, 0.5, "#0d0b1c", true, 8);
        gr = g.createLinearGradient(0, h * 0.9, 0, h);
        gr.addColorStop(0, "rgba(255,170,90,0)"); gr.addColorStop(1, "rgba(255,170,90,0.25)");
        g.fillStyle = gr; g.fillRect(0, h * 0.9, w, h * 0.1);
        return c;
      },
      /* Mar al atardecer: sol sobre el horizonte y su reflejo en franjas. */
      mar(w, h) {
        const [c, g] = lienzo(w, h), r = azar(5);
        let gr = g.createLinearGradient(0, 0, 0, h * 0.58);
        gr.addColorStop(0, "#2b3a7a"); gr.addColorStop(0.5, "#e0677a"); gr.addColorStop(1, "#ffc27a");
        g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.58);
        g.fillStyle = "rgba(255,236,190,0.35)"; g.beginPath(); g.arc(w * 0.62, h * 0.5, h * 0.17, 0, 7); g.fill();
        g.fillStyle = "#fff1c9"; g.beginPath(); g.arc(w * 0.62, h * 0.5, h * 0.1, 0, 7); g.fill();
        for (let i = 0; i < 7; i++) {                                   // nubes alargadas
          g.fillStyle = "rgba(255,190,200," + (0.15 + r() * 0.2) + ")";
          const y = h * (0.1 + r() * 0.3), x = r() * w, l = w * (0.15 + r() * 0.25);
          g.beginPath(); g.ellipse(x, y, l / 2, h * 0.018, 0, 0, 7); g.fill();
        }
        gr = g.createLinearGradient(0, h * 0.58, 0, h);
        gr.addColorStop(0, "#c2587a"); gr.addColorStop(0.35, "#4a3a7c"); gr.addColorStop(1, "#141a3c");
        g.fillStyle = gr; g.fillRect(0, h * 0.58, w, h * 0.42);
        for (let i = 0; i < 60; i++) {                                  // reflejo del sol
          const y = h * 0.59 + i * h * 0.0068, a = 0.75 - i / 80;
          const lw = w * (0.05 + i * 0.0035) * (0.5 + r());
          g.fillStyle = "rgba(255,225,170," + Math.max(0, a) + ")"; g.fillRect(w * 0.62 - lw / 2 + (r() - 0.5) * w * 0.02, y, lw, h * 0.004);
        }
        for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(255,255,255," + (0.05 + r() * 0.12) + ")"; g.fillRect(r() * w, h * 0.6 + r() * h * 0.4, w * (0.01 + r() * 0.04), 1.5); }
        return c;
      },
      /* Bosque con niebla: capas de abetos cada vez más oscuras. */
      bosque(w, h) {
        const [c, g] = lienzo(w, h);
        let gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, "#9fd3c7"); gr.addColorStop(0.5, "#e7efd0"); gr.addColorStop(1, "#6f9b82");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,250,215,0.7)"; g.beginPath(); g.arc(w * 0.78, h * 0.28, h * 0.09, 0, 7); g.fill();
        const capa = (base, alto, color, semilla, niebla) => {
          const q = azar(semilla); let x = -20;
          g.fillStyle = color;
          while (x < w + 20) {
            const a = h * alto * (0.6 + q() * 0.6), an = a * 0.32;
            g.beginPath(); g.moveTo(x - an, h * base); g.lineTo(x, h * base - a); g.lineTo(x + an, h * base); g.fill();
            x += an * (0.5 + q() * 0.7);
          }
          g.fillRect(0, h * base - 1, w, h);
          if (niebla) { const n = g.createLinearGradient(0, h * (base - alto), 0, h * base); n.addColorStop(0, "rgba(231,239,208,0)"); n.addColorStop(1, "rgba(231,239,208,0.45)"); g.fillStyle = n; g.fillRect(0, h * (base - alto), w, h * alto); }
        };
        capa(0.62, 0.3, "#7fae98", 2, true);
        capa(0.74, 0.36, "#4f836e", 6, true);
        capa(0.88, 0.44, "#2a5646", 9, false);
        capa(1.02, 0.5, "#10271f", 12, false);
        return c;
      },
    };
    const cache = {};
    function imagen(nombre, ancho, alto) {
      const w = ancho || 1024, h = alto || 512, k = nombre + "@" + w + "x" + h;
      if (!gen[nombre]) throw new Error('L73.imagen: "' + nombre + '" no existe. Opciones: ' + Object.keys(gen).join(", "));
      return cache[k] || (cache[k] = gen[nombre](w, h));
    }

    /* ---------- trozos de GLSL que se interpolan con ${…} (7.1) ---------- */
    const GLSL = {
      VS: "#version 300 es\n" +
        "void main() {\n" +
        "  vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));\n" +
        "  gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);\n" +
        "}",
      CUBRIR:
        "// object-fit: cover (6.8): uv del lienzo -> uv de la imagen, recortando lo que sobra\n" +
        "vec2 cubrir(vec2 uv, vec2 lienzo, vec2 imagen) {\n" +
        "  float k = (lienzo.x / lienzo.y) / (imagen.x / imagen.y);\n" +
        "  vec2 escala = k > 1.0 ? vec2(1.0, 1.0 / k) : vec2(k, 1.0);\n" +
        "  return (uv - 0.5) * escala + 0.5;\n" +
        "}\n",
      RUIDO:
        "// «Hash without Sine», (c) 2014 David Hoskins, licencia MIT (6.6)\n" +
        "float hash12(vec2 p) {\n" +
        "  vec3 p3 = fract(vec3(p.xyx) * 0.1031);\n" +
        "  p3 += dot(p3, p3.yzx + 33.33);\n" +
        "  return fract((p3.x + p3.y) * p3.z);\n" +
        "}\n" +
        "float ruidoValor(vec2 p) {\n" +
        "  vec2 i = floor(p), f = fract(p);\n" +
        "  vec2 u = f * f * (3.0 - 2.0 * f);\n" +
        "  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),\n" +
        "             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);\n" +
        "}\n" +
        "// 4 octavas, dividido por la suma de amplitudes (0.9375): resultado en [0, 1]\n" +
        "float fbm(vec2 p) {\n" +
        "  float s = 0.0, a = 0.5;\n" +
        "  for (int k = 0; k < 4; k++) {\n" +
        "    s += a * ruidoValor(p);\n" +
        "    p = mat2(0.8, 0.6, -0.6, 0.8) * p * 2.0 + vec2(17.3, 5.9);\n" +
        "    a *= 0.5;\n" +
        "  }\n" +
        "  return s / 0.9375;\n" +
        "}\n",
      COLOR:
        "vec3 srgbALineal(vec3 c) {\n" +
        "  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));\n" +
        "}\n" +
        "vec3 linealASrgb(vec3 c) {\n" +
        "  c = max(c, 0.0);\n" +
        "  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));\n" +
        "}\n",
    };

    /* Enlaza cada textura a una unidad (0, 1, 2…) y asigna el sampler (5.5).
       lista = [["u_desde", texA], ["u_hacia", texB]]. Afecta al programa EN USO. */
    function texturas(gl, u, lista) {
      lista.forEach(function (par, i) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, par[1]);
        if (u[par[0]]) gl.uniform1i(u[par[0]].loc, i);
      });
      gl.activeTexture(gl.TEXTURE0);
    }

    /* ---------- Transicion: un tween interrumpible (7.3) ----------
       valor va de 0 a 1 (o al revés). ir(hasta) arranca un tramo NUEVO desde
       el valor actual, con una duración proporcional a lo que falta: a mitad
       de camino, volver cuesta la mitad. */
    class Transicion {
      constructor(opciones) {
        const o = opciones || {};
        this.duracion = o.duracion !== undefined ? o.duracion : 0.8;   // s para recorrer de 0 a 1
        this.easing = o.easing || function (p) { return p; };
        this.valor = o.valor || 0;
        this.desde = this.valor; this.hasta = this.valor;
        this.lin = 1;                // progreso lineal del tramo actual (1 = terminado)
        this.dur = 0;                // duración del tramo actual, en s
      }
      get activa() { return this.lin < 1; }
      ir(hasta) {
        if (hasta === this.hasta && (this.activa || this.valor === hasta)) return;  // mismo destino: no reinicia
        this.desde = this.valor; this.hasta = hasta;
        this.dur = this.duracion * Math.abs(hasta - this.valor);
        this.lin = this.dur > 0 ? 0 : 1;
        if (this.lin === 1) this.valor = hasta;
      }
      actualizar(dt) {
        if (this.lin >= 1) return this.valor;
        this.lin = Math.min(1, this.lin + dt / this.dur);
        this.valor = this.lin >= 1 ? this.hasta : this.desde + (this.hasta - this.desde) * this.easing(this.lin);
        return this.valor;
      }
      fijar(v) { this.valor = this.desde = this.hasta = v; this.lin = 1; }
    }

    /* ---------- Linea: una línea de tiempo con cabezal (7.3) ----------
       a(nombre, { desde, hasta, dur, easing, en }) añade una pista.
         en (como el «position parameter» de GSAP): número (s desde el principio),
             '<' (a la vez que la pista anterior), '+=x' (x s después del final de
             la línea), '-=x' (x s antes del final: solapada). Sin en: al final.
       valor(nombre, t) evalúa SIN estado: sirve para avanzar, retroceder y saltar. */
    class Linea {
      constructor() {
        this.pistas = []; this.duracion = 0;
        this.cabezal = 0;            // s: dónde está la aguja
        this.velocidad = 0;          // 1 reproducir, -1 invertir, 0 quieta
      }
      a(nombre, o) {
        const previa = this.pistas[this.pistas.length - 1];
        const fin = this.duracion;                                   // final de la línea: la pista que acaba más tarde
        let inicio;
        if (typeof o.en === "number") inicio = o.en;
        else if (o.en === "<") inicio = previa ? previa.inicio : 0;
        else if (typeof o.en === "string" && /^[+-]=/.test(o.en)) inicio = fin + (o.en[0] === "+" ? 1 : -1) * parseFloat(o.en.slice(2));
        else inicio = fin;
        const p = {
          nombre: nombre, inicio: Math.max(0, inicio), dur: o.dur !== undefined ? o.dur : 0.5,
          desde: o.desde !== undefined ? o.desde : 0, hasta: o.hasta !== undefined ? o.hasta : 1,
          easing: o.easing || function (x) { return x; },
        };
        this.pistas.push(p);
        this.duracion = Math.max(this.duracion, p.inicio + p.dur);
        return this;                 // para encadenar: linea.a(...).a(...)
      }
      valor(nombre, t) {
        let elegida = null, primera = null;
        for (const p of this.pistas) {
          if (p.nombre !== nombre) continue;
          if (!primera || p.inicio < primera.inicio) primera = p;
          if (p.inicio <= t && (!elegida || p.inicio >= elegida.inicio)) elegida = p;
        }
        if (!primera) return undefined;
        if (!elegida) return primera.desde;                          // aún no ha empezado ninguna
        const q = elegida.dur > 0 ? Math.min(1, Math.max(0, (t - elegida.inicio) / elegida.dur)) : 1;
        return elegida.desde + (elegida.hasta - elegida.desde) * elegida.easing(q);
      }
      valores(t) {
        const r = {};
        for (const p of this.pistas) if (!(p.nombre in r)) r[p.nombre] = this.valor(p.nombre, t === undefined ? this.cabezal : t);
        return r;
      }
      get activa() { return (this.velocidad > 0 && this.cabezal < this.duracion) || (this.velocidad < 0 && this.cabezal > 0); }
      actualizar(dt) {
        this.cabezal = Math.min(this.duracion, Math.max(0, this.cabezal + dt * this.velocidad));
        return this.cabezal;
      }
    }

    return { imagen, GLSL, texturas, Transicion, Linea };
  }
  window.L73 = factory();
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).l73 = "window.L73 = (" + factory.toString() + ")();";
})();
