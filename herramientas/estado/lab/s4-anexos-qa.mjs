// QA visual de lo que cambió el agente «anexos» en la sesión 4: capturas de ventana en anclas concretas
// (oscuro/claro, 1280 y 390 px), errores de KaTeX, consola y filtro del glosario. Un solo Chrome.
// Uso: node s4-anexos-qa.mjs <dirCapturas>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
const OUT = process.argv[2] || "/tmp/qa-anexos";
fs.mkdirSync(OUT, { recursive: true });
const R = "file:///Users/alex/Projects/shaders/modulos/";
const paginas = [
  ["08-anexos/01-bestiario.html", ["s-transiciones", "s-webgl", "s-reves", "s-nan", "m7-7-struct-desalineado"]],
  ["08-anexos/04-glosario.html", ["g-cache-de-programas", "g-bucle-bajo-demanda", "g-alineacion", "g-diferencias-finitas", "g-stagger", "g-render-pipeline", "g-curl-noise", "g-fallback"]],
  ["08-anexos/02-chuleta-glsl.html", ["de-glsl-es-1-00-a-3-00"]],
  ["07-integracion/07-siguientes-pasos.html", ["pipelines-y-bind-groups-el-estado-congelado", "recursos-donde-seguir"]],
];
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const informe = [];
try {
  for (const [tema, ancho] of [["dark", 1280], ["light", 1280], ["dark", 390]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: ancho, height: ancho > 500 ? 900 : 844, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, tema);
    const consola = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consola.push(m.type() + ": " + m.text().slice(0, 200)); });
    page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
    for (const [rel, anclas] of paginas) {
      consola.length = 0;
      await page.goto(R + rel, { waitUntil: "load" });
      await new Promise((r) => setTimeout(r, 1500));
      const datos = await page.evaluate(() => ({
        katexErr: document.querySelectorAll(".katex-error").length,
        dolares: [...document.querySelectorAll("main p, main li, main dd, main td")].filter((e) => /\$[^$]+\$/.test(e.textContent) && !e.closest("pre,code,.no-math,.anotado,.playground")).map((e) => e.textContent.slice(0, 80)).slice(0, 5),
        scrollW: document.documentElement.scrollWidth,
        marcados: [...document.querySelectorAll(".ax-sintomas a.ax-roto, .ax-sintomas a[data-roto]")].length,
        cuenta: (document.querySelector(".ax-buscador .ax-cuenta") || {}).textContent || "",
      }));
      let filtro = null;
      if (rel.includes("glosario")) {
        filtro = await page.evaluate(async () => {
          const i = document.getElementById("gl-q");
          const r = {};
          for (const q of ["webgpu", "transicion", "bajo demanda", "cache de programas"]) {
            i.value = q; i.dispatchEvent(new Event("input"));
            await new Promise((x) => setTimeout(x, 50));
            r[q] = document.querySelector(".ax-buscador .ax-cuenta").textContent;
          }
          i.value = ""; i.dispatchEvent(new Event("input"));
          return r;
        });
      }
      informe.push({ tema, ancho, rel, ...datos, filtro, consola: [...consola] });
      for (const a of anclas) {
        await page.goto(R + rel + "#" + a, { waitUntil: "load" });
        await new Promise((r) => setTimeout(r, 900));
        const f = path.join(OUT, `${tema}-${ancho}-${rel.split("/")[1].replace(".html", "")}-${a}.png`);
        await page.screenshot({ path: f });
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(informe, null, 1));
