// G4 (opus-b, sesión 5): comprobaciones con un Chrome (turno normal): columna JS de 7.4, readPixels y límites de 7.5,
// tabla del ejemplo 7.5.1 (emisión), e interacciones de 7.4 (e1, e3, e5 por detrás, e6 anillo frente al cursor, e8 pintar).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const L = "/Users/alex/Projects/shaders/herramientas/estado/lab";
const SAL = L + "/capA"; fs.mkdirSync(SAL, { recursive: true });
const RAIZ = "file:///Users/alex/Projects/shaders/modulos/07-integracion/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const solo = process.argv[2] || "todo";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 } });
const errores = [];
try {
  if (solo === "todo" || solo === "js") {
    const p = await b.newPage();
    await p.goto("file://" + L + "/s5-opus-b-G4-js74.html");
    const R = await p.evaluate(() => window.__correr());
    console.log("JS74:", JSON.stringify(R, null, 1));
    await p.close();
  }
  async function abrir(archivo) {
    const page = await b.newPage();
    page.on("pageerror", (e) => errores.push(archivo + " pageerror: " + e.message));
    page.on("console", (m) => { if (["error", "warn", "warning"].includes(m.type())) errores.push(archivo + " " + m.type() + ": " + m.text()); });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("curso-tema", JSON.stringify("dark")); } catch (e) {} });
    await page.goto(RAIZ + archivo, { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 30000 });
    await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
    return page;
  }
  async function playground(page, re) {
    for (const x of await page.$$(".js-playground")) if (re.test(await x.evaluate((el) => el.dataset.titulo || ""))) return x;
  }
  async function verPg(page, h) {
    await h.evaluate((el) => (el.closest(".playground") || el).scrollIntoView({ block: "center" }));
    await espera(3000);
    const f = await (await h.waitForSelector("iframe", { timeout: 20000 })).contentFrame();
    return f;
  }
  async function foto(page, h, ruta) {
    const r = await h.evaluate((el) => { const e = el.closest(".playground") || el; const bb = e.getBoundingClientRect(); return { x: bb.left + scrollX, y: bb.top + scrollY, width: bb.width, height: Math.min(bb.height, innerHeight) }; });
    await page.screenshot({ path: ruta, clip: r, captureBeyondViewport: false });
  }
  async function cajaCanvas(page, h) {   // rectángulo del canvas #c del iframe, en coordenadas de la ventana de la página
    return await h.evaluate((el) => { const ifr = el.querySelector("iframe"); const r = ifr.getBoundingClientRect(); const c = ifr.contentDocument ? ifr.contentDocument.getElementById("c") : null; return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  }
  if (solo === "todo" || solo === "75") {
    const page = await abrir("05-particulas-gpu.html");
    const h = await playground(page, /Ejemplo 7\.5\.1/);
    const f = await verPg(page, h);
    for (const tasa of [20000, 40000, 80000]) {
      await f.evaluate((v) => { const t = document.getElementById("tasa"); t.value = v; t.oninput(); }, tasa);
      await espera(7000);
      const muestras = [];
      for (let i = 0; i < 8; i++) { muestras.push(await f.evaluate(() => document.getElementById("info").textContent)); await espera(400); }
      console.log("7.5.1 tasa", tasa, "\n  " + muestras.join("\n  "));
    }
    await foto(page, h, SAL + "/75-e1-80000.png");
    await page.close();
  }
  if (solo === "todo" || solo === "74") {
    const page = await abrir("04-vertex-animacion.html");
    // e1
    let h = await playground(page, /Ejemplo 7\.4\.1/); let f = await verPg(page, h);
    await f.evaluate(() => { const r = document.getElementById("n"); r.value = 300; r.oninput({ target: r }); const c = document.getElementById("u16"); c.checked = true; c.onchange({ target: c }); });
    await espera(2000); console.log("e1 u16 300:", await f.evaluate(() => document.getElementById("info").textContent)); await foto(page, h, SAL + "/74-e1-u16-300.png");
    await f.evaluate(() => { const c = document.getElementById("u16"); c.checked = false; c.onchange({ target: c }); });
    await espera(1500); await foto(page, h, SAL + "/74-e1-u32-300.png");
    await f.evaluate(() => { const r = document.getElementById("n"); r.value = 8; r.oninput({ target: r }); const k = document.getElementById("k"); k.value = 14; k.oninput({ target: k }); });
    await espera(1500); await foto(page, h, SAL + "/74-e1-n8-k14-a.png"); await espera(500); await foto(page, h, SAL + "/74-e1-n8-k14-b.png");
    // e3
    h = await playground(page, /Ejemplo 7\.4\.3/); f = await verPg(page, h);
    for (const [m, eps, org] of [[0, -2, "0"], [2, -2, "0"], [1, -2, "0"], [1, -5, "0"], [1, -3, "1000"], [1, -5, "1000"], [1, -0.3, "0"], [3, -2, "0"]]) {
      await f.evaluate(([m, eps, org]) => {
        const s = document.getElementById("modo"); s.value = String(m); s.dispatchEvent(new Event("change")); if (s.onchange) s.onchange({ target: s });
        const e = document.getElementById("eps"); e.value = eps; e.dispatchEvent(new Event("input")); if (e.oninput) e.oninput({ target: e });
        const o = document.getElementById("origen"); o.value = org; o.dispatchEvent(new Event("change")); if (o.onchange) o.onchange({ target: o });
      }, [m, eps, org]);
      await espera(1800); await foto(page, h, `${SAL}/74-e3-m${m}-eps${eps}-o${org}.png`);
    }
    // e5: por detrás, con y sin la casilla
    h = await playground(page, /Ejemplo 7\.4\.5/); f = await verPg(page, h);
    let c = await cajaCanvas(page, h);
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    await page.mouse.move(cx + 200, cy); await page.mouse.down(); for (let i = 1; i <= 20; i++) await page.mouse.move(cx + 200 - 20 * i, cy); await page.mouse.up();
    await espera(1500); await foto(page, h, SAL + "/74-e5-detras-con.png");
    await f.evaluate(() => { const k = document.getElementById("dosCaras"); k.checked = false; k.dispatchEvent(new Event("change")); if (k.onchange) k.onchange({ target: k }); });
    await espera(1500); await foto(page, h, SAL + "/74-e5-detras-sin.png");
    // e6: el anillo frente al cursor (marcador rojo en la página donde está el cursor)
    h = await playground(page, /Ejemplo 7\.4\.6/); f = await verPg(page, h);
    c = await cajaCanvas(page, h);
    const px = c.x + c.w * 0.5, py = c.y + c.h * 0.62;
    await page.evaluate(([x, y]) => { const d = document.createElement("div"); d.id = "marca"; d.style.cssText = `position:fixed;left:${x - 6}px;top:${y - 6}px;width:12px;height:12px;border:2px solid red;border-radius:50%;pointer-events:none;z-index:99999`; document.body.appendChild(d); }, [px, py]);
    await page.mouse.move(px - 40, py); for (let i = 1; i <= 8; i++) await page.mouse.move(px - 40 + 5 * i, py);
    await espera(1200); await foto(page, h, SAL + "/74-e6-encima.png");
    await page.mouse.down(); await espera(2000); await foto(page, h, SAL + "/74-e6-pulsado.png");
    await f.evaluate(() => { const k = document.getElementById("corregir"); k.checked = true; k.dispatchEvent(new Event("change")); if (k.onchange) k.onchange({ target: k }); });
    await espera(1500); await foto(page, h, SAL + "/74-e6-pulsado-corregido.png");
    await page.mouse.up(); await espera(300); await foto(page, h, SAL + "/74-e6-soltado-300ms.png");
    await page.evaluate(() => document.getElementById("marca").remove());
    // e8: pintar
    h = await playground(page, /Ejemplo 7\.4\.8/); f = await verPg(page, h);
    await foto(page, h, SAL + "/74-e8-antes.png");
    const m = await h.evaluate((el) => { const ifr = el.querySelector("iframe"); const r = ifr.getBoundingClientRect(); const d = ifr.contentDocument; return null; });
    const mapa = await f.evaluate(() => { const cs = [...document.querySelectorAll("canvas")]; return cs.map((x) => { const r = x.getBoundingClientRect(); return { id: x.id, x: r.left, y: r.top, w: r.width, h: r.height }; }); });
    console.log("e8 canvas:", JSON.stringify(mapa));
    const ifr = await cajaCanvas(page, h);
    const m2 = mapa.find((x) => x.id !== "c") || mapa[0];
    const mx = ifr.x + m2.x, my = ifr.y + m2.y;
    await page.mouse.move(mx + m2.w * 0.3, my + m2.h * 0.5); await page.mouse.down();
    for (let i = 0; i <= 30; i++) await page.mouse.move(mx + m2.w * (0.3 + 0.4 * i / 30), my + m2.h * (0.5 + 0.2 * Math.sin(i / 5)));
    await page.mouse.up(); await espera(1500); await foto(page, h, SAL + "/74-e8-pintado.png");
    await f.evaluate(() => { const e = document.getElementById("exag"); e.value = 3; e.dispatchEvent(new Event("input")); if (e.oninput) e.oninput({ target: e }); });
    await espera(1500); await foto(page, h, SAL + "/74-e8-exag3.png");
    await page.close();
  }
} finally {
  console.log("ERRORES:", errores.filter((e) => !/READ-usage|GPU stall|polygon_mode/.test(e)).join("\n") || "ninguno");
  await b.close();
}
