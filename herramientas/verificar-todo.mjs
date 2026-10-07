#!/usr/bin/env node
/* Verifica TODO el curso por tandas, pidiendo turno al portero (turnos.mjs) para cada tanda.

   Uso (desde cualquier carpeta):
     node herramientas/verificar-todo.mjs [--tema light] [--sin-soluciones] [--movil] [--tanda 3]
                                          [--solo "05-webgl|06-glsl"] [--capturas dir] [--salida informe.txt]

   - Lee la lista de lecciones de assets/js/manifest.js (más index.html; la página autónoma
     modulos/07-integracion/proyecto-final/index.html no se verifica aquí: no carga curso.js).
   - Cada tanda (3 lecciones por defecto) es una llamada a verificar.mjs con UN turno del portero: como mucho
     ocupa uno de los dos turnos de la máquina, así que puede convivir con otro proceso pesado.
   - --movil añade una pasada de movil.mjs (390 px) por tanda.
   - Al final imprime un resumen con las lecciones con problemas (y lo guarda en --salida si se pide). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(DIR, "..");
const a = process.argv.slice(2);
const valor = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const TANDA = Math.max(1, +valor("--tanda", 3));
const solo = valor("--solo", "");

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(RAIZ, "assets/js/manifest.js"), "utf8"), ctx);
let archivos = ["index.html"].concat(ctx.window.CURSO_MANIFEST.modulos.flatMap((m) => m.lecciones.map((l) => l.archivo)));
if (solo) archivos = archivos.filter((f) => new RegExp(solo).test(f)); // p. ej. --solo "0[0-6]-|08-anexos"
archivos = archivos.map((f) => path.join(RAIZ, f));

const extra = [];
if (!a.includes("--sin-soluciones")) extra.push("--soluciones");
if (valor("--tema")) extra.push("--tema", valor("--tema"));
if (valor("--capturas")) extra.push("--capturas", valor("--capturas"));

const malos = [], lineas = [];
const t0 = Date.now();
for (let i = 0; i < archivos.length; i += TANDA) {
  const tanda = archivos.slice(i, i + TANDA);
  const nombres = tanda.map((f) => path.relative(RAIZ, f)).join(", ");
  console.log(`\n=== tanda ${i / TANDA + 1}/${Math.ceil(archivos.length / TANDA)}: ${nombres}`);
  const r = spawnSync("node", [path.join(DIR, "turnos.mjs"), "--agente", process.env.CURSO_AGENTE || "verificar-todo",
    "--motivo", "verificar-todo: " + nombres, "--", "node", path.join(DIR, "verificar.mjs"), ...tanda, ...extra],
    { cwd: DIR, encoding: "utf8", maxBuffer: 64 << 20 });
  const sal = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(sal);
  lineas.push(sal);
  for (const m of sal.matchAll(/^✗ (.+?)(?:  \(\d+ ms\))?$/gm)) malos.push(m[1]);
  if (r.status !== 0 && !/páginas sin problemas/.test(sal)) malos.push("(la tanda no terminó) " + nombres);
  if (a.includes("--movil")) {
    const m = spawnSync("node", [path.join(DIR, "turnos.mjs"), "--agente", process.env.CURSO_AGENTE || "verificar-todo",
      "--motivo", "verificar-todo (390 px): " + nombres, "--", "node", path.join(DIR, "movil.mjs"), ...tanda], { cwd: DIR, encoding: "utf8" });
    const ms = (m.stdout || "") + (m.stderr || "");
    process.stdout.write(ms);
    lineas.push(ms);
    for (const x of ms.matchAll(/^✗ (.+)$/gm)) malos.push("móvil: " + x[1]);
  }
}
const resumen = `\n=== RESUMEN (${((Date.now() - t0) / 60000).toFixed(1)} min, ${archivos.length} páginas${extra.length ? ", " + extra.join(" ") : ""})\n` +
  (malos.length ? malos.map((m) => "✗ " + m).join("\n") : "✓ todas sin problemas") + "\n";
console.log(resumen);
if (valor("--salida")) fs.writeFileSync(valor("--salida"), lineas.join("\n") + resumen);
process.exit(malos.length ? 1 : 0);
