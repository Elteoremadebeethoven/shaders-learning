// Tiempos de GPU complementarios (sesión 4, agente m0-m6): ver la cabecera de s4-m0-m6-tiempos.html.
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente m0-m6 --motivo "…" -- node estado/lab/s4-m0-m6-tiempos.mjs [salida.json]
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const PAG = "file:///Users/alex/Projects/shaders/herramientas/estado/lab/s4-m0-m6-tiempos.html";
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const R = {};
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(PAG);
  R.gpu = await page.evaluate(() => LAB.gpu());
  R.version = await nav.version();
  const ids = process.argv[3] ? process.argv[3].split(",") : ["4.2-hack", "5.8-readpixels", "5.8-scissor", "5.8-pbo"];
  for (const id of ids) {
    const t0 = Date.now();
    R[id] = await page.evaluate((id) => LAB[id](), id);
    console.log(`\n## ${id} (${((Date.now() - t0) / 1000).toFixed(1)} s)\n` + JSON.stringify(R[id], null, 1));
  }
} finally { await nav.close(); }
console.log(R.gpu, R.version);
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(R, null, 1));
