// Sesión 5, lead: en el Chrome del dueño, con la pestaña OCULTA (document.visibilityState === "hidden": la ventana estaba
// detrás o minimizada), el playground «El mismo cálculo…» de 4.1 dio CPU 5,2–5,4 s, frente a 0,90–1,19 s en headless.
// ¿Es la pestaña oculta? Mismo Chrome con ventana (perfil temporal de puppeteer, no el del dueño): el playground 4 veces
// con la ventana normal y 4 veces con la ventana minimizada (CDP Browser.setWindowBounds), 4 s entre ejecuciones.
// Uso, desde herramientas/ y con turno exclusivo (abre una ventana en la pantalla unos segundos):
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s5-lead-oculta.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: false, protocolTimeout: 300000, defaultViewport: null,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--window-size=1280,900"],
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(4000);
  const cdp = await page.createCDPSession();
  const { windowId } = await cdp.send("Browser.getWindowForTarget");
  for (const estado of ["normal", "minimized", "normal"]) {
    await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: estado } });
    await dormir(1500);
    const vis = await page.evaluate(() => document.visibilityState);
    const r = [];
    for (let k = 0; k < 4; k++) {
      // el clic desde JS (en una ventana minimizada no hay clics de ratón)
      await page.evaluate((s) => document.querySelector(s + " .pg-btn.primario").click(), SEL);
      await dormir(estado === "minimized" ? 9000 : 4000);
      r.push(await page.evaluate((s) => (document.querySelector(s + " .pg-consola").innerText.match(/CPU \(JS, 1 hilo\): \d+ ms\s+·\s+GPU: [\d.]+ ms/) || ["?"])[0].replace(/\s+/g, " "), SEL));
    }
    console.log(`ventana ${estado.padEnd(9)} (visibilityState ${vis}):`, r.join(" | "));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
