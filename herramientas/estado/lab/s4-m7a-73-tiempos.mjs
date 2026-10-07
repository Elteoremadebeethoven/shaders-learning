// Tiempo de GPU por frame de las transiciones del catálogo de 7.3 (ejemplo 7.3.3) a 1440 × 900.
// Copia de rev-m7-3-tiempos.mjs (sesión 3) para la sesión 4 (m7a), con una pasada de referencia (shader trivial)
// para estimar el coste fijo de cada pasada (bind + clear + dibujo vacío). Ejecutar con turno --exclusivo.
//
// Uso (desde herramientas/):   node estado/lab/s4-m7a-73-tiempos.mjs [ancho alto]
//
// Método fiable (PLAN §4, GUIA §5.6, caja «Cómo se mide lo que cuesta un shader» de 6.6):
//   cada dibujo en su propia pasada de render (dos FBO alternos con clear al empezar), readPixels
//   de 1 píxel al final de cada tanda, mediana de varias tandas.
// Para comparar, mide también el método ENGAÑOSO (N dibujos seguidos sobre el mismo FBO y dividir),
//   que es el que dio las cifras «0,07–1,3 ms» que la lección publicaba antes de esta revisión.
//
// El shader se lee del propio HTML de la lección (el playground «Ejemplo 7.3.3 — Ocho transiciones»),
// así que mide exactamente lo que ve el alumno: u_progreso = 0,5, borde 0,08, fuerza 0,35, centro en medio.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const HERRAMIENTAS = path.resolve(AQUI, "../..");
const RAIZ = path.resolve(HERRAMIENTAS, "..");
// el puppeteer-core parcheado de herramientas/ (cola de turnos de Chrome)
const { default: puppeteer } = await import(pathToFileURL(path.join(HERRAMIENTAS, "node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).href);

const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900);
const LECCION = path.join(RAIZ, "modulos/07-integracion/03-transiciones-shader.html");
const html = fs.readFileSync(LECCION, "utf8");
const i0 = html.indexOf('data-titulo="Ejemplo 7.3.3 — Ocho transiciones"');
const a = html.indexOf('<script type="x-shader/x-fragment">', i0), b = html.indexOf("</script>", a);
if (i0 < 0 || a < 0) throw new Error("no encuentro el shader del catálogo en la lección");
const FS = html.slice(a + '<script type="x-shader/x-fragment">'.length, b).trim();

const MAC = process.platform === "darwin";
const CHROME = process.env.CHROME || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium",
].find((p) => fs.existsSync(p));
const nav = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: (MAC ? ["--use-angle=metal", "--enable-gpu"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    .concat(["--ignore-gpu-blocklist"], process.getuid && process.getuid() === 0 ? ["--no-sandbox"] : []),
});
try {
  const page = await nav.newPage();
  await page.goto(pathToFileURL(LECCION).href, { waitUntil: "load" });
  await page.waitForFunction(() => window.Texturas && window.L73, { timeout: 15000 });
  const res = await page.evaluate((FS, W, H) => {
    const c = document.createElement("canvas"); c.width = 16; c.height = 16;
    const gl = c.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    // VS con v_uv (el del playground GLSL): triángulo de pantalla completa
    const VS = "#version 300 es\nout vec2 v_uv;\nvoid main(){ vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));\n v_uv = P[gl_VertexID] * 0.5 + 0.5; gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }";
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const fs = FS.replace("\n", "\n// uid " + Math.random() + "\n");     // sin caché de programas
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    const U = (n) => gl.getUniformLocation(p, n);
    gl.uniform2f(U("u_resolution"), W, H); gl.uniform2f(U("u_mouse"), 0, 0); gl.uniform1f(U("u_time"), 0);
    gl.uniform1f(U("u_progreso"), 0.5); gl.uniform1f(U("u_ancho"), 0.08); gl.uniform1f(U("u_fuerza"), 0.35); gl.uniform1i(U("u_auto"), 0);
    // texturas como las del playground: 512 px, LINEAR + mipmaps, CLAMP, FLIP_Y
    ["paisaje", "texto"].forEach((n, k) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, Texturas.crear(n, 512));
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U("u_tex" + k), k);
    });
    const fbs = [0, 1].map(() => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f;
    });
    gl.viewport(0, 0, W, H); gl.bindVertexArray(gl.createVertexArray());
    const px = new Uint8Array(4);
    const mediana = (v) => v.slice().sort((x, y) => x - y)[v.length >> 1];
    const nombres = ["fundido sRGB", "fundido en luz", "por negro", "cortinilla", "radial", "disolución", "desplazamiento", "persianas"];
    const out = [];
    // Referencia: la misma medida con un fragment shader trivial (coste fijo de cada pasada)
    {
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "#version 300 es\nprecision highp float;\nout vec4 o;\nvoid main(){ o = vec4(0.5); }"));
      gl.linkProgram(pr); gl.useProgram(pr);
      const pasada = (k) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[k & 1]); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      for (let k = 0; k < 4; k++) pasada(k);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const v = [];
      for (let t = 0; t < 7; t++) { const t0 = performance.now(); for (let k = 0; k < 10; k++) pasada(k); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); v.push((performance.now() - t0) / 10); }
      out.push({ modo: "-", nombre: "referencia (trivial)", fiable_ms: +mediana(v).toFixed(3), min: +Math.min(...v).toFixed(3), max: +Math.max(...v).toFixed(3), enganoso_ms: NaN });
      gl.useProgram(p);
    }
    for (let modo = 0; modo < 8; modo++) {
      gl.uniform1i(U("u_modo"), modo);
      const pasada = (k) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[k & 1]); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      for (let k = 0; k < 4; k++) pasada(k);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const fiable = [], enganoso = [], reps = 10;
      for (let t = 0; t < 7; t++) {
        let t0 = performance.now();
        for (let k = 0; k < reps; k++) pasada(k);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        fiable.push((performance.now() - t0) / reps);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[0]); gl.clear(gl.COLOR_BUFFER_BIT);
        t0 = performance.now();
        for (let k = 0; k < reps; k++) gl.drawArrays(gl.TRIANGLES, 0, 3);          // método engañoso
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        enganoso.push((performance.now() - t0) / reps);
      }
      out.push({ modo, nombre: nombres[modo], fiable_ms: +mediana(fiable).toFixed(3), min: +Math.min(...fiable).toFixed(3), max: +Math.max(...fiable).toFixed(3), enganoso_ms: +mediana(enganoso).toFixed(3) });
    }
    return { renderer, out };
  }, FS, W, H);
  console.log(`GPU: ${res.renderer} · ${await nav.version()} · ${W}×${H}`);
  console.log("modo  transición            fiable (mediana, min–max)   engañoso (mismo FBO)");
  for (const r of res.out) console.log(`${String(r.modo).padEnd(5)} ${r.nombre.padEnd(22)} ${String(r.fiable_ms).padStart(7)} ms (${r.min}–${r.max})   ${String(r.enganoso_ms).padStart(7)} ms`);
  if (!MAC) console.log("\n(Esto NO es el M1: con SwiftShader las cifras no sirven para la lección.)");
} finally {
  await nav.close();
}
