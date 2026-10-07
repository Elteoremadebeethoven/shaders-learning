// 7.6 proyecto-final: ¿por qué dos capturas en pausa (bucle dormido) salen distintas? (agente m7b, sesión 4)
// Cuenta las llamadas a requestAnimationFrame alrededor de cada captura y compara capturas hechas con
// captureBeyondViewport true (por defecto en Puppeteer) y false, y con el puntero dentro y fuera de la ventana.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import crypto from "node:crypto";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
try {
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    const raf = window.requestAnimationFrame.bind(window); window.__raf = 0; window.__eventos = [];
    window.requestAnimationFrame = (f) => { window.__raf++; return raf(f); };
    for (const t of ["resize", "pointermove", "pointerleave", "pointerout", "scroll"]) window.addEventListener(t, () => window.__eventos.push(t), true);
  });
  await page.goto("file:///Users/alex/Projects/shaders/modulos/07-integracion/proyecto-final/index.html?depurar", { waitUntil: "load" });
  await espera(2500);
  const hash = (buf) => crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
  const estado = () => page.evaluate(() => ({ raf: window.__raf, eventos: window.__eventos.splice(0).join(","), panel: document.querySelector(".hero-depuracion output").textContent }));
  const dormir = async () => { for (let i = 0; i < 40; i++) { const a = await page.evaluate(() => window.__raf); await espera(1500); if ((await page.evaluate(() => window.__raf)) === a) return true; } return false; };
  await page.click(".hero-pausa");
  for (const [nombre, x, y] of [["puntero en la esquina (dentro)", 1435, 5], ["puntero en el centro", 720, 450]]) {
    await page.mouse.move(x, y, { steps: 5 });
    console.log(`\n== ${nombre}: dormido = ${await dormir()}`, JSON.stringify(await estado()));
    for (const cbv of [true, false]) {
      const e0 = await estado();
      const a = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 }, captureBeyondViewport: cbv });
      const e1 = await estado();
      await espera(1000);
      const e2 = await estado();
      const c = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 }, captureBeyondViewport: cbv });
      const e3 = await estado();
      console.log(`captureBeyondViewport ${cbv}: ${hash(a)} vs ${hash(c)} ${hash(a) === hash(c) ? "IGUALES" : "DISTINTAS"} · rAF ${e0.raf}→${e1.raf}→${e2.raf}→${e3.raf} · eventos: [${e1.eventos}] [${e2.eventos}] [${e3.eventos}]`);
      console.log("   panel:", e3.panel);
      await espera(500); await dormir();
    }
  }
} finally { await b.close(); }
