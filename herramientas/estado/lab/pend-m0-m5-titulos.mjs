import fs from "node:fs";
import path from "node:path";
const RAIZ = "/home/user/shaders-learning/modulos";
const archivos = [];
for (const d of fs.readdirSync(RAIZ)) {
  const p = path.join(RAIZ, d);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const f of fs.readdirSync(p)) if (f.endsWith(".html")) archivos.push(path.join(p, f));
}
const titulos = {}; // id -> {titulo, archivo}
for (const f of archivos) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/<div class="callout bestiario"[^>]*>/g)) {
    const id = (m[0].match(/data-id="([^"]+)"/) || [])[1];
    const t = (m[0].match(/data-titulo="([^"]+)"/) || [])[1];
    if (id) titulos[id] = { t, f };
  }
}
const limpiar = (x) => x.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const filtro = process.argv[2] ? new RegExp(process.argv[2]) : null;
for (const f of archivos) {
  if (filtro && !filtro.test(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  const lineas = s.split("\n");
  lineas.forEach((l, i) => {
    for (const m of l.matchAll(/<a href="([^"]*)#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const id = m[2];
      if (!titulos[id]) continue;
      const texto = limpiar(m[3]);
      // ¿texto entre comillas «…» dentro del enlace o justo antes/después?
      let citado = null;
      const q = texto.match(/«([^»]+)»/);
      if (q) citado = q[1];
      else {
        const despues = l.slice(m.index + m[0].length, m.index + m[0].length + 200);
        const antes = l.slice(Math.max(0, m.index - 200), m.index);
        const q2 = despues.match(/^\s*(?:\(|,)?\s*«([^»]+)»/) || antes.match(/«([^»]+)»\s*\(?\s*$/);
        if (q2) citado = limpiar(q2[1]);
      }
      if (!citado) continue;
      const real = limpiar(titulos[id].t.replace(/&lt;/g,"<"));
      if (citado.trim() !== real.trim()) console.log(`${path.relative(RAIZ, f)}:${i + 1}  #${id}\n   citado: «${citado}»\n   real:   «${real}»`);
    }
  });
}
