// s4-m7a: pruebas de los cambios de m7kit (sesión 4) en el Chrome del M1 (ANGLE/Metal).
// Uso: node s4-m7a-kit.mjs <ruta de kit.html>  (la página carga el kit viejo como M7viejo y el nuevo como M7)
// T1 DPR emulado (deviceScaleFactor 1/2/3) y DPR «real» (--force-device-scale-factor=2) · T2 fallar libera la GPU
// T3 esperaRestauracionMs · T4 fps y Calidad con frames de 300 ms · T5 Puntero antes del primer evento (bajo demanda)
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const PAG = "file://" + process.argv[2];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ARGS = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};

async function dpr(page, etiqueta) {
  return page.evaluate(async (etiqueta) => {
    const c = nuevoCanvas();
    const ro = await new Promise((res) => { const o = new ResizeObserver((e) => { const d = e[0].devicePixelContentBoxSize; res(d ? [d[0].inlineSize, d[0].blockSize] : null); o.disconnect(); }); o.observe(c, { box: 'device-pixel-content-box' }); });
    const r = { etiqueta, devicePixelRatio, roDisp: ro };
    for (const [nombre, K] of [['nuevo', M7], ['viejo', M7viejo]]) for (const dprMax of [2, 3]) {
      const cc = nuevoCanvas();
      const app = K.crearApp(cc, { dprMax, iniciar() {}, dibujar() {} });
      await new Promise((res) => setTimeout(res, 300));
      r[nombre + ' dprMax ' + dprMax] = app.ancho + '×' + app.alto;
      app.destruir(); cc.remove();
    }
    c.remove();
    return r;
  }, etiqueta);
}

let nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ARGS });
try {
  const page = await nav.newPage();
  page.on("pageerror", (e) => (out.pageerror = (out.pageerror || []).concat(e.message)));
  // ---------- T1: DPR emulado ----------
  out.T1 = [];
  for (const dsf of [1, 2, 3]) {
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: dsf });
    await page.goto(PAG, { waitUntil: "load" });
    out.T1.push(await dpr(page, "deviceScaleFactor " + dsf));
  }
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  await page.goto(PAG, { waitUntil: "load" });
  // ---------- T2: fallar ----------
  out.T2 = await page.evaluate(async () => {
    const r = {};
    // a) el shader no compila
    {
      const c = nuevoCanvas(); let enFallar = null, llamadas = 0;
      const app = M7.crearApp(c, {
        iniciar(gl) { GLKit.crearPrograma(gl, VS, FS.replace('o = ', 'o = noExiste + ')); },
        fallar(m, app) { llamadas++; enFallar = { perdidoDentro: app.gl.isContextLost(), version: app.gl.getParameter(app.gl.VERSION) }; },
      });
      await new Promise((res) => setTimeout(res, 200));
      r.noCompila = { llamadas, enFallar, perdidoDespues: app.gl.isContextLost(), activo: app.activo, motivo: (app.motivoFallo || '').split('\n')[0] };
      try { app.destruir(); app.destruir(); r.noCompila.destruirDosVeces = 'sin excepción'; } catch (e) { r.noCompila.destruirDosVeces = e.message; }
    }
    // b) excepción en dibujar
    {
      const c = nuevoCanvas(); let llamadas = 0; const e0 = errores.length; let iniciar = 0;
      const app = M7.crearApp(c, {
        iniciar(gl, app) { iniciar++; app.gpu = { p: GLKit.crearPrograma(gl, VS, FS), vao: gl.createVertexArray() }; },
        dibujar(gl, e, app) { if (app.reloj.t > 0.3) throw new Error('rota'); gl.useProgram(app.gpu.p); gl.bindVertexArray(app.gpu.vao); gl.drawArrays(gl.TRIANGLES, 0, 3); },
        fallar() { llamadas++; },
      });
      await new Promise((res) => setTimeout(res, 800));
      const f = app.frame; await new Promise((res) => setTimeout(res, 300));
      r.excepcion = { llamadas, erroresConsola: errores.length - e0, framesTras: app.frame - f, perdido: app.gl.isContextLost(), activo: app.activo };
    }
    // c) sin WebGL2
    {
      const c = nuevoCanvas(); c.getContext('2d'); let motivo = null;
      const app = M7.crearApp(c, { fallar(m) { motivo = m; } });
      try { app.destruir(); r.sinWebgl2 = { motivo, destruir: 'sin excepción' }; } catch (e) { r.sinWebgl2 = { motivo, destruir: e.message }; }
    }
    // d) comparación: el kit viejo deja el contexto vivo
    {
      const c = nuevoCanvas();
      const app = M7viejo.crearApp(c, { iniciar(gl) { GLKit.crearPrograma(gl, VS, FS.replace('o = ', 'o = noExiste + ')); }, fallar() {} });
      await new Promise((res) => setTimeout(res, 100));
      r.viejoPerdidoTrasFallar = app.gl.isContextLost();
    }
    return r;
  });
  // ---------- T3: esperaRestauracionMs ----------
  out.T3 = await page.evaluate(async () => {
    const r = {};
    for (const [nombre, espera, restaurarA] of [['no vuelve', 400, null], ['vuelve a tiempo', 1000, 300]]) {
      const c = nuevoCanvas(); let motivo = null, inicios = 0, perdidas = 0;
      const app = M7.crearApp(c, { esperaRestauracionMs: espera,
        iniciar(gl, app) { inicios++; app.gpu = { p: GLKit.crearPrograma(gl, VS, FS), vao: gl.createVertexArray() }; },
        dibujar(gl, e, app) { gl.useProgram(app.gpu.p); gl.bindVertexArray(app.gpu.vao); gl.drawArrays(gl.TRIANGLES, 0, 3); },
        alPerder() { perdidas++; }, fallar(m) { motivo = m; } });
      const ext = app.gl.getExtension('WEBGL_lose_context');
      await new Promise((res) => setTimeout(res, 200));
      ext.loseContext();
      if (restaurarA) setTimeout(() => ext.restoreContext(), restaurarA);
      await new Promise((res) => setTimeout(res, 1300));
      const f = app.frame; await new Promise((res) => setTimeout(res, 300));
      r[nombre] = { motivo, inicios, perdidas, framesTras: app.frame - f, activo: app.activo };
      app.destruir(); c.remove();
    }
    return r;
  });
  // ---------- T4: frames de 300 ms (bucle ocupado) ----------
  out.T4 = await page.evaluate(async () => {
    const r = {};
    for (const [nombre, K] of [['nuevo', M7], ['viejo', M7viejo]]) {
      const c = nuevoCanvas();
      const app = K.crearApp(c, { calidad: { min: 0.25 }, iniciar() {}, dibujar() { const t = performance.now(); while (performance.now() - t < 300); } });
      await new Promise((res) => setTimeout(res, 6000));
      r[nombre] = { fps: +app.fps.toFixed(2), msFrame: +app.msFrame.toFixed(1), escala: +app.calidad.escala.toFixed(3), cambios: app.calidad.cambios, frames: app.frame };
      app.destruir(); c.remove();
    }
    return r;
  });
  // ---------- T5: Puntero antes del primer evento, bajo demanda ----------
  out.T5 = await page.evaluate(async () => {
    const r = {};
    for (const [nombre, K] of [['nuevo', M7], ['viejo', M7viejo]]) {
      const c = nuevoCanvas('left:120px;top:90px');
      const p = new K.Puntero(c, { semivida: 0.08 });
      const app = K.crearApp(c, { bajoDemanda: true, iniciar() {}, actualizar(e, dt, app) {
        p.actualizar(app.reloj.dtReal);
        if (Math.abs(p.sx - p.x) + Math.abs(p.sy - p.y) > 0.05) app.pedirFrame();   // sin comprobar p.visto
      } });
      await new Promise((res) => setTimeout(res, 700));
      const f = app.frame; await new Promise((res) => setTimeout(res, 500));
      r[nombre] = { x: p.x, sx: p.sx, framesEn05s: app.frame - f };
      app.destruir(); c.remove();
    }
    return r;
  });
  // ---------- T6: bajoDemanda en caliente ----------
  out.T6 = await page.evaluate(async () => {
    const c = nuevoCanvas(); const o = { bajoDemanda: false, iniciar() {}, dibujar() {} };
    const app = M7.crearApp(c, o);
    const contar = async () => { const f = app.frame; await new Promise((res) => setTimeout(res, 400)); return app.frame - f; };
    const r = { continuo: await contar() };
    o.bajoDemanda = true; await new Promise((res) => setTimeout(res, 100)); r.trasPonerTrue = await contar();
    o.bajoDemanda = false; r.falseSinDespertar = await contar(); app.pedirFrame(); r.falseYpedirFrame = await contar();
    app.destruir(); return r;
  });
  out.erroresPagina = await page.evaluate(() => window.errores.length);
  await page.close();
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }

// ---------- T1b: DPR «real» (el navegador entero a 2×) ----------
nav = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: null, args: ARGS.concat(["--force-device-scale-factor=2", "--window-size=800,600"]) });
try {
  const page = await nav.newPage();
  await page.goto(PAG, { waitUntil: "load" });
  out.T1b = await dpr(page, "--force-device-scale-factor=2");
} catch (e) { out.errorT1b = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
