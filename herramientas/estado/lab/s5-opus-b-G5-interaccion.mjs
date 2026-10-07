// Sesión 5 · opus-b (G5): comprobaciones con interacción de 7.6, 7.7 y proyecto-final/ (un solo Chrome).
// Uso (desde herramientas/, con turno):
//   node turnos.mjs --agente opus-b --motivo "…" -- node estado/lab/s5-opus-b-G5-interaccion.mjs <dir-capturas> [<dir-proyecto-antes>]
//   <dir-proyecto-antes>: copia de proyecto-final/ ANTES del arreglo de Motor.Puntero (opcional): se mide igual.
// A. Proyecto final: ¿se duerme el bucle bajo demanda con la página desplazada y SIN ningún evento de puntero?
//    (?reducir y pausa por teclado; rAF contados durante 2 s).
// B. 7.6: 7.6.1 (selector de resolución → búfer), 7.6.2 (hero fuera de la vista → 0 frames, el reloj no avanza),
//    7.6.3 (pausa / ×0,25 / t = 0), 7.6.4 (interrumpir: la velocidad del muelle no salta), ejercicio 7.6.1
//    (píxeles magenta del chivato en progreso 0 y 1, partida y solución).
// C. 7.7: consola del ejemplo 7.7.2 (frames 1–3) y captura del 7.7.3 con el puntero encima.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const RAIZ = "/Users/alex/Projects/shaders";
const SAL = path.resolve(process.argv[2] || "/tmp/s5-g5");
const ANTES = process.argv[3] ? path.resolve(process.argv[3]) : null;
fs.mkdirSync(SAL, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const url = (p, q = "") => pathToFileURL(p).href + q;

const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const errores = [];
function vigilar(p, nombre) {
  p.on("pageerror", (e) => errores.push(nombre + " pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errores.push(nombre + " console.error: " + m.text()); });
}

try {
  // ---------------- A. Proyecto final: el bucle bajo demanda con la página desplazada ----------------
  async function medirProyecto(dir, etiqueta) {
    const res = {};
    for (const modo of ["reducir", "pausa"]) {
      const p = await b.newPage();
      vigilar(p, etiqueta + "/" + modo);
      await p.setViewport({ width: 1440, height: 900 });
      await p.evaluateOnNewDocument(() => {
        window.__raf = 0;
        const o = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (f) => { window.__raf++; return o(f); };
      });
      await p.goto(url(path.join(dir, "index.html"), modo === "reducir" ? "?reducir" : ""), { waitUntil: "load" });
      await dormir(2500);
      if (modo === "pausa") { await p.focus(".hero-pausa"); await p.keyboard.press("Enter"); }   // sin eventos de puntero
      await dormir(1200);
      const contar = async () => { const a = await p.evaluate(() => window.__raf); await dormir(2000); return (await p.evaluate(() => window.__raf)) - a; };
      const arriba = await contar();
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 200); });
      await dormir(1500);
      const desplazada = await contar();
      res[modo] = { "rAF en 2 s, arriba": arriba, "rAF en 2 s, scrollY 200": desplazada };
      await p.close();
    }
    console.log("A. " + etiqueta + ": " + JSON.stringify(res));
  }
  if (!process.env.SIN_A) {             // SIN_A=1: solo B y C (A ya medido)
    if (ANTES) await medirProyecto(ANTES, "proyecto ANTES del arreglo");
    await medirProyecto(path.join(RAIZ, "modulos/07-integracion/proyecto-final"), "proyecto actual");
  }

  // ---------------- B. Lección 7.6 ----------------
  const p = await b.newPage();
  vigilar(p, "7.6");
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.goto(url(path.join(RAIZ, "modulos/07-integracion/06-proyecto-final.html")), { waitUntil: "load" });
  await p.waitForFunction(() => window.Curso && Curso.listo, { timeout: 20000 });
  async function abrir(titulo) {
    const h = await p.evaluateHandle((t) => [...document.querySelectorAll("[data-titulo]")].find((e) => e.dataset.titulo === t), titulo);
    await h.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await dormir(1800);
    const ifr = await h.$("iframe");
    const f = ifr ? await ifr.contentFrame() : null;
    return { h, f };
  }
  async function captura(h, nombre) {
    // clip en coordenadas del DOCUMENTO (con el scroll) y solo la parte visible
    const r = await h.evaluate((e) => { const x = e.getBoundingClientRect(); const top = Math.max(0, x.top); return { x: x.left + scrollX, y: top + scrollY, width: x.width, height: Math.max(1, Math.min(x.bottom, innerHeight) - top) }; });
    await p.screenshot({ path: path.join(SAL, nombre + ".png"), clip: r, captureBeyondViewport: false });
  }

  // 7.6.1: selector de resolución (DPR 2 emulado: «DPR completo» = 2×, «DPR 1» = 1×, «mitad» = 0,5×)
  {
    const { h, f } = await abrir("Ejemplo 7.6.1 — El flujo");
    const out = {};
    for (const v of ["3,1", "1,1", "1,0.5"]) {
      await f.evaluate((v) => { const s = document.getElementById("resolucion"); s.value = v; s.dispatchEvent(new Event("change")); }, v);
      await dormir(500);
      out[v] = await f.evaluate(() => ({ info: document.getElementById("info").textContent, css: document.querySelector("canvas").clientWidth + "×" + document.querySelector("canvas").clientHeight, dpr: devicePixelRatio }));
    }
    console.log("B. 7.6.1 resolución: " + JSON.stringify(out));
    await f.evaluate(() => { const s = document.getElementById("resolucion"); s.value = "1,1"; s.dispatchEvent(new Event("change")); });
    await captura(h, "761");
  }
  // 7.6.2: el hero sale de la vista → sin frames; al volver, el reloj sigue donde estaba
  {
    const { h, f } = await abrir("Ejemplo 7.6.2 — Puntero y scroll");
    const leer = () => f.evaluate(() => ({ frame: bucle.frame, t: +bucle.reloj.t.toFixed(3), activo: bucle.activo, scrollY, info: document.getElementById("info").textContent, titulo: getComputedStyle(document.getElementById("titulo")).transform }));
    const a = await leer();
    await f.evaluate(() => scrollTo(0, 150)); await dormir(800);
    const mitad = await leer();
    await captura(h, "762-mitad");
    await f.evaluate(() => scrollTo(0, 1e5)); await dormir(800);
    const fuera1 = await leer(); await dormir(1500); const fuera2 = await leer();
    await f.evaluate(() => scrollTo(0, 0)); await dormir(1000);
    const vuelta = await leer();
    console.log("B. 7.6.2: " + JSON.stringify({ a, mitad, fuera1, fuera2, vuelta }));
  }
  // 7.6.3: pausa / ×0,25 / t = 0 (todo lo que es función de t, junto)
  {
    const { h, f } = await abrir("Ejemplo 7.6.3 — Un solo reloj");
    const leer = () => f.evaluate(() => ({ t: +bucle.reloj.t.toFixed(3), anims: animaciones.map((a) => Math.round(a.currentTime)), h2: getComputedStyle(document.querySelector("h2")).opacity }));
    await dormir(2500);
    const l0 = await leer();
    await f.click('[data-q="pausa"]'); await dormir(300);
    const p1 = await leer(); await dormir(1000); const p2 = await leer();
    await f.click('[data-q="pausa"]');
    await f.click('[data-q="0.25"]'); await dormir(100);
    const s1 = await leer(); await dormir(1000); const s2 = await leer();
    await f.click('[data-q="1"]');
    await f.click('[data-q="cero"]'); await dormir(120);
    const c1 = await leer(); await dormir(2000); const c2 = await leer();
    console.log("B. 7.6.3: " + JSON.stringify({ l0, pausa: [p1, p2], lenta: [s1, s2], cero: [c1, c2] }));
  }
  // 7.6.4: interrumpir la transición: la velocidad cambia de signo con suavidad
  {
    const { h, f } = await abrir("Ejemplo 7.6.4 — Diapositivas y muelle");
    await dormir(2000);
    await f.evaluate(() => {
      window.__m = [];
      const muestrear = () => { __m.push([performance.now(), estado.progreso.x, estado.progreso.v]); if (__m.length < 120) requestAnimationFrame(muestrear); };
      requestAnimationFrame(muestrear);
    });
    await f.click('[data-ir="1"]');
    await dormir(250);
    const aMitad = await f.evaluate(() => ({ inert: [...document.querySelectorAll(".diapositiva")].map((d) => d.inert), pressed: [...document.querySelectorAll("[data-ir]")].map((x) => x.getAttribute("aria-pressed")) }));
    await captura(h, "764-mitad");
    await f.click('[data-ir="0"]');
    await dormir(1800);
    const m = await f.evaluate(() => __m);
    let maxSalto = 0, vMax = 0, cruces = 0;
    for (let i = 1; i < m.length; i++) {
      maxSalto = Math.max(maxSalto, Math.abs(m[i][2] - m[i - 1][2]));
      vMax = Math.max(vMax, Math.abs(m[i][2]));
      if (Math.sign(m[i][2]) !== Math.sign(m[i - 1][2]) && m[i - 1][2] !== 0) cruces++;
    }
    const xMax = Math.max(...m.map((x) => x[1]));
    const fin = await f.evaluate(() => ({ x: estado.progreso.x, v: estado.progreso.v, inert: [...document.querySelectorAll(".diapositiva")].map((d) => d.inert) }));
    console.log("B. 7.6.4: " + JSON.stringify({ aMitad, muestras: m.length, xMax: +xMax.toFixed(3), vMax: +vMax.toFixed(3), maxSaltoV: +maxSalto.toFixed(3), cruces, fin }));
  }
  // Ejercicio 7.6.1 (GLSL): píxeles magenta del chivato en 0 y en 1, partida y solución
  {
    const h = await p.evaluateHandle(() => [...document.querySelectorAll(".glsl-playground")].find((e) => e.dataset.titulo === "Ejercicio 7.6.1"));
    await h.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await dormir(1500);
    const medir = async () => {
      const r = {};
      for (const v of [0, 1, 0.5]) {
        await h.evaluate((e, v) => { const inp = [...e.querySelectorAll('input[type="range"]')][0]; inp.value = v; inp.dispatchEvent(new Event("input", { bubbles: true })); }, v);
        await dormir(400);
        r[v] = await h.evaluate((e) => {
          const c = e.querySelector(".pg-lienzo canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
          let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] < 15 && d[i + 2] > 240) n++;
          return n + " de " + c.width * c.height;
        });
      }
      return r;
    };
    const partida = await medir();
    await h.evaluate((e) => e.querySelector(".pg-btn.solucion").click()); await dormir(800);
    const solucion = await medir();
    console.log("B. ejercicio 7.6.1, píxeles magenta (progreso 0 / 1 / 0,5): partida " + JSON.stringify(partida) + " · solución " + JSON.stringify(solucion));
  }
  await p.close();

  // ---------------- C. Lección 7.7 ----------------
  const q = await b.newPage();
  vigilar(q, "7.7");
  await q.setViewport({ width: 1440, height: 900 });
  await q.goto(url(path.join(RAIZ, "modulos/07-integracion/07-siguientes-pasos.html")), { waitUntil: "load" });
  await q.waitForFunction(() => window.Curso && Curso.listo, { timeout: 20000 });
  {
    const h = await q.evaluateHandle(() => [...document.querySelectorAll("[data-titulo]")].find((e) => e.dataset.titulo === "Ejemplo 7.7.2 — Tres.js por dentro"));
    await h.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await dormir(2500);
    const lineas = await h.evaluate((e) => [...e.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent.trim()));
    console.log("C. 7.7.2 consola:\n   " + lineas.join("\n   "));
  }
  {
    const h = await q.evaluateHandle(() => [...document.querySelectorAll("[data-titulo]")].find((e) => e.dataset.titulo === "Ejemplo 7.7.3 — WebGL2 y WebGPU, lado a lado"));
    await h.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await dormir(2500);
    const ifr = await h.$("iframe");
    const r = await ifr.boundingBox();
    await q.mouse.move(r.x + r.width * 0.15, r.y + r.height * 0.3);
    await q.mouse.move(r.x + r.width * 0.18, r.y + r.height * 0.32, { steps: 5 });
    await dormir(700);
    const rr = await h.evaluate((e) => { const x = e.getBoundingClientRect(); const top = Math.max(0, x.top); return { x: x.left + scrollX, y: top + scrollY, width: x.width, height: Math.max(1, Math.min(x.bottom, innerHeight) - top) }; });
    await q.screenshot({ path: path.join(SAL, "773-raton.png"), clip: rr, captureBeyondViewport: false });
    const lineas = await h.evaluate((e) => [...e.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent.trim()));
    console.log("C. 7.7.3 consola: " + lineas.join(" | "));
  }
  await q.close();
} finally {
  console.log("errores: " + (errores.length ? "\n   " + errores.join("\n   ") : "ninguno"));
  await b.close();
}
