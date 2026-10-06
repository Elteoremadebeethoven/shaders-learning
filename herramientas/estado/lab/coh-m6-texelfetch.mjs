import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const b = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
try {
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  await p.goto("file://" + new URL("./coh-m6-texelfetch.html", import.meta.url).pathname);
  console.log(JSON.stringify(await p.evaluate(() => prueba()), null, 1));
  console.log("version:", await b.version());
} finally { await b.close(); }
