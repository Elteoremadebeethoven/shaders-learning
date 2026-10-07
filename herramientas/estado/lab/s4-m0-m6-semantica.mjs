// Experimentos de semántica en el M1 (sesión 4, agente m0-m6). No mide tiempos de GPU (turno normal).
// Uso, desde herramientas/:
//   node turnos.mjs --agente m0-m6 --motivo "…" -- node estado/lab/s4-m0-m6-semantica.mjs <dirSalida>
// Lanza Chrome DOS veces seguidas (nunca a la vez) con el MISMO perfil persistente (en <dirSalida>/perfil) para ver la
// caché de programas entre recargas, pestañas y relanzamientos. Escribe <dirSalida>/semantica.json y capturas.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";

const RAIZ = "/Users/alex/Projects/shaders";
const SAL = process.argv[2] || "/tmp/s4-m0-m6";
fs.mkdirSync(SAL, { recursive: true });
const PERFIL = path.join(SAL, "perfil-" + Date.now());
const PAG = "file://" + RAIZ + "/herramientas/estado/lab/s4-m0-m6-semantica.html";
const RUIDO = "file://" + RAIZ + "/modulos/06-glsl/06-ruido.html";
const DEPU = "file://" + RAIZ + "/modulos/05-webgl/10-depuracion.html";
const OPC = {
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new", protocolTimeout: 300000, userDataDir: PERFIL,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 900 },
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const R = {};
const log = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)); };

async function pruebasSemantica(page, pre) {
  await page.goto(PAG);
  if (pre === "S1") {
    log("S1 precision", await page.evaluate(() => precision()));
    log("S1 pcg", await page.evaluate(() => pcg()));
    log("S1 texelfetch", await page.evaluate(() => texelfetch()));
    const u = Math.random().toString(36).slice(2, 8);
    log("S1 fm sin isnan (único)", await page.evaluate((u) => fastmath("unico-sin-" + u, false), u));
    log("S1 fm con isnan (único)", await page.evaluate((u) => fastmath("unico-con-" + u, true), u));
    for (let i = 1; i <= 3; i++) log(`S1 fm con isnan FIJO #${i}`, await page.evaluate(() => fastmath("fijo-A", true)));
    for (let i = 1; i <= 2; i++) log(`S1 lead FIJO #${i}`, await page.evaluate(() => lead("lead-fijo")));
    for (let i = 1; i <= 3; i++) log(`S1 detecta FIJO #${i}`, await page.evaluate(() => detecta("det-fijo")));
    log("S1 5.10.4 con isnan, sufijo único", await page.evaluate(() => ej5104(true, "\n// " + Math.random())));
    log("S1 5.10.4 con isnan, fijo #1", await page.evaluate(() => ej5104(true, "\n// fijo")));
    log("S1 5.10.4 con isnan, fijo #2", await page.evaluate(() => ej5104(true, "\n// fijo")));
    log("S1 5.10.4 sin isnan, sufijo único", await page.evaluate(() => ej5104(false, "\n// " + Math.random())));
    await page.reload();
    log("S1 tras recargar: fm con isnan FIJO", await page.evaluate(() => fastmath("fijo-A", true)));
    log("S1 tras recargar: detecta FIJO", await page.evaluate(() => detecta("det-fijo")));
    log("S1 tras recargar: lead FIJO", await page.evaluate(() => lead("lead-fijo")));
    log("S1 tras recargar: 5.10.4 con isnan fijo", await page.evaluate(() => ej5104(true, "\n// fijo")));
  } else {
    log(pre + " fm con isnan FIJO", await page.evaluate(() => fastmath("fijo-A", true)));
    log(pre + " detecta FIJO", await page.evaluate(() => detecta("det-fijo")));
    log(pre + " lead FIJO", await page.evaluate(() => lead("lead-fijo")));
    log(pre + " 5.10.4 con isnan fijo", await page.evaluate(() => ej5104(true, "\n// fijo")));
    log(pre + " fm sin isnan (único)", await page.evaluate(() => fastmath("unico-sin-" + Math.random(), false)));
  }
}

// 6.6: niveles de gris distintos en los dos editores del hash del seno (lienzo 2D visible de cada playground)
async function grisesRuido(page, etiqueta) {
  const titulos = ["Seno, lejos del origen", "El mismo + un isnan"];
  const r = {};
  for (const t of titulos) {
    await page.evaluate((t) => document.querySelector(`.glsl-playground[data-titulo="${t}"]`).scrollIntoView({ block: "center" }), t);
    await dormir(1500);
    r[t] = await page.evaluate((t) => {
      const el = document.querySelector(`.glsl-playground[data-titulo="${t}"]`);
      const cv = [...el.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      const s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i]);
      return { lienzo: cv.width + "×" + cv.height, nivelesDeGris: s.size };
    }, t);
  }
  log(etiqueta, r);
}

// 5.10.4 en la lección real: lectura de la consola y recuento de píxeles por vista
async function ejemplo5104(page, etiqueta) {
  await page.goto(DEPU);
  await page.evaluate(() => document.querySelector('.js-playground[data-titulo="Falso color y NaN"]').scrollIntoView({ block: "center" }));
  await dormir(3500);
  let marco = null;
  for (const fr of page.frames()) {
    try { if (await fr.evaluate(() => !!document.querySelector("#vista") && typeof dibujar === "function")) { marco = fr; break; } } catch { }
  }
  if (!marco) { log(etiqueta, "no encontré el iframe del 5.10.4"); return; }
  const cuentas = await marco.evaluate(() => {
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    const contar = (vista) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); dibujar(vista);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let magenta = 0, negro = 0, azul = 0, otros = 0;
      for (let i = 0; i < px.length; i += 4) {
        const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
        if (r === 255 && g === 0 && b === 255) magenta++; else if (r === 0 && g === 0 && b === 0) negro++;
        else if (r === 0 && g === 0 && b > 0) azul++; else otros++;
      }
      return { magenta, negroPuro: negro, azul, otros };
    };
    // un píxel de la cara oscura (el que lee la lección al arrancar)
    const x = Math.floor((w - 0.45 * h) / 2), y = Math.floor(0.3 * h);
    dibujar(0); const c = new Uint8Array(4); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, c);
    return { tamaño: w + "×" + h, vista0: contar(0), vista2: contar(2), vista3: contar(3), pixelCaraOscura_vista0: Array.from(c).join(",") };
  });
  const consola = await page.evaluate(() => document.querySelector('.js-playground[data-titulo="Falso color y NaN"] .pg-consola')?.textContent || "(sin consola)");
  log(etiqueta, { ...cuentas, consola: consola.trim().slice(0, 300) });
  // capturas de las vistas 0 y 3 (selector de verdad, para ver lo que ve el alumno)
  const ifr = await marco.frameElement();
  for (const v of ["0", "3"]) {
    await marco.evaluate((v) => { const s = document.getElementById("vista"); s.value = v; }, v);
    await dormir(600);
    try { await page.screenshot({ path: path.join(SAL, `5104-vista${v}.png`) }); } catch (e) { console.log("captura:", e.message); }
  }
}

// Sesión 1 (perfil nuevo)
let nav = await puppeteer.launch(OPC);
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await pruebasSemantica(page, "S1");
  const p2 = await nav.newPage();
  await pruebasSemantica(p2, "S1 otra pestaña");
  await p2.close();
  await page.goto(RUIDO); await dormir(1000);
  await grisesRuido(page, "S1 6.6 primera carga");
  await page.reload(); await dormir(1000);
  await grisesRuido(page, "S1 6.6 al recargar");
  await ejemplo5104(page, "S1 5.10.4 en la lección");
} finally { await nav.close(); }
await dormir(1500);
// Sesión 2: mismo perfil, Chrome relanzado (caché de disco)
nav = await puppeteer.launch(OPC);
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await pruebasSemantica(page, "S2 relanzado");
  await page.goto(RUIDO); await dormir(1000);
  await grisesRuido(page, "S2 6.6 tras relanzar");
  log("version", await nav.version());
} finally { await nav.close(); }
fs.writeFileSync(path.join(SAL, "semantica.json"), JSON.stringify(R, null, 1));
fs.rmSync(PERFIL, { recursive: true, force: true });
console.log("JSON:", path.join(SAL, "semantica.json"));
