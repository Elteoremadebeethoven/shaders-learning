// Sesión 5 · opus-b: comprobaciones sueltas tras editar (un Chrome).
//  A. 6.9 «Esferas infinitas»: con la cámara nueva (pasillo entre cuatro filas), celda 2 y radio 1,2 deben verse
//     esferas cortadas por planos en todo momento, sin que la pantalla se llene de un solo color (cámara dentro).
//  B. 6.1 «Lo que ANGLE hace con tu fragment shader»: ¿la traducción completa trae ANGLE_safeDivisor y ANGLE_div,
//     como dice el anotado?
// Uso (con turno): node s5-opus-b-comprobaciones.mjs <dir-capturas>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
const SAL = process.argv[2] || "./comprobaciones";
fs.mkdirSync(SAL, { recursive: true });
const BASE = "file:///Users/alex/Projects/shaders/modulos/";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", protocolTimeout: 300000,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  defaultViewport: { width: 1280, height: 1000, deviceScaleFactor: 1 },
});
const errores = [];
async function abrir(ruta) {
  const page = await nav.newPage();
  page.on("pageerror", (e) => errores.push(ruta + " pageerror: " + e.message));
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("curso-tema", JSON.stringify("dark")); } catch (e) {} });
  await page.goto(BASE + ruta, { waitUntil: "load" });
  await page.waitForFunction(() => window.Curso && window.Curso.listo, { timeout: 20000 });
  await page.addStyleTag({ content: ".topbar{visibility:hidden !important}" });
  return page;
}
try {
  // ---------- A. 6.9
  let page = await abrir("06-glsl/09-raymarching.html");
  const h = await page.evaluateHandle(() => [...document.querySelectorAll(".glsl-playground")].find((e) => e.dataset.titulo === "Esferas infinitas"));
  await h.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await espera(2000);
  const lienzo = async () => h.evaluate((el) => { const b = el.querySelector(".pg-lienzo").getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height }; });
  const poner = (et, v) => h.evaluate((el, [et, v]) => {
    for (const c of el.querySelectorAll(".control")) { const l = c.querySelector("label"); if (l && l.textContent === et) { const i = c.querySelector("input"); i.value = String(v); i.dispatchEvent(new Event("input")); return; } }
    throw new Error("sin control " + et);
  }, [et, v]);
  // ¿la imagen es de un solo color? (desviación de los píxeles de la captura)
  async function foto(nombre) {
    const clip = await lienzo();
    const buf = await page.screenshot({ path: `${SAL}/${nombre}.png`, clip, captureBeyondViewport: false });
    return nombre;
  }
  await foto("69-esferas-defecto");
  await poner("celda", 2); await poner("radio", 1.2);
  for (let k = 0; k < 6; k++) { await espera(350); await foto(`69-esferas-c2-r1.2-${k}`); }
  console.log("A. 6.9: capturas en " + SAL);
  await page.close();

  // ---------- B. 6.1
  page = await abrir("06-glsl/01-lenguaje.html");
  const hb = await page.evaluateHandle(() => [...document.querySelectorAll(".js-playground")].find((e) => e.dataset.titulo === "Lo que ANGLE hace con tu fragment shader"));
  await hb.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await espera(3500);
  const codigo = await hb.evaluate((el) => [...el.querySelectorAll(".CodeMirror")].map((cm) => cm.CodeMirror.getValue()).join("\n"));
  const m = codigo.match(/const fuente = `([\s\S]*?)`;/);
  const r = !m ? "no encuentro la fuente" : await page.evaluate((src) => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const ext = gl.getExtension("WEBGL_debug_shaders");
    const sh = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(sh, src); gl.compileShader(sh);
    const t = ext.getTranslatedShaderSource(sh);
    return { compila: gl.getShaderParameter(sh, gl.COMPILE_STATUS), largo: t.length,
      safeDivisor: (t.match(/[^\n]*ANGLE_safeDivisor[^\n]*/g) || []).slice(0, 3),
      div: (t.match(/[^\n]*ANGLE_div\b[^\n]*/g) || []).slice(0, 4) };
  }, m[1]);
  console.log("B. 6.1 traducción completa:", JSON.stringify(r, null, 1));
  await page.close();
} finally {
  console.log("errores:", errores.length ? errores.join(" | ") : "ninguno");
  await nav.close();
}
