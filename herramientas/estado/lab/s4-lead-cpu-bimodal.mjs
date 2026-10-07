// Sesión 4, lead: con el playground corregido de 4.1 («El mismo cálculo…», calentamiento enCPU(131072) y medida de
// 65 536 píxeles), la CPU sale a veces ~0,90 s y a veces ~1,19 s (bimodal). Hipótesis: depende del compilador de V8
// que ha optimizado el bucle cuando empieza la medida (Maglev, el intermedio, o TurboFan, el mejor; los dos compilan
// en otro hilo). Prueba: el playground de la lección, 12 ejecuciones con 4 s de reposo entre ellas, en tres Chrome
// lanzados uno tras otro: V8 normal, sin Maglev (--no-maglev) y sin TurboFan (--no-turbofan).
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-bimodal.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const VECES = 12;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cpu = (txt) => +((/CPU \(JS, 1 hilo\): (\d+) ms/.exec(txt) || [])[1] || NaN);

for (const flags of ["", "--no-maglev", "--no-turbofan"]) {
  const nav = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new", protocolTimeout: 300000,
    args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"].concat(flags ? ["--js-flags=" + flags] : []),
    defaultViewport: { width: 1280, height: 900 },
  });
  try {
    const page = await nav.newPage();
    page.on("pageerror", (e) => console.log("pageerror:", e.message));
    await page.goto(LECCION);
    await dormir(1500);
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
    await dormir(4000);
    const r = [];
    for (let k = 0; k < VECES; k++) {
      await page.evaluate((s) => document.querySelector(s + " .pg-btn.primario").click(), SEL);
      await dormir(4000);
      r.push(cpu(await page.evaluate((s) => document.querySelector(s + " .pg-consola").innerText, SEL)));
    }
    console.log((flags || "V8 normal").padEnd(14), r.join(" "));
  } finally { await nav.close(); }
}
