// ¿Por qué el bucle de CPU de 4.1 («El mismo cálculo en tu CPU y en tu GPU») tarda 2,3 s en headless y no 1,0–1,5 s?
// Sesión 4, lead (§3.2 del plan). Mide el MISMO bucle (código copiado del playground) en tres sitios:
//   1. Node (V8 sin navegador, referencia del núcleo de alto rendimiento),
//   2. una página headless de nivel superior (about:blank),
//   3. un iframe sandbox como el de los playgrounds (srcdoc con sandbox="allow-scripts"),
// cada uno 7 veces (mediana y extremos), extrapolando al millón de píxeles igual que la lección.
// Uso, desde herramientas/ y con turno exclusivo (el Mac en reposo):
//   node turnos.mjs --exclusivo --agente lead --motivo "CPU de 4.1" -- node estado/lab/s4-lead-cpu.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const CODIGO = `
const N = 400, PIXELES = 1024 * 1024;
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
let t0 = performance.now();
enCPU(4096);
const msCPU = (performance.now() - t0) * (PIXELES / 4096);
// además, el millón entero (sin extrapolar), para ver si la extrapolación de 4096 píxeles engaña
t0 = performance.now();
enCPU(PIXELES);
const msTodo = performance.now() - t0;
[msCPU, msTodo];`;
const resumen = (xs) => { const s = [...xs].sort((a, b) => a - b); return `mediana ${s[s.length >> 1].toFixed(0)} ms (de ${s[0].toFixed(0)} a ${s[s.length - 1].toFixed(0)})`; };
const VECES = 7;

const node = [];
for (let k = 0; k < VECES; k++) node.push(new Function(CODIGO.replace(/\[msCPU, msTodo\];$/, "return [msCPU, msTodo];"))());
console.log("Node", process.version, "· extrapolado:", resumen(node.map((x) => x[0])), "· millón entero:", resumen(node.map((x) => x[1])));

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await nav.newPage();
  await page.goto("about:blank");
  const sup = [];
  for (let k = 0; k < VECES; k++) sup.push(await page.evaluate(`(() => { ${CODIGO.replace(/\[msCPU, msTodo\];$/, "return [msCPU, msTodo];")} })()`));
  console.log("Página de nivel superior · extrapolado:", resumen(sup.map((x) => x[0])), "· millón entero:", resumen(sup.map((x) => x[1])));

  // iframe sandbox (sin allow-same-origin): en Chrome real va en otro proceso, como los playgrounds
  const ifr = [];
  for (let k = 0; k < VECES; k++) {
    const r = await page.evaluate((codigo) => new Promise((ok) => {
      const f = document.createElement("iframe");
      f.sandbox = "allow-scripts";
      f.srcdoc = `<script>const r = (function(){ ${codigo.replace(/\[msCPU, msTodo\];$/, "return [msCPU, msTodo];")} })(); parent.postMessage(r, "*");<\/script>`;
      addEventListener("message", function m(e) { removeEventListener("message", m); f.remove(); ok(e.data); });
      document.body.appendChild(f);
    }), CODIGO);
    ifr.push(r);
  }
  console.log("iframe sandbox · extrapolado:", resumen(ifr.map((x) => x[0])), "· millón entero:", resumen(ifr.map((x) => x[1])));
  console.log(await nav.version());
} finally { await nav.close(); }
