// Sesión 4, lead (§3.2): el playground «El mismo cálculo…» (4.1) extrapola el millón de píxeles desde 4 096 (≈ 4 ms de
// cálculo) y da a veces 0,97 s y a veces 2,0–2,9 s. Hipótesis: en una ventana tan corta, el resultado depende de en qué
// nivel del JIT de V8 está el bucle (el código optimizado de TurboFan se compila en otro hilo y llega cuando llega).
// Prueba: tras el mismo calentamiento (enCPU(256)), se miden 40 trozos SEGUIDOS de 4 096 píxeles, cada uno con su
// tiempo (extrapolado al millón como en la lección). Si la hipótesis es cierta, los primeros trozos son lentos y de
// golpe pasan a ~0,9 s. En un iframe sandbox, sobre about:blank y con la lección 4.1 abierta, 3 veces cada uno.
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-trozos.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const CODIGO = `const N = 400;
const PIXELES = 1024 * 1024;
function enCPU(pixeles) {
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
enCPU(256);
const trozos = [];
for (let k = 0; k < 40; k++) { const t0 = performance.now(); enCPU(4096); trozos.push((performance.now() - t0) * (PIXELES / 4096)); }`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fila = (xs) => xs.map((x) => (x / 1000).toFixed(1)).join(" ");

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
    f.srcdoc = "<!doctype html><body><script>(function(){var s=document.createElement('script');s.textContent=" +
      JSON.stringify(codigo + "\nparent.postMessage({__t: trozos}, '*');") + ";document.body.appendChild(s);})();<\/script></body>";
    addEventListener("message", function m(e) { if (e.data && e.data.__t) { removeEventListener("message", m); f.remove(); ok(e.data.__t); } });
    document.body.appendChild(f);
  }), CODIGO);
}
try {
  console.log("Cada fila: los 40 trozos seguidos, en segundos extrapolados al millón (como la lección)");
  console.log("Node   :", fila(new Function(CODIGO + "\nreturn trozos;")()));
  const page = await nav.newPage();
  await page.goto("about:blank");
  for (let k = 0; k < 3; k++) console.log("blank  :", fila(await enChrome(page)));
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(5000);
  for (let k = 0; k < 3; k++) console.log("lección:", fila(await enChrome(page)));
  console.log(await nav.version());
} finally { await nav.close(); }
