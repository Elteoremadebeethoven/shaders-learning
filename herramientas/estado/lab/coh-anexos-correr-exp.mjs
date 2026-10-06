import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const paginas = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  for (const p of paginas) {
    const page = await browser.newPage();
    page.on("console", (m) => console.log("[consola]", m.text()));
    page.on("pageerror", (e) => console.log("[error]", e.message));
    await page.goto("file://" + p, { waitUntil: "load" });
    await page.waitForFunction(() => window.__res, { timeout: 120000 });
    const r = await page.evaluate(() => window.__res);
    console.log("=== " + p.split("/").pop());
    if (Array.isArray(r)) for (const x of r) console.log((x.ok ? "OK  " : "ERR ") + x.nombre.padEnd(42) + " | " + x.log);
    else for (const [k, v] of Object.entries(r)) console.log(k.padEnd(32), JSON.stringify(v));
    await page.close();
  }
} finally {
  await browser.close();
}
