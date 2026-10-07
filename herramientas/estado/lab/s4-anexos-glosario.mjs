// Aplica s4-anexos-glosario-datos.mjs a modulos/08-anexos/04-glosario.html (sesión 4, agente «anexos").
// - Inserta las entradas nuevas y las remisiones en su letra, en orden alfabético español (clave: el término sin
//   signos ni espacios, como el generador original; ω₀ → omega, ζ → zeta), sin tocar las entradas existentes.
// - Aplica los cambios a entradas existentes (reemplazos exactos, enlaces añadidos o antepuestos).
// - Calcula el title de cada etiqueta (N.N · lección › sección) a partir del manifest y del destino; comprueba
//   que cada ancla existe (ids como los asigna curso.js) y que cada #g-… interno apunta a una entrada.
// - Quita las marcas M7-PENDIENTE y actualiza el recuento de términos y remisiones.
// Uso: node s4-anexos-glosario.mjs [--escribir]   (sin --escribir solo valida e informa)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nuevas, remisiones, cambios } from "./s4-anexos-glosario-datos.mjs";

const RAIZ = "/Users/alex/Projects/shaders";
const GLOS = path.join(RAIZ, "modulos/08-anexos/04-glosario.html");
const DIRG = path.dirname(GLOS);
const escribir = process.argv.includes("--escribir");
const errores = [], avisos = [];

// ---------- manifest ----------
const w = {}; new Function("window", fs.readFileSync(path.join(RAIZ, "assets/js/manifest.js"), "utf8"))(w);
const lecciones = new Map();
for (const m of w.CURSO_MANIFEST.modulos) for (const l of m.lecciones) lecciones.set(path.join(RAIZ, l.archivo), l);

// ---------- ids de un archivo (como enlaces.mjs / curso.js) ----------
function slug(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion"; }
const textoPlano = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const cacheIds = new Map();
function idsDe(archivo) {
  if (cacheIds.has(archivo)) return cacheIds.get(archivo);
  const html = fs.readFileSync(archivo, "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const ids = new Map(); // id → texto para el title
  for (const m of html.matchAll(/<div\b[^>]*class="[^"]*\bcallout\b[^"]*"[^>]*>/g)) {
    const d = m[0].match(/data-id="([^"]+)"/), t = m[0].match(/data-titulo="([^"]+)"/);
    if (d) ids.set(d[1], t ? textoPlano(t[1]) : d[1]);
  }
  for (const m of html.matchAll(/\sid\s*=\s*"([^"]+)"/g)) if (!ids.has(m[1])) ids.set(m[1], null);
  for (const m of html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
    const t = textoPlano(m[3]);
    const e = m[2].match(/\sid\s*=\s*"([^"]+)"/);
    if (e) { ids.set(e[1], t); continue; }
    const base = slug(t); let id = base, k = 2;
    while (ids.has(id)) id = base + "-" + k++;
    ids.set(id, t);
  }
  cacheIds.set(archivo, ids);
  return ids;
}
const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function etiqueta(href, principal) {
  const [rel, ancla] = href.split("#");
  const archivo = path.resolve(DIRG, rel);
  if (!fs.existsSync(archivo)) { errores.push("no existe " + href); return null; }
  const lec = lecciones.get(archivo);
  if (!lec) { errores.push("fuera del manifest " + href); return null; }
  let sec = "";
  if (ancla) {
    const ids = idsDe(archivo);
    if (!ids.has(ancla)) { errores.push("ancla inexistente " + href); return null; }
    sec = ids.get(ancla) || "";
  }
  const title = lec.num + " · " + lec.titulo + (sec ? " › " + sec : "") + (principal ? " (explicación principal)" : "");
  return { num: lec.num, html: `<a class="ax-lec" href="${href}" title="${escAttr(title)}">${lec.num}</a>` };
}

// ---------- glosario ----------
let html = fs.readFileSync(GLOS, "utf8");
const original = html;
const reEntrada = (id) => new RegExp(`(  <div class="ax-entrada[^"]*" id="${id}">\\n)([\\s\\S]*?)(\\n  </div>\\n)`);

// 1) cambios en entradas existentes
for (const c of cambios) {
  const m = html.match(reEntrada(c.id));
  if (!m) { errores.push("entrada inexistente " + c.id); continue; }
  let cuerpo = m[2];
  for (const [a, b] of c.reemplazos || []) {
    const n = cuerpo.split(a).length - 1;
    if (n !== 1) { errores.push(`${c.id}: el texto aparece ${n} veces: «${a.slice(0, 70)}»`); continue; }
    cuerpo = cuerpo.replace(a, () => b);
  }
  const donde = cuerpo.match(/<span class="ax-donde">([\s\S]*?)<\/span><\/p>/);
  if (!donde) { errores.push(c.id + ": sin ax-donde"); continue; }
  let enlaces = donde[1];
  const nums = new Set([...enlaces.matchAll(/>([0-9A]+\.[0-9]+)<\/a>/g)].map((x) => x[1]));
  for (const href of c.añadir || []) {
    const e = etiqueta(href, false); if (!e) continue;
    if (nums.has(e.num)) { avisos.push(`${c.id}: ya enlaza ${e.num}; no añado ${href}`); continue; }
    nums.add(e.num); enlaces += e.html;
  }
  for (const href of (c.anteponer || []).slice().reverse()) {
    const e = etiqueta(href, true); if (!e) continue;
    if (nums.has(e.num)) { avisos.push(`${c.id}: ya enlaza ${e.num}; no antepongo ${href}`); continue; }
    nums.add(e.num);
    enlaces = e.html + enlaces.replace(" (explicación principal)\"", "\"");
  }
  cuerpo = cuerpo.replace(donde[0], () => `<span class="ax-donde">${enlaces}</span></p>`);
  html = html.replace(m[0], () => m[1] + cuerpo + m[3]);
}

// 2) quitar marcas M7-PENDIENTE
const marcas = (html.match(/<!-- M7-PENDIENTE[\s\S]*?-->\n?/g) || []).length;
html = html.replace(/<!-- M7-PENDIENTE[\s\S]*?-->\n?/g, "");

// 3) entradas nuevas y remisiones
function clave(t) { return t.replace(/ω₀/g, "omega").replace(/ζ/g, "zeta").replace(/[^\p{L}\p{N}]/gu, ""); }
const col = new Intl.Collator("es", { sensitivity: "base" });
const terminoDe = (dt) => textoPlano(dt.replace(/<span class="ax-en">[\s\S]*?<\/span>/, ""));
const letraDe = (t) => clave(t).normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
const existentes = new Set([...html.matchAll(/<div class="ax-entrada[^"]*" id="(g-[^"]+)">/g)].map((m) => m[1]));
const bloques = [];
for (const n of nuevas) {
  if (existentes.has(n.id)) { errores.push("id ya existe " + n.id); continue; }
  const enl = []; const nums = new Set();
  n.links.forEach((href, i) => {
    const e = etiqueta(href, i === 0); if (!e) return;
    if (nums.has(e.num)) { avisos.push(`${n.id}: dos enlaces a ${e.num}`); return; }
    nums.add(e.num); enl.push(e.html);
  });
  const dt = n.dt + (n.en ? ` <span class="ax-en">${n.en}</span>` : "");
  bloques.push({ id: n.id, termino: terminoDe(n.dt), html:
    `  <div class="ax-entrada" id="${n.id}">\n    <dt>${dt}</dt>\n    <dd><p>${n.def} <span class="ax-donde">${enl.join("")}</span></p></dd>\n  </div>\n` });
}
const todasIds = new Set([...existentes, ...nuevas.map((n) => n.id), ...remisiones.map((r) => r.id)]);
for (const r of remisiones) {
  if (existentes.has(r.id)) { errores.push("id ya existe " + r.id); continue; }
  const destino = nuevas.find((n) => n.id === r.a);
  let txt;
  if (destino) txt = terminoDe(destino.dt);
  else { const m = html.match(new RegExp(`id="${r.a}">\\n    <dt>([\\s\\S]*?)</dt>`)); if (!m) { errores.push("remisión a inexistente " + r.a); continue; } txt = terminoDe(m[1]); }
  bloques.push({ id: r.id, termino: terminoDe(r.dt), html:
    `  <div class="ax-entrada ax-remision" id="${r.id}">\n    <dt>${r.dt}</dt>\n    <dd><p class="ax-ver">→ <a href="#${r.a}">${escAttr(txt).replace(/&quot;/g, '"')}</a></p></dd>\n  </div>\n` });
}
let insertadas = 0;
for (const b of bloques) {
  const L = letraDe(b.termino);
  const sec = html.match(new RegExp(`<section class="ax-letra" data-letra="${L}">[\\s\\S]*?</section>`));
  if (!sec) { errores.push(`sin sección para la letra ${L} (${b.id})`); continue; }
  let s = sec[0];
  const ents = [...s.matchAll(/  <div class="ax-entrada[^"]*" id="(g-[^"]+)">\n    <dt>([\s\S]*?)<\/dt>/g)];
  const k = clave(b.termino);
  let pos = -1;
  for (const e of ents) if (col.compare(clave(terminoDe(e[2])), k) > 0) { pos = e.index; break; }
  if (pos < 0) pos = s.indexOf("</dl>");
  s = s.slice(0, pos) + b.html + s.slice(pos);
  html = html.replace(sec[0], () => s);
  insertadas++;
}

// 4) comprobar enlaces internos #g-… y anclas de todas las etiquetas añadidas
const idsFinales = new Set([...html.matchAll(/<div class="ax-entrada[^"]*" id="(g-[^"]+)">/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#(g-[^"]+)"/g)) if (!idsFinales.has(m[1])) errores.push("enlace interno roto #" + m[1]);
const dups = [...html.matchAll(/ id="(g-[^"]+)"/g)].map((m) => m[1]).filter((x, i, a) => a.indexOf(x) !== i);
if (dups.length) errores.push("ids duplicados: " + dups.join(", "));

// 5) recuentos
const total = [...html.matchAll(/<div class="ax-entrada" id="g-/g)].length;
const rem = [...html.matchAll(/<div class="ax-entrada ax-remision" id="g-/g)].length;
html = html.replace(/<span class="chip">\d+ términos<\/span><span class="chip">\d+ remisiones<\/span>/, `<span class="chip">${total} términos</span><span class="chip">${rem} remisiones</span>`);
html = html.replace(/<span class="ax-cuenta">\d+ términos<\/span>/, `<span class="ax-cuenta">${total} términos</span>`);

console.log(`marcas M7-PENDIENTE quitadas: ${marcas} · insertadas: ${insertadas} · términos: ${total} · remisiones: ${rem}`);
for (const a of avisos) console.log("aviso:", a);
for (const e of errores) console.log("ERROR:", e);
if (escribir && !errores.length) { fs.writeFileSync(GLOS, html); console.log("escrito", GLOS); }
else if (escribir) console.log("NO escrito: hay errores");
