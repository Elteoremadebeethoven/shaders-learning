/* =====================================================================
   playground-glsl.js — editor de fragment shaders en vivo
   ---------------------------------------------------------------------
   Marcado mínimo:
     <div class="glsl-playground" data-titulo="Mi shader">
       <script type="x-shader/x-fragment">
         #version 300 es
         precision highp float;
         uniform vec2 u_resolution;
         out vec4 fragColor;
         void main() { fragColor = vec4(gl_FragCoord.xy / u_resolution, 0.0, 1.0); }
       </script>
     </div>

   Uniforms que el playground rellena SI los declaras:
     float u_time        segundos desde el inicio (se congela al pausar)
     vec2  u_resolution  tamaño del lienzo en píxeles físicos
     vec2  u_mouse       posición del puntero en píxeles, origen ABAJO-izquierda
                         (mismo espacio que gl_FragCoord). Si lo declaras vec4:
                         .z = 1.0 mientras el botón está pulsado.
     int   u_frame       número de frame
     sampler2D u_tex0..u_tex3  texturas de data-texturas
   Varying disponible:  in vec2 v_uv;  (0..1 en todo el lienzo)

   Atributos opcionales del contenedor:
     data-titulo, data-altura="360", data-apilado (editor encima del lienzo),
     data-editor="oculto" | "no", data-pausado, data-tiempo="1.5",
     data-texturas="paisaje,uv:nearest:clamp:nomip",
     data-uniforms='{"u_freq":{"tipo":"float","min":0,"max":20,"valor":5}}'
        tipos: float | int | bool | color | vec2 | vec3 | vec4
     data-modo="shadertoy"  (mainImage, iTime, iTimeDelta, iFrame, iFrameRate, iResolution, iMouse,
                            iChannel0..3 = texturas de data-texturas, iChannelResolution[4],
                            iChannelTime[4], iDate, iSampleRate)
        iMouse con la semántica real de Shadertoy: empieza en (0,0,0,0); .xy = posición (píxeles
        enteros, origen abajo-izquierda) que solo se actualiza MIENTRAS se arrastra; |.zw| = donde
        se hizo clic; .z > 0 mientras el botón está pulsado (negativo al soltar); .w > 0 solo en el
        frame del clic (después, negativo).
     data-error-esperado    (el código de partida falla a propósito)
   Solución de un ejercicio:
     <script type="x-shader/x-fragment" data-solucion> … </script>
   ===================================================================== */
(function () {
  "use strict";
  const Curso = window.Curso, U = Curso.util;

  const VS_300 = "#version 300 es\nin vec2 a_pos;\nout vec2 v_uv;\nvoid main() {\n  v_uv = a_pos * 0.5 + 0.5;\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}\n";
  const VS_100 = "attribute vec2 a_pos;\nvarying vec2 v_uv;\nvoid main() {\n  v_uv = a_pos * 0.5 + 0.5;\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}\n";
  const CABECERA_SHADERTOY =
    "#version 300 es\nprecision highp float;\nuniform vec3 iResolution;\nuniform float iTime;\nuniform float iTimeDelta;\nuniform int iFrame;\nuniform float iFrameRate;\nuniform vec4 iMouse;\nuniform vec4 iDate;\nuniform float iSampleRate;\n" +
    "uniform vec3 iChannelResolution[4];\nuniform float iChannelTime[4];\n" +
    "uniform sampler2D iChannel0;\nuniform sampler2D iChannel1;\nuniform sampler2D iChannel2;\nuniform sampler2D iChannel3;\nout vec4 _fragColor_;\n";
  const PIE_SHADERTOY = "\nvoid main() { vec4 c = vec4(0.0, 0.0, 0.0, 1.0); mainImage(c, gl_FragCoord.xy); _fragColor_ = vec4(c.rgb, 1.0); }\n";
  const LINEAS_CABECERA_ST = CABECERA_SHADERTOY.split("\n").length - 1;

  /* -------------------------------------------------------------------
     Un único contexto WebGL2 compartido por todos los playgrounds de la
     página. Chrome limita el número de contextos WebGL vivos (~16) y al
     superarlo destruye el más antiguo. Con un contexto compartido
     dibujamos cada vista en él y la copiamos a su canvas 2D visible.
     ------------------------------------------------------------------- */
  const GLC = (Curso.glCompartido = {
    canvas: null, gl: null, vistas: new Set(), raf: 0, perdido: false, texturas: {}, vao: null,
    ficha: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), compilaciones: 0,
    obtener() {
      if (this.gl) return this.gl;
      const c = document.createElement("canvas");
      c.width = 64; c.height = 64;
      const gl = c.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
      if (!gl) return null;
      this.canvas = c; this.gl = gl;
      c.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.perdido = true; this.vistas.forEach((v) => v.alPerderContexto && v.alPerderContexto()); });
      c.addEventListener("webglcontextrestored", () => { this.perdido = false; this.recursos(); this.vistas.forEach((v) => v.alRestaurar && v.alRestaurar()); });
      this.recursos();
      return gl;
    },
    recursos() {
      const gl = this.gl;
      this.texturas = {};
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    },
    /* "paisaje:nearest:clamp:nomip" → textura (cacheada) */
    textura(spec) {
      const gl = this.gl;
      if (this.texturas[spec]) return this.texturas[spec];
      const [nombre, ...ops] = spec.split(":").map((s) => s.trim());
      const nearest = ops.includes("nearest"), clamp = ops.includes("clamp"), mip = !ops.includes("nomip");
      const tam = +(ops.find((o) => /^\d+$/.test(o)) || 512);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      const fuente = window.Texturas.crear(nombre, tam);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fuente);
      t._ancho = fuente.width; t._alto = fuente.height;   // para iChannelResolution (modo shadertoy)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (mip) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? (nearest ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR) : (nearest ? gl.NEAREST : gl.LINEAR));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      return (this.texturas[spec] = t);
    },
    asegurarTamaño(w, h) {
      const c = this.canvas;
      if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
    },
    registrar(v) { this.vistas.add(v); this.arrancar(); },
    quitar(v) { this.vistas.delete(v); },
    arrancar() {
      if (this.raf) return;
      const paso = (ms) => {
        this.raf = 0;
        let alguna = false;
        if (!this.perdido) {
          for (const v of this.vistas) {
            if (!v.visible) continue;
            alguna = true;
            try { v.renderizar(ms); } catch (e) { console.error(e); }
          }
        }
        if (alguna) this.raf = requestAnimationFrame(paso);
      };
      this.raf = requestAnimationFrame(paso);
    },
    /* Compila y enlaza; devuelve {programa} o {error, lineas:[{linea, msg}]} */
    compilar(fuenteVS, fuenteFS, desfase) {
      const gl = this.gl;
      // En ANGLE/Metal, un isnan()/isinf() en el shader desactiva el fast math… pero solo la PRIMERA vez
      // que Chrome compila ese texto exacto: después sale de la caché de programas (también la de disco)
      // compilado CON fast math (medido en el M1, lecciones 3.7 y 6.6). Para que los experimentos del curso
      // sean repetibles, a esos shaders les añadimos al final un comentario único (no mueve los números de
      // línea): cada compilación es un texto nuevo y la caché nunca acierta.
      if (/\bis(nan|inf)\s*\(/.test(fuenteFS)) fuenteFS += "\n// sin-cache " + this.ficha + "-" + ++this.compilaciones + "\n";
      const comp = (tipo, src) => {
        const s = gl.createShader(tipo);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(s) || "error desconocido";
          gl.deleteShader(s);
          return { error: log };
        }
        return { shader: s };
      };
      const vs = comp(gl.VERTEX_SHADER, fuenteVS);
      if (vs.error) return { error: "[vertex shader interno]\n" + vs.error, lineas: [] };
      const fs = comp(gl.FRAGMENT_SHADER, fuenteFS);
      if (fs.error) {
        gl.deleteShader(vs.shader);
        return { error: fs.error, lineas: analizarLog(fs.error, desfase) };
      }
      const avisos = gl.getShaderInfoLog(fs.shader) || "";
      const p = gl.createProgram();
      gl.attachShader(p, vs.shader); gl.attachShader(p, fs.shader);
      gl.bindAttribLocation(p, 0, "a_pos");
      gl.linkProgram(p);
      gl.deleteShader(vs.shader); gl.deleteShader(fs.shader);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p) || "error de enlazado";
        gl.deleteProgram(p);
        return { error: "Error al enlazar:\n" + log, lineas: [] };
      }
      return { programa: p, avisos: avisos.trim() };
    },
  });

  function analizarLog(log, desfase) {
    const res = [];
    const re = /(?:ERROR|WARNING):\s*\d+:(\d+):\s*(.*)/g;
    let m;
    while ((m = re.exec(log))) res.push({ linea: +m[1] - (desfase || 0), msg: m[2] });
    return res;
  }
  Curso.analizarLogGLSL = analizarLog;

  /* hash corto para invalidar código guardado si cambia el original */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  /* -------------------------------------------------------------------
     Controles de uniforms personalizados
     ------------------------------------------------------------------- */
  function hexARgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function crearControles(cont, defs, valores, alCambiar) {
    Object.keys(defs).forEach((nombre) => {
      const d = defs[nombre];
      const tipo = d.tipo || "float";
      const etiqueta = d.etiqueta || nombre;
      if (tipo === "bool") {
        valores[nombre] = !!d.valor;
        const fila = U.crear("div", { class: "control" });
        const cb = U.crear("input", { type: "checkbox" });
        cb.checked = valores[nombre];
        cb.addEventListener("change", () => { valores[nombre] = cb.checked; alCambiar(); });
        fila.append(U.crear("label", { text: etiqueta }), cb, U.crear("output", { text: "" }));
        cont.appendChild(fila);
      } else if (tipo === "color") {
        valores[nombre] = hexARgb(d.valor || "#ffffff");
        const fila = U.crear("div", { class: "control" });
        const inp = U.crear("input", { type: "color", value: d.valor || "#ffffff" });
        const out = U.crear("output", { text: valores[nombre].map((x) => x.toFixed(2)).join(", ") });
        inp.addEventListener("input", () => { valores[nombre] = hexARgb(inp.value); out.textContent = valores[nombre].map((x) => x.toFixed(2)).join(", "); alCambiar(); });
        fila.append(U.crear("label", { text: etiqueta }), inp, out);
        cont.appendChild(fila);
      } else {
        const n = { float: 1, int: 1, vec2: 2, vec3: 3, vec4: 4 }[tipo] || 1;
        const vals = Array.isArray(d.valor) ? d.valor.slice() : new Array(n).fill(d.valor === undefined ? 0 : d.valor);
        valores[nombre] = n === 1 ? vals[0] : vals;
        const comps = ["x", "y", "z", "w"];
        for (let i = 0; i < n; i++) {
          const fila = U.crear("div", { class: "control" });
          const min = Array.isArray(d.min) ? d.min[i] : d.min === undefined ? 0 : d.min;
          const max = Array.isArray(d.max) ? d.max[i] : d.max === undefined ? 1 : d.max;
          const paso = tipo === "int" ? 1 : d.paso || (max - min) / 200;
          const inp = U.crear("input", { type: "range", min, max, step: paso, value: vals[i] });
          // Decimales: 1, 2 o 3 según el paso, y más si el paso es menor que 0.001 (0.0001 → 4; máximo 6).
          const dec = tipo === "int" ? 0 : Math.max(paso >= 1 ? 1 : paso >= 0.1 ? 2 : 3, Math.min(6, Math.ceil(-Math.log10(paso) - 1e-9)));
          const out = U.crear("output", { text: (+vals[i]).toFixed(dec) });
          inp.addEventListener("input", () => {
            const v = tipo === "int" ? parseInt(inp.value, 10) : parseFloat(inp.value);
            if (n === 1) valores[nombre] = v; else valores[nombre][i] = v;
            out.textContent = v.toFixed(dec);
            alCambiar();
          });
          fila.append(U.crear("label", { text: n === 1 ? etiqueta : etiqueta + "." + comps[i] }), inp, out);
          cont.appendChild(fila);
        }
      }
    });
  }

  /* -------------------------------------------------------------------
     Editor CodeMirror común (también lo usa el playground JS)
     ------------------------------------------------------------------- */
  Curso.crearEditor = function (contenedor, valor, modo, alCambiar, atajos) {
    if (!window.CodeMirror) {
      const ta = U.crear("textarea", { spellcheck: "false" });
      ta.value = valor;
      ta.style.cssText = "flex:1;min-height:260px;background:var(--code-bg);color:var(--code-text);font:13.5px/1.58 var(--mono);border:0;padding:10px;resize:vertical";
      ta.addEventListener("input", () => alCambiar && alCambiar());
      contenedor.appendChild(ta);
      return { getValue: () => ta.value, setValue: (v) => (ta.value = v), refresh() {}, marcarLineas() {}, focus: () => ta.focus(), setSize() {} };
    }
    const extra = Object.assign({
      Tab: (cm) => (cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("  ", "end")),
      "Shift-Tab": (cm) => cm.indentSelection("subtract"),
      "Cmd-/": "toggleComment", "Ctrl-/": "toggleComment",
    }, atajos || {});
    const cm = CodeMirror(contenedor, {
      value: valor, mode: modo, theme: "curso", lineNumbers: true, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
      indentUnit: 2, tabSize: 2, indentWithTabs: false, lineWrapping: false, extraKeys: extra, viewportMargin: 50,
    });
    let marcadas = [];
    cm.marcarLineas = (lineas) => {
      marcadas.forEach((h) => cm.removeLineClass(h, "wrap", "cm-linea-error"));
      marcadas = [];
      (lineas || []).forEach((n) => {
        if (n >= 1 && n <= cm.lineCount()) marcadas.push(cm.addLineClass(n - 1, "wrap", "cm-linea-error"));
      });
    };
    if (alCambiar) cm.on("changes", alCambiar);
    return cm;
  };

  /* Observador de visibilidad compartido */
  const visObs = "IntersectionObserver" in window ? new IntersectionObserver((ents) => {
    ents.forEach((e) => { const v = e.target._vista; if (v) v.cambiarVisibilidad(e.isIntersecting); });
  }, { rootMargin: "120px 0px" }) : null;

  /* -------------------------------------------------------------------
     Componente
     ------------------------------------------------------------------- */
  let contador = 0;
  function iniciar(el) {
    const id = "glsl-" + ++contador;
    const scriptFS = el.querySelector('script[type="x-shader/x-fragment"]:not([data-solucion])');
    const scriptSol = el.querySelector('script[type="x-shader/x-fragment"][data-solucion]');
    const original = scriptFS ? U.textoDeScript(scriptFS) : "";
    const solucion = scriptSol ? U.textoDeScript(scriptSol) : null;
    const modoST = el.dataset.modo === "shadertoy";
    const editorModo = el.dataset.editor || "visible";
    const altura = +(el.dataset.altura || 360);
    const claveGuardado = "pg:" + location.pathname + ":" + id + ":" + hash(original);
    let defsUniforms = {};
    try { defsUniforms = el.dataset.uniforms ? JSON.parse(el.dataset.uniforms) : {}; }
    catch (e) { Curso.informarError(id, "data-uniforms no es JSON válido: " + e.message); }
    const texturas = (el.dataset.texturas || "").split(",").map((s) => s.trim()).filter(Boolean);
    const qa = (Curso.qa.playgrounds[id] = { tipo: "glsl", titulo: el.dataset.titulo || "", ok: null, error: null, errorEsperado: el.hasAttribute("data-error-esperado") });

    // --- DOM ---
    el.classList.add("playground");
    if (el.hasAttribute("data-apilado")) el.classList.add("apilado");
    el.innerHTML = "";
    const titulo = U.crear("div", { class: "pg-titulo", html: '<span class="tipo">GLSL</span><span>' + U.escapar(el.dataset.titulo || "Fragment shader") + '</span><span class="espacio"></span>' });
    const cuerpo = U.crear("div", { class: "pg-cuerpo" });
    const cajaEditor = U.crear("div", { class: "pg-editor" });
    const salida = U.crear("div", { class: "pg-salida" });
    const lienzo = U.crear("div", { class: "pg-lienzo" });
    const canvas = U.crear("canvas");
    lienzo.appendChild(canvas);
    lienzo.style.height = altura + "px";
    const errores = U.crear("pre", { class: "pg-errores" });
    const barra = U.crear("div", { class: "pg-barra" });
    const uniformsBox = U.crear("div", { class: "pg-uniforms" });
    salida.append(lienzo);
    cuerpo.append(cajaEditor, salida);
    el.append(titulo, cuerpo, errores, uniformsBox, barra);

    const btnPausa = U.crear("button", { class: "pg-btn", type: "button", title: "Pausar / reanudar", text: "⏸ Pausa" });
    const btnReinicio = U.crear("button", { class: "pg-btn", type: "button", title: "Poner u_time a 0", text: "⟲ t=0" });
    const estado = U.crear("span", { class: "estado" });
    const info = U.crear("span", { class: "fps" });
    const pixel = U.crear("span", { class: "fps", style: "min-width:0" });
    barra.append(btnPausa, btnReinicio, estado, U.crear("span", { class: "espacio" }), pixel, info);

    const btnRestaurar = U.crear("button", { class: "pg-btn", type: "button", title: "Volver al código original de la lección", text: "Restaurar" });
    const btnSol = solucion ? U.crear("button", { class: "pg-btn solucion", type: "button", text: "Ver solución" }) : null;
    const btnCodigo = editorModo === "oculto" ? U.crear("button", { class: "pg-btn", type: "button", text: "</> Ver código" }) : null;
    const btnFull = U.crear("button", { class: "pg-btn", type: "button", title: "Pantalla completa (Esc para salir)", text: "⛶" });
    if (btnCodigo) titulo.appendChild(btnCodigo);
    if (editorModo !== "no") titulo.appendChild(btnRestaurar);
    if (btnSol) titulo.appendChild(btnSol);
    titulo.appendChild(btnFull);

    if (editorModo === "no" || editorModo === "oculto") {
      cajaEditor.style.display = "none";
      cuerpo.style.gridTemplateColumns = "minmax(0,1fr)";
    }

    // --- estado de la vista ---
    const valores = {};
    crearControles(uniformsBox, defsUniforms, valores, () => { vista.sucio = true; });
    const guardado = U.storage.get(claveGuardado, null);
    let codigoUsuario = guardado != null ? guardado : original;
    let mostrandoSolucion = false;
    let editor = null;

    const vista = {
      visible: false, pausado: el.hasAttribute("data-pausado"), sucio: true,
      t: +(el.dataset.tiempo || 0), previo: -1, frame: 0,
      programa: null, uniforms: {}, raton: [0, 0], pulsado: false, ratonInicial: true,
      // iMouse de Shadertoy: pos = .xy (solo cambia al arrastrar), ori = .zw (clic; negativo al soltar),
      // señalClic = el próximo frame es el del clic (.w > 0 solo en ese frame).
      st: { pos: [0, 0], ori: [0, 0], señalClic: false },
      fpsCuenta: 0, fpsT0: 0, fps: 0, pedirPixel: null,
      cambiarVisibilidad(v) {
        this.visible = v;
        if (v) { this.previo = -1; GLC.arrancar(); }
      },
      alPerderContexto() { this.programa = null; mostrarError("Contexto WebGL perdido (¿un bucle infinito o demasiado trabajo para la GPU?). Intentando restaurar…"); },
      alRestaurar() { compilar(); },
      renderizar(ms) {
        const gl = GLC.gl;
        if (!this.programa) return;
        const s = ms / 1000;
        const dt = this.previo < 0 ? 0 : Math.min(0.1, s - this.previo);
        this.previo = s;
        if (this.pausado && !this.sucio && !this.pedirPixel) return;
        if (!this.pausado) { this.t += dt; this.frame++; }
        this.sucio = false;
        const w = canvas.width, h = canvas.height;
        if (w < 2 || h < 2) return;
        GLC.asegurarTamaño(w, h);
        gl.viewport(0, 0, w, h);
        gl.useProgram(this.programa);
        const u = this.uniforms;
        const mx = this.ratonInicial ? w / 2 : this.raton[0], my = this.ratonInicial ? h / 2 : this.raton[1];
        const pon = (n, v) => { if (u[n]) GLKit.ponerUniform(gl, u[n], v); };
        if (modoST) {
          pon("iTime", this.t); pon("iTimeDelta", dt); pon("iFrame", this.frame);
          pon("iFrameRate", this.fps || 60);
          pon("iResolution", [w, h, 1]);
          const st = this.st;
          pon("iMouse", [st.pos[0], st.pos[1], st.ori[0], st.señalClic ? st.ori[1] : -Math.abs(st.ori[1])]);
          st.señalClic = false;
          const d = new Date();
          pon("iDate", [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000]);
          pon("iSampleRate", 44100);
          const res = [];
          for (let i = 0; i < 4; i++) {
            pon("iChannel" + i, i);
            const tx = texturas[i] ? GLC.textura(texturas[i]) : null;
            res.push(tx ? tx._ancho : 0, tx ? tx._alto : 0, tx ? 1 : 0);
          }
          pon("iChannelResolution", res);
          pon("iChannelTime", [this.t, this.t, this.t, this.t]);
        } else {
          pon("u_time", this.t); pon("u_frame", this.frame); pon("u_resolution", [w, h]);
          if (u.u_mouse) pon("u_mouse", u.u_mouse.tipo === gl.FLOAT_VEC4 ? [mx, my, this.pulsado ? 1 : 0, 0] : [mx, my]);
          for (let i = 0; i < 4; i++) pon("u_tex" + i, i);
        }
        for (const n in valores) pon(n, valores[n]);
        texturas.forEach((spec, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, GLC.textura(spec)); });
        gl.bindVertexArray(GLC.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (this.pedirPixel) {
          const [px, py] = this.pedirPixel;
          const buf = new Uint8Array(4);
          gl.readPixels(Math.floor(px), Math.floor(py), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
          const f = (x) => (x / 255).toFixed(3);
          pixel.textContent = "gl_FragCoord≈(" + (Math.floor(px) + 0.5) + ", " + (Math.floor(py) + 0.5) + ")  rgb(" + f(buf[0]) + ", " + f(buf[1]) + ", " + f(buf[2]) + ")";
          this.pedirPixel = null;
        }
        const ctx = this.ctx || (this.ctx = canvas.getContext("2d"));
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(GLC.canvas, 0, GLC.canvas.height - h, w, h, 0, 0, w, h);
        // fps
        this.fpsCuenta++;
        if (s - this.fpsT0 > 0.5) { this.fps = this.fpsCuenta / (s - this.fpsT0); this.fpsCuenta = 0; this.fpsT0 = s; }
        info.textContent = "t=" + this.t.toFixed(2) + "s · " + (this.pausado ? "pausa" : Math.round(this.fps) + " fps") + " · " + w + "×" + h;
      },
    };
    lienzo._vista = vista;

    function mostrarError(txt) {
      errores.textContent = "";
      if (!txt) { errores.classList.remove("visible"); return; }
      errores.classList.add("visible");
      txt.split("\n").forEach((l) => {
        const m = l.match(/(?:ERROR|WARNING):\s*\d+:(\d+):/);
        if (m && editor) {
          const n = +m[1] - (modoST ? LINEAS_CABECERA_ST : 0);
          const span = U.crear("span", { class: "linea-err", text: l.replace(/\d+:(\d+):/, "línea " + n + ":") });
          span.addEventListener("click", () => { editor.focus(); editor.setCursor && editor.setCursor({ line: n - 1, ch: 0 }); });
          errores.append(span, "\n");
        } else errores.append(l + "\n");
      });
    }

    function compilar() {
      const gl = GLC.obtener();
      if (!gl) {
        mostrarError("Tu navegador no tiene WebGL2 disponible.");
        qa.ok = false; qa.error = "sin WebGL2";
        return;
      }
      const src = editor ? editor.getValue() : codigoUsuario;
      let fs = src, desfase = 0, vs = VS_300;
      if (modoST) { fs = CABECERA_SHADERTOY + src + PIE_SHADERTOY; desfase = LINEAS_CABECERA_ST; }
      // Sin "#version 300 es" en ninguna parte → GLSL ES 1.00 (vertex 1.00). Si aparece aunque no esté en
      // la 1ª línea, usamos el vertex 3.00 para que se vea el error REAL del compilador sobre #version
      // (ANGLE exige #version en la línea 1; admite espacios o /* */ antes en esa misma línea).
      else if (!/#version\s+300\s+es/.test(src)) vs = VS_100;
      const r = GLC.compilar(vs, fs, desfase);
      if (r.error) {
        estado.className = "estado estado-err";
        estado.textContent = "✗ error";
        errores.style.color = ""; errores.style.background = "";
        mostrarError(r.error.trim());
        if (editor) editor.marcarLineas(r.lineas.map((x) => x.linea));
        if (qa.ok === null) { qa.ok = false; qa.error = r.error.trim().slice(0, 400); }
        return false;
      }
      if (vista.programa) gl.deleteProgram(vista.programa);
      vista.programa = r.programa;
      vista.uniforms = GLKit.uniforms(gl, r.programa);
      vista.sucio = true;
      estado.className = "estado estado-ok";
      estado.textContent = r.avisos ? "✓ compilado (con avisos)" : "✓ compilado";
      mostrarError(null);
      if (r.avisos) {
        // El compilador acepta el shader pero avisa (p. ej. "operation result is undefined").
        mostrarError(r.avisos);
        errores.style.color = "var(--warn)";
        errores.style.background = "color-mix(in srgb, var(--warn) 10%, var(--code-bg))";
      } else { errores.style.color = ""; errores.style.background = ""; }
      if (editor) editor.marcarLineas([]);
      if (qa.ok === null) qa.ok = true;
      GLC.arrancar();
      return true;
    }
    const compilarPronto = U.debounce(() => {
      compilar();
      if (!mostrandoSolucion && editor) {
        const v = editor.getValue();
        codigoUsuario = v;
        if (v === original) { try { localStorage.removeItem(claveGuardado); } catch (e) {} } else U.storage.set(claveGuardado, v);
      }
    }, 350);

    if (editorModo !== "no") {
      editor = Curso.crearEditor(cajaEditor, codigoUsuario, "x-shader/glsl3", compilarPronto, {
        "Cmd-Enter": () => compilar(), "Ctrl-Enter": () => compilar(), "Cmd-S": () => compilar(), "Ctrl-S": () => compilar(),
      });
      // Altura fija: el editor tiene scroll propio y no estira el lienzo.
      editor.setSize(null, el.hasAttribute("data-apilado") ? Math.min(460, Math.max(160, (codigoUsuario.split("\n").length + 1) * 21.5)) : altura);
    }

    // --- tamaño del lienzo ---
    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(lienzo.clientWidth * dpr)), h = Math.max(2, Math.round(lienzo.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; vista.sucio = true; }

    };
    if ("ResizeObserver" in window) new ResizeObserver(ajustar).observe(lienzo);
    ajustar();

    // --- ratón ---
    const posRaton = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (r.bottom - e.clientY) * (canvas.height / r.height)];
    };
    // Shadertoy usa píxeles enteros (Math.floor), no centros de píxel.
    const posEntera = (p) => [Math.floor(p[0]), Math.floor(p[1])];
    canvas.addEventListener("pointermove", (e) => {
      vista.raton = posRaton(e); vista.ratonInicial = false; vista.pedirPixel = vista.raton.slice(); vista.sucio = true;
      if (vista.pulsado) vista.st.pos = posEntera(vista.raton);
      if (!vista.visible) return;
      GLC.arrancar();
    });
    canvas.addEventListener("pointerdown", (e) => {
      vista.pulsado = true; vista.raton = posRaton(e); vista.ratonInicial = false; vista.sucio = true;
      const p = posEntera(vista.raton);
      vista.st.pos = p; vista.st.ori = p.slice(); vista.st.señalClic = true;
      canvas.setPointerCapture(e.pointerId);
    });
    const soltar = () => {
      if (!vista.pulsado) return;
      vista.pulsado = false; vista.sucio = true;
      vista.st.ori = [-Math.abs(vista.st.ori[0]), -Math.abs(vista.st.ori[1])];
    };
    canvas.addEventListener("pointerup", soltar);
    canvas.addEventListener("pointercancel", soltar);
    canvas.addEventListener("pointerleave", () => { pixel.textContent = ""; });
    canvas.style.touchAction = "none";

    // --- botones ---
    const pintarPausa = () => { btnPausa.textContent = vista.pausado ? "▶ Reanudar" : "⏸ Pausa"; };
    btnPausa.addEventListener("click", () => { vista.pausado = !vista.pausado; vista.previo = -1; vista.sucio = true; pintarPausa(); GLC.arrancar(); });
    btnReinicio.addEventListener("click", () => { vista.t = 0; vista.frame = 0; vista.sucio = true; GLC.arrancar(); });
    pintarPausa();
    btnRestaurar.addEventListener("click", () => {
      mostrandoSolucion = false; if (btnSol) btnSol.textContent = "Ver solución";
      codigoUsuario = original;
      try { localStorage.removeItem(claveGuardado); } catch (e) {}
      if (editor) editor.setValue(original);
      compilar();
    });
    if (btnSol) btnSol.addEventListener("click", () => {
      if (!mostrandoSolucion) { codigoUsuario = editor.getValue(); mostrandoSolucion = true; editor.setValue(solucion); btnSol.textContent = "Volver a mi código"; }
      else { mostrandoSolucion = false; editor.setValue(codigoUsuario); btnSol.textContent = "Ver solución"; }
      compilar();
    });
    if (btnCodigo) { btnRestaurar.style.display = "none"; if (btnSol) btnSol.style.display = "none"; }
    if (btnCodigo) btnCodigo.addEventListener("click", () => {
      const oculto = cajaEditor.style.display === "none";
      cajaEditor.style.display = oculto ? "" : "none";
      btnRestaurar.style.display = oculto ? "" : "none";
      if (btnSol) btnSol.style.display = oculto ? "" : "none";
      cuerpo.style.gridTemplateColumns = oculto ? "" : "minmax(0,1fr)";
      btnCodigo.textContent = oculto ? "Ocultar código" : "</> Ver código";
      if (oculto && editor) setTimeout(() => editor.refresh(), 0);
    });
    const salirFull = (e) => { if (e.key === "Escape" && el.classList.contains("pantalla-completa")) alternarFull(); };
    function alternarFull() {
      el.classList.toggle("pantalla-completa");
      document.body.style.overflow = el.classList.contains("pantalla-completa") ? "hidden" : "";
      if (el.classList.contains("pantalla-completa")) document.addEventListener("keydown", salirFull); else document.removeEventListener("keydown", salirFull);
      const full = el.classList.contains("pantalla-completa");
      lienzo.style.height = full ? "" : altura + "px";
      setTimeout(() => { ajustar(); if (editor) { editor.setSize(null, full ? "100%" : altura); editor.refresh(); } }, 30);
    }
    btnFull.addEventListener("click", alternarFull);

    compilar();
    GLC.registrar(vista);
    if (visObs) visObs.observe(lienzo); else vista.cambiarVisibilidad(true);
    el._playground = { vista, editor, compilar };
  }

  Curso.registrar(".glsl-playground", iniciar);
})();
