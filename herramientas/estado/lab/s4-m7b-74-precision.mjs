// Laboratorio de PRECISIÓN de 7.4 (agente m7b, sesión 4) — Apple M1, Chrome, ANGLE/Metal.
//
// 1) Tabla del ε («Diferencias finitas»): error angular máximo de la normal por diferencias centrales,
//    calculada en el vertex shader con las TRES ONDAS DE LA LECCIÓN (ondas() del ejemplo 7.4.3) y leída con
//    transform feedback, frente a la normal exacta (derivada analítica en float64, con las constantes y los
//    puntos redondeados a float32: la función que de verdad evalúa la GPU). 2000 puntos al azar por celda.
// 2) Bandera (ejemplo 7.4.5): error de la normal (diferencias centrales en uv con e = 0,002, como el ejemplo)
//    al principio (t en 0–10 s), tras una hora (t ≈ 3600 s) y tras tres horas (t ≈ 10 800 s), con el viento
//    por defecto (0,7) y al máximo (1,0); la exacta, en float64 (diferencias centrales con paso 1e-6).
//    Además: el mismo cálculo con el tiempo ENVUELTO (lo que recomienda la lección).
//
// No mide tiempos: no necesita turno exclusivo.  Uso:  node herramientas/estado/lab/s4-m7b-74-precision.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

function pagina() {
  const c = document.createElement("canvas"); c.width = c.height = 4; document.body.appendChild(c);
  const gl = c.getContext("webgl2");
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const f32 = Math.fround;

  function programaTF(vsrc, salidas) {
    const p = gl.createProgram();
    const fs = "#version 300 es\nprecision highp float;\nout vec4 o;\nvoid main(){ o = vec4(0.0); }";
    for (const [t, s] of [[gl.VERTEX_SHADER, vsrc], [gl.FRAGMENT_SHADER, fs]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    }
    gl.transformFeedbackVaryings(p, salidas, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  // Ejecuta el VS una vez por punto (pares de float32) y devuelve las salidas (vec3 por punto).
  function ejecutar(p, puntos, uniforms) {
    const n = puntos.length / 2;
    gl.useProgram(p);
    for (const [k, v] of Object.entries(uniforms)) gl.uniform1f(gl.getUniformLocation(p, k), v);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const bin = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bin); gl.bufferData(gl.ARRAY_BUFFER, puntos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null); gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const bout = gl.createBuffer(); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, bout);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, n * 12, gl.STREAM_READ); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    const tf = gl.createTransformFeedback(); gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bout);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(vao);
    gl.beginTransformFeedback(gl.POINTS); gl.drawArrays(gl.POINTS, 0, n); gl.endTransformFeedback();
    gl.bindVertexArray(null);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null); gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    const out = new Float32Array(n * 3);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, bout); gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, out); gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    const err = gl.getError(); if (err) throw new Error("GL error 0x" + err.toString(16));
    gl.deleteBuffer(bin); gl.deleteBuffer(bout); gl.deleteVertexArray(vao); gl.deleteTransformFeedback(tf);
    return out;
  }
  const angulo = (a, b) => {  // ángulo entre dos vectores 3D, en grados (atan2: preciso con ángulos pequeños)
    const cx = a[1] * b[2] - a[2] * b[1], cy = a[2] * b[0] - a[0] * b[2], cz = a[0] * b[1] - a[1] * b[0];
    return Math.atan2(Math.hypot(cx, cy, cz), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) * 180 / Math.PI;
  };
  let semilla = 12345;
  const azar = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };

  // ---------------- 1) tabla del ε con las ondas del ejemplo 7.4.3 ----------------
  const ONDAS = `
const vec2 DIR[3] = vec2[3](vec2(1.0, 0.0), vec2(0.6, 0.8), vec2(-0.71, 0.71));
const float K[3] = float[3](1.7, 2.9, 4.3);
const float A[3] = float[3](0.14, 0.07, 0.035);
const float W[3] = float[3](1.4, 2.0, 2.7);
vec3 ondas(vec2 p, float t) {
  vec3 r = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fase = K[i] * dot(DIR[i], p) - W[i] * t;
    r.x += A[i] * sin(fase);
    r.yz += A[i] * K[i] * cos(fase) * DIR[i];
  }
  return r;
}`;
  const VS_EPS = `#version 300 es
layout(location = 0) in vec2 a_q;
uniform float u_time;
uniform float u_eps;
out vec3 v_n;
${ONDAS}
float altura(vec2 q) { return ondas(q, u_time).x; }
void main() {
  vec2 q = a_q;
  float e = u_eps;
  float hx = (altura(q + vec2(e, 0.0)) - altura(q - vec2(e, 0.0))) / (2.0 * e);
  float hz = (altura(q + vec2(0.0, e)) - altura(q - vec2(0.0, e))) / (2.0 * e);
  v_n = normalize(vec3(-hx, 1.0, -hz));
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`;
  const VS_ANA = VS_EPS.replace(/float hx = [^\n]*\n[^\n]*hz = [^\n]*\n  v_n = [^\n]*/, "vec3 o = ondas(q, u_time);\n  v_n = normalize(vec3(-o.y, 1.0, -o.z));");
  const pE = programaTF(VS_EPS, ["v_n"]), pA = programaTF(VS_ANA, ["v_n"]);
  const DIR = [[1, 0], [0.6, 0.8], [-0.71, 0.71]].map((d) => d.map(f32)), K = [1.7, 2.9, 4.3].map(f32), A = [0.14, 0.07, 0.035].map(f32), Wv = [1.4, 2.0, 2.7].map(f32);
  function normalExacta(x, z, t) {
    let hx = 0, hz = 0;
    for (let i = 0; i < 3; i++) { const c = A[i] * K[i] * Math.cos(K[i] * (DIR[i][0] * x + DIR[i][1] * z) - Wv[i] * t); hx += c * DIR[i][0]; hz += c * DIR[i][1]; }
    const l = Math.hypot(hx, 1, hz); return [-hx / l, 1 / l, -hz / l];
  }
  function trunc64(x, z, t, e) {   // la misma diferencia central, en float64: solo error de truncamiento
    const h = (x, z) => { let s = 0; for (let i = 0; i < 3; i++) s += A[i] * Math.sin(K[i] * (DIR[i][0] * x + DIR[i][1] * z) - Wv[i] * t); return s; };
    const hx = (h(x + e, z) - h(x - e, z)) / (2 * e), hz = (h(x, z + e) - h(x, z - e)) / (2 * e);
    const l = Math.hypot(hx, 1, hz); return [-hx / l, 1 / l, -hz / l];
  }
  const casos = [["0–10, t=10", 0, 10], ["100–110, t=10", 100, 10], ["1000–1010, t=10", 1000, 10], ["0–10, t=1000", 0, 1000], ["0–10, t=10000", 0, 10000]];
  const EPS = [0.3, 0.1, 0.01, 0.001, 0.0001, 0.00001];
  const NP = 2000;
  const tablaEps = {}, tablaTrunc = {}, analitica = {};
  for (const [nombre, o, t] of casos) {
    const pts = new Float32Array(NP * 2);
    for (let i = 0; i < NP * 2; i++) pts[i] = o + 10 * azar();
    const exactas = []; for (let i = 0; i < NP; i++) exactas.push(normalExacta(pts[2 * i], pts[2 * i + 1], f32(t)));
    const ana = ejecutar(pA, pts, { u_time: t });
    let ma = 0; for (let i = 0; i < NP; i++) ma = Math.max(ma, angulo([ana[3 * i], ana[3 * i + 1], ana[3 * i + 2]], exactas[i]));
    analitica[nombre] = +ma.toPrecision(3);
    for (const e of EPS) {
      const r = ejecutar(pE, pts, { u_time: t, u_eps: e });
      let m = 0, m64 = 0;
      for (let i = 0; i < NP; i++) {
        m = Math.max(m, angulo([r[3 * i], r[3 * i + 1], r[3 * i + 2]], exactas[i]));
        m64 = Math.max(m64, angulo(trunc64(pts[2 * i], pts[2 * i + 1], f32(t), f32(e)), exactas[i]));
      }
      (tablaEps[e] = tablaEps[e] || {})[nombre] = +m.toPrecision(3);
      (tablaTrunc[e] = tablaTrunc[e] || {})[nombre] = +m64.toPrecision(3);
    }
  }

  // ---------------- 2) bandera del ejemplo 7.4.5 ----------------
  const BANDERA = `
uniform float u_viento;
vec3 bandera(vec2 uv, float t) {
  float x = uv.x * 3.0, y = uv.y * 2.0;
  float libre = uv.x;
  float onda = sin(2.6 * x - 5.5 * t + 0.9 * y)
             + 0.35 * sin(5.9 * x - 8.3 * t + 2.3 * y + 1.0);
  float z = u_viento * 0.32 * libre * onda;
  float caida = (1.15 - u_viento) * 0.5 * libre * libre;
  float aleteo = 0.05 * u_viento * libre * sin(4.1 * x - 6.7 * t);
  return vec3(x, 0.6 + y - caida + aleteo, z);
}`;
  const VS_BAN = `#version 300 es
layout(location = 0) in vec2 a_uv;
uniform float u_time;
out vec3 v_n;
${BANDERA}
void main() {
  float e = 0.002;
  vec3 tu = bandera(a_uv + vec2(e, 0.0), u_time) - bandera(a_uv - vec2(e, 0.0), u_time);
  vec3 tv = bandera(a_uv + vec2(0.0, e), u_time) - bandera(a_uv - vec2(0.0, e), u_time);
  v_n = normalize(cross(tu, tv));
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}`;
  const pB = programaTF(VS_BAN, ["v_n"]);
  function banderaJS(u, v, t, viento) {
    const x = u * 3, y = v * 2, libre = u;
    const onda = Math.sin(2.6 * x - 5.5 * t + 0.9 * y) + 0.35 * Math.sin(5.9 * x - 8.3 * t + 2.3 * y + 1.0);
    return [x, 0.6 + y - (1.15 - viento) * 0.5 * libre * libre + 0.05 * viento * libre * Math.sin(4.1 * x - 6.7 * t), viento * 0.32 * libre * onda];
  }
  function normalBanderaExacta(u, v, t, viento) {
    const e = 1e-6, a = banderaJS(u + e, v, t, viento), b = banderaJS(u - e, v, t, viento), c = banderaJS(u, v + e, t, viento), d = banderaJS(u, v - e, t, viento);
    const tu = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], tv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    const n = [tu[1] * tv[2] - tu[2] * tv[1], tu[2] * tv[0] - tu[0] * tv[2], tu[0] * tv[1] - tu[1] * tv[0]], l = Math.hypot(...n);
    return n.map((q) => q / l);
  }
  const NB = 2000, banderaRes = {};
  const pts = new Float32Array(NB * 2);
  for (let i = 0; i < NB * 2; i++) pts[i] = azar();
  // con el tiempo envuelto: la fase que importa es 5,5·t, 8,3·t y 6,7·t; no hay un periodo común exacto,
  // así que «envolver» aquí = t mod 1000 (lo que haría una envoltura ingenua) para ver que vuelve al error inicial
  for (const viento of [0.7, 1.0]) for (const [nombre, t0] of [["t 0–10 s", 0], ["t ≈ 3600 s (1 h)", 3600], ["t ≈ 10 800 s (3 h)", 10800], ["t ≈ 36 000 s (10 h)", 36000]]) {
    let m = 0, suma = 0, cuenta = 0;
    for (let k = 0; k < 8; k++) {
      const t = f32(t0 + 10 * azar());
      const r = ejecutar(pB, pts, { u_time: t, u_viento: viento });
      for (let i = 0; i < NB; i++) {
        const ex = normalBanderaExacta(pts[2 * i], pts[2 * i + 1], t, f32(viento));
        const a = angulo([r[3 * i], r[3 * i + 1], r[3 * i + 2]], ex);
        m = Math.max(m, a); suma += a; cuenta++;
      }
    }
    banderaRes[`viento ${viento} · ${nombre}`] = { maximo: +m.toPrecision(3), medio: +(suma / cuenta).toPrecision(3) };
  }
  // ¿cuánto pesa el redondeo frente al truncamiento de e = 0,002? la misma diferencia central en float64
  let mt = 0;
  for (let i = 0; i < NB; i++) {
    const u = pts[2 * i], v = pts[2 * i + 1], t = f32(5.3), e = f32(0.002);
    const a = banderaJS(u + e, v, t, 0.7), b = banderaJS(u - e, v, t, 0.7), c = banderaJS(u, v + e, t, 0.7), d = banderaJS(u, v - e, t, 0.7);
    const tu = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], tv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
    const n = [tu[1] * tv[2] - tu[2] * tv[1], tu[2] * tv[0] - tu[0] * tv[2], tu[0] * tv[1] - tu[1] * tv[0]];
    mt = Math.max(mt, angulo(n, normalBanderaExacta(u, v, t, f32(0.7))));
  }
  return { gpu, tablaEps, tablaTrunc, analitica, bandera: banderaRes, banderaTrunc64: +mt.toPrecision(3) };
}

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], headless: "new", protocolTimeout: 300000,
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => { if (m.type() !== "log") console.error("consola:", m.type(), m.text()); });
  await page.setContent("<!doctype html><html><body></body></html>");
  const r = await page.evaluate(pagina);
  console.log("GPU:", r.gpu);
  console.log("\n1) ε: error angular máximo de la normal (grados), 2000 puntos; GPU (VS + transform feedback) | float64 (solo truncamiento)");
  for (const [e, fila] of Object.entries(r.tablaEps)) console.log("  ε=" + e.padEnd(7), Object.entries(fila).map(([k, v]) => `${k}: ${v}° | ${r.tablaTrunc[e][k]}°`).join("  ·  "));
  console.log("  analítica (sin ε):", JSON.stringify(r.analitica));
  console.log("\n2) bandera (e = 0,002 en uv): error de la normal, máximo y medio (grados), 8 instantes × 2000 puntos");
  for (const [k, v] of Object.entries(r.bandera)) console.log(`  ${k}: máx ${v.maximo}° · medio ${v.medio}°`);
  console.log("  solo truncamiento (float64, e = 0,002, t = 5,3, viento 0,7): máx", r.banderaTrunc64 + "°");
  console.log("\nJSON " + JSON.stringify(r));
} finally {
  await nav.close();
}
