// 7.5 (agente m7b, sesión 4; versión para el Mac de rev-m7-5-pruebas.mjs): ✓/✗ de las pruebas de los cuatro
// ejercicios (código de partida y solución), controles de los ejemplos 7.5.2–7.5.4 y la prueba «sin
// EXT_color_buffer_float» (getExtension parcheado en todos los marcos) tras las guardas de 7.5.1 y 7.5.2.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const url = "file:///Users/alex/Projects/shaders/modulos/07-integracion/05-particulas-gpu.html";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const titulo = (h) => h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent || el.dataset.titulo || "");
const consola = (h) => h.evaluate((el) => [...el.querySelectorAll(".pg-consola > *")].map((x) => x.textContent.trim()).filter(Boolean).join(" ‖ "));
async function esperarConsola(h, re, max) {   // hasta que la consola del playground tenga una línea que case con re
  const t0 = Date.now();
  while (Date.now() - t0 < max) { const c = await consola(h); if (re.test(c)) return c; await espera(300); }
  return (await consola(h)) + " (tope de " + max + " ms)";
}
try {
  console.log("===== EJERCICIOS Y EJEMPLOS");
  await (async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const errores = [];
    page.on("console", (m) => { if (["error", "warning", "warn"].includes(m.type())) errores.push(m.type() + ": " + m.text().slice(0, 300)); });
    page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
    for (const h of await page.$$(".js-playground")) {
      const t = await titulo(h);
      if (/Ejercicio 7\.5\.\d/.test(t)) {
        await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
        const partida = await esperarConsola(h, /[✓✗]/, 15000);
        await h.evaluate((el) => { const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
        const sol = await esperarConsola(h, /[✓✗]/, 15000);
        console.log(`${t}\n   partida: ${partida}\n   solución: ${sol}`);
        await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
        await espera(500);
      } else if (/Ejemplo 7\.5\.[234]/.test(t)) {
        await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await espera(3000);
        const frame = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
        const leerInfo = () => frame.evaluate(() => (document.getElementById("info") || {}).textContent || "");
        console.log(`${t}\n   info: ${await leerInfo()}`);
        if (/7\.5\.2/.test(t)) {
          await frame.evaluate(() => { const s = document.getElementById("formato"); s.value = "RGBA16F"; s.onchange({ target: s }); });
          await espera(2000);
          console.log(`   tras RGBA16F: ${await leerInfo()}`);
        }
        if (/7\.5\.4/.test(t)) {
          for (const [metodo, n] of [["tf", "16384"], ["cpu", "16384"], ["texturas", "16384"], ["tf", "1048576"], ["texturas", "1048576"]]) {
            await frame.evaluate((metodo, n) => {
              const s = document.getElementById("metodo"); s.value = metodo; s.onchange({ target: s });
              document.querySelector(`#botones button[data-n="${n}"]`).click();
            }, metodo, n);
            await espera(2500);
            await frame.evaluate(() => document.getElementById("medir").click());
            await espera(3000);
            console.log(`   ${metodo} ${n}: ${await leerInfo()}`);
          }
        }
        const c = await consola(h); if (c) console.log(`   consola: ${c}`);
      }
    }
    console.log("errores/avisos de consola:", errores.length ? "\n  " + errores.join("\n  ") : "ninguno");
    await page.close();
  })().catch((e) => console.log("ERROR en EJERCICIOS:", e.message));

  console.log("===== SIN EXT_color_buffer_float");
  await (async () => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const sinExt = () => {
      const orig = WebGL2RenderingContext.prototype.getExtension;
      WebGL2RenderingContext.prototype.getExtension = function (n) { return n === "EXT_color_buffer_float" ? null : orig.call(this, n); };
    };
    await page.evaluateOnNewDocument(sinExt);
    page.on("frameattached", async (f) => { try { await f.evaluate(sinExt); } catch (e) {} });
    const errores = [];
    page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
    for (const h of await page.$$(".js-playground")) {
      const t = await titulo(h);
      if (!/Ejemplo 7\.5\.[234]|Ejercicio 7\.5\.[12]/.test(t)) continue;
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await espera(4000);
      const frame = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
      const r = await frame.evaluate(() => ({
        ext: (() => { const c = document.createElement("canvas").getContext("webgl2"); return !!(c && c.getExtension("EXT_color_buffer_float")); })(),
        info: (document.getElementById("info") || {}).textContent || "",
      }));
      let linea = `${t}\n   ¿extensión visible en el iframe? ${r.ext}\n   info: ${r.info}\n   consola: ${await consola(h)}`;
      if (/Ejercicio/.test(t)) {   // también la solución, sin la extensión
        await h.evaluate((el) => { const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
        await espera(5000);
        linea += `\n   solución, consola: ${await consola(h)}`;
        await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
      }
      console.log(linea);
    }
    console.log("excepciones de página:", errores.length ? errores.join(" | ") : "ninguna");
    await page.close();
  })().catch((e) => console.log("ERROR en SIN EXTENSION:", e.message));
} finally { await browser.close(); }
