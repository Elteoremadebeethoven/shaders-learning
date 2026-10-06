// QA de la lección 7.3: playgrounds JS en marcha (capturas y textos), ejercicios (consola), y experimentos sueltos.
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const S = "/tmp/claude-0/-home-user-shaders-learning/9b79b7cf-13d8-56ce-97bf-3314f2a27f6e/scratchpad/agentes/rev-m7-3";
const CAP = S + "/capturas-qa";
fs.mkdirSync(CAP, { recursive: true });
const LECCION = pathToFileURL("/home/user/shaders-learning/modulos/07-integracion/03-transiciones-shader.html").href;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const solo = process.argv[2] || "todo";

const nav = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
try {
  console.log("chrome lanzado", new Date().toISOString());
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 });
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });

  async function pg(titulo) {
    const hs = await page.$$(".js-playground");
    for (const h of hs) { const t = await h.evaluate((el) => el.dataset.titulo); if (t === titulo) return h; }
    throw new Error("no encuentro " + titulo);
  }
  async function marco(h) {
    for (let i = 0; i < 50; i++) {
      const f = await h.$("iframe"); if (f) { const fr = await f.contentFrame(); if (fr) return fr; }
      await espera(100);
    }
    throw new Error("sin iframe");
  }
  async function enMarco(h, fn) {
    for (let i = 0; i < 20; i++) {
      try { const fr = await marco(h); return await fr.evaluate(fn); } catch (e) { if (!/detached|destroyed|Execution context/.test(e.message)) throw e; await espera(150); }
    }
    throw new Error("marco inestable");
  }
  async function verLienzo(h) { // solo el lienzo del resultado, sin tocar el scroll ni el viewport
    return { screenshot: async (o) => {
      const r = await h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; });
      if (!(r.height > 0)) { console.log('  (aviso) lienzo con alto', r.height); return; }
      const est = await h.evaluate((el) => (el.querySelector(".estado") || {}).textContent);
      if (!/ejecutando/.test(est)) console.log("  (aviso) estado del playground:", est);
      return page.screenshot({ path: o.path, clip: r, captureBeyondViewport: false });
    } };
  }
  async function consola(h) { return h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent)); }
  async function centrar(h) { await h.evaluate((el) => el.scrollIntoView({ block: "center" })); }
  async function enfocarLienzo(h) { await h.evaluate((el) => el.querySelector(".pg-lienzo").scrollIntoView({ block: "center" })); }

  if (solo === "todo" || solo === "ejemplos") {
    // 7.3.2
    let h = await pg("Ejemplo 7.3.2 — Tween y muelle"); await enfocarLienzo(h); await marco(h);
    await espera(1300); await (await verLienzo(h)).screenshot({ path: CAP + "/732-a.png" });
    await espera(2500); await (await verLienzo(h)).screenshot({ path: CAP + "/732-b.png" });
    // 7.3.4
    h = await pg("Ejemplo 7.3.4 — Galería con instantáneas"); await enfocarLienzo(h); let fr = await marco(h);
    await espera(1700); await (await verLienzo(h)).screenshot({ path: CAP + "/734-a.png" });
    await espera(3500); console.log("7.3.4 info:", await enMarco(h, () => document.getElementById("info").textContent));
    await (await verLienzo(h)).screenshot({ path: CAP + "/734-b.png" });
    // 7.3.5
    h = await pg("Ejemplo 7.3.5 — Hover con muelle"); await enfocarLienzo(h); fr = await marco(h);
    await espera(1000); await (await verLienzo(h)).screenshot({ path: CAP + "/735-a.png" });
    console.log("7.3.5 info:", await enMarco(h, () => document.getElementById("info").textContent));
    // 7.3.6
    h = await pg("Ejemplo 7.3.6 — Overlay de página"); await enfocarLienzo(h); fr = await marco(h);
    const tiempos = [];
    for (const ms of [1050, 250, 250, 250]) { await espera(ms); tiempos.push(ms); await (await verLienzo(h)).screenshot({ path: CAP + "/736-" + tiempos.length + ".png" }); }
    await espera(2500);
    console.log("7.3.6 tras la demo:", await enMarco(h, () => ({ h1: document.querySelector("#contenido h1").textContent, actual: [...document.querySelectorAll("nav a[aria-current]")].map((a) => a.textContent), aviso: document.getElementById("aviso").textContent, foco: document.activeElement && document.activeElement.id, clase: document.body.className })));
    // 7.3.7
    h = await pg("Ejemplo 7.3.7 — Línea de tiempo"); await enfocarLienzo(h); fr = await marco(h);
    await espera(1300); await (await verLienzo(h)).screenshot({ path: CAP + "/737-a.png" });
    await espera(3000); await (await verLienzo(h)).screenshot({ path: CAP + "/737-b.png" });
    // 7.3.8
    h = await pg("Ejemplo 7.3.8 — Continuo frente a bajo demanda"); await enfocarLienzo(h); fr = await marco(h);
    await espera(3500); await (await verLienzo(h)).screenshot({ path: CAP + "/738.png" });
    console.log("7.3.8:", await enMarco(h, () => [document.getElementById("i1").textContent, document.getElementById("i2").textContent]));
  }

  if (solo === "todo" || solo === "ejercicios") {
    for (const [tit, ms] of [["Ejercicio 7.3.3", 1500], ["Ejercicio 7.3.4", 1500], ["Ejercicio 7.3.5", 8500]]) {
      const h = await pg(tit); await centrar(h); await marco(h);
      await espera(ms);
      console.log(tit, "partida:", JSON.stringify(await consola(h)));
      if (tit === "Ejercicio 7.3.5") await (await verLienzo(h)).screenshot({ path: CAP + "/ej735-partida.png" });
      await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
      await espera(300); await marco(h); await espera(ms);
      console.log(tit, "solución:", JSON.stringify(await consola(h)));
      if (tit === "Ejercicio 7.3.5") await (await verLienzo(h)).screenshot({ path: CAP + "/ej735-sol.png" });
      await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click());
    }
    // 7.3.5 sin puntero.visto: ¿falla la primera prueba? (la caja está en (0,0) del iframe)
    const h = await pg("Ejercicio 7.3.5"); await centrar(h);
    await h.evaluate((el) => {
      const pgx = el._playground; const sol = el.querySelector('script[type="text/x-js"][data-solucion]').textContent;
      const sinVisto = sol.replace("const persigue = puntero.visto && ", "const persigue = ");
      pgx.editores.js.setValue(sinVisto); pgx.ejecutar();
    });
    await espera(300); const fr = await marco(h); await espera(1200);
    console.log("7.3.5 sin visto, rect del canvas:", await enMarco(h, () => { const r = document.getElementById("c").getBoundingClientRect(); return [r.left, r.top]; }));
    await espera(7300);
    console.log("7.3.5 solución sin puntero.visto:", JSON.stringify(await consola(h)));
  }
} finally {
  await nav.close();
}
