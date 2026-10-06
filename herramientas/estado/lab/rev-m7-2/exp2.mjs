import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.cwd() + "/";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = {};
try {
  for (const archivo of ["eventos.html", "eventos-sinraw.html"]) {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + archivo); await dormir(300);
    const c = await page.target().createCDPSession();
    await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 150 }); await dormir(300);
    for (const [nombre, n, cada] of [["250Hz", 40, 4], ["1000Hz", 120, 1], ["de_golpe", 60, 0]]) {
      await page.evaluate(() => { window.reg = []; });
      const t0 = Date.now();
      if (cada) for (let i = 0; i < n; i++) { c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + (i % 100) * 5, y: 200 + (i % 7) }); await dormir(cada); }
      else await Promise.all(Array.from({ length: n }, (_, i) => c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + i * 5, y: 220 + (i % 3) })));
      const dur = Date.now() - t0;
      await dormir(400);
      const r = await page.evaluate(() => window.reg);
      const pm = r.filter((e) => e.tipo === "pointermove"), raw = r.filter((e) => e.tipo === "pointerrawupdate");
      const porFrame = {}; for (const e of pm) porFrame[e.frame] = (porFrame[e.frame] || 0) + 1;
      const v = Object.values(porFrame);
      out[archivo + " " + nombre] = { enviados: n, msEnvio: dur, pointermove: pm.length, frames: v.length, maxPorFrame: Math.max(...v), sumaCoalescidos: pm.reduce((s, e) => s + e.n, 0), rawupdate: raw.length };
    }
    await page.close();
  }
  const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
  await page.goto(D + "pe.html"); await dormir(200);
  out.pe = await page.evaluate(() => {
    const n = (el) => el ? el.tagName + (el.id ? "#" + el.id : "") : null;
    const en = (id, dx = 10) => { const r = document.getElementById(id).getBoundingClientRect(); return n(document.elementFromPoint(r.left + dx, r.top + r.height / 2)); };
    return { textoSobreFondo: en("t1"), boton: en("b1"), zonaVacia: n(document.elementFromPoint(700, 150)), textoBajoSinZ: (() => { const r = document.getElementById("t2").getBoundingClientRect(); return [r.top, n(document.elementFromPoint(r.left + 10, r.top + 5))]; })(),
      conPENone: (() => { document.getElementById("fondo").style.pointerEvents = "none"; return n(document.elementFromPoint(700, 150)); })() };
  });
  await page.close();
} catch (e) { out.error = String(e.stack || e); } finally { await browser.close(); }
console.log(JSON.stringify(out, null, 1));
