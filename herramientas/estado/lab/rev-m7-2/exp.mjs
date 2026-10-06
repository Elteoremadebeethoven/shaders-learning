import puppeteer from "/home/user/shaders-learning/herramientas/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";
const D = "file://" + process.cwd() + "/";
const solo = process.argv[2] || "todo";
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/opt/pw-browsers/chromium", headless: "new",
  args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const out = {};
try {
  const ver = await browser.version(); out.version = ver;
  // ---------- E1: coalescencia de pointermove ----------
  if (solo === "todo" || solo === "e1") {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + "eventos.html"); await dormir(300);
    const c = await page.target().createCDPSession();
    await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 150 }); await dormir(300);
    const resumen = async (nombre) => {
      const r = await page.evaluate(() => { const r = { reg: window.reg, rafT: window.rafT }; window.reg = []; return r; });
      const pm = r.reg.filter((e) => e.tipo === "pointermove"), raw = r.reg.filter((e) => e.tipo === "pointerrawupdate"), mm = r.reg.filter((e) => e.tipo === "mousemove");
      const porFrame = {}; for (const e of pm) porFrame[e.frame] = (porFrame[e.frame] || 0) + 1;
      const rawPorFrame = {}; for (const e of raw) rawPorFrame[e.frame] = (rawPorFrame[e.frame] || 0) + 1;
      // distancia del último pointermove de cada frame al rAF siguiente
      const rafDe = Object.fromEntries(r.rafT.map(([f, now]) => [f, now]));
      const deltas = Object.keys(porFrame).map((f) => { const ult = pm.filter((e) => e.frame == f).pop(); const sig = rafDe[+f + 1]; return sig ? +(sig - ult.t).toFixed(2) : null; });
      const deltasRaw = raw.map((e) => { const sig = rafDe[e.frame + 1]; return sig ? +(sig - e.t).toFixed(2) : null; });
      out[nombre] = { pointermove: pm.length, sumaCoalescidos: pm.reduce((s, e) => s + e.n, 0), predichos: pm.map((e) => e.pred).slice(0, 5),
        porFrame, mousemove: mm.length, pointerrawupdate: raw.length, rawPorFrame, msAntesDelRaf_pm: deltas, msAntesDelRaf_raw_min_max: deltasRaw.length ? [Math.min(...deltasRaw), Math.max(...deltasRaw)] : null,
        secure: await page.evaluate(() => [window.secure, window.tieneRaw]) };
    };
    await page.evaluate(() => { window.reg = []; });
    // A) 60 movimientos de golpe, sin esperar a cada uno
    await Promise.all(Array.from({ length: 60 }, (_, i) => c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + i * 5, y: 200 + (i % 3) })));
    await dormir(400); await resumen("E1a_60_de_golpe");
    // B) 60 movimientos esperando cada envío
    for (let i = 0; i < 60; i++) await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 330 - i * 5, y: 250 + (i % 3) });
    await dormir(400); await resumen("E1b_60_uno_a_uno");
    // C) 60 movimientos de golpe con el hilo principal ocupado 50 ms
    await page.evaluate(() => { setTimeout(() => { const t = performance.now(); while (performance.now() - t < 50); }, 0); });
    await dormir(5);
    await Promise.all(Array.from({ length: 60 }, (_, i) => c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + i * 5, y: 300 + (i % 3) })));
    await dormir(400); await resumen("E1c_60_de_golpe_hilo_ocupado");
    // D) 20 movimientos cada 4 ms (como un ratón de 250 Hz)
    for (let i = 0; i < 40; i++) { c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 30 + i * 5, y: 320 + (i % 3) }); await dormir(4); }
    await dormir(400); await resumen("E1d_40_cada_4ms");
    // ---------- E2: rueda con el ratón quieto ----------
    await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 300, y: 300 }); await dormir(300);
    await page.evaluate(() => { window.reg = []; });
    for (let i = 0; i < 8; i++) { await c.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 300, y: 300, deltaX: 0, deltaY: 100 }); await dormir(80); }
    await dormir(600);
    const r2 = await page.evaluate(() => { const r = { reg: window.reg, rafT: window.rafT, sy: scrollY }; window.reg = []; return r; });
    const cuenta = {}; for (const e of r2.reg) cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1;
    const rafDe = Object.fromEntries(r2.rafT.map(([f, now]) => [f, now]));
    const sc = r2.reg.filter((e) => e.tipo === "scroll").map((e) => { const sig = rafDe[e.frame + 1]; return sig ? +(sig - e.t).toFixed(2) : null; });
    out.E2_rueda_raton_quieto = { cuenta, scrollYfinal: r2.sy, msScrollAntesDelRaf: sc, leave: r2.reg.filter((e) => /leave|out/.test(e.tipo)).map((e) => [e.tipo, e.sy]) };
    await page.close();
  }
  // ---------- E3: arrays de uniforms ----------
  if (solo === "todo" || solo === "e3") {
    const page = await browser.newPage(); const msgs = [];
    page.on("console", (m) => msgs.push(m.text()));
    await page.goto(D + "uniforms.html"); await dormir(300);
    out.E3 = await page.evaluate(() => window.res); out.E3_consola = msgs;
    await page.close();
  }
  // ---------- E4: varios dedos ----------
  if (solo === "todo" || solo === "e4") {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600, hasTouch: true });
    await page.goto(D + "eventos.html"); await dormir(300);
    const c = await page.target().createCDPSession();
    await c.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page.evaluate(() => { window.reg = []; });
    const P = (x, y, id) => ({ x, y, id });
    await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [P(100, 200, 0), P(300, 200, 1)] }); await dormir(50);
    for (let i = 1; i <= 3; i++) { await c.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [P(100 + i * 10, 200, 0), P(300, 200 + i * 10, 1)] }); await dormir(30); }
    await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [P(300, 230, 1)] }); await dormir(30);
    await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await dormir(200);
    await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [P(200, 300, 0)] }); await dormir(30);
    await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await dormir(200);
    const r = await page.evaluate(() => window.reg.filter((e) => /pointer(down|up|cancel)/.test(e.tipo)).map((e) => [e.tipo, e.id, e.prim]));
    out.E4_dedos = r; await page.close();
  }
  // ---------- E5: 7.2.4 con clics rápidos de ratón ----------
  if (solo === "todo" || solo === "e5") {
    for (const archivo of ["multitouch.html", "multitouch-arreglado.html"]) {
      const page = await browser.newPage(); await page.setViewport({ width: 600, height: 320 }); const errs = [];
      page.on("pageerror", (e) => errs.push(e.message));
      try { await page.goto(D + archivo); } catch (e) { continue; }
      await dormir(400);
      const estado = () => page.evaluate(() => ({ huecos: [...huecos], dedos: [...dedos.entries()].map(([id, d]) => [id, d.hueco, d.activo, +d.k.toFixed(2)]), info: document.getElementById('info').textContent }));
      const pasos = [];
      for (let i = 0; i < 6; i++) { await page.mouse.move(100 + i * 60, 150); await page.mouse.down(); await dormir(60); await page.mouse.up(); await dormir(120); pasos.push(await estado()); }
      await dormir(1500); pasos.push(await estado());
      await page.mouse.move(300, 200); await page.mouse.down(); await dormir(300); pasos.push(await estado()); await page.mouse.up();
      out["E5_" + archivo] = { pasos, errs }; await page.close();
    }
  }
  // ---------- E6: M7.Puntero al volver a entrar ----------
  if (solo === "todo" || solo === "e6") {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + "puntero.html"); await dormir(300);
    await page.mouse.move(200, 200); await dormir(300);
    await page.mouse.move(120, 200, { steps: 4 }); await page.mouse.move(50, 200); await dormir(400);
    await page.evaluate(() => { window.hist = []; });
    await page.mouse.move(480, 380); await dormir(250);
    out.E6_reentrada = await page.evaluate(() => window.hist.slice(0, 12));
    await page.close();
  }
  // ---------- E7-E11: varios ----------
  if (solo === "todo" || solo === "e7") {
    const page = await browser.newPage(); await page.setViewport({ width: 800, height: 600 });
    await page.goto(D + "varios.html"); await dormir(300);
    out.E8_pointerEvents = await page.evaluate(() => {
      const centro = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return document.elementFromPoint(r.left + 20, r.top + r.height / 2); };
      const nombre = (el) => el.tagName + (el.id ? "#" + el.id : "");
      return { texto1: nombre(centro("texto1")), texto2: nombre(centro("texto2")), boton: nombre(centro("b")) };
    });
    // gBCR con el layout limpio
    out.E7_gbcr = await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => { const el = document.getElementById("k1"); const N = 100000; const t = performance.now(); let s = 0; for (let i = 0; i < N; i++) s += el.getBoundingClientRect().left; res(((performance.now() - t) / N * 1000).toFixed(3) + " µs/llamada"); })));
    // foco y teclado
    await page.evaluate(() => document.getElementById("k1").scrollIntoView());
    const clic = async (id) => { const b = await page.$("#" + id); const bb = await b.boundingBox(); await page.mouse.click(bb.x + 20, bb.y + 20); };
    await clic("k1"); await page.keyboard.press("KeyA");
    const act1 = await page.evaluate(() => document.activeElement.tagName + "#" + document.activeElement.id);
    await clic("k2"); await page.keyboard.press("KeyB");
    const act2 = await page.evaluate(() => document.activeElement.tagName + "#" + document.activeElement.id);
    const p2 = await browser.newPage(); await p2.bringToFront(); await dormir(200);
    const tieneFoco = await page.evaluate(() => document.hasFocus());
    out.E9_teclado = { act1, act2, log: await page.evaluate(() => window.log), hasFocusTrasOtraPestaña: tieneFoco };
    await p2.close();
    // AX
    const c = await page.target().createCDPSession();
    const ax = await c.send("Accessibility.getFullAXTree");
    const nodos = ax.nodes.filter((n) => !n.ignored).map((n) => [n.role && n.role.value, n.name && n.name.value]).filter(([r]) => r && !/^(generic|StaticText|InlineTextBox|none|RootWebArea|paragraph)$/.test(r));
    const ignorados = ax.nodes.filter((n) => n.ignored && n.role && /canvas/i.test(JSON.stringify(n))).length;
    out.E11_ax = { nodos, ignorados };
    // movimiento reducido
    await page.evaluate(() => { window.mq = matchMedia("(prefers-reduced-motion: reduce)"); window.cambios = []; mq.addEventListener("change", () => cambios.push([mq.matches, performance.now()])); window.antes = mq.matches; });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]); await dormir(100);
    out.E10_reducido = await page.evaluate(() => ({ antes, despues: mq.matches, cambios }));
    await page.close();
  }
} catch (e) { out.error = String(e.stack || e); }
finally { await browser.close(); }
console.log(JSON.stringify(out, null, 1));
