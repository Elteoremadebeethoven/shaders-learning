// Extrae un playground JS de la lección a una página autónoma (file://) para experimentos.
// Uso: node extraer.mjs "<data-titulo>" salida.html [--solucion]
import fs from "node:fs";
const [titulo, salida, sol] = process.argv.slice(2);
const html = fs.readFileSync("/home/user/shaders-learning/modulos/07-integracion/02-interaccion.html", "utf8");
const i = html.indexOf(`data-titulo="${titulo}"`);
if (i < 0) throw new Error("no encontrado");
const fin = html.indexOf('<details class="pista"', i) > 0 ? Math.min(html.indexOf("</section>", i)) : html.indexOf("</section>", i);
const bloque = html.slice(i, fin);
const get = (tipo, solucion) => {
  const re = new RegExp(`<script type="text/x-${tipo}"${solucion ? " data-solucion" : ""}>([\\s\\S]*?)</script>`);
  const m = bloque.match(re); return m ? m[1] : null;
};
const h = get("html"), c = (sol && get("css", true)) || get("css"), j = (sol && get("js", true)) || get("js");
const R = "file:///home/user/shaders-learning/";
fs.writeFileSync(salida, `<!doctype html><html><head><meta charset="utf-8"><style>${c}</style></head><body>${h}
<script src="${R}assets/js/glkit.js"></script><script src="${R}assets/js/texturas.js"></script><script src="${R}modulos/07-integracion/recursos/m7kit.js"></script>
<script>${j.replace(/<\\\/script>/g, "</scr" + "ipt>")}</script></body></html>`);
console.log("ok", salida, h.length, c.length, j.length);
