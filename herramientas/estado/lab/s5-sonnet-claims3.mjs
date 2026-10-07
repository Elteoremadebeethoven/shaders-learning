// s5-sonnet-claims3.mjs — valores de límites citados en 5.1/5.5 y A.4 (Apple M1, Chrome, ANGLE/Metal)
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
  headless: "new",
});
try {
  const page = await browser.newPage();
  await page.goto("about:blank");
  const r = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const o = {};
    for (const n of ["MAX_TEXTURE_SIZE", "MAX_VERTEX_ATTRIBS", "MAX_VARYING_VECTORS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_FRAGMENT_UNIFORM_VECTORS",
      "MAX_TEXTURE_IMAGE_UNITS", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_DRAW_BUFFERS", "MAX_SAMPLES", "MAX_ELEMENT_INDEX", "MAX_COLOR_ATTACHMENTS"]) o[n] = gl.getParameter(gl[n]);
    o.ALIASED_POINT_SIZE_RANGE = Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE));
    o.ALIASED_LINE_WIDTH_RANGE = Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
    o.SAMPLES = gl.getParameter(gl.SAMPLES);
    o.DEPTH_BITS = gl.getParameter(gl.DEPTH_BITS);
    o.RENDERER = gl.getParameter(gl.RENDERER);
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
} finally { await browser.close(); }
