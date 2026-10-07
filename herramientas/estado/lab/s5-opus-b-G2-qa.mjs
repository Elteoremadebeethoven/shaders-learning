// QA con interacción de 6.6–6.10 (sesión 5, opus-b/G2): pone deslizadores y casillas de los playgrounds GLSL,
// cambia el código de un editor y simula el ratón, y guarda capturas de la zona del lienzo de cada caso.
// Capturas con page.screenshot({ clip, captureBeyondViewport: false }). Un solo Chrome.
// Uso (con turno): node s5-opus-b-G2-qa.mjs <carpeta-salida>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const SAL = process.argv[2] || "./qa-g2";
fs.mkdirSync(SAL, { recursive: true });
const BASE = "file:///Users/alex/Projects/shaders/modulos/06-glsl/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 1000, deviceScaleFactor: 1 },
});
const errores = [];
const log = (...a) => console.log(...a);
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("console", (m) => { if (["error", "warn", "warning"].includes(m.type())) errores.push(m.type() + ": " + m.text()); });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("curso-tema", JSON.stringify("dark")); Object.keys(localStorage).filter((k) => k.startsWith("pg")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  async function abrir(archivo) {
    await page.goto(BASE + archivo, { waitUntil: "load" });
    await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
    await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
    await espera(500);
  }
  const buscar = async (titulo) => {
    const hs = await page.$$(".glsl-playground");
    for (const h of hs) if ((await h.evaluate((e) => e.dataset.titulo)) === titulo) return h;
    throw new Error("no encuentro " + titulo);
  };
  const poner = (h, etiqueta, valor) => h.evaluate((el, [et, v]) => {
    for (const c of el.querySelectorAll(".control")) {
      const l = c.querySelector("label");
      if (!l || l.textContent !== et) continue;
      const inp = c.querySelector("input");
      if (inp.type === "checkbox") { inp.checked = !!v; inp.dispatchEvent(new Event("change")); }
      else { inp.value = String(v); inp.dispatchEvent(new Event("input")); }
      return true;
    }
    throw new Error("sin control " + et);
  }, [etiqueta, valor]);
  const codigo = (h, de, a) => h.evaluate((el, [de, a]) => {
    const cm = el.querySelector(".CodeMirror").CodeMirror;
    const v = cm.getValue();
    if (!v.includes(de)) throw new Error("no está: " + de);
    cm.setValue(v.replace(de, a));
  }, [de, a]);
  async function foto(h, nombre, ms = 1200) {
    await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await espera(ms);
    const r = await h.evaluate((el) => { const e = el.querySelector(".pg-lienzo") || el; const b = e.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: Math.min(b.height, innerHeight) }; });
    await page.screenshot({ path: `${SAL}/${nombre}.png`, clip: r, captureBeyondViewport: false });
    const err = await h.evaluate((el) => { const e = el.querySelector(".pg-errores"); return e && e.textContent.trim(); });
    if (err) log(nombre, "ERRORES:", err.slice(0, 200));
  }

  // ---------- 6.6
  await abrir("06-ruido.html");
  let h = await buscar("Tres hashes, lejos del origen");
  for (const [hs, d] of [[0, 0], [0, 5000], [0, 300000], [1, 300000], [2, 300000]]) { await poner(h, "hash", hs); await poner(h, "desplaz.", d); await foto(h, `66-hashes-h${hs}-d${d}`); }
  h = await buscar("fbm: octavas, lacunaridad y ganancia");
  await poner(h, "arreglo", 0); await poner(h, "usar value noise", true); await foto(h, "66-fbm-a0-valor");
  await poner(h, "arreglo", 1); await foto(h, "66-fbm-a1-valor");
  await poner(h, "arreglo", 0); await poner(h, "usar value noise", false); await foto(h, "66-fbm-a0-grad");
  await poner(h, "arreglo", 2); await foto(h, "66-fbm-a2-grad");
  h = await buscar("El fade, visto con luz");
  for (const f of [0, 1, 2]) { await poner(h, "fade", f); await foto(h, `66-fade-${f}`); }
  h = await buscar("Ruido calculado frente a ruido leído de textura");
  await poner(h, "lupa de contraste", true); await poner(h, "zoom (log2)", 7);
  for (const f of [0, 1, 2]) { await poner(h, "fuente", f); await foto(h, `66-textura-f${f}-lupa-z7`); }
  h = await buscar("Value noise con periodo");
  await poner(h, "marcar copias", false); await foto(h, "66-periodo-si");
  await poner(h, "periódica", false); await foto(h, "66-periodo-no");
  h = await buscar("Ejercicio 6.6.2");
  await h.evaluate((el) => { const b = [...el.querySelectorAll("button")].find((x) => x.textContent.includes("Ver solución")); b.click(); });
  await foto(h, "66-e2-sol", 1500);
  await codigo(h, "float b = hash12(i + vec2(1.0, 0.0));    // (1, 0)\n  float c = hash12(i + vec2(0.0, 1.0));", "float c = hash12(i + vec2(1.0, 0.0));    // (1, 0)\n  float b = hash12(i + vec2(0.0, 1.0));");
  await foto(h, "66-e2-sol-bc-cambiados", 1800);

  // ---------- 6.7
  await abrir("07-animacion-shaders.html");
  h = await buscar("Un comprobador de bucles");
  await poner(h, "diferencia", true);
  for (const T of [4, 2]) { await poner(h, "periodo T", T); await foto(h, `67-bucle-dif-T${T}`); }
  h = await buscar("Ejercicio 6.7.1");
  await poner(h, "diferencia", true); await foto(h, "67-e1-partida-dif");
  await h.evaluate((el) => { [...el.querySelectorAll("button")].find((x) => x.textContent.includes("Ver solución")).click(); });
  await foto(h, "67-e1-sol-dif", 1500);

  // ---------- 6.8
  await abrir("08-texturas-efectos.html");
  h = await buscar("Pixelado y la selección de mipmap");
  for (const b of [13, 12, 8]) { await poner(h, "bloque (px)", b); await foto(h, `68-pixelado-${b}`); }
  await poner(h, "bloque (px)", 13); await poner(h, "textureGrad", true); await foto(h, "68-pixelado-13-grad");
  h = await buscar("Un mosaico con fract y sus costuras");
  await foto(h, "68-mosaico-3.3"); await poner(h, "ver nivel", true); await foto(h, "68-mosaico-3.3-nivel");
  await poner(h, "textureGrad", true); await foto(h, "68-mosaico-3.3-nivel-grad");
  h = await buscar("Transformar las coordenadas");
  await poner(h, "corregir aspecto", false); await foto(h, "68-transformar-sin-aspecto");
  h = await buscar("Desenfoque en los bordes: REPEAT frente a CLAMP");
  await foto(h, "68-bordes-repeat"); await poner(h, "CLAMP_TO_EDGE", true); await foto(h, "68-bordes-clamp");
  h = await buscar("Cuatro distorsiones");
  await poner(h, "fuerza", -0.4); await foto(h, "68-lente-cojin");

  // ---------- 6.9
  await abrir("09-raymarching.html");
  h = await buscar("Ejemplo 6.9.3 — Mapa de calor");
  await foto(h, "69-calor-100", 1500);
  await poner(h, "pasos máx", 16); await foto(h, "69-calor-16");
  await poner(h, "mapa de calor", false); await foto(h, "69-color-16");
  await poner(h, "pasos máx", 100); await poner(h, "deformación", 0.12); await foto(h, "69-color-def012");
  h = await buscar("Esferas infinitas");
  await poner(h, "celda", 2); await poner(h, "radio", 1.2); await foto(h, "69-esferas-cortadas", 1500);
  h = await buscar("Ejemplo 6.9.2 — Capa a capa");
  for (const c of [0, 1, 2, 3, 4]) { await poner(h, "capa", c); await foto(h, `69-capa-${c}`, 900); }

  // ---------- 6.10 (iMouse con ratón simulado)
  await abrir("10-codigo-ajeno.html");
  h = await buscar("iMouse, visualizado (modo shadertoy)");
  await foto(h, "610-imouse-0-antes", 1500);
  const r = await h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await page.mouse.move(r.x + r.w * 0.5, r.y + r.h * 0.5); await espera(400);
  await foto(h, "610-imouse-1-sin-pulsar", 300);
  await page.mouse.move(r.x + r.w * 0.3, r.y + r.h * 0.6); await page.mouse.down(); await espera(200);
  for (let k = 1; k <= 10; k++) { await page.mouse.move(r.x + r.w * (0.3 + 0.04 * k), r.y + r.h * (0.6 - 0.03 * k)); await espera(30); }
  await espera(300);
  await page.screenshot({ path: `${SAL}/610-imouse-2-arrastrando.png`, clip: { x: r.x + await page.evaluate(() => scrollX), y: r.y + await page.evaluate(() => scrollY), width: r.w, height: Math.min(r.h, 1000) }, captureBeyondViewport: false });
  await page.mouse.up(); await espera(400);
  await page.screenshot({ path: `${SAL}/610-imouse-3-suelto.png`, clip: { x: r.x + await page.evaluate(() => scrollX), y: r.y + await page.evaluate(() => scrollY), width: r.w, height: Math.min(r.h, 1000) }, captureBeyondViewport: false });
  log("6.10 iMouse: hecho");
} catch (e) {
  console.log("EXCEPCIÓN:", e.message);
} finally {
  log("errores de página/consola:", errores.length ? errores.join(" | ").slice(0, 2000) : "ninguno");
  await nav.close();
}
