// Sesión 4, lead (§3.2): la tabla «¿Cuánto se ahorra?» de 5.9 (20 000–200 000 llamadas; 1 M y 4 M de instancias) no
// decía el tamaño del lienzo. Se mide con la MISMA demo de la lección («Comparativa: draw calls frente a instancing»),
// con MAX subido a 4 000 000 para llegar a las filas de 1 M y 4 M, en una ventana como la del MacBook Air
// (1440 × 900 puntos, DPR 2). Lee la línea de info de la demo (fps y JS por frame) tras estabilizarse.
// Uso, desde herramientas/ y con turno exclusivo:
//   node turnos.mjs --exclusivo --agente lead --motivo "…" -- node estado/lab/s4-lead-instancing.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const LECCION = "file:///Users/alex/Projects/shaders/modulos/05-webgl/09-instancing.html";
const SEL = '.js-playground[data-titulo="Comparativa: draw calls frente a instancing"]';
// Con el argumento «mat4»: variante de la fila «100 000 llamadas con una mat4 y un color por objeto» (u_pos pasa a ser
// una mat4 que se sube con uniformMatrix4fv en cada llamada; la posición va en su 4.ª columna).
const MAT4 = process.argv[2] === "mat4";
const CASOS = MAT4 ? [["individual", 100000]] : [["individual", 20000], ["individual", 50000], ["individual", 100000], ["individual", 200000],
               ["instanciado", 20000], ["instanciado", 1000000], ["instanciado", 4000000]];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // VENTANA=1: Chrome con ventana (perfil temporal de puppeteer, no el del dueño): el rAF va al ritmo de la pantalla y
  // espera a la GPU como en un navegador normal; en headless el bucle no espera a la GPU (ver el modo + readPixels).
  headless: process.env.VENTANA ? false : "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"].concat(process.env.VENTANA ? ["--window-size=1440,900"] : []),
  defaultViewport: process.env.VENTANA ? null : { width: 1440, height: 900, deviceScaleFactor: 2 },
});
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(LECCION);
  await dormir(1500);
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), SEL);
  await dormir(1500);
  const ok = await page.evaluate((s, mat4) => {
    const cm = [...document.querySelectorAll(s + " .CodeMirror")].map((e) => e.CodeMirror).find((c) => c && c.getValue().includes("const MAX = 150000;"));
    if (!cm) return false;
    // MAX a 4 M; y un readPixels opcional al final de cada frame (self.__sync): obliga a esperar a la GPU, así que
    // «JS por frame» pasa a incluir lo que tarda la GPU en dibujar el frame (en headless el rAF no la espera).
    cm.setValue(cm.getValue().replace("const MAX = 150000;", "const MAX = 4000000; const __px = new Uint8Array(4);")
      .replace("uniform vec2 u_pos;", mat4 ? "uniform mat4 u_pos;" : "uniform vec2 u_pos;")
      .replace("mat2(c, s, -s, c) * u_pos +", mat4 ? "mat2(c, s, -s, c) * u_pos[3].xy +" : "mat2(c, s, -s, c) * u_pos +")
      .replace("gl.uniform2f(locI.pos, posiciones[i * 2], posiciones[i * 2 + 1]);", mat4
        ? "__m[12] = posiciones[i * 2]; __m[13] = posiciones[i * 2 + 1]; gl.uniformMatrix4fv(locI.pos, false, __m);"
        : "gl.uniform2f(locI.pos, posiciones[i * 2], posiciones[i * 2 + 1]);")
      .replace("const __px = new Uint8Array(4);", "const __px = new Uint8Array(4); const __m = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);")
      .replace("  msJS += performance.now() - inicio; frames++;", "  if (self.__sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, __px);\n  msJS += performance.now() - inicio; frames++;"));
    document.querySelector(s + " .pg-btn.primario").click();
    return true;
  }, SEL, MAT4);
  if (!ok) throw new Error("no encuentro const MAX en la demo");
  await dormir(6000);
  const fr = await (await page.$(SEL + " iframe")).contentFrame();
  const lienzo = await fr.evaluate(() => { const c = document.getElementById("c"); return `${c.width} × ${c.height} px (CSS ${c.clientWidth} × ${c.clientHeight}, DPR ${devicePixelRatio})`; });
  console.log("lienzo:", lienzo);
  for (const [modo, n, sync] of CASOS.flatMap(([m, n]) => [[m, n, false], [m, n, true]])) {
    await fr.evaluate((sync) => { self.__sync = sync; }, sync);
    await fr.evaluate((modo, n) => { const e = document.getElementById("n"); e.max = 4000000; e.value = n; document.getElementById("modo").value = modo; }, modo, n);
    await dormir(4000);
    const lecturas = [];
    for (let k = 0; k < 4; k++) { await dormir(1100); lecturas.push(await fr.evaluate(() => document.getElementById("info").textContent)); }
    console.log(`${modo.padEnd(11)} ${String(n).padStart(7)}${sync ? " + readPixels" : "             "}:`, lecturas.map((l) => l.replace(/^.*?llamadas por frame · /, "")).join(" | "));
  }
  console.log(await nav.version());
} finally { await nav.close(); }
