import fs from "node:fs";
import path from "node:path";
const archivo = path.resolve(process.argv[2]);
const dir = path.dirname(archivo);
function slug(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "seccion";
}
function texto(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " [código] ").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}
function sinScripts(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " [código] ").replace(/<!--[\s\S]*?-->/g, ""); }
const src = fs.readFileSync(archivo, "utf8");
const visto = new Set();
const lineas = src.split("\n");
for (const m of src.matchAll(/href="([^"#]+)#([^"]+)"/g)) {
  const key = m[1] + "#" + m[2];
  const pos = m.index;
  const linea = src.slice(0, pos).split("\n").length;
  const ctx = texto(src.slice(Math.max(0, pos - 250), pos + 200).replace(/^[^<]*>/, "")).slice(-260);
  const destino = path.resolve(dir, m[1]);
  let html = sinScripts(fs.readFileSync(destino, "utf8"));
  let hallado = null;
  // id explícito
  let re = new RegExp('id="' + m[2] + '"');
  let mm = html.match(re);
  if (mm) hallado = { idx: mm.index, tipo: "id" };
  else {
    const ids = new Set();
    for (const h of html.matchAll(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
      const base = slug(texto(h[3]).trim()); let id = base, k = 2; while (ids.has(id)) id = base + "-" + k++; ids.add(id);
      if (id === m[2]) { hallado = { idx: h.index, tipo: "h" + h[1] }; break; }
    }
  }
  console.log("\n=== L" + linea + "  " + key);
  console.log("  CONTEXTO: …" + ctx.trim());
  if (!hallado) { console.log("  !! NO HALLADO"); continue; }
  console.log("  DESTINO: " + texto(html.slice(hallado.idx, hallado.idx + 1500)).trim().slice(0, 420));
}
