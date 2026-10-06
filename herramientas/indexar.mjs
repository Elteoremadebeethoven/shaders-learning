#!/usr/bin/env node
/* Genera los índices del curso a partir de las lecciones HTML:
     assets/js/indice-busqueda.js   → window.CURSO_INDICE   (buscador de la barra superior)
     assets/js/datos-bestiario.js   → window.CURSO_BESTIARIO (anexo A.1)
   Uso:  node herramientas/indexar.mjs
   Sin dependencias: lee el manifest y hace un análisis sencillo del HTML. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(RAIZ, "assets/js/manifest.js"), "utf8"), ctx);
const manifest = ctx.window.CURSO_MANIFEST;

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", rarr: "→", larr: "←", times: "×", middot: "·", hellip: "…", mdash: "—", ndash: "–" };
const decodificar = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
  if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e] !== undefined ? ENT[e] : m;
});
const sinEtiquetas = (h) => decodificar(h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
/* Todas las palabras distintas (≥ 3 letras) del bloque, incluido el código de
   los <script> de ejemplo: así se puede buscar "vertexAttribPointer" o "fwidth". */
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function palabras(h) {
  const texto = decodificar(h.replace(/<!--[\s\S]*?-->/g, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " "));
  const set = new Set();
  for (const w of norm(texto).match(/[a-z0-9_ñ]{3,}/g) || []) set.add(w);
  return [...set].join(" ");
}
/* misma función que Curso.util.slug en curso.js */
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";

/* Extrae el elemento <div …> que empieza en `inicio` contando anidamiento de <div>. */
function divBalanceado(html, inicio) {
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = inicio;
  let prof = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") { prof--; if (prof === 0) return html.slice(inicio, re.lastIndex); }
    else prof++;
  }
  return html.slice(inicio);
}
const attr = (tag, nombre) => { const m = tag.match(new RegExp(nombre + '\\s*=\\s*"([^"]*)"', "i")) || tag.match(new RegExp(nombre + "\\s*=\\s*'([^']*)'", "i")); return m ? decodificar(m[1]) : null; };

/* Reescribe href/src relativos del HTML de una caja para que sean relativos a la RAÍZ del
   curso (la página del bestiario les antepone su propio prefijo "../../"). */
function aRaiz(h, archivoLeccion) {
  const dir = path.posix.dirname(archivoLeccion);
  return h.replace(/\b(href|src)="([^"]*)"/g, (m, a, v) => {
    if (/^(https?:|mailto:|data:|\/)/.test(v)) return m;
    if (v.startsWith("#")) return a + '="' + archivoLeccion + v + '"';
    return a + '="' + path.posix.normalize(path.posix.join(dir, v)) + '"';
  });
}
const indice = [], bestiario = [];
let faltan = 0;
for (const m of manifest.modulos) {
  for (const l of m.lecciones) {
    const archivo = path.join(RAIZ, l.archivo);
    if (!fs.existsSync(archivo)) { faltan++; continue; }
    const html = fs.readFileSync(archivo, "utf8");
    const main = (html.match(/<main[\s\S]*<\/main>/i) || [html])[0];
    const modulo = "Módulo " + m.num + " · " + m.titulo;
    // entrada de la lección
    const resumen = sinEtiquetas((main.match(/<p class="resumen">([\s\S]*?)<\/p>/i) || ["", ""])[1]);
    indice.push({ t: l.num + " · " + l.titulo, u: l.archivo, s: modulo + (resumen ? " — " + resumen : ""), x: palabras(main) });
    // entradas por sección <h2>
    const usados = new Set();
    const partes = main.split(/(?=<h2\b)/i);
    for (const p of partes) {
      const h = p.match(/^<h2\b([^>]*)>([\s\S]*?)<\/h2>/i);
      if (!h) continue;
      const texto = sinEtiquetas(h[2]);
      let id = attr("<h2 " + h[1] + ">", "id");
      if (!id) { const base = slug(texto); id = base; let k = 2; while (usados.has(id)) id = base + "-" + k++; }
      usados.add(id);
      indice.push({ t: texto, u: l.archivo + "#" + id, s: l.num + " · " + l.titulo, x: palabras(p.replace(/^<h2[\s\S]*?<\/h2>/i, "")) });
    }
    // cajas de bestiario
    const reCaja = /<div\b[^>]*class\s*=\s*"[^"]*\bbestiario\b[^"]*"[^>]*>/gi;
    let c;
    while ((c = reCaja.exec(main))) {
      if (!/\bcallout\b/.test(attr(c[0], "class") || "")) continue;
      const bloque = divBalanceado(main, c.index);
      const interior = bloque.replace(/^<div\b[^>]*>/i, "").replace(/<\/div>\s*$/i, "");
      const id = attr(c[0], "data-id");
      const titulo = attr(c[0], "data-titulo") || sinEtiquetas(interior).slice(0, 80);
      if (!id) { if (m.id !== "00-inicio") console.warn("⚠ bestiario sin data-id (se omite) en " + l.archivo + ": " + titulo); continue; }
      bestiario.push({ id, titulo, html: aRaiz(interior.trim(), l.archivo), leccion: { num: l.num, titulo: l.titulo, archivo: l.archivo }, modulo: { num: m.num, titulo: m.titulo } });
    }
  }
}
const ids = new Map();
bestiario.forEach((b) => { if (b.id) ids.set(b.id, (ids.get(b.id) || 0) + 1); });
for (const [id, n] of ids) if (n > 1) console.warn("⚠ data-id de bestiario repetido: " + id + " (" + n + " veces)");

const cab = "/* Generado por herramientas/indexar.mjs — no editar a mano. */\n";
fs.writeFileSync(path.join(RAIZ, "assets/js/indice-busqueda.js"), cab + "window.CURSO_INDICE = " + JSON.stringify(indice) + ";\n");
fs.writeFileSync(path.join(RAIZ, "assets/js/datos-bestiario.js"), cab + "window.CURSO_BESTIARIO = " + JSON.stringify(bestiario, null, 1) + ";\n");
console.log("índice: " + indice.length + " entradas · bestiario: " + bestiario.length + " casos · lecciones sin archivo: " + faltan);
