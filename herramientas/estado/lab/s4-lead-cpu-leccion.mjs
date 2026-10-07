// Sesión 4, lead (§3.2): el playground «El mismo cálculo en tu CPU y en tu GPU» (4.1) da 1,8–2,4 s de CPU con el Mac
// en reposo, y el mismo bucle en un iframe sandbox sobre about:blank da 0,97 s (s4-lead-cpu*.mjs). ¿Es el documento del
// playground o la página de la lección?
//   E1. about:blank + iframe sandbox con el srcdoc EXACTO que genera playground-js.js para ese playground
//   E2. la lección tal cual, botón «Ejecutar» del playground
//   E3. la lección sin los demás playgrounds (se quitan del DOM: sus iframes desaparecen), botón «Ejecutar»
//   E4. la lección tal cual, pero la pestaña en segundo plano frente a otra (¿prioridad del proceso?)
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-leccion.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const VECES = 4;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cpu = (txt) => +((/CPU \(JS, 1 hilo\): (\d+) ms/.exec(txt) || [])[1] || NaN);
const resumen = (xs) => { const s = [...xs].sort((a, b) => a - b); return `${s.map((x) => x.toFixed(0)).join(", ")} ms`; };

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(5000);
  const srcdoc = await page.evaluate((s) => document.querySelector(s + " iframe").srcdoc, SEL);
  const ejecutar = async (p) => {
    await p.evaluate((s) => document.querySelector(s + " .pg-btn.primario").click(), SEL);
    await dormir(4500);
    return p.evaluate((s) => document.querySelector(s + " .pg-consola").innerText, SEL);
  };

  // E2: la lección tal cual
  const e2 = [];
  for (let k = 0; k < VECES; k++) e2.push(cpu(await ejecutar(page)));
  console.log("E2 lección tal cual:                ", resumen(e2));

  // E4: la lección en segundo plano (otra pestaña delante)
  const otra = await nav.newPage();
  await otra.goto("about:blank");
  await otra.bringToFront();
  const e4 = [];
  for (let k = 0; k < VECES; k++) e4.push(cpu(await ejecutar(page)));
  console.log("E4 lección en segundo plano:        ", resumen(e4));
  await page.bringToFront();

  // E1: el mismo srcdoc en about:blank
  await otra.evaluate(() => { window.__r = []; addEventListener("message", (e) => { if (e.data && e.data.__pg && e.data.tipo === "log") window.__r.push(e.data.texto); }); });
  const e1 = [];
  for (let k = 0; k < VECES; k++) {
    await otra.evaluate((doc) => { document.querySelectorAll("iframe").forEach((f) => f.remove()); window.__r = []; const f = document.createElement("iframe"); f.sandbox = "allow-scripts allow-pointer-lock"; f.srcdoc = doc; document.body.appendChild(f); }, srcdoc);
    await otra.bringToFront();
    await dormir(4500);
    e1.push(cpu((await otra.evaluate(() => window.__r.join("\n")))));
  }
  console.log("E1 srcdoc del playground en blanco: ", resumen(e1));
  await otra.close();
  await page.bringToFront();

  // E3: la lección sin los demás playgrounds
  const quitados = await page.evaluate((s) => {
    let n = 0;
    document.querySelectorAll(".js-playground, .glsl-playground, .graficador, canvas, iframe").forEach((el) => {
      if (!el.closest(s) && !el.querySelector(s)) { el.remove(); n++; }
    });
    return n;
  }, SEL);
  await dormir(3000);
  const e3 = [];
  for (let k = 0; k < VECES; k++) e3.push(cpu(await ejecutar(page)));
  console.log(`E3 lección sin los demás (${quitados} quitados):`, resumen(e3));
  console.log(await nav.version());
} finally { await nav.close(); }
