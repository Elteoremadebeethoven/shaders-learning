// Para cada enlace interno de los anexos: contexto de origen y qué hay en el destino (sección real).
// Chrome con JS desactivado; los id se calculan como curso.js (montarTOC + data-id de callouts).
import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";

const RAIZ = "/home/user/shaders-learning";
const origenes = process.argv.slice(2).map((a) => path.resolve(a));
const salida = [];

const browser = await puppeteer.launch({
  executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--allow-file-access-from-files"],
});
try {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);

  const prepararIds = () => {
    const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";
    document.querySelectorAll(".callout").forEach((c) => { if (c.dataset.id && !c.id) c.id = c.dataset.id; });
    const main = document.querySelector("main");
    const usados = new Set();
    const hs = [...main.querySelectorAll("h2, h3")].filter((h) => !h.closest(".playground, .quiz, .demo, .callout, details, .tarjeta-modulo, .no-toc"));
    hs.forEach((h) => {
      if (!h.id) { let id = slug(h.textContent), k = 2; while (usados.has(id) || document.getElementById(id)) id = slug(h.textContent) + "-" + k++; h.id = id; }
      usados.add(h.id);
    });
  };

  const destinos = new Map(); // archivo -> Set(anclas)
  for (const f of origenes) {
    await page.goto("file://" + f, { waitUntil: "domcontentloaded" });
    await page.evaluate(prepararIds);
    const links = await page.evaluate(() => {
      const r = [];
      for (const a of document.querySelectorAll("main a[href]")) {
        const h = a.getAttribute("href");
        if (/^(https?:|mailto:)/.test(h)) continue;
        const tr = a.closest("tr");
        let ctx = "";
        if (tr) ctx = (tr.querySelector("td") || tr).textContent;
        else { const p = a.closest("p, li, h3, article"); ctx = p ? p.textContent : ""; }
        // sección del origen
        let sec = ""; let el = a;
        const todos = [...document.querySelectorAll("main h2")];
        for (const h of todos) if (h.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) sec = h.textContent;
        r.push({ href: h, texto: a.textContent.trim(), ctx: ctx.replace(/\s+/g, " ").trim().slice(0, 110), sec });
      }
      return r;
    });
    for (const l of links) {
      const [ruta, ancla] = l.href.split("#");
      const destino = ruta ? path.resolve(path.dirname(f), decodeURIComponent(ruta)) : f;
      l.destino = path.relative(RAIZ, destino); l.ancla = ancla || ""; l.origen = path.basename(f);
      if (!destinos.has(destino)) destinos.set(destino, new Set());
      if (ancla) destinos.get(destino).add(decodeURIComponent(ancla));
      salida.push(l);
    }
  }
  const info = {};
  for (const [d, anclas] of destinos) {
    if (!d.endsWith(".html") || !fs.existsSync(d)) continue;
    await page.goto("file://" + d, { waitUntil: "domcontentloaded" });
    await page.evaluate(prepararIds);
    info[path.relative(RAIZ, d)] = await page.evaluate((anclas) => {
      const r = { _titulo: (document.querySelector("h1") || {}).textContent };
      for (const a of anclas) {
        const el = document.getElementById(a);
        if (!el) { r[a] = null; continue; }
        let titulo = el.matches("h2,h3") ? el.textContent : (el.dataset.titulo || el.textContent.slice(0, 80));
        // texto de la sección
        let txt = "";
        if (el.matches("h2,h3")) {
          let n = el.nextElementSibling;
          while (n && !n.matches("h2") && !(el.matches("h3") && n.matches("h3")) && txt.length < 600) { txt += " " + n.textContent; n = n.nextElementSibling; }
        } else txt = el.textContent;
        const enExcluido = !!el.closest(".playground, .quiz, .demo, details, .tarjeta-modulo, .no-toc") && el.matches("h2,h3");
        r[a] = { tag: el.tagName + (el.className ? "." + el.className.split(" ").join(".") : ""), titulo: titulo.replace(/\s+/g, " ").trim().slice(0, 160), txt: txt.replace(/\s+/g, " ").trim().slice(0, 500), enExcluido };
      }
      return r;
    }, [...anclas]);
  }
  fs.writeFileSync(process.env.SALIDA || "/dev/stdout", JSON.stringify({ enlaces: salida, destinos: info }, null, 1));
} finally {
  await browser.close();
}
