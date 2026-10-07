// Enlaces salientes de un archivo hacia otras lecciones, con el contexto (frase) en que aparecen, agrupados por destino.
// Uso: node s4-coh-m7-web-salientes.mjs archivo.html [filtroDestino]
import fs from "fs"; import path from "path";
const f = path.resolve(process.argv[2]); const filtro = process.argv[3] ? new RegExp(process.argv[3]) : null;
const t = fs.readFileSync(f, "utf8").replace(/<script\b[^>]*type="(x-shader[^"]*|text\/x-[a-z]+)"[^>]*>[\s\S]*?<\/script>/gi, s => s.replace(/[^\n]/g, " "));
const L = t.split("\n"); const grupos = new Map();
const limpiar = (s) => s.replace(/<a [^>]*href="([^"]+)"[^>]*>/g, "⟨").replace(/<\/a>/g, "⟩").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");
L.forEach((l, i) => {
  for (const m of l.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = m[1]; if (/^https?:/.test(href) || href.startsWith("#")) continue;
    if (filtro && !filtro.test(href)) continue;
    const txt = limpiar(l); const pos = limpiar(l.slice(0, m.index)).length;
    const ctx = txt.slice(Math.max(0, pos - 220), pos + 120);
    if (!grupos.has(href)) grupos.set(href, []);
    grupos.get(href).push(`l.${i + 1}: …${ctx}…`);
  }
});
for (const [h, v] of [...grupos.entries()].sort()) { console.log(`\n### ${h}`); v.forEach(x => console.log("  " + x)); }
