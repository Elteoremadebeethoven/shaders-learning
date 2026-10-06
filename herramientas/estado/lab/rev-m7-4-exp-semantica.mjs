// Experimentos de la revisión de 7.4 (Chromium headless + SwiftShader): semántica WebGL2/GLSL, no tiempos.
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const nav = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  const page = await nav.newPage();
  const consola = [];
  page.on("console", (m) => consola.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
  await page.setContent("<!doctype html><html><body style='margin:0'></body></html>");
  const r = await page.evaluate(() => {
    const out = {};
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    document.body.appendChild(c);
    const gl = c.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
    out.renderer = gl.getParameter(gl.RENDERER);
    out.MAX_ELEMENT_INDEX = gl.getParameter(gl.MAX_ELEMENT_INDEX);
    out.MAX_VERTEX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
    out.ALIASED_POINT_SIZE_RANGE = Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE));
    const pf = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT);
    out.vsMedium = [pf.rangeMin, pf.rangeMax, pf.precision];

    function sh(tipo, src) { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    function prog(vs, fs, tf) {
      const p = gl.createProgram();
      const a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(p, a); gl.attachShader(p, b);
      if (tf) gl.transformFeedbackVaryings(p, tf, gl.INTERLEAVED_ATTRIBS);
      gl.linkProgram(p);
      return { p, ok: gl.getProgramParameter(p, gl.LINK_STATUS), log: gl.getProgramInfoLog(p), vlog: gl.getShaderInfoLog(a), flog: gl.getShaderInfoLog(b) };
    }
    const FS0 = "#version 300 es\nprecision highp float;\nout vec4 o;\nvoid main(){o=vec4(1.0);}";
    function contar() {
      const px = new Uint8Array(256 * 256 * 4);
      gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 128) n++;
      return n;
    }

    // 1. Rejilla plana que llena el lienzo, Uint16 forzado vs Uint32
    function rejilla(N, forzar16) {
      const lado = N + 1, nV = lado * lado;
      const uv = new Float32Array(nV * 2);
      for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) { const k = j * lado + i; uv[2 * k] = i / N; uv[2 * k + 1] = j / N; }
      const T = forzar16 || nV - 1 <= 65534 ? Uint16Array : Uint32Array;
      const ind = new T(6 * N * N); let k = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = j * lado + i, b = a + lado;
        ind[k++] = a; ind[k++] = a + 1; ind[k++] = b; ind[k++] = b; ind[k++] = a + 1; ind[k++] = b + 1;
      }
      return { uv, ind };
    }
    const pr = prog("#version 300 es\nlayout(location=0) in vec2 a_uv;\nvoid main(){gl_Position=vec4(a_uv*2.0-1.0,0.0,1.0);}", FS0);
    gl.useProgram(pr.p);
    out.rejilla = {};
    for (const [N, f16] of [[300, true], [300, false], [255, true], [255, false], [254, false]]) {
      const r = rejilla(N, f16);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, r.uv, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const eb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.ind, gl.STATIC_DRAW);
      gl.viewport(0, 0, 256, 256); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, r.ind.length, r.ind instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      out.rejilla[N + (f16 ? "-u16" : "-auto")] = { tipo: r.ind.constructor.name, pix: contar(), err: gl.getError() };
      gl.bindVertexArray(null); gl.deleteVertexArray(vao); gl.deleteBuffer(vb); gl.deleteBuffer(eb);
    }
    // N = 255 forzado: dibujar con el lienzo a la resolución de la malla para ver el triángulo que falta (esquina)
    out.u16wrap = Array.from(new Uint16Array([65535, 65536, 70000]));

    // 2. gl_VertexID con drawElements [5, 9, 2] (transform feedback)
    {
      const p = prog("#version 300 es\nflat out int v_id;\nvoid main(){v_id=gl_VertexID;gl_Position=vec4(0.0,0.0,0.0,1.0);gl_PointSize=1.0;}",
        "#version 300 es\nprecision highp float;\nflat in int v_id;\nout vec4 o;\nvoid main(){o=vec4(1.0);}", ["v_id"]);
      gl.useProgram(p.p);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const eb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([5, 9, 2]), gl.STATIC_DRAW);
      const tb = gl.createBuffer(); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tb); gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, 12, gl.STREAM_READ);
      const tf = gl.createTransformFeedback(); gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tb);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawElements(gl.POINTS, 3, gl.UNSIGNED_SHORT, 0);
      gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      const res = new Int32Array(3);
      gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tb);
      gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, res);
      out.vertexIDdrawElements = Array.from(res);
      out.tfErr = gl.getError();
      gl.bindVertexArray(null);
    }

    // 3. Precisión de un int uniform en VS y FS
    {
      const p = prog("#version 300 es\nuniform int u_modo;\nvoid main(){gl_Position=vec4(float(u_modo));}",
        "#version 300 es\nprecision highp float;\nuniform int u_modo;\nout vec4 o;\nvoid main(){o=vec4(float(u_modo));}");
      out.precisionInt = { ok: p.ok, log: p.log };
      const p2 = prog("#version 300 es\nuniform int u_modo;\nvoid main(){gl_Position=vec4(float(u_modo));}",
        "#version 300 es\nprecision highp float;\nuniform highp int u_modo;\nout vec4 o;\nvoid main(){o=vec4(float(u_modo));}");
      out.precisionIntHighp = { ok: p2.ok, log: p2.log };
    }

    // 4. Texturas en el VS
    function texNiveles() {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      const cols = [[255, 0, 0], [0, 255, 0], [0, 0, 255]];
      for (let k = 0, n = 4; n >= 1; k++, n >>= 1) {
        const d = new Uint8Array(n * n * 4); const c = cols[Math.min(k, 2)];
        for (let i = 0; i < n * n; i++) { d.set([c[0], c[1], c[2], 255], i * 4); }
        gl.texImage2D(gl.TEXTURE_2D, k, gl.RGBA8, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      return t;
    }
    function leerVS(expr, tex, opts = {}) {
      const p = prog("#version 300 es\nuniform highp sampler2D u_t;\nout vec4 v_c;\nvoid main(){v_c=" + expr + ";gl_Position=vec4(0.0,0.0,0.0,1.0);gl_PointSize=1.0;}",
        "#version 300 es\nprecision highp float;\nin vec4 v_c;\nout vec4 o;\nvoid main(){o=v_c;}", ["v_c"]);
      if (!p.ok) return { ok: false, vlog: p.vlog, log: p.log };
      gl.useProgram(p.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(p.p, "u_t"), 0);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const tb = gl.createBuffer(); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tb); gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, 16, gl.STREAM_READ);
      const tf = gl.createTransformFeedback(); gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, tb);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.beginTransformFeedback(gl.POINTS); gl.drawArrays(gl.POINTS, 0, 1); gl.endTransformFeedback();
      gl.disable(gl.RASTERIZER_DISCARD); gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      const res = new Float32Array(4); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, tb); gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, res);
      return { ok: true, v: Array.from(res).map((x) => +x.toFixed(4)) };
    }
    const tn = texNiveles();
    out.vsTexture = leerVS("texture(u_t, vec2(0.5))", tn);
    out.vsLod1 = leerVS("textureLod(u_t, vec2(0.5), 1.0)", tn);
    out.vsLod2 = leerVS("textureLod(u_t, vec2(0.5), 2.0)", tn);
    out.vsBias = leerVS("texture(u_t, vec2(0.5), 1.0)", tn);
    const inc = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, inc);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(64).fill(200));
    out.vsIncompleta = leerVS("texture(u_t, vec2(0.5))", inc);
    out.vsIncompletaFetch = leerVS("texelFetch(u_t, ivec2(1), 0)", inc);
    const f32 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, f32);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 2, 2, 0, gl.RED, gl.FLOAT, new Float32Array([0.5, 0.5, 0.5, 0.5]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    out.vsR32Fsinext = leerVS("texture(u_t, vec2(0.5))", f32);
    out.extFloatLinear = !!gl.getExtension("OES_texture_float_linear");
    out.vsR32Fconext = leerVS("texture(u_t, vec2(0.5))", f32);
    const f16 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, f16);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 2, 2, 0, gl.RED, gl.FLOAT, new Float32Array([0.25, 0.25, 0.25, 0.25]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    out.vsR16F = leerVS("texture(u_t, vec2(0.5))", f16);

    // 5. Vértice provocador con flat, y extensiones
    {
      const p = prog("#version 300 es\nflat out vec3 v_c;\nconst vec2 P[3]=vec2[3](vec2(-1.0,-1.0),vec2(3.0,-1.0),vec2(-1.0,3.0));\nconst vec3 C[3]=vec3[3](vec3(1.0,0.0,0.0),vec3(0.0,1.0,0.0),vec3(0.0,0.0,1.0));\nvoid main(){v_c=C[gl_VertexID];gl_Position=vec4(P[gl_VertexID],0.0,1.0);}",
        "#version 300 es\nprecision highp float;\nflat in vec3 v_c;\nout vec4 o;\nvoid main(){o=vec4(v_c,1.0);}");
      gl.useProgram(p.p);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      gl.disable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Uint8Array(4); gl.readPixels(10, 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      out.provocadorArrays = Array.from(px);
      const eb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([1, 2, 0]), gl.STATIC_DRAW);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
      gl.readPixels(10, 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      out.provocadorElements120 = Array.from(px);
      gl.bindVertexArray(null);
    }
    out.extPolygonMode = !!gl.getExtension("WEBGL_polygon_mode");
    out.extProvoking = !!gl.getExtension("WEBGL_provoking_vertex");
    out.extensiones = gl.getSupportedExtensions();

    // 6. gl_FrontFacing y cross(dFdx, dFdy) según el sentido de giro
    {
      const p = prog("#version 300 es\nuniform int u_cw;\nout vec3 v_pos;\nvoid main(){vec2 P[3]=vec2[3](vec2(-0.8,-0.8),vec2(0.8,-0.8),vec2(-0.8,0.8));int id=gl_VertexID; if(u_cw==1 && id>0) id=3-id; vec3 w=vec3(P[id],0.0); v_pos=w; gl_Position=vec4(w.xy,0.0,1.0);}",
        "#version 300 es\nprecision highp float;\nin vec3 v_pos;\nout vec4 o;\nvoid main(){vec3 n=normalize(cross(dFdx(v_pos),dFdy(v_pos))); o=vec4(gl_FrontFacing?1.0:0.0, n.z*0.5+0.5, 0.0, 1.0);}");
      gl.useProgram(p.p);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      out.frontFacing = {};
      for (const cw of [0, 1]) {
        gl.uniform1i(gl.getUniformLocation(p.p, "u_cw"), cw);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const px = new Uint8Array(4); gl.readPixels(60, 60, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        out.frontFacing[cw ? "horario" : "antihorario"] = { front: px[0], nz: px[1] };
      }
    }

    // 7. gl_PointSize en px del búfer: canvas 256×256 mostrado a 128×128 CSS
    {
      c.style.width = "128px"; c.style.height = "128px";
      const p = prog("#version 300 es\nvoid main(){gl_Position=vec4(0.0,0.0,0.0,1.0);gl_PointSize=10.0;}", FS0);
      gl.useProgram(p.p);
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, 1);
      out.puntoPix = contar();
    }
    return out;
  });
  const { extensiones, ...resto } = r;
  console.log(JSON.stringify(resto, null, 1));
  console.log("extensiones con polygon/provoking:", extensiones.filter((e) => /polygon|provoking|float/i.test(e)));
  console.log("CONSOLA:", consola.join("\n"));
} finally {
  await nav.close();
}
