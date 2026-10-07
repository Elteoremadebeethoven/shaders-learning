// Lanza los laboratorios de TIEMPOS de GPU de m7b (sesión 4) en UN Chrome (Apple M1, ANGLE/Metal):
//   7.5: s4-m7b-75-medir.html   7.6: s4-m7b-76-capacidad.html
// (7.4 va aparte: s4-m7b-74-tiempos.mjs). Uso: node s4-m7b-labs-gpu.mjs [--rapido] [75] [76]
// Con --rapido: prueba de humo (las cifras no valen). Medida real: con turno --exclusivo.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const args = process.argv.slice(2);
const RAPIDO = args.includes("--rapido");
const SEGUNDA = args.includes("--segunda");
const TERCERA = args.includes("--tercera");   // 3.ª tanda: 7.5, dibujar el estado inicial frente al simulado   // 2.ª tanda: 7.5 con la sincronización arreglada y 7.6 solo capacidad
const cuales = args.filter((a) => /^\d+$/.test(a));
const hacer = (k) => !cuales.length || cuales.includes(k);
const DIR = "file:///Users/alex/Projects/shaders/herramientas/estado/lab/";
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], headless: "new", protocolTimeout: 900000,
});
try {
  for (const [k, archivo] of [["75", "s4-m7b-75-medir.html"], ["76", "s4-m7b-76-capacidad.html"]]) {
    if (!hacer(k)) continue;
    const page = await nav.newPage();
    page.on("pageerror", (e) => console.error(k, "pageerror:", e.message));
    page.on("console", (m) => { if (m.type() !== "log") console.error(k, "consola:", m.type(), m.text().slice(0, 300)); });
    await page.goto(DIR + archivo + ("?" + [RAPIDO && "rapido", SEGUNDA && "segunda", TERCERA && "tercera"].filter(Boolean).join("&")), { waitUntil: "load" });
    const t0 = Date.now();
    const r = SEGUNDA && k === "76" ? { tamaños: "(no se repite)" } : await page.evaluate(() => medirTodo());
    if (k === "76") {   // el método de capacidad con rAF (la página debe estar al frente para tener frames)
      await page.bringToFront();
      r.capacidadRAF = await page.evaluate(() => medirCapacidad());
      r.fiableOtraVez = await page.evaluate(() => [medirTamaño(720, 450), medirTamaño(1440, 900), medirTamaño(2880, 1800)]);
    }
    console.log(`===== ${archivo} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    console.log(JSON.stringify(r, null, 1));
    await page.close();
  }
} finally {
  await nav.close();
}
