// Sesión 4, lead (§3.2): el playground «¿Cuánto tarda cada llamada de verdad?» (4.1) da 1000 × getError = 58–70 ms con
// el Mac en reposo; 5.1 midió 37 µs por llamada (2000 seguidas). ¿Influye la rampa del reloj de la CPU (ver
// s4-lead-cpu-reposo.mjs)? En un iframe sandbox como el de los playgrounds, con un contexto WebGL2:
//   frío      1000 × getError tras 3 s de reposo
//   caliente  1000 × getError tras 250 ms de cálculo en este hilo
//   seguidos  10 bloques de 1000 × getError seguidos, tras 3 s de reposo (¿bajan bloque a bloque?)
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-geterror.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const CODIGO = `
const gl = document.createElement('canvas').getContext('webgl2');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
function ocupar(ms) { const t = performance.now(); let x = 0; while (performance.now() - t < ms) x += Math.sqrt(x + 1); return x; }
function mil() { const t0 = performance.now(); for (let i = 0; i < 1000; i++) gl.getError(); return performance.now() - t0; }
(async () => {
  const r = { frio: [], caliente: [], seguidos: [] };
  gl.clear(gl.COLOR_BUFFER_BIT); mil();
  for (let k = 0; k < 4; k++) {
    await dormir(3000);
    r.frio.push(mil());
    ocupar(250);
    r.caliente.push(mil());
  }
  await dormir(3000);
  for (let k = 0; k < 10; k++) r.seguidos.push(mil());
  parent.postMessage({ __r: r }, '*');
})();`;
const fila = (xs) => xs.map((x) => x.toFixed(0)).join(" ") + " ms";

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await nav.newPage();
  await page.goto("about:blank");
  for (let vez = 0; vez < 2; vez++) {
    const r = await page.evaluate((codigo) => new Promise((ok) => {
      const f = document.createElement("iframe");
      f.sandbox = "allow-scripts";
      f.style.cssText = "position:fixed;left:0;top:0;width:200px;height:100px";
      f.srcdoc = "<!doctype html><body><script>" + codigo + "<\/script></body>";
      addEventListener("message", function m(e) { if (e.data && e.data.__r) { removeEventListener("message", m); f.remove(); ok(e.data.__r); } });
      document.body.appendChild(f);
    }), CODIGO);
    console.log(`vez ${vez + 1} · 1000 × getError`);
    console.log("  frío    :", fila(r.frio));
    console.log("  caliente:", fila(r.caliente));
    console.log("  seguidos:", fila(r.seguidos));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
