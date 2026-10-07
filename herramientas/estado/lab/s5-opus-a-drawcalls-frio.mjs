// Sesión 5, opus-a (4.1): ¿cuánto de las cifras de «10 000 draw calls contra 1» y del ejercicio 4.1.3 es CPU en frío?
// Cada playground, tal cual (tras 3 s de reposo: lo que ve el lector al pulsar «Ejecutar») y con 300 ms de cálculo
// sin cronometrar al principio del código (CPU caliente). Tres ejecuciones de cada. Uso, desde herramientas/:
//   node turnos.mjs --exclusivo --agente opus-a --motivo "…" -- node estado/lab/s5-opus-a-drawcalls-frio.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const CALOR = "{ const __t = performance.now(); let __s = 0; while (performance.now() - __t < 300) __s += Math.sqrt(__s + 1); }\n";
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION);
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 }).catch(() => {});
  await dormir(1500);
  for (const [titulo, sol] of [["10 000 draw calls contra 1", false], ["Ejercicio 4.1.3", false], ["Ejercicio 4.1.3", true]]) {
    const sel = `.js-playground[data-titulo="${titulo}"]`;
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel);
    await dormir(1500);
    if (sol) { await page.evaluate((s) => document.querySelector(s + " .pg-btn.solucion").click(), sel); await dormir(1500); }
    const original = await page.evaluate((s) => { const cm = [...document.querySelectorAll(s + " .CodeMirror")].map((e) => e.CodeMirror).find((c) => /draw|frames/.test(c.getValue())); return cm.getValue(); }, sel);
    for (const modo of ["frío", "caliente"]) {
      const codigo = modo === "frío" ? original : CALOR + original;
      await page.evaluate((s, c) => { const cm = [...document.querySelectorAll(s + " .CodeMirror")].map((e) => e.CodeMirror).find((x) => /draw|frames/.test(x.getValue())); cm.setValue(c); }, sel, codigo);
      const r = [];
      for (let k = 0; k < 3; k++) {
        await dormir(3000);
        await page.evaluate((s) => document.querySelector(s + " .pg-btn.primario").click(), sel);
        await dormir(2500);
        r.push((await page.evaluate((s) => document.querySelector(s + " .pg-consola").innerText, sel)).trim().replace(/\n/g, " | "));
      }
      console.log(`${titulo}${sol ? " (solución)" : ""} · ${modo}:\n  ${r.join("\n  ")}`);
    }
  }
} finally { await nav.close(); }
