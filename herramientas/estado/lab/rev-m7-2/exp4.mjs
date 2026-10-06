import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.cwd() + "/";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = {};
try {
  for (const archivo of ["puntero.html", "puntero-arreglado.html"]) {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + archivo); await dormir(300);
    await page.mouse.move(200, 200); await dormir(300);
    const primera = await page.evaluate(() => window.hist.filter(h => h.dentro).slice(0, 2));
    await page.mouse.move(120, 200, { steps: 4 }); await page.mouse.move(50, 200); await dormir(400);
    await page.evaluate(() => { window.hist = []; });
    await page.mouse.move(480, 380); await dormir(250);
    out[archivo] = { primeraEntrada: primera, reentrada: await page.evaluate(() => window.hist.slice(0, 4)) };
    await page.close();
  }
  const page = await browser.newPage(); await page.setViewport({ width: 600, height: 320 }); const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(D + "multitouch-leccion.html"); await dormir(400);
  const estado = () => page.evaluate(() => ({ huecos: [...huecos], dedos: [...dedos.entries()].map(([id, d]) => [id, d.hueco, d.activo, +d.k.toFixed(2)]) }));
  for (let i = 0; i < 6; i++) { await page.mouse.move(100 + i * 60, 150); await page.mouse.down(); await dormir(60); await page.mouse.up(); await dormir(120); }
  await dormir(1500);
  const tras = await estado();
  // varios dedos
  const c = await page.target().createCDPSession();
  await c.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  const P = (x, y, id) => ({ x, y, id });
  await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [P(100, 100, 0), P(300, 100, 1), P(500, 100, 2)] }); await dormir(150);
  const tresDedos = await estado();
  await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await dormir(1200);
  out.multitouchLeccion = { tras6clics: tras, tresDedos, final: await estado(), errs };
  await page.close();
} catch (e) { out.error = String(e.stack || e); } finally { await browser.close(); }
console.log(JSON.stringify(out));
