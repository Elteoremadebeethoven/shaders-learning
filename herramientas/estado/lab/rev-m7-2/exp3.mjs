import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.cwd() + "/";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = {};
try {
  const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
  await page.goto(D + "eventos-sinraw.html"); await dormir(300);
  const c = await page.target().createCDPSession();
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 150 }); await dormir(300);
  const filas = [];
  for (let rep = 0; rep < 10; rep++) {
    await page.evaluate(() => { window.reg = []; });
    await dormir(7 + rep);   // desfase respecto al frame
    c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 100 + rep, y: 200 });
    await dormir(2);
    c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 102 + rep, y: 200, button: "left", clickCount: 1 });
    await dormir(2);
    c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 102 + rep, y: 200, button: "left", clickCount: 1 });
    await dormir(100);
    const r = await page.evaluate(() => {
      const rafDe = Object.fromEntries(window.rafT.map(([f, now]) => [f, now]));
      return window.reg.filter((e) => /pointer(move|down|up)/.test(e.tipo)).map((e) => [e.tipo, +((rafDe[e.frame + 1] || NaN) - e.t).toFixed(2)]);
    });
    filas.push(r);
  }
  out.discretos = filas;
  await page.close();
} catch (e) { out.error = String(e.stack || e); } finally { await browser.close(); }
console.log(JSON.stringify(out));
