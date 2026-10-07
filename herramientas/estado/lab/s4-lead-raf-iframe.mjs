// Sesión 4, lead: en headless, la demo de 5.9 DENTRO del iframe del playground marcaba 60 fps con 4 M de instancias
// (73 ms de GPU por frame), y la misma carga en la página principal bajaba a 14–15 fps (s4-lead-headless-raf.mjs).
// ¿Qué lo decide? El mismo dibujo (4 M de cuadrados instanciados, lienzo 1472 × 534) en tres sitios:
//   página   el lienzo en la página principal
//   iframe   un iframe srcdoc del mismo origen (mismo proceso)
//   sandbox  un iframe srcdoc con sandbox="allow-scripts" (origen opaco: otro proceso, como el playground)
// Headless por defecto; VENTANA=1 para un Chrome con ventana (perfil temporal de puppeteer).
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-raf-iframe.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const DOC0 = `<!doctype html><body style="margin:0;background:#000">
<canvas id="c" width="1472" height="534" style="width:736px;height:267px;display:block"></canvas>
<script>
const gl = document.getElementById('c').getContext('webgl2', ALFA);
function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
const p = gl.createProgram();
gl.attachShader(p, sh(gl.VERTEX_SHADER, '#version 300 es\\nlayout(location = 0) in vec2 a_pos;\\nvoid main() { vec2 P[6] = vec2[6](vec2(-1, -1), vec2(1, -1), vec2(-1, 1), vec2(-1, 1), vec2(1, -1), vec2(1, 1)); gl_Position = vec4(a_pos + P[gl_VertexID] * 0.008, 0.0, 1.0); }'));
gl.attachShader(p, sh(gl.FRAGMENT_SHADER, '#version 300 es\\nprecision mediump float; out vec4 c; void main() { c = vec4(0.5, 0.7, 1.0, 1.0); }'));
gl.linkProgram(p); gl.useProgram(p);
const N = 4000000, pos = new Float32Array(N * 2);
for (let i = 0; i < N * 2; i++) pos[i] = Math.random() * 2 - 1;
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 1);
const fps = window.__fps = [];
let frames = 0, t0 = performance.now();
function frame() {
  gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, N);
  frames++;
  const t = performance.now();
  if (t - t0 > 1000) { fps.push(Math.round(frames * 1000 / (t - t0))); frames = 0; t0 = t; if (fps.length === 5) (parent !== self ? parent : self).postMessage({ __fps: fps }, '*'); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
<\/script></body>`;
const VENTANA = !!process.env.VENTANA;
// DPR=2: emula deviceScaleFactor 2 en headless (como el laboratorio de 5.9); ALFA=0: contexto con { alpha: false } (como la demo)
const DPR = +(process.env.DPR || 1), ALFA = process.env.ALFA === "0" ? "{ alpha: false }" : "{}";
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: VENTANA ? false : "new", protocolTimeout: 300000, defaultViewport: VENTANA ? null : { width: 900, height: 500, deviceScaleFactor: DPR },
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"].concat(VENTANA ? ["--window-size=900,500"] : []),
});
try {
  const DOC = DOC0.replace("ALFA", ALFA);
  console.log(VENTANA ? "Chrome con ventana" : `Chrome headless, DPR ${DPR}, contexto ${ALFA}`);
  for (const sitio of ["página", "iframe", "sandbox"]) {
    const page = await nav.newPage();
    let r;
    if (sitio === "página") {
      await page.setContent(DOC);
      await page.waitForFunction(() => window.__fps && window.__fps.length >= 5, { timeout: 60000, polling: 500 });
      r = (await page.evaluate(() => window.__fps)).slice(1, 5);
    } else r = await page.evaluate((doc, sitio) => new Promise((ok) => {
      addEventListener("message", (e) => { if (e.data && e.data.__fps) ok(e.data.__fps.slice(1)); });
      const f = document.createElement("iframe");
      if (sitio === "sandbox") f.sandbox = "allow-scripts";
      f.style.cssText = "border:0;width:760px;height:290px";
      f.srcdoc = doc;
      document.body.appendChild(f);
    }), DOC, sitio);
    console.log(sitio.padEnd(8), "fps:", r.join(" "));
    await page.close();
  }
  console.log(await nav.version());
} finally { await nav.close(); }
