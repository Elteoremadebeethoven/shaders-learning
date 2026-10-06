// Laboratorio de tiempos de GPU para la lección 7.1 (y la cifra de 5.10 que cita).
// Método fiable en la GPU de teselas del M1 (PLAN §4, GUIA §5.6): cada dibujo en su propia pasada
// (dos FBO alternos con clear al empezar), readPixels al final de cada tanda, mediana de varias tandas.
//
// Uso (en el Mac del curso, desde herramientas/):
//   node estado/lab/rev-m7-1-tiempos.mjs            → medida completa (Chrome real, ANGLE/Metal)
//   node estado/lab/rev-m7-1-tiempos.mjs --rapido   → prueba de humo (tamaños /8, pocas iteraciones)
//
// Qué mide y para qué:
//   A) El shader del laboratorio de 5.10 (ejemplo 5.10.5) a 800×500, 1600×1000 y 2400×1500
//      (el canvas con DPR 1, 2 y 3). 5.10 dice 5,1 / 16,7 / 35,9 ms (×7 entre DPR 1 y 3), y 7.1
//      repite ese «×7». El 16,7 huele a vsync: hay que re-medirlo.
//   B) El shader del ejemplo 7.1.7 con ITERACIONES = 1500 a 1440×900, 1080×675 y 720×450.
//      7.1 da los intervalos entre frames medidos con rAF (66,7 / 33,3 / 16,7 ms): el tiempo de GPU
//      debería caer entre los múltiplos de 16,7 que expliquen esos intervalos.
//   C) El mismo shader con 2500 iteraciones a 543×339 y 639×399 (la oscilación del bestiario
//      m7-calidad-oscila: el primero debería caber en 16,7 ms y el segundo no).
import fs from "node:fs";
const { default: puppeteer } = await import(new URL("../../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js", import.meta.url));

const RAPIDO = process.argv.includes("--rapido");
const MAC = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const enMac = fs.existsSync(MAC);
const CHROME = enMac ? MAC : "/opt/pw-browsers/chromium";
const ARGS = enMac ? ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
  : ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

const FS_510 = `#version 300 es
precision highp float;
uniform vec2 u_resolucion;
uniform float u_t;
uniform int u_n;
out vec4 color;
void main() {
  vec2 p = gl_FragCoord.xy / u_resolucion.y;
  float s = 0.0;
  for (int i = 0; i < u_n; i++) s += sin(p.x * (2.0 + float(i) * 0.03) + u_t) * cos(p.y * 3.0 + float(i) * 0.07);
  float k = u_n > 0 ? 4.0 / float(u_n) : 0.0;
  color = vec4(0.5 + 0.4 * sin(s * k + vec3(0.0, 2.0, 4.0)), 1.0) * 0.6;
}`;
const FS_717 = (n) => `#version 300 es
#define ITERACIONES ${n}
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
out vec4 fragColor;
void main() {
  vec2 p = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  float a = 0.0;
  for (int i = 0; i < ITERACIONES; i++) {
    float k = 6.2831853 * float(i) / float(ITERACIONES);
    vec2 c = 0.45 * vec2(cos(u_time * 0.7 + k), sin(u_time * 0.9 + 2.0 * k));
    a += sin(length(p - c) * 9.0 - u_time * 2.0);
  }
  a /= float(ITERACIONES);
  vec3 col = 0.5 + 0.5 * cos(3.0 * a + vec3(0.0, 0.8, 1.6) + 3.0);
  fragColor = vec4(col * col, 1.0);
}`;

function montar() {
  const c = document.createElement("canvas");
  const gl = c.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  const VS = "#version 300 es\nvoid main(){ vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0)); gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }";
  const vao = gl.createVertexArray();
  let uid = 0;
  window.__medir = (t) => {
    // comentario único: que la caché de programas no influya
    const fsSrc = t.fs.replace("\n", "\n// uid " + Math.random() + " " + uid++ + "\n");
    const sh = (tipo, s) => { const x = gl.createShader(tipo); gl.shaderSource(x, s); gl.compileShader(x); return x; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fsSrc)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return { ok: false, log: gl.getProgramInfoLog(p) };
    gl.useProgram(p);
    for (const [k, v] of Object.entries(t.uniforms || {})) {
      const loc = gl.getUniformLocation(p, k); if (!loc) continue;
      if (Array.isArray(v)) gl.uniform2fv(loc, v); else if (Number.isInteger(v) && k === "u_n") gl.uniform1i(loc, v); else gl.uniform1f(loc, v);
    }
    const { w, h } = t, fbs = [], texs = [];
    for (let k = 0; k < 2; k++) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      fbs.push(fb); texs.push(tex);
    }
    gl.viewport(0, 0, w, h); gl.bindVertexArray(vao);
    const px = new Uint8Array(4);
    const pasada = (i) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[i % 2]); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    for (let i = 0; i < 3; i++) pasada(i);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);           // calentamiento (y estreno del pipeline, 4.1)
    const res = [];
    for (let k = 0; k < t.tandas; k++) {
      const t0 = performance.now();
      for (let i = 0; i < t.reps; i++) pasada(i);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      res.push((performance.now() - t0) / t.reps);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbs.forEach((f) => gl.deleteFramebuffer(f)); texs.forEach((x) => gl.deleteTexture(x)); gl.deleteProgram(p);
    res.sort((a, b) => a - b);
    return { ok: true, ms: res[Math.floor(res.length / 2)], min: res[0], max: res[res.length - 1] };
  };
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", protocolTimeout: 600000, args: ARGS });
try {
  const page = await nav.newPage();
  await page.setContent("<!doctype html><html><body></body></html>");
  const gpu = await page.evaluate(montar);
  console.log("GPU:", gpu, RAPIDO ? "(modo --rapido: tamaños /8, iteraciones /10)" : "");
  const d = RAPIDO ? 8 : 1, it = (n) => (RAPIDO ? Math.max(1, Math.round(n / 10)) : n);
  const reps = RAPIDO ? 3 : 8, tandas = RAPIDO ? 3 : 7;
  const casos = [];
  for (const n of [60, 300]) for (const [w, h, dpr] of [[800, 500, 1], [1600, 1000, 2], [2400, 1500, 3]])
    casos.push({ grupo: "A 5.10 u_n=" + n + " DPR " + dpr, fs: FS_510, w: w / d | 0, h: h / d | 0, uniforms: { u_resolucion: [w / d, h / d], u_t: 1.0, u_n: it(n) } });
  for (const [w, h, e] of [[1440, 900, "1"], [1080, 675, "0,75"], [720, 450, "0,5"]])
    casos.push({ grupo: "B 7.1.7 ×1500 escala " + e, fs: FS_717(it(1500)), w: w / d | 0, h: h / d | 0, uniforms: { u_resolution: [w / d, h / d], u_time: 1.0 } });
  for (const [w, h] of [[543, 339], [639, 399], [1440, 900]])
    casos.push({ grupo: "C 7.1.7 ×2500", fs: FS_717(it(2500)), w: Math.max(1, w / d | 0), h: Math.max(1, h / d | 0), uniforms: { u_resolution: [w / d, h / d], u_time: 1.0 } });
  for (const c of casos) {
    const r = await page.evaluate((t) => window.__medir(t), { ...c, reps, tandas });
    console.log(c.grupo.padEnd(28), (c.w + "×" + c.h).padEnd(11), r.ok ? `${r.ms.toFixed(2)} ms (mín ${r.min.toFixed(2)}, máx ${r.max.toFixed(2)})` : "FALLO " + r.log);
  }
} finally { await nav.close(); }
