// Comprueba que cada enlace #mN-… del «Diagnóstico rápido» de A.1 es un caso de datos-bestiario.js y lista los casos sin síntoma.
// Uso: node s4-anexos-diag.mjs [x]   (con x, lista los casos sin enlace)
import fs from "fs";
const R = "/Users/alex/Projects/shaders/";
const src = fs.readFileSync(R + "assets/js/datos-bestiario.js", "utf8");
const w = {}; new Function("window", src)(w);
const ids = new Set(w.CURSO_BESTIARIO.map(c => c.id));
const html = fs.readFileSync(R + "modulos/08-anexos/01-bestiario.html", "utf8");
const diag = html.slice(html.indexOf('<div class="ax-sintomas'), html.indexOf('<h2>Todos los casos'));
const links = [...diag.matchAll(/href="#(m[0-9][^"]*)"/g)].map(m => m[1]);
const usados = new Set(links);
console.log("enlaces a casos:", links.length, "distintos:", usados.size, "casos:", ids.size);
for (const l of usados) if (!ids.has(l)) console.log("NO EXISTE:", l);
const sin = [...ids].filter(i => !usados.has(i));
console.log("casos sin enlace en el diagnóstico:", sin.length);
if (process.argv[2]) console.log(sin.join("\n"));
