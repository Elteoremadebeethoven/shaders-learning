// Ejecuta playgrounds JS de las lecciones (el código tal cual) y recoge lo que imprimen en su consola.
// Sesión 4, agente m0-m6. Para tiempos de GPU, lánzalo con turno --exclusivo.
// Uso, desde herramientas/:
//   node turnos.mjs --exclusivo --agente m0-m6 --motivo "…" -- node estado/lab/s4-m0-m6-playgrounds.mjs <salida.json> \
//        "04-gpu/01-cpu-vs-gpu.html|10 000 draw calls contra 1|3|4000" …
// Cada argumento: archivo (relativo a modulos/) | data-titulo | ejecuciones | espera en ms tras cada ejecución.
// Opcional: un 5.º campo «sol» pulsa «Ver solución» antes de ejecutar; un 6.º campo «A=>B» reemplaza el texto A por B
// en el editor JS (CodeMirror) antes de ejecutar (p. ej. «const N = 10000;=>const N = 100000;»).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";

const RAIZ = "/Users/alex/Projects/shaders/modulos/";
const [salida, ...casos] = process.argv.slice(2);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
});
const R = [];
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  let actual = null;
  for (const c of casos) {
    const [archivo, titulo, veces = "1", espera = "4000", sol, reemplazo] = c.split("|");
    if (archivo !== actual) { await page.goto("file://" + RAIZ + archivo); await dormir(1500); actual = archivo; }
    const sel = `.js-playground[data-titulo="${titulo}"]`;
    if (!(await page.$(sel))) { console.log("NO ENCONTRADO:", archivo, titulo); continue; }
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel);
    if (sol) {
      await page.evaluate((s) => document.querySelector(s + " .pg-btn.solucion")?.click(), sel);
    }
    if (reemplazo) {
      const [a, b] = reemplazo.split("=>");
      const ok = await page.evaluate((s, a, b) => {
        const cms = [...document.querySelectorAll(s + " .CodeMirror")].map((e) => e.CodeMirror).filter(Boolean);
        for (const cm of cms) { const v = cm.getValue(); if (v.includes(a)) { cm.setValue(v.replace(a, b)); return true; } }
        return false;
      }, sel, a, b);
      console.log("reemplazo", ok ? "hecho" : "NO ENCONTRADO", a, "→", b);
    }
    await dormir(+espera);
    const salidas = [];
    for (let k = 0; k < +veces; k++) {
      if (k > 0 || sol || reemplazo) {
        await page.evaluate((s) => document.querySelector(s + " .pg-btn.primario").click(), sel);
        await dormir(+espera);
      }
      const txt = await page.evaluate((s) => document.querySelector(s + " .pg-consola")?.innerText || "", sel);
      salidas.push(txt.trim());
      console.log(`\n### ${archivo} · ${titulo} · ejecución ${k + 1}\n${txt.trim()}`);
    }
    R.push({ archivo, titulo, salidas });
  }
  console.log("\n" + (await nav.version()));
} finally { await nav.close(); }
if (salida) fs.writeFileSync(salida, JSON.stringify(R, null, 1));
