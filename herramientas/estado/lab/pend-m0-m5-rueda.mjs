import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const nav = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  console.log("versión:", await nav.version());
  for (const m of ["canvas", "canvasPF", "window", "body", "document"]) {
    const p = await nav.newPage();
    await p.setViewport({ width: 800, height: 600 });
    await p.goto("file://" + new URL("./pend-m0-m5-rueda.html", import.meta.url).pathname);
    await p.evaluate((m) => modo(m), m);
    await p.mouse.move(150, 100);
    await p.mouse.wheel({ deltaY: 300 });
    await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(() => ({ res: window.res, scrollY }));
    console.log(m.padEnd(10), JSON.stringify(r.res[0]), "scrollY final:", r.scrollY);
    await p.close();
  }
} finally { await nav.close(); }
