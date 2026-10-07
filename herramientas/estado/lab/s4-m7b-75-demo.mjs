// 7.5, ejemplo 7.5.4 (agente m7b, sesión 4): cifras de la demo grande en el M1 con su propio botón
// «medir GPU» (20 frames completos + readPixels del canvas) y los fps que muestra, por método y número de
// partículas. Ventana 1280 × 900, DPR 1 (el búfer del playground se imprime). Con turno --exclusivo.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const url = "file:///Users/alex/Projects/shaders/modulos/07-integracion/05-particulas-gpu.html";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
try {
  const page = await b.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 60000 });
  let h = null;
  for (const x of await page.$$(".js-playground")) if (/Ejemplo 7\.5\.4/.test(await x.evaluate((el) => el.dataset.titulo || ""))) h = x;
  await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await espera(3000);
  const f = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
  console.log("búfer:", await f.evaluate(() => { const c = document.getElementById("c"); return c.width + "×" + c.height + " (CSS " + c.clientWidth + "×" + c.clientHeight + ", DPR " + devicePixelRatio + ")"; }));
  const casos = [["texturas", 1048576], ["tf", 1048576], ["texturas", 4194304], ["tf", 4194304], ["cpu", 16384], ["cpu", 65536], ["cpu", 262144], ["texturas", 65536]];
  for (const [metodo, n] of casos) {
    await f.evaluate((metodo, n) => { const s = document.getElementById("metodo"); s.value = metodo; s.onchange({ target: s }); document.querySelector(`#botones button[data-n="${n}"]`).click(); }, metodo, n);
    await espera(4000);
    const fps = await f.evaluate(() => document.getElementById("info").textContent);
    const medidas = [];
    for (let i = 0; i < 3; i++) {
      await f.evaluate(() => document.getElementById("medir").click());
      await espera(metodo === "cpu" ? 3000 : 1500);
      medidas.push((/medido: ([\d.]+)/.exec(await f.evaluate(() => document.getElementById("info").textContent)) || [])[1]);
    }
    console.log(`${metodo} ${n}: ${fps} · medir GPU ×3: ${medidas.join(" / ")} ms`);
  }
} finally { await b.close(); }
