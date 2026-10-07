// Ejecuta s4-anexos-medidas.html (misma carpeta) en el Chrome del M1 y vuelca window.__res.
// Uso: node turnos.mjs --exclusivo --agente anexos --motivo "…" -- node <ruta>/s4-anexos-medidas.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const pagina = process.argv[2] || path.join(DIR, "s4-anexos-medidas.html");
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  console.log("browser.version():", await browser.version());
  const page = await browser.newPage();
  page.on("console", (m) => console.log("[consola]", m.text()));
  page.on("pageerror", (e) => console.log("[error]", e.message));
  await page.goto("file://" + pagina, { waitUntil: "load" });
  await page.waitForFunction(() => window.__res, { timeout: 120000 });
  const r = await page.evaluate(() => window.__res);
  console.log(JSON.stringify(r, null, 1));
  await page.close();
} finally {
  await browser.close();
}
