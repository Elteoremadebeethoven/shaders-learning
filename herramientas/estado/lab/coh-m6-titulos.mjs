// Para cada enlace a #id de bestiario en los archivos dados, compara el texto citado con el data-titulo del destino.
import fs from "fs"; import path from "path";
const RAIZ = "/home/user/shaders-learning";
const archivos = [];
(function rec(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); const st = fs.statSync(p); if (st.isDirectory()) rec(p); else if (f.endsWith(".html")) archivos.push(p); } })(path.join(RAIZ,"modulos"));
const bichos = new Map(); // id -> {titulo, archivo}
const notasId = new Map();
for (const a of archivos) {
  const t = fs.readFileSync(a, "utf8");
  for (const m of t.matchAll(/<div class="callout bestiario"([^>]*)>/g)) {
    const id = /data-id="([^"]+)"/.exec(m[1]); const ti = /data-titulo="([^"]+)"/.exec(m[1]);
    if (id) bichos.set(id[1], { titulo: ti ? ti[1] : "(sin título)", archivo: path.relative(RAIZ, a) });
  }
  for (const m of t.matchAll(/<div class="callout (nota|cuidado|senior|hack|porque)"[^>]*\bid="(m\d[^"]*)"/g)) notasId.set(m[2], path.relative(RAIZ, a));
}
const norm = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/[«»“”"]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const objetivo = process.argv.slice(2).map(f => path.resolve(f));
for (const a of objetivo) {
  const t = fs.readFileSync(a, "utf8");
  const lineas = t.split("\n");
  lineas.forEach((l, i) => {
    for (const m of l.matchAll(/<a [^>]*href="([^"#]*)#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const id = m[2];
      if (bichos.has(id)) {
        const b = bichos.get(id);
        const txt = m[3];
        const ok = norm(txt) === norm(b.titulo);
        // contexto: si el texto del enlace es corto (p.ej. «3.7»), mirar si hay «…» justo antes
        const antes = l.slice(Math.max(0, m.index - 160), m.index).replace(/<[^>]+>/g, "");
        console.log(`${ok ? "OK  " : "DIF "} ${path.basename(a)}:${i+1} #${id}\n     citado: ${norm(txt)}\n     título: ${norm(b.titulo)}${ok ? "" : "\n     antes : …" + antes.slice(-100)}`);
      } else if (notasId.has(id)) {
        console.log(`NOTA ${path.basename(a)}:${i+1} #${id} (es una nota en ${notasId.get(id)}) texto: ${norm(m[3])}`);
      }
    }
  });
}
