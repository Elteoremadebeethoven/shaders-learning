// s5-sonnet-lab1: cifras de CPU de m5 (5.1, 5.3, 5.4) medidas con la CPU caliente, en una página de nivel superior,
// y comprobación de si Chrome avisa en consola ante una textura incompleta (5.5).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], headless: "new",
});
try {
  const page = await browser.newPage();
  const mensajes = [];
  page.on("console", (m) => mensajes.push(m.type() + ": " + m.text()));
  await page.setContent("<canvas id=c width=256 height=256></canvas>");
  const res = await page.evaluate(async () => {
    const out = {};
    const mediana = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const calentar = (ms) => { const t = performance.now(); let s = 0; while (performance.now() - t < ms) for (let i = 0; i < 1e5; i++) s += Math.sin(i); return s; };
    const gl = document.getElementById("c").getContext("webgl2");
    const rep = (nombre, n, f) => { const v = []; for (let k = 0; k < 7; k++) { calentar(200); const t = performance.now(); f(); v.push((performance.now() - t)); } out[nombre] = { n, ms_mediana: +mediana(v).toFixed(3), us_por_llamada: +(mediana(v) / n * 1000).toFixed(3), todas: v.map((x) => +x.toFixed(2)) }; };

    // 5.1
    rep("clearColor x2000", 2000, () => { for (let i = 0; i < 2000; i++) gl.clearColor(i / 2000, 0, 0, 1); });
    rep("getError x2000", 2000, () => { for (let i = 0; i < 2000; i++) gl.getError(); });
    rep("getParameter(VIEWPORT) x2000", 2000, () => { for (let i = 0; i < 2000; i++) gl.getParameter(gl.VIEWPORT); });
    rep("getParameter(CURRENT_PROGRAM) x20000", 20000, () => { for (let i = 0; i < 20000; i++) gl.getParameter(gl.CURRENT_PROGRAM); });
    rep("getParameter(MAX_TEXTURE_SIZE) x20000", 20000, () => { for (let i = 0; i < 20000; i++) gl.getParameter(gl.MAX_TEXTURE_SIZE); });
    rep("getParameter(COLOR_CLEAR_VALUE) x2000", 2000, () => { for (let i = 0; i < 2000; i++) gl.getParameter(gl.COLOR_CLEAR_VALUE); });

    // 5.4
    const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, "#version 300 es\nuniform vec4 u_a; uniform vec3 u_b; void main(){ gl_Position = u_a + vec4(u_b,0.0); }"); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, "#version 300 es\nprecision highp float; out vec4 c; void main(){ c = vec4(1.0); }"); gl.compileShader(fs);
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    out.link = gl.getProgramParameter(p, gl.LINK_STATUS);
    gl.useProgram(p);
    const la = gl.getUniformLocation(p, "u_a"), lb = gl.getUniformLocation(p, "u_b");
    rep("uniform4f x10000", 10000, () => { for (let i = 0; i < 10000; i++) gl.uniform4f(la, i, 1, 2, 3); });
    rep("getUniformLocation x10000", 10000, () => { for (let i = 0; i < 10000; i++) gl.getUniformLocation(p, "u_a"); });
    rep("getUniform x2000", 2000, () => { for (let i = 0; i < 2000; i++) gl.getUniform(p, lb); });

    // 5.4: 100 000 vértices, recalcular + bufferSubData, frente a uniform2f
    const N = 100000, datos = new Float32Array(N * 2);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, datos.byteLength, gl.DYNAMIC_DRAW);
    const base = new Float32Array(N * 2); for (let i = 0; i < base.length; i++) base[i] = Math.random();
    rep("100k vertices: recalcular (x+dx)", 1, () => { for (let i = 0; i < N * 2; i += 2) { datos[i] = base[i] + 0.1; datos[i + 1] = base[i + 1] + 0.2; } });
    rep("100k vertices: bufferSubData 800 KB", 1, () => { gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos); });
    rep("uniform2f x1", 1, () => { for (let i = 0; i < 1; i++) gl.uniform4f(la, 1, 2, 3, 4); });

    // 5.3: 200 000 vértices (1,6 MB): calcular, bufferSubData, bufferData con datos, orphaning + bufferSubData
    const M = 200000, d2 = new Float32Array(M * 2);
    const b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, d2.byteLength, gl.DYNAMIC_DRAW);
    rep("200k vertices: calcular (sin/cos)", 1, () => { for (let i = 0; i < M; i++) { const x = i / M * 2 - 1; d2[i * 2] = x; d2[i * 2 + 1] = 0.5 * Math.sin(x * 9) * Math.cos(x * 2.3); } });
    rep("200k: bufferSubData", 1, () => { gl.bufferSubData(gl.ARRAY_BUFFER, 0, d2); });
    rep("200k: bufferData con datos", 1, () => { gl.bufferData(gl.ARRAY_BUFFER, d2, gl.DYNAMIC_DRAW); });
    rep("200k: orphaning + bufferSubData", 1, () => { gl.bufferData(gl.ARRAY_BUFFER, d2.byteLength, gl.DYNAMIC_DRAW); gl.bufferSubData(gl.ARRAY_BUFFER, 0, d2); });
    gl.getError();

    // 5.5: textura incompleta: ¿aviso en consola al dibujar con ella?
    const vs2 = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs2, "#version 300 es\nvoid main(){ vec2 P[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3)); gl_Position=vec4(P[gl_VertexID],0,1);} "); gl.compileShader(vs2);
    const fs2 = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs2, "#version 300 es\nprecision highp float; uniform sampler2D t; out vec4 c; void main(){ c = texture(t, gl_FragCoord.xy/256.0);} "); gl.compileShader(fs2);
    const p2 = gl.createProgram(); gl.attachShader(p2, vs2); gl.attachShader(p2, fs2); gl.linkProgram(p2); gl.useProgram(p2);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    const px = new Uint8Array(4 * 4 * 4).fill(200);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);   // MIN_FILTER por defecto: incompleta
    gl.bindVertexArray(gl.createVertexArray());
    gl.viewport(0, 0, 256, 256);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const o = new Uint8Array(4); gl.readPixels(10, 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, o);
    out.texturaIncompleta = { pixel: Array.from(o), getError: gl.getError() };

    // 5.5: ¿una textura de 1×1 «siempre» es completa? (RGBA8 / RGBA32F sin extensión / RGBA16F, filtro por defecto)
    const leer1x1 = (formatoInterno, tipo, datos) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, formatoInterno, 1, 1, 0, gl.RGBA, tipo, datos);   // filtros por defecto
      gl.clearColor(0.2, 0.4, 0.6, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const o = new Uint8Array(4); gl.readPixels(10, 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, o);
      return { pixel: Array.from(o), error: gl.getError() };
    };
    out.t1x1_RGBA8 = leer1x1(gl.RGBA8, gl.UNSIGNED_BYTE, new Uint8Array([255, 128, 0, 255]));
    out.t1x1_RGBA32F_sin_ext = leer1x1(gl.RGBA32F, gl.FLOAT, new Float32Array([1, 0.5, 0, 1]));
    out.t1x1_RGBA16F = leer1x1(gl.RGBA16F, gl.FLOAT, new Float32Array([1, 0.5, 0, 1]));
    gl.getExtension("OES_texture_float_linear");
    out.t1x1_RGBA32F_con_ext = leer1x1(gl.RGBA32F, gl.FLOAT, new Float32Array([1, 0.5, 0, 1]));

    // 5.8.4: picking leyendo del canvas con MSAA (antialias por defecto): ¿aparecen ids intermedios en los bordes?
    const probar = (atrib) => {
      const c2 = document.createElement("canvas"); c2.width = c2.height = 64;
      const g2 = c2.getContext("webgl2", atrib);
      const v = g2.createShader(g2.VERTEX_SHADER); g2.shaderSource(v, "#version 300 es\nvoid main(){ vec2 P[3]=vec2[3](vec2(-1.0,-1.0),vec2(1.0,-1.0),vec2(-1.0,1.0)); gl_Position=vec4(P[gl_VertexID],0,1);} "); g2.compileShader(v);
      const f = g2.createShader(g2.FRAGMENT_SHADER); g2.shaderSource(f, "#version 300 es\nprecision highp float; out vec4 c; void main(){ c = vec4(5.0/255.0, 0, 0, 1);} "); g2.compileShader(f);
      const pr = g2.createProgram(); g2.attachShader(pr, v); g2.attachShader(pr, f); g2.linkProgram(pr); g2.useProgram(pr);
      g2.bindVertexArray(g2.createVertexArray());
      g2.clearColor(0, 0, 0, 1); g2.clear(g2.COLOR_BUFFER_BIT);
      g2.drawArrays(g2.TRIANGLES, 0, 3);   // triángulo con la hipotenusa en diagonal: píxeles de borde parciales
      const todo = new Uint8Array(64 * 64 * 4); g2.readPixels(0, 0, 64, 64, g2.RGBA, g2.UNSIGNED_BYTE, todo);
      const valores = new Set(); for (let i = 0; i < todo.length; i += 4) valores.add(todo[i]);
      return { samples: g2.getParameter(g2.SAMPLES), distintos: [...valores].sort((a, b) => a - b) };
    };
    out.pickingMSAA = probar({ alpha: false });
    out.pickingSinMSAA = probar({ alpha: false, antialias: false });

    // 5.7.3: ¿se ve de verdad el halo oscuro con el sprite del ejercicio (estrella con shadowBlur 4) y con un borde duro?
    const halo = (blur, premul) => {
      const cv = document.createElement("canvas"); cv.width = 400; cv.height = 200;
      const g3 = cv.getContext("webgl2", { alpha: false, antialias: false });
      const sp = document.createElement("canvas"); sp.width = sp.height = 32; const c2 = sp.getContext("2d");
      c2.fillStyle = "#fff"; c2.shadowColor = "#fff"; c2.shadowBlur = blur;
      c2.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 12; c2.lineTo(16 + r * Math.cos(a), 16 + r * Math.sin(a)); } c2.fill();
      const v = g3.createShader(g3.VERTEX_SHADER); g3.shaderSource(v, "#version 300 es\nout vec2 uv; void main(){ vec2 P[4]=vec2[4](vec2(0,0),vec2(1,0),vec2(0,1),vec2(1,1)); uv=P[gl_VertexID]; gl_Position=vec4((P[gl_VertexID]*1.6-0.8)*vec2(0.5,1.0),0,1);} "); g3.compileShader(v);
      const f = g3.createShader(g3.FRAGMENT_SHADER); g3.shaderSource(f, "#version 300 es\nprecision highp float; uniform sampler2D t; in vec2 uv; out vec4 c; void main(){ c = texture(t, uv);} "); g3.compileShader(f);
      const pr = g3.createProgram(); g3.attachShader(pr, v); g3.attachShader(pr, f); g3.linkProgram(pr); g3.useProgram(pr);
      const t = g3.createTexture(); g3.bindTexture(g3.TEXTURE_2D, t);
      g3.pixelStorei(g3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
      g3.texImage2D(g3.TEXTURE_2D, 0, g3.RGBA, g3.RGBA, g3.UNSIGNED_BYTE, sp);
      g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_MIN_FILTER, g3.LINEAR); g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_MAG_FILTER, g3.LINEAR);
      g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_WRAP_S, g3.CLAMP_TO_EDGE); g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_WRAP_T, g3.CLAMP_TO_EDGE);
      g3.viewport(0, 0, 400, 200); g3.clearColor(0.95, 0.85, 0.55, 1); g3.clear(g3.COLOR_BUFFER_BIT);
      g3.bindVertexArray(g3.createVertexArray()); g3.enable(g3.BLEND);
      g3.blendFunc(premul ? g3.ONE : g3.SRC_ALPHA, g3.ONE_MINUS_SRC_ALPHA);
      g3.drawArrays(g3.TRIANGLE_STRIP, 0, 4);
      const all = new Uint8Array(400 * 200 * 4); g3.readPixels(0, 0, 400, 200, g3.RGBA, g3.UNSIGNED_BYTE, all);
      let minR = 255, minB = 255; for (let i = 0; i < all.length; i += 4) { minR = Math.min(minR, all[i]); minB = Math.min(minB, all[i + 2]); }
      return { minR, minB };
    };
    out.halo = { blur4_directo: halo(4, false), blur4_premul: halo(4, true), blur0_directo: halo(0, false), blur0_premul: halo(0, true), bgR: Math.round(0.95 * 255), bgB: Math.round(0.55 * 255) };
    await new Promise((r) => setTimeout(r, 500));
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log("MENSAJES DE CONSOLA:", mensajes);
} finally { await browser.close(); }
