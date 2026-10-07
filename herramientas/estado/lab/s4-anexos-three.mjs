// Sirve three-exp/ y el build de three@0.186.1 (npm pack) en http://exp.local por intercepción y vuelca window.__R.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
const DIR = path.dirname(new URL(import.meta.url).pathname);
const EXP = DIR; // s4-anexos-three.html está junto a este script
// Paquete: mkdir -p /tmp/three-pkg && cd /tmp/three-pkg && npm pack three@0.186.1 && mkdir x && tar -xzf three-0.186.1.tgz -C x
const BUILD = process.env.THREE_BUILD || "/tmp/three-pkg/x/package/build";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
try {
  const page = await browser.newPage();
  page.on("console", (m) => { console.log("[consola " + m.type() + "] " + m.text().slice(0, 300)); });
  page.on("pageerror", (e) => console.log("[pageerror] " + e.message));
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "exp.local") return r.continue();
    const f = u.pathname.startsWith("/three/") ? path.join(BUILD, u.pathname.slice(7)) : path.join(EXP, u.pathname);
    if (!fs.existsSync(f)) return r.respond({ status: 404, body: "no" });
    r.respond({ status: 200, contentType: f.endsWith(".js") ? "text/javascript" : "text/html", body: fs.readFileSync(f) });
  });
  await page.goto("http://exp.local/s4-anexos-three.html");
  await page.waitForFunction(() => window.__R, { timeout: 60000 });
  console.log(JSON.stringify(await page.evaluate(() => window.__R), null, 1));
} finally { await browser.close(); }
