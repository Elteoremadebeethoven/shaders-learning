// Sesión 5, lead: en headless, la demo «Comparativa: draw calls frente a instancing» de 5.9 dentro de la lección marcaba
// 60 fps con 4 M de instancias (73 ms de GPU por frame), pero una página mínima con el mismo dibujo baja a 15 fps
// (en la página, en un iframe y en un iframe sandbox; con DPR 1 o 2; con y sin alpha:false: s4-lead-raf-iframe.mjs).
// Bisección: el srcdoc EXACTO de la demo (MAX 4 M; modo instanciado y 4 M objetos puestos desde dentro del iframe)
//   A. dentro de la lección (como en s4-lead-instancing.mjs)
//   B. en un iframe sandbox sobre about:blank
// Headless, ventana 1440 × 900 con DPR 2 (como el laboratorio de 5.9).
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s5-lead-raf-demo.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/05-webgl/09-instancing.html";
const SEL = '.js-playground[data-titulo="Comparativa: draw calls frente a instancing"]';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
async function leer(fr) {
  await fr.evaluate(() => { const e = document.getElementById("n"); e.max = 4000000; e.value = 4000000; document.getElementById("modo").value = "instanciado"; });
  await dormir(3000);
  const l = [];
  for (let k = 0; k < 4; k++) { await dormir(1100); l.push(await fr.evaluate(() => document.getElementById("info").textContent.replace(/^.*?llamadas por frame · /, ""))); }
  return l.join(" | ");
}
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(1500);
  await page.evaluate((s) => {
    const cm = [...document.querySelectorAll(s + " .CodeMirror")].map((e) => e.CodeMirror).find((c) => c && c.getValue().includes("const MAX = 150000;"));
    cm.setValue(cm.getValue().replace("const MAX = 150000;", "const MAX = 4000000;"));
    document.querySelector(s + " .pg-btn.primario").click();
  }, SEL);
  await dormir(6000);
  const frA = await (await page.$(SEL + " iframe")).contentFrame();
  console.log("A. dentro de la lección      :", await leer(frA));
  const doc = await page.evaluate((s) => document.querySelector(s + " iframe").srcdoc, SEL);

  const blanco = await nav.newPage();
  await blanco.goto("about:blank");
  await blanco.evaluate((d) => { const f = document.createElement("iframe"); f.sandbox = "allow-scripts allow-pointer-lock"; f.style.cssText = "border:0;width:780px;height:420px"; f.srcdoc = d; document.body.appendChild(f); }, doc);
  await dormir(6000);
  const frB = await (await blanco.$("iframe")).contentFrame();
  console.log("B. sandbox sobre about:blank :", await leer(frB));
  await blanco.close();
  await page.bringToFront();
  await dormir(3000);
  console.log("A. otra vez en la lección    :", await leer(frA));
  console.log(await nav.version());
} finally { await nav.close(); }
