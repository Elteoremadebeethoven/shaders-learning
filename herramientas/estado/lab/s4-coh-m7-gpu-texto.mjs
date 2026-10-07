// Texto compacto de una lección: quita etiquetas, omite el código de <script>, marca h2/h3 y cajas.
import fs from "fs";
const f = process.argv[2];
const L = fs.readFileSync(f, "utf8").split("\n");
let enScript = false, out = [];
const limpiar = (s) => s.replace(/<h2[^>]*>/g, "\n## ").replace(/<h3[^>]*>/g, "### ")
  .replace(/<div class="callout ([a-z]+)"([^>]*)>/g, (m, c, a) => `[${c.toUpperCase()}${/data-id="([^"]+)"/.test(a) ? " " + /data-id="([^"]+)"/.exec(a)[1] : ""}${/\bid="([^"]+)"/.test(a) ? " id=" + /\bid="([^"]+)"/.exec(a)[1] : ""}${/data-titulo="([^"]+)"/.test(a) ? " «" + /data-titulo="([^"]+)"/.exec(a)[1] + "»" : ""}] `)
  .replace(/<div class="(glsl-playground|js-playground|graficador|demo)"([^>]*)>/g, (m, c, a) => `[${c}${/data-titulo="([^"]+)"/.test(a) ? " «" + /data-titulo="([^"]+)"/.exec(a)[1] + "»" : ""}${/data-uniforms='([^']+)'/.test(a) ? " U=" + /data-uniforms='([^']+)'/.exec(a)[1] : ""}] `)
  .replace(/<section class="(ejemplo|ejercicio)"[^>]*>/g, "[$1] ")
  .replace(/<li data-correcta>/g, "(✓) ").replace(/<li data-l="([^"]+)">/g, "[l.$1] ")
  .replace(/<a [^>]*href="([^"]+)"[^>]*>/g, "⟨$1⟩").replace(/<\/a>/g, "⟩")
  .replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
for (let i = 0; i < L.length; i++) {
  const l = L[i];
  if (enScript) { if (/<\/script>/.test(l)) enScript = false; continue; }
  const m = /<script([^>]*)>/.exec(l);
  if (m && !/src=/.test(m[1]) && !/<\/script>/.test(l.slice(m.index))) {
    const t = /data-titulo="([^"]+)"/.exec(m[1]);
    const sol = /data-solucion/.test(m[1]) ? " (solución)" : "";
    const pre = limpiar(l.slice(0, m.index));
    if (pre) out.push(`${i + 1}: ${pre}`);
    out.push(`${i + 1}: [código${t ? " «" + t[1] + "»" : ""}${sol}]`);
    enScript = true; continue;
  }
  if (/^<script/.test(l.trim())) continue;
  const t = limpiar(l);
  if (t) out.push(`${i + 1}: ${t}`);
}
console.log(out.join("\n"));
