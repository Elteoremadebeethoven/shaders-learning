import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const archivo = process.argv[2];
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", protocolTimeout: 900000,
  args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  p.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text().slice(0, 200)); });
  let t0 = Date.now();
  await p.goto("file://" + archivo, { waitUntil: "load", timeout: 60000 });
  await p.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 60000 });
  console.log("cargada en", Date.now() - t0, "ms");
  const n = await p.evaluate(() => document.querySelectorAll(".glsl-playground, .graficador, .demo, .js-playground").length);
  for (let i = 0; i < n; i++) {
    t0 = Date.now();
    const tit = await p.evaluate((i) => { const el = document.querySelectorAll(".glsl-playground, .graficador, .demo, .js-playground")[i]; el.scrollIntoView({ block: "center" }); return el.dataset.titulo || el.id || el.className; }, i);
    await new Promise(r => setTimeout(r, 1500));
    const t1 = Date.now();
    await p.evaluate(() => 1);
    console.log(i, tit, "scroll+1.5s:", t1 - t0, "ms; respuesta:", Date.now() - t1, "ms");
  }
  const qa = await p.evaluate(() => JSON.stringify((window.Curso.qa && window.Curso.qa.errores) || []));
  console.log("errores qa:", qa);
} finally { await b.close(); }
