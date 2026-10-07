// Laboratorio de afirmaciones del módulo 3 (sesión 5, opus-a): resultados de GLSL en el M1 y algunas de JS/CSS.
// Uso (desde herramientas/): node turnos.mjs --agente opus-a --motivo "[m3] laboratorio" -- node estado/lab/s5-opus-a-m3-lab.mjs [salida.json]
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const salida = process.argv[2];
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 800, height: 600 },
});
const R = {};
const consola = [];
try {
  const page = await nav.newPage();
  page.on("console", (m) => consola.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
  await page.goto("file:///Users/alex/Projects/shaders/herramientas/estado/lab/s5-opus-a-m3-lab.html");
  await page.waitForFunction(() => window.listo !== undefined);
  R.renderer = await page.evaluate(() => { const e = __gl.getExtension("WEBGL_debug_renderer_info"); return e ? __gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; });
  R.ua = await page.evaluate(() => navigator.userAgent);

  // Ejecuta una prueba y devuelve el primer píxel como texto (para ver NaN, -0, Infinity)
  const px = (t) => page.evaluate((t) => {
    // reconvertir uniforms especiales
    for (const k in t.uniforms || {}) {
      const v = t.uniforms[k];
      if (v === "NaN") t.uniforms[k] = NaN; else if (v === "Inf") t.uniforms[k] = Infinity; else if (v === "-0") t.uniforms[k] = -0;
      else if (Array.isArray(v)) t.uniforms[k] = v.map((x) => x === "NaN" ? NaN : x === "Inf" ? Infinity : x === "-0" ? -0 : x);
    }
    const r = window.prueba(t);
    if (!r.ok) return { ok: false, log: r.log };
    const fmt = (x) => Object.is(x, -0) ? "-0" : String(x);
    return { ok: true, log: r.log, v: r.pix.slice(0, 4).map(fmt) };
  }, t);
  const H = "#version 300 es\nprecision highp float;\nprecision highp int;\nout vec4 o;\n";

  R.atan = await px({ fs: H + "uniform vec2 u_a; uniform float u_z;\nvoid main(){ o = vec4(atan(u_a.x, u_a.y), atan(u_z, u_z), atan(-0.0, -1.0), atan(u_a.y / u_a.y)); }", uniforms: { u_a: ["-0", -1], u_z: 0 } });
  R.sin = [];
  for (const x of [1000, 1e4, 1e6, 1e7]) {
    const r = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4(sin(u_x)); }", uniforms: { u_x: x } });
    R.sin.push({ x, gpu: +r.v[0], exacto: Math.sin(Math.fround(x)), error: Math.abs(+r.v[0] - Math.sin(Math.fround(x))) });
  }
  R.smoothstep = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4(smoothstep(1.0, 0.0, 0.25), smoothstep(1.0, 0.0, u_x), 1.0 - smoothstep(0.0, 1.0, u_x), 0.0); }", uniforms: { u_x: 0.25 } });
  R.clamp = await px({ fs: H + "uniform vec3 u_c;\nvoid main(){ o = vec4(clamp(u_c.x, u_c.y, u_c.z), clamp(0.5, 1.0, 0.0), 0.0, 0.0); }", uniforms: { u_c: [0.5, 1, 0] } });
  R.round = await px({ fs: H + "uniform vec4 u_v;\nvoid main(){ o = round(u_v); }", uniforms: { u_v: [0.5, 2.5, -0.5, -2.5] } });
  R.roundEven = await px({ fs: H + "uniform vec4 u_v;\nvoid main(){ o = roundEven(u_v); }", uniforms: { u_v: [0.5, 2.5, -0.5, -2.5] } });
  R.modEntero = await px({ fs: H + "uniform ivec2 u_i;\nvoid main(){ o = vec4(float(u_i.x % u_i.y), float((u_i.x + 6) % u_i.y), 0.0, 0.0); }", uniforms: { u_i: { int: [-7, 3] } } });
  R.modFloatCompila = await page.evaluate((H) => window.compilarSolo(H + "uniform float a;\nvoid main(){ o = vec4(a % 3.0); }"), H);
  R.fract = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4(fract(u_x), fract(-0.25), floor(u_x), 0.0); }", uniforms: { u_x: -1e-9 } });
  R.powUniformK = await px({ fs: H + "uniform float u_x, u_k;\nvoid main(){ o = vec4(pow(u_x, u_k)); }", uniforms: { u_x: -2, u_k: 2 } });
  R.powConst2 = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4(pow(u_x, 2.0)); }", uniforms: { u_x: -2 } });
  R.powConst8 = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4(pow(u_x, 8.0)); }", uniforms: { u_x: -0.5 } });
  R.powTodoConst = await px({ fs: H + "void main(){ o = vec4(pow(-2.0, 2.0)); }" });
  R.pow00 = await px({ fs: H + "uniform float u_z;\nvoid main(){ o = vec4(pow(u_z, u_z)); }", uniforms: { u_z: 0 } });
  R.powConIsnan = await px({ fs: H + "uniform float u_x, u_otro;\nvoid main(){ o = vec4(pow(u_x, 2.0)); if (isnan(u_otro)) o = vec4(7.0); }", uniforms: { u_x: -2, u_otro: 0 } });
  R.subnormal = await px({ fs: H + "uniform vec3 u_a;\nvoid main(){ o = vec4(u_a.x * u_a.y, 1e-30 * 1e-10, (u_a.x * u_a.y) * u_a.z, (1e-30 * 1e-10) * u_a.z); }", uniforms: { u_a: [1e-30, 1e-10, 1e30] } });
  R.asociativa = await px({ fs: H + "uniform vec2 u_a;\nvoid main(){ o = vec4((u_a.x + u_a.y) - u_a.y, u_a.x, 0.0, 0.0); }", uniforms: { u_a: [0.1234567, 1e6] } });
  R.fastNaN1 = await px({ fs: H + "uniform float u_n, u_z;\nvoid main(){ o = vec4(u_n != u_n ? 1.0 : 0.0, u_n * 0.0, u_n - u_n, u_z / u_z); }", uniforms: { u_n: "NaN", u_z: 0 } });
  R.fastNaN2 = await px({ fs: H + "uniform float u_n;\nvoid main(){ o = vec4(max(u_n, 0.0), clamp(u_n, 0.0, 1.0), 0.0, 0.0); }", uniforms: { u_n: "NaN" } });
  R.conIsnan = await px({ fs: H + "uniform float u_n, u_z;\nvoid main(){ o = vec4(u_n != u_n ? 1.0 : 0.0, isnan(u_n) ? 1.0 : 0.0, u_z / u_z, 0.0); }", uniforms: { u_n: "NaN", u_z: 0 } });
  R.reflect = await px({ fs: H + "uniform vec3 u_d, u_n;\nvoid main(){ o = vec4(reflect(u_d, u_n), 0.0); }", uniforms: { u_d: [0.707, -0.707, 0], u_n: [0, 2, 0] } });
  R.acos = await px({ fs: H + "uniform vec3 u_a;\nvoid main(){ float c = dot(normalize(u_a), normalize(2.0 * u_a)); float c2 = dot(normalize(u_a), normalize(u_a)); o = vec4(c, acos(c), c2, acos(c2)); }", uniforms: { u_a: [0.3, 0.7, 0.1] } });
  R.normalize0 = await px({ fs: H + "uniform vec2 u_v;\nvoid main(){ o = vec4(normalize(u_v), 0.0, 0.0); }", uniforms: { u_v: [0, 0] } });
  R.cancelacion = [];
  for (const x of [0.001, 0.0003]) {
    const r = await px({ fs: H + "uniform float u_x;\nvoid main(){ o = vec4((1.0 - cos(u_x)) / (u_x * u_x), 2.0 * sin(u_x * 0.5) * sin(u_x * 0.5) / (u_x * u_x), cos(u_x), 0.0); }", uniforms: { u_x: x } });
    R.cancelacion.push({ x, r });
  }
  R.nanA8bits = await px({ fs: H + "uniform float u_n, u_i;\nvoid main(){ o = vec4(u_n, u_i, -u_i, 0.5); }", uniforms: { u_n: "NaN", u_i: "Inf" }, u8: true });
  R.mat2 = await px({ fs: H + "void main(){ mat2 m = mat2(1.0, 2.0, 3.0, 4.0); vec2 a = m * vec2(1.0, 0.0); vec2 b = vec2(1.0, 0.0) * m; o = vec4(a, b); }" });
  R.mat4w = await px({ fs: H + "uniform float u_w;\nvoid main(){ mat4 m = mat4(1.0); m[3] = vec4(5.0, 6.0, 7.0, 1.0); vec4 p = m * vec4(1.0, 1.0, 1.0, u_w); o = p; }", uniforms: { u_w: 0 } });

  // Hash clásico: 64 × 64 celdas con el mismo desplazamiento en x e y (texto de 3.7)
  const hashBloque = (desp, w, h, extra = "") => page.evaluate((desp, w, h, H, extra) => {
    const fs = H + "uniform vec2 u_d;\nfloat hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nvoid main(){ vec2 celda = floor(gl_FragCoord.xy) + u_d; " + (extra || "") + " o = vec4(hash(celda)); }";
    const r = window.prueba({ fs, w, h, uniforms: { u_d: desp } });
    if (!r.ok) return { log: r.log };
    const vals = []; for (let i = 0; i < r.pix.length; i += 4) vals.push(r.pix[i]);
    const distintos = new Set(vals).size;
    const max = vals.reduce((a, b) => Math.max(a, b), 0);
    const estrellas = vals.filter((v) => v > 0.985).length;
    return { distintos, max, estrellas, n: vals.length, fraccion: estrellas / vals.length };
  }, desp, w, h, H, extra);
  R.hash64 = {};
  for (const d of [0, 1000, 2000, 5000, 20000]) R.hash64[d] = await hashBloque([d, d], 64, 64);
  // Ejercicio 3.7.3: celdas de 4 px, desplazamiento (L, L/2); bloque de 256 × 128 celdas
  R.ej373 = {};
  for (const L of [0, 2000, 20000]) R.ej373[L] = await hashBloque([L, L * 0.5], 256, 128);
  // Solución (a): densidad media sobre un periodo completo (celda en [0, P)²)
  R.ej373a = {};
  for (const P of [128, 512, 1024]) R.ej373a[P] = await hashBloque([0, 0], P, P);
  // Densidad «cerca del origen»: 64 × 64
  R.ej373a.origen64 = R.hash64[0];

  R.precision = await page.evaluate(() => {
    const g = __gl, o = {};
    for (const sh of ["VERTEX_SHADER", "FRAGMENT_SHADER"]) for (const t of ["LOW_FLOAT", "MEDIUM_FLOAT", "HIGH_FLOAT", "LOW_INT", "MEDIUM_INT", "HIGH_INT"]) {
      const f = g.getShaderPrecisionFormat(g[sh], g[t]); o[sh + " " + t] = [f.rangeMin, f.rangeMax, f.precision].join(",");
    }
    o.EXT_clip_control = g.getSupportedExtensions().includes("EXT_clip_control");
    return o;
  });

  // JS: Math.hypot frente a Math.sqrt (5 millones de llamadas), con calentamiento
  R.hypot = await page.evaluate(() => {
    const N = 5e6;
    function conHypot() { let s = 0; for (let i = 0; i < N; i++) s += Math.hypot(i * 0.5, 3.25); return s; }
    function conSqrt() { let s = 0; for (let i = 0; i < N; i++) { const x = i * 0.5, y = 3.25; s += Math.sqrt(x * x + y * y); } return s; }
    const t0 = performance.now(); while (performance.now() - t0 < 400) { conHypot(); conSqrt(); }   // calentar CPU y JIT
    const h = [], q = []; let basura = 0;
    for (let k = 0; k < 7; k++) {
      let a = performance.now(); basura += conHypot(); h.push(performance.now() - a);
      a = performance.now(); basura += conSqrt(); q.push(performance.now() - a);
    }
    const med = (v) => v.slice().sort((x, y) => x - y)[v.length >> 1];
    return { hypot: h.map((x) => +x.toFixed(1)), sqrt: q.map((x) => +x.toFixed(1)), medHypot: med(h), medSqrt: med(q), basura: basura > 0 };
  });
  R.hypotFrio = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 3000));      // reposo: la CPU baja el reloj
    const N = 5e6; let s = 0;
    let a = performance.now(); for (let i = 0; i < N; i++) s += Math.hypot(i * 0.5, 3.25); const h = performance.now() - a;
    a = performance.now(); for (let i = 0; i < N; i++) { const x = i * 0.5, y = 3.25; s += Math.sqrt(x * x + y * y); } const q = performance.now() - a;
    return { hypot: +h.toFixed(1), sqrt: +q.toFixed(1), s: s > 0 };
  });
  // Canvas getTransform y CSS
  R.canvas = await page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.translate(100, 0); ctx.rotate(Math.PI / 2);
    const m = ctx.getTransform(); return [m.a, m.b, m.c, m.d, m.e, m.f];
  });
  R.css = await page.evaluate(() => {
    const d = document.createElement("div"); document.body.appendChild(d);
    const out = {};
    for (const t of ["translate(100px, 0) rotate(90deg)", "rotate(90deg) translate(100px, 0)", "translateX(10px) rotateY(30deg)", "rotate(90deg)"]) { d.style.transform = t; out[t] = getComputedStyle(d).transform; }
    return out;
  });
  // WebGL1: uniformMatrix4fv con transpose = true
  R.webgl1Transpose = await page.evaluate(() => {
    const g = document.createElement("canvas").getContext("webgl");
    const vs = g.createShader(g.VERTEX_SHADER); g.shaderSource(vs, "uniform mat4 m; attribute vec4 p; void main(){ gl_Position = m * p; }"); g.compileShader(vs);
    const fs = g.createShader(g.FRAGMENT_SHADER); g.shaderSource(fs, "void main(){ gl_FragColor = vec4(1.0); }"); g.compileShader(fs);
    const p = g.createProgram(); g.attachShader(p, vs); g.attachShader(p, fs); g.linkProgram(p); g.useProgram(p);
    const loc = g.getUniformLocation(p, "m");
    g.getError();
    g.uniformMatrix4fv(loc, true, new Float32Array(16));
    const e = g.getError();
    return { error: e, INVALID_VALUE: g.INVALID_VALUE };
  });
  await new Promise((r) => setTimeout(r, 300));
} finally {
  await nav.close();
}
R.consola = consola;
const txt = JSON.stringify(R, null, 1);
if (salida) fs.writeFileSync(salida, txt);
console.log(txt);
