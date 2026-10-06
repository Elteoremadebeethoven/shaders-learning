// ¿Se conserva el efecto de isnan (sin fast math) cuando el programa sale de la caché de shaders?
// Chrome headless, GPU real (ANGLE/Metal, Apple M1). Un solo Chrome a la vez (puppeteer parcheado).
// Uso: node rev-m6b-cache.mjs
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const S = "/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/experimentos/rev-m6b/";
const PERFIL = S + "perfil-cache-" + Date.now();
const PAG = S + "cache.html";
fs.writeFileSync(PAG, `<!doctype html><canvas id=c width=8 height=8></canvas><script>
const gl = document.getElementById('c').getContext('webgl2', {antialias:false, alpha:false});
gl.getExtension('EXT_color_buffer_float');
const vs = '#version 300 es\\nin vec2 a; void main(){ gl_Position = vec4(a,0,1); }';
const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
function render(fs, w, h, unif) {
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); const f = sh(gl.FRAGMENT_SHADER, fs); gl.attachShader(p, f);
  gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return { error: gl.getShaderInfoLog(f) + gl.getProgramInfoLog(p) };
  gl.useProgram(p);
  for (const [k, v] of Object.entries(unif || {})) gl.uniform1f(gl.getUniformLocation(p, k), v);
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLES, 0, 3);
  const buf = new Float32Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, buf);
  gl.deleteFramebuffer(fb); gl.deleteTexture(t); gl.deleteProgram(p);
  return { buf };
}
const cab = (tag) => '#version 300 es\\nprecision highp float;\\n// ' + tag + '\\nuniform float u_cero; uniform float u_x0; out vec4 o;\\n';
const seno = 'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\\n';
window.medirSeno = (tag, conIsnan) => {
  const fs = cab(tag) + seno + 'void main(){ vec2 c = floor(gl_FragCoord.xy / 4.0) + 20000.0; o = vec4(h(c), 0, 0, 1); ' + (conIsnan ? 'if (isnan(u_cero)) o = vec4(1.0);' : '') + ' }';
  const r = render(fs, 512, 512, { u_cero: 0 });
  if (r.error) return r.error;
  const s = new Set(); for (let i = 0; i < 512 * 512; i++) s.add(r.buf[i * 4].toFixed(4));
  return s.size;
};
window.medirMod = (tag, conIsnan) => {
  const fs = cab(tag) + 'void main(){ float x = u_x0 + floor(gl_FragCoord.x) + 1024.0 * floor(gl_FragCoord.y); o = vec4(mod(x, 7.0), 0, 0, 1); ' + (conIsnan ? 'if (isnan(u_cero)) o = vec4(1.0);' : '') + ' }';
  const r = render(fs, 1024, 1024, { u_cero: 0, u_x0: -524288 });
  if (r.error) return r.error;
  let n = 0; for (let i = 0; i < 1048576; i++) { const v = r.buf[i * 4]; if (!(v >= 0 && v < 7)) n++; }
  return n;
};
</script>`);

async function sesion(nombre, perfil, pasos) {
  const opciones = { executablePath: CHROME, headless: "new", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] };
  if (perfil) opciones.userDataDir = perfil;
  const nav = await puppeteer.launch(opciones);
  try {
    const page = await nav.newPage();
    await page.goto("file://" + PAG);
    for (const p of pasos) {
      if (p === "recargar") { await page.reload(); console.log(nombre, "  (página recargada)"); continue; }
      const [fn, tag, nan] = p;
      const r = await page.evaluate((fn, tag, nan) => window[fn](tag, nan), fn, tag, nan);
      console.log(nombre, fn.padEnd(10), ("tag=" + tag).padEnd(12), nan ? "con isnan" : "sin isnan", "→", r);
    }
  } finally { await nav.close(); }
}
// Referencia: seno a 20000 celdas → ~17 valores distintos con fast math; ~2000 sin fast math.
//             mod(x, 7) en ±524288 → 43682 fallos con la división rápida; 0 con la precisa (si la hay).
const pasos1 = [
  ["medirSeno", "A", false], ["medirSeno", "B", true], ["medirSeno", "B", true], ["medirSeno", "C", true],
  ["medirMod", "A", false], ["medirMod", "B", true], ["medirMod", "B", true], ["medirMod", "C", true],
  "recargar",
  ["medirSeno", "B", true], ["medirSeno", "D", true], ["medirMod", "B", true], ["medirMod", "D", true],
];
await sesion("S1 (perfil nuevo persistente)", PERFIL, pasos1);
await sesion("S2 (mismo perfil, relanzado)", PERFIL, [["medirSeno", "B", true], ["medirSeno", "E", true], ["medirMod", "B", true], ["medirMod", "E", true]]);
console.log("perfil:", PERFIL);
