// QA de la página autónoma del proyecto final (7.6): modulos/07-integracion/proyecto-final/index.html
// No usa curso.js, así que verificar.mjs no sirve (espera a Curso.listo). Este script la abre por file://
// y comprueba, en un solo Chrome:
//   · excepciones (pageerror), errores y avisos de consola, recursos que no cargan;
//   · capturas a 1440 px (DPR 1 y 2) y a 390 px (DPR 2, móvil táctil) y que no haya scroll horizontal;
//   · las diapositivas (transición por shader, inert/aria-pressed), el botón de pausa, el scroll y la
//     pausa fuera de pantalla (llamadas a requestAnimationFrame contadas);
//   · prefers-reduced-motion: reduce emulado (y su cambio con la página abierta) y ?reducir;
//   · «sin WebGL» (getContext('webgl2') → null) y ?sinwebgl; sin JavaScript;
//   · la pérdida y recuperación del contexto con WEBGL_lose_context (y con los botones de ?depurar).
// Uso (desde la raíz del curso):
//   node herramientas/estado/lab/rev-m7-6-proyecto.mjs [carpeta-de-capturas]
// En el Mac usa el Chrome instalado con ANGLE/Metal. En Linux, /opt/pw-browsers/chromium con SwiftShader:
// ahí el shader va a pocos frames por segundo a 1440 × 900 y el reloj (dt limitado a 0,1 s) avanza más
// despacio que el tiempo real, así que las pruebas de comportamiento usan una ventana de 800 × 500 y
// esperan a que se cumpla cada condición (con un tope) en lugar de esperar un tiempo fijo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.env.CURSO || path.resolve(AQUI, "../../..");
const { default: puppeteer } = await import(pathToFileURL(path.join(RAIZ, "herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js")).href);
const PAGINA = pathToFileURL(path.join(RAIZ, "modulos/07-integracion/proyecto-final/index.html")).href;
const SALIDA = path.resolve(process.argv[2] || path.join(RAIZ, "herramientas/estado/lab/capturas-m7-6"));
fs.mkdirSync(SALIDA, { recursive: true });

const MAC = process.platform === "darwin";
const CHROME = process.env.CHROME || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium",
].find((p) => fs.existsSync(p));
const ARGS = MAC
  ? ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
  : ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const ESCRITORIO = { width: 1440, height: 900, deviceScaleFactor: 1 };
const PRUEBAS = MAC ? ESCRITORIO : { width: 800, height: 500, deviceScaleFactor: 1 };   // ventana de las pruebas de comportamiento

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const resultados = [];
let fallos = 0;
function ok(cond, txt) {
  resultados.push((cond ? "✓ " : "✗ ") + txt);
  console.log((cond ? "✓ " : "✗ ") + txt);
  if (!cond) fallos++;
}
function nota(txt) { resultados.push("  · " + txt); console.log("  · " + txt); }

// Avisos de consola que no son de la página (SwiftShader) o que la página emite a propósito.
const AVISOS_ESPERADOS = [/Automatic fallback to software WebGL/i, /GPU stall due to ReadPixels/i, /\[capa GL\] sin WebGL2/];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ARGS });
try {
  // Página auxiliar para decodificar capturas PNG y calcular colores medios (sin dependencias).
  const aux = await browser.newPage();
  async function stats(b64) {
    return aux.evaluate(async (b64) => {
      const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let r = 0, g = 0, b = 0, h = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; h = (Math.imul(h, 31) + d[i] * 65536 + d[i + 1] * 256 + d[i + 2]) >>> 0; }
      return { r: +(r / n).toFixed(1), g: +(g / n).toFixed(1), b: +(b / n).toFixed(1), hash: h };
    }, b64);
  }
  async function captura(page, nombre, opciones = {}) {
    const ruta = path.join(SALIDA, nombre);
    await page.screenshot({ path: ruta, ...opciones });
    return stats(fs.readFileSync(ruta).toString("base64"));
  }
  const ventana = (page) => page.evaluate(() => ({ x: 0, y: 0, width: innerWidth, height: innerHeight }));

  /* Abre la página con un escenario. Devuelve { page, log, errores } */
  async function abrir({ query = "", viewport = PRUEBAS, reducir = false, sinWebGL = false, js = true } = {}) {
    const page = await browser.newPage();
    const log = [], errores = [];
    page.on("pageerror", (e) => errores.push("excepción: " + e.message));
    page.on("console", (m) => {
      const t = m.type(), txt = m.text();
      log.push(t + ": " + txt);
      if ((t === "error" || t === "warn" || t === "warning") && !AVISOS_ESPERADOS.some((re) => re.test(txt))) errores.push("consola " + t + ": " + txt);
    });
    page.on("requestfailed", (r) => errores.push("no cargó: " + r.url() + " (" + (r.failure() && r.failure().errorText) + ")"));
    await page.setViewport(viewport);
    if (!js) await page.setJavaScriptEnabled(false);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reducir ? "reduce" : "no-preference" }]);
    await page.evaluateOnNewDocument((sinWebGL) => {
      // Contador de requestAnimationFrame (motor.js llama al global).
      const raf = window.requestAnimationFrame.bind(window);
      window.__raf = 0;
      window.requestAnimationFrame = (f) => { window.__raf++; return raf(f); };
      if (sinWebGL) {
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
          if (/webgl/.test(tipo)) return null;   // como un navegador sin WebGL
          return orig.call(this, tipo, ...resto);
        };
      }
    }, sinWebGL);
    await page.goto(PAGINA + query, { waitUntil: "load" });
    await page.bringToFront();
    return { page, log, errores };
  }
  const rafEn = async (page, ms) => { const a = await page.evaluate(() => window.__raf); await espera(ms); return (await page.evaluate(() => window.__raf)) - a; };
  // Espera a que el bucle se duerma: ninguna llamada a rAF durante `quieto` ms (tope: `max` ms).
  async function dormido(page, quieto = 1500, max = 30000) {
    const t0 = Date.now();
    while (Date.now() - t0 < max) { if ((await rafEn(page, quieto)) === 0) return Date.now() - t0; }
    return -1;
  }
  async function hasta(page, fn, max = 20000, arg) {
    const t0 = Date.now();
    while (Date.now() - t0 < max) { if (await page.evaluate(fn, arg)) return true; await espera(150); }
    return false;
  }
  const estadoDOM = (page) => page.evaluate(() => {
    const op = (sel) => { const el = document.querySelector(sel); return el ? +getComputedStyle(el).opacity : null; };
    const c = document.querySelector(".hero-lienzo");
    const pausa = document.querySelector(".hero-pausa");
    return {
      claseHero: document.getElementById("hero").className,
      lienzo: c ? { listo: c.classList.contains("listo"), w: c.width, h: c.height, cssW: c.clientWidth, cssH: c.clientHeight } : null,
      h2a: op("#diapo-0 h2"), h2b: op("#diapo-1 h2"), diapo0: op("#diapo-0"), diapo1: op("#diapo-1"),
      inert: [...document.querySelectorAll(".diapositiva")].map((d) => d.inert),
      pressed: [...document.querySelectorAll("[data-ir]")].map((b) => b.getAttribute("aria-pressed")),
      capa1: op(".capa-1"),
      contenido: getComputedStyle(document.querySelector(".hero-contenido")).transform,
      indicador: document.querySelector(".hero-indicador").getAnimations().map((a) => a.playState + "@" + Math.round(a.currentTime || 0)),
      scrollW: document.documentElement.scrollWidth, W: document.documentElement.clientWidth,
      selector: getComputedStyle(document.querySelector(".hero-selector")).display,
      pausa: { display: getComputedStyle(pausa).display, texto: pausa.textContent.trim(), clase: pausa.className, ariaPressed: pausa.getAttribute("aria-pressed") },
      panel: (document.querySelector(".hero-depuracion output") || {}).textContent,
    };
  });
  const cerrar = async (esc, nombre) => {
    ok(esc.errores.length === 0, nombre + ": sin excepciones, errores ni avisos inesperados" + (esc.errores.length ? " → " + esc.errores.join(" | ") : ""));
    await esc.page.close();
  };

  /* ===== 1. Capturas de escritorio a 1440 × 900 (DPR 1 y DPR 2) ===== */
  for (const dpr of [1, 2]) {
    const esc = await abrir({ viewport: { ...ESCRITORIO, deviceScaleFactor: dpr } });
    const { page } = esc;
    const listo = await hasta(page, () => { const c = document.querySelector(".hero-lienzo"); return c && c.classList.contains("listo"); });
    await hasta(page, () => +getComputedStyle(document.querySelector("#diapo-0 h2")).opacity === 1);
    await espera(MAC ? 500 : 3000);
    const e = await estadoDOM(page);
    ok(listo, "1440 DPR " + dpr + ": el canvas aparece (.listo) tras su primer frame");
    ok(e.lienzo && e.lienzo.w === 1440 && e.lienzo.h === 900, "1440 DPR " + dpr + ": búfer " + (e.lienzo && e.lienzo.w + "×" + e.lienzo.h) + " (dprMax 1 → 1440×900)");
    ok(e.h2a === 1 && e.diapo1 === 0, "1440 DPR " + dpr + ": titular 01 visible y diapositiva 02 oculta");
    ok(e.scrollW <= e.W, "1440 DPR " + dpr + ": sin scroll horizontal (" + e.scrollW + "/" + e.W + ")");
    const s = await captura(page, "01-escritorio-1440-dpr" + dpr + ".png", { clip: { x: 0, y: 0, width: 1440, height: 900 } });
    nota("color medio del hero: " + JSON.stringify(s));
    if (dpr === 1) await captura(page, "02-pagina-entera-1440.png", { fullPage: true });
    await cerrar(esc, "1440 DPR " + dpr);
  }

  /* ===== 2. Comportamiento (ventana PRUEBAS) ===== */
  {
    const esc = await abrir();
    const { page } = esc;
    const clip = await ventana(page);
    await hasta(page, () => { const c = document.querySelector(".hero-lienzo"); return c && c.classList.contains("listo"); });
    const r1 = await rafEn(page, 1000);
    ok(r1 > 0, "bucle en marcha con el tiempo corriendo (" + r1 + " rAF en 1 s)");
    nota("el reloj y el contador de la página: " + JSON.stringify(await page.evaluate(() => window.__raf)) + " rAF desde la carga");
    // Puntero: remolino
    await page.mouse.move(clip.width * 0.5, clip.height * 0.5); await espera(100);
    await page.mouse.move(clip.width * 0.55, clip.height * 0.52, { steps: 8 }); await espera(1200);
    await captura(page, "03-remolino.png", { clip });
    // Diapositiva 02
    const s1 = await captura(page, "04-diapositiva-01.png", { clip });
    await page.click('[data-ir="1"]');
    await espera(250);
    await captura(page, "05-transicion-a-medias.png", { clip });
    const llega = await hasta(page, () => +getComputedStyle(document.getElementById("diapo-1")).opacity === 1 && +getComputedStyle(document.querySelector(".capa-1")).opacity === 1);
    let e = await estadoDOM(page);
    const s2 = await captura(page, "06-diapositiva-02.png", { clip });
    ok(llega, "«02»: diapositiva 02 entera (" + e.diapo0 + "/" + e.diapo1 + ") y la alternativa CSS al mismo progreso (" + e.capa1 + ")");
    ok(e.inert.join() === "true,false" && e.pressed.join() === "false,true", "«02»: inert " + e.inert.join() + " · aria-pressed " + e.pressed.join());
    ok(s2.r > s1.r, "«02»: el fondo pasa a la paleta Brasas (rojo medio " + s1.r + " → " + s2.r + ")");
    const foco = await page.evaluate(() => { const h = document.querySelector("#diapo-0 h2"); h.tabIndex = -1; h.focus(); const r = document.activeElement === h; h.removeAttribute("tabindex"); return r; });
    ok(!foco, "«02»: la diapositiva 01 (inert) no acepta el foco");
    // Interrupción: 01 y, enseguida, 02
    await page.click('[data-ir="0"]'); await espera(200); await page.click('[data-ir="1"]');
    const vuelta = await hasta(page, () => +getComputedStyle(document.getElementById("diapo-1")).opacity === 1);
    e = await estadoDOM(page);
    ok(vuelta && e.inert.join() === "true,false", "interrupción 02→01→02: termina limpia en 02");
    await page.click('[data-ir="0"]');
    await hasta(page, () => +getComputedStyle(document.getElementById("diapo-0")).opacity === 1);
    // Pausa: el tiempo se para; con el puntero quieto (fuera del hero no hay remolino), el bucle se duerme
    await page.click(".hero-pausa");
    await page.mouse.move(clip.width - 5, 5);
    const tDormir = await dormido(page);
    e = await estadoDOM(page);
    ok(e.pausa.texto === "Reanudar animación" && /pausado/.test(e.pausa.clase) && e.pausa.ariaPressed === null, "pausa: texto «" + e.pausa.texto + "», clase «" + e.pausa.clase + "», sin aria-pressed");
    ok(tDormir >= 0, "pausa + puntero quieto: el bucle se duerme (en " + tDormir + " ms)");
    const a1 = await captura(page, "07-pausa-a.png", { clip });
    await espera(1000);
    const a2 = await captura(page, "07-pausa-b.png", { clip });
    ok(a1.hash === a2.hash, "pausa: dos capturas separadas 1 s, idénticas");
    await page.mouse.move(clip.width * 0.6, clip.height * 0.6, { steps: 5 }); await espera(100);
    const rm = await rafEn(page, 600);
    ok(rm > 0, "pausa: mover el puntero despierta al bucle (" + rm + " rAF en 0,6 s)");
    await page.click(".hero-pausa"); await espera(300);
    e = await estadoDOM(page);
    ok(e.pausa.texto === "Pausar animación" && !/pausado/.test(e.pausa.clase), "reanudar: texto «" + e.pausa.texto + "»");
    // Scroll: parallax y oscurecimiento
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(clip.height / 2));
    await hasta(page, () => /matrix\(1, 0, 0, 1, 0, [1-9]/.test(getComputedStyle(document.querySelector(".hero-contenido")).transform), 8000);
    e = await estadoDOM(page);
    await captura(page, "08-scroll-medio.png", { clip });
    ok(/matrix\(1, 0, 0, 1, 0, [1-9]/.test(e.contenido), "scroll de media pantalla: el contenido lleva parallax (" + e.contenido + ")");
    // Fuera de pantalla
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await espera(800);
    const rf = await rafEn(page, 2000);
    ok(rf === 0, "hero fuera de pantalla: " + rf + " rAF en 2 s");
    await captura(page, "09-detalles.png", { clip });
    await page.evaluate(() => window.scrollTo(0, 0)); await espera(300);
    const rv = await rafEn(page, 1000);
    ok(rv > 0, "al volver: el bucle sigue (" + rv + " rAF en 1 s)");
    // Pérdida de contexto desde fuera (WEBGL_lose_context) y recuperación
    await page.evaluate(() => { const gl = document.querySelector(".hero-lienzo").getContext("webgl2"); window.__ext = gl.getExtension("WEBGL_lose_context"); window.__ext.loseContext(); });
    await hasta(page, () => document.getElementById("hero").classList.contains("gl-perdido"), 5000);
    await espera(400);
    e = await estadoDOM(page);
    const rl = await rafEn(page, 800);
    const sp = await captura(page, "10-contexto-perdido.png", { clip });
    ok(/gl-perdido/.test(e.claseHero) && rl > 0, "contexto perdido: clase gl-perdido y el bucle de la página sigue (" + rl + " rAF en 0,8 s)");
    nota("color medio con el contexto perdido (se ve la alternativa CSS): " + JSON.stringify(sp));
    await page.evaluate(() => window.__ext.restoreContext());
    await hasta(page, () => !document.getElementById("hero").classList.contains("gl-perdido"), 5000);
    await espera(MAC ? 500 : 2500);
    e = await estadoDOM(page);
    const sr = await captura(page, "11-contexto-recuperado.png", { clip });
    ok(!/gl-perdido/.test(e.claseHero) && sr.hash !== sp.hash, "contexto recuperado: vuelve a dibujar (clase «" + e.claseHero + "»)");
    await cerrar(esc, "comportamiento");
  }

  /* ===== 3. ?depurar: panel y botones de pérdida ===== */
  {
    const esc = await abrir({ query: "?depurar" });
    const { page } = esc;
    await hasta(page, () => /búfer/.test(document.querySelector(".hero-depuracion output").textContent));
    const t0 = (await estadoDOM(page)).panel;
    ok(/búfer \d+×\d+/.test(t0), "?depurar: panel visible («" + t0 + "»)");
    await page.click('[data-q="perder"]');
    const perdido = await hasta(page, () => /contexto perdido/.test(document.querySelector(".hero-depuracion output").textContent), 8000);
    ok(perdido, "?depurar · perder: «" + (await estadoDOM(page)).panel + "»");
    await page.click('[data-q="perder"]'); await espera(300);   // dos veces seguidas: no debe avisar
    await page.click('[data-q="recuperar"]');
    const vuelve = await hasta(page, () => /búfer/.test(document.querySelector(".hero-depuracion output").textContent), 8000);
    ok(vuelve, "?depurar · recuperar: «" + (await estadoDOM(page)).panel + "»");
    await page.click('[data-q="recuperar"]'); await espera(300);   // sin contexto perdido: no debe avisar
    await page.click('[data-q="lento"]'); await espera(500);
    await captura(page, "12-depurar.png", { clip: await ventana(page) });
    await cerrar(esc, "?depurar");
  }

  /* ===== 4. Móvil 390 px, DPR 2, táctil ===== */
  {
    const esc = await abrir({ query: "?depurar", viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
    const { page } = esc;
    await hasta(page, () => +getComputedStyle(document.querySelector("#diapo-0 h2")).opacity === 1);
    await page.evaluate(() => { document.querySelector(".hero-depuracion").hidden = true; });   // para la captura
    await espera(MAC ? 500 : 2500);
    const e = await estadoDOM(page);
    const calidad = +((/calidad ([\d.]+)/.exec(e.panel) || [])[1] || 1);
    ok(e.scrollW <= e.W, "390: sin scroll horizontal (" + e.scrollW + "/" + e.W + ")");
    ok(e.lienzo && Math.abs(e.lienzo.w - Math.round(e.lienzo.cssW * calidad)) <= 1 && Math.abs(e.lienzo.h - Math.round(e.lienzo.cssH * calidad)) <= 1,
      "390 a DPR 2: búfer " + e.lienzo.w + "×" + e.lienzo.h + " = caja CSS " + e.lienzo.cssW + "×" + e.lienzo.cssH + " × calidad " + calidad + " (dprMax 1)");
    await captura(page, "13-movil-390.png", { clip: { x: 0, y: 0, width: 390, height: 844 } });
    await captura(page, "14-movil-390-entera.png", { fullPage: true });
    const fuera = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !el.closest(".solo-lectores,.hero-depuracion")).map((el) => el.tagName + "." + el.className).slice(0, 5));
    ok(fuera.length === 0, "390: ningún elemento se sale por la derecha" + (fuera.length ? " → " + fuera.join(", ") : ""));
    const ta = await page.evaluate(() => [".hero", ".hero-lienzo", ".hero-contenido"].map((s) => getComputedStyle(document.querySelector(s)).touchAction).join(","));
    ok(!/none/.test(ta), "390: touch-action sin «none» en el hero (" + ta + "): el dedo puede desplazar la página");
    await cerrar(esc, "móvil 390");
  }

  /* ===== 5. prefers-reduced-motion: reduce (y su cambio con la página abierta) ===== */
  {
    const esc = await abrir({ reducir: true });
    const { page } = esc;
    const clip = await ventana(page);
    await espera(300);
    let e = await estadoDOM(page);
    ok(e.h2a === 1, "reducido: el titular está en su sitio desde el principio (opacidad " + e.h2a + " a los 0,3 s)");
    ok(e.indicador.length === 0, "reducido: la flecha sin animación CSS");
    const td = await dormido(page);
    ok(td >= 0, "reducido: con todo quieto, el bucle se duerme (en " + td + " ms) y no pide frames");
    const c1 = await captura(page, "15-reducido-a.png", { clip });
    await espera(1200);
    const c2 = await captura(page, "15-reducido-b.png", { clip });
    ok(c1.hash === c2.hash, "reducido: el fondo está quieto (capturas idénticas a 1,2 s)");
    await page.click('[data-ir="1"]'); await espera(250);
    await captura(page, "16-reducido-transicion.png", { clip });
    const llega = await hasta(page, () => +getComputedStyle(document.getElementById("diapo-1")).opacity === 1);
    e = await estadoDOM(page);
    ok(llega && e.inert.join() === "true,false", "reducido: «02» funciona (fundido) y llega a la 02");
    ok(/matrix\(1, 0, 0, 1, 0, 0\)|none/.test(await page.evaluate(() => getComputedStyle(document.getElementById("diapo-1")).transform)), "reducido: el texto de la diapositiva no se desplaza");
    const td2 = await dormido(page);
    ok(td2 >= 0, "reducido: tras la transición se duerme (en " + td2 + " ms)");
    await page.evaluate(() => window.scrollTo(0, 300)); await espera(800);
    e = await estadoDOM(page);
    ok(e.contenido === "none" || /matrix\(1, 0, 0, 1, 0, 0\)/.test(e.contenido), "reducido: sin parallax en el contenido (" + e.contenido + ")");
    await page.evaluate(() => window.scrollTo(0, 0)); await espera(400);
    // La preferencia cambia con la página abierta (sin preguntar nada a la página antes: getAnimations() fuerza el estilo)
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    const minimo = await page.evaluate(() => new Promise((res) => {
      let min = 1; const t0 = performance.now();
      (function vigilar() { min = Math.min(min, +getComputedStyle(document.querySelector("#diapo-1 h2")).opacity); if (performance.now() - t0 < 1500) requestAnimationFrame(vigilar); else res(min); })();
    }));
    e = await estadoDOM(page);
    ok(minimo === 1, "cambio de preferencia: el texto que ya estaba no vuelve a hacer la entrada (opacidad mínima del titular en 1,5 s: " + minimo + ")");
    ok(e.indicador.length === 1 && e.indicador[0].startsWith("paused"), "cambio de preferencia: la flecha CSS recreada se recaptura en pausa (" + e.indicador.join(",") + ")");
    const r2 = await rafEn(page, 1000);
    ok(r2 > 0, "cambio de preferencia: el flujo vuelve a moverse (" + r2 + " rAF en 1 s)");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await hasta(page, () => document.querySelector(".hero-indicador").getAnimations().length === 0, 5000);
    e = await estadoDOM(page);
    ok(e.indicador.length === 0 && e.h2b === 1, "y de vuelta a reducido: flecha sin animación, texto visible");
    await cerrar(esc, "movimiento reducido");
  }

  /* ===== 6. ?reducir ===== */
  {
    const esc = await abrir({ query: "?reducir" });
    await espera(300);
    const e = await estadoDOM(esc.page);
    ok(e.h2a === 1 && e.indicador.length === 1 && e.indicador[0] === "paused@0", "?reducir: titular visible y flecha quieta en 0 (" + e.indicador.join(",") + ")");
    const td = await dormido(esc.page);
    ok(td >= 0, "?reducir: el bucle se duerme (en " + td + " ms)");
    await cerrar(esc, "?reducir");
  }

  /* ===== 7. Sin WebGL (getContext devuelve null) ===== */
  {
    const esc = await abrir({ sinWebGL: true, viewport: ESCRITORIO });
    const { page } = esc;
    const entra = await hasta(page, () => +getComputedStyle(document.querySelector("#diapo-0 h2")).opacity === 1);
    let e = await estadoDOM(page);
    ok(/sin-webgl/.test(e.claseHero) && e.lienzo === null, "sin WebGL: clase sin-webgl y canvas retirado");
    ok(entra, "sin WebGL: el titular hace su entrada");
    ok(esc.log.filter((l) => /\[capa GL\] sin WebGL2/.test(l)).length === 1, "sin WebGL: un único aviso «[capa GL] sin WebGL2» en la consola");
    await captura(page, "17-sinwebgl-01.png", { clip: { x: 0, y: 0, width: 1440, height: 900 } });
    await page.click('[data-ir="1"]');
    const llega = await hasta(page, () => +getComputedStyle(document.querySelector(".capa-1")).opacity === 1 && +getComputedStyle(document.getElementById("diapo-1")).opacity === 1);
    await captura(page, "18-sinwebgl-02.png", { clip: { x: 0, y: 0, width: 1440, height: 900 } });
    ok(llega, "sin WebGL: «02» funde la alternativa y el texto con el mismo muelle");
    await cerrar(esc, "sin WebGL");
  }
  /* ===== 8. ?sinwebgl (contexto '2d' antes) ===== */
  {
    const esc = await abrir({ query: "?sinwebgl" });
    await hasta(esc.page, () => +getComputedStyle(document.querySelector("#diapo-0 h2")).opacity === 1);
    const e = await estadoDOM(esc.page);
    const aviso = esc.log.find((l) => /capa GL/.test(l)) || "(ninguno)";
    ok(/sin-webgl/.test(e.claseHero) && e.h2a === 1, "?sinwebgl: alternativa y texto visible");
    nota("?sinwebgl, aviso de consola: " + aviso);
    await cerrar(esc, "?sinwebgl");
  }

  /* ===== 9. Sin JavaScript ===== */
  {
    const esc = await abrir({ js: false, viewport: ESCRITORIO });
    await espera(500);
    const e = await estadoDOM(esc.page);
    ok(e.h2a === 1 && e.diapo1 === 0, "sin JS: titular 01 visible y 02 oculta");
    ok(e.selector === "none" && e.pausa.display === "none", "sin JS: selector y pausa ocultos");
    await captura(esc.page, "19-sin-js.png", { clip: { x: 0, y: 0, width: 1440, height: 900 } });
    await cerrar(esc, "sin JavaScript");
  }
} finally {
  await browser.close();
}
console.log("\n" + (fallos ? "✗ " + fallos + " comprobaciones fallidas" : "✓ todo correcto") + " · capturas en " + SALIDA);
fs.writeFileSync(path.join(SALIDA, "resultado.txt"), resultados.join("\n") + "\n");
process.exit(fallos ? 1 : 0);
