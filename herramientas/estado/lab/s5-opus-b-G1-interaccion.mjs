// Sesión 5 · opus-b (G1): comprobaciones con interacción de 6.1–6.5 en un solo Chrome.
// - Consola de los playgrounds JS de medida (6.1 indefinidos y traducción de ANGLE, 6.3 derivada en un if).
// - Deslizadores y casillas cuyo efecto describe el texto (6.1 índice fuera de rango, 6.2 viewports,
//   6.3 k = 0 en 6.3.2 y 6.3.4, escala sin corregir, 6.5 costura de fwidth, burbujas 3 × 3, sol con n impar).
// - Experimentos sueltos en un contexto WebGL2 de la página (quiz de normalizar con out; smin con k = 0).
// Uso: node turnos.mjs --agente opus-b --motivo "…" -- node s5-opus-b-G1-interaccion.mjs <dir-capturas>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const SAL = process.argv[2] || "./cap-g1";
fs.mkdirSync(SAL, { recursive: true });
const BASE = "file:///Users/alex/Projects/shaders/modulos/06-glsl/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 1000, deviceScaleFactor: 1 },
});
const errores = [];
async function abrir(archivo) {
  const page = await nav.newPage();
  page.on("pageerror", (e) => errores.push(archivo + " pageerror: " + e.message));
  page.on("console", (m) => { if (["error"].includes(m.type())) errores.push(archivo + " " + m.type() + ": " + m.text()); });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("curso-tema", JSON.stringify("dark")); Object.keys(localStorage).filter((k) => k.startsWith("pg")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.goto(BASE + archivo, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
  return page;
}
const buscar = (page, titulo) => page.evaluateHandle((t) => [...document.querySelectorAll(".glsl-playground,.js-playground,.graficador,.demo")].find((e) => e.dataset.titulo === t || e.id === t), titulo);
async function ver(page, h, ms = 1800) { await h.evaluate((el) => el.scrollIntoView({ block: "center" })); await espera(ms); }
async function foto(page, h, nombre) {
  const r = await h.evaluate((el) => { const b = el.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: Math.min(b.height, innerHeight) }; });
  await page.screenshot({ path: `${SAL}/${nombre}.png`, clip: r, captureBeyondViewport: false });
}
// pone el valor del control i-ésimo (input range o checkbox) de un playground GLSL
async function control(h, i, valor) {
  await h.evaluate((el, [i, valor]) => {
    const inps = [...el.querySelectorAll(".control input")];
    const inp = inps[i];
    if (inp.type === "checkbox") { inp.checked = !!valor; inp.dispatchEvent(new Event("change")); }
    else { inp.value = String(valor); inp.dispatchEvent(new Event("input")); }
  }, [i, valor]);
  await espera(700);
}
async function solucion(h) { await h.evaluate((el) => el.querySelector("button.solucion").click()); await espera(1500); }
const consola = (h) => h.evaluate((el) => (el.querySelector(".pg-consola") || {}).innerText || "(sin consola)");

try {
  // ---------------- 6.1 ----------------
  let page = await abrir("01-lenguaje.html");
  let h = await buscar(page, "Mide lo indefinido en tu GPU");
  await ver(page, h, 6000);
  console.log("== 6.1 Mide lo indefinido (1.ª ejecución)\n" + await consola(h));
  h = await buscar(page, "Lo que ANGLE hace con tu fragment shader");
  await ver(page, h, 4000);
  const ang = await consola(h);
  console.log("== 6.1 Traducción ANGLE (resumen): u_sinUso presente:", /sinUso/.test(ang), "· safeDivisor:", /safeDivisor/.test(ang), "· int_clamp:", /int_clamp/.test(ang), "· 0.899999976:", /0\.899999976/.test(ang), "· flippedFragCoord:", /flippedFragCoord/.test(ang), "· _ux = 0.0f:", /_ux = 0\.0f/.test(ang));
  console.log(ang.slice(0, 1800));
  h = await buscar(page, "Un índice fuera de rango");
  await ver(page, h);
  for (const v of [-2, 6, 2]) { await control(h, 0, v); await foto(page, h, `61-indice-${v}`); }
  // Experimento del quiz de normalizar(out) y del bicho m6a-smin-k-cero (texto fijo: lo que hace una página normal)
  const exp = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl.getExtension("EXT_color_buffer_float");
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, 1, 1); gl.bindVertexArray(gl.createVertexArray());
    const VS = "#version 300 es\nvoid main(){ gl_Position = vec4(vec2(gl_VertexID & 1, gl_VertexID >> 1) * 4.0 - 1.0, 0.0, 1.0); }";
    function correr(fs, unis) {
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); gl.useProgram(p);
      for (const [n, v] of Object.entries(unis || {})) gl.uniform1f(gl.getUniformLocation(p, n), v);
      gl.drawArrays(gl.TRIANGLES, 0, 3); const px = new Float32Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px); gl.deleteProgram(p); return Array.from(px).map(String).join(", ");
    }
    const normal = "#version 300 es\nprecision highp float;\nout vec4 o;\nvoid normalizar(out vec2 v) { v = v / length(v); }\nvoid main(){ vec2 d = vec2(3.0, 4.0); normalizar(d); o = vec4(d, 0.0, 1.0); }";
    const conIsnan = (n) => normal.replace("void main(){", "uniform float u_z;\nvoid main(){ // " + n + "\n") .replace("o = vec4(d, 0.0, 1.0);", "o = vec4(d, 0.0, 1.0); if (isnan(u_z)) o = vec4(7.0);");
    const smin = "#version 300 es\nprecision highp float;\nuniform float u_k, u_a, u_b, u_px;\nout vec4 o;\nfloat smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }\nvoid main(){ float d = smin(u_a, u_b, u_k); o = vec4(d, clamp(0.5 - d / u_px, 0.0, 1.0), 1.0 - smoothstep(-u_px, u_px, d), 1.0); }";
    const r = {};
    r.normalizar_1 = correr(normal); r.normalizar_2 = correr(normal);
    const n = Date.now() + "-" + Math.random();
    r.normalizar_isnan_nuevo = correr(conIsnan(n)); r.normalizar_isnan_cache = correr(conIsnan(n));
    r.smin_k0_fuera = correr(smin, { u_k: 0, u_a: 0.3, u_b: 0.5, u_px: 0.005 });
    r.smin_k0_dentro = correr(smin, { u_k: 0, u_a: -0.3, u_b: 0.5, u_px: 0.005 });
    r.smin_k015 = correr(smin, { u_k: 0.15, u_a: 0.3, u_b: 0.5, u_px: 0.005 });
    return r;
  });
  console.log("== Experimentos (d, cobertura clamp, cobertura 1-smoothstep, 1):", JSON.stringify(exp, null, 1));
  await page.close();

  // ---------------- 6.2 ----------------
  page = await abrir("02-pensar-en-paralelo.html");
  h = await buscar(page, "demo-rejilla"); await ver(page, h); await foto(page, h, "62-rejilla");
  h = await buscar(page, "Dos viewports, un shader");
  await ver(page, h, 4000); await foto(page, h, "62-viewports-sin");
  const f = await (await h.$("iframe")).contentFrame();
  await f.evaluate(() => { const c = document.getElementById("arreglo"); c.checked = true; c.dispatchEvent(new Event("change")); });
  await espera(1200); await foto(page, h, "62-viewports-con");
  console.log("== 6.2 viewports consola:\n" + await consola(h));
  await page.close();

  // ---------------- 6.3 ----------------
  page = await abrir("03-formas-sdf.html");
  h = await buscar(page, "Una derivada dentro de un if divergente");
  await ver(page, h, 4000);
  console.log("== 6.3 derivada en un if:\n" + await consola(h));
  h = await buscar(page, "Unión suave con colores");
  await ver(page, h); await foto(page, h, "63-gotas-k025"); await control(h, 0, 0); await foto(page, h, "63-gotas-k0");
  h = await buscar(page, "Ejercicio 6.3.4");
  await ver(page, h); await foto(page, h, "63-x4-partida");
  await control(h, 1, 0); await foto(page, h, "63-x4-partida-k0");
  await solucion(h); await control(h, 1, 0); await foto(page, h, "63-x4-sol-k0");
  await control(h, 1, 0.15); await foto(page, h, "63-x4-sol-k015");
  h = await buscar(page, "Escalar sin corregir");
  await ver(page, h); await foto(page, h, "63-escala-sin"); await control(h, 1, true); await foto(page, h, "63-escala-con");
  await page.close();

  // ---------------- 6.5 ----------------
  page = await abrir("05-patrones.html");
  h = await buscar(page, "Doce rayos antialiasados con fwidth");
  await ver(page, h);
  const alto = await h.evaluate((el) => { const c = el.querySelector("canvas"); return c ? c.width + "x" + c.height : "?"; });
  console.log("== 6.5 doce rayos, lienzo", alto);
  for (const d of [1, 0.5, 0]) { await control(h, 0, d); await foto(page, h, `65-rayos-desfase${d}`); }
  await control(h, 0, 1); await control(h, 1, true); await foto(page, h, "65-rayos-desfase1-arreglo");
  h = await buscar(page, "Burbujas: solo la celda propia o las 3 × 3");
  await ver(page, h); await foto(page, h, "65-burbujas-propia"); await control(h, 0, true); await foto(page, h, "65-burbujas-3x3");
  h = await buscar(page, "Ejercicio 6.5.2");
  await ver(page, h); await solucion(h); await control(h, 0, 7); await foto(page, h, "65-x2-sol-n7"); await control(h, 0, 12); await foto(page, h, "65-x2-sol-n12");
  await page.close();
} finally {
  console.log("== errores:", errores.length ? errores.join("\n") : "ninguno");
  await nav.close();
}
