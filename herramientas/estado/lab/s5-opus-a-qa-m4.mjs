// Sesión 5, opus-a. Uso (desde herramientas/): node turnos.mjs --agente … --motivo … -- node estado/lab/s5-opus-a-qa-m4.mjs 04-gpu/01-cpu-vs-gpu.html …
// QA de 0.1 y m4: consola de cada playground JS (y de su solución), botones dentro del iframe, y semántica (sem.html).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const RAIZ = "/Users/alex/Projects/shaders/modulos/";
const AQUI = new URL(".", import.meta.url).pathname;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const PESADOS = /El mismo cálculo|Divergencia medida|Acceso coherente|Cuánto tarda cada llamada|10 000 draw calls|Ejercicio 4\.1\.3|Ejercicio 4\.1\.4|32 capas/;
const archivos = process.argv.slice(2);
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
const out = [];
const L = (s) => { out.push(s); console.log(s); };
try {
  const page = await nav.newPage();
  page.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") L(`   [consola ${m.type()}] ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => L("   [pageerror] " + e.message));
  await page.goto("file://" + AQUI + "s5-opus-a-sem.html"); await dormir(800);
  L("== sem.html\n" + JSON.stringify(await page.evaluate(() => window.__R), null, 1));
  for (const f of archivos) {
    await page.goto("file://" + RAIZ + f); await dormir(1500);
    L("\n== " + f);
    const n = await page.$$eval(".js-playground", (els) => els.length);
    for (let i = 0; i < n; i++) {
      const sel = `.js-playground:nth-of-type(1)`; // no se usa
      const info = await page.evaluate((i) => { const el = document.querySelectorAll(".js-playground")[i]; el.scrollIntoView({ block: "center" }); return { t: el.dataset.titulo, sol: !!el.querySelector(".pg-btn.solucion") }; }, i);
      if (PESADOS.test(info.t)) { L(`-- [${i}] ${info.t}: (pesado, se mide aparte)`); continue; }
      const leer = async () => {
        let prev = "", estable = 0;
        for (let k = 0; k < 40; k++) {
          await dormir(300);
          const txt = await page.evaluate((i) => document.querySelectorAll(".js-playground")[i].querySelector(".pg-consola").innerText, i);
          if (txt && txt === prev) { if (++estable >= 5) return txt; } else { estable = 0; prev = txt; }
        }
        return prev;
      };
      L(`-- [${i}] ${info.t}\n` + (await leer()).trim().split("\n").map((s) => "   " + s).join("\n"));
      if (/bufferData copia|microscopio/.test(info.t)) {
        const fh = await page.evaluateHandle((i) => document.querySelectorAll(".js-playground")[i].querySelector("iframe"), i);
        const fr = await fh.asElement().contentFrame();
        await fr.click("#errores"); await dormir(800);
        L("   (tras pulsar el botón)\n" + (await leer()).trim().split("\n").slice(-4).map((s) => "   " + s).join("\n"));
      }
      if (info.sol) {
        await page.evaluate((i) => document.querySelectorAll(".js-playground")[i].querySelector(".pg-btn.solucion").click(), i);
        await dormir(500);
        L(`   SOLUCIÓN:\n` + (await leer()).trim().split("\n").map((s) => "   " + s).join("\n"));
      }
    }
  }
} finally { await nav.close();  }
process.exit(0);
