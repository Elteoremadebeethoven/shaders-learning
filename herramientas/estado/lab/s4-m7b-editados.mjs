// Capturas de lo que m7b editó en la sesión 4 (tablas y cajas de 7.4, 7.5 y 7.6), en tema claro y oscuro a 1280 px
// y en claro a 390 px (DPR 2). Uso: node s4-m7b-editados.mjs <carpeta>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const SAL = process.argv[2]; fs.mkdirSync(SAL, { recursive: true });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const B = "file:///Users/alex/Projects/shaders/modulos/07-integracion/";
// [archivo, selector (se captura el n-ésimo que contenga el texto), texto]
const OBJ = [
  ["04-vertex-animacion.html", "table.m7-medidas", "Vertex shader: dibujo completo"],
  ["04-vertex-animacion.html", "table.m7-medidas", "analítica (sin ε)"],
  ["04-vertex-animacion.html", "table.m7-medidas", "sin buffers, 6 vértices por celda"],
  ["04-vertex-animacion.html", "#m7-4-indices-uint16", ""],
  ["04-vertex-animacion.html", ".callout.bestiario", "granulado o chispas"],
  ["05-particulas-gpu.html", "table.m7-medidas", "Texturas + ping-pong"],
  ["06-proyecto-final.html", "table.m7-medidas", "Coste de una pasada (6.6)"],
  ["06-proyecto-final.html", ".callout.senior", "GPU que cambia de marcha"],
  ["06-proyecto-final.html", ".callout.hack", "Dale tus animaciones CSS"],
];
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const errores = [];
try {
  for (const [tema, ancho, dpr] of [["light", 1280, 1], ["dark", 1280, 1], ["light", 390, 2]]) {
    for (const archivo of [...new Set(OBJ.map((o) => o[0]))]) {
      const page = await nav.newPage();
      await page.setViewport({ width: ancho, height: 900, deviceScaleFactor: dpr });
      page.on("pageerror", (e) => errores.push(archivo + " " + e.message));
      await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, tema);
      await page.goto(B + archivo, { waitUntil: "load" });
      await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 30000 });
      await page.evaluate(() => document.querySelectorAll(".js-playground, .glsl-playground").forEach((e) => e.remove()));
      let k = 0;
      for (const [a, sel, txt] of OBJ) {
        if (a !== archivo) continue;
        const h = await page.evaluateHandle((sel, txt) => [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(txt)) || null, sel, txt);
        const el = h.asElement();
        if (!el) { errores.push("no encontrado: " + archivo + " " + sel + " " + txt); continue; }
        await el.evaluate((e) => e.scrollIntoView({ block: "start" }));
        await espera(250);
        const r = await el.evaluate((e) => { const b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: Math.min(b.height, 900) }; });
        await page.screenshot({ path: `${SAL}/${tema}-${ancho}-${archivo.slice(0, 2)}-${++k}.png`, clip: r, captureBeyondViewport: false });
      }
      await page.close();
    }
  }
} finally { await nav.close(); }
console.log("errores:", errores.length ? errores.join("\n") : "ninguno");
