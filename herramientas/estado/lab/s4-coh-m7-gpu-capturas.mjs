// coh-m7-gpu (sesión 4): capturas de los párrafos y cajas editados en 7.4, 7.5 y 7.7 (oscuro y claro a 1280 px; claro a 390 px).
// Uso (con turno): node turnos.mjs --agente coh-m7-gpu --motivo "…" -- node estado/lab/s4-coh-m7-gpu-capturas.mjs <dir>
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
import fs from "fs";

const dir = process.argv[2] || "/tmp/coh-m7-gpu-cap";
fs.mkdirSync(dir, { recursive: true });
const R = "file:///Users/alex/Projects/shaders/modulos/07-integracion/";
const objetivos = {
  "04-vertex-animacion.html": [
    ["intro", "nubes con ruido"], ["metodo", "del framebuffer de la última pasada"], ["lineas", "aquí no hay mipmaps que lo salven"],
    ["flat", "Con índices, «el último» es el tercero"], ["alias", "Es el muaré de los patrones"], ["cache", "Seis entre dos son tres"],
    ["cpu", "lo medimos: con el plano desplazado"], ["texel", "devolvió <code>(0, 0, 0, 1)</code> en el texel (0, 0)"],
    ["plano", "es <a href=\"../05-webgl/05-texturas.html#m5-textura-negra\">"], ["eps", "que solo sirve si el periodo es múltiplo"],
  ],
  "05-particulas-gpu.html": [
    ["points", "Pero arrastra las rarezas"], ["orphan", "que allí, en un bucle normal"], ["centro", "Sea cual sea el texel"],
    ["half", "deja de avanzar a partir de 2²⁴"], ["bucle", "es <a href=\"../05-webgl/08-framebuffers.html#m5-bucle-realimentacion\">"],
    ["divisor", "Es el reverso de"], ["aditivo", "ahora sumando en lugar de restando"], ["discard", "respeta el estado como cualquier dibujo"],
    ["humo", "Es el truco «Brillos y transparencia"],
  ],
  "07-siguientes-pasos.html": [
    ["version", "Es el pariente de"], ["oscura", "con Three.js haciendo una de las conversiones"], ["mod", "en la otra dirección: allí el"],
    ["yinv", "El efecto del ratón va al revés en vertical"], ["culling", "la solución es la doble implementación"],
  ],
};
const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const informe = [];
try {
  for (const [tema, ancho] of [["dark", 1280], ["light", 1280], ["light", 390]]) {
    for (const [archivo, lista] of Object.entries(objetivos)) {
      const page = await browser.newPage();
      await page.setViewport({ width: ancho, height: 900, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument((t) => { try { localStorage.setItem("curso-tema", JSON.stringify(t)); } catch (e) {} }, tema);
      await page.goto(R + archivo, { waitUntil: "load" });
      await new Promise((r) => setTimeout(r, 1500));
      for (const [nombre, trozo] of lista) {
        const caja = await page.evaluate((trozo) => {
          const els = [...document.querySelectorAll("main p, main li, main .callout")];
          const el = els.find((e) => e.innerHTML.includes(trozo) && !e.querySelector("p, li")) || els.find((e) => e.innerHTML.includes(trozo));
          if (!el) return null;
          const c = el.closest(".callout") || el;
          for (let d = c.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
          document.documentElement.style.scrollBehavior = "auto";
          c.scrollIntoView({ block: "start", behavior: "instant" });
          const r = c.getBoundingClientRect();
          if (r.top > innerHeight || r.bottom < 0) return { fuera: true, top: r.top };
          const katexMal = c.querySelectorAll(".katex-error").length;
          return { x: Math.max(0, r.left - 4) + scrollX, y: Math.max(0, r.top - 4) + scrollY, w: Math.min(r.width + 8, innerWidth), h: Math.min(r.height + 8, 880), katexMal, scrollW: document.documentElement.scrollWidth };
        }, trozo);
        if (!caja) { informe.push(`✗ ${tema}/${ancho} ${archivo} ${nombre}: no encontrado`); continue; }
        if (caja.fuera || !(caja.h > 2 && caja.w > 2)) { informe.push(`✗ ${tema}/${ancho} ${archivo} ${nombre}: tamaño ${caja.w}×${caja.h}`); continue; }
        await new Promise((r) => setTimeout(r, 200));
        const f = `${dir}/${tema}-${ancho}-${archivo.slice(0, 2)}-${nombre}.png`;
        await page.screenshot({ path: f, clip: { x: caja.x, y: caja.y, width: caja.w, height: caja.h }, captureBeyondViewport: false });
        informe.push(`✓ ${tema}/${ancho} ${archivo} ${nombre} katexMal=${caja.katexMal} scrollW=${caja.scrollW}`);
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(informe.join("\n"));
