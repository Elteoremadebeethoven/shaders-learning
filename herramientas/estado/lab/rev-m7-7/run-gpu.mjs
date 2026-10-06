import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
const EXP = path.dirname(new URL(import.meta.url).pathname);
const BUILD = path.join(EXP, "..", "three-pkg", "x", "package", "build");
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-webgpu-adapter=swiftshader", "--use-vulkan=swiftshader"] });
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("[consola " + m.type() + "] " + m.text().slice(0, 300)); });
  page.on("pageerror", (e) => console.log("[pageerror] " + e.message));
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost") return r.continue();
    let f = u.pathname.startsWith("/three/") ? path.join(BUILD, u.pathname.slice(7)) : path.join(EXP, u.pathname);
    if (!fs.existsSync(f)) return r.respond({ status: 404, body: "no" });
    const ct = f.endsWith(".js") ? "text/javascript" : "text/html";
    r.respond({ status: 200, contentType: ct, body: fs.readFileSync(f) });
  });
  await page.goto("http://localhost:9/" + (process.argv[2] || "three.html"));
  await page.waitForFunction(() => window.__R, { timeout: 120000 });
  const R = await page.evaluate(() => window.__R);
  console.log(JSON.stringify(R, null, 1));
} finally { await browser.close(); }
