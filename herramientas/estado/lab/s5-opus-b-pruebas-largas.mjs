// Sesión 5 · opus-b: ejecuta la solución de cada playground cuyas pruebas imprimen ✓/✗ y espera un tiempo FIJO
// (no «hasta que dejen de llegar líneas», como verificar.mjs, que se corta si entre dos pruebas pasan más de ~1,5 s:
// p. ej. 7.3.5 imprime 2 líneas a los 3 s y otras 2 a los 7 s). Cuenta ✓ y ✗ por playground.
// Uso (con turno): node s5-opus-b-pruebas-largas.mjs <archivo.html>… [--espera 12000]
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
let espera = 12000;
const archivos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--espera") espera = +args[++i];
  else archivos.push(path.resolve(args[i]));
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
let malos = 0;
try {
  for (const f of archivos) {
    const page = await nav.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(pathToFileURL(f).href, { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 20000 });
    const pgs = await page.$$(".playground");
    for (const h of pgs) {
      if (!(await h.evaluate((el) => !!el.querySelector(".pg-btn.solucion")))) continue;
      const titulo = await h.evaluate((el) => el.dataset.titulo || "");
      await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await dormir(500);
      await h.evaluate((el) => { const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
      await dormir(800);
      const conPruebas = await h.evaluate((el) => [...el.querySelectorAll(".CodeMirror")].some((cm) => cm.CodeMirror && /[✓✗]/.test(cm.CodeMirror.getValue())));
      if (!conPruebas) { await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click()); await dormir(300); continue; }
      await dormir(espera);
      const lineas = await h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent.trim()));
      const ok = lineas.filter((t) => /^✓/.test(t)).length, mal = lineas.filter((t) => /^✗/.test(t));
      if (mal.length) malos++;
      console.log(`${mal.length ? "✗" : "✓"} ${path.basename(f)} «${titulo}»: ${ok} ✓, ${mal.length} ✗` + (mal.length ? "\n    " + mal.join("\n    ") : ""));
      await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
      await dormir(300);
    }
    if (errores.length) { malos++; console.log("  errores de página: " + errores.join(" | ")); }
    await page.close();
  }
} finally {
  await nav.close();
}
console.log(malos ? `\n${malos} con problemas` : "\ntodas las pruebas ✓");
