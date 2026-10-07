// coh-m7-gpu (sesión 4): dos comprobaciones de semántica en el M1 para la coherencia de 7.4 y 7.7.
//  1) Una textura incompleta leída en el VERTEX shader con texture() y con texelFetch: ¿(0, 0, 0, 1)?
//     (7.4 decía «texelFetch … devolvió ceros»; 7.5, 6.8 y A.2 dicen (0, 0, 0, 1).)
//  2) Los mensajes de ANGLE cuando #version 300 es no está en la primera línea, según lo que haya delante
//     (5.2 cita «must occur on the first line»; 7.7 cita «must occur before anything else, except for comments and white space»).
// Uso (con turno): node turnos.mjs --agente coh-m7-gpu --motivo "…" -- node estado/lab/s4-coh-m7-gpu-exp.mjs
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
    const out = {};
    const gl = document.getElementById("c").getContext("webgl2", { antialias: false });
    out.renderer = gl.getParameter(gl.RENDERER);
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return { s, ok: gl.getShaderParameter(s, gl.COMPILE_STATUS), log: gl.getShaderInfoLog(s) }; };
    // ---------- 1) textura incompleta en el vertex shader ----------
    const FS = "#version 300 es\nprecision highp float;\nflat in vec4 v_c;\nout vec4 o;\nvoid main(){ o = v_c; }";
    function leerVS(expr, tex) {
      const VS = "#version 300 es\nuniform highp sampler2D u_t;\nflat out vec4 v_c;\nvoid main(){ v_c = " + expr + "; gl_Position = vec4(0.0, 0.0, 0.0, 1.0); gl_PointSize = 1.0; }";
      const v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
      if (!v.ok || !f.ok) return { error: v.log + f.log };
      const p = gl.createProgram(); gl.attachShader(p, v.s); gl.attachShader(p, f.s); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return { error: gl.getProgramInfoLog(p) };
      gl.useProgram(p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(p, "u_t"), 0);
      gl.bindVertexArray(gl.createVertexArray());
      gl.viewport(0, 0, 1, 1); gl.clearColor(0.5, 0.5, 0.5, 0.5); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, 1);
      const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return Array.from(px);
    }
    const datos = new Uint8Array([255, 128, 64, 200, 255, 128, 64, 200, 255, 128, 64, 200, 255, 128, 64, 200]);
    const inc = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, inc);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos); // filtro por defecto NEAREST_MIPMAP_LINEAR, sin mipmaps
    const comp = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, comp);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, datos);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    out.vsCompletaTexture = leerVS("texture(u_t, vec2(0.25))", comp);
    out.vsCompletaFetch = leerVS("texelFetch(u_t, ivec2(1), 0)", comp);
    out.vsIncompletaTexture = leerVS("texture(u_t, vec2(0.25))", inc);
    out.vsIncompletaFetch = leerVS("texelFetch(u_t, ivec2(1), 0)", inc);
    out.glError = gl.getError();
    // ---------- 2) #version fuera de la primera línea ----------
    const CUERPO = "\nprecision highp float;\nout vec4 o;\nvoid main(){ o = vec4(1.0); }";
    const casos = {
      "linea_vacia_delante": "\n#version 300 es" + CUERPO,
      "comentario_linea_delante": "// hola\n#version 300 es" + CUERPO,
      "comentario_bloque_misma_linea": "/* hola */ #version 300 es" + CUERPO,
      "espacios_misma_linea": "   #version 300 es" + CUERPO,
      "codigo_delante": "#define X 1\n#version 300 es" + CUERPO,
      "declaracion_delante": "precision highp float;\n#version 300 es" + CUERPO,
      "version_duplicada_linea_57": "#version 300 es\n" + "\n".repeat(55) + "#version 300 es" + CUERPO,
    };
    out.version = {};
    for (const [k, src] of Object.entries(casos)) {
      const r = sh(gl.FRAGMENT_SHADER, src);
      out.version[k] = { ok: r.ok, log: (r.log || "").trim().split("\n").slice(0, 3).join(" | ") };
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 2));
} finally {
  await browser.close();
}
