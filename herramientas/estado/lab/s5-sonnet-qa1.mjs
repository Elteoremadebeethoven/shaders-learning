// s5-sonnet-qa1: QA interactiva de los anexos (A.1, A.3, A.4) y de afirmaciones de m5 que dependen de interactuar.
// Un solo Chrome. Se lanza con turnos.mjs.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const RAIZ = "file:///Users/alex/Projects/shaders/modulos/";
const esp = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], headless: "new",
  defaultViewport: { width: 1280, height: 900 },
});
const res = {};
const mostrar = (k) => console.log("## " + k + " " + JSON.stringify(res[k]));
try {
  const page = await browser.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errores.push("console.error: " + m.text().slice(0, 200)); });

  // ---------- A.4 glosario ----------
  await page.goto(RAIZ + "08-anexos/04-glosario.html", { waitUntil: "load" }); await esp(1500);
  res.glosario = await page.evaluate(async () => {
    const cuenta = () => document.querySelector(".ax-buscador .ax-cuenta").textContent;
    const q = document.getElementById("gl-q");
    const o = { cuentaInicial: cuenta(), entradas: document.querySelectorAll("main .ax-entrada").length, sinRemision: document.querySelectorAll("main .ax-entrada:not(.ax-remision)").length,
      remisiones: document.querySelectorAll("main .ax-remision").length, chip: [...document.querySelectorAll(".meta .chip")].map((c) => c.textContent) };
    q.value = "alfa"; q.dispatchEvent(new Event("input")); o.filtroAlfa = cuenta();
    q.value = "zzzz"; q.dispatchEvent(new Event("input")); o.filtroVacio = cuenta() + " | vacio visible: " + !document.getElementById("gl-vacio").hidden;
    q.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); o.trasEsc = cuenta();
    return o;
  });

  mostrar("glosario");
  // ---------- A.1 bestiario ----------
  await page.goto(RAIZ + "08-anexos/01-bestiario.html", { waitUntil: "load" }); await esp(1500);
  res.bestiario = await page.evaluate(async () => {
    const cuenta = () => document.querySelector(".ax-buscador .ax-cuenta").textContent;
    const q = document.getElementById("ax-q");
    const o = { total: document.querySelector("[data-ax-total]").textContent, tarjetas: document.querySelectorAll(".ax-caso").length, datos: window.CURSO_BESTIARIO.length,
      cuentaInicial: cuenta(), rotos: document.querySelectorAll(".ax-sintomas a.ax-roto").length, enlacesDiag: document.querySelectorAll(".ax-sintomas a[href^='#m']").length };
    q.value = "feedback loop"; q.dispatchEvent(new Event("input")); o.filtroFeedback = cuenta() + " → " + [...document.querySelectorAll(".ax-caso:not(.ax-oculto)")].map((e) => e.id).join(",");
    q.value = ""; q.dispatchEvent(new Event("input"));
    const chip = [...document.querySelectorAll(".ax-chip")].find((b) => b.dataset.mod === "5"); chip.click(); o.chipM5 = cuenta();
    chip.click(); o.trasQuitar = cuenta();
    // saltar a un caso desde el diagnóstico con el filtro puesto
    q.value = "zzzz"; q.dispatchEvent(new Event("input"));
    document.querySelector(".ax-sintomas a[href='#m5-linewidth']").click();
    o.tras_clic_diag = { cuenta: cuenta(), hash: location.hash, casoVisible: !document.getElementById("m5-linewidth").classList.contains("ax-oculto") };
    return o;
  });

  mostrar("bestiario");
  // ---------- A.3 chuleta WebGL: filtro ----------
  await page.goto(RAIZ + "08-anexos/03-chuleta-webgl.html", { waitUntil: "load" }); await esp(1500);
  res.chuletaWebgl = await page.evaluate(() => {
    const q = document.querySelector(".ax-filtro input"), c = document.querySelector(".ax-filtro .ax-cuenta");
    const o = { inicial: c.textContent };
    q.value = "readPixels"; q.dispatchEvent(new Event("input")); o.readPixels = c.textContent;
    q.value = "instancias divisor"; q.dispatchEvent(new Event("input")); o.divisor = c.textContent;
    return o;
  });

  mostrar("chuletaWebgl");
  // ---------- 5.1.4 pérdida y restauración: ¿el registro dice lo que cuenta el texto? ----------
  await page.goto(RAIZ + "05-webgl/01-contexto.html", { waitUntil: "load" }); await esp(1000);
  await page.evaluate(() => document.querySelector('.js-playground[data-titulo="Pérdida y restauración"]').scrollIntoView({ block: "center" }));
  await esp(4500);
  res.perdidaContexto = await page.evaluate(() => [...document.querySelectorAll('.js-playground[data-titulo="Pérdida y restauración"] .pg-consola .log-linea')].map((x) => x.textContent.trim()));

  mostrar("perdidaContexto");
  // ---------- 5.4.3 reloj: Date.now() y milisegundos ----------
  await page.goto(RAIZ + "05-webgl/04-uniforms-animacion.html", { waitUntil: "load" }); await esp(1000);
  await page.evaluate(() => document.querySelector('.js-playground[data-titulo="Precisión del tiempo en float32"]').scrollIntoView({ block: "center" }));
  await esp(2500);
  const h = await page.$('.js-playground[data-titulo="Precisión del tiempo en float32"] iframe');
  const fr = await h.contentFrame();
  res.reloj = {};
  for (const [off, uni] of [["0", "s"], ["3600", "s"], ["2592000", "s"], ["2592000", "ms"], ["epoch", "s"], ["epoch", "ms"]]) {
    await fr.select("#offset", off); await fr.select("#unidad", uni); await esp(700);
    res.reloj[off + "/" + uni] = await fr.evaluate(() => document.getElementById("info").textContent);
  }

  mostrar("reloj");
  // ---------- 5.4.4 pausa con IntersectionObserver (alejándose poco: lejos, el iframe se destruye) ----------
  const sel = '.js-playground[data-titulo="Pausa con IntersectionObserver"]';
  await page.evaluate((q) => document.querySelector(q).scrollIntoView({ block: "center" }), sel);
  await esp(1500);
  const leerInfo = async () => { const hh = await page.$(sel + " iframe"); const ff = await hh.contentFrame(); return ff.evaluate(() => document.getElementById("info").textContent); };
  const t1 = await leerInfo();
  await page.evaluate(() => window.scrollBy(0, 750)); await esp(1500);
  let t2, t3;
  try { t2 = await leerInfo(); await esp(1000); t3 = await leerInfo(); } catch (e) { t2 = "iframe destruido: " + e.message.slice(0, 40); }
  await page.evaluate((q) => document.querySelector(q).scrollIntoView({ block: "center" }), sel); await esp(2500);
  let t4; try { t4 = await leerInfo(); } catch (e) { t4 = "error " + e.message.slice(0, 40); }
  res.pausa = { visible: t1, fuera: t2, fueraDespues: t3, devuelta: t4 };
  mostrar("pausa");

  res.errores = errores.slice(0, 10);
  console.log(JSON.stringify(res, null, 1));
} finally { await browser.close(); }
