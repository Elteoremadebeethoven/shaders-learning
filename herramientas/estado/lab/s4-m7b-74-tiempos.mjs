// Laboratorio de tiempos de 7.4 — copia de rev-m7-4-tiempos.mjs (sesión 3) adaptada por m7b (sesión 4):
// import absoluto, medida de la pasada vacía (clear + guardar el FBO, sin dibujo) para restarla, y
// orden de las medidas intercalado (A, B, C) para que el calentamiento de la GPU no favorezca a ninguna.
// PARA EJECUTAR EN EL M1 con turno --exclusivo.
//
// Re-mide con el método fiable (GUIA §5.6, caja «Cómo se mide lo que cuesta un shader» de 6.6) las cifras
// de GPU de 7.4: la tabla «JavaScript vs vertex shader» de «La silueta no miente» y la tabla A/B/C de
// «Geometría sin buffers». Cada dibujo va a su propia pasada de render (dos FBO alternos con color +
// profundidad, clear al empezar), readPixels al final de cada tanda, mediana de las tandas. Para comparar,
// mide también el método antiguo (8 dibujos seguidos sobre el MISMO FBO, sin clear entre ellos).
// También repite las cifras de CPU (calcular en JS y subir con bufferSubData).
//
// Uso (desde herramientas/):   node estado/lab/rev-m7-4-tiempos.mjs [--rapido] [--json salida.json]
//   --rapido: menos repeticiones y sin N = 1024 (para probar que funciona; las cifras no valen).
// En macOS usa Chrome con ANGLE/Metal; en Linux, el Chromium de la sesión con SwiftShader (solo para
// comprobar que el script funciona: los tiempos de SwiftShader NO son los del curso).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const args = process.argv.slice(2);
const RAPIDO = args.includes("--rapido");
const iJson = args.indexOf("--json");
const SALIDA = iJson >= 0 ? args[iJson + 1] : null;
const MAC = process.platform === "darwin";
const lanzar = MAC
  ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] }
  : { executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] };

function pagina(cfg) {
  const W = 512, H = 512;
  const c = document.createElement("canvas"); c.width = W; c.height = H; document.body.appendChild(c);
  const gl = c.getContext("webgl2", { antialias: false, powerPreference: "high-performance" });
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);

  // ---------- shaders (los de la lección) ----------
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
  const RUIDO = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 gradiente(vec2 e) { float a = 6.2831853 * hash12(e); return vec2(cos(a), sin(a)); }
float ruidoGradiente(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = dot(gradiente(i), f), b = dot(gradiente(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(gradiente(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), d = dot(gradiente(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROTAR = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { s += a * ruidoGradiente(p); p = ROTAR * p * 2.0 + vec2(17.3, 5.9); a *= 0.5; } return s; }`;
  // variante: A (uv en buffer + índices), B (solo índices + gl_VertexID), C (sin buffers, 6 vértices por celda)
  const UV = {
    A: `layout(location = 0) in vec2 a_uv;\nvec2 uvDelVertice() { return a_uv; }`,
    B: `uniform int u_lado;\nvec2 uvDelVertice() { int i = gl_VertexID % u_lado, j = gl_VertexID / u_lado; return vec2(i, j) / float(u_lado - 1); }`,
    C: `uniform int u_n;\nconst ivec2 ESQ[6] = ivec2[6](ivec2(0, 0), ivec2(1, 0), ivec2(0, 1), ivec2(0, 1), ivec2(1, 0), ivec2(1, 1));
vec2 uvDelVertice() { int celda = gl_VertexID / 6; ivec2 ij = ivec2(celda % u_n, celda / u_n) + ESQ[gl_VertexID % 6]; return vec2(ij) / float(u_n); }`,
  };
  const CUERPO = {
    ligero: `${ONDAS}
vec3 superficie(vec2 p) { vec3 o = ondas(p, u_time); return vec3(o.x, -o.y, -o.z); }`,
    pesado: `${RUIDO}
float altura(vec2 p) { return 0.6 * fbm(p * 0.5 + vec2(0.0, 0.1 * u_time)); }
vec3 superficie(vec2 p) {
  float e = 0.01, h = altura(p);
  float hx = (altura(p + vec2(e, 0.0)) - altura(p - vec2(e, 0.0))) / (2.0 * e);
  float hz = (altura(p + vec2(0.0, e)) - altura(p - vec2(0.0, e))) / (2.0 * e);
  return vec3(h, -hx, -hz);
}`,
  };
  const vs = (variante, cuerpo) => `#version 300 es
uniform mat4 u_vp;
uniform float u_time;
out vec3 v_normal;
${UV[variante]}
${CUERPO[cuerpo]}
void main() {
  vec2 p = (uvDelVertice() - 0.5) * vec2(6.0, -6.0);
  vec3 s = superficie(p);
  v_normal = normalize(vec3(s.y, 1.0, s.z));
  gl_Position = u_vp * vec4(p.x, s.x, p.y, 1.0);
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 v_normal;
out vec4 o;
void main() { vec3 n = normalize(v_normal); o = vec4(vec3(0.1, 0.3, 0.6) * (0.2 + 0.8 * max(dot(n, normalize(vec3(-0.3, 0.8, 0.4))), 0.0)), 1.0); }`;
  function programa(vsrc, fsrc) {
    const p = gl.createProgram();
    for (const [t, s] of [[gl.VERTEX_SHADER, vsrc], [gl.FRAGMENT_SHADER, fsrc]]) {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  // ---------- mallas ----------
  function rejilla(N) {
    const lado = N + 1, nV = lado * lado, uv = new Float32Array(nV * 2);
    for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) { const k = j * lado + i; uv[2 * k] = i / N; uv[2 * k + 1] = j / N; }
    const T = nV - 1 <= 65534 ? Uint16Array : Uint32Array, ind = new T(6 * N * N);
    let k = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * lado + i, b = a + lado; ind[k++] = a; ind[k++] = a + 1; ind[k++] = b; ind[k++] = b; ind[k++] = a + 1; ind[k++] = b + 1; }
    return { lado, nV, uv, ind };
  }
  function malla(N, variante) {
    const r = rejilla(N), vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bufs = [];
    if (variante === "A") {
      const b = gl.createBuffer(); bufs.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, r.uv, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }
    if (variante !== "C") {
      const e = gl.createBuffer(); bufs.push(e);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, e); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, r.ind, gl.STATIC_DRAW);
    }
    gl.bindVertexArray(null);
    const tipo = r.ind instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, n = r.ind.length;
    return {
      lado: r.lado, N,
      dibujar() { gl.bindVertexArray(vao); if (variante === "C") gl.drawArrays(gl.TRIANGLES, 0, 6 * N * N); else gl.drawElements(gl.TRIANGLES, n, tipo, 0); },
      liberar() { gl.deleteVertexArray(vao); bufs.forEach((b) => gl.deleteBuffer(b)); },
    };
  }

  // ---------- cámara (como el ejemplo 7.4.1: el plano llena casi todo el lienzo) ----------
  function vp() {
    const f = 1 / Math.tan(0.8 / 2), nf = 1 / (0.1 - 50);
    const P = [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (50 + 0.1) * nf, -1, 0, 0, 2 * 50 * 0.1 * nf, 0];
    const ojo = [0, 4.2, 4.6], centro = [0, -0.3, 0];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nor = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
    const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const z = nor(sub(ojo, centro)), x = nor(cruz([0, 1, 0], z)), y = cruz(z, x);
    const V = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, ojo), -dot(y, ojo), -dot(z, ojo), 1];
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; o[c * 4 + r] = s; }
    return o;
  }
  const VP = vp();

  // ---------- dos FBO con color + profundidad ----------
  const fbs = [];
  for (let k = 0; k < 2; k++) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H);
    const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
    fbs.push(fb);
  }
  gl.viewport(0, 0, W, H);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.05, 0.06, 0.09, 1);
  const px = new Uint8Array(4);
  const mediana = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

  function medir(variante, cuerpo, N) {
    const p = programa(vs(variante, cuerpo), FS), m = malla(N, variante);
    gl.useProgram(p);
    gl.uniformMatrix4fv(gl.getUniformLocation(p, "u_vp"), false, VP);
    gl.uniform1f(gl.getUniformLocation(p, "u_time"), 1.7);
    const lLado = gl.getUniformLocation(p, "u_lado"), lN = gl.getUniformLocation(p, "u_n");
    if (lLado) gl.uniform1i(lLado, m.lado);
    if (lN) gl.uniform1i(lN, N);
    // método fiable: cada dibujo, su pasada (FBO alterno + clear)
    const pasada = (k) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[k % 2]); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); m.dibujar(); };
    for (let i = 0; i < 3; i++) pasada(i);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const fiable = [];
    for (let t = 0; t < cfg.tandas; t++) {
      const t0 = performance.now();
      for (let i = 0; i < cfg.reps; i++) pasada(i);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      fiable.push((performance.now() - t0) / cfg.reps);
    }
    // método antiguo (engañoso en GPU de teselas): 8 dibujos seguidos sobre el mismo FBO, un solo clear
    const antiguo = [];
    for (let t = 0; t < cfg.tandas; t++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[0]); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now();
      for (let i = 0; i < 8; i++) m.dibujar();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      antiguo.push((performance.now() - t0) / 8);
    }
    m.liberar(); gl.deleteProgram(p);
    return { fiable: +mediana(fiable).toFixed(3), fiableMin: +Math.min(...fiable).toFixed(3), antiguo: +mediana(antiguo).toFixed(3) };
  }

  // ---------- CPU: calcular en JS (posición + normal de las tres ondas) y subir ----------
  function cpu(N) {
    const DIR = [[1, 0], [0.6, 0.8], [-0.71, 0.71]], K = [1.7, 2.9, 4.3], A = [0.14, 0.07, 0.035], Wv = [1.4, 2.0, 2.7];
    const lado = N + 1, nV = lado * lado, datos = new Float32Array(nV * 6);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, datos.byteLength, gl.DYNAMIC_DRAW);
    const calc = [], subir = [];
    for (let rep = 0; rep < cfg.tandasCPU; rep++) {
      const t = 1.7 + rep * 0.016;
      const t0 = performance.now();
      for (let j = 0, k = 0; j < lado; j++) for (let i = 0; i < lado; i++, k += 6) {
        const x = (i / N - 0.5) * 6, z = (0.5 - j / N) * 6;
        let h = 0, hx = 0, hz = 0;
        for (let q = 0; q < 3; q++) { const f = K[q] * (DIR[q][0] * x + DIR[q][1] * z) - Wv[q] * t, c = A[q] * K[q] * Math.cos(f); h += A[q] * Math.sin(f); hx += c * DIR[q][0]; hz += c * DIR[q][1]; }
        const l = Math.hypot(hx, 1, hz);
        datos[k] = x; datos[k + 1] = h; datos[k + 2] = z; datos[k + 3] = -hx / l; datos[k + 4] = 1 / l; datos[k + 5] = -hz / l;
      }
      const t1 = performance.now();
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, datos);
      const t2 = performance.now();
      calc.push(t1 - t0); subir.push(t2 - t1);
    }
    gl.deleteBuffer(b);
    return { calcular: +mediana(calc).toFixed(2), subir: +mediana(subir).toFixed(3) };
  }

  function vacia() {   // la pasada sin dibujo: clear de color y profundidad + guardar el FBO
    const pasada = (k) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[k % 2]); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); };
    for (let i = 0; i < 3; i++) pasada(i);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const r = [];
    for (let t = 0; t < cfg.tandas; t++) {
      const t0 = performance.now();
      for (let i = 0; i < cfg.reps; i++) pasada(i);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      r.push((performance.now() - t0) / cfg.reps);
    }
    return { fiable: +mediana(r).toFixed(3), fiableMin: +Math.min(...r).toFixed(3) };
  }
  const res = { gpu, vacia0: vacia(), tabla1: {}, tablaABC: {} };
  for (const N of cfg.Ns) res.tabla1[N] = { vertices: (N + 1) ** 2, ...cpu(N), gpuLigeroA: medir("A", "ligero", N) };
  for (const N of cfg.NsABC) for (const c of ["ligero", "pesado"]) for (const v of ["A", "B", "C"]) res.tablaABC[`N=${N} ${v} ${c}`] = medir(v, c, N);
  // segunda ronda en orden inverso: si la GPU cambió de marcha a mitad, se nota en la diferencia entre rondas
  res.tablaABC2 = {};
  for (const N of cfg.NsABC.slice().reverse()) for (const c of ["pesado", "ligero"]) for (const v of ["C", "B", "A"]) res.tablaABC2[`N=${N} ${v} ${c}`] = medir(v, c, N);
  res.vacia1 = vacia();
  return res;
}

const nav = await puppeteer.launch({ ...lanzar, headless: "new", protocolTimeout: 600000 });
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.setContent("<!doctype html><html><body></body></html>");
  const cfg = RAPIDO
    ? { reps: 3, tandas: 3, tandasCPU: 3, Ns: [256, 512], NsABC: [256] }
    : { reps: 10, tandas: 7, tandasCPU: 9, Ns: [256, 512, 1024], NsABC: [512, 1024] };
  const r = await page.evaluate(pagina, cfg);
  console.log("GPU:", r.gpu, MAC ? "" : "(SwiftShader: cifras NO válidas para el curso)");
  console.log("Pasada vacía (clear + guardar, sin dibujo):", JSON.stringify(r.vacia0), "· al final:", JSON.stringify(r.vacia1));
  console.log("\nTabla 1 (CPU en ms; GPU: ms por dibujo, método fiable / mínimo / método antiguo)");
  for (const [N, f] of Object.entries(r.tabla1)) console.log(`  N=${N} (${f.vertices} vért.)  JS calcular ${f.calcular} · subir ${f.subir} · GPU ${f.gpuLigeroA.fiable} / ${f.gpuLigeroA.fiableMin} / antiguo ${f.gpuLigeroA.antiguo}`);
  console.log("\nTabla A/B/C (ms por dibujo: fiable / mínimo / antiguo)");
  for (const [k, f] of Object.entries(r.tablaABC)) console.log(`  ${k.padEnd(18)} ${f.fiable} / ${f.fiableMin} / antiguo ${f.antiguo}   · 2.ª ronda: ${r.tablaABC2[k].fiable} / ${r.tablaABC2[k].fiableMin} / antiguo ${r.tablaABC2[k].antiguo}`);
  console.log("\nJSON " + JSON.stringify(r));
  if (SALIDA) fs.writeFileSync(SALIDA, JSON.stringify(r, null, 1));
} finally {
  await nav.close();
}
