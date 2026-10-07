// s5-sonnet-claims.mjs — comprobaciones de afirmaciones de m5 (Apple M1, Chrome, ANGLE/Metal).
// Uso: node turnos.mjs --agente sonnet --motivo "..." -- node estado/lab/s5-sonnet-claims.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";

const SCRATCH = "/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/s5/sonnet";
const GLKIT = "/Users/alex/Projects/shaders/assets/js/glkit.js";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  headless: "new",
});
const out = {};
try {
  // ---------- Página A: afirmaciones de 5.1, 5.2, 5.9 ----------
  const htmlA = `<!doctype html><meta charset=utf-8><body><canvas id=c width=64 height=64></canvas>
<iframe id=f sandbox="allow-scripts" srcdoc="<script>parent.postMessage({pp:document.createElement('canvas').getContext('webgl2').getContextAttributes().powerPreference, pp2:document.createElement('canvas').getContext('webgl2',{powerPreference:'high-performance'}).getContextAttributes().powerPreference},'*')<\\/script>"></iframe>
</body>`;
  const fA = path.join(SCRATCH, "claims-A.html");
  fs.writeFileSync(fA, htmlA);
  const page = await browser.newPage();
  const msgs = [];
  page.on("console", (m) => msgs.push(m.text()));
  await page.evaluateOnNewDocument(() => { window.__pp = null; window.addEventListener("message", (e) => { window.__pp = e.data; }); });
  await page.goto("file://" + fA);
  await new Promise((r) => setTimeout(r, 800));
  out.A = await page.evaluate(async () => {
    const r = {};
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2");
    // 5.1: clearColor sin recorte
    gl.clearColor(2, -1, 0.5, 1);
    r.clearColorGuardado = Array.from(gl.getParameter(gl.COLOR_CLEAR_VALUE));
    gl.clear(gl.COLOR_BUFFER_BIT);
    const px = new Uint8Array(4); gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); r.clearPixel = Array.from(px);
    // 5.1: viewport inicial y tras redimensionar
    r.viewportInicial = Array.from(gl.getParameter(gl.VIEWPORT));
    // mismo valor de width no borra
    gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    c.width = c.width;   // mismo valor
    gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); r.trasMismoWidth = Array.from(px);
    c.width = 100;       // otro valor
    gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); r.trasOtroWidth = Array.from(px);
    r.viewportTrasResize = Array.from(gl.getParameter(gl.VIEWPORT));
    r.drawingBuffer = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    // 5.9: extensión de base instance
    const sup = gl.getSupportedExtensions();
    r.baseInstance = sup.filter((e) => /base_instance|multi_draw/.test(e));
    r.nExtensiones = sup.length;
    // 5.1: powerPreference en página normal
    const g2 = document.createElement("canvas").getContext("webgl2");
    r.ppPaginaDefault = g2.getContextAttributes().powerPreference;
    const g3 = document.createElement("canvas").getContext("webgl2", { powerPreference: "high-performance" });
    r.ppPaginaHigh = g3.getContextAttributes().powerPreference;
    r.ppIframe = window.__pp;
    // 5.2: 40 programas, comprobando cada paso frente a comprobar solo al final
    const nProg = 40;
    const fuenteVS = (k) => `#version 300 es\nvoid main(){ float k=${k}.0+${Math.random()}; gl_Position=vec4(k*0.0001,0.0,0.0,1.0); }`;
    const fuenteFS = (k) => `#version 300 es\nprecision highp float; out vec4 c; void main(){ float k=${k}.0+${Math.random()}; c=vec4(k*0.0001,0.0,0.0,1.0); }`;
    function creaPaso(k, comprobar) {
      const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, fuenteVS(k)); gl.compileShader(vs);
      if (comprobar && !gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error("vs");
      const fs = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(fs, fuenteFS(k)); gl.compileShader(fs);
      if (comprobar && !gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error("fs");
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      if (comprobar && !gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link");
      return p;
    }
    const tandas = [];
    for (let rep = 0; rep < 3; rep++) {
      let t0 = performance.now();
      const ps1 = []; for (let i = 0; i < nProg; i++) ps1.push(creaPaso(rep * 1000 + i, true));
      const cadaPaso = performance.now() - t0;
      t0 = performance.now();
      const ps2 = []; for (let i = 0; i < nProg; i++) ps2.push(creaPaso(rep * 1000 + 500 + i, false));
      const encolar = performance.now() - t0;
      for (const p of ps2) if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link2");
      const alFinal = performance.now() - t0;
      tandas.push({ cadaPaso: +cadaPaso.toFixed(0), alFinal: +alFinal.toFixed(0), encolar: +encolar.toFixed(1) });
      for (const p of ps1.concat(ps2)) gl.deleteProgram(p);
    }
    r.compilar40 = tandas;
    return r;
  });
  out.consola = msgs.slice(0, 20);
  await page.close();

  // ---------- Página B: 5.10.5, JS por frame desordenado frente a ordenado ----------
  const htmlB = `<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c style="width:100vw;height:100vh;display:block"></canvas>
<script src="file://${GLKIT}"></script>
<script>
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl2', { alpha: false });
const VS = \`#version 300 es
uniform vec2 u_pos;
uniform float u_aspecto;
out vec2 v_local;
void main() {
  vec2 P[6] = vec2[6](vec2(-1, -1), vec2(1, -1), vec2(-1, 1), vec2(-1, 1), vec2(1, -1), vec2(1, 1));
  v_local = P[gl_VertexID];
  gl_Position = vec4(u_pos + P[gl_VertexID] * 0.02 * vec2(u_aspecto, 1.0), 0.0, 1.0);
}\`;
const progA = GLKit.crearPrograma(gl, VS, \`#version 300 es
precision highp float;
in vec2 v_local;
out vec4 color;
void main() { if (length(v_local) > 1.0) discard; color = vec4(1.0, 0.55, 0.3, 1.0); }\`);
const progB = GLKit.crearPrograma(gl, VS, \`#version 300 es
precision highp float;
in vec2 v_local;
out vec4 color;
void main() { if (abs(v_local.x) + abs(v_local.y) > 1.0) discard; color = vec4(0.3, 0.75, 1.0, 1.0); }\`);
const N = 24000;
const base = [];
for (let i = 0; i < N; i++) base.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, tipo: Math.random() < 0.5 ? 'A' : 'B' });
const loc = { A: { pos: gl.getUniformLocation(progA, 'u_pos'), aspecto: gl.getUniformLocation(progA, 'u_aspecto') },
              B: { pos: gl.getUniformLocation(progB, 'u_pos'), aspecto: gl.getUniformLocation(progB, 'u_aspecto') } };
const prog = { A: progA, B: progB };
gl.bindVertexArray(gl.createVertexArray());
window.medir = (ordenar, nFrames) => new Promise((resolve) => {
  const figuras = base.slice();
  if (ordenar) figuras.sort((a, b) => (a.tipo < b.tipo ? -1 : a.tipo > b.tipo ? 1 : 0));
  let f = 0, ms = [], t0 = performance.now(), cambios = 0, ts = [];
  function frame(t) {
    const inicio = performance.now();
    GLKit.ajustarTamaño(canvas);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.06, 0.07, 0.1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const aspecto = gl.drawingBufferHeight / gl.drawingBufferWidth;
    let actual = null; cambios = 0;
    for (const fig of figuras) {
      if (fig.tipo !== actual) { actual = fig.tipo; gl.useProgram(prog[actual]); gl.uniform1f(loc[actual].aspecto, aspecto); cambios++; }
      gl.uniform2f(loc[actual].pos, fig.x, fig.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    ms.push(performance.now() - inicio); ts.push(t);
    if (++f < nFrames) requestAnimationFrame(frame);
    else {
      // espera explicita a la GPU para el tiempo real de pasada: un readPixels
      const px = new Uint8Array(4); const a = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const espera = performance.now() - a;
      const util = ms.slice(30).sort((a, b) => a - b);
      const dts = ts.slice(31).map((v, i) => v - ts[30 + i]);
      resolve({ cambios, msJSmediana: +util[util.length >> 1].toFixed(2), msJSmedia: +(util.reduce((a, b) => a + b, 0) / util.length).toFixed(2),
                fps: +(1000 / (dts.reduce((a, b) => a + b, 0) / dts.length)).toFixed(1), esperaFinalGPU_ms: +espera.toFixed(2),
                ancho: gl.drawingBufferWidth, alto: gl.drawingBufferHeight });
    }
  }
  requestAnimationFrame(frame);
});
</script>`;
  const fB = path.join(SCRATCH, "claims-B.html");
  fs.writeFileSync(fB, htmlB);
  const pb = await browser.newPage();
  await pb.setViewport({ width: 900, height: 450, deviceScaleFactor: 1 });
  pb.on("pageerror", (e) => msgs.push("pageerror " + e.message));
  await pb.goto("file://" + fB);
  await new Promise((r) => setTimeout(r, 500));
  out.B = {};
  out.B.desordenado1 = await pb.evaluate(() => window.medir(false, 150));
  out.B.ordenado1 = await pb.evaluate(() => window.medir(true, 150));
  out.B.desordenado2 = await pb.evaluate(() => window.medir(false, 150));
  out.B.ordenado2 = await pb.evaluate(() => window.medir(true, 150));
  await pb.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
