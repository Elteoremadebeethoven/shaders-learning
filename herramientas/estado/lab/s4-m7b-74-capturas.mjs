// Capturas propias de los playgrounds de 7.4 con interacciones (versión s4-m7b para el Mac de
// rev-m7-4-capturas.mjs). Las fotos de playgrounds se hacen con page.screenshot({ clip, captureBeyondViewport:
// false }) en coordenadas del documento (la captura de elemento hace que el IntersectionObserver duerma o
// recree el iframe: PLAN §3.7). Uso: node s4-m7b-74-capturas.mjs <salida> [tema] [ancho] [alto] [dpr]
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const SAL = process.argv[2] || "./cap2";
const TEMA = process.argv[3] || "dark";
const ANCHO = +(process.argv[4] || 1280);
fs.mkdirSync(SAL, { recursive: true });
const URL = "file:///Users/alex/Projects/shaders/modulos/07-integracion/04-vertex-animacion.html";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: ANCHO, height: +(process.argv[5] || 1400), deviceScaleFactor: +(process.argv[6] || 1) },
});
const errores = [];
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("console", (m) => { if (["error", "warn", "warning"].includes(m.type())) errores.push(m.type() + ": " + m.text()); });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); Object.keys(localStorage).filter((k) => k.startsWith("pg")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} }, TEMA);
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
  const pgs = await page.$$(".js-playground");
  async function marco(h) {
    const ifr = await h.$("iframe");
    return ifr ? await ifr.contentFrame() : null;
  }
  async function fotoDe(pg, h, ruta) {   // pg: página; h: el elemento (o su .playground)
    const r = await h.evaluate((el) => { const e = el.closest(".playground") || el; const b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: Math.min(b.height, innerHeight) }; });
    await pg.screenshot({ path: ruta, clip: r, captureBeyondViewport: false });
  }
  const foto = (h, ruta) => fotoDe(page, h, ruta);
  async function ver(h, nombre, ms = 2500) {
    await h.evaluate((el) => (el.closest(".playground") || el).scrollIntoView({ block: "center" }));
    await espera(ms);
    await foto(h, `${SAL}/${nombre}.png`);
  }
  async function enMarco(h, fn, arg) {
    const f = await marco(h);
    if (!f) return "sin iframe";
    try { return await f.evaluate(fn, arg); } catch (e) { return "error: " + e.message; }
  }
  const nombres = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "x1", "x2", "x3", "x4", "x5"];
  for (let i = 0; i < pgs.length; i++) {
    const h = pgs[i], n = nombres[i] || "p" + i;
    await ver(h, n);
    const info = await enMarco(h, () => { const d = document.getElementById("info"); return d ? d.textContent : ""; });
    console.log(n, "info:", info);
    if (n === "e1") {
      await enMarco(h, () => { const r = document.getElementById("n"); r.value = 300; r.dispatchEvent(new Event("input")); const c = document.getElementById("u16"); c.checked = true; c.dispatchEvent(new Event("change")); });
      await espera(3000);
      console.log("e1 u16 info:", await enMarco(h, () => document.getElementById("info").textContent));
      await foto(h, `${SAL}/e1-u16-300.png`);
      await enMarco(h, () => { const r = document.getElementById("n"); r.value = 8; r.dispatchEvent(new Event("input")); const c = document.getElementById("u16"); c.checked = false; c.dispatchEvent(new Event("change")); const k = document.getElementById("k"); k.value = 10; k.dispatchEvent(new Event("input")); });
      await espera(2500);
      await foto(h, `${SAL}/e1-n8-k10.png`);
    }
    if (n === "e2") {
      for (const m of [1, 2]) {
        await enMarco(h, (m) => { const s = document.getElementById("modo"); s.value = String(m); s.dispatchEvent(new Event("change")); }, m);
        await espera(2000);
        await foto(h, `${SAL}/e2-modo${m}.png`);
      }
    }
    if (n === "e3") {
      for (const [m, eps, org] of [[0, -2, 0], [1, -5, 1000], [1, -3, 1000], [3, -2, 0]]) {
        await enMarco(h, ([m, eps, org]) => {
          const s = document.getElementById("modo"); s.value = String(m); s.dispatchEvent(new Event("change"));
          const e = document.getElementById("eps"); e.value = eps; e.dispatchEvent(new Event("input"));
          const o = document.getElementById("origen"); o.value = String(org); o.dispatchEvent(new Event("change"));
        }, [m, eps, org]);
        await espera(2000);
        await foto(h, `${SAL}/e3-m${m}-eps${eps}-o${org}.png`);
      }
    }
    if (n === "e4") {
      for (const m of [1, 2, 3]) {
        await enMarco(h, (m) => { const s = document.getElementById("modo"); s.value = String(m); s.dispatchEvent(new Event("change")); }, m);
        await espera(2000);
        await foto(h, `${SAL}/e4-modo${m}.png`);
      }
    }
    if (n === "e5") {
      await enMarco(h, () => { const c = document.getElementById("dosCaras"); c.checked = false; c.dispatchEvent(new Event("change")); });
      await espera(1500);
      await foto(h, `${SAL}/e5-sin-dos-caras.png`);
    }
    if (n === "e7") {
      for (const m of [0, 1]) {
        await enMarco(h, (m) => { const s = document.getElementById("tam"); s.value = String(m); s.dispatchEvent(new Event("change")); }, m);
        await espera(1500);
        await foto(h, `${SAL}/e7-tam${m}.png`);
      }
      await enMarco(h, () => document.getElementById("mitad").click());
      await espera(2000);
      console.log("e7 mitad info:", await enMarco(h, () => document.getElementById("info").textContent));
      await foto(h, `${SAL}/e7-tam1-mitad.png`);
    }
    const tieneSol = await h.evaluate((el) => !!(el.closest(".playground") || el).querySelector(".pg-btn.solucion"));
    if (tieneSol) {
      await h.evaluate((el) => (el.closest(".playground") || el).querySelector(".pg-btn.solucion").click());
      await espera(4000);
      await foto(h, `${SAL}/${n}-sol.png`);
      const cons = await h.evaluate((el) => [...(el.closest(".playground") || el).querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent).join(" | "));
      console.log(n, "sol consola:", cons.slice(0, 300));
    }
  }
  // la demo 2D
  const demo = await page.$("#demo-normal-2d");
  await demo.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await espera(800);
  await demo.screenshot({ path: `${SAL}/demo.png` });
  await page.close();
  // ---- tema claro ----
  const pc = await nav.newPage();
  await pc.setViewport({ width: 1280, height: 1400 });
  pc.on("pageerror", (e) => errores.push("claro pageerror: " + e.message));
  await pc.evaluateOnNewDocument(() => { try { localStorage.setItem("curso-tema", JSON.stringify("light")); } catch (e) {} });
  await pc.goto(URL, { waitUntil: "load" });
  await pc.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  await pc.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
  const svgs = await pc.$$("svg.diagrama");
  for (let i = 0; i < svgs.length; i++) { await svgs[i].evaluate((el) => el.scrollIntoView({ block: "center" })); await espera(300); await svgs[i].screenshot({ path: `${SAL}/claro-svg${i + 1}.png` }); }
  const tabs = await pc.$$("main table");
  for (let i = 0; i < tabs.length; i++) { await tabs[i].evaluate((el) => el.scrollIntoView({ block: "center" })); await espera(200); await tabs[i].screenshot({ path: `${SAL}/claro-tabla${i + 1}.png` }); }
  const d2 = await pc.$("#demo-normal-2d"); await d2.evaluate((el) => el.scrollIntoView({ block: "center" })); await espera(800); await d2.screenshot({ path: `${SAL}/claro-demo.png` });
  const pgc = await pc.$$(".js-playground");
  for (const k of [2, 5]) { const h = pgc[k]; await h.evaluate((el) => (el.closest(".playground") || el).scrollIntoView({ block: "center" })); await espera(3000); await fotoDe(pc, h, `${SAL}/claro-pg${k + 1}.png`); }
  const callouts = await pc.$$(".callout.bestiario, .callout.senior, .callout.hack");
  for (const k of [0, 3]) { if (!callouts[k]) continue; await callouts[k].evaluate((el) => el.scrollIntoView({ block: "center" })); await espera(200); await callouts[k].screenshot({ path: `${SAL}/claro-callout${k + 1}.png` }); }
  for (const id of ["m7-4-indices-uint16", "m7-4-epsilon", "m7-4-heightmap-escalones"]) { const el = await pc.$("#" + id); if (!el) { console.log("no existe #" + id); continue; } await el.evaluate((e) => e.scrollIntoView({ block: "center" })); await espera(200); await el.screenshot({ path: `${SAL}/claro-${id}.png` }); }
  await pc.close();
  // ---- móvil: 390 px, DPR 2 ----
  const pm = await nav.newPage();
  await pm.setViewport({ width: 390, height: 800, deviceScaleFactor: 2 });
  pm.on("pageerror", (e) => errores.push("movil pageerror: " + e.message));
  await pm.goto(URL, { waitUntil: "load" });
  await pm.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  await pm.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
  console.log("movil scrollWidth", await pm.evaluate(() => document.documentElement.scrollWidth + " / " + document.documentElement.clientWidth));
  const pgm = await pm.$$(".js-playground");
  for (const k of [0, 2, 3, 6, 7]) { const h = pgm[k]; await h.evaluate((el) => el.scrollIntoView({ block: "start" })); await espera(4000); await pm.screenshot({ path: `${SAL}/movil-pg${k + 1}.png` }); }
  for (const sel of ["svg.diagrama", "table.m7-medidas"]) { const el = await pm.$(sel); await el.evaluate((e) => e.scrollIntoView({ block: "center" })); await espera(300); await pm.screenshot({ path: `${SAL}/movil-${sel.split(".")[1]}.png` }); }
  await pm.close();
} finally {
  console.log("ERRORES:", errores.filter((e) => !/READ-usage|GPU stall|polygon_mode/.test(e)).join("\n") || "ninguno");
  await nav.close();
}
