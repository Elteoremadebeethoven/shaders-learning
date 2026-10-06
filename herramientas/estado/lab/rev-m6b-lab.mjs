// Laboratorio GLSL para las lecciones 6.6–6.10 (Chrome headless, GPU real vía ANGLE/Metal).
// Uso:
//   import { abrir } from "./lab.mjs";
//   const L = await abrir();
//   const r = await L.probar({ fs, w, h, uniforms, texturas, u8 });   // → { ok, log, pix: Float32 RGBA… }
//   await L.png({ fs, w, h, uniforms, texturas }, "/ruta/salida.png");
//   const ms = await L.tiempo({ fs, w, h, reps, uniforms, texturas }); // ms por dibujo (media)
//   await L.cerrar();
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire("/private/tmp/claude-501/-Users-alex-Projects-shaders/cb453cd9-477f-4de6-992a-174439234b23/scratchpad/qa/package.json");
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function montar() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  document.body.appendChild(c);
  const gl = c.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  window.__gl = gl;
  gl.getExtension("EXT_color_buffer_float");
  const VS300 = "#version 300 es\nin vec2 a_pos;\nout vec2 v_uv;\nvoid main() {\n  v_uv = a_pos * 0.5 + 0.5;\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}\n";
  const VS100 = "attribute vec2 a_pos;\nvarying vec2 v_uv;\nvoid main() {\n  v_uv = a_pos * 0.5 + 0.5;\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}\n";
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const cacheTex = {};
  function textura(spec) {
    if (cacheTex[spec]) return cacheTex[spec];
    if (spec.startsWith("niveles")) {
      // Textura de 512 px cuyo nivel de mipmap k es un color sólido distinto (visualiza el LOD)
      const cols = [[255,0,0],[255,128,0],[255,255,0],[0,255,0],[0,255,255],[0,0,255],[128,0,255],[255,0,255],[255,255,255],[128,128,128]];
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      for (let k = 0, n = 512; n >= 1; k++, n >>= 1) {
        const d = new Uint8Array(n * n * 4);
        for (let i = 0; i < n * n; i++) { d[i*4] = cols[k][0]; d[i*4+1] = cols[k][1]; d[i*4+2] = cols[k][2]; d[i*4+3] = 255; }
        gl.texImage2D(gl.TEXTURE_2D, k, gl.RGBA8, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, spec.includes("nearest") ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const w = spec.includes("clamp") ? gl.CLAMP_TO_EDGE : gl.REPEAT;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
      return (cacheTex[spec] = t);
    }
    const [nombre, ...ops] = spec.split(":").map((s) => s.trim());
    const nearest = ops.includes("nearest"), clamp = ops.includes("clamp"), mip = !ops.includes("nomip");
    const tam = +(ops.find((o) => /^\d+$/.test(o)) || 512);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, window.Texturas.crear(nombre, tam));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? (nearest ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR) : (nearest ? gl.NEAREST : gl.LINEAR));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
    return (cacheTex[spec] = t);
  }
  let uid = 0;
  const sesion = Math.random().toString(36).slice(2);
  function programa(fsSrc, vsSrc) {
    const r = { ok: false, log: "" };
    const vs = vsSrc || (/^#version\s+300\s+es/.test(fsSrc) ? VS300 : VS100);
    // Comentario único tras la primera línea: evita que la caché de programas devuelva un binario
    // compilado antes (la caché puede perder el efecto de isnan sobre el fast math).
    if (!window.__sinUid) {
      const i = fsSrc.indexOf("\n");
      const tag = "// uid " + sesion + " " + (uid++);
      fsSrc = /^#version/.test(fsSrc) ? fsSrc.slice(0, i + 1) + tag + "\n" + fsSrc.slice(i + 1) : tag + "\n" + fsSrc;
    }
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fsSrc);
    r.log = (gl.getShaderInfoLog(f) || "").trim();
    if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) { r.log = "VS: " + gl.getShaderInfoLog(v); return r; }
    if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) return r;
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "a_pos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { r.log += " LINK: " + gl.getProgramInfoLog(p); return r; }
    r.ok = true; r.p = p;
    return r;
  }
  function ponerUniforms(p, t) {
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    const vals = Object.assign({ u_resolution: [t.w, t.h], u_time: t.tiempo || 0, u_frame: t.frame || 0, u_mouse: t.raton || [t.w / 2, t.h / 2],
      iResolution: [t.w, t.h, 1], iTime: t.tiempo || 0, iMouse: t.iMouse || [0, 0, 0, 0] }, t.uniforms || {});
    let unidad = 0;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const nombre = info.name.replace(/\[0\]$/, "");
      const loc = gl.getUniformLocation(p, info.name);
      const T = info.type;
      if (T === gl.SAMPLER_2D) {
        const m = nombre.match(/(\d+)$/);
        const k = m ? +m[1] : unidad;
        gl.uniform1i(loc, k); unidad++;
        continue;
      }
      if (!(nombre in vals)) continue;
      let v = vals[nombre];
      if (T === gl.FLOAT) gl.uniform1f(loc, v);
      else if (T === gl.FLOAT_VEC2) gl.uniform2fv(loc, v.length === 2 ? v : [v[0], v[1]]);
      else if (T === gl.FLOAT_VEC3) gl.uniform3fv(loc, v.length === 3 ? v : [v[0], v[1], v[2] || 0]);
      else if (T === gl.FLOAT_VEC4) gl.uniform4fv(loc, v.length === 4 ? v : [v[0], v[1], v[2] || 0, v[3] || 0]);
      else if (T === gl.INT || T === gl.BOOL) gl.uniform1i(loc, v);
      else if (T === gl.UNSIGNED_INT) gl.uniform1ui(loc, v);
      else if (T === gl.FLOAT_MAT2) gl.uniformMatrix2fv(loc, false, v);
    }
  }
  function atarTexturas(t) {
    (t.texturas || []).forEach((spec, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, textura(spec)); });
  }
  window.__probar = (t) => {
    const w = t.w || 1, h = t.h || 1;
    const pr = programa(t.fs, t.vs);
    if (!pr.ok) return { ok: false, log: pr.log };
    gl.useProgram(pr.p);
    ponerUniforms(pr.p, Object.assign({ w, h }, t));
    atarTexturas(t);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const u8 = !!t.u8;
    gl.texImage2D(gl.TEXTURE_2D, 0, u8 ? gl.RGBA8 : gl.RGBA32F, w, h, 0, gl.RGBA, u8 ? gl.UNSIGNED_BYTE : gl.FLOAT, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const buf = u8 ? new Uint8Array(w * h * 4) : new Float32Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, u8 ? gl.UNSIGNED_BYTE : gl.FLOAT, buf);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex); gl.deleteProgram(pr.p);
    return { ok: true, log: pr.log, pix: Array.from(buf) };
  };
  window.__png = (t) => {
    const w = t.w || 256, h = t.h || 256;
    c.width = w; c.height = h;
    const pr = programa(t.fs, t.vs);
    if (!pr.ok) return { ok: false, log: pr.log };
    gl.useProgram(pr.p);
    ponerUniforms(pr.p, Object.assign({ w, h }, t));
    atarTexturas(t);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.deleteProgram(pr.p);
    return { ok: true, log: pr.log, url: c.toDataURL("image/png") };
  };
  window.__tiempo = (t) => {
    const w = t.w || 1024, h = t.h || 1024, reps = t.reps || 50;
    const pr = programa(t.fs, t.vs);
    if (!pr.ok) return { ok: false, log: pr.log };
    gl.useProgram(pr.p);
    ponerUniforms(pr.p, Object.assign({ w, h }, t));
    atarTexturas(t);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);
    const px = new Uint8Array(4);
    for (let i = 0; i < 5; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < reps; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const ms = (performance.now() - t0) / reps;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex); gl.deleteProgram(pr.p);
    return { ok: true, ms };
  };

  window.__tiempoq = async (t) => {
    const w = t.w || 1024, h = t.h || 1024, reps = t.reps || 10;
    const pr = programa(t.fs, t.vs);
    if (!pr.ok) return { ok: false, log: pr.log };
    gl.useProgram(pr.p);
    ponerUniforms(pr.p, Object.assign({ w, h }, t));
    atarTexturas(t);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);
    const px = new Uint8Array(4);
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    for (let i = 0; i < 3; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.getParameter(ext.GPU_DISJOINT_EXT);
    const qs = [];
    for (let i = 0; i < reps; i++) {
      const q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      qs.push(q);
    }
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const res = [];
    for (const q of qs) {
      let n = 0;
      while (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && n++ < 2000) await new Promise((r) => setTimeout(r, 2));
      res.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
    }
    const disj = gl.getParameter(ext.GPU_DISJOINT_EXT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tex); gl.deleteProgram(pr.p);
    res.sort((a, b) => a - b);
    return { ok: true, ms: res[Math.floor(res.length / 2)], min: res[0], max: res[res.length - 1], disj };
  };
  // Medida robusta en GPU de teselas (Apple): cada repetición va a su propia pasada de render
  // (se alternan dos framebuffers y se limpia al empezar), así la eliminación de superficies ocultas
  // (HSR) no puede descartar los dibujos anteriores. Devuelve la mediana de varias tandas.
  window.__tiempo2 = (t) => {
    const w = t.w || 2048, h = t.h || 2048, reps = t.reps || 10, tandas = t.tandas || 5;
    const pr = programa(t.fs, t.vs);
    if (!pr.ok) return { ok: false, log: pr.log };
    gl.useProgram(pr.p);
    ponerUniforms(pr.p, Object.assign({ w, h }, t));
    atarTexturas(t);
    const fbs = [], texs = [];
    for (let k = 0; k < 2; k++) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      fbs.push(fb); texs.push(tex);
    }
    gl.activeTexture(gl.TEXTURE0);
    atarTexturas(t);
    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(vao);
    const px = new Uint8Array(4);
    const pasada = (k) => { gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[k % 2]); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    for (let i = 0; i < 3; i++) pasada(i);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const res = [];
    for (let k = 0; k < tandas; k++) {
      const t0 = performance.now();
      for (let i = 0; i < reps; i++) pasada(i);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      res.push((performance.now() - t0) / reps);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbs.forEach((f) => gl.deleteFramebuffer(f)); texs.forEach((x) => gl.deleteTexture(x)); gl.deleteProgram(pr.p);
    res.sort((a, b) => a - b);
    return { ok: true, ms: res[Math.floor(res.length / 2)], min: res[0], max: res[res.length - 1] };
  };
  // Solo compilar (y enlazar): devuelve estado y registro del compilador
  window.__compilar = (t) => {
    const pr = programa(t.fs, t.vs);
    if (pr.p) gl.deleteProgram(pr.p);
    return { ok: pr.ok, log: pr.log };
  };
  window.__precision = () => {
    const out = {};
    for (const [ns, st] of [["VERTEX", gl.VERTEX_SHADER], ["FRAGMENT", gl.FRAGMENT_SHADER]])
      for (const tipo of ["LOW_FLOAT", "MEDIUM_FLOAT", "HIGH_FLOAT", "LOW_INT", "MEDIUM_INT", "HIGH_INT"]) {
        const f = gl.getShaderPrecisionFormat(st, gl[tipo]);
        out[ns + " " + tipo] = [f.rangeMin, f.rangeMax, f.precision];
      }
    return out;
  };
  // Pruebas en un contexto WebGL1 aparte (extensión de derivadas)
  window.__webgl1 = (fsSrc, pedirExt) => {
    const c1 = document.createElement("canvas");
    const g1 = c1.getContext("webgl");
    if (!g1) return { error: "sin webgl1" };
    const ext = pedirExt ? g1.getExtension("OES_standard_derivatives") : null;
    const s = g1.createShader(g1.FRAGMENT_SHADER); g1.shaderSource(s, fsSrc); g1.compileShader(s);
    return { extension: !!ext, ok: g1.getShaderParameter(s, g1.COMPILE_STATUS), log: (g1.getShaderInfoLog(s) || "").trim() };
  };
  window.__extWebgl2 = () => !!gl.getExtension("OES_standard_derivatives");
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
}

export async function abrir(opciones = {}) {
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
  const page = await nav.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ path: "/Users/alex/Projects/shaders/assets/js/texturas.js" });
  const gpu = await page.evaluate(montar);
  if (!opciones.silencio) console.error("GPU:", gpu);
  return {
    page, gpu,
    probar: (t) => page.evaluate((t) => window.__probar(t), t),
    tiempo: (t) => page.evaluate((t) => window.__tiempo(t), t),
    tiempoq: (t) => page.evaluate((t) => window.__tiempoq(t), t),
    compilar: (t) => page.evaluate((t) => window.__compilar(t), t),
    tiempo2: (t) => page.evaluate((t) => window.__tiempo2(t), t),
    precision: () => page.evaluate(() => window.__precision()),
    webgl1: (fs, ext) => page.evaluate((fs, ext) => window.__webgl1(fs, ext), fs, ext),
    extWebgl2: () => page.evaluate(() => window.__extWebgl2()),
    async png(t, ruta) {
      const r = await page.evaluate((t) => window.__png(t), t);
      if (r.ok) fs.writeFileSync(ruta, Buffer.from(r.url.split(",")[1], "base64"));
      return { ok: r.ok, log: r.log };
    },
    cerrar: () => nav.close(),
  };
}
