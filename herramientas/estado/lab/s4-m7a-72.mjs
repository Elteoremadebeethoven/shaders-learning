// s4-m7a: afirmaciones medidas de 7.2, repetidas en el M1 (Chrome 154, ANGLE/Metal, headless, entrada sintética por CDP).
// Uso: node s4-m7a-72.mjs <dir con eventos.html, eventos-sinraw.html, scrollgl.html>
// E1 coalescencia de pointermove (250 Hz, ~1000 Hz, de golpe; con y sin listener de pointerrawupdate) y cuándo llegan
// E2 eventos discretos (pointerdown/up) respecto al rAF · E3 scroll (rueda con el ratón quieto) respecto al rAF
// E4 coste de getBoundingClientRect() con el layout limpio · E5 MAX_FRAGMENT_UNIFORM_VECTORS
// E6 canvas fixed frente a canvas dentro del contenido durante un gesto táctil de scroll a 1500 px/s (screencast)
import puppeteer from "/Users/alex/Projects/shaders/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.argv[2] + "/";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const out = { version: await nav.version() };
const med = (v) => { const s = v.slice().sort((a, b) => a - b); return s.length ? +s[s.length >> 1].toFixed(2) : null; };
try {
  // ---------- E1 ----------
  out.E1 = {};
  for (const archivo of ["eventos.html", "eventos-sinraw.html"]) {
    const page = await nav.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + archivo); await dormir(300);
    const c = await page.target().createCDPSession();
    await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 150 }); await dormir(300);
    for (const [nombre, n, cada] of [["250Hz", 40, 4], ["1000Hz", 120, 1], ["de_golpe", 60, 0]]) {
      await page.evaluate(() => { window.reg = []; window.rafT = []; });
      const t0 = Date.now();
      if (cada) for (let i = 0; i < n; i++) { c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + (i % 100) * 5, y: 200 + (i % 7) }); await dormir(cada); }
      else await Promise.all(Array.from({ length: n }, (_, i) => c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + i * 5, y: 220 + (i % 3) })));
      const dur = Date.now() - t0;
      await dormir(400);
      const r = await page.evaluate(() => ({ reg: window.reg, rafT: window.rafT }));
      const rafDe = Object.fromEntries(r.rafT.map(([f, now]) => [f, now]));
      const pm = r.reg.filter((e) => e.tipo === "pointermove"), raw = r.reg.filter((e) => e.tipo === "pointerrawupdate");
      const porFrame = {}; for (const e of pm) porFrame[e.frame] = (porFrame[e.frame] || 0) + 1;
      const v = Object.values(porFrame);
      const antes = pm.map((e) => rafDe[e.frame + 1] - e.t).filter((x) => x >= 0);
      const antesRaw = raw.map((e) => rafDe[e.frame + 1] - e.t).filter((x) => x >= 0);
      out.E1[archivo + " " + nombre] = { enviados: n, msEnvio: dur, pointermove: pm.length, framesConEventos: v.length, porFrame: v.join(","), maxPorFrame: Math.max(...v),
        sumaCoalescidos: pm.reduce((s, e) => s + e.n, 0), rawupdate: raw.length,
        msAntesDelRaf: { min: +Math.min(...antes).toFixed(2), mediana: med(antes), max: +Math.max(...antes).toFixed(2) },
        rawMsAntesDelRaf: antesRaw.length ? { mediana: med(antesRaw), max: +Math.max(...antesRaw).toFixed(2) } : null };
    }
    // ---------- E2 (solo en la página sin raw) ----------
    if (archivo === "eventos-sinraw.html") {
      const filas = [];
      for (let rep = 0; rep < 10; rep++) {
        await page.evaluate(() => { window.reg = []; });
        await dormir(7 + rep);
        c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 100 + rep, y: 200 }); await dormir(2);
        c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 102 + rep, y: 200, button: "left", clickCount: 1 }); await dormir(2);
        c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 102 + rep, y: 200, button: "left", clickCount: 1 }); await dormir(100);
        filas.push(await page.evaluate(() => {
          const rafDe = Object.fromEntries(window.rafT.map(([f, now]) => [f, now]));
          return window.reg.filter((e) => /pointer(move|down|up)/.test(e.tipo)).map((e) => e.tipo.slice(7) + " " + ((rafDe[e.frame + 1] || NaN) - e.t).toFixed(1));
        }));
      }
      out.E2_discretos_msAntesDelRaf = filas.map((f) => f.join(" | "));
      // ---------- E3: rueda con el ratón quieto ----------
      await page.evaluate(() => { window.reg = []; window.rafT = []; scrollTo(0, 0); });
      await dormir(200);
      for (let i = 0; i < 12; i++) { await c.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 300, y: 300, deltaX: 0, deltaY: 60 }); await dormir(120); }
      await dormir(300);
      out.E3_scroll = await page.evaluate(() => {
        const rafDe = Object.fromEntries(window.rafT.map(([f, now]) => [f, now]));
        const syDe = Object.fromEntries(window.rafT.map(([f, now, t, sy]) => [f, sy]));
        const sc = window.reg.filter((e) => e.tipo === "scroll");
        return { n: sc.length, msAntesDelRaf: sc.map((e) => +((rafDe[e.frame + 1] || NaN) - e.t).toFixed(2)),
                 mismoScrollYqueElRaf: sc.filter((e) => syDe[e.frame + 1] === e.sy).length, scrollYfinal: scrollY };
      });
    }
    await page.close();
  }
  // ---------- E4, E5 ----------
  {
    const page = await nav.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + "eventos-sinraw.html"); await dormir(300);
    out.E4_gbcr = await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => {
      const el = document.getElementById("z"); const N = 200000; const t = performance.now(); let s = 0;
      for (let i = 0; i < N; i++) s += el.getBoundingClientRect().left;
      res(((performance.now() - t) / N * 1000).toFixed(3) + " µs/llamada");
    })));
    out.E5 = await page.evaluate(() => { const gl = document.createElement("canvas").getContext("webgl2");
      const i = gl.getExtension("WEBGL_debug_renderer_info");
      return { MAX_FRAGMENT_UNIFORM_VECTORS: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS), MAX_VERTEX_UNIFORM_VECTORS: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), renderer: i ? gl.getParameter(i.UNMASKED_RENDERER_WEBGL) : null }; });
    await page.close();
  }
  // ---------- E6 ----------
  out.E6 = {};
  for (const modo of ["fijo", "abs"]) {
    const page = await nav.newPage(); await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1, hasTouch: true });
    await page.goto(D + "scrollgl.html?modo=" + modo); await dormir(500);
    const c = await page.target().createCDPSession();
    const marcos = [];
    c.on("Page.screencastFrame", (f) => { marcos.push({ data: f.data, sy: f.metadata.scrollOffsetY, t: f.metadata.timestamp }); c.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
    await c.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
    await dormir(300);
    const n0 = marcos.length;
    await c.send("Input.synthesizeScrollGesture", { x: 400, y: 400, yDistance: -2400, speed: 1500, gestureSourceType: "touch", preventFling: true });
    await dormir(300);
    await c.send("Page.stopScreencast");
    const durante = marcos.slice(n0);
    const difs = [];
    for (const m of durante) difs.push(await page.evaluate((b) => window.medir(b), m.data));
    const planas = difs.flat();
    const sys = durante.map((m) => m.sy);
    const pasos = sys.slice(1).map((y, i) => y - sys[i]).filter((d) => d > 0);
    out.E6[modo] = { marcos: durante.length, pasoScrollMediano: med(pasos), difMediana: med(planas), difMin: Math.min(...planas), difMax: Math.max(...planas),
      porMarco: difs.map((d) => d.join("/")).join(" ") };
    await page.close();
  }
} catch (e) { out.error = String(e.stack || e); } finally { await nav.close(); }
console.log(JSON.stringify(out, null, 1));
