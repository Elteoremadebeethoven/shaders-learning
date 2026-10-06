import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const URL = "file://" + process.cwd() + "/rev-m7-1-vacia.html";
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  protocolTimeout: 60000, args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  const page = await browser.newPage();
  console.log("lanzado");
  const consola = [];
  page.on("console", (m) => consola.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
  await page.setViewport({ width: 900, height: 700 });
  await page.goto(URL);
  page.setDefaultTimeout(60000);
  const r = await page.evaluate(async () => {
    const out = {};
    const c0 = document.createElement("canvas");
    const g0 = c0.getContext("webgl2", { desynchronized: true });
    out.desync = g0.getContextAttributes().desynchronized;
    out.renderer = g0.getParameter(g0.RENDERER);
    out.parallel = !!g0.getExtension("KHR_parallel_shader_compile");
    out.timer = !!g0.getExtension("EXT_disjoint_timer_query_webgl2");
    function compilar(gl, src) {
      const s = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(s, src); gl.compileShader(s);
      return (gl.getShaderParameter(s, gl.COMPILE_STATUS) ? "OK " : "FALLA ") + (gl.getShaderInfoLog(s) || "").trim();
    }
    const gl = g0;
    out.defineDelante = compilar(gl, "#define OCTAVAS 5\n#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1.0); }");
    const ROTO = "#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() {\n  float x = 1.0;\n  fragColor = vec4(x, y, 0.0, 1.0);\n}";
    const sinLine = ROTO.replace("\n", "\n#define A 1\n#define B 2\n#define C 3\n");
    out.sinLine = compilar(gl, sinLine);
    out.conLine = compilar(gl, ROTO.replace("\n", "\n#define A 1\n#define B 2\n#define C 3\n#line 2\n"));
    out.line17 = compilar(gl, "#version 300 es\n#line 1 7\nprecision highp float;\nout vec4 c;\nvoid main() {\n  float x = 1.0;\n  c = vec4(y);\n}");
    out.line17sin = compilar(gl, "#version 300 es\nprecision highp float;\nout vec4 c;\nvoid main() {\n  float x = 1.0;\n  c = vec4(y);\n}");
    out.radio = compilar(gl, "#version 300 es\n#define RADIO 2\nprecision highp float;\nout vec4 c;\nvoid main() { float r = RADIO * 0.5; c = vec4(r); }");
    out.radio2 = compilar(gl, "#version 300 es\n#define RADIO 2\nprecision highp float;\nout vec4 c;\nvoid main() { float r = RADIO; c = vec4(r); }");
    out.radio25 = compilar(gl, "#version 300 es\n#define RADIO 2.5\nprecision highp float;\nout vec4 c;\nvoid main() { float r = RADIO * 0.5; c = vec4(r); }");
    out.flot = compilar(gl, "#version 300 es\nprecision highp float;\nout vec4 c;\nvoid main() { float f = 1e+21 + 1e-7; c = vec4(f); }");

    // ---- pérdida de contexto ----
    const cv = document.getElementById("c");
    const g = cv.getContext("webgl2");
    const VS = "#version 300 es\nvoid main(){ vec2 P[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3)); gl_Position=vec4(P[gl_VertexID],0,1);}";
    const FS = "#version 300 es\nprecision highp float;\nuniform vec4 u_c;\nout vec4 o;\nvoid main(){ o = u_c; }";
    function prog() {
      const v = g.createShader(g.VERTEX_SHADER); g.shaderSource(v, VS); g.compileShader(v);
      const f = g.createShader(g.FRAGMENT_SHADER); g.shaderSource(f, FS); g.compileShader(f);
      const p = g.createProgram(); g.attachShader(p, v); g.attachShader(p, f); g.linkProgram(p); return p;
    }
    const ext = g.getExtension("WEBGL_lose_context");
    const P = prog(); const loc = g.getUniformLocation(P, "u_c"); const vao = g.createVertexArray();
    g.useProgram(P); g.uniform4f(loc, 1, 0, 0, 1); g.bindVertexArray(vao); g.drawArrays(g.TRIANGLES, 0, 3);
    const px = new Uint8Array(4); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); out.antes = [...px];
    const ev = [];
    cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); ev.push("lost"); });
    const restaurado = new Promise((res) => { cv.addEventListener("webglcontextrestored", () => { ev.push("restored"); res(); }); setTimeout(() => { ev.push("TIMEOUT restored"); res(); }, 5000); });
    ext.loseContext();
    out.isLost = g.isContextLost();
    out.extDuranteLost = g.getExtension("WEBGL_lose_context");
    out.err1 = g.getError().toString(16); out.err2 = g.getError().toString(16);
    g.useProgram(P); g.uniform4f(loc, 0, 1, 0, 1); out.errTrasLlamadasLost = g.getError().toString(16);
    out.eventosTrasLose = ev.slice();
    await new Promise((r) => setTimeout(r, 50));
    out.eventosTrasEspera = ev.slice();
    ext.restoreContext();
    await restaurado;
    out.eventos = ev.slice(); out.isProgramViejo = g.isProgram(P);
    const P2 = prog(); const loc2 = g.getUniformLocation(P2, "u_c"); const vao2 = g.createVertexArray();
    g.useProgram(P2); g.uniform4f(loc, 0, 0, 1, 1);
    out.errUniformViejo = g.getError().toString(16);
    g.bindVertexArray(vao2); g.drawArrays(g.TRIANGLES, 0, 3);
    g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); out.despues = [...px];
    g.useProgram(P); out.errUseProgramViejo = g.getError().toString(16);
    // la extensión pedida al principio sigue sirviendo
    const restaurado2 = new Promise((res) => { cv.addEventListener("webglcontextrestored", res, { once: true }); setTimeout(res, 5000); });
    try { ext.loseContext(); out.extSirve = g.isContextLost(); ext.restoreContext(); await restaurado2; out.extSirve2 = !g.isContextLost(); } catch (e) { out.extSirve = "excepción " + e.message; }
    // ---- getContext 2d y luego webgl2 ----
    const c2 = document.createElement("canvas"); c2.getContext("2d");
    let creErr = null; c2.addEventListener("webglcontextcreationerror", (e) => creErr = e.statusMessage);
    out.dosTipos = c2.getContext("webgl2"); out.dosTiposEvento = creErr;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  // ---- orden de eventos: resize / rAF / ResizeObserver ----
  await page.evaluate(() => {
    window.__orden = [];
    const cv = document.getElementById("c");
    let f = 0;
    (function bucle(t) { window.__orden.push("raf#" + (++f)); requestAnimationFrame(bucle); })();
    addEventListener("resize", () => window.__orden.push("resize@" + f));
    new ResizeObserver(() => window.__orden.push("ro@" + f)).observe(cv);
  });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => { window.__orden.push("---"); });
  await page.setViewport({ width: 800, height: 700 });
  await new Promise((r) => setTimeout(r, 300));
  const orden = await page.evaluate(() => window.__orden.slice(window.__orden.indexOf("---") - 2, window.__orden.indexOf("---") + 12));
  console.log("orden:", orden.join(" "));
  // ---- caché de programas: misma fuente dos veces ----
  const cache = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const VS = "#version 300 es\nvoid main(){ gl_Position = vec4(0.0,0.0,0.0,1.0); }";
    let cuerpo = "";
    for (let i = 0; i < 400; i++) cuerpo += "  a += sin(p.x * " + (i + 1) + ".0 + float(" + i + ")) * cos(p.y * " + (i % 7 + 1) + ".3);\n";
    function medir(fs) {
      const t0 = performance.now();
      const v = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(v, VS); gl.compileShader(v);
      const f = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(f, fs); gl.compileShader(f);
      const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      const ok = gl.getProgramParameter(p, gl.LINK_STATUS);
      const ms = performance.now() - t0;
      gl.deleteProgram(p); gl.deleteShader(v); gl.deleteShader(f);
      return ms.toFixed(1) + (ok ? "" : " (FALLA)");
    }
    const fuente = (tag) => "#version 300 es\nprecision highp float;\nout vec4 o;\n// " + tag + "\nvoid main(){ vec2 p = gl_FragCoord.xy; float a = 0.0;\n" + cuerpo + " o = vec4(a); }";
    const tag = "x" + Math.random();
    return { primera: medir(fuente(tag)), misma: medir(fuente(tag)), misma2: medir(fuente(tag)), otra: medir(fuente(tag + "y")) };
  });
  console.log("cache:", JSON.stringify(cache));
  console.log("CONSOLA:\n" + consola.join("\n"));
} finally { await browser.close(); }
