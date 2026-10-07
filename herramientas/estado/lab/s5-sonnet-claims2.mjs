// s5-sonnet-claims2.mjs — firmas de A.3 frente a la API real, powerPreference en iframe aislado,
// KHR_parallel_shader_compile y contador del glosario. Apple M1, Chrome, ANGLE/Metal.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "node:fs";
import path from "node:path";
const SCRATCH = "/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/s5/sonnet";
const firmas = JSON.parse(fs.readFileSync(path.join(SCRATCH, "a3-firmas.json"), "utf8"));
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  headless: "new",
});
const out = {};
try {
  const f1 = path.join(SCRATCH, "claims-C.html");
  fs.writeFileSync(f1, `<!doctype html><meta charset=utf-8><body><canvas id=c></canvas>
<iframe id=f sandbox="allow-scripts" srcdoc='<script>const a=document.createElement("canvas").getContext("webgl2").getContextAttributes().powerPreference;const b=document.createElement("canvas").getContext("webgl2",{powerPreference:"high-performance"}).getContextAttributes().powerPreference;parent.postMessage({a,b},"*")</script>'></iframe></body>`);
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { window.__pp = null; window.addEventListener("message", (e) => { window.__pp = e.data; }); });
  await page.goto("file://" + f1);
  await new Promise((r) => setTimeout(r, 1000));
  out.firmas = await page.evaluate((firmas) => {
    const gl = document.getElementById("c").getContext("webgl2");
    const proto = WebGL2RenderingContext.prototype;
    const res = { inexistentes: [], conMenosArgs: [], extension: {} };
    const base = new Set();
    for (const [nombre, args, texto] of firmas) {
      if (base.has(texto)) continue; base.add(texto);
      if (nombre === "canvas" || nombre === "pause" || nombre === "resume") continue;
      if (!(nombre in gl)) { res.inexistentes.push(nombre + "  ← " + texto.slice(0, 70)); continue; }
      const f = gl[nombre];
      if (typeof f === "function" && args !== null) {
        const n = args.trim() === "" ? 0 : args.split(",").length;
        if (n < f.length) res.conMenosArgs.push(nombre + ": firma con " + n + " argumentos, la API exige " + f.length + "  ← " + texto.slice(0, 80));
      }
    }
    const sup = gl.getSupportedExtensions();
    res.extension.KHR_parallel_shader_compile = sup.includes("KHR_parallel_shader_compile");
    res.extension.EXT_disjoint_timer_query_webgl2 = sup.includes("EXT_disjoint_timer_query_webgl2");
    res.extension.WEBGL_debug_shaders = sup.includes("WEBGL_debug_shaders");
    res.extension.OES_texture_float_linear = sup.includes("OES_texture_float_linear");
    res.extension.EXT_color_buffer_float = sup.includes("EXT_color_buffer_float");
    res.extension.EXT_float_blend = sup.includes("EXT_float_blend");
    res.extension.EXT_texture_filter_anisotropic = sup.includes("EXT_texture_filter_anisotropic");
    res.extension.WEBGL_lose_context = sup.includes("WEBGL_lose_context");
    res.pausaTF = ["pauseTransformFeedback", "resumeTransformFeedback"].map((n) => n in gl);
    res.ppIframe = window.__pp;
    // float32 blend: ¿funciona sin pedir EXT_float_blend tras pedir EXT_color_buffer_float? (5.7)
    return res;
  }, firmas);
  await page.close();
  // Contador del glosario
  const g = await browser.newPage();
  await g.goto("file:///Users/alex/Projects/shaders/modulos/08-anexos/04-glosario.html");
  await new Promise((r) => setTimeout(r, 2500));
  out.glosario = await g.evaluate(() => ({
    contador: document.querySelector(".ax-buscador .ax-cuenta").textContent,
    chips: [...document.querySelectorAll(".meta .chip")].map((c) => c.textContent),
    entradas: document.querySelectorAll("main .ax-entrada").length,
    remisiones: document.querySelectorAll("main .ax-entrada.ax-remision").length,
    visiblesNoRemision: [...document.querySelectorAll("main .ax-entrada:not(.ax-remision)")].filter((e) => !e.closest(".ax-oculto")).length,
  }));
  await g.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
