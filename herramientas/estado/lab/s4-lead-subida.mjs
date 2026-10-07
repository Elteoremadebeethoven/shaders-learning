// Sesión 4, lead (§3.2): 5.9 dice «subir 1 000 000 de instancias de 8 bytes (8 MB) en cada frame costaba unos 0,64 ms
// de JavaScript por frame, sin bajar de 60 fps». Sabiendo que en headless el rAF no espera a la GPU
// (s4-lead-instancing.mjs), se repite en un Chrome CON VENTANA (perfil temporal de puppeteer): lienzo de 1472 × 534
// (el de las demos de 5.9 con DPR 2), la flecha de 3 vértices de la demo «Instancias actualizadas cada frame» con escala
// 0.028, 1 M de instancias de 8 bytes (un vec2) que se suben enteras con bufferSubData en cada frame.
// Mide: fps, ms de JS de bufferSubData y ms de JS del frame; también sin subir (solo dibujar), para comparar.
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-subida.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const PAGINA = `<!doctype html><body style="margin:0;background:#000">
<canvas id="c" width="1472" height="534" style="width:736px;height:267px"></canvas>
<script>
const gl = document.getElementById('c').getContext('webgl2');
function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
const p = gl.createProgram();
gl.attachShader(p, sh(gl.VERTEX_SHADER, \`#version 300 es
layout(location = 0) in vec2 a_forma;
layout(location = 1) in vec2 a_pos;
uniform float u_aspecto;
void main() { vec2 q = a_pos + a_forma * 0.028; gl_Position = vec4(q.x * u_aspecto, q.y, 0.0, 1.0); }\`));
gl.attachShader(p, sh(gl.FRAGMENT_SHADER, \`#version 300 es
precision mediump float; out vec4 color; void main() { color = vec4(0.4, 0.6, 1.0, 1.0); }\`));
gl.linkProgram(p); gl.useProgram(p);
gl.uniform1f(gl.getUniformLocation(p, 'u_aspecto'), 534 / 1472);
const N = 1000000, A = 1472 / 534;
const pos = new Float32Array(N * 2);
for (let i = 0; i < N; i++) { pos[i * 2] = (Math.random() * 2 - 1) * A; pos[i * 2 + 1] = Math.random() * 2 - 1; }
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, -0.7, 0.5, -0.7, -0.5]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const bi = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bi); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
window.subir = true;
window.medidas = [];
let frames = 0, msSubida = 0, msFrame = 0, t0 = performance.now();
function frame() {
  const ini = performance.now();
  if (window.subir) {
    pos[0] += 1e-6;                                   // «cambia» algo, como una simulación
    gl.bindBuffer(gl.ARRAY_BUFFER, bi);
    const s0 = performance.now();
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);        // 8 MB
    msSubida += performance.now() - s0;
  }
  gl.clearColor(0.04, 0.05, 0.08, 1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, N);
  msFrame += performance.now() - ini; frames++;
  const t = performance.now();
  if (t - t0 > 1000) { window.medidas.push({ subir: window.subir, fps: frames * 1000 / (t - t0), subida: msSubida / frames, frame: msFrame / frames }); frames = 0; msSubida = 0; msFrame = 0; t0 = t; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script></body>`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: false, protocolTimeout: 300000, defaultViewport: null,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--window-size=900,500"],
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.setContent(PAGINA);
  for (const subir of [true, false, true]) {
    await page.evaluate((s) => { window.subir = s; window.medidas = []; }, subir);
    await dormir(6500);
    const m = await page.evaluate(() => window.medidas.slice(1));
    console.log(subir ? "subiendo 8 MB por frame:" : "solo dibujar:          ",
      m.map((x) => `${x.fps.toFixed(0)} fps · bufferSubData ${x.subida.toFixed(2)} ms · frame ${x.frame.toFixed(2)} ms`).join(" | "));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
