// Laboratorio de tiempos de GPU de los módulos 2–5 (sesión 3, encargo pend-m0-m5).
//
// Vuelve a medir, con el método fiable para una GPU de teselas (cada repetición en su propia pasada de render:
// dos framebuffers alternos con clear al empezar, readPixels al final de la tanda, mediana de varias tandas;
// caja «Cómo se mide lo que cuesta un shader (y cómo no)» de 6.6), todas las cifras de trabajo de la GPU de
// 4.1, 4.2, 5.8, 5.9 y 5.10, y las compara con el método de la propia lección y, en dos casos, con la trampa
// (N dibujos seguidos sobre el mismo framebuffer divididos entre N). Imprime una tabla en Markdown:
// lección · afirmación · cifra antigua · cifra nueva · notas. Además comprueba qué pasa con isnan cuando el
// programa sale de la caché de programas de Chrome (3.7, 5.10).
//
// Uso en el Mac del dueño (Apple M1, Chrome, ANGLE/Metal), desde la raíz del curso:
//   node herramientas/estado/lab/pend-m0-m5-tiempos.mjs                 # todo (~1–2 min)
//   node herramientas/estado/lab/pend-m0-m5-tiempos.mjs --solo 4.2      # solo las pruebas cuyo id empieza por 4.2
//   node herramientas/estado/lab/pend-m0-m5-tiempos.mjs --json /tmp/tiempos.json
// Variables de entorno:
//   CHROME=/ruta/al/ejecutable   (por defecto, el Google Chrome de macOS)
//   ANGLE=swiftshader            (solo para probar el script en una máquina sin GPU; las cifras no valen)
//   RAPIDO=1                     (tamaños y vueltas reducidos: solo para comprobar que todo corre)
// Usa el puppeteer-core parcheado de herramientas/node_modules (cola de Chrome): «esperando turno» es normal.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PAGINA = path.join(AQUI, "pend-m0-m5-tiempos.html");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SWIFT = process.env.ANGLE === "swiftshader";
const RAPIDO = !!process.env.RAPIDO;
const args = process.argv.slice(2);
const solo = args.includes("--solo") ? args[args.indexOf("--solo") + 1] : null;
const salidaJSON = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const ms = (r) => (r == null ? "—" : (typeof r === "number" ? r : r.ms)).toFixed(((typeof r === "number" ? r : r.ms) < 1) ? 2 : 1).replace(".", ",") + " ms";
const rango = (r) => r && r.min != null ? ` [${r.min.toFixed(1).replace(".", ",")}–${r.max.toFixed(1).replace(".", ",")}]` : "";
const x = (a, b) => (a.ms / b.ms).toFixed(1).replace(".", ",") + "×";

// Cada prueba: id de la página (window.LAB[id]) y cómo convertir su resultado en filas de la tabla.
const PRUEBAS = [
  { id: "4.1-calculo", filas: (r) => [
    ["4.1", "El mismo cálculo en la GPU: 1024², 400 vueltas de 4 FMA (playground «El mismo cálculo en tu CPU y en tu GPU»)", "7–10 ms",
      ms(r.nueva) + rango(r.nueva), `entre dos readPixels (método de la lección): ${ms(r.leccion)} · trampa (20 dibujos sobre el mismo FBO ÷ 20): ${ms(r.trampa)} · ${(r.gflop * 1000 / r.nueva.ms).toFixed(0)} GFLOPS`],
  ] },
  { id: "4.1-tflops", filas: (r) => [
    ["4.1", "«Con un bucle más cuidado medimos unos 0,9 TFLOPS» (aquí: 4 cadenas vec4 independientes)", "0,9 TFLOPS",
      r.tflops.toFixed(2).replace(".", ",") + " TFLOPS", `${ms(r.nueva)} por pasada (el bucle original no está documentado)`],
  ] },
  { id: "4.1-divergencia", filas: (r) => [
    ["4.1", "Divergencia: todos por la rama A", "8–9 ms", ms(r.todosA.nueva) + rango(r.todosA.nueva), `lección: ${ms(r.todosA.leccion)}`],
    ["4.1", "Divergencia: damero de 1 px", "15,5–17 ms", ms(r.damero1.nueva) + rango(r.damero1.nueva), `lección: ${ms(r.damero1.leccion)}`],
    ["4.1", "Divergencia: bloques de 2 px", "15,5–17 ms", ms(r.bloques2.nueva), `lección: ${ms(r.bloques2.leccion)}`],
    ["4.1", "Divergencia: bloques de 4 px", "15,5–17 ms", ms(r.bloques4.nueva), `lección: ${ms(r.bloques4.leccion)}`],
    ["4.1", "Divergencia: bloques de 8 px", "≈ 9 ms", ms(r.bloques8.nueva), `lección: ${ms(r.bloques8.leccion)}`],
    ["4.1", "Divergencia: bloques de 16 px", "≈ 9 ms", ms(r.bloques16.nueva), `lección: ${ms(r.bloques16.leccion)}`],
    ["4.1", "Divergencia: bloques de 64 px", "≈ 9 ms", ms(r.bloques64.nueva), `lección: ${ms(r.bloques64.leccion)}`],
  ] },
  { id: "4.1-memoria", filas: (r) => [
    ["4.1", "Textura 2048²: acceso coherente (16 texelFetch por píxel, 1024²)", "≈ 1 ms", ms(r.coherente.nueva) + rango(r.coherente.nueva), `lección: ${ms(r.coherente.leccion)}`],
    ["4.1", "Textura 2048²: acceso aleatorio", "≈ 18 ms", ms(r.aleatorio.nueva) + rango(r.aleatorio.nueva), `lección: ${ms(r.aleatorio.leccion)} · cociente ${x(r.aleatorio.nueva, r.coherente.nueva)} (antes «casi veinte veces»)`],
  ] },
  { id: "4.1-readpixels", filas: (r) => [
    ["4.1", "Tabla de llamadas: readPixels justo después de un dibujo de 600 senos (1024²)", "≈ 12 ms", ms(r.esperaReadPixels), `el dibujo medido por pasadas: ${ms(r.nueva)} · drawArrays en el JS: ${ms(r.drawJS)}`],
    ["4.1 / 5.10", "finish() no espera; el readPixels de después sí", "0,0 ms y 12 ms", `${ms(r.finish)} y ${ms(r.readPixelsTrasFinish)}`, ""],
  ] },
  { id: "4.1-llamadas", filas: (r) => [
    ["4.1", `${r.diezMil.N.toLocaleString("es")} draw calls: total hasta que la GPU termina`, "≈ 3,5 ms", ms(r.diezMil.separado) + rango(r.diezMil.separado), `de ellos, en el JS: ${ms(r.diezMil.separado.extra)} (antes 0,3 ms)`],
    ["4.1", `1 draw call instanciado (${r.diezMil.N.toLocaleString("es")} triángulos)`, "≈ 0,7 ms", ms(r.diezMil.instanciado), ""],
    ["4.1", `${r.cienMil.N.toLocaleString("es")} draw calls: total`, "26 ms", ms(r.cienMil.separado) + rango(r.cienMil.separado), `de ellos, en el JS: ${ms(r.cienMil.separado.extra)} (antes 10 ms)`],
  ] },
  { id: "4.1.3-frames", filas: (r) => [
    ["4.1.3", "10 frames con 10 000 draw calls cada uno (400²)", "40–45 ms", ms(r.separado.leccion), `con cada frame en su pasada: ${ms(r.separado.nueva.ms * 10)}`],
    ["4.1.3", "10 frames con un único drawArrays", "≈ 3 ms", ms(r.uno.leccion), `con cada frame en su pasada: ${ms(r.uno.nueva.ms * 10)}`],
  ] },
  { id: "4.2-capas", filas: (r) => {
    const b = r["1 capa"].nueva;
    const f = (k, antes) => ["4.2", "32 capas 1024²: " + k, antes, ms(r[k].nueva) + rango(r[k].nueva) + " (" + x(r[k].nueva, b) + ")", `lección (escena entre barreras): ${ms(r[k].leccion)}`];
    return [
      ["4.2", "1 capa (referencia)", "2,4–3,5 ms", ms(b) + rango(b), `lección: ${ms(r["1 capa"].leccion)} · trampa (20 dibujos ÷ 20): ${ms(r.trampa1capa)}`],
      f("opacas, prof., delante→atrás", "2,2–2,9 ms (≈1×)"),
      f("opacas, prof., atrás→delante", "2,2–2,9 ms (≈1×)"),
      f("opacas, sin prof.", "2,4–2,5 ms (≈1×)"),
      f("discard, delante→atrás", "14–15,5 ms (4–6×)"),
      f("discard, atrás→delante", "60–66 ms (17–27×)"),
      f("gl_FragDepth", "59–66 ms (17–27×)"),
      f("translúcidas (blending)", "59–66 ms (17–27×)"),
      f("blending, alfa constante 1", "2,6 ms"),
      f("blending, alfa calculado (=1)", "66 ms"),
      f("hack: visibles, con discard", "46 ms"),
      f("hack: visibles, ocultar en VS", "2 ms"),
      f("hack: ocultas, con discard", "1,1 ms"),
      f("hack: ocultas, ocultar en VS", "0,5 ms"),
    ];
  } },
  { id: "5.8-scissor", filas: (r) => [
    ["5.8", "Picking: dibujo pesado completo a 1024² (aquí, el de 600 senos de 4.1; el original no está documentado)", "14 ms", ms(r.completo) + rango(r.completo), `espera de readPixels tras un dibujo: ${ms(r.esperaTrasDibujo)}`],
    ["5.8", "El mismo con scissor de 1 píxel", "0,6 ms", ms(r.scissor), `una pasada vacía (clear + readPixels repartido): ${ms(r.soloPasada)}`],
  ] },
  { id: "5.8-readpixels", filas: (r) => [
    ["5.8", "readPixels de 1 px sin nada pendiente / tras un dibujo trivial (dibujo solo, en el JS)", "0,03 / 0,4 ms (0,004 ms)", `${ms(r.libre)} / ${ms(r.trasTrivial)} (${ms(r.dibujoJS)})`, "espera de sincronización"],
  ] },
  { id: "5.9-instancias", filas: (r) => [
    ["5.9", "1 000 000 de instancias en una llamada (aquí a 1440 × 900)", "60 fps", ms(r[1000000].nueva) + " → ≤ " + Math.min(60, Math.round(1000 / r[1000000].nueva.ms)) + " fps", "tiempo de GPU por frame; tamaño del lienzo original desconocido"],
    ["5.9", "4 000 000 de instancias en una llamada", "19 fps", ms(r[4000000].nueva) + " → ≤ " + Math.min(60, Math.round(1000 / r[4000000].nueva.ms)) + " fps", ""],
  ] },
  { id: "5.10-resolucion", filas: (r) => {
    const a = r["800x500"], b = r["1600x1000"], c = r["2400x1500"];
    return [
      ["5.10", "Shader pesado (fondo del laboratorio, 300 vueltas) a 800×500 / 1600×1000 / 2400×1500", "5,1 / 16,7 / 35,9 ms (×3,3 y ×7)", `${ms(a.pesado)} / ${ms(b.pesado)} / ${ms(c.pesado)}`, `cocientes ${x(b.pesado, a.pesado)} y ${x(c.pesado, a.pesado)} (antes ×3,3 y ×7; píxeles ×4 y ×9)`],
      ["5.10", "20 000 llamadas pequeñas a las tres resoluciones", "5,4 / 5,6 / 6,7 ms", `${ms(a.llamadas)} / ${ms(b.llamadas)} / ${ms(c.llamadas)}`, "límite: las llamadas, no los píxeles"],
    ];
  } },
  { id: "5.10-overdraw", filas: (r) => [
    ["5.10", "Una capa a pantalla completa (fondo, 300 vueltas, 800×500)", "5,9–6,4 ms", ms(r.una) + rango(r.una), "resolución y vueltas del original no documentadas"],
    ["5.10", "16 capas opacas con profundidad, delante→atrás / atrás→delante / sin profundidad", "6,1–6,5 ms (≈1×)", `${ms(r.opacas)} / ${ms(r.opacasAtras)} / ${ms(r.opacasSinProf)}`, `${x(r.opacas, r.una)} / ${x(r.opacasAtras, r.una)} / ${x(r.opacasSinProf, r.una)}`],
    ["5.10", "16 capas translúcidas", "85,9 ms", ms(r.translucidas), x(r.translucidas, r.una)],
    ["5.10", "16 capas con un discard que nunca se ejecuta", "86,9 ms", ms(r.conDiscard), x(r.conDiscard, r.una)],
  ] },
  { id: "5.10-estado", filas: (r) => [
    ["5.10", "10 000 dibujos alternando 2 programas / agrupados", "8,4 / 3,6 ms", `${ms(r.programasAlternos)} / ${ms(r.programasAgrupados)}`, "proceso de órdenes, no fragmentos"],
    ["5.10", "10 000 dibujos alternando 2 texturas / agrupados", "6,3 / 4,1 ms", `${ms(r.texturasAlternas)} / ${ms(r.texturasAgrupadas)}`, ""],
  ] },
  { id: "5.10-subir", filas: (r) => [
    ["5.10", "texSubImage2D de 1024² RGBA por frame: desde un array / desde un canvas 2D", "1 / 0,3 ms", `${ms(r.desdeArray)} / ${ms(r.desdeCanvas)}`, `la misma pasada sin subir nada: ${ms(r.sinSubir)}`],
  ] },
  { id: "5.10-temporizador", filas: (r) => [
    r.sinExtension
      ? ["5.10", "EXT_disjoint_timer_query_webgl2, un dibujo pesado por frame", "3,2–9,8 ms con el mismo trabajo", "sin extensión", `referencia por pasadas: ${ms(r.ref)}`]
      : ["5.10", "EXT_disjoint_timer_query_webgl2, un dibujo de 600 senos por frame (12 consultas)", "3,2–9,8 ms con el mismo trabajo",
         `mediana ${ms(r.mediana)}, mín. ${ms(r.min)}, máx. ${ms(r.max)}`, `referencia por pasadas: ${ms(r.ref)} · disjoint=${r.disjunto} · valores: ${r.consultas.map((v) => v.toFixed(1)).join(" ")}`],
  ] },
  { id: "isnan-cache", filas: (r) => [
    ["3.7 / 5.10", "WebGL crudo: mismo texto con isnan compilado 3 veces → fallos de mod(x, 7.0) en 4 096 múltiplos negativos de 7", "0 → 2 071 (lead, sesión 2)",
      `${r.primera.fallosMod} → ${r.segunda.fallosMod} → ${r.tercera.fallosMod}`, ""],
    ["3.7 / 5.10", "¿isnan(u_nan) sigue detectando un NaN de verdad en la versión de la caché? (píxeles que lo detectan, de 4 096)", "sin medir",
      `${r.primera.isnanDetecta} → ${r.segunda.isnanDetecta} → ${r.tercera.isnanDetecta}`, `falsos positivos con 0: ${r.primera.isnanFalsosPositivos} / ${r.segunda.isnanFalsosPositivos} / ${r.tercera.isnanFalsosPositivos}. Si la 2.ª da 0, las vistas «NaN en magenta» de WebGL crudo fallan sin el comentario único (5.10.4 y 5.10.2 ya lo llevan)`],
  ] },
];

const opciones = {
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 600000,
  args: SWIFT ? ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
              : ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
};
const nav = await puppeteer.launch(opciones);
const filas = [], crudo = {};
let hubieronErrores = false;
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => { hubieronErrores = true; console.error("pageerror:", e.message); });
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error("consola:", m.text()); });
  await page.goto("file://" + PAGINA);
  await page.evaluate((o) => window.LAB.config(o), { escala: RAPIDO ? 0.125 : 1, tandas: RAPIDO ? 2 : 5 });
  const gpu = await page.evaluate(() => window.LAB.gpu());
  console.log(`# Tiempos de GPU, módulos 2–5\n\nGPU: ${gpu} · ${await nav.version()} · ${new Date().toISOString()}${RAPIDO ? " · MODO RÁPIDO (tamaños reducidos: las cifras no valen)" : ""}${SWIFT ? " · SwiftShader (software: las cifras no valen)" : ""}\n`);
  for (const p of PRUEBAS) {
    if (solo && !p.id.startsWith(solo)) continue;
    const t0 = Date.now();
    try {
      const r = await page.evaluate((id) => window.LAB[id](), p.id);
      crudo[p.id] = r;
      for (const f of p.filas(r)) filas.push(f);
      console.error(`· ${p.id}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    } catch (e) {
      hubieronErrores = true;
      console.error(`✗ ${p.id}: ${e.message}`);
      filas.push([p.id, "ERROR", "", e.message.split("\n")[0], ""]);
    }
    await page.evaluate(() => window.LAB.liberar());
  }
} finally {
  await nav.close();
}
const esc = (s) => String(s).replace(/\|/g, "\\|");
console.log("| Lección | Afirmación | Cifra antigua | Cifra nueva (pasadas aisladas, mediana) | Notas |");
console.log("|---|---|---|---|---|");
for (const f of filas) console.log("| " + f.map(esc).join(" | ") + " |");
console.log("\nMétodo «nueva»: cada repetición en su propia pasada (dos FBO alternos, clear al empezar), readPixels de 1 px al final de la tanda, mediana de 5 tandas; entre corchetes, [mínimo–máximo] de las tandas. «lección»: un dibujo (o la escena) entre dos readPixels, mediana de 5 (3 en 4.2). «trampa»: N dibujos seguidos sobre el mismo FBO ÷ N.");
if (salidaJSON) { fs.writeFileSync(salidaJSON, JSON.stringify(crudo, null, 1)); console.error("JSON:", salidaJSON); }
if (hubieronErrores) process.exitCode = 1;
