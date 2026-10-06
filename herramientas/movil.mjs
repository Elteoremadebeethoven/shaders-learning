import puppeteer from "puppeteer-core";
import path from "node:path"; import { pathToFileURL } from "node:url";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal","--enable-gpu"], defaultViewport: { width: 390, height: 800, deviceScaleFactor: 2 } });
for (const f of process.argv.slice(2)) {
  const p = await b.newPage();
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: "load" });
  await p.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
  const r = await p.evaluate(() => {
    const W = document.documentElement.clientWidth, anchos = [];
    for (const el of document.querySelectorAll("main *")) {
      const bx = el.getBoundingClientRect();
      if (bx.right > W + 1 && bx.width > 0 && !el.closest("pre,.CodeMirror,.anotado-codigo,table,.katex-display,.pg-tabs")) anchos.push(el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : "") + " →" + Math.round(bx.right));
    }
    return { scrollW: document.documentElement.scrollWidth, W, culpables: [...new Set(anchos)].slice(0, 8) };
  });
  console.log((r.scrollW > r.W ? "✗ " : "✓ ") + path.basename(f) + " scrollWidth=" + r.scrollW + " / " + r.W + (r.culpables.length ? "  " + r.culpables.join(", ") : ""));
  await p.close();
}
await b.close();
