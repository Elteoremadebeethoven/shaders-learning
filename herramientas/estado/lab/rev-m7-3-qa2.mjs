// QA 2 de la lección 7.3: ejercicio 7.3.5 sin puntero.visto, eventos de un toque emulado, opacidad CSS,
// APIs de «HTML en canvas», distribución del fbm de l73-kit (percentiles y tabla de la disolución).
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

const LECCION = pathToFileURL("/home/user/shaders-learning/modulos/07-integracion/03-transiciones-shader.html").href;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
console.log("chrome", await nav.version());
try {
  // ---------- 1. Experimentos sueltos en una página en blanco ----------
  const p = await nav.newPage();
  await p.setContent(`<!doctype html><html><body style="margin:0;background:#000">
    <div id="t" style="position:absolute;left:20px;top:20px;width:200px;height:150px;background:#345"></div>
    <div id="t2" style="position:absolute;left:20px;top:220px;width:200px;height:150px;background:#543"></div>
    <div style="position:absolute;left:300px;top:20px;width:100px;height:100px;background:#fff;opacity:0.5"></div>
    <div style="position:absolute;left:420px;top:20px;width:100px;height:100px;background:#fff;opacity:0.25"></div>
    <div style="height:3000px"></div></body></html>`);
  const png = await p.screenshot({ encoding: "base64", clip: { x: 0, y: 0, width: 600, height: 400 } });
  const rgb = await p.evaluate(async (b64) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    return [Array.from(g.getImageData(350, 70, 1, 1).data), Array.from(g.getImageData(470, 70, 1, 1).data)];
  }, png);
  console.log("opacidad 0.5 y 0.25 de blanco sobre negro:", JSON.stringify(rgb));
  console.log("APIs:", JSON.stringify(await p.evaluate(() => ({
    startViewTransition: typeof document.startViewTransition,
    drawElement: typeof CanvasRenderingContext2D.prototype.drawElement,
    drawElementImage: typeof CanvasRenderingContext2D.prototype.drawElementImage,
    texElementImage2D: typeof WebGL2RenderingContext.prototype.texElementImage2D,
  }))));
  // Toque emulado (CDP): orden de eventos con y sin arrastre
  await p.evaluate(() => {
    window.__ev = [];
    for (const id of ["t", "t2"]) {
      const el = document.getElementById(id);
      for (const tipo of ["pointerover", "pointerenter", "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerout", "pointerleave", "touchstart", "touchmove", "touchend", "touchcancel", "click"])
        el.addEventListener(tipo, (e) => window.__ev.push(id + ":" + tipo + (e.pointerType ? "(" + e.pointerType + ")" : "")), { passive: true });
    }
  });
  const cdp = await p.target().createCDPSession();
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await cdp.send("Emulation.setEmitTouchEventsForMouse", { enabled: false });
  const toque = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await toque("touchStart", 100, 90); await espera(60); await toque("touchEnd", 100, 90); await espera(400);
  console.log("toque sin arrastre:", (await p.evaluate(() => window.__ev.splice(0))).join(" "));
  await toque("touchStart", 100, 300);
  for (let k = 1; k <= 12; k++) { await toque("touchMove", 100, 300 - k * 15); await espera(16); }
  await toque("touchEnd", 100, 120); await espera(400);
  console.log("toque con arrastre vertical:", (await p.evaluate(() => window.__ev.splice(0))).join(" "), "scrollY=", await p.evaluate(() => scrollY));
  await p.close();

  // ---------- 2. fbm de l73-kit: distribución y tabla de la disolución ----------
  const q = await nav.newPage();
  await q.goto(LECCION, { waitUntil: "load" });
  await q.waitForFunction(() => window.Curso && Curso.listo && window.L73, { timeout: 15000 });
  const fbm = await q.evaluate(() => {
    const c = document.createElement("canvas"); const gl = c.getContext("webgl2");
    if (!gl.getExtension("EXT_color_buffer_float")) return { error: "sin EXT_color_buffer_float" };
    const W = 1024, H = 512;
    const fs = "#version 300 es\nprecision highp float;\nuniform vec2 u_resolution;\nout vec4 fragColor;\n" + L73.GLSL.RUIDO +
      "void main(){ vec2 uv = gl_FragCoord.xy / u_resolution; vec2 a = vec2(u_resolution.x / u_resolution.y, 1.0); fragColor = vec4(fbm(uv * a * 5.0), 0.0, 0.0, 1.0); }";
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, L73.GLSL.VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    gl.useProgram(pr); gl.uniform2f(gl.getUniformLocation(pr, "u_resolution"), W, H);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, W, H);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, W, H); gl.bindVertexArray(gl.createVertexArray()); gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Float32Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, px);
    const v = []; for (let i = 0; i < W * H; i++) v.push(px[i * 4]);
    v.sort((a, b) => a - b);
    const pc = (f) => v[Math.min(v.length - 1, Math.floor(f * v.length))];
    const frac = (u, est) => { let n = 0; for (const x of v) { const y = est ? Math.min(1, Math.max(0, (x - 0.24) / 0.56)) : x; if (y < u) n++; } return +(100 * n / v.length).toFixed(1); };
    const tabla = {}; for (const pp of [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9]) tabla[pp] = [frac(pp, false), frac(pp, true)];
    // borde 0,08 con u = mix(0, 1, p): fracción de píxeles con n estirado < w (arden en p = 0)
    let arden = 0; for (const x of v) { const y = Math.min(1, Math.max(0, (x - 0.24) / 0.56)); if (y < 0.08) arden++; }
    return { min: v[0], p1: pc(0.01), mediana: pc(0.5), p99: pc(0.99), max: v[v.length - 1], tabla, ardenEnP0: +(100 * arden / v.length).toFixed(2) };
  });
  console.log("fbm 1024x512, escala 5:", JSON.stringify(fbm));
  await q.close();

  // ---------- 3. Ejercicio 7.3.5: la solución sin «puntero.visto» ----------
  const page = await nav.newPage();
  await page.goto(LECCION, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 });
  const hs = await page.$$(".js-playground");
  let h = null; for (const x of hs) if ((await x.evaluate((el) => el.dataset.titulo)) === "Ejercicio 7.3.5") h = x;
  await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await espera(800);
  await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
  await espera(300);
  const cambiado = await h.evaluate((el) => {
    const pgx = el._playground; const sol = pgx.editores.js.getValue();
    const sinVisto = sol.replace("const persigue = puntero.visto && ", "const persigue = ");
    pgx.editores.js.setValue(sinVisto); pgx.ejecutar();
    return sinVisto !== sol;
  });
  console.log("7.3.5 sin visto, código cambiado:", cambiado);
  await espera(9000);
  console.log("7.3.5 sin puntero.visto:", JSON.stringify(await h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent))));
} finally {
  await nav.close();
}
