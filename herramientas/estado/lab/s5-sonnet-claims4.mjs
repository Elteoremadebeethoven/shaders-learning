// s5-sonnet-claims4.mjs — FinalizationRegistry de texturas (5.10), lecturas tras la presentación (5.1) y punto recortado (5.3).
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  headless: "new",
});
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><body><canvas id=c width=64 height=64></canvas><canvas id=p width=200 height=200></canvas>`);
  const r = await page.evaluate(async () => {
    const o = {};
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    // --- 5.1: lecturas del canvas WebGL tras la presentación
    const c = document.getElementById("c");
    const gl = c.getContext("webgl2");
    gl.clearColor(0, 0, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    // en el mismo task:
    const v2 = document.createElement("canvas"); v2.width = v2.height = 64; const x2 = v2.getContext("2d");
    x2.drawImage(c, 0, 0); o.drawImageMismoTask = Array.from(x2.getImageData(1, 1, 1, 1).data);
    await raf2();
    x2.clearRect(0, 0, 64, 64); x2.drawImage(c, 0, 0); o.drawImageTrasPresentar = Array.from(x2.getImageData(1, 1, 1, 1).data);
    const blob = await new Promise((r) => c.toBlob(r));
    const bm = await createImageBitmap(blob); x2.clearRect(0, 0, 64, 64); x2.drawImage(bm, 0, 0); o.toBlobTrasPresentar = Array.from(x2.getImageData(1, 1, 1, 1).data);
    const bm2 = await createImageBitmap(c); x2.clearRect(0, 0, 64, 64); x2.drawImage(bm2, 0, 0); o.createImageBitmapTrasPresentar = Array.from(x2.getImageData(1, 1, 1, 1).data);
    // texImage2D en otro contexto
    const g2 = document.createElement("canvas").getContext("webgl2"); const t = g2.createTexture(); g2.bindTexture(g2.TEXTURE_2D, t);
    g2.texImage2D(g2.TEXTURE_2D, 0, g2.RGBA, g2.RGBA, g2.UNSIGNED_BYTE, c);
    const fb = g2.createFramebuffer(); g2.bindFramebuffer(g2.FRAMEBUFFER, fb); g2.framebufferTexture2D(g2.FRAMEBUFFER, g2.COLOR_ATTACHMENT0, g2.TEXTURE_2D, t, 0);
    const px = new Uint8Array(4); g2.readPixels(1, 1, 1, 1, g2.RGBA, g2.UNSIGNED_BYTE, px); o.texImage2DTrasPresentar = Array.from(px);
    // --- 5.3: punto con centro fuera del canvas
    const p = document.getElementById("p"); const gp = p.getContext("webgl2", { alpha: false, antialias: false });
    const prog = gp.createProgram();
    for (const [tipo, src] of [[gp.VERTEX_SHADER, "#version 300 es\nvoid main(){ gl_Position = vec4(-1.1, 0.0, 0.0, 1.0); gl_PointSize = 50.0; }"], [gp.FRAGMENT_SHADER, "#version 300 es\nprecision highp float; out vec4 c; void main(){ c = vec4(1,0,0,1); }"]]) {
      const s = gp.createShader(tipo); gp.shaderSource(s, src); gp.compileShader(s); gp.attachShader(prog, s);
    }
    gp.linkProgram(prog); gp.useProgram(prog); gp.bindVertexArray(gp.createVertexArray());
    gp.clearColor(0, 0, 0, 1); gp.clear(gp.COLOR_BUFFER_BIT);
    gp.drawArrays(gp.POINTS, 0, 1);
    const q = new Uint8Array(4); gp.readPixels(5, 100, 1, 1, gp.RGBA, gp.UNSIGNED_BYTE, q); o.puntoFueraPixelX5 = Array.from(q);
    // --- 5.10: FinalizationRegistry de 30 texturas de 4 MB
    const gt = document.createElement("canvas").getContext("webgl2");
    let recogidas = 0;
    const reg = new FinalizationRegistry(() => { recogidas++; });
    (function crear() {
      for (let i = 0; i < 30; i++) {
        const tx = gt.createTexture(); gt.bindTexture(gt.TEXTURE_2D, tx);
        gt.texImage2D(gt.TEXTURE_2D, 0, gt.RGBA8, 1024, 1024, 0, gt.RGBA, gt.UNSIGNED_BYTE, null);
        reg.register(tx, i);
      }
      gt.bindTexture(gt.TEXTURE_2D, null);
    })();
    gt.finish();
    await esperar(6000);
    o.recogidasTras6s = recogidas;
    // generar basura de JavaScript
    const t0 = performance.now(); let basura = [];
    for (let k = 0; k < 400 && recogidas < 30; k++) {
      for (let j = 0; j < 20000; j++) basura.push({ a: j, b: [j, j + 1] });
      if (basura.length > 400000) basura = [];
      await esperar(5);
    }
    o.recogidasTrasBasura = recogidas; o.msBasura = Math.round(performance.now() - t0);
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
} finally { await browser.close(); }
