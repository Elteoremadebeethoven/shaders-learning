#!/usr/bin/env node
/* Verificador de lecciones del curso (Chrome headless vía puppeteer-core).

   Uso:
     node verificar.mjs <archivo.html | URL> [...más] [opciones]

   Opciones:
     --capturas <dir>   guarda una captura PNG de cada playground/demo/graficador
                        (con --soluciones, también <lección>-sol-N.png de cada solución aplicada)
     --pagina <dir>     capturas de la ventana en tramos a lo largo de toda la página
     --ancho 1440       ancho de la ventana (px CSS)
     --dpr 1            devicePixelRatio
     --espera 600       ms de espera en cada tramo de scroll
     --json             salida JSON
     --tema light|dark  tema del curso
     --soluciones       pulsa «Ver solución» en cada playground y comprueba que compila/ejecuta sin error;
                        si la solución imprime pruebas (líneas que empiezan por ✓/✗), espera a que terminen
                        y cuenta como fallo cualquier línea «✗ …»
     --espera-sol 12000 ms máximos de espera a las pruebas ✓/✗ de cada solución (mínimo 1800 ms siempre)
     --aislar           iframes sandbox en proceso propio (como Chrome real) para medir tiempos/bloqueos

   Informa: errores de consola, excepciones, recursos que fallan, estado de
   cada playground (compila / error / excepción JS), fórmulas KaTeX con error,
   enlaces internos rotos y callouts/estructura básicos.

   Capturas: se hacen con page.screenshot({clip, captureBeyondViewport:false}) sobre la parte visible del componente
   (centrado en la ventana). ElementHandle.screenshot() amplía la superficie de captura más allá de la ventana; el
   IntersectionObserver de los playgrounds JS cree entonces que salieron de pantalla y los duerme (iframe destruido):
   salían capturas negras o en blanco. Un componente más alto que la ventana sale recortado a la ventana.

   WebGPU: si el navegador no da adaptador (Linux sin GPU, p. ej.), un playground con data-error-esperado="webgpu"
   que no falla no cuenta como problema (sin WebGPU no puede dar el error que se espera). */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Chrome del dueño (macOS, GPU real vía ANGLE/Metal); en otras máquinas, $CHROME o el Chromium de Playwright
// (en Linux sin GPU, WebGL va por SwiftShader: sirve para compilar/ejecutar, NO para medir tiempos de GPU).
const CHROME = process.env.CHROME || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/opt/pw-browsers/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => fs.existsSync(p));
const ANGLE = process.platform === "darwin" ? "--use-angle=metal" : "--use-angle=swiftshader";
const ROOT = process.getuid && process.getuid() === 0 ? ["--no-sandbox"] : []; // Chrome no arranca como root sin esto (contenedores)
const args = process.argv.slice(2);
const opt = { capturas: null, pagina: null, ancho: 1440, dpr: 1, espera: 600, json: false, tema: null, soluciones: false, aislar: false, esperaSol: 12000 };
const objetivos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--capturas") opt.capturas = args[++i];
  else if (a === "--pagina") opt.pagina = args[++i];
  else if (a === "--ancho") opt.ancho = +args[++i];
  else if (a === "--dpr") opt.dpr = +args[++i];
  else if (a === "--espera") opt.espera = +args[++i];
  else if (a === "--espera-sol") opt.esperaSol = +args[++i];
  else if (a === "--tema") opt.tema = args[++i];
  else if (a === "--json") opt.json = true;
  else if (a === "--soluciones") opt.soluciones = true;
  else if (a === "--aislar") opt.aislar = true;
  else objetivos.push(a);
}
if (!objetivos.length) { console.error("Uso: node verificar.mjs <archivo.html|URL> [--capturas dir] [--pagina png]"); process.exit(2); }

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
// Captura de la parte visible de un componente (ver la cabecera: sin captureBeyondViewport)
async function capturar(page, h, archivo, esperaMs) {
  await h.evaluate((el) => el.scrollIntoView({ block: el.getBoundingClientRect().height > innerHeight - 40 ? "start" : "center" }));
  await dormir(esperaMs);
  for (let k = 0; k < 15; k++) { // un playground JS recién vuelto a pantalla tarda en recrear su iframe
    const est = await h.evaluate((el) => (el.classList.contains("js-playground") ? ((el.querySelector(".estado") || {}).textContent || "") : "ok"));
    if (!/en pausa|^$/.test(est)) break;
    await dormir(200);
  }
  const r = await h.evaluate((el) => {
    const b = el.getBoundingClientRect();
    const arriba = Math.max(b.top, 0), abajo = Math.min(b.bottom, innerHeight);
    const izq = Math.max(b.left, 0), der = Math.min(b.right, innerWidth);
    return { x: izq + scrollX, y: arriba + scrollY, width: der - izq, height: abajo - arriba };
  });
  if (!(r.width > 1 && r.height > 1)) throw new Error("componente sin área visible");
  await page.screenshot({ path: archivo, clip: r, captureBeyondViewport: false });
}
// Chrome sin GPU (Linux): WebGPU por SwiftShader/Vulkan si se puede
const ARGS_WEBGPU = process.platform === "darwin" ? [] : ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-webgpu-adapter=swiftshader", "--use-vulkan=swiftshader"];

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  // --aislar: activa IsolateSandboxedIframes, como en Chrome de escritorio (los iframes sandbox de los
  // playgrounds JS van en su propio proceso). Puppeteer lo desactiva por defecto. Úsalo para medir
  // tiempos/bloqueos de iframes; NO por defecto: en headless con aislamiento, elementFromPoint dentro
  // del iframe devuelve null (falso error que en Chrome real no ocurre).
  args: [ANGLE, "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"].concat(ROOT, ARGS_WEBGPU, opt.aislar ? ["--enable-features=IsolateSandboxedIframes"] : []),
  defaultViewport: { width: opt.ancho, height: 900, deviceScaleFactor: opt.dpr },
});

const informes = [];
for (const obj of objetivos) {
  const url = /^(https?|file):/.test(obj) ? obj : pathToFileURL(path.resolve(obj)).href;
  const page = await navegador.newPage();
  const consola = [], excepciones = [], fallos = [];
  // Los mensajes de los iframes de los playgrounds (about:srcdoc) no cuentan aquí: el estado de
  // cada playground (Curso.qa) ya registra sus excepciones y console.error.
  page.on("console", (m) => {
    const loc = (m.location && m.location()) || {};
    if (loc.url && loc.url.startsWith("about:srcdoc")) return;
    // Blink emite los avisos "WebGL: …" de los iframes sin ubicación: la única WebGL de la página
    // propia es el contexto compartido de los playgrounds GLSL, que no los genera.
    if (/^WebGL: /.test(m.text())) return;
    if (["error", "warning", "warn"].includes(m.type())) consola.push(m.type() + ": " + m.text());
  });
  // Las excepciones del código de los playgrounds JS (iframes srcdoc, script "tu-codigo.js") las
  // registra Curso.qa por playground (y respeta data-error-esperado): aquí se ignoran.
  page.on("pageerror", (e) => { const st = String((e && e.stack) || ""); if (/tu-codigo\.js|about:srcdoc/.test(st)) return; excepciones.push(String(e.message || e)); });
  page.on("requestfailed", (r) => fallos.push(r.url() + " → " + (r.failure() && r.failure().errorText)));
  page.on("response", (r) => { if (r.status() >= 400) fallos.push(r.url() + " → HTTP " + r.status()); });
  if (opt.tema) await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, opt.tema);
  // cada verificación empieza sin código guardado de antes
  await page.evaluateOnNewDocument(() => { try { Object.keys(localStorage).filter((k) => k.startsWith("pg")).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 15000 }).catch(() => excepciones.push("Curso.listo nunca se puso a true (¿falta curso.js o hubo un error al iniciar?)"));
    // recorrer la página para que se activen los componentes perezosos
    const alto = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < alto; y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await new Promise((r) => setTimeout(r, opt.espera));
    }
    await new Promise((r) => setTimeout(r, 800));
    const datos = await page.evaluate(() => {
      const C = window.Curso || {};
      const qa = C.qa || { errores: [], playgrounds: {} };
      const katexErr = [...document.querySelectorAll(".katex-error")].map((e) => e.getAttribute("title") || e.textContent).slice(0, 10);
      const enlaces = [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => h && !/^(https?:|mailto:|#)/.test(h));
      const titulo = document.title;
      const h1 = document.querySelector("main h1") ? document.querySelector("main h1").textContent : null;
      const cuenta = (s) => document.querySelectorAll(s).length;
      const scriptsSinConvertir = [...document.querySelectorAll('main script[type="text/plain"]')].length;
      const pres = [...document.querySelectorAll("main pre")].filter((p) => !p.closest(".CodeMirror")).length;
      // dólares sueltos que KaTeX no procesó (posible fórmula rota)
      const dolares = [];
      const walker = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = walker.nextNode())) {
        if (n.parentElement.closest("pre,code,script,style,.CodeMirror,.playground,.katex,textarea,svg")) continue;
        if (/\$[^$\s][^$]*\$/.test(n.textContent) || /\\\(|\\\[/.test(n.textContent)) dolares.push(n.textContent.trim().slice(0, 80));
      }
      return {
        titulo, h1, errores: qa.errores, playgrounds: qa.playgrounds, katexErr, enlaces, scriptsSinConvertir, dolares: dolares.slice(0, 5),
        conteo: {
          glsl: cuenta(".glsl-playground"), js: cuenta(".js-playground"), graficador: cuenta(".graficador"), demo: cuenta(".demo"),
          ejemplos: cuenta(".ejemplo"), ejercicios: cuenta(".ejercicio"), quiz: cuenta(".quiz"), anotado: cuenta(".anotado"),
          callouts: cuenta(".callout"), bestiario: cuenta(".callout.bestiario"), senior: cuenta(".callout.senior"), h2: cuenta("main h2"), pres,
          palabras: (document.querySelector("main") || document.body).innerText.split(/\s+/).length,
        },
      };
    });
    // enlaces internos rotos (solo file://)
    const rotos = [];
    if (url.startsWith("file:")) {
      const base = new URL(url);
      for (const h of datos.enlaces) {
        const u = new URL(h, base); if (u.protocol !== "file:") continue;
        const p = decodeURIComponent(u.pathname);
        if (!fs.existsSync(p)) rotos.push(h);
      }
    }
    // soluciones de los ejercicios
    const fallosSol = [], pruebasSol = [];
    let nSol = 0;
    if (opt.soluciones) {
      if (opt.capturas) {
        fs.mkdirSync(opt.capturas, { recursive: true });
        await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
      }
      const pgs = await page.$$(".playground");
      for (const h of pgs) {
        const tiene = await h.evaluate((el) => !!el.querySelector(".pg-btn.solucion"));
        if (!tiene) continue;
        nSol++;
        const titulo = await h.evaluate((el) => (el.querySelector(".pg-titulo span:nth-child(2)") || {}).textContent || "");
        await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await new Promise((r) => setTimeout(r, 400));
        await h.evaluate((el) => {
          const c = el.querySelector(".pg-consola"); if (c) c.innerHTML = "";
          el.querySelector(".pg-btn.solucion").click();
        });
        await dormir(1800);
        // ¿la solución trae pruebas que imprimen ✓/✗? Entonces esperar a que dejen de llegar líneas (máx. --espera-sol)
        const conPruebas = await h.evaluate((el) => [...el.querySelectorAll(".CodeMirror")].some((cm) => cm.CodeMirror && /[✓✗]/.test(cm.CodeMirror.getValue())));
        if (conPruebas) {
          // mínimo de líneas ✓/✗ que deben llegar antes de fiarse del silencio (hay pruebas que esperan segundos entre
          // una y otra, p. ej. 7.3.5): cada línea de código que imprime ✓/✗ cuenta una; si es la definición de una
          // función auxiliar (function prueba(…) { … '✓' … } o const ok = (…) => … '✓' …), cuenta cada llamada a ella
          const minimo = await h.evaluate((el) => {
            let m = 0;
            for (const cm of el.querySelectorAll(".CodeMirror")) {
              const cod = cm.CodeMirror ? cm.CodeMirror.getValue() : "";
              for (const lin of cod.split("\n")) {
                if (!/[✓✗]/.test(lin)) continue;
                const def = lin.match(/function\s+([\w$]+)\s*\(|(?:const|let|var)\s+([\w$]+)\s*=\s*(?:\([^)]*\)|[\w$]+)\s*=>/);
                const nombre = def && (def[1] || def[2]);
                const llamadas = nombre ? (cod.match(new RegExp("(^|[^\\w$.])" + nombre.replace(/\$/g, "\\$") + "\\s*\\(", "g")) || []).length - (def[1] ? 1 : 0) : 0;
                m += Math.max(1, llamadas);
              }
            }
            return m;
          });
          const tFin = Date.now() + Math.max(0, opt.esperaSol - 1800);
          let antes = -1, quieto = 0;
          while (Date.now() < tFin) {
            const n = await h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].filter((x) => /^\s*[✓✗]/.test(x.textContent)).length);
            if (n >= minimo && n > 0 && n === antes) { if (++quieto >= 3) break; } else quieto = 0;
            antes = n;
            await dormir(500);
          }
        }
        const res = await h.evaluate((el) => {
          const est = (el.querySelector(".estado") || {}).textContent || "";
          const err = el.querySelector(".pg-errores.visible");
          const logErr = [...el.querySelectorAll(".pg-consola .log-error")].map((x) => x.textContent).join(" | ");
          // las excepciones también empiezan por «✗» pero van con la clase log-error (ya cuentan en logErr)
          const lineas = [...el.querySelectorAll(".pg-consola .log-linea:not(.log-error)")].map((x) => x.textContent.trim());
          const pruebasMal = lineas.filter((t) => /^✗/.test(t)).join(" | ");
          const pruebasOk = lineas.filter((t) => /^✓/.test(t)).length;
          const esGL = el.classList.contains("glsl-playground");
          const errTxt = esGL && err && /✗/.test(est) ? err.textContent : "";
          return { est, errTxt, logErr, pruebasMal, pruebasOk };
        });
        if (/✗/.test(res.est) || res.logErr) fallosSol.push(`solución de «${titulo}» falla: ${(res.errTxt || res.logErr || res.est).slice(0, 200)}`);
        else if (res.pruebasMal) fallosSol.push(`solución de «${titulo}»: sus pruebas imprimen ✗: ${res.pruebasMal.slice(0, 200)}`);
        if (conPruebas) pruebasSol.push(`«${titulo}»: ${res.pruebasOk} ✓` + (res.pruebasMal ? ", con ✗" : ""));
        if (opt.capturas) {
          // captura de la solución ya aplicada: <lección>-sol-N.png (N = orden entre los playgrounds con solución)
          try { await capturar(page, h, path.join(opt.capturas, path.basename(obj).replace(/\.html?$/, "") + "-sol-" + nSol + ".png"), 300); } catch (e) {}
        }
        await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click()); // volver al código del alumno
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    // capturas de componentes
    const capturas = [];
    if (opt.capturas) {
      fs.mkdirSync(opt.capturas, { recursive: true });
      const nombreBase = path.basename(obj).replace(/\.html?$/, "");
      // la barra superior es sticky y taparía parte de los componentes en las capturas
      await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
      const handles = await page.$$(".playground, .demo, .graficador, figure.captura");
      let i = 0;
      for (const h of handles) {
        i++;
        try {
          const f = path.join(opt.capturas, nombreBase + "-" + String(i).padStart(2, "0") + ".png");
          await capturar(page, h, f, Math.max(900, opt.espera));
          capturas.push(f);
        } catch (e) { capturas.push("fallo captura " + i + ": " + e.message); }
      }
    }
    if (opt.pagina) {
      // capturas de la ventana a lo largo de la página (tramos de 900 px)
      fs.mkdirSync(opt.pagina, { recursive: true });
      const nombreBase = path.basename(obj).replace(/\.html?$/, "");
      const altoTotal = await page.evaluate(() => document.documentElement.scrollHeight);
      let k = 0;
      for (let y = 0; y < altoTotal; y += 860) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await new Promise((r) => setTimeout(r, Math.max(700, opt.espera)));
        const f = path.join(opt.pagina, nombreBase + "-tramo" + String(++k).padStart(2, "0") + ".png");
        await page.screenshot({ path: f });
        capturas.push(f);
      }
    }
    // re-leer el estado de los playgrounds (algunos se activan al capturar)
    const pgFinal = await page.evaluate(() => (window.Curso && window.Curso.qa && window.Curso.qa.playgrounds) || {});
    datos.playgrounds = pgFinal;
    const erroresQA = await page.evaluate(() => (window.Curso && window.Curso.qa && window.Curso.qa.errores) || []);
    datos.errores = erroresQA;
    const problemas = [];
    const hayWebGPU = await page.evaluate(async () => { try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch (e) { return false; } });
    for (const [id, p] of Object.entries(datos.playgrounds)) {
      if (p.ok === true && p.errorEsperado && p.errorEsperadoSi === "webgpu" && !hayWebGPU) continue; // sin adaptador no puede dar el error esperado
      if (p.ok === false && !p.errorEsperado) problemas.push(`${id} (${p.tipo}${p.titulo ? ": " + p.titulo : ""}) → ${String(p.error).split("\n").slice(0, 3).join(" | ")}`);
      if (p.ok === true && p.errorEsperado) problemas.push(`${id} (${p.tipo}: ${p.titulo}) marcado data-error-esperado pero NO falló`);
      if (p.tipo === "js" && !p.ejecutado) problemas.push(`${id} (js: ${p.titulo}) nunca se ejecutó (¿no llegó a ser visible?)`);
    }
    datos.errores.forEach((e) => problemas.push("error " + e.origen + ": " + String(e.mensaje).split("\n")[0]));
    excepciones.forEach((e) => problemas.push("excepción: " + e));
    consola.filter((c) => !/GPU stall due to ReadPixels|Automatic fallback to software WebGL|swiftshader/i.test(c) && !(!hayWebGPU && /Failed to create WebGPU Context Provider/.test(c))).forEach((c) => problemas.push("consola " + c));
    fallos.forEach((f) => problemas.push("recurso: " + f));
    datos.katexErr.forEach((k) => problemas.push("katex: " + k));
    rotos.forEach((r) => problemas.push("enlace roto: " + r));
    if (datos.scriptsSinConvertir) problemas.push(datos.scriptsSinConvertir + " <script type=text/plain> sin convertir (¿falta class=\"codigo\"?)");
    datos.dolares.forEach((d) => problemas.push("¿fórmula sin renderizar?: " + d));
    fallosSol.forEach((f) => problemas.push(f));
    if (opt.soluciones) datos.conteo.soluciones = nSol;
    if (!hayWebGPU) datos.conteo.webgpu = "no";
    informes.push({ objetivo: obj, ms: Date.now() - t0, ok: problemas.length === 0, problemas, conteo: datos.conteo, titulo: datos.titulo, capturas, pruebasSol });
  } catch (e) {
    informes.push({ objetivo: obj, ok: false, problemas: ["no se pudo verificar: " + e.message] });
  }
  await page.close();
}
await navegador.close();

if (opt.json) console.log(JSON.stringify(informes, null, 2));
else {
  for (const inf of informes) {
    console.log((inf.ok ? "✓ " : "✗ ") + inf.objetivo + (inf.ms ? "  (" + inf.ms + " ms)" : ""));
    if (inf.conteo) console.log("   " + Object.entries(inf.conteo).map(([k, v]) => k + "=" + v).join(" "));
    inf.problemas.forEach((p) => console.log("   - " + p));
    if (inf.pruebasSol && inf.pruebasSol.length) console.log("   pruebas de las soluciones: " + inf.pruebasSol.join(" · "));
    if (inf.capturas && inf.capturas.length) console.log("   capturas: " + inf.capturas.length + " en " + path.dirname(inf.capturas[0]));
  }
  const malos = informes.filter((i) => !i.ok).length;
  console.log("\n" + (informes.length - malos) + "/" + informes.length + " páginas sin problemas");
}
process.exit(informes.every((i) => i.ok) ? 0 : 1);
