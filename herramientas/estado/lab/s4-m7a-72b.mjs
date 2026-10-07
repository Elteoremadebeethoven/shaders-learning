// s4-m7a: ¿alinea Chrome 154 (M1, headless) los pointermove con el frame? Con el hilo principal libre y ocupado
// (el rAF trabaja 0 / 8 / 12 ms), entrada sintética a 250 Hz y ~1000 Hz por CDP (Input.dispatchMouseEvent).
// Uso: node s4-m7a-72b.mjs <dir con eventos-ocupado.html>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.argv[2] + "/";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const out = {};
const med = (v) => { const s = v.slice().sort((a, b) => a - b); return s.length ? +s[s.length >> 1].toFixed(2) : null; };
try {
  const page = await nav.newPage(); await page.setViewport({ width: 800, height: 600 });
  await page.goto(D + "eventos-ocupado.html"); await dormir(300);
  const c = await page.target().createCDPSession();
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 150 }); await dormir(300);
  for (const ocupado of [0, 8, 12]) for (const [nombre, n, cada] of [["250Hz", 40, 4], ["1000Hz", 120, 1]]) {
    await page.evaluate((o) => { window.ocupado = o; window.reg = []; window.rafT = []; }, ocupado);
    await dormir(200);
    for (let i = 0; i < n; i++) { c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + (i % 100) * 5, y: 200 + (i % 7) }); await dormir(cada); }
    await dormir(400);
    const r = await page.evaluate(() => ({ reg: window.reg, rafT: window.rafT }));
    // inicio del rAF (antes del trabajo): rafT guarda performance.now() DESPUÉS del bucle ocupado; restamos el trabajo
    const rafDe = Object.fromEntries(r.rafT.map(([f, now]) => [f, now - ocupado]));
    const pm = r.reg.filter((e) => e.tipo === "pointermove");
    const porFrame = {}; for (const e of pm) porFrame[e.frame] = (porFrame[e.frame] || 0) + 1;
    const antes = pm.map((e) => rafDe[e.frame + 1] - e.t).filter((x) => x > -50);
    out[`ocupado ${ocupado} ms · ${nombre}`] = { pointermove: pm.length, muestras: n, porFrame: Object.values(porFrame).join(","), sumaCoalescidos: pm.reduce((s, e) => s + e.n, 0),
      msAntesDelInicioDelRaf: { min: +Math.min(...antes).toFixed(2), mediana: med(antes), max: +Math.max(...antes).toFixed(2) } };
  }
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
