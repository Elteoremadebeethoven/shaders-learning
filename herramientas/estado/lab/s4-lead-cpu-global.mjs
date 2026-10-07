// Sesión 4, lead (§3.2): el playground de 4.1 da 1,8–2,4 s de CPU con el Mac en reposo, pero el mismo bucle dentro de
// una función da 0,97 s (s4-lead-cpu.mjs). Diferencia: el playground ejecuta el código como <script> de nivel superior
// (const N y function enCPU globales del script). Variantes, todas en un iframe sandbox como el del playground y
// lanzadas igual que lo hace playground-js.js (un <script> dinámico):
//   A. el código tal cual (nivel superior: N es una constante global del script)
//   B. el mismo código dentro de una función (N es local de esa función)
//   C. nivel superior, pero enCPU copia N en una variable local antes del bucle
//   D. nivel superior con var N (propiedad de window) en vez de const
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-global.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const BASE = `const N = 400;
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
let t0 = performance.now();
enCPU(4096);
const msCPU = (performance.now() - t0) * (PIXELES / 4096);
t0 = performance.now();
enCPU(PIXELES);
const msTodo = performance.now() - t0;
parent.postMessage([msCPU, msTodo], "*");`;
const VARIANTES = {
  "A. nivel superior (como el playground)": BASE,
  "B. dentro de una función": "(function () {\n" + BASE + "\n})();",
  "C. nivel superior, const n = N local": BASE.replace("function enCPU(pixeles) {\n  let total = 0;", "function enCPU(pixeles) {\n  const n = N; let total = 0;").replace("i < N;", "i < n;"),
  "D. nivel superior con var N": BASE.replace("const N = 400;", "var N = 400;"),
};
const resumen = (xs) => { const s = [...xs].sort((a, b) => a - b); return `mediana ${s[s.length >> 1].toFixed(0)} ms (de ${s[0].toFixed(0)} a ${s[s.length - 1].toFixed(0)})`; };

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await nav.newPage();
  await page.goto("about:blank");
  for (const [nombre, codigo] of Object.entries(VARIANTES)) {
    const r = [];
    for (let k = 0; k < 5; k++) {
      r.push(await page.evaluate((codigo) => new Promise((ok) => {
        const f = document.createElement("iframe");
        f.sandbox = "allow-scripts";
        // igual que el lanzador de playground-js.js: un <script> dinámico con el código
        f.srcdoc = "<!doctype html><body><script>(function(){var s=document.createElement('script');s.textContent=" +
          JSON.stringify(codigo).replace(/<\/script/gi, "<\\/script") + ";document.body.appendChild(s);})();<\/script></body>";
        addEventListener("message", function m(e) { removeEventListener("message", m); f.remove(); ok(e.data); });
        document.body.appendChild(f);
      }), codigo));
    }
    console.log(nombre.padEnd(42), "· extrapolado:", resumen(r.map((x) => x[0])), "· millón entero:", resumen(r.map((x) => x[1])));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
