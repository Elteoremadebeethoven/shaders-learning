import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "fs";
const LECCION = "file:///home/user/shaders-learning/modulos/07-integracion/01-arquitectura.html";
const OUT = process.argv[2] || "./inter";
const SOLO = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
fs.mkdirSync(OUT, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", protocolTimeout: 120000,
  args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const informe = [];
const log = (...a) => { const s = a.join(" "); informe.push(s); console.log(s); };
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => log("PAGEERROR " + e.message));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warn" || m.type() === "warning") log("CONSOLE[" + m.type() + "] " + m.text().slice(0, 300)); });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(LECCION);
  await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 30000 });
  await page.addStyleTag({ content: ".barra-superior, header.barra, .cabecera-curso { position: static !important; }" });
  const pgs = await page.$$(".playground");
  log("playgrounds:", pgs.length);
  async function consola(h) { return h.$$eval(".pg-consola .log-linea", (ls) => ls.map((l) => l.textContent)); }
  async function marco0(h) { const f = await h.$(".pg-lienzo iframe"); return f ? await f.contentFrame() : null; }
  async function marco(h) {
    return new Proxy({}, { get: (_, prop) => prop === "then" ? undefined : async (...args) => {
      for (let k = 0; ; k++) {
        try { const fr = await marco0(h); if (!fr) throw new Error("null frame"); return await fr[prop](...args); }
        catch (e) { if (k < 4 && /detached|null|Execution context/i.test(e.message)) { await dormir(1000); continue; } throw e; }
      }
    } });
  }
  async function ver(i) {
    const h = pgs[i]; await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
    let ant = null, estable = 0;
    for (let k = 0; k < 40 && estable < 3; k++) {
      await dormir(500);
      const id = await h.evaluate((el) => { const f = el.querySelector(".pg-lienzo iframe"); if (!f) return null; if (!f.dataset.qid) f.dataset.qid = Math.random(); return f.dataset.qid; });
      if (id && id === ant) estable++; else estable = 0; ant = id;
    }
    await dormir(800); return h;
  }
  async function foto(h, nombre) {
    try { await page.screenshot({ path: OUT + "/" + nombre + ".png", captureBeyondViewport: false }); }
    catch (e) { log("fallo foto " + nombre + ": " + e.message); }
  }
  async function lienzoEnPagina(h, sel = "canvas") {
    const f = await h.$(".pg-lienzo iframe"); const bi = await f.boundingBox();
    const fr = await marco(h); const r = await fr.$eval(sel, (c) => { const b = c.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
    return { x: bi.x + r.x, y: bi.y + r.y, w: r.w, h: r.h };
  }
  async function texto(fr, sel) { try { return await fr.$eval(sel, (e) => e.textContent); } catch (e) { return "(sin " + sel + ")"; } }
  async function verSolucion(h) { await h.$eval(".pg-btn.solucion", (b) => b.click()); await dormir(2500); }
  const quiero = (i) => !SOLO || SOLO.includes(i);

  if (quiero(0)) { // Ejemplo 7.1.1
    const h = await ver(0); const r = await lienzoEnPagina(h);
    await page.mouse.move(r.x + r.w * 0.25, r.y + r.h * 0.3); await dormir(300);
    await page.mouse.down(); await page.mouse.up(); await dormir(250);
    await foto(h, "00-esqueleto-clic"); log("[0] consola:", JSON.stringify(await consola(h)));
  }
  if (quiero(1)) { // DOM y GL
    const h = await ver(1); const fr = await marco(h);
    for (const m of ["mismo", "now", "intervalo"]) { await fr.select("#modo", m); await dormir(1200); await foto(h, "01-domgl-" + m); }
    log("[1] consola:", JSON.stringify(await consola(h)));
  }
  if (quiero(2)) { // Ejemplo 7.1.2
    const h = await ver(2); const fr = await marco(h); const r = await lienzoEnPagina(h);
    log("[2] info inicial:", await texto(fr, "#info"));
    await fr.click('button[data-e="pausa"]'); await dormir(300);
    await page.mouse.move(r.x + r.w * 0.7, r.y + r.h * 0.4); await dormir(400);
    log("[2] info en pausa:", await texto(fr, "#info")); await foto(h, "02-reloj-pausa");
    await fr.click('button[data-e="pausa"]'); await fr.click('button[data-e="0.25"]'); await dormir(600);
    log("[2] info x0.25:", await texto(fr, "#info"));
  }
  if (quiero(3)) { // Ejemplo 7.1.3
    const h = await ver(3); const fr = await marco(h);
    log("[3] info:", await texto(fr, "#info")); await foto(h, "03-crearapp");
    await fr.click("#perder"); await dormir(800);
    const t1 = await texto(fr, "#info"); await dormir(800); const t2 = await texto(fr, "#info");
    log("[3] info tras perder (dos lecturas):", t1, "|", t2); await foto(h, "03-crearapp-perdido");
    await fr.click("#recuperar"); await dormir(1500);
    log("[3] info tras recuperar:", await texto(fr, "#info")); log("[3] consola:", JSON.stringify(await consola(h)));
    await fr.click("#pausa"); await dormir(500); const p1 = await texto(fr, "#info"); await dormir(700); const p2 = await texto(fr, "#info");
    log("[3] pausa bucle (dos lecturas):", p1, "|", p2); await fr.click("#pausa");
  }
  if (quiero(4)) { // Ejemplo 7.1.4
    const h = await ver(4); const fr = await marco(h);
    for (const e of ["anillos", "puntos", "plasma"]) { await fr.select("#escena", e); await dormir(1000); await foto(h, "04-escenas-" + e); }
    await fr.click("#liberar"); await fr.select("#escena", "anillos"); await dormir(600); await fr.select("#escena", "plasma"); await dormir(600);
    log("[4] info:", await texto(fr, "#info"));
    await fr.click("#perder"); await dormir(600); await fr.click("#recuperar"); await dormir(1500);
    log("[4] info tras recuperar:", await texto(fr, "#info")); log("[4] consola:", JSON.stringify(await consola(h)));
    await foto(h, "04-escenas-recuperado");
  }
  if (quiero(5)) { // Ejemplo 7.1.5
    const h = await ver(5); const fr0 = await marco(h);
    for (const m of ["normal", "sin-webgl2", "no-compila", "excepcion"]) {
      const fr = await marco(h);
      await fr.click('button[data-modo="' + m + '"]'); await dormir(m === "excepcion" ? 2500 : 1200);
      const alt = await fr.$eval("#alternativa", (a) => ({ visible: !a.hidden, small: a.querySelector("small").textContent })).catch((e) => e.message);
      const ncanvas = await fr.$$eval("canvas", (c) => c.length);
      log("[5] modo " + m + ":", JSON.stringify(alt), "canvas:", ncanvas); await foto(h, "05-alternativa-" + m);
    }
    log("[5] consola:", JSON.stringify(await consola(h)));
  }
  if (quiero(6)) { // Ejemplo 7.1.6
    const h = await ver(6); const fr = await marco(h);
    log("[6] estado:", await texto(fr, "#estado"));
    await fr.evaluate(() => { const a = document.getElementById("fuente"); a.value = a.value.replace("vec4(col, 1.0);", "vec4(col, 1.0)"); a.dispatchEvent(new Event("input")); });
    await dormir(1500); log("[6] estado roto:", await texto(fr, "#estado")); await foto(h, "06-recarga-roto");
    await fr.evaluate(() => { const a = document.getElementById("fuente"); a.value = a.value.replace("vec4(col, 1.0)", "vec4(col.bgr, 1.0);"); a.dispatchEvent(new Event("input")); });
    await dormir(1500); log("[6] estado arreglado:", await texto(fr, "#estado")); await foto(h, "06-recarga-ok");
  }
  if (quiero(7)) { // Ejemplo 7.1.7
    const h = await ver(7); const fr = await marco(h);
    log("[7] info:", await texto(fr, "#info"));
    await fr.evaluate(() => { const s = document.getElementById("coste"); s.value = 1500; s.dispatchEvent(new Event("input")); });
    for (let k = 0; k < 4; k++) { await dormir(2500); log("[7] coste 1500, t+" + (k + 1) * 2.5 + " s:", await texto(fr, "#info")); }
    await foto(h, "07-calidad-1500");
    await fr.evaluate(() => { const s = document.getElementById("coste"); s.value = 200; s.dispatchEvent(new Event("input")); });
    await dormir(4000); log("[7] coste 200 de nuevo:", await texto(fr, "#info"));
  }
  if (quiero(8)) { // Ejercicio 7.1.1
    const h = await ver(8); const r = await lienzoEnPagina(h);
    await page.mouse.move(r.x + r.w * 0.3, r.y + r.h * 0.5); await page.mouse.move(r.x + r.w * 0.32, r.y + r.h * 0.45); await dormir(500);
    await foto(h, "08-ej1-partida"); log("[8] consola partida:", JSON.stringify((await consola(h)).slice(0, 4)), "total", (await consola(h)).length);
    await verSolucion(h); const r2 = await lienzoEnPagina(h);
    await page.mouse.move(r2.x + r2.w * 0.3, r2.y + r2.h * 0.5); await page.mouse.move(r2.x + r2.w * 0.33, r2.y + r2.h * 0.45); await dormir(500);
    await foto(h, "08-ej1-sol"); log("[8] consola solución:", JSON.stringify(await consola(h)));
  }
  for (const [i, espera] of [[9, 500], [10, 3600], [11, 1500], [12, 1500]]) {
    if (!quiero(i)) continue;
    const h = await ver(i); await dormir(espera);
    log("[" + i + "] consola partida:", JSON.stringify(await consola(h))); await foto(h, i + "-partida");
    await verSolucion(h); await dormir(espera);
    log("[" + i + "] consola solución:", JSON.stringify(await consola(h))); await foto(h, i + "-sol");
  }

  // ---- pruebas de shaders (#version, #line) ----
  const r2 = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    function compilar(src) { const s = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(s, src); gl.compileShader(s); return (gl.getShaderParameter(s, gl.COMPILE_STATUS) ? "OK " : "FALLA ") + (gl.getShaderInfoLog(s) || "").trim(); }
    const out = {};
    out.saltoInicial = compilar("\n#version 300 es\nprecision highp float;\nout vec4 c;\nvoid main(){ c = vec4(1.0); }");
    out.espacioInicial = compilar("  #version 300 es\nprecision highp float;\nout vec4 c;\nvoid main(){ c = vec4(1.0); }");
    out.line1 = compilar("#version 300 es\n#line 1\nprecision highp float;\nout vec4 c;\nvoid main() {\n  float x = 1.0;\n  c = vec4(y);\n}");
    out.trozo = compilar("#version 300 es\nprecision highp float;\n#line 1 7\nfloat f(float x) {\n  return x * 2.0;\n}\n#line 3 0\nout vec4 c;\nvoid main() {\n  c = vec4(f(1.0), z, 0.0, 1.0);\n}");
    out.trozoErr = compilar("#version 300 es\nprecision highp float;\n#line 1 7\nfloat f(float x) {\n  return x * q;\n}\n#line 3 0\nout vec4 c;\nvoid main() {\n  c = vec4(f(1.0));\n}");
    return out;
  });
  log("SHADERS " + JSON.stringify(r2, null, 1));
} catch (e) { log("EXCEPCIÓN DEL SCRIPT: " + e.stack); }
finally { fs.writeFileSync(OUT + "/informe.txt", informe.join("\n")); await browser.close(); }
if (false) {
  const b2 = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new", protocolTimeout: 60000,
    args: ["--no-sandbox","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--disable-webgl2"] });
  try {
    const p = await b2.newPage(); await p.goto("file://" + process.cwd() + "/vacia.html");
    const r = await p.evaluate(() => {
      const c = document.createElement("canvas"); const ev = [];
      c.addEventListener("webglcontextcreationerror", (e) => ev.push("evento: " + e.statusMessage));
      ev.push("antes"); const g = c.getContext("webgl2"); ev.push("después: " + g);
      return { ev, webgl1: !!document.createElement("canvas").getContext("webgl") };
    });
    log("DISABLE-WEBGL2 " + JSON.stringify(r));
  } finally { await b2.close(); fs.writeFileSync(OUT + "/informe.txt", informe.join("\n")); }
}
console.log("FIN");
