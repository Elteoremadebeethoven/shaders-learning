import fs from "node:fs";
// Lista los bloques <script type="text/x-js"> (y scripts inline) que contienen performance.now y draw*/clear de WebGL
for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, "utf8");
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src))) {
    const code = m[2];
    if (/performance\.now/.test(code) && /(drawArrays|drawElements|readPixels|EXT_disjoint)/.test(code)) {
      const linea = src.slice(0, m.index).split("\n").length;
      const sol = /data-solucion/.test(m[1]) ? " [solución]" : "";
      console.log(`${f}:${linea}${sol}  draws=${(code.match(/draw(Arrays|Elements)(Instanced)?\(/g)||[]).length} readPixels=${(code.match(/readPixels/g)||[]).length} timer=${/EXT_disjoint/.test(code)} raf=${/requestAnimationFrame|GLKit\.bucle|lienzo2d/.test(code)}`);
    }
  }
}
