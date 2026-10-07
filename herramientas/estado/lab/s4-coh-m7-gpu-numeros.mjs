// Comprueba que los enlaces cuyo texto es un número de lección (6.3, A.2…) apuntan a esa lección del manifest,
// y que las menciones «N.M» de títulos coinciden con el manifest.
import fs from "fs"; import path from "path"; import vm from "vm";
const RAIZ = "/Users/alex/Projects/shaders";
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(RAIZ + "/assets/js/manifest.js", "utf8"), ctx);
const porArchivo = new Map(), porNum = new Map();
for (const m of ctx.window.CURSO_MANIFEST.modulos) for (const l of m.lecciones) { porArchivo.set(path.resolve(RAIZ, l.archivo), l); porNum.set(l.num, l); }
for (const f of process.argv.slice(2)) {
  const abs = path.resolve(f); const t = fs.readFileSync(abs, "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, s => s.replace(/[^\n]/g, " "));
  const lineas = t.split("\n");
  lineas.forEach((l, i) => {
    for (const m of l.matchAll(/<a [^>]*href="([^"#]*)(#[^"]*)?"[^>]*>([\s\S]*?)<\/a>/g)) {
      const href = m[1]; const txt = m[3].replace(/<[^>]+>/g, "").trim();
      if (!href || /^https?:/.test(href)) continue;
      const destino = path.resolve(path.dirname(abs), href); const lec = porArchivo.get(destino);
      const mm = /^(?:lección |la lección )?([0-9A]\.\d+)$/.exec(txt);
      if (mm && lec && lec.num !== mm[1]) console.log(`NUM ${path.basename(f)}:${i + 1} texto «${txt}» → ${lec.num} (${href})`);
      // cualquier número de lección en el texto del enlace que no sea el del destino
      for (const n of txt.matchAll(/\b([1-7A]\.(?:10|[1-9]))\b/g)) if (lec && n[1] !== lec.num && porNum.has(n[1])) console.log(`NUM? ${path.basename(f)}:${i + 1} «${txt}» → ${lec.num}`);
    }
  });
}
