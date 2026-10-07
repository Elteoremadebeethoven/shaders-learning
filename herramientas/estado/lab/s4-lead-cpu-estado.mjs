// Sesión 4, lead (§3.2): tras cargar la lección 4.1, el bucle de CPU de «El mismo cálculo…» tarda 2,0–2,9 s en
// cualquier documento (también en about:blank); sin cargarla, 0,97 s (s4-lead-cpu-biseccion.mjs). ¿Es Chrome o es la
// máquina (frecuencia, temperatura, GPU compartiendo energía)? Mide el MISMO bucle en un iframe sandbox de Chrome y en
// este proceso de Node (otro proceso: si también se frena, es la máquina), en cuatro momentos:
//   T1 antes de cargar la lección · T2 con la lección abierta (playground a la vista) · T3 nada más volver a about:blank
//   T4 tras 40 s en about:blank
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-estado.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import { execSync } from "node:child_process";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const BUCLE = `function enCPU(pixeles, N) {
  let total = 0;
  for (let p = 0; p < pixeles; p++) {
    let a = p * 1e-4, b = a + 0.5, c = a + 0.25, d = a + 0.125;
    for (let i = 0; i < N; i++) {
      a = a * 0.999 + 0.001; b = b * 0.999 + 0.001;
      c = c * 0.999 + 0.001; d = d * 0.999 + 0.001;
    }
    total += a + b + c + d;
  }
  return total;
}
enCPU(256, 400);
const t0 = performance.now();
enCPU(65536, 400);
const ms = (performance.now() - t0) * 16;`;   // 65 536 píxeles × 16 = el millón
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const enNode = () => new Function(BUCLE + "\nreturn ms;")();
const lista = (xs) => xs.map((x) => x.toFixed(0)).join(", ") + " ms";
const termico = () => { try { return execSync("pmset -g therm", { encoding: "utf8" }).replace(/\s+/g, " ").trim().slice(0, 160); } catch { return "?"; } };

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
async function enChrome(page) {
  return page.evaluate((codigo) => new Promise((ok) => {
    const f = document.createElement("iframe");
    f.sandbox = "allow-scripts";
    f.style.cssText = "position:fixed;left:0;top:0;width:200px;height:100px;z-index:99999";
    f.srcdoc = "<!doctype html><body><script>" + codigo + "\nparent.postMessage({__ms: ms}, '*');<\/script></body>";
    addEventListener("message", function m(e) { if (e.data && "__ms" in e.data) { removeEventListener("message", m); f.remove(); ok(e.data.__ms); } });
    document.body.appendChild(f);
  }), BUCLE);
}
async function momento(nombre, page) {
  const c = [], n = [];
  for (let k = 0; k < 3; k++) { c.push(await enChrome(page)); n.push(enNode()); }
  console.log(nombre.padEnd(34), "Chrome:", lista(c).padEnd(24), "Node:", lista(n));
}
try {
  const page = await nav.newPage();
  console.log("térmico al empezar:", termico());
  await page.goto("about:blank");
  await momento("T1 antes de la lección", page);
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(5000);
  await momento("T2 con la lección abierta", page);
  await page.goto("about:blank");
  await momento("T3 recién vuelto a about:blank", page);
  await dormir(40000);
  await momento("T4 tras 40 s en about:blank", page);
  console.log("térmico al acabar:", termico());
  console.log(await nav.version());
} finally { await nav.close(); }
