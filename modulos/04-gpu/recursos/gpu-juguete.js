/* =====================================================================
   gpu-juguete.js — la GPU de juguete del módulo 4, portada a JavaScript.
   Es una traducción línea a línea de python/gpu_juguete/gpu.py: mismas
   etapas, mismos nombres (en camelCase) y mismos resultados.

   Expone window.GPUJuguete y se registra en Curso.libsIframe.gpujuguete
   para usarla en los playgrounds JS con  data-incluir="gpujuguete".

   Uso mínimo:
     const G = GPUJuguete;
     const vbo = new G.Buffer(new Float32Array([...]));
     const vao = new G.VAO();
     vao.configurar(0, new G.Atributo(vbo, { size: 2, tipo: G.FLOAT, stride: 20, offset: 0 }));
     const prog = new G.Programa({
       vertexShader: (a, u) => [[a.a_pos[0], a.a_pos[1], 0, 1], { v_color: a.a_color }],
       fragmentShader: (v, u, frag) => [...v.v_color, 1],
       atributos: { a_pos: [0, "vec2"], a_color: [1, "vec3"] },
     });
     const fb = new G.Framebuffer(64, 64);
     G.dibujarArrays(fb, prog, vao, G.TRIANGLES, 0, 3);
     G.mostrar(fb, document.querySelector("canvas"));
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    // ------------------------------------------------------------ constantes (valores de GL)
    const BYTE = 0x1400, UNSIGNED_BYTE = 0x1401, SHORT = 0x1402, UNSIGNED_SHORT = 0x1403,
      INT = 0x1404, UNSIGNED_INT = 0x1405, FLOAT = 0x1406;
    const TRIANGLES = 0x0004, TRIANGLE_STRIP = 0x0005, TRIANGLE_FAN = 0x0006;
    // tipo → [bytes, método de DataView, ¿con signo?]
    const TIPOS = {
      [BYTE]: [1, "getInt8", true], [UNSIGNED_BYTE]: [1, "getUint8", false],
      [SHORT]: [2, "getInt16", true], [UNSIGNED_SHORT]: [2, "getUint16", false],
      [INT]: [4, "getInt32", true], [UNSIGNED_INT]: [4, "getUint32", false],
      [FLOAT]: [4, "getFloat32", null],
    };
    const COMPONENTES = { float: 1, vec2: 2, vec3: 3, vec4: 4, int: 1, ivec2: 2, ivec3: 3, ivec4: 4, uint: 1, uvec2: 2, uvec3: 3, uvec4: 4 };
    const esEntero = (t) => /^(int|ivec|uint|uvec)/.test(t);

    function aBytes(datos) {
      if (datos instanceof ArrayBuffer) return new Uint8Array(datos.slice(0));
      if (ArrayBuffer.isView(datos)) return new Uint8Array(datos.buffer.slice(datos.byteOffset, datos.byteOffset + datos.byteLength));
      return new Uint8Array(datos || []);
    }

    // ------------------------------------------------------------ objetos
    /* Un VBO o un EBO: bytes sin tipo. */
    class Buffer {
      constructor(datos) { this.datos = aBytes(datos); }
      subir(datos) { this.datos = aBytes(datos); }                          // ≈ gl.bufferData
      actualizar(offset, datos) {                                            // ≈ gl.bufferSubData
        const b = aBytes(datos);
        if (offset < 0 || offset + b.length > this.datos.length) throw new RangeError("bufferSubData fuera de rango (en GL: INVALID_VALUE)");
        this.datos.set(b, offset);
      }
      get length() { return this.datos.length; }
    }

    /* Lo que gl.vertexAttribPointer guarda en el VAO para UNA location. */
    class Atributo {
      constructor(buffer, o) {
        o = o || {};
        const size = o.size || 4;
        if (![1, 2, 3, 4].includes(size)) throw new RangeError("size debe ser 1, 2, 3 o 4 (en GL: INVALID_VALUE)");
        this.buffer = buffer; this.size = size; this.tipo = o.tipo || FLOAT;
        this.normalizado = !!o.normalizado; this.entero = !!o.entero; this.divisor = o.divisor || 0;
        this.offset = o.offset || 0;
        this.stride = o.stride || size * TIPOS[this.tipo][0];                // 0 = empaquetado
      }
      /* Vertex fetch de este atributo para el vértice número `indice`. */
      leer(indice) {
        const [nbytes, metodo, conSigno] = TIPOS[this.tipo];
        const inicio = this.offset + indice * this.stride;
        if (inicio + this.size * nbytes > this.buffer.datos.length) throw new RangeError("el vértice " + indice + " se sale del buffer (WebGL: INVALID_OPERATION)");
        const dv = new DataView(this.buffer.datos.buffer);
        const crudos = [];
        for (let k = 0; k < this.size; k++) crudos.push(dv[metodo](inicio + k * nbytes, true)); // true = little-endian
        let valores;
        if (this.entero) valores = crudos;
        else if (this.tipo === FLOAT || !this.normalizado) valores = crudos;
        else if (conSigno) { const m = 2 ** (8 * nbytes - 1) - 1; valores = crudos.map((c) => Math.max(c / m, -1)); }
        else { const m = 2 ** (8 * nbytes) - 1; valores = crudos.map((c) => c / m); }
        return valores.concat([0, 0, 0, 1].slice(this.size));                 // relleno (0, 0, 0, 1)
      }
    }

    class VAO {
      constructor() { this.atributos = {}; this.habilitados = new Set(); this.elementos = null; }
      configurar(loc, atributo) { this.atributos[loc] = atributo; this.habilitados.add(loc); }
    }

    function valorInicial(t) {
      if (t.startsWith("mat")) return new Array(+t[3] * +t[3]).fill(0);
      if (t === "bool") return false;
      const n = COMPONENTES[t];
      return n === 1 ? 0 : new Array(n).fill(0);
    }

    class Programa {
      constructor(o) {
        this.vertexShader = o.vertexShader; this.fragmentShader = o.fragmentShader;
        this.atributos = Object.assign({}, o.atributos || {});
        this.tiposUniform = Object.assign({}, o.uniforms || {});
        this.uniforms = {};
        for (const n in this.tiposUniform) this.uniforms[n] = valorInicial(this.tiposUniform[n]);
        this.flat = new Set(o.flat || []);
      }
    }

    class EstadoFijo {
      constructor() {
        this.viewport = null; this.cullFace = false; this.cullMode = "BACK"; this.frontFace = "CCW";
        this.depthTest = false; this.depthFunc = "LESS"; this.depthMask = true;
        this.blend = false; this.blendFunc = ["ONE", "ZERO"];
        this.provocador = "ULTIMO"; this.correccionPerspectiva = true; this.cacheVertices = 16;
      }
    }

    class Estadisticas {
      constructor() {
        this.invocacionesVS = 0; this.aciertosCache = 0; this.triangulos = 0; this.recortados = 0;
        this.descartadosCulling = 0; this.fragmentos = 0; this.descartadosFS = 0; this.fallanProfundidad = 0; this.escritos = 0;
      }
      toString() { return Object.entries(this).map(([k, v]) => k + "=" + v).join(", "); }
    }

    // ------------------------------------------------------------ framebuffer
    const aByte = (c) => Math.floor(Math.min(Math.max(Math.fround(c), 0), 1) * 255 + 0.5);   // float32 → RGBA8

    class Framebuffer {
      constructor(ancho, alto) {
        this.ancho = ancho; this.alto = alto;
        this.color = new Uint8ClampedArray(ancho * alto * 4);    // fila 0 = la de ABAJO
        this.profundidad = new Float64Array(ancho * alto).fill(1);
      }
      limpiar(color, profundidad) {
        const c = (color || [0, 0, 0, 1]).map(aByte);
        for (let i = 0; i < this.color.length; i += 4) { this.color[i] = c[0]; this.color[i + 1] = c[1]; this.color[i + 2] = c[2]; this.color[i + 3] = c[3]; }
        this.profundidad.fill(profundidad === undefined ? 1 : profundidad);
      }
      leer(x, y) { const i = (y * this.ancho + x) * 4; return Array.from(this.color.subarray(i, i + 4)); }
    }

    // ------------------------------------------------------------ etapas
    function buscarVertice(prog, vao, indice, constantes) {
      const entrada = { gl_VertexID: indice };
      for (const nombre in prog.atributos) {
        const [loc, tipoGLSL] = prog.atributos[nombre];
        let valor;
        if (vao.habilitados.has(loc)) {
          const at = vao.atributos[loc];
          if (at.entero !== esEntero(tipoGLSL)) throw new TypeError("'" + nombre + "': el tipo del atributo no coincide con el del shader (WebGL2: INVALID_OPERATION al dibujar)");
          valor = at.leer(indice);
        } else valor = (constantes && constantes[loc]) || [0, 0, 0, 1];     // atributo deshabilitado
        const n = COMPONENTES[tipoGLSL];
        entrada[nombre] = n === 1 ? valor[0] : valor.slice(0, n);
      }
      return entrada;
    }

    function* ensamblar(modo, v) {
      const n = v.length;
      if (modo === TRIANGLES) { for (let i = 0; i + 2 < n; i += 3) yield [v[i], v[i + 1], v[i + 2], i, i + 2]; }
      else if (modo === TRIANGLE_STRIP) {
        for (let i = 0; i < n - 2; i++) yield i % 2 === 0 ? [v[i], v[i + 1], v[i + 2], i, i + 2] : [v[i + 1], v[i], v[i + 2], i, i + 2];
      } else if (modo === TRIANGLE_FAN) { for (let i = 1; i < n - 1; i++) yield [v[0], v[i], v[i + 1], i, i + 1]; }
      else throw new Error("modo no soportado por esta GPU de juguete");
    }

    function mezclar(valores, pesos) {
      if (Array.isArray(valores[0])) return valores[0].map((_, k) => valores.reduce((s, v, i) => s + pesos[i] * v[k], 0));
      return valores.reduce((s, v, i) => s + pesos[i] * v, 0);
    }

    function lerpVertice(a, b, t) {
      const pos = a[0].map((pa, k) => pa + t * (b[0][k] - pa));
      const vars = {};
      for (const k in a[1]) vars[k] = mezclar([a[1][k], b[1][k]], [1 - t, t]);
      return [pos, vars];
    }

    /* Sutherland–Hodgman contra z >= -w (cercano) y z <= w (lejano). */
    function recortar(poligono) {
      for (const dist of [(p) => p[2] + p[3], (p) => p[3] - p[2]]) {
        const salida = [];
        for (let i = 0; i < poligono.length; i++) {
          const actual = poligono[i], previo = poligono[(i - 1 + poligono.length) % poligono.length];
          const da = dist(actual[0]), dp = dist(previo[0]);
          if (da >= 0) { if (dp < 0) salida.push(lerpVertice(previo, actual, dp / (dp - da))); salida.push(actual); }
          else if (dp >= 0) salida.push(lerpVertice(previo, actual, dp / (dp - da)));
        }
        poligono = salida;
        if (poligono.length < 3) return [];
      }
      return poligono;
    }

    const arista = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    function cuentaEmpate(a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; return dy < 0 || (dy === 0 && dx > 0); }
    const dentroDe = (w, empate) => w > 0 || (w === 0 && empate);
    const esFrontal = (area2, frontFace) => (area2 > 0) === ((frontFace || "CCW") === "CCW");
    function descartarPorCara(frontal, estado) {
      if (!estado.cullFace) return false;
      if (estado.cullMode === "FRONT_AND_BACK") return true;
      return estado.cullMode === "BACK" ? !frontal : frontal;
    }

    function aVentana(vertice, viewport) {
      const [x, y, z, w] = vertice[0];
      const xn = x / w, yn = y / w, zn = z / w;
      const [vx, vy, vw, vh] = viewport;
      return [vx + (xn + 1) * vw / 2, vy + (yn + 1) * vh / 2, (zn + 1) / 2, 1 / w];
    }

    function factor(nombre, src, dst) {
      const sa = src[3], da = dst[3];
      switch (nombre) {
        case "ZERO": return [0, 0, 0, 0]; case "ONE": return [1, 1, 1, 1];
        case "SRC_ALPHA": return [sa, sa, sa, sa]; case "ONE_MINUS_SRC_ALPHA": return [1 - sa, 1 - sa, 1 - sa, 1 - sa];
        case "DST_ALPHA": return [da, da, da, da]; case "ONE_MINUS_DST_ALPHA": return [1 - da, 1 - da, 1 - da, 1 - da];
        case "SRC_COLOR": return src; case "ONE_MINUS_SRC_COLOR": return src.map((c) => 1 - c);
        case "DST_COLOR": return dst; case "ONE_MINUS_DST_COLOR": return dst.map((c) => 1 - c);
      }
      throw new Error("factor de blending desconocido: " + nombre);
    }
    function mezclarColor(src, dst, bf) { const fs = factor(bf[0], src, dst), fd = factor(bf[1], src, dst); return src.map((s, k) => s * fs[k] + dst[k] * fd[k]); }
    const PRUEBAS = { NEVER: () => false, LESS: (z, b) => z < b, EQUAL: (z, b) => z === b, LEQUAL: (z, b) => z <= b, GREATER: (z, b) => z > b, NOTEQUAL: (z, b) => z !== b, GEQUAL: (z, b) => z >= b, ALWAYS: () => true };

    function procesarTriangulo(fb, prog, tri, flatDe, estado, est, trazar) {
      let poligono = tri;
      if (tri.some((v) => v[0][2] < -v[0][3] || v[0][2] > v[0][3])) { est.recortados++; poligono = recortar(tri.slice()); }
      for (let i = 1; i < poligono.length - 1; i++) rasterizar(fb, prog, [poligono[0], poligono[i], poligono[i + 1]], flatDe, estado, est, trazar);
    }

    function rasterizar(fb, prog, tri, flatDe, estado, est, trazar) {
      const viewport = estado.viewport || [0, 0, fb.ancho, fb.alto];
      let A = GPU.aVentana(tri[0], viewport), B = GPU.aVentana(tri[1], viewport), C = GPU.aVentana(tri[2], viewport);
      let VA = tri[0][1], VB = tri[1][1], VC = tri[2][1];
      let area2 = arista(A, B, C);
      if (area2 === 0) return;
      const frontal = esFrontal(area2, estado.frontFace);
      if (GPU.descartarPorCara(frontal, estado)) { est.descartadosCulling++; return; }
      if (area2 < 0) { [B, C] = [C, B]; [VB, VC] = [VC, VB]; area2 = -area2; }
      const empates = [cuentaEmpate(B, C), cuentaEmpate(C, A), cuentaEmpate(A, B)];
      const x0 = Math.max(Math.floor(Math.min(A[0], B[0], C[0])), viewport[0], 0);
      const x1 = Math.min(Math.ceil(Math.max(A[0], B[0], C[0])), viewport[0] + viewport[2], fb.ancho) - 1;
      const y0 = Math.max(Math.floor(Math.min(A[1], B[1], C[1])), viewport[1], 0);
      const y1 = Math.min(Math.ceil(Math.max(A[1], B[1], C[1])), viewport[1] + viewport[3], fb.alto) - 1;
      if (trazar) trazar("triangulo", { ventana: [A, B, C], area2, frontal, caja: [x0, y0, x1, y1] });
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const p = [x + 0.5, y + 0.5];
        const w0 = arista(B, C, p), w1 = arista(C, A, p), w2 = arista(A, B, p);
        const dentro = dentroDe(w0, empates[0]) && dentroDe(w1, empates[1]) && dentroDe(w2, empates[2]);
        if (trazar) trazar("candidato", { x, y, w: [w0, w1, w2], dentro });
        if (!dentro) continue;
        est.fragmentos++;
        const l0 = w0 / area2, l1 = w1 / area2, l2 = w2 / area2;
        const z = l0 * A[2] + l1 * B[2] + l2 * C[2];
        const q = l0 * A[3] + l1 * B[3] + l2 * C[3];
        const pesos = estado.correccionPerspectiva ? [l0 * A[3] / q, l1 * B[3] / q, l2 * C[3] / q] : [l0, l1, l2];
        const varyings = {};
        for (const n in VA) varyings[n] = prog.flat.has(n) ? flatDe[n] : mezclar([VA[n], VB[n], VC[n]], pesos);
        const frag = { x, y, coord: [p[0], p[1], z, q], frontal };
        const color = prog.fragmentShader(varyings, prog.uniforms, frag);
        const info = trazar ? { x, y, lambda: [l0, l1, l2], pesos, z, varyings, color } : null;
        if (color == null) { est.descartadosFS++; if (trazar) trazar("fragmento", Object.assign(info, { resultado: "discard" })); continue; }
        escribirFragmento(fb, x, y, z, color, estado, est, info, trazar);
      }
    }

    function escribirFragmento(fb, x, y, z, color, estado, est, info, trazar) {
      const i = y * fb.ancho + x;
      z = Math.min(Math.max(z, 0), 1);
      if (estado.depthTest) {
        if (!PRUEBAS[estado.depthFunc](z, fb.profundidad[i])) {
          est.fallanProfundidad++;
          if (trazar) trazar("fragmento", Object.assign(info, { resultado: "falla profundidad" }));
          return;
        }
        if (estado.depthMask) fb.profundidad[i] = z;
      }
      let c = color.slice(0, 4); while (c.length < 4) c.push(1);
      if (estado.blend) c = mezclarColor(c, Array.from(fb.color.subarray(i * 4, i * 4 + 4), (b) => b / 255), estado.blendFunc);
      for (let k = 0; k < 4; k++) fb.color[i * 4 + k] = aByte(c[k]);
      est.escritos++;
      if (trazar) trazar("fragmento", Object.assign(info, { resultado: "escrito" }));
    }

    function dibujar(fb, prog, vao, modo, indices, estado, constantes, trazar, indexado) {
      estado = estado || new EstadoFijo();
      const est = new Estadisticas();
      const cache = new Map(), salida = [];
      for (const idx of indices) {
        if (indexado && cache.has(idx)) { est.aciertosCache++; salida.push(cache.get(idx)); continue; }
        const entrada = buscarVertice(prog, vao, idx, constantes);
        const [pos, varyings] = prog.vertexShader(entrada, prog.uniforms);
        est.invocacionesVS++;
        const v = [pos.map(Number), Object.assign({}, varyings)];
        if (trazar) trazar("vertice", { indice: idx, entrada, gl_Position: v[0], varyings: v[1] });
        if (indexado) { cache.set(idx, v); if (cache.size > estado.cacheVertices) cache.delete(cache.keys().next().value); }
        salida.push(v);
      }
      for (const [a, b, c, iPrimero, iUltimo] of ensamblar(modo, salida)) {
        est.triangulos++;
        const prov = salida[estado.provocador === "ULTIMO" ? iUltimo : iPrimero];
        const flatDe = {};
        prog.flat.forEach((k) => { if (k in prov[1]) flatDe[k] = prov[1][k]; });
        procesarTriangulo(fb, prog, [a, b, c], flatDe, estado, est, trazar);
      }
      return est;
    }

    function dibujarArrays(fb, prog, vao, modo, primero, cuenta, estado, constantes, trazar) {
      const idx = []; for (let i = primero; i < primero + cuenta; i++) idx.push(i);
      return dibujar(fb, prog, vao, modo, idx, estado, constantes, trazar, false);
    }
    function dibujarElementos(fb, prog, vao, modo, cuenta, tipo, offset, estado, constantes, trazar) {
      if (!vao.elementos) throw new Error("el VAO no tiene buffer de índices (en GL: INVALID_OPERATION)");
      const [nbytes, metodo] = TIPOS[tipo];
      if (offset % nbytes) throw new Error("offset no múltiplo del tamaño del índice (WebGL: INVALID_OPERATION)");
      const dv = new DataView(vao.elementos.datos.buffer), idx = [];
      for (let k = 0; k < cuenta; k++) idx.push(dv[metodo](offset + k * nbytes, true));
      return dibujar(fb, prog, vao, modo, idx, estado, constantes, trazar, true);
    }

    /* Pinta el framebuffer en un canvas 2D (volteando las filas: en GL la fila 0 es la de abajo). */
    function mostrar(fb, canvas) {
      canvas.width = fb.ancho; canvas.height = fb.alto;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(fb.ancho, fb.alto), fila = fb.ancho * 4;
      for (let y = 0; y < fb.alto; y++) img.data.set(fb.color.subarray(y * fila, (y + 1) * fila), (fb.alto - 1 - y) * fila);
      ctx.putImageData(img, 0, 0);
    }

    const GPU = {
      BYTE, UNSIGNED_BYTE, SHORT, UNSIGNED_SHORT, INT, UNSIGNED_INT, FLOAT, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN,
      TIPOS, Buffer, Atributo, VAO, Programa, EstadoFijo, Estadisticas, Framebuffer,
      aByte, buscarVertice, ensamblar, mezclar, recortar, arista, cuentaEmpate, esFrontal, descartarPorCara,
      aVentana, mezclarColor, rasterizar, dibujarArrays, dibujarElementos, mostrar,
    };
    return GPU;
  }
  window.GPUJuguete = factory();
  window.Curso = window.Curso || {};
  (window.Curso.libsIframe = window.Curso.libsIframe || {}).gpujuguete = "window.GPUJuguete = (" + factory.toString() + ")();";
})();
