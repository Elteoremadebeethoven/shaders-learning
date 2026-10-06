import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const url = "file:///home/user/shaders-learning/modulos/07-integracion/05-particulas-gpu.html";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", protocolTimeout: 300000,
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const S = "/tmp/claude-0/-home-user-shaders-learning/9b79b7cf-13d8-56ce-97bf-3314f2a27f6e/scratchpad/agentes/rev-m7-5";
try {
console.log("===== EJERCICIOS");
await (async () => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errores = [];
  page.on("console", (m) => { if (["error", "warning", "warn"].includes(m.type())) errores.push(m.type() + ": " + m.text().slice(0, 300)); });
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
  const pgs = await page.$$(".js-playground, .playground");
  const vistos = new Set();
  for (const h of pgs) {
    const titulo = await h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent || el.dataset.titulo || "");
    if (vistos.has(titulo)) continue; vistos.add(titulo);
    const consola = async () => h.evaluate((el) => [...el.querySelectorAll(".pg-consola > *")].map((x) => x.textContent.trim()).filter(Boolean).join(" ‖ "));
    if (/Ejercicio 7\.5\.\d/.test(titulo)) {
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await espera(6000);
      const partida = await consola();
      await h.evaluate((el) => { const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
      await espera(7000);
      const sol = await consola();
      console.log(`${titulo}\n   partida: ${partida}\n   solución: ${sol}`);
      await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
      await espera(500);
    } else if (/Ejemplo 7\.5\.[234]/.test(titulo)) {
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await espera(4000);
      const frame = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
      const leerInfo = () => frame.evaluate(() => (document.getElementById("info") || {}).textContent || "");
      console.log(`${titulo}\n   info: ${await leerInfo()}`);
      if (/7\.5\.2/.test(titulo)) {
        await frame.evaluate(() => { const s = document.getElementById("formato"); s.value = "RGBA16F"; s.onchange({ target: s }); });
        await espera(3000);
        console.log(`   tras RGBA16F: ${await leerInfo()}`);
      }
      if (/7\.5\.4/.test(titulo)) {
        for (const [metodo, n] of [["tf", "16384"], ["cpu", "16384"], ["texturas", "16384"], ["tf", "65536"]]) {
          await frame.evaluate((metodo, n) => {
            const s = document.getElementById("metodo"); s.value = metodo; s.onchange({ target: s });
            document.querySelector(`#botones button[data-n="${n}"]`).click();
          }, metodo, n);
          await espera(2500);
          await frame.evaluate(() => document.getElementById("medir").click());
          await espera(4000);
          console.log(`   ${metodo} ${n}: ${await leerInfo()}`);
        }
      }
      const c = await consola(); if (c) console.log(`   consola: ${c}`);
    }
  }
  console.log("errores/avisos de consola:", errores.length ? "\n  " + errores.join("\n  ") : "ninguno");
})().catch((e) => console.log("ERROR en EJERCICIOS:", e.message));

console.log("===== SIN EXTENSION");
await (async () => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const sinExt = () => {
    const orig = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (n) { return n === "EXT_color_buffer_float" ? null : orig.call(this, n); };
  };
  await page.evaluateOnNewDocument(sinExt);
  page.on("frameattached", async (f) => { try { await f.evaluate(sinExt); } catch (e) {} });
  const consola = [];
  page.on("console", (m) => consola.push(m.type() + ": " + m.text().slice(0, 200)));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
  for (const h of await page.$$(".js-playground, .playground")) {
    const titulo = await h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent || "");
    if (!/Ejemplo 7\.5\.[234]|Ejercicio 7\.5\.1/.test(titulo)) continue;
    await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await espera(4000);
    const frame = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
    const r = await frame.evaluate(() => ({
      ext: (() => { const c = document.createElement("canvas").getContext("webgl2"); return !!(c && c.getExtension("EXT_color_buffer_float")); })(),
      info: (document.getElementById("info") || {}).textContent || "",
    }));
    const c = await h.evaluate((el) => [...el.querySelectorAll(".pg-consola > *")].map((x) => x.textContent.trim()).filter(Boolean).join(" ‖ "));
    console.log(`${titulo}\n   ¿extensión visible en el iframe? ${r.ext}\n   info: ${r.info}\n   consola: ${c}`);
  }
})().catch((e) => console.log("ERROR en SIN EXTENSION:", e.message));

console.log("===== LAB ?rapido");
await (async () => {
  const page = await browser.newPage();
  const consola = [];
  page.on("console", (m) => consola.push(m.type() + ": " + m.text().slice(0, 200)));
  page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
  await page.goto("file:///home/user/shaders-learning/herramientas/estado/lab/rev-m7-5-medir.html?rapido", { waitUntil: "load" });
  const r = await page.evaluate(() => medirTodo());
  console.log(JSON.stringify(r, null, 1));
  console.log("consola:", consola.join("\n"));
})().catch((e) => console.log("ERROR en LAB ?rapido:", e.message));

console.log("===== TEMAS");
await (async () => {
  for (const tema of ["light", "dark"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, tema);
    await page.goto("file:///home/user/shaders-learning/modulos/07-integracion/05-particulas-gpu.html", { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
    await page.evaluate(() => document.querySelectorAll(".js-playground, .glsl-playground").forEach((e) => e.remove()));
    const sel = ["svg.diagrama", "table", ".anotado", ".callout.bestiario"];
    let k = 0;
    for (const s of sel) {
      const els = await page.$$("main " + s);
      for (const [i, el] of els.entries()) {
        if (s === ".anotado" && i !== 3) continue;            // el anotado nuevo de L75.PASO
        if (s === ".callout.bestiario" && i !== 7) continue;  // el del aditivo
        await el.scrollIntoView();
        await el.screenshot({ path: `${S}/claro/${tema}-${(++k).toString().padStart(2, "0")}-${s.replace(/[^a-z]/g, "")}-${i}.png` });
      }
    }
    await page.close();
  }
})().catch((e) => console.log("ERROR en TEMAS:", e.message));
} finally { await browser.close(); }
