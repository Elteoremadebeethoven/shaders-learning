// s4-m7a: tabla de «Presupuesto de rendimiento» de 7.1 y comportamiento de la calidad adaptativa, en el M1
// (Chrome 154 headless, ANGLE/Metal), con el shader del ejemplo 7.1.7 a 1440 × 900. Turno --exclusivo.
// Uso: node s4-m7a-71c.mjs <dir con presupuesto.html>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const DIR = process.argv[2];
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  protocolTimeout: 120000, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const out = { version: await nav.version() };
try {
  let page = await nav.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("file://" + DIR + "/presupuesto.html", { waitUntil: "load" });
  out.fija = [];
  for (const [it, e] of [[800, 1], [800, 0.75], [800, 0.5], [1500, 1], [1500, 0.75], [1500, 0.5]]) {
    out.fija.push(await page.evaluate((it, e) => window.fija(it, e, 45), it, e));
    await page.close(); page = await nav.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto("file://" + DIR + "/presupuesto.html", { waitUntil: "load" });
  }
  out.adaptativa1500 = await page.evaluate(() => window.adaptativa(1500, 20));
  await page.close(); page = await nav.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("file://" + DIR + "/presupuesto.html", { waitUntil: "load" });
  out.adaptativa2500 = await page.evaluate(() => window.adaptativa(2500, 20));
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
