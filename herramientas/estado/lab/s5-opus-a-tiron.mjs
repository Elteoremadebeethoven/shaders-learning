// Sesión 5, opus-a. Uso (desde herramientas/): node turnos.mjs --exclusivo --agente … --motivo … -- node estado/lab/s5-opus-a-tiron.mjs
// Tirón del primer dibujo (4.1, bestiario m4-tiron-primer-dibujo): enlazar, 1.º/2.º dibujo, 1.º con blending nuevo, precalentar con viewport 0.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const AQUI = new URL(".", import.meta.url).pathname;
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], defaultViewport: { width: 800, height: 700 } });
try {
  const page = await nav.newPage();
  await page.goto("file://" + AQUI + "s5-opus-a-tiron.html"); await new Promise((r) => setTimeout(r, 800));
  for (let tanda = 0; tanda < 2; tanda++) {
    const R = await page.evaluate(() => window.medir());
    const f = (v) => v.toFixed(2).padStart(6);
    console.log(`tanda ${tanda + 1}:  link   1.ºdib 2.ºdib  1.ºblend 2.ºblend  vp0(pre) 1.ºreal 2.ºreal`);
    for (const x of R) console.log(`        ${f(x.tLink)} ${f(x.d1)} ${f(x.d2)}   ${f(x.b1)}   ${f(x.b2)}    ${f(x.pre)}  ${f(x.tras)} ${f(x.tras2)}`);
  }
  console.log(await nav.version());
} finally { await nav.close(); }
process.exit(0);
