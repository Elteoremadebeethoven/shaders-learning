// Sesión 4, lead (§3.2): el srcdoc EXACTO del playground «El mismo cálculo…» (4.1) tarda 2,0–2,4 s de CPU también sobre
// about:blank (s4-lead-cpu-leccion.mjs, E1), y un documento mínimo con el mismo bucle 0,97 s. Bisección del srcdoc
// (todas las variantes avisan con postMessage justo después de calcular msCPU, sin pasar por console.log):
//   V0 srcdoc exacto · V1 sin el PUENTE (la consola del playground) · V2 el código cortado tras msCPU (sin WebGL)
//   V3 sin «//# sourceURL=tu-codigo.js» · V4 sin PUENTE, sin sourceURL y cortado (lo mínimo)
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-cpu-biseccion.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/04-gpu/01-cpu-vs-gpu.html";
const SEL = '.js-playground[data-titulo="El mismo cálculo en tu CPU y en tu GPU"]';
const VECES = 5;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const resumen = (xs) => [...xs].sort((a, b) => a - b).map((x) => x.toFixed(0)).join(", ") + " ms";

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
try {
  const page = await nav.newPage();
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(4000);
  const doc = await page.evaluate((s) => document.querySelector(s + " iframe").srcdoc, SEL);
  await page.goto("about:blank");

  const MARCA = "const msCPU = (performance.now() - t0) * (PIXELES / 4096);";
  if (!doc.includes(MARCA)) throw new Error("no encuentro la marca en el srcdoc");
  const AVISO = "parent.postMessage({__cpu: msCPU}, '*');";
  const conAviso = doc.replace(MARCA, MARCA + AVISO);
  const iP = conAviso.indexOf("<script>(function () {"), fP = conAviso.indexOf("</script>", iP) + 9;
  const sinPuente = (d) => d.slice(0, iP) + d.slice(fP);
  const cortar = (d) => { const a = d.indexOf(AVISO) + AVISO.length, b = d.indexOf("\\n//# sourceURL"); return d.slice(0, a) + d.slice(b); };
  const sinSource = (d) => d.replace("\\n//# sourceURL=tu-codigo.js", "");
  if (iP < 0 || fP < iP) throw new Error("no encuentro el PUENTE");
  const V = {
    "V0 srcdoc exacto": conAviso,
    "V1 sin PUENTE": sinPuente(conAviso),
    "V2 cortado tras msCPU": cortar(conAviso),
    "V3 sin sourceURL": sinSource(conAviso),
    "V4 mínimo (sin PUENTE, sin sourceURL, cortado)": sinSource(cortar(sinPuente(conAviso))),
  };
  for (const [nombre, d] of Object.entries(V)) {
    const r = [];
    for (let k = 0; k < VECES; k++) {
      r.push(await page.evaluate((d) => new Promise((ok) => {
        document.querySelectorAll("iframe").forEach((f) => f.remove());
        const f = document.createElement("iframe");
        f.sandbox = "allow-scripts allow-pointer-lock";
        addEventListener("message", function m(e) { if (e.data && "__cpu" in e.data) { removeEventListener("message", m); ok(e.data.__cpu); } });
        f.srcdoc = d;
        document.body.appendChild(f);
      }), d));
      await dormir(1500); // deja terminar la parte de GPU (V0, V1, V3) antes de la siguiente
    }
    console.log(nombre.padEnd(48), resumen(r));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
