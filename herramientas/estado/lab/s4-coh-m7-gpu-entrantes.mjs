// Enlaces de otras lecciones hacia 7.4, 7.5 y 7.7, con su contexto (sin Chrome).
// Uso: node s4-coh-m7-gpu-entrantes.mjs
import fs from "fs"; import path from "path";
const R = "/Users/alex/Projects/shaders/modulos";
const arch = [];
(function rec(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) rec(p); else if (f.endsWith(".html")) arch.push(p); } })(R);
const objetivos = /(04-vertex-animacion|05-particulas-gpu|07-siguientes-pasos)\.html(#[^"]*)?/;
for (const a of arch) {
  if (/07-integracion\/0[457]-/.test(a)) continue;
  const t = fs.readFileSync(a, "utf8").split("\n");
  t.forEach((l, i) => {
    for (const m of l.matchAll(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
      if (!objetivos.test(m[1])) continue;
      const ctx = l.slice(Math.max(0, m.index - 260), m.index + m[0].length + 80).replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
      console.log(`${path.relative(R, a)}:${i + 1} → ${m[1]}\n    …${ctx}…`);
    }
  });
}
