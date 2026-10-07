// s5-sonnet-chuletas.mjs — comprueba que cada enlace de lección de A.2/A.3 apunta a una sección donde aparece
// de verdad la llamada/función de su fila. Sin Chrome. Uso: node s5-sonnet-chuletas.mjs
import fs from "node:fs";
import path from "node:path";
const RAIZ = "/Users/alex/Projects/shaders";
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";
const plano = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const cache = new Map();
function secciones(archivo) {
  if (cache.has(archivo)) return cache.get(archivo);
  const html = fs.readFileSync(archivo, "utf8");
  // posiciones de h2/h3 con su id (explícito o slug)
  const heads = [];
  const usados = new Set();
  for (const m of html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
    let id = (m[2].match(/\sid\s*=\s*"([^"]+)"/) || [])[1];
    if (!id) { const base = slug(plano(m[3])); id = base; let k = 2; while (usados.has(id)) id = base + "-" + k++; }
    usados.add(id);
    heads.push({ nivel: +m[1], id, pos: m.index, fin: m.index + m[0].length });
  }
  const mapa = new Map();
  heads.forEach((h, i) => {
    let fin = html.length;
    for (let j = i + 1; j < heads.length; j++) if (heads[j].nivel <= h.nivel) { fin = heads[j].pos; break; }
    mapa.set(h.id, html.slice(h.pos, fin));
  });
  // callouts con data-id o id
  for (const m of html.matchAll(/<div\b[^>]*\b(?:data-id|id)="([^"]+)"[^>]*>/g)) {
    if (mapa.has(m[1])) continue;
    mapa.set(m[1], html.slice(m.index, Math.min(html.length, m.index + 4000)));
  }
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) if (!mapa.has(m[1])) mapa.set(m[1], html.slice(m.index, Math.min(html.length, m.index + 4000)));
  cache.set(archivo, mapa);
  return mapa;
}
const PARAR = new Set(["canvas", "webgl2", "atributos", "nombre", "fuente", "origen", "destino", "tipo", "formato", "puntos", "índice", "indice", "nombres", "gl_Position", "pname", "target", "buffer", "textura", "texturas", "unidad", "valor", "valores", "nivel", "ancho", "alto", "cuenta", "primero", "instancias", "array", "datos", "tamaño", "modo", "factor", "pasada", "borde"]);
function pruebaArchivo(rel) {
  const archivo = path.join(RAIZ, "modulos/08-anexos", rel);
  const html = fs.readFileSync(archivo, "utf8");
  let total = 0, mal = 0;
  for (const fila of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const celdas = [...fila[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (!celdas.length) continue;
    const primera = celdas[0];
    const firmas = [...primera.matchAll(/<code class="ax-firma">([\s\S]*?)<\/code>/g)].map((m) => plano(m[1]));
    if (!firmas.length) continue;
    const toks = new Set();
    for (const f of firmas) {
      const nombres = [...f.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map((m) => m[1]);
      if (nombres.length) for (const t of nombres) toks.add(t);
      else for (const t of f.match(/[A-Za-z_#][A-Za-z0-9_]*/g) || []) if (t.length >= 3 && !PARAR.has(t)) toks.add(t);
    }
    // enlaces a lecciones de la fila (cualquier celda)
    for (const l of fila[1].matchAll(/<a\b[^>]*href="(\.\.\/[^"#]+\.html)(?:#([^"]*))?"[^>]*>([\s\S]*?)<\/a>/g)) {
      const dest = path.join(path.dirname(archivo), l[1]);
      if (!fs.existsSync(dest)) { console.log("[FALTA ARCHIVO]", rel, l[1]); continue; }
      total++;
      const mapa = secciones(dest);
      const texto = l[2] ? mapa.get(decodeURIComponent(l[2])) : fs.readFileSync(dest, "utf8");
      if (texto === undefined) { mal++; console.log("[SIN ANCLA]", rel, l[1] + "#" + l[2], "| fila:", firmas[0].slice(0, 60)); continue; }
      const hallados = [...toks].filter((t) => texto.includes(t));
      if (!hallados.length) { mal++; console.log("[SIN COINCIDENCIA]", rel, l[1] + "#" + (l[2] || ""), "| fila:", firmas[0].slice(0, 70), "| tokens:", [...toks].slice(0, 6).join(","), "| seccion", texto.length, "car"); }
    }
  }
  console.log(rel + ": " + total + " enlaces de fila, " + mal + " sin coincidencia");
}
pruebaArchivo("03-chuleta-webgl.html");
pruebaArchivo("02-chuleta-glsl.html");
