import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const paginas = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  for (const url of paginas) {
    const page = await browser.newPage();
    const consola = [];
    page.on("console", (m) => consola.push(m.type() + ": " + m.text()));
    page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
    await page.goto("file://" + url, { waitUntil: "load" });
    await page.waitForFunction(() => window.__R, { timeout: 120000 });
    const r = await page.evaluate(() => window.__R);
    console.log("=== " + url);
    for (const k in r) console.log(k + ": " + JSON.stringify(r[k]));
    console.log("--- consola:");
    for (const c of consola.slice(0, 40)) console.log("  " + c);
    await page.close();
  }
} finally { await browser.close(); }
