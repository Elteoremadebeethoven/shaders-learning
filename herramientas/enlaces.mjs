/* Comprobador estático de enlaces y anclas del curso (sin Chrome).
   Uso: node enlaces.mjs [archivo.html ...]      (sin argumentos: index.html y modulos/**.html)
   Para cada href/src interno comprueba que el archivo existe y, si lleva #ancla, que el destino
   tiene ese id. Los ids se calculan como los asigna curso.js en el navegador:
     - atributos id="…" escritos en el HTML;
     - data-id de las cajas .callout (curso.js copia data-id a id);
     - h2/h3 sin id: slug del texto (misma función Curso.util.slug), con sufijo -2, -3… si se repite.
     - en 08-anexos/01-bestiario.html, los id de assets/js/datos-bestiario.js (tarjetas pintadas con JS).
   Aproximación: no excluye los encabezados dentro de playgrounds/quizzes/callouts (curso.js no les da
   id), así que puede dar por buena alguna ancla que en el navegador no existe. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function slug(s) {
  return String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";
}
function textoPlano(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
}
/* Quita el contenido de <script type="text/plain">, x-shader, etc.: ahí dentro no hay enlaces reales. */
function sinScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
}

const cacheIds = new Map();
function idsDe(archivo) {
  if (cacheIds.has(archivo)) return cacheIds.get(archivo);
  const html = sinScripts(fs.readFileSync(archivo, "utf8"));
  const ids = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*"([^"]+)"/g)) ids.add(m[1]);
  for (const m of html.matchAll(/<div\b[^>]*class="[^"]*\bcallout\b[^"]*"[^>]*>/g)) {
    const d = m[0].match(/data-id="([^"]+)"/);
    if (d) ids.add(d[1]);
  }
  for (const m of html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
    if (/\sid\s*=/.test(m[2])) continue;
    const base = slug(textoPlano(m[3]));
    let id = base, k = 2;
    while (ids.has(id)) id = base + "-" + k++;
    ids.add(id);
  }
  // El anexo A.1 pinta sus tarjetas con JS desde assets/js/datos-bestiario.js (id = data-id de cada caja).
  if (archivo.endsWith(path.join("08-anexos", "01-bestiario.html"))) {
    const datos = path.join(RAIZ, "assets", "js", "datos-bestiario.js");
    if (fs.existsSync(datos)) for (const m of fs.readFileSync(datos, "utf8").matchAll(/"id":\s*"([^"]+)"/g)) ids.add(m[1]);
  }
  cacheIds.set(archivo, ids);
  return ids;
}

function listar(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && !e.name.startsWith(".")) r.push(...listar(p)); }
    else if (e.name.endsWith(".html")) r.push(p);
  }
  return r;
}

const args = process.argv.slice(2);
const archivos = args.length ? args.map((a) => path.resolve(a)) : [path.join(RAIZ, "index.html"), ...listar(path.join(RAIZ, "modulos"))];
let total = 0, rotos = 0;
const porDestino = new Map();
for (const f of archivos) {
  const html = sinScripts(fs.readFileSync(f, "utf8"));
  const problemas = [];
  for (const m of html.matchAll(/<(?:a|link|img|script|iframe|source|area|video|audio)\b[^>]*?\s(href|src)\s*=\s*"([^"]*)"/gi)) {
    const h = m[2].trim();
    if (!h || /^(https?:|mailto:|data:|javascript:|blob:)/i.test(h)) continue;
    total++;
    const [ruta, ancla] = h.split("#");
    const destino = ruta ? path.resolve(path.dirname(f), decodeURIComponent(ruta.split("?")[0])) : f;
    if (!fs.existsSync(destino)) { problemas.push(`archivo inexistente: ${h}`); continue; }
    if (ancla && destino.endsWith(".html") && !idsDe(destino).has(decodeURIComponent(ancla))) problemas.push(`ancla inexistente: ${h}`);
  }
  if (problemas.length) {
    rotos += problemas.length;
    console.log("✗ " + path.relative(RAIZ, f));
    for (const p of [...new Set(problemas)]) {
      console.log("   " + p);
      const d = p.replace(/^[^:]+: /, "").split("#")[0];
      porDestino.set(d, (porDestino.get(d) || 0) + 1);
    }
  }
}
console.log(`\n${archivos.length} archivos, ${total} enlaces internos, ${rotos} rotos`);
process.exit(rotos ? 1 : 0);
