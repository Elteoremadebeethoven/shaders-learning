// coh-m7-gpu (sesión 4): ¿qué devuelve texelFetch con una textura INCOMPLETA en el M1? (y texture(), para comparar)
// La especificación de WebGL 2.0 («Texel Fetches») dice (0, 0, 0, 1). El primer experimento (s4-coh-m7-gpu-exp.mjs)
// dio (0, 0, 0, 0) con texelFetch en el vertex shader y (0, 0, 0, 1) con texture().
// Aquí: cuatro causas de «incompleta» (o sin textura) × texture()/texelFetch × vertex/fragment shader, dibujando en un FBO
// RGBA8 de 1 × 1 (no en el canvas) y repitiendo cada lectura con el texto del shader distinto (la caché de programas no influye).
// Uso (con turno): node turnos.mjs --agente coh-m7-gpu --motivo "…" -- node estado/lab/s4-coh-m7-gpu-exp2.mjs
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage();
  await page.setContent("<canvas id=c width=1 height=1></canvas>");
  const res = await page.evaluate(() => {
    const out = { filas: [] };
    const gl = document.getElementById("c").getContext("webgl2", { antialias: false });
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    out.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    out.version = navigator.userAgent.match(/Chrome\/[\d.]+/)[0];
    // destino: FBO RGBA8 1×1
    const destino = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, destino);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, destino, 0);
    out.fbo = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    const vao = gl.createVertexArray();
    let n = 0;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    function leer(etapa, expr, tex) {
      n++;
      const VS_VS = `#version 300 es\n// ${n}\nuniform highp sampler2D u_t;\nflat out vec4 v_c;\nvoid main(){ v_c = ${expr}; gl_Position = vec4(0.0, 0.0, 0.0, 1.0); gl_PointSize = 1.0; }`;
      const FS_VS = `#version 300 es\nprecision highp float;\nflat in vec4 v_c;\nout vec4 o;\nvoid main(){ o = v_c; }`;
      const VS_FS = `#version 300 es\n// ${n}\nvoid main(){ gl_Position = vec4(0.0, 0.0, 0.0, 1.0); gl_PointSize = 1.0; }`;
      const FS_FS = `#version 300 es\nprecision highp float;\nuniform highp sampler2D u_t;\nout vec4 o;\nvoid main(){ o = ${expr}; }`;
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, etapa === "VS" ? VS_VS : VS_FS));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, etapa === "VS" ? FS_VS : FS_FS));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(p, "u_t"), 0);
      gl.bindVertexArray(vao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, 1, 1); gl.clearColor(0.5, 0.5, 0.5, 0.5); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, 1);
      const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return Array.from(px).join(",");
    }
    const rgba8 = new Uint8Array(16); for (let i = 0; i < 16; i += 4) rgba8.set([255, 128, 64, 200], i);
    const f32 = new Float32Array(16); for (let i = 0; i < 16; i += 4) f32.set([1, 0.5, 0.25, 0.8], i);
    function tex8(minFiltro, conMipmaps) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba8);
      if (conMipmaps) gl.generateMipmap(gl.TEXTURE_2D);
      if (minFiltro) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFiltro);
      return t;
    }
    function tex32(filtro) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 2, 2, 0, gl.RGBA, gl.FLOAT, f32);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
      return t;
    }
    out.floatLinearPedida = false; // no se pide OES_texture_float_linear
    const casos = [
      ["RGBA8 completa (NEAREST)", tex8(gl.NEAREST)],
      ["RGBA8 incompleta: filtro por defecto sin mipmaps", tex8(null)],
      ["RGBA8 incompleta: LINEAR_MIPMAP_LINEAR sin mipmaps", tex8(gl.LINEAR_MIPMAP_LINEAR)],
      ["RGBA8 con mipmaps y filtro por defecto (completa)", tex8(null, true)],
      ["RGBA32F NEAREST (completa)", tex32(gl.NEAREST)],
      ["RGBA32F LINEAR sin OES_texture_float_linear (incompleta)", tex32(gl.LINEAR)],
      ["unidad sin textura (null)", null],
    ];
    for (const [nombre, tex] of casos) {
      const fila = { caso: nombre };
      for (const etapa of ["VS", "FS"]) {
        fila[etapa + " texture"] = leer(etapa, "texture(u_t, vec2(0.25))", tex);
        fila[etapa + " texelFetch"] = leer(etapa, "texelFetch(u_t, ivec2(1), 0)", tex);
        fila[etapa + " texelFetch (2.ª)"] = leer(etapa, "texelFetch(u_t, ivec2(0), 0)", tex);
      }
      out.filas.push(fila);
    }
    out.glError = gl.getError();
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
} finally {
  await browser.close();
}
