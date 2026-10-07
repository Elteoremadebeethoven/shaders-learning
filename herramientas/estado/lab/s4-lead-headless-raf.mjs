// Sesión 4, lead (§3.2): en headless, 4 M de instancias de la demo de 5.9 iban a «60 fps» con 73 ms de GPU por frame
// (s4-lead-instancing.mjs), pero 7.1 y 7.5 vieron en headless que la GPU sí frenaba el bucle. ¿Cuándo espera el rAF de
// headless a la GPU? Mismo lienzo (1472 × 534), dos cargas de unos 40–70 ms de GPU por frame:
//   V  vértices: 4 M de cuadrados instanciados (24 M de vértices, poca superficie)
//   F  fragmentos: un triángulo que tapa el lienzo con un bucle caro por píxel
// Cada una sin y con readPixels al final del frame. Headless (por defecto) o con ventana (VENTANA=1).
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-headless-raf.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const PAGINA = `<!doctype html><body style="margin:0;background:#000">
<canvas id="c" width="1472" height="534" style="width:736px;height:267px"></canvas>
<script>
const gl = document.getElementById('c').getContext('webgl2');
function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
function prog(vs, fs) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; }
const pV = prog(\`#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { vec2 P[6] = vec2[6](vec2(-1, -1), vec2(1, -1), vec2(-1, 1), vec2(-1, 1), vec2(1, -1), vec2(1, 1));
  gl_Position = vec4(a_pos + P[gl_VertexID] * 0.008, 0.0, 1.0); }\`, \`#version 300 es
precision mediump float; out vec4 c; void main() { c = vec4(0.5, 0.7, 1.0, 1.0); }\`);
const pF = prog(\`#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }\`, \`#version 300 es
precision highp float; uniform int u_n; out vec4 c;
void main() { float a = gl_FragCoord.x * 0.001; for (int i = 0; i < u_n; i++) a = sin(a * 1.1 + float(i)); c = vec4(fract(a)); }\`);
const N = 4000000, pos = new Float32Array(N * 2);
for (let i = 0; i < N * 2; i++) pos[i] = Math.random() * 2 - 1;
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(0, 1);
const vacio = gl.createVertexArray();
gl.useProgram(pF); gl.uniform1i(gl.getUniformLocation(pF, 'u_n'), +(new URLSearchParams(location.hash.slice(1)).get('n') || 900));
window.modo = 'V'; window.sync = false; window.medidas = [];
const px = new Uint8Array(4);
let frames = 0, ms = 0, t0 = performance.now();
function frame() {
  const ini = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (window.modo === 'V') { gl.useProgram(pV); gl.bindVertexArray(vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, N); }
  else { gl.useProgram(pF); gl.bindVertexArray(vacio); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  if (window.sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  ms += performance.now() - ini; frames++;
  const t = performance.now();
  if (t - t0 > 1000) { window.medidas.push(frames * 1000 / (t - t0) + ' fps / ' + (ms / frames).toFixed(1) + ' ms'); frames = 0; ms = 0; t0 = t; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script></body>`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const VENTANA = !!process.env.VENTANA;
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: VENTANA ? false : "new", protocolTimeout: 300000, defaultViewport: VENTANA ? null : { width: 900, height: 500 },
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"].concat(VENTANA ? ["--window-size=900,500"] : []),
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.setContent(PAGINA);
  console.log(VENTANA ? "Chrome con ventana" : "Chrome headless");
  for (const [modo, sync] of [["V", false], ["V", true], ["F", false], ["F", true]]) {
    await page.evaluate((m, s) => { window.modo = m; window.sync = s; window.medidas = []; }, modo, sync);
    await dormir(5500);
    const m = await page.evaluate(() => window.medidas.slice(1).map((x) => x.replace(/^(\d+)\.\d+/, "$1")));
    console.log(`${modo === "V" ? "vértices (4 M instancias)" : "fragmentos (bucle caro) "}${sync ? " + readPixels" : "             "}:`, m.join(" | "));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
