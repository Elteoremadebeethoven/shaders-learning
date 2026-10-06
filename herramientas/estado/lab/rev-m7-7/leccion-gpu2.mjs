// Abre la lección 7.7 servida en http://localhost (contexto seguro) con WebGPU por SwiftShader
// y comprueba los playgrounds de WebGPU (código de partida y soluciones). Uso: node leccion-gpu.mjs <dirCapturas>
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
const RAIZ = "/home/user/shaders-learning";
const CAP = process.argv[2] || "/tmp";
fs.mkdirSync(CAP, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-webgpu-adapter=swiftshader", "--use-vulkan=swiftshader"],
  defaultViewport: { width: 1440, height: 900 } });
const tipos = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };
try {
  const page = await browser.newPage();
  const consola = [];
  page.on("console", (m) => { if (["error", "warning", "warn"].includes(m.type())) consola.push(m.type() + ": " + m.text().slice(0, 200)); });
  page.on("pageerror", (e) => consola.push("pageerror: " + e.message));
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost") return r.continue();
    const f = path.join(RAIZ, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.respond({ status: 404, body: "no" });
    r.respond({ status: 200, contentType: tipos[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
  });
  await page.goto("http://localhost:9/modulos/07-integracion/07-siguientes-pasos.html", { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += 700) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await new Promise((r) => setTimeout(r, 500)); }
  console.log("DEMO WEBGPU:\n" + await page.evaluate(() => document.querySelector("#demo-webgpu .demo-info").textContent));
  const pgs = await page.$$(".js-playground, .playground");
  const vistos = new Set();
  let i = 0;
  for (const h of pgs) {
    const titulo = await h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent || el.getAttribute("data-titulo") || "");
    if (!/7\.7\.3/.test(titulo) || vistos.has(titulo)) continue;
    vistos.add(titulo); i++;
    await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await new Promise((r) => setTimeout(r, 4000));
    const leer = () => h.evaluate((el) => [...el.querySelectorAll(".pg-consola > *")].map((x) => (x.className.includes("error") ? "[E] " : "") + x.textContent).join("\n"));
    console.log("\n=== " + titulo + " (partida)\n" + await leer());
    await page.screenshot({ path: path.join(CAP, "vp-" + i + "-partida.png") });
    const tieneSol = await h.evaluate((el) => !!el.querySelector(".pg-btn.solucion"));
    if (tieneSol) {
      await h.evaluate((el) => { const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = ""; el.querySelector(".pg-btn.solucion").click(); });
      await new Promise((r) => setTimeout(r, 5000));
      console.log("=== " + titulo + " (solución)\n" + await leer());
      await h.evaluate((el) => el.querySelector(".pg-consola").scrollIntoView({ block: "end" })); await new Promise((r) => setTimeout(r, 1500)); await page.screenshot({ path: path.join(CAP, "vp-" + i + "-sol.png") });
    }
  }
  console.log("\nCONSOLA PÁGINA:\n" + consola.join("\n"));
} finally { await browser.close(); }
