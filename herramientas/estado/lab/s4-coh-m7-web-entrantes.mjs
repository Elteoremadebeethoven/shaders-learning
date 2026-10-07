// Contexto (texto sin etiquetas) de cada enlace o mención «7.1/7.2/7.3/7.6» hacia las lecciones web de m7,
// desde archivos que no son esas lecciones. Uso: node s4-coh-m7-web-entrantes.mjs [--glosario]
import fs from "fs"; import path from "path";
const RAIZ = "/Users/alex/Projects/shaders/modulos";
const MIOS = /07-integracion\/(0[1236]-[^/]+\.html|proyecto-final\/)/;
const conGlos = process.argv.includes("--glosario");
const archivos = [];
(function rec(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) rec(p); else if (f.endsWith(".html")) archivos.push(p); } })(RAIZ);
const limpiar = (s) => s.replace(/<a [^>]*href="([^"]+)"[^>]*>/g, "⟨$1⟩").replace(/<\/a>/g, "⟩").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");
for (const a of archivos) {
  const rel = path.relative(RAIZ, a);
  if (MIOS.test(rel)) continue;
  if (!conGlos && /glosario/.test(rel)) continue;
  const L = fs.readFileSync(a, "utf8").split("\n");
  L.forEach((l, i) => {
    const re = /(01-arquitectura|02-interaccion|03-transiciones-shader|06-proyecto-final|proyecto-final\/)[^"]*"|\b7\.[1236]\b/g;
    let m, vistos = new Set();
    while ((m = re.exec(l))) {
      const t = limpiar(l);
      if (vistos.has(t)) continue; vistos.add(t);
      console.log(`== ${rel}:${i + 1}\n   ${t.trim().slice(0, 900)}`);
    }
  });
}
