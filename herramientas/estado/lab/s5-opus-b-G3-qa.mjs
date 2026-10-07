// s5-opus-b-G3: QA de interacción de 7.1, 7.2 y 7.3 que la sesión 4 no cubrió (un Chrome, ~2 min).
// Uso: node s5-opus-b-G3-qa.mjs <dir de capturas>
// · 7.1.2: línea de información con pausa y con × 0,25 (dt 0 / 4,2 ms).
// · 7.1.4: consola del gestor de escenas al cambiar con y sin «liberar al salir».
// · 7.1.6: un punto y coma borrado → error en la línea de estado y la animación sigue.
// · 7.2.1: cruz del shader frente al anillo del DOM al cambiar la resolución (modo «px del búfer») y con scroll.
// · 7.3.4: diferencia media entre frames consecutivos durante la ráfaga, en los tres modos (los saltos).
// · 7.3.6: un clic en otro enlace a mitad de la transición no cambia de destino.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const CAP = process.argv[2] || "/tmp/s5-g3-qa"; fs.mkdirSync(CAP, { recursive: true });
const R = "file:///Users/alex/Projects/shaders/modulos/07-integracion/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, protocolTimeout: 120000 });
const out = {};
let page;
async function abrir(archivo) {
  if (page) await page.close();
  page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(R + archivo, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
}
async function pg(titulo) {
  for (const h of await page.$$(".js-playground")) if ((await h.evaluate((el) => el.dataset.titulo)) === titulo) return h;
  throw new Error("no encuentro " + titulo);
}
async function marco(h) {
  for (let i = 0; i < 80; i++) { const f = await h.$("iframe"); if (f) { const fr = await f.contentFrame(); if (fr) return fr; } await espera(100); }
  throw new Error("sin iframe");
}
async function enMarco(h, fn, ...args) {
  for (let i = 0; i < 20; i++) {
    try { const fr = await marco(h); return await fr.evaluate(fn, ...args); } catch (e) { if (!/detached|destroyed|Execution context/.test(e.message)) throw e; await espera(150); }
  }
  throw new Error("marco inestable");
}
async function captura(h, nombre) {
  const r = await h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; });
  await page.screenshot({ path: CAP + "/" + nombre + ".png", clip: r, captureBeyondViewport: false });
}
const consola = (h) => h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent));
const centrar = (h) => h.evaluate((el) => el.querySelector(".pg-lienzo").scrollIntoView({ block: "center" }));
const caja = (h) => h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
try {
  // ---------------- 7.1 ----------------
  await abrir("01-arquitectura.html");
  let h = await pg("Un reloj con pausa y escala de tiempo"); await centrar(h); await marco(h); await espera(1200);
  out["7.1.2 normal"] = await enMarco(h, () => document.getElementById("info").textContent);
  await enMarco(h, () => document.querySelector('[data-e="0.25"]').click()); await espera(500);
  out["7.1.2 ×0,25"] = await enMarco(h, () => document.getElementById("info").textContent);
  await enMarco(h, () => document.querySelector('[data-e="pausa"]').click()); await espera(500);
  out["7.1.2 pausa"] = await enMarco(h, () => document.getElementById("info").textContent);

  h = await pg("Ejemplo 7.1.4 — Gestor de escenas"); await centrar(h); await marco(h); await espera(800);
  const elegir = async (v) => { await enMarco(h, (x) => { const s = document.getElementById("escena"); s.value = x; s.onchange(); }, v); await espera(400); };
  await enMarco(h, () => { document.getElementById("liberar").checked = false; });
  await elegir("anillos"); await elegir("puntos"); await elegir("plasma");                 // sin liberar
  await enMarco(h, () => { document.getElementById("liberar").checked = true; });
  await elegir("anillos"); await elegir("plasma");                                          // liberando
  out["7.1.4 info"] = await enMarco(h, () => document.getElementById("info").textContent);
  await enMarco(h, () => document.getElementById("perder").click()); await espera(600);
  await enMarco(h, () => document.getElementById("recuperar").click()); await espera(900);
  out["7.1.4 info tras recuperar"] = await enMarco(h, () => document.getElementById("info").textContent);
  out["7.1.4 consola"] = await consola(h);
  await captura(h, "714-final");

  h = await pg("Ejemplo 7.1.6 — Recarga en caliente"); await centrar(h); await marco(h); await espera(1000);
  out["7.1.6 inicial"] = await enMarco(h, () => document.getElementById("estado").textContent);
  out["7.1.6 rotura"] = await enMarco(h, async () => {
    const a = document.getElementById("fuente");
    a.value = a.value.replace("fragColor = vec4(col, 1.0);", "fragColor = vec4(col, 1.0)");
    a.dispatchEvent(new Event("input"));
    let frames = 0; const cuenta = () => { frames++; if (frames < 1e9) requestAnimationFrame(cuenta); }; requestAnimationFrame(cuenta);
    await new Promise((r) => setTimeout(r, 1200));
    return { estado: document.getElementById("estado").textContent, framesEn1200ms: frames, actual: !!actual };
  });
  await captura(h, "716-roto");

  // ---------------- 7.2 ----------------
  await abrir("02-interaccion.html");
  h = await pg("Ejemplo 7.2.1 — ¿Qué guarda el evento?"); await centrar(h); await marco(h); await espera(800);
  // La cruz: los píxeles rosas (255, 107, 181) del canvas, leídos en el iframe; el anillo: guardado.crudo
  const cruz = () => enMarco(h, () => new Promise((res) => requestAnimationFrame(() => {
    const c = document.getElementById("c"), g = c.getContext("webgl2"), w = c.width, hh = c.height;
    const px = new Uint8Array(w * hh * 4); g.readPixels(0, 0, w, hh, g.RGBA, g.UNSIGNED_BYTE, px);
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (px[i] > 230 && px[i + 1] < 140 && px[i + 2] > 150) { sx += x; sy += y; n++; } }
    const r = c.getBoundingClientRect();
    // centro de la cruz en px CSS de la ventana del iframe, frente al anillo (clientX/Y)
    res({ n, cruz: n ? [r.left + (sx / n + 0.5) * r.width / w, r.bottom - (sy / n + 0.5) * r.height / hh].map((v) => +v.toFixed(1)) : null, anillo: guardado.crudo, bufer: [w, hh] });
  })));
  const b721 = await caja(h);
  // el lienzo del iframe empieza 40 px más abajo que el panel: busca el canvas dentro del iframe
  const off = await enMarco(h, () => { const r = document.getElementById("c").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const ifr = await h.evaluate((el) => { const b = el.querySelector("iframe").getBoundingClientRect(); return { x: b.left, y: b.top }; });
  const mx = ifr.x + off.x + off.w * 0.7, my = ifr.y + off.y + off.h * 0.6;
  for (const modo of ["bufer", "caja", "crudo"]) {
    await enMarco(h, (m) => { document.getElementById("modo").value = m; window.scrollTo(0, 0); }, modo);
    await page.mouse.move(mx - 30, my); await espera(50); await page.mouse.move(mx, my); await espera(300);
    const a = await cruz();
    await enMarco(h, () => document.getElementById("res").click()); await espera(300);
    const bRes = await cruz();
    await enMarco(h, () => document.getElementById("res").click()); await espera(300);
    await page.mouse.wheel({ deltaY: 120 }); await espera(600);
    const cScroll = await cruz();
    out["7.2.1 " + modo] = { antes: a, mitadResolucion: bRes, trasScroll: cScroll };
    await captura(h, "721-" + modo + "-scroll");
  }
  void b721;

  // ---------------- 7.3 ----------------
  await abrir("03-transiciones-shader.html");
  h = await pg("Ejemplo 7.3.4 — Galería con instantáneas"); await centrar(h); await marco(h); await espera(4500);   // la ráfaga inicial termina
  for (const modo of ["congelar", "cambiar", "esperar"]) {
    out["7.3.4 " + modo] = await enMarco(h, async (m) => {
      document.getElementById("modo").value = m;
      const g = app.gl, dif = [];
      let prev = null, vivo = true;
      const tomar = () => {
        if (!vivo) return;
        const w = g.drawingBufferWidth, hh = g.drawingBufferHeight, px = new Uint8Array(w * hh * 4);
        g.readPixels(0, 0, w, hh, g.RGBA, g.UNSIGNED_BYTE, px);
        if (prev) { let s = 0, n = 0; for (let i = 0; i < px.length; i += 4 * 7) { s += Math.abs(px[i] - prev[i]) + Math.abs(px[i + 1] - prev[i + 1]) + Math.abs(px[i + 2] - prev[i + 2]); n += 3; } dif.push(s / n); }
        prev = px; requestAnimationFrame(tomar);
      };
      requestAnimationFrame(() => requestAnimationFrame(tomar));    // después del frame de la app
      document.getElementById("rafaga").click();
      await new Promise((r) => setTimeout(r, 4200));
      vivo = false;
      const ord = [...dif].sort((a, b) => b - a);
      return { frames: dif.length, max: +ord[0].toFixed(2), top5: ord.slice(0, 5).map((v) => +v.toFixed(2)), mediana: +ord[Math.floor(ord.length / 2)].toFixed(2), info: document.getElementById("info").textContent };
    }, modo);
  }
  h = await pg("Ejemplo 7.3.6 — Overlay de página"); await centrar(h); await marco(h); await espera(3500);   // termina la demostración
  out["7.3.6"] = await enMarco(h, async () => {
    const enlace = (n) => document.querySelector('nav a[data-pagina="' + n + '"]');
    enlace("contacto").click();
    await new Promise((r) => setTimeout(r, 250));
    const faseA = app.estado.fase;
    // un clic real de usuario sobre el canvas, que cubre la página: elementFromPoint en el centro del enlace
    const r = enlace("inicio").getBoundingClientRect();
    const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    enlace("inicio").click();                       // si llegara, ¿cambiaría el destino?
    await new Promise((r) => setTimeout(r, 2000));
    return { faseA, encimaDelEnlace: encima && (encima.id || encima.tagName), paginaFinal: app.estado.pagina, fase: app.estado.fase, titulo: document.querySelector("#contenido h1").textContent };
  });
} catch (e) { console.log("ERROR:", e.stack); }
finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
