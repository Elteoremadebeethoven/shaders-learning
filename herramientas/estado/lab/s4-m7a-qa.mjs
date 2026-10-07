// s4-m7a: QA de lo que cambié en 7.1, 7.2 y 7.3 (playgrounds JS en marcha, capturas recortadas a la ventana).
// Uso: node s4-m7a-qa.mjs <dir de capturas> [light]
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const CAP = process.argv[2]; fs.mkdirSync(CAP, { recursive: true });
const TEMA = process.argv[3] === "light" ? "light" : "dark";
const R = "file:///Users/alex/Projects/shaders/modulos/07-integracion/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, protocolTimeout: 90000 });
const out = {};
let page;
async function abrir(archivo) {
  if (page) await page.close();
  page = await nav.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, TEMA);
  await page.goto(R + archivo, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && Curso.listo, { timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
}
async function pg(titulo) {
  for (const h of await page.$$(".js-playground")) if ((await h.evaluate((el) => el.dataset.titulo)) === titulo) return h;
  throw new Error("no encuentro " + titulo);
}
async function marco(h) {
  for (let i = 0; i < 60; i++) { const f = await h.$("iframe"); if (f) { const fr = await f.contentFrame(); if (fr) return fr; } await espera(100); }
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
  const est = await h.evaluate((el) => (el.querySelector(".estado") || {}).textContent);
  if (!/ejecutando/.test(est)) console.log("  (aviso) estado:", est);
  await page.screenshot({ path: CAP + "/" + nombre + ".png", clip: r, captureBeyondViewport: false });
}
const consola = (h) => h.evaluate((el) => [...el.querySelectorAll(".pg-consola .log-linea")].map((x) => x.textContent));
const centrar = (h) => h.evaluate((el) => el.querySelector(".pg-lienzo").scrollIntoView({ block: "center" }));
async function verSolucion(h) { await h.evaluate((el) => el.querySelector(".pg-btn.solucion").click()); await espera(300); }
const SOLO732 = process.argv.includes("--solo732");
try {
  if (!SOLO732) {
  // ---------------- 7.2 ----------------
  await abrir("02-interaccion.html");
  let h = await pg("Ejemplo 7.2.2 — Estela y velocidad"); await centrar(h); await marco(h);
  await espera(1500); await captura(h, "722-fantasma-a");
  out["7.2.2 info a"] = await enMarco(h, () => document.getElementById("info").textContent);
  await espera(700); await captura(h, "722-fantasma-b");
  out["7.2.2 info b"] = await enMarco(h, () => document.getElementById("info").textContent);
  // un puntero real: entra y se mueve deprisa
  const box = await h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, hh: b.height }; });
  for (let i = 0; i <= 12; i++) { await page.mouse.move(box.x + box.w * (0.2 + 0.05 * i), box.y + box.hh * 0.5); await espera(16); }
  await captura(h, "722-real");
  out["7.2.2 info con ratón"] = await enMarco(h, () => document.getElementById("info").textContent);
  out["7.2.2 consola"] = await consola(h);
  // ---------------- 7.1 ----------------
  await abrir("01-arquitectura.html");
  h = await pg("Ejemplo 7.1.5 — Alternativas"); await centrar(h); await marco(h); await espera(800);
  for (const modo of ["sin-webgl2", "no-compila", "excepcion", "normal"]) {
    await enMarco(h, (m) => document.querySelector('[data-modo="' + m + '"]').click(), modo);
    await espera(modo === "excepcion" ? 1800 : 700);
    out["7.1.5 " + modo] = await enMarco(h, () => ({ canvas: !!document.querySelector("#escena canvas"), alternativa: !document.getElementById("alternativa").hidden,
      motivo: document.querySelector("#alternativa small").textContent.slice(0, 90), perdido: app && app.gl ? app.gl.isContextLost() : null, activo: app.activo }));
    await captura(h, "715-" + modo);
  }
  out["7.1.5 consola"] = (await consola(h)).map((s) => s.slice(0, 120));
  h = await pg("Ejemplo 7.1.3 — M7.crearApp"); await centrar(h); await marco(h); await espera(1000);
  await enMarco(h, () => document.getElementById("perder").click()); await espera(700);
  out["7.1.3 tras perder"] = await enMarco(h, () => document.getElementById("info").textContent);
  await enMarco(h, () => document.getElementById("recuperar").click()); await espera(900);
  out["7.1.3 tras recuperar"] = await enMarco(h, () => document.getElementById("info").textContent);
  out["7.1.3 consola"] = await consola(h);
  await captura(h, "713-recuperado");
  h = await pg("Ejemplo 7.1.7 — Calidad adaptativa"); await centrar(h); await marco(h); await espera(2500);
  out["7.1.7 info"] = await enMarco(h, () => document.getElementById("info").textContent);
  await captura(h, "717");
  // ---------------- 7.3 ----------------
  await abrir("03-transiciones-shader.html");
  h = await pg("Ejemplo 7.3.8 — Continuo frente a bajo demanda"); await centrar(h); await marco(h); await espera(2600);
  out["7.3.8 sin eventos"] = await enMarco(h, () => [document.getElementById("i1").textContent, document.getElementById("i2").textContent]);
  await captura(h, "738");
  h = await pg("Ejercicio 7.3.5"); await centrar(h); await marco(h); await verSolucion(h); await centrar(h);
  await espera(8500);
  out["7.3.5 solución"] = await consola(h);
  await captura(h, "735-sol");
  } else await abrir("03-transiciones-shader.html");
  // 7.3.2: ¿estirar el ruido con clamp rompe el contrato del código de partida en p = 1?
  const html = fs.readFileSync("/Users/alex/Projects/shaders/modulos/07-integracion/03-transiciones-shader.html", "utf8");
  const i0 = html.indexOf('data-titulo="Ejercicio 7.3.2"'), a0 = html.indexOf('<script type="x-shader/x-fragment">', i0);
  const FS0 = html.slice(a0 + '<script type="x-shader/x-fragment">'.length, html.indexOf("</script>", a0)).trim();
  out["7.3.2 estirar sin ampliar el recorrido"] = await page.evaluate((fs0) => {
    const variantes = { partida: fs0, estirado: fs0.replace("float n = fbm(uv * a * 5.0);", "float n = clamp((fbm(uv * a * 5.0) - 0.24) / (0.80 - 0.24), 0.0, 1.0);") };
    const c = document.createElement("canvas"); c.width = 360; c.height = 225;
    const gl = c.getContext("webgl2");
    const VS = "#version 300 es\nout vec2 v_uv;\nvoid main(){ vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));\n v_uv = P[gl_VertexID] * 0.5 + 0.5; gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }";
    const res = {};
    for (const [k, fs] of Object.entries(variantes)) {
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); gl.useProgram(p);
      ["paisaje", "texto"].forEach((n, i) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, Texturas.crear(n, 512)); gl.generateMipmap(gl.TEXTURE_2D); gl.uniform1i(gl.getUniformLocation(p, "u_tex" + i), i); });
      gl.uniform2f(gl.getUniformLocation(p, "u_resolution"), 360, 225); gl.uniform1f(gl.getUniformLocation(p, "u_progreso"), 0.5);
      gl.uniform1f(gl.getUniformLocation(p, "u_ancho"), 0.08); gl.uniform1i(gl.getUniformLocation(p, "u_comprobar"), 1);
      gl.viewport(0, 0, 360, 225); gl.bindVertexArray(gl.createVertexArray()); gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Uint8Array(360 * 225 * 4); gl.readPixels(0, 0, 360, 225, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let mag = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 255 && px[i + 1] === 0 && px[i + 2] === 255) mag++;
      res[k] = mag + " píxeles magenta de " + 360 * 225;
    }
    return res;
  }, FS0);
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
