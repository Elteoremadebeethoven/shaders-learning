// s5-sonnet-lab2: ¿cuánto se ve el halo oscuro (5.7.2) con distintos sprites? Mide el mínimo de R/G/B del canvas.
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"], headless: "new",
});
try {
  const page = await browser.newPage();
  await page.setContent("<body></body>");
  const res = await page.evaluate(() => {
    const prueba = (dibujarSprite, premul, bg) => {
      const cv = document.createElement("canvas"); cv.width = 400; cv.height = 200;
      const g3 = cv.getContext("webgl2", { alpha: false, antialias: false });
      const sp = document.createElement("canvas"); sp.width = sp.height = 32; dibujarSprite(sp.getContext("2d"));
      const v = g3.createShader(g3.VERTEX_SHADER); g3.shaderSource(v, "#version 300 es\nout vec2 uv; void main(){ vec2 P[4]=vec2[4](vec2(0,0),vec2(1,0),vec2(0,1),vec2(1,1)); uv=P[gl_VertexID]; gl_Position=vec4((P[gl_VertexID]*1.6-0.8)*vec2(0.5,1.0),0,1);} "); g3.compileShader(v);
      const f = g3.createShader(g3.FRAGMENT_SHADER); g3.shaderSource(f, "#version 300 es\nprecision highp float; uniform sampler2D t; in vec2 uv; out vec4 c; void main(){ c = texture(t, uv);} "); g3.compileShader(f);
      const pr = g3.createProgram(); g3.attachShader(pr, v); g3.attachShader(pr, f); g3.linkProgram(pr); g3.useProgram(pr);
      const t = g3.createTexture(); g3.bindTexture(g3.TEXTURE_2D, t);
      g3.pixelStorei(g3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
      g3.texImage2D(g3.TEXTURE_2D, 0, g3.RGBA, g3.RGBA, g3.UNSIGNED_BYTE, sp);
      g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_MIN_FILTER, g3.LINEAR); g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_MAG_FILTER, g3.LINEAR);
      g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_WRAP_S, g3.CLAMP_TO_EDGE); g3.texParameteri(g3.TEXTURE_2D, g3.TEXTURE_WRAP_T, g3.CLAMP_TO_EDGE);
      g3.viewport(0, 0, 400, 200); g3.clearColor(...bg, 1); g3.clear(g3.COLOR_BUFFER_BIT);
      g3.bindVertexArray(g3.createVertexArray()); g3.enable(g3.BLEND);
      g3.blendFunc(premul ? g3.ONE : g3.SRC_ALPHA, g3.ONE_MINUS_SRC_ALPHA);
      g3.drawArrays(g3.TRIANGLE_STRIP, 0, 4);
      const all = new Uint8Array(400 * 200 * 4); g3.readPixels(0, 0, 400, 200, g3.RGBA, g3.UNSIGNED_BYTE, all);
      let minR = 255, minG = 255, minB = 255; for (let i = 0; i < all.length; i += 4) { minR = Math.min(minR, all[i]); minG = Math.min(minG, all[i + 1]); minB = Math.min(minB, all[i + 2]); }
      return [minR, minG, minB];
    };
    const gradiente = (r0, r1) => (c) => { const gr = c.createRadialGradient(16, 16, r0, 16, 16, r1); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, 32, 32); };
    const estrella = (blur) => (c) => { c.fillStyle = "#fff"; c.shadowColor = "#fff"; c.shadowBlur = blur; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 12; c.lineTo(16 + r * Math.cos(a), 16 + r * Math.sin(a)); } c.fill(); };
    const disco = (r) => (c) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(16, 16, r, 0, 7); c.fill(); };
    const bg572 = [0.93, 0.9, 0.82], bg573 = [0.95, 0.85, 0.55];
    const o = {};
    for (const [nombre, f, bg] of [["5.7.2 gradiente 8→14 (actual)", gradiente(8, 14), bg572], ["gradiente 11→13", gradiente(11, 13), bg572], ["gradiente 12→14", gradiente(12, 14), bg572], ["disco duro r=12", disco(12), bg572],
        ["5.7.3 estrella blur 4 (actual)", estrella(4), bg573], ["estrella blur 0", estrella(0), bg573], ["estrella blur 1", estrella(1), bg573]]) {
      o[nombre] = { fondo: bg.map((x) => Math.round(x * 255)), directo: prueba(f, false, bg), premultiplicado: prueba(f, true, bg) };
    }
    return o;
  });
  console.log(JSON.stringify(res, null, 1));
} finally { await browser.close(); }
