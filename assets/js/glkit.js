/* =====================================================================
   glkit.js — la mini-librería WebGL2 que construimos en el módulo 5.
   Nada de magia: cada función es la versión "empaquetada" de lo que en
   las lecciones escribimos llamada por llamada. Léela entera: es corta.

   Expone dos objetos globales:
     GLKit — shaders, programas, buffers, texturas, FBO, bucle, errores
     mat4  — matrices 4x4 column-major (el formato que espera WebGL)
     vec3  — utilidades mínimas de vectores

   En los playgrounds JS se inyecta con  data-incluir="glkit"

   isnan()/isinf(): crearPrograma compila el texto tal cual (sin el comentario único que añaden los
   playgrounds GLSL), así que Chrome puede devolverlo de su caché compilado CON fast math y el
   resultado de las operaciones indefinidas cambia (3.7, 5.10); isnan sigue detectando los NaN.
   Si importa, añade al fuente un comentario distinto en cada ejecución: + '\n// ' + Math.random()
   ===================================================================== */
(function () {
  "use strict";
  function factory() {
    /* ---------- errores legibles ---------- */
    function conNumeros(fuente, lineasMarcadas) {
      return fuente.split("\n").map((l, i) => (lineasMarcadas.has(i + 1) ? ">> " : "   ") + String(i + 1).padStart(3) + " | " + l).join("\n");
    }
    const NOMBRES_ERROR = { 0x0500: "INVALID_ENUM", 0x0501: "INVALID_VALUE", 0x0502: "INVALID_OPERATION", 0x0505: "OUT_OF_MEMORY", 0x0506: "INVALID_FRAMEBUFFER_OPERATION", 0x9242: "CONTEXT_LOST_WEBGL" };

    const GLKit = {
      /* Compila un shader. Si falla, lanza un Error con el log del driver
         y el código numerado, marcando las líneas culpables. */
      crearShader(gl, tipo, fuente) {
        const sh = gl.createShader(tipo);
        gl.shaderSource(sh, fuente);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(sh) || "(log vacío)";
          gl.deleteShader(sh);
          const marcadas = new Set([...log.matchAll(/ERROR:\s*\d+:(\d+)/g)].map((m) => +m[1]));
          const nombre = tipo === gl.VERTEX_SHADER ? "vertex" : "fragment";
          throw new Error("Error compilando el " + nombre + " shader:\n" + log + "\n" + conNumeros(fuente, marcadas));
        }
        return sh;
      },

      /* Compila ambos shaders, los enlaza en un programa y libera los shaders. */
      crearPrograma(gl, fuenteVS, fuenteFS, opciones) {
        const vs = GLKit.crearShader(gl, gl.VERTEX_SHADER, fuenteVS);
        const fs = GLKit.crearShader(gl, gl.FRAGMENT_SHADER, fuenteFS);
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        // Fijar la location de atributos ANTES de enlazar (opcional).
        if (opciones && opciones.atributos) {
          for (const nombre in opciones.atributos) gl.bindAttribLocation(p, opciones.atributos[nombre], nombre);
        }
        if (opciones && opciones.varyingsTF) {
          gl.transformFeedbackVaryings(p, opciones.varyingsTF, opciones.modoTF || gl.SEPARATE_ATTRIBS);
        }
        gl.linkProgram(p);
        // Tras enlazar, el programa ya contiene el código: los shaders sobran.
        gl.detachShader(p, vs); gl.detachShader(p, fs);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          const log = gl.getProgramInfoLog(p);
          gl.deleteProgram(p);
          throw new Error("Error enlazando el programa:\n" + log);
        }
        return p;
      },

      /* Ajusta el búfer de dibujo al tamaño en pantalla × devicePixelRatio.
         Devuelve true si cambió (entonces hay que llamar a gl.viewport).
         OJO: si el canvas aún no tiene layout (clientWidth 0) el búfer queda en 1×1: no crees
         recursos dependientes del tamaño (FBOs, rejillas) antes del primer frame con tamaño real. */
      ajustarTamaño(canvas, dprMax) {
        const dpr = Math.min(window.devicePixelRatio || 1, dprMax || 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
        return false;
      },

      crearBuffer(gl, datos, uso, destino) {
        destino = destino || gl.ARRAY_BUFFER;
        const b = gl.createBuffer();
        gl.bindBuffer(destino, b);
        gl.bufferData(destino, datos, uso || gl.STATIC_DRAW);
        return b;
      },

      /* Conecta un atributo del programa con el ARRAY_BUFFER enlazado AHORA.
         (vertexAttribPointer "fotografía" el buffer que esté enlazado en ese momento.)
         divisor (opcional): 1 = un valor por instancia (instancing, 5.9).
         entero (opcional): true para atributos int/uint en GLSL → vertexAttribIPointer
         (sin conversión a float; `normalizado` se ignora). */
      atributo(gl, programa, nombre, tamaño, tipo, normalizado, stride, offset, divisor, entero) {
        const loc = gl.getAttribLocation(programa, nombre);
        if (loc === -1) { console.warn('[GLKit] El atributo "' + nombre + '" no existe o el compilador lo eliminó por no usarse.'); return -1; }
        gl.enableVertexAttribArray(loc);
        if (entero) gl.vertexAttribIPointer(loc, tamaño, tipo || gl.INT, stride || 0, offset || 0);
        else gl.vertexAttribPointer(loc, tamaño, tipo || gl.FLOAT, !!normalizado, stride || 0, offset || 0);
        if (divisor !== undefined) gl.vertexAttribDivisor(loc, divisor);
        return loc;
      },

      /* Devuelve { nombre: {loc, tipo, tamaño} } con todos los uniforms activos. */
      uniforms(gl, programa) {
        const n = gl.getProgramParameter(programa, gl.ACTIVE_UNIFORMS), res = {};
        for (let i = 0; i < n; i++) {
          const info = gl.getActiveUniform(programa, i);
          const nombre = info.name.replace(/\[0\]$/, "");
          res[nombre] = { loc: gl.getUniformLocation(programa, info.name), tipo: info.type, tamaño: info.size };
        }
        return res;
      },

      /* Asigna un uniform según su tipo real (consultado con getActiveUniform).
         OJO: afecta al programa en uso (gl.useProgram) — los uniforms son estado del programa. */
      ponerUniform(gl, u, v) {
        if (!u || u.loc == null) return;
        const L = u.loc, arr = typeof v === "number" || typeof v === "boolean" ? null : v;
        switch (u.tipo) {
          case gl.FLOAT: arr ? gl.uniform1fv(L, arr) : gl.uniform1f(L, v); break;
          case gl.FLOAT_VEC2: gl.uniform2fv(L, arr); break;
          case gl.FLOAT_VEC3: gl.uniform3fv(L, arr); break;
          case gl.FLOAT_VEC4: gl.uniform4fv(L, arr); break;
          case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_3D: case gl.SAMPLER_CUBE: case gl.SAMPLER_2D_ARRAY:
            arr ? gl.uniform1iv(L, arr) : gl.uniform1i(L, +v); break;
          case gl.UNSIGNED_INT: arr ? gl.uniform1uiv(L, arr) : gl.uniform1ui(L, v); break;
          case gl.INT_VEC2: case gl.BOOL_VEC2: gl.uniform2iv(L, arr); break;
          case gl.INT_VEC3: case gl.BOOL_VEC3: gl.uniform3iv(L, arr); break;
          case gl.INT_VEC4: case gl.BOOL_VEC4: gl.uniform4iv(L, arr); break;
          case gl.FLOAT_MAT2: gl.uniformMatrix2fv(L, false, arr); break;
          case gl.FLOAT_MAT3: gl.uniformMatrix3fv(L, false, arr); break;
          case gl.FLOAT_MAT4: gl.uniformMatrix4fv(L, false, arr); break;
          default: console.warn("[GLKit] tipo de uniform no soportado: 0x" + u.tipo.toString(16));
        }
      },

      /* Crea una textura 2D desde un canvas/imagen/ImageBitmap o desde datos crudos.
         opciones: { filtro: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, mipmaps: false, flipY: true,
                     alineacion: 4, ancho, alto, formatoInterno, formato, tipo }
         OJO: UNPACK_FLIP_Y_WEBGL NO afecta a un ImageBitmap (se ignora): voltéalo al crearlo con
         createImageBitmap(img, { imageOrientation: "flipY" }).
         alineacion = UNPACK_ALIGNMENT (4 por defecto; usa 1 con datos crudos RGB o anchos impares). */
      crearTextura(gl, fuente, o) {
        o = o || {};
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, o.flipY !== false);
        if (o.alineacion) gl.pixelStorei(gl.UNPACK_ALIGNMENT, o.alineacion);
        if (fuente && !ArrayBuffer.isView(fuente)) {
          gl.texImage2D(gl.TEXTURE_2D, 0, o.formatoInterno || gl.RGBA, o.formato || gl.RGBA, o.tipo || gl.UNSIGNED_BYTE, fuente);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, o.formatoInterno || gl.RGBA, o.ancho, o.alto, 0, o.formato || gl.RGBA, o.tipo || gl.UNSIGNED_BYTE, fuente || null);
        }
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        if (o.alineacion) gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4); // dejar el estado global como estaba
        const filtro = o.filtro || gl.LINEAR;
        if (o.mipmaps) {
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro === gl.NEAREST ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
        } else {
          // Sin esto la textura queda "incompleta" (el filtro por defecto pide mipmaps) y se ve NEGRA.
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o.wrap || gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.wrap || gl.CLAMP_TO_EDGE);
        return t;
      },

      /* Framebuffer con una textura de color (y opcionalmente profundidad). */
      crearFBO(gl, ancho, alto, o) {
        o = o || {};
        const tex = GLKit.crearTextura(gl, null, {
          ancho, alto, filtro: o.filtro || gl.LINEAR, wrap: o.wrap || gl.CLAMP_TO_EDGE,
          formatoInterno: o.formatoInterno, formato: o.formato, tipo: o.tipo, flipY: false,
        });
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        let rbo = null;
        if (o.profundidad) {
          rbo = gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, ancho, alto);
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
        }
        const estado = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (estado !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer incompleto: 0x" + estado.toString(16));
        return { fbo, textura: tex, profundidad: rbo, ancho, alto };
      },

      /* Libera todo lo que creó crearFBO (el GC de JS NO libera memoria de GPU a tiempo). */
      borrarFBO(gl, f) {
        if (!f) return;
        gl.deleteFramebuffer(f.fbo);
        gl.deleteTexture(f.textura);
        if (f.profundidad) gl.deleteRenderbuffer(f.profundidad);
      },

      /* VAO con un único triángulo que cubre toda la pantalla (atributo en location 0).
         Un triángulo gigante en vez de dos: sin diagonal, sin fragmentos duplicados. */
      trianguloPantalla(gl) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        GLKit.crearBuffer(gl, new Float32Array([-1, -1, 3, -1, -1, 3]));
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
        return vao;
      },

      /* Bucle de animación: fn(t, dt, frame) con t y dt en SEGUNDOS.
         dt se limita a 0.1 s para que volver de otra pestaña no provoque un salto. */
      bucle(fn) {
        let id = 0, previo = -1, frame = 0, activo = true, t = 0;
        function paso(ms) {
          if (!activo) return;
          const s = ms / 1000;
          const dt = previo < 0 ? 0 : Math.min(0.1, s - previo);
          previo = s; t += dt;
          fn(t, dt, frame++);
          id = requestAnimationFrame(paso);
        }
        id = requestAnimationFrame(paso);
        return {
          parar() { activo = false; cancelAnimationFrame(id); },
          reanudar() { if (!activo) { activo = true; previo = -1; id = requestAnimationFrame(paso); } },
          get t() { return t; },
        };
      },

      /* Consulta gl.getError() hasta vaciarlo, escribe cada error con su nombre (console.warn) y
         devuelve true si hubo alguno. Úsalo solo para depurar: fuerza sincronización. */
      revisarError(gl, etiqueta) {
        let e, hubo = false;
        while ((e = gl.getError()) !== gl.NO_ERROR) {
          hubo = true;
          console.warn("[GL] " + (etiqueta || "") + " → " + (NOMBRES_ERROR[e] || "0x" + e.toString(16)));
        }
        return hubo;
      },
    };

    /* ---------- matrices 4x4 column-major ----------
       El elemento (fila r, columna c) vive en m[c*4 + r].
       Las funciones devuelven matrices NUEVAS (claridad > velocidad). */
    const mat4 = {
      identidad() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
      /* a * b  (primero se aplica b, luego a) */
      multiplicar(a, b) {
        const o = new Float32Array(16);
        for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
          let s = 0;
          for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
          o[c * 4 + r] = s;
        }
        return o;
      },
      /* multiplica varias: mat4.producto(P, V, M) = P * V * M */
      producto(...ms) { return ms.reduce((acc, m) => mat4.multiplicar(acc, m)); },
      traslacion(x, y, z) { const m = mat4.identidad(); m[12] = x; m[13] = y; m[14] = z; return m; },
      escala(x, y, z) { const m = mat4.identidad(); m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z; return m; },
      rotacionX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
      rotacionY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
      rotacionZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
      /* Proyección en perspectiva (igual que gluPerspective). fovY en radianes. */
      perspectiva(fovY, aspecto, cerca, lejos) {
        const f = 1 / Math.tan(fovY / 2), nf = 1 / (cerca - lejos);
        return new Float32Array([f / aspecto, 0, 0, 0, 0, f, 0, 0, 0, 0, (lejos + cerca) * nf, -1, 0, 0, 2 * lejos * cerca * nf, 0]);
      },
      ortografica(izq, der, abajo, arriba, cerca, lejos) {
        const lr = 1 / (izq - der), bt = 1 / (abajo - arriba), nf = 1 / (cerca - lejos);
        return new Float32Array([-2 * lr, 0, 0, 0, 0, -2 * bt, 0, 0, 0, 0, 2 * nf, 0, (izq + der) * lr, (arriba + abajo) * bt, (lejos + cerca) * nf, 1]);
      },
      /* Matriz de vista: cámara en `ojo` mirando a `centro`.
         OJO: si la dirección de la mirada es paralela a `arriba` (mirar recto hacia arriba o
         abajo con arriba = [0,1,0]) el producto cruz es el vector nulo y la matriz degenera
         (filas de ceros): la escena desaparece. Usa otro vector `arriba` en ese caso. */
      mirarA(ojo, centro, arriba) {
        const z = vec3.normalizar(vec3.restar(ojo, centro));
        const x = vec3.normalizar(vec3.cruz(arriba || [0, 1, 0], z));
        const y = vec3.cruz(z, x);
        return new Float32Array([
          x[0], y[0], z[0], 0,
          x[1], y[1], z[1], 0,
          x[2], y[2], z[2], 0,
          -vec3.punto(x, ojo), -vec3.punto(y, ojo), -vec3.punto(z, ojo), 1,
        ]);
      },
      transponer(m) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[r * 4 + c] = m[c * 4 + r]; return o; },
      invertir(m) {
        const a = m, o = new Float32Array(16);
        const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
        const b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
        const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
        const b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) return null;
        det = 1 / det;
        o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det;
        o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
        o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det;
        o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
        o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det;
        o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
        o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det;
        o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
        return o;
      },
      /* Matriz 3x3 para transformar normales: inversa-transpuesta de la parte 3x3. */
      normal(m) {
        const i = mat4.invertir(m); if (!i) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        return new Float32Array([i[0], i[4], i[8], i[1], i[5], i[9], i[2], i[6], i[10]]);
      },
      /* m * [x,y,z,w] */
      porVector(m, v) {
        const o = [0, 0, 0, 0];
        for (let r = 0; r < 4; r++) o[r] = m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * (v[3] === undefined ? 1 : v[3]);
        return o;
      },
      /* Imprime la matriz como se escribe en papel (filas), útil para depurar. */
      texto(m, dec) {
        dec = dec === undefined ? 3 : dec;
        let s = "";
        for (let r = 0; r < 4; r++) s += "| " + [0, 1, 2, 3].map((c) => m[c * 4 + r].toFixed(dec).padStart(dec + 4)).join(" ") + " |\n";
        return s;
      },
    };

    const vec3 = {
      restar: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
      sumar: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
      escalar: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
      punto: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
      cruz: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
      longitud: (a) => Math.hypot(a[0], a[1], a[2]),
      /* Con el vector nulo devuelve (0,0,0) en vez de NaN: cómodo, pero ESCONDE el error
         (en GLSL, normalize(vec3(0)) es indefinido y suele dar NaN). */
      normalizar(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    };

    return { GLKit, mat4, vec3 };
  }
  const r = factory();
  window.GLKit = r.GLKit; window.mat4 = r.mat4; window.vec3 = r.vec3;
  window.Curso = window.Curso || {};
  (Curso.libsIframe = Curso.libsIframe || {}).glkit =
    "(function(){var r=(" + factory.toString() + ")();window.GLKit=r.GLKit;window.mat4=r.mat4;window.vec3=r.vec3;})();";
})();
