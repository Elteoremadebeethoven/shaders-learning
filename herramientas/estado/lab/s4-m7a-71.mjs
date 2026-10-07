// s4-m7a: dos medidas de 7.1 en el M1 (Chrome 154, ANGLE/Metal). Ejecutar con turno --exclusivo.
// Uso: node s4-m7a-71.mjs <dir con domgl.html y compilar.html> [--rapido]
//  A) «Un único bucle»: separación entre un círculo WebGL y un cuadrado del DOM que recorren la misma circunferencia
//     a 440 px/s, en 40 capturas a intervalos aleatorios por modo (mismo rAF y tiempo del frame / mismo rAF y
//     performance.now() / setInterval 16 ms).
//  B) «Recarga en caliente»: shader grande sin caché: LINK_STATUS enseguida (bloqueo del hilo principal) frente a
//     sondear COMPLETION_STATUS_KHR una vez por frame.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const DIR = process.argv[2], RAPIDO = process.argv.includes("--rapido");
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const out = { version: await nav.version() };
const med = (v) => { const s = v.slice().sort((a, b) => a - b); return +s[s.length >> 1].toFixed(2); };
try {
  const page = await nav.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  await page.goto("file://" + DIR + "/domgl.html", { waitUntil: "load" });
  await dormir(800);
  out.A = {};
  for (const modo of ["mismo", "now", "intervalo"]) {
    await page.evaluate((m) => window.ponerModo(m), modo);
    await dormir(500);
    const capturas = [];
    for (let i = 0; i < (RAPIDO ? 6 : 40); i++) {
      await dormir(40 + Math.random() * 160);
      capturas.push(await page.screenshot({ type: "png", encoding: "base64", captureBeyondViewport: false }));
    }
    const d = [];
    for (const b of capturas) d.push(await page.evaluate((b) => window.medir(b), b));
    const v = d.filter((x) => x !== null);
    out.A[modo] = { n: v.length, mediana: med(v), max: +Math.max(...v).toFixed(2), min: +Math.min(...v).toFixed(2), todas: v.map((x) => +x.toFixed(1)) };
  }
  await page.goto("file://" + DIR + "/compilar.html", { waitUntil: "load" });
  await dormir(1000);
  out.B = [];
  for (const N of RAPIDO ? [5] : (process.env.NS ? process.env.NS.split(",").map(Number) : [10, 20, 40, 10, 20, 40])) out.B.push(await page.evaluate((N) => window.prueba(N), N));
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
